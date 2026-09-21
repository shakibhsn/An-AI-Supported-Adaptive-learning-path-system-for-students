/**
 * Randomized Adaptive Assessment question bank.
 *
 * Separate from expandedQuestions.ts (which feeds the existing rolling-window
 * adaptive PRACTICE feature - untouched). This file feeds the new level-locked
 * ASSESSMENT feature (assessment.service.ts / assessment.controller.ts):
 * fixed-size 10-question tests per difficulty tier, gated by a hard
 * pass-threshold before the next tier unlocks.
 *
 * Representative topic first (per the phased rollout plan): DSA/Arrays gets
 * the full 30 questions (10 EASY + 10 MEDIUM + 10 HARD, each tier 6 MCQ +
 * 2 SHORT_ANSWER + 2 PROBLEM_SOLVING = 30 total, 18 MCQ + 6 SA + 6 PS). All
 * content is real, verifiable CS fundamentals - nothing fabricated. More
 * topics can be added to this file later without touching the assessment
 * engine (it reads whatever exists per course+topic+difficulty).
 */

import { CourseCode } from './topicMapping';

export type AssessDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type AssessType = 'MCQ' | 'SHORT_ANSWER' | 'PROBLEM_SOLVING';

export interface AssessQuestion {
  topic: string;
  subtopic: string;
  difficulty: AssessDifficulty;
  questionType: AssessType;
  question: string;
  // MCQ only
  options?: { letter: string; text: string }[];
  correctAnswer?: string;
  explanation?: string;
  // SHORT_ANSWER / PROBLEM_SOLVING only
  expectedConcepts?: string[];
  maxScore?: number;
}

function mcq(
  subtopic: string,
  difficulty: AssessDifficulty,
  question: string,
  opts: [string, string, string, string],
  correctAnswer: string,
  explanation: string,
): AssessQuestion {
  const letters = ['A', 'B', 'C', 'D'];
  return {
    topic: 'Arrays',
    subtopic,
    difficulty,
    questionType: 'MCQ',
    question,
    options: opts.map((text, i) => ({ letter: letters[i], text })),
    correctAnswer,
    explanation,
    maxScore: 1,
  };
}

function sa(subtopic: string, difficulty: AssessDifficulty, question: string, expectedConcepts: string[]): AssessQuestion {
  return { topic: 'Arrays', subtopic, difficulty, questionType: 'SHORT_ANSWER', question, expectedConcepts, maxScore: 2 };
}

function prob(subtopic: string, difficulty: AssessDifficulty, question: string, expectedConcepts: string[]): AssessQuestion {
  return { topic: 'Arrays', subtopic, difficulty, questionType: 'PROBLEM_SOLVING', question, expectedConcepts, maxScore: 5 };
}

const ARRAYS_QUESTIONS: AssessQuestion[] = [
  // ===== EASY (10: 6 MCQ + 2 SA + 2 PS) =====
  mcq('Traversal', 'EASY', 'In C, Java, and Python, the index of the first element of an array is:',
    ['0', '1', '-1', 'Depends on array size'], 'A', 'These languages use zero-based indexing: the first element is at index 0.'),
  mcq('Traversal', 'EASY', 'What is the time complexity of accessing an element by index in an array (e.g. arr[i])?',
    ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'], 'A', 'Arrays store elements contiguously, so the address of arr[i] is computed directly from the base address and index - constant time.'),
  mcq('Searching', 'EASY', 'What is the worst-case time complexity of linear search on an unsorted array of n elements?',
    ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 'C', 'Linear search checks each element one by one; in the worst case (target at the end or absent) it checks all n elements.'),
  mcq('Insertion', 'EASY', 'Assuming there is free capacity at the end, what is the time complexity of inserting a new element at the END of an array?',
    ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'], 'A', 'No existing elements need to move - the new value is simply placed at the next free slot.'),
  mcq('Deletion', 'EASY', 'What is the time complexity of deleting the LAST element of an array?',
    ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'], 'A', 'Removing the last element just decreases the count/size - no other elements need to shift.'),
  mcq('Traversal', 'EASY', 'Which of the following best describes "traversing" an array?',
    ['Sorting all elements', 'Visiting every element once, typically in order', 'Deleting every element', 'Searching for the maximum value only'], 'B',
    'Traversal means systematically visiting each element of the array, usually from the first index to the last.'),
  sa('Traversal', 'EASY', 'What does it mean to traverse an array, and how is it typically done?',
    ['visit each element', 'sequential or systematic order', 'usually start to end', 'loop/iteration']),
  sa('Searching', 'EASY', 'What is linear search and how does it work?',
    ['check each element one by one', 'compare each element to the target', 'stop when found or end of array reached', 'sequential']),
  prob('Insertion', 'EASY', 'Describe, step by step, how to insert a new value at a given index in a fixed-size array that already has empty capacity at the end.',
    ['shift elements after the index one position right', 'start shifting from the last element to avoid overwriting', 'place the new value at the target index', 'increase the count/size']),
  prob('Deletion', 'EASY', 'Describe, step by step, how to delete the element at a given index from an array so there is no gap afterward.',
    ['shift elements after the index one position left', 'overwrite the deleted slot', 'decrease the count/size']),

  // ===== MEDIUM (10: 6 MCQ + 2 SA + 2 PS) =====
  mcq('Searching', 'MEDIUM', 'What precondition must hold for binary search to work correctly?',
    ['The array must be sorted', 'The array must contain only integers', 'The array must have an even number of elements', 'The array must be a dynamic array'], 'A',
    'Binary search relies on comparing the target to the middle element and discarding half the range - this only produces a correct answer if the array is sorted.'),
  mcq('Searching', 'MEDIUM', 'What is the time complexity of binary search on a sorted array of n elements?',
    ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 'B', 'Each comparison eliminates half of the remaining search range, giving logarithmic time complexity.'),
  mcq('Insertion', 'MEDIUM', 'What is the time complexity of inserting an element into the MIDDLE of an array with n elements?',
    ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'], 'C', 'All elements after the insertion point must shift one position to the right, which takes linear time.'),
  mcq('Deletion', 'MEDIUM', 'What is the time complexity of deleting an element from the MIDDLE of an array with n elements?',
    ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'], 'C', 'All elements after the deleted position must shift one position to the left, which takes linear time.'),
  mcq('Traversal', 'MEDIUM', 'What is the time complexity of fully traversing a 2D array with m rows and n columns using nested loops?',
    ['O(m + n)', 'O(m * n)', 'O(log(m * n))', 'O(m)'], 'B', 'A nested loop visiting every cell performs m * n total visits, one per element.'),
  mcq('Searching', 'MEDIUM', 'In the worst case, how many comparisons does binary search need on a sorted array of 16 elements?',
    ['2', '4', '8', '16'], 'B', 'log2(16) = 4 - each comparison halves the search space: 16 -> 8 -> 4 -> 2 -> 1.'),
  sa('Insertion', 'MEDIUM', 'Explain why inserting an element at the BEGINNING of an array is less efficient than inserting at the END.',
    ['shifting required when inserting at the beginning', 'all subsequent elements must move', 'end insertion needs no shifting', 'O(n) versus O(1)']),
  sa('Deletion', 'MEDIUM', 'Explain the tradeoff between deleting an element from an array versus from a linked list.',
    ['array deletion requires shifting remaining elements', 'linked list deletion just relinks pointers', 'array delete is O(n)', 'linked list delete is O(1) once the node is located']),
  prob('Searching', 'MEDIUM', 'Given a sorted array of 8 elements, describe step by step how binary search finds a target value, including what happens to the search range at each step.',
    ['start with the full range', 'compare the target to the middle element', 'narrow to the left half if the target is smaller', 'narrow to the right half if the target is larger', 'repeat until found or the range is empty']),
  prob('Traversal', 'MEDIUM', 'Describe an efficient way to find both the minimum and maximum values in an unsorted array using a single traversal.',
    ['single pass through the array', 'track a running minimum and running maximum', 'compare each element and update min/max as needed', 'O(n) time overall']),

  // ===== HARD (10: 6 MCQ + 2 SA + 2 PS) =====
  mcq('Insertion', 'HARD', 'What is the AMORTIZED time complexity of appending to the end of a dynamic array (e.g. Python list, Java ArrayList) that automatically resizes?',
    ['O(1) amortized', 'O(log n) amortized', 'O(n) amortized', 'O(n^2) amortized'], 'A',
    'Although an individual resize copy is O(n), doubling the capacity means resizes become exponentially rare, so the average (amortized) cost per append is O(1).'),
  mcq('Deletion', 'HARD', 'Which strategy keeps an array\'s elements contiguous (no gaps) immediately after deleting an element from the middle?',
    ['Leaving the slot empty (null)', 'Shifting all subsequent elements left by one', 'Swapping with a random element', 'Marking the whole array as invalid'], 'B',
    'Shifting subsequent elements left by one closes the gap and keeps the array contiguous, at the cost of an O(n) shift.'),
  mcq('Searching', 'HARD', 'Running binary search on an UNSORTED array will:',
    ['Always still find the target correctly, just slower', 'Run in O(1) time by luck', 'Potentially return an incorrect result or miss the target', 'Automatically sort the array first'], 'C',
    'Binary search\'s halving logic assumes sorted order; on unsorted data it can discard the half that actually contains the target, giving a wrong answer.'),
  mcq('Traversal', 'HARD', 'Arrays generally traverse faster in practice than linked lists of the same size mainly because of:',
    ['Arrays being scanned less often', 'Contiguous memory improving CPU cache locality', 'Arrays using less memory in every case', 'Linked lists requiring binary search'], 'B',
    'Because array elements sit next to each other in memory, the CPU cache can prefetch upcoming elements, making sequential traversal significantly faster than chasing pointers scattered in memory.'),
  mcq('Insertion', 'HARD', 'For a dynamic array that doubles its capacity whenever it is full, what is the TOTAL cost of performing n consecutive append operations, from empty?',
    ['O(1)', 'O(n)', 'O(n log n)', 'O(n^2)'], 'B', 'Even though some individual appends trigger an O(n) resize, the doubling strategy means the sum of all resize costs across n appends is still O(n) total (amortized O(1) each).'),
  mcq('Deletion', 'HARD', 'Repeatedly deleting the FIRST element of a large array (one at a time, many times) is inefficient mainly because:',
    ['Each deletion requires shifting all remaining elements left, costing O(n) every time', 'Arrays cannot delete the first element at all', 'It corrupts the array\'s memory', 'It always requires resizing'], 'A',
    'Every front-deletion shifts every remaining element left by one, so repeating it k times costs O(n*k) - far more expensive than removing from the end.'),
  sa('Insertion', 'HARD', 'Explain how dynamic arrays achieve amortized O(1) append even though an individual resize is O(n).',
    ['doubling capacity strategy', 'resizing happens infrequently as the array grows', 'the cost of a resize is spread across many appends', 'most individual appends are O(1)']),
  sa('Searching', 'HARD', 'Why can binary search not be directly applied to a sorted linked list the same way it is applied to a sorted array?',
    ['linked lists lack random/direct access by index', 'reaching the middle node requires sequential traversal', 'this traversal cost removes the O(log n) advantage']),
  prob('Deletion', 'HARD', 'Describe an approach to delete several specified indices from an array in a single efficient pass, rather than deleting them one at a time.',
    ['single pass copying only the kept elements', 'use a write-index/two-pointer technique', 'skip elements marked for deletion', 'avoids repeated shifting for each deletion', 'O(n) total instead of O(n*k)']),
  prob('Traversal', 'HARD', 'Describe how to traverse a 2D array (matrix) to compute the sum of each row and store the results in a separate result array.',
    ['outer loop over each row', 'inner loop over each column summing values', 'accumulate a running row sum', 'store the row sum into the result array at the row\'s index']),
];

export const ASSESSMENT_QUESTIONS: Partial<Record<CourseCode, AssessQuestion[]>> = {
  DSA: ARRAYS_QUESTIONS,
};
