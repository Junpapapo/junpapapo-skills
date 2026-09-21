# 🚀 Junpapapo AI Agent Skills Collection (`junpapapo-skills`)

> **Autonomous Software Engineering, Quality Assurance, Architecture Governance, and Store Policy Compliance Skills for AI Coding Agents (Gemini Antigravity, Claude Code, Cursor, Aider).**

---

## 🌟 Overview

Welcome to **`junpapapo-skills`** — a curated suite of enterprise-grade, production-ready **AI Agent Skills**. 

Each skill in this repository is designed according to **Level 5 Autonomous Engineering Standards**, combining:
1. **Standardized Agent Execution Protocols (`SKILL.md`)** formatted with imperative attention-weight engineering.
2. **Comprehensive Developer Guides (`README.md`)** with workflows, edge case handling, and recovery matrices.
3. **High-Performance Python CLI Engines (`scripts/`)** executing deterministic static analysis, QA audits, and scaffolding in **<0.1s** with **95%+ LLM token savings**.

---

## 📋 Skills Master Index

| Skill Directory | Category | Core Purpose & Mission | Primary CLI Tool (`<skill_dir>`) |
| :--- | :--- | :--- | :--- |
| [**`agent-friendly-rules`**](./agent-friendly-rules/) | **Agent Governance** | Rulebook health scoring (0-100), attention-weight engineering, and stack-tailored rule generation (`GEMINI.md` / `CLAUDE.md`). | `python <skill_dir>/scripts/lint_rules.py`<br/>`python <skill_dir>/scripts/init_rules.py` |
| [**`agent-session-retrospective`**](./agent-session-retrospective/) | **Continuous Learning** | Autonomous post-mortem, friction-point extraction from logs, and frequency-weighted Golden Rule sync with a 10-rule quota cap. | `python <skill_dir>/scripts/parse_session.py`<br/>`python <skill_dir>/scripts/generate_retro_doc.py` |
| [**`chrome-extension-project-final-checker`**](./chrome-extension-project-final-checker/) | **QA & Release** | Automated 5-Step Deep QA Protocol: Build validation, MV3 compliance, Shadow DOM isolation, 404 asset audit, and memory leak detection. | `python <skill_dir>/scripts/final_check.py` |
| [**`chrome-web-store-policy-checker`**](./chrome-web-store-policy-checker/) | **Store Compliance** | Zero-tolerance policy audit (RCE ban, `<all_urls>`, unused permissions), permission justification generation, and appeal letter drafting. | `python <skill_dir>/scripts/audit_policy.py`<br/>`python <skill_dir>/scripts/generate_justifications.py` |
| [**`proactive-code-architect`**](./proactive-code-architect/) | **Architecture** | 400-line hard limits, Single Responsibility enforcement, complexity gates, and instant vertical-slice module scaffolding. | `python <skill_dir>/scripts/audit_architecture.py`<br/>`python <skill_dir>/scripts/scaffold_module.py` |
| [**`universal-qa-tracker`**](./universal-qa-tracker/) | **QA & Release Tracking** | Zero-server browser execution (`file:///`) spreadsheet & analytics dashboard, atomic CLI issue management, and multilingual reports (EN/KO/JA). | `python <skill_dir>/scripts/init_tracker.py`<br/>`python <skill_dir>/scripts/add_issue.py`<br/>`python <skill_dir>/scripts/audit_qa.py` |
| [**`universal-guardrail-bootstrap`**](./universal-guardrail-bootstrap/) | **SDLC Governance** | Adaptive 6-stage architectural guardrails (React Native, Next.js, Vite, Vue, Node): Zero-tolerance gatekeeping against technical debt from bootstrap to release. | Autonomous 6-Stage Gap Auditor & Bootstrap Protocols (`SKILL.md`) |

> [!IMPORTANT]
> **Script Execution Standard (`<skill_dir>`)**: AI agents and developers should replace `<skill_dir>` with the actual relative or absolute directory path of the skill (e.g. `.agents/skills/agent-friendly-rules`, `~/.gemini/config/skills/agent-friendly-rules`, or full absolute path). This prevents `FileNotFoundError` regardless of your current working directory (`CWD`).

---

## 🔍 Skill-by-Skill Deep Dive

```
                                              │
                                              │       junpapapo-skills Ecosystem        │
                                              │
                                              └─────────────────────┬───────────────────┘
                                                                    │
     ┌─────────────────┬───────────────────┬────────┬───────────────┴───┬───────────────────┬─────────────────┬──────────────────────┐
     ▼                 ▼                   ▼        ▼                   ▼                   ▼                 ▼                      ▼
1. agent-friendly 2. session-retro 3. final-checker 4. store-policy 5. code-architect 6. universal-qa 7. guardrail-bootstrap
 (Rule Linter)     (Learning)        (Deep QA)       (Store Policy)    (Modularity)     (QA Tracker Hub) (Full SDLC Barrier)
```

---

### 1. 🤖 [`agent-friendly-rules`](./agent-friendly-rules/)
* **Category**: AI Agent Rulebook Governance & Architecture
* **Description**: Solves the problem of AI agents ignoring vague or lengthy instructions. Establishes visual constraint partitioning (`🔴 DO NOT` vs `🟢 DO`), GitHub alert elevations (`[!IMPORTANT]`), conflict resolution hierarchies, and an anti-inflation 10-rule cap.
* **Key Tools**:
  - `lint_rules.py`: Scores rulebook compliance (0-100) and detects weak words (*"should"*, *"recommended"*).
  - `init_rules.py`: One-click rulebook bootstrapping for React/TS, Next.js, FastAPI, and Chrome Extensions.
* **Natural Triggers**: *"Audit our GEMINI.md rules"*, *"프로젝트 규칙 파일을 에이전트 친화적으로 개편해줘"*.

---

### 2. 🧠 [`agent-session-retrospective`](./agent-session-retrospective/)
* **Category**: Continuous Learning & Session Root-Cause Analysis
* **Description**: Autonomous self-reflection engine for AI coding sessions. Parses raw conversation logs and terminal build errors, extracts friction points, generates date-isolated retrospective documents (`YYYY-MM-DD-retrospective.md`), and promotes recurring lessons (`Hits >= 2`) into active golden rules.
* **Key Tools**:
  - `parse_session.py`: Parses transcripts in <0.05s into a 300-token signal digest.
  - `generate_retro_doc.py`: Automatically generates daily retrospective markdown docs and index tables.
  - `manage_rules.py`: Manages golden rule deduplication, hits sorting, and 10-rule quota archiving.
* **Natural Triggers**: *"오늘 작업 복기해줘"*, *"Review today's session post-mortem and update golden rules"*.

---

### 3. 🛡️ [`chrome-extension-project-final-checker`](./chrome-extension-project-final-checker/)
* **Category**: Chrome Extension Quality Assurance (QA) & Release Verification
* **Description**: Automated 5-Step Deep Audit Protocol that runs before shipping a Chrome Extension (Manifest V3) or web application. Eliminates silent runtime crashes, service worker sleep event drops, broken asset paths (404s with cross-platform case sensitivity), and unmanaged event listener memory leaks.
* **Key Tools**:
  - `final_check.py`: One-stop 5-step automated QA runner generating `FINAL_QA_REPORT.md`.
* **Natural Triggers**: *"Run final project verification before release"*, *"배포 전 5단계 QA 감사 실행해줘"*.

---

### 4. ⚖️ [`chrome-web-store-policy-checker`](./chrome-web-store-policy-checker/)
* **Category**: Chrome Web Store Policy Compliance & Rejection Prevention
* **Description**: Comprehensive policy compliance auditor enforcing Google's latest Chrome Web Store Developer Program Policies. Detects Remote Code Execution (RCE) via `eval()` or external CDN scripts, flags unneeded permissions, generates dashboard-ready permission justifications, and provides formal appeal letter templates.
* **Key Tools**:
  - `audit_policy.py`: Static scanner detecting RCE vulnerabilities, unencrypted endpoints, and unused permissions.
  - `generate_justifications.py`: Generates copy-paste ready justification statements for Developer Dashboard submissions.
* **Natural Triggers**: *"Audit this extension against Chrome Web Store policies"*, *"웹 스토어 정책 감사 및 권한 소명서 생성해줘"*.

---

### 5. 🏗️ [`proactive-code-architect`](./proactive-code-architect/)
* **Category**: Modular Software Architecture & Pre-Write Guardrails
* **Description**: Enforces clean, decoupled, vertical-slice architecture **upfront** before code is written. Prohibits monolith file bloat with a strict **400-line hard limit**, enforces Single Responsibility per file (SRP), and provides complexity gates (nesting depth ≤ 4, cyclomatic complexity ≤ 15).
* **Key Tools**:
  - `audit_architecture.py`: Codebase modularity, file line count, and circular dependency auditor.
  - `scaffold_module.py`: Instant 0.1s feature module generator (`types` → `utils` → `atoms` → `model` → `view` → `index.ts`).
* **Natural Triggers**: *"Scaffold a new feature using proactive code architect rules"*, *"선제적 아키텍처 원칙에 따라 새 모듈을 설계해줘"*.

---

### 6. 📋 [`universal-qa-tracker`](./universal-qa-tracker/)
* **Category**: Quality Assurance & Release Tracking
* **Description**: Enterprise-grade, zero-dependency QA management suite supporting 100% offline browser execution (`file:///` protocol). Features high-density interactive spreadsheets, visual analytics dashboards with SVG charts, multi-track milestone management, and bilingual issue recording.
* **Key Tools**:
  - `init_tracker.py`: Greenfield scaffolding & brownfield adoption of existing QA trackers.
  - `add_issue.py`: Atomic issue injection with auto-increment ID and transaction rollback.
  - `update_issue.py`: Atomic updater for issue status, applied fixes, and modified files.
  - `add_phase.py`: Milestone track rollover generator with HTML script tag injection.
  - `audit_qa.py`: Data integrity linter verifying unique IDs, required fields, and file paths.
  - `export_report.py`: Exports datasets to Markdown, CSV, or JSON for release notes & store appeals.
* **Natural Triggers**: *"Set up a QA issue tracker"*, *"Log a QA bug fix"*, *"Export QA resolution report"*, *"QA 트래커 생성해줘"*.

---

### 7. 🛡️ [`universal-guardrail-bootstrap`](./universal-guardrail-bootstrap/)
* **Category**: End-to-End SDLC Governance & Architecture Guardrails
* **Description**: Adaptive, stack-aware architectural guardrail engine for React Native/Expo, Next.js, Vite/React, Vue, and Node/TS. Evaluates missing code-quality guardrails across all 6 SDLC stages (Bootstrap, Authoring, Testing, Pre-Commit, Pre-Build, Release) and establishes zero-tolerance static checks against technical debt, magic literals, and `any` types.
* **Key Capabilities**:
  - **6-Stage Gap Inspection**: Automatically audits design tokens, strict TypeScript, style locks, focused test leaks (`it.only`), circular dependencies, and i18n parity.
  - **Machine-Evaluated Gatekeeping**: Bootstraps ESLint, Husky, lint-staged, knip, and pre-build fail-fast validation into repository pipelines.
* **Natural Triggers**: *"Audit our project guardrails"*, *"Bootstrap SDLC guardrails"*, *"Check guardrails against technical debt"*, *"가드레일 점검해줘"*, *"프로젝트 가드레일 구축해줘"*.

---

## 🏛️ Standard Architecture of a Skill

Every skill in this collection follows this standardized directory layout:

```text
📁 <skill-name>/
├── 📄 README.md                 # Human & agent readable comprehensive user guide
├── 📄 SKILL.md                  # YAML Frontmatter + Imperative agent execution protocol
├── 📁 scripts/                  # High-performance Python automation engines (<0.1s execution)
│   ├── 🐍 <main_tool>.py        # Deterministic analysis, QA, or generation tool
│   └── 🐍 <helper_tool>.py      # Specialized helper utilities
└── 📁 references/               # (Optional) Technology-specific architecture & pattern guides
```

---

## 🚀 How to Install & Use Skills

### Method 1: Workspace-Level Installation (Recommended)
Copy any skill folder into your project's `.agents/skills/` directory:
```bash
# Example: Adding proactive-code-architect to your repository
cp -r /path/to/junpapapo-skills/proactive-code-architect ./my-project/.agents/skills/
```

### Method 2: Global Installation (Across All Projects)
Copy skill folders into your global AI configuration directory:
* **Gemini Antigravity**: `~/.gemini/config/skills/<skill-name>/`
* **Claude Code**: `~/.claude/skills/<skill-name>/`

---

## ➕ Template for Adding New Skills

When adding a new skill to this repository, append a new row to the [Master Index Table](#-skills-master-index) and add a showcase section using the template below:

```markdown
### N. 🏷️ [`<new-skill-name>`](./<new-skill-name>/)
* **Category**: [Skill Category, e.g., Testing / Performance / Security]
* **Description**: [Concise 2-sentence summary of the problem solved and core mechanism]
* **Key Tools**:
  - `<script_name>.py`: [Description of what the Python CLI tool does]
* **Natural Triggers**: *"[Prompt trigger 1]"*, *"[Prompt trigger 2]"*.
```

---

## 📄 License

MIT License — free for open-source, educational, and commercial software engineering projects.
