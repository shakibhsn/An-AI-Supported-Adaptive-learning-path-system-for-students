import { Router } from 'express';
import * as profileController from '../controllers/profile.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/summary', requireAuth, asyncHandler(profileController.getProfileSummary));
router.get('/activity', requireAuth, asyncHandler(profileController.getActivityFeed));
router.get('/focus', requireAuth, asyncHandler(profileController.getCurrentFocus));
router.get('/assessment-improvement', requireAuth, asyncHandler(profileController.getAssessmentImprovement));
router.get('/insights', requireAuth, asyncHandler(profileController.getLearningInsights));

export default router;
