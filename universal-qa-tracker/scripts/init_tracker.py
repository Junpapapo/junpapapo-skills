#!/usr/bin/env python3
"""
Universal QA Issue Tracker - Initializer & Scaffolding Tool
Supports green-field scaffolding and non-destructive adoption of existing QA trackers.
"""

import os
import sys
import json
import shutil
import argparse
from datetime import datetime

# Ensure universal UTF-8 stdout encoding on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

def detect_existing_trackers(root_dir):
    """Scans project to detect existing QA tracker directories."""
    candidates = []
    common_paths = [
        "docs/02_Guides/internal_qa_issue_tracker",
        "docs/qa_tracker",
        "docs/qa",
        "qa_tracker",
        "qa"
    ]
    for rel in common_paths:
        full = os.path.join(root_dir, rel)
        if os.path.isdir(full):
            candidates.append(rel)
    return candidates

def main():
    parser = argparse.ArgumentParser(description="Initialize or adopt Universal QA Tracker in a project.")
    parser.add_argument("--project-name", type=str, default=None, help="Name of the project")
    parser.add_argument("--target-dir", type=str, default=None, help="Target relative directory to install/adopt QA tracker")
    parser.add_argument("--preset", type=str, choices=["mobile", "web", "general"], default="mobile", help="Category preset")
    parser.add_argument("--lang", type=str, choices=["en", "ko", "ja"], default="ko", help="Default UI & documentation language")
    parser.add_argument("--adopt-existing", action="store_true", help="Adopt existing tracker without overwriting files")
    parser.add_argument("--force", action="store_true", help="Force overwrite existing templates")

    args = parser.parse_args()

    project_root = os.getcwd()
    skill_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    templates_dir = os.path.join(skill_dir, "templates")

    project_name = args.project_name or os.path.basename(project_root) or "My Project"

    # 1. Determine target directory
    target_rel = args.target_dir
    if not target_rel:
        candidates = detect_existing_trackers(project_root)
        if candidates:
            print(f"[*] Detected existing candidate QA directories: {candidates}")
            target_rel = candidates[0]
            print(f"[*] Selected candidate for adoption: {target_rel}")
        else:
            target_rel = "docs/qa_tracker"
            print(f"[*] Default target directory selected: {target_rel}")

    target_full = os.path.join(project_root, target_rel)
    os.makedirs(target_full, exist_ok=True)

    # 2. Check if already contains QA files
    manifest_file = os.path.join(target_full, "data", "qa_manifest.js")
    has_existing = os.path.exists(manifest_file)

    if has_existing and not args.force:
        print(f"[+] Existing QA data detected at '{target_rel}'. Operating in ADOPTION mode (no data will be overwritten).")
    else:
        print(f"[*] Deploying fresh Universal QA Tracker templates to '{target_rel}'...")
        # Copy templates
        for item in os.listdir(templates_dir):
            s = os.path.join(templates_dir, item)
            d = os.path.join(target_full, item)
            if os.path.isdir(s):
                if not os.path.exists(d):
                    shutil.copytree(s, d)
                elif args.force:
                    shutil.rmtree(d)
                    shutil.copytree(s, d)
            else:
                if not os.path.exists(d) or args.force:
                    shutil.copy2(s, d)

    # 3. Create or update .qa_config.json
    config_path = os.path.join(target_full, ".qa_config.json")
    config_data = {
        "projectName": project_name,
        "trackerDir": target_rel.replace("\\", "/"),
        "preset": args.preset,
        "defaultLang": args.lang,
        "version": "1.0.0",
        "updatedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config_data, f, indent=2, ensure_ascii=False)

    # Also place a root reference pointer for zero-friction agent discovery
    root_pointer = os.path.join(project_root, ".qa_tracker_config.json")
    with open(root_pointer, "w", encoding="utf-8") as f:
        json.dump({"trackerPath": target_rel.replace("\\", "/")}, f, indent=2)

    print(f"\n[SUCCESS] Universal QA Tracker is successfully active at: {target_rel}")
    print(f" - Config: {config_path}")
    print(f" - Hub: {os.path.join(target_rel, 'index.html')}")
    print(f" - Spreadsheet: {os.path.join(target_rel, 'qa_spreadsheet.html')}")
    print(f" - Analytics Dashboard: {os.path.join(target_rel, 'qa_dashboard.html')}")

if __name__ == "__main__":
    main()
