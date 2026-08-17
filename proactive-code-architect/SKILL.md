---
name: proactive-code-architect
description: >-
  Enforces efficient, modular architecture from the first line of code.
  Prevents monolithic growth, complexity creep, and tight coupling before they happen — not after.
  Includes 400-line hard limits, single-responsibility enforcement (SRP), whitelist exception protocols,
  monolith decomposition blueprints, complexity gates, vertical-slice scaffolding (scaffold_module.py),
  and automated codebase auditing (audit_architecture.py).
license: MIT
---

# Proactive Code Architect (`proactive-code-architect`)

Establishes efficient, modular architecture **upfront** so you never need expensive, high-risk refactoring later. This skill acts as a **pre-write guardrail**, **structural enforcer**, and **post-write auditor**.

> [!IMPORTANT]
> This skill applies to **every** code-writing operation. Before adding or modifying code in any file, the agent MUST verify that the operation does not violate the modularity rules below. Architectural violations must be resolved **before** committing changes to disk.

---

## Table of Contents

| Section | Topic | Type |
| :--- | :--- | :--- |
| 1 | The 7 Core Architectural Rules (MANDATORY) | Non-Negotiable Guardrails |
| 2 | Hard Limit Whitelist Protocol (`@architect-ignore`) | Exception Standards |
| 3 | Monolith Decomposition Blueprint (Interactive Split Plan) | Refactoring Blueprint |
| 4 | State Management Layer Isolation Patterns | State Scoping |
| 5 | Module Scaffolding Engine (`scripts/scaffold_module.py`) | Automation Tooling |
| 6 | Codebase Architecture Auditor (`scripts/audit_architecture.py`) | Automation Tooling |
| 7 | Complexity Gates & Dependency Graph Limits | Quantitative Metrics |
| 8 | Architecture Patterns Reference Map | Framework Pointers |
| 9 | Common Anti-Patterns & Pitfalls | Mistake Prevention |
| 10 | Pre-Write Decision Tree | Logic Flowchart |

---

## 1. The 7 Core Architectural Rules (MANDATORY)

### Rule 1: File Size Hard Limits
| Metric | Soft Limit | Hard Limit | Action |
| :--- | :---: | :---: | :--- |
| **Lines of code** | 300 lines | **400 lines** | Must split file before adding more code |
| **File size** | 30 KB | 50 KB | Must split file before adding more code |

### Rule 2: Single Responsibility Per File (SRP)
Never mix distinct architectural layers in a single file. Every layer has a dedicated file role:

| Layer | Responsibility | Canonical Filename Pattern |
| :--- | :--- | :--- |
| **View / UI** | Presentation and JSX markup only | `feature-view.tsx` |
| **Model / Logic** | ViewModel, business logic, service hook | `feature-model.ts`, `feature.service.ts` |
| **State** | Local component atoms and store slices | `feature-atoms.ts`, `feature.store.ts` |
| **Utils** | Pure functions (zero framework dependencies) | `feature-utils.ts` |
| **Types** | Interfaces, type definitions, and DTOs | `feature-types.ts` |
| **Constants** | Fixed enums, configuration tables | `feature-constants.ts` |
| **Styles** | Scoped module stylesheets | `feature.module.css` |

### Rule 3: Feature-Module Directory Pattern (Vertical Slice)
Organize code vertically by **feature**, not horizontally by technical layer:

```text
feature-name/
├── index.ts              ← Public API (re-exports ONLY)
├── feature-types.ts      ← Interfaces, types
├── feature-utils.ts      ← Pure functions (zero framework deps)
├── feature-atoms.ts      ← State management
├── feature-model.ts      ← ViewModel / business logic
├── feature-view.tsx      ← Main UI component
├── components/            ← Sub-components (each ≤400 lines)
└── hooks/                 ← Custom React hooks
```

### Rule 4: Prohibition of Append-Only Growth
- Target file ≥ 300 lines? ➡️ Do NOT append. Plan and execute a split first.
- Target file < 300 lines? ➡️ Proceed, verifying the total remains under 400 after the edit.

### Rule 5: Shared Code Extraction (Rule of Two)
- Logic referenced across **2 or more features** ➡️ Extract to `shared/` or `common/`.
- Shared utils must be **pure functions** with zero side effects.
- Shared types live in a centralized `types/` directory.

### Rule 6: Import Hygiene & Zero Circular Dependencies
- **Barrel Exports Only**: External modules must import from `feature/index.ts`, never internal files.
- **Strict One-Way Dependency Flow**:
  `types ← utils ← atoms ← model ← hooks ← components ← view ← index`
- **Zero Circular Dependencies**: `A → B → A` is strictly prohibited.
- **Surgical Import Cleanup**: Remove imports that become orphaned after your edits.

### Rule 7: Legacy File Exception (Boy Scout Rule)
For legacy files (created prior to modularity rules) that already exceed 400 lines:
- Minor bugfixes (<30 lines) are allowed provided they **do not increase the net line count**.
- Substantial feature additions or edits require planning a bottom-up split.

---

## 2. Hard Limit Whitelist Protocol (`@architect-ignore`)

Certain specialized files legitimately exceed 400 lines without violating modularity principles:

### Permitted Exceptions:
1. **Machine-Generated Code**: OpenAPI schema clients, GraphQL types (`api.generated.ts`, `schema.ts`).
2. **Static Mapping Dictionaries**: Static lookup tables, country code mappings (`iso-countries.ts`).
3. **Database Seed & Mock Fixtures**: Large test data fixtures (`mock-dataset.json`).

### Whitelist Tagging Convention:
To exempt a legitimate file from CLI audit warnings, place the following comment on Line 1:
```typescript
/* @architect-ignore: auto-generated-types (Swagger/OpenAPI Client) */
```

---

## 3. Monolith Decomposition Blueprint (Interactive Split Plan)

When refactoring a 1,000+ line legacy monolith, present the following structured blueprint to the user for approval before writing code:

```markdown
# 🗺️ Monolith Split Blueprint: `LegacyMonolith.tsx` (1,240 lines)

### Proposed Feature-Module Structure:
| New File | Responsibility | Est. Lines | Dependencies |
| :--- | :--- | :---: | :--- |
| `feature-types.ts` | Interfaces, DTOs, Enums | ~60 | None |
| `feature-utils.ts` | Pure data formatting functions | ~140 | types |
| `feature-atoms.ts` | State store slices & initial state | ~50 | types |
| `feature-model.ts` | ViewModel hook & event handlers | ~180 | utils, atoms, types |
| `components/SubPanel.tsx` | Extracted sub-view component | ~150 | atoms, types |
| `feature-view.tsx` | Main container layout & JSX | ~220 | model, components |
| `index.ts` | Public API re-export barrel | ~15 | all above |

### Execution Sequence (Bottom-Up):
1. Extract types & enums (`feature-types.ts`)
2. Extract pure utilities (`feature-utils.ts`)
3. Isolate state management (`feature-atoms.ts`)
4. Decouple business logic (`feature-model.ts`)
5. Extract sub-components (`components/`)
6. Re-assemble main view (`feature-view.tsx`)
7. Wire up barrel re-exports (`index.ts`)
8. Run `npx tsc --noEmit` and verify zero regression
```

---

## 4. State Management Layer Isolation Patterns

### 1) Jotai Atom Scoping (`feature-atoms.ts`)
```typescript
import { atom } from 'jotai';
import { UserProfileState } from './user-profile-types';

export const userProfileAtom = atom<UserProfileState>({
    profile: null,
    isEditing: false,
    error: null,
});
```

### 2) Zustand Slice Scoping (`feature-store.ts`)
```typescript
import { create } from 'zustand';
import { UserProfileState, UserProfileActions } from './user-profile-types';

export const useUserProfileStore = create<UserProfileState & UserProfileActions>((set) => ({
    profile: null,
    isEditing: false,
    setEditing: (isEditing) => set({ isEditing }),
}));
```

---

## 5. Module Scaffolding Engine (`scripts/scaffold_module.py`)

Generate canonical decoupled feature module directories in **0.1s**:

```bash
# Scaffold React + TypeScript Feature Module
python scripts/scaffold_module.py --name user-profile --stack react-ts --target-dir ./src/features

# Scaffold Python FastAPI Feature Module
python scripts/scaffold_module.py --name auth-service --stack python --target-dir ./app/features
```

---

## 6. Codebase Architecture Auditor (`scripts/audit_architecture.py`)

Run the automated architecture auditor to scan the entire workspace:

```bash
# Terminal colored audit summary
python scripts/audit_architecture.py --workspace .

# Generate Markdown Architecture Report
python scripts/audit_architecture.py --workspace . --format markdown --output ARCHITECTURE_AUDIT.md

# Output JSON for CI pipeline gates
python scripts/audit_architecture.py --workspace . --format json
```

---

## 7. Complexity Gates & Dependency Graph Limits

| Metric | Soft Limit | Hard Limit | Scope | Action on Violation |
| :--- | :---: | :---: | :--- | :--- |
| **Cyclomatic Complexity** | 10 | **15** | Per function | Refactor to strategy pattern or lookup table |
| **Cognitive Complexity** | 8 | **12** | Per function | Flatten nested logic using early guard returns |
| **Nesting Depth** | 3 | **4** | Per scope | Extract inner blocks into helper functions |
| **Function Length** | 30 | **50 lines** | Per function | Split into single-responsibility helper steps |
| **Parameter Count** | 4 | **6** | Per function | Group arguments into an options DTO bag |
| **Fan-Out (Imports per file)** | 6 | **≤ 8** | Per file | Split file; high fan-out indicates multiple concerns |
| **Fan-In (Imported by)** | 10 | **≤ 15** | Per file | Hidden god module; introduce facade or split |

---

## 8. Architecture Patterns Reference Map

Detailed implementation guides are located in the `references/` directory:

| Tech Stack / Topic | Reference Document |
| :--- | :--- |
| **React + TypeScript** | [`references/react-typescript.md`](file:///c:/00_Workspace/00_Module_Dev/00_스킬개발/00.완성본(junpapapo-skills)/proactive-code-architect/references/react-typescript.md) |
| **Python Backend (FastAPI / Django)** | [`references/python-backend.md`](file:///c:/00_Workspace/00_Module_Dev/00_스킬개발/00.완성본(junpapapo-skills)/proactive-code-architect/references/python-backend.md) |
| **Go Backend (Golang)** | [`references/golang-backend.md`](file:///c:/00_Workspace/00_Module_Dev/00_스킬개발/00.완성본(junpapapo-skills)/proactive-code-architect/references/golang-backend.md) |
| **Modular CSS / SCSS** | [`references/styling-css.md`](file:///c:/00_Workspace/00_Module_Dev/00_스킬개발/00.완성본(junpapapo-skills)/proactive-code-architect/references/styling-css.md) |
| **Architecture Patterns & ADRs** | [`references/architecture-patterns.md`](file:///c:/00_Workspace/00_Module_Dev/00_스킬개발/00.완성본(junpapapo-skills)/proactive-code-architect/references/architecture-patterns.md) |
| **CI Automation & Linting** | [`references/ci-automation.md`](file:///c:/00_Workspace/00_Module_Dev/00_스킬개발/00.완성본(junpapapo-skills)/proactive-code-architect/references/ci-automation.md) |

---

## 9. Common Anti-Patterns & Pitfalls

1. **"I'll split it later"**: Monoliths grow exponentially. Always scaffold decoupled files upfront.
2. **Overly Granular Splitting**: Do not create a single file for a 3-line utility. Group cohesive pure functions into `feature-utils.ts`.
3. **Logic in `index.ts`**: The barrel file must contain **only** re-export statements. Zero business logic.
4. **Top-Down Splitting**: Splitting top-down creates circular dependencies. Always split **Bottom-Up** (types → utils → state → model → view).

---

## 10. Pre-Write Decision Tree

```
START: Task received to add or edit code
  │
  ├─ Is this a NEW feature?
  │   ├─ YES → Run scaffold_module.py → Implement Bottom-Up (types -> utils -> state -> view)
  │   └─ NO  → Check existing target file size ↓
  │
  └─ Existing File Check:
      ├─ < 200 lines   → Edit freely, verify complexity
      ├─ 200-300 lines → Check complexity & SRP, plan extraction if nearing 300
      ├─ 300-400 lines → Plan split AS PART of this task
      └─ > 400 lines   → STOP! Present Monolith Split Blueprint (§3) before writing code
```
