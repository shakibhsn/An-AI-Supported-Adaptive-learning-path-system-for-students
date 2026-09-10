/**
 * Topic mastery calculation.
 *
 * Deliberately framework/database-free so it can be unit tested in
 * isolation (see tests/mastery.test.ts) and explained to a supervisor
 * without reference to Express or Prisma at all.
 *
 * Thresholds match Section 10 of the implementation spec:
 *   80-100 = Mastered
 *   60-79  = Developing
 *   40-59  = Needs Improvement
 *   0-39   = Weak/Critical
 * Kept as named constants (not magic numbers) so they stay configurable,
 * per the spec's explicit "keep threshold values configurable" instruction.
 */

export const MASTERY_THRESHOLDS = {
  MASTERED: 80,
  DEVELOPING: 60,
  NEEDS_IMPROVEMENT: 40,
} as const;

export type MasteryStatus = 'Mastered' | 'Developing' | 'Needs Improvement' | 'Weak/Critical';

export function classifyStatus(score: number): MasteryStatus {
  if (score < 0 || score > 100) {
    throw new Error(`score must be between 0 and 100, got ${score}`);
  }
  if (score >= MASTERY_THRESHOLDS.MASTERED) return 'Mastered';
  if (score >= MASTERY_THRESHOLDS.DEVELOPING) return 'Developing';
  if (score >= MASTERY_THRESHOLDS.NEEDS_IMPROVEMENT) return 'Needs Improvement';
  return 'Weak/Critical';
}

export interface AnswerRecord {
  topic: string;
  isCorrect: boolean;
}

export interface TopicScore {
  topic: string;
  correct: number;
  total: number;
  score: number; // 0-100, rounded to 1 decimal
  status: MasteryStatus;
}

/**
 * Groups answers by topic and computes a 0-100 percentage score + status
 * for each topic. This is the ONLY place topic-level scoring logic lives -
 * both the diagnostic and follow-up endpoints call this.
 */
export function calculateTopicScores(answers: AnswerRecord[]): Record<string, TopicScore> {
  const tally: Record<string, { correct: number; total: number }> = {};

  for (const ans of answers) {
    if (!tally[ans.topic]) tally[ans.topic] = { correct: 0, total: 0 };
    tally[ans.topic].total += 1;
    if (ans.isCorrect) tally[ans.topic].correct += 1;
  }

  const result: Record<string, TopicScore> = {};
  for (const [topic, counts] of Object.entries(tally)) {
    const score = counts.total > 0 ? Math.round((counts.correct / counts.total) * 1000) / 10 : 0;
    result[topic] = {
      topic,
      correct: counts.correct,
      total: counts.total,
      score,
      status: classifyStatus(score),
    };
  }
  return result;
}

/**
 * Blends a fresh practice observation into an existing mastery score.
 *
 * A diagnostic and a follow-up assessment REPLACE the mastery score (they
 * are formal, answer-once assessments). Practice is different: it shows the
 * answer immediately and can be retaken, so a single practice run should
 * nudge mastery toward the observed score rather than overwrite it. Recent
 * performance is weighted higher (0.6) than the prior score (0.4).
 * If there is no prior score, the observation stands on its own.
 */
export const PRACTICE_RECENCY_WEIGHT = 0.6;

export function blendMastery(previous: number | null | undefined, observed: number): number {
  if (previous === null || previous === undefined) return Math.round(observed * 10) / 10;
  const blended = (1 - PRACTICE_RECENCY_WEIGHT) * previous + PRACTICE_RECENCY_WEIGHT * observed;
  return Math.round(blended * 10) / 10;
}

export interface RankedTopic {
  topic: string;
  score: number;
  status: MasteryStatus;
}

/**
 * Ranks non-mastered topics worst-first. Used both for display
 * ("Learning Gap Analysis") and as raw input to the adaptive engine.
 */
export function rankWeakTopics(topicScores: Record<string, TopicScore>): RankedTopic[] {
  const severity: Record<MasteryStatus, number> = {
    'Weak/Critical': 0,
    'Needs Improvement': 1,
    'Developing': 2,
    'Mastered': 3,
  };

  return Object.values(topicScores)
    .filter((t) => t.status !== 'Mastered')
    .map((t) => ({ topic: t.topic, score: t.score, status: t.status }))
    .sort((a, b) => severity[a.status] - severity[b.status] || a.score - b.score);
}
