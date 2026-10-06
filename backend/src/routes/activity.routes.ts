import { Router } from 'express';
import * as activityController from '../controllers/activity.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/activity/start', requireAuth, asyncHandler(activityController.start));
router.post('/activity/instant', requireAuth, asyncHandler(activityController.instant));
router.post('/activity/:id/heartbeat', requireAuth, asyncHandler(activityController.heartbeat));
router.post('/activity/:id/end', requireAuth, asyncHandler(activityController.end));
router.get('/activity/summary', requireAuth, asyncHandler(activityController.summary));

export default router;
