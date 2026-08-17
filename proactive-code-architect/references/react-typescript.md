# Proactive Code Architect — React + TypeScript Reference

Specialized patterns and rules for React/TypeScript projects. This extends the
core rules in `../SKILL.md` with framework-specific guidance.

---

## 1. Feature-Module Canonical Structure

```
feature-name/
  ├── index.ts                  ← Public API (re-exports ONLY)
  ├── feature-types.ts          ← Interfaces, type aliases, enums
  ├── feature-constants.ts      ← Magic strings, config defaults, enum maps
  ├── feature-atoms.ts          ← Jotai atoms / Zustand stores
  ├── feature-utils.ts          ← Pure functions (ZERO React imports)
  ├── feature-model.ts          ← ViewModel class (business orchestration)
  ├── feature-view.tsx          ← Main React component (composition root)
  ├── components/               ← Sub-components (each ≤400 lines)
  │   ├── feature-header.tsx
  │   ├── feature-panel.tsx
  │   ├── feature-table.tsx
  │   └── feature-toolbar.tsx
  ├── hooks/                    ← Custom hooks
  │   ├── use-feature-data.ts
  │   └── use-feature-filters.ts
  └── feature.scss              ← Scoped styles (CSS Modules or SCSS)
```

### File Responsibilities (Strict)

| File | Allowed | Forbidden |
|------|---------|-----------|
| `*-types.ts` | `interface`, `type`, `enum`, `const enum` | Any runtime code, imports from react |
| `*-constants.ts` | `const`, frozen objects, enum label maps | Computed values, function calls |
| `*-atoms.ts` | Jotai `atom()`, Zustand `create()`, derived atoms | UI components, utility functions |
| `*-utils.ts` | Pure functions, formatters, validators, transformers | `useAtom`, `useState`, JSX, `import React` |
| `*-model.ts` | ViewModel class, RPC calls, business orchestration | JSX, React hooks, direct DOM access |
| `*-view.tsx` | JSX composition, hook calls, event handler wiring | Business logic, data transformation, atom definitions |
| `components/*.tsx` | Focused UI rendering, local event handlers | Atom definitions, utility functions, API calls |
| `hooks/*.ts` | Custom hooks wrapping atoms/effects/memos | JSX, component definitions |
| `index.ts` | `export { ... } from './...'` | Any logic, any component definition |

---

## 2. State Management Patterns

### Jotai (Preferred in AlphaWave)

```typescript
// ✅ feature-atoms.ts — state definitions ONLY
import { atom } from "jotai";
import type { FeatureData, FeatureFilter } from "./feature-types";

// Base atoms (writable)
export const featureDataAtom = atom<FeatureData[]>([]);
export const featureFilterAtom = atom<FeatureFilter>({ query: "", status: "all" });
export const featureLoadingAtom = atom<boolean>(false);
export const featureErrorAtom = atom<string | null>(null);

// Derived atoms (read-only computed)
export const filteredFeatureDataAtom = atom((get) => {
    const data = get(featureDataAtom);
    const filter = get(featureFilterAtom);
    return applyFilter(data, filter); // imported from feature-utils.ts
});

export const featureCountAtom = atom((get) => get(filteredFeatureDataAtom).length);
```

```typescript
// ❌ WRONG — atoms mixed into view component
// feature-view.tsx
export const dataAtom = atom([]);          // ← belongs in feature-atoms.ts
export const filterAtom = atom({});         // ← belongs in feature-atoms.ts
export function FeatureView() { ... }
```

### Zustand (Alternative)

```typescript
// ✅ feature-store.ts — store definition ONLY
import { create } from "zustand";
import type { FeatureState } from "./feature-types";

export const useFeatureStore = create<FeatureState>((set, get) => ({
    data: [],
    loading: false,
    error: null,
    setData: (data) => set({ data }),
    setLoading: (loading) => set({ loading }),
    // Computed: use selectors in hooks/use-feature-data.ts
}));
```

### Rules

- **One atoms/store file per feature module**. Never scatter atoms across
  multiple files within the same module.
- **Derived atoms** that depend on utils should import from `feature-utils.ts`,
  not inline the logic.
- **Async atoms** (write atoms with side effects) belong in the atoms file but
  must delegate business logic to `feature-model.ts`.

---

## 3. Component Decomposition

### When to Extract a Sub-Component

| Signal | Action |
|--------|--------|
| A JSX block with its own `useState`/`useEffect` | Extract to `components/` |
| A repeated UI pattern (used 2+ times) | Extract to `components/` or `shared/components/` |
| A self-contained UI section (panel, tab, modal) | Extract to `components/` |
| Conditional rendering block > 30 lines | Extract to `components/` |
| The parent component exceeds 300 lines | Extract the largest sub-tree |

### Sub-Component Contract

```typescript
// ✅ components/feature-table.tsx — receives data via props
import type { FeatureRow } from "../feature-types";

interface FeatureTableProps {
    rows: FeatureRow[];
    onRowSelect: (id: string) => void;
    sortField: string;
    sortOrder: "asc" | "desc";
    onSortChange: (field: string) => void;
}

export function FeatureTable({ rows, onRowSelect, sortField, sortOrder, onSortChange }: FeatureTableProps) {
    return (
        <table>
            {/* Pure rendering — no useAtom, no fetch, no business logic */}
        </table>
    );
}
```

```typescript
// ❌ WRONG — sub-component fetches its own data
export function FeatureTable() {
    const [data] = useAtom(featureDataAtom);    // ← should receive via props
    const [sort, setSort] = useState("name");
    useEffect(() => { fetchData(); }, []);       // ← belongs in parent or hook
    return <table>...</table>;
}
```

### Props vs. Atoms in Sub-Components

- **Leaf components** (tables, cards, inputs): Always use props. Zero atom imports.
- **Container components** (panels with their own lifecycle): May import atoms
  directly, but only for reading. Write operations go through callbacks or model.
- **Rule of thumb**: If removing the component would NOT break state, it should
  use props.

---

## 4. Custom Hook Patterns

### When to Create a Hook

| Scenario | Hook it |
|----------|---------|
| 3+ components share the same `useAtom` + `useEffect` combo | Yes |
| A component has complex subscription/cleanup logic | Yes |
| Data fetching with loading/error states | Yes |
| Simple `useAtom(someAtom)` call | No — inline is fine |

### Hook Structure

```typescript
// ✅ hooks/use-feature-data.ts
import { useAtom } from "jotai";
import { featureDataAtom, featureLoadingAtom, featureErrorAtom } from "../feature-atoms";
import { fetchFeatureData } from "../feature-model";

export function useFeatureData(featureId: string) {
    const [data, setData] = useAtom(featureDataAtom);
    const [loading, setLoading] = useAtom(featureLoadingAtom);
    const [error, setError] = useAtom(featureErrorAtom);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchFeatureData(featureId);
            setData(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, [featureId]);

    return { data, loading, error, refresh };
}
```

### Rules

- Hooks file imports atoms + model. Never imports JSX.
- Hook return type should be explicit (not inferred) when shared across
  components.
- One concern per hook. `useFeatureData` and `useFeatureFilters` are separate.

---

## 5. Utils File Rules (Strict)

```typescript
// ✅ feature-utils.ts — ZERO framework imports
import type { RawData, FormattedRow, FilterConfig } from "./feature-types";

/** Formats raw API data into display-ready rows */
export function formatRows(data: RawData[]): FormattedRow[] {
    return data.map((item) => ({
        id: item.id,
        label: item.name.trim(),
        value: formatCurrency(item.price),
        change: formatPercent(item.change_pct),
        changeColor: item.change_pct >= 0 ? "green" : "red",
    }));
}

/** Applies filter configuration to a dataset */
export function applyFilter(data: FormattedRow[], filter: FilterConfig): FormattedRow[] {
    let result = data;
    if (filter.query) {
        const q = filter.query.toLowerCase();
        result = result.filter((r) => r.label.toLowerCase().includes(q));
    }
    if (filter.minValue != null) {
        result = result.filter((r) => r.numericValue >= filter.minValue!);
    }
    return result;
}

// Pure helper — no exports needed if only used internally
function formatCurrency(n: number): string {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatPercent(n: number): string {
    return `${n >= 0 ? "+" : ""}${(n * 100).toFixed(2)}%`;
}
```

**Forbidden in utils files**:
- `import React` or `import { useState }` — utils must be testable without React
- `import { atom }` — state belongs in atoms file
- `document.querySelector` or any DOM API
- `fetch()` or any I/O — that belongs in model/service

---

## 6. Index File (Barrel Export) Pattern

```typescript
// ✅ index.ts — re-exports only, zero logic
export { FeatureView } from "./feature-view";
export { FeatureModel } from "./feature-model";
export type { FeatureData, FeatureFilter } from "./feature-types";

// If using dynamic view registration (AlphaWave pattern):
import { registerViewModule } from "@/app/block/blockregistry";
import { FeatureModel } from "./feature-model";

registerViewModule({
    viewType: "feature",
    viewModelClass: FeatureModel,
});
```

**Forbidden**:
```typescript
// ❌ index.ts must NOT contain component definitions
export function FeatureView() { return <div>...</div>; }  // WRONG

// ❌ index.ts must NOT contain atom definitions
export const dataAtom = atom(null);  // WRONG

// ❌ index.ts must NOT contain business logic
export function processData(d: RawData) { ... }  // WRONG
```

---

## 7. Styling Separation

- **One SCSS/CSS file per module** (not per component, unless the module is large).
- **CSS Modules** preferred for scoping: `feature.module.css`.
- **No inline styles** for anything beyond trivial dynamic values (e.g.,
  `style={{ width: computedWidth }}`).
- **No CSS in JS** (styled-components, emotion) unless the project already uses
  it. Match existing patterns.

---

## 8. Testing Implications

The modular structure directly enables focused testing:

| File | Test Strategy |
|------|--------------|
| `feature-utils.ts` | Pure unit tests — no React, no mocking, fast |
| `feature-atoms.ts` | Atom integration tests (verify derived atom logic) |
| `feature-model.ts` | Unit tests with mocked API calls |
| `feature-view.tsx` | Component render tests (React Testing Library) |
| `components/*.tsx` | Snapshot or interaction tests per sub-component |
| `hooks/*.ts` | `renderHook` tests |

**Key benefit**: `feature-utils.ts` tests run in <1ms each because they have
zero framework dependencies. This is the primary reason for the separation.

---

## 9. Migration Checklist (Monolith → Modular)

When splitting an existing monolithic `.tsx` file:

```
1. [ ] Create feature directory: feature-name/
2. [ ] Extract types → feature-types.ts
3. [ ] Extract constants → feature-constants.ts  (if applicable)
4. [ ] Extract pure functions → feature-utils.ts
5. [ ] Extract atoms → feature-atoms.ts
6. [ ] Extract hooks → hooks/use-*.ts  (if applicable)
7. [ ] Extract sub-components → components/*.tsx
8. [ ] Remaining code → feature-view.tsx (should be ≤300 lines now)
9. [ ] Create feature-model.ts (extract ViewModel class)
10. [ ] Create index.ts with re-exports
11. [ ] Update all import paths across the codebase
12. [ ] Verify: npm run build passes
13. [ ] Verify: npx vitest run passes
14. [ ] Verify: Runtime behavior unchanged
```

---

## 10. Common Anti-Patterns in React/TS Projects

| Anti-Pattern | Why It's Bad | Fix |
|-------------|-------------|-----|
| God component (1000+ lines) | Impossible to test, review, or modify safely | Split into view + components/ |
| Atoms defined inside components | Re-created on every render, breaks state | Move to feature-atoms.ts |
| Business logic in `useEffect` | Untestable, race conditions | Extract to model/service |
| Inline type definitions | Scattered, hard to reuse | Centralize in feature-types.ts |
| `any` type to avoid splitting | Technical debt accumulator | Define proper interfaces |
| Formatting functions in JSX | Repeated, untestable | Move to feature-utils.ts |
| Monster `switch` in one component | SRP violation | One component per case, use a map |
