import { Router } from 'express';
import * as progressController from '../controllers/progress.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', requireAuth, asyncHandler(progressController.getOverallProgress));
router.get('/:courseId', requireAuth, asyncHandler(progressController.getCourseProgress));

export default router;
