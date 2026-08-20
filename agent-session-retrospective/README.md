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
# 📅 [2026-08-17] 세션 복기 및 오답노트

- **세션 주제**: 대시보드 Buddy Notes 통일 및 다국어 스토어 리스팅 확장
- **작업 통계**: 수정 파일 12개, 빌드 검증 2회 (Pass)
- **대상 에이전트**: Gemini Antigravity

---

### 🎯 복기 매트릭스 (KPT)
| 구분 | 내용 | 분석 및 근본 원인 |
| :--- | :--- | :--- |
| **Keep (성공)** | 9개 언어 i18n 번역 및 UI 컴포넌트 1:1 완벽 동기화 | 컴포넌트-언어팩 간 1:1 대조 수정으로 빌드 에러 0건 달성 |
| **Problem (실수)** | 스토어 리스팅 문서 4개 언어 누락 인지 지연 | 프로젝트 지원 언어(9개)와 문서 폴더(5개)의 불일치를 선제 점검하지 않음 |
| **Try (실행 수칙)** | 다국어/문서 작업 시 `_locales` 디렉토리와 100% 전수 대조 필수 | 단편 수정 금지, 로케일 목록 기반 체크리스트 작성 후 일괄 실행 |

---

### 🚫 추출된 행동 룰 (Rule Extraction)
- **룰 코드**: `RULE-I18N-SYNC`
- **상태**: 🔥 **승격 (`GEMINI.md` 동기화)**
- **행동 수칙**: 다국어(i18n) 및 리소스/문서 수정 시 프로젝트에 정의된 전체 로케일(Locale) 목록을 먼저 파싱하고 1:1 전수 일괄 동기화한다.
```

### 2. Active Golden Rules Table (`GEMINI.md`)
```markdown
### 🚫 REFINED AGENT GOLDEN RULES (오답노트 누적 승격 룰 Top 7)
> 💡 세션 복기를 통해 2회 이상 반복 지적된 실수만 엄선하여 빈도순으로 자동 정렬된 최우선 준수 규칙입니다.

| 우선순위 | 룰 코드 | 발생 빈도 | 범용 행동 수칙 (Golden Rule) |
| :---: | :--- | :---: | :--- |
| **P0** | `RULE-SURGICAL-EDIT` | 🔥 **3회** | 코드 수정 시 최소 변경 대상 라인만 외과수술식으로 수정하며 인접 코드 임의 변경을 금지한다. |
| **P1** | `RULE-I18N-SYNC` | ⚠️ **2회** | 다국어(i18n) 및 리소스/문서 수정 시 프로젝트에 정의된 전체 로케일(Locale) 목록을 먼저 파싱하고 1:1 전수 일괄 동기화한다. |
```

---

## 📜 License
MIT License. Created for professional AI agent pairing and autonomous continuous learning.
