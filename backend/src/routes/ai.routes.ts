import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/personalize', requireAuth, aiController.personalize);
router.post('/chat', requireAuth, aiController.chatEndpoint);
router.post('/analyze-progress', requireAuth, aiController.analyzeProgressEndpoint);

export default router;
