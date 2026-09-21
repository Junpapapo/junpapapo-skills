/**
 * Universal QA Master Dataset - Phase 1: Closed Testing
 * Clean Starter Dataset with 5 Representative IEEE 1044 Defect Severity Levels (S1-S5)
 */
window.UNIVERSAL_QA = window.UNIVERSAL_QA || {};
window.UNIVERSAL_QA.DATA = window.UNIVERSAL_QA.DATA || {};

window.MODO_QA_PHASE1 = window.UNIVERSAL_QA.DATA["phase1"] = [
  {
    "id": 1,
    "severity": "S1",
    "severityLabel": "🚨 S1 Blocker",
    "date": "2026-09-01",
    "platform": "all",
    "category": "reliability",
    "categoryLabel": "시스템 안정성",
    "title": "Application fatal crash on background resume",
    "problem": "App crashes with null pointer exception when resuming from background state on low memory devices.",
    "solution": "Added defensive null-checks and safe state restoration pipeline during lifecycle resume hook.",
    "files": [
      "src/lifecycle/AppStateHandler.ts"
    ],
    "status": "resolved",
    "cause": "Race condition between background detach and async state hydration.",
    "actions": [
      "1. Added null-safety check to AppStateHandler.ts",
      "2. Added unit tests for abrupt termination and resume",
      "3. Verified on both iOS and Android low-memory environments"
    ]
  },
  {
    "id": 2,
    "severity": "S2",
    "severityLabel": "🔥 S2 Critical",
    "date": "2026-09-02",
    "platform": "all",
    "category": "auth",
    "categoryLabel": "보안 & 인증",
    "title": "Cloud synchronization token silent expiration",
    "problem": "Sync fails silently without notifying user when OAuth refresh token expires after 7 days.",
    "solution": "Implemented proactive token refresh interceptor with graceful re-auth user prompt fallback.",
    "files": [
      "src/services/AuthService.ts",
      "src/services/SyncService.ts"
    ],
    "status": "resolved",
    "cause": "HTTP 401 response was swallowed in background sync worker without triggering auth refresh.",
    "actions": [
      "1. Built token interceptor with auto-refresh retry queue",
      "2. Added user-facing session expiration modal on persistent failure",
      "3. Verified with mock expired token test cases"
    ]
  },
  {
    "id": 3,
    "severity": "S3",
    "severityLabel": "⚡ S3 Major",
    "date": "2026-09-03",
    "platform": "ios",
    "category": "core",
    "categoryLabel": "코어 로직",
    "title": "Editor undo stack loses latest character on quick typing",
    "problem": "Rapid keystrokes bypass debounced undo snapshot, causing partial word loss on undo gesture.",
    "solution": "Refactored undo manager to flush pending buffer synchronously before creating new history entry.",
    "files": [
      "src/editor/UndoManager.ts"
    ],
    "status": "resolved",
    "cause": "Debounce timer (300ms) was dropping keystrokes when undo command arrived before timer fired.",
    "actions": [
      "1. Implemented sync flush in UndoManager.push()",
      "2. Added automated keystroke sequence tests"
    ]
  },
  {
    "id": 4,
    "severity": "S4",
    "severityLabel": "🌱 S4 Minor",
    "date": "2026-09-04",
    "platform": "android",
    "category": "ui",
    "categoryLabel": "UI / 디자인",
    "title": "Dark mode contrast ratio insufficient on navigation subtitle",
    "problem": "Navigation subtitle text color (#666666) fails WCAG AA 4.5:1 contrast ratio against dark background (#1C1C1E).",
    "solution": "Adjusted dark mode muted text color token to #8E8E93, achieving 5.2:1 contrast ratio.",
    "files": [
      "src/styles/theme.ts"
    ],
    "status": "resolved",
    "cause": "Static color applied instead of semantic theme token.",
    "actions": [
      "1. Replaced static hex color with theme.colors.textMuted",
      "2. Ran automated color contrast audit script"
    ]
  },
  {
    "id": 5,
    "severity": "S5",
    "severityLabel": "☕ S5 Trivial",
    "date": "2026-09-05",
    "platform": "all",
    "category": "perf",
    "categoryLabel": "성능 & 최적화",
    "title": "Clean up deprecated imports and dead helper functions",
    "problem": "Legacy helper functions from v1.0 prototype still exported, increasing bundle size.",
    "solution": "Audited and removed unreferenced exports, reducing JS bundle by 14KB.",
    "files": [
      "src/utils/legacyHelpers.ts"
    ],
    "status": "resolved",
    "cause": "Dead code remaining after v2 architecture migration.",
    "actions": [
      "1. Removed unused functions with zero references",
      "2. Verified clean build with tsc --noEmit"
    ]
  }
];
