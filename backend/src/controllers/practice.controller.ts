import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export async function getPractice(req: Request, res: Response) {
  const { topicId } = req.query;
  const where: { courseId: string; topicId?: string } = { courseId: req.params.courseId };
  if (typeof topicId === 'string') where.topicId = topicId;

  const questions = await prisma.practiceQuestion.findMany({ where, include: { topic: true } });
  // Unlike diagnostic/follow-up (real assessments - correct answer withheld
  // until submission), practice mode is meant to teach: the frontend shows
  // immediate correct/incorrect feedback with an explanation per question,
  // so the correct answer and explanation are included here deliberately.
  const sanitized = questions.map((q) => ({
    id: q.id,
    topicId: q.topicId,
    topicName: q.topic.name,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
  }));
  return res.json(sanitized);
}

export async function submitPractice(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { courseId, topicId, answers } = req.body as {
    courseId: string;
    topicId: string;
    answers: { questionId: string; selectedAnswer: string }[];
  };

  const questions = await prisma.practiceQuestion.findMany({
    where: { id: { in: answers.map((a) => a.questionId) } },
  });
  const questionById = new Map(questions.map((q) => [q.id, q]));

  let correct = 0;
  for (const ans of answers) {
    const q = questionById.get(ans.questionId);
    if (q && ans.selectedAnswer.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase()) {
      correct++;
    }
  }

  const attempt = await prisma.practiceAttempt.create({
    data: {
      userId: req.user.userId,
      courseId,
      topicId,
      score: correct,
      totalQuestions: answers.length,
    },
  });

  return res.json({ attemptId: attempt.id, score: correct, totalQuestions: answers.length });
}
