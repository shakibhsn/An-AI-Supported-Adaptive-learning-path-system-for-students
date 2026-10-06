import { Router } from 'express';
import * as insightsController from '../controllers/insights.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/courses/:courseId/mastery-map', requireAuth, asyncHandler(insightsController.getMasteryMap));
router.get('/learning-profile', requireAuth, asyncHandler(insightsController.getLearningProfile));
router.get('/courses/:courseId/path-history', requireAuth, asyncHandler(insightsController.getPathHistory));
router.get('/courses/:courseId/topics/:topicId/detail', requireAuth, asyncHandler(insightsController.getTopicDetail));

export default router;
