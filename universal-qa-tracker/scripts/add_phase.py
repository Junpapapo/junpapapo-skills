#!/usr/bin/env python3
"""
Universal QA Issue Tracker - Phase & Track Generator CLI Tool
Scaffolds a new milestone dataset file, registers the track in qa_manifest.js,
and injects script tags into both spreadsheet and dashboard views.
"""

import os
import re
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

def find_tracker_dir(project_root):
    """Discovers tracker directory using config or common fallback paths."""
    config_file = os.path.join(project_root, ".qa_tracker_config.json")
    if os.path.exists(config_file):
        try:
            with open(config_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                path = data.get("trackerPath")
                if path and os.path.isdir(os.path.join(project_root, path)):
                    return os.path.join(project_root, path)
        except Exception:
            pass

    candidates = [
        "docs/02_Guides/internal_qa_issue_tracker",
        "docs/qa_tracker",
        "qa_tracker",
        "qa"
    ]
    for rel in candidates:
        full = os.path.join(project_root, rel)
        if os.path.isdir(full):
            return full

    return None

def inject_script_tag(html_path, script_tag):
    """Safely injects a <script> tag before qa_manifest.js in HTML files."""
    if not os.path.exists(html_path):
        return False

    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    if script_tag in html:
        return True  # Already injected

    # Insert right before data/qa_manifest.js
    pattern = re.compile(r'([ \t]*<script\s+src=["\']data/qa_manifest\.js["\']><\/script>)')
    match = pattern.search(html)
    if match:
        indent = match.group(0)[:len(match.group(0)) - len(match.group(0).lstrip())]
        replacement = f"{indent}{script_tag}\n{match.group(0)}"
        new_html = html[:match.start()] + replacement + html[match.end():]
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(new_html)
        return True

    # Fallback: insert before </head>
    head_end = html.find("</head>")
    if head_end != -1:
        new_html = html[:head_end] + f"  {script_tag}\n" + html[head_end:]
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(new_html)
        return True

    return False

def register_in_manifest(manifest_path, phase_id, label, badge, color):
    """Appends a new track entry into qa_manifest.js."""
    if not os.path.exists(manifest_path):
        print(f"[!] Warning: qa_manifest.js not found at {manifest_path}")
        return False

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest_text = f.read()

    # Check if already registered
    if re.search(r'id:\s*["\']' + re.escape(phase_id) + r'["\']', manifest_text):
        print(f"[*] Track '{phase_id}' already registered in manifest.")
        return True

    # Find the tracks: [ ... ] array
    tracks_match = re.search(r'tracks:\s*\[(.*?)\]\s*(?:,?\s*\}\s*;|\s*\}\s*;)', manifest_text, re.DOTALL)
    if not tracks_match:
        print("[!] Warning: Could not locate 'tracks: [...]' in qa_manifest.js")
        return False

    track_entry = f"""    ,{{
      id: "{phase_id}",
      label: "{label}",
      badge: "{badge}",
      color: "{color}",
      getData: function () {{
        return (window.UNIVERSAL_QA.DATA && window.UNIVERSAL_QA.DATA["{phase_id}"]) || [];
      }}
    }}"""

    # Insert before closing bracket of tracks
    end_bracket_idx = tracks_match.end(1)
    new_manifest = manifest_text[:end_bracket_idx].rstrip() + "\n" + track_entry + "\n  " + manifest_text[end_bracket_idx:]

    with open(manifest_path, "w", encoding="utf-8") as f:
        f.write(new_manifest)
    return True

def main():
    parser = argparse.ArgumentParser(description="Add a new QA Phase / Track milestone.")
    parser.add_argument("--id", type=str, required=True, help="Unique phase identifier (e.g. phase2, open_beta)")
    parser.add_argument("--label", type=str, default=None, help="Display label for tab (e.g. 🧪 Phase 2: Beta)")
    parser.add_argument("--badge", type=str, default=None, help="Badge text (e.g. Phase 2 (0 items))")
    parser.add_argument("--color", type=str, default="#10B981", help="Accent hex color (default: #10B981)")
    parser.add_argument("--target-dir", type=str, default=None, help="Explicit tracker directory override")

    args = parser.parse_args()
    project_root = os.getcwd()

    tracker_dir = args.target_dir or find_tracker_dir(project_root)
    if not tracker_dir or not os.path.isdir(tracker_dir):
        print("[ERROR] Could not find QA tracker directory. Please run init_tracker.py first.")
        sys.exit(1)

    data_dir = os.path.join(tracker_dir, "data")
    os.makedirs(data_dir, exist_ok=True)

    phase_clean = re.sub(r'[^a-zA-Z0-9_-]', '_', args.id).lower()
    phase_label = args.label or f"✨ {phase_clean.replace('_', ' ').title()}"
    phase_badge = args.badge or f"{phase_clean.title()} (0 items)"

    data_filename = f"{phase_clean}_issues.js"
    data_filepath = os.path.join(data_dir, data_filename)

    # 1. Create dataset file if not exists
    if os.path.exists(data_filepath):
        print(f"[*] Dataset file already exists: {data_filename}")
    else:
        file_content = f"""/**
 * Universal QA Master Dataset - {phase_label}
 * Total Issues: 0 Items
 */
window.UNIVERSAL_QA = window.UNIVERSAL_QA || {{}};
window.UNIVERSAL_QA.DATA = window.UNIVERSAL_QA.DATA || {{}};

window.UNIVERSAL_QA.DATA["{phase_clean}"] = [
];
"""
        with open(data_filepath, "w", encoding="utf-8") as f:
            f.write(file_content)
        print(f"[+] Created new dataset file: {data_filepath}")

    # 2. Register in qa_manifest.js
    manifest_path = os.path.join(data_dir, "qa_manifest.js")
    register_in_manifest(manifest_path, phase_clean, phase_label, phase_badge, args.color)

    # 3. Inject script tags into HTML files
    script_tag = f'<script src="data/{data_filename}"></script>'
    spreadsheet_path = os.path.join(tracker_dir, "qa_spreadsheet.html")
    dashboard_path = os.path.join(tracker_dir, "qa_dashboard.html")

    inject_script_tag(spreadsheet_path, script_tag)
    inject_script_tag(dashboard_path, script_tag)

    print(f"\n[SUCCESS] New QA Track '{phase_clean}' successfully created & registered!")
    print(f" - Data file: data/{data_filename}")
    print(f" - Label: {phase_label}")
    print(f" - Badge: {phase_badge}")
    print(f" - Views updated: qa_spreadsheet.html, qa_dashboard.html")

if __name__ == "__main__":
    main()
