#!/usr/bin/env python3
"""
Universal QA Issue Tracker - Issue Injection CLI Tool
Safely appends a new QA issue with auto-incremented ID (global or per-phase),
atomic backup/rollback, manifest synchronization, git auto-fill, and screenshot support.
"""

import os
import re
import sys
import json
import shutil
import argparse
import subprocess
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

def extract_all_issue_ids(content):
    """Extracts all numeric issue IDs from JSON-like object definitions."""
    matches = re.findall(r'(?:[{,\n]\s*["\']id["\']\s*:\s*(\d+))', content)
    return [int(m) for m in matches] if matches else []

def extract_highest_id(content):
    """Finds highest numeric issue ID from file content."""
    ids = extract_all_issue_ids(content)
    return max(ids) if ids else 0

def extract_highest_global_id(data_dir):
    """Finds highest numeric issue ID across ALL dataset files in data directory."""
    highest = 0
    if not os.path.isdir(data_dir):
        return 0
    for f in os.listdir(data_dir):
        if f.endswith(".js") and not f.startswith("qa_manifest"):
            try:
                with open(os.path.join(data_dir, f), "r", encoding="utf-8") as fp:
                    content = fp.read()
                    ids = extract_all_issue_ids(content)
                    if ids:
                        file_max = max(ids)
                        if file_max > highest:
                            highest = file_max
            except Exception:
                continue
    return highest

def extract_git_context():
    """Extracts recent commit message and modified files from git if available."""
    info = {"title": None, "files": []}
    try:
        # Get latest commit subject
        res = subprocess.run(["git", "log", "-1", "--pretty=%s"], capture_output=True, text=True, check=True)
        subject = res.stdout.strip()
        if subject:
            info["title"] = subject

        # Get changed files in latest commit
        res_files = subprocess.run(["git", "diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"], capture_output=True, text=True, check=True)
        files = [line.strip() for line in res_files.stdout.splitlines() if line.strip()]
        if files:
            info["files"] = files
        else:
            # Fallback to unstaged/staged working tree files
            res_status = subprocess.run(["git", "diff", "--name-only", "HEAD"], capture_output=True, text=True)
            status_files = [l.strip() for l in res_status.stdout.splitlines() if l.strip()]
            if status_files:
                info["files"] = status_files
    except Exception:
        pass
    return info

def update_manifest_badge(manifest_path, phase_id, new_total):
    """Updates the count badge in qa_manifest.js if it exists."""
    if not os.path.exists(manifest_path):
        return

    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            text = f.read()

        # Update pattern like: badge: 'v1.0.37 (362건 100% 해결)', or badge: 'Phase 1 (1 items)'
        updated = re.sub(
            r"(id:\s*['\"]" + re.escape(phase_id) + r"['\"][^}]+?badge:\s*['\"][^'\"]*?\()(\d+)(건| items)",
            lambda m: f"{m.group(1)}{new_total}{m.group(3)}",
            text,
            flags=re.DOTALL
        )

        with open(manifest_path, "w", encoding="utf-8") as f:
            f.write(updated)
    except Exception as e:
        print(f"[!] Warning: Could not update manifest badge: {e}")

def main():
    parser = argparse.ArgumentParser(description="Add a new QA issue safely.")
    parser.add_argument("--phase", type=str, default="phase1", help="Target phase ID (e.g. phase1, phase2)")
    parser.add_argument("--title", type=str, default=None, help="Issue title / summary")
    parser.add_argument("--problem", type=str, default="", help="Detailed problem description")
    parser.add_argument("--solution", type=str, default="", help="Applied solution")
    parser.add_argument("--cause", type=str, default="", help="Root cause analysis")
    parser.add_argument("--category", type=str, default="core", help="Category code (reliability, core, ui, perf, media, monetization, auth, db)")
    parser.add_argument("--category-label", type=str, default=None, help="Category display label (e.g. 🎨 UI, ⚡ Core)")
    parser.add_argument("--severity", type=str, choices=["S1", "S2", "S3", "S4", "S5"], default=None, help="Issue severity (S1=Blocker, S2=Critical, S3=Major, S4=Minor, S5=Trivial)")
    parser.add_argument("--platform", type=str, default="all", help="Platform (all, ios, android, web, backend)")
    parser.add_argument("--platform-label", type=str, default=None, help="Platform display label")
    parser.add_argument("--files", nargs="*", default=[], help="List of modified files")
    parser.add_argument("--actions", nargs="*", default=[], help="Action item list")
    parser.add_argument("--status", type=str, default="resolved", choices=["resolved", "pending"], help="Issue status")
    parser.add_argument("--date", type=str, default=None, help="Date (YYYY-MM-DD), default: today")
    parser.add_argument("--title-en", type=str, default=None, help="Optional English title for dual language")
    parser.add_argument("--problem-en", type=str, default=None, help="Optional English problem description")
    parser.add_argument("--solution-en", type=str, default=None, help="Optional English solution")
    parser.add_argument("--screenshots", nargs="*", default=[], help="Screenshot image paths or URLs")
    parser.add_argument("--from-git", action="store_true", help="Auto-populate title and modified files from latest git commit / working tree")
    parser.add_argument("--phase-id", dest="global_id", action="store_false", default=False, help="Increment ID per-phase starting from 1 (default: True)")
    parser.add_argument("--global-id", dest="global_id", action="store_true", help="Continuously increment ID across all phases")
    parser.add_argument("--target-dir", type=str, default=None, help="Explicit tracker directory override")

    args = parser.parse_args()
    project_root = os.getcwd()

    # Git auto-fill
    if args.from_git:
        git_ctx = extract_git_context()
        if not args.title and git_ctx.get("title"):
            args.title = git_ctx["title"]
            print(f"[*] Auto-filled title from git: {args.title}")
        if not args.files and git_ctx.get("files"):
            args.files = git_ctx["files"]
            print(f"[*] Auto-filled {len(args.files)} files from git: {args.files[:3]}")

    if not args.title:
        print("[ERROR] --title is required (or specify --from-git with an active git history).")
        sys.exit(1)

    tracker_dir = args.target_dir or find_tracker_dir(project_root)
    if not tracker_dir or not os.path.isdir(tracker_dir):
        print("[ERROR] Could not find QA tracker directory. Please run init_tracker.py first.")
        sys.exit(1)

    data_dir = os.path.join(tracker_dir, "data")
    if not os.path.isdir(data_dir):
        print(f"[ERROR] 'data' directory not found inside: {tracker_dir}")
        sys.exit(1)

    # Locate target phase file
    target_filename = None
    for f in os.listdir(data_dir):
        if f.startswith(args.phase) and f.endswith(".js"):
            target_filename = f
            break

    if not target_filename:
        # Fallback to exact or phase1
        fallback = f"{args.phase}_issues.js"
        if os.path.exists(os.path.join(data_dir, fallback)):
            target_filename = fallback
        else:
            print(f"[ERROR] Target phase file for '{args.phase}' not found in {data_dir}")
            sys.exit(1)

    target_file = os.path.join(data_dir, target_filename)
    backup_file = target_file + ".bak"

    with open(target_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Calculate new ID (Global vs Phase)
    existing_ids = extract_all_issue_ids(content)
    if existing_ids:
        sorted_ids = sorted(existing_ids)
        expected = set(range(sorted_ids[0], sorted_ids[-1] + 1))
        missing = sorted(list(expected - set(existing_ids)))
        if missing:
            print(f"[!] WARNING: Target phase file has {len(missing)} sequence gap(s): {missing[:5]}{'...' if len(missing) > 5 else ''}")

    if args.global_id:
        highest_id = extract_highest_global_id(data_dir)
    else:
        highest_id = extract_highest_id(content)

    new_id = highest_id + 1
    issue_date = args.date or datetime.now().strftime("%Y-%m-%d")

    # ISO/IEC 25010 Standard Quality Domains & Robust Alias Normalization
    STANDARD_DOMAINS = ["reliability", "core", "ui", "perf", "media", "monetization", "auth", "db"]
    STANDARD_CATEGORY_LABELS = {
        "reliability": "🛡️ Reliability",
        "core": "⚡ Core",
        "ui": "🎨 UI/UX",
        "perf": "🚀 Perf",
        "media": "🎙️ Media",
        "monetization": "💰 Monetization",
        "auth": "🔒 Auth/Security",
        "db": "💾 Database"
    }
    CATEGORY_ALIASES = {
        "crash": "reliability", "bug": "reliability", "stability": "reliability",
        "logic": "core", "feature": "core", "func": "core", "functional": "core",
        "editor": "core", "route": "core", "governance": "core", "setting": "core", "settings": "core",
        "ui_ux": "ui", "design": "ui", "theme": "ui", "widget": "ui", "modal": "ui", "ux": "ui", "i18n": "ui",
        "performance": "perf", "navigation": "perf", "architecture": "perf", "arch": "perf", "refactor": "perf", "enhancement": "perf",
        "voice": "media",
        "legal": "monetization", "release": "monetization",
        "security": "auth",
        "data": "db"
    }

    raw_cat = (args.category or "core").strip().lower()
    category = raw_cat if raw_cat in STANDARD_DOMAINS else CATEGORY_ALIASES.get(raw_cat, "core")
    cat_label = args.category_label or STANDARD_CATEGORY_LABELS.get(category, "⚡ Core")

    # Severity deduction if not explicitly provided
    severity = args.severity
    if not severity:
        text_corpus = f"{args.title} {args.problem} {args.cause}".lower()
        cat = args.category.lower()
        s1_keys = ["크래시", "crash", "freeze", "프리징", "유실", "loss", "reject", "스토어 심사", "404", "비정상 종료", "먹통", "붕괴"]
        s5_keys = ["400줄", "거버넌스", "refactor", "리팩토링", "정리", "가이드", "목차", "테스트 코드", "cleanup"]
        s2_keys = ["동기화", "sync", "알림 권한", "sqlite", "db", "저장 실패", "누락", "backhandler", "쿼터", "실패", "인앱결제", "결제"]
        if any(k in text_corpus for k in s1_keys) or cat in ["crash", "bug"]:
            severity = "S1"
        elif any(k in text_corpus for k in s5_keys) or "governance" in cat:
            severity = "S5"
        elif any(k in text_corpus for k in s2_keys) or cat in ["reliability", "db", "auth"]:
            severity = "S2"
        elif cat in ["ui", "ui_ux", "design", "i18n"]:
            severity = "S4"
        else:
            severity = "S3"

    sev_labels = {
        "S1": "🚨 S1 Blocker",
        "S2": "🔥 S2 Critical",
        "S3": "⚡ S3 Major",
        "S4": "🌱 S4 Minor",
        "S5": "☕ S5 Trivial"
    }

    # Construct issue object
    issue_obj = {
        "id": new_id,
        "phase": args.phase,
        "date": issue_date,
        "severity": severity,
        "severityLabel": sev_labels[severity],
        "platform": args.platform,
        "platformLabel": args.platform_label or ("🌐 Universal" if args.platform == "all" else args.platform.upper()),
        "category": category,
        "categoryLabel": cat_label,
        "title": args.title,
        "problem": args.problem,
        "solution": args.solution,
        "files": args.files,
        "status": args.status,
        "cause": args.cause,
        "actions": args.actions if args.actions else [f"1. {args.solution}"]
    }

    if args.title_en:
        issue_obj["title_en"] = args.title_en
    if args.problem_en:
        issue_obj["problem_en"] = args.problem_en
    if args.solution_en:
        issue_obj["solution_en"] = args.solution_en
    if args.screenshots:
        issue_obj["screenshots"] = args.screenshots

    # Find closing array bracket ];
    last_bracket_idx = content.rfind("];")
    if last_bracket_idx == -1:
        print("[ERROR] Malformed dataset file: missing closing bracket '];'")
        sys.exit(1)

    # Prepare atomic backup
    shutil.copy2(target_file, backup_file)

    try:
        # Check if previous array is empty
        array_prefix = content[:last_bracket_idx].rstrip()
        needs_comma = not array_prefix.endswith("[") and not array_prefix.endswith("[ ")

        formatted_issue = "  " + json.dumps(issue_obj, ensure_ascii=False, indent=4).replace("\n", "\n  ")
        separator = ",\n" if needs_comma else "\n"
        new_content = array_prefix + separator + formatted_issue + "\n];\n"

        # Update header total count if present
        phase_count = len(extract_all_issue_ids(new_content))
        new_content = re.sub(
            r"Total Issues:\s*(\d+)",
            f"Total Issues: {phase_count}",
            new_content
        )

        with open(target_file, "w", encoding="utf-8") as f:
            f.write(new_content)

        # Automated Zero-Syntax-Error Verification Gate
        import subprocess
        try:
            chk = subprocess.run(["node", "--check", target_file], capture_output=True, text=True, timeout=5)
            if chk.returncode != 0:
                print(f"[FATAL] JavaScript syntax error detected in {target_filename} after append! Rolling back...")
                print(chk.stderr)
                if os.path.exists(backup_file):
                    shutil.copy2(backup_file, target_file)
                    os.remove(backup_file)
                sys.exit(1)
        except Exception:
            pass

        # Update manifest
        manifest_path = os.path.join(data_dir, "qa_manifest.js")
        update_manifest_badge(manifest_path, args.phase, phase_count)

        # Remove backup upon success
        if os.path.exists(backup_file):
            os.remove(backup_file)

        print(f"[SUCCESS] Registered QA Issue #{new_id} in {target_filename}")
        print(f" - Phase: {args.phase}")
        print(f" - Title: {args.title}")
        print(f" - Status: {args.status}")
        print(f" - Category: {cat_label}")
        if args.screenshots:
            print(f" - Screenshots: {len(args.screenshots)} attached")
        print(f" - Target: {target_file}")

    except Exception as e:
        # Rollback on error
        if os.path.exists(backup_file):
            shutil.copy2(backup_file, target_file)
            os.remove(backup_file)
        print(f"[FATAL] Error while writing issue. Transaction rolled back: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
