# Universal QA Issue Tracker (`universal-qa-tracker`)

> Enterprise-grade, zero-dependency QA issue management and visual analytics system designed for agile software engineering teams and AI coding agents.

[![Python 3.8+](https://img.shields.io/badge/Python-3.8%2B-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20External-success.svg)]()
[![i18n](https://img.shields.io/badge/i18n-EN%20%7C%20KO%20%7C%20JA-orange.svg)]()

---

## 🌟 Highlights & Key Value

- **Zero-Server Browser Execution**: Double-click and open directly via `file:///` protocol in Chrome, Safari, Edge, or Firefox. No local Node/Python web servers or CORS workarounds required.
- **High-Density Spreadsheet View**: Compact, professional spreadsheet layout benchmarked from rigorous closed testing workflows (300+ issues tracked with 0ms lag).
- **Interactive Visual Dashboard**: Real-time SVG charts, resolution rate donut metrics, category distribution bars, and code hotspot analysis.
- **Native Multilingual Engine (i18n)**: One-click toggle across **English (en)**, **Korean (ko)**, and **Japanese (ja)** with `localStorage` preference persistence and optional dual-language issue schemas.
- **Automated CLI Command Suite**: 100% Python standard library tools for scaffolding, atomic issue injection, status resolution updates, track rollovers, data auditing, and markdown export.
- **Designed for AI Agent Pairing**: Built-in location discovery and confirmation protocols, structured schemas, and atomic backup/rollback safeguards.

---

## 📁 Repository Structure

```
universal-qa-tracker/
├── SKILL.md                    # Agent instructions & workflow decision tree
├── README.md                   # Complete skill & module documentation
├── scripts/                    # Zero-dependency Python CLI management tools
│   ├── init_tracker.py         # Greenfield scaffolding & brownfield adoption
│   ├── add_issue.py            # Atomic issue injection with auto-increment ID
│   ├── update_issue.py         # Atomic issue updater (status, fix, files)
│   ├── add_phase.py            # Milestone track rollover generator
│   ├── audit_qa.py             # Dataset integrity linter & validator
│   └── export_report.py        # Markdown/CSV/JSON export for release notes
└── templates/                  # Production-ready web assets
    ├── .qa_config.json         # Project metadata schema
    ├── index.html              # Glassmorphism navigation portal
    ├── qa_spreadsheet.html     # High-density spreadsheet view
    ├── qa_dashboard.html       # Analytics & code hotspot dashboard
    ├── js/
    │   ├── qa_i18n.js          # Client-side i18n localization engine
    │   └── qa_engine.js        # Search, filtering, bookmarks, and renderer
    └── data/
        ├── qa_manifest.js      # Track registry & milestone configurations
        └── phase1_issues.js    # Baseline phase dataset
```

---

## 🚀 Quick Start

### 1. New Project Scaffolding (Greenfield)
To install Universal QA Tracker into a new project:

```bash
# Basic setup in default location (docs/qa_tracker)
python scripts/init_tracker.py --project-name "MyApp" --lang "ko"

# Custom directory
python scripts/init_tracker.py --target-dir "qa_tracker" --preset "mobile"
```

### 2. Adopting an Existing Tracker (Brownfield)
If you already maintain QA datasets (such as Modo's 300+ issue tracker), adopt it non-destructively:

```bash
python scripts/init_tracker.py --target-dir "docs/02_Guides/internal_qa_issue_tracker" --adopt-existing
```
*Existing datasets and HTML files will never be overwritten.*

---

## 🛠️ CLI Tools Reference

All scripts reside in `scripts/` and run on any Python 3.8+ installation without `pip install`.

### 1. `add_issue.py`
Appends a new issue with automated ID calculation, category tagging, and file rollback safety.

```bash
python scripts/add_issue.py \
  --phase "phase1" \
  --title "Audio playback pause on background transition" \
  --problem "Audio continues playing for 500ms after app minimization." \
  --cause "Missing AppState change listener detachment in sound hook." \
  --solution "Added useAppState event subscription with immediate pause dispatch." \
  --category "media" \
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
# Resolve a pending issue and attach a screenshot:
python scripts/update_issue.py \
  --id 42 \
  --status "resolved" \
  --solution "Fixed memory leak in WebSocket reconnect listener." \
  --files "network/socket.ts" \
  --screenshots "screenshots/ws_leak_profiler.png"
```

### 3. `add_phase.py`
Creates a new milestone phase track, registers it in `qa_manifest.js`, and adds script references to both HTML views.

```bash
python scripts/add_phase.py \
  --id "phase2_beta" \
  --label "🧪 Phase 2: Open Beta" \
  --badge "v1.2 (0 items)" \
  --color "#3B82F6"
```

### 4. `audit_qa.py`
Validates dataset integrity, checks for duplicate IDs within and across tracks, missing required fields, and verifies that listed source files and screenshots exist in the repository.

```bash
python scripts/audit_qa.py --check-files
```

### 5. `export_report.py`
Generates formatted reports in Markdown, CSV, or JSON for GitHub PRs, release notes, or App Store review submissions.

```bash
# Export all resolved issues as Markdown:
python scripts/export_report.py --phase "all" --status "resolved" --format "markdown" --output "QA_REPORT.md"
```

---

## ✍️ QA Issue Authoring Standards & Writing Rules

To maintain high data integrity, reproducibility, and enterprise audit readiness, follow these core authoring standards:

### 🔴 Mandatory Rules (DO NOT)
* **DO NOT Write Vague Titles or Solutions**: Never write entries like *"Fix bug"*, *"CSS adjustment"*, or *"수정 완료"*. Always specify **[Target Screen/Component] + [Observable Symptom/Fix]**.
* **DO NOT Conflate Problem and Cause**: `problem` is the **observable symptom** from the user's perspective; `cause` is the **code-level root cause** (e.g., race condition, missing null-check, unhandled promise rejection).
* **DO NOT Mark 'Resolved' Without Verification**: Never set `--status resolved` until the code passes static compilation (`tsc`), automated tests (`npm test`), or runtime verification.
* **DO NOT Omit Action Items**: Every resolved issue must have at least one concrete, numbered verification action item proving it was verified.
* **DO NOT List Ghost Files**: Every entry in `--files` must match a real, existing source file in the repository.

### 🟢 Five-Part Anatomy of a High-Quality QA Issue

| Field | Rule & Purpose | Good Example | Bad Example |
| :--- | :--- | :--- | :--- |
| **`title`** | Screen/Feature + precise symptom | `"Fix infinite spinner on in-app purchase cancellation"` | `"Payment error"` |
| **`problem`** | Observable behavior, trigger conditions, user impact | `"When the user dismisses the Apple Pay sheet, the loading spinner never dismisses, blocking the entire UI."` | `"It didn't work."` |
| **`cause`** | Architectural/code-level root cause | `"Missing catch handler for PurchaseCancelledError in usePaymentFlow.ts, leaving isSubmitting stuck as true."` | `"Bug in code."` |
| **`solution`** | Concrete engineering fix applied | `"Added explicit catch block for PurchaseCancelledError and guaranteed isSubmitting = false in finally block."` | `"Fixed logic."` |
| **`actions`** | Numbered checklist of verification steps | `["1. Simulated user cancellation in sandbox", "2. Verified instant overlay dismissal (<16ms)"]` | `["Tested"]` |

---

### 🏷️ QA Quality Domain Taxonomy (Aligned with ISO/IEC 25010 Standards)

Every QA issue must be categorized strictly according to the 8 standard Quality Domains. Arbitrary tagging is prohibited.

| Domain Code | Semantic Palette & Icon | ISO/IEC 25010 Characteristic | Risk Tier | Scope & Inclusion Criteria |
| :--- | :--- | :--- | :---: | :--- |
| **`reliability`** | 🔴 `#E03131` 🛡️ | Reliability & Fault Tolerance | **P0 (Blocker)** | Unhandled exceptions, ANR, native crashes, state deadlocks, silent data loss, offline sync corruption. |
| **`core`** | 🔵 `#1971C2` ⚡ | Functional Suitability & Correctness | **P0 ~ P1 (Major)** | Domain business rules, state machine transitions, calculation formulas, validation logic, broken user flows. |
| **`ui`** | 🟣 `#845EF7` 🎨 | Usability & Visual Accessibility | **P1 ~ P3 (Minor)** | Layout clipping/overflow, padding/margin density, WCAG AA color contrast, typography, theme harmony. |
| **`perf`** | 🟢 `#0CA678` 🚀 | Performance Efficiency & Resources | **P1 ~ P2 (Major)** | Frame drops (FPS < 60), battery drain, unneeded component re-renders, slow database queries (>100ms), bundle bloat. |
| **`media`** | 🟠 `#F76707` 🎙️ | Compatibility & Device Integration | **P0 ~ P1 (Major)** | Audio focus collisions, background playback suspension, TTS lifecycle leaks, microphone/camera permission drops. |
| **`monetization`**| 🟡 `#F59F00` 💰 | Compliance & Commercial Viability | **P0 (Store Blocker)** | In-app purchase (IAP) failures, receipt validation, subscriptions, Google Play / App Store Review rejection triggers. |
| **`auth`** | 🔷 `#3B5BDB` 🔒 | Security & Confidentiality | **P0 ~ P1 (Major)** | Token expiration handling, OAuth refresh loops, permission rejection crashes, secret logging, session hijacking risks. |
| **`db`** | 🟢 `#2B8A3E` 💾 | Maintainability & Data Persistence | **P0 ~ P1 (Major)** | SQLite migration failures, schema version upgrades, missing database indices, disk quota bloat, cache inconsistency. |

---

### 📊 Dashboard Visualization & Release Gate Linkage

The QA Taxonomy directly drives automated release decision-making in `qa_dashboard.html`:
1. **Dual-Tone Stacked Progress Bars**: Instantly reveals the proportion of resolved (domain chromatic color) versus active pending defects (`#FD7E14`) per domain.
2. **Automated Release Quality Gate**: Evaluates zero-tolerance domains (`reliability`, `monetization`, `core`, `auth`) to render a real-time release verdict (`🟢 RELEASE CANDIDATE READY` vs `🔴 RELEASE BLOCKED`).
3. **Interactive Click-to-Filter Drill-Down**: Clicking any category or platform row on the dashboard automatically navigates to `qa_spreadsheet.html?category=<domain>` with pre-applied filters in zero clicks.

---

## 💻 Web Interface Highlights

### 1. Spreadsheet View (`qa_spreadsheet.html`)
- **➕ In-Browser Quick Issue Generator**: Click `New Issue` to compose bugs and live-generate copyable `python scripts/add_issue.py` CLI commands or JSON/JS objects.
- **🖼️ Built-in Lightbox Preview**: Zero-dependency modal viewing for attached screenshots (`screenshots: [...]`) on click or hover.
- **Continuous Global IDs & Provenance Tags**: Clear `[phase]` tags identify issues in combined multi-track views.
- **Isolated Composite Bookmarks**: Star toggle (`★` / `☆`) uniquely binds to `${phase}_${id}` in `localStorage`.
- **Ultra-Compact 5px Scrollbars**: Maximizes screen estate with zero horizontal clipping.
- **Sticky Controls**: Fast searching (`Ctrl+F` or `/`), multi-track tab buttons, and real-time category/platform filters.

### 2. Analytics Dashboard (`qa_dashboard.html`)
- **Metric Cards**: Total issues, resolved, pending, and resolution percentage.
- **Donut Chart**: Pure SVG, zero external chart libraries (no Chart.js or D3 dependencies).
- **Code Hotspots**: Automatically aggregates the most frequently modified source files across all QA entries.

### 3. Localization Hub (`qa_i18n.js`)
- Instant language switching (English, Korean, Japanese).
- Supports bilingual dataset fields: `title_en`, `problem_en`, and `solution_en`.

---

## 📄 Data Schema

Each issue in `data/<phase>_issues.js` adheres to this standard schema:

```javascript
{
  "id": 1,                              // Unique integer ID (continuous across phases)
  "phase": "phase1",                    // Milestone phase track identifier
  "date": "2026-09-06",                 // ISO date string (YYYY-MM-DD)
  "platform": "all",                    // "all" | "ios" | "android" | "web" | "backend"
  "platformLabel": "🌐 Universal",      // Display label with emoji
  "category": "core",                   // Category code
  "categoryLabel": "⚡ Core / Setup",    // Display label with emoji
  "title": "Issue title in primary language",
  "title_en": "Optional English title",
  "problem": "Detailed problem description",
  "problem_en": "Optional English problem description",
  "solution": "Detailed solution / applied fix",
  "solution_en": "Optional English solution",
  "files": [                            // Modified source files relative to repo root
    "components/Navbar.tsx"
  ],
  "screenshots": [                      // Optional bug screenshots / images
    "screenshots/issue_1.png"
  ],
  "status": "resolved",                 // "resolved" | "pending"
  "cause": "Root cause analysis",
  "actions": [                          // Verification action items
    "1. Unit test executed",
    "2. E2E verified"
  ]
}
```

---

## 🔒 Security & Reliability

- **Atomic Transactions**: CLI modification scripts generate `.bak` copies prior to modifying files. If formatting or disk writes fail, the transaction automatically rolls back.
- **Zero Remote Calls**: All assets are completely local. No telemetry, CDN links, or external network requests are made.
- **Cross-Platform**: Runs identically on Windows (PowerShell/CMD with UTF-8 support), macOS (zsh), and Linux (bash).

---

## 📜 License

Distributed under the MIT License. Free for personal and commercial software projects.
