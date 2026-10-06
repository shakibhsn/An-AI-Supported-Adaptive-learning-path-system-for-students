import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/personalize', requireAuth, asyncHandler(aiController.personalize));
router.post('/chat', requireAuth, asyncHandler(aiController.chatEndpoint));
router.post('/analyze-progress', requireAuth, asyncHandler(aiController.analyzeProgressEndpoint));

export default router;
