#!/usr/bin/env python3
"""
manage_rules.py
Manages the Refined Agent Golden Rules section in rulebook files (GEMINI.md, CLAUDE.md).
Handles deduplication, Hit count incrementing, descending frequency sorting, and a 7-rule quota cap.
"""

import os
import sys
import re
import argparse
import json
from pathlib import Path

# Force UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
        sys.stdin.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

SECTION_HEADER = "### 🚫 REFINED AGENT GOLDEN RULES (오답노트 누적 승격 룰 Top 10)"
SECTION_DESC = "> 💡 세션 복기를 통해 2회 이상 반복 지적된 실수만 엄선하여 빈도순으로 자동 정렬된 최우선 준수 규칙입니다."

def parse_existing_rules(content):
    """Extracts existing rules from the markdown table under the golden rules section."""
    rules = []
    
    # Regex to find the golden rules section
    pattern = r"### 🚫 REFINED AGENT GOLDEN RULES.*?\n([\s\S]*?)(?=\n##|\n###|\Z)"
    match = re.search(pattern, content)
    if not match:
        return rules, -1, -1

    section_text = match.group(0)
    start_pos = match.start()
    end_pos = match.end()

    # Parse markdown table lines
    lines = section_text.splitlines()
    for line in lines:
        line_clean = line.strip()
        if not line_clean.startswith("|") or "우선순위" in line_clean or "---" in line_clean:
            continue
        
        cols = [c.strip() for c in line_clean.split("|")[1:-1]]
        if len(cols) >= 4:
            priority = cols[0]
            code = cols[1].replace("`", "").strip()
            hits_str = cols[2]
            hits_match = re.search(r"(\d+)", hits_str)
            hits = int(hits_match.group(1)) if hits_match else 1
            rule_text = cols[3]
            
            rules.append({
                "priority": priority,
                "code": code,
                "hits": hits,
                "rule_text": rule_text
            })

    return rules, start_pos, end_pos

def format_rules_table(rules, cap=10):
    """Formats the rules list into a clean sorted markdown table, capping at max items."""
    # Sort rules by Hits descending
    rules.sort(key=lambda r: r["hits"], reverse=True)

    active_rules = rules[:cap]
    retired_rules = rules[cap:]

    # Re-assign priority badges
    for idx, r in enumerate(active_rules):
        if r["hits"] >= 3 or idx <= 1:
            r["priority"] = "**P0**"
            r["badge"] = f"🔥 **{r['hits']}회**"
        elif r["hits"] == 2 or idx <= 4:
            r["priority"] = "**P1**"
            r["badge"] = f"⚠️ **{r['hits']}회**"
        else:
            r["priority"] = "P2"
            r["badge"] = f"{r['hits']}회"

    table_lines = [
        SECTION_HEADER,
        SECTION_DESC,
        "",
        "| 우선순위 | 룰 코드 | 발생 빈도 | 범용 행동 수칙 (Golden Rule) |",
        "| :---: | :--- | :---: | :--- |"
    ]

    for r in active_rules:
        table_lines.append(f"| {r['priority']} | `{r['code']}` | {r['badge']} | {r['rule_text']} |")

    return "\n".join(table_lines), retired_rules

def resolve_incubator_path(workspace_dir):
    """Resolves the rule-incubator.md path in the project documentation directory."""
    ws = Path(workspace_dir)
    if (ws / "01.Docs" / "00_Retrospectives").exists():
        return ws / "01.Docs" / "00_Retrospectives" / "rule-incubator.md"
    elif (ws / "docs" / "retrospectives").exists():
        return ws / "docs" / "retrospectives" / "rule-incubator.md"
    elif (ws / "01.Docs").exists():
        p = ws / "01.Docs" / "00_Retrospectives"
        p.mkdir(parents=True, exist_ok=True)
        return p / "rule-incubator.md"
    else:
        p = ws / "docs" / "retrospectives"
        p.mkdir(parents=True, exist_ok=True)
        return p / "rule-incubator.md"

def upsert_candidate_incubator(workspace_dir, rule_code, rule_text, date_str=None, rule_file_path=None):
    """Inserts a candidate rule into rule-incubator.md and auto-promotes to GEMINI.md if hits >= 2."""
    date_str = date_str or datetime.now().strftime("%Y-%m-%d")
    incubator_path = resolve_incubator_path(workspace_dir)

    header = """# 🧪 Rule Incubator (골든 룰 후보 감시 목록)

> 1회 발생하여 아직 메인 룰북에 승격되지 않은 후보 룰 목록입니다.
> 동일/유사 실수가 2회 이상 누적 감지되면 자동으로 `GEMINI.md` Top 10 골든 룰로 승격됩니다.

| 최초 등록일 | 룰 코드 | 발생 횟수 | 후보 행동 수칙 | 최근 상태 |
| :---: | :--- | :---: | :--- | :---: |"""

    rows = []
    promoted = False

    if not incubator_path.exists():
        initial_row = f"| **{date_str}** | `{rule_code}` | 1회 | {rule_text} | 💡 감시 중 (Watching) |"
        with open(incubator_path, "w", encoding="utf-8") as f:
            f.write(f"{header}\n{initial_row}\n")
        return {
            "status": "incubated",
            "incubator_file": str(incubator_path),
            "promoted": False,
            "hits": 1
        }

    with open(incubator_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    found = False
    in_table = False
    new_lines = []

    for line in lines:
        line_clean = line.strip()
        if "| :---: |" in line_clean:
            in_table = True
            new_lines.append(line)
            continue
        if in_table and line_clean.startswith("|"):
            cols = [c.strip() for c in line_clean.split("|")[1:-1]]
            if len(cols) >= 5:
                reg_date = cols[0]
                existing_code = cols[1].replace("`", "").strip()
                hits_str = cols[2]
                hits_match = re.search(r"(\d+)", hits_str)
                hits = int(hits_match.group(1)) if hits_match else 1
                existing_text = cols[3]
                status = cols[4]

                if is_similar_rule(existing_code, existing_text, rule_code, rule_text):
                    hits += 1
                    found = True
                    if hits >= 2:
                        status = "🔥 **GEMINI.md 승격 완료 (Promoted)**"
                        promoted = True
                    new_line = f"| {reg_date} | `{rule_code}` | {hits}회 | {rule_text} | {status} |\n"
                    new_lines.append(new_line)
                    continue

        new_lines.append(line)

    if not found:
        new_row = f"| **{date_str}** | `{rule_code}` | 1회 | {rule_text} | 💡 감시 중 (Watching) |\n"
        new_lines.append(new_row)

    with open(incubator_path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)

    # Auto-promote to GEMINI.md if hits reached 2
    if promoted and rule_file_path:
        upsert_golden_rule(rule_file_path, rule_code, rule_text, hits_to_add=2, workspace_dir=workspace_dir)

    return {
        "status": "promoted" if promoted else "incubated",
        "incubator_file": str(incubator_path),
        "promoted": promoted,
        "hits": 2 if promoted else 1
    }

def resolve_retired_archive_path(workspace_dir):
    """Resolves the retired-rules-archive.md path in the project documentation directory."""
    ws = Path(workspace_dir)
    if (ws / "01.Docs" / "00_Retrospectives").exists():
        return ws / "01.Docs" / "00_Retrospectives" / "retired-rules-archive.md"
    elif (ws / "docs" / "retrospectives").exists():
        return ws / "docs" / "retrospectives" / "retired-rules-archive.md"
    elif (ws / "01.Docs").exists():
        p = ws / "01.Docs" / "00_Retrospectives"
        p.mkdir(parents=True, exist_ok=True)
        return p / "retired-rules-archive.md"
    else:
        p = ws / "docs" / "retrospectives"
        p.mkdir(parents=True, exist_ok=True)
        return p / "retired-rules-archive.md"

def archive_retired_rules(workspace_dir, retired_rules):
    """Appends retired rules to the standalone retired-rules-archive.md file."""
    if not retired_rules or not workspace_dir:
        return

    archive_path = resolve_retired_archive_path(workspace_dir)

    header = """# 🎓 Retired Rules Archive (체화 완료 골든 룰 명예의 전당)

> 10개 정원제 캡으로 인해 졸업한, 완전히 체화된 과거 골든 룰 영구 보관 아카이브입니다.
> 언제든 필요 시 복기하거나 회고할 때 참조할 수 있습니다.

| 졸업 일자 | 룰 코드 | 최종 빈도 | 행동 수칙 |
| :---: | :--- | :---: | :--- |"""

    content = ""
    if not archive_path.exists():
        content = f"{header}\n"
    else:
        with open(archive_path, "r", encoding="utf-8") as f:
            content = f.read()

    today_str = datetime.now().strftime("%Y-%m-%d")
    for r in retired_rules:
        row = f"| **{today_str}** | `{r['code']}` | {r['hits']}회 | {r['rule_text']} |"
        if r['code'] not in content:
            content += f"{row}\n"

    with open(archive_path, "w", encoding="utf-8") as f:
        f.write(content)

def print_audit_checklist(rule_file_path):
    """Outputs a pre-flight checklist of current active golden rules for AI agents."""
    path = Path(rule_file_path)
    if not path.exists():
        print("No rule file found for audit.")
        return

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    rules, _, _ = parse_existing_rules(content)
    print("## 🛡️ Pre-Flight Golden Rules Self-Audit")
    print("> 작업 완료 보고 직전, 아래 골든 룰 위반 여부를 스스로 점검하십시오:\n")
    for r in rules:
        print(f"- [ ] **[{r['code']}]** ({r['hits']}회 주의) {r['rule_text']}")

def extract_keywords(text):
    """Extracts meaningful alphanumeric and Korean keywords for similarity matching."""
    tokens = re.findall(r"[a-zA-Z0-9가-힣]+", text.lower())
    # Filter short stop words
    return set(t for t in tokens if len(t) >= 2)

def is_similar_rule(code_a, text_a, code_b, text_b, threshold=0.45):
    """Determines if two rules represent the same underlying intent."""
    # 1. Exact code match
    if code_a.strip().lower() == code_b.strip().lower():
        return True

    # 2. Category token match (e.g. RULE-I18N-SYNC vs RULE-I18N-PARITY)
    parts_a = set(code_a.lower().split("-"))
    parts_b = set(code_b.lower().split("-"))
    common_parts = parts_a.intersection(parts_b) - {"rule"}
    if common_parts:
        # If they share a specific category token like 'i18n' or 'surgical'
        return True

    # 3. Text keyword Jaccard similarity
    kw_a = extract_keywords(text_a)
    kw_b = extract_keywords(text_b)
    if not kw_a or not kw_b:
        return False

    intersection = kw_a.intersection(kw_b)
    union = kw_a.union(kw_b)
    similarity = len(intersection) / len(union)
    return similarity >= threshold

def upsert_golden_rule(rule_file_path, rule_code, rule_text, hits_to_add=1, cap=10, workspace_dir=None):
    """Inserts or updates a golden rule in the target markdown file with auto-merging."""
    path = Path(rule_file_path)
    if not path.exists():
        content = f"# Agent Guidelines\n\n{SECTION_HEADER}\n"
    else:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

    rules, start_pos, end_pos = parse_existing_rules(content)
    
    # Check if rule already exists or is similar (Auto-Merge & Update)
    merged_target = None
    for r in rules:
        if is_similar_rule(r["code"], r["rule_text"], rule_code, rule_text):
            r["hits"] += hits_to_add
            # Refine rule description with the latest, more comprehensive wording
            r["rule_text"] = rule_text
            # Preserve primary code or update to standard
            if rule_code.startswith("RULE-"):
                r["code"] = rule_code
            merged_target = r
            break

    if not merged_target:
        rules.append({
            "priority": "P1",
            "code": rule_code,
            "hits": hits_to_add,
            "rule_text": rule_text
        })

    new_section_text, retired = format_rules_table(rules, cap)

    if start_pos != -1 and end_pos != -1:
        new_content = content[:start_pos] + new_section_text + content[end_pos:]
    else:
        new_content = content.rstrip() + "\n\n" + new_section_text + "\n"

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)

    if retired and workspace_dir:
        archive_retired_rules(workspace_dir, retired)

    return {
        "status": "success",
        "target_file": str(path),
        "total_active_rules": min(len(rules), cap),
        "retired_rules": retired
    }

def main():
    parser = argparse.ArgumentParser(description="Manage agent golden rules table.")
    parser.add_argument("--file", help="Path to rulebook file (e.g. GEMINI.md)", default=None)
    parser.add_argument("--code", help="Rule code (e.g. RULE-I18N-SYNC)", default=None)
    parser.add_argument("--text", help="Rule description text", default=None)
    parser.add_argument("--hits", type=int, help="Hits to add/set (default: 1)", default=1)
    parser.add_argument("--cap", type=int, help="Maximum number of rules in table (default: 10)", default=10)
    parser.add_argument("--workspace", help="Project workspace directory for archive", default=os.getcwd())
    parser.add_argument("--candidate", action="store_true", help="Register as a candidate rule in rule-incubator.md")
    parser.add_argument("--date", help="Date in YYYY-MM-DD", default=None)
    parser.add_argument("--audit", action="store_true", help="Print pre-flight audit checklist")
    args = parser.parse_args()

    if args.audit:
        if not args.file:
            parser.error("--file is required for audit")
        print_audit_checklist(args.file)
        return

    if not args.code or not args.text:
        parser.error("--code and --text are required when not using --audit")

    if args.candidate:
        # Incubate candidate rule
        result = upsert_candidate_incubator(args.workspace, args.code, args.text, args.date, args.file)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return

    if not args.file:
        parser.error("--file is required when promoting a golden rule")

    result = upsert_golden_rule(args.file, args.code, args.text, args.hits, args.cap, args.workspace)
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
