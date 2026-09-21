import { Router } from 'express';
import authRoutes from './auth.routes';
import coursesRoutes from './courses.routes';
import diagnosticRoutes from './diagnostic.routes';
import practiceRoutes from './practice.routes';
import followUpRoutes from './followUp.routes';
import learningPathRoutes from './learningPath.routes';
import materialsRoutes from './materials.routes';
import aiRoutes from './ai.routes';
import progressRoutes from './progress.routes';
import activityRoutes from './activity.routes';
import insightsRoutes from './insights.routes';
import assessmentRoutes from './assessment.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/courses', coursesRoutes);
router.use('/', diagnosticRoutes); // exposes /courses/:id/diagnostic and /diagnostic/submit
router.use('/', practiceRoutes); // exposes /courses/:id/practice and /practice/submit
router.use('/', followUpRoutes); // exposes /courses/:id/follow-up and /follow-up/submit
router.use('/', learningPathRoutes); // exposes /courses/:id/gaps, /learning-path/*
router.use('/', materialsRoutes); // exposes /courses/:id/materials, /topics/:id/materials, /materials/:id/complete
router.use('/ai', aiRoutes);
router.use('/progress', progressRoutes);
router.use('/', activityRoutes); // exposes /activity/start, /activity/:id/heartbeat, /activity/:id/end, /activity/instant, /activity/summary
router.use('/', insightsRoutes); // exposes /courses/:id/mastery-map, /courses/:id/learning-profile, /courses/:id/path-history
router.use('/', assessmentRoutes); // exposes /topics/:id/assessment/state, /topics/:id/assessment/start, /assessment-attempts/:id/submit

export default router;
