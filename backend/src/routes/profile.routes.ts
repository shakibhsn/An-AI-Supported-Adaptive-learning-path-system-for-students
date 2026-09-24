import { Router } from 'express';
import * as profileController from '../controllers/profile.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/summary', requireAuth, profileController.getProfileSummary);
router.get('/activity', requireAuth, profileController.getActivityFeed);
router.get('/focus', requireAuth, profileController.getCurrentFocus);
router.get('/assessment-improvement', requireAuth, profileController.getAssessmentImprovement);

export default router;
