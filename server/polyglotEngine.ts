export interface SupportedLanguage {
  id: string;
  name: string;
  category: 'systems' | 'backend' | 'web' | 'functional' | 'scripting' | 'database' | 'mobile';
  paradigm: string;
  extension: string;
  defaultPrompt: string;
  keyFeatures: string[];
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    id: 'rust',
    name: 'Rust',
    category: 'systems',
    paradigm: 'Multi-paradigm, Functional, Concurrent, Systems',
    extension: 'rs',
    defaultPrompt: 'Implement a thread-safe LRU Cache with O(1) operations using Arc<Mutex<T>> and HashMap in Rust.',
    keyFeatures: ['Zero-cost abstractions', 'Memory safety without GC', 'Fearless concurrency', 'Lifetimes & Borrow checker', 'Tokio async ecosystem']
  },
  {
    id: 'go',
    name: 'Go (Golang)',
    category: 'backend',
    paradigm: 'Concurrent, Imperative, Structural',
    extension: 'go',
    defaultPrompt: 'Implement a worker pool with bounded channels, context cancellation, and graceful shutdown in Go.',
    keyFeatures: ['Goroutines & Channels', 'CSP concurrency model', 'Fast compilation', 'Built-in race detector', 'Standard library networking']
  },
  {
    id: 'python',
    name: 'Python',
    category: 'scripting',
    paradigm: 'Multi-paradigm, Dynamic, Object-Oriented, Functional',
    extension: 'py',
    defaultPrompt: 'Write an asynchronous rate limiter with sliding window log algorithm using asyncio in Python 3.12.',
    keyFeatures: ['Asyncio & Coroutines', 'Rich typing & Protocols', 'Decorators & Metaclasses', 'Generators & Itertools', 'Data science ecosystem']
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    category: 'web',
    paradigm: 'Static, Functional, Object-Oriented, Event-Driven',
    extension: 'ts',
    defaultPrompt: 'Build a type-safe Event Emitter with strict generic event map and inference in TypeScript.',
    keyFeatures: ['Algebraic data types', 'Discriminated unions', 'Type-level mapped types', 'Exhaustive pattern checks', 'Modern ESNext support']
  },
  {
    id: 'cpp',
    name: 'C++ (C++20/C++23)',
    category: 'systems',
    paradigm: 'Multi-paradigm, Generic, Procedural, Object-Oriented',
    extension: 'cpp',
    defaultPrompt: 'Implement a lock-free Single-Producer Single-Consumer (SPSC) queue using std::atomic and memory fences in modern C++20.',
    keyFeatures: ['RAII & Smart pointers', 'Concepts & Constraints', 'Ranges & Views', 'Coroutines (co_await)', 'Zero-overhead abstractions']
  },
  {
    id: 'c',
    name: 'C (Systems / POSIX)',
    category: 'systems',
    paradigm: 'Procedural, Imperative, Low-level Systems',
    extension: 'c',
    defaultPrompt: 'Implement a custom fixed-size slab memory allocator with block headers and alignment in ANSI C.',
    keyFeatures: ['Explicit pointer arithmetic', 'Cache-line alignment', 'Direct POSIX syscalls', 'Minimal runtime overhead', 'Bitwise manipulation']
  },
  {
    id: 'java',
    name: 'Java (Java 21+)',
    category: 'backend',
    paradigm: 'Object-Oriented, Class-based, Concurrent, Generic',
    extension: 'java',
    defaultPrompt: 'Build a high-throughput HTTP server pipeline utilizing Java 21 Project Loom Virtual Threads and Structured Concurrency.',
    keyFeatures: ['Virtual Threads (Loom)', 'ZGC Low-latency GC', 'Record patterns & Pattern matching', 'Foreign Function & Memory API', 'Robust JVM ecosystem']
  },
  {
    id: 'kotlin',
    name: 'Kotlin',
    category: 'mobile',
    paradigm: 'Multi-paradigm, Functional, Object-Oriented, Concurrent',
    extension: 'kt',
    defaultPrompt: 'Implement a reactive state manager using Kotlin Coroutines, StateFlow, and SharedFlow with backpressure handling.',
    keyFeatures: ['First-class Coroutines', 'Flow reactive streams', 'Null-safety system', 'Sealed class hierarchies', 'Kotlin Multiplatform (KMP)']
  },
  {
    id: 'swift',
    name: 'Swift',
    category: 'mobile',
    paradigm: 'Protocol-Oriented, Functional, Concurrent, Imperative',
    extension: 'swift',
    defaultPrompt: 'Build an Actor-isolated distributed cache with async/await, TaskGroup, and Sendable conformance in Swift 5.9.',
    keyFeatures: ['Swift Actors & Concurrency', 'Protocol-Oriented Design', 'Value semantics & Structs', 'ARC memory model', 'SwiftUI declarative state']
  },
  {
    id: 'csharp',
    name: 'C# (.NET 8+)',
    category: 'backend',
    paradigm: 'Multi-paradigm, Component-Oriented, Generic, Functional',
    extension: 'cs',
    defaultPrompt: 'Implement a high-performance zero-allocation binary protocol parser using Span<T>, Memory<T>, and ReadOnlySequence<T> in C# .NET 8.',
    keyFeatures: ['Span<T> zero-allocation', 'Task Parallel Library (TPL)', 'Async streams (IAsyncEnumerable)', 'Pattern matching & Records', 'High-throughput ASP.NET Core']
  },
  {
    id: 'sql',
    name: 'SQL (PostgreSQL / ANSI)',
    category: 'database',
    paradigm: 'Declarative, Relational, Set-oriented',
    extension: 'sql',
    defaultPrompt: 'Write an optimized recursive CTE query to calculate hierarchical organizational reporting trees and aggregation in PostgreSQL.',
    keyFeatures: ['Advanced Window functions', 'Recursive CTEs', 'GIN/GiST index optimization', 'ACID transaction isolation', 'JSONB querying & indexing']
  },
  {
    id: 'bash',
    name: 'Bash / Shell',
    category: 'scripting',
    paradigm: 'Command-language, Pipeline, Scripting',
    extension: 'sh',
    defaultPrompt: 'Write a robust zero-downtime deployment script with trap handlers, atomic symlink switching, and health checking in Bash.',
    keyFeatures: ['Defensive (set -euo pipefail)', 'Signal traps & Cleanups', 'Process substitution', 'Stream processing (awk/sed)', 'Subshell isolation']
  },
  {
    id: 'elixir',
    name: 'Elixir (Erlang/OTP)',
    category: 'functional',
    paradigm: 'Concurrent, Functional, Distributed, Fault-Tolerant',
    extension: 'ex',
    defaultPrompt: 'Implement a supervised GenServer worker pool with dynamic supervisors and automatic crash recovery in Elixir.',
    keyFeatures: ['BEAM virtual machine', 'Actor model & GenServer', 'Supervision trees', 'Pattern matching & Pipe operator', 'Massive concurrency']
  },
  {
    id: 'zig',
    name: 'Zig',
    category: 'systems',
    paradigm: 'Imperative, Systems, Compile-time metaprogramming',
    extension: 'zig',
    defaultPrompt: 'Implement a generic dynamic array list with explicit allocator passing and compile-time comptime types in Zig.',
    keyFeatures: ['Comptime code execution', 'Explicit memory allocation', 'No hidden control flow', 'Seamless C ABI interoperability', 'No preprocessor']
  },
  {
    id: 'haskell',
    name: 'Haskell',
    category: 'functional',
    paradigm: 'Purely Functional, Lazy, Statically Typed',
    extension: 'hs',
    defaultPrompt: 'Implement a monadic parser combinator library with Either and State monads in Haskell.',
    keyFeatures: ['Pure immutability', 'Lazy evaluation', 'Monads & Typeclasses', 'Strong static type inference', 'Mathematical proofs']
  },
  {
    id: 'dart',
    name: 'Dart (Flutter)',
    category: 'mobile',
    paradigm: 'Object-Oriented, Client-optimized, Async',
    extension: 'dart',
    defaultPrompt: 'Implement an isolate-based background worker pool with SendPort and ReceivePort for heavy computations in Dart.',
    keyFeatures: ['Isolate-based concurrency', 'Sound null safety', 'AOT & JIT compilation', 'Streams and Futures', 'Flutter framework integration']
  },
  {
    id: 'scala',
    name: 'Scala',
    category: 'functional',
    paradigm: 'Functional, Object-Oriented, Generic, Concurrent',
    extension: 'scala',
    defaultPrompt: 'Implement an immutable persistent Red-Black Tree using pattern matching and higher-kinded types in Scala 3.',
    keyFeatures: ['Type-level programming', 'Cats/ZIO functional effect systems', 'Akka/Pekko Actor system', 'Seamless Java interoperability', 'Givens & Extension methods']
  },
  {
    id: 'julia',
    name: 'Julia',
    category: 'scripting',
    paradigm: 'Multiple Dispatch, High-performance Numerical, Dynamic',
    extension: 'jl',
    defaultPrompt: 'Implement a vectorized parallel matrix multiplication kernel using SIMD macro and multi-threading in Julia.',
    keyFeatures: ['Multiple dispatch', 'LLVM JIT compilation', 'Native SIMD vectorization', 'High-performance scientific computing', 'Distributed computing']
  },
  {
    id: 'lua',
    name: 'Lua / Luau',
    category: 'scripting',
    paradigm: 'Lightweight, Embeddable, Prototype-based, Multi-paradigm',
    extension: 'lua',
    defaultPrompt: 'Implement a stateful finite state machine (FSM) using metatables and coroutines in Lua.',
    keyFeatures: ['Metatables & Metamethods', 'Ultra-lightweight footprint', 'First-class Coroutines', 'C host embedding', 'Fast LuaJIT engine']
  },
  {
    id: 'php',
    name: 'PHP (PHP 8.3+)',
    category: 'web',
    paradigm: 'Imperative, Functional, Object-Oriented, Dynamic',
    extension: 'php',
    defaultPrompt: 'Build a high-performance middleware pipeline with readonly classes, fibers, and attribute reflection in PHP 8.3.',
    keyFeatures: ['Fibers asynchronous runtime', 'Readonly properties & classes', 'Attributes & Enums', 'JIT compiler', 'Strong type declarations']
  },
  {
    id: 'ruby',
    name: 'Ruby (Ruby 3.3+)',
    category: 'scripting',
    paradigm: 'Object-Oriented, Dynamic, Reflective, Functional',
    extension: 'rb',
    defaultPrompt: 'Implement a concurrent pipeline using Ractors and Fiber Scheduler for non-blocking I/O in Ruby 3.3.',
    keyFeatures: ['Ractors true parallelism', 'Fiber scheduler for async', 'Blocks & Enumerable mixins', 'Metaprogramming & DSLs', 'YJIT optimizing compiler']
  },
];

export class PolyglotEngine {
  public getAllLanguages(): SupportedLanguage[] {
    return SUPPORTED_LANGUAGES;
  }

  public getLanguageById(id: string): SupportedLanguage | undefined {
    return SUPPORTED_LANGUAGES.find(l => l.id === id.toLowerCase());
  }

  public detectLanguageFromText(text: string): SupportedLanguage | null {
    const lower = text.toLowerCase();
    
    // Check specific explicit mentions
    if (lower.includes('in rust') || lower.includes('rust code') || lower.includes('rustlang') || lower.includes('cargo')) {
      return this.getLanguageById('rust') || null;
    }
    if (lower.includes('in go') || lower.includes('golang') || lower.includes('go code') || lower.includes('goroutine')) {
      return this.getLanguageById('go') || null;
    }
    if (lower.includes('in python') || lower.includes('python3') || lower.includes('python code') || lower.includes('asyncio') || lower.includes('pytest')) {
      return this.getLanguageById('python') || null;
    }
    if (lower.includes('in typescript') || lower.includes('typescript code') || lower.includes('ts code') || lower.includes('type safe')) {
      return this.getLanguageById('typescript') || null;
    }
    if (lower.includes('in c++') || lower.includes('cpp') || lower.includes('c++20') || lower.includes('c++23') || lower.includes('modern c++')) {
      return this.getLanguageById('cpp') || null;
    }
    if (lower.includes('in c ') || lower.includes('ansi c') || lower.includes('posix c') || lower.includes('c pointer') || lower.includes('malloc')) {
      return this.getLanguageById('c') || null;
    }
    if (lower.includes('in java') || lower.includes('java 21') || lower.includes('virtual threads') || lower.includes('jvm')) {
      return this.getLanguageById('java') || null;
    }
    if (lower.includes('in kotlin') || lower.includes('coroutines in kotlin') || lower.includes('kmp') || lower.includes('stateflow')) {
      return this.getLanguageById('kotlin') || null;
    }
    if (lower.includes('in swift') || lower.includes('swiftui') || lower.includes('swift concurrency') || lower.includes('swift actor')) {
      return this.getLanguageById('swift') || null;
    }
    if (lower.includes('in c#') || lower.includes('csharp') || lower.includes('.net') || lower.includes('dotnet')) {
      return this.getLanguageById('csharp') || null;
    }
    if (lower.includes('in sql') || lower.includes('postgresql') || lower.includes('postgres') || lower.includes('sql query') || lower.includes('cte')) {
      return this.getLanguageById('sql') || null;
    }
    if (lower.includes('in bash') || lower.includes('shell script') || lower.includes('zsh') || lower.includes('bash script')) {
      return this.getLanguageById('bash') || null;
    }
    if (lower.includes('in elixir') || lower.includes('erlang') || lower.includes('genserver') || lower.includes('beam')) {
      return this.getLanguageById('elixir') || null;
    }
    if (lower.includes('in zig') || lower.includes('ziglang') || lower.includes('comptime')) {
      return this.getLanguageById('zig') || null;
    }
    if (lower.includes('in haskell') || lower.includes('monad in haskell')) {
      return this.getLanguageById('haskell') || null;
    }
    if (lower.includes('in dart') || lower.includes('flutter dart')) {
      return this.getLanguageById('dart') || null;
    }
    if (lower.includes('in scala') || lower.includes('scala 3')) {
      return this.getLanguageById('scala') || null;
    }
    if (lower.includes('in julia')) {
      return this.getLanguageById('julia') || null;
    }
    if (lower.includes('in lua')) {
      return this.getLanguageById('lua') || null;
    }
    if (lower.includes('in php')) {
      return this.getLanguageById('php') || null;
    }
    if (lower.includes('in ruby')) {
      return this.getLanguageById('ruby') || null;
    }

    return null;
  }

  public generateCodeTemplate(langId: string, topic: string): string {
    const lang = this.getLanguageById(langId);
    if (!lang) return `// Code template for ${topic}`;

    switch (lang.id) {
      case 'rust':
        return `// Rust - Idiomatic & Thread-Safe Implementation of ${topic}
use std::sync::{Arc, Mutex};
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct ${topic.replace(/\s+/g, '')} {
    // fields
}

impl ${topic.replace(/\s+/g, '')} {
    pub fn new() -> Self {
        Self {}
    }
}`;

      case 'go':
        return `// Go - Concurrent & Production-Ready Implementation of ${topic}
package main

import (
    "context"
    "fmt"
    "sync"
    "time"
)

type ${topic.replace(/\s+/g, '')} struct {
    mu sync.RWMutex
}

func New${topic.replace(/\s+/g, '')}() *${topic.replace(/\s+/g, '')} {
    return &${topic.replace(/\s+/g, '')}{}
}`;

      case 'python':
        return `# Python 3.12 - Typed & Asynchronous Implementation of ${topic}
from typing import Generic, TypeVar, Optional, List, Dict
import asyncio
import logging

T = TypeVar('T')

class ${topic.replace(/\s+/g, '')}(Generic[T]):
    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._items: Dict[str, T] = {}
`;

      case 'typescript':
        return `// TypeScript - Strongly-Typed Generic Implementation of ${topic}
export interface Config {
  concurrencyLimit?: number;
  timeoutMs?: number;
}

export class ${topic.replace(/\s+/g, '')}<T> {
  private readonly items = new Map<string, T>();

  constructor(private readonly config: Config = {}) {}
}`;

      case 'cpp':
        return `// Modern C++20 - High-Performance Implementation of ${topic}
#include <iostream>
#include <memory>
#include <concepts>
#include <atomic>
#include <vector>

template <typename T>
requires std::movable<T>
class ${topic.replace(/\s+/g, '')} {
private:
    std::vector<T> buffer_;
public:
    explicit ${topic.replace(/\s+/g, '')}(size_t capacity) {
        buffer_.reserve(capacity);
    }
};`;

      default:
        return `// ${lang.name} implementation of ${topic}`;
    }
  }
}

export const polyglotEngine = new PolyglotEngine();
