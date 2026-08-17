#!/usr/bin/env python3
"""
Agent-Friendly Rules Linter (lint_rules.py)
Automated auditor that scores and checks CLAUDE.md / GEMINI.md / AGENTS.md rulebooks
for LLM attention-weight compliance, constraint clarity, and mandatory directives.
"""

import os
import sys
import re
import json
import argparse
from pathlib import Path
from typing import Dict, List, Any, Tuple

# Windows Unicode stdout safety
if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Common weak words that lower LLM instruction compliance
WEAK_WORDS_PATTERNS = [
    (r"\bshould\b", "Ambiguous advice ('should') - replace with 'MUST' or 'DO NOT'"),
    (r"\brecommended\b", "Weak suggestion ('recommended') - replace with 'MANDATORY' or 'REQUIRED'"),
    (r"\bif possible\b", "Optional clause ('if possible') - state definitive boundaries"),
    (r"\bplease\b", "Polite tone ('please') - use imperative command tone"),
    (r"가능하면", "모호한 권유 표현 ('가능하면') - '반드시' 또는 '절대 금지'로 변경 권장"),
    (r"권장", "권유형 표현 ('권장') - '필수' 또는 '의무'로 명시 권장"),
    (r"바랍니다", "완곡한 청유형 ('바랍니다') - '하십시오' 또는 단정적 명령문 사용 권장"),
    (r"좋겠습니다", "완곡한 희망형 ('좋겠습니다') - 단정적 명령문 사용 권장"),
]

CORE_DIRECTIVES = [
    {
        "id": "NO_ASSUMPTIONS",
        "name": "No Assumptions / Clarification First",
        "patterns": [r"assumption", r"arbitrary", r"지레짐작", r"임의", r"추측"],
        "weight": 10
    },
    {
        "id": "SURGICAL_EDITS",
        "name": "Surgical Edits Only (Minimal Scope)",
        "patterns": [r"surgical", r"minimal scope", r"최소 범위", r"범위 외", r"unsolicited refactor"],
        "weight": 10
    },
    {
        "id": "VERIFICATION_LOOP",
        "name": "Synchronous Verification Loop (tsc / build / test)",
        "patterns": [r"tsc", r"npm run build", r"verification", r"검증", r"컴파일", r"build"],
        "weight": 10
    },
    {
        "id": "RESTRICTED_BEHAVIOR",
        "name": "Restricted Behaviors (UI Blocking / Infinite Polling)",
        "patterns": [r"alert\(", r"infinite loop", r"polling", r"schedule", r"폴링", r"대화상자"],
        "weight": 5
    }
]

def find_rule_file(target_path: str) -> Path:
    p = Path(target_path).resolve()
    if p.is_file():
        return p
    if p.is_dir():
        candidates = ["GEMINI.md", "CLAUDE.md", "AGENTS.md", ".cursorrules", "rules.md"]
        for c in candidates:
            candidate_path = p / c
            if candidate_path.is_file():
                return candidate_path
        # Also check subfolder .agents or config
        for c in candidates:
            sub = p / ".agents" / c
            if sub.is_file():
                return sub
    raise FileNotFoundError(f"Could not locate a valid rule file in: {target_path}")

def analyze_rulebook(filepath: Path) -> Dict[str, Any]:
    content = filepath.read_text(encoding="utf-8", errors="ignore")
    lines = content.splitlines()
    total_lines = len(lines)
    word_count = len(content.split())
    estimated_tokens = int(word_count * 1.3)

    score = 0
    checks = []
    recommendations = []

    # 1. Structural Checks: DO NOT / DO separation (40 pts)
    has_do_not = bool(re.search(r"(DO NOT|절대 금지|CRITICAL CONSTRAINTS|PROHIBITED)", content, re.IGNORECASE))
    has_do = bool(re.search(r"(\bDO\b|필수 수행|MANDATORY ACTIONS|REQUIRED)", content, re.IGNORECASE))

    if has_do_not:
        score += 20
        checks.append({"name": "🔴 DO NOT (Critical Constraints) Section", "passed": True, "score": 20, "max": 20})
    else:
        checks.append({"name": "🔴 DO NOT (Critical Constraints) Section", "passed": False, "score": 0, "max": 20})
        recommendations.append("Add a dedicated '### 🔴 DO NOT (CRITICAL CONSTRAINTS)' section with imperative prohibitions.")

    if has_do:
        score += 20
        checks.append({"name": "🟢 DO (Mandatory Actions) Section", "passed": True, "score": 20, "max": 20})
    else:
        checks.append({"name": "🟢 DO (Mandatory Actions) Section", "passed": False, "score": 0, "max": 20})
        recommendations.append("Add a dedicated '### 🟢 DO (MANDATORY ACTIONS)' section with mandatory instructions.")

    # 2. GitHub Alert Blocks: [!IMPORTANT] or [!WARNING] (15 pts)
    has_alert = bool(re.search(r"> \[!(IMPORTANT|WARNING|CAUTION|NOTE)\]", content))
    if has_alert:
        score += 15
        checks.append({"name": "GitHub Alert Blocks ([!IMPORTANT] / [!WARNING])", "passed": True, "score": 15, "max": 15})
    else:
        checks.append({"name": "GitHub Alert Blocks ([!IMPORTANT] / [!WARNING])", "passed": False, "score": 0, "max": 15})
        recommendations.append("Elevate highest-priority rules using '> [!IMPORTANT]' GitHub alert blocks.")

    # 3. Tabular Format for Commands/Tools (10 pts)
    has_table = bool(re.search(r"\|.*\|.*\|\n\|[-:| ]+\|", content))
    if has_table:
        score += 10
        checks.append({"name": "Tabular Command / Tool Formatting", "passed": True, "score": 10, "max": 10})
    else:
        checks.append({"name": "Tabular Command / Tool Formatting", "passed": False, "score": 0, "max": 10})
        recommendations.append("Convert command references and tool parameters into Markdown tables for higher LLM mapping accuracy.")

    # 4. Core Directives Evaluation (up to 35 pts)
    for directive in CORE_DIRECTIVES:
        found = False
        for pat in directive["patterns"]:
            if re.search(pat, content, re.IGNORECASE):
                found = True
                break
        if found:
            score += directive["weight"]
            checks.append({"name": f"Directive: {directive['name']}", "passed": True, "score": directive["weight"], "max": directive["weight"]})
        else:
            checks.append({"name": f"Directive: {directive['name']}", "passed": False, "score": 0, "max": directive["weight"]})
            recommendations.append(f"Include standard directive: {directive['name']}")

    # 5. Weak Words Penalty (-5 pts each, max -20 pts)
    weak_findings = []
    for line_idx, line in enumerate(lines, start=1):
        for pat, desc in WEAK_WORDS_PATTERNS:
            matches = list(re.finditer(pat, line, re.IGNORECASE))
            if matches:
                weak_findings.append({
                    "line": line_idx,
                    "text": line.strip(),
                    "desc": desc
                })

    weak_penalty = min(len(weak_findings) * 5, 20)
    score = max(0, score - weak_penalty)

    # Grading
    if score >= 90:
        grade = "A+ (Excellent)"
    elif score >= 80:
        grade = "A (Good)"
    elif score >= 70:
        grade = "B (Moderate)"
    elif score >= 50:
        grade = "C (Needs Optimization)"
    else:
        grade = "F (High Failure Risk)"

    return {
        "file": str(filepath),
        "total_lines": total_lines,
        "estimated_tokens": estimated_tokens,
        "score": score,
        "grade": grade,
        "checks": checks,
        "weak_findings": weak_findings,
        "recommendations": recommendations
    }

def format_terminal_output(result: Dict[str, Any]) -> str:
    out = []
    out.append("================================================================")
    out.append(f" 🛡️  Agent-Friendly Rules Audit: {Path(result['file']).name}")
    out.append("================================================================")
    out.append(f" File Path       : {result['file']}")
    out.append(f" Size / Tokens   : {result['total_lines']} lines (~{result['estimated_tokens']} tokens)")
    out.append(f" Health Score    : {result['score']} / 100 [{result['grade']}]")
    out.append("----------------------------------------------------------------")
    out.append(" Checklist Breakdown:")
    for c in result["checks"]:
        status = "✅ PASS" if c["passed"] else "❌ FAIL"
        out.append(f"  [{status}] {c['name']:<50} ({c['score']}/{c['max']} pts)")
    
    if result["weak_findings"]:
        out.append("----------------------------------------------------------------")
        out.append(f" ⚠️ Weak Words Detected ({len(result['weak_findings'])} occurrences, penalty applied):")
        for f in result["weak_findings"][:5]:
            out.append(f"  - Line {f['line']}: \"{f['text']}\" -> {f['desc']}")
        if len(result["weak_findings"]) > 5:
            out.append(f"  ... and {len(result['weak_findings']) - 5} more")

    if result["recommendations"]:
        out.append("----------------------------------------------------------------")
        out.append(" 💡 Actionable Fix Recommendations:")
        for idx, rec in enumerate(result["recommendations"], start=1):
            out.append(f"  {idx}. {rec}")
    out.append("================================================================")
    return "\n".join(out)

def format_markdown_output(result: Dict[str, Any]) -> str:
    md = []
    md.append(f"# 🛡️ Agent-Friendly Rules Audit Report: `{Path(result['file']).name}`")
    md.append("")
    md.append(f"- **Target File**: `{result['file']}`")
    md.append(f"- **Health Score**: **{result['score']} / 100** (`{result['grade']}`)")
    md.append(f"- **Token Overhead**: ~{result['estimated_tokens']} tokens ({result['total_lines']} lines)")
    md.append("")
    md.append("## Checklist Breakdown")
    md.append("")
    md.append("| Check Item | Status | Score |")
    md.append("| :--- | :---: | :--- |")
    for c in result["checks"]:
        status = "✅ Pass" if c["passed"] else "❌ Fail"
        md.append(f"| {c['name']} | {status} | {c['score']}/{c['max']} pts |")
    md.append("")
    if result["weak_findings"]:
        md.append("## ⚠️ Weak & Ambiguous Word Detections")
        md.append("")
        for f in result["weak_findings"]:
            md.append(f"- **Line {f['line']}**: `{f['text']}` — *{f['desc']}*")
        md.append("")
    if result["recommendations"]:
        md.append("## 💡 Actionable Recommendations")
        md.append("")
        for rec in result["recommendations"]:
            md.append(f"- {rec}")
        md.append("")
    return "\n".join(md)

def main():
    parser = argparse.ArgumentParser(description="Lint and score CLAUDE.md/GEMINI.md rulebooks for AI agents.")
    parser.add_argument("--path", "-p", default=".", help="Path to rules file or project directory (default: current directory)")
    parser.add_argument("--format", "-f", choices=["table", "json", "markdown"], default="table", help="Output format")
    parser.add_argument("--output", "-o", help="Write report to output file")

    args = parser.parse_args()

    try:
        rule_file = find_rule_file(args.path)
        result = analyze_rulebook(rule_file)

        if args.format == "json":
            out_str = json.dumps(result, indent=2, ensure_ascii=False)
        elif args.format == "markdown":
            out_str = format_markdown_output(result)
        else:
            out_str = format_terminal_output(result)

        if args.output:
            Path(args.output).write_text(out_str, encoding="utf-8")
            print(f"Report written to: {args.output}")
        else:
            print(out_str)

        sys.exit(0 if result["score"] >= 70 else 1)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(2)

if __name__ == "__main__":
    main()
