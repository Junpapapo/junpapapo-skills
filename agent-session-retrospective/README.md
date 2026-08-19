# 🧠 Session Retrospective Skill (`session-retrospective`)

> **Autonomous Post-Mortem, Friction-Point Analysis, and Frequency-Weighted Golden Rule Engine for AI Agents.**

---

## 🌟 Overview

The **Session Retrospective Skill (`session-retrospective`)** is a continuous learning and self-reflection engine designed for AI coding agents (Gemini Antigravity, Claude Code, Cursor, Aider, etc.).

Instead of repeating the same mistakes across long sessions, this skill analyzes raw conversation logs (`transcript.jsonl`) and build outputs (`tasks/*.log`), extracts actionable user corrections and build errors, produces date-isolated retrospective documents (`YYYY-MM-DD-retrospective.md`), and synchronizes generalized, frequency-weighted **Golden Rules** directly into the project rulebook (`GEMINI.md` / `CLAUDE.md`).

---

## ✨ Key Features

### 1. ⚡ Ultra-Compact Token Optimization (95%+ Savings)
- Avoids dumping massive, multi-megabyte JSONL transcripts into the LLM context.
- Dedicated Python helper scripts parse logs in **<0.05s** and extract a clean, 300-token signal digest containing only user friction points and build stack traces.

### 2. 🔍 Automated Friction Point & Error Extraction
- Identifies moments where the user had to intervene, correct assumptions, or point out omissions (e.g., *"not that"*, *"missing"*, *"wrong"*, *"check all"*).
- Pinpoints build failures and terminal exit codes to uncover the true root cause of mistakes.

### 3. 🛡️ Rule Anti-Inflation & Frequency-Weighted Promotion
- **Promotion Threshold**:
  - **1st-time mistake (`Hits = 1`)**: Stored only in the daily retrospective doc as a **Candidate Rule** to prevent polluting the main rulebook.
  - **Recurring mistake (`Hits >= 2`)**: Automatically promoted into the project's active `### 🚫 REFINED AGENT GOLDEN RULES` table.
- **Weighted Descending Sort**: Rules with the highest occurrence count (`🔥 3 Hits`) are automatically sorted to the top (`P0`), ensuring immediate agent attention.
- **10-Rule Quota Cap**: Limits active golden rules to **10 items**, retiring older non-recurring rules to the archive to keep token overhead minimal.

### 4. 🌐 Universal Rule Generalization & Bilingual (KO / EN) Support
- Strips out project-specific domain names (e.g., specific variable names or app-specific terms).
- Generalizes all lessons into reusable, universal software engineering principles (e.g., `[RULE-I18N-SYNC]`, `[RULE-SURGICAL-EDIT]`).
- **Dynamic Language Mirroring**: Provides 100% full bilingual (Korean / English) parity templates so international teams and single-language projects alike receive perfectly mirrored golden rules.

### 5. 🗂️ Date-Isolated Folder Architecture
- Automatically detects the project's documentation folder (Priority: `01.Docs/00_Retrospectives/` > `docs/retrospectives/`).
- Creates standalone `YYYY-MM-DD-retrospective.md` files and maintains a sorted table index in `README.md`.

### 6. 🔄 Cross-Agent Auto-Detection & 3-Level Fallback
- **Level 1 (Gemini / Antigravity)**: Parses `~/.gemini/antigravity/brain/<id>/transcript.jsonl`.
- **Level 2 (Claude Code / Aider)**: Parses `~/.claude/` session logs or `.aider.chat.history.md`.
- **Level 3 (Universal Fallback)**: Automatically falls back to `git log -n 5 --stat` and the active chat context if no raw log files are accessible.

### 7. 📊 Session Health & Alignment Score (0-100)
- Automatically computes a real-time collaboration health metric based on user friction points, build errors, and surgical precision (`🌟 Excellent`, `🟢 Good`, `🟡 Moderate`, `⚠️ Needs Alignment`).

### 8. 🎓 Retired Rules Hall of Fame (Archive)
- Retired rules pushed out by the 10-rule quota cap are permanently preserved under `## 🎓 졸업한 골든 룰 아카이브` in `README.md`.

### 9. 🛡️ Pre-Flight Self-Audit Mode
- Enables agents to self-audit their pending code changes against the active Golden Rules checklist (`manage_rules.py --audit`) before delivering final output.

### 10. 📈 Weekly/Monthly Rollup Engine
- Aggregates daily retrospectives across weeks/months into an executive 1-page summary report (`generate_retro_doc.py --rollup weekly`).

---

## 📁 Directory Structure

```text
📁 session-retrospective/
├── 📄 README.md                 # [This File] English documentation and usage guide
├── 📄 PLANNING.md               # Detailed architecture specification and data models
├── 📄 SKILL.md                  # Agent execution protocol (YAML Frontmatter + Workflow)
└── 📁 scripts/
    ├── 🐍 parse_session.py       # Raw log parser & friction point extractor
    ├── 🐍 manage_rules.py        # Rule deduplication, Hits counting, sorting & cap manager
    └── 🐍 generate_retro_doc.py  # Retrospective markdown renderer & README.md indexer
```

---

## 🚀 How to Use

### Natural Language Triggers
Simply prompt your AI agent with any of the following:
- *"오늘 작업 복기해줘"* / *"오늘 세션 회고해줘"*
- *"2026-08-17 세션 복기해서 오답노트에 남겨줘"*
- *"Review today's session, create a retrospective doc, and update golden rules"*

---

## 🛠️ CLI Script Reference

### 1. Parse Session Logs
```bash
# Single date (default: today / latest)
python scripts/parse_session.py --date 2026-08-17 --format json

# Past N days (e.g. past week = 7 days)
python scripts/parse_session.py --days 7 --format json

# Since specific date with workspace filter
python scripts/parse_session.py --since 2026-08-10 --workspace "/path/to/project" --filter-workspace --format json
```

### 2. Generate Retrospective Document

```bash
# 🔥 1-Stop Seamless Auto Generation (Recommended)
python scripts/generate_retro_doc.py --auto --workspace "/path/to/project"

# 🚀 1-Stop Auto Generation for Past 7 Days
python scripts/generate_retro_doc.py --auto --days 7 --workspace "/path/to/project"

# 🛠️ Explicit Argument Rendering
python scripts/generate_retro_doc.py \
  --date "2026-08-17" \
  --topic "Dashboard Notes Unification & i18n Store Listing Parity" \
  --workspace "/path/to/project" \
  --keep "Full 9-locale i18n parity and 0-error production build pass." \
  --problem "Initial store listing copy only covered 5 locales instead of all 9." \
  --try-rule "Always pre-parse the complete project locale list before modifying i18n resources." \
  --rule-code "RULE-I18N-SYNC" \
  --rule-text "Always parse the complete list of project-defined locales before editing i18n/docs to ensure 100% 1:1 parity." \
  --rule-status "promoted" \
  --files-count 12 \
  --build-count 2 \
  --build-status "Pass" \
  --agent-name "Gemini Antigravity"
```

### 3. Upsert & Sort Golden Rules in Rulebook
```bash
python scripts/manage_rules.py \
  --file "/path/to/GEMINI.md" \
  --code "RULE-I18N-SYNC" \
  --text "Always parse the complete list of project-defined locales before editing i18n/docs to ensure 100% 1:1 parity." \
  --hits 1 \
  --cap 7
```

---

## 📄 Output Sample

### 1. Daily Retrospective Document (`01.Docs/00_Retrospectives/2026-08-17-retrospective.md`)
```markdown
# 📅 [2026-08-17] Session Retrospective & Lesson Notes

- **Session Topic**: Dashboard Notes Unification & i18n Store Listing Parity
- **Session Stats**: 12 modified files, 2 build checks (Pass)
- **Target Agent**: Gemini Antigravity

---

### 🎯 Retrospective Matrix (KPT)
| Category | Details | Analysis & Root Cause |
| :--- | :--- | :--- |
| **Keep (Success)** | Full 9-locale i18n translation & UI component 1:1 parity | Zero build errors achieved by 1:1 component-to-language pack verification |
| **Problem (Friction)** | Delayed detection of 4 missing locales in store listing docs | Failed to pre-verify discrepancy between supported locales (9) and doc folders (5) |
| **Try (Action Rule)** | Mandatory 100% cross-check against `_locales` directory for i18n tasks | Avoid piecemeal edits; build checklist from full locale list and execute in batch |

---

### 🚫 Extracted Action Rule
- **Rule Code**: `RULE-I18N-SYNC`
- **Status**: 🔥 **Promoted (Synced to `GEMINI.md`)**
- **Action Rule**: Always parse the complete list of project-defined locales before editing i18n/docs to ensure 100% 1:1 parity.
```

### 2. Active Golden Rules Table (`GEMINI.md`)
```markdown
### 🚫 REFINED AGENT GOLDEN RULES (Cumulative Retrospective Top 7)
> 💡 Priority-ranked rules automatically sorted by frequency, curated from mistakes occurring 2+ times across retrospectives.

| Priority | Rule Code | Occurrences | Universal Golden Rule |
| :---: | :--- | :---: | :--- |
| **P0** | `RULE-SURGICAL-EDIT` | 🔥 **3 Hits** | Apply surgical edits strictly to minimal target lines and avoid arbitrary adjacent code modifications. |
| **P1** | `RULE-I18N-SYNC` | ⚠️ **2 Hits** | Always parse the complete list of project-defined locales before editing i18n/docs to ensure 100% 1:1 parity. |
```

---

## 📜 License
MIT License. Created for professional AI agent pairing and autonomous continuous learning.
