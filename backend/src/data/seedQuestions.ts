export const SEED_QUESTIONS = {
  "DSA": {
    "diagnostic": [
      {
        "topic": "Arrays",
        "question": "What is the worst-case time complexity of accessing an element in an unsorted dynamic array by index?",
        "optionA": "O(n) Linear Time",
        "optionB": "O(1) Constant Time",
        "optionC": "O(log n)",
        "optionD": "O(n²)",
        "correctAnswer": "B"
      },
      {
        "topic": "Linked Lists",
        "question": "In a singly linked list, what is the consequence of executing head = head->next without saving the previous head in C?",
        "optionA": "Memory leak of the first node",
        "optionB": "Immediate segmentation fault",
        "optionC": "Reversal of the list",
        "optionD": "Infinite looping",
        "correctAnswer": "A"
      },
      {
        "topic": "Linked Lists",
        "question": "Which operation can be performed in O(1) constant time in a singly linked list, given only the pointer to the 'head' node?",
        "optionA": "Searching for a specific value",
        "optionB": "Inserting a new node at the beginning of the list",
        "optionC": "Deleting the last node",
        "optionD": "Accessing index k directly",
        "correctAnswer": "B"
      },
      {
        "topic": "Stacks",
        "question": "Which data structure is implicitly utilized by the system call stack when executing recursive functions?",
        "optionA": "Queue",
        "optionB": "Priority Heap",
        "optionC": "Last-In-First-Out Stack",
        "optionD": "Hash Table",
        "correctAnswer": "C"
      },
      {
        "topic": "Queues",
        "question": "In a circular queue implemented using an array of size N, what condition signifies that the queue is completely full?",
        "optionA": "front == rear",
        "optionB": "(rear + 1) % N == front",
        "optionC": "rear == N - 1",
        "optionD": "front == -1",
        "correctAnswer": "B"
      },
      {
        "topic": "Recursion",
        "question": "What happens if a recursive function does not define a valid base case or never reaches it?",
        "optionA": "Syntax error",
        "optionB": "Stack Overflow runtime crash",
        "optionC": "Memory compaction",
        "optionD": "Returns NULL automatically",
        "correctAnswer": "B"
      },
      {
        "topic": "Trees",
        "question": "What is the in-order traversal (Left -> Root -> Right) result of a valid Binary Search Tree (BST)?",
        "optionA": "Descending order",
        "optionB": "Sorted ascending order",
        "optionC": "Grouped by depth",
        "optionD": "Arbitrary order",
        "correctAnswer": "B"
      },
      {
        "topic": "Trees",
        "question": "What is the maximum number of nodes in a full binary tree of height h (where root has height 0)?",
        "optionA": "2^h",
        "optionB": "2^(h+1) - 1",
        "optionC": "h² + 1",
        "optionD": "2h - 1",
        "correctAnswer": "B"
      },
      {
        "topic": "Graphs",
        "question": "Which graph traversal algorithm uses a Queue data structure to visit vertices level by level?",
        "optionA": "Depth-First Search (DFS)",
        "optionB": "Breadth-First Search (BFS)",
        "optionC": "Dijkstra's Algorithm",
        "optionD": "Kruskal's MST",
        "correctAnswer": "B"
      },
      {
        "topic": "Hashing",
        "question": "In a hash table, what technique resolves collisions by maintaining a linked list of entries at each bucket index?",
        "optionA": "Open Addressing",
        "optionB": "Linear Probing",
        "optionC": "Separate Chaining",
        "optionD": "Double Hashing",
        "correctAnswer": "C"
      }
    ],
    "practice": [
      {
        "topic": "Linked Lists",
        "question": "What happens if you execute head = newNode; BEFORE setting newNode->next = head; during head insertion?",
        "options": [
          {
            "letter": "A",
            "text": "Node correctly attaches"
          },
          {
            "letter": "B",
            "text": "Original list is lost in memory (Memory Leak)"
          },
          {
            "letter": "C",
            "text": "Compiler error"
          },
          {
            "letter": "D",
            "text": "List becomes circular"
          }
        ],
        "correctAnswer": "B",
        "explanation": "Correct! By assigning head = newNode first, you overwrite the only pointer holding the rest of the list.",
        "isFollowUp": false
      },
      {
        "topic": "Linked Lists",
        "question": "Which while loop condition correctly traverses a singly linked list until ptr is pointing directly at the tail node?",
        "options": [
          {
            "letter": "A",
            "text": "while (ptr != NULL)"
          },
          {
            "letter": "B",
            "text": "while (ptr->next != NULL)"
          },
          {
            "letter": "C",
            "text": "while (ptr->data != 0)"
          },
          {
            "letter": "D",
            "text": "while (ptr->next == head)"
          }
        ],
        "correctAnswer": "B",
        "explanation": "Correct! while (ptr->next != NULL) stops directly on the last node, avoiding stepping into NULL.",
        "isFollowUp": false
      },
      {
        "topic": "Linked Lists",
        "question": "What is the correct two-step sequence to delete the head node in a singly linked list in C?",
        "options": [
          {
            "letter": "A",
            "text": "free(head); head = head->next;"
          },
          {
            "letter": "B",
            "text": "Node* temp = head; head = head->next; free(temp);"
          },
          {
            "letter": "C",
            "text": "head = head->next; free(head);"
          },
          {
            "letter": "D",
            "text": "head->next = NULL; free(head);"
          }
        ],
        "correctAnswer": "B",
        "explanation": "Correct! You must store current head in a temporary pointer first, advance head, and then free temp.",
        "isFollowUp": false
      },
      {
        "topic": "Stacks",
        "question": "When evaluating the postfix expression '5 3 + 2 *' using a stack, what is the final evaluated result?",
        "options": [
          {
            "letter": "A",
            "text": "16"
          },
          {
            "letter": "B",
            "text": "11"
          },
          {
            "letter": "C",
            "text": "13"
          },
          {
            "letter": "D",
            "text": "25"
          }
        ],
        "correctAnswer": "A",
        "explanation": "Correct! 5 and 3 are pushed, '+' computes 8. 2 is pushed, and '*' evaluates 8 * 2 = 16.",
        "isFollowUp": false
      },
      {
        "topic": "Queues",
        "question": "In a circular queue implemented using an array of size N, what condition signifies that the queue is completely full?",
        "options": [
          {
            "letter": "A",
            "text": "front == rear"
          },
          {
            "letter": "B",
            "text": "(rear + 1) % N == front"
          },
          {
            "letter": "C",
            "text": "rear == N - 1"
          },
          {
            "letter": "D",
            "text": "front == -1"
          }
        ],
        "correctAnswer": "B",
        "explanation": "Correct! FIFO queues remove from front: first A, then B, leaving C at front.",
        "isFollowUp": false
      },
      {
        "topic": "Recursion",
        "question": "What is the return value of factorial(3) defined as f(n) = n * f(n-1) with base case f(0) = 1?",
        "options": [
          {
            "letter": "A",
            "text": "3"
          },
          {
            "letter": "B",
            "text": "6"
          },
          {
            "letter": "C",
            "text": "9"
          },
          {
            "letter": "D",
            "text": "1"
          }
        ],
        "correctAnswer": "B",
        "explanation": "Correct! f(3) = 3 * f(2) = 3 * (2 * 1) = 6.",
        "isFollowUp": false
      },
      {
        "topic": "Trees",
        "question": "Given a BST with root 15, left child 10, and right child 20, what is the in-order traversal output?",
        "options": [
          {
            "letter": "A",
            "text": "15, 10, 20"
          },
          {
            "letter": "B",
            "text": "10, 15, 20 (Ascending Order)"
          },
          {
            "letter": "C",
            "text": "20, 15, 10"
          },
          {
            "letter": "D",
            "text": "10, 20, 15"
          }
        ],
        "correctAnswer": "B",
        "explanation": "Correct! In-order traversal visits Left -> Root -> Right, yielding sorted order in a BST.",
        "isFollowUp": false
      },
      {
        "topic": "Trees",
        "question": "What is the worst-case search time complexity in a completely skewed Binary Search Tree of n nodes?",
        "options": [
          {
            "letter": "A",
            "text": "O(1)"
          },
          {
            "letter": "B",
            "text": "O(log n)"
          },
          {
            "letter": "C",
            "text": "O(n) Linear Time"
          },
          {
            "letter": "D",
            "text": "O(n log n)"
          }
        ],
        "correctAnswer": "C",
        "explanation": "Correct! When a BST degenerates into a linear linked chain, search degrades to O(n).",
        "isFollowUp": false
      },
      {
        "topic": "Graphs",
        "question": "Why does Breadth-First Search (BFS) guarantee finding the shortest path in an unweighted graph?",
        "options": [
          {
            "letter": "A",
            "text": "It uses system call stack recursion"
          },
          {
            "letter": "B",
            "text": "It visits all vertices at distance k before any at distance k+1"
          },
          {
            "letter": "C",
            "text": "It sorts edges by cost"
          },
          {
            "letter": "D",
            "text": "It skips internal cycles"
          }
        ],
        "correctAnswer": "B",
        "explanation": "Correct! BFS systematically expands vertex frontiers level by level, ensuring minimum edges traversed.",
        "isFollowUp": false
      },
      {
        "topic": "Hashing",
        "question": "In open addressing with linear probing, what is the major drawback when the load factor becomes high?",
        "options": [
          {
            "letter": "A",
            "text": "Primary clustering leading to long probe sequences"
          },
          {
            "letter": "B",
            "text": "Fatal stack overflow crash"
          },
          {
            "letter": "C",
            "text": "Inversion of stored hash keys"
          },
          {
            "letter": "D",
            "text": "Dangling pointers"
          }
        ],
        "correctAnswer": "A",
        "explanation": "Correct! Contiguous filled buckets coalesce into large clusters, increasing probe counts.",
        "isFollowUp": false
      },
      {
        "topic": "Linked Lists",
        "question": "In a singly linked list, when inserting a new node at the very beginning (head), which statement must execute FIRST to prevent losing the existing nodes?",
        "options": [
          {
            "letter": "A",
            "text": "head = newNode;"
          },
          {
            "letter": "B",
            "text": "newNode->next = head;"
          },
          {
            "letter": "C",
            "text": "newNode->prev = NULL;"
          },
          {
            "letter": "D",
            "text": "free(head);"
          }
        ],
        "correctAnswer": "B",
        "explanation": null,
        "isFollowUp": true
      },
      {
        "topic": "Linked Lists",
        "question": "What is the time complexity of deleting the first node of a singly linked list when given direct access to the 'head' pointer?",
        "options": [
          {
            "letter": "A",
            "text": "O(1) Constant Time"
          },
          {
            "letter": "B",
            "text": "O(n) Linear Time"
          },
          {
            "letter": "C",
            "text": "O(log n) Logarithmic Time"
          },
          {
            "letter": "D",
            "text": "O(n²) Quadratic Time"
          }
        ],
        "correctAnswer": "A",
        "explanation": null,
        "isFollowUp": true
      },
      {
        "topic": "Linked Lists",
        "question": "Which assignment statement correctly advances a temporary pointer 'temp' to point to the subsequent node in a singly linked list?",
        "options": [
          {
            "letter": "A",
            "text": "temp = temp + 1;"
          },
          {
            "letter": "B",
            "text": "temp = temp->next;"
          },
          {
            "letter": "C",
            "text": "temp = &temp;"
          },
          {
            "letter": "D",
            "text": "temp->next = temp;"
          }
        ],
        "correctAnswer": "B",
        "explanation": null,
        "isFollowUp": true
      },
      {
        "topic": "Linked Lists",
        "question": "What condition indicates that a singly linked list is completely empty?",
        "options": [
          {
            "letter": "A",
            "text": "head->next == head"
          },
          {
            "letter": "B",
            "text": "head == NULL"
          },
          {
            "letter": "C",
            "text": "head->data == 0"
          },
          {
            "letter": "D",
            "text": "head->next == NULL"
          }
        ],
        "correctAnswer": "B",
        "explanation": null,
        "isFollowUp": true
      },
      {
        "topic": "Linked Lists",
        "question": "When removing a dynamically allocated node from a linked list in C, why is calling free(deletedNode) strictly required?",
        "options": [
          {
            "letter": "A",
            "text": "To reclaim heap memory and prevent memory leaks"
          },
          {
            "letter": "B",
            "text": "To reset the CPU execution registers"
          },
          {
            "letter": "C",
            "text": "To notify the compiler that execution ended"
          },
          {
            "letter": "D",
            "text": "To automatically reconnect remaining list nodes"
          }
        ],
        "correctAnswer": "A",
        "explanation": null,
        "isFollowUp": true
      }
    ]
  },
  "OOP": {
    "diagnostic": [
      {
        "topic": "Encapsulation",
        "question": "Which core principle of OOP restricts direct access to an object's internal fields?",
        "optionA": "Inheritance",
        "optionB": "Encapsulation",
        "optionC": "Polymorphism",
        "optionD": "Dynamic Linking",
        "correctAnswer": "B"
      },
      {
        "topic": "Access Modifiers",
        "question": "If a class member is declared as 'protected', where is it accessible from?",
        "optionA": "Only within its own class",
        "optionB": "Everywhere in program",
        "optionC": "Within own package and subclasses",
        "optionD": "Only global functions",
        "correctAnswer": "C"
      },
      {
        "topic": "Inheritance",
        "question": "What relationship is modeled when a 'Car' class extends a 'Vehicle' class?",
        "optionA": "HAS-A relationship",
        "optionB": "IS-A relationship",
        "optionC": "USES-A relationship",
        "optionD": "PART-OF relationship",
        "correctAnswer": "B"
      },
      {
        "topic": "Polymorphism",
        "question": "Which feature allows a method call to invoke different implementations based on the runtime instance?",
        "optionA": "Compile-time Shadowing",
        "optionB": "Dynamic / Runtime Polymorphism",
        "optionC": "Static Variable Hiding",
        "optionD": "Constructor Chaining",
        "correctAnswer": "B"
      },
      {
        "topic": "Overloading",
        "question": "What is the defining characteristic of method overloading within the same class?",
        "optionA": "Same method name, different parameter signature",
        "optionB": "Different return types only",
        "optionC": "Redefining superclass method",
        "optionD": "Static final binding",
        "correctAnswer": "A"
      },
      {
        "topic": "Abstract Classes",
        "question": "What is a primary restriction of an abstract class?",
        "optionA": "Cannot contain concrete methods",
        "optionB": "Cannot be instantiated with 'new'",
        "optionC": "Cannot hold variables",
        "optionD": "Cannot be extended",
        "correctAnswer": "B"
      },
      {
        "topic": "Interfaces",
        "question": "What is an advantage of implementing an Interface over extending a concrete class?",
        "optionA": "Faster compilation",
        "optionB": "Supports multiple type contracts",
        "optionC": "Eliminates constructors",
        "optionD": "Hardware pointer access",
        "correctAnswer": "B"
      },
      {
        "topic": "Constructors",
        "question": "When does the compiler automatically provide a default no-argument constructor?",
        "optionA": "Always",
        "optionB": "Only when NO explicit constructor is defined",
        "optionC": "When declared public static",
        "optionD": "At garbage collection",
        "correctAnswer": "B"
      },
      {
        "topic": "Static Members",
        "question": "Which statement is true regarding a static method in an OOP class?",
        "optionA": "Can access 'this' directly",
        "optionB": "Belongs to the class itself rather than an instance",
        "optionC": "Duplicated for each object",
        "optionD": "Cannot accept parameters",
        "correctAnswer": "B"
      },
      {
        "topic": "Exception Handling",
        "question": "What is the explicit guarantee of the 'finally' block?",
        "optionA": "Executes only on uncaught errors",
        "optionB": "Executes guaranteed cleanup code whether exception occurred or not",
        "optionC": "Restarts program",
        "optionD": "Catches syntax errors",
        "correctAnswer": "B"
      }
    ],
    "practice": [
      {
        "topic": "Encapsulation",
        "question": "Why are class variables typically declared private while providing public getters and setters?",
        "options": [
          {
            "letter": "A",
            "text": "To allow validation logic and prevent unauthorized state tampering"
          },
          {
            "letter": "B",
            "text": "Faster CPU speed"
          },
          {
            "letter": "C",
            "text": "Bypass access modifiers"
          },
          {
            "letter": "D",
            "text": "Public cannot hold numbers"
          }
        ],
        "correctAnswer": "A",
        "explanation": "Correct! Encapsulation ensures object invariants are strictly guarded.",
        "isFollowUp": false
      },
      {
        "topic": "Access Modifiers",
        "question": "Which access modifier allows access within the same class, package, and derived subclasses in different packages?",
        "options": [
          {
            "letter": "A",
            "text": "private"
          },
          {
            "letter": "B",
            "text": "default (package-private)"
          },
          {
            "letter": "C",
            "text": "protected"
          },
          {
            "letter": "D",
            "text": "static"
          }
        ],
        "correctAnswer": "C",
        "explanation": "Correct! 'protected' grants visibility to subclasses even across distinct packages.",
        "isFollowUp": false
      },
      {
        "topic": "Constructors",
        "question": "What keyword is used within a subclass constructor to invoke the immediate parent class constructor?",
        "options": [
          {
            "letter": "A",
            "text": "this()"
          },
          {
            "letter": "B",
            "text": "super()"
          },
          {
            "letter": "C",
            "text": "parent()"
          },
          {
            "letter": "D",
            "text": "base()"
          }
        ],
        "correctAnswer": "B",
        "explanation": "Correct! super() delegates initialization upward to initialize inherited parent members.",
        "isFollowUp": false
      },
      {
        "topic": "Polymorphism",
        "question": "Given Animal a = new Dog(); where Dog overrides makeSound(), which version runs when calling a.makeSound()?",
        "options": [
          {
            "letter": "A",
            "text": "Animal's base version"
          },
          {
            "letter": "B",
            "text": "Dog's overridden version (Dynamic Dispatch)"
          },
          {
            "letter": "C",
            "text": "Compiler error"
          },
          {
            "letter": "D",
            "text": "Both execute in order"
          }
        ],
        "correctAnswer": "B",
        "explanation": "Correct! Dynamic method dispatch checks the runtime heap instance (Dog) rather than variable reference type.",
        "isFollowUp": false
      },
      {
        "topic": "Overloading",
        "question": "Which scenario represents valid method overloading within the same class?",
        "options": [
          {
            "letter": "A",
            "text": "int calc(int a) and double calc(int a)"
          },
          {
            "letter": "B",
            "text": "void proc(int a) and void proc(int a, String b)"
          },
          {
            "letter": "C",
            "text": "static void run() and void run()"
          },
          {
            "letter": "D",
            "text": "private int get() and public int get()"
          }
        ],
        "correctAnswer": "B",
        "explanation": "Correct! Overloading requires a distinct parameter list (signature). Return type alone is insufficient.",
        "isFollowUp": false
      },
      {
        "topic": "Abstract Classes",
        "question": "What happens if a concrete subclass extends an abstract class but fails to implement an abstract method?",
        "options": [
          {
            "letter": "A",
            "text": "Code compiles with warning"
          },
          {
            "letter": "B",
            "text": "Compilation fails unless subclass is also declared abstract"
          },
          {
            "letter": "C",
            "text": "Missing method defaults to null"
          },
          {
            "letter": "D",
            "text": "Method is skipped at runtime"
          }
        ],
        "correctAnswer": "B",
        "explanation": "Correct! A non-abstract subclass must implement all inherited abstract methods.",
        "isFollowUp": false
      },
      {
        "topic": "Interfaces",
        "question": "What is a primary design advantage of implementing an Interface over extending a concrete class?",
        "options": [
          {
            "letter": "A",
            "text": "A class can implement multiple interfaces (multiple type contracts)"
          },
          {
            "letter": "B",
            "text": "Eliminates memory allocation"
          },
          {
            "letter": "C",
            "text": "Automatically creates getters/setters"
          },
          {
            "letter": "D",
            "text": "Disables garbage collection"
          }
        ],
        "correctAnswer": "A",
        "explanation": "Correct! Interfaces provide type contracts without inheritance hierarchy coupling.",
        "isFollowUp": false
      },
      {
        "topic": "Static Members",
        "question": "If a static variable 'count' is incremented by instance A, what value is observed by instance B?",
        "options": [
          {
            "letter": "A",
            "text": "The initial default value"
          },
          {
            "letter": "B",
            "text": "The updated incremented value (Shared Memory)"
          },
          {
            "letter": "C",
            "text": "Instance B has isolated copy"
          },
          {
            "letter": "D",
            "text": "Memory error occurs"
          }
        ],
        "correctAnswer": "B",
        "explanation": "Correct! Static members belong to the class itself and are shared among all instances.",
        "isFollowUp": false
      },
      {
        "topic": "Inheritance",
        "question": "What is the consequence of marking a class as 'final' in Java?",
        "options": [
          {
            "letter": "A",
            "text": "The class cannot be instantiated"
          },
          {
            "letter": "B",
            "text": "The class cannot be extended or subclassed"
          },
          {
            "letter": "C",
            "text": "All fields must be strings"
          },
          {
            "letter": "D",
            "text": "Garbage collector ignores it"
          }
        ],
        "correctAnswer": "B",
        "explanation": "Correct! A final class cannot be inherited, securing its implementation from alteration.",
        "isFollowUp": false
      },
      {
        "topic": "Exception Handling",
        "question": "Under what circumstance does the 'finally' block NOT execute?",
        "options": [
          {
            "letter": "A",
            "text": "When an uncaught exception is thrown"
          },
          {
            "letter": "B",
            "text": "When try block executes return"
          },
          {
            "letter": "C",
            "text": "When System.exit(0) is called or JVM process terminates"
          },
          {
            "letter": "D",
            "text": "When catch catches the error"
          }
        ],
        "correctAnswer": "C",
        "explanation": "Correct! finally always executes unless the underlying virtual machine process is terminated.",
        "isFollowUp": false
      },
      {
        "topic": "Polymorphism",
        "question": "Given Animal a = new Dog(); where Dog extends Animal and overrides makeSound(), which implementation executes when calling a.makeSound()?",
        "options": [
          {
            "letter": "A",
            "text": "Animal's base method because variable 'a' is typed as Animal"
          },
          {
            "letter": "B",
            "text": "Dog's overridden method resolved via runtime dynamic dispatch (VTable)"
          },
          {
            "letter": "C",
            "text": "Compiler throws a type mismatch ambiguity error"
          },
          {
            "letter": "D",
            "text": "Both execute sequentially from superclass to subclass"
          }
        ],
        "correctAnswer": "B",
        "explanation": null,
        "isFollowUp": true
      },
      {
        "topic": "Interfaces",
        "question": "What is a primary architectural reason to implement an Interface rather than extend an Abstract Class?",
        "options": [
          {
            "letter": "A",
            "text": "Interfaces permit declaring mutable instance state variables"
          },
          {
            "letter": "B",
            "text": "A class can implement multiple interfaces, overcoming single class inheritance limits"
          },
          {
            "letter": "C",
            "text": "Interfaces compile directly into machine microcode"
          },
          {
            "letter": "D",
            "text": "Abstract classes cannot define methods with bodies"
          }
        ],
        "correctAnswer": "B",
        "explanation": null,
        "isFollowUp": true
      },
      {
        "topic": "Constructors",
        "question": "In an inheritance hierarchy, why must super() be called as the very first statement within a subclass constructor?",
        "options": [
          {
            "letter": "A",
            "text": "To guarantee parent base state is properly initialized before subclass code executes"
          },
          {
            "letter": "B",
            "text": "To release memory allocated to temporary local variables"
          },
          {
            "letter": "C",
            "text": "To overwrite private fields declared in the superclass"
          },
          {
            "letter": "D",
            "text": "To disable garbage collection during instantiation"
          }
        ],
        "correctAnswer": "A",
        "explanation": null,
        "isFollowUp": true
      },
      {
        "topic": "Polymorphism",
        "question": "How does the object-oriented runtime resolve which overridden method to execute during polymorphic invocation?",
        "options": [
          {
            "letter": "A",
            "text": "By scanning the source code directory on the filesystem during execution"
          },
          {
            "letter": "B",
            "text": "By consulting the object's Virtual Method Table (VTable) pointer in heap memory"
          },
          {
            "letter": "C",
            "text": "By converting all instance methods into static global functions"
          },
          {
            "letter": "D",
            "text": "By executing a linear search through the call stack frames"
          }
        ],
        "correctAnswer": "B",
        "explanation": null,
        "isFollowUp": true
      },
      {
        "topic": "Encapsulation",
        "question": "Which implementation correctly enforces encapsulation for a sensitive class variable 'balance'?",
        "options": [
          {
            "letter": "A",
            "text": "Declaring balance public so any external class can update it directly"
          },
          {
            "letter": "B",
            "text": "Declaring balance private and providing a validated public setter method"
          },
          {
            "letter": "C",
            "text": "Declaring balance as static volatile without getter or setter methods"
          },
          {
            "letter": "D",
            "text": "Accessing balance using raw pointer memory offsets"
          }
        ],
        "correctAnswer": "B",
        "explanation": null,
        "isFollowUp": true
      }
    ]
  },
  "SPL": {
    "diagnostic": [
      {
        "topic": "Data Types",
        "question": "In standard C, what is the exact output of printf(\"%d\", 7 / 2);?",
        "optionA": "3.5",
        "optionB": "3 (Integer truncation)",
        "optionC": "4",
        "optionD": "Runtime Error",
        "correctAnswer": "B"
      },
      {
        "topic": "Pointers",
        "question": "If int x = 10; int *p = &x;, which expression evaluates to the memory address of x?",
        "optionA": "*p",
        "optionB": "p",
        "optionC": "&p",
        "optionD": "*x",
        "correctAnswer": "B"
      },
      {
        "topic": "Dereferencing",
        "question": "Given int x = 10; int *ptr = &x;, what happens when executing *ptr = 25;?",
        "optionA": "Changes address stored in ptr",
        "optionB": "Modifies the value stored in variable x to 25",
        "optionC": "Causes segmentation fault",
        "optionD": "Allocates new memory",
        "correctAnswer": "B"
      },
      {
        "topic": "Arrays & Pointers",
        "question": "If int arr[5] = {10, 20, 30, 40, 50};, what is the value of *(arr + 2)?",
        "optionA": "10",
        "optionB": "20",
        "optionC": "30",
        "optionD": "Memory address",
        "correctAnswer": "C"
      },
      {
        "topic": "Dynamic Memory",
        "question": "Which function allocates uninitialized raw bytes on the heap and returns void*?",
        "optionA": "calloc()",
        "optionB": "malloc()",
        "optionC": "realloc()",
        "optionD": "free()",
        "correctAnswer": "B"
      },
      {
        "topic": "Deallocation",
        "question": "What bug occurs when a pointer variable continues to reference memory after free(ptr)?",
        "optionA": "Memory Leak",
        "optionB": "Dangling Pointer",
        "optionC": "Stack Underflow",
        "optionD": "Buffer Overflow",
        "correctAnswer": "B"
      },
      {
        "topic": "Strings",
        "question": "How is the end of a valid character string in C designated in memory?",
        "optionA": "' '",
        "optionB": "Null terminator '\\0'",
        "optionC": "'\\n'",
        "optionD": "EOF",
        "correctAnswer": "B"
      },
      {
        "topic": "Structures",
        "question": "Which operator is used to access a struct member when holding a pointer to that structure?",
        "optionA": "s.member",
        "optionB": "s->member",
        "optionC": "s::member",
        "optionD": "s*member",
        "correctAnswer": "B"
      },
      {
        "topic": "Storage Classes",
        "question": "Which keyword retains the value of a local variable across repeated function calls in C?",
        "optionA": "auto",
        "optionB": "static",
        "optionC": "register",
        "optionD": "volatile",
        "correctAnswer": "B"
      },
      {
        "topic": "Call Stack",
        "question": "What happens if a recursive function in C fails to hit a base case before stack RAM is exhausted?",
        "optionA": "Exits code 0",
        "optionB": "Segmentation fault due to stack overflow",
        "optionC": "Converts to while loop",
        "optionD": "Memory compaction",
        "correctAnswer": "B"
      }
    ],
    "practice": [
      {
        "topic": "Pointers",
        "question": "If ptr points to address 0x1000, what address does ptr + 1 point to when sizeof(int) == 4?",
        "options": [
          {
            "letter": "A",
            "text": "0x1001"
          },
          {
            "letter": "B",
            "text": "0x1004 (Scaled by type size)"
          },
          {
            "letter": "C",
            "text": "0x1002"
          },
          {
            "letter": "D",
            "text": "0x1010"
          }
        ],
        "correctAnswer": "B",
        "explanation": "Correct! In C, adding 1 to a pointer advances it by sizeof(type) bytes.",
        "isFollowUp": false
      },
      {
        "topic": "Dereferencing",
        "question": "If int val = 42; int *p = &val;, what is evaluated by the expression *p?",
        "options": [
          {
            "letter": "A",
            "text": "Address of val"
          },
          {
            "letter": "B",
            "text": "42 (Value stored at address)"
          },
          {
            "letter": "C",
            "text": "Address of pointer p"
          },
          {
            "letter": "D",
            "text": "0"
          }
        ],
        "correctAnswer": "B",
        "explanation": "Correct! The dereference operator '*' retrieves the data stored at the targeted address.",
        "isFollowUp": false
      },
      {
        "topic": "Arrays & Pointers",
        "question": "For array int arr[10], which pointer expression is equivalent to arr[i]?",
        "options": [
          {
            "letter": "A",
            "text": "*(arr + i)"
          },
          {
            "letter": "B",
            "text": "&arr[i]"
          },
          {
            "letter": "C",
            "text": "*arr + i"
          },
          {
            "letter": "D",
            "text": "arr->i"
          }
        ],
        "correctAnswer": "A",
        "explanation": "Correct! In C, subscript syntax arr[i] is syntactically translated to *(arr + i).",
        "isFollowUp": false
      },
      {
        "topic": "Dynamic Memory",
        "question": "What does malloc(100) return if the operating system cannot satisfy the memory request?",
        "options": [
          {
            "letter": "A",
            "text": "Address 0x0001"
          },
          {
            "letter": "B",
            "text": "NULL pointer"
          },
          {
            "letter": "C",
            "text": "Runtime exception"
          },
          {
            "letter": "D",
            "text": "Partially allocated block"
          }
        ],
        "correctAnswer": "B",
        "explanation": "Correct! malloc returns NULL on allocation failure. C code must always check for NULL.",
        "isFollowUp": false
      },
      {
        "topic": "Deallocation",
        "question": "What critical bug occurs if you execute free(ptr) and subsequently attempt to read *ptr?",
        "options": [
          {
            "letter": "A",
            "text": "Memory Leak"
          },
          {
            "letter": "B",
            "text": "Dangling Pointer (Use-After-Free bug)"
          },
          {
            "letter": "C",
            "text": "Stack Underflow"
          },
          {
            "letter": "D",
            "text": "Memory compaction"
          }
        ],
        "correctAnswer": "B",
        "explanation": "Correct! Accessing memory through a pointer after free() causes dangerous undefined behavior.",
        "isFollowUp": false
      },
      {
        "topic": "Strings",
        "question": "What is the minimum byte size required to safely store the string \"UIU\" in a char array?",
        "options": [
          {
            "letter": "A",
            "text": "3 bytes"
          },
          {
            "letter": "B",
            "text": "4 bytes (3 characters + '\\0' null terminator)"
          },
          {
            "letter": "C",
            "text": "5 bytes"
          },
          {
            "letter": "D",
            "text": "2 bytes"
          }
        ],
        "correctAnswer": "B",
        "explanation": "Correct! C strings require a terminating null character '\\0' to mark the end of the string.",
        "isFollowUp": false
      },
      {
        "topic": "Pointers",
        "question": "How can a C function modify an integer variable defined in the caller function?",
        "options": [
          {
            "letter": "A",
            "text": "By passing the integer variable by value"
          },
          {
            "letter": "B",
            "text": "By passing a pointer to the variable (&val)"
          },
          {
            "letter": "C",
            "text": "By returning NULL"
          },
          {
            "letter": "D",
            "text": "By declaring the parameter auto"
          }
        ],
        "correctAnswer": "B",
        "explanation": "Correct! C functions receive copies of arguments; passing an address allows dereferencing and modification.",
        "isFollowUp": false
      },
      {
        "topic": "Structures",
        "question": "Given struct Node *ptr;, which notation is used to access its 'data' field?",
        "options": [
          {
            "letter": "A",
            "text": "ptr.data"
          },
          {
            "letter": "B",
            "text": "ptr->data (or (*ptr).data)"
          },
          {
            "letter": "C",
            "text": "ptr::data"
          },
          {
            "letter": "D",
            "text": "*ptr->data"
          }
        ],
        "correctAnswer": "B",
        "explanation": "Correct! The arrow operator '->' dereferences the struct pointer and accesses the designated member.",
        "isFollowUp": false
      },
      {
        "topic": "Storage Classes",
        "question": "What is true about a variable declared as 'static int count = 0;' inside a C function?",
        "options": [
          {
            "letter": "A",
            "text": "It is reinitialized to 0 on every function call"
          },
          {
            "letter": "B",
            "text": "Its value is preserved across repeated calls throughout execution"
          },
          {
            "letter": "C",
            "text": "It can be accessed globally from other files"
          },
          {
            "letter": "D",
            "text": "It is stored on the call stack"
          }
        ],
        "correctAnswer": "B",
        "explanation": "Correct! A static local retains its value between function invocations, stored in data segment.",
        "isFollowUp": false
      },
      {
        "topic": "Deallocation",
        "question": "Which situation represents a classic memory leak in C?",
        "options": [
          {
            "letter": "A",
            "text": "Allocating heap memory with malloc() and losing the pointer without free()"
          },
          {
            "letter": "B",
            "text": "Dereferencing a NULL pointer"
          },
          {
            "letter": "C",
            "text": "Exceeding stack size through recursion"
          },
          {
            "letter": "D",
            "text": "Writing outside array bounds"
          }
        ],
        "correctAnswer": "A",
        "explanation": "Correct! Allocated heap memory that is no longer pointed to and never freed becomes leaked RAM.",
        "isFollowUp": false
      },
      {
        "topic": "Pointers",
        "question": "In standard C, if int *ptr = 0x2000; and sizeof(int) == 4, what memory address is evaluated by the expression ptr + 2?",
        "options": [
          {
            "letter": "A",
            "text": "0x2002 (Incremented by 2 bytes)"
          },
          {
            "letter": "B",
            "text": "0x2008 (Scaled by 2 * sizeof(int) = 8 bytes)"
          },
          {
            "letter": "C",
            "text": "0x2004 (Scaled by 1 int size)"
          },
          {
            "letter": "D",
            "text": "0x2016 (Shifted by 16 bytes)"
          }
        ],
        "correctAnswer": "B",
        "explanation": null,
        "isFollowUp": true
      },
      {
        "topic": "Dynamic Memory",
        "question": "What defensive check must be performed immediately after int *arr = malloc(100 * sizeof(int)); before writing any data?",
        "options": [
          {
            "letter": "A",
            "text": "Call free(arr) to clear heap memory"
          },
          {
            "letter": "B",
            "text": "Verify if (arr == NULL) to safely handle memory allocation failure"
          },
          {
            "letter": "C",
            "text": "Execute sizeof(arr) to verify the allocated byte length"
          },
          {
            "letter": "D",
            "text": "Reassign arr = 0 to initialize all array indices"
          }
        ],
        "correctAnswer": "B",
        "explanation": null,
        "isFollowUp": true
      },
      {
        "topic": "Deallocation",
        "question": "To prevent catastrophic use-after-free bugs in C, what is the mandatory best practice immediately after calling free(ptr);?",
        "options": [
          {
            "letter": "A",
            "text": "Assign ptr = NULL; so subsequent checks detect invalid pointers"
          },
          {
            "letter": "B",
            "text": "Call free(ptr); a second time to ensure complete release"
          },
          {
            "letter": "C",
            "text": "Decrement ptr-- to return it to the base stack address"
          },
          {
            "letter": "D",
            "text": "Declare ptr as static in global scope"
          }
        ],
        "correctAnswer": "A",
        "explanation": null,
        "isFollowUp": true
      },
      {
        "topic": "Dereferencing",
        "question": "Given int count = 50; int *p = &count;, which expression successfully updates the stored count value to 75?",
        "options": [
          {
            "letter": "A",
            "text": "p = 75;"
          },
          {
            "letter": "B",
            "text": "*p = 75;"
          },
          {
            "letter": "C",
            "text": "&p = 75;"
          },
          {
            "letter": "D",
            "text": "*count = 75;"
          }
        ],
        "correctAnswer": "B",
        "explanation": null,
        "isFollowUp": true
      },
      {
        "topic": "Structures",
        "question": "Given struct Node *n = malloc(sizeof(struct Node));, which syntax correctly accesses the struct's 'val' member through pointer indirection?",
        "options": [
          {
            "letter": "A",
            "text": "n.val"
          },
          {
            "letter": "B",
            "text": "n->val (equivalent to (*n).val)"
          },
          {
            "letter": "C",
            "text": "n::val"
          },
          {
            "letter": "D",
            "text": "*n->val"
          }
        ],
        "correctAnswer": "B",
        "explanation": null,
        "isFollowUp": true
      }
    ]
  }
} as const;
