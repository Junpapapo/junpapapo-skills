# 🛡️ Chrome Web Store Policy Checker (`chrome-web-store-policy-checker`)

> **Automated Policy Audit, Rejection Prevention Scanner, Permission Justification Generator, and Appeal Protocol for Chrome Extension (Manifest V3) Projects.**

---

## 🌟 Overview

The **Chrome Web Store Policy Checker (`chrome-web-store-policy-checker`)** is a specialized auditing engine, policy reference suite, and Python CLI toolkit designed to guarantee 100% compliance with Google's latest **Chrome Web Store Developer Program Policies**.

Failing a Chrome Web Store review leads to weeks of delays, rejections, or account flags. This skill automates the detection of policy violations across source code, `manifest.json`, and runtime configurations, generates dashboard-ready permission justifications, and provides formal appeal letter templates for mistaken rejections.

---

## ✨ 5 Core Policy Compliance Pillars

```
                     ┌─────────────────────────────────────────┐
                     │   Chrome Web Store Compliance Engine    │
                     └────────────────────┬────────────────────┘
                                          │
       ┌──────────────┬───────────────────┼───────────────────┬──────────────┐
       ▼              ▼                   ▼                   ▼              ▼
1. Quality      2. Privacy &        3. Security &       4. Spam & IP    5. Manifest V3
Guidelines      Permissions         No Remote Code      Protection      & Modern APIs
(Single Purpose)(Least Privilege)   (Zero RCE / HTTPS)  (No Stuffing)   (Service Workers)
```

---

## 🛠️ Automated CLI Tool Reference

> [!NOTE]
> Replace `<skill_dir>` with the relative or absolute path of this skill folder (e.g. `.agents/skills/chrome-web-store-policy-checker` or full path).

### 1. Run Automated Policy Audit (`audit_policy.py`)
Scans source files, manifests, and network calls in **<0.1s**:

```bash
# Terminal colored summary
python <skill_dir>/scripts/audit_policy.py --workspace .

# Generate Markdown audit report
python <skill_dir>/scripts/audit_policy.py --workspace . --format markdown --output STORE_AUDIT.md

# Generate JSON report for CI/CD checks
python <skill_dir>/scripts/audit_policy.py --workspace . --format json
```

### 2. Generate Store Justifications (`generate_justifications.py`)
Generates high-compliance justification statements for all requested permissions:

```bash
# Generate dashboard-ready justification document
python <skill_dir>/scripts/generate_justifications.py --manifest ./manifest.json --name "My Extension" --output JUSTIFICATIONS.md
```

---

## 📖 Key Features & Reference Materials

### 1. 15-Permission Master Justification Dictionary
Pre-approved developer justification statements for `storage`, `tabs`, `activeTab`, `alarms`, `contextMenus`, `notifications`, `scripting`, `cookies`, `declarativeNetRequest`, `offscreen`, `sidePanel`, `identity`, `webNavigation`, `bookmarks`, and `history`.

### 2. Formal Rejection Appeal Protocol
Standardized, professional appeal letter templates for:
- **Template A**: Misunderstood Single Purpose rejection appeal.
- **Template B**: Broad Host Permissions / Least Privilege technical justification appeal.

### 3. 2026 Platform Standards
Full alignment with Manifest V3 exclusivity, Declarative Net Request quotas, Offscreen Documents API guidelines, and AI/LLM model transparency rules.

---

## 📁 Directory Structure

```text
📁 chrome-web-store-policy-checker/
├── 📄 README.md                 # [This File] User guide and policy reference
├── 📄 SKILL.md                  # Agent execution protocol (Checklists + Appeal Templates)
└── 📁 scripts/
    ├── 🐍 audit_policy.py       # Automated static policy auditor & RCE scanner
    └── 🐍 generate_justifications.py # Permission justification statement generator
```

---

## 🚀 Natural Language Triggers

Prompt your AI coding assistant with:
- *"Audit this Chrome extension against Web Store developer policies"*
- *"Run a store rejection risk scan on the codebase"*
- *"Generate permission justification statements for the Chrome Web Store dashboard"*
- *"Draft a rejection appeal letter for this Chrome extension"*
- *"웹 스토어 정책 감사 및 권한 소명서 생성해줘"*

---

## 📄 License

MIT License — free for open-source and commercial Chrome Extension development.
