#!/usr/bin/env python3
"""
Agent-Friendly Rulebook Initializer (init_rules.py)
Generates high-compliance, attention-optimized rulebooks (GEMINI.md / CLAUDE.md / AGENTS.md)
tailored to specific technology stacks and language preferences.
"""

import sys
import argparse
from pathlib import Path

# Windows Unicode stdout safety
if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

TEMPLATES = {
    "react-ts": {
        "name": "React + TypeScript",
        "commands": """| Task | Command | Description |
| :--- | :--- | :--- |
| Install Dependencies | `npm install` | Install workspace packages |
| Type Check | `npx tsc --noEmit` | Mandatory post-edit verification |
| Dev Server | `npm run dev` | Launch local development server |
| Production Build | `npm run build` | Full production bundle compilation |
| Lint Check | `npm run lint` | ESLint static code quality audit |""",
        "specific_do": "- State Isolation: Keep component state within local feature files (`feature-atoms.ts`) instead of global store.\n- Zero Unused Imports: Clean up unused imports immediately after editing.",
        "specific_dont": "- Do not use CSS inline styles or arbitrary ad-hoc utility classes outside design system."
    },
    "nextjs": {
        "name": "Next.js (App Router)",
        "commands": """| Task | Command | Description |
| :--- | :--- | :--- |
| Install Dependencies | `npm install` | Install workspace packages |
| Type Check | `npx tsc --noEmit` | Mandatory post-edit verification |
| Dev Server | `npm run dev` | Launch Next.js dev server |
| Production Build | `npm run build` | Full Next.js production build |""",
        "specific_do": "- Use Server Components by default; add `'use client'` only when state or browser APIs are required.\n- Validate route params using standard Zod schemas.",
        "specific_dont": "- Never mix Client-side state hooks into Server Component files."
    },
    "fastapi": {
        "name": "Python FastAPI",
        "commands": """| Task | Command | Description |
| :--- | :--- | :--- |
| Virtual Env | `source .venv/bin/activate` | Activate Python virtual environment |
| Dev Server | `uvicorn app.main:app --reload` | Run local API server |
| Run Tests | `pytest -v` | Execute test suite |
| Type Checking | `mypy app` | Run static type checker |""",
        "specific_do": "- Use Pydantic v2 schemas for all request/response DTOs.\n- Use dependency injection for database sessions and services.",
        "specific_dont": "- Never perform synchronous blocking I/O calls inside `async def` route handlers."
    },
    "chrome-extension": {
        "name": "Chrome Extension (Manifest V3)",
        "commands": """| Task | Command | Description |
| :--- | :--- | :--- |
| Build Extension | `npm run build` | Build production distribution into `dist/` |
| Type Check | `npx tsc --noEmit` | Type checking verification |
| Lint Check | `npm run lint` | ESLint & security check |""",
        "specific_do": "- Enforce Manifest V3 standards with `background.service_worker`.\n- Use `chrome.runtime.getURL()` for all dynamic injected assets.\n- Wrap content script UI widgets in Shadow Roots for style isolation.",
        "specific_dont": "- NEVER load external scripts, CDN tags, or use `eval()` / `new Function()` (Remote Code Execution is banned).\n- Never request `<all_urls>` without explicit justification."
    },
    "general": {
        "name": "General Project",
        "commands": """| Task | Command | Description |
| :--- | :--- | :--- |
| Install Dependencies | `npm install` (or project pkg mgr) | Install required packages |
| Run Tests | `npm test` | Execute test suite |
| Production Build | `npm run build` | Build release artifacts |""",
        "specific_do": "- Keep functions focused and under 50 lines.\n- Extract reusable utilities when referenced across 2+ modules.",
        "specific_dont": "- Never leave mock implementations or `// TODO` stubs in production files."
    }
}

def generate_rulebook(stack: str, lang: str, project_name: str) -> str:
    template = TEMPLATES.get(stack, TEMPLATES["general"])

    if lang == "ko":
        return f"""# {project_name} 개발 규칙 및 에이전트 가이드라인 (GEMINI.md / CLAUDE.md)

이 문서는 프로젝트의 빌드, 검증, 아키텍처 규칙 및 AI 에이전트 필수 제약 조건을 규정합니다.

---

## 1. 빌드 및 명령어 레퍼런스 (Build & Commands)

{template['commands']}

---

## 2. 코어 제약 조건 (Core Constraints)

> [!IMPORTANT]
> **모든 AI 에이전트는 아래 지시사항을 최우선으로 따르며, 이를 위반하는 코드를 생성하거나 임의로 수정해서는 안 됩니다.**

### 🔴 DO NOT (CRITICAL CONSTRAINTS - 절대 금지)
* **임의 추측 및 독단적 수정 금지**: 요구사항, UI/UX, 비즈니스 로직이 모호한 경우 임의로 결정하지 말고 즉시 사용자에게 질문하십시오.
* **불필요한 주변 코드 수정 금지 (Surgical Edits Only)**: 요청받은 기능과 무관한 주변 코드나 주석을 "리팩토링" 목적으로 임의 변경하지 마십시오.
* **임시 목업/플레이스홀더 금지**: `// TODO: 추후 구현`과 같은 불완전한 코드를 남기지 말고 완전한 구현체를 작성하십시오.
* **UI 블로킹 및 무한 루프 금지**: 브라우저 `alert()`, `confirm()` 대화상자 사용 금지 및 터미널 무한 폴링 루프 실행 금지.
* {template['specific_dont']}

### 🟢 DO (MANDATORY ACTIONS - 필수 수행)
* **응답 언어 준수**: 사용자와의 모든 대화, 진행 상황 보고 및 설명은 항상 **한국어**로 작성하십시오.
* **수정 후 동기 검증 필수**: 코드 수정 후 반드시 컴파일/타입 검증 명령을 실행하여 정상 통과(Exit Code 0)를 확인하십시오.
* **외과 수술식 정리**: 본인이 수정한 코드로 인해 사용되지 않게 된 import나 변수만 깔끔하게 제거하십시오.
* {template['specific_do']}

---

## 3. 작업 진행 프로토콜 (Workflow Loop)

```mermaid
flowchart LR
    A[요구사항 분석] --> B[최소 범위 수정 구현]
    B --> C[동기적 빌드/타입 검증]
    C -->|성공| D[결과 한국어 보고]
    C -->|실패| B
```
"""
    else:
        return f"""# {project_name} Rules & Agent Guidelines (GEMINI.md / CLAUDE.md)

This document defines the build processes, testing standards, architecture patterns, and agent constraints for the project.

---

## 1. Build & Command Reference

{template['commands']}

---

## 2. Core Constraints

> [!IMPORTANT]
> **All AI coding agents must strictly follow these instructions as highest priority. Never deliver code or make arbitrary changes that violate these directives.**

### 🔴 DO NOT (CRITICAL CONSTRAINTS)
* **DO NOT Make Assumptions**: If requirements, UI layouts, or business logic are ambiguous, immediately stop and ask the user for clarification.
* **No Unsolicited Refactoring (Surgical Edits Only)**: Do not modify adjacent lines, comments, or formatting outside the requested task scope.
* **No Mock Stubs / TODOs**: Never leave placeholder functions, mock implementations, or `// TODO` comments. Deliver complete, production-grade code.
* **No UI Blocking Dialogs**: Never use `alert()`, `confirm()`, or `prompt()` in browser environments. Avoid infinite CLI polling loops.
* {template['specific_dont']}

### 🟢 DO (MANDATORY ACTIONS)
* **Mandatory Verification Loop**: Always execute synchronous build/typecheck commands (e.g., `npx tsc --noEmit` or `npm run build`) before responding.
* **Surgical Dead Code Cleanup**: Remove only the imports, variables, or functions that became orphaned as a direct result of your own edits.
* {template['specific_do']}

---

## 3. Agent Execution Protocol

```mermaid
flowchart LR
    A[Analyze Request] --> B[Execute Surgical Edits]
    B --> C[Run Verification Build]
    C -->|Passed| D[Report Concise Summary]
    C -->|Failed| B
```
"""

def main():
    parser = argparse.ArgumentParser(description="Initialize attention-optimized rulebooks for AI agents.")
    parser.add_argument("--stack", "-s", choices=list(TEMPLATES.keys()), default="general", help="Target project technology stack")
    parser.add_argument("--lang", "-l", choices=["ko", "en"], default="ko", help="Rulebook documentation language (default: ko)")
    parser.add_argument("--target", "-t", default="GEMINI.md", help="Output file path (default: GEMINI.md)")
    parser.add_argument("--name", "-n", default="Project", help="Project name (default: Project)")
    parser.add_argument("--force", "-f", action="store_true", help="Overwrite existing rulebook file")

    args = parser.parse_args()

    target_path = Path(args.target).resolve()
    if target_path.exists() and not args.force:
        print(f"Error: Target file '{target_path}' already exists. Use --force to overwrite.", file=sys.stderr)
        sys.exit(1)

    content = generate_rulebook(args.stack, args.lang, args.name)
    target_path.write_text(content, encoding="utf-8")
    print(f"✅ Successfully generated {template_name} rulebook at: {target_path}" if (template_name := TEMPLATES[args.stack]["name"]) else f"✅ Generated at {target_path}")

if __name__ == "__main__":
    main()
