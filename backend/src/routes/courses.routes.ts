import { Router } from 'express';
import * as coursesController from '../controllers/courses.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', requireAuth, asyncHandler(coursesController.getCourses));
router.get('/:courseId', requireAuth, asyncHandler(coursesController.getCourse));
router.get('/:courseId/topics', requireAuth, asyncHandler(coursesController.getCourseTopics));

export default router;
