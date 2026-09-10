import { Router } from 'express';
import * as progressController from '../controllers/progress.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', requireAuth, progressController.getOverallProgress);
router.get('/:courseId', requireAuth, progressController.getCourseProgress);

export default router;
