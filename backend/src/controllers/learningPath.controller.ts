import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { rankWeakTopics, TopicScore } from '../services/mastery.service';
import { generateLearningPath, TopicMasterySnapshot } from '../services/adaptiveEngine.service';
import { CourseCode } from '../data/topicMapping';

export async function generatePath(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { courseId } = req.body as { courseId: string };

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const masteryRows = await prisma.topicMastery.findMany({
    where: { userId: req.user.userId, courseId },
    include: { topic: true },
  });
  if (masteryRows.length === 0) {
    return res.status(400).json({ error: 'No diagnostic results found. Take the diagnostic quiz first.' });
  }

  const allMastery: TopicMasterySnapshot[] = masteryRows.map((m) => ({
    topic: m.topic.name,
    score: m.masteryPercentage,
    status: m.status as TopicScore['status'],
  }));

  // Build a fake topicScores-shaped record just to reuse rankWeakTopics'
  // filtering/sorting - correct/total aren't used by that function beyond
  // being present on the type, so 0/0 placeholders are fine here.
  const topicScoresShaped: Record<string, TopicScore> = Object.fromEntries(
    allMastery.map((m) => [m.topic, { topic: m.topic, correct: 0, total: 0, score: m.score, status: m.status }])
  );
  const weakTopics = rankWeakTopics(topicScoresShaped);

  if (weakTopics.length === 0) {
    return res.json({ message: 'All diagnosed topics are already Mastered - no adaptive path needed.', items: [] });
  }

  const pathItems = generateLearningPath(course.code as CourseCode, weakTopics, allMastery);

  // Supersede any existing active path for this user+course before creating the new one.
  await prisma.learningPath.updateMany({
    where: { userId: req.user.userId, courseId, status: 'active' },
    data: { status: 'superseded' },
  });

  const topicByName = new Map(masteryRows.map((m) => [m.topic.name, m.topic]));
  const newPath = await prisma.learningPath.create({
    data: {
      userId: req.user.userId,
      courseId,
      status: 'active',
      items: {
        create: pathItems
          .filter((item) => topicByName.has(item.topic))
          .map((item) => ({
            topicId: topicByName.get(item.topic)!.id,
            sequenceOrder: item.sequenceOrder,
            isRevision: item.isRevision,
            estimatedMinutes: item.estimatedMinutes,
          })),
      },
    },
    include: { items: { include: { topic: true }, orderBy: { sequenceOrder: 'asc' } } },
  });

  return res.json(newPath);
}

export async function getPath(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const path = await prisma.learningPath.findFirst({
    where: { userId: req.user.userId, courseId: req.params.courseId, status: 'active' },
    include: { items: { include: { topic: true }, orderBy: { sequenceOrder: 'asc' } } },
  });
  if (!path) return res.status(404).json({ error: 'No active learning path. Generate one first.' });
  return res.json(path);
}
