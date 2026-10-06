import { Router } from 'express';
import * as diagnosticController from '../controllers/diagnostic.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/courses/:courseId/diagnostic', requireAuth, asyncHandler(diagnosticController.getDiagnostic));
router.post('/diagnostic/submit', requireAuth, asyncHandler(diagnosticController.submitDiagnostic));

export default router;
