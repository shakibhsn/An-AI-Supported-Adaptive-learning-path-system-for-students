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
