import { Router } from 'express';
import * as booksController from '../controllers/books.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/topics/:topicId/books', requireAuth, asyncHandler(booksController.getTopicBooks));

export default router;
