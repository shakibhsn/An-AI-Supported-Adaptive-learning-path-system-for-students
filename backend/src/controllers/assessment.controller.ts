import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
  ASSESSMENT_CONFIG,
  AssessDifficulty,
  nextDifficulty,
  passThresholdFor,
  selectAssessmentQuestions,
  shuffleOptions,
  computeSubtopicBreakdown,
  identifyWeakSubtopics,
  keywordFallbackScore,
} from '../services/assessment.service';
import { evaluateShortAnswer } from '../services/llm.service';
import { blendMastery, classifyStatus } from '../services/mastery.service';
import { regeneratePath } from '../services/learningPath.service';

const DIFFICULTIES: AssessDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];

function isDifficulty(v: unknown): v is AssessDifficulty {
  return v === 'EASY' || v === 'MEDIUM' || v === 'HARD';
}

/**
 * Best (highest) percentage ever scored on a COMPLETED attempt at a given
 * difficulty - used purely to decide whether the next tier is unlocked.
 * Retrying a lower difficulty later and scoring worse never re-locks a tier
 * already unlocked (Section 6: "If Hard is unlocked... do not force the
 * student back").
 */
async function bestCompletedPercentage(userId: string, topicId: string, difficulty: AssessDifficulty): Promise<number | null> {
  const rows = await prisma.assessmentAttempt.findMany({
    where: { userId, topicId, difficulty, status: 'completed' },
    select: { percentage: true },
  });
  if (rows.length === 0) return null;
  return Math.max(...rows.map((r) => r.percentage ?? 0));
}

async function computeUnlockState(userId: string, topicId: string) {
  const easyBest = await bestCompletedPercentage(userId, topicId, 'EASY');
  const mediumBest = await bestCompletedPercentage(userId, topicId, 'MEDIUM');
  const hardBest = await bestCompletedPercentage(userId, topicId, 'HARD');

  const mediumUnlocked = easyBest !== null && easyBest >= ASSESSMENT_CONFIG.EASY_PASS_THRESHOLD;
  const hardUnlocked = mediumBest !== null && mediumBest >= ASSESSMENT_CONFIG.MEDIUM_PASS_THRESHOLD;

  return {
    EASY: { unlocked: true, bestPercentage: easyBest, passThreshold: ASSESSMENT_CONFIG.EASY_PASS_THRESHOLD },
    MEDIUM: { unlocked: mediumUnlocked, bestPercentage: mediumBest, passThreshold: ASSESSMENT_CONFIG.MEDIUM_PASS_THRESHOLD },
    HARD: { unlocked: hardUnlocked, bestPercentage: hardBest, passThreshold: null as number | null },
  };
}

// GET /api/topics/:topicId/assessment/state
export async function getAssessmentState(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { topicId } = req.params;
  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  if (!topic) return res.status(404).json({ error: 'Topic not found' });

  const unlockState = await computeUnlockState(req.user.userId, topicId);

  const activeAttempt = await prisma.assessmentAttempt.findFirst({
    where: { userId: req.user.userId, topicId, status: 'in_progress' },
    orderBy: { startedAt: 'desc' },
  });

  return res.json({
    topicId,
    topicName: topic.name,
    difficulties: unlockState,
    activeAttempt: activeAttempt ? { id: activeAttempt.id, difficulty: activeAttempt.difficulty, startedAt: activeAttempt.startedAt } : null,
  });
}

// POST /api/topics/:topicId/assessment/start  { difficulty }
// Resume-safe: if the student already has an in_progress attempt at this
// difficulty (e.g. they refreshed the page), returns that SAME attempt and
// question set rather than rolling a new one (Section 5). A brand new
// attempt is only created when there is no active one.
export async function startAssessment(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { topicId } = req.params;
  const { difficulty } = req.body as { difficulty?: string };

  if (!isDifficulty(difficulty)) {
    return res.status(400).json({ error: 'difficulty must be one of EASY, MEDIUM, HARD.' });
  }

  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  if (!topic) return res.status(404).json({ error: 'Topic not found' });

  const unlockState = await computeUnlockState(req.user.userId, topicId);
  if (!unlockState[difficulty].unlocked) {
    return res.status(403).json({
      error: `${difficulty} is locked.`,
      unlockState,
    });
  }

  const existing = await prisma.assessmentAttempt.findFirst({
    where: { userId: req.user.userId, topicId, difficulty, status: 'in_progress' },
    orderBy: { startedAt: 'desc' },
  });

  let attempt = existing;
  if (!attempt) {
    const pool = await prisma.practiceQuestion.findMany({
      where: { topicId, difficulty, subtopic: { not: null } }, // assessment bank only (has subtopic tagging)
    });
    if (pool.length === 0) {
      return res.status(404).json({ error: `No ${difficulty} assessment questions are available for ${topic.name} yet.` });
    }

    // Avoid questions the student has recently completed an assessment with,
    // when the pool is large enough to still fill a full assessment without them.
    const recentAttempts = await prisma.assessmentAttempt.findMany({
      where: { userId: req.user.userId, topicId, difficulty, status: 'completed' },
      orderBy: { completedAt: 'desc' },
      take: 3,
      select: { questionIds: true },
    });
    const avoidIds = new Set<string>(recentAttempts.flatMap((a) => (a.questionIds as string[]) || []));

    const selected = selectAssessmentQuestions(
      pool.map((q) => ({ id: q.id, questionType: q.questionType as 'MCQ' | 'SHORT_ANSWER' | 'PROBLEM_SOLVING' })),
      avoidIds,
    );
    const questionIds = selected.map((q) => q.id);

    const byId = new Map(pool.map((q) => [q.id, q]));
    // Frozen at creation time (Section 4.4/5): the MCQ shuffle happens ONCE
    // here and is persisted, so a refresh-resume shows the identical option
    // order the student already saw, and grading later uses this exact
    // correctAnswer letter rather than recomputing a different shuffle.
    const servedQuestions = questionIds
      .map((id) => byId.get(id))
      .filter((q): q is NonNullable<typeof q> => !!q)
      .map((q) => {
        if (q.questionType === 'MCQ') {
          const { options, correctAnswer } = shuffleOptions((q.options as { letter: string; text: string }[]) || [], q.correctAnswer);
          return { id: q.id, questionType: q.questionType, question: q.question, subtopic: q.subtopic, options, correctAnswer, maxScore: q.maxScore };
        }
        return { id: q.id, questionType: q.questionType, question: q.question, subtopic: q.subtopic, maxScore: q.maxScore };
      });

    attempt = await prisma.assessmentAttempt.create({
      data: {
        userId: req.user.userId,
        courseId: topic.courseId,
        topicId,
        difficulty,
        questionIds,
        servedQuestions: servedQuestions as never,
        status: 'in_progress',
      },
    });
  }

  const served = attempt.servedQuestions as { id: string; questionType: string; question: string; subtopic: string | null; options?: unknown; maxScore: number }[];
  // Never send correctAnswer to the client (Section 12 - answers withheld
  // until submission, same principle as the diagnostic quiz).
  const orderedQuestions = served.map(({ id, questionType, question, subtopic, options, maxScore }) => ({ id, questionType, question, subtopic, options, maxScore }));

  return res.json({
    attemptId: attempt.id,
    topicId,
    topicName: topic.name,
    difficulty,
    resumed: !!existing,
    questions: orderedQuestions,
  });
}

interface SubmittedAnswer {
  questionId: string;
  selectedAnswer?: string;
  answerText?: string;
}

// POST /api/assessment-attempts/:attemptId/submit  { answers }
export async function submitAssessment(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { attemptId } = req.params;
  const { answers } = req.body as { answers?: SubmittedAnswer[] };

  const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== req.user.userId) return res.status(404).json({ error: 'Assessment attempt not found.' });
  if (attempt.status !== 'in_progress') return res.status(409).json({ error: 'This assessment attempt has already been completed.' });
  if (!Array.isArray(answers)) return res.status(400).json({ error: 'answers array is required.' });

  const topic = await prisma.topic.findUnique({ where: { id: attempt.topicId } });
  const questionRows = await prisma.practiceQuestion.findMany({ where: { id: { in: attempt.questionIds as string[] } } });
  const dbById = new Map(questionRows.map((q) => [q.id, q])); // for SHORT_ANSWER/PROBLEM_SOLVING rubric only - unaffected by shuffle
  const servedById = new Map(
    (attempt.servedQuestions as { id: string; questionType: string; correctAnswer?: string; maxScore: number; subtopic: string | null }[]).map((q) => [q.id, q]),
  );
  const answerByQ = new Map(answers.map((a) => [a.questionId, a]));

  let earnedTotal = 0;
  let possibleTotal = 0;
  const perQuestionResults: Record<string, unknown> = {};
  const breakdownEntries: { subtopic: string | null; earned: number; possible: number }[] = [];

  for (const questionId of attempt.questionIds as string[]) {
    const served = servedById.get(questionId);
    const q = dbById.get(questionId);
    if (!served || !q) continue;
    const submitted = answerByQ.get(questionId);
    const maxScore = served.maxScore;
    possibleTotal += maxScore;

    if (served.questionType === 'MCQ') {
      // Grade against the FROZEN, already-shuffled correctAnswer letter
      // that was actually served for this attempt (see servedQuestions in
      // startAssessment) - never the live PracticeQuestion row, whose
      // letter labeling only matches the ORIGINAL, unshuffled order.
      const isCorrect = (submitted?.selectedAnswer || '').trim().toUpperCase() === (served.correctAnswer || '').trim().toUpperCase();
      const earned = isCorrect ? maxScore : 0;
      earnedTotal += earned;
      perQuestionResults[questionId] = { questionType: served.questionType, selectedAnswer: submitted?.selectedAnswer || null, isCorrect, earned, maxScore };
      breakdownEntries.push({ subtopic: served.subtopic, earned, possible: maxScore });
      continue;
    }

    // SHORT_ANSWER / PROBLEM_SOLVING - reuse the existing Groq/xAI
    // integration for evaluation (Section 7); an AI failure degrades to an
    // honest keyword-match fallback rather than breaking the assessment.
    const answerText = submitted?.answerText || '';
    const expectedConcepts = ((q.expectedConcepts as string[]) || []);
    let earned = 0;
    let feedback = '';
    let source: 'llm' | 'fallback' = 'fallback';

    if (answerText.trim()) {
      const evalResult = await evaluateShortAnswer({ question: q.question, studentAnswer: answerText, expectedConcepts, maxScore });
      if (evalResult.success) {
        earned = evalResult.earnedScore;
        feedback = evalResult.feedback;
        source = 'llm';
      } else {
        const fallback = keywordFallbackScore(answerText, expectedConcepts, maxScore);
        earned = fallback.earned;
        feedback = 'AI evaluation was temporarily unavailable, so this was scored by keyword match against the expected concepts.';
      }
    }

    earnedTotal += earned;
    perQuestionResults[questionId] = { questionType: q.questionType, answerText, earned, maxScore, feedback, source };
    breakdownEntries.push({ subtopic: q.subtopic, earned, possible: maxScore });
  }

  const percentage = possibleTotal > 0 ? Math.round((earnedTotal / possibleTotal) * 1000) / 10 : 0;
  const subtopicBreakdown = computeSubtopicBreakdown(breakdownEntries);
  const weakSubtopics = identifyWeakSubtopics(subtopicBreakdown);

  await prisma.assessmentAttempt.update({
    where: { id: attempt.id },
    data: {
      status: 'completed',
      completedAt: new Date(),
      score: earnedTotal,
      maxScore: possibleTotal,
      percentage,
      answers: perQuestionResults as never,
      subtopicBreakdown: subtopicBreakdown as never,
    },
  });

  // Connect the real result to the existing topic-mastery + adaptive
  // learning path pipeline (Section 14) - reuses the exact same
  // blendMastery/classifyStatus/regeneratePath functions submitPractice
  // already uses, rather than inventing a parallel mastery mechanism.
  const existingMastery = await prisma.topicMastery.findUnique({
    where: { userId_topicId: { userId: req.user.userId, topicId: attempt.topicId } },
  });
  const previousMastery = existingMastery?.masteryPercentage ?? null;
  const blended = blendMastery(previousMastery, percentage);
  const masteryChanged = previousMastery === null || blended !== previousMastery;

  await prisma.topicMastery.upsert({
    where: { userId_topicId: { userId: req.user.userId, topicId: attempt.topicId } },
    update: { previousPercentage: previousMastery, masteryPercentage: blended, status: classifyStatus(blended), attempts: { increment: 1 } },
    create: { userId: req.user.userId, courseId: attempt.courseId, topicId: attempt.topicId, masteryPercentage: blended, status: classifyStatus(blended), attempts: 1 },
  });

  const regen = masteryChanged ? await regeneratePath(req.user.userId, attempt.courseId) : null;

  const difficulty = attempt.difficulty as AssessDifficulty;
  const threshold = passThresholdFor(difficulty);
  const passed = threshold === null ? null : percentage >= threshold;
  const unlockedNext = passed && nextDifficulty(difficulty);

  return res.json({
    attemptId: attempt.id,
    topicId: attempt.topicId,
    topicName: topic?.name,
    difficulty,
    score: earnedTotal,
    maxScore: possibleTotal,
    percentage,
    passThreshold: threshold,
    passed,
    unlockedNextDifficulty: unlockedNext || null,
    subtopicBreakdown,
    weakSubtopics,
    results: perQuestionResults,
    masteryChanged,
    topicMastery: { previous: previousMastery, current: blended, status: classifyStatus(blended) },
    learningPath: regen && regen.status === 'ok' ? regen.path : null,
  });
}
