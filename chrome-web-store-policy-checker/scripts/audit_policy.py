#!/usr/bin/env python3
"""
Chrome Web Store Policy Compliance Auditor (audit_policy.py)
Automated static scanner that audits Chrome Extension projects against Google Chrome Web Store
Developer Program Policies, detecting RCE vulnerabilities, excessive permissions, and MV3 violations.
"""

import os
import sys
import re
import json
import argparse
from pathlib import Path
from typing import Dict, List, Any, Set, Tuple

# Windows Unicode stdout safety
if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

DANGEROUS_PERMISSIONS = {
    "<all_urls>": "Broad web access permission. Rejection risk is critical unless core functionality strictly requires global web page interaction.",
    "webRequestBlocking": "Blocking web requests. Manifest V3 forbids blocking webRequest; use 'declarativeNetRequest' instead.",
    "management": "Browser extension management permission. Requires strict developer justification.",
    "debugger": "Chrome debugging protocol permission. Extremely high review hurdle.",
    "cookies": "Cookie access permission. Requires explicit justification and Privacy Policy.",
    "history": "Browsing history permission. Requires strict justification statement.",
    "bookmarks": "Bookmarks access. Must directly tie to single-purpose feature.",
}

RCE_PATTERNS = [
    (r"\beval\s*\(", "eval() execution detected. Remote code execution is strictly banned in MV3."),
    (r"\bnew\s+Function\s*\(", "new Function() constructor detected. Dynamic string execution is banned."),
    (r"\bimportScripts\s*\(\s*['\"]https?://", "Remote script import via importScripts() is prohibited in service workers."),
    (r"document\.write\s*\(", "document.write() detected. Potential injection risk and deprecated practice."),
    (r"<script\s+[^>]*src=[\"']https?://", "Remote CDN script tag detected in HTML. All scripts must be bundled locally."),
]

DOM_XSS_PATTERNS = [
    (r"\.innerHTML\s*=", "Direct innerHTML assignment. Potential XSS risk; use textContent or safe DOM APIs."),
    (r"dangerouslySetInnerHTML", "React dangerouslySetInnerHTML detected. Ensure all injected HTML is properly sanitized."),
    (r"\.outerHTML\s*=", "Direct outerHTML assignment detected."),
]

def find_project_files(root_dir: Path) -> Tuple[Path, List[Path]]:
    manifest_candidates = list(root_dir.glob("manifest.json")) + list(root_dir.glob("public/manifest.json")) + list(root_dir.glob("src/manifest.json"))
    if not manifest_candidates:
        raise FileNotFoundError(f"Could not locate manifest.json in {root_dir}")
    manifest_path = manifest_candidates[0]

    code_extensions = {".ts", ".tsx", ".js", ".jsx", ".html", ".htm", ".json"}
    ignore_dirs = {".git", "node_modules", "dist", "build", ".agents", "coverage"}

    code_files = []
    for p in root_dir.rglob("*"):
        if p.is_file() and p.suffix in code_extensions:
            if not any(part in ignore_dirs for part in p.parts):
                code_files.append(p)

    return manifest_path, code_files

def audit_manifest(manifest_path: Path) -> Dict[str, Any]:
    issues = []
    warnings = []
    score = 100

    try:
        data = json.loads(manifest_path.read_text(encoding="utf-8", errors="ignore"))
    except Exception as e:
        return {
            "score": 0,
            "issues": [f"Invalid JSON syntax in manifest.json: {e}"],
            "warnings": [],
            "permissions": [],
            "host_permissions": []
        }

    # 1. Manifest Version Check
    mv = data.get("manifest_version")
    if mv != 3:
        issues.append(f"Manifest version is {mv}. Chrome Web Store requires Manifest V3 ('manifest_version': 3).")
        score -= 40

    # 2. Permissions Check
    perms = set(data.get("permissions", []))
    host_perms = set(data.get("host_permissions", []))

    for p in perms | host_perms:
        if p in DANGEROUS_PERMISSIONS:
            warnings.append(f"High-Risk Permission declared: '{p}' -> {DANGEROUS_PERMISSIONS[p]}")
            score -= 10

    # 3. Service Worker vs Background scripts
    bg = data.get("background", {})
    if "scripts" in bg:
        issues.append("Legacy 'background.scripts' found. In Manifest V3, use 'background.service_worker'.")
        score -= 20
    elif "service_worker" not in bg and not data.get("action"):
        warnings.append("No 'background.service_worker' or 'action' defined in manifest.")

    # 4. Name & Trademark Check
    name = data.get("name", "")
    if re.search(r"^(Google|Chrome|YouTube|Gmail)\s", name, re.IGNORECASE):
        issues.append(f"Brand impersonation risk in name: '{name}'. Do not prefix with official trademark names.")
        score -= 15

    return {
        "score": max(0, score),
        "issues": issues,
        "warnings": warnings,
        "permissions": list(perms),
        "host_permissions": list(host_perms),
        "raw_data": data
    }

def audit_source_code(code_files: List[Path], declared_perms: Set[str]) -> Dict[str, Any]:
    rce_findings = []
    xss_findings = []
    http_findings = []
    used_permissions = set()

    perm_detect_patterns = {
        "storage": r"\b(chrome|browser)\.storage\b",
        "tabs": r"\b(chrome|browser)\.tabs\b",
        "cookies": r"\b(chrome|browser)\.cookies\b",
        "alarms": r"\b(chrome|browser)\.alarms\b",
        "contextMenus": r"\b(chrome|browser)\.contextMenus\b",
        "notifications": r"\b(chrome|browser)\.notifications\b",
        "scripting": r"\b(chrome|browser)\.scripting\b",
        "bookmarks": r"\b(chrome|browser)\.bookmarks\b",
        "history": r"\b(chrome|browser)\.history\b",
        "activeTab": r"\b(chrome|browser)\.(tabs|scripting)\b",
    }

    for file_path in code_files:
        try:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
            lines = content.splitlines()
        except Exception:
            continue

        rel_path = file_path.name

        # Check API usage
        for perm, pat in perm_detect_patterns.items():
            if re.search(pat, content):
                used_permissions.add(perm)

        # Check RCE
        for line_idx, line in enumerate(lines, start=1):
            for pat, desc in RCE_PATTERNS:
                if re.search(pat, line):
                    rce_findings.append({
                        "file": str(file_path),
                        "line": line_idx,
                        "snippet": line.strip()[:100],
                        "desc": desc
                    })

            # Check XSS
            for pat, desc in DOM_XSS_PATTERNS:
                if re.search(pat, line):
                    xss_findings.append({
                        "file": str(file_path),
                        "line": line_idx,
                        "snippet": line.strip()[:100],
                        "desc": desc
                    })

            # Check HTTP
            if re.search(r"['\"]http://(?!localhost|127\.0\.0\.1|schemas\.microsoft\.com|www\.w3\.org)", line):
                http_findings.append({
                    "file": str(file_path),
                    "line": line_idx,
                    "snippet": line.strip()[:100],
                    "desc": "Insecure HTTP endpoint detected. All external requests must use HTTPS."
                })

    # Find unused declared permissions
    unused_perms = []
    for p in declared_perms:
        if p in perm_detect_patterns and p not in used_permissions:
            unused_perms.append(p)

    return {
        "rce_findings": rce_findings,
        "xss_findings": xss_findings,
        "http_findings": http_findings,
        "used_permissions": list(used_permissions),
        "unused_permissions": unused_perms
    }

def generate_report(workspace: Path, manifest_res: Dict[str, Any], code_res: Dict[str, Any]) -> Dict[str, Any]:
    total_score = manifest_res["score"]
    
    # Penalize for RCE (Immediate Fail)
    rce_count = len(code_res["rce_findings"])
    if rce_count > 0:
        total_score = max(0, total_score - (rce_count * 30))

    # Penalize for Unused Permissions
    unused_count = len(code_res["unused_permissions"])
    total_score = max(0, total_score - (unused_count * 10))

    # Penalize for Insecure HTTP
    http_count = len(code_res["http_findings"])
    total_score = max(0, total_score - (http_count * 10))

    passed = total_score >= 80 and rce_count == 0 and len(manifest_res["issues"]) == 0

    return {
        "workspace": str(workspace),
        "passed": passed,
        "score": total_score,
        "manifest_issues": manifest_res["issues"],
        "manifest_warnings": manifest_res["warnings"],
        "rce_findings": code_res["rce_findings"],
        "xss_findings": code_res["xss_findings"],
        "http_findings": code_res["http_findings"],
        "unused_permissions": code_res["unused_permissions"],
        "declared_permissions": manifest_res["permissions"] + manifest_res["host_permissions"]
    }

def format_terminal(report: Dict[str, Any]) -> str:
    out = []
    out.append("================================================================")
    out.append(" 🛡️  Chrome Web Store Policy Compliance Audit Report")
    out.append("================================================================")
    status_label = "✅ PASS (Store Submission Ready)" if report["passed"] else "❌ HIGH REJECTION RISK (Fix Violations)"
    out.append(f" Overall Status : {status_label}")
    out.append(f" Compliance Score: {report['score']} / 100")
    out.append("----------------------------------------------------------------")

    if report["manifest_issues"]:
        out.append(" 🚨 Critical Manifest Violations:")
        for iss in report["manifest_issues"]:
            out.append(f"   [FAIL] {iss}")

    if report["rce_findings"]:
        out.append(" 🚨 Remote Code Execution (RCE) Detected (Banned in MV3):")
        for f in report["rce_findings"]:
            out.append(f"   - {Path(f['file']).name}:{f['line']} -> {f['desc']}")
            out.append(f"     Code: {f['snippet']}")

    if report["unused_permissions"]:
        out.append(" ⚠️ Unused Declared Permissions (Prune before submission):")
        for p in report["unused_permissions"]:
            out.append(f"   - '{p}' declared in manifest.json but never called in codebase.")

    if report["http_findings"]:
        out.append(" ⚠️ Insecure HTTP Calls:")
        for f in report["http_findings"]:
            out.append(f"   - {Path(f['file']).name}:{f['line']} -> {f['snippet']}")

    if report["manifest_warnings"]:
        out.append(" ℹ️ High-Risk Permissions Requiring Justification Statement:")
        for w in report["manifest_warnings"]:
            out.append(f"   - {w}")

    out.append("================================================================")
    return "\n".join(out)

def format_markdown(report: Dict[str, Any]) -> str:
    md = []
    md.append("# 🛡️ Chrome Web Store Policy Compliance Audit Report")
    md.append("")
    status_badge = "**✅ PASS (Submission Ready)**" if report["passed"] else "**❌ HIGH REJECTION RISK**"
    md.append(f"- **Audit Status**: {status_badge}")
    md.append(f"- **Compliance Score**: **{report['score']} / 100**")
    md.append(f"- **Workspace**: `{report['workspace']}`")
    md.append("")
    md.append("## 1. Summary Checklist")
    md.append("")
    md.append("| Policy Category | Status | Details |")
    md.append("| :--- | :---: | :--- |")
    md.append(f"| Manifest V3 Standards | {'✅' if not report['manifest_issues'] else '❌'} | {len(report['manifest_issues'])} Critical Issues |")
    md.append(f"| Zero Remote Code Execution (RCE) | {'✅' if not report['rce_findings'] else '❌'} | {len(report['rce_findings'])} Banned Instances |")
    md.append(f"| Least Privilege Permissions | {'✅' if not report['unused_permissions'] else '⚠️'} | {len(report['unused_permissions'])} Unused Permissions |")
    md.append(f"| Secure HTTPS Communication | {'✅' if not report['http_findings'] else '⚠️'} | {len(report['http_findings'])} Insecure Endpoints |")
    md.append("")

    if report["rce_findings"]:
        md.append("## 🚨 Remote Code Execution Violations")
        for f in report["rce_findings"]:
            md.append(f"- `{Path(f['file']).name}:{f['line']}`: {f['desc']}")
            md.append(f"  ```javascript\n  {f['snippet']}\n  ```")
        md.append("")

    if report["unused_permissions"]:
        md.append("## ⚠️ Unused Permissions to Prune")
        md.append("Google review teams flag extensions requesting permissions without active code references:")
        for p in report["unused_permissions"]:
            md.append(f"- Remove `\"{p}\"` from `manifest.json` `permissions` list.")
        md.append("")

    return "\n".join(md)

def main():
    parser = argparse.ArgumentParser(description="Audit Chrome Extension projects against Web Store policies.")
    parser.add_argument("--workspace", "-w", default=".", help="Workspace path (default: current directory)")
    parser.add_argument("--format", "-f", choices=["table", "json", "markdown"], default="table", help="Output format")
    parser.add_argument("--output", "-o", help="Write report to file")

    args = parser.parse_args()
    ws_path = Path(args.workspace).resolve()

    try:
        manifest_path, code_files = find_project_files(ws_path)
        manifest_res = audit_manifest(manifest_path)
        declared_perms = set(manifest_res["permissions"])
        code_res = audit_source_code(code_files, declared_perms)
        report = generate_report(ws_path, manifest_res, code_res)

        if args.format == "json":
            out_str = json.dumps(report, indent=2, ensure_ascii=False)
        elif args.format == "markdown":
            out_str = format_markdown(report)
        else:
            out_str = format_terminal(report)

        if args.output:
            Path(args.output).write_text(out_str, encoding="utf-8")
            print(f"Report written to: {args.output}")
        else:
            print(out_str)

        sys.exit(0 if report["passed"] else 1)

    except Exception as e:
        print(f"Error during policy audit: {e}", file=sys.stderr)
        sys.exit(2)

if __name__ == "__main__":
    main()
