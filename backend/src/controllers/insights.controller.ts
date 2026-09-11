import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { classifyStatus, MASTERY_THRESHOLDS, MasteryStatus } from '../services/mastery.service';
import { reasonForWeakTopic, reasonForRevisionTopic, comparePaths } from '../services/recommendation.service';
import { getActivitySummary } from '../services/activity.service';
import { PREREQUISITES, CourseCode } from '../data/topicMapping';

const STATUS_EMOJI: Record<MasteryStatus | 'Not Started', string> = {
  Mastered: '\u{1F7E2}', // 🟢
  Developing: '\u{1F7E1}', // 🟡
  'Needs Improvement': '\u{1F7E0}', // 🟠
  'Weak/Critical': '\u{1F534}', // 🔴
  'Not Started': '⚪', // ⚪
};

// GET /api/courses/:courseId/mastery-map  (Section 17)
export async function getMasteryMap(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const topics = await prisma.topic.findMany({ where: { courseId: course.id } });
  const masteryRows = await prisma.topicMastery.findMany({ where: { userId: req.user.userId, courseId: course.id } });
  const masteryByTopicId = new Map(masteryRows.map((m) => [m.topicId, m]));

  // Reverse-prerequisite lookup: "X is a prerequisite for Y" (for the reason string).
  const prereqMap = PREREQUISITES[course.code as CourseCode] || {};
  const unlocks = new Map<string, string>();
  for (const [topic, prereq] of Object.entries(prereqMap)) {
    if (prereq) unlocks.set(prereq, topic);
  }

  const map = topics.map((t) => {
    const m = masteryByTopicId.get(t.id);
    const status: MasteryStatus | 'Not Started' = m ? (m.status as MasteryStatus) : 'Not Started';
    const score = m?.masteryPercentage ?? null;
    const reason = m && status !== 'Mastered' && status !== 'Not Started'
      ? reasonForWeakTopic(t.name, score!, status as MasteryStatus, unlocks.get(t.name))
      : m && status === 'Mastered' && unlocks.get(t.name)
        ? reasonForRevisionTopic(t.name, score!, unlocks.get(t.name)!)
        : null;
    return {
      topicId: t.id,
      topic: t.name,
      status,
      emoji: STATUS_EMOJI[status],
      score,
      prerequisiteTopicId: t.prerequisiteTopicId,
      reason,
    };
  });

  return res.json({ courseId: course.id, courseCode: course.code, thresholds: MASTERY_THRESHOLDS, topics: map });
}

// GET /api/learning-profile?courseId=  (Section 18)
export async function getLearningProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const courseId = typeof req.query.courseId === 'string' ? req.query.courseId : undefined;

  const masteryRows = await prisma.topicMastery.findMany({
    where: { userId: req.user.userId, ...(courseId ? { courseId } : {}) },
    include: { topic: true },
  });

  const strong = masteryRows.filter((m) => m.status === 'Mastered').map((m) => m.topic.name);
  const developing = masteryRows.filter((m) => m.status === 'Developing').map((m) => m.topic.name);
  const needsImprovement = masteryRows
    .filter((m) => m.status === 'Needs Improvement' || m.status === 'Weak/Critical')
    .map((m) => m.topic.name);

  const [today, week, overall] = await Promise.all([
    getActivitySummary(req.user.userId, { courseId, range: 'today' }),
    getActivitySummary(req.user.userId, { courseId, range: 'week' }),
    getActivitySummary(req.user.userId, { courseId, range: 'all' }),
  ]);

  const attempts = await prisma.practiceQuestionAttempt.findMany({
    where: { userId: req.user.userId, ...(courseId ? { topic: { courseId } } : {}) },
    select: { isCorrect: true },
  });
  const practiceAccuracy = attempts.length > 0
    ? Math.round((attempts.filter((a) => a.isCorrect).length / attempts.length) * 1000) / 10
    : null;

  // Preferred resource type: only declared from REPEATED behavior (>= 3
  // completions of one type, clearly ahead of the next type) - never from a
  // single click (Section 18's explicit constraint).
  const completions = await prisma.materialCompletion.findMany({
    where: { userId: req.user.userId, ...(courseId ? { material: { courseId } } : {}) },
    include: { material: { select: { type: true } } },
  });
  const typeCounts = new Map<string, number>();
  for (const c of completions) typeCounts.set(c.material.type, (typeCounts.get(c.material.type) ?? 0) + 1);
  const sortedTypes = [...typeCounts.entries()].sort((a, b) => b[1] - a[1]);
  let preferredResourceType: string | null = null;
  if (sortedTypes.length > 0 && sortedTypes[0][1] >= 3 && (sortedTypes[0][1] > (sortedTypes[1]?.[1] ?? 0))) {
    preferredResourceType = sortedTypes[0][0];
  }

  return res.json({
    strongTopics: strong,
    developingTopics: developing,
    needsImprovementTopics: needsImprovement,
    activity: {
      todaySeconds: today.totalSeconds,
      weekSeconds: week.totalSeconds,
      overallSeconds: overall.totalSeconds,
    },
    practiceAccuracy,
    preferredResourceType,
    preferredResourceBasis: preferredResourceType
      ? `Based on ${sortedTypes[0][1]} completed ${sortedTypes[0][0].toLowerCase()} resources`
      : 'Not enough repeated activity yet to detect a preference - complete a few more materials of one type.',
  });
}

// GET /api/courses/:courseId/path-history  (Section 16)
export async function getPathHistory(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { courseId } = req.params;

  const [current, previous, masteryRows] = await Promise.all([
    prisma.learningPath.findFirst({
      where: { userId: req.user.userId, courseId, status: 'active' },
      include: { items: { include: { topic: true }, orderBy: { sequenceOrder: 'asc' } } },
    }),
    prisma.learningPath.findFirst({
      where: { userId: req.user.userId, courseId, status: 'superseded' },
      orderBy: { updatedAt: 'desc' },
      include: { items: { include: { topic: true }, orderBy: { sequenceOrder: 'asc' } } },
    }),
    prisma.topicMastery.findMany({ where: { userId: req.user.userId, courseId, status: 'Mastered' } }),
  ]);

  if (!current && !previous) {
    return res.status(404).json({ error: 'No learning path history yet. Generate a path first.' });
  }

  const masteredTopicIds = new Set(masteryRows.map((m) => m.topicId));
  const previousNames = (previous?.items ?? []).map((i) => i.topic.name);
  const currentNames = (current?.items ?? []).map((i) => i.topic.name);
  const masteredNames = new Set(
    (previous?.items ?? []).filter((i) => masteredTopicIds.has(i.topicId)).map((i) => i.topic.name),
  );

  const comparison = comparePaths(previousNames, currentNames, masteredNames);
  const changed = previous ? JSON.stringify(previousNames) !== JSON.stringify(currentNames) : false;

  return res.json({
    hasPrevious: !!previous,
    current: current?.items.map((i) => ({ topic: i.topic.name, sequenceOrder: i.sequenceOrder, isRevision: i.isRevision, status: i.status })) ?? [],
    previous: previous?.items.map((i) => ({ topic: i.topic.name, sequenceOrder: i.sequenceOrder })) ?? [],
    comparison,
    changed,
    message: changed ? 'Your learning path was updated based on your latest performance.' : null,
  });
}

// GET /api/courses/:courseId/topics/:topicId/detail  (Section 2 + 7 - activity + performance combined)
export async function getTopicDetail(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { courseId, topicId } = req.params;
  const userId = req.user.userId;

  const topic = await prisma.topic.findFirst({ where: { id: topicId, courseId } });
  if (!topic) return res.status(404).json({ error: 'Topic not found' });

  const [activity, mastery, practiceAttempts, followUps, earliestDiagAnswers] = await Promise.all([
    getActivitySummary(userId, { courseId, topicId }),
    prisma.topicMastery.findUnique({ where: { userId_topicId: { userId, topicId } } }),
    prisma.practiceQuestionAttempt.findMany({ where: { userId, topicId }, select: { isCorrect: true } }),
    prisma.followUpAttempt.findMany({ where: { userId, topicId }, orderBy: { completedAt: 'asc' } }),
    prisma.diagnosticAnswer.findMany({
      where: { topicId, attempt: { userId, courseId } },
      include: { attempt: true },
      orderBy: { attempt: { completedAt: 'asc' } },
    }),
  ]);

  // Initial diagnostic score for this topic = score from the student's EARLIEST diagnostic attempt that touched this topic.
  let initialDiagnostic: number | null = null;
  if (earliestDiagAnswers.length > 0) {
    const earliestAttemptId = earliestDiagAnswers[0].attemptId;
    const fromEarliest = earliestDiagAnswers.filter((a) => a.attemptId === earliestAttemptId);
    initialDiagnostic = Math.round((fromEarliest.filter((a) => a.isCorrect).length / fromEarliest.length) * 1000) / 10;
  }

  const practiceAccuracy = practiceAttempts.length > 0
    ? Math.round((practiceAttempts.filter((a) => a.isCorrect).length / practiceAttempts.length) * 1000) / 10
    : null;

  const latestFollowUp = followUps[followUps.length - 1] ?? null;
  const currentMastery = mastery?.masteryPercentage ?? null;
  const improvement = initialDiagnostic !== null && currentMastery !== null
    ? Math.round((currentMastery - initialDiagnostic) * 10) / 10
    : null;

  const byTypeMinutes = Object.fromEntries(activity.byType.map((t) => [t.activityType, Math.round(t.totalSeconds / 60)]));

  return res.json({
    topic: topic.name,
    topicId: topic.id,
    status: mastery?.status ?? 'Not Started',
    currentMastery,
    initialDiagnostic,
    practiceAccuracy,
    latestFollowUp: latestFollowUp ? { score: latestFollowUp.newMastery, previous: latestFollowUp.previousMastery, completedAt: latestFollowUp.completedAt } : null,
    improvement,
    activity: {
      byTypeMinutes, // { MATERIAL_VIEW: 24, PRACTICE: 31, QUIZ: 8, ... }
      totalMinutes: Math.round(activity.totalSeconds / 60),
      inAppMinutes: Math.round(activity.inAppSeconds / 60),
      externalResourceOpens: activity.externalOpens,
    },
  });
}
