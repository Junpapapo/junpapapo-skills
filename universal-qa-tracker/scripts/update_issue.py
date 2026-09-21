#!/usr/bin/env python3
"""
Universal QA Issue Tracker - Issue Update CLI Tool
Updates existing QA issues (status, solution, root cause, files, actions)
with zero-dependency Python, atomic backup/rollback, and multi-file auto-discovery.
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

def find_issue_span(content, target_id):
    """Locates the start and end character index of an issue object by its ID."""
    pattern = re.compile(r'["\']id["\']\s*:\s*["\']?' + re.escape(str(target_id)) + r'["\']?(?:,|\s|\})')
    m = pattern.search(content)
    if not m:
        return None
    id_pos = m.start()

    # Step backwards to find opening {
    start = -1
    for i in range(id_pos, -1, -1):
        if content[i] == '{':
            start = i
            break
    if start == -1:
        return None

    # Step forward to find matching closing }
    depth = 0
    in_str = False
    quote_char = None
    escape = False
    for j in range(start, len(content)):
        c = content[j]
        if escape:
            escape = False
            continue
        if c == '\\':
            escape = True
            continue
        if in_str:
            if c == quote_char:
                in_str = False
            continue
        if c in ('"', "'"):
            in_str = True
            quote_char = c
            continue
        if c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                return (start, j + 1)
    return None

def main():
    parser = argparse.ArgumentParser(description="Update an existing QA issue safely.")
    parser.add_argument("--id", type=str, required=True, help="ID of the issue to update (numeric or string, e.g. 385, FB-01)")
    parser.add_argument("--phase", type=str, default=None, help="Target phase ID or file prefix (optional, auto-detected)")
    parser.add_argument("--status", type=str, choices=["resolved", "pending"], default=None, help="New status")
    parser.add_argument("--solution", type=str, default=None, help="Updated solution description")
    parser.add_argument("--solution-en", type=str, default=None, help="Updated English solution")
    parser.add_argument("--cause", type=str, default=None, help="Updated root cause")
    parser.add_argument("--title", type=str, default=None, help="Updated title")
    parser.add_argument("--title-en", type=str, default=None, help="Updated English title")
    parser.add_argument("--problem", type=str, default=None, help="Updated problem description")
    parser.add_argument("--problem-en", type=str, default=None, help="Updated English problem")
    parser.add_argument("--files", nargs="*", default=None, help="Files to add (or replace)")
    parser.add_argument("--replace-files", action="store_true", help="Replace files array instead of appending")
    parser.add_argument("--actions", nargs="*", default=None, help="Actions to add (or replace)")
    parser.add_argument("--replace-actions", action="store_true", help="Replace actions array instead of appending")
    parser.add_argument("--screenshots", nargs="*", default=None, help="Screenshots to add (or replace)")
    parser.add_argument("--replace-screenshots", action="store_true", help="Replace screenshots array instead of appending")
    parser.add_argument("--date", type=str, default=None, help="Date of update (YYYY-MM-DD)")
    parser.add_argument("--severity", type=str, choices=["S1", "S2", "S3", "S4", "S5"], default=None, help="Updated severity (S1=Blocker, S2=Critical, S3=Major, S4=Minor, S5=Trivial)")
    parser.add_argument("--target-dir", type=str, default=None, help="Explicit tracker directory override")

    args = parser.parse_args()
    project_root = os.getcwd()

    tracker_dir = args.target_dir or find_tracker_dir(project_root)
    if not tracker_dir or not os.path.isdir(tracker_dir):
        print("[ERROR] Could not find QA tracker directory. Please run init_tracker.py first.")
        sys.exit(1)

    data_dir = os.path.join(tracker_dir, "data")
    if not os.path.isdir(data_dir):
        print(f"[ERROR] 'data' directory not found inside: {tracker_dir}")
        sys.exit(1)

    # Search for the issue across data files
    candidate_files = []
    if args.phase:
        for f in os.listdir(data_dir):
            if f.startswith(args.phase) and f.endswith(".js"):
                candidate_files.append(os.path.join(data_dir, f))
    else:
        for f in sorted(os.listdir(data_dir)):
            if f.endswith(".js") and not f.startswith("qa_manifest"):
                candidate_files.append(os.path.join(data_dir, f))

    target_file = None
    target_span = None
    file_content = None

    for filepath in candidate_files:
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            span = find_issue_span(content, args.id)
            if span:
                target_file = filepath
                target_span = span
                file_content = content
                break
        except Exception:
            continue

    if not target_file or not target_span:
        print(f"[ERROR] Could not locate QA Issue #{args.id} in {data_dir}")
        sys.exit(1)

    # Extract raw issue substring
    start, end = target_span
    raw_issue = file_content[start:end]

    # Clean trailing commas inside the single object to parse as JSON safely
    cleaned_json = re.sub(r',\s*([}\]])', r'\1', raw_issue)
    try:
        issue_obj = json.loads(cleaned_json)
    except Exception as e:
        print(f"[ERROR] Failed to parse issue #{args.id} object as JSON: {e}")
        sys.exit(1)

    # Apply updates
    if args.status:
        issue_obj["status"] = args.status
    if args.solution is not None:
        issue_obj["solution"] = args.solution
    if args.solution_en is not None:
        issue_obj["solution_en"] = args.solution_en
    if args.cause is not None:
        issue_obj["cause"] = args.cause
    if args.title is not None:
        issue_obj["title"] = args.title
    if args.title_en is not None:
        issue_obj["title_en"] = args.title_en
    if args.problem is not None:
        issue_obj["problem"] = args.problem
    if args.problem_en is not None:
        issue_obj["problem_en"] = args.problem_en
    if args.date:
        issue_obj["date"] = args.date
    elif args.status == "resolved" and issue_obj.get("status") != "resolved":
        issue_obj["date"] = datetime.now().strftime("%Y-%m-%d")

    if args.severity:
        issue_obj["severity"] = args.severity
        sev_labels = {
            "S1": "🚨 S1 Blocker",
            "S2": "🔥 S2 Critical",
            "S3": "⚡ S3 Major",
            "S4": "🌱 S4 Minor",
            "S5": "☕ S5 Trivial"
        }
        issue_obj["severityLabel"] = sev_labels.get(args.severity, args.severity)

    # Files update
    if args.files is not None:
        existing_files = issue_obj.get("files", [])
        if args.replace_files:
            issue_obj["files"] = args.files
        else:
            for new_f in args.files:
                if new_f not in existing_files:
                    existing_files.append(new_f)
            issue_obj["files"] = existing_files

    # Actions update
    if args.actions is not None:
        existing_actions = issue_obj.get("actions", [])
        if args.replace_actions:
            issue_obj["actions"] = args.actions
        else:
            for new_a in args.actions:
                if new_a not in existing_actions:
                    existing_actions.append(new_a)
            issue_obj["actions"] = existing_actions

    # Screenshots update
    if args.screenshots is not None:
        existing_ss = issue_obj.get("screenshots", [])
        if args.replace_screenshots:
            issue_obj["screenshots"] = args.screenshots
        else:
            for new_s in args.screenshots:
                if new_s not in existing_ss:
                    existing_ss.append(new_s)
            issue_obj["screenshots"] = existing_ss

    # Re-format issue
    formatted_issue = "  " + json.dumps(issue_obj, ensure_ascii=False, indent=4).replace("\n", "\n  ")
    new_content = file_content[:start] + formatted_issue.strip() + file_content[end:]

    # Atomic write with backup
    backup_file = target_file + ".bak"
    shutil.copy2(target_file, backup_file)

    try:
        with open(target_file, "w", encoding="utf-8") as f:
            f.write(new_content)

        # Automated Zero-Syntax-Error Verification Gate
        import subprocess
        try:
            chk = subprocess.run(["node", "--check", target_file], capture_output=True, text=True, timeout=5)
            if chk.returncode != 0:
                print(f"[FATAL] JavaScript syntax error detected in {os.path.basename(target_file)} after update! Rolling back...")
                print(chk.stderr)
                if os.path.exists(backup_file):
                    shutil.copy2(backup_file, target_file)
                    os.remove(backup_file)
                sys.exit(1)
        except Exception:
            pass

        # Remove backup on success
        if os.path.exists(backup_file):
            os.remove(backup_file)

        print(f"[SUCCESS] Updated QA Issue #{args.id} in {os.path.basename(target_file)}")
        print(f" - Title: {issue_obj.get('title')}")
        print(f" - Status: {issue_obj.get('status')}")
        if issue_obj.get('severityLabel'):
            print(f" - Severity: {issue_obj.get('severityLabel')}")
        if args.solution is not None:
            print(f" - Solution: {issue_obj.get('solution')}")
        if issue_obj.get("files"):
            print(f" - Files: {len(issue_obj.get('files'))} recorded")
    except Exception as e:
        if os.path.exists(backup_file):
            shutil.copy2(backup_file, target_file)
            os.remove(backup_file)
        print(f"[FATAL] Error updating issue. Transaction rolled back: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
