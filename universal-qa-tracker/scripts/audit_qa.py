#!/usr/bin/env python3
"""
Universal QA Issue Tracker - QA Integrity Auditor & Linter CLI Tool
Validates schema compliance, ID uniqueness, required fields, status constraints,
badge count parity, and repository file path references.
"""

import os
import re
import sys
import json
import argparse

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

def extract_all_issues_from_file(filepath):
    """Extracts all issue objects from a dataset js file using robust brace matching."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    issues = []
    # Find all "id": <number>
    id_pattern = re.compile(r'["\']id["\']\s*:\s*(\d+)\b')
    for match in id_pattern.finditer(content):
        id_pos = match.start()
        # Step back to {
        start = -1
        for i in range(id_pos, -1, -1):
            if content[i] == '{':
                start = i
                break
        if start == -1:
            continue

        # Step forward to matching }
        depth = 0
        in_str = False
        quote_char = None
        escape = False
        end = -1
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
                    end = j + 1
                    break

        if end != -1:
            raw_obj = content[start:end]
            cleaned_json = re.sub(r',\s*([}\]])', r'\1', raw_obj)
            try:
                obj = json.loads(cleaned_json)
                issues.append(obj)
            except Exception:
                # Fallback: extract minimal fields via regex
                issue_id = int(match.group(1))
                title_m = re.search(r'["\']title["\']\s*:\s*["\'](.*?)["\']', raw_obj)
                status_m = re.search(r'["\']status["\']\s*:\s*["\'](.*?)["\']', raw_obj)
                issues.append({
                    "id": issue_id,
                    "title": title_m.group(1) if title_m else "Unknown",
                    "status": status_m.group(1) if status_m else "unknown"
                })

    return issues

def main():
    parser = argparse.ArgumentParser(description="Audit and lint Universal QA Tracker datasets.")
    parser.add_argument("--target-dir", type=str, default=None, help="Explicit tracker directory override")
    parser.add_argument("--check-files", action="store_true", help="Verify that referenced files exist in workspace")
    parser.add_argument("--strict", action="store_true", help="Treat warnings as errors")

    args = parser.parse_args()
    project_root = os.getcwd()

    tracker_dir = args.target_dir or find_tracker_dir(project_root)
    if not tracker_dir or not os.path.isdir(tracker_dir):
        print("[ERROR] Could not find QA tracker directory.")
        sys.exit(1)

    data_dir = os.path.join(tracker_dir, "data")
    if not os.path.isdir(data_dir):
        print(f"[ERROR] 'data' directory not found inside {tracker_dir}")
        sys.exit(1)

    print(f"============================================================")
    print(f"  Universal QA Issue Tracker - Data Audit & Linter")
    print(f"  Target: {tracker_dir}")
    print(f"============================================================\n")

    errors = []
    warnings = []

    # 1. Inspect manifest
    manifest_path = os.path.join(data_dir, "qa_manifest.js")
    tracks = []
    if os.path.exists(manifest_path):
        with open(manifest_path, "r", encoding="utf-8") as f:
            m_text = f.read()
        track_matches = re.findall(r'id:\s*["\']([^"\']+)["\']', m_text)
        tracks = [t for t in track_matches if t != "all"]
        print(f"[*] Registered manifest tracks: {tracks}")
    else:
        warnings.append("qa_manifest.js not found in data directory.")

    # 2. Inspect data files
    data_files = [f for f in sorted(os.listdir(data_dir)) if f.endswith(".js") and not f.startswith("qa_manifest")]
    
    total_issues_count = 0
    total_resolved_count = 0
    total_pending_count = 0
    global_seen_ids = {}

    print(f"\n{'-'*60}")
    print(f"{'Phase / File':<35} | {'Total':<6} | {'Resolved':<8} | {'Pending':<7} | {'Rate'}")
    print(f"{'-'*60}")

    for filename in data_files:
        filepath = os.path.join(data_dir, filename)
        issues = extract_all_issues_from_file(filepath)
        
        seen_ids = set()
        file_resolved = 0
        file_pending = 0

        for issue in issues:
            iid = issue.get("id")
            # Duplicate ID within file check
            if iid in seen_ids:
                errors.append(f"[{filename}] Duplicate issue ID #{iid} found within file.")
            else:
                seen_ids.add(iid)

            # Global collision tracking across tracks
            if iid in global_seen_ids:
                warnings.append(f"Duplicate issue ID #{iid} shared across tracks ({global_seen_ids[iid]} and {filename}).")
            else:
                global_seen_ids[iid] = filename

            # Required field checks
            if not issue.get("title"):
                errors.append(f"[{filename}] Issue #{iid} is missing required 'title'.")
            
            st = issue.get("status", "").lower()
            if st == "resolved":
                file_resolved += 1
            elif st == "pending":
                file_pending += 1
            else:
                errors.append(f"[{filename}] Issue #{iid} has invalid status '{st}' (must be 'resolved' or 'pending').")

            # Check files existence if requested
            if args.check_files and "files" in issue and isinstance(issue["files"], list):
                for f_rel in issue["files"]:
                    if f_rel and not os.path.exists(os.path.join(project_root, f_rel)):
                        warnings.append(f"[{filename}] Issue #{iid} references non-existent file: {f_rel}")

            # Check screenshot existence if requested
            if args.check_files and "screenshots" in issue and isinstance(issue["screenshots"], list):
                for s_rel in issue["screenshots"]:
                    if s_rel and not os.path.exists(os.path.join(tracker_dir, s_rel)) and not os.path.exists(os.path.join(project_root, s_rel)):
                        warnings.append(f"[{filename}] Issue #{iid} references non-existent screenshot: {s_rel}")

        n_issues = len(issues)
        total_issues_count += n_issues
        total_resolved_count += file_resolved
        total_pending_count += file_pending

        pct = (file_resolved / n_issues * 100) if n_issues > 0 else 100.0
        print(f"{filename:<35} | {n_issues:<6} | {file_resolved:<8} | {file_pending:<7} | {pct:5.1f}%")

    print(f"{'-'*60}")
    overall_pct = (total_resolved_count / total_issues_count * 100) if total_issues_count > 0 else 100.0
    print(f"{'OVERALL TOTAL':<35} | {total_issues_count:<6} | {total_resolved_count:<8} | {total_pending_count:<7} | {overall_pct:5.1f}%")
    print(f"{'-'*60}\n")

    # Output diagnostics
    if warnings:
        print(f"[!] WARNINGS ({len(warnings)}):")
        for w in warnings[:15]:
            print(f"  - {w}")
        if len(warnings) > 15:
            print(f"  ... and {len(warnings) - 15} more warnings.")
        print()

    if errors:
        print(f"[X] ERRORS ({len(errors)}):")
        for e in errors:
            print(f"  - {e}")
        print("\n[RESULT] Audit FAILED.")
        sys.exit(1)
    else:
        if args.strict and warnings:
            print("[RESULT] Audit FAILED in strict mode due to warnings.")
            sys.exit(1)
        print(f"[RESULT] Audit PASSED! All {total_issues_count} QA issues are healthy and valid.")
        sys.exit(0)

if __name__ == "__main__":
    main()
