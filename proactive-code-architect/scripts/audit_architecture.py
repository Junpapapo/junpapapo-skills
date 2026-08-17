#!/usr/bin/env python3
"""
Proactive Code Architecture Auditor (audit_architecture.py)
Automated static analyzer that enforces modular architecture rules:
- 400-line hard limits / 300-line soft limits
- Single Responsibility per file (SRP)
- Complexity gates (nesting depth > 4, long functions > 50 lines)
- Dependency graph metrics (Fan-out > 8, Fan-in > 15, Circular dependencies)
"""

import os
import sys
import re
import json
import argparse
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Any, Set, Tuple

# Windows Unicode stdout safety
if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

EXTENSIONS = {".ts", ".tsx", ".js", ".jsx", ".py", ".go"}
IGNORE_DIRS = {".git", "node_modules", "dist", "build", ".agents", "coverage", "__pycache__", "venv", ".venv"}

def find_code_files(workspace: Path) -> List[Path]:
    files = []
    for p in workspace.rglob("*"):
        if p.is_file() and p.suffix in EXTENSIONS:
            if not any(part in IGNORE_DIRS for part in p.parts):
                files.append(p)
    return files

def analyze_file(file_path: Path, workspace: Path) -> Dict[str, Any]:
    try:
        content = file_path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return {}

    lines = content.splitlines()
    line_count = len(lines)
    rel_path = file_path.relative_to(workspace)

    # Nesting depth analysis
    max_nesting = 0
    current_nesting = 0
    long_functions = []
    current_func_start = None
    current_func_name = ""

    # Import extraction
    imports = set()

    for idx, line in enumerate(lines, start=1):
        stripped = line.strip()

        # TypeScript/JS/Python import parsing
        m_imp = re.search(r"import\s+.*?from\s+['\"]([^'\"]+)['\"]", line)
        if m_imp:
            imports.add(m_imp.group(1))
        m_req = re.search(r"require\(\s*['\"]([^'\"]+)['\"]\s*\)", line)
        if m_req:
            imports.add(m_req.group(1))

        # Function detection & length tracking
        if re.search(r"\b(function|def|const\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)\b", line):
            if current_func_start is not None:
                func_len = idx - current_func_start
                if func_len > 50:
                    long_functions.append((current_func_name, current_func_start, func_len))
            current_func_start = idx
            current_func_name = stripped[:40]

        # Simple indentation / brace nesting heuristic
        if line.startswith("    ") or line.startswith("\t"):
            indent_level = len(line) - len(line.lstrip(" "))
            tabs = line.count("\t")
            calc_depth = (indent_level // 2 if tabs == 0 else tabs)
            if calc_depth > max_nesting:
                max_nesting = calc_depth

    if current_func_start is not None:
        func_len = len(lines) - current_func_start
        if func_len > 50:
            long_functions.append((current_func_name, current_func_start, func_len))

    # SRP Mixed Concerns Check
    has_ui = bool(re.search(r"(<[A-Z]\w+|<\/?[a-z]+>|return\s*\(|render\()", content))
    has_db_io = bool(re.search(r"(fetch\(|axios\.|prisma\.|SELECT\s+|INSERT\s+|db\.)", content))
    srp_violation = has_ui and has_db_io and line_count > 150

    return {
        "file": str(rel_path),
        "abs_path": str(file_path),
        "lines": line_count,
        "is_hard_violation": line_count > 400,
        "is_soft_warning": 300 <= line_count <= 400,
        "max_nesting": max_nesting,
        "long_functions": long_functions,
        "fan_out": len(imports),
        "imports": list(imports),
        "srp_violation": srp_violation
    }

def detect_circular_dependencies(file_records: List[Dict[str, Any]]) -> List[List[str]]:
    # Simple cycle detector on local module imports
    graph = defaultdict(set)
    file_map = {r["file"]: r for r in file_records}

    for r in file_records:
        src = r["file"]
        for imp in r["imports"]:
            if imp.startswith("."):
                # Resolve relative import
                src_dir = Path(src).parent
                norm = os.path.normpath(src_dir / imp).replace("\\", "/")
                for target_file in file_map:
                    if target_file.startswith(norm):
                        graph[src].add(target_file)

    cycles = []
    visited = set()
    stack = []

    def dfs(node: str):
        visited.add(node)
        stack.append(node)
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                dfs(neighbor)
            elif neighbor in stack:
                cycle_idx = stack.index(neighbor)
                cycles.append(stack[cycle_idx:] + [neighbor])
        stack.pop()

    for node in list(graph.keys()):
        if node not in visited:
            dfs(node)

    return cycles[:5]  # Limit to top 5 cycles

def generate_audit_report(workspace: Path, records: List[Dict[str, Any]]) -> Dict[str, Any]:
    hard_violations = [r for r in records if r["is_hard_violation"]]
    soft_warnings = [r for r in records if r["is_soft_warning"]]
    deep_nesting = [r for r in records if r["max_nesting"] > 4]
    high_fan_out = [r for r in records if r["fan_out"] > 8]
    srp_violations = [r for r in records if r["srp_violation"]]

    # Fan-In (God module check)
    fan_in_count = defaultdict(int)
    for r in records:
        for imp in r["imports"]:
            fan_in_count[imp] += 1
    god_modules = [(imp, count) for imp, count in fan_in_count.items() if count > 15 and not imp.startswith("@")]

    # Circular dependencies
    cycles = detect_circular_dependencies(records)

    # Health score
    score = 100
    score -= len(hard_violations) * 15
    score -= len(soft_warnings) * 5
    score -= len(deep_nesting) * 5
    score -= len(high_fan_out) * 5
    score -= len(srp_violations) * 10
    score -= len(cycles) * 15
    score = max(0, score)

    # Sort files by line count descending
    records_sorted = sorted(records, key=lambda x: x["lines"], reverse=True)

    return {
        "workspace": str(workspace),
        "total_files": len(records),
        "score": score,
        "hard_violations": hard_violations,
        "soft_warnings": soft_warnings,
        "deep_nesting": deep_nesting,
        "high_fan_out": high_fan_out,
        "srp_violations": srp_violations,
        "god_modules": god_modules,
        "cycles": cycles,
        "top_largest_files": records_sorted[:10]
    }

def format_terminal(report: Dict[str, Any]) -> str:
    out = []
    out.append("================================================================")
    out.append(" 🏗️  Proactive Code Architecture Audit Report")
    out.append("================================================================")
    out.append(f" Total Files Scanned : {report['total_files']}")
    out.append(f" Architecture Health : {report['score']} / 100")
    out.append("----------------------------------------------------------------")

    if report["hard_violations"]:
        out.append(f" 🚨 400-Line Hard Violations ({len(report['hard_violations'])} files MUST be split):")
        for v in report["hard_violations"]:
            out.append(f"   [SPLIT REQUIRED] {v['lines']} lines -> {v['file']}")
    else:
        out.append(" ✅ 400-Line Hard Limit: 0 violations.")

    if report["soft_warnings"]:
        out.append(f" ⚠️ 300-400 Line Soft Warnings ({len(report['soft_warnings'])} files nearing limit):")
        for w in report["soft_warnings"][:5]:
            out.append(f"   [WARN] {w['lines']} lines -> {w['file']}")

    if report["deep_nesting"]:
        out.append(f" ⚠️ High Nesting Depth > 4 ({len(report['deep_nesting'])} files):")
        for d in report["deep_nesting"][:5]:
            out.append(f"   [NESTING] Depth {d['max_nesting']} -> {d['file']}")

    if report["high_fan_out"]:
        out.append(f" ⚠️ High Fan-Out > 8 Imports ({len(report['high_fan_out'])} files):")
        for f in report["high_fan_out"][:5]:
            out.append(f"   [FAN-OUT] {f['fan_out']} imports -> {f['file']}")

    if report["srp_violations"]:
        out.append(f" ⚠️ Single Responsibility Violations ({len(report['srp_violations'])} files mix UI + DB/IO):")
        for s in report["srp_violations"][:5]:
            out.append(f"   [SRP] UI + Data mixed -> {s['file']}")

    if report["cycles"]:
        out.append(" 🚨 Circular Dependencies Detected:")
        for c in report["cycles"]:
            out.append(f"   [CYCLE] {' -> '.join(c)}")

    out.append("================================================================")
    return "\n".join(out)

def format_markdown(report: Dict[str, Any]) -> str:
    md = []
    md.append("# 🏗️ Proactive Code Architecture Audit Report")
    md.append("")
    md.append(f"- **Health Score**: **{report['score']} / 100**")
    md.append(f"- **Total Files Scanned**: {report['total_files']}")
    md.append(f"- **Workspace**: `{report['workspace']}`")
    md.append("")
    md.append("## 1. Compliance Matrix")
    md.append("")
    md.append("| Guardrail Rule | Threshold | Violations | Status |")
    md.append("| :--- | :--- | :---: | :---: |")
    md.append(f"| Rule 1: 400-Line Hard Limit | ≤ 400 lines | {len(report['hard_violations'])} | {'✅ Pass' if not report['hard_violations'] else '❌ Fail'} |")
    md.append(f"| Rule 1: 300-Line Soft Warning | ≤ 300 lines | {len(report['soft_warnings'])} | {'✅ Pass' if not report['soft_warnings'] else '⚠️ Warning'} |")
    md.append(f"| Rule 2: Single Responsibility (SRP) | Isolated UI/Logic | {len(report['srp_violations'])} | {'✅ Pass' if not report['srp_violations'] else '⚠️ Warning'} |")
    md.append(f"| Rule 6: Nesting Depth Gate | Depth ≤ 4 | {len(report['deep_nesting'])} | {'✅ Pass' if not report['deep_nesting'] else '⚠️ Warning'} |")
    md.append(f"| Rule 7: Fan-Out Import Cap | Imports ≤ 8 | {len(report['high_fan_out'])} | {'✅ Pass' if not report['high_fan_out'] else '⚠️ Warning'} |")
    md.append(f"| Rule 6: Circular Dependencies | 0 cycles | {len(report['cycles'])} | {'✅ Pass' if not report['cycles'] else '🚨 Critical'} |")
    md.append("")

    if report["hard_violations"]:
        md.append("## 🚨 400-Line Hard Limit Violations (Must Split)")
        md.append("")
        md.append("| File | Lines | Recommended Split Action |")
        md.append("| :--- | :---: | :--- |")
        for v in report["hard_violations"]:
            md.append(f"| `{v['file']}` | **{v['lines']}** | Extract into feature-module (`types`, `utils`, `view`) |")
        md.append("")

    if report["top_largest_files"]:
        md.append("## 📊 Top Largest Files")
        md.append("")
        md.append("| File | Lines | Max Nesting | Fan-Out |")
        md.append("| :--- | :---: | :---: | :---: |")
        for r in report["top_largest_files"]:
            md.append(f"| `{r['file']}` | {r['lines']} | {r['max_nesting']} | {r['fan_out']} |")
        md.append("")

    return "\n".join(md)

def main():
    parser = argparse.ArgumentParser(description="Audit codebase against Proactive Code Architecture standards.")
    parser.add_argument("--workspace", "-w", default=".", help="Workspace path (default: current directory)")
    parser.add_argument("--format", "-f", choices=["table", "json", "markdown"], default="table", help="Output format")
    parser.add_argument("--output", "-o", help="Write report to file")

    args = parser.parse_args()
    ws_path = Path(args.workspace).resolve()

    files = find_code_files(ws_path)
    records = []
    for f in files:
        rec = analyze_file(f, ws_path)
        if rec:
            records.append(rec)

    report = generate_audit_report(ws_path, records)

    if args.format == "json":
        out_str = json.dumps(report, indent=2, ensure_ascii=False)
    elif args.format == "markdown":
        out_str = format_markdown(report)
    else:
        out_str = format_terminal(report)

    if args.output:
        Path(args.output).write_text(out_str, encoding="utf-8")
        print(f"Architecture report written to: {args.output}")
    else:
        print(out_str)

    sys.exit(0 if len(report["hard_violations"]) == 0 and len(report["cycles"]) == 0 else 1)

if __name__ == "__main__":
    main()
