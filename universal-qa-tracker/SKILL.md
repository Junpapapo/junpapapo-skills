---
name: universal-qa-tracker
description: Universal QA Issue Tracking & Verification System. Provides zero-server HTML/JS spreadsheet & analytics dashboard templates, CLI tools for adding/updating issues, multi-track milestone management, dataset auditing, and multilingual reports (EN, KO, JA). Use when initializing QA tracking, registering QA bugs, updating issue resolutions, tracking multi-track release milestones, or exporting QA sign-off documents.
---

# Universal QA Issue Tracker (universal-qa-tracker)

A robust, zero-dependency, client-side QA issue management ecosystem. Benchmarked from enterprise-grade closed/open testing workflows, it provides high-density interactive spreadsheets, visual analytics dashboards, and an automated Python CLI suite to manage software verification life cycles with 100% local `file:///` zero-server execution.

---

## 1. Core Architecture & Philosophy

```
universal-qa-tracker/
├── .qa_config.json             # Project QA metadata & preferences
├── index.html                  # Glassmorphism navigation hub
├── qa_spreadsheet.html         # High-density spreadsheet with sticky controls & filters
├── qa_dashboard.html           # Interactive visual charts & metric analytics
├── js/
│   ├── qa_i18n.js              # Zero-dependency i18n engine (EN, KO, JA)
│   └── qa_engine.js            # In-memory search, filtering, bookmarks, and rendering
└── data/
    ├── qa_manifest.js          # Master track/milestone registry
    ├── phase1_issues.js        # Phase 1 dataset (Array of Issue objects)
    └── [phaseN_issues.js]      # Additional track datasets
```

### Why JavaScript Data Objects Instead of Raw JSON?
Modern browsers enforce strict CORS policies preventing `fetch('data.json')` when files are opened directly from the local file system (`file:///.../index.html`). Storing datasets as JavaScript structures attached to `window.UNIVERSAL_QA.DATA` enables instant, zero-server double-click execution anywhere, on any operating system, without requiring a background HTTP server.

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
# Greenfield setup:
python .gemini/skills/universal-qa-tracker/scripts/init_tracker.py --target-dir "docs/qa_tracker" --project-name "ProjectName" --lang "ko"

# Brownfield adoption (non-destructive):
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

### 3.2 Visual Analytics & Dashboard Metric Linkage

The QA Taxonomy is directly integrated into the Visual Analytics Studio (`qa_dashboard.html`) and Master Spreadsheet (`qa_spreadsheet.html`):

1. **Dual-Tone Stacked Progress Bars**:
   - Each category displays resolved count (domain chromatic color) and pending defects (warning amber `#FD7E14`).
   - Enables immediate identification of high-risk domains with active technical debt.
2. **Release Quality Gate Evaluation**:
   - Enforces a zero-tolerance policy for critical domains: `reliability`, `monetization`, `core`, and `auth`.
   - If any pending defects exist in these 4 domains, the dashboard status displays `🔴 RELEASE BLOCKED`.
3. **Interactive Click-to-Filter Drill-Down**:
   - Clicking any category row in `qa_dashboard.html` navigates directly to `qa_spreadsheet.html?category=<domain>`.
   - The spreadsheet automatically parses URL query parameters (`?category=...`, `?platform=...`, `?status=...`) to filter target records in zero clicks.

---

### 🌐 Bilingual (Dual-Language) Authoring Rules
For public repositories, open-source projects, or apps preparing for App Store / Google Play Store Review appeals:
- Provide `--title-en`, `--problem-en`, and `--solution-en` alongside native language fields.
- Use technical, clear English suitable for Apple Resolution Center / Google Play Appeal documentation.

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
  --global-id             Continuously increment ID across all phases (default: True)
  --phase-id              Increment ID per-phase starting from 1
  --phase TEXT            Target phase ID (default: phase1)
  --problem TEXT          Detailed problem description
  --solution TEXT         Applied solution / fix
  --cause TEXT            Root cause analysis
  --category TEXT         Category code: core, ui, logic, perf, media, monetization, auth, db
  --category-label TEXT   Custom category display label (e.g. "🎨 UI/UX")
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

### 4. `add_phase.py` (Milestone & Track Rollover)
Scaffolds a new milestone track (`data/<phase_id>_issues.js`), registers it in `qa_manifest.js`, and injects `<script>` tags into spreadsheet and dashboard views.
```bash
python scripts/add_phase.py --id TEXT [OPTIONS]

Required:
  --id TEXT               Unique phase ID (e.g. phase2, open_beta, v1_1)
Optional:
  --label TEXT            Display label for UI tab (e.g. "🧪 Phase 2: Beta")
  --badge TEXT            Badge text (e.g. "Phase 2 (0 items)")
  --color HEX             Accent color hex (default: #10B981)
```

### 5. `audit_qa.py` (Dataset Integrity Linter)
Audits tracker datasets for ID uniqueness, required fields, status constraints, manifest counts, and valid file paths.
```bash
python scripts/audit_qa.py [OPTIONS]

Options:
  --target-dir PATH       Explicit tracker directory override
  --check-files           Verify that referenced source files exist in repo
  --strict                Treat warnings as errors (exit code 1)
```

### 6. `export_report.py` (Markdown / CSV / JSON Reporting)
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
     --platform "all" \
     --files "components/Navbar.tsx" "theme/colors.ts" \
     --actions "1. Verified contrast on dark mode" "2. Tested light mode compatibility"
   ```
4. Verify data health with `audit_qa.py`.

### Scenario B: Transitioning from Closed Testing to Open Beta (Milestone Rollover)
When a development phase closes and a new milestone begins:
1. Run `add_phase.py`:
   ```bash
   python .gemini/skills/universal-qa-tracker/scripts/add_phase.py \
     --id "phase2_open_beta" \
     --label "🚀 Phase 2: Open Beta" \
     --badge "v1.1 (0 items)" \
     --color "#3B82F6"
   ```
2. Verify that `qa_spreadsheet.html` and `qa_dashboard.html` automatically reflect the new tab and track filter.

### Scenario C: Exporting QA Sign-Off for Store Review Appeals
When submitting app builds or responding to Apple Review / Google Play Console inquiries:
```bash
python .gemini/skills/universal-qa-tracker/scripts/export_report.py \
  --phase "all" \
  --status "resolved" \
  --lang "en" \
  --format "markdown" \
  --output "docs/QA_RESOLUTION_REPORT.md"
```

---

## 6. UI Features & Keyboard Shortcuts

- **Spreadsheet View (`qa_spreadsheet.html`)**:
  - `➕ New Issue`: Interactive In-Browser Quick Generator Modal to compose issues and copy real-time CLI commands or JS snippets.
  - `🖼️ Screenshots & Lightbox`: Attached bug screenshots open in an instant, zero-dependency full-screen lightbox preview.
  - `Track Provenance Pills`: Combined view displays discrete `[phase]` tags preventing cross-track identity confusion.
  - `Isolated Composite Bookmarks`: Star toggle (`★` / `☆`) uniquely binds to `${phase}_${id}` in `localStorage`.
  - `Ctrl + F` / `/`: Focus search input.
  - Multi-track tab navigation with active issue count badges.
  - Multi-dimensional filters (Platform, Category, Status, Bookmarks).
  - 5px ultra-slim custom scrollbars with zero clipping.
- **Analytics Dashboard (`qa_dashboard.html`)**:
  - SVG completion donut chart with real-time percentage recalculation.
  - Category breakdown horizontal progress bars.
  - Platform distribution metrics.
  - Top modified code hotspots ranking.
- **Multilingual Support (`qa_i18n.js`)**:
  - Instant client-side switching between English (`en`), Korean (`ko`), and Japanese (`ja`).
  - Automatically loads translated issue fields (`title_en`, `problem_en`, `solution_en`) when active.
