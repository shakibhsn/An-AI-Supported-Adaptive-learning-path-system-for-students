import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { calculateTopicScores, AnswerRecord } from '../services/mastery.service';

// NOTE: follow-up questions span DIFFERENT topics per course in the real
// seeded data - all 5 DSA follow-up questions happen to be about "Linked
// Lists", but OOP's and SPL's 5 follow-up questions each cover 5 DIFFERENT
// topics (Polymorphism, Interfaces, Constructors, Encapsulation for OOP;
// Pointers, Dynamic Memory, Deallocation, Dereferencing, Structures for
// SPL). So this endpoint scores and updates mastery per-topic across
// however many topics the submitted questions touch, not a single fixed
// topic - the DSA case is just the (single-topic) special case of this.

export async function getFollowUp(req: Request, res: Response) {
  const questions = await prisma.practiceQuestion.findMany({
    where: { courseId: req.params.courseId, isFollowUp: true },
    include: { topic: true },
  });
  const sanitized = questions.map((q) => ({
    id: q.id,
    topicId: q.topicId,
    topicName: q.topic.name,
    question: q.question,
    options: q.options,
  }));
  return res.json(sanitized);
}

export async function submitFollowUp(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { courseId, answers } = req.body as {
    courseId: string;
    answers: { questionId: string; selectedAnswer: string }[];
  };

  const questions = await prisma.practiceQuestion.findMany({
    where: { id: { in: answers.map((a) => a.questionId) }, isFollowUp: true },
    include: { topic: true },
  });
  const questionById = new Map(questions.map((q) => [q.id, q]));

  const scoringInput: AnswerRecord[] = [];
  const topicIdByName = new Map<string, string>();

  for (const ans of answers) {
    const q = questionById.get(ans.questionId);
    if (!q) continue;
    const isCorrect = ans.selectedAnswer.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase();
    scoringInput.push({ topic: q.topic.name, isCorrect });
    topicIdByName.set(q.topic.name, q.topicId);
  }

  if (scoringInput.length === 0) {
    return res.status(400).json({ error: 'No valid answers submitted.' });
  }

  // Real per-topic calculation - this is what Section 17 requires: actual
  // stored data, never a hardcoded before/after result.
  const newScores = calculateTopicScores(scoringInput);

  const results = [];
  for (const [topicName, data] of Object.entries(newScores)) {
    const topicId = topicIdByName.get(topicName)!;

    const existing = await prisma.topicMastery.findUnique({
      where: { userId_topicId: { userId: req.user.userId, topicId } },
    });
    const previousMastery = existing?.masteryPercentage ?? null;

    await prisma.followUpAttempt.create({
      data: {
        userId: req.user.userId,
        courseId,
        topicId,
        score: data.correct,
        totalQuestions: data.total,
        previousMastery: previousMastery ?? undefined,
        newMastery: data.score,
      },
    });

    await prisma.topicMastery.upsert({
      where: { userId_topicId: { userId: req.user.userId, topicId } },
      update: {
        previousPercentage: previousMastery,
        masteryPercentage: data.score,
        status: data.status,
        attempts: { increment: 1 },
      },
      create: {
        userId: req.user.userId,
        courseId,
        topicId,
        masteryPercentage: data.score,
        status: data.status,
        attempts: 1,
      },
    });

    results.push({
      topic: topicName,
      previousMastery,
      newMastery: data.score,
      status: data.status,
      improvement: previousMastery !== null ? Math.round((data.score - previousMastery) * 10) / 10 : null,
    });
  }

  const anyChanged = results.some((r) => r.previousMastery !== null && r.newMastery !== r.previousMastery);

  return res.json({
    results,
    message: anyChanged ? 'Your learning path has been updated because your mastery changed.' : undefined,
  });
}
