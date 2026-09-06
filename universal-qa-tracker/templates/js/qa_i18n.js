/**
 * Universal QA Issue Tracker - Lightweight Internationalization (i18n) Engine.
 * Supported: 'en', 'ko', 'ja'.
 * Persisted in localStorage: 'universal_qa_lang'.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'universal_qa_lang';
  const DEFAULT_LANG = 'en';

  const DICTIONARY = {
    en: {
      appTitle: "📋 Universal QA Master Spreadsheet",
      analyticsTitle: "Universal QA Intelligence & Analytics Studio",
      portalTitle: "QA Intelligence & Tracker Portal",
      portalSubtitle: "Verified Issue Tracking Dataset & Phase Analytics System",
      spreadsheetView: "📋 Spreadsheet",
      dashboardView: "📊 Visual Dashboard",
      themeToggle: "🌓 Theme",
      langToggle: "🌐 English (EN)",
      langCode: "EN",
      langSwitchLabel: "🌐 EN",

      portalVisualTitle: "Visual Analytics Dashboard",
      portalVisualDesc: "Time-series resolution stack, quality radar, category breakdowns, and file hotspots.",
      portalSheetTitle: "Master Spreadsheet",
      portalSheetDesc: "Full issue inspection table, multi-dimensional filters, bookmarks, and real-time search.",

      statTotal: "Total: ",
      statResolved: "Resolved: ",
      statPending: "Pending: ",

      trackAll: "🚀 All Tracks",
      trackPhase1: "🔒 Phase 1: Core",
      trackPhase2: "🧪 Phase 2: Beta",
      trackPhase3: "💎 Phase 3: Production",
      trackCountUnit: "items",

      filterDateLabel: "📅 Date:",
      allDates: "All Dates",
      filterStatusLabel: "Status:",
      statusAll: "All Status",
      statusResolved: "✅ Resolved",
      statusPending: "⏳ Pending",
      statusHighlighted: "★ Bookmarked",
      searchPlaceholder: "Search (issue, root cause, file, platform, #ID)...",

      filterPlatformLabel: "📱 Platform:",
      platformAll: "All Platforms",
      platformIos: "🍎 iOS",
      platformAndroid: "🤖 Android",
      platformWeb: "🌐 Web",
      platformBackend: "⚙️ Backend",
      platformCommon: "🌐 Universal",

      filterCategoryLabel: "Category:",
      catAll: "All Categories",
      catReliability: "🛡️ Reliability",
      catCore: "⚡ Core",
      catUi: "🎨 UI/UX",
      catPerf: "🚀 Perf",
      catMedia: "🎙️ Media",
      catMonetization: "💰 Monetization",
      catAuth: "🔒 Auth",
      catDb: "💾 DB",

      thId: "ID ↕",
      thDate: "Date ↕",
      thPlatform: "Platform ↕",
      thCategory: "Category ↕",
      thTitle: "Issue Summary ↕",
      thCause: "Root Cause Analysis",
      thSolution: "Resolution & Action Items",
      thFiles: "Target Files",
      thStatus: "Status ↕",

      badgeResolved: "Resolved",
      badgePending: "Pending",
      noMatch: "🔍 No issues found matching the search and filter criteria.",
      showingCount: "Showing: {count} / {total} items",
      copiedToast: "📋 Text copied to clipboard!",
      bookmarkToastAdded: "★ Issue #{id} added to bookmarks.",
      bookmarkToastRemoved: "☆ Issue #{id} removed from bookmarks.",

      btnNewIssue: "New Issue",
      modalNewIssueTitle: "📝 Record New QA Issue",
      labelPhase: "Phase / Track:",
      labelCategory: "Category:",
      labelPlatform: "Platform:",
      labelStatus: "Status:",
      labelTitle: "Issue Title / Summary (*):",
      labelProblem: "Problem Description:",
      labelSolution: "Applied Solution / Fix:",
      labelFiles: "Modified Files:",
      labelScreenshots: "Screenshot Paths:",
      btnClose: "Close",
      btnCopyCli: "📋 Copy CLI Command",
      btnCopyJs: "📄 Copy JS Snippet"
    },
    ko: {
      appTitle: "📋 범용 QA 마스터 스프레드시트",
      analyticsTitle: "QA 인텔리전스 & 분석 스튜디오",
      portalTitle: "QA 인텔리전스 & 트래커 포털",
      portalSubtitle: "검증된 이슈 추적 데이터셋 및 단계별 품질 분석 시스템",
      spreadsheetView: "📋 스프레드시트",
      dashboardView: "📊 비주얼 대시보드",
      themeToggle: "🌓 테마",
      langToggle: "🌐 한국어 (KO)",
      langCode: "KO",
      langSwitchLabel: "🌐 KO",

      portalVisualTitle: "비주얼 분석 대시보드",
      portalVisualDesc: "시계열 누적 해결 스택, 6축 품질 레이더, 카테고리별 비중 및 코드 핫스팟 시각화.",
      portalSheetTitle: "마스터 스프레드시트",
      portalSheetDesc: "전체 이슈 정밀 전수 검사 테이블, 다차원 필터링(플랫폼/날짜/분류), 북마크 및 실시간 검색.",

      statTotal: "전체: ",
      statResolved: "해결: ",
      statPending: "진행중: ",

      trackAll: "🚀 전체 트랙 종합",
      trackPhase1: "🔒 Phase 1: 코어 검증",
      trackPhase2: "🧪 Phase 2: 베타 테스트",
      trackPhase3: "💎 Phase 3: 정식 출시",
      trackCountUnit: "건",

      filterDateLabel: "📅 일자별:",
      allDates: "전체 일자",
      filterStatusLabel: "상태별:",
      statusAll: "전체 상태",
      statusResolved: "✅ 해결 완료",
      statusPending: "⏳ 미해결/보류",
      statusHighlighted: "★ 중요 북마크",
      searchPlaceholder: "실시간 검색 (이슈 요약, 원인, 파일, 플랫폼, #ID)...",

      filterPlatformLabel: "📱 플랫폼:",
      platformAll: "전체 플랫폼",
      platformIos: "🍎 iOS",
      platformAndroid: "🤖 Android",
      platformWeb: "🌐 Web",
      platformBackend: "⚙️ Backend",
      platformCommon: "🌐 공통 (Universal)",

      filterCategoryLabel: "카테고리:",
      catAll: "전체 분류",
      catReliability: "🛡️ 신뢰성/크래시",
      catCore: "⚡ 기능/코어",
      catUi: "🎨 UI/UX",
      catPerf: "🚀 성능/자원",
      catMedia: "🎙️ 미디어/오디오",
      catMonetization: "💰 인앱결제/수익",
      catAuth: "🔒 인증/보안",
      catDb: "💾 DB/저장소",

      thId: "번호 ↕",
      thDate: "발생일 ↕",
      thPlatform: "플랫폼 ↕",
      thCategory: "분류 ↕",
      thTitle: "결함 요약 (Title) ↕",
      thCause: "근본 원인 분석 (Root Cause)",
      thSolution: "해결 방안 및 조치 (Resolution)",
      thFiles: "수정 대상 파일",
      thStatus: "상태 ↕",

      badgeResolved: "해결됨",
      badgePending: "대기중",
      noMatch: "🔍 검색 및 필터 조건과 일치하는 이슈가 없습니다.",
      showingCount: "표시 중: {count} / 전체 {total}건",
      copiedToast: "📋 클립보드에 복사되었습니다!",
      bookmarkToastAdded: "★ #{id}번 이슈가 북마크에 추가되었습니다.",
      bookmarkToastRemoved: "☆ #{id}번 이슈가 북마크에서 제거되었습니다.",

      btnNewIssue: "새 이슈 등록",
      modalNewIssueTitle: "📝 신규 QA 이슈 작성 & CLI 생성",
      labelPhase: "진행 단계 / 트랙:",
      labelCategory: "카테고리:",
      labelPlatform: "플랫폼:",
      labelStatus: "상태:",
      labelTitle: "이슈 제목 / 요약 (*):",
      labelProblem: "문제 현상 상세:",
      labelSolution: "해결 방안 및 조치:",
      labelFiles: "수정된 파일 목록:",
      labelScreenshots: "스크린샷 첨부 경로:",
      btnClose: "닫기",
      btnCopyCli: "📋 CLI 명령어 복사",
      btnCopyJs: "📄 JS 객체 코드 복사"
    },
    ja: {
      appTitle: "📋 汎用QAマスタースプレッドシート",
      analyticsTitle: "QAインテリジェンス＆分析スタジオ",
      portalTitle: "QAインテリジェンス＆トラッカーポータル",
      portalSubtitle: "検証済み課題追跡データセット＆フェーズ別品質分析システム",
      spreadsheetView: "📋 スプレッドシート",
      dashboardView: "📊 ビジュアルダッシュボード",
      themeToggle: "🌓 テーマ",
      langToggle: "🌐 日本語 (JA)",
      langCode: "JA",
      langSwitchLabel: "🌐 JA",

      portalVisualTitle: "ビジュアル分析ダッシュボード",
      portalVisualDesc: "時系列解決スタック、品質レーダー、カテゴリー別比率、コードホットスポットの可視化。",
      portalSheetTitle: "マスタースプレッドシート",
      portalSheetDesc: "全課題精密検査テーブル、多次元フィルター（プラットフォーム/日付/分類）、ブックマーク、リアルタイム検索。",

      statTotal: "全体: ",
      statResolved: "解決済: ",
      statPending: "対応中: ",

      trackAll: "🚀 全トラック総合",
      trackPhase1: "🔒 Phase 1: コア検証",
      trackPhase2: "🧪 Phase 2: ベータテスト",
      trackPhase3: "💎 Phase 3: 正式リリース",
      trackCountUnit: "件",

      filterDateLabel: "📅 日付別:",
      allDates: "全日付",
      filterStatusLabel: "ステータス:",
      statusAll: "全ステータス",
      statusResolved: "✅ 解決済み",
      statusPending: "⏳ 保留・対応中",
      statusHighlighted: "★ 重要ブックマーク",
      searchPlaceholder: "リアルタイム検索 (概要, 原因, ファイル, プラットフォーム, #ID)...",

      filterPlatformLabel: "📱 プラットフォーム:",
      platformAll: "全プラットフォーム",
      platformIos: "🍎 iOS",
      platformAndroid: "🤖 Android",
      platformWeb: "🌐 Web",
      platformBackend: "⚙️ Backend",
      platformCommon: "🌐 共通 (Universal)",

      filterCategoryLabel: "カテゴリー:",
      catAll: "全カテゴリー",
      catReliability: "🛡️ 信頼性/クラッシュ",
      catCore: "⚡ コア機能",
      catUi: "🎨 UI/UX",
      catPerf: "🚀 パフォーマンス",
      catMedia: "🎙️ メディア",
      catMonetization: "💰 課金/ストア",
      catAuth: "🔒 認証/セキュリティ",
      catDb: "💾 DB/ストレージ",

      thId: "番号 ↕",
      thDate: "日付 ↕",
      thPlatform: "対象 ↕",
      thCategory: "分類 ↕",
      thTitle: "課題概要 ↕",
      thCause: "根本原因分析",
      thSolution: "解決策・対応内容",
      thFiles: "対象ファイル",
      thStatus: "状態 ↕",

      badgeResolved: "解決済",
      badgePending: "対応中",
      noMatch: "🔍 条件に一致する課題が見つかりません。",
      showingCount: "表示中: {count} / 全体 {total}件",
      copiedToast: "📋 クリップボードにコピーしました！",
      bookmarkToastAdded: "★ #{id}の課題をブックマークに追加しました。",
      bookmarkToastRemoved: "☆ #{id}の課題をブックマークから解除しました。",

      btnNewIssue: "新規課題登録",
      modalNewIssueTitle: "📝 新規QA課題作成 & CLI生成",
      labelPhase: "フェーズ / トラック:",
      labelCategory: "カテゴリー:",
      labelPlatform: "プラットフォーム:",
      labelStatus: "ステータス:",
      labelTitle: "課題タイトル / 概要 (*):",
      labelProblem: "問題の現象と詳細:",
      labelSolution: "解決策および対応内容:",
      labelFiles: "修正ファイル一覧:",
      labelScreenshots: "スクリーンショット添付:",
      btnClose: "閉じる",
      btnCopyCli: "📋 CLIコマンドをコピー",
      btnCopyJs: "📄 JSコードをコピー"
    }
  };

  class UniversalQAI18n {
    constructor() {
      this.currentLang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
      if (!DICTIONARY[this.currentLang]) {
        this.currentLang = DEFAULT_LANG;
      }
    }

    get(key, params) {
      const dict = DICTIONARY[this.currentLang] || DICTIONARY[DEFAULT_LANG];
      let val = dict[key] || (DICTIONARY[DEFAULT_LANG] && DICTIONARY[DEFAULT_LANG][key]) || key;
      if (params && typeof params === 'object') {
        for (const p in params) {
          val = val.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
        }
      }
      return val;
    }

    setLang(lang) {
      if (DICTIONARY[lang]) {
        this.currentLang = lang;
        localStorage.setItem(STORAGE_KEY, lang);
        this.apply();
        if (window.MODO_QA && typeof window.MODO_QA.renderTable === 'function') {
          window.MODO_QA.renderTable();
        }
      }
    }

    cycleLang() {
      const langs = ['en', 'ko', 'ja'];
      const idx = langs.indexOf(this.currentLang);
      const next = langs[(idx + 1) % langs.length];
      this.setLang(next);
    }

    apply() {
      document.documentElement.lang = this.currentLang;
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) el.textContent = this.get(key);
      });
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key) el.placeholder = this.get(key);
      });
      const langBtn = document.getElementById('langToggleBtn');
      if (langBtn) {
        langBtn.textContent = this.get('langToggle');
      }
    }
  }

  window.UNIVERSAL_QA_I18N = new UniversalQAI18n();
  document.addEventListener('DOMContentLoaded', () => {
    window.UNIVERSAL_QA_I18N.apply();
  });
})();
