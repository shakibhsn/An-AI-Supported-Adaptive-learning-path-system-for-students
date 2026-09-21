/**
 * Randomized Adaptive Assessment engine.
 *
 * Deliberately framework/database-free (same pattern as mastery.service.ts
 * and adaptiveQuestion.service.ts) so selection/shuffling/scoring can be
 * unit tested in isolation. This is a NEW, separate feature from the
 * existing rolling-window adaptive PRACTICE engine (adaptiveQuestion.service.ts)
 * - that file and its /topics/:id/practice/next endpoint are untouched.
 *
 * Flow: EASY (10 Qs, pass >= 80%) -> unlocks MEDIUM (10 Qs, pass >= 85%) ->
 * unlocks HARD (10 Qs, no further unlock). Level-locked, not a continuous
 * rolling difficulty like the practice engine.
 */

export type AssessDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type AssessType = 'MCQ' | 'SHORT_ANSWER' | 'PROBLEM_SOLVING';

export const ASSESSMENT_CONFIG = {
  QUESTIONS_PER_ASSESSMENT: 10,
  TYPE_MIX: { MCQ: 6, SHORT_ANSWER: 2, PROBLEM_SOLVING: 2 } as Record<AssessType, number>,
  EASY_PASS_THRESHOLD: 80,
  MEDIUM_PASS_THRESHOLD: 85,
} as const;

const DIFFICULTY_ORDER: AssessDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];

export function nextDifficulty(d: AssessDifficulty): AssessDifficulty | null {
  const idx = DIFFICULTY_ORDER.indexOf(d);
  return idx < DIFFICULTY_ORDER.length - 1 ? DIFFICULTY_ORDER[idx + 1] : null;
}

export function passThresholdFor(d: AssessDifficulty): number | null {
  if (d === 'EASY') return ASSESSMENT_CONFIG.EASY_PASS_THRESHOLD;
  if (d === 'MEDIUM') return ASSESSMENT_CONFIG.MEDIUM_PASS_THRESHOLD;
  return null; // HARD has no further tier to unlock
}

/** Fisher-Yates - unbiased, in-place-safe (returns a new array). */
export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface PoolQuestion {
  id: string;
  questionType: AssessType;
}

/**
 * Section 3/4/11/12: pick QUESTIONS_PER_ASSESSMENT questions from `pool`,
 * respecting the type mix where enough questions of each type exist
 * (gracefully filling missing slots from other types otherwise - Section 18),
 * preferring `avoidIds` (recently-attempted questions) when the pool is
 * large enough to avoid them, never crashing on a small pool, never
 * duplicating a question within the selection.
 */
export function selectAssessmentQuestions<T extends PoolQuestion>(
  pool: T[],
  avoidIds: Set<string>,
  size: number = ASSESSMENT_CONFIG.QUESTIONS_PER_ASSESSMENT,
  typeMix: Record<AssessType, number> = ASSESSMENT_CONFIG.TYPE_MIX,
): T[] {
  const fresh = pool.filter((q) => !avoidIds.has(q.id));
  // Only avoid recently-seen questions if doing so still leaves enough to
  // fill the assessment - otherwise fall back to the full pool (Section 4.8/4.9).
  const usable = fresh.length >= size ? fresh : pool;

  const byType: Record<AssessType, T[]> = { MCQ: [], SHORT_ANSWER: [], PROBLEM_SOLVING: [] };
  for (const q of usable) byType[q.questionType].push(q);

  const chosen: T[] = [];
  const chosenIds = new Set<string>();
  const take = (arr: T[], n: number) => {
    const shuffled = shuffle(arr.filter((q) => !chosenIds.has(q.id)));
    for (const q of shuffled.slice(0, n)) {
      chosen.push(q);
      chosenIds.add(q.id);
    }
  };

  (Object.keys(typeMix) as AssessType[]).forEach((t) => take(byType[t], typeMix[t]));

  // Gracefully fill any remaining slots (not enough of some type) from
  // whatever is left in the usable pool, never crashing on a thin bank.
  if (chosen.length < size) {
    const remaining = usable.filter((q) => !chosenIds.has(q.id));
    take(remaining, size - chosen.length);
  }

  return shuffle(chosen).slice(0, size);
}

export interface ShufflableOption {
  letter: string;
  text: string;
}

/**
 * Section 4.3/4.4: shuffle MCQ option order for display, WITHOUT changing
 * which option's content is correct. Re-labels A/B/C/D in the new order so
 * the UI still shows clean sequential letters; the returned correctAnswer
 * is the new letter attached to whichever text was originally correct.
 */
export function shuffleOptions(options: ShufflableOption[], correctAnswer: string): { options: ShufflableOption[]; correctAnswer: string } {
  const correctText = options.find((o) => o.letter === correctAnswer)?.text;
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const relabeled = shuffle(options).map((o, i) => ({ letter: letters[i], text: o.text }));
  const newCorrect = relabeled.find((o) => o.text === correctText)?.letter ?? correctAnswer;
  return { options: relabeled, correctAnswer: newCorrect };
}

export interface SubtopicTally {
  correct: number;
  total: number;
}

/**
 * Section 9: aggregate per-question correctness (0..1, so partial-credit
 * short-answer/problem questions count fractionally) by subtopic, using
 * ONLY real attempted questions/results - never invented.
 */
export function computeSubtopicBreakdown(
  entries: { subtopic: string | null; earned: number; possible: number }[],
): Record<string, { correct: number; total: number; percentage: number }> {
  const tally: Record<string, SubtopicTally> = {};
  for (const e of entries) {
    if (!e.subtopic) continue;
    if (!tally[e.subtopic]) tally[e.subtopic] = { correct: 0, total: 0 };
    tally[e.subtopic].correct += e.earned;
    tally[e.subtopic].total += e.possible;
  }
  const result: Record<string, { correct: number; total: number; percentage: number }> = {};
  for (const [subtopic, t] of Object.entries(tally)) {
    result[subtopic] = { correct: Math.round(t.correct * 100) / 100, total: t.total, percentage: t.total > 0 ? Math.round((t.correct / t.total) * 1000) / 10 : 0 };
  }
  return result;
}

export function identifyWeakSubtopics(breakdown: Record<string, { percentage: number }>, threshold = 70): string[] {
  return Object.entries(breakdown)
    .filter(([, v]) => v.percentage < threshold)
    .sort((a, b) => a[1].percentage - b[1].percentage)
    .map(([subtopic]) => subtopic);
}

/** Simple, honest fallback scorer for short-answer/problem questions when the
 * AI evaluator is unavailable (Section 7 - "must not let an AI response
 * break the assessment"). Counts how many expected concepts appear
 * (case-insensitive substring match) in the student's answer and awards
 * proportional credit - a transparent, non-fabricated heuristic, not a
 * simulated AI judgement. */
export function keywordFallbackScore(answerText: string, expectedConcepts: string[], maxScore: number): { earned: number; matchedConcepts: string[] } {
  const normalized = (answerText || '').toLowerCase();
  const matched = expectedConcepts.filter((c) => normalized.includes(c.toLowerCase().split(' ').slice(0, 3).join(' ')) || normalized.includes(c.toLowerCase()));
  const ratio = expectedConcepts.length > 0 ? matched.length / expectedConcepts.length : 0;
  return { earned: Math.round(ratio * maxScore * 100) / 100, matchedConcepts: matched };
}
