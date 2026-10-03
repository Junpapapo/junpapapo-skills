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
    # Find all "id": <value>
    id_pattern = re.compile(r'["\']id["\']\s*:\s*["\']?([A-Za-z0-9_-]+)["\']?')
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
                raw_id = match.group(1)
                issue_id = int(raw_id) if raw_id.isdigit() else raw_id
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
    all_issues = []

    print(f"\n{'-'*60}")
    print(f"{'Phase / File':<35} | {'Total':<6} | {'Resolved':<8} | {'Pending':<7} | {'Rate'}")
    print(f"{'-'*60}")

    for filename in data_files:
        filepath = os.path.join(data_dir, filename)

        # 2-A. Syntax verification via node --check
        try:
            import subprocess
            chk = subprocess.run(["node", "--check", filepath], capture_output=True, text=True, timeout=5)
            if chk.returncode != 0:
                errors.append(f"[{filename}] JavaScript SyntaxError: {chk.stderr.strip()}")
        except Exception:
            pass

        issues = extract_all_issues_from_file(filepath)
        all_issues.extend(issues)
        
        seen_ids = set()
        file_resolved = 0
        file_pending = 0

        is_voc = "feedback" in filename.lower()

        for issue in issues:
            iid = issue.get("id")
            # Duplicate ID within file check
            if iid in seen_ids:
                errors.append(f"[{filename}] Duplicate issue ID #{iid} found within file.")
            else:
                seen_ids.add(iid)

            # Global tracking across tracks
            if iid in global_seen_ids:
                warnings.append(f"Notice: Issue ID #{iid} is present in both {global_seen_ids[iid]} and {filename} (composite key resolves collision in All Tracks view).")
            else:
                global_seen_ids[iid] = filename

            # Required field checks
            if not issue.get("title") and not issue.get("content"):
                errors.append(f"[{filename}] Issue #{iid} is missing required 'title' or 'content'.")
            
            st = issue.get("status", "").lower()
            if is_voc:
                VOC_STATUSES = {
                    "new", "reviewing", "planned", "to_qa", "shipped", "declined",
                    "reviewed", "in_progress", "resolved", "closed", "pending"
                }
                if st in ("resolved", "closed", "shipped", "to_qa"):
                    file_resolved += 1
                elif st in VOC_STATUSES:
                    file_pending += 1
                else:
                    errors.append(f"[{filename}] VOC Issue #{iid} has invalid status '{st}' (must be one of: {', '.join(sorted(VOC_STATUSES))}).")
            else:
                if st == "resolved":
                    file_resolved += 1
                elif st == "pending":
                    file_pending += 1
                else:
                    errors.append(f"[{filename}] Issue #{iid} has invalid status '{st}' (must be 'resolved' or 'pending').")

            # Quality Domain category validation
            cat = issue.get("category")
            if not cat:
                errors.append(f"[{filename}] Issue #{iid} is missing required 'category'.")
            elif is_voc:
                VOC_DOMAINS = {"bug", "feature", "ux", "other", "praise", "inquiry", "cat-reliability", "cat-ui", "cat-core"}
                if cat not in VOC_DOMAINS:
                    errors.append(f"[{filename}] VOC Issue #{iid} has non-standard category '{cat}'.")
            else:
                STANDARD_DOMAINS = {"reliability", "core", "ui", "perf", "media", "monetization", "auth", "db", "widget", "notification", "storage"}
                if cat not in STANDARD_DOMAINS:
                    errors.append(f"[{filename}] Issue #{iid} has non-standard category '{cat}'. Must be strictly one of: {', '.join(sorted(STANDARD_DOMAINS))}")

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

        # Check sequence continuity (only for numeric QA datasets)
        if not is_voc:
            numeric_ids = [x for x in seen_ids if isinstance(x, int) or (isinstance(x, str) and x.isdigit())]
            numeric_ids = [int(x) for x in numeric_ids]
            if numeric_ids:
                sorted_ids = sorted(numeric_ids)
                min_id = sorted_ids[0]
                max_id = sorted_ids[-1]
                expected_ids = set(range(min_id, max_id + 1))
                missing_ids = sorted(list(expected_ids - set(numeric_ids)))
                if missing_ids:
                    errors.append(f"[{filename}] Sequence gap detected! {len(missing_ids)} missing ID(s): {missing_ids[:10]}{'...' if len(missing_ids) > 10 else ''}")

        # Check manifest badge parity
        if os.path.exists(manifest_path):
            phase_prefix = filename.split("_")[0]
            track_m = re.search(r'id:\s*["\']' + re.escape(phase_prefix) + r'["\'][^}]+?badge:\s*["\']([^"\']+)["\']', m_text, re.DOTALL)
            if track_m:
                badge_str = track_m.group(1)
                count_m = re.search(r'\((\d+)(?:건|\s*items)', badge_str)
                if count_m:
                    badge_count = int(count_m.group(1))
                    if badge_count != n_issues:
                        errors.append(f"[{filename}] Manifest badge count mismatch: badge shows {badge_count}, but dataset has {n_issues} issues.")

        pct = (file_resolved / n_issues * 100) if n_issues > 0 else 100.0
        print(f"{filename:<35} | {n_issues:<6} | {file_resolved:<8} | {file_pending:<7} | {pct:5.1f}%")

    print(f"{'-'*60}")
    overall_pct = (total_resolved_count / total_issues_count * 100) if total_issues_count > 0 else 100.0
    print(f"{'OVERALL TOTAL':<35} | {total_issues_count:<6} | {total_resolved_count:<8} | {total_pending_count:<7} | {overall_pct:5.1f}%")
    print(f"{'-'*60}\n")

    # Severity distribution summary (IEEE 1044 / ISTQB)
    sev_counts = {"S1": 0, "S2": 0, "S3": 0, "S4": 0, "S5": 0}
    for iss in all_issues:
        s = iss.get("severity", "S3")
        sev_counts[s] = sev_counts.get(s, 0) + 1

    sev_labels = {
        "S1": "🚨 S1 Blocker ",
        "S2": "🔥 S2 Critical",
        "S3": "⚡ S3 Major   ",
        "S4": "🌱 S4 Minor   ",
        "S5": "☕ S5 Trivial "
    }
    print("Severity Breakdown (IEEE 1044):")
    for s_code in ["S1", "S2", "S3", "S4", "S5"]:
        c = sev_counts.get(s_code, 0)
        p = (c / total_issues_count * 100) if total_issues_count > 0 else 0
        print(f"  - {sev_labels[s_code]} : {c:3d} items ({p:5.1f}%)")
    print()

    # Category domain distribution summary (ISO/IEC 25010)
    cat_counts = { "reliability": 0, "core": 0, "ui": 0, "perf": 0, "media": 0, "monetization": 0, "auth": 0, "db": 0 }
    for iss in all_issues:
        c_val = iss.get("category", "unknown")
        cat_counts[c_val] = cat_counts.get(c_val, 0) + 1

    cat_labels = {
        "reliability": "🛡️ Reliability ",
        "core": "⚡ Core        ",
        "ui": "🎨 UI/UX       ",
        "perf": "🚀 Perf        ",
        "media": "🎙️ Media       ",
        "monetization": "💰 Monetization",
        "auth": "🔒 Auth/Sec    ",
        "db": "💾 Database    "
    }
    print("Quality Domain Breakdown (ISO/IEC 25010):")
    for c_code in ["reliability", "core", "ui", "perf", "media", "monetization", "auth", "db"]:
        c = cat_counts.get(c_code, 0)
        p = (c / total_issues_count * 100) if total_issues_count > 0 else 0
        print(f"  - {cat_labels[c_code]} : {c:3d} items ({p:5.1f}%)")
    print()

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
