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

def detect_primary_language(text_samples):
    """Detects the primary language of user inputs (ko, ja, zh, or en)."""
    if not text_samples:
        return "ko"
    
    combined = " ".join(text_samples)
    
    # Check Korean (Hangul syllables/jamo)
    hangul_count = len(re.findall(r"[\uac00-\ud7a3\u1100-\u11ff]", combined))
    # Check Japanese (Hiragana/Katakana)
    kana_count = len(re.findall(r"[\u3040-\u309f\u30a0-\u30ff]", combined))
    # Check Chinese (CJK without kana/hangul)
    cjk_count = len(re.findall(r"[\u4e00-\u9fff]", combined))
    
    if hangul_count > 10:
        return "ko"
    if kana_count > 10:
        return "ja"
    if cjk_count > 20 and hangul_count == 0 and kana_count == 0:
        return "zh"
    
    # Check Latin / English
    latin_count = len(re.findall(r"[a-zA-Z]", combined))
    if latin_count > 20 and hangul_count == 0:
        return "en"
        
    return "ko"

LANG_RESOURCES = {
    "ko": {
        "friction_keywords": [
            r"그게\s*아니", r"아닌데", r"누락됐", r"빠졌", r"다시\s*(?:해|작성|확인|봐)", r"왜\s*(?:안|없|바꿨|지웠|멋대로|그랬)",
            r"틀렸", r"잘못\s*(?:됐|된|알)", r"통일\s*(?:안\s*됨|해)", r"부족", r"확인하고\s*해",
            r"멋대로\s*(?:하|만들|판단|바꿔)", r"물어보고\s*해", r"안\s*나오잖아", r"보완해", r"수정해", r"야\.\."
        ],
        "anti_patterns": {
            "DESTRUCTIVE_DELETION": {
                "patterns": [
                    r"왜\s*(?:지웠|삭제했|없앴|날렸)", r"(?:임의로|멋대로|확인도\s*없이)\s*(?:삭제|지우)",
                    r"(?:지우지|삭제하지)\s*마", r"날아갔잖아", r"코드\s*복구해", r"왜\s*없어"
                ],
                "label": "🚨 확인 없는 코드/파일 삭제 (Destructive Deletion)",
                "rule_code": "RULE-CODE-PRESERVATION",
                "rule_text": "기존 유틸리티, 함수, 주석, 방어 로직을 사용자 확인 없이 임의 삭제하거나 축소하지 않는다."
            },
            "UNSOLICITED_EDIT": {
                "patterns": [
                    r"건드리지\s*마", r"왜\s*(?:바꿨|수정했|건드렸)", r"인접\s*코드\s*(?:건드리|바꾸)",
                    r"임의로\s*(?:수정|변경|리팩토링)", r"손대지\s*마", r"시키지도\s*않"
                ],
                "label": "🚨 불필요한 인접 코드 임의 수정 (Unsolicited Edits)",
                "rule_code": "RULE-SURGICAL-EDIT",
                "rule_text": "코드 수정 시 최소 변경 대상 라인만 외과수술식으로 수정하며 인접 코드 임의 변경을 금지한다."
            },
            "ARBITRARY_ASSUMPTION": {
                "patterns": [
                    r"멋대로\s*(?:판단|구현|결정|가정)", r"물어보고\s*(?:해|진행)", r"확인도\s*안\s*하고",
                    r"누가\s*그렇게", r"물어봐야지", r"독단적으로"
                ],
                "label": "🚨 임의 가정 및 독단적 코딩 (Arbitrary Assumptions)",
                "rule_code": "RULE-NO-ASSUMPTIONS",
                "rule_text": "요구사항이나 UI 배치가 불명확할 때는 독단적으로 추측하여 코딩하지 않고 반드시 먼저 옵션을 제시해 확인받는다."
            },
            "PLACEHOLDER_LAZINESS": {
                "patterns": [
                    r"//\s*todo", r"todo로\s*남기", r"todo\s*(?:남겨|방치)", r"임시로\s*두지",
                    r"목업만\s*만들", r"더미로\s*남기", r"나중에\s*구현하겠"
                ],
                "label": "🚨 TODO/플레이스홀더 방치 (Lazy Mockups/Placeholders)",
                "rule_code": "RULE-NO-PLACEHOLDERS",
                "rule_text": "나중에 구현하겠다는 // TODO나 임시 플레이스홀더를 남기지 않고 즉시 완전한 제품 코드를 작성한다."
            }
        },
        "kpt_templates": {
            "topic_prefix": "세션 작업 복기",
            "mod_files": "총 {count}개 파일 수정 및 모듈 안정화",
            "analysis_only": "프로젝트 분석 및 구조 검토",
            "build_pass": "빌드/타입 검증 {count}회 무결점 통과",
            "clean_session": "특이 마찰/오류 없음 (✨ Clean Session)",
            "friction_prefix": "사용자 정정 피드백 발생: {snippet}...",
            "error_prefix": "도구/빌드 실행 중 오류 발생: {snippet}...",
            "problem_anti_pattern": "일부 작업에서 {labels} 및 정정 지시 발생",
            "try_anti_pattern": "{rule_text} 준수 및 작업 전 영향 범위 사전 확인",
            "try_friction": "작업 전 요구사항 명확화 및 사용자 피드백 즉각 반영",
            "try_clean": "현재의 깔끔한 워크플로우와 선제 검증 프로세스 지속 유지",
            "surgical_rule_text": "코드 수정 시 최소 변경 대상 라인만 외과수술식으로 수정하며 인접 코드 임의 변경을 금지한다."
        }
    },
    "en": {
        "friction_keywords": [
            r"\bthat's not\b", r"\bnot what i\b", r"\bwrong\b", r"\bmissing\b", r"\bfix this\b", r"\binstead of\b",
            r"\bwhy did you\b", r"\bincorrect\b", r"\bforgot to\b", r"\bdon't touch\b", r"\bunsolicited\b",
            r"\bwhy is it missing\b", r"\bshould not\b", r"\bshould have\b", r"\byou broke\b", r"\brevert\b"
        ],
        "anti_patterns": {
            "DESTRUCTIVE_DELETION": {
                "patterns": [
                    r"\bwhy did you (?:delete|remove)\b", r"\bdon't delete\b", r"\bunauthorized deletion\b",
                    r"\bmissing code\b", r"\baccidental delete\b", r"\brestore the code\b"
                ],
                "label": "🚨 Unconfirmed Code/File Deletion (Destructive Deletion)",
                "rule_code": "RULE-CODE-PRESERVATION",
                "rule_text": "Never delete or shrink existing utilities, functions, comments, or guards without explicit confirmation."
            },
            "UNSOLICITED_EDIT": {
                "patterns": [
                    r"\bdon't (?:touch|modify|edit)\b", r"\bunsolicited\b", r"\bunrelated change\b",
                    r"\bwhy did you refactor\b", r"\bleave adjacent lines\b"
                ],
                "label": "🚨 Unsolicited Adjacent Code Edits (Unsolicited Edits)",
                "rule_code": "RULE-SURGICAL-EDIT",
                "rule_text": "Apply surgical edits strictly to minimal target lines and avoid arbitrary adjacent code modifications."
            },
            "ARBITRARY_ASSUMPTION": {
                "patterns": [
                    r"\bask first\b", r"\bdon't guess\b", r"\barbitrary assumption\b",
                    r"\bwithout asking\b", r"\bwho asked you to\b"
                ],
                "label": "🚨 Arbitrary Assumptions & Guesswork (Arbitrary Assumptions)",
                "rule_code": "RULE-NO-ASSUMPTIONS",
                "rule_text": "Never guess ambiguous requirements; always present options and obtain clarification before coding."
            },
            "PLACEHOLDER_LAZINESS": {
                "patterns": [
                    r"\bdon't leave (?:todo|placeholder)\b", r"\blazy placeholder\b",
                    r"\bmockup only\b", r"\bdummy placeholder\b", r"\bimplement fully\b"
                ],
                "label": "🚨 TODO / Dummy Placeholders (Lazy Mockups/Placeholders)",
                "rule_code": "RULE-NO-PLACEHOLDERS",
                "rule_text": "Never leave lazy // TODO or dummy placeholders; deliver complete, production-ready code immediately."
            }
        },
        "kpt_templates": {
            "topic_prefix": "Session Retrospective",
            "mod_files": "Modified {count} files with module stabilization",
            "analysis_only": "Project analysis and architecture review",
            "build_pass": "Build & type check passed {count} times with zero errors",
            "clean_session": "No friction or build failures (✨ Clean Session)",
            "friction_prefix": "User correction feedback: {snippet}...",
            "error_prefix": "Tool/build execution error: {snippet}...",
            "problem_anti_pattern": "Friction occurred regarding {labels} during execution",
            "try_anti_pattern": "Strictly follow {rule_code} and pre-verify blast radius before editing",
            "try_friction": "Clarify requirements upfront and immediately align with user feedback",
            "try_clean": "Maintain high-quality workflow and proactive verification loops",
            "surgical_rule_text": "Apply surgical edits strictly to minimal target lines and avoid arbitrary adjacent code modifications."
        }
    },
    "ja": {
        "friction_keywords": [
            r"違[うい]", r"抜けてる", r"やり直して", r"勝手に", r"確認して", r"消さないで",
            r"間違え", r"足りない", r"なぜ(?:変えた|消した)", r"触らないで", r"聞いてから"
        ],
        "anti_patterns": {
            "DESTRUCTIVE_DELETION": {
                "patterns": [r"勝手に(?:消した|削除した)", r"消さないで", r"コード復元", r"なんでないの"],
                "label": "🚨 確認なきコード・ファイル削除 (Destructive Deletion)",
                "rule_code": "RULE-CODE-PRESERVATION",
                "rule_text": "既存のユーティリティ、関数、コメント、ガードロジックをユーザーの確認なしに任意に削除または縮小しない。"
            },
            "UNSOLICITED_EDIT": {
                "patterns": [r"触らないで", r"勝手に(?:修正|変更|リファクタ)", r"関係ない行", r"隣接コード"],
                "label": "🚨 不要な隣接コードの任意修正 (Unsolicited Edits)",
                "rule_code": "RULE-SURGICAL-EDIT",
                "rule_text": "コード修正時は最小限の対象行のみ外科手術式に修正し、隣接コードの任意変更を禁止する。"
            },
            "ARBITRARY_ASSUMPTION": {
                "patterns": [r"勝手に判断", r"確認してから", r"聞いてから", r"独断で", r"勝手に決め"],
                "label": "🚨 独断的推測・勝手な実装 (Arbitrary Assumptions)",
                "rule_code": "RULE-NO-ASSUMPTIONS",
                "rule_text": "要件やUI配置が不明確な場合は独断で推測して実装せず、必ず事前に選択肢を提示して確認を得る。"
            },
            "PLACEHOLDER_LAZINESS": {
                "patterns": [r"//\s*todo", r"todoで放置", r"モックだけ", r"後で実装", r"ダミーのまま"],
                "label": "🚨 TODO・プレースホルダーの放置 (Lazy Mockups/Placeholders)",
                "rule_code": "RULE-NO-PLACEHOLDERS",
                "rule_text": "後で実装するという// TODOや一時的なプレースホルダーを残さず、即座に完全な製品コードを作成する。"
            }
        },
        "kpt_templates": {
            "topic_prefix": "セッション作業振り返り",
            "mod_files": "計{count}個のファイル修正およびモジュール安定化",
            "analysis_only": "プロジェクト分析および構造レビュー",
            "build_pass": "ビルド/型検証 {count}回ノーエラー通過",
            "clean_session": "特異な摩擦・エラーなし (✨ Clean Session)",
            "friction_prefix": "ユーザー修正フィードバック発生: {snippet}...",
            "error_prefix": "ツール/ビルド実行エラー: {snippet}...",
            "problem_anti_pattern": "一部作業で {labels} および修正指示が発生",
            "try_anti_pattern": "{rule_text} 遵守および作業前の影響範囲事前確認",
            "try_friction": "作業前の要件明確化およびユーザーフィードバックの即時反映",
            "try_clean": "現在のクリーンなワークフローと検証プロセスを継続維持",
            "surgical_rule_text": "コード修正時は最小限の対象行のみ外科手術式に修正し、隣接コードの任意変更を禁止する。"
        }
    }
}

def generate_suggested_kpt(data, lang="ko"):
    """Generates high-quality KPT pre-fill suggestions in the user's matching language."""
    res = LANG_RESOURCES.get(lang, LANG_RESOURCES["ko"])
    tmpl = res["kpt_templates"]
    
    mod_files = data.get("modified_files", [])
    tasks = data.get("tasks", [])
    anti_patterns = data.get("anti_patterns", [])
    friction_points = data.get("friction_points", [])
    errors = data.get("errors", [])
    
    # 1. Keep suggestion
    passed_tasks = [t for t in tasks if not t.get("has_error")]
    keep_parts = []
    if mod_files:
        keep_parts.append(tmpl["mod_files"].format(count=len(mod_files)))
    else:
        keep_parts.append(tmpl["analysis_only"])
    
    if passed_tasks:
        keep_parts.append(tmpl["build_pass"].format(count=len(passed_tasks)))
    keep_text = ", ".join(keep_parts)

    # 2. Problem suggestion
    if anti_patterns:
        prob_labels = [ap.get("label", "").split(" ")[-1].replace("(", "").replace(")", "") for ap in anti_patterns[:2]]
        prob_text = tmpl["problem_anti_pattern"].format(labels=", ".join(prob_labels))
    elif friction_points:
        clean_fp = re.sub(r"[\r\n]+", " ", str(friction_points[0])).strip()
        prob_text = tmpl["friction_prefix"].format(snippet=clean_fp[:80])
    elif errors:
        clean_err = re.sub(r"[\r\n]+", " ", str(errors[0])).strip()
        prob_text = tmpl["error_prefix"].format(snippet=clean_err[:80])
    else:
        prob_text = tmpl["clean_session"]

    if anti_patterns:
        primary_ap = anti_patterns[0]
        try_text = tmpl["try_anti_pattern"].format(rule_text=primary_ap["rule_text"], rule_code=primary_ap["rule_code"])
        rule_code = primary_ap["rule_code"]
        rule_text = primary_ap["rule_text"]
        rule_status = "candidate"
    elif friction_points:
        try_text = tmpl["try_friction"]
        rule_code = "RULE-SURGICAL-EDIT"
        rule_text = tmpl["surgical_rule_text"]
        rule_status = "candidate"
    else:
        try_text = tmpl["try_clean"]
        rule_code = "NONE"
        rule_text = "N/A"
        rule_status = "none"

    topic_date = data.get('date', 'Today')
    return {
        "suggested_topic": f"{tmpl['topic_prefix']} ({topic_date})",
        "keep": keep_text,
        "problem": prob_text,
        "try_rule": try_text,
        "rule_code": rule_code,
        "rule_text": rule_text,
        "rule_status": rule_status,
        "language": lang
    }

def find_gemini_brain_dirs(target_date_str=None, days=None, since_date_str=None):
    home = Path.home()
    gemini_brain_root = home / ".gemini" / "antigravity" / "brain"
    if not gemini_brain_root.exists(): return []

    dirs = [d for d in gemini_brain_root.iterdir() if d.is_dir() and d.name not in ["scratch", "tempmediaStorage"]]
    dirs.sort(key=lambda d: d.stat().st_mtime, reverse=True)
    now = datetime.now(timezone.utc)

    if days is not None and days > 0:
        cutoff = now - timedelta(days=days)
        return [d for d in dirs if datetime.fromtimestamp(d.stat().st_mtime, tz=timezone.utc) >= cutoff]
    if since_date_str:
        try:
            since_dt = datetime.strptime(since_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            return [d for d in dirs if datetime.fromtimestamp(d.stat().st_mtime, tz=timezone.utc) >= since_dt]
        except ValueError: pass
    if target_date_str:
        matched = [d for d in dirs if datetime.fromtimestamp(d.stat().st_mtime, tz=timezone.utc).strftime("%Y-%m-%d") == target_date_str]
        return matched if matched else dirs[:1]
    today_str = now.strftime("%Y-%m-%d")
    today_dirs = [d for d in dirs if datetime.fromtimestamp(d.stat().st_mtime, tz=timezone.utc).strftime("%Y-%m-%d") == today_str]
    return today_dirs if today_dirs else dirs[:1]

def parse_transcript_file(transcript_path, workspace_filter=None, lang="ko"):
    """Parses a single transcript.jsonl file for signals using language-specific resources."""
    user_inputs = []
    errors = []
    modified_files = set()
    tool_counts = {}
    file_churn_counts = {}
    detected_anti_patterns = []
    
    if not transcript_path.exists():
        return user_inputs, errors, list(modified_files), tool_counts, detected_anti_patterns, file_churn_counts, False

    lang_res = LANG_RESOURCES.get(lang, LANG_RESOURCES["ko"])
    friction_keywords = lang_res["friction_keywords"]
    anti_patterns_map = lang_res["anti_patterns"]

    ws_clean = os.path.basename(workspace_filter).lower() if workspace_filter else None
    has_ws_signal = False

    with open(transcript_path, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line: continue
            try: step = json.loads(line)
            except: continue

            step_type, content, status, tool_calls = step.get("type", ""), step.get("content", ""), step.get("status", ""), step.get("tool_calls", [])
            if ws_clean and ws_clean in str(content).lower(): has_ws_signal = True

            if step_type == "USER_INPUT" and content:
                clean_content = re.sub(r"<USER_REQUEST>|</USER_REQUEST>|<ADDITIONAL_METADATA>.*?</ADDITIONAL_METADATA>|<USER_SETTINGS_CHANGE>.*?</USER_SETTINGS_CHANGE>", "", content, flags=re.DOTALL).strip()
                if clean_content:
                    is_friction = any(re.search(pat, clean_content, re.IGNORECASE) for pat in friction_keywords)
                    user_inputs.append({"text": clean_content, "is_friction": is_friction})
                    for ap_key, ap_info in anti_patterns_map.items():
                        if any(re.search(pat, clean_content, re.IGNORECASE) for pat in ap_info["patterns"]):
                            detected_anti_patterns.append({
                                "type": ap_key, "label": ap_info["label"], "rule_code": ap_info["rule_code"],
                                "rule_text": ap_info["rule_text"], "trigger_context": clean_content[:200]
                            })

            if status == "ERROR" or (isinstance(content, str) and "error" in content.lower() and step_type != "USER_INPUT"):
                errors.append(str(content)[:300])

            if tool_calls:
                for call in tool_calls:
                    name = call.get("name", "") if isinstance(call, dict) else str(call)
                    tool_counts[name] = tool_counts.get(name, 0) + 1
                    args = call.get("arguments", {}) if isinstance(call, dict) else {}
                    if isinstance(args, dict):
                        target_file = args.get("TargetFile") or args.get("file_path") or args.get("path") or args.get("Cwd")
                        if target_file:
                            tf_str = str(target_file)
                            if ws_clean and ws_clean in tf_str.lower(): has_ws_signal = True
                            fname = os.path.basename(tf_str)
                            if name in ["replace_file_content", "write_to_file", "multi_replace_file_content"]:
                                modified_files.add(fname)
                                file_churn_counts[fname] = file_churn_counts.get(fname, 0) + 1

    for fname, count in file_churn_counts.items():
        if count >= 4:
            if lang == "en":
                ft_label = f"🚨 File Thrashing ({fname} modified {count} times)"
                ft_text = "Never edit the same file repeatedly; analyze full blast radius and execute with single-pass precision."
            elif lang == "ja":
                ft_label = f"🚨 同一ファイルの繰り返し修正 (File Thrashing - {fname} {count}回修正)"
                ft_text = "同一ファイルを何度も修正せず、事前影響範囲を完全に分析した上で1回で精密に修正する。"
            else:
                ft_label = f"🚨 동일 파일 반복 수정 뺑뺑이 (File Thrashing - {fname} {count}회 수정)"
                ft_text = "동일 파일을 뗐다 붙였다 반복 수정하지 않고, 사전 영향 범위를 완전히 분석한 뒤 1회에 정밀 수정한다."
            
            detected_anti_patterns.append({
                "type": "FILE_THRASHING", "label": ft_label, "rule_code": "RULE-ONE-PASS-PRECISION",
                "rule_text": ft_text, "trigger_context": f"File '{fname}' was modified {count} times."
            })

    return user_inputs, errors, sorted(list(modified_files)), tool_counts, detected_anti_patterns, file_churn_counts, has_ws_signal

def parse_task_logs(brain_dir):
    tasks_dir = brain_dir / ".system_generated" / "tasks"
    if not tasks_dir.exists(): return []
    task_summaries = []
    for log_file in sorted(tasks_dir.glob("task-*.log"), key=lambda p: p.stat().st_mtime):
        try:
            with open(log_file, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
                has_error = "exited with code" in content and not "exited with code 0" in content
                task_summaries.append({"task_file": log_file.name, "has_error": has_error, "snippet": content[-400:]})
        except: continue
    return task_summaries

def parse_git_fallback(workspace_dir):
    import subprocess
    try:
        res = subprocess.run(["git", "-C", str(workspace_dir), "log", "-n", "5", "--oneline", "--stat"], capture_output=True, text=True, check=True)
        return res.stdout
    except: return "Git fallback unavailable"

def main():
    parser = argparse.ArgumentParser(description="Parse AI agent session logs for retrospective.")
    parser.add_argument("--date", default=None)
    parser.add_argument("--days", type=int, default=None)
    parser.add_argument("--since", default=None)
    parser.add_argument("--session-id", default=None)
    parser.add_argument("--workspace", default=os.getcwd())
    parser.add_argument("--filter-workspace", action="store_true")
    parser.add_argument("--lang", choices=["auto", "ko", "en", "ja", "zh"], default="auto")
    parser.add_argument("--format", choices=["json", "markdown"], default="json")
    args = parser.parse_args()

    date_str = args.date or datetime.now().strftime("%Y-%m-%d")
    brain_dirs = []

    if args.session_id:
        brain_path = Path.home() / ".gemini" / "antigravity" / "brain" / args.session_id
        if brain_path.exists(): brain_dirs = [brain_path]
    elif args.days is not None: brain_dirs = find_gemini_brain_dirs(days=args.days)
    elif args.since: brain_dirs = find_gemini_brain_dirs(since_date_str=args.since)
    else: brain_dirs = find_gemini_brain_dirs(target_date_str=args.date)

    data = {
        "date": date_str, "total_sessions_found": len(brain_dirs), "brain_sessions": [],
        "user_inputs": [], "friction_points": [], "errors": [], "modified_files": [],
        "tool_counts": {}, "tasks": [], "git_summary": "", "detected_language": "ko"
    }

    raw_user_texts = []
    for b_dir in brain_dirs:
        t_file = b_dir / ".system_generated" / "logs" / "transcript.jsonl"
        if not t_file.exists(): t_file = b_dir / "transcript.jsonl"
        if t_file.exists():
            with open(t_file, "r", encoding="utf-8", errors="replace") as f:
                for line in f:
                    if '"type":"USER_INPUT"' in line:
                        try:
                            s_json = json.loads(line)
                            c_txt = s_json.get("content", "")
                            clean_c = re.sub(r"<USER_REQUEST>|</USER_REQUEST>|<ADDITIONAL_METADATA>.*?</ADDITIONAL_METADATA>|<USER_SETTINGS_CHANGE>.*?</USER_SETTINGS_CHANGE>", "", c_txt, flags=re.DOTALL).strip()
                            if clean_c: raw_user_texts.append(clean_c)
                        except: pass

    target_lang = args.lang if args.lang != "auto" else detect_primary_language(raw_user_texts)
    data["detected_language"] = target_lang

    total_raw_bytes = 0
    parsed_sessions_count = 0
    for b_dir in brain_dirs:
        t_file = b_dir / ".system_generated" / "logs" / "transcript.jsonl"
        if not t_file.exists(): t_file = b_dir / "transcript.jsonl"
        if not t_file.exists(): continue

        u_inputs, errs, mod_files, t_counts, anti_patterns, churns, is_ws_match = parse_transcript_file(t_file, workspace_filter=args.workspace if args.filter_workspace else None, lang=target_lang)
        if args.filter_workspace and not is_ws_match: continue

        parsed_sessions_count += 1
        data["brain_sessions"].append(str(b_dir.name))
        total_raw_bytes += t_file.stat().st_size
        data["errors"].extend(errs)
        data["modified_files"] = sorted(list(set(data["modified_files"] + mod_files)))
        for k, v in t_counts.items(): data["tool_counts"][k] = data["tool_counts"].get(k, 0) + v
        data["tasks"].extend(parse_task_logs(b_dir))
        data["anti_patterns"] = data.get("anti_patterns", []) + anti_patterns
        for item in u_inputs:
            data["user_inputs"].append(item["text"])
            if item["is_friction"]: data["friction_points"].append(item["text"])

    if not brain_dirs:
        data["git_summary"] = parse_git_fallback(args.workspace)

    unique_aps = {}
    for ap in data.get("anti_patterns", []):
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
        health_grade = "🌟 Excellent Alignment" if target_lang == "en" else "🌟 Excellent Alignment (완벽한 협업 및 빠른 목표 달성)"
    elif health_score >= 80:
        health_grade = "🟢 Good" if target_lang == "en" else "🟢 Good (양호한 협업 및 사소한 피드백 조정)"
    elif health_score >= 70:
        health_grade = "🟡 Moderate" if target_lang == "en" else "🟡 Moderate (중간 수준의 피드백 반복 및 조율 필요)"
    else:
        health_grade = "⚠️ Needs Alignment" if target_lang == "en" else "⚠️ Needs Alignment (잦은 정정 및 세밀한 규칙 준수 필요)"

    data["health_score"] = health_score
    data["health_grade"] = health_grade

    # Generate smart KPT suggestions in target language
    data["suggested_kpt"] = generate_suggested_kpt(data, lang=target_lang)

    if args.format == "json":
        print(json.dumps(data, ensure_ascii=False, indent=2))
    else:
        print(f"# 📊 Session Raw Digest ({date_str})")
        print(f"- **Target Sessions**: {parsed_sessions_count} sessions parsed (Language: {target_lang})")
        print(f"- **Session Health**: **{health_score}** ({health_grade})")
        print(f"- **Token Metrics**: Raw {data['token_metrics']['raw_bytes_human']} (~{estimated_raw_tokens:,} tokens) ➡️ Digest ~{digest_estimated_tokens:,} tokens ({savings_pct}% saved)")
        print(f"- **Modified Files ({len(data['modified_files'])})**: {', '.join(data['modified_files'][:15]) if data['modified_files'] else 'None'}{' ...' if len(data['modified_files']) > 15 else ''}")
        
        kpt = data["suggested_kpt"]
        print(f"\n### 🎯 Suggested KPT Matrix ({target_lang.upper()})")
        print(f"- **Keep**: {kpt['keep']}")
        print(f"- **Problem**: {kpt['problem']}")
        print(f"- **Try**: {kpt['try_rule']}")
        if kpt['rule_code'] != 'NONE':
            print(f"- **Recommended Rule**: `[{kpt['rule_code']}]` {kpt['rule_text']}")

        if data.get("anti_patterns"):
            print(f"\n### 🚨 Detected Toxic Anti-Patterns ({len(data['anti_patterns'])})")
            for ap in data["anti_patterns"]:
                print(f"- **{ap['label']}**")
                print(f"  - Recommended Rule: `[{ap['rule_code']}]` {ap['rule_text']}")

        print(f"\n### 💬 User Friction Points ({len(data['friction_points'])})")
        for fp in data['friction_points'][:10]:
            print(f"- `{fp[:120]}`")
        if len(data['friction_points']) > 10:
            print(f"- *...and {len(data['friction_points']) - 10} more*")
            
        print(f"\n### ⚠️ Errors Detected ({len(data['errors'])})")
        for err in data['errors'][:5]:
            print(f"- `{err.strip()[:120]}`")

if __name__ == "__main__":
    main()
