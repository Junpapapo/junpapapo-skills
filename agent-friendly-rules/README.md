# 🤖 Agent-Friendly Rules Skill (`agent-friendly-rules`)

> **Architectural standards, rule lifecycle governance, and automated Python CLI linters for authoring high-compliance AI agent rulebooks (`CLAUDE.md`, `GEMINI.md`, `.cursorrules`, `AGENTS.md`).**

---

## 🌟 Overview

The **Agent-Friendly Rules Skill (`agent-friendly-rules`)** is an enterprise-grade framework and tooling suite designed to solve the most pervasive friction point in AI-assisted software engineering: **agents ignoring, misinterpreting, or bypassing project guidelines**.

LLMs parse markdown documents based on **attention weight mechanisms**. When rules are written as conversational paragraphs, gentle advice (*"please try to..."*, *"it is recommended to..."*), or disorganized lists, LLMs frequently skip critical constraints, perform unsolicited refactorings, or generate unverified code.

This skill provides:
1. **Attention Weight Engineering**: Structuring rules using imperative verbs, visual alert blocks (`[!IMPORTANT]`), and contrasting constraint partitions (`🔴 DO NOT` vs `🟢 DO`).
2. **Conflict Resolution Hierarchy**: A definitive cascade resolving contradictory directives between system prompts, project rulebooks, active skills, and immediate user chat prompts.
3. **Rule Lifecycle & Anti-Inflation Quota (10-Rule Cap)**: Prevents rule bloat via incubator, active promotion (`Hits >= 2`), and retirement archive.
4. **Automated Python CLI Linters (`lint_rules.py`)**: Scores rulebook health (0-100) and detects weak words in milliseconds.
5. **One-Click Initializers (`init_rules.py`)**: Bootstraps framework-tailored rulebooks in Korean or English.

---

## ✨ Core Pillars & Methodology

```
                       ┌─────────────────────────────────────────┐
                       │   Agent-Friendly Rules Governance Model │
                       └────────────────────┬────────────────────┘
                                            │
         ┌──────────────┬───────────────────┼───────────────────┬──────────────┐
         ▼              ▼                   ▼                   ▼              ▼
  Attention Weight  Conflict            Rule Lifecycle      4 Mandatory     Automated CLI
  Engineering       Hierarchy           & 10-Rule Cap       Core Directives Linters
  (DO NOT vs DO)    (Priority Cascade)  (Anti-Inflation)    (Zero Guessing) (lint_rules.py)
```

### 1. 🧠 Attention Weight Engineering
- **Imperative Directives**: Replaces weak polite suggestions with unambiguous commands (**"MUST NOT"**, **"NEVER"**, **"DO NOT"**).
- **Visual Segregation**: Explicitly partitions guidelines into **`🔴 DO NOT (CRITICAL CONSTRAINTS)`** and **`🟢 DO (MANDATORY ACTIONS)`**.
- **GitHub Alert Elevation**: Uses `> [!IMPORTANT]` and `> [!WARNING]` blocks for critical safety barriers.

### 2. ⚡ Conflict Resolution Hierarchy
When conflicting instructions occur, agents follow this strict hierarchy:
1. **Level 1**: System Prompt / Core Safety Directives (Highest Authority)
2. **Level 2**: Project Rulebook (`GEMINI.md` / `CLAUDE.md`)
3. **Level 3**: Active Skill Guidelines (`SKILL.md`)
4. **Level 4**: Immediate User Chat Prompt (Lowest Base Priority)

### 3. 🛡️ 4 Non-Negotiable Core Directives
1. **No Assumptions (No Arbitrary Edits)**: Halts execution and forces clarification on ambiguous requirements.
2. **Surgical Edits Only (Strict Scope)**: Forbids out-of-scope refactoring or touching unrelated code lines.
3. **Synchronous Verification Loop**: Mandates compilation checks (`npm run build`, `npx tsc --noEmit`) before task handoff.
4. **Restricted Interactive Behaviors**: Prohibits UI-blocking browser dialogs (`alert()`, `confirm()`) and terminal polling loops.

---

## 📁 Directory Structure

```text
📁 agent-friendly-rules/
├── 📄 README.md                 # [This File] User guide and framework overview
├── 📄 SKILL.md                  # Agent execution protocol (YAML Frontmatter + Detailed Specs)
└── 📁 scripts/
    ├── 🐍 lint_rules.py         # Automated rulebook auditor & health scoring engine
    └── 🐍 init_rules.py         # Framework-tailored rulebook generator
```

---

## 🛠️ Automated CLI Tool Reference

> [!NOTE]
> Replace `<skill_dir>` with the relative or absolute path of this skill folder (e.g. `.agents/skills/agent-friendly-rules` or full path).

### 1. Lint and Score Existing Rules (`lint_rules.py`)
Audit your project's rule file (`GEMINI.md` or `CLAUDE.md`) in **<0.05 seconds**:

```bash
# Terminal colored table audit
python <skill_dir>/scripts/lint_rules.py --path .

# Output detailed Markdown report
python <skill_dir>/scripts/lint_rules.py --path ./GEMINI.md --format markdown --output RULE_HEALTH.md

# Output JSON for CI/CD pipeline gates
python <skill_dir>/scripts/lint_rules.py --path ./GEMINI.md --format json
```

### 2. Generate Optimized Rulebooks (`init_rules.py`)
Quickly bootstrap attention-optimized rulebooks for any tech stack:

```bash
# React + TypeScript in Korean
python <skill_dir>/scripts/init_rules.py --stack react-ts --lang ko --target GEMINI.md --name "My Web App"

# Next.js App Router in English
python <skill_dir>/scripts/init_rules.py --stack nextjs --lang en --target CLAUDE.md --name "Portal App"

# Chrome Extension (Manifest V3)
python <skill_dir>/scripts/init_rules.py --stack chrome-extension --lang ko --target GEMINI.md --name "My Extension"
```

---

## 🚀 Natural Language Triggers

Prompt your AI coding assistant with:
- *"Audit our GEMINI.md rules using agent-friendly-rules"*
- *"Initialize an agent-friendly rulebook for this React + TypeScript project"*
- *"Refactor our CLAUDE.md to prevent the agent from making arbitrary assumptions"*
- *"규칙 파일을 에이전트 친화적으로 린트하고 채점해줘"*

---

## 🔍 Agent Failure Modes & Rule Fixes

| Symptom | Root Cause | Rulebook Fix |
| :--- | :--- | :--- |
| Agent rewrites working components unnecessarily | Soft suggestion tone (*"keep edits small"*) | Move to `🔴 DO NOT` with: *"NEVER refactor adjacent lines outside requested scope."* |
| Agent reports completion despite compile errors | Verification commands buried in paragraphs | Add dedicated `🟢 DO` bullet with exact command (`npx tsc --noEmit`). |
| Agent guesses missing API parameters | Missing strict boundary rule | Add `> [!IMPORTANT]` block prohibiting assumptions without confirmation. |
| Terminal freezes on file watcher loops | Agent executed `while true; do ...` | Add `🔴 DO NOT` prohibiting infinite polling loops in CLI. |

---

## 📄 License

MIT License — free to use and adapt across all personal and commercial projects.
