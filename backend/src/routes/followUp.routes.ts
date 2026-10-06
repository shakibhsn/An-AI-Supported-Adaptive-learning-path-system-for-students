import { Router } from 'express';
import * as followUpController from '../controllers/followUp.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/courses/:courseId/follow-up', requireAuth, asyncHandler(followUpController.getFollowUp));
router.post('/follow-up/submit', requireAuth, asyncHandler(followUpController.submitFollowUp));

export default router;
