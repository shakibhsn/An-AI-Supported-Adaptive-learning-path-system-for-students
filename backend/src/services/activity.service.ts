/**
 * Learning activity tracking (Sections 2-6).
 *
 * The frontend owns the actual clock: it starts a span, pauses/resumes it
 * around document.visibilitychange, and reports the real elapsed ACTIVE
 * seconds back here - this module never guesses a duration on its own. See
 * frontend/index.html's ActivityTracker for the client half.
 *
 * source: "in_app" spans have a trustworthy durationSeconds. "external"
 * spans (a YouTube/article link opened in a new tab) are logged as a single
 * discrete open event with durationSeconds fixed at 0 - Section 5 is
 * explicit that we must never claim to know how long a student watched
 * something outside the app.
 */

import { prisma } from '../prisma';

export type ActivityType = 'MATERIAL_VIEW' | 'READING' | 'PRACTICE' | 'QUIZ' | 'AI_INTERACTION';
export type ActivitySource = 'in_app' | 'external';

export interface StartActivityInput {
  userId: string;
  courseId: string;
  topicId?: string | null;
  materialId?: string | null;
  activityType: ActivityType;
  source?: ActivitySource;
}

export async function startActivity(input: StartActivityInput) {
  return prisma.learningActivity.create({
    data: {
      userId: input.userId,
      courseId: input.courseId,
      topicId: input.topicId || undefined,
      materialId: input.materialId || undefined,
      activityType: input.activityType,
      source: input.source ?? 'in_app',
    },
  });
}

/** Periodic in-progress update - overwrites durationSeconds with the client's current running total. Never touches endedAt. */
export async function heartbeatActivity(id: string, userId: string, durationSeconds: number) {
  const row = await prisma.learningActivity.findFirst({ where: { id, userId } });
  if (!row) return null;
  // Sanity cap: a single span heartbeat can't retroactively claim more than
  // 6 hours - guards against a stuck/runaway client clock.
  const capped = Math.max(0, Math.min(durationSeconds, 6 * 3600));
  return prisma.learningActivity.update({ where: { id }, data: { durationSeconds: capped } });
}

/** Final write when the activity ends (completed, navigated away, or page unload via sendBeacon). */
export async function endActivity(id: string, userId: string, durationSeconds: number) {
  const row = await prisma.learningActivity.findFirst({ where: { id, userId } });
  if (!row) return null;
  const capped = Math.max(0, Math.min(durationSeconds, 6 * 3600));
  return prisma.learningActivity.update({
    where: { id },
    data: { durationSeconds: capped, endedAt: new Date() },
  });
}

/** One-shot discrete event with no meaningful duration (external resource opened, an AI interaction occurred). */
export async function logInstant(input: StartActivityInput) {
  const now = new Date();
  return prisma.learningActivity.create({
    data: {
      userId: input.userId,
      courseId: input.courseId,
      topicId: input.topicId || undefined,
      materialId: input.materialId || undefined,
      activityType: input.activityType,
      source: input.source ?? 'external',
      startedAt: now,
      endedAt: now,
      durationSeconds: 0,
    },
  });
}

export interface ActivitySummaryRow {
  activityType: ActivityType;
  totalSeconds: number;
  count: number;
}

export interface ActivitySummary {
  byType: ActivitySummaryRow[];
  totalSeconds: number;
  inAppSeconds: number;
  externalOpens: number;
}

function since(range: 'today' | 'week' | 'all'): Date | undefined {
  if (range === 'all') return undefined;
  const d = new Date();
  if (range === 'today') {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  // week: last 7 days rolling, matches the "This Week" example in the spec.
  d.setDate(d.getDate() - 7);
  return d;
}

export async function getActivitySummary(
  userId: string,
  opts: { courseId?: string; topicId?: string; range?: 'today' | 'week' | 'all' } = {},
): Promise<ActivitySummary> {
  const createdAtGte = since(opts.range ?? 'all');
  const rows = await prisma.learningActivity.findMany({
    where: {
      userId,
      ...(opts.courseId ? { courseId: opts.courseId } : {}),
      ...(opts.topicId ? { topicId: opts.topicId } : {}),
      ...(createdAtGte ? { createdAt: { gte: createdAtGte } } : {}),
    },
    select: { activityType: true, durationSeconds: true, source: true },
  });

  const byType = new Map<string, { totalSeconds: number; count: number }>();
  let totalSeconds = 0;
  let inAppSeconds = 0;
  let externalOpens = 0;

  for (const r of rows) {
    const entry = byType.get(r.activityType) ?? { totalSeconds: 0, count: 0 };
    entry.totalSeconds += r.durationSeconds;
    entry.count += 1;
    byType.set(r.activityType, entry);
    totalSeconds += r.durationSeconds;
    if (r.source === 'in_app') inAppSeconds += r.durationSeconds;
    if (r.source === 'external') externalOpens += 1;
  }

  return {
    byType: [...byType.entries()].map(([activityType, v]) => ({ activityType: activityType as ActivityType, ...v })),
    totalSeconds,
    inAppSeconds,
    externalOpens,
  };
}
