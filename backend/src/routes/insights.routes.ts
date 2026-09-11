import { Router } from 'express';
import * as insightsController from '../controllers/insights.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/courses/:courseId/mastery-map', requireAuth, insightsController.getMasteryMap);
router.get('/learning-profile', requireAuth, insightsController.getLearningProfile);
router.get('/courses/:courseId/path-history', requireAuth, insightsController.getPathHistory);
router.get('/courses/:courseId/topics/:topicId/detail', requireAuth, insightsController.getTopicDetail);

export default router;
