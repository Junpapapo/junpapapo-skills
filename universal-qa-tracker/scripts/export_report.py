#!/usr/bin/env python3
"""
Universal QA Issue Tracker - Export & Reporting CLI Tool
Exports QA datasets into Markdown tables, CSV, or JSON for GitHub Release Notes,
PR descriptions, or App Store / Google Play appeal documentation.
"""

import os
import re
import sys
import json
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

def extract_all_issues(filepath):
    """Extracts all issue objects from a dataset js file using robust brace matching."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    issues = []
    id_pattern = re.compile(r'["\']id["\']\s*:\s*(\d+)\b')
    for match in id_pattern.finditer(content):
        id_pos = match.start()
        start = -1
        for i in range(id_pos, -1, -1):
            if content[i] == '{':
                start = i
                break
        if start == -1:
            continue

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
                pass

    return issues

def main():
    parser = argparse.ArgumentParser(description="Export QA tracker datasets to Markdown, CSV, or JSON.")
    parser.add_argument("--phase", type=str, default="all", help="Target phase (e.g. phase1, all)")
    parser.add_argument("--status", type=str, choices=["all", "resolved", "pending"], default="all", help="Status filter")
    parser.add_argument("--category", type=str, default=None, help="Category filter (e.g. core, ui)")
    parser.add_argument("--format", type=str, choices=["markdown", "csv", "json"], default="markdown", help="Output format")
    parser.add_argument("--output", type=str, default=None, help="Output file path (prints to stdout if omitted)")
    parser.add_argument("--lang", type=str, choices=["ko", "en", "ja"], default="ko", help="Language selection for bilingual fields")
    parser.add_argument("--limit", type=int, default=None, help="Maximum number of issues to export")
    parser.add_argument("--target-dir", type=str, default=None, help="Explicit tracker directory override")

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

    # Collect data files
    target_files = []
    if args.phase != "all":
        for f in os.listdir(data_dir):
            if f.startswith(args.phase) and f.endswith(".js"):
                target_files.append(os.path.join(data_dir, f))
    else:
        for f in sorted(os.listdir(data_dir)):
            if f.endswith(".js") and not f.startswith("qa_manifest"):
                target_files.append(os.path.join(data_dir, f))

    all_issues = []
    for filepath in target_files:
        issues = extract_all_issues(filepath)
        all_issues.extend(issues)

    # Apply filters
    filtered = []
    for item in all_issues:
        if args.status != "all" and item.get("status", "").lower() != args.status:
            continue
        if args.category and item.get("category", "").lower() != args.category.lower():
            continue
        filtered.append(item)

    # Sort by ID ascending
    filtered.sort(key=lambda x: x.get("id", 0))

    if args.limit and args.limit > 0:
        filtered = filtered[-args.limit:]

    # Generate Output
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    total = len(filtered)
    resolved = sum(1 for x in filtered if x.get("status") == "resolved")
    pending = total - resolved
    rate = (resolved / total * 100) if total > 0 else 100.0

    output_text = ""

    if args.format == "json":
        output_text = json.dumps(filtered, indent=2, ensure_ascii=False)

    elif args.format == "csv":
        import csv
        import io
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(["ID", "Date", "Platform", "Category", "Title", "Status", "Problem", "Solution", "Files"])
        for it in filtered:
            title = (it.get("title_en") if args.lang == "en" and it.get("title_en") else it.get("title", ""))
            prob = (it.get("problem_en") if args.lang == "en" and it.get("problem_en") else it.get("problem", ""))
            sol = (it.get("solution_en") if args.lang == "en" and it.get("solution_en") else it.get("solution", ""))
            files_str = ", ".join(it.get("files", []))
            writer.writerow([
                it.get("id"), it.get("date"), it.get("platformLabel", it.get("platform")),
                it.get("categoryLabel", it.get("category")), title, it.get("status"),
                prob, sol, files_str
            ])
        output_text = buf.getvalue()

    else:  # Markdown
        lines = []
        lines.append(f"# 📋 QA Issue Tracking & Verification Report")
        lines.append(f"")
        lines.append(f"> Generated at: `{now_str}` | Phase: `{args.phase}` | Status Filter: `{args.status}`")
        lines.append(f"")
        lines.append(f"| Total Issues | Resolved | Pending | Resolution Rate |")
        lines.append(f"| :---: | :---: | :---: | :---: |")
        lines.append(f"| **{total}** | **{resolved}** | **{pending}** | **{rate:.1f}%** |")
        lines.append(f"")
        lines.append(f"---")
        lines.append(f"")
        lines.append(f"## 📝 Detailed Issue Log")
        lines.append(f"")
        lines.append(f"| #ID | Date | Platform | Category | Title & Problem Summary | Status | Resolution / Applied Fix |")
        lines.append(f"| :---: | :---: | :---: | :---: | :--- | :---: | :--- |")

        for it in filtered:
            iid = it.get("id", "-")
            phase_prefix = f"<small style='color:gray;'>[{it.get('phase')}]</small> " if it.get("phase") else ""
            id_col = f"{phase_prefix}#{iid}"
            dt = it.get("date", "-")
            plat = it.get("platformLabel", it.get("platform", "Universal"))
            cat = it.get("categoryLabel", it.get("category", "General"))
            status = "✅ Resolved" if it.get("status") == "resolved" else "⏳ Pending"
            
            title = (it.get("title_en") if args.lang == "en" and it.get("title_en") else it.get("title", "")).replace("|", "\\|")
            problem = (it.get("problem_en") if args.lang == "en" and it.get("problem_en") else it.get("problem", "")).replace("|", "\\|")
            solution = (it.get("solution_en") if args.lang == "en" and it.get("solution_en") else it.get("solution", "")).replace("|", "\\|")

            title_col = f"**{title}**"
            if it.get("screenshots"):
                title_col += f" <small style='color:#7950F2;'>🖼️ {len(it['screenshots'])}</small>"
            if problem:
                title_col += f"<br><small style='color:gray;'>{problem}</small>"

            sol_col = f"{solution}"
            if it.get("files"):
                code_files = " ".join([f"`{os.path.basename(f)}`" for f in it["files"][:3]])
                sol_col += f"<br><small>📂 {code_files}</small>"

            lines.append(f"| {id_col} | {dt} | {plat} | {cat} | {title_col} | {status} | {sol_col} |")

        lines.append("")
        output_text = "\n".join(lines)

    if args.output:
        out_path = os.path.abspath(args.output)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(output_text)
        print(f"[SUCCESS] Exported {total} QA issues to: {out_path}")
    else:
        print(output_text)

if __name__ == "__main__":
    main()
