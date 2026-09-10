import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

type MaterialRow = {
  id: string;
  topicId: string;
  topic: { name: string };
  title: string;
  description: string | null;
  type: string;
  url: string;
  provider: string | null;
  difficulty: string;
  durationMinutes: number | null;
  sortOrder: number;
};

async function shape(userId: string, materials: MaterialRow[]) {
  const completed = new Set(
    (
      await prisma.materialCompletion.findMany({
        where: { userId, materialId: { in: materials.map((m) => m.id) } },
        select: { materialId: true },
      })
    ).map((c) => c.materialId),
  );
  return materials.map((m) => ({
    id: m.id,
    topicId: m.topicId,
    topicName: m.topic.name,
    title: m.title,
    description: m.description,
    type: m.type,
    url: m.url,
    provider: m.provider,
    difficulty: m.difficulty,
    durationMinutes: m.durationMinutes,
    sortOrder: m.sortOrder,
    completed: completed.has(m.id),
  }));
}

// GET /api/courses/:courseId/materials  -> all active materials for a course,
// grouped by topic. The UI renders whatever comes back - adding materials to
// the DB needs no frontend change.
export async function getCourseMaterials(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const materials = await prisma.learningMaterial.findMany({
    where: { courseId: req.params.courseId, isActive: true },
    include: { topic: { select: { name: true } } },
    orderBy: [{ topic: { name: 'asc' } }, { sortOrder: 'asc' }],
  });
  const shaped = await shape(req.user.userId, materials as MaterialRow[]);

  const byTopic: Record<string, { topicId: string; topicName: string; materials: typeof shaped }> = {};
  for (const m of shaped) {
    if (!byTopic[m.topicId]) byTopic[m.topicId] = { topicId: m.topicId, topicName: m.topicName, materials: [] };
    byTopic[m.topicId].materials.push(m);
  }
  return res.json({ courseId: req.params.courseId, topics: Object.values(byTopic), flat: shaped });
}

// GET /api/topics/:topicId/materials
export async function getTopicMaterials(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const materials = await prisma.learningMaterial.findMany({
    where: { topicId: req.params.topicId, isActive: true },
    include: { topic: { select: { name: true } } },
    orderBy: { sortOrder: 'asc' },
  });
  return res.json(await shape(req.user.userId, materials as MaterialRow[]));
}

// POST /api/materials/:id/complete   |   DELETE /api/materials/:id/complete
export async function completeMaterial(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const material = await prisma.learningMaterial.findUnique({ where: { id: req.params.id } });
  if (!material) return res.status(404).json({ error: 'Material not found' });

  await prisma.materialCompletion.upsert({
    where: { userId_materialId: { userId: req.user.userId, materialId: material.id } },
    update: {},
    create: { userId: req.user.userId, materialId: material.id },
  });
  return res.json({ materialId: material.id, completed: true });
}

export async function uncompleteMaterial(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  await prisma.materialCompletion
    .delete({ where: { userId_materialId: { userId: req.user.userId, materialId: req.params.id } } })
    .catch(() => undefined); // deleting a non-existent completion is a no-op
  return res.json({ materialId: req.params.id, completed: false });
}
