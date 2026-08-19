# 🛡️ Chrome Extension Project Final Checker (`chrome-extension-project-final-checker`)

> **Automated 5-Step Deep Verification Protocol, Silent Failure Diagnostics, and QA Runner for Chrome Extensions (Manifest V3) & Modern Web Apps.**

---

## 🌟 Overview

The **Chrome Extension Project Final Checker (`chrome-extension-project-final-checker`)** is an automated quality assurance (QA) and pre-release audit engine.

A successful local build does not guarantee that a Chrome extension is production-ready. Critical **silent failures**—such as Service Workers dropping events after waking from idle sleep, `chrome.storage.sync` quota overflows, broken asset path case-sensitivity on Linux/Chrome OS, or missing event listener teardown—cause runtime crashes that only surface in production.

This skill executes a standardized **5-Step Deep Audit Protocol** via its automated Python CLI (`final_check.py`) to guarantee zero-defect releases.

---

## 📋 The 5-Step Deep Verification Protocol

```
                               ┌────────────────────────────────┐
                               │   5-Step Final Checker Engine  │
                               └───────────────┬────────────────┘
                                               │
         ┌───────────────────┬─────────────────┼─────────────────┬───────────────────┐
         ▼                   ▼                 ▼                 ▼                   ▼
     [ Step 1 ]          [ Step 2 ]        [ Step 3 ]        [ Step 4 ]          [ Step 5 ]
  Production Build      Manifest V3       Cross-Browser    Asset Integrity      Code Health &
    Verification        Compliance         & Shadow DOM      (404 Audit)        Memory Leaks
  (npm run build)    (Least Privilege)   (CSS Isolation)  (Path Resolvers)     (Cleanups & Lints)
```

---

## 🛠️ Automated QA Runner CLI Reference

> [!NOTE]
> Replace `<skill_dir>` with the relative or absolute path of this skill folder (e.g. `.agents/skills/chrome-extension-project-final-checker` or full path).

Run the entire 5-step deep verification suite in **one command**:

```bash
# Terminal colored summary
python <skill_dir>/scripts/final_check.py --workspace .

# Generate Markdown QA Report
python <skill_dir>/scripts/final_check.py --workspace . --format markdown --output FINAL_QA_REPORT.md

# Quick static scan without running full build
python <skill_dir>/scripts/final_check.py --workspace . --skip-build
```

---

## 🔍 The 4 Silent Failure Diagnostics (MV3 Edge Cases)

1. **Service Worker Lifetime & Event Loss**: Enforces synchronous top-level listener registrations in `background.service_worker` to prevent missed events on wake.
2. **Storage Quota Overflow**: Audits `chrome.storage.sync` usage to ensure data payloads remain safely under 8KB/item and 100KB total.
3. **Strict CSP & Zero Inline Scripts**: Validates complete absence of inline `onclick="..."` attributes and `eval()` constructs.
4. **Cross-Platform Case-Sensitivity (404 Audit)**: Verifies that static assets (`.png`, `.webp`, `.mp3`) match exact disk casing to prevent broken assets on Linux/Chrome OS.

---

## 📁 Directory Structure

```text
📁 chrome-extension-project-final-checker/
├── 📄 README.md                 # [This File] User guide and QA protocol reference
├── 📄 SKILL.md                  # Agent execution protocol (Checklists + Edge Case Diagnostics)
└── 📁 scripts/
    └── 🐍 final_check.py        # Automated 5-step verification runner & 404 auditor
```

---

## 🚀 Natural Language Triggers

Trigger the final checker in your AI assistant by asking:
- *"Run final project verification before release"*
- *"Perform the 5-step QA audit on this Chrome extension"*
- *"Check for broken 404 assets and memory leaks"*
- *"배포 전 최종 프로젝트 점검 및 5단계 QA 감사 실행해줘"*

---

## ✅ QA Pass/Fail Criteria Checklist

| Check | Passing Threshold | Blocking Condition |
| :--- | :--- | :--- |
| **Step 1: Production Build** | TypeScript 0 errors, `npm run build` exits 0 | Build fails, module unresolved |
| **Step 2: Manifest V3** | `manifest_version: 3`, icons 16/48/128 exist | Missing icon file, MV2 schema |
| **Step 3: Cross-Browser** | Browser API safe, Shadow Root encapsulated | Host website CSS bleeding |
| **Step 4: 404 Asset Audit** | 100% referenced static images/audio exist | Broken asset path, case mismatch |
| **Step 5: Code Health** | Listeners properly unbound, storage quotas safe | Unmanaged interval memory leaks |

---

## 📄 License

MIT License — free for open-source and commercial Chrome Extension development.
