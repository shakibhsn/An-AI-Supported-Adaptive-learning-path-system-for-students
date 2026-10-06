import { Router } from 'express';
import * as practiceController from '../controllers/practice.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/courses/:courseId/practice', requireAuth, asyncHandler(practiceController.getPractice));
router.get('/topics/:topicId/practice/next', requireAuth, asyncHandler(practiceController.getAdaptivePractice));
router.post('/practice/submit', requireAuth, asyncHandler(practiceController.submitPractice));

export default router;
