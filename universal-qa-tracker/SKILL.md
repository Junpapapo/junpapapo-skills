---
name: universal-qa-tracker
description: Universal QA Issue Tracking & Verification System. Provides zero-server HTML/JS spreadsheet, analytics dashboard, and VOC customer feedback portals, CLI tools for adding/updating issues, multi-track milestone management, dataset auditing, feedback synchronization, and multilingual reports (EN, KO, JA). Use when initializing QA tracking, registering QA bugs, updating issue resolutions, tracking release milestones, synchronizing user VOC feedback, or exporting QA sign-off documents.
---

# Universal QA Issue Tracker (`universal-qa-tracker`)

A comprehensive, zero-dependency, client-side QA issue management and Voice-of-Customer (VOC) telemetry ecosystem. Benchmarked from enterprise-grade closed and open testing workflows, it provides the canonical **5-Portal Suite** (Executive Hub, Interactive Master Spreadsheet, QA Intelligence & Analytics Studio, VOC Feedback Studio, and Automated Google Sheets & Apps Script Setup Guide), in-app React Native/Web feedback SDK templates, and a zero-dependency Python CLI automation suite with 100% local `file:///` zero-server execution.

---

## 1. Core Architecture & Canonical 5-Portal Suite

```
universal-qa-tracker/
├── .qa_config.json                     # Project QA metadata & portal registry
├── index.html                          # Portal 1: Executive Hub Launchpad
├── qa_spreadsheet.html                 # Portal 2: Interactive Master Spreadsheet
├── qa_analytics_dashboard.html         # Portal 3: QA Intelligence & Analytics Studio
├── voc_dashboard.html                  # Portal 4: Voice of Customer (VOC) Feedback Studio
├── google_sheets_voc_setup_guide.html  # Portal 5: Automated Google Sheets & Apps Script Setup Guide
├── css/
│   └── qa_memo.css                     # Floating Sticky Scratchpad memo styles
├── js/
│   ├── qa_i18n.js                      # Zero-dependency i18n localization engine (EN, KO, JA)
│   ├── qa_engine.js                    # High-performance chunked renderer (50-item chunks), search, filtering, bookmarks, deploy toggle & release notes
│   └── qa_memo.js                      # Cross-portal floating post-it memo scratchpad widget
├── assets/
│   └── icons/                          # 28 retina-ready sticker UI icons (.webp, <15KB each)
├── data/
│   ├── qa_manifest.js                  # Master track/milestone registry & phase metadata
│   ├── phase1_closed_testing.js        # Phase 1 dataset (Array of Issue objects)
│   ├── phase2_open_beta.js             # Phase 2 dataset
│   ├── phase3_v1_1_backlog.js          # Phase 3 backlog dataset
│   └── feedback_manifest.js            # In-app VOC user feedback submissions
├── client-templates/                   # In-app VOC & Dynamic Survey Telemetry SDK
│   ├── types/
│   │   └── survey.ts                   # Survey data contracts, DTOs & telemetry state
│   ├── defaultSurvey.ts                # Offline fallback survey configuration (4 choices)
│   ├── SurveyService.ts                # Dynamic Google Sheets survey fetcher & cache manager
│   ├── FeedbackSurveyCard.tsx          # Dynamic 4-choice interactive survey card UI
│   ├── FeedbackService.ts              # Universal client service with offline caching & retry
│   └── FeedbackModal.tsx               # Beautiful React Native / Web feedback & survey modal
└── scripts/                            # Zero-dependency Python CLI automation tools
    ├── init_tracker.py                 # Greenfield scaffolding & brownfield adoption
    ├── add_issue.py                    # Atomic issue injection with auto-increment ID
    ├── update_issue.py                 # Atomic issue updater (status, fix, files, actions)
    ├── add_phase.py                    # Milestone track rollover generator
    ├── audit_qa.py                     # Dataset integrity linter & validator
    ├── export_report.py                # Markdown/CSV/JSON export for release notes & store appeals
    ├── sync_feedback.py                # Google Sheets VOC synchronization & QA issue promotion
    ├── migrate_severity.py             # Batch IEEE 1044 severity classification migrator
    ├── chroma_key_slicer.py            # Extracts sticker icons from green chroma sheets (100% green preservation)
    └── google_apps_script_template.js  # Production-ready Google Apps Script webhook backend (v2.0 Master)
```

### Why JavaScript Data Objects Instead of Raw JSON?
Modern web browsers enforce strict CORS restrictions preventing `fetch('data.json')` when pages are opened directly from the local filesystem (`file:///.../index.html`). Storing datasets as JavaScript structures attached to `window.UNIVERSAL_QA.DATA` (with backward-compatible bindings to `window.MODO_QA` and `window.QA_ENGINE`) enables instant, zero-server double-click execution anywhere, on any operating system, without requiring a background HTTP server or Node.js environment.

---

### Dynamic VOC & In-App Survey Telemetry Architecture (v2.0)

Universal QA Tracker v2.0 introduces a zero-cost, real-time in-app survey and VOC feedback telemetry pipeline built on Google Apps Script and Google Sheets:

1. **15-Column Live Feedback Schema**:
   - `A (id)`: Sequential feedback submission ID
   - `B (timestamp)`: ISO-8601 submission date/time
   - `C (appName)`: Originating application name
   - `D (appVersion)`: App semantic version (e.g. `1.0.44`)
   - `E (platform)`: Runtime platform (`ios`, `android`, `web`, `backend`)
   - `F (rating)`: User satisfaction star rating (1 to 5)
   - `G (category)`: Feedback domain (`bug`, `feature`, `ux`, `general`)
   - `H (title)`: User feedback headline
   - `I (feedback)`: Detailed user description or verbatim comment
   - `J (userEmail)`: Optional contact email
   - `K (surveyId)`: Active survey campaign identifier (e.g. `2026_q1_onboarding`)
   - `L (surveyQuestion)`: Localized question displayed to the user
   - `M (surveyAnswer)`: Selected 4-choice response text
   - `N (surveyAnswerIndex)`: Zero-based choice index (0, 1, 2, or 3)
   - `O (status)`: Processing workflow state (`pending`, `reviewed`, `promoted_to_qa`, `resolved`)

2. **Multi-Language `Survey_Config` Sheet**:
   - Allows product managers to switch in-app survey questions and 4 choices dynamically without shipping app updates.
   - **Row 2 (Master Korean `ko`)**: Primary source of truth for questions and options.
   - **Rows 4–18 (16 Global Languages)**: Automatically translated in real-time using `=GOOGLETRANSLATE($D$2, "ko", "en")` formulas.
   - **Row 3 (Universal English `en`)**: Overridable fallback for non-Korean locales.
   - **Dynamic Fetching**: Apps Script endpoint `doGet(e)` serves the localized active survey via `action=get_survey&lang=<user_locale>`.

3. **Portal 4: VOC Feedback Studio 3-Tab Architecture**:
   - **Tab 1 (`💬 실시간 VOC 피드백`)**: Live feedback stream, category/rating filters, search, and 1-click **Promote to QA** action.
   - **Tab 2 (`📊 VOC 통계 & 분석`)**: Aggregate rating trends, category distribution, platform breakdown, and submission velocity.
   - **Tab 3 (`🎯 설문 이력 & 인사이트`)**: Deep survey analytics with campaign selector, 4-choice podium charts, star-rating cross-matrix correlation, multiline user quote cards, and Markdown/HTML report export.

---

## 2. Mandatory Location Discovery & Confirmation Protocol

When requested to initialize, update, or record QA issues, agents **MUST** follow this 3-step protocol:

### Step 1: Scan for Existing Trackers
Check if the project already contains a QA tracker in any of the following standard locations:
1. Root configuration pointer: `.qa_tracker_config.json`
2. `docs/02_Guides/internal_qa_issue_tracker`
3. `docs/qa_tracker`
4. `docs/qa`
5. `qa_tracker` or `qa`

### Step 2: Confirm Target Location with the User
- **If an existing tracker is detected**: Present the path to the user and confirm whether to adopt the existing tracker non-destructively or scaffold a new path.
- **If no existing tracker is found**: Suggest a clean location (e.g., `docs/qa_tracker` or `qa_tracker`) and obtain user confirmation before writing files.

### Step 3: Execute Initialization or Non-Destructive Adoption
Run `init_tracker.py` with the confirmed path:
```bash
# Greenfield setup (canonical 5-portal suite + scripts + client templates):
python .gemini/skills/universal-qa-tracker/scripts/init_tracker.py --target-dir "docs/qa_tracker" --project-name "ProjectName" --lang "ko"

# Brownfield adoption (non-destructive, preserves existing datasets):
python .gemini/skills/universal-qa-tracker/scripts/init_tracker.py --target-dir "docs/02_Guides/internal_qa_issue_tracker" --adopt-existing
```

---

## 3. Mandatory QA Issue Authoring Standards & Writing Rules

To maintain high data integrity, reproducibility, and enterprise audit readiness, AI agents and engineers **MUST** adhere to the following authoring standards when registering or updating QA issues.

### 🔴 Mandatory Writing Rules (DO NOT)
* **DO NOT Write Vague Titles or Solutions**: Never write entries like *"Fix bug"*, *"CSS adjustment"*, or *"수정 완료"*. Always specify **[Target Screen/Component] + [Observable Symptom/Fix]**.
* **DO NOT Conflate Problem and Cause**: `problem` is the **observable symptom** from the user's perspective; `cause` is the **code-level root cause** (e.g., race condition, missing null-check, unhandled promise rejection).
* **DO NOT Mark 'Resolved' Without Verification**: Never set `--status resolved` until the code passes static compilation (`tsc`), automated tests (`npm test`), or runtime verification.
* **DO NOT Omit Action Items**: Every resolved issue must have at least one concrete, numbered verification action item proving it was verified.
* **DO NOT List Ghost Files**: Every entry in `--files` must match a real, existing source file in the repository.
* **DO NOT Create Arbitrary Categories or Labels**: Never invent ad-hoc categories (e.g. `crash`, `performance`, `navigation`, `BUG`, `FEATURE`, `Setting`, `SETTINGS`) or custom verbose labels (e.g. `💥 크래시`, `🧭 네비게이션 / 랙 방어`). All QA issues **MUST** strictly belong to one of the 8 ISO/IEC 25010 Quality Domains (`reliability`, `core`, `ui`, `perf`, `media`, `monetization`, `auth`, `db`) with standardized badge labels. Arbitrary tags break spreadsheet filtering, analytics aggregations, and linter audits.

### 🟢 Five-Part Anatomy of a High-Quality QA Issue

| Field | Rule & Purpose | Good Example | Bad Example |
| :--- | :--- | :--- | :--- |
| **`title`** | Screen/Feature + precise symptom | `"Fix infinite spinner on in-app purchase cancellation"` | `"Payment error"` |
| **`problem`** | Observable behavior, trigger conditions, user impact | `"When the user dismisses the Apple Pay sheet, the loading spinner never dismisses, blocking the entire UI."` | `"It didn't work."` |
| **`cause`** | Architectural/code-level root cause | `"Missing catch handler for PurchaseCancelledError in usePaymentFlow.ts, leaving isSubmitting stuck as true."` | `"Bug in code."` |
| **`solution`** | Concrete engineering fix applied | `"Added explicit catch block for PurchaseCancelledError and guaranteed isSubmitting = false in finally block."` | `"Fixed logic."` |
| **`actions`** | Numbered checklist of verification steps | `["1. Simulated user cancellation in sandbox", "2. Verified instant overlay dismissal (<16ms)"]` | `["Tested"]` |

---

### 3.1 QA Quality Domain Taxonomy (Aligned with ISO/IEC 25010 Standards)

Every QA issue must be categorized strictly according to the 8 standard Quality Domains. Arbitrary tagging is prohibited.

| Domain Code | Semantic Palette & Icon | ISO/IEC 25010 Characteristic | Risk Tier | Inclusion Criteria (Belongs Here) | Exclusion Criteria (Classify Elsewhere) |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **`reliability`** | 🔴 `#E03131` 🛡️ | Reliability & Fault Tolerance | **P0 (Blocker)** | Uncaught exceptions, ANR (Application Not Responding), native crashes, state deadlocks, silent data loss, offline sync corruption. | Pure visual glitches (use `ui`), non-freezing slow rendering (use `perf`). |
| **`core`** | 🔵 `#1971C2` ⚡ | Functional Suitability & Correctness | **P0 ~ P1 (Major)** | Business rules, state machine transitions, calculation formulas, validation logic, broken user interaction workflows. | Visual alignment (use `ui`), crash exceptions (use `reliability`). |
| **`ui`** | 🟣 `#845EF7` 🎨 | Usability & Visual Accessibility | **P1 ~ P3 (Minor)** | Layout clipping/overflow, padding/margin density, WCAG AA color contrast, typography readability, dark/light theme harmony, animation stutter. | Functional workflow deadlocks (use `core`), crash on render (use `reliability`). |
| **`perf`** | 🟢 `#0CA678` 🚀 | Performance Efficiency & Resources | **P1 ~ P2 (Major)** | Frame drops (FPS < 60), battery drain, unneeded component re-renders, slow database queries (>100ms), asset bundle size bloat. | Application freeze > 5s (use `reliability`). |
| **`media`** | 🟠 `#F76707` 🎙️ | Compatibility & Device Integration | **P0 ~ P1 (Major)** | Audio focus collisions, background playback suspension, TTS lifecycle leaks, microphone/camera permission & session drops. | Play/pause button styling (use `ui`). |
| **`monetization`**| 🟡 `#F59F00` 💰 | Compliance & Commercial Viability | **P0 (Store Blocker)** | In-app purchases (IAP), receipt validation, subscription entitlements, purchase restore failure, Google Play / App Store Review rejection triggers. | Purchase screen banner styling (use `ui`). |
| **`auth`** | 🔷 `#3B5BDB` 🔒 | Security & Confidentiality | **P0 ~ P1 (Major)** | Token expiration handling, OAuth refresh loops, permission rejection crashes, plain-text secret logging, session hijacking risks. | Login button placement (use `ui`). |
| **`db`** | 🟢 `#2B8A3E` 💾 | Maintainability & Data Persistence | **P0 ~ P1 (Major)** | SQLite migration failures, schema version upgrades, missing database indices, disk quota bloat, cache inconsistency. | Network API errors (use `core`). |

---

### 3.2 IEEE 1044 / ISTQB International Severity Classification Standards

Every QA issue registered or updated **MUST** carry an explicit 5-tier Severity rating (`severity`: `S1` ~ `S5`) based on international software testing standards (IEEE 1044 / ISTQB):

| Severity Code | Semantic Badge | Description & Criticality | Technical Impact & Examples | Resolution Priority |
| :---: | :--- | :--- | :--- | :---: |
| **`S1`** | 🚨 **Blocker** | System crash, unhandled freeze, silent data loss, store review rejection | App terminates abruptly, unrecoverable deadlock, corrupted DB, Google/Apple policy violation | **Immediate (P0)** |
| **`S2`** | 🔥 **Critical** | Core business logic failure, missing sync, permissions blocked, backhandler loss | Primary user flow broken with no workaround, push token failure, payment validation drop | **Urgent (P1)** |
| **`S3`** | ⚡ **Major** | Standard functional defect, state transition error with existing workaround | Normal feature degraded but users can continue, modal gesture glitch, filter miscalculation | **Normal (P2)** |
| **`S4`** | 🌱 **Minor** | UI clipping, padding/margin density, dark mode contrast, locale typos | Cosmetic imperfection, text truncation, non-conforming spacing, minor animation jitter | **Polish (P3)** |
| **`S5`** | ☕ **Trivial** | 400-line rule refactoring, code governance, unused imports, test cleanup | Non-user-facing codebase health, architecture maintainability, internal comment cleanup | **Low / Backlog** |

> [!TIP]
> **Automatic Severity Deduction**: When using `add_issue.py`, if `--severity` is omitted, the tool automatically infers the severity from keywords in the title, problem, and root cause (e.g. keywords like *"crash"*, *"loss"*, *"freeze"* $\rightarrow$ `S1`, *"refactor"*, *"governance"* $\rightarrow$ `S5`).

---

### 3.3 Visual Analytics & Time-Series Risk Evolution Dashboard

The QA system features an interactive Visual Analytics Studio (`qa_analytics_dashboard.html`) and Master Spreadsheet (`qa_spreadsheet.html`):

1. **Daily Severity Evolution & Risk Burndown (Stacked Bar Chart)**:
   - Tracks daily volume and composition of S1 Blocker, S2 Critical, S3 Major, S4 Minor, and S5 Trivial issues across the testing timeline.
   - Visually proves software quality maturity: initial concentration of S1/S2 defects burning down to zero, converging into low-risk S4/S5 stabilization.
   - Clicking any bar segment filters the drilldown inspector to that specific date and severity (`date_sev`).
2. **Severity Risk Breakdown (IEEE 1044 Donut Chart)**:
   - Visualizes cumulative proportions across S1~S5 with dynamic critical debt ratio indicator.
   - Interactive slices filter the entire issue list on click.
3. **Cross-Page Deep Linking**:
   - Clicking "Open in Spreadsheet ➔" from the analytics dashboard or VOC dashboard deep-links directly with active URL filters (e.g., `?severity=S1`, `?track=all&category=core`).
4. **Ergonomic Drawer Drag-to-Resize Handle**:
   - The master spreadsheet's fixed bottom inspection drawer features an interactive drag handle (`.inspector-resizer`), allowing vertical resizing between 160px and 85vh.
   - Resized height is persisted in `localStorage` (`modo_qa_drawer_height`), with double-click toggle between compact (310px) and expanded (65vh).
5. **Zero-Syntax-Error Verification Gate & Transactional Rollback**:
   - All CLI tools (`add_issue.py`, `update_issue.py`, `add_phase.py`) execute `node --check` immediately after updating `.js` datasets.
   - If any syntax error or corrupt structure is detected, it automatically rolls back from `.bak` backup, ensuring zero data loss and preventing white-screen freezes.
6. **Header Help Guide Modal (❓ Severity Guide)**:
   - Positioned right next to the Theme toggle button (`🌓 Theme`) across both the Master Spreadsheet and Visual Analytics Studio headers.
   - Opens an accessible, high-density modal dialogue detailing the 5 IEEE 1044 severity classifications (`S1` Blocker ~ `S5` Trivial), actionable impact criteria, and SLA priorities.
   - Fully integrated with `qa_i18n.js` (`en` / `ko`), keyboard dismiss (`Escape`), outside click dismissal, and 100% dark/light theme harmony.
7. **Floating Sticky Scratchpad Widget (`📝 Scratchpad / 메모`)**:
   - Universal floating, draggable post-it memo modal accessible via top-left navigation button (`navMemo`) across all portals.
   - Supports bold formatting (`Ctrl+B`), 4-color highlighter pens (Yellow, Green, Blue, Pink), checklist tasks (`☑️`), 5 background themes, multi-tab switching, and cross-portal `localStorage` auto-persistence.
8. **Manual Deployment Control & Reactive Release Notes Generator**:
   - iOS-style mini toggle switches next to issue IDs in `qa_spreadsheet.html` for granular tracking of deployed vs. pending releases with `localStorage` persistence (`MODO_QA_DEPLOY_STATUS_V1`).
   - **Strict Default State (OFF/False)**: By default, issue deployment status is strictly `false` (OFF). State is turned `true` only when the user explicitly switches it ON, which is then persisted in `localStorage`.
   - **Persistent Track & Milestone Restoration**: Selecting a phase tab (e.g., Phase 1, Phase 2, Phase 3, VOC) automatically synchronizes with both `localStorage` (`modo_qa_active_track`) and browser URL query parameters (`?track=...`) via `history.replaceState`. Reloading or refreshing the page faithfully restores the exact selected phase track.
   - **Composite Key Identification (`getItemKey`)**: Issues are identified internally via `${phase}_${id}` composite keys, guaranteeing zero ID collision in the **All Tracks** master view even when multiple phases increment independently starting from `#1`.
   - Top navigation real-time deploy percentage badge (`🚀 Deployed: X/Y (Z%)`) and dedicated deploy filters (`[All] [🚀 Deployed] [⏳ Pending]`).
   - One-click store release notes auto-generator (`📢 릴리즈 노트`) that dynamically includes only deployed (`ON`) items and instantly excludes toggled-off items in real time.
9. **Target Files Floating Popover & 1-Click Clipboard**:
   - The spreadsheet `Files` column features high-density compact badges (`📁 N files`) to eliminate cell overflow. Hovering or clicking reveals an Apple-style frosted floating popover (`qa-files-popover`).
   - Supports 1-click clipboard copy (`📋 Copy All` or single-file copy with visual checkmark feedback) and one-touch navigation to the Inspector Drawer (`🔍 View in Inspector Panel ↗`).
10. **Target Release Auto-Stamping & Version Modal**:
    - Top toolbar target release manager (`🏷️ Release:`) with auto-persistence in `localStorage` (`modo_qa_target_release`).
    - Clicking any deployment version tag (`qa-deploy-ver-tag`) opens an interactive modal to edit or auto-stamp release bundle versions (e.g., `69 (1.1.2)`).
11. **OS Quick Filter Chip Bar (`🍎 iOS`, `🤖 Android`, `🌐 Universal`)**:
    - Instantaneous OS platform filter chips embedded in the top control toolbar, allowing 1-click filtering by target platform across individual milestone tracks or the unified All Tracks view.
12. **Mobile Release Lifecycle 1:1 Matching Model**:
    - Milestone track architecture follows the enterprise mobile release standard:
      - `Phase 1`: `🔒 Android Closed Testing` (Google Play closed beta verification)
      - `Phase 2`: `🍎 iOS TestFlight Testing` (Apple ecosystem, TestFlight & iOS native permissions)
      - `Phase 3`: `💎 Production Operations` (v1.0+ public launch & unified backlog)
      - `Feedback`: `💬 User VOC` (In-App customer voice telemetry)

---

### 3.4 Voice of Customer (VOC) In-App Feedback Pipeline

The universal VOC pipeline enables seamless, serverless feedback collection directly from production apps:
1. **Client Ingestion**: Apps embed `FeedbackModal.tsx` and `FeedbackService.ts`. User submissions (category, rating, feedback text, device telemetry) are queued locally in `AsyncStorage`/`localStorage` and dispatched asynchronously.
2. **Zero-Server Google Sheets Webhook**: Submissions land directly into a designated Google Sheet via a zero-cost Google Apps Script Web App (`scripts/google_apps_script_template.js`).
3. **Local Ingestion & Triage**: `sync_feedback.py` pulls submissions into `data/feedback_manifest.js`.
4. **VOC Studio UI (`voc_dashboard.html`)**: Review feedback cards, view sentiment trends, and click **"Promote to QA"** to auto-generate a reproduction ticket in `qa_spreadsheet.html`.
5. **Step-by-Step Setup Guide (`google_sheets_voc_setup_guide.html`)**: Complete interactive guide detailing Google Sheet layout, Apps Script deployment, and client integration with zero leaks of production secrets.

---

## 4. CLI Command Suite Reference

All CLI tools are written in standard Python 3 with **zero external dependencies** and include built-in Windows UTF-8 console compatibility.

### 1. `init_tracker.py` (Scaffolding & Adoption)
Initializes a new tracker suite or registers an existing one.
```bash
python scripts/init_tracker.py [OPTIONS]

Options:
  --project-name TEXT     Project display name
  --target-dir PATH       Target relative directory (e.g. docs/qa_tracker)
  --preset [mobile|web|general]
                          Preset category configuration (default: mobile)
  --lang [en|ko|ja]       Default UI language (default: ko)
  --adopt-existing        Adopt existing directory without overwriting data
  --force                 Force overwrite templates
```

### 2. `add_issue.py` (Atomic Issue Injection)
Safely registers a new QA issue with auto-incremented ID, atomic backup/rollback, git auto-fill, and manifest badge synchronization.
```bash
python scripts/add_issue.py [OPTIONS]

Required:
  --title TEXT            Issue summary / title (or use --from-git)
Optional:
  --from-git              Auto-populate title and modified files from latest git commit / working tree
  --phase-id              Increment ID per-phase starting from 1 (default: True)
  --global-id             Continuously increment ID across all phases
  --phase TEXT            Target phase ID (default: phase1)
  --problem TEXT          Detailed problem description
  --solution TEXT         Applied solution / fix
  --cause TEXT            Root cause analysis
  --category TEXT         Category code: core, ui, perf, media, monetization, auth, db, reliability
  --category-label TEXT   Custom category display label (e.g. "🎨 UI/UX")
  --severity [S1|S2|S3|S4|S5]
                          Severity level (default: auto-inferred from text)
  --platform TEXT         Platform: all, ios, android, web, backend (default: all)
  --files FILE ...        Modified files list
  --screenshots PATH ...  Screenshot image paths or URLs (with built-in Lightbox viewer)
  --actions ACTION ...    Action item verification steps
  --status [resolved|pending]
                          Issue status (default: resolved)
  --date YYYY-MM-DD       Date of issue (default: current date)
  --title-en TEXT         Optional English title for dual-language support
  --problem-en TEXT       Optional English problem description
  --solution-en TEXT      Optional English solution description
```

### 3. `update_issue.py` (Atomic Issue Modification)
Updates existing issues (status changes, solutions, files, screenshots, actions, translations) across any phase dataset.
```bash
python scripts/update_issue.py --id INT [OPTIONS]

Required:
  --id INT                Numeric issue ID to update
Optional:
  --phase TEXT            Specific phase (auto-discovered if omitted)
  --status [resolved|pending]
                          Update status (e.g. pending -> resolved)
  --severity [S1|S2|S3|S4|S5]
                          Update severity level (S1=Blocker ~ S5=Trivial)
  --solution TEXT         Updated solution
  --solution-en TEXT      Updated English solution
  --cause TEXT            Updated root cause
  --title TEXT            Updated title
  --title-en TEXT         Updated English title
  --problem TEXT          Updated problem
  --problem-en TEXT       Updated English problem
  --files FILE ...        Add files to issue
  --replace-files         Replace entire files array instead of appending
  --screenshots PATH ...  Add screenshots to issue
  --replace-screenshots   Replace entire screenshots array instead of appending
  --actions ACTION ...    Add action items
  --replace-actions       Replace entire actions array instead of appending
  --date YYYY-MM-DD       Update date (defaults to today on resolution)
```

### 4. `sync_feedback.py` (VOC Google Sheets Ingestion & Promotion)
Pulls user feedback from Google Sheets or CSV exports, updates `data/feedback_manifest.js`, and promotes critical feedback entries into tracked QA issues.
```bash
python scripts/sync_feedback.py [OPTIONS]

Options:
  --csv-file PATH         Path to downloaded Google Sheets CSV export
  --sheet-url URL         Direct Google Apps Script Web App or Sheet CSV publication URL
  --output PATH           Target feedback manifest (default: data/feedback_manifest.js)
  --promote INT           Feedback ID to automatically promote into a QA issue
  --promote-phase TEXT    Phase track to place promoted issue into (default: phase1)
```

### 5. `migrate_severity.py` (IEEE 1044 Classification Migrator)
Audits existing issue files and classifies unrated or legacy severity entries using natural language heuristics.
```bash
python scripts/migrate_severity.py [OPTIONS]

Options:
  --file PATH             Target JS data file to migrate
  --dry-run               Preview classifications without modifying files
  --force                 Re-evaluate already classified issues
```

### 6. `add_phase.py` (Milestone & Track Rollover)
Scaffolds a new milestone track (`data/<phase_id>_issues.js`), registers it in `qa_manifest.js`, and injects `<script>` tags into spreadsheet and dashboard views.
```bash
python scripts/add_phase.py --id TEXT [OPTIONS]

Required:
  --id TEXT               Unique phase ID (e.g. phase2_open_beta, phase3_v1_1)
Optional:
  --label TEXT            Display label for UI tab (e.g. "🧪 Phase 2: Beta")
  --badge TEXT            Badge text (e.g. "Phase 2 (0 items)")
  --color HEX             Accent color hex (default: #10B981)
```

### 7. `audit_qa.py` (Dataset Integrity Linter)
Audits tracker datasets for ID uniqueness, required fields, status constraints, manifest counts, and valid file paths.
```bash
python scripts/audit_qa.py [OPTIONS]

Options:
  --target-dir PATH       Explicit tracker directory override
  --check-files           Verify that referenced source files exist in repo
  --strict                Treat warnings as errors (exit code 1)
```

### 8. `export_report.py` (Markdown / CSV / JSON Reporting)
Generates high-quality reports formatted for GitHub PRs, release notes, or App Store / Google Play appeal documentation.
```bash
python scripts/export_report.py [OPTIONS]

Options:
  --phase TEXT            Phase to export or "all" (default: all)
  --status [all|resolved|pending]
                          Filter by status (default: all)
  --category TEXT         Filter by category code
  --format [markdown|csv|json]
                          Output format (default: markdown)
  --lang [ko|en|ja]       Preferred language for bilingual fields (default: ko)
  --limit INT             Limit output to latest N issues
  --output PATH           Save output to file (prints to stdout if omitted)
```

---

## 5. Standard Agent Workflows

### Scenario A: Recording a Bug Fix During Development
When fixing a bug in the codebase, proactively log it in the QA tracker:
1. Identify the modified source files.
2. Formulate clear title, problem, root cause, and solution descriptions according to the authoring standards in Section 3.
3. Run `add_issue.py`:
   ```bash
   python .gemini/skills/universal-qa-tracker/scripts/add_issue.py \
     --title "Fix dark mode contrast in navigation bar" \
     --problem "Text color was hardcoded to #333333 causing unreadable text in dark mode." \
     --cause "Missing theme color dynamic token hook." \
     --solution "Replaced static hex with useThemeColors().textPrimary." \
     --category "ui" \
     --severity "S4" \
     --platform "all" \
     --files "components/Navbar.tsx" "theme/colors.ts" \
     --actions "1. Verified contrast on dark mode" "2. Tested light mode compatibility"
   ```
4. Verify data health with `audit_qa.py`.

### Scenario B: Ingesting and Triage User Feedback (VOC to QA Issue)
1. Run `sync_feedback.py` with the Google Sheets CSV or API URL:
   ```bash
   python .gemini/skills/universal-qa-tracker/scripts/sync_feedback.py --csv-file "feedback_export.csv"
   ```
2. Open `voc_dashboard.html` in browser to inspect submissions.
3. Promote critical defects directly to QA:
   ```bash
   python .gemini/skills/universal-qa-tracker/scripts/sync_feedback.py --promote 101 --promote-phase "phase2_open_beta"
   ```

### Scenario C: Milestone Track Rollover (Closed Testing to Open Beta)
When a milestone wraps up and a new cycle begins:
```bash
python .gemini/skills/universal-qa-tracker/scripts/add_phase.py \
  --id "phase2_open_beta" \
  --label "🚀 Phase 2: Open Beta" \
  --badge "Open Beta (0 items)" \
  --color "#3B82F6"
```

### Scenario D: Exporting QA Sign-Off for Store Review Appeals
When submitting app builds or responding to Apple Review / Google Play Console inquiries:
```bash
python .gemini/skills/universal-qa-tracker/scripts/export_report.py \
  --phase "all" \
  --status "resolved" \
  --lang "en" \
  --format "markdown" \
  --output "docs/QA_RESOLUTION_REPORT.md"
```
