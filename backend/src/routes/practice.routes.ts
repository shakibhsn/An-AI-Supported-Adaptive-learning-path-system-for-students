import { Router } from 'express';
import * as practiceController from '../controllers/practice.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/courses/:courseId/practice', requireAuth, practiceController.getPractice);
router.get('/topics/:topicId/practice/next', requireAuth, practiceController.getAdaptivePractice);
router.post('/practice/submit', requireAuth, practiceController.submitPractice);

export default router;
