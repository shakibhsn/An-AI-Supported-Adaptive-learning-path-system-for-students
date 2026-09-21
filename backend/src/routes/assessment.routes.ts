import { Router } from 'express';
import * as assessmentController from '../controllers/assessment.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/topics/:topicId/assessment/state', requireAuth, assessmentController.getAssessmentState);
router.post('/topics/:topicId/assessment/start', requireAuth, assessmentController.startAssessment);
router.post('/assessment-attempts/:attemptId/submit', requireAuth, assessmentController.submitAssessment);

export default router;
