/**
 * Tests for the two pure-logic services. No Express, no Prisma, no
 * network - runs with: tsc --outDir dist && node dist/tests/core.test.js
 * (or `npm test` once ts-jest is installed - see package.json).
 */

// Minimal ambient shim so this file compiles standalone without @types/node
// (this sandbox has no internet access to install it; the real project's
// tsconfig should include @types/node normally - see package.json).
declare const process: { exit: (code: number) => void };

import { calculateTopicScores, rankWeakTopics, classifyStatus, AnswerRecord } from '../src/services/mastery.service';
import { generateLearningPath, TopicMasterySnapshot } from '../src/services/adaptiveEngine.service';

let passed = 0;
let failed = 0;

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
    console.log(`PASS: ${label}`);
  } else {
    failed++;
    console.log(`FAIL: ${label}\n  expected: ${e}\n  actual:   ${a}`);
  }
}

// ---------------------------------------------------------------------
// classifyStatus - boundary tests against the spec's exact thresholds
// ---------------------------------------------------------------------
assertEqual(classifyStatus(80), 'Mastered', 'classifyStatus(80) = Mastered');
assertEqual(classifyStatus(79), 'Developing', 'classifyStatus(79) = Developing');
assertEqual(classifyStatus(60), 'Developing', 'classifyStatus(60) = Developing');
assertEqual(classifyStatus(59), 'Needs Improvement', 'classifyStatus(59) = Needs Improvement');
assertEqual(classifyStatus(40), 'Needs Improvement', 'classifyStatus(40) = Needs Improvement');
assertEqual(classifyStatus(39), 'Weak/Critical', 'classifyStatus(39) = Weak/Critical');
assertEqual(classifyStatus(0), 'Weak/Critical', 'classifyStatus(0) = Weak/Critical');

// ---------------------------------------------------------------------
// calculateTopicScores - the spec's own DSA demo numbers
// (Arrays 80%, Linked List 35%, Recursion 40%, Trees 30%)
// ---------------------------------------------------------------------
function buildAnswers(topic: string, correct: number, total: number): AnswerRecord[] {
  const arr: AnswerRecord[] = [];
  for (let i = 0; i < total; i++) arr.push({ topic, isCorrect: i < correct });
  return arr;
}

const demoAnswers: AnswerRecord[] = [
  ...buildAnswers('Arrays', 8, 10),
  ...buildAnswers('Linked Lists', 7, 20), // 35%
  ...buildAnswers('Recursion', 4, 10), // 40%
  ...buildAnswers('Trees', 3, 10), // 30%
];

const scores = calculateTopicScores(demoAnswers);
assertEqual(scores['Arrays'].score, 80, 'Arrays score = 80');
assertEqual(scores['Arrays'].status, 'Mastered', 'Arrays status = Mastered');
assertEqual(scores['Linked Lists'].score, 35, 'Linked Lists score = 35');
assertEqual(scores['Linked Lists'].status, 'Weak/Critical', 'Linked Lists status = Weak/Critical');
assertEqual(scores['Recursion'].score, 40, 'Recursion score = 40');
assertEqual(scores['Recursion'].status, 'Needs Improvement', 'Recursion status = Needs Improvement');
assertEqual(scores['Trees'].score, 30, 'Trees score = 30');
assertEqual(scores['Trees'].status, 'Weak/Critical', 'Trees status = Weak/Critical');

// ---------------------------------------------------------------------
// rankWeakTopics - worst-first, Mastered excluded
// ---------------------------------------------------------------------
const ranked = rankWeakTopics(scores);
assertEqual(
  ranked.map((r) => r.topic),
  ['Trees', 'Linked Lists', 'Recursion'],
  'rankWeakTopics orders Weak/Critical (worst score first: Trees 30 before Linked Lists 35) before Needs Improvement, excludes Mastered'
);

// ---------------------------------------------------------------------
// generateLearningPath - the spec's exact worked example:
// "Arrays Revision -> Linked List Basics/Operations -> Recursion -> Trees"
// At canonical-topic granularity this should produce:
// Arrays (revision) -> Linked Lists -> Recursion -> Trees
// ---------------------------------------------------------------------
const allMastery: TopicMasterySnapshot[] = [
  { topic: 'Arrays', score: 80, status: 'Mastered' },
  { topic: 'Linked Lists', score: 35, status: 'Weak/Critical' },
  { topic: 'Recursion', score: 40, status: 'Needs Improvement' },
  { topic: 'Trees', score: 30, status: 'Weak/Critical' },
];

const path = generateLearningPath('DSA', ranked, allMastery);
// Depth 0 (no prerequisite): Arrays (revision, Mastered) and Recursion (genuinely weak) -
//   revision-before-weak tiebreak puts Arrays first.
// Depth 1: Trees and Linked Lists - both genuinely weak, worst score first (Trees 30 < Linked Lists 35).
assertEqual(
  path.map((p) => p.topic),
  ['Arrays', 'Recursion', 'Trees', 'Linked Lists'],
  'generateLearningPath: depth-0 topics scheduled before depth-1 topics regardless of severity (guarantees prerequisites always precede dependents); within depth 0, the Mastered revision step (Arrays) is scheduled before the genuinely-weak Recursion; within depth 1, Trees (score 30) is scheduled before Linked Lists (score 35)'
);
assertEqual(path[0].isRevision, true, 'Arrays step is flagged as revision (already Mastered)');
assertEqual(path.find((p) => p.topic === 'Recursion')?.isRevision, false, 'Recursion step is NOT flagged as revision (it is genuinely weak, just also a prerequisite)');

// ---------------------------------------------------------------------
// Follow-up scenario: Linked Lists improves 35% -> 85%, path should shrink
// ---------------------------------------------------------------------
const updatedMastery: TopicMasterySnapshot[] = [
  { topic: 'Arrays', score: 80, status: 'Mastered' },
  { topic: 'Linked Lists', score: 85, status: 'Mastered' },
  { topic: 'Recursion', score: 40, status: 'Needs Improvement' },
  { topic: 'Trees', score: 30, status: 'Weak/Critical' },
];
const updatedRanked = rankWeakTopics(
  Object.fromEntries(updatedMastery.map((m) => [m.topic, { ...m, correct: 0, total: 0 }]))
);
const updatedPath = generateLearningPath('DSA', updatedRanked, updatedMastery);
assertEqual(
  updatedPath.map((p) => p.topic),
  ['Recursion', 'Trees'],
  'After Linked Lists reaches Mastered and is no longer anyone\'s unmet prerequisite, the regenerated path drops both Arrays and Linked Lists entirely'
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
