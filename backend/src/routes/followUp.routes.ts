import { Router } from 'express';
import * as followUpController from '../controllers/followUp.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/courses/:courseId/follow-up', requireAuth, followUpController.getFollowUp);
router.post('/follow-up/submit', requireAuth, followUpController.submitFollowUp);

export default router;
