import { Router } from 'express';
import * as coursesController from '../controllers/courses.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', requireAuth, coursesController.getCourses);
router.get('/:courseId', requireAuth, coursesController.getCourse);
router.get('/:courseId/topics', requireAuth, coursesController.getCourseTopics);

export default router;
