# Proactive Code Architect — Architecture Patterns Reference

Detailed architecture patterns for decoupling, scalability, and decision
documentation. This extends the core rules in `../SKILL.md`.

---

## 1. Interface-First Contract

Define module boundaries with explicit interfaces **before** implementing.
This prevents tight coupling and makes future replacement painless.

### When to Apply

- Modules with I/O (API calls, database, file system)
- Modules with complex orchestration or cross-module communication
- Any module where you anticipate swapping implementations (e.g., mock for
  testing, different provider)

**When to skip**: Simple utility modules with pure functions. Don't add
interface ceremony to a file of formatters.

### TypeScript Pattern

```typescript
// feature-name/feature-types.ts — define the CONTRACT first
export interface IFeatureService {
    getById(id: string): Promise<FeatureData>;
    list(filter: FeatureFilter): Promise<FeatureData[]>;
    create(input: FeatureInput): Promise<FeatureData>;
}

export interface IFeatureRepository {
    fetch(id: string): Promise<RawFeatureData | null>;
    query(filter: FeatureFilter): Promise<RawFeatureData[]>;
    save(data: RawFeatureData): Promise<void>;
}
```

```typescript
// feature-name/feature-model.ts — implement the contract
import type { IFeatureService, IFeatureRepository } from "./feature-types";

export class FeatureService implements IFeatureService {
    constructor(private repo: IFeatureRepository) {}  // injected, not imported

    async getById(id: string): Promise<FeatureData> {
        const raw = await this.repo.fetch(id);
        if (!raw) throw new FeatureNotFoundError(id);
        return transformToOutput(raw);
    }
}
```

### Python Pattern

```python
# feature_name/protocols.py — define the contract with Protocol
from typing import Protocol
from .schemas import FeatureInput, FeatureOutput, FeatureFilter

class IFeatureRepository(Protocol):
    async def fetch(self, id: str) -> dict | None: ...
    async def query(self, filter: FeatureFilter) -> list[dict]: ...
    async def save(self, data: dict) -> None: ...

class IFeatureService(Protocol):
    async def get_by_id(self, id: str) -> FeatureOutput: ...
    async def list_filtered(self, filter: FeatureFilter) -> list[FeatureOutput]: ...
```

```python
# feature_name/service.py — implement the contract
from .protocols import IFeatureRepository
from .schemas import FeatureOutput

class FeatureService:
    def __init__(self, repo: IFeatureRepository):
        self._repo = repo  # depends on protocol, not concrete class

    async def get_by_id(self, id: str) -> FeatureOutput:
        raw = await self._repo.fetch(id)
        if raw is None:
            raise FeatureNotFoundError(id)
        return FeatureOutput(**raw)
```

### Rules

1. **Every module's public API is defined as an interface** in `*-types.ts`
   or `protocols.py`.
2. **Consumers depend on the interface**, not the implementation class.
3. **Constructor injection** for dependencies — never import concrete classes
   across module boundaries.
4. **Interface files have zero implementation** — only type signatures.

### Benefits

| Benefit | How |
|---------|-----|
| Testability | Swap real repo for in-memory mock via constructor |
| Replaceability | Change API provider without touching consumers |
| Documentation | Interfaces serve as living API docs |
| Circular dependency prevention | Structurally impossible when depending on types |

---

## 2. Event Bus / Pub-Sub Pattern

For cross-module communication, prefer events over direct imports. This
eliminates coupling between features that need to react to each other.

### When to Use vs. Direct Import

| Scenario | Direct Import | Event Bus |
|----------|:---:|:---:|
| Module A calls Module B's function | ✅ | — |
| Module A notifies N modules about a state change | — | ✅ |
| Many-to-many communication pattern | — | ✅ |
| Feature can be independently enabled/disabled | — | ✅ |
| Simple parent → child data flow | ✅ | — |
| One-to-one known relationship | ✅ | — |

### TypeScript Implementation

```typescript
// shared/event-bus.ts — lightweight typed event bus
type EventHandler<T> = (payload: T) => void;

class TypedEventBus {
    private handlers = new Map<string, Set<EventHandler<any>>>();

    on<T>(event: string, handler: EventHandler<T>): () => void {
        if (!this.handlers.has(event)) this.handlers.set(event, new Set());
        this.handlers.get(event)!.add(handler);
        return () => this.handlers.get(event)?.delete(handler);  // unsubscribe fn
    }

    emit<T>(event: string, payload: T): void {
        this.handlers.get(event)?.forEach((h) => h(payload));
    }
}

export const eventBus = new TypedEventBus();
```

```typescript
// shared/events.ts — event type registry (central, discoverable)
export interface AppEvents {
    "scanner:results-updated": { count: number; timestamp: number };
    "strategy:backtest-complete": { strategyId: string; pnl: number };
    "chart:symbol-changed": { symbol: string };
    "settings:theme-changed": { theme: "light" | "dark" };
}
```

### Usage in React Components

```typescript
// quantscout/quantscout-view.tsx — emitting events
import { eventBus } from "@/shared/event-bus";

function handleScanComplete(results: ScanResult[]) {
    // ... update local state ...
    eventBus.emit("scanner:results-updated", {
        count: results.length,
        timestamp: Date.now(),
    });
}
```

```typescript
// chart/hooks/use-scanner-sync.ts — subscribing to events
import { useEffect } from "react";
import { eventBus } from "@/shared/event-bus";

export function useScannerSync(onUpdate: (count: number) => void) {
    useEffect(() => {
        const unsub = eventBus.on("scanner:results-updated", (payload) => {
            onUpdate(payload.count);
        });
        return unsub;  // cleanup on unmount
    }, [onUpdate]);
}
```

### Python Implementation

```python
# shared/event_bus.py
from collections import defaultdict
from typing import Callable, Any

class EventBus:
    def __init__(self):
        self._handlers: dict[str, list[Callable]] = defaultdict(list)

    def on(self, event: str, handler: Callable) -> Callable:
        self._handlers[event].append(handler)
        return lambda: self._handlers[event].remove(handler)

    def emit(self, event: str, **payload: Any) -> None:
        for handler in self._handlers.get(event, []):
            handler(**payload)

event_bus = EventBus()
```

### Rules

1. **All event types defined centrally** in `shared/events.ts` — discoverable.
2. **Event names**: `module:action-name` convention (lowercase, hyphenated).
3. **Handlers must be safe** — no throwing, no blocking, no heavy computation.
4. **Always unsubscribe on cleanup** — especially in React `useEffect`.
5. **Don't overuse** — if only one consumer exists, direct import is simpler.

---

## 3. Vertical Slice Architecture

Organize code by **feature** (vertical), not by **technical layer**
(horizontal). Each slice contains everything needed for one use case.

### Comparison

```
❌ Horizontal (Layer-first)         ✅ Vertical (Feature-first)

controllers/                        features/
  ├── user-controller.ts              ├── user/
  ├── order-controller.ts             │   ├── user-controller.ts
  └── product-controller.ts           │   ├── user-service.ts
services/                              │   ├── user-repo.ts
  ├── user-service.ts                  │   ├── user-types.ts
  ├── order-service.ts                 │   └── index.ts
  └── product-service.ts              ├── order/
repositories/                          │   ├── order-controller.ts
  ├── user-repo.ts                     │   ├── order-service.ts
  ├── order-repo.ts                    │   └── ...
  └── product-repo.ts                 └── product/
                                          └── ...
```

### Why Vertical Wins

| Criterion | Horizontal | Vertical |
|-----------|-----------|----------|
| Adding a feature | Touch 4+ directories | Touch 1 directory |
| Deleting a feature | Hunt across all layers | Delete 1 directory |
| Understanding a feature | Jump between 4+ dirs | Read 1 directory |
| Merge conflicts | High (shared dirs) | Low (isolated dirs) |
| Team scaling | Bottleneck on shared dirs | Each team owns a slice |
| AI agent efficiency | Must discover scattered files | Entire context in one dir |

### Rules

1. **New feature = new directory.** Period.
2. **Cross-cutting concerns** (auth, logging, error handling) live in
   `shared/` or `middleware/`.
3. **A feature directory must be deletable** without breaking other features.
4. **Internal layering** within a vertical slice still applies (types → utils
   → state → model → view).

### Hybrid Approach (Recommended for Large Projects)

```
src/
  ├── features/               ← Vertical slices (feature-specific code)
  │   ├── quantscout/
  │   ├── quantforge/
  │   └── chart/
  ├── shared/                  ← Horizontal shared layer (cross-cutting)
  │   ├── components/          ← Reusable UI primitives
  │   ├── hooks/               ← Shared hooks
  │   ├── utils/               ← Pure utility functions
  │   ├── types/               ← Common type definitions
  │   ├── event-bus.ts         ← Event infrastructure
  │   └── events.ts            ← Event type registry
  └── infrastructure/          ← App-level plumbing
      ├── routing/
      ├── auth/
      └── config/
```

---

## 4. Architecture Decision Records (ADR)

Record **why** architectural decisions were made so future developers (and AI
agents) don't unknowingly reverse them.

### When to Write an ADR

- Choosing a state management library (Jotai vs. Zustand vs. Redux)
- Deciding module boundary strategy
- Selecting a communication pattern (events vs. direct import)
- Changing file structure conventions
- Adopting or rejecting a framework/library
- Any decision that would be non-obvious to a new team member

### Template

```markdown
# ADR-{NNN}: {Title}

**Date**: YYYY-MM-DD
**Status**: Accepted | Deprecated | Superseded by ADR-{NNN}

## Context
What is the problem or situation that prompted this decision?

## Decision
What was decided and why?

## Consequences

### Positive
- ...

### Negative
- ...

### Trade-offs
- ...

## Alternatives Considered
| Alternative | Pros | Cons | Why Rejected |
|------------|------|------|--------------|
| ... | ... | ... | ... |
```

### Storage Convention

```
docs/
  └── adr/
      ├── 001-state-management-jotai.md
      ├── 002-feature-module-pattern.md
      ├── 003-event-bus-cross-module.md
      ├── 004-400-line-hard-limit.md
      └── index.md  ← Table of all ADRs with status
```

### Rules

1. **ADRs are immutable** — never edit a past ADR. If the decision changes,
   create a new ADR that supersedes the old one.
2. **Keep them short** — 1 page max. If you need more, the decision is too
   complex and should be split.
3. **Agent behavior**: When making a significant architectural choice during
   development, write an ADR and include it in the walkthrough artifact.
4. **Number sequentially** — use zero-padded 3-digit numbers.

### Example ADR

```markdown
# ADR-001: Use Jotai for State Management

**Date**: 2026-06-08
**Status**: Accepted

## Context
The application needs shared state across feature modules (quantscout,
quantforge, chart). We need a solution that supports atomic updates,
derived state, and TypeScript type safety.

## Decision
Use Jotai with atom-based state management. Each feature module defines
its own atoms in `feature-atoms.ts`. Derived atoms handle computed state.

## Consequences

### Positive
- Fine-grained reactivity (only affected components re-render)
- Zero boilerplate compared to Redux
- Natural TypeScript support

### Negative
- Less ecosystem tooling than Redux
- Debugging derived atom chains can be complex

## Alternatives Considered
| Alternative | Pros | Cons | Why Rejected |
|------------|------|------|--------------|
| Redux Toolkit | Large ecosystem, DevTools | Verbose, excessive boilerplate | Over-engineered for our scale |
| Zustand | Simple API, minimal | Less suited for derived state chains | Jotai's atom model fits our feature-module pattern better |
```

---

## 5. Pattern Selection Guide

Use this decision matrix to choose the right pattern:

| Situation | Pattern | Reference Section |
|-----------|---------|-------------------|
| Module A needs to call Module B | Direct import via `index.ts` | §2 rules |
| Module A notifies multiple modules | Event Bus | §2 |
| New feature request | Vertical Slice + Scaffold | §3, SKILL.md §6 |
| Module with I/O or complex logic | Interface-First | §1 |
| Significant architecture choice | Write an ADR | §4 |
| Pure utility functions shared by 2+ modules | Extract to `shared/utils/` | SKILL.md Rule 5 |
| Unsure which pattern fits | Default to Vertical Slice + Interface-First | §1 + §3 |
