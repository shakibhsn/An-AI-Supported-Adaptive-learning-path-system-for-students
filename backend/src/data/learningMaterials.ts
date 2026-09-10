/**
 * Curated learning materials seed (Section 15 / 16 / 17).
 *
 * DRAFT FOR REVIEW - verify every URL before seeding into a real demo.
 * These are inserted as LearningMaterial rows by prisma/seed.ts. The system
 * is extensible: add/remove entries here (or INSERT rows directly) and the
 * frontend picks them up with no code change. The LLM may only recommend
 * from what's stored here - it never invents a resource (Section 18).
 *
 * Keyed by course code -> canonical topic name (must match CANONICAL_TOPICS
 * in topicMapping.ts) -> ordered list of materials.
 *
 * type:       VIDEO | PLAYLIST | ARTICLE | PRACTICE | DOCUMENT | OTHER
 * difficulty: BEGINNER | INTERMEDIATE | ADVANCED
 */

import { CourseCode } from './topicMapping';

export interface SeedMaterial {
  title: string;
  description: string;
  type: 'VIDEO' | 'PLAYLIST' | 'ARTICLE' | 'PRACTICE' | 'DOCUMENT' | 'OTHER';
  url: string;
  provider: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  durationMinutes?: number;
}

const ABDUL_BARI_DSA = 'https://www.youtube.com/playlist?list=PLsr8vTgyLdy_YndxNcI4WkH5Vorj5qvrv';
const MYCODESCHOOL_DS = 'https://www.youtube.com/playlist?list=PL2_aWCzGMAwI3W_JlcBbtYTwiQSsOTa6P';
// Telusko - "OOP in Java" playlist (covers all 10 OOP topics in one series).
const TELUSKO_OOP = 'https://www.youtube.com/playlist?list=PLsyeobzWxl7oa1WO9n4cP3OY9nOtUcZIg';
// Neso Academy - "C Programming" full course playlist (covers all 10 SPL topics).
const NESO_C = 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRggZZgYpPMUxdY1CYkZtARR';

export const LEARNING_MATERIALS: Record<CourseCode, Record<string, SeedMaterial[]>> = {
  DSA: {
    Arrays: [
      { title: 'Arrays - Data Structure Introduction', description: 'How arrays are laid out in memory and why index access is O(1).', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/array-data-structure/', provider: 'GeeksforGeeks', difficulty: 'BEGINNER' },
      { title: 'Abdul Bari - Arrays & Array ADT', description: 'Board-style walkthrough of arrays, addressing and complexity.', type: 'PLAYLIST', url: ABDUL_BARI_DSA, provider: 'YouTube (Abdul Bari)', difficulty: 'BEGINNER', durationMinutes: 40 },
      { title: 'Programiz - Array Data Structure', description: 'Concise beginner tutorial with C/C++/Java/Python examples.', type: 'ARTICLE', url: 'https://www.programiz.com/dsa/array', provider: 'Programiz', difficulty: 'BEGINNER' },
      { title: 'Practice: Array problems', description: 'Graded array practice set.', type: 'PRACTICE', url: 'https://leetcode.com/tag/array/', provider: 'LeetCode', difficulty: 'INTERMEDIATE' },
    ],
    'Linked Lists': [
      { title: 'Linked List Data Structure', description: 'Nodes, pointers, and why insertion at head is O(1).', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/linked-list-data-structure/', provider: 'GeeksforGeeks', difficulty: 'BEGINNER' },
      { title: 'mycodeschool - Linked List playlist', description: 'The classic intuition-first linked list series in C/C++.', type: 'PLAYLIST', url: MYCODESCHOOL_DS, provider: 'YouTube (mycodeschool)', difficulty: 'BEGINNER', durationMinutes: 90 },
      { title: 'Programiz - Linked List Operations', description: 'Traversal, insertion and deletion with diagrams.', type: 'ARTICLE', url: 'https://www.programiz.com/dsa/linked-list', provider: 'Programiz', difficulty: 'BEGINNER' },
      { title: 'Practice: Linked List problems', description: 'Insertion, deletion, reversal, cycle detection.', type: 'PRACTICE', url: 'https://leetcode.com/tag/linked-list/', provider: 'LeetCode', difficulty: 'INTERMEDIATE' },
    ],
    Stacks: [
      { title: 'Stack Data Structure', description: 'LIFO model, push/pop, and real uses (undo, call stack).', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/stack-data-structure/', provider: 'GeeksforGeeks', difficulty: 'BEGINNER' },
      { title: 'Abdul Bari - Stack ADT & applications', description: 'Stack operations and postfix/infix evaluation.', type: 'PLAYLIST', url: ABDUL_BARI_DSA, provider: 'YouTube (Abdul Bari)', difficulty: 'BEGINNER', durationMinutes: 35 },
      { title: 'Practice: Stack problems', description: 'Balanced parentheses, min-stack, expression evaluation.', type: 'PRACTICE', url: 'https://leetcode.com/tag/stack/', provider: 'LeetCode', difficulty: 'INTERMEDIATE' },
    ],
    Queues: [
      { title: 'Queue Data Structure', description: 'FIFO model, enqueue/dequeue, circular queues.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/queue-data-structure/', provider: 'GeeksforGeeks', difficulty: 'BEGINNER' },
      { title: 'Programiz - Queue Data Structure', description: 'Array and linked-list queue implementations.', type: 'ARTICLE', url: 'https://www.programiz.com/dsa/queue', provider: 'Programiz', difficulty: 'BEGINNER' },
      { title: 'Practice: Queue problems', description: 'Queue via stacks, sliding window, BFS-style practice.', type: 'PRACTICE', url: 'https://leetcode.com/tag/queue/', provider: 'LeetCode', difficulty: 'INTERMEDIATE' },
    ],
    Recursion: [
      { title: 'Introduction to Recursion', description: 'Base case, recursive case, and the call stack.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/introduction-to-recursion-data-structure-and-algorithm-tutorials/', provider: 'GeeksforGeeks', difficulty: 'BEGINNER' },
      { title: 'mycodeschool - Recursion series', description: 'How recursion works with stack diagrams and worked examples.', type: 'PLAYLIST', url: MYCODESCHOOL_DS, provider: 'YouTube (mycodeschool)', difficulty: 'BEGINNER', durationMinutes: 60 },
      { title: 'Practice: Recursion problems', description: 'Factorial, Fibonacci, subsets, string recursion.', type: 'PRACTICE', url: 'https://www.geeksforgeeks.org/practice-questions-for-recursion/', provider: 'GeeksforGeeks', difficulty: 'INTERMEDIATE' },
    ],
    Trees: [
      { title: 'Binary Tree Data Structure', description: 'Tree terminology, traversals, and binary search trees.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/binary-tree-data-structure/', provider: 'GeeksforGeeks', difficulty: 'BEGINNER' },
      { title: 'Abdul Bari - Trees & BST', description: 'Tree height, traversals and BST operations explained on board.', type: 'PLAYLIST', url: ABDUL_BARI_DSA, provider: 'YouTube (Abdul Bari)', difficulty: 'INTERMEDIATE', durationMinutes: 70 },
      { title: 'Practice: Tree problems', description: 'Traversal, height, BST validation, LCA.', type: 'PRACTICE', url: 'https://leetcode.com/tag/tree/', provider: 'LeetCode', difficulty: 'INTERMEDIATE' },
    ],
    Graphs: [
      { title: 'Graph Data Structure and Algorithms', description: 'Representations (adjacency list/matrix) and BFS/DFS.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/', provider: 'GeeksforGeeks', difficulty: 'INTERMEDIATE' },
      { title: 'Abdul Bari - Graph traversals (BFS/DFS)', description: 'Breadth-first and depth-first traversal walkthroughs.', type: 'PLAYLIST', url: ABDUL_BARI_DSA, provider: 'YouTube (Abdul Bari)', difficulty: 'INTERMEDIATE', durationMinutes: 50 },
      { title: 'Practice: Graph problems', description: 'BFS/DFS, connected components, shortest path.', type: 'PRACTICE', url: 'https://leetcode.com/tag/graph/', provider: 'LeetCode', difficulty: 'ADVANCED' },
    ],
    Hashing: [
      { title: 'Hashing Data Structure', description: 'Hash functions, collisions, chaining vs open addressing.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/hashing-data-structure/', provider: 'GeeksforGeeks', difficulty: 'INTERMEDIATE' },
      { title: 'Programiz - Hash Table', description: 'How hash tables achieve average O(1) lookup.', type: 'ARTICLE', url: 'https://www.programiz.com/dsa/hash-table', provider: 'Programiz', difficulty: 'BEGINNER' },
      { title: 'Practice: Hash Table problems', description: 'Two-sum, group anagrams, frequency counting.', type: 'PRACTICE', url: 'https://leetcode.com/tag/hash-table/', provider: 'LeetCode', difficulty: 'INTERMEDIATE' },
    ],
  },

  OOP: {
    Encapsulation: [
      { title: 'Encapsulation in Java', description: 'Private fields, getters/setters and why hiding state matters.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/encapsulation-in-java/', provider: 'GeeksforGeeks', difficulty: 'BEGINNER' },
      { title: 'Telusko - OOP in Java (Encapsulation)', description: 'The encapsulation videos from the OOP-in-Java series.', type: 'PLAYLIST', url: TELUSKO_OOP, provider: 'YouTube (Telusko)', difficulty: 'BEGINNER', durationMinutes: 30 },
      { title: 'Programiz - Java Encapsulation', description: 'Worked example with access control.', type: 'ARTICLE', url: 'https://www.programiz.com/java-programming/encapsulation', provider: 'Programiz', difficulty: 'BEGINNER' },
    ],
    'Access Modifiers': [
      { title: 'Access Modifiers in Java', description: 'public / private / protected / default and their scope.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/access-modifiers-java/', provider: 'GeeksforGeeks', difficulty: 'BEGINNER' },
      { title: 'Telusko - OOP in Java (Access modifiers)', description: 'The access-modifier videos from the OOP-in-Java series.', type: 'PLAYLIST', url: TELUSKO_OOP, provider: 'YouTube (Telusko)', difficulty: 'BEGINNER', durationMinutes: 20 },
      { title: 'Oracle Java Tutorial - Controlling Access', description: 'Official reference for member access levels.', type: 'DOCUMENT', url: 'https://docs.oracle.com/javase/tutorial/java/javaOO/accesscontrol.html', provider: 'Oracle', difficulty: 'BEGINNER' },
    ],
    Inheritance: [
      { title: 'Inheritance in Java', description: 'extends, super, method inheritance, the final keyword.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/inheritance-in-java/', provider: 'GeeksforGeeks', difficulty: 'BEGINNER' },
      { title: 'Telusko - OOP in Java (Inheritance)', description: 'The inheritance videos from the OOP-in-Java series.', type: 'PLAYLIST', url: TELUSKO_OOP, provider: 'YouTube (Telusko)', difficulty: 'BEGINNER', durationMinutes: 35 },
      { title: 'Programiz - Java Inheritance', description: 'is-a relationships and code reuse with examples.', type: 'ARTICLE', url: 'https://www.programiz.com/java-programming/inheritance', provider: 'Programiz', difficulty: 'BEGINNER' },
    ],
    Polymorphism: [
      { title: 'Polymorphism in Java', description: 'Compile-time vs run-time, dynamic method dispatch, vtables.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/polymorphism-in-java/', provider: 'GeeksforGeeks', difficulty: 'INTERMEDIATE' },
      { title: 'Telusko - OOP in Java (Polymorphism)', description: 'Overriding, upcasting and dynamic dispatch from the OOP series.', type: 'PLAYLIST', url: TELUSKO_OOP, provider: 'YouTube (Telusko)', difficulty: 'INTERMEDIATE', durationMinutes: 35 },
      { title: 'Programiz - Java Polymorphism', description: 'Method overriding and upcasting explained simply.', type: 'ARTICLE', url: 'https://www.programiz.com/java-programming/polymorphism', provider: 'Programiz', difficulty: 'BEGINNER' },
    ],
    Overloading: [
      { title: 'Method Overloading in Java', description: 'Overloading rules, signature resolution, common pitfalls.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/method-overloading-in-java/', provider: 'GeeksforGeeks', difficulty: 'BEGINNER' },
      { title: 'Telusko - OOP in Java (Overloading)', description: 'Method and constructor overloading from the OOP series.', type: 'PLAYLIST', url: TELUSKO_OOP, provider: 'YouTube (Telusko)', difficulty: 'BEGINNER', durationMinutes: 18 },
      { title: 'Overloading vs Overriding', description: 'Side-by-side comparison with examples.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/difference-between-method-overloading-and-method-overriding-in-java/', provider: 'GeeksforGeeks', difficulty: 'INTERMEDIATE' },
    ],
    'Abstract Classes': [
      { title: 'Abstract Classes in Java', description: 'abstract methods, partial implementation, when to use.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/abstract-classes-in-java/', provider: 'GeeksforGeeks', difficulty: 'INTERMEDIATE' },
      { title: 'Telusko - OOP in Java (Abstract classes)', description: 'The abstract-class videos from the OOP-in-Java series.', type: 'PLAYLIST', url: TELUSKO_OOP, provider: 'YouTube (Telusko)', difficulty: 'INTERMEDIATE', durationMinutes: 20 },
      { title: 'Abstract Class vs Interface', description: 'How to choose between the two abstraction tools.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/difference-between-abstract-class-and-interface-in-java/', provider: 'GeeksforGeeks', difficulty: 'INTERMEDIATE' },
    ],
    Interfaces: [
      { title: 'Interfaces in Java', description: 'Contracts, multiple inheritance of type, default methods.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/interfaces-in-java/', provider: 'GeeksforGeeks', difficulty: 'INTERMEDIATE' },
      { title: 'Telusko - OOP in Java (Interfaces)', description: 'The interface videos from the OOP-in-Java series.', type: 'PLAYLIST', url: TELUSKO_OOP, provider: 'YouTube (Telusko)', difficulty: 'INTERMEDIATE', durationMinutes: 25 },
      { title: 'Oracle Java Tutorial - Interfaces', description: 'Official guide to defining and implementing interfaces.', type: 'DOCUMENT', url: 'https://docs.oracle.com/javase/tutorial/java/IandI/createinterface.html', provider: 'Oracle', difficulty: 'INTERMEDIATE' },
    ],
    Constructors: [
      { title: 'Constructors in Java', description: 'Default vs parameterized, constructor chaining with this()/super().', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/constructors-in-java/', provider: 'GeeksforGeeks', difficulty: 'BEGINNER' },
      { title: 'Telusko - OOP in Java (Constructors)', description: 'Constructors and constructor chaining from the OOP series.', type: 'PLAYLIST', url: TELUSKO_OOP, provider: 'YouTube (Telusko)', difficulty: 'BEGINNER', durationMinutes: 22 },
      { title: 'Programiz - Java Constructors', description: 'How and when constructors run, with examples.', type: 'ARTICLE', url: 'https://www.programiz.com/java-programming/constructors', provider: 'Programiz', difficulty: 'BEGINNER' },
    ],
    'Static Members': [
      { title: 'Static Keyword in Java', description: 'Class-level fields and methods, static blocks, memory model.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/static-keyword-java/', provider: 'GeeksforGeeks', difficulty: 'BEGINNER' },
      { title: 'Telusko - OOP in Java (static keyword)', description: 'The static-members videos from the OOP-in-Java series.', type: 'PLAYLIST', url: TELUSKO_OOP, provider: 'YouTube (Telusko)', difficulty: 'BEGINNER', durationMinutes: 15 },
      { title: 'Programiz - Java static Keyword', description: 'static variables vs instance variables.', type: 'ARTICLE', url: 'https://www.programiz.com/java-programming/static-keyword', provider: 'Programiz', difficulty: 'BEGINNER' },
    ],
    'Exception Handling': [
      { title: 'Exceptions in Java', description: 'try/catch/finally, checked vs unchecked, custom exceptions.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/exceptions-in-java/', provider: 'GeeksforGeeks', difficulty: 'INTERMEDIATE' },
      { title: 'Telusko - Java (Exception handling)', description: 'The exception-handling videos from the Java series.', type: 'PLAYLIST', url: TELUSKO_OOP, provider: 'YouTube (Telusko)', difficulty: 'INTERMEDIATE', durationMinutes: 30 },
      { title: 'Oracle Java Tutorial - Exceptions', description: 'Official lesson on exception handling.', type: 'DOCUMENT', url: 'https://docs.oracle.com/javase/tutorial/essential/exceptions/', provider: 'Oracle', difficulty: 'INTERMEDIATE' },
    ],
  },

  SPL: {
    'Data Types': [
      { title: 'Data Types in C', description: 'int/char/float/double, sizes, signed vs unsigned.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/data-types-in-c/', provider: 'GeeksforGeeks', difficulty: 'BEGINNER' },
      { title: 'Neso Academy - C Programming (Data types)', description: 'The data-type lectures from the full C Programming course.', type: 'PLAYLIST', url: NESO_C, provider: 'YouTube (Neso Academy)', difficulty: 'BEGINNER', durationMinutes: 40 },
      { title: 'Programiz - C Data Types', description: 'Beginner overview with ranges and format specifiers.', type: 'ARTICLE', url: 'https://www.programiz.com/c-programming/c-data-types', provider: 'Programiz', difficulty: 'BEGINNER' },
    ],
    Pointers: [
      { title: 'C Pointers', description: 'Address-of, pointer variables, pointer arithmetic and byte scaling.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/c-pointers/', provider: 'GeeksforGeeks', difficulty: 'INTERMEDIATE' },
      { title: 'mycodeschool - Pointers in C/C++', description: 'The definitive beginner pointer series.', type: 'PLAYLIST', url: 'https://www.youtube.com/playlist?list=PL2_aWCzGMAwLZp6LMUKI3cc7pgGsasm2_', provider: 'YouTube (mycodeschool)', difficulty: 'BEGINNER', durationMinutes: 75 },
      { title: 'Programiz - C Pointers', description: 'Pointers explained with memory diagrams.', type: 'ARTICLE', url: 'https://www.programiz.com/c-programming/c-pointers', provider: 'Programiz', difficulty: 'BEGINNER' },
    ],
    Dereferencing: [
      { title: 'Dereference, Reference, & Dereference again', description: 'The * and & operators and what dereferencing actually does.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/difference-between-dereference-and-reference-operator-in-c/', provider: 'GeeksforGeeks', difficulty: 'BEGINNER' },
      { title: 'Neso Academy - C Programming (Pointers & dereferencing)', description: 'The pointer/dereference lectures from the full C course.', type: 'PLAYLIST', url: NESO_C, provider: 'YouTube (Neso Academy)', difficulty: 'BEGINNER', durationMinutes: 35 },
      { title: 'Programiz - C Pointers and Arrays', description: 'Covers dereferencing and the address-of operator.', type: 'ARTICLE', url: 'https://www.programiz.com/c-programming/c-pointers-arrays', provider: 'Programiz', difficulty: 'BEGINNER' },
    ],
    'Arrays & Pointers': [
      { title: 'Pointer vs Array in C', description: 'Array-to-pointer decay and the equivalence a[i] == *(a+i).', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/difference-pointer-array-c/', provider: 'GeeksforGeeks', difficulty: 'INTERMEDIATE' },
      { title: 'Neso Academy - C Programming (Arrays & pointers)', description: 'The arrays-and-pointers lectures from the full C course.', type: 'PLAYLIST', url: NESO_C, provider: 'YouTube (Neso Academy)', difficulty: 'INTERMEDIATE', durationMinutes: 30 },
      { title: 'Pointer Arithmetic in C', description: 'Why p+1 advances by sizeof(*p) bytes.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/pointer-arithmetics-in-c-with-examples/', provider: 'GeeksforGeeks', difficulty: 'INTERMEDIATE' },
    ],
    'Dynamic Memory': [
      { title: 'Dynamic Memory Allocation in C', description: 'malloc/calloc/realloc/free and checking for NULL.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/dynamic-memory-allocation-in-c-using-malloc-calloc-free-and-realloc/', provider: 'GeeksforGeeks', difficulty: 'INTERMEDIATE' },
      { title: 'Neso Academy - C Programming (Dynamic memory)', description: 'The malloc/calloc/realloc/free lectures from the full C course.', type: 'PLAYLIST', url: NESO_C, provider: 'YouTube (Neso Academy)', difficulty: 'INTERMEDIATE', durationMinutes: 30 },
      { title: 'Programiz - C Dynamic Memory Allocation', description: 'Heap allocation lifecycle with examples.', type: 'ARTICLE', url: 'https://www.programiz.com/c-programming/c-dynamic-memory-allocation', provider: 'Programiz', difficulty: 'BEGINNER' },
    ],
    Deallocation: [
      { title: 'free() and dangling pointers', description: 'Use-after-free, double-free, and setting pointers to NULL.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/dangling-void-null-wild-pointers/', provider: 'GeeksforGeeks', difficulty: 'INTERMEDIATE' },
      { title: 'Neso Academy - C Programming (free & dangling pointers)', description: 'The deallocation/dangling-pointer lectures from the full C course.', type: 'PLAYLIST', url: NESO_C, provider: 'YouTube (Neso Academy)', difficulty: 'INTERMEDIATE', durationMinutes: 20 },
      { title: 'Memory Leak in C', description: 'What leaks are, how to spot them, remediation.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/what-is-memory-leak-how-can-we-avoid/', provider: 'GeeksforGeeks', difficulty: 'INTERMEDIATE' },
    ],
    Strings: [
      { title: 'Strings in C', description: 'Null-terminated char arrays and the string.h functions.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/strings-in-c/', provider: 'GeeksforGeeks', difficulty: 'BEGINNER' },
      { title: 'Neso Academy - C Programming (Strings)', description: 'The strings-in-C lectures from the full C course.', type: 'PLAYLIST', url: NESO_C, provider: 'YouTube (Neso Academy)', difficulty: 'BEGINNER', durationMinutes: 35 },
      { title: 'Programiz - C Strings', description: 'Declaring, reading and manipulating strings.', type: 'ARTICLE', url: 'https://www.programiz.com/c-programming/c-strings', provider: 'Programiz', difficulty: 'BEGINNER' },
    ],
    Structures: [
      { title: 'Structures in C', description: 'struct definition, member access, and struct pointers (-> operator).', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/structures-c/', provider: 'GeeksforGeeks', difficulty: 'BEGINNER' },
      { title: 'Neso Academy - C Programming (Structures)', description: 'The structures lectures from the full C course.', type: 'PLAYLIST', url: NESO_C, provider: 'YouTube (Neso Academy)', difficulty: 'BEGINNER', durationMinutes: 40 },
      { title: 'Programiz - C structs', description: 'Structs, arrays of structs, and pointers to structs.', type: 'ARTICLE', url: 'https://www.programiz.com/c-programming/c-structures', provider: 'Programiz', difficulty: 'BEGINNER' },
    ],
    'Storage Classes': [
      { title: 'Storage Classes in C', description: 'auto / register / static / extern and variable lifetime.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/storage-classes-in-c/', provider: 'GeeksforGeeks', difficulty: 'INTERMEDIATE' },
      { title: 'Neso Academy - C Programming (Storage classes)', description: 'The storage-class lectures from the full C course.', type: 'PLAYLIST', url: NESO_C, provider: 'YouTube (Neso Academy)', difficulty: 'INTERMEDIATE', durationMinutes: 25 },
      { title: 'Programiz - C Storage Class', description: 'Scope, lifetime and linkage with examples.', type: 'ARTICLE', url: 'https://www.programiz.com/c-programming/c-storage-class', provider: 'Programiz', difficulty: 'BEGINNER' },
    ],
    'Call Stack': [
      { title: 'Function Call Stack in C', description: 'Stack frames, local variables, and how returns work.', type: 'ARTICLE', url: 'https://www.geeksforgeeks.org/function-call-stack-in-c/', provider: 'GeeksforGeeks', difficulty: 'INTERMEDIATE' },
      { title: 'Neso Academy - C Programming (Functions & the stack)', description: 'The function-call lectures from the full C course.', type: 'PLAYLIST', url: NESO_C, provider: 'YouTube (Neso Academy)', difficulty: 'INTERMEDIATE', durationMinutes: 30 },
      { title: 'CS50 - Memory (stack vs heap)', description: "Harvard CS50's lecture segment on memory layout.", type: 'VIDEO', url: 'https://cs50.harvard.edu/x/2024/weeks/4/', provider: 'Harvard CS50', difficulty: 'BEGINNER' },
    ],
  },
};
