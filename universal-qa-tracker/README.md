# Universal QA Issue Tracker (`universal-qa-tracker`)

> Enterprise-grade, zero-dependency QA issue management, visual analytics, and Voice-of-Customer (VOC) telemetry ecosystem designed for agile software engineering teams and AI coding agents.

[![Python 3.8+](https://img.shields.io/badge/Python-3.8%2B-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20External-success.svg)]()
[![i18n](https://img.shields.io/badge/i18n-EN%20%7C%20KO%20%7C%20JA-orange.svg)]()
[![Standard](https://img.shields.io/badge/Standard-IEEE%201044%20%7C%20ISO%2025010-blueviolet.svg)]()

---

## 🌟 Highlights & Key Value

- **Zero-Server Browser Execution**: Double-click and open directly via `file:///` protocol in Chrome, Safari, Edge, or Firefox. No local Node/Python web servers or CORS workarounds required.
- **Canonical 6-Portal Suite**: Complete portal suite covering executive launchpad, interactive master spreadsheet, visual analytics studio, production release & version cadence studio, in-app VOC feedback studio, and Google Sheets setup documentation.
- **High-Density Progressive Spreadsheet View**: Compact, professional spreadsheet layout benchmarked from rigorous testing workflows (500+ issues tracked with zero lag via 50-item chunk progressive rendering, sub-16ms paint, debounced search, and cached lookups).
- **Dual-OS Deployment Governance (🤖 AOS & 🍎 iOS)**: Independent deployment tracking with smart N/A cross-platform guards, dual target releases, sticky table headers, 2-tier collapsible drawer filter toolbar, and tailored Google Play Store & Apple App Store release notes auto-generators.
- **Interactive Visual Dashboard**: Real-time pure SVG charts, IEEE 1044 severity donut metrics, daily time-series risk burndown stacked bars, and code hotspot analysis.
- **Voice of Customer (VOC) & Survey Studio**: 3-tab intelligence desk (Live Feed & Triage, Aggregated Analytics, and Survey History & Insights) with real-time 15-column telemetry and direct one-click promotion into tracked QA issues.
- **In-App Dynamic Survey & Feedback SDK**: Ready-to-use TypeScript/React Native feedback service (`FeedbackService.ts`) with offline caching, dynamic survey loader (`SurveyService.ts`), interactive 4-choice survey card (`FeedbackSurveyCard.tsx`), and full submission modal (`FeedbackModal.tsx`).
- **Dynamic Multi-Language Survey Config**: Zero-cost Google Sheets backend (`Survey_Config`) enabling on-the-fly campaign question/option changes with real-time Google Translate formula synchronization across 17 global languages.
- **Native Multilingual Engine (i18n)**: One-click toggle across **English (en)**, **Korean (ko)**, and **Japanese (ja)** with `localStorage` preference persistence and optional dual-language issue schemas.
- **Automated CLI Command Suite**: 100% Python standard library tools for scaffolding, atomic issue injection, status updates, track rollovers, data auditing, VOC syncing, and markdown export.

---

## 📁 Repository Structure

```
universal-qa-tracker/
├── SKILL.md                            # Agent instructions & workflow decision tree
├── README.md                           # Complete skill & module documentation
├── client-templates/                   # In-app VOC & Dynamic Survey Telemetry SDK
│   ├── types/
│   │   └── survey.ts                   # Survey data contracts, DTOs & telemetry state
│   ├── defaultSurvey.ts                # Offline fallback survey configuration (4 choices)
│   ├── SurveyService.ts                # Dynamic Google Sheets survey fetcher & cache manager
│   ├── FeedbackSurveyCard.tsx          # Dynamic 4-choice interactive survey card UI
│   ├── FeedbackService.ts              # Universal client service with offline caching & retry
│   └── FeedbackModal.tsx               # Beautiful React Native / Web feedback & survey modal
├── scripts/                            # Zero-dependency Python CLI management tools
│   ├── init_tracker.py                 # Greenfield scaffolding & brownfield adoption
│   ├── add_issue.py                    # Atomic issue injection with auto-increment ID
│   ├── update_issue.py                 # Atomic issue updater (status, fix, files, actions)
│   ├── add_phase.py                    # Milestone track rollover generator
│   ├── audit_qa.py                     # Dataset integrity linter & validator
│   ├── export_report.py                # Markdown/CSV/JSON export for release notes & appeals
│   ├── sync_feedback.py                # Google Sheets VOC synchronization & QA issue promotion
│   ├── migrate_severity.py             # Batch IEEE 1044 severity classification migrator
│   └── google_apps_script_template.js  # Zero-cost Google Apps Script webhook backend (v2.0 Master)
└── templates/                          # Production-ready web assets (Canonical 5-Portal Suite)
    ├── .qa_config.json                 # Project metadata schema
    ├── index.html                      # Portal 1: Executive Hub Launchpad
    ├── qa_spreadsheet.html             # Portal 2: Interactive Master Spreadsheet
    ├── qa_analytics_dashboard.html     # Portal 3: QA Intelligence & Analytics Studio
    ├── ops_release_dashboard.html      # Portal 4: Production Release & Version Cadence Studio
    ├── voc_dashboard.html              # Portal 5: Voice of Customer (VOC) & Survey Studio (3-Tab)
    ├── google_sheets_voc_setup_guide.html # Portal 6: Google Sheets & Apps Script Setup Guide
    ├── js/
    │   ├── qa_i18n.js                  # Client-side i18n localization engine
    │   └── qa_engine.js                # Search, filtering, bookmarks, and renderer
    └── data/
        ├── qa_manifest.js              # Track registry & milestone configurations
        ├── phase1_closed_testing.js    # Phase 1 baseline dataset
        ├── phase2_open_beta.js         # Phase 2 dataset
        ├── phase3_v1_1_backlog.js      # Phase 3 backlog dataset
        └── feedback_manifest.js        # In-app user feedback dataset
```

---

## 🚀 Quick Start

### 1. New Project Scaffolding (Greenfield)
To install Universal QA Tracker into a new project:

```bash
# Basic setup in default location (docs/qa_tracker)
python scripts/init_tracker.py --project-name "MyApp" --lang "ko"

# Custom directory with mobile preset
python scripts/init_tracker.py --target-dir "qa_tracker" --preset "mobile"
```

### 2. Adopting an Existing Tracker (Brownfield)
If you already maintain QA datasets (such as Modo's 350+ issue tracker), adopt it non-destructively:

```bash
python scripts/init_tracker.py --target-dir "docs/02_Guides/internal_qa_issue_tracker" --adopt-existing
```
*Existing datasets and customized files will never be overwritten.*

---

## 🏛️ The Canonical 6-Portal Suite

| Portal | File | Description & Key Capabilities |
| :--- | :--- | :--- |
| **1. Executive Hub** | [`index.html`](file:///c:/00_Workspace/00_Mobile_Apps/Modo/.gemini/skills/universal-qa-tracker/templates/index.html) | Apple-style frosted glass launchpad with live telemetry summary cards, milestone progress bars, and navigation links. |
| **2. Master Spreadsheet** | [`qa_spreadsheet.html`](file:///c:/00_Workspace/00_Mobile_Apps/Modo/.gemini/skills/universal-qa-tracker/templates/qa_spreadsheet.html) | High-density 500+ issue spreadsheet with sticky table header, dual-OS deployment tracking (🤖 AOS / 🍎 iOS) with smart N/A, 2-tier collapsible drawer filter toolbar, tailored store release notes generators, 8-domain category filters, IEEE 1044 severity badges, interactive bug generator modal, and resizable inspection drawer. |
| **3. Analytics Studio** | [`qa_analytics_dashboard.html`](file:///c:/00_Workspace/00_Mobile_Apps/Modo/.gemini/skills/universal-qa-tracker/templates/qa_analytics_dashboard.html) | Deep intelligence studio featuring 8 pure SVG charts (Daily Risk Burndown, IEEE 1044 Donut, Category Radar/Bars, Code Hotspots), Auto-Insights narrative engine, and frosted settings popover. |
| **4. Release Cadence Studio** | [`ops_release_dashboard.html`](file:///c:/00_Workspace/00_Mobile_Apps/Modo/.gemini/skills/universal-qa-tracker/templates/ops_release_dashboard.html) | Independent OS release track governance (Android Google Play vs iOS App Store), stepped progression curve timeline, monthly volume comparison, interactive calendar sprint matrix with multi-release support, and one-click changelog drawer. |
| **5. VOC & Survey Studio** | [`voc_dashboard.html`](file:///c:/00_Workspace/00_Mobile_Apps/Modo/.gemini/skills/universal-qa-tracker/templates/voc_dashboard.html) | Voice of Customer triage and survey intelligence studio with 3 dedicated views: **Live VOC Feed** (filtering & 1-click "Promote to QA"), **VOC Analytics** (satisfaction, platform & category distribution), and **Survey History & Insights** (4-choice podium charts, rating cross-matrix, multiline verbatim quotes, and report generation). |
| **6. Google Sheets Setup** | [`google_sheets_voc_setup_guide.html`](file:///c:/00_Workspace/00_Mobile_Apps/Modo/.gemini/skills/universal-qa-tracker/templates/google_sheets_voc_setup_guide.html) | Interactive 4-step SOP guide detailing Google Sheets webhook configuration, v2.0 master Apps Script deployment (15-column schema), `Survey_Config` 17-language automatic translation setup, and client app telemetry integration. |

---

## 🛠️ CLI Tools Reference

All scripts reside in `scripts/` and run on any Python 3.8+ installation with zero external packages (`pip install` not required).

### 1. `add_issue.py`
Appends a new issue with automated ID calculation, category tagging, and transactional file rollback safety.

```bash
python scripts/add_issue.py \
  --phase "phase1_closed_testing" \
  --title "Audio playback pause on background transition" \
  --problem "Audio continues playing for 500ms after app minimization." \
  --cause "Missing AppState change listener detachment in sound hook." \
  --solution "Added useAppState event subscription with immediate pause dispatch." \
  --category "media" \
  --severity "S2" \
  --platform "mobile" \
  --files "hooks/useAudioPlayer.ts" "services/SoundManager.ts" \
  --screenshots "screenshots/audio_pause_fix.png" \
  --actions "1. Verified instant pause on home gesture." "2. Verified resume on foreground."

# Or auto-populate title & files directly from latest git commit:
python scripts/add_issue.py --from-git --category "core" --status "resolved"
```

### 2. `update_issue.py`
Updates an existing issue across any phase dataset without corrupting adjacent entries.

```bash
python scripts/update_issue.py \
  --id 42 \
  --status "resolved" \
  --solution "Fixed memory leak in WebSocket reconnect listener." \
  --files "network/socket.ts" \
  --actions "1. Simulated network drops" "2. Verified memory heap stability"
```

### 3. `sync_feedback.py`
Synchronizes user feedback from Google Sheets or CSV exports into `data/feedback_manifest.js`, and promotes user feedback into tracked QA issues.

```bash
# Sync from downloaded CSV:
python scripts/sync_feedback.py --csv-file "feedback.csv"

# Promote feedback #101 to a QA issue in Phase 1:
python scripts/sync_feedback.py --promote 101 --promote-phase "phase1_closed_testing"
```

### 4. `migrate_severity.py`
Scans existing issue datasets and classifies unrated or legacy severity tags according to international IEEE 1044 / ISTQB standards.

```bash
python scripts/migrate_severity.py --file "data/phase1_closed_testing.js"
```

### 5. `add_phase.py`
Creates a new milestone phase track, registers it in `qa_manifest.js`, and adds script references to both HTML views.

```bash
python scripts/add_phase.py \
  --id "phase2_open_beta" \
  --label "🧪 Phase 2: Open Beta" \
  --badge "Open Beta (0 items)" \
  --color "#3B82F6"
```

### 6. `audit_qa.py`
Validates dataset integrity, checks for duplicate IDs within and across tracks, missing required fields, and verifies that listed source files exist in the repository.

```bash
python scripts/audit_qa.py --check-files
```

### 7. `export_report.py`
Generates formatted reports in Markdown, CSV, or JSON for GitHub PRs, release notes, or App Store review submissions.

```bash
python scripts/export_report.py --phase "all" --status "resolved" --format "markdown" --output "QA_REPORT.md"
```

---

## 🏷️ Standards Compliance

### 1. ISO/IEC 25010 Quality Domain Taxonomy
Every QA issue must be categorized strictly according to the 8 standard Quality Domains:
- `reliability`: Crashes, freezes, ANRs, silent data loss, offline sync corruption.
- `core`: Domain business rules, state machines, calculation logic, workflow transitions.
- `ui`: Layout clipping/overflow, padding density, WCAG AA color contrast, dark mode harmony.
- `perf`: Frame drops, battery drain, redundant re-renders, slow queries (>100ms).
- `media`: Audio focus, background playback, TTS leaks, camera/microphone permissions.
- `monetization`: In-app purchase (IAP) validation, subscriptions, store review rejection risks.
- `auth`: Token lifecycle, OAuth refresh loops, permission rejections, session security.
- `db`: SQLite migrations, schema upgrades, index optimization, cache persistence.

### 2. IEEE 1044 / ISTQB Severity Classifications
- **`S1` (Blocker / P0)**: App crash, freeze/deadlock, data corruption, store rejection.
- **`S2` (Critical / P1)**: Core logic broken, sync failure, permissions blocked, no workaround.
- **`S3` (Major / P2)**: Standard functional defect with viable workaround.
- **`S4` (Minor / P3)**: UI padding/contrast, text truncation, cosmetic polishing.
- **`S5` (Trivial / P4)**: Code health, 400-line modularization, unused imports, internal comments.

---

## 🔒 Security & Zero Secrets Policy

- **No Hardcoded URLs or API Keys**: Web templates and client SDK files use placeholder constants (`YOUR_APPS_SCRIPT_WEB_APP_URL_HERE`) and load dynamic endpoints from configuration or `localStorage`.
- **Zero Remote Dependencies**: All HTML pages, SVG renderers, and script tools run 100% offline without external CDN script tags.
- **Atomic File Rollback**: All Python modification scripts generate temporary `.bak` files and perform syntax verification before committing updates to disk.

---

## 📜 License

Distributed under the MIT License. Free for personal and commercial software projects.
