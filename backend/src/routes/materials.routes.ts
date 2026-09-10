import { Router } from 'express';
import * as materialsController from '../controllers/materials.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/courses/:courseId/materials', requireAuth, materialsController.getCourseMaterials);
router.get('/topics/:topicId/materials', requireAuth, materialsController.getTopicMaterials);
router.post('/materials/:id/complete', requireAuth, materialsController.completeMaterial);
router.delete('/materials/:id/complete', requireAuth, materialsController.uncompleteMaterial);

export default router;
