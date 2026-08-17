#!/usr/bin/env python3
"""
parse_session.py
Extracts actionable signals (user corrections, build/tool errors, modified files, friction points)
from AI agent session logs (Gemini Antigravity, Claude Code, or Git fallbacks).
Supports single date, relative day ranges (--days N), or since date (--since YYYY-MM-DD).
"""

import os
import sys
import json
import re
import argparse
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Force UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
        sys.stdin.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def generate_suggested_kpt(data):
    """Generates high-quality KPT pre-fill suggestions and primary rule based on parsed session signals."""
    mod_files = data.get("modified_files", [])
    tasks = data.get("tasks", [])
    anti_patterns = data.get("anti_patterns", [])
    friction_points = data.get("friction_points", [])
    errors = data.get("errors", [])
    
    # 1. Keep suggestion
    passed_tasks = [t for t in tasks if not t.get("has_error")]
    keep_parts = []
    if mod_files:
        keep_parts.append(f"총 {len(mod_files)}개 파일 수정 및 모듈 안정화")
    else:
        keep_parts.append("프로젝트 분석 및 구조 검토")
    
    if passed_tasks:
        keep_parts.append(f"빌드/타입 검증 {len(passed_tasks)}회 무결점 통과")
    keep_text = ", ".join(keep_parts)

    # 2. Problem suggestion
    if anti_patterns:
        prob_labels = [ap.get("label", "").split(" ")[-1].replace("(", "").replace(")", "") for ap in anti_patterns[:2]]
        prob_text = f"일부 작업에서 {', '.join(prob_labels)} 및 정정 지시 발생"
    elif friction_points:
        clean_fp = re.sub(r"[\r\n]+", " ", str(friction_points[0])).strip()
        prob_text = f"사용자 정정 피드백 발생: {clean_fp[:80]}..."
    elif errors:
        clean_err = re.sub(r"[\r\n]+", " ", str(errors[0])).strip()
        prob_text = f"도구/빌드 실행 중 오류 발생: {clean_err[:80]}..."
    else:
        prob_text = "특이 마찰/오류 없음 (✨ Clean Session)"

    # 3. Try & Rule suggestion
    if anti_patterns:
        primary_ap = anti_patterns[0]
        try_text = f"{primary_ap['rule_text']} 준수 및 작업 전 영향 범위 사전 확인"
        rule_code = primary_ap["rule_code"]
        rule_text = primary_ap["rule_text"]
        rule_status = "candidate"
    elif friction_points:
        try_text = "작업 전 요구사항 명확화 및 사용자 피드백 즉각 반영"
        rule_code = "RULE-SURGICAL-EDIT"
        rule_text = "코드 수정 시 최소 변경 대상 라인만 외과수술식으로 수정하며 인접 코드 임의 변경을 금지한다."
        rule_status = "candidate"
    else:
        try_text = "현재의 깔끔한 워크플로우와 선제 검증 프로세스 지속 유지"
        rule_code = "NONE"
        rule_text = "N/A"
        rule_status = "none"

    return {
        "suggested_topic": f"세션 작업 복기 ({data.get('date', 'Today')})",
        "keep": keep_text,
        "problem": prob_text,
        "try_rule": try_text,
        "rule_code": rule_code,
        "rule_text": rule_text,
        "rule_status": rule_status
    }

FRICTION_KEYWORDS = [
    # Korean friction patterns
    r"아니", r"누락", r"빠졌", r"다시", r"왜", r"틀렸", r"그게\s*아니", r"통일", r"부족", r"확인해",
    r"멋대로", r"물어봐", r"지웠", r"바꿨", r"야이", r"잘못", r"안\s*나오",
    # English friction patterns
    r"\bnot\b", r"\bwrong\b", r"\bmissing\b", r"\bfix\b", r"\binstead\b", r"\bwhy\b", r"\bincorrect\b",
    r"\bforgot\b", r"\berror\b", r"\bfail\b", r"\bdon't\b", r"\bunsolicited\b"
]

# 5 Major Toxic AI Agent Anti-Patterns (Bilingual)
ANTI_PATTERNS_MAP = {
    "DESTRUCTIVE_DELETION": {
        "patterns": [r"지웠", r"날아갔", r"삭제했", r"왜\s*없", r"복구", r"삭제하지", r"\bdeleted\b", r"\bremoved\b", r"\bmissing code\b"],
        "label": "🚨 확인 없는 코드/파일 삭제 (Destructive Deletion)",
        "rule_code": "RULE-CODE-PRESERVATION",
        "rule_text": "기존 유틸리티, 함수, 주석, 방어 로직을 사용자 확인 없이 임의 삭제하거나 축소하지 않는다.",
        "rule_text_en": "Never delete or shrink existing utilities, functions, comments, or guards without explicit confirmation."
    },
    "UNSOLICITED_EDIT": {
        "patterns": [r"건드리지", r"왜\s*바꿨", r"인접", r"임의로", r"손대지", r"시키지도", r"\bunrelated\b", r"\bdon't touch\b", r"\bunsolicited\b"],
        "label": "🚨 불필요한 인접 코드 임의 수정 (Unsolicited Edits)",
        "rule_code": "RULE-SURGICAL-EDIT",
        "rule_text": "코드 수정 시 최소 변경 대상 라인만 외과수술식으로 수정하며 인접 코드 임의 변경을 금지한다.",
        "rule_text_en": "Apply surgical edits strictly to minimal target lines and avoid arbitrary adjacent code modifications."
    },
    "ARBITRARY_ASSUMPTION": {
        "patterns": [r"멋대로", r"물어보고", r"확인도\s*안", r"누가\s*그렇게", r"물어봐", r"판단하지", r"\bassumed\b", r"\bask first\b", r"\barbitrary\b"],
        "label": "🚨 임의 가정 및 독단적 코딩 (Arbitrary Assumptions)",
        "rule_code": "RULE-NO-ASSUMPTIONS",
        "rule_text": "요구사항이나 UI 배치가 불명확할 때는 독단적으로 추측하여 코딩하지 않고 반드시 먼저 옵션을 제시해 확인받는다.",
        "rule_text_en": "Never guess ambiguous requirements; always present options and obtain clarification before coding."
    },
    "PLACEHOLDER_LAZINESS": {
        "patterns": [r"todo", r"나중에", r"목업", r"더미", r"임시로", r"\bplaceholder\b", r"\bmock\b"],
        "label": "🚨 TODO/플레이스홀더 방치 (Lazy Mockups/Placeholders)",
        "rule_code": "RULE-NO-PLACEHOLDERS",
        "rule_text": "나중에 구현하겠다는 // TODO나 임시 플레이스홀더를 남기지 않고 즉시 완전한 제품 코드를 작성한다.",
        "rule_text_en": "Never leave lazy // TODO or dummy placeholders; deliver complete, production-ready code immediately."
    }
}

def find_gemini_brain_dirs(target_date_str=None, days=None, since_date_str=None):
    """Finds Antigravity brain directories matching date, range of days, or since date."""
    home = Path.home()
    gemini_brain_root = home / ".gemini" / "antigravity" / "brain"
    if not gemini_brain_root.exists():
        return []

    dirs = [d for d in gemini_brain_root.iterdir() if d.is_dir() and d.name not in ["scratch", "tempmediaStorage"]]
    dirs.sort(key=lambda d: d.stat().st_mtime, reverse=True)

    now = datetime.now(timezone.utc)

    if days is not None and days > 0:
        cutoff = now - timedelta(days=days)
        matched = [d for d in dirs if datetime.fromtimestamp(d.stat().st_mtime, tz=timezone.utc) >= cutoff]
        return matched

    if since_date_str:
        try:
            since_dt = datetime.strptime(since_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            matched = [d for d in dirs if datetime.fromtimestamp(d.stat().st_mtime, tz=timezone.utc) >= since_dt]
            return matched
        except ValueError:
            pass

    if target_date_str:
        matched = []
        for d in dirs:
            mod_date = datetime.fromtimestamp(d.stat().st_mtime, tz=timezone.utc).strftime("%Y-%m-%d")
            if mod_date == target_date_str:
                matched.append(d)
        return matched if matched else dirs[:1]

    # Default: sessions modified today, fallback to latest 1
    today_str = now.strftime("%Y-%m-%d")
    today_dirs = [d for d in dirs if datetime.fromtimestamp(d.stat().st_mtime, tz=timezone.utc).strftime("%Y-%m-%d") == today_str]
    return today_dirs if today_dirs else dirs[:1]

def parse_transcript_file(transcript_path, workspace_filter=None):
    """Parses a JSONL transcript file to extract user inputs, errors, tool usages, and anti-patterns."""
    user_inputs = []
    errors = []
    modified_files = set()
    file_churn_counts = {}
    tool_counts = {}
    detected_anti_patterns = []
    is_matching_workspace = True

    if not transcript_path.exists():
        return user_inputs, errors, list(modified_files), tool_counts, detected_anti_patterns, file_churn_counts, False

    ws_clean = os.path.basename(workspace_filter).lower() if workspace_filter else None
    has_ws_signal = False

    with open(transcript_path, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                step = json.loads(line)
            except Exception:
                continue

            step_type = step.get("type", "")
            content = step.get("content", "")
            status = step.get("status", "")
            tool_calls = step.get("tool_calls", [])

            # Check workspace signal
            if ws_clean and ws_clean in str(content).lower():
                has_ws_signal = True

            # User feedback & prompts
            if step_type == "USER_INPUT" and content:
                # Clean prompt content
                clean_content = re.sub(r"<USER_REQUEST>|</USER_REQUEST>|<ADDITIONAL_METADATA>.*?</ADDITIONAL_METADATA>|<USER_SETTINGS_CHANGE>.*?</USER_SETTINGS_CHANGE>", "", content, flags=re.DOTALL).strip()
                if clean_content:
                    is_friction = any(re.search(pat, clean_content, re.IGNORECASE) for pat in FRICTION_KEYWORDS)
                    user_inputs.append({
                        "text": clean_content,
                        "is_friction": is_friction
                    })

                    # Check for specific toxic anti-patterns in user corrections
                    for ap_key, ap_info in ANTI_PATTERNS_MAP.items():
                        if any(re.search(pat, clean_content, re.IGNORECASE) for pat in ap_info["patterns"]):
                            detected_anti_patterns.append({
                                "type": ap_key,
                                "label": ap_info["label"],
                                "rule_code": ap_info["rule_code"],
                                "rule_text": ap_info["rule_text"],
                                "trigger_context": clean_content[:200]
                            })

            # Errors
            if status == "ERROR" or (isinstance(content, str) and "error" in content.lower() and step_type != "USER_INPUT"):
                errors.append(str(content)[:300])

            # Tool calls & modified files
            if tool_calls:
                for call in tool_calls:
                    name = call.get("name", "") if isinstance(call, dict) else str(call)
                    tool_counts[name] = tool_counts.get(name, 0) + 1
                    
                    args = call.get("arguments", {}) if isinstance(call, dict) else {}
                    if isinstance(args, dict):
                        target_file = args.get("TargetFile") or args.get("file_path") or args.get("path") or args.get("Cwd")
                        if target_file:
                            tf_str = str(target_file)
                            if ws_clean and ws_clean in tf_str.lower():
                                has_ws_signal = True
                            fname = os.path.basename(tf_str)
                            if name in ["replace_file_content", "write_to_file", "multi_replace_file_content"]:
                                modified_files.add(fname)
                                file_churn_counts[fname] = file_churn_counts.get(fname, 0) + 1

    # Check for File Thrashing (files modified 4+ times in a session)
    for fname, count in file_churn_counts.items():
        if count >= 4:
            detected_anti_patterns.append({
                "type": "FILE_THRASHING",
                "label": f"🚨 동일 파일 반복 수정 뺑뺑이 (File Thrashing - {fname} {count}회 수정)",
                "rule_code": "RULE-ONE-PASS-PRECISION",
                "rule_text": "동일 파일을 뗐다 붙였다 반복 수정하지 않고, 사전 영향 범위를 완전히 분석한 뒤 1회에 정밀 수정한다.",
                "trigger_context": f"File '{fname}' was modified {count} times in a single session."
            })

    is_matching_workspace = has_ws_signal if ws_clean else True
    return user_inputs, errors, sorted(list(modified_files)), tool_counts, detected_anti_patterns, file_churn_counts, is_matching_workspace

def parse_task_logs(brain_dir):
    """Parses .system_generated/tasks/ for build/terminal exit codes and errors."""
    tasks_dir = brain_dir / ".system_generated" / "tasks"
    task_summaries = []
    if not tasks_dir.exists():
        return task_summaries

    log_files = sorted(tasks_dir.glob("task-*.log"), key=lambda p: p.stat().st_mtime)
    for log_file in log_files:
        try:
            with open(log_file, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
                has_error = "exited with code" in content and not "exited with code 0" in content
                task_summaries.append({
                    "task_file": log_file.name,
                    "has_error": has_error,
                    "snippet": content[-400:] if len(content) > 400 else content
                })
        except Exception:
            continue

    return task_summaries

def parse_git_fallback(workspace_dir):
    """Fallback parser using git log when transcript logs are unavailable."""
    import subprocess
    try:
        cmd = ["git", "-C", str(workspace_dir), "log", "-n", "5", "--oneline", "--stat"]
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return res.stdout
    except Exception as e:
        return f"Git fallback unavailable: {e}"

def main():
    parser = argparse.ArgumentParser(description="Parse AI agent session logs for retrospective.")
    parser.add_argument("--date", help="Target date in YYYY-MM-DD format", default=None)
    parser.add_argument("--days", type=int, help="Number of past days to parse (e.g. --days 7 for past week)", default=None)
    parser.add_argument("--since", help="Parse all sessions since date (YYYY-MM-DD)", default=None)
    parser.add_argument("--session-id", help="Explicit conversation ID", default=None)
    parser.add_argument("--workspace", help="Workspace path to filter/associate", default=os.getcwd())
    parser.add_argument("--filter-workspace", action="store_true", help="Only include sessions associated with workspace")
    parser.add_argument("--format", choices=["json", "markdown"], default="json")
    args = parser.parse_args()

    date_str = args.date or datetime.now().strftime("%Y-%m-%d")
    brain_dirs = []

    if args.session_id:
        brain_path = Path.home() / ".gemini" / "antigravity" / "brain" / args.session_id
        if brain_path.exists():
            brain_dirs = [brain_path]
    elif args.days is not None:
        brain_dirs = find_gemini_brain_dirs(days=args.days)
        date_str = f"Past {args.days} Days ({datetime.now().strftime('%Y-%m-%d')})"
    elif args.since:
        brain_dirs = find_gemini_brain_dirs(since_date_str=args.since)
        date_str = f"Since {args.since} ~ {datetime.now().strftime('%Y-%m-%d')}"
    else:
        brain_dirs = find_gemini_brain_dirs(target_date_str=args.date)

    data = {
        "date": date_str,
        "total_sessions_found": len(brain_dirs),
        "brain_sessions": [],
        "user_inputs": [],
        "friction_points": [],
        "errors": [],
        "modified_files": [],
        "tool_counts": {},
        "tasks": [],
        "git_summary": ""
    }

    total_raw_bytes = 0
    parsed_sessions_count = 0

    if brain_dirs:
        for b_dir in brain_dirs:
            transcript_file = b_dir / ".system_generated" / "logs" / "transcript.jsonl"
            if not transcript_file.exists():
                transcript_file = b_dir / "transcript.jsonl"
            
            if not transcript_file.exists():
                continue

            u_inputs, errs, mod_files, t_counts, anti_patterns, churns, is_ws_match = parse_transcript_file(
                transcript_file, workspace_filter=args.workspace if args.filter_workspace else None
            )

            if args.filter_workspace and not is_ws_match:
                continue

            parsed_sessions_count += 1
            data["brain_sessions"].append(str(b_dir.name))
            total_raw_bytes += transcript_file.stat().st_size

            tasks = parse_task_logs(b_dir)

            for item in u_inputs:
                data["user_inputs"].append(item["text"])
                if item["is_friction"]:
                    data["friction_points"].append(item["text"])

            data["errors"].extend(errs)
            data["modified_files"] = sorted(list(set(data["modified_files"] + mod_files)))
            for k, v in t_counts.items():
                data["tool_counts"][k] = data["tool_counts"].get(k, 0) + v
            data["tasks"].extend(tasks)
            data["anti_patterns"] = data.get("anti_patterns", []) + anti_patterns
    else:
        data["git_summary"] = parse_git_fallback(args.workspace)

    # Deduplicate anti-patterns by type
    unique_aps = {}
    for ap in data.get("anti_patterns", []):
        if ap["type"] not in unique_aps:
            unique_aps[ap["type"]] = ap
    data["anti_patterns"] = list(unique_aps.values())
    data["active_sessions_count"] = parsed_sessions_count

    # Token and byte calculations
    estimated_raw_tokens = int(total_raw_bytes / 4) if total_raw_bytes > 0 else 0
    digest_text = json.dumps(data, ensure_ascii=False)
    digest_bytes = len(digest_text.encode("utf-8"))
    digest_estimated_tokens = int(digest_bytes / 4)
    savings_pct = round((1 - (digest_estimated_tokens / max(estimated_raw_tokens, 1))) * 100, 1) if estimated_raw_tokens > 0 else 0.0

    data["token_metrics"] = {
        "raw_bytes": total_raw_bytes,
        "raw_bytes_human": f"{round(total_raw_bytes / 1024, 1)} KB",
        "estimated_raw_tokens": estimated_raw_tokens,
        "digest_bytes": digest_bytes,
        "digest_estimated_tokens": digest_estimated_tokens,
        "savings_percentage": f"{savings_pct}%"
    }

    # Session Health & Alignment Score (0 - 100)
    friction_count = len(data["friction_points"])
    error_count = len(data["errors"])
    ap_count = len(data.get("anti_patterns", []))
    deductions = (friction_count * 2) + (min(error_count, 10) * 1.5) + (ap_count * 5)
    health_score = max(50, min(100, int(100 - deductions)))

    if health_score >= 90:
        health_grade = "🌟 Excellent Alignment (완벽한 협업 및 빠른 목표 달성)"
    elif health_score >= 80:
        health_grade = "🟢 Good (양호한 협업 및 사소한 피드백 조정)"
    elif health_score >= 70:
        health_grade = "🟡 Moderate (중간 수준의 피드백 반복 및 조율 필요)"
    else:
        health_grade = "⚠️ Needs Alignment (잦은 정정 및 세밀한 규칙 준수 필요)"

    data["health_score"] = health_score
    data["health_grade"] = health_grade

    # Generate smart KPT suggestions
    data["suggested_kpt"] = generate_suggested_kpt(data)

    if args.format == "json":
        print(json.dumps(data, ensure_ascii=False, indent=2))
    else:
        print(f"# 📊 Session Raw Digest ({date_str})")
        print(f"- **Target Sessions**: {parsed_sessions_count}개 세션 분석됨 (전체 {len(brain_dirs)}개 중)")
        print(f"- **Session Health**: **{health_score}점** ({health_grade})")
        print(f"- **Token Metrics**: Raw {data['token_metrics']['raw_bytes_human']} (~{estimated_raw_tokens:,} tokens) ➡️ Digest ~{digest_estimated_tokens:,} tokens ({savings_pct}% saved)")
        print(f"- **Modified Files ({len(data['modified_files'])})**: {', '.join(data['modified_files'][:15]) if data['modified_files'] else 'None'}{' ...' if len(data['modified_files']) > 15 else ''}")
        
        kpt = data["suggested_kpt"]
        print(f"\n### 🎯 Suggested KPT Matrix")
        print(f"- **Keep**: {kpt['keep']}")
        print(f"- **Problem**: {kpt['problem']}")
        print(f"- **Try**: {kpt['try_rule']}")
        if kpt['rule_code'] != 'NONE':
            print(f"- **Recommended Rule**: `[{kpt['rule_code']}]` {kpt['rule_text']}")

        if data.get("anti_patterns"):
            print(f"\n### 🚨 Detected Toxic Anti-Patterns ({len(data['anti_patterns'])})")
            for ap in data["anti_patterns"]:
                print(f"- **{ap['label']}**")
                print(f"  - 권장 룰: `[{ap['rule_code']}]` {ap['rule_text']}")

        print(f"\n### 💬 User Friction Points ({len(data['friction_points'])})")
        for fp in data['friction_points'][:10]:
            print(f"- `{fp[:120]}`")
        if len(data['friction_points']) > 10:
            print(f"- *...외 {len(data['friction_points']) - 10}건 추가 수집됨*")
            
        print(f"\n### ⚠️ Errors Detected ({len(data['errors'])})")
        for err in data['errors'][:5]:
            print(f"- `{err.strip()[:120]}`")

if __name__ == "__main__":
    main()
