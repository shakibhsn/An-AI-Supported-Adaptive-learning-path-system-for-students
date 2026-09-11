/**
 * Adaptive question-difficulty selection (Section 9-11).
 *
 * Deliberately framework/database-free (same pattern as mastery.service.ts)
 * so the decision rule can be unit tested and explained without Express or
 * Prisma. The controller layer feeds it real PracticeQuestionAttempt history
 * and gets back a recommendation + an explainable reason string.
 *
 * Rule (matches the spec's worked examples exactly):
 *   - Needs a MINIMUM number of recent attempts AT THE CURRENT DIFFICULTY
 *     before it will move at all - a single question never changes anything.
 *   - Looks at a bounded recent WINDOW (not all-time history), so an old
 *     slump/streak doesn't permanently pin the difficulty.
 *   - >= PROMOTE_THRESHOLD accuracy in the window -> move up one tier.
 *   - <  DEMOTE_THRESHOLD accuracy in the window -> move down one tier.
 *   - Otherwise stay put.
 */

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export const ADAPTIVE_CONFIG = {
  MIN_ATTEMPTS: 3,
  WINDOW_SIZE: 6,
  PROMOTE_THRESHOLD: 0.8,
  DEMOTE_THRESHOLD: 0.5,
} as const;

const ORDER: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

export interface AttemptRecord {
  difficulty: Difficulty;
  isCorrect: boolean;
}

export interface DifficultyRecommendation {
  currentDifficulty: Difficulty;
  recommendedDifficulty: Difficulty;
  changed: boolean;
  direction: 'promote' | 'demote' | 'hold';
  sampleSize: number;
  accuracy: number | null; // null when sampleSize < MIN_ATTEMPTS
  reason: string;
}

/**
 * `history` should be the student's attempts on this topic, most-recent-last
 * (any order is fine - this function sorts nothing, so pass them in
 * attemptedAt order). `currentDifficulty` is whatever tier the student was
 * most recently served (default MEDIUM for a topic with no history yet).
 */
export function recommendDifficulty(history: AttemptRecord[], currentDifficulty: Difficulty = 'MEDIUM'): DifficultyRecommendation {
  const atCurrent = history.filter((a) => a.difficulty === currentDifficulty);
  const window = atCurrent.slice(-ADAPTIVE_CONFIG.WINDOW_SIZE);
  const sampleSize = window.length;

  if (sampleSize < ADAPTIVE_CONFIG.MIN_ATTEMPTS) {
    return {
      currentDifficulty,
      recommendedDifficulty: currentDifficulty,
      changed: false,
      direction: 'hold',
      sampleSize,
      accuracy: null,
      reason: `Only ${sampleSize} recent ${currentDifficulty} attempt${sampleSize === 1 ? '' : 's'} on record - need at least ${ADAPTIVE_CONFIG.MIN_ATTEMPTS} before adjusting difficulty.`,
    };
  }

  const correct = window.filter((a) => a.isCorrect).length;
  const accuracy = Math.round((correct / sampleSize) * 1000) / 1000;
  const pct = Math.round(accuracy * 100);
  const idx = ORDER.indexOf(currentDifficulty);

  if (accuracy >= ADAPTIVE_CONFIG.PROMOTE_THRESHOLD && idx < ORDER.length - 1) {
    const next = ORDER[idx + 1];
    return {
      currentDifficulty, recommendedDifficulty: next, changed: true, direction: 'promote', sampleSize, accuracy,
      reason: `${pct}% accuracy on your last ${sampleSize} ${currentDifficulty} questions is at or above the ${Math.round(ADAPTIVE_CONFIG.PROMOTE_THRESHOLD * 100)}% mastery bar for this tier - moving up to ${next}.`,
    };
  }

  if (accuracy < ADAPTIVE_CONFIG.DEMOTE_THRESHOLD && idx > 0) {
    const prev = ORDER[idx - 1];
    return {
      currentDifficulty, recommendedDifficulty: prev, changed: true, direction: 'demote', sampleSize, accuracy,
      reason: `${pct}% accuracy on your last ${sampleSize} ${currentDifficulty} questions is below the ${Math.round(ADAPTIVE_CONFIG.DEMOTE_THRESHOLD * 100)}% floor for this tier - stepping back to ${prev} for more targeted concept revision.`,
    };
  }

  return {
    currentDifficulty, recommendedDifficulty: currentDifficulty, changed: false, direction: 'hold', sampleSize, accuracy,
    reason: `${pct}% accuracy on your last ${sampleSize} ${currentDifficulty} questions is steady - staying at ${currentDifficulty}.`,
  };
}
