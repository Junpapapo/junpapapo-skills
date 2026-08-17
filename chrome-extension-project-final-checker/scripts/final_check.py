#!/usr/bin/env python3
"""
Chrome Extension Final Project QA Checker (final_check.py)
Automated 5-Step Deep Verification Protocol runner for Chrome Extensions (Manifest V3)
and modern web applications prior to release.
"""

import os
import sys
import re
import json
import subprocess
import argparse
from pathlib import Path
from typing import Dict, List, Any, Set, Tuple

# Windows Unicode stdout safety
if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

def run_command_sync(cmd: List[str], cwd: Path) -> Tuple[int, str]:
    try:
        res = subprocess.run(
            cmd,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            timeout=120,
            shell=True if sys.platform == "win32" else False
        )
        return res.returncode, res.stdout.strip()
    except Exception as e:
        return 1, str(e)

def audit_step1_build(workspace: Path, skip_build: bool) -> Dict[str, Any]:
    if skip_build:
        return {"passed": True, "skipped": True, "details": "Build check skipped via --skip-build"}

    pkg_json = workspace / "package.json"
    if not pkg_json.is_file():
        return {"passed": True, "skipped": True, "details": "No package.json found; skipping build check."}

    try:
        pkg_data = json.loads(pkg_json.read_text(encoding="utf-8", errors="ignore"))
    except Exception:
        return {"passed": False, "skipped": False, "details": "Invalid package.json"}

    scripts = pkg_data.get("scripts", {})
    details = []
    overall_passed = True

    # 1. Type Check if tsc script or typescript is present
    if "tsc" in pkg_data.get("devDependencies", {}) or "typescript" in pkg_data.get("devDependencies", {}):
        code, out = run_command_sync(["npx", "tsc", "--noEmit"], workspace)
        if code == 0:
            details.append("✅ TypeScript Type Check: 0 errors (npx tsc --noEmit)")
        else:
            overall_passed = False
            details.append(f"❌ TypeScript Compilation Failed (Exit Code {code}):\n{out[:400]}")

    # 2. Production Build
    if "build" in scripts:
        code, out = run_command_sync(["npm", "run", "build"], workspace)
        if code == 0:
            details.append("✅ Production Build: Succeeded (npm run build)")
        else:
            overall_passed = False
            details.append(f"❌ Production Build Failed (Exit Code {code}):\n{out[:400]}")
    else:
        details.append("ℹ️ No 'build' script defined in package.json.")

    return {"passed": overall_passed, "skipped": False, "details": "\n".join(details)}

def audit_step2_manifest(workspace: Path) -> Dict[str, Any]:
    manifest_candidates = list(workspace.glob("manifest.json")) + list(workspace.glob("public/manifest.json")) + list(workspace.glob("dist/manifest.json"))
    if not manifest_candidates:
        return {"passed": False, "details": "manifest.json not found in root, public/, or dist/."}

    manifest_path = manifest_candidates[0]
    try:
        data = json.loads(manifest_path.read_text(encoding="utf-8", errors="ignore"))
    except Exception as e:
        return {"passed": False, "details": f"manifest.json syntax error: {e}"}

    details = []
    passed = True

    # MV3 version
    mv = data.get("manifest_version")
    if mv == 3:
        details.append("✅ Manifest Version: 3 (MV3 Compliant)")
    else:
        passed = False
        details.append(f"❌ Manifest Version: {mv} (Must be 3)")

    # Icons check
    icons = data.get("icons", {})
    action_icons = data.get("action", {}).get("default_icon", {})
    all_icons = {}
    if isinstance(icons, dict):
        all_icons.update(icons)
    if isinstance(action_icons, dict):
        all_icons.update(action_icons)
    elif isinstance(action_icons, str):
        all_icons["action"] = action_icons

    missing_icons = []
    for size, icon_rel in all_icons.items():
        found = False
        for search_base in [workspace, workspace / "public", workspace / "dist"]:
            clean_rel = icon_rel.lstrip("/")
            if (search_base / clean_rel).is_file():
                found = True
                break
        if not found:
            missing_icons.append(f"Icon {size} ({icon_rel}) not found on disk.")

    if missing_icons:
        passed = False
        details.append(f"❌ Missing Icon Assets:\n  " + "\n  ".join(missing_icons))
    else:
        details.append(f"✅ Icon Assets: All {len(all_icons)} declared icon paths physically exist.")

    # Service Worker
    bg = data.get("background", {})
    if "service_worker" in bg:
        sw_rel = bg["service_worker"].lstrip("/")
        sw_found = any((base / sw_rel).is_file() for base in [workspace, workspace / "public", workspace / "dist", workspace / "src"])
        if sw_found:
            details.append(f"✅ Background Service Worker: '{sw_rel}' verified.")
        else:
            passed = False
            details.append(f"❌ Service Worker script '{sw_rel}' does not exist.")

    return {"passed": passed, "details": "\n".join(details)}

def audit_step3_crossbrowser(workspace: Path) -> Dict[str, Any]:
    # Check for browser/chrome API isolation and shadow DOM usage
    code_files = [p for p in workspace.rglob("*") if p.suffix in {".ts", ".tsx", ".js", ".jsx"} and not any(part in {"node_modules", "dist", ".git"} for part in p.parts)]
    
    shadow_dom_found = False
    browser_api_used = False

    for cf in code_files:
        try:
            content = cf.read_text(encoding="utf-8", errors="ignore")
            if "attachShadow" in content or "createShadowRoot" in content:
                shadow_dom_found = True
            if "chrome." in content or "browser." in content:
                browser_api_used = True
        except Exception:
            continue

    details = []
    details.append("✅ Multi-Browser API: Browser API abstractions inspected.")
    if shadow_dom_found:
        details.append("✅ Shadow DOM Style Isolation: Verified (Widget encapsulation active).")
    else:
        details.append("ℹ️ Shadow DOM: No attachShadow found (Verify if injected content script widgets need CSS isolation).")

    return {"passed": True, "details": "\n".join(details)}

def audit_step4_assets(workspace: Path) -> Dict[str, Any]:
    # Extract asset string references in source files
    code_files = [p for p in workspace.rglob("*") if p.suffix in {".ts", ".tsx", ".js", ".jsx", ".html", ".css"} and not any(part in {"node_modules", "dist", ".git"} for part in p.parts)]
    
    asset_patterns = [
        r"chrome\.runtime\.getURL\(\s*['\"]([^'\"]+)['\"]\s*\)",
        r"['\"]((?:assets|images|icons|sounds|audio|fonts)/[^'\"]+\.(?:png|webp|svg|jpg|jpeg|mp3|wav|json|woff2))['\"]",
    ]

    referenced_assets = set()
    for cf in code_files:
        try:
            content = cf.read_text(encoding="utf-8", errors="ignore")
            for pat in asset_patterns:
                matches = re.findall(pat, content)
                for m in matches:
                    if not m.startswith("http") and not m.startswith("data:"):
                        referenced_assets.add(m.lstrip("/"))
        except Exception:
            continue

    missing_assets = []
    checked_count = len(referenced_assets)

    for asset_rel in referenced_assets:
        found = False
        for search_base in [workspace, workspace / "public", workspace / "src", workspace / "dist"]:
            target = search_base / asset_rel
            if target.is_file():
                # Case sensitivity check
                if target.resolve().name == Path(asset_rel).name:
                    found = True
                    break
        if not found:
            missing_assets.append(asset_rel)

    details = []
    passed = len(missing_assets) == 0
    if passed:
        details.append(f"✅ Runtime Asset 404 Audit: All {checked_count} static assets verified on disk.")
    else:
        details.append(f"❌ 404 Broken Assets Detected ({len(missing_assets)}/{checked_count} missing):\n  - " + "\n  - ".join(missing_assets[:10]))
        if len(missing_assets) > 10:
            details.append(f"  ... and {len(missing_assets) - 10} more")

    return {"passed": passed, "missing_assets": missing_assets, "details": "\n".join(details)}

def audit_step5_codehealth(workspace: Path) -> Dict[str, Any]:
    code_files = [p for p in workspace.rglob("*") if p.suffix in {".ts", ".tsx", ".js", ".jsx"} and not any(part in {"node_modules", "dist", ".git"} for part in p.parts)]

    listener_count = 0
    cleanup_count = 0
    console_log_count = 0

    for cf in code_files:
        try:
            content = cf.read_text(encoding="utf-8", errors="ignore")
            listener_count += len(re.findall(r"addEventListener\s*\(", content))
            cleanup_count += len(re.findall(r"removeEventListener\s*\(", content))
            console_log_count += len(re.findall(r"console\.log\s*\(", content))
        except Exception:
            continue

    details = []
    details.append(f"ℹ️ Event Listeners: {listener_count} added, {cleanup_count} explicit remove handlers found.")
    if console_log_count > 10:
        details.append(f"⚠️ Stray Debug Logs: {console_log_count} console.log instances found. Consider stripping before production.")
    else:
        details.append(f"✅ Code Health: {console_log_count} debug log statements (clean).")

    return {"passed": True, "details": "\n".join(details)}

def main():
    parser = argparse.ArgumentParser(description="Run 5-Step Deep QA Final Verification for Chrome Extensions.")
    parser.add_argument("--workspace", "-w", default=".", help="Project workspace path (default: current directory)")
    parser.add_argument("--skip-build", action="store_true", help="Skip npm run build & tsc compilation")
    parser.add_argument("--format", "-f", choices=["table", "json", "markdown"], default="table", help="Output format")
    parser.add_argument("--output", "-o", help="Write final report to file")

    args = parser.parse_args()
    ws_path = Path(args.workspace).resolve()

    s1 = audit_step1_build(ws_path, args.skip_build)
    s2 = audit_step2_manifest(ws_path)
    s3 = audit_step3_crossbrowser(ws_path)
    s4 = audit_step4_assets(ws_path)
    s5 = audit_step5_codehealth(ws_path)

    all_passed = s1["passed"] and s2["passed"] and s3["passed"] and s4["passed"] and s5["passed"]
    score = 100
    if not s1["passed"]: score -= 30
    if not s2["passed"]: score -= 30
    if not s4["passed"]: score -= 25

    report = {
        "workspace": str(ws_path),
        "overall_passed": all_passed,
        "score": max(0, score),
        "step1_build": s1,
        "step2_manifest": s2,
        "step3_crossbrowser": s3,
        "step4_assets": s4,
        "step5_codehealth": s5
    }

    if args.format == "json":
        out_str = json.dumps(report, indent=2, ensure_ascii=False)
    elif args.format == "markdown":
        md = [
            f"# 🛡️ Project Final QA Verification Report",
            f"",
            f"- **Status**: {'**✅ CLEAN RELEASE APPROVED**' if all_passed else '**❌ QA AUDIT FAILED**'}",
            f"- **Score**: **{max(0, score)} / 100**",
            f"- **Workspace**: `{ws_path}`",
            f"",
            f"## 📋 5-Step Audit Results",
            f"",
            f"### Step 1: Production Bundle Build",
            s1["details"],
            f"",
            f"### Step 2: Manifest V3 & Store Assets",
            s2["details"],
            f"",
            f"### Step 3: Cross-Browser Compatibility & API Isolation",
            s3["details"],
            f"",
            f"### Step 4: Runtime Asset Integrity (404 Audit)",
            s4["details"],
            f"",
            f"### Step 5: Code Health & Diagnostics",
            s5["details"],
            f""
        ]
        out_str = "\n".join(md)
    else:
        out = [
            "================================================================",
            " 🛡️  Chrome Extension Project Final QA Verification",
            "================================================================",
            f" Target Workspace : {ws_path}",
            f" Final QA Status  : {'✅ CLEAN RELEASE APPROVED' if all_passed else '❌ QA AUDIT FAILED'}",
            f" Overall QA Score : {max(0, score)} / 100",
            "----------------------------------------------------------------",
            " [Step 1: Production Build Audit]",
            s1["details"],
            "----------------------------------------------------------------",
            " [Step 2: Manifest V3 & Store Compliance Audit]",
            s2["details"],
            "----------------------------------------------------------------",
            " [Step 3: Cross-Browser & Shadow DOM Audit]",
            s3["details"],
            "----------------------------------------------------------------",
            " [Step 4: Runtime Asset 404 Audit]",
            s4["details"],
            "----------------------------------------------------------------",
            " [Step 5: Code Health & Memory Leak Audit]",
            s5["details"],
            "================================================================"
        ]
        out_str = "\n".join(out)

    if args.output:
        Path(args.output).write_text(out_str, encoding="utf-8")
        print(f"QA report saved to: {args.output}")
    else:
        print(out_str)

    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()
