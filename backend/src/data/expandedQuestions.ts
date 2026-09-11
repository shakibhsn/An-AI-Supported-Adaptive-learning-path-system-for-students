/**
 * Expanded practice question bank (difficulty-tiered).
 *
 * WHY THIS FILE EXISTS: the original 75 questions (seedQuestions.ts, extracted
 * verbatim from the prototype) give each topic roughly one practice question -
 * not enough to serve a real EASY/MEDIUM/HARD adaptive rotation. Those 75
 * questions are seeded as difficulty "MEDIUM" (the schema default - they were
 * written as general checks, not explicitly tiered, so that's the honest
 * label rather than a graded-one-by-one claim).
 *
 * This file is NEW, authored content (not extracted from anything) - two
 * EASY and two HARD questions per topic, 28 topics across DSA/OOP/SPL,
 * 112 questions total. Every question is standard, verifiable CS/OOP/C
 * fundamentals; explanations are written to justify the answer, not just
 * restate it. Mixed question types per Section 10 (MCQ, TRUE_FALSE,
 * SCENARIO, CODE, CONCEPT) - grading logic is identical for all of them
 * (match correctAnswer), questionType is descriptive metadata only.
 */

import { CourseCode } from './topicMapping';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'CONCEPT' | 'SCENARIO' | 'CODE';

export interface ExpandedQuestion {
  topic: string;
  difficulty: Difficulty;
  questionType: QuestionType;
  question: string;
  options: { letter: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

function mcq(
  topic: string,
  difficulty: Difficulty,
  questionType: QuestionType,
  question: string,
  opts: [string, string, string, string],
  correctAnswer: string,
  explanation: string,
): ExpandedQuestion {
  const letters = ['A', 'B', 'C', 'D'];
  return {
    topic,
    difficulty,
    questionType,
    question,
    options: opts.map((text, i) => ({ letter: letters[i], text })),
    correctAnswer,
    explanation,
  };
}

function tf(topic: string, difficulty: Difficulty, statement: string, isTrue: boolean, explanation: string): ExpandedQuestion {
  return {
    topic,
    difficulty,
    questionType: 'TRUE_FALSE',
    question: `True or False: ${statement}`,
    options: [{ letter: 'A', text: 'True' }, { letter: 'B', text: 'False' }],
    correctAnswer: isTrue ? 'A' : 'B',
    explanation,
  };
}

export const EXPANDED_QUESTIONS: Record<CourseCode, ExpandedQuestion[]> = {
  DSA: [
    // Arrays
    mcq('Arrays', 'EASY', 'MCQ', 'In most programming languages (C, Java, Python), array indexing starts at:',
      ['0', '1', '-1', 'It varies by array size'], 'A', 'Zero-based indexing is the standard convention in C-family languages and Python.'),
    tf('Arrays', 'EASY', "an array's size can be changed after it is declared in C.", false,
      'Static C arrays have a fixed size determined at declaration; growing or shrinking it requires dynamic allocation (malloc/realloc), not the same array.'),
    mcq('Arrays', 'HARD', 'SCENARIO', 'You insert an element at the very beginning of a full static array of size n. What is the time complexity, including the required shifting?',
      ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 'C', 'All n existing elements must shift one position to the right to make room, which is a linear-time operation - a key reason linked lists beat arrays for frequent front-insertions.'),
    mcq('Arrays', 'HARD', 'CODE', 'Given `int arr[5] = {10,20,30,40,50};`, what does `*(arr+2)` evaluate to in C?',
      ['10', '20', '30', 'The address of arr[2]'], 'C', 'arr decays to a pointer to arr[0]; arr+2 points to arr[2]; dereferencing with * gives its value, 30.'),

    // Linked Lists
    mcq('Linked Lists', 'EASY', 'MCQ', "What does a NULL `next` pointer in a singly linked list node indicate?",
      ['The node is corrupted', 'It is the last node in the list', 'The list is empty', 'It is the head node'], 'B',
      'By convention the last node\'s next pointer is set to NULL to mark the end of the list.'),
    tf('Linked Lists', 'EASY', 'you can directly access the 5th element of a singly linked list in O(1) time the way you can with an array.', false,
      'Linked lists have no random access - reaching the 5th node requires traversing from the head, which is O(n).'),
    mcq('Linked Lists', 'HARD', 'SCENARIO', "You're given only a pointer to a node (not the head) in a singly linked list and must 'delete' it in O(1), without traversing from head. What trick achieves this (assuming it isn't the last node)?",
      ['Free the node directly', "Copy the next node's data into this node, then delete/free the actual next node", "Set the node's data to NULL", 'It is impossible'], 'B',
      "You overwrite the current node's data with the next node's data, then unlink and free the (now-duplicate) next node - effectively removing the current node's identity in O(1) without needing the previous node."),
    mcq('Linked Lists', 'HARD', 'CODE', 'In C, given `struct Node* head` pointing to the first of 3 nodes, what does `head = head->next->next;` do?',
      ['Deletes the first two nodes and frees their memory', 'Moves head to point to the 3rd node - the first two nodes leak if no other pointer references them', 'Causes a compile error', 'Reverses the list'], 'B',
      "Reassigning head only changes where the head pointer points; the original first two nodes are never freed, so their memory becomes unreachable (a leak) unless something else held a reference to them."),

    // Stacks
    mcq('Stacks', 'EASY', 'MCQ', 'Which principle governs a Stack data structure?',
      ['FIFO (First-In-First-Out)', 'LIFO (Last-In-First-Out)', 'Priority-based ordering', 'Random access'], 'B',
      'A stack only allows insertion (push) and removal (pop) at one end, so the last item pushed is the first popped.'),
    tf('Stacks', 'EASY', "a stack's push and pop operations both run in O(1) time when implemented with a dynamic array (amortized) or a linked list.", true,
      "Both implementations only touch one end of the structure per operation, giving constant (amortized, for dynamic arrays) time."),
    mcq('Stacks', 'HARD', 'SCENARIO', "You implement a Queue using two Stacks (input and output). When dequeuing and the output stack is empty, what should you do?",
      ['Return an error immediately', "Pop all elements from the input stack and push them onto the output stack, then pop from output", 'Reverse the input stack in place without a second stack', 'Push a new element'], 'B',
      'Transferring input to output reverses the order once, turning stack-order (LIFO) into queue-order (FIFO) for that batch; this is the classic two-stack queue technique.'),
    mcq('Stacks', 'HARD', 'CODE', 'Evaluating the postfix expression `5 3 + 8 2 - *` using a stack gives what result?',
      ['24', '48', '13', '30'], 'B', "5+3=8 (stack: [8]); push 8, push 2 (stack: [8,8,2]); 8-2=6 (stack: [8,6]); 8*6=48."),

    // Queues
    mcq('Queues', 'EASY', 'MCQ', 'Which principle governs a Queue data structure?',
      ['LIFO', 'FIFO (First-In-First-Out)', 'Random', 'Priority only'], 'B',
      'Elements are added at the rear and removed from the front, so the first item enqueued is the first dequeued.'),
    tf('Queues', 'EASY', "in a plain linear array-based queue (no wraparound), repeated dequeues and enqueues can waste array space even when the queue isn't logically full.", true,
      'Once front advances past index 0, those freed slots at the start are never reused without wraparound logic - the core motivation for circular queues.'),
    mcq('Queues', 'HARD', 'SCENARIO', 'A circular queue has capacity 5 (indices 0-4). front=3, rear=1 (rear points to the last inserted element). How many elements are currently in the queue?',
      ['2', '3', '4', '5'], 'C', 'Using count = ((rear - front + N) % N) + 1: ((1-3+5)%5)+1 = (3%5)+1 = 3+1 = 4.'),
    mcq('Queues', 'HARD', 'CONCEPT', 'Which underlying data structure is the natural fit for the frontier in a Breadth-First Search (BFS) traversal?',
      ['Stack', 'Queue', 'Priority heap', 'Hash set only'], 'B',
      'BFS explores nodes level by level, visiting the earliest-discovered node next - exactly the FIFO behavior a queue provides.'),

    // Recursion
    mcq('Recursion', 'EASY', 'MCQ', 'What are the two essential components every correct recursive function must have?',
      ['A loop and a counter', 'A base case and a recursive case', 'Two return statements', 'A global variable'], 'B',
      'Without a base case (a condition that stops recursing) the function would call itself forever, causing a stack overflow.'),
    tf('Recursion', 'EASY', 'every iterative (loop-based) algorithm can, in principle, be rewritten using recursion.', true,
      'Iteration and recursion are computationally equivalent - any loop can be reformulated as a function calling itself with updated state.'),
    mcq('Recursion', 'HARD', 'CODE', 'Given fib(n) = fib(n-1) + fib(n-2), with fib(0)=0 and fib(1)=1, what does fib(5) return?',
      ['3', '5', '8', '13'], 'B', 'fib: 0,1,1,2,3,5 for n=0..5 - fib(5)=5.'),
    mcq('Recursion', 'HARD', 'SCENARIO', 'A recursive function that calls itself twice per invocation (like naive, non-memoized Fibonacci) has what time complexity?',
      ['O(n)', 'O(n log n)', 'O(2^n) - exponential', 'O(n²)'], 'C',
      'Each call spawns two more calls without reusing prior results, so the call tree grows exponentially with depth n.'),

    // Trees
    mcq('Trees', 'EASY', 'MCQ', "In a Binary Search Tree (BST), where are values smaller than a node's value stored?",
      ['In the right subtree', 'In the left subtree', 'At the root only', "Order doesn't matter"], 'B',
      "The BST property places smaller values in the left subtree and larger values in the right subtree of every node."),
    tf('Trees', 'EASY', 'in a Binary Tree, every node can have at most 2 children.', true,
      "That's the defining property of a binary tree - each node has at most a left and a right child."),
    mcq('Trees', 'HARD', 'SCENARIO', 'What is the worst-case search time in an unbalanced BST built by inserting already-sorted data?',
      ['O(log n)', 'O(1)', 'O(n) - it degenerates into a linked list', 'O(n log n)'], 'C',
      'Inserting sorted data into a plain BST with no rebalancing produces a tree where every node has only one child - functionally a linked list, so search is linear.'),
    mcq('Trees', 'HARD', 'CONCEPT', 'Which traversal of a Binary Search Tree visits nodes in ascending sorted order?',
      ['Pre-order', 'Post-order', 'In-order', 'Level-order'], 'C',
      'In-order traversal (left, root, right) visits the smaller left subtree, then the node, then the larger right subtree - producing sorted order for a BST.'),

    // Graphs
    mcq('Graphs', 'EASY', 'MCQ', 'Which two are the most common ways to represent a graph in memory?',
      ['Stack and Queue', 'Adjacency Matrix and Adjacency List', 'Array and Linked List only', 'Hash table only'], 'B',
      'An adjacency matrix stores edges as a 2D grid; an adjacency list stores, per node, a list of its neighbors - both are standard graph representations.'),
    tf('Graphs', 'EASY', "in an undirected graph, an edge from node A to node B implies an edge from B to A.", true,
      "Undirected edges have no direction, so connectivity works both ways by definition."),
    mcq('Graphs', 'HARD', 'SCENARIO', 'You need the shortest path (fewest edges) between two nodes in an UNWEIGHTED graph. Which traversal guarantees this directly?',
      ['DFS', 'BFS', 'In-order traversal', 'Any traversal works equally'], 'B',
      'BFS explores nodes in increasing distance order (level by level) from the source, so the first time it reaches the target is guaranteed to be via the shortest path in an unweighted graph.'),
    mcq('Graphs', 'HARD', 'CONCEPT', "What does it mean for a graph to contain a 'cycle'?",
      ['It has more edges than nodes', 'There is a path that starts and ends at the same node without repeating an edge', 'It is disconnected', 'All nodes share the same degree'], 'B',
      'A cycle is a closed path - you can walk from a node back to itself following distinct edges.'),

    // Hashing
    mcq('Hashing', 'EASY', 'MCQ', 'What is the primary purpose of a hash function in a hash table?',
      ['To sort the keys', 'To map a key to an array index (bucket)', 'To encrypt the data', 'To compress the data'], 'B',
      "A hash function converts a key into an index, letting the table jump almost directly to where that key's value is stored."),
    tf('Hashing', 'EASY', "two different keys can never produce the same hash value (a 'collision').", false,
      'Collisions are expected and normal in hashing - the hash space is finite while the key space can be much larger, so collision-resolution strategies (chaining, open addressing) exist to handle them.'),
    mcq('Hashing', 'HARD', 'SCENARIO', 'Which collision-resolution technique stores multiple colliding elements in a linked list at the same bucket index?',
      ['Open addressing', 'Separate chaining', 'Linear probing', 'Double hashing'], 'B',
      'Separate chaining keeps a small linked list (or similar structure) per bucket, appending colliding entries to it instead of finding another slot.'),
    mcq('Hashing', 'HARD', 'CONCEPT', 'What is the average-case time complexity of lookup, insert, and delete in a well-implemented hash table with few collisions?',
      ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'], 'C',
      'With a good hash function and load factor, each key maps to a bucket with very few (ideally zero) collisions, making these operations constant time on average.'),
  ],

  OOP: [
    // Encapsulation
    mcq('Encapsulation', 'EASY', 'MCQ', 'What is the main purpose of encapsulation in OOP?',
      ['To allow multiple inheritance', 'To bundle data and methods together while restricting direct access to internal state', 'To speed up compilation', 'To enable polymorphism directly'], 'B',
      "Encapsulation hides an object's internal representation and exposes only a controlled public interface."),
    tf('Encapsulation', 'EASY', 'encapsulation is typically achieved in Java by declaring fields as private and exposing public getter/setter methods.', true,
      'This is the standard Java idiom for encapsulating field access while still allowing controlled read/write.'),
    mcq('Encapsulation', 'HARD', 'SCENARIO', "A class exposes a public field `balance` directly instead of a private field with a validated setter. What is the main risk?",
      ['Slower performance', 'External code can set balance to an invalid value (e.g., negative) with no validation', "The class won't compile", 'It breaks inheritance'], 'B',
      'Without encapsulation, any code that can see the field can mutate it however it likes, bypassing any business rules the class was supposed to enforce.'),
    mcq('Encapsulation', 'HARD', 'CONCEPT', 'Why is encapsulation considered essential for maintainability in large codebases?',
      ['It reduces the number of classes needed', "It lets you change a class's internal implementation without breaking code that depends on its public interface", 'It automatically improves performance', 'It removes the need for constructors'], 'B',
      "As long as the public interface (method signatures) stays the same, the internal implementation can be freely rewritten without affecting any external code that uses the class."),

    // Access Modifiers
    mcq('Access Modifiers', 'EASY', 'MCQ', 'In Java, which access modifier makes a member accessible ONLY within its own class?',
      ['public', 'protected', 'private', 'default (package-private)'], 'C',
      'private restricts visibility to the declaring class itself - not even subclasses can access it directly.'),
    tf('Access Modifiers', 'EASY', "a 'protected' member in Java is accessible to subclasses, even in a different package.", true,
      'protected extends default (package) access to also include subclasses regardless of package, which is what distinguishes it from default access.'),
    mcq('Access Modifiers', 'HARD', 'SCENARIO', "A base class has a protected method. A subclass in a different package receives a base-class-typed parameter and tries to call that protected method on it. Is this allowed?",
      ['Yes, always', "No - protected access via inheritance only permits calling it on the subclass's own instance (or subtypes), not on an arbitrary base-class instance from another package", 'Only if the method is also static', 'Only in interfaces'], 'B',
      "Java's protected rule for cross-package access requires the call to go through a reference of the subclass's own type (or a subtype of it), not an arbitrary base-type reference."),
    mcq('Access Modifiers', 'HARD', 'CONCEPT', 'What is the risk of making all class fields public by default instead of private?',
      ["The program won't compile", 'It breaks encapsulation, letting any external code modify internal state without validation', 'It prevents inheritance', 'It reduces memory usage'], 'B',
      "Public fields can be read and written by any code with a reference to the object, removing the class's ability to enforce invariants on its own state."),

    // Inheritance
    mcq('Inheritance', 'EASY', 'MCQ', 'Which keyword does Java use for a class to inherit from another class?',
      ['implements', 'extends', 'inherits', 'super'], 'B',
      "'extends' declares a subclass relationship to a superclass; 'implements' is used for interfaces instead."),
    tf('Inheritance', 'EASY', 'in single inheritance, a class can extend at most one direct superclass.', true,
      'Java classes support only single inheritance of implementation - multiple interface implementation is allowed instead.'),
    mcq('Inheritance', 'HARD', 'SCENARIO', "A subclass wants to run its immediate superclass's constructor before its own constructor body executes. Which call does it use?",
      ['this()', 'super()', 'new Parent()', 'extends()'], 'B',
      "super() invokes the superclass's constructor and must be the first statement in the subclass constructor if used explicitly."),
    mcq('Inheritance', 'HARD', 'CONCEPT', "What does the 'Diamond Problem' refer to, and how does Java avoid it for classes?",
      ['A sorting algorithm inefficiency', 'Ambiguity when a class would inherit the same method from two different superclasses via multiple inheritance - Java disallows multiple class inheritance to avoid this', 'A memory leak pattern', 'It only affects interfaces, not classes'], 'B',
      'If a class could extend two superclasses that both define the same method differently, the compiler would not know which version to use - Java sidesteps this entirely by permitting only single class inheritance.'),

    // Polymorphism
    mcq('Polymorphism', 'EASY', 'MCQ', "What does polymorphism allow a single method call to do, depending on the actual object type at runtime?",
      ['Run faster automatically', 'Behave differently, by invoking different overridden implementations', 'Skip validation logic', 'Avoid inheritance entirely'], 'B',
      "Polymorphism means 'many forms' - the same method call resolves to different behavior depending on the concrete runtime type of the object."),
    tf('Polymorphism', 'EASY', 'method overriding is an example of runtime (dynamic) polymorphism.', true,
      "The version of an overridden method that executes is decided at runtime based on the object's actual type, not its declared/reference type."),
    mcq('Polymorphism', 'HARD', 'SCENARIO', "A `Shape` reference variable points to a `Circle` object, and `Circle` overrides `area()`. When you call `shape.area()`, which version runs?",
      ["Shape's version, because the variable is typed Shape", "Circle's version, because Java resolves overridden methods based on the object's actual runtime type (dynamic dispatch)", 'A compile error occurs', 'Both versions run'], 'B',
      "For overridden instance methods, Java uses dynamic dispatch: the JVM looks at the actual object type at runtime, not the compile-time reference type."),
    mcq('Polymorphism', 'HARD', 'CONCEPT', 'What internal mechanism lets dynamic dispatch (runtime polymorphism) work in languages like Java and C++?',
      ['A virtual method table (vtable) mapping overridden methods to the correct implementation at runtime', 'The garbage collector', 'Static binding at compile time', 'Reflection only, invoked manually'], 'A',
      "Each class (with virtual/overridable methods) has a table of method pointers; at runtime the object's vtable is consulted to find the correct overridden implementation to call."),

    // Overloading
    mcq('Overloading', 'EASY', 'MCQ', 'What distinguishes overloaded methods that share the same name in a class?',
      ['Different return types only', 'Different parameter lists (number and/or type of parameters)', 'Different access modifiers', 'Nothing - they must be identical'], 'B',
      "Overload resolution is based on the parameter list (its 'signature'); return type alone does not distinguish overloads."),
    tf('Overloading', 'EASY', 'method overloading is resolved at compile time based on argument types (static/early binding).', true,
      'Unlike overriding (resolved at runtime), the compiler picks the matching overload based on the static types of the arguments at the call site.'),
    mcq('Overloading', 'HARD', 'SCENARIO', 'You define `void print(int x)` and `void print(double x)`. What happens when you call `print(5)`?',
      ['Compile error - ambiguous call', "It calls print(int) since 5 is an int literal and matches exactly, which is preferred over widening to double", 'It always calls print(double)', 'A random choice is made at runtime'], 'B',
      "Java prefers an exact type match over an implicit widening conversion, so the int literal 5 resolves to print(int)."),
    mcq('Overloading', 'HARD', 'CONCEPT', 'Can two methods that differ ONLY in return type (same name, same parameter list) be valid overloads in Java?',
      ['Yes, always', 'No - return type alone is not sufficient; the compiler treats it as a duplicate/conflicting method declaration', 'Only for static methods', 'Only for constructors'], 'B',
      "Java's overload resolution is based on the method signature (name + parameter types), which does not include the return type - so two such methods would clash."),

    // Abstract Classes
    mcq('Abstract Classes', 'EASY', 'MCQ', 'Can an abstract class in Java have a constructor?',
      ['No, never', 'Yes - it can have one, invoked via super() from subclasses, even though the abstract class itself cannot be instantiated directly', 'Only if all its methods are abstract', 'Only in C++, not Java'], 'B',
      "An abstract class's constructor runs as part of initializing any concrete subclass instance, even though `new AbstractClass()` itself is disallowed."),
    tf('Abstract Classes', 'EASY', 'an abstract class can contain both abstract methods (no body) and concrete methods (with a body).', true,
      'Abstract classes may mix fully-implemented methods with abstract ones that subclasses must implement.'),
    mcq('Abstract Classes', 'HARD', 'SCENARIO', 'A subclass extends an abstract class but does not implement one of the inherited abstract methods. What must be true of the subclass?',
      ['It compiles fine and the method is simply skipped', 'The subclass must also be declared abstract, or the code fails to compile', "It's only a runtime warning", 'Java auto-generates a default implementation'], 'B',
      'A concrete (non-abstract) class must provide bodies for every abstract method it inherits; if it leaves one unimplemented, it must itself be marked abstract.'),
    mcq('Abstract Classes', 'HARD', 'CONCEPT', 'When should you prefer an abstract class over an interface for a family of shape classes sharing state (like a `color` field) and default behavior?',
      ['Never, interfaces are always the better choice', 'When you need to share actual field state and common implementation logic across subclasses, not just a method contract', "Abstract classes can't declare any methods", "There's no functional difference between them"], 'B',
      'Interfaces (pre-default-methods, and even with them for state) are best for defining a pure contract; abstract classes are the right tool when subclasses genuinely share implementation and state.'),

    // Interfaces
    mcq('Interfaces', 'EASY', 'MCQ', 'What must a (non-abstract) class do when it implements an interface?',
      ['Nothing extra', "Provide concrete implementations for all of the interface's abstract methods", 'Extend a superclass first', 'Declare all its fields as private'], 'B',
      'Implementing an interface is a contract: the class must supply real method bodies for every abstract method the interface declares.'),
    tf('Interfaces', 'EASY', 'unlike class inheritance, a Java class can implement multiple interfaces at once.', true,
      'Java allows implementing any number of interfaces, which is how it provides multiple-inheritance-of-type without the diamond problem for state.'),
    mcq('Interfaces', 'HARD', 'SCENARIO', "Interfaces A and B both declare a default method `greet()` with different bodies, and a class implements both without overriding greet(). What happens?",
      ["It compiles, picking A's version", "It compiles, picking B's version", "Compile error - the class must explicitly override greet() to resolve the conflict", 'A runtime exception only, not a compile error'], 'C',
      'When two default methods clash, Java refuses to guess which one you meant and forces the implementing class to explicitly resolve the ambiguity by overriding the method itself.'),
    mcq('Interfaces', 'HARD', 'CONCEPT', 'Why are interfaces well-suited for defining a shared contract across otherwise unrelated classes (e.g., Comparable across very different types)?',
      ['They force a shared common ancestor class', 'They let unrelated classes agree to support the same behavior/API without sharing an implementation hierarchy', 'They automatically implement the methods for you', 'They prevent polymorphism'], 'B',
      'Any class, regardless of its inheritance tree, can opt into an interface and gain type compatibility with anything expecting that interface - decoupling "is-a-kind-of" state hierarchies from "can-do" behavioral contracts.'),

    // Constructors
    mcq('Constructors', 'EASY', 'MCQ', "What is a 'default constructor' in Java?",
      ['A constructor you must always write yourself', 'A no-argument constructor the compiler automatically supplies if you define no constructors at all', 'A constructor that takes every field as a parameter', 'The last constructor declared in the class'], 'B',
      "If a class defines zero constructors, the compiler silently inserts a public no-argument one that does nothing beyond the implicit super() call."),
    tf('Constructors', 'EASY', 'if a class defines any constructor at all (even a parameterized one), Java stops auto-generating a no-argument default constructor.', true,
      'The compiler only provides the implicit default constructor when you write none yourself - as soon as you write one, that behavior disappears.'),
    mcq('Constructors', 'HARD', 'SCENARIO', "A subclass constructor doesn't explicitly call super(...) as its first statement, and the superclass has no no-argument constructor. What happens?",
      ['It compiles fine using default field values', 'Compile error - the compiler implicitly inserts a no-arg super() call, which does not exist', 'It links to a random constructor', "It's only a runtime error"], 'B',
      "Every constructor implicitly calls super() as its first action unless you explicitly call a different super(...) or this(...); if no matching no-arg superclass constructor exists, compilation fails."),
    mcq('Constructors', 'HARD', 'CONCEPT', "What is 'constructor chaining' via this(...), and why is it useful?",
      ['It calls the superclass constructor', 'It lets one constructor in a class call another constructor in that same class, avoiding duplicated initialization logic', 'It creates multiple objects in one call', 'It only applies to static methods'], 'B',
      "this(...) redirects to another overload of the constructor in the same class, letting you centralize shared setup logic in one place instead of copy-pasting it across overloads."),

    // Static Members
    mcq('Static Members', 'EASY', 'MCQ', 'A `static` field in a class belongs to:',
      ['Each individual object separately', 'The class itself, shared across all instances', 'Only the constructor', 'Nothing until an object is instantiated'], 'B',
      'Static fields are stored once per class (not once per object) and are shared by every instance.'),
    tf('Static Members', 'EASY', 'a static method can directly access instance (non-static) fields without an object reference.', false,
      'Static methods have no implicit `this`, so they cannot directly touch instance members - they would need an explicit object reference to do so.'),
    mcq('Static Members', 'HARD', 'SCENARIO', 'A constructor increments a `static int counter` every time an object is created. After 5 objects are created (starting from 0, nothing else resets it), what is `counter`?',
      ['1, because each object has its own copy', '5, because all instances share the single static counter', '0, static fields never change', 'Undefined behavior'], 'B',
      'Because the field is static, every object increments the same shared value rather than its own copy.'),
    mcq('Static Members', 'HARD', 'CONCEPT', "Why can't a static method be overridden in the true polymorphic sense (though it can be redeclared/'hidden' in a subclass)?",
      ["Static methods are resolved at compile time based on the reference type (static binding), so there's no runtime dynamic dispatch to override", "Static methods don't exist in subclasses at all", 'Java forbids static methods entirely in subclasses', "It's a syntax error to redeclare them"], 'A',
      "Overriding relies on dynamic dispatch through an object's actual runtime type; static methods are looked up by the compile-time reference type instead, so 'hiding' happens rather than true overriding."),

    // Exception Handling
    mcq('Exception Handling', 'EASY', 'MCQ', 'Which block always executes in a try-catch-finally structure, whether or not an exception occurred?',
      ['try', 'catch', 'finally', 'throw'], 'C', 'finally is designed to run regardless of whether the try block succeeded, threw, or even returned - typically used for cleanup.'),
    tf('Exception Handling', 'EASY', "a 'checked' exception in Java must either be caught or declared in the method's throws clause, or the code fails to compile.", true,
      'Checked exceptions are verified by the compiler, which enforces that callers acknowledge the possibility of that exception one way or another.'),
    mcq('Exception Handling', 'HARD', 'SCENARIO', "A method has `return 1;` inside try, and `return 2;` inside finally. What value does the method actually return?",
      ['1', '2 - a return statement in finally overrides the return value from try', 'A compile error', 'Both values, as a list'], 'B',
      "If finally itself contains a return, it overrides any pending return from try/catch - this is exactly why returning from finally is considered a bad practice, since it silently discards the original result."),
    mcq('Exception Handling', 'HARD', 'CONCEPT', 'Why is catching the generic Exception (or worse, Throwable) class usually considered bad practice?',
      ["It's actually the recommended best practice", "It silently swallows/masks specific error types you didn't anticipate, making real bugs much harder to diagnose - catching specific exception types is usually better", "It's slower at runtime", 'It prevents the program from compiling'], 'B',
      "A broad catch hides the real, specific failure (e.g., NullPointerException vs IOException) behind generic handling, so bugs surface later and are harder to trace back to their cause."),
  ],

  SPL: [
    // Data Types
    mcq('Data Types', 'EASY', 'MCQ', 'Which of these is typically the smallest in byte size on a standard system?',
      ['int', 'double', 'char', 'long'], 'C', 'char is defined to be exactly 1 byte, the smallest addressable unit, while int/long/double are all wider.'),
    tf('Data Types', 'EASY', "an unsigned int can store larger positive values than a signed int of the same size, because it doesn't reserve a bit for the sign.", true,
      'Signed types split their range between negative and positive values; unsigned types dedicate the entire bit pattern to non-negative values, roughly doubling the positive range.'),
    mcq('Data Types', 'HARD', 'SCENARIO', 'You assign -1 to an `unsigned int` variable in C. What happens?',
      ['Compile error', 'It wraps around to the maximum representable unsigned value (e.g., 4294967295 for a 32-bit unsigned int)', 'It stays -1', 'The program crashes immediately'], 'B',
      'Unsigned integer arithmetic in C wraps modulo 2^n; -1 has the all-1-bits pattern, which unsigned interpretation reads as the maximum value.'),
    mcq('Data Types', 'HARD', 'CONCEPT', 'Why can sizeof(int) differ between systems/compilers in C?',
      ['It never differs - always exactly 4 bytes', 'The C standard only guarantees a minimum range for int; the exact size is implementation-defined (commonly 4 bytes, but not guaranteed)', 'It depends on the variable name length', "It's randomized at compile time"], 'B',
      "The C standard specifies minimum ranges, not exact byte widths, so int's actual size is chosen by each compiler/platform (historically 2, commonly 4 bytes today)."),

    // Pointers
    mcq('Pointers', 'EASY', 'MCQ', 'What does the `&` operator do when applied to a variable in C?',
      ['Dereferences a pointer', 'Returns the memory address of the variable', 'Performs bitwise AND only', 'Declares a new pointer'], 'B',
      "The address-of operator & yields the memory location where a variable is stored, which is what you assign to a pointer."),
    tf('Pointers', 'EASY', 'a pointer variable itself occupies memory, separate from the memory of the variable it points to.', true,
      "A pointer is a variable in its own right (typically 4 or 8 bytes) that happens to store an address - it has its own storage location distinct from what it points to."),
    mcq('Pointers', 'HARD', 'SCENARIO', 'Given `int x = 10; int *p = &x; *p = 20;`, what is the value of `x` afterward?',
      ['10', '20', 'The address of x', 'Undefined behavior'], 'B', 'p holds the address of x, so dereferencing p with *p = 20 writes 20 directly into x\'s memory location.'),
    mcq('Pointers', 'HARD', 'CONCEPT', "Why must a pointer be declared with a specific type (e.g., `int *p` vs `char *p`) rather than being generic?",
      ['Purely stylistic, it has no real effect', 'The type tells the compiler how many bytes to read/write on dereference and how far to move for pointer arithmetic', 'All pointers are the same size and type is irrelevant', 'It only affects how the value is printed'], 'B',
      "Dereferencing and pointer arithmetic both depend on the pointed-to type's size - e.g. `p+1` on an int* advances by sizeof(int) bytes, but on a char* it advances by 1 byte."),

    // Dereferencing
    mcq('Dereferencing', 'EASY', 'MCQ', 'What does the `*` operator do when applied to a pointer variable (not in a declaration)?',
      ['Multiplies the pointer', 'Accesses/dereferences the value stored at the address the pointer holds', 'Declares a new variable', "Returns the pointer's own address"], 'B',
      'The dereference operator follows the pointer to the memory it points at and reads (or writes) the value stored there.'),
    tf('Dereferencing', 'EASY', 'dereferencing a NULL pointer in C is safe and simply returns 0.', false,
      'Dereferencing NULL is undefined behavior in C and typically crashes the program with a segmentation fault rather than safely returning any value.'),
    mcq('Dereferencing', 'HARD', 'SCENARIO', '`int *p; *p = 5;` is executed without ever giving `p` a valid address first. What is the likely result?',
      ['p automatically points to a freshly allocated int', "Undefined behavior - p holds a garbage/uninitialized address, and writing through it can crash the program or corrupt memory", 'Compile error', '5 is safely stored in p itself, not through it'], 'B',
      'An uninitialized pointer holds whatever garbage value happened to be in memory; dereferencing and writing through it is undefined behavior and a common source of crashes.'),
    mcq('Dereferencing', 'HARD', 'CODE', 'Given `int x = 7; int *p = &x; int **pp = &p;`, what does `**pp` evaluate to?',
      ["The address of p", "The address of x", '7 (the value of x)', 'Compile error'], 'C',
      'pp is a pointer-to-pointer holding the address of p; *pp gives p (the address of x); dereferencing again, **pp, gives the value at that address, which is 7.'),

    // Arrays & Pointers
    mcq('Arrays & Pointers', 'EASY', 'MCQ', "In C, what does an array's name (e.g., `arr`) 'decay' into in most expressions?",
      ['Its total byte size', 'A pointer to its first element', 'A full copy of the array', 'NULL'], 'B',
      'Except in a few contexts like sizeof(), an array name used in an expression decays to a pointer to its first element.'),
    tf('Arrays & Pointers', 'EASY', 'arr[i] and *(arr + i) are equivalent ways of accessing an array element in C.', true,
      "C defines arr[i] as syntactic sugar for *(arr + i), so the two are always interchangeable."),
    mcq('Arrays & Pointers', 'HARD', 'SCENARIO', 'For `int arr[10];`, how does `sizeof(arr)` compare to `sizeof(arr + 0)`?',
      ['They return the same value', "sizeof(arr) returns the array's full byte size (e.g., 40 bytes for 10 ints), while sizeof(arr+0) returns just the size of a pointer (e.g., 8 bytes on 64-bit) - because arr+0 decays to a pointer", 'Both return 10', 'Both cause a compile error'], 'B',
      "sizeof(arr) is special-cased to know the array's true size; the moment you use arr in an arithmetic expression like arr+0, it decays into a plain pointer and loses that array-size information."),
    mcq('Arrays & Pointers', 'HARD', 'CODE', 'Given `int arr[5] = {1,2,3,4,5}; int *p = arr + 3;`, what does `*p` evaluate to?',
      ['3', '4', 'The address of arr[3]', '5'], 'B', 'arr+3 points to arr[3] (0-indexed), whose value is 4.'),

    // Dynamic Memory
    mcq('Dynamic Memory', 'EASY', 'MCQ', 'Which C standard library function allocates a block of heap memory without initializing its contents?',
      ['free()', 'malloc()', 'sizeof()', 'delete()'], 'B', 'malloc() reserves a block of the requested size on the heap but leaves its contents unspecified (garbage values).'),
    tf('Dynamic Memory', 'EASY', 'unlike malloc(), calloc() initializes the allocated memory block to zero.', true,
      'calloc() explicitly zero-initializes every byte of the allocated block, which is its key difference from malloc().'),
    mcq('Dynamic Memory', 'HARD', 'SCENARIO', 'malloc() returns NULL. What is the safest immediate next step before continuing to use the pointer?',
      ['Proceed normally - NULL is harmless to dereference', 'Check for NULL and handle the allocation failure (e.g., report an error and exit or return) before ever dereferencing the pointer', 'Call free() on it immediately', 'Retry malloc with a smaller size automatically'], 'B',
      'malloc returning NULL signals the allocation failed; dereferencing a NULL pointer is undefined behavior, so failure must be checked and handled before use.'),
    mcq('Dynamic Memory', 'HARD', 'CONCEPT', 'What is the key difference between malloc(n) and realloc(ptr, n)?',
      ['They are functionally identical', 'malloc allocates a brand-new block; realloc resizes an existing previously-allocated block (possibly moving it), preserving as much of the original content as fits', 'realloc always frees the old memory without copying anything', 'malloc can also resize existing memory'], 'B',
      "realloc grows or shrinks a block obtained from a prior malloc/calloc/realloc call, copying existing data to a new location if it can't extend in place - malloc always starts fresh."),

    // Deallocation
    mcq('Deallocation', 'EASY', 'MCQ', 'What does the C function free() do?',
      ['Sets a pointer to NULL automatically', 'Releases a block of dynamically allocated (heap) memory back to the system', 'Deletes the pointer variable itself', 'Frees stack memory'], 'B',
      'free() returns previously malloc/calloc/realloc-allocated heap memory to the allocator so it can be reused; it does not touch the pointer variable itself.'),
    tf('Deallocation', 'EASY', "calling free() twice on the same pointer (a 'double free') is undefined behavior and can corrupt memory.", true,
      "Double-freeing corrupts the heap allocator's internal bookkeeping and is a classic, serious memory-safety bug."),
    mcq('Deallocation', 'HARD', 'SCENARIO', "After `free(ptr);`, the code later uses `*ptr` without reassigning ptr. What is this bug called, and why is it dangerous?",
      ['A memory leak - wastes memory but is otherwise harmless', "A 'use-after-free' bug - ptr is now a dangling pointer to freed memory, and using it causes undefined behavior/crashes/corruption", 'A stack overflow', 'A compile-time error'], 'B',
      "ptr still holds the old (now-invalid) address after free(); the memory it pointed to may be reused for something else, so reading/writing through it corrupts unrelated data or crashes."),
    mcq('Deallocation', 'HARD', 'CONCEPT', "What is a 'memory leak' in C's manual memory management model?",
      ['Freeing memory too early', 'Dynamically allocated memory that is never freed and becomes unreachable, wasting memory for the life of the program', 'A pointer pointing to invalid memory', 'An array that is too large'], 'B',
      "A leak happens when the only pointer to a heap block is overwritten or goes out of scope before free() is called - the memory is still 'allocated' but nothing can reach it to free it."),

    // Strings
    mcq('Strings', 'EASY', 'MCQ', 'How does C know where a string (char array) ends?',
      ['A separate length is tracked automatically', "By a null terminator character '\\0' marking the end", 'Strings in C have a fixed maximum length', 'By counting non-whitespace characters'], 'B',
      "C strings are just char arrays with no built-in length field - functions like strlen() scan forward until they hit the '\\0' sentinel."),
    tf('Strings', 'EASY', 'the C string literal "hi" actually occupies 3 bytes in memory: \'h\', \'i\', and the null terminator.', true,
      "The compiler always appends a trailing '\\0' to string literals, so a 2-character literal needs 3 bytes of storage."),
    mcq('Strings', 'HARD', 'SCENARIO', 'You call `strcpy(dest, src)` where dest is `char[5]` but src is a 10-character string. What is the likely consequence?',
      ['strcpy automatically truncates safely', 'A buffer overflow - strcpy writes past the end of dest, corrupting adjacent memory (this is why strncpy is often preferred)', 'Compile error', 'src is silently truncated to fit dest'], 'B',
      "strcpy() has no concept of the destination's capacity - it copies until it hits src's null terminator, regardless of whether dest is large enough, which is a classic overflow vulnerability."),
    mcq('Strings', 'HARD', 'CODE', 'What does `strlen("Hello")` return?',
      ['6', '5', '4', "It depends on the null terminator's ASCII value"], 'B', "strlen() counts only the visible characters (H-e-l-l-o = 5), excluding the trailing '\\0'."),

    // Structures
    mcq('Structures', 'EASY', 'MCQ', 'How do you access member `age` of a plain (non-pointer) struct variable `struct Student s`?',
      ['s->age', 's.age', 's::age', 's[age]'], 'B', 'The dot operator (.) accesses members of a struct value directly.'),
    tf('Structures', 'EASY', 'if you have a pointer `struct Student *sp`, you access its members using the -> (arrow) operator, e.g. sp->age.', true,
      'The arrow operator is shorthand for dereferencing the pointer and then accessing the member: sp->age is equivalent to (*sp).age.'),
    mcq('Structures', 'HARD', 'SCENARIO', 'A struct has `char name[20]` followed by `int id`. Why might sizeof(struct Student) exceed sizeof(name) + sizeof(id)?',
      ["It's never larger than the sum", 'Structure padding/alignment the compiler inserts so fields sit on convenient memory-alignment boundaries', 'Structs always double in size', "It's a compiler bug"], 'B',
      'Compilers commonly insert padding bytes between (or after) struct members so each field starts at an address aligned to its type\'s natural boundary, which can make the struct larger than the raw sum of its members.'),
    mcq('Structures', 'HARD', 'CODE', 'Given `struct Point { int x, y; }; struct Point p1 = {3, 4}; struct Point *ptr = &p1;`, which correctly sets y to 10 via the pointer?',
      ['ptr.y = 10;', 'ptr->y = 10;', '*ptr.y = 10;', '&ptr->y = 10;'], 'B', 'Accessing a member through a struct pointer requires the arrow operator, ptr->y.'),

    // Storage Classes
    mcq('Storage Classes', 'EASY', 'MCQ', 'What is the default storage class of a local variable declared inside a C function?',
      ['static', 'extern', 'auto (automatic)', 'register'], 'C', "Local variables are 'auto' by default - allocated on the stack and destroyed when the function returns, unless explicitly marked otherwise."),
    tf('Storage Classes', 'EASY', 'a static local variable inside a function retains its value between successive calls to that function.', true,
      "Unlike ordinary (auto) locals, a static local is allocated once for the program's lifetime and keeps its value across calls."),
    mcq('Storage Classes', 'HARD', 'SCENARIO', 'A function has `static int count = 0;` and increments count every call. After 3 calls, what is count?',
      ['0 - it resets every call', '3 - static preserves the value across calls', '1 - static always resets to its initializer', 'Undefined behavior'], 'B',
      "Because count is static, its storage persists between calls instead of being reinitialized each time, so each call's increment accumulates."),
    mcq('Storage Classes', 'HARD', 'CONCEPT', 'What does the `extern` storage class specifier allow in a multi-file C program?',
      ['Declaring a variable defined in another file, so multiple files can share a single global variable', 'Making a variable local only to one function', 'Allocating memory on the heap', 'Forcing a variable to always be zero'], 'A',
      "extern tells the compiler 'this variable is defined elsewhere' - the linker then resolves the reference to the single actual definition in another translation unit."),

    // Call Stack
    mcq('Call Stack', 'EASY', 'MCQ', "What is stored in a function's 'stack frame' when it is called?",
      ['The entire heap', 'Local variables, parameters, and the return address, among other bookkeeping', 'Only global variables', 'The source code text'], 'B',
      "Each call gets its own frame holding that invocation's parameters, local variables, and where to resume execution in the caller once it returns."),
    tf('Call Stack', 'EASY', "each recursive call creates a new stack frame, and deeply unbounded recursion can exhaust the call stack ('stack overflow').", true,
      'Every call - recursive or not - pushes a new frame; if recursion never terminates (or goes too deep), the stack runs out of space.'),
    mcq('Call Stack', 'HARD', 'SCENARIO', "A function returns a pointer to one of its own local (non-static) variables. Why is this dangerous?",
      ["It's perfectly safe", "The local variable's stack frame is destroyed once the function returns, so the returned pointer becomes a dangling pointer to invalid memory", 'It automatically becomes a global variable', 'It only causes a compile-time-only warning with no runtime effect'], 'B',
      "Once the function returns, its stack frame - and everything in it, including that local variable - is considered reclaimed; any pointer to it is now dangling and unsafe to use."),
    mcq('Call Stack', 'HARD', 'CONCEPT', "In what order are function stack frames removed as functions return?",
      ['First-In-First-Out (FIFO), the same order they were created', 'Last-In-First-Out (LIFO) - the most recently called function returns (and its frame is removed) first', 'Random order', 'All at once, only when main() exits'], 'B',
      "The call stack is, as the name implies, a stack: the most recently pushed frame (the most recently called, still-running function) is the first one popped when it returns."),
  ],
};
