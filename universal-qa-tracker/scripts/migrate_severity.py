#!/usr/bin/env python3
"""
Universal QA Issue Tracker - 5-Level Severity Migration Script
Classifies existing issues into S1, S2, S3, S4, S5 based on IEEE/ISTQB criteria.
Supports multi-track and custom target-file arguments.
"""

import os
import sys
import json
import re
import shutil
import argparse

# Ensure UTF-8 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)
from audit_qa import extract_all_issues_from_file

S1_KEYWORDS = ["크래시", "crash", "freeze", "프리징", "유실", "loss", "reject", "스토어 심사", "404", "비정상 종료", "먹통", "붕괴"]
S5_KEYWORDS = ["400줄", "거버넌스", "refactor", "리팩토링", "정리", "가이드", "목차", "테스트 코드", "cleanup"]
S2_KEYWORDS = ["동기화", "sync", "알림 권한", "sqlite", "db", "저장 실패", "누락", "backhandler", "쿼터", "실패", "인앱결제", "결제"]

SEVERITY_LABELS = {
    "S1": "🚨 S1 Blocker",
    "S2": "🔥 S2 Critical",
    "S3": "⚡ S3 Major",
    "S4": "🌱 S4 Minor",
    "S5": "☕ S5 Trivial"
}

def migrate_file(filepath):
    if not os.path.exists(filepath):
        print(f"[ERROR] Target file not found: {filepath}")
        return False

    issues = extract_all_issues_from_file(filepath)
    print(f"[*] Read {len(issues)} issues from {os.path.basename(filepath)}")

    counts = {"S1": 0, "S2": 0, "S3": 0, "S4": 0, "S5": 0}
    migrated_issues = []

    for item in issues:
        text_corpus = f"{item.get('title', '')} {item.get('problem', '')} {item.get('cause', '')}".lower()
        cat = (item.get("category") or "").lower()

        if any(k in text_corpus for k in S1_KEYWORDS) or cat in ["crash", "bug"]:
            sev = "S1"
        elif any(k in text_corpus for k in S5_KEYWORDS) or "governance" in cat:
            sev = "S5"
        elif any(k in text_corpus for k in S2_KEYWORDS) or cat in ["reliability", "db", "auth"]:
            sev = "S2"
        elif cat in ["ui"] or "ui" in text_corpus or "design" in text_corpus or "padding" in text_corpus:
            sev = "S4"
        else:
            sev = "S3"

        counts[sev] += 1
        item["severity"] = sev
        item["severityLabel"] = SEVERITY_LABELS[sev]
        migrated_issues.append(item)

    print("\n[MIGRATION DISTRIBUTION SUMMARY]")
    for s in ["S1", "S2", "S3", "S4", "S5"]:
        print(f" - {SEVERITY_LABELS[s]}: {counts[s]} items ({counts[s]/len(issues)*100:.1f}%)" if issues else f" - {SEVERITY_LABELS[s]}: 0 items")

    # Read original file to detect variable assignment pattern
    with open(filepath, "r", encoding="utf-8") as f:
        orig = f.read()

    match = re.search(r'^(window\.[A-Za-z0-9_\.]+\s*=\s*)', orig, re.MULTILINE)
    prefix = match.group(1) if match else "window.UNIVERSAL_QA.DATA['phase1'] = "

    # Create backup
    bak = filepath + ".bak"
    shutil.copy2(filepath, bak)

    # Write migrated dataset
    formatted = json.dumps(migrated_issues, indent=2, ensure_ascii=False)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(f"/**\n * Universal QA Dataset - Migrated to 5-Level IEEE Severity\n */\n{prefix}{formatted};\n")

    print(f"\n[SUCCESS] Successfully migrated {filepath}")
    print(f" - Backup created at: {bak}")
    return True

def main():
    parser = argparse.ArgumentParser(description="Migrate QA dataset to 5-level IEEE severity standards.")
    parser.add_argument("--file", type=str, default=None, help="Specific dataset file to migrate")
    parser.add_argument("--tracker-dir", type=str, default=None, help="Tracker root directory")
    args = parser.parse_args()

    if args.file:
        migrate_file(args.file)
    else:
        tracker = args.tracker_dir or os.path.dirname(script_dir)
        default_file = os.path.join(tracker, "data", "phase1_closed_testing.js")
        if not os.path.exists(default_file):
            default_file = os.path.join(tracker, "data", "phase1_issues.js")
        migrate_file(default_file)

if __name__ == "__main__":
    main()
