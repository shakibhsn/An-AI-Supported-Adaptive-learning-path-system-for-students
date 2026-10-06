import { Router } from 'express';
import * as materialsController from '../controllers/materials.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/courses/:courseId/materials', requireAuth, asyncHandler(materialsController.getCourseMaterials));
router.get('/topics/:topicId/materials', requireAuth, asyncHandler(materialsController.getTopicMaterials));
router.post('/materials/:id/complete', requireAuth, asyncHandler(materialsController.completeMaterial));
router.delete('/materials/:id/complete', requireAuth, asyncHandler(materialsController.uncompleteMaterial));

export default router;
