import { Router } from 'express';
import * as diagnosticController from '../controllers/diagnostic.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/courses/:courseId/diagnostic', requireAuth, diagnosticController.getDiagnostic);
router.post('/diagnostic/submit', requireAuth, diagnosticController.submitDiagnostic);

export default router;
