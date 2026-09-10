import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { regeneratePath } from '../services/learningPath.service';

export async function generatePath(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { courseId } = req.body as { courseId: string };
  if (!courseId) return res.status(400).json({ error: 'courseId is required.' });

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const result = await regeneratePath(req.user.userId, courseId);
  if (result.status === 'no_mastery') {
    return res.status(400).json({ error: 'No diagnostic results found. Take the diagnostic quiz first.' });
  }
  if (result.status === 'all_mastered') {
    return res.json({ message: 'All diagnosed topics are already Mastered - no adaptive path needed.', items: [] });
  }
  return res.json(result.path);
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
