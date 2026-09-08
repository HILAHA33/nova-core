export interface ConceptDefinition {
  term: string;
  aliases: string[];
  category: string;
  definition: string;
  keyPrinciples: string[];
  practicalExample: string;
  relatedConcepts: string[];
}

export const CONCEPT_DEFINITIONS: ConceptDefinition[] = [
  {
    term: 'recursion',
    aliases: ['recursive', 'recursive function'],
    category: 'Computer Science & Algorithms',
    definition: 'A computational problem-solving technique where a function calls itself directly or indirectly to solve a smaller instance of the same problem, continuing until reaching a base condition that terminates the self-referential calls.',
    keyPrinciples: [
      'Base Case: A terminating condition that stops recursion and prevents infinite loops or stack overflow errors.',
      'Recursive Step: Progresses the input state closer to the base condition with each call.',
      'Call Stack Allocation: Each invocation reserves a stack frame to hold local variables, return addresses, and execution state.',
      'Tail Call Optimization: A compiler optimization where the recursive call is the final action, allowing reuse of the existing stack frame.'
    ],
    practicalExample: 'Tree traversals (such as DOM querying, file system directory walking, or depth-first search in graphs) and divide-and-conquer algorithms like Merge Sort.',
    relatedConcepts: ['divide-and-conquer', 'call stack', 'dynamic programming', 'tree traversal']
  },
  {
    term: 'closure',
    aliases: ['closures', 'lexical closure', 'lexical scope'],
    category: 'Programming Languages',
    definition: 'The combination of a function bundled together with references to its surrounding lexical state (lexical environment), allowing the inner function to access variables from an enclosing scope even after that outer scope has finished executing.',
    keyPrinciples: [
      'Lexical Scoping: Variable resolution is determined at compile/parse time based on where functions are physically authored in source code.',
      'Persistent State: Variables captured by a closure remain allocated in the heap as long as the inner function reference is retained by the garbage collector.',
      'Data Privacy: Enables encapsulation by hiding internal state behind public API methods without using classes or global variables.'
    ],
    practicalExample: 'Creating private state counters, factory functions, event handlers with bound context, and currying/partial application in functional programming.',
    relatedConcepts: ['scope chain', 'garbage collection', 'higher-order functions', 'currying']
  },
  {
    term: 'event loop',
    aliases: ['javascript event loop', 'node event loop'],
    category: 'Asynchronous Runtimes',
    definition: 'A single-threaded runtime scheduling mechanism that continuously orchestrates the execution of synchronous code, processes pending microtasks, monitors the I/O event demultiplexer, and dispatches callbacks from the task queue when the call stack becomes empty.',
    keyPrinciples: [
      'Call Stack: Evaluates synchronous JavaScript frames in Last-In-First-Out (LIFO) order.',
      'Microtask Queue: Processes higher-priority callbacks like Promise resolution (.then, await) and queueMicrotask before the next event loop tick.',
      'Macrotask Queue (Callback Queue): Handles timer events (setTimeout, setInterval), UI rendering, and network/file I/O callbacks.',
      'Non-Blocking I/O: Offloads operating system operations to background worker threads (libuv) so the main execution thread is never stalled waiting for hardware responses.'
    ],
    practicalExample: 'Node.js and browser engines processing thousands of concurrent HTTP requests and user interactions on a single main thread without thread contention locks.',
    relatedConcepts: ['promises', 'async/await', 'concurrency', 'libuv', 'microtasks']
  },
  {
    term: 'idempotency',
    aliases: ['idempotent', 'idempotent api', 'idempotency key'],
    category: 'System Design & APIs',
    definition: 'A mathematical and architectural property where performing an operation multiple times produces the exact same side-effects and end state on the target system as performing it once.',
    keyPrinciples: [
      'HTTP Methods: GET, PUT, and DELETE are idempotent by specification; POST is non-idempotent because multiple calls create duplicate resources unless guarded.',
      'Idempotency Keys: A unique client-generated token (like a UUID) attached to write requests allowing the server to recognize duplicate transmissions and return cached responses without re-executing business logic.',
      'Network Resilience: Safely enables automatic retry policies across unreliable networks without fear of duplicate billing or corrupted records.'
    ],
    practicalExample: 'Payment processing gateways (e.g. Stripe) where replaying a failed charge request with the same Idempotency-Key guarantees the user is billed only once.',
    relatedConcepts: ['rest', 'at-least-once delivery', 'http methods', 'transactional safety']
  },
  {
    term: 'dependency injection',
    aliases: ['di', 'inversion of control', 'ioc'],
    category: 'Software Engineering & Design Patterns',
    definition: 'A design pattern implementing Inversion of Control (IoC) where a class or component receives its external dependencies from outside rather than instantiating them internally.',
    keyPrinciples: [
      'Decoupling: High-level business logic depends on abstract interfaces rather than concrete implementations.',
      'Testability: Enables substituting heavy external systems (databases, payment processors, external APIs) with lightweight test mocks or stubs during automated testing.',
      'Configurability: Allows changing component implementations via configuration without modifying consumers.'
    ],
    practicalExample: 'Passing a database interface into an order processing service constructor, allowing switching from PostgreSQL to an in-memory database during unit test suites.',
    relatedConcepts: ['solid principles', 'inversion of control', 'unit testing', 'factory pattern']
  },
  {
    term: 'entropy',
    aliases: ['thermodynamic entropy', 'information entropy', 'shannon entropy'],
    category: 'Physics & Information Theory',
    definition: 'In thermodynamics, entropy is a state function measuring the microscopic disorder or the unavailability of a system thermal energy for conversion into mechanical work. In information theory (Shannon entropy), it quantifies the average rate of uncertainty or surprise in the possible outcomes of a random variable.',
    keyPrinciples: [
      'Second Law of Thermodynamics: The total entropy of an isolated system always increases over time, dictating the thermodynamic arrow of time.',
      'Shannon Entropy: H(X) = -sum(p(x) * log2(p(x))), measuring minimum bits needed to encode a message without loss.',
      'Statistical Mechanics: Ludwig Boltzmann formulated entropy S = k * ln(W), where W represents the number of microscopic configurations consistent with the macroscopic state.'
    ],
    practicalExample: 'Compressing data with Huffman coding where optimal compression approaches Shannon entropy, and heat naturally dissipating from hot coffee into the surrounding room.',
    relatedConcepts: ['thermodynamics', 'information theory', 'probability', 'boltzmann']
  },
  {
    term: 'cap theorem',
    aliases: ['brewer cap theorem', 'pacelc', 'cap'],
    category: 'Distributed Systems',
    definition: 'A foundational theorem in distributed computing stating that any distributed data store can simultaneously provide at most two out of three guarantees: Consistency (all nodes see the same data at the same time), Availability (every non-failing node returns a response), and Partition Tolerance (the system continues to operate despite arbitrary network message losses or delays).',
    keyPrinciples: [
      'Partition Inevitability: In real-world distributed networks, network partitions (P) cannot be avoided due to cable cuts, routing errors, or hardware failures.',
      'CP Systems: Prioritize consistency over availability; if a network partition occurs, the system halts or errors out rather than returning stale data (e.g. Spanner, Raft-based systems).',
      'AP Systems: Prioritize availability over strict consistency; all nodes respond even if some nodes serve temporarily out-of-date records that will synchronize eventually (e.g. DynamoDB, Cassandra).',
      'PACELC Extension: In normal operation without partitions (Else), systems trade off between Latency (L) and Consistency (C).'
    ],
    practicalExample: 'Banking ledger systems choosing CP to prevent double-spending across partitioned data centers, while social media feed systems choose AP so users can always post and view content.',
    relatedConcepts: ['eventual consistency', 'raft', 'paxos', 'pacelc', 'distributed systems']
  },
  {
    term: 'rest',
    aliases: ['rest api', 'representational state transfer', 'restful'],
    category: 'Web Architecture',
    definition: 'An architectural style for network-based distributed hypermedia systems introduced by Roy Fielding, defining a set of architectural constraints for designing scalable web services centered around stateless client-server interactions and standard representations of resources.',
    keyPrinciples: [
      'Statelessness: Each request from client to server must contain all necessary context; the server stores no client session context between calls.',
      'Uniform Interface: Standard resource identification using URIs, manipulation through representations (JSON/XML), self-descriptive messages, and hypermedia (HATEOAS).',
      'Cacheability: Responses must implicitly or explicitly define themselves as cacheable or non-cacheable to prevent clients from retrieving stale data.',
      'Layered System: Intermediaries (proxies, load balancers, gateways) can be placed between client and server without modifying client interaction semantics.'
    ],
    practicalExample: 'OpenAPI/REST services exposing collections at /v1/users and resources at /v1/users/{id} using GET, POST, PUT, and DELETE methods.',
    relatedConcepts: ['http', 'graphql', 'grpc', 'idempotency', 'statelessness']
  },
  {
    term: 'graphql',
    aliases: ['graphql api'],
    category: 'Web Architecture & APIs',
    definition: 'An open-source data query and manipulation language for APIs, and a runtime for fulfilling those queries with existing data. It allows clients to define the exact structure of the data required, preventing over-fetching and under-fetching.',
    keyPrinciples: [
      'Declarative Data Fetching: Clients specify exact fields needed in a single query.',
      'Strongly Typed Schema: Built around a GraphQL Schema Definition Language (SDL) defining types, fields, queries, and mutations.',
      'Single Endpoint: Typically operates over a single HTTP POST endpoint (/graphql), resolving fields recursively through resolver functions.',
      'Real-Time Subscriptions: Supports event-driven updates over WebSockets.'
    ],
    practicalExample: 'A mobile application fetching a user profile along with only their top 3 recent posts and commenter names in a single round-trip HTTP request.',
    relatedConcepts: ['rest', 'schema', 'resolvers', 'apollo', 'over-fetching']
  },
  {
    term: 'docker',
    aliases: ['containerization', 'containers', 'container'],
    category: 'DevOps & Cloud Infrastructure',
    definition: 'A platform that packages an application and its dependencies into a lightweight, portable container image that executes consistently across any standard Linux or Windows host system.',
    keyPrinciples: [
      'OS-Level Virtualization: Containers share the host kernel while isolating process trees, file systems, and network interfaces using Linux namespaces and cgroups.',
      'Immutability: Images are built in declarative, read-only layers defined by a Dockerfile.',
      'Resource Efficiency: Starts in milliseconds and consumes far less memory than full Virtual Machines (VMs) because no guest OS kernel is booted.'
    ],
    practicalExample: 'Packaging an Express microservice with its Node runtime, system libraries, and dependencies so it behaves identically on a developer laptop and a production Kubernetes pod.',
    relatedConcepts: ['kubernetes', 'cgroups', 'namespaces', 'microservices', 'devops']
  },
  {
    term: 'kubernetes',
    aliases: ['k8s'],
    category: 'DevOps & Cloud Infrastructure',
    definition: 'An open-source container orchestration system for automating application deployment, scaling, load distribution, and management of containerized workloads across clusters of host machines.',
    keyPrinciples: [
      'Declarative Management: Users declare desired cluster state via YAML manifests; controllers continuously reconcile actual state to match desired state.',
      'Pods & Deployments: Pods are the smallest deployable compute units, containing one or more tightly coupled containers sharing network and storage.',
      'Self-Healing: Automatically restarts failed containers, replaces unhealthy pods, and reschedules workloads when worker nodes experience hardware outages.',
      'Service Discovery & Load Balancing: Assigns stable DNS names and distributes traffic evenly across healthy pod replicas.'
    ],
    practicalExample: 'Automatically scaling a web service from 5 to 50 container replicas during peak traffic spikes and rolling out zero-downtime updates.',
    relatedConcepts: ['docker', 'microservices', 'cloud native', 'container orchestration']
  },
  {
    term: 'acid',
    aliases: ['acid properties', 'database transactions', 'database transaction'],
    category: 'Databases & Storage',
    definition: 'A set of four key properties that guarantee database transactions are processed reliably and maintain integrity even in the event of hardware failures, crashes, or power outages: Atomicity, Consistency, Isolation, and Durability.',
    keyPrinciples: [
      'Atomicity: All-or-nothing execution. If any operation within a transaction fails, the entire transaction is rolled back as if it never ran.',
      'Consistency: Transactions can only transition the database from one valid state to another, strictly obeying all constraints, foreign keys, and schemas.',
      'Isolation: Concurrent transactions execute without interfering with one another, preventing dirty reads and phantom writes according to isolation levels (Read Committed, Serializable).',
      'Durability: Once a transaction commits, its modifications are permanently recorded in non-volatile storage (such as a Write-Ahead Log) and survive crashes.'
    ],
    practicalExample: 'Transferring funds between bank accounts: debiting Account A and crediting Account B must either both complete or both fail atomically.',
    relatedConcepts: ['sql', 'transactions', 'wal', 'concurrency control', 'relational databases']
  },
  {
    term: 'microservices',
    aliases: ['microservice architecture', 'distributed microservices'],
    category: 'System Design & Software Architecture',
    definition: 'An architectural approach where a complex application is composed of small, independent, loosely coupled services organized around specific business capabilities, each running in its own process and communicating via lightweight protocols.',
    keyPrinciples: [
      'Single Responsibility: Each service owns its domain bounded context and manages its own independent database schema.',
      'Independent Deployability: Services can be built, updated, scaled, and deployed independently without coordinating releases across the entire engineering organization.',
      'Polyglot Flexibility: Different microservices can use the programming language, framework, and database best suited to their individual problem space.',
      'Resilience through Isolation: A crash or memory leak in one service (e.g. reporting) does not automatically cascade to bring down critical pathways (e.g. checkout).'
    ],
    practicalExample: 'An e-commerce platform divided into discrete Authentication, Catalog, Payment, Order Management, and Notification microservices.',
    relatedConcepts: ['monolith', 'api gateway', 'event-driven architecture', 'system design']
  },
  {
    term: 'solid',
    aliases: ['solid principles', 'object oriented design principles'],
    category: 'Software Design',
    definition: 'A mnemonic acronym for five object-oriented design principles formulated by Robert C. Martin to make software designs more understandable, flexible, and maintainable.',
    keyPrinciples: [
      'S - Single Responsibility Principle (SRP): A class or module should have one, and only one, reason to change.',
      'O - Open/Closed Principle (OCP): Software entities should be open for extension, but closed for modification.',
      'L - Liskov Substitution Principle (LSP): Subtypes must be substitutable for their base types without altering program correctness.',
      'I - Interface Segregation Principle (ISP): Clients should not be forced to depend upon interfaces that they do not use.',
      'D - Dependency Inversion Principle (DIP): High-level modules should not depend on low-level modules; both should depend on abstractions.'
    ],
    practicalExample: 'Refactoring a monolithic 2000-line UserHandler class into separate UserValidator, UserRepository, and NotificationSender services.',
    relatedConcepts: ['clean architecture', 'dependency injection', 'refactoring', 'design patterns']
  },
  {
    term: 'bayes theorem',
    aliases: ['bayes', 'bayesian inference', 'bayes rule', 'bayesian'],
    category: 'Probability & Statistics',
    definition: 'A mathematical formula used to determine conditional probability, describing how to logically update the probability of a hypothesis as new evidence or data becomes available.',
    keyPrinciples: [
      'Formula: P(H|E) = [P(E|H) * P(H)] / P(E)',
      'Prior Probability P(H): The initial belief in the probability of the hypothesis before observing new evidence.',
      'Likelihood P(E|H): The probability of observing evidence E given that hypothesis H is true.',
      'Posterior Probability P(H|E): The refined probability of hypothesis H after observing and accounting for evidence E.',
      'Base Rate Fallacy: Ignoring prior background probabilities when evaluating new statistical tests leads to flawed conclusions.'
    ],
    practicalExample: 'Spam filters calculating the probability that an incoming email is spam based on the presence of words like "lottery" or "wire transfer" given baseline spam frequencies.',
    relatedConcepts: ['probability', 'machine learning', 'statistics', 'decision theory']
  },
  {
    term: 'first principles',
    aliases: ['first principles thinking', 'reasoning from first principles'],
    category: 'Cognitive Science & Logic',
    definition: 'A problem-solving framework that breaks down a complex problem into its most fundamental, foundational truths that cannot be deduced any further, and then reasons upwards from those fundamental axioms to construct innovative conclusions rather than reasoning by analogy.',
    keyPrinciples: [
      'Question Assumptions: Actively identify and deconstruct historical conventions, analogies, and industry habits.',
      'Identify Fundamental Axioms: Strip the system down to immutable physical, mathematical, or empirical realities.',
      'Bottom-Up Synthesis: Combine the validated foundational pieces to design a direct, unencumbered solution.',
      'Avoid Reasoning by Analogy: Refuse to accept that a problem must be solved a certain way simply because others have always done so.'
    ],
    practicalExample: 'Analyzing battery manufacturing costs by calculating the raw market prices of cobalt, nickel, and carbon rather than accepting the average price charged by existing suppliers.',
    relatedConcepts: ['inversion', 'critical thinking', 'mental models', 'logic']
  },
  {
    term: 'tesla coil',
    aliases: ['tesla coils', 'sgtc', 'sstc', 'drsstc', 'vttc', 'resonant air-core transformer'],
    category: 'High Voltage Physics & Electronics',
    definition: 'An electrical resonant transformer circuit invented by Nikola Tesla around 1891 used to produce high-voltage, low-current, high-frequency alternating-current electricity through air-core resonant inductive coupling.',
    keyPrinciples: [
      'Dual LC Resonance: Primary and secondary resonant circuits operate at identical natural frequencies (f0 = 1 / (2*pi*sqrt(L*C))).',
      'Air-Core Loose Magnetic Coupling: Prevents iron-core saturation and hysteresis losses at high radio frequencies (50 kHz - 500 kHz).',
      'Voltage Magnification: Output voltage is multiplied by the circuit Q-factor (often 200 - 500) rather than standard turns ratio alone.',
      'Top Load Terminal Capacitance: Toroidal top load stores electrostatic charge and sets breakout threshold.'
    ],
    practicalExample: 'High-voltage demonstrations, wireless power transmission research, spark-gap radio transmitters, and musical DRSSTC plasma sound systems.',
    relatedConcepts: ['resonance', 'spark gap', 'electromagnetism', 'skin effect', 'lc circuit']
  },
  {
    term: 'lc resonance',
    aliases: ['lc circuit', 'resonant frequency', 'tank circuit', 'tuned circuit', 'electrical resonance'],
    category: 'Electronics & RF Physics',
    definition: 'An electric circuit consisting of an inductor (L) and a capacitor (C) that oscillates at a natural resonant frequency where inductive reactance and capacitive reactance cancel each other out (XL = XC).',
    keyPrinciples: [
      'Resonant Frequency Formula: f0 = 1 / (2 * pi * sqrt(L * C)), where L is inductance in Henries and C is capacitance in Farads.',
      'Energy Oscillation: Stored electrostatic energy in the capacitor electric field transfers continuously into the inductor magnetic field and back.',
      'Zero Net Reactance: At resonance, impedance is purely resistive, maximizing circulating tank current in parallel tanks or total current in series tanks.'
    ],
    practicalExample: 'Radio tuning circuits, induction heaters, wireless charging pads, RF filters, and Tesla coil primary/secondary tanks.',
    relatedConcepts: ['tesla coil', 'q factor', 'impedance matching', 'inductance', 'capacitance']
  },
  {
    term: 'skin effect',
    aliases: ['rf skin effect', 'skin depth'],
    category: 'Electromagnetism & RF Engineering',
    definition: 'The tendency of high-frequency alternating electric current (AC) to distribute itself within a conductor such that the current density is largest near the surface of the conductor and decreases exponentially with greater depths.',
    keyPrinciples: [
      'Skin Depth Formula: delta = sqrt(rho / (pi * f * mu)), shrinking as frequency (f) increases.',
      'Effective AC Resistance: Because inner cross-section carries negligible current, effective resistance rises dramatically at high RF.',
      'Tubular Conductors: Using hollow copper tubing or Litz wire maximizes conductive surface area and reduces RF ohmic losses in high-frequency coils.'
    ],
    practicalExample: 'Using copper refrigeration tubing for Tesla coil primary coils and induction heaters rather than solid wire.',
    relatedConcepts: ['tesla coil', 'eddy currents', 'radio frequency', 'inductance']
  },
  {
    term: 'pid controller',
    aliases: ['pid control', 'proportional integral derivative', 'pid loop'],
    category: 'Control Systems & Robotics',
    definition: 'A control loop feedback mechanism widely used in industrial control systems and robotics that continuously calculates an error value as the difference between a desired setpoint and a measured process variable and applies a correction based on Proportional, Integral, and Derivative terms.',
    keyPrinciples: [
      'Proportional (P): Corrects based on the present magnitude of error; high gain causes oscillation, low gain causes sluggish response.',
      'Integral (I): Corrects based on accumulation of past error over time, eliminating steady-state offset.',
      'Derivative (D): Corrects based on the rate of change of error, dampening future overshoot and improving stability.',
      'Tuning Methods: Ziegler-Nichols, Cohen-Coon, and manual heuristic tuning.'
    ],
    practicalExample: 'Maintaining stable quadcopter drone flight altitude and attitude, 3D printer hotend temperature regulation, and self-balancing robots.',
    relatedConcepts: ['robotics', 'feedback loop', 'kalman filter', 'control theory']
  },
  {
    term: 'h-bridge',
    aliases: ['h bridge', 'motor driver', 'full bridge inverter'],
    category: 'Power Electronics & Robotics',
    definition: 'An electronic circuit that enables a voltage to be applied across a load in either direction, commonly used in robotics to allow DC motors to run forwards or backwards and in inverters to generate AC from DC.',
    keyPrinciples: [
      'Switch Topology: Four switches (MOSFETs/IGBTs) arranged in an H-configuration with the load in the center crossbar.',
      'Shoot-Through Prevention: Diagonal pairs must turn on together; top and bottom switches on the same side must NEVER turn on simultaneously to prevent dead short circuits.',
      'Dead-Time Insertion: A small microsecond delay introduced between switching states to ensure one pair fully turns off before the other turns on.'
    ],
    practicalExample: 'Motor drivers (L298N, DRV8833), pure sine wave inverters, and DRSSTC solid-state Tesla coil primary drives.',
    relatedConcepts: ['mosfet', 'pwm', 'robotics', 'motor control', 'inverters']
  },
  {
    term: 'pwm',
    aliases: ['pulse width modulation', 'duty cycle'],
    category: 'Embedded Systems & Electronics',
    definition: 'A method of reducing the average power delivered by an electrical signal by effectively chopping it into discrete on and off pulses, where the ratio of on-time to total period (duty cycle) determines the effective output voltage or power.',
    keyPrinciples: [
      'Duty Cycle: Percentage of time the signal is HIGH: Duty = (T_on / T_period) * 100%.',
      'Efficiency: Transistors switch between fully ON (low resistance) and fully OFF (zero current), minimizing thermal power loss compared to linear regulators.',
      'Frequency Selection: Must be high enough that the mechanical or electrical load acts as a low-pass filter (e.g. 20 kHz to avoid audible coil whine).'
    ],
    practicalExample: 'Controlling DC motor speed, dimming LEDs without color shift, RC servo position control, and class-D audio amplifiers.',
    relatedConcepts: ['microcontrollers', 'h-bridge', 'duty cycle', 'embedded systems']
  }
];

export function findDefinition(query: string): ConceptDefinition | null {
  const clean = query.toLowerCase().trim();
  const words = clean.match(/[a-z0-9]+/g) || [];
  
  // Exact or alias match
  for (const def of CONCEPT_DEFINITIONS) {
    if (clean === def.term || def.aliases.some(a => clean === a)) {
      return def;
    }
    if (clean.includes(def.term) || def.aliases.some(a => clean.includes(a))) {
      return def;
    }
  }

  // Word intersection match
  let bestMatch: ConceptDefinition | null = null;
  let bestScore = 0;

  for (const def of CONCEPT_DEFINITIONS) {
    let score = 0;
    const termWords = def.term.split(' ');
    for (const w of words) {
      if (termWords.includes(w)) score += 3;
      if (def.aliases.some(a => a.includes(w))) score += 2;
      if (def.category.toLowerCase().includes(w)) score += 1;
    }
    if (score > bestScore && score >= 2) {
      bestScore = score;
      bestMatch = def;
    }
  }

  return bestMatch;
}
