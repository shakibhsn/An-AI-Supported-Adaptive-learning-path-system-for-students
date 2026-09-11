import { Router } from 'express';
import * as activityController from '../controllers/activity.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/activity/start', requireAuth, activityController.start);
router.post('/activity/instant', requireAuth, activityController.instant);
router.post('/activity/:id/heartbeat', requireAuth, activityController.heartbeat);
router.post('/activity/:id/end', requireAuth, activityController.end);
router.get('/activity/summary', requireAuth, activityController.summary);

export default router;
