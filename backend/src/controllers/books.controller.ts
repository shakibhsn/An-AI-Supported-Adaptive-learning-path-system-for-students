import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { searchBooksForTopic } from '../services/openLibrary.service';

// GET /api/topics/:topicId/books
// Additional "Recommended Books" resource type alongside the existing
// curated Video/Playlist/Reading/Practice LearningMaterial rows (Phase 4).
// Deliberately NOT stored as a LearningMaterial: those are hand-curated,
// internally-vetted rows with stable URLs and completion tracking; this is
// a live, unvetted third-party search result that can change day to day -
// storing it the same way would make "mark complete" and curation
// semantics ambiguous for content this project doesn't actually control.
// Fetched fresh on every request, through openLibrary.service.ts's 24h
// in-process cache.
export async function getTopicBooks(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const topic = await prisma.topic.findUnique({
    where: { id: req.params.topicId },
    include: { course: { select: { name: true } } },
  });
  if (!topic) return res.status(404).json({ error: 'Topic not found' });

  const result = await searchBooksForTopic(topic.course.name, topic.name);
  return res.json({
    topicId: topic.id,
    topic: topic.name,
    books: result.books,
    unavailable: result.unavailable,
  });
}
