# Golang Modular Architecture Reference Guide

This guide establishes the structural enforcements, package boundaries, interface patterns, and concurrency best practices for **Go (Golang)** projects to prevent monolithic codebases and circular dependencies.

---

## 1. Package-Level Modularity

In Go, the boundary of encapsulation is the **directory (package)**, not individual files. All files in a single directory belong to the same package and share namespace access.

### Standard Project Layout
Follow the canonical Go project layout:
```
/
├── cmd/                  ← Entry points (main packages). Keep main.go minimal.
├── internal/             ← Private application code. Forbidden from external imports.
│   ├── app/              ← Domain services and application logic.
│   └── pkg/              ← Internal utility packages (db, logs, config).
├── pkg/                  ← Public library code. Importable by external projects.
└── go.mod                ← Go modules configuration.
```

### Core Package Rules
1. **Single Purpose**: A package must do one thing. If you cannot describe a package's purpose in a single sentence without "and", it should be split.
2. **Flat Directories**: Avoid deeply nested package trees unless they represent a logical hierarchical domain. Keep packages flat.
3. **No Central Utilities**: Avoid generic `utils/` packages. Create domain-specific packages like `jsonutil/`, `cryptoutil/`, or `timeutil/`.
4. **Encapsulation via Internal**: Place code in `/internal` by default. Only expose code in `/pkg` or root if it is intended to be used as a public library.

---

## 2. Preventing Circular Dependencies

Go strictly forbids circular package imports (Package A importing Package B, while Package B imports Package A) at compile time.

### Resolution Strategies
To avoid or break circular dependencies:
1. **Dependency Inversion**: Define interfaces at the consumer side rather than the producer side.
2. **Extract Shared Domain Types**: If package `user` and package `billing` both need a `Transaction` struct, extract `Transaction` to a shared package (e.g., `types` or `domain`) that has no other dependencies.
3. **Ascending Dependency Flow**: Ensure packages depend only on layers beneath them.
   ```
   handlers/controllers → services/usecases → repositories/db → models/types
   ```

---

## 3. Consumer-Driven Implicit Interfaces

Go's interfaces are satisfied **implicitly** (duck typing). This enables highly decoupled code.

### Guidelines
1. **Declare Interfaces at Consumer Side**: The package that *calls* the code should define the interface it needs, not the package that implements it.
2. **Keep Interfaces Narrow**: Enforce the **Single Responsibility Principle**. Prefer single-method or small interfaces (e.g., `io.Reader`, `io.Writer`).
3. **Never Export Implementations Directly**: Expose interfaces instead of concrete structs to external packages when mocking is required.

```go
// Good: Define what this package needs
type UserStore interface {
    GetUser(ctx context.Context, id string) (*User, error)
}

type UserService struct {
    store UserStore // Injected dependency
}
```

---

## 4. Concurrency & Context Safety

Go's goroutines make concurrency easy, but require strict guidelines to prevent memory leaks and race conditions.

### Rules
1. **Always Pass `context.Context`**: The first parameter of any network, database, or long-running function MUST be `ctx context.Context`.
2. **Never Leak Goroutines**: Any goroutine you spawn must have a defined lifecycle and exit strategy (e.g., using channel closures, context cancellations, or `sync.WaitGroup`).
3. **Protect Shared State**: Never read/write shared memory across goroutines without protection. Use channels for communication or `sync.Mutex`/`sync.RWMutex` for locking.
4. **Run `go test -race`**: Always run tests with the race detector enabled to catch data races early.

---

## 5. Go Code Metrics & Limits

To prevent monolithic files and maintain high code quality:

| Metric | Soft Limit | Hard Limit | Action |
|--------|------------|------------|--------|
| **Lines of code per file** | 350 | **500** | Split into multiple files within the package |
| **Lines of code per package** | 2,500 | **4,000** | Extract sub-domain into a new package |
| **Function Length** | 40 lines | **60 lines** | Extract helpers |
| **Struct Complexity** | 8 fields | **12 fields** | Extract nested structures |
| **Goroutine parameters** | 3 | **5** | Pass structured config or bag |

### Boy Scout Rule for Go Legacy Code
When editing older packages/files that exceed limits:
- Small bug fixes and updates are permitted without full refactoring, provided the edit does not increase net lines of code or complexity.
- Refactor and extract logic into smaller helper files or separate packages during larger feature implementations.
