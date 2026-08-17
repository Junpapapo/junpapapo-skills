# 🏗️ Proactive Code Architect (`proactive-code-architect`)

> **Enforces modular, scalable architecture from the first line of code. Automated architecture audits, 400-line limits, complexity gates, monolith decomposition blueprints, and instant feature module scaffolding.**

---

## 🌟 Overview

The **Proactive Code Architect (`proactive-code-architect`)** is an architectural guardrail, code quality enforcement engine, and scaffolding CLI suite.

Rather than allowing codebases to degrade into massive 1,000+ line monoliths that require painful, high-risk refactoring, this skill acts as a **pre-write guardrail**, **structural enforcer**, and **post-write auditor**. It enforces strict modularity, file-size caps, state isolation, and single-responsibility boundaries **before** code is committed to disk.

---

## ✨ The 7 Core Architectural Rules

```
                      ┌─────────────────────────────────────────┐
                      │    Proactive Code Architecture Model    │
                      └────────────────────┬────────────────────┘
                                           │
        ┌──────────────┬───────────────────┼───────────────────┬──────────────┐
        ▼              ▼                   ▼                   ▼              ▼
  [ Rule 1 & 4 ]   [ Rule 2 ]          [ Rule 3 ]          [ Rule 5 & 6 ]  [ Rule 7 ]
  400-Line Limit   Single-             Feature-Module      Shared Extraction Boy Scout
  No Append-Only   Responsibility      Scaffolding         & Barrel Imports Legacy Grace
```

### 1. 📏 Rule 1 & 4: File Size Hard Limits & No Append-Only Growth
* **Soft Limit (300 Lines)**: Warning threshold. Plan a split before adding new features.
* **Hard Limit (400 Lines / 50KB)**: Absolute ceiling. Files **must be split** before adding more code.
* **No Append-Only Growth**: Never mindlessly append code to the bottom of existing large files.

### 2. 🎯 Rule 2: Single Responsibility Per File (SRP)
Never mix multiple architectural layers in a single file. Every layer has a dedicated file role:

| Layer | Responsibility | Canonical Filename Pattern |
| :--- | :--- | :--- |
| **View / UI** | Presentation and JSX markup only | `feature-view.tsx` |
| **Model / Logic** | ViewModel, business logic, service hook | `feature-model.ts`, `feature.service.ts` |
| **State** | Local component atoms and store slices | `feature-atoms.ts`, `feature.store.ts` |
| **Utils** | Pure functions (zero framework dependencies) | `feature-utils.ts` |
| **Types** | Interfaces, type definitions, and DTOs | `feature-types.ts` |
| **Constants** | Fixed enums, configuration tables | `feature-constants.ts` |
| **Styles** | Scoped module stylesheets | `feature.module.css` |

### 3. 📦 Rule 3: Feature-Module Directory Pattern (Vertical Slice)
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

### 4. ♻️ Rule 5 & 6: Shared Code Extraction & Import Hygiene
- **Rule of Two**: Extract code used in 2+ features into `shared/` or `common/`.
- **Barrel Imports**: External modules must import from `feature/index.ts`, never internal files.
- **Zero Circular Dependencies**: Strict one-way dependency graph:
  `types ← utils ← atoms ← model ← hooks ← components ← view ← index`

### 5. 🏕️ Rule 7: Legacy File Exception (Boy Scout Rule)
For legacy files already exceeding 400 lines:
- Minor bugfixes (<30 lines) are allowed provided they **do not increase net line count**.
- Significant changes require a planned, bottom-up split.

---

## 🛠️ Automated CLI Tool Reference

### 1. Codebase Architecture Auditor (`audit_architecture.py`)
Scans entire codebase for 400-line violations, SRP mixing, and circular dependencies in **<0.1s**:

```bash
# Terminal colored summary
python scripts/audit_architecture.py --workspace .

# Generate Markdown Architecture Report
python scripts/audit_architecture.py --workspace . --format markdown --output ARCH_REPORT.md

# Output JSON for CI pipeline gates
python scripts/audit_architecture.py --workspace . --format json
```

### 2. Feature Module Scaffolder (`scaffold_module.py`)
Generates decoupled, vertical-slice module skeletons instantly:

```bash
# Scaffold React + TypeScript feature module
python scripts/scaffold_module.py --name chat-widget --stack react-ts --target-dir ./src/features

# Scaffold Python FastAPI feature module
python scripts/scaffold_module.py --name auth-service --stack python --target-dir ./app/features
```

---

## 🗺️ Monolith Decomposition Blueprint (Interactive Split Plan)

When splitting a legacy 1,000+ line monolith, follow the standard **Bottom-Up Sequence**:

```
1. Types & DTOs  ──▶  2. Constants  ──▶  3. Pure Utils  ──▶  4. State Atoms
                                                                    │
8. Public index.ts ◀── 7. Main View ◀── 6. Sub-Components ◀── 5. ViewModel
```

---

## 🏷️ Whitelist Protocol (`@architect-ignore`)

Exempt machine-generated files or static lookup tables by adding a header comment on Line 1:
```typescript
/* @architect-ignore: auto-generated-types (OpenAPI Client) */
```

---

## 📊 Complexity Gate & Dependency Graph Limits

| Metric | Soft Limit | Hard Limit | Scope |
| :--- | :--- | :--- | :--- |
| **Cyclomatic Complexity** | 10 | **15** | Per function |
| **Cognitive Complexity** | 8 | **12** | Per function |
| **Nesting Depth** | 3 | **4** | Per scope |
| **Function Length** | 30 | **50 lines** | Per function |
| **Fan-Out (Imports per file)** | 6 | **≤ 8** | Per file |
| **Fan-In (Imported by)** | 10 | **≤ 15** | Per file |

---

## 📁 Directory Structure & References

```text
📁 proactive-code-architect/
├── 📄 README.md                 # [This File] User guide and architecture principles
├── 📄 SKILL.md                  # Agent execution protocol (YAML Frontmatter + Rules)
├── 📁 scripts/
│   ├── 🐍 audit_architecture.py # Modularity, line limit, and complexity scanner
│   └── 🐍 scaffold_module.py    # Vertical-slice feature module generator
└── 📁 references/
    ├── 📄 architecture-patterns.md  # Interface-first contracts, Event Bus, ADRs
    ├── 📄 ci-automation.md          # Automated lint rules, complexity checks, pre-commit
    ├── 📄 react-typescript.md       # React/TS specific patterns & scaffolding
    ├── 📄 python-backend.md         # FastAPI / Django modular structure
    ├── 📄 golang-backend.md         # Go package conventions & interfaces
    └── 📄 styling-css.md            # CSS Modules / SCSS scoping guidelines
```

---

## 🚀 Natural Language Triggers

Prompt your AI assistant with:
- *"Scaffold a new feature using proactive code architect rules"*
- *"Run an architectural health audit on this codebase"*
- *"Refactor this large file into modular feature components"*
- *"선제적 아키텍처 원칙에 따라 새 기능을 모듈형으로 설계하고 구현해줘"*

---

## 📄 License

MIT License — free for use and adaptation across all modern software projects.
