import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { calculateTopicScores, classifyStatus, blendMastery, AnswerRecord } from '../services/mastery.service';
import { regeneratePath } from '../services/learningPath.service';
import { recommendDifficulty, Difficulty, AttemptRecord } from '../services/adaptiveQuestion.service';

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
    difficulty: q.difficulty,
    questionType: q.questionType,
  }));
  return res.json(sanitized);
}

// GET /api/topics/:topicId/practice/next?count=5
// Adaptive, topic-scoped practice set (Section 9-11): looks at the student's
// recent PracticeQuestionAttempt history on this topic, recommends a
// difficulty tier via adaptiveQuestion.service, and serves that many
// questions at that tier - preferring ones the student hasn't answered
// correctly recently (Section 19), falling back to the full pool if the
// topic doesn't have enough unseen questions at that tier yet.
export async function getAdaptivePractice(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const topicId = req.params.topicId;
  const count = Math.min(Math.max(parseInt(String(req.query.count ?? '5'), 10) || 5, 1), 10);

  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  if (!topic) return res.status(404).json({ error: 'Topic not found' });

  const history = await prisma.practiceQuestionAttempt.findMany({
    where: { userId: req.user.userId, topicId },
    orderBy: { attemptedAt: 'asc' },
    select: { difficulty: true, isCorrect: true },
  });

  // "Current" tier = whatever difficulty the student was most recently
  // served on this topic; MEDIUM if this is their first time here.
  const currentDifficulty = (history[history.length - 1]?.difficulty as Difficulty) || 'MEDIUM';
  const recommendation = recommendDifficulty(history as AttemptRecord[], currentDifficulty);

  const recentCorrectQuestionIds = new Set(
    (
      await prisma.practiceQuestionAttempt.findMany({
        where: { userId: req.user.userId, topicId, isCorrect: true },
        orderBy: { attemptedAt: 'desc' },
        take: 15,
        select: { questionId: true },
      })
    ).map((a) => a.questionId),
  );

  const pool = await prisma.practiceQuestion.findMany({
    where: { topicId, isFollowUp: false, difficulty: recommendation.recommendedDifficulty },
    include: { topic: true },
  });

  const unseen = pool.filter((q) => !recentCorrectQuestionIds.has(q.id));
  const chosen = (unseen.length >= count ? unseen : pool).sort(() => Math.random() - 0.5).slice(0, count);

  const shaped = chosen.map((q) => ({
    id: q.id,
    topicId: q.topicId,
    topicName: q.topic.name,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    difficulty: q.difficulty,
    questionType: q.questionType,
  }));

  return res.json({ questions: shaped, recommendation });
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
  const questionAttempts: { userId: string; questionId: string; topicId: string; difficulty: string; isCorrect: boolean }[] = [];
  let totalCorrect = 0;

  for (const ans of answers) {
    const q = questionById.get(ans.questionId);
    if (!q) continue;
    const isCorrect = ans.selectedAnswer.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase();
    if (isCorrect) totalCorrect++;
    scoringInput.push({ topic: q.topic.name, isCorrect });
    topicIdByName.set(q.topic.name, q.topicId);
    questionAttempts.push({
      userId: req.user.userId,
      questionId: q.id,
      topicId: q.topicId,
      difficulty: q.difficulty,
      isCorrect,
    });
  }

  if (scoringInput.length === 0) {
    return res.status(400).json({ error: 'No valid answers submitted.' });
  }

  // Per-question history - powers adaptive difficulty selection (Section 9)
  // and "avoid repeating recently-correct questions" (Section 19).
  if (questionAttempts.length > 0) {
    await prisma.practiceQuestionAttempt.createMany({ data: questionAttempts });
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
