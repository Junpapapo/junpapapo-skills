#!/usr/bin/env python3
"""
Universal QA Issue Tracker - Initializer & Scaffolding Tool
Supports green-field scaffolding and non-destructive adoption of existing QA trackers.
Sets up the canonical 5-portal suite, automation CLI scripts, client templates, and config.
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

def replace_placeholders_in_file(filepath, replacements):
    """Replaces placeholder tokens in text files."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        modified = content
        for k, v in replacements.items():
            modified = modified.replace(k, v)
        
        if modified != content:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(modified)
    except Exception:
        # Skip binary or unreadable files gracefully
        pass

def replace_placeholders_in_dir(directory, replacements):
    """Walks directory and applies token replacements to code/markup files."""
    valid_exts = {".html", ".js", ".json", ".ts", ".tsx", ".md", ".py"}
    for root, _, files in os.walk(directory):
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in valid_exts:
                replace_placeholders_in_file(os.path.join(root, file), replacements)

def main():
    parser = argparse.ArgumentParser(description="Initialize or adopt Universal QA Tracker in a project.")
    parser.add_argument("--project-name", type=str, default=None, help="Name of the project (e.g., 'Modo', 'AcmeApp')")
    parser.add_argument("--target-dir", type=str, default=None, help="Target relative directory to install/adopt QA tracker")
    parser.add_argument("--preset", type=str, choices=["mobile", "web", "general"], default="mobile", help="Category preset")
    parser.add_argument("--lang", type=str, choices=["en", "ko", "ja"], default="ko", help="Default UI & documentation language")
    parser.add_argument("--adopt-existing", action="store_true", help="Adopt existing tracker without overwriting files")
    parser.add_argument("--force", action="store_true", help="Force overwrite existing files with pristine templates")

    args = parser.parse_args()

    project_root = os.getcwd()
    skill_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    templates_dir = os.path.join(skill_dir, "templates")
    scripts_dir = os.path.join(skill_dir, "scripts")
    client_templates_dir = os.path.join(skill_dir, "client-templates")

    # Clean up obsolete legacy files from template suite if present
    legacy_template_files = [
        os.path.join(templates_dir, "qa_engine.js"),
        os.path.join(templates_dir, "qa_i18n.js"),
        os.path.join(templates_dir, "internal_qa_closed_testing.html"),
        os.path.join(templates_dir, "qa_dashboard.html"),
        os.path.join(templates_dir, "data", "phase1_issues.js"),
    ]
    for lf in legacy_template_files:
        if os.path.exists(lf):
            try:
                os.remove(lf)
            except Exception:
                pass

    project_name = args.project_name or os.path.basename(project_root) or "Universal App"
    project_initial = project_name[0].upper() if project_name else "Q"
    import re
    project_lower = re.sub(r'[^a-zA-Z0-9_]', '', project_name.lower()) or "app"

    replacements = {
        "{{PROJECT_NAME}}": project_name,
        "{{PROJECT_NAME_INITIAL}}": project_initial,
        "{{PROJECT_NAME_LOWER}}": project_lower,
        "{{DEVELOPER_NAME}}": "Developer",
    }

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
        print(f"[+] Existing QA data detected at '{target_rel}'. Operating in ADOPTION mode (preserving existing datasets).")
    else:
        print(f"[*] Deploying fresh Universal QA Tracker 5-portal suite to '{target_rel}'...")
        
        # Copy web templates
        legacy_names = {"qa_engine.js", "qa_i18n.js", "internal_qa_closed_testing.html", "qa_dashboard.html", "phase1_issues.js"}
        if os.path.isdir(templates_dir):
            for item in os.listdir(templates_dir):
                if item in legacy_names:
                    continue
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

        # Copy automation CLI scripts into target/scripts/
        target_scripts_dir = os.path.join(target_full, "scripts")
        os.makedirs(target_scripts_dir, exist_ok=True)
        if os.path.isdir(scripts_dir):
            for item in os.listdir(scripts_dir):
                if item in ("init_tracker.py", "__pycache__"):
                    continue
                s = os.path.join(scripts_dir, item)
                d = os.path.join(target_scripts_dir, item)
                if os.path.isfile(s) and (not os.path.exists(d) or args.force):
                    shutil.copy2(s, d)

        # Copy in-app client templates into target/client-templates/
        target_client_dir = os.path.join(target_full, "client-templates")
        os.makedirs(target_client_dir, exist_ok=True)
        if os.path.isdir(client_templates_dir):
            for item in os.listdir(client_templates_dir):
                s = os.path.join(client_templates_dir, item)
                d = os.path.join(target_client_dir, item)
                if os.path.isdir(s):
                    if not os.path.exists(d):
                        shutil.copytree(s, d)
                    elif args.force:
                        shutil.rmtree(d)
                        shutil.copytree(s, d)
                elif os.path.isfile(s) and (not os.path.exists(d) or args.force):
                    shutil.copy2(s, d)

        # Apply placeholder replacements across deployed files
        replace_placeholders_in_dir(target_full, replacements)

    # 3. Create or update .qa_config.json
    config_path = os.path.join(target_full, ".qa_config.json")
    config_data = {
        "projectName": project_name,
        "trackerDir": target_rel.replace("\\", "/"),
        "preset": args.preset,
        "defaultLang": args.lang,
        "version": "2.4.0",
        "portals": {
            "hub": "index.html",
            "spreadsheet": "qa_spreadsheet.html",
            "analytics": "qa_analytics_dashboard.html",
            "vocStudio": "voc_dashboard.html",
            "sheetsGuide": "google_sheets_voc_setup_guide.html"
        },
        "api": {
            "sheetSyncUrl": "",
            "spreadsheetViewUrl": ""
        },
        "updatedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config_data, f, indent=2, ensure_ascii=False)

    # Place root pointer config for instant AI agent and CLI discovery
    root_pointer = os.path.join(project_root, ".qa_tracker_config.json")
    with open(root_pointer, "w", encoding="utf-8") as f:
        json.dump({
            "trackerPath": target_rel.replace("\\", "/"),
            "projectName": project_name
        }, f, indent=2, ensure_ascii=False)

    print(f"\n[SUCCESS] Universal QA Tracker (v2.4) is active at: {target_rel}")
    print(f"  Configuration: {config_path}")
    print(f"  Canonical 5-Portal Suite:")
    print(f"    1. [Executive Hub]      : {os.path.join(target_rel, 'index.html')}")
    print(f"    2. [Master Spreadsheet] : {os.path.join(target_rel, 'qa_spreadsheet.html')}")
    print(f"    3. [Analytics Studio]   : {os.path.join(target_rel, 'qa_analytics_dashboard.html')}")
    print(f"    4. [VOC Studio]         : {os.path.join(target_rel, 'voc_dashboard.html')}")
    print(f"    5. [Setup Guide]        : {os.path.join(target_rel, 'google_sheets_voc_setup_guide.html')}")
    print(f"  Automation Scripts        : {os.path.join(target_rel, 'scripts')}")
    print(f"  Client SDK Templates      : {os.path.join(target_rel, 'client-templates')}")

if __name__ == "__main__":
    main()
