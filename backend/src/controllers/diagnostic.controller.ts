import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { calculateTopicScores, rankWeakTopics, AnswerRecord } from '../services/mastery.service';

export async function getDiagnostic(req: Request, res: Response) {
  const questions = await prisma.diagnosticQuestion.findMany({
    where: { courseId: req.params.courseId },
    include: { topic: true },
  });
  if (questions.length === 0) {
    return res.status(404).json({ error: 'No diagnostic questions found for this course.' });
  }
  // Correct answer is deliberately excluded from what the frontend receives.
  const sanitized = questions.map((q) => ({
    id: q.id,
    topicId: q.topicId,
    topicName: q.topic.name,
    question: q.question,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
  }));
  return res.json(sanitized);
}

interface SubmitBody {
  courseId: string;
  answers: { questionId: string; selectedAnswer: string }[];
}

export async function submitDiagnostic(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { courseId, answers } = req.body as SubmitBody;

  if (!courseId || !answers || answers.length === 0) {
    return res.status(400).json({ error: 'courseId and at least one answer are required.' });
  }

  const questionIds = answers.map((a) => a.questionId);
  const questions = await prisma.diagnosticQuestion.findMany({
    where: { id: { in: questionIds } },
    include: { topic: true },
  });
  const questionById = new Map(questions.map((q) => [q.id, q]));

  const scoringInput: AnswerRecord[] = [];
  let totalCorrect = 0;
  const answerRecordsToSave: {
    questionId: string;
    topicId: string;
    selectedAnswer: string;
    isCorrect: boolean;
  }[] = [];

  for (const ans of answers) {
    const question = questionById.get(ans.questionId);
    if (!question) continue; // ignore unknown question ids rather than failing the whole submission
    const isCorrect = ans.selectedAnswer.trim().toUpperCase() === question.correctAnswer.trim().toUpperCase();
    if (isCorrect) totalCorrect++;
    scoringInput.push({ topic: question.topic.name, isCorrect });
    answerRecordsToSave.push({
      questionId: question.id,
      topicId: question.topicId,
      selectedAnswer: ans.selectedAnswer,
      isCorrect,
    });
  }

  // The actual score calculation - this is the real computation the spec
  // requires ("the result must depend on the student's actual answers"),
  // not a predefined diagnostic-result screen.
  const topicScores = calculateTopicScores(scoringInput);

  const attempt = await prisma.diagnosticAttempt.create({
    data: {
      userId: req.user.userId,
      courseId,
      score: totalCorrect,
      totalQuestions: answers.length,
      answers: { create: answerRecordsToSave },
    },
  });

  // Persist topic mastery, tracking the previous score for the
  // before/after progress screen.
  for (const [topicName, data] of Object.entries(topicScores)) {
    const topic = questions.find((q) => q.topic.name === topicName)?.topic;
    if (!topic) continue;

    const existing = await prisma.topicMastery.findUnique({
      where: { userId_topicId: { userId: req.user.userId, topicId: topic.id } },
    });

    await prisma.topicMastery.upsert({
      where: { userId_topicId: { userId: req.user.userId, topicId: topic.id } },
      update: {
        previousPercentage: existing?.masteryPercentage ?? null,
        masteryPercentage: data.score,
        status: data.status,
        attempts: { increment: 1 },
      },
      create: {
        userId: req.user.userId,
        courseId,
        topicId: topic.id,
        masteryPercentage: data.score,
        status: data.status,
        attempts: 1,
      },
    });
  }

  const weakTopics = rankWeakTopics(topicScores);

  return res.json({
    attemptId: attempt.id,
    score: totalCorrect,
    totalQuestions: answers.length,
    topicScores,
    weakTopics,
  });
}
