/**
 * Adaptive Learning Path Engine.
 *
 * This is the ONLY thing that decides topic ORDER. The LLM (see
 * services/llm.service.ts) only explains/personalizes whatever sequence
 * this function produces - it never sees the prerequisite graph and is
 * explicitly instructed not to reorder anything (see the LLM system
 * prompt). This separation is the core academic contribution the spec
 * calls out repeatedly (Section 11, Section 17).
 *
 * Algorithm:
 *   1. Start from the student's weak/needs-improvement/developing topics,
 *      worst status first (see mastery.service.ts rankWeakTopics).
 *   2. For each one, walk its prerequisite chain and insert every
 *      prerequisite BEFORE it - even an already-Mastered prerequisite
 *      gets a short "revision" step if it unlocks a weak topic (this
 *      matches the spec's worked example: Arrays stays in the path as
 *      "Arrays Revision" even at 80% Mastered, because Linked Lists
 *      depends on it).
 *   3. Deduplicate - a topic that is a prerequisite for two different
 *      weak topics only appears once, at its earliest required position.
 *   4. Fully-mastered topics that are NOT a prerequisite for anything
 *      weak are left out entirely.
 */

import { CourseCode, PREREQUISITES } from '../data/topicMapping';
import { MasteryStatus, RankedTopic } from './mastery.service';

export interface TopicMasterySnapshot {
  topic: string;
  score: number;
  status: MasteryStatus;
}

export interface LearningPathItem {
  topic: string;
  sequenceOrder: number;
  isRevision: boolean; // true if this topic is already Mastered but included as a prerequisite
  status: MasteryStatus;
  estimatedMinutes: number;
}

const ESTIMATED_MINUTES: Record<MasteryStatus, number> = {
  'Weak/Critical': 25,
  'Needs Improvement': 20,
  Developing: 15,
  Mastered: 10, // revision-only step
};

/**
 * Computes each topic's depth in the prerequisite chain (0 = no
 * prerequisite). Used to guarantee every prerequisite is scheduled
 * strictly before anything that depends on it, regardless of tie-break
 * order within the same depth.
 */
function computeDepth(topic: string, prereqMap: Record<string, string | null>, cache = new Map<string, number>()): number {
  if (cache.has(topic)) return cache.get(topic)!;
  const prereq = prereqMap[topic];
  const depth = prereq ? computeDepth(prereq, prereqMap, cache) + 1 : 0;
  cache.set(topic, depth);
  return depth;
}

export function generateLearningPath(
  course: CourseCode,
  weakTopics: RankedTopic[],
  allMastery: TopicMasterySnapshot[]
): LearningPathItem[] {
  const prereqMap = PREREQUISITES[course];
  const masteryByTopic = new Map(allMastery.map((m) => [m.topic, m]));

  // 1. Collect the full required set: every weak topic plus every
  //    ancestor in its prerequisite chain (transitively), deduplicated.
  const required = new Set<string>();
  function collectAncestors(topic: string) {
    if (required.has(topic)) return;
    required.add(topic);
    const prereq = prereqMap[topic];
    if (prereq) collectAncestors(prereq);
  }
  for (const weak of weakTopics) collectAncestors(weak.topic);

  // 2. Build a sortable record per required topic.
  const depthCache = new Map<string, number>();
  const records = [...required].map((topic) => {
    const snapshot = masteryByTopic.get(topic);
    // No mastery record at all (never diagnosed) is treated as needing full
    // attention, NOT as a quick revision - only an actual Mastered score
    // downgrades a prerequisite step to "revision".
    const status = snapshot?.status ?? 'Weak/Critical';
    const isRevision = status === 'Mastered';
    return {
      topic,
      status,
      score: snapshot?.score ?? 0,
      isRevision,
      depth: computeDepth(topic, prereqMap, depthCache),
    };
  });

  // 3. Sort: prerequisite depth first (this alone guarantees topological
  //    validity - a topic's depth is always greater than its
  //    prerequisite's). Within the same depth: revision-only steps
  //    before genuinely-weak steps (clear foundational review first),
  //    then worst score first among genuinely-weak topics at that depth.
  records.sort((a, b) => {
    if (a.depth !== b.depth) return a.depth - b.depth;
    if (a.isRevision !== b.isRevision) return a.isRevision ? -1 : 1;
    return a.score - b.score;
  });

  return records.map((r, index) => ({
    topic: r.topic,
    sequenceOrder: index + 1,
    isRevision: r.isRevision,
    status: r.status,
    estimatedMinutes: ESTIMATED_MINUTES[r.status],
  }));
}
