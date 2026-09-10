import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export async function getOverallProgress(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const courses = await prisma.course.findMany();
  const results = [];
  for (const course of courses) {
    const mastery = await prisma.topicMastery.findMany({
      where: { userId: req.user.userId, courseId: course.id },
    });
    const avg = mastery.length > 0
      ? Math.round((mastery.reduce((sum, m) => sum + m.masteryPercentage, 0) / mastery.length) * 10) / 10
      : null;
    results.push({ courseId: course.id, courseCode: course.code, courseName: course.name, averageMastery: avg, topicsAssessed: mastery.length });
  }
  return res.json(results);
}

export async function getCourseProgress(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const mastery = await prisma.topicMastery.findMany({
    where: { userId: req.user.userId, courseId: req.params.courseId },
    include: { topic: true },
  });

  const progress = mastery.map((m) => ({
    topic: m.topic.name,
    currentMastery: m.masteryPercentage,
    previousMastery: m.previousPercentage,
    status: m.status,
    attempts: m.attempts,
    improvement: m.previousPercentage !== null
      ? Math.round((m.masteryPercentage - m.previousPercentage) * 10) / 10
      : null,
  }));

  return res.json({ courseId: req.params.courseId, progress });
}
