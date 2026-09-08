import { KnowledgeDocument } from './types.js';

export const INITIAL_KNOWLEDGE_DOCS: KnowledgeDocument[] = [
  // --- Programming & Polyglot Architecture Documents ---
  {
    id: 'doc-prog-rust-memory-concurrency',
    title: 'Rust: Ownership, Lifetimes, Tokio Concurrency & Memory Safety',
    category: 'Programming',
    tags: ['rust', 'memory-safety', 'tokio', 'concurrency', 'systems-programming', 'lifetimes'],
    content: `Rust achieves memory safety without a garbage collector via its compile-time affine type system:
1. Ownership & Borrowing: Each value has a single owner. You may have either one mutable reference (&mut T) or any number of immutable references (&T), never both simultaneously. Eliminates data races at compile time.
2. Lifetimes ('a): Tell the compiler how long references are valid to prevent dangling pointer references. Elision rules handle standard function signatures automatically.
3. Thread-Safe Concurrency: Types implementing 'Send' can transfer ownership across thread boundaries; types implementing 'Sync' can be safely referenced across threads (&T is Send). 'Arc<Mutex<T>>' and 'Arc<RwLock<T>>' provide shared mutable state across threads.
4. Asynchronous I/O with Tokio: 'async fn' compiles to a zero-cost finite state machine implementing 'Future'. Tokio's work-stealing multi-threaded scheduler executes cooperative futures without context-switch overhead.
5. Error Handling: 'Result<T, E>' and 'Option<T>' combined with the '?' operator provide explicit, non-allocating error propagation without exceptions.`,
  },
  {
    id: 'doc-prog-go-concurrency-patterns',
    title: 'Go (Golang): Goroutines, Channels, Memory Allocator & CSP Concurrency',
    category: 'Programming',
    tags: ['go', 'golang', 'goroutines', 'channels', 'concurrency', 'microservices'],
    content: `Go uses Communicating Sequential Processes (CSP) where state is shared by communicating through channels:
1. Goroutines & M:N Scheduler: Goroutines have tiny 2KB dynamic segment stacks managed by the GMP scheduler (Goroutine, Machine/OS thread, Processor context), enabling millions of concurrent routines.
2. Channel Patterns:
   - Buffered vs Unbuffered: Unbuffered channels guarantee rendezvous synchronization; buffered channels decouple producer-consumer speeds.
   - Select Multiplexing: Handles multiple channel events non-blockingly with default cases and timeout channels (time.After).
   - Fan-Out / Fan-In: Distribute tasks across worker goroutines and merge results into a single consolidated output stream.
3. Context Propagation: 'context.Context' carries deadlines, cancellation signals, and request-scoped values down service call trees, ensuring child routines terminate cleanly when parent requests abort.
4. Escape Analysis: The Go compiler determines whether variables stay on the stack or escape to the heap, minimizing GC pressure.
5. Sync Primitives: 'sync.Pool' amortizes allocation costs for frequently recycled buffers; 'sync.WaitGroup' coordinates batch completion.`,
  },
  {
    id: 'doc-prog-python-asyncio-internals',
    title: 'Python 3.12: Asyncio, Coroutines, Typing Protocols & High-Performance Patterns',
    category: 'Programming',
    tags: ['python', 'asyncio', 'typing', 'protocols', 'fastapi', 'metaclasses'],
    content: `Modern Python 3.12+ features strong structural subtyping, low-overhead event loops, and optimized bytecode execution:
1. Asyncio Event Loop: Single-threaded cooperative multitasking utilizing 'async/await'. Non-blocking sockets use OS-level selectors (epoll/kqueue). CPU-bound tasks must be dispatched to 'concurrent.futures.ProcessPoolExecutor'.
2. Structural Subtyping with Protocols: 'typing.Protocol' provides compile-time static duck typing without requiring explicit inheritance.
3. Memory Optimization with __slots__: Reduces object memory footprint by eliminating the dynamic instance '__dict__', speeding up attribute lookups.
4. Generators & Itertools: Memory-efficient streaming of large datasets with 'yield' and 'yield from', evaluated lazily on demand.
5. GIL Nuances & Sub-Interpreters: Python 3.12 introduces per-interpreter GIL support (PEP 684), allowing multi-core CPU scaling in pure Python via isolated sub-interpreters.`,
  },
  {
    id: 'doc-prog-ts-patterns',
    title: 'Modern TypeScript: Discriminated Unions, Mapped Types & Advanced Type Systems',
    category: 'Programming',
    tags: ['typescript', 'design-patterns', 'software-engineering', 'clean-code', 'types'],
    content: `TypeScript provides strong structural typing with compile-time verification:
1. Discriminated Unions: Group types with a common literal discriminator tag to allow exhaustive pattern matching with TypeScript's 'never' type check.
2. Type-Level Programming: Conditional types ('T extends U ? X : Y'), template literal types, mapped types ('[K in keyof T]'), and 'infer' keyword enable compile-time schema validation and type transformations.
3. Generics & Type Constraints: Use 'T extends Record<string, unknown>' to preserve precise parameter and return types without falling back to 'any'.
4. Immutability with 'Readonly<T>' and 'as const' assertions for literal values.
5. Result Types: Return '{ ok: true, data: T } | { ok: false, error: E }' to enforce explicit failure handling without uncaught runtime exceptions.`,
  },
  {
    id: 'doc-prog-cpp-modern-patterns',
    title: 'Modern C++ (C++20/C++23): RAII, Move Semantics, Concepts & Cache Locality',
    category: 'Programming',
    tags: ['cpp', 'cplusplus', 'raii', 'concepts', 'coroutines', 'performance'],
    content: `Modern C++ emphasizes zero-overhead abstractions, deterministic resource management, and compile-time constraints:
1. RAII (Resource Acquisition Is Initialization): Encapsulate resource ownership in constructors and deterministic release in destructors. Use 'std::unique_ptr' for exclusive ownership and 'std::shared_ptr' only when reference counting is necessary.
2. Move Semantics & Perfect Forwarding: Rvalue references ('T&&') and 'std::move' eliminate redundant deep copies by transferring buffer ownership; 'std::forward<T>' preserves value category in generic template factories.
3. Concepts & Constraints: C++20 concepts replace SFINAE boilerplate with clear compile-time requirements ('template <std::integral T>').
4. Coroutines: Stackless coroutines with 'co_await', 'co_yield', and 'co_return' for asynchronous task scheduling and generator streams.
5. Cache Locality & Data-Oriented Design: Sequential array layouts ('std::vector') maximize CPU L1/L2 cache hit rates compared to pointer-chasing node graphs.`,
  },
  {
    id: 'doc-prog-c-systems-posix',
    title: 'C (POSIX / Systems): Pointer Arithmetic, Memory Alignment & Socket Programming',
    category: 'Programming',
    tags: ['c', 'posix', 'pointers', 'memory-alignment', 'sockets', 'systems'],
    content: `C remains the foundation of operating systems, kernels, and embedded performance:
1. Pointer Arithmetic & Memory Alignment: Aligning structures to CPU word boundaries (e.g., 64-bit alignment) avoids bus faults and unaligned memory penalty.
2. Memory Allocation & Custom Slabs: Managing custom fixed-size memory pools (slab allocators) prevents fragmentation in long-running services and avoids generic malloc/free lock contention.
3. Non-Blocking I/O & Multiplexing: 'epoll' (Linux) and 'kqueue' (BSD/macOS) provide O(1) event notification for tens of thousands of concurrent network file descriptors.
4. Zero-Copy I/O: 'sendfile(2)' and 'splice(2)' transfer data directly between kernel file buffers and network sockets without copying into user-space memory.
5. Defensive C Invariants: Always check bounds, check integer overflow before allocation, use 'size_t', clear sensitive memory with 'explicit_bzero', and check return codes.`,
  },
  {
    id: 'doc-prog-java-jvm-internals',
    title: 'Java 21+: Project Loom Virtual Threads, ZGC & High-Throughput JVM Architecture',
    category: 'Programming',
    tags: ['java', 'jvm', 'virtual-threads', 'loom', 'zgc', 'spring-boot'],
    content: `Java 21+ transforms enterprise concurrent throughput with lightweight virtual threads and generational low-latency garbage collection:
1. Virtual Threads (Project Loom): Lightweight user-mode threads managed by the JVM rather than the OS. Blocking I/O operations unmount the virtual thread from its carrier OS thread, enabling millions of concurrent connections without reactive framework complexity.
2. ZGC & Generational ZGC: Concurrent, low-latency garbage collector with pause times guaranteed under 1 millisecond regardless of heap sizes ranging from megabytes to terabytes.
3. Record Patterns & Pattern Matching: Exhaustive switch expressions and destructuring patterns provide expressive, immutable data-carrier modeling.
4. Foreign Function & Memory API (Panama): Direct, safe access to off-heap memory and native C libraries without JNI overhead.
5. Java Memory Model (JMM): Strict happens-before relationships guaranteed by 'volatile' variables, atomic classes, and synchronized locks.`,
  },
  {
    id: 'doc-prog-kotlin-coroutines',
    title: 'Kotlin: Structured Concurrency, Flow Streams & Sealed Class Modeling',
    category: 'Programming',
    tags: ['kotlin', 'coroutines', 'flow', 'android', 'kmp', 'functional'],
    content: `Kotlin combines concise syntax, functional patterns, and first-class structured concurrency:
1. Structured Concurrency: CoroutineScope hierarchies guarantee that child coroutines never leak; if a parent job cancels or fails, all child tasks are cancelled systematically.
2. Cold Flows & Hot SharedFlow/StateFlow:
   - Flow: Cold asynchronous data stream emitted lazily upon collection.
   - StateFlow: Hot state holder emitting the current state and subsequent updates to multiple collectors with backpressure support.
3. Algebraic Data Modeling: Sealed classes and sealed interfaces allow type-safe state machines with compile-time exhaustive 'when' expressions.
4. Inline Value Classes: Zero-overhead domain wrappers that compile down to underlying primitive types while enforcing strong typing.
5. Kotlin Multiplatform (KMP): Share business logic, networking, and state management across iOS, Android, Desktop, and Web.`,
  },
  {
    id: 'doc-prog-swift-concurrency',
    title: 'Swift 5.9+: Swift Actors, Async/Await, ARC & Protocol-Oriented Architecture',
    category: 'Programming',
    tags: ['swift', 'actors', 'async-await', 'arc', 'swiftui', 'ios'],
    content: `Modern Swift provides compile-time data race safety through modern concurrency and value semantics:
1. Swift Actors: Reference types that isolate their mutable state. Only one task can execute code within an actor at any given time, preventing data races without manual lock management.
2. Sendable Types: Types safe to transfer across concurrency domains. Value types (structs, enums) and actors conform to 'Sendable'.
3. Automatic Reference Counting (ARC): Manages memory through retain/release counts. Prevent retain cycles in closures and parent-child graphs using 'weak' or 'unowned' references.
4. Protocol-Oriented Programming (POP): Decouple components using protocols, default implementations via protocol extensions, and associated types.
5. TaskGroup & Structured Concurrency: Concurrently execute bounded tasks, dynamically aggregate results, and ensure child task cancellation on parent failure.`,
  },
  {
    id: 'doc-prog-csharp-dotnet-perf',
    title: 'C# (.NET 8+): Span<T>, Zero-Allocation Memory, Async Streams & TPL',
    category: 'Programming',
    tags: ['csharp', 'dotnet', 'span', 'performance', 'async-streams', 'backend'],
    content: `C# and .NET 8 deliver high-performance cloud and systems engineering capabilities:
1. Span<T> & Memory<T>: Contiguous memory representations enabling zero-copy slicing of heap arrays, stack-allocated buffers ('stackalloc'), and unmanaged native memory without allocating GC objects.
2. Task Parallel Library (TPL) & ValueTasks: 'ValueTask<T>' avoids Task allocation on synchronously completing execution paths.
3. Async Streams (IAsyncEnumerable<T>): Asynchronously stream collections with 'await foreach' and non-blocking iteration.
4. Source Generators & Native AOT: Compile C# directly to native machine code without JIT compilation, providing sub-millisecond cold starts and reduced binary footprints.
5. Pattern Matching & Records: Positional and property pattern matching combined with immutable record structs.`,
  },
  {
    id: 'doc-prog-sql-query-tuning',
    title: 'SQL & PostgreSQL: Index Optimization, Window Functions, CTEs & Isolation Levels',
    category: 'Programming',
    tags: ['sql', 'postgresql', 'indexes', 'query-optimization', 'database', 'performance'],
    content: `Writing efficient, scalable SQL requires deep understanding of query planning and indexing:
1. Index Types & Trade-offs:
   - B-Tree: Standard for equality and range queries (<, <=, =, >=, >).
   - GIN (Generalized Inverted Index): Ideal for array containment, JSONB queries, and full-text search.
   - BRIN (Block Range Index): Extremely compact indexes for massive append-only timeseries tables.
2. Window Functions: 'ROW_NUMBER()', 'RANK()', 'DENSE_RANK()', 'LAG()', 'LEAD()' compute aggregations across partitions without collapsing query rows into single groups.
3. CTEs & Recursive CTEs: Common Table Expressions simplify multi-step workflows; recursive CTEs traverse hierarchical graphs, trees, and dependency charts cleanly.
4. Transaction Isolation Levels: Read Committed (default), Repeatable Read (prevents non-repeatable reads), Serializable (prevents phantom reads and write skews using SSI).
5. Query Tuning with EXPLAIN ANALYZE: Identify sequential scans on large tables, costly nested loop joins, and sort memory spills.`,
  },
  {
    id: 'doc-prog-bash-scripting',
    title: 'Defensive Shell Scripting: Bash, Traps, Signals & POSIX Standards',
    category: 'Programming',
    tags: ['bash', 'shell', 'scripting', 'linux', 'devops', 'automation'],
    content: `Production-grade shell scripts require defensive error handling and strict boundary checks:
1. Defensive Execution Flag: 'set -euo pipefail' (Exit immediately if a command exits with a non-zero status; treat unset variables as errors; pipelines fail if any sub-command fails).
2. Signal Trapping: 'trap cleanup EXIT INT TERM' ensures temporary files, locks, and sub-processes are destroyed on exit or termination.
3. Process Substitution: '<(command)' passes command outputs as temporary file descriptors without writing intermediate files to disk.
4. Safe Parameter Expansion: '\${VAR:-default}', '\${VAR:?error message}', and '\${VAR%suffix}' for robust string parsing.
5. Text Processing with Awk and Sed: Stream-oriented pattern scanning, columnar parsing, and in-place substitutions.`,
  },
  {
    id: 'doc-prog-elixir-beam-otp',
    title: 'Elixir & BEAM: OTP GenServers, Supervision Trees & Massive Fault Tolerance',
    category: 'Programming',
    tags: ['elixir', 'erlang', 'otp', 'genserver', 'fault-tolerance', 'functional'],
    content: `Elixir runs on the Erlang BEAM virtual machine designed for telecommunications nine-nines availability:
1. Actor Model & Lightweight Processes: Processes are completely isolated with private heaps and communicate solely via asynchronous message passing. Garbage collection occurs per process.
2. GenServer: Generic server behaviour encapsulating client-server state, synchronous 'call/3', and asynchronous 'cast/2'.
3. Supervision Trees: 'Let It Crash' philosophy where supervisors restart failing worker processes according to strategies (one_for_all, one_for_one, rest_for_one).
4. Pattern Matching & Guards: Deconstruct data structures, headers, and function parameters declaratively.
5. Pipe Operator (|>): Chains transformations cleanly from one function to the next, enhancing readability.`,
  },
  {
    id: 'doc-prog-zig-comptime-systems',
    title: 'Zig: Explicit Memory Allocation, Comptime Metaprogramming & C ABI Interop',
    category: 'Programming',
    tags: ['zig', 'systems-programming', 'comptime', 'memory', 'performance'],
    content: `Zig provides extreme simplicity, predictable performance, and total control over system resources:
1. No Hidden Allocations: Functions requiring dynamic memory explicitly take a 'std.mem.Allocator' parameter. Allows swapping between GeneralPurposeAllocator, ArenaAllocator, and FixedBufferAllocator.
2. Comptime: Execute arbitrary Zig code at compile time without macros or separate preprocessors. Enables generic data structures and type introspection.
3. Error Sets & Handling: Error types are lightweight integer unions with 'try' and 'catch' expressions; no hidden exception unwinding.
4. Seamless C Interoperability: Directly include C headers ('@cImport') and call C libraries without wrapper glue code or performance penalty.`,
  },
  {
    id: 'doc-prog-dsa-atlas',
    title: 'Algorithms & Data Structures: LRU, Tries, Trees, Graphs & Dynamic Programming',
    category: 'Programming',
    tags: ['algorithms', 'data-structures', 'lru-cache', 'trie', 'graphs', 'dynamic-programming'],
    content: `Essential high-performance data structures and algorithmic paradigms across languages:
1. LRU Cache: O(1) Get and Put operations combining a Hash Map with a Doubly Linked List.
2. Trie (Prefix Tree): O(K) lookup, insertion, and prefix search where K is key length, ideal for autocomplete and routing tables.
3. Graph Algorithms:
   - Dijkstra's Algorithm: Shortest path in weighted graphs using Min-Heap priority queues in O((V + E) log V).
   - Topological Sort: Orders directed acyclic graph (DAG) tasks using Kahn's algorithm or DFS.
4. Dynamic Programming: Optimal substructure and overlapping subproblems solved via memoization (top-down) or tabulation (bottom-up).
5. Sliding Window & Two Pointers: Optimizes O(N^2) subarray and substring searches down to linear O(N) time complexity.`,
  },

  // --- Systems & Distributed Architecture Documents ---
  {
    id: 'doc-prog-concurrency-workers',
    title: 'High-Throughput Concurrency & Worker Pool Architecture',
    category: 'Systems Architecture',
    tags: ['concurrency', 'worker-pool', 'node', 'performance', 'throughput'],
    content: `In high-throughput microservices, concurrent task execution requires controlled resource utilization:
1. Worker Pool Pattern: Maintain a fixed or bounded pool of worker routines/threads reading from a shared thread-safe queue. Prevents out-of-memory errors caused by unbounded task spawning.
2. Backpressure & Token Bucket: When inbound requests outpace processing capacity, apply backpressure or 429 status codes. Token bucket algorithms allow burst handling while enforcing sustainable sustained rates.
3. Event Loop Offloading: In Node.js or JavaScript runtimes, heavy CPU-bound computations should be partitioned into async micro-tasks via setImmediate, or offloaded to worker_threads to prevent starving the single-threaded event loop.
4. Idempotency Keys: For all non-read mutating requests, client-supplied unique keys ensure deduplication during network retries.`,
  },
  {
    id: 'doc-sys-cap-consistency',
    title: 'Distributed Systems: CAP Theorem, Consistency Models & Consensus',
    category: 'Systems Architecture',
    tags: ['distributed-systems', 'cap-theorem', 'consensus', 'raft', 'database'],
    content: `In distributed systems, trade-offs between consistency, availability, and partition tolerance are fundamental:
1. CAP Theorem: Under network partitions (P), a system must trade off between Strong Consistency (C) where every read receives the most recent write, and High Availability (A) where non-failing nodes return responses.
2. PACELC Extension: In the absence of partitions (E), the trade-off is between Latency (L) and Consistency (C).
3. Raft Consensus: Reaches distributed consensus via Leader Election, Log Replication, and Safety invariants. Leaders commit entries only when acknowledged by a quorum (majority) of followers.
4. Eventual Consistency & CRDTs: Conflict-free Replicated Data Types resolve concurrent distributed updates deterministically without centralized coordination locks.
5. Cache Invalidation Strategies: Cache-aside (lazy load), Write-through (sync update), Write-behind (async batching), and TTL eviction paired with LRU or LFU policies.`,
  },
  {
    id: 'doc-math-vectors-embeddings',
    title: 'Vector Embeddings, Cosine Similarity & Information Retrieval',
    category: 'Data Science & Math',
    tags: ['embeddings', 'vector-search', 'cosine-similarity', 'tfidf', 'rag'],
    content: `Vector embeddings represent high-dimensional semantics in geometric space:
1. Cosine Similarity: Measures the cosine of the angle between two vectors A and B: cos(theta) = (A . B) / (||A|| * ||B||). Ranges from -1 to 1, where 1 indicates identical directional orientation regardless of magnitude.
2. BM25 (Best Matching 25): A probabilistic ranking function used in information retrieval. It improves on standard TF-IDF by incorporating document length normalization and term frequency saturation: score(D, Q) = sum(IDF(qi) * (f(qi, D) * (k1 + 1)) / (f(qi, D) + k1 * (1 - b + b * (|D| / avgdl)))).
3. Approximate Nearest Neighbor (ANN): High-dimensional search algorithms like HNSW (Hierarchical Navigable Small World) and IVF-PQ balance sub-millisecond retrieval with high recall accuracy.
4. RAG Pipeline: Enhances generative inference by retrieving top-K authoritative domain passages, concatenating them with user prompts, and constraining hallucination.`,
  },
  {
    id: 'doc-math-bayes-probability',
    title: 'Bayesian Inference, Probability Theory & Statistical Decision Making',
    category: 'Data Science & Math',
    tags: ['bayes', 'probability', 'statistics', 'decision-theory', 'logic'],
    content: `Bayes' Theorem updates the probability of a hypothesis given observed evidence:
P(H|E) = [P(E|H) * P(H)] / P(E)
Where:
- P(H) is the Prior probability of the hypothesis.
- P(E|H) is the Likelihood of observing evidence E given hypothesis H is true.
- P(E) is the Marginal probability of the evidence across all hypotheses.
- P(H|E) is the Posterior probability updated in light of evidence.
Application in Reasoning:
1. Base Rate Fallacy: Always account for the prior frequency of an event before over-weighting sensational new signals.
2. Occam's Razor: When multiple hypotheses explain the evidence equally well, the hypothesis with the fewest unverified assumptions has the higher prior probability.
3. Information Entropy: Shannon entropy H(X) = -sum(p(x) * log2(p(x))) measures uncertainty or information content in a random variable.`,
  },
  {
    id: 'doc-reasoning-first-principles',
    title: 'First Principles Reasoning, Inversion & Analytical Frameworks',
    category: 'Reasoning & Logic',
    tags: ['first-principles', 'inversion', 'mental-models', 'critical-thinking', 'logic'],
    content: `Structured analytical thinking methods for solving non-trivial problems:
1. First Principles Thinking: Deconstruct complex problems into the most fundamental truths that cannot be deduced any further, then build reasoned conclusions upwards from there, rather than reasoning by analogy.
2. Inversion (Carl Jacobi): Instead of asking 'How do I succeed?', ask 'How could this project fail completely?', and systematically build safeguards to avoid those failure modes.
3. Second-Order Thinking: Evaluate not just immediate outcomes (first-order), but subsequent cascading consequences, counter-responses, and equilibrium shifts.
4. Counterfactual Reasoning: Explore 'What if factor X had not happened?' to isolate causal mechanisms from mere correlational noise.
5. Steel-Manning: Formulate the strongest possible counter-argument to your own premise before concluding, ensuring intellectual rigor.`,
  },
  {
    id: 'doc-ai-nova-specs',
    title: 'Nova Core AI Architecture, Protocols & Microservice Standards',
    category: 'Nova Core Specifications',
    tags: ['nova-core', 'architecture', 'openai-compatible', 'microservice', 'rag'],
    content: `Nova Core AI is a standalone, private, high-performance AI microservice built for zero-cost self-hosting:
1. OpenAI Compatibility: Implements standard endpoints POST /v1/chat/completions, GET /v1/models, and POST /v1/learn. Supports drop-in integration with official OpenAI SDKs in Python, Node.js, LangChain, and Curl.
2. Multi-Stage Pipeline:
   - Intent Routing: Classifies prompt intent (coding, architecture, reasoning, casual, factual) and extracts named entities.
   - Vector & BM25 Retrieval: Searches internal domain index for authoritative context.
   - Conversational Memory Graph: Retains user facts, cross-session preferences, and entity associations.
   - Autonomous Reasoning Engine: Generates multi-step analytical thought traces and delivers coherent, verified responses without requiring third-party paid subscriptions.
3. Security: Supports Bearer token header verification (API_SECRET_KEY) and configurable CORS headers for private VPC or edge deployment.`,
  },
  {
    id: 'doc-prog-rest-api-design',
    title: 'RESTful API Standards, Error Envelopes & HTTP Best Practices',
    category: 'Programming',
    tags: ['rest', 'api-design', 'http', 'standards', 'error-handling'],
    content: `Industry-standard API conventions for microservices:
1. Consistent URI Naming: Use plural nouns for resources (e.g., /v1/models, /v1/messages). Use HTTP methods (GET, POST, PUT, PATCH, DELETE) for actions rather than embedding verbs in URIs.
2. Status Codes:
   - 200 OK: Successful synchronous request.
   - 201 Created: New resource generated.
   - 400 Bad Request: Malformed JSON or client validation error.
   - 401 Unauthorized: Missing or invalid authentication token.
   - 404 Not Found: Requested endpoint or resource does not exist.
   - 429 Too Many Requests: Rate limit exceeded.
   - 500 Internal Server Error: Unhandled server crash.
3. Error Envelope: Return uniform JSON objects on errors: { error: { message: string, type: string, code: number, param?: string } }.
4. Pagination: For unbounded collections, provide cursor-based pagination with limit and starting_after parameters to avoid deep offset degradation.`,
  },
  {
    id: 'doc-sec-microservice-hardening',
    title: 'Microservice Security, Token Validation & Defense in Depth',
    category: 'Systems Architecture',
    tags: ['security', 'auth', 'tokens', 'cors', 'hardening'],
    content: `Best practices for protecting standalone inference microservices:
1. Bearer Token Authentication: Validate Authorization: Bearer <token> headers using constant-time string comparison (crypto.timingSafeEqual) to prevent timing-attack leakage.
2. Rate Limiting: Apply sliding-window or leaky-bucket limiting per client IP or API key to prevent Denial-of-Service resource exhaustion.
3. Input Sanitization: Validate input payloads against strict schema schemas, enforce max_tokens and prompt length ceilings to prevent memory allocation attacks.
4. CORS Controls: Enforce strict origin policies in production environments while allowing authorized domains for API telemetry dashboards.
5. Secrets Management: Never hardcode private keys in source code; retrieve via environment variables and mask in telemetry logs.`,
  },
];
