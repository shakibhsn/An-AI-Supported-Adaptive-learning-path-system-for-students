/**
 * Explainable recommendation reasons (Section 15).
 *
 * Pure, framework-free functions (same pattern as mastery.service.ts) that
 * turn real mastery/activity numbers into a plain-English "why" string. The
 * LLM is allowed to rephrase this text for tone, but the underlying reason
 * - the threshold crossed, the prerequisite relationship - always comes
 * from here, never from the model's own judgment.
 */

import { MASTERY_THRESHOLDS, MasteryStatus } from './mastery.service';

export function reasonForWeakTopic(topic: string, score: number, status: MasteryStatus, isPrerequisiteFor?: string | null): string {
  const bar = MASTERY_THRESHOLDS.MASTERED;
  let reason = `Your latest assessment score for ${topic} is ${score}%, which is below the ${bar}% mastery threshold (currently rated "${status}").`;
  if (isPrerequisiteFor) {
    reason += ` ${topic} is also a prerequisite for ${isPrerequisiteFor}, so strengthening it first unlocks that next topic.`;
  }
  return reason;
}

export function reasonForRevisionTopic(topic: string, score: number, unlocksTopic: string): string {
  return `${topic} is already Mastered (${score}%), but it's included as a quick revision step because ${unlocksTopic} depends on it and benefits from a refresher first.`;
}

/**
 * Section 15's second example: activity is high but accuracy is low ->
 * recommend more practice, explicitly. Only fires when there's enough
 * activity data to say something meaningful (avoids overclaiming from a
 * single session).
 */
export function reasonForPracticeRecommendation(topic: string, activityMinutes: number, practiceAccuracy: number | null): string | null {
  if (practiceAccuracy === null) return null;
  if (activityMinutes >= 20 && practiceAccuracy < 60) {
    return `You've spent ${activityMinutes} minutes on ${topic}'s learning materials, but your practice accuracy is still ${practiceAccuracy}%. Reviewing the material clearly hasn't fully translated into practice yet - more targeted practice on ${topic} is recommended.`;
  }
  return null;
}

export interface PathComparisonEntry {
  topic: string;
  status: 'carried_over' | 'completed' | 'new' | 'removed';
  sequenceOrder?: number;
}

/**
 * Compares two ordered topic-name lists (previous path vs. current path) and
 * classifies each topic (Section 16). "completed" means it was in the
 * previous path but is gone from the current one AND the topic is now
 * Mastered (as opposed to just having fallen out of the weak-topic set for
 * another reason) - callers pass masteredTopics to distinguish the two.
 */
export function comparePaths(previous: string[], current: string[], masteredTopics: Set<string>): PathComparisonEntry[] {
  const currentSet = new Set(current);
  const previousSet = new Set(previous);
  const entries: PathComparisonEntry[] = [];

  for (const topic of previous) {
    if (currentSet.has(topic)) continue; // still present, reported below with current's ordering
    entries.push({ topic, status: masteredTopics.has(topic) ? 'completed' : 'removed' });
  }
  current.forEach((topic, i) => {
    entries.push({ topic, status: previousSet.has(topic) ? 'carried_over' : 'new', sequenceOrder: i + 1 });
  });
  return entries;
}
