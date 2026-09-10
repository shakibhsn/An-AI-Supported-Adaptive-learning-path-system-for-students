/**
 * Canonical topic mapping.
 *
 * WHY THIS FILE EXISTS:
 * The original frontend used a different, more granular topic label on
 * almost every question (e.g. "Linked List Head Insertion", "Deletion at
 * Head", "Pointer Traversal" are all really about ONE concept: Linked
 * Lists). If each of those became a separate database Topic, every
 * topic would have exactly one question and "mastery percentage" would
 * just be 0% or 100% per topic - meaningless for the diagnostic/adaptive
 * system the spec describes.
 *
 * This file consolidates the 24-38 raw labels per course down to a
 * sensible canonical topic list (matching the 10 diagnostic-quiz topics
 * per course, with DSA's near-duplicate Linked-List/Tree labels merged),
 * and maps every practice/follow-up question's raw topic onto one of
 * those canonical topics. The mapping was built by reading each
 * question's actual text (not just guessing from the label) - see the
 * project handoff notes for the verification done on DSA follow-up
 * questions specifically.
 *
 * Nothing here is invented data: every question's TEXT, OPTIONS, and
 * CORRECT ANSWER are taken verbatim from the uploaded frontend. Only the
 * topic GROUPING is a new (documented) decision.
 */

export type CourseCode = 'DSA' | 'OOP' | 'SPL';

export const CANONICAL_TOPICS: Record<CourseCode, string[]> = {
  DSA: ['Arrays', 'Linked Lists', 'Stacks', 'Queues', 'Recursion', 'Trees', 'Graphs', 'Hashing'],
  OOP: [
    'Encapsulation', 'Access Modifiers', 'Inheritance', 'Polymorphism', 'Overloading',
    'Abstract Classes', 'Interfaces', 'Constructors', 'Static Members', 'Exception Handling',
  ],
  SPL: [
    'Data Types', 'Pointers', 'Dereferencing', 'Arrays & Pointers', 'Dynamic Memory',
    'Deallocation', 'Strings', 'Structures', 'Storage Classes', 'Call Stack',
  ],
};

// Prerequisite graph: topic -> the ONE topic that should be mastered first (or null).
// This is what the deterministic Adaptive Learning Path Engine reads - the LLM never sees or edits this.
export const PREREQUISITES: Record<CourseCode, Record<string, string | null>> = {
  DSA: {
    'Arrays': null,
    'Linked Lists': 'Arrays',
    'Stacks': 'Arrays',
    'Queues': 'Arrays',
    'Recursion': null,
    'Trees': 'Recursion',
    'Graphs': 'Trees',
    'Hashing': 'Arrays',
  },
  OOP: {
    'Access Modifiers': null,
    'Encapsulation': 'Access Modifiers',
    'Constructors': null,
    'Inheritance': 'Encapsulation',
    'Polymorphism': 'Inheritance',
    'Overloading': null,
    'Abstract Classes': 'Inheritance',
    'Interfaces': 'Abstract Classes',
    'Static Members': null,
    'Exception Handling': null,
  },
  SPL: {
    'Data Types': null,
    'Pointers': 'Data Types',
    'Dereferencing': 'Pointers',
    'Arrays & Pointers': 'Pointers',
    'Dynamic Memory': 'Pointers',
    'Deallocation': 'Dynamic Memory',
    'Strings': 'Arrays & Pointers',
    'Structures': 'Data Types',
    'Storage Classes': 'Data Types',
    'Call Stack': null,
  },
};

// Raw topic label (as it appears in the original frontend) -> canonical topic name.
// Diagnostic-quiz labels map to themselves except where two near-duplicates were merged.
export const TOPIC_LABEL_MAP: Record<CourseCode, Record<string, string>> = {
  DSA: {
    // diagnostic labels
    'Arrays & Complexity': 'Arrays',
    'Singly Linked Lists': 'Linked Lists',
    'Linked List Operations': 'Linked Lists',
    'Stack Data Structure': 'Stacks',
    'Queue Operations': 'Queues',
    'Recursion': 'Recursion',
    'Binary Search Trees': 'Trees',
    'Tree Height': 'Trees',
    'Graph Traversals': 'Graphs',
    'Hashing': 'Hashing',
    // practice labels
    'Linked List Insertion': 'Linked Lists',
    'Traversal Loop': 'Linked Lists',
    'Deletion at Head': 'Linked Lists',
    'Stack Postfix Evaluation': 'Stacks',
    'Recursion Base Condition': 'Recursion',
    'BST Traversal': 'Trees',
    'BST Complexity': 'Trees',
    'Breadth-First Search (BFS)': 'Graphs',
    'Hash Collisions': 'Hashing',
    // follow-up labels (verified against question text - all genuinely Linked Lists)
    'Linked List Head Insertion': 'Linked Lists',
    'Deletion Time Complexity': 'Linked Lists',
    'Pointer Traversal': 'Linked Lists',
    'Empty List Detection': 'Linked Lists',
    'Memory Leak Remediation': 'Linked Lists',
  },
  OOP: {
    'Encapsulation': 'Encapsulation',
    'Access Modifiers': 'Access Modifiers',
    'Inheritance': 'Inheritance',
    'Polymorphism': 'Polymorphism',
    'Overloading': 'Overloading',
    'Abstract Classes': 'Abstract Classes',
    'Interfaces': 'Interfaces',
    'Constructors': 'Constructors',
    'Static Members': 'Static Members',
    'Exception Handling': 'Exception Handling',
    'Constructor Chaining': 'Constructors',
    'Method Overloading': 'Overloading',
    'Final Keyword': 'Inheritance',
    'Dynamic Method Dispatch': 'Polymorphism',
    'Interface Contracts': 'Interfaces',
    'Constructor Chaining (super)': 'Constructors',
    'Virtual Method Table (VTable)': 'Polymorphism',
    'Encapsulation & Mutators': 'Encapsulation',
  },
  SPL: {
    'Data Types': 'Data Types',
    'Pointers': 'Pointers',
    'Dereferencing': 'Dereferencing',
    'Arrays & Pointers': 'Arrays & Pointers',
    'Dynamic Memory': 'Dynamic Memory',
    'Deallocation': 'Deallocation',
    'Strings': 'Strings',
    'Structures': 'Structures',
    'Storage Classes': 'Storage Classes',
    'Call Stack': 'Call Stack',
    'Pointer Arithmetic': 'Pointers',
    'Array & Pointer Equivalence': 'Arrays & Pointers',
    'Deallocation Safety': 'Deallocation',
    'Pass by Reference': 'Pointers',
    'Structure Pointers': 'Structures',
    'Static Variables': 'Storage Classes',
    'Memory Leaks': 'Deallocation',
    'Pointer Arithmetic Byte Scaling': 'Pointers',
    'Dynamic Heap Allocation Safety': 'Dynamic Memory',
    'Dangling Pointer Elimination': 'Deallocation',
    'Dereference vs Address-of': 'Dereferencing',
    'Struct Pointer Member Access': 'Structures',
  },
};
