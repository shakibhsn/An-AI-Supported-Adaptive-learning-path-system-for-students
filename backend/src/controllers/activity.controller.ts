import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import * as activity from '../services/activity.service';

const VALID_TYPES = new Set(['MATERIAL_VIEW', 'READING', 'PRACTICE', 'QUIZ', 'AI_INTERACTION']);

// POST /api/activity/start
export async function start(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { courseId, topicId, materialId, activityType, source } = req.body as {
    courseId?: string; topicId?: string; materialId?: string; activityType?: string; source?: string;
  };
  if (!courseId || !activityType || !VALID_TYPES.has(activityType)) {
    return res.status(400).json({ error: 'courseId and a valid activityType are required.' });
  }
  const row = await activity.startActivity({
    userId: req.user.userId,
    courseId,
    topicId,
    materialId,
    activityType: activityType as activity.ActivityType,
    source: source === 'external' ? 'external' : 'in_app',
  });
  return res.status(201).json({ id: row.id, startedAt: row.startedAt });
}

// POST /api/activity/:id/heartbeat  { durationSeconds }
export async function heartbeat(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const durationSeconds = Number(req.body?.durationSeconds);
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
    return res.status(400).json({ error: 'durationSeconds must be a non-negative number.' });
  }
  const row = await activity.heartbeatActivity(req.params.id, req.user.userId, durationSeconds);
  if (!row) return res.status(404).json({ error: 'Activity not found.' });
  return res.json({ id: row.id, durationSeconds: row.durationSeconds });
}

// POST /api/activity/:id/end  { durationSeconds }
export async function end(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const durationSeconds = Number(req.body?.durationSeconds);
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
    return res.status(400).json({ error: 'durationSeconds must be a non-negative number.' });
  }
  const row = await activity.endActivity(req.params.id, req.user.userId, durationSeconds);
  if (!row) return res.status(404).json({ error: 'Activity not found.' });
  return res.json({ id: row.id, durationSeconds: row.durationSeconds, endedAt: row.endedAt });
}

// POST /api/activity/instant  - one-shot event, no timer (external resource opened, AI interaction)
export async function instant(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { courseId, topicId, materialId, activityType, source } = req.body as {
    courseId?: string; topicId?: string; materialId?: string; activityType?: string; source?: string;
  };
  if (!courseId || !activityType || !VALID_TYPES.has(activityType)) {
    return res.status(400).json({ error: 'courseId and a valid activityType are required.' });
  }
  const row = await activity.logInstant({
    userId: req.user.userId,
    courseId,
    topicId,
    materialId,
    activityType: activityType as activity.ActivityType,
    source: source === 'in_app' ? 'in_app' : 'external',
  });
  return res.status(201).json({ id: row.id });
}

// GET /api/activity/summary?courseId=&topicId=&range=today|week|all
export async function summary(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const range = (['today', 'week', 'all'] as const).includes(req.query.range as never)
    ? (req.query.range as 'today' | 'week' | 'all')
    : 'all';
  const result = await activity.getActivitySummary(req.user.userId, {
    courseId: typeof req.query.courseId === 'string' ? req.query.courseId : undefined,
    topicId: typeof req.query.topicId === 'string' ? req.query.topicId : undefined,
    range,
  });
  return res.json(result);
}
