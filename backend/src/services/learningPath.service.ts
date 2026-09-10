/**
 * Learning-path (re)generation.
 *
 * Extracted so the diagnostic, practice, and follow-up flows can all
 * regenerate a student's path from their current TopicMastery whenever
 * their mastery changes (Section 21). The deterministic sequencing lives
 * in adaptiveEngine.service.ts - this just wires it to the database.
 */

import { prisma } from '../prisma';
import { rankWeakTopics, TopicScore } from './mastery.service';
import { generateLearningPath, TopicMasterySnapshot } from './adaptiveEngine.service';
import { CourseCode } from '../data/topicMapping';

export type RegenerateResult =
  | { status: 'ok'; path: Awaited<ReturnType<typeof loadActivePath>> }
  | { status: 'no_mastery' }
  | { status: 'all_mastered' };

async function loadActivePath(userId: string, courseId: string) {
  return prisma.learningPath.findFirst({
    where: { userId, courseId, status: 'active' },
    include: { items: { include: { topic: true }, orderBy: { sequenceOrder: 'asc' } } },
  });
}

export async function regeneratePath(userId: string, courseId: string): Promise<RegenerateResult> {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return { status: 'no_mastery' };

  const masteryRows = await prisma.topicMastery.findMany({
    where: { userId, courseId },
    include: { topic: true },
  });
  if (masteryRows.length === 0) return { status: 'no_mastery' };

  const allMastery: TopicMasterySnapshot[] = masteryRows.map((m) => ({
    topic: m.topic.name,
    score: m.masteryPercentage,
    status: m.status as TopicScore['status'],
  }));

  const shaped: Record<string, TopicScore> = Object.fromEntries(
    allMastery.map((m) => [m.topic, { topic: m.topic, correct: 0, total: 0, score: m.score, status: m.status }]),
  );
  const weakTopics = rankWeakTopics(shaped);

  // Supersede whatever path is active now, regardless of outcome.
  await prisma.learningPath.updateMany({
    where: { userId, courseId, status: 'active' },
    data: { status: 'superseded' },
  });

  if (weakTopics.length === 0) return { status: 'all_mastered' };

  const pathItems = generateLearningPath(course.code as CourseCode, weakTopics, allMastery);
  const topicByName = new Map(masteryRows.map((m) => [m.topic.name, m.topic]));

  await prisma.learningPath.create({
    data: {
      userId,
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
  });

  return { status: 'ok', path: await loadActivePath(userId, courseId) };
}
