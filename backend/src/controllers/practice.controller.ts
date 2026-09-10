import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { calculateTopicScores, classifyStatus, blendMastery, AnswerRecord } from '../services/mastery.service';
import { regeneratePath } from '../services/learningPath.service';

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
  const { courseId, answers } = req.body as {
    courseId: string;
    topicId?: string;
    answers: { questionId: string; selectedAnswer: string }[];
  };

  if (!courseId || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'courseId and at least one answer are required.' });
  }

  const questions = await prisma.practiceQuestion.findMany({
    where: { id: { in: answers.map((a) => a.questionId) } },
    include: { topic: true },
  });
  const questionById = new Map(questions.map((q) => [q.id, q]));

  const scoringInput: AnswerRecord[] = [];
  const topicIdByName = new Map<string, string>();
  let totalCorrect = 0;

  for (const ans of answers) {
    const q = questionById.get(ans.questionId);
    if (!q) continue;
    const isCorrect = ans.selectedAnswer.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase();
    if (isCorrect) totalCorrect++;
    scoringInput.push({ topic: q.topic.name, isCorrect });
    topicIdByName.set(q.topic.name, q.topicId);
  }

  if (scoringInput.length === 0) {
    return res.status(400).json({ error: 'No valid answers submitted.' });
  }

  const perTopic = calculateTopicScores(scoringInput);

  // One PracticeAttempt row per topic the submission touched (mirrors how
  // follow-up records per-topic), plus a real TopicMastery update per topic.
  const results = [];
  let masteryChanged = false;

  for (const [topicName, data] of Object.entries(perTopic)) {
    const topicId = topicIdByName.get(topicName)!;

    await prisma.practiceAttempt.create({
      data: {
        userId: req.user.userId,
        courseId,
        topicId,
        score: data.correct,
        totalQuestions: data.total,
      },
    });

    const existing = await prisma.topicMastery.findUnique({
      where: { userId_topicId: { userId: req.user.userId, topicId } },
    });
    const previous = existing?.masteryPercentage ?? null;
    const blended = blendMastery(previous, data.score);
    if (previous === null || blended !== previous) masteryChanged = true;

    await prisma.topicMastery.upsert({
      where: { userId_topicId: { userId: req.user.userId, topicId } },
      update: {
        previousPercentage: previous,
        masteryPercentage: blended,
        status: classifyStatus(blended),
        attempts: { increment: 1 },
      },
      create: {
        userId: req.user.userId,
        courseId,
        topicId,
        masteryPercentage: blended,
        status: classifyStatus(blended),
        attempts: 1,
      },
    });

    results.push({
      topic: topicName,
      correct: data.correct,
      total: data.total,
      practiceScore: data.score,
      previousMastery: previous,
      newMastery: blended,
      status: classifyStatus(blended),
    });
  }

  // Practice changed mastery -> keep the adaptive path in sync (Section 21).
  const regen = masteryChanged ? await regeneratePath(req.user.userId, courseId) : null;

  return res.json({
    score: totalCorrect,
    totalQuestions: scoringInput.length,
    results,
    masteryChanged,
    learningPath: regen && regen.status === 'ok' ? regen.path : null,
  });
}
