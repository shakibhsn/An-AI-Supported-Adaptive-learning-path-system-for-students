import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { getActivitySummary } from '../services/activity.service';
import { reasonForWeakTopic, reasonForRevisionTopic } from '../services/recommendation.service';
import { MasteryStatus } from '../services/mastery.service';
import { PREREQUISITES, CourseCode } from '../data/topicMapping';

// GET /api/profile/summary
// Every number here is a real aggregate over the student's own rows - no
// hardcoded/simulated values (Student Profile spec Section 2). Reuses the
// exact same tables/definitions the rest of the app already uses (e.g.
// "topics mastered" = TopicMastery.status === 'Mastered', identical to the
// Mastery Map's definition - Section 14 "data consistency").
export async function getProfileSummary(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const userId = req.user.userId;

  const [masteryRows, activity, assessmentsCompleted, practiceCompleted, coursesTouched] = await Promise.all([
    prisma.topicMastery.findMany({ where: { userId } }),
    getActivitySummary(userId, { range: 'all' }),
    prisma.assessmentAttempt.count({ where: { userId, status: 'completed' } }),
    prisma.practiceAttempt.count({ where: { userId } }),
    prisma.$transaction([
      prisma.diagnosticAttempt.findMany({ where: { userId }, select: { courseId: true }, distinct: ['courseId'] }),
      prisma.topicMastery.findMany({ where: { userId }, select: { courseId: true }, distinct: ['courseId'] }),
      prisma.learningActivity.findMany({ where: { userId }, select: { courseId: true }, distinct: ['courseId'] }),
    ]),
  ]);

  const overallProgress = masteryRows.length > 0
    ? Math.round((masteryRows.reduce((sum, m) => sum + m.masteryPercentage, 0) / masteryRows.length) * 10) / 10
    : null;

  const coursesStudied = new Set(coursesTouched.flat().map((c) => c.courseId)).size;
  const topicsMastered = masteryRows.filter((m) => m.status === 'Mastered').length;

  return res.json({
    overallProgress, // null if no mastery data yet - never fabricated
    learningTimeSeconds: activity.totalSeconds,
    coursesStudied,
    topicsStudied: masteryRows.length,
    topicsMastered,
    assessmentsCompleted,
    practiceCompleted,
    activityByType: activity.byType, // [{ activityType, totalSeconds, count }] - feeds the Learning Time Summary breakdown
  });
}

// GET /api/profile/activity?limit=15
// Merges every kind of real, timestamped "completed" record the app
// already stores into one chronological feed (Sections 7-8). Nothing here
// is synthesized - each entry is read straight from its own table.
export async function getActivityFeed(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const userId = req.user.userId;
  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '15'), 10) || 15, 1), 100);

  const [materials, assessments, practices, followUps, diagnostics, longMaterialViews] = await Promise.all([
    prisma.materialCompletion.findMany({ where: { userId }, include: { material: true }, orderBy: { completedAt: 'desc' }, take: limit }),
    prisma.assessmentAttempt.findMany({ where: { userId, status: 'completed' }, include: { topic: true }, orderBy: { completedAt: 'desc' }, take: limit }),
    prisma.practiceAttempt.findMany({ where: { userId }, include: { topic: true }, orderBy: { completedAt: 'desc' }, take: limit }),
    prisma.followUpAttempt.findMany({ where: { userId }, include: { topic: true }, orderBy: { completedAt: 'desc' }, take: limit }),
    prisma.diagnosticAttempt.findMany({ where: { userId }, include: { course: true }, orderBy: { completedAt: 'desc' }, take: limit }),
    // Only real, meaningfully-long, actually-finished in-app viewing spans -
    // never a claim about exact external YouTube watch time (Section 6).
    prisma.learningActivity.findMany({
      where: { userId, activityType: 'MATERIAL_VIEW', source: 'in_app', endedAt: { not: null }, durationSeconds: { gte: 60 } },
      include: { topic: true, material: true },
      orderBy: { endedAt: 'desc' },
      take: limit,
    }),
  ]);

  type FeedItem = { type: string; label: string; subLabel: string | null; timestamp: string; meta: Record<string, unknown> };
  const items: FeedItem[] = [];

  for (const m of materials) {
    items.push({ type: 'MATERIAL_COMPLETED', label: `Completed: ${m.material.title}`, subLabel: m.material.type, timestamp: m.completedAt.toISOString(), meta: { materialId: m.materialId } });
  }
  for (const a of assessments) {
    items.push({
      type: 'ASSESSMENT',
      label: `${a.difficulty.charAt(0)}${a.difficulty.slice(1).toLowerCase()} Assessment — ${a.topic.name}`,
      subLabel: `Score: ${a.percentage}%`,
      timestamp: (a.completedAt as Date).toISOString(),
      meta: { topic: a.topic.name, difficulty: a.difficulty, percentage: a.percentage },
    });
  }
  for (const p of practices) {
    items.push({
      type: 'PRACTICE',
      label: `Practice Completed — ${p.topic.name}`,
      subLabel: `${p.score}/${p.totalQuestions} correct`,
      timestamp: p.completedAt.toISOString(),
      meta: { topic: p.topic.name, score: p.score, total: p.totalQuestions },
    });
  }
  for (const f of followUps) {
    items.push({
      type: 'FOLLOW_UP',
      label: `Follow-up Assessment — ${f.topic.name}`,
      subLabel: `Score: ${f.newMastery}%`,
      timestamp: f.completedAt.toISOString(),
      meta: { topic: f.topic.name, score: f.newMastery },
    });
  }
  for (const d of diagnostics) {
    items.push({
      type: 'DIAGNOSTIC',
      label: `Diagnostic Assessment — ${d.course.name}`,
      subLabel: `${d.score}/${d.totalQuestions} correct`,
      timestamp: d.completedAt.toISOString(),
      meta: { course: d.course.code, score: d.score, total: d.totalQuestions },
    });
  }
  for (const v of longMaterialViews) {
    const minutes = Math.round(v.durationSeconds / 60);
    items.push({
      type: 'MATERIAL_VIEW',
      label: `Playlist/Video Learning${v.topic ? ` — ${v.topic.name}` : ''}`,
      subLabel: `${minutes} minute${minutes === 1 ? '' : 's'} tracked`,
      timestamp: (v.endedAt as Date).toISOString(),
      meta: { topic: v.topic?.name ?? null, minutes },
    });
  }

  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return res.json({ items: items.slice(0, limit), hasMore: items.length > limit });
}

// GET /api/profile/focus
// "Current Learning Focus" (Section 5): the next pending topic in each
// course's ACTUAL active adaptive learning path, with the same real,
// data-derived reason string the Mastery Map already computes - never an
// invented explanation.
export async function getCurrentFocus(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const userId = req.user.userId;

  const courses = await prisma.course.findMany();
  const focuses = [];

  for (const course of courses) {
    const path = await prisma.learningPath.findFirst({
      where: { userId, courseId: course.id, status: 'active' },
      include: { items: { include: { topic: true }, orderBy: { sequenceOrder: 'asc' } } },
    });
    if (!path) continue;
    const nextItem = path.items.find((i) => i.status !== 'completed');
    if (!nextItem) continue;

    const mastery = await prisma.topicMastery.findUnique({ where: { userId_topicId: { userId, topicId: nextItem.topicId } } });
    const prereqMap = PREREQUISITES[course.code as CourseCode] || {};
    const unlocks = new Map<string, string>();
    for (const [topic, prereq] of Object.entries(prereqMap)) if (prereq) unlocks.set(prereq, topic);

    const status = mastery?.status as MasteryStatus | undefined;
    const reason = mastery && status && status !== 'Mastered'
      ? reasonForWeakTopic(nextItem.topic.name, mastery.masteryPercentage, status, unlocks.get(nextItem.topic.name))
      : mastery && status === 'Mastered' && unlocks.get(nextItem.topic.name)
        ? reasonForRevisionTopic(nextItem.topic.name, mastery.masteryPercentage, unlocks.get(nextItem.topic.name)!)
        : `${nextItem.topic.name} is next in your adaptive learning path for ${course.code} - no assessment data yet for this topic.`;

    focuses.push({
      courseCode: course.code,
      courseName: course.name,
      topic: nextItem.topic.name,
      topicId: nextItem.topicId,
      isRevision: nextItem.isRevision,
      currentMastery: mastery?.masteryPercentage ?? null,
      reason,
    });
  }

  return res.json({ focuses });
}

// GET /api/profile/assessment-improvement
// Section 9: real before/after using the student's ACTUAL AssessmentAttempt
// history per topic (earliest completed vs. most recent completed). A topic
// with only one completed attempt honestly reports "no previous assessment"
// rather than fabricating an improvement number.
export async function getAssessmentImprovement(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const userId = req.user.userId;

  const attempts = await prisma.assessmentAttempt.findMany({
    where: { userId, status: 'completed' },
    include: { topic: true },
    orderBy: { completedAt: 'asc' },
  });

  const byTopic = new Map<string, typeof attempts>();
  for (const a of attempts) {
    const list = byTopic.get(a.topicId) ?? [];
    list.push(a);
    byTopic.set(a.topicId, list);
  }

  const results = [...byTopic.values()].map((list) => {
    const first = list[0];
    const latest = list[list.length - 1];
    const hasPrevious = list.length >= 2;
    return {
      topic: first.topic.name,
      topicId: first.topicId,
      initialPercentage: hasPrevious ? first.percentage : null,
      latestPercentage: latest.percentage,
      improvement: hasPrevious ? Math.round(((latest.percentage ?? 0) - (first.percentage ?? 0)) * 10) / 10 : null,
      hasPrevious,
      attemptCount: list.length,
    };
  });

  return res.json({ results });
}
