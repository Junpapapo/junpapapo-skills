#!/usr/bin/env python3
"""
generate_retro_doc.py
Generates date-isolated retrospective documents (YYYY-MM-DD-retrospective.md)
and maintains the folder index (README.md) in the project docs directory.
"""

import os
import sys
import json
import re
import argparse
from pathlib import Path
from datetime import datetime

# Force UTF-8 output across all platforms (Windows, Linux, macOS)
try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stdin, "reconfigure"):
        sys.stdin.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

import subprocess

def resolve_output_dir(workspace_path, explicit_dir=None):
    """Resolves the default output directory based on project structure."""
    if explicit_dir:
        p = Path(explicit_dir)
        p.mkdir(parents=True, exist_ok=True)
        return p

    ws = Path(workspace_path)
    
    # Priority 1: 01.Docs exists
    p1 = ws / "01.Docs" / "00_Retrospectives"
    if (ws / "01.Docs").exists():
        p1.mkdir(parents=True, exist_ok=True)
        return p1

    # Priority 2: docs exists
    p2 = ws / "docs" / "retrospectives"
    if (ws / "docs").exists():
        p2.mkdir(parents=True, exist_ok=True)
        return p2

    # Priority 3: Default create docs/retrospectives
    p3 = ws / "docs" / "retrospectives"
    p3.mkdir(parents=True, exist_ok=True)
    return p3

def update_readme_index(output_dir, date_str, topic, try_rule, rule_code, doc_filename):
    """Maintains the README.md index in the retrospectives directory."""
    readme_path = Path(output_dir) / "README.md"
    header = """# 📚 세션 복기 및 오답노트 색인 (Session Retrospectives Index)

> AI 페어링 세션의 일자별 복기(KPT), 오답노트, 골든 룰 축적 기록 보관소입니다.

| 날짜 | 세션 주제 | 핵심 실행 수칙 (Try) | 승격/후보 룰 | 복기 문서 |
| :---: | :--- | :--- | :---: | :---: |"""

    rows = []
    if readme_path.exists():
        with open(readme_path, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
        in_table = False
        for line in lines:
            if "| :---: |" in line:
                in_table = True
                continue
            if in_table and line.strip().startswith("|"):
                if f"**{date_str}**" not in line and f"[{date_str}]" not in line:
                    rows.append(line.strip())

    badge = f"`{rule_code}`" if rule_code and rule_code != "NONE" else "-"
    new_row = f"| **{date_str}** | {topic} | {try_rule} | {badge} | [{date_str} 복기]({doc_filename}) |"
    all_rows = [new_row] + rows

    content = f"{header}\n" + "\n".join(all_rows) + "\n"
    with open(readme_path, "w", encoding="utf-8", errors="replace") as f:
        f.write(content)

def render_retro_document(date_str, topic, keep_text, problem_text, try_text, rule_code, rule_text, rule_status, stats=None):
    """Renders the standard markdown content for a single session retrospective."""
    stats = stats or {}
    files_count = stats.get("files_count", 0)
    build_count = stats.get("build_count", 1)
    build_status = stats.get("build_status", "Pass")
    agent_name = stats.get("agent_name", "AI Agent")
    token_info = stats.get("token_info", None)
    health_score = stats.get("health_score", None)
    health_grade = stats.get("health_grade", None)

    if rule_status == "none" or not rule_code or rule_code.upper() in ["NONE", "N/A"]:
        rule_section = """### 🚫 추출된 행동 룰 (Rule Extraction)
- **신규 추출 룰**: 없음 (✨ Clean Session - 기존 골든 룰 100% 준수로 룰북 변경 생략)
"""
    else:
        badge_rule = f"🔥 **승격 (`GEMINI.md` 동기화)**" if rule_status == "promoted" else f"💡 후보 룰 (Hits=1 보관)"
        rule_section = f"""### 🚫 추출된 행동 룰 (Rule Extraction)
- **룰 코드**: `{rule_code}`
- **상태**: {badge_rule}
- **행동 수칙**: {rule_text}
"""

    token_line = f"- **토큰 최적화**: {token_info}\n" if token_info else ""
    health_line = f"- **세션 건강도**: **{health_score}점** ({health_grade})\n" if health_score else ""

    content = f"""# 📅 [{date_str}] 세션 복기 및 오답노트

- **세션 주제**: {topic}
- **작업 통계**: 수정 파일 {files_count}개, 빌드 검증 {build_count}회 ({build_status})
{health_line}{token_line}- **대상 에이전트**: {agent_name}

---

### 🎯 복기 매트릭스 (KPT)
| 구분 | 내용 | 분석 및 근본 원인 |
| :--- | :--- | :--- |
| **Keep (성공)** | {keep_text} | 성공 요인 지속 유지 및 Best Practice 정립 |
| **Problem (실수)** | {problem_text} | 사용자 정정 및 초기 누락/오판 원인 분석 |
| **Try (실행 수칙)** | {try_text} | 다음 작업 시 즉시 적용할 구체적 표준 행동 |

---

{rule_section}"""
    return content

def generate_rollup_report(output_dir, rollup_type="weekly"):
    """Scans all daily retrospectives and generates a consolidated rollup briefing."""
    out_path = Path(output_dir)
    md_files = sorted(out_path.glob("*-retrospective.md"), reverse=True)
    if not md_files:
        return {"status": "no_files_found"}

    target_files = md_files[:7] if rollup_type == "weekly" else md_files[:30]
    total_docs = len(target_files)
    
    rollup_title = f"# 📈 [{rollup_type.upper()}] 세션 복기 종합 롤업 브리핑 ({datetime.now().strftime('%Y-%m-%d')})"
    summary_lines = [
        rollup_title,
        f"\n- **분석 대상 일자**: 최근 {total_docs}개 세션",
        f"- **생성 시각**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n",
        "---",
        "\n### 📊 기간별 핵심 복기 요약",
        "| 날짜 | 주제 | 승격 룰 | 파일 링크 |",
        "| :---: | :--- | :---: | :---: |"
    ]

    for f in target_files:
        date_str = f.name.replace("-retrospective.md", "")
        with open(f, "r", encoding="utf-8", errors="replace") as doc_f:
            text = doc_f.read()
            topic_match = re.search(r"\*\*세션 주제\*\*:\s*(.*)", text)
            rule_match = re.search(r"\*\*룰 코드\*\*:\s*`([^`]+)`", text)
            topic = topic_match.group(1).strip() if topic_match else "세션 작업"
            rule = rule_match.group(1).strip() if rule_match else "N/A"
            summary_lines.append(f"| **{date_str}** | {topic} | `{rule}` | [{date_str}]({f.name}) |")

    rollup_filename = f"rollup-{rollup_type}-{datetime.now().strftime('%Y-%m-%d')}.md"
    rollup_file_path = out_path / rollup_filename
    with open(rollup_file_path, "w", encoding="utf-8", errors="replace") as f:
        f.write("\n".join(summary_lines) + "\n")

    return {
        "status": "success",
        "rollup_file": str(rollup_file_path),
        "total_analyzed": total_docs
    }

def main():
    parser = argparse.ArgumentParser(description="Generate date-isolated retrospective document and update index.")
    parser.add_argument("--date", help="Session date (YYYY-MM-DD)", default=None)
    parser.add_argument("--topic", help="Session topic/title", default=None)
    parser.add_argument("--workspace", help="Project root workspace path", default=os.getcwd())
    parser.add_argument("--output-dir", help="Explicit output directory", default=None)
    parser.add_argument("--keep", help="Keep text", default=None)
    parser.add_argument("--problem", help="Problem text", default=None)
    parser.add_argument("--try-rule", help="Try text", default=None)
    parser.add_argument("--rule-code", help="Rule code (e.g. RULE-I18N-SYNC)", default=None)
    parser.add_argument("--rule-text", help="Golden rule description", default=None)
    parser.add_argument("--rule-status", choices=["candidate", "promoted", "none"], default=None)
    parser.add_argument("--stats-json", help="JSON string for stats", default="{}")
    parser.add_argument("--files-count", type=int, help="Number of modified files", default=None)
    parser.add_argument("--build-count", type=int, help="Number of builds", default=None)
    parser.add_argument("--build-status", help="Build status (e.g. Pass)", default=None)
    parser.add_argument("--agent-name", help="AI agent name", default=None)
    parser.add_argument("--token-info", help="Token optimization metrics text", default=None)
    parser.add_argument("--health-score", type=int, help="Session health score (0-100)", default=None)
    parser.add_argument("--health-grade", help="Session health grade label", default=None)
    parser.add_argument("--rollup", choices=["weekly", "monthly"], help="Generate weekly/monthly rollup summary", default=None)
    
    # 1-Stop Pipeline Options
    parser.add_argument("--stdin", action="store_true", help="Ingest JSON digest directly from standard input")
    parser.add_argument("--from-digest", help="Path to JSON digest file from parse_session.py", default=None)
    parser.add_argument("--auto", action="store_true", help="Auto-run parse_session.py and generate retrospective seamlessly")
    parser.add_argument("--days", type=int, help="Number of past days to parse in auto mode", default=None)
    parser.add_argument("--since", help="Parse all sessions since date (YYYY-MM-DD) in auto mode", default=None)
    parser.add_argument("--filter-workspace", action="store_true", help="Filter sessions by workspace in auto mode")
    args = parser.parse_args()

    out_dir = resolve_output_dir(args.workspace, args.output_dir)

    if args.rollup:
        res = generate_rollup_report(out_dir, args.rollup)
        print(json.dumps(res, ensure_ascii=False, indent=2))
        return

    digest_data = None

    # Ingest from Stdin / File / Auto-run
    if args.stdin:
        try:
            stdin_text = sys.stdin.read().strip()
            if stdin_text:
                digest_data = json.loads(stdin_text)
        except Exception as e:
            sys.stderr.write(f"Warning: Failed to parse stdin JSON: {e}\n")
    elif args.from_digest:
        try:
            with open(args.from_digest, "r", encoding="utf-8", errors="replace") as f:
                digest_data = json.load(f)
        except Exception as e:
            sys.stderr.write(f"Warning: Failed to load digest file: {e}\n")
    elif args.auto or (not args.topic or not args.keep or not args.problem or not args.try_rule):
        script_dir = Path(__file__).resolve().parent
        parse_script = script_dir / "parse_session.py"
        if parse_script.exists():
            cmd = [sys.executable, str(parse_script), "--workspace", str(args.workspace), "--format", "json"]
            if args.date:
                cmd.extend(["--date", args.date])
            if args.days:
                cmd.extend(["--days", str(args.days)])
            if args.since:
                cmd.extend(["--since", args.since])
            if args.filter_workspace:
                cmd.append("--filter-workspace")
            try:
                run_res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
                if run_res.returncode == 0 and run_res.stdout.strip():
                    digest_data = json.loads(run_res.stdout)
            except Exception as e:
                sys.stderr.write(f"Warning: Auto-parse failed: {e}\n")

    # Populate stats and smart KPT from digest if available
    stats = {}
    try:
        stats = json.loads(args.stats_json)
    except Exception:
        pass

    if digest_data:
        # Pre-fill stats
        mod_files = digest_data.get("modified_files", [])
        tasks = digest_data.get("tasks", [])
        token_m = digest_data.get("token_metrics", {})
        kpt_sug = digest_data.get("suggested_kpt", {})

        if args.files_count is None:
            stats["files_count"] = len(mod_files)
        if args.build_count is None:
            stats["build_count"] = max(1, len(tasks))
        if args.build_status is None:
            has_err = any(t.get("has_error") for t in tasks)
            stats["build_status"] = "Pass" if not has_err else "Mixed"
        if args.health_score is None:
            stats["health_score"] = digest_data.get("health_score", 85)
        if args.health_grade is None:
            stats["health_grade"] = digest_data.get("health_grade", "Good")
        if args.token_info is None and token_m:
            raw_h = token_m.get("raw_bytes_human", "")
            raw_t = token_m.get("estimated_raw_tokens", 0)
            dig_t = token_m.get("digest_estimated_tokens", 0)
            sav_p = token_m.get("savings_percentage", "")
            stats["token_info"] = f"Raw {raw_h} (~{raw_t:,} tokens) ➡️ Digest ~{dig_t:,} tokens ({sav_p} saved)"

        # Pre-fill KPT text if not explicitly provided
        if not args.topic:
            args.topic = kpt_sug.get("suggested_topic") or "세션 작업 복기"
        if not args.keep:
            args.keep = kpt_sug.get("keep") or "정상 작업 진행 및 빌드 통과"
        if not args.problem:
            args.problem = kpt_sug.get("problem") or "특이 마찰/오류 없음 (Clean Flow)"
        if not args.try_rule:
            args.try_rule = kpt_sug.get("try_rule") or "작업 전 영향 범위 사전 확인 및 선제 검증"
        if not args.rule_code:
            args.rule_code = kpt_sug.get("rule_code") or "NONE"
        if not args.rule_text:
            args.rule_text = kpt_sug.get("rule_text") or "N/A"
        if not args.rule_status:
            args.rule_status = kpt_sug.get("rule_status") or ("none" if args.rule_code == "NONE" else "candidate")

    # CLI explicit overrides for stats
    if args.files_count is not None:
        stats["files_count"] = args.files_count
    if args.build_count is not None:
        stats["build_count"] = args.build_count
    if args.build_status is not None:
        stats["build_status"] = args.build_status
    if args.agent_name is not None:
        stats["agent_name"] = args.agent_name
    if args.token_info is not None:
        stats["token_info"] = args.token_info
    if args.health_score is not None:
        stats["health_score"] = args.health_score
    if args.health_grade is not None:
        stats["health_grade"] = args.health_grade

    # Fallback checks
    if not args.date:
        if digest_data and digest_data.get("date"):
            args.date = digest_data.get("date")
        else:
            args.date = datetime.now().strftime("%Y-%m-%d")
    if not args.rule_status:
        args.rule_status = "candidate" if args.rule_code and args.rule_code.upper() not in ["NONE", "N/A"] else "none"

    if not args.topic or not args.keep or not args.problem or not args.try_rule:
        parser.error("--topic, --keep, --problem, --try-rule are required (or use --stdin / --auto / --from-digest)")

    if args.rule_status != "none" and (not args.rule_code or not args.rule_text):
        args.rule_code = "NONE"
        args.rule_text = "N/A"
        args.rule_status = "none"

    # Normalize filename date to YYYY-MM-DD
    doc_date_match = re.search(r"\d{4}-\d{2}-\d{2}", args.date)
    file_date_str = doc_date_match.group(0) if doc_date_match else datetime.now().strftime("%Y-%m-%d")
    doc_filename = f"{file_date_str}-retrospective.md"
    doc_path = out_dir / doc_filename

    # 1. Render and write retrospective document
    doc_content = render_retro_document(
        args.date, args.topic, args.keep, args.problem, args.try_rule,
        args.rule_code, args.rule_text, args.rule_status, stats
    )
    with open(doc_path, "w", encoding="utf-8", errors="replace") as f:
        f.write(doc_content)

    # 2. Update README.md index
    update_readme_index(out_dir, args.date, args.topic, args.try_rule, args.rule_code, doc_filename)

    res = {
        "status": "success",
        "retrospective_doc": str(doc_path),
        "index_doc": str(out_dir / "README.md"),
        "date": args.date,
        "rule_promoted": args.rule_status == "promoted"
    }
    print(json.dumps(res, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
