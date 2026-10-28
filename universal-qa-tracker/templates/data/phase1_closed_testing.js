/**
 * Universal QA Master Dataset - Phase 1: Initial QA & Closed Testing
 * Clean Starter Dataset with 1 Sample IEEE 1044 Defect Severity Item
 */
window.UNIVERSAL_QA = window.UNIVERSAL_QA || {};
window.UNIVERSAL_QA.DATA = window.UNIVERSAL_QA.DATA || {};

window.MODO_QA_PHASE1 = window.UNIVERSAL_QA.DATA["phase1"] = [
  {
    "id": 1,
    "severity": "S1",
    "severityLabel": "🚨 S1 Blocker",
    "date": "2026-10-29",
    "platform": "all",
    "platformLabel": "🌐 All Platforms",
    "category": "reliability",
    "categoryLabel": "시스템 안정성",
    "title": "초기 프로젝트 빌드 및 정적 가드레일 무결성 검증 (Sample)",
    "problem": "신규 프로젝트 초기 세팅 시 정적 타입 검사(tsc) 및 린트 검증 파이프라인 누락 위험.",
    "solution": "TypeScript --noEmit 및 scripts/lint.js 동기 검증 게이트웨이 구축 완료.",
    "files": [
      "scripts/lint.js",
      "scripts/verify-all.js"
    ],
    "status": "resolved",
    "cause": "초기 환경 구성 시 자동화된 정적 검증 파이프라인 부재 방지 목적.",
    "actions": [
      "1. scripts/lint.js 정적 린터 구축",
      "2. 3중 검증(RULE-TRIPLE-VERIFY) 게이트웨이 연동",
      "3. 0 errors, 0 warnings 확인 완료"
    ],
    "title_en": "Initial Project Build & Static Guardrail Integrity Verification (Sample)",
    "problem_en": "Risk of missing static typecheck and linter pipeline during initial project setup.",
    "solution_en": "Built synchronous TypeScript --noEmit and scripts/lint.js verification gateways.",
    "deployed": true,
    "deployedVersion": "v1.0.0 (1)",
    "deployedDate": "2026-10-29"
  }
];
