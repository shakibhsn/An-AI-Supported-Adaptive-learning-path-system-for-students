import { Router } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { requireAuth } from '../middleware/auth.middleware';
import { rankWeakTopics, TopicScore } from '../services/mastery.service';
import * as learningPathController from '../controllers/learningPath.controller';
import { Response } from 'express';

const router = Router();

// GET /api/courses/:courseId/gaps - Learning Gap Analysis screen data
router.get('/courses/:courseId/gaps', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const mastery = await prisma.topicMastery.findMany({
    where: { userId: req.user.userId, courseId: req.params.courseId },
    include: { topic: true },
  });
  if (mastery.length === 0) {
    return res.status(400).json({ error: 'No diagnostic results found. Take the diagnostic quiz first.' });
  }
  const shaped: Record<string, TopicScore> = Object.fromEntries(
    mastery.map((m) => [m.topic.name, { topic: m.topic.name, correct: 0, total: 0, score: m.masteryPercentage, status: m.status as TopicScore['status'] }])
  );
  const ranked = rankWeakTopics(shaped);
  return res.json({ ranked, all: Object.values(shaped).sort((a, b) => a.score - b.score) });
});

router.post('/learning-path/generate', requireAuth, learningPathController.generatePath);
router.get('/learning-path/:courseId', requireAuth, learningPathController.getPath);

export default router;
