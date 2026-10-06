import { Router } from 'express';
import * as assessmentController from '../controllers/assessment.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/topics/:topicId/assessment/state', requireAuth, asyncHandler(assessmentController.getAssessmentState));
router.post('/topics/:topicId/assessment/start', requireAuth, asyncHandler(assessmentController.startAssessment));
router.post('/assessment-attempts/:attemptId/submit', requireAuth, asyncHandler(assessmentController.submitAssessment));

export default router;
