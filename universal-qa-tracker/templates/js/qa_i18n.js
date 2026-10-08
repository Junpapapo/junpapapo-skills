/**
 * Universal QA Issue Tracker - Lightweight Internationalization (i18n) Engine.
 * Default language: English ('en').
 * Supported: 'en', 'ko'.
 * Persisted in localStorage: 'qa_tracker_lang'.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'qa_tracker_lang';
  const DEFAULT_LANG = 'en';

  const DICTIONARY = {
    en: {
      // Top Bar & Controls
      appTitle: "📋 Modo QA Master Spreadsheet",
      analyticsTitle: "Modo QA Intelligence & Analytics Studio",
      portalTitle: "QA Intelligence & Tracker Portal",
      portalSubtitle: "Verified Issue Tracking Dataset & Phase Analytics System",
      spreadsheetView: "📋 Spreadsheet",
      dashboardView: "📊 Visual Dashboard",
      navMemo: "📝 Memo",
      themeToggle: "🌓 Theme",
      helpGuideBtn: "❓ Help & Guide",
      btnSaveDeploy: "Save Deploy Data",
      btnSaveRelease: "Save",
      appProfileSectionTitle: "App & Official Stores",
      appProfileRowTitle: "App Profile & Stores",
      appProfilePopoverBtn: "📱 Details ↗",
      officialWebBtnTitle: "Official Website (Visit)",
      modalGuideTitle: "Modo QA Standards & Severity Guide",
      modalGuideSubtitle: "Standard criteria for classifying issue criticality and SLA response priority.",
      modalGuideClose: "Close",
      modalGuideGotIt: "Understood",
      sevGuideS1Title: "S1 Blocker (Showstopper)",
      sevGuideS1Badge: "Immediate Fix (P0)",
      sevGuideS1Desc: "App crash, infinite freezing/deadlock, data loss/corruption, payment failure, or app store review rejection. Critical user journeys are completely blocked with zero workarounds.",
      sevGuideS2Title: "S2 Critical (Severe Defect)",
      sevGuideS2Badge: "Urgent Fix (P1)",
      sevGuideS2Desc: "Core business logic defect, cloud sync loss, notification/permission failure, or significant feature breakdown without a viable workaround.",
      sevGuideS3Title: "S3 Major (Standard Defect)",
      sevGuideS3Badge: "Sprint Priority (P2)",
      sevGuideS3Desc: "General feature bug or edge case error where a reasonable workaround exists. State sync delays or abnormal gesture responses.",
      sevGuideS4Title: "S4 Minor (Cosmetic Defect)",
      sevGuideS4Badge: "Polishing (P3)",
      sevGuideS4Desc: "UI padding/alignment deviations, dark mode contrast issues, typos, or minor text overflow/clipping without functional impact.",
      sevGuideS5Title: "S5 Trivial (Refactor / Hygiene)",
      sevGuideS5Badge: "Maintenance (P4)",
      sevGuideS5Desc: "Code readability refactoring, unused variable cleanup, 400-line modularization, and architectural governance for maintainability.",
      sevGuideTip: "💡 Tip: When registering via CLI (add_issue.py), severity is automatically inferred if --severity is omitted.",
      langToggle: "🌐 English (EN)",
      langCode: "EN",
      langSwitchLabel: "🌐 EN",

      // Portal Index Cards
      portalVisualTitle: "Visual Analytics Dashboard",
      portalVisualDesc: "Time-series resolution stack, maturity golden shift, 6-axis quality radar, and live code hotspots.",
      portalSheetTitle: "Master Spreadsheet",
      portalSheetDesc: "Full issue inspection table, multi-dimensional filters (OS/Date/Category), bookmarks, and real-time search.",

      // Header Stats
      statTotal: "Total: ",
      statResolved: "Resolved: ",
      statPending: "Pending: ",

      // Track Tabs
      trackAll: "All Tracks",
      trackPhase1: "Phase 1 Android Closed",
      trackPhase2: "Phase 2 iOS TestFlight",
      trackPhase3: "Phase 3 Production",
      trackPhase4: "Phase 4 Future Roadmap",
      trackFeedback: "User VOC",
      trackCountUnit: "items",
      btnConvertToQa: "🚀 Convert to QA Issue",
      btnSyncSheet: "Sync Sheet",
      btnOpenGoogleSheet: "Google Sheet ↗",
      btnCopyQuote: "Copy Quote",
      qaConvertedToast: "QA Issue registration snippet copied to clipboard!",

      // Filters Line 1
      filterDateLabel: "📅 Date:",
      allDates: "All Dates",
      filterStatusLabel: "Status:",
      statusAll: "All Status",
      statusResolved: "✅ Resolved",
      statusPending: "⏳ Pending",
      statusHighlighted: "★ Bookmarked",
      statusVoc: "💬 VOC Escalated",
      vocExecTitle: "Customer Voice (VOC) & CS Quality Intelligence",
      vocExecSubtitle: "Real-time user feedback telemetry, satisfaction rating, and QA escalation traceability",
      vocExecOpenStudio: "💬 Open VOC Studio ↗",
      vocMetricRating: "User Satisfaction",
      vocMetricTotal: "Total Inquiries",
      vocMetricEscalation: "QA Escalation Rate",
      vocMetricCategory: "Primary Domain",
      searchPlaceholder: "Search (issue, root cause, file, OS, #ID)...",

      // Filters Line 2
      filterPlatformLabel: "📱 OS:",
      platformAll: "All OS",
      platformIos: "iOS",
      platformAndroid: "Android",
      platformCommon: "Universal",

      filterCategoryLabel: "Category:",
      catAll: "All Categories",
      catReliability: "🛡️ Reliability",
      catCore: "⚡ Core",
      catUi: "🎨 UI/UX",
      catPerf: "🚀 Perf",
      catMedia: "🎙️ Media",
      catMonetization: "💰 Monetization",
      catAuth: "🔒 Auth/Security",
      catDb: "💾 Database",

      // Severity Filters (IEEE 1044 / ISTQB)
      filterSeverityLabel: "Severity:",
      sevAll: "All Severity",
      sevS1: "🚨 S1 Blocker",
      sevS2: "🔥 S2 Critical",
      sevS3: "⚡ S3 Major",
      sevS4: "🌱 S4 Minor",
      sevS5: "☕ S5 Trivial",

      // Table Counts & Empty
      tableCount: "Showing: {filtered} / {total} items",
      noMatch: "🔍 No issues found matching the search and filter criteria.",

      // Table Column Headers
      thDeploy: "Deploy ↕",
      thId: "ID ↕",
      thSeverity: "Severity ↕",
      thDate: "Date ↕",
      thPlatform: "OS ↕",
      thCategory: "Category ↕",
      thTitle: "Issue Summary ↕",
      thCause: "Root Cause Analysis",
      thSolution: "Resolution & Action Items",
      thFiles: "Files",
      popoverFilesTitle: "Target Files",
      popoverCopyAll: "📋 Copy All",
      popoverCopied: "Copied! ✅",
      popoverInspectAll: "🔍 View in Inspector Panel ↗",
      thStatus: "Status ↕",
      thRating: "Rating ↕",
      thDevice: "Device / OS ↕",
      thFeedbackContent: "Feedback & Details ↕",
      thUpvotes: "Votes ↕",

      // Deploy & Release Notes
      thDeploy: "Deploy ↕",
      thDeployAos: "AOS Deploy ↕",
      thDeployIos: "iOS Deploy ↕",
      statDeployed: "Deployed: ",
      statDeployedAos: "AOS: ",
      statDeployedIos: "iOS: ",
      filterDeployLabel: "Deploy:",
      filterDeployAll: "All",
      filterDeployAos: "AOS Deployed",
      filterDeployIos: "iOS Deployed",
      filterDeployBoth: "Both Deployed",
      filterDeployed: "Deployed",
      filterNotDeployed: "Pending",
      btnDetailFilters: "Detail Filters",
      btnResetFilters: "Reset",
      btnCopyReleaseNotes: "Release Notes",
      btnCopyReleaseNotesLatest: "Latest Release",
      btnCopyReleaseNotesAll: "All Releases",
      btnCopyReleaseNotesAosLatest: "Copy AOS Latest",
      btnCopyReleaseNotesAosAll: "AOS All Releases",
      btnCopyReleaseNotesIosLatest: "Copy iOS Latest",
      btnCopyReleaseNotesIosAll: "iOS All Releases",
      btnCopyReleaseNotesLatestTooltip: "Copy release notes for current target release only",
      btnCopyReleaseNotesAllTooltip: "Copy full release history grouped by version",
      toastReleaseNotesCopied: "📢 Release notes for deployed items copied to clipboard!",
      toastReleaseNotesCopiedLatest: "📢 Latest release notes ({ver}) copied to clipboard!",
      toastReleaseNotesCopiedAll: "📜 Full release notes across all versions copied to clipboard!",
      toastReleaseNotesCopiedAosLatest: "📢 Android release notes ({ver}) copied to clipboard!",
      toastReleaseNotesCopiedIosLatest: "🍎 iOS release notes ({ver}) copied to clipboard!",
      toastReleaseNotesCopiedAosAll: "📜 Full Android release notes ({count} items) copied to clipboard!",
      toastReleaseNotesCopiedIosAll: "📜 Full iOS release notes ({count} items) copied to clipboard!",
      toastNoDeployedItems: "⚠️ No items currently marked as Deployed (ON).",
      toastNoDeployedItemsAos: "⚠️ No items deployed on Android.",
      toastNoDeployedItemsIos: "⚠️ No items deployed on iOS.",
      toastNoLatestDeployedItems: "⚠️ No deployed items found for target release '{ver}'.",
      toastNoLatestDeployedItemsAos: "⚠️ No Android deployed items found for release '{ver}'.",
      toastNoLatestDeployedItemsIos: "⚠️ No iOS deployed items found for release '{ver}'.",
      targetReleaseLabel: "Release:",
      targetReleaseAosLabel: "AOS Release:",
      targetReleaseIosLabel: "iOS Release:",
      targetReleasePlaceholder: "Target Release (e.g. 70 (1.1.3))",
      targetReleaseAosPlaceholder: "AOS Release (e.g. 71 (1.1.5))",
      targetReleaseIosPlaceholder: "iOS Release (e.g. 45 (1.1.5))",
      modalEditDeployTitle: "Edit Deployment Release",
      modalEditDeployTitleAos: "Edit Android Deployment Release",
      modalEditDeployTitleIos: "Edit iOS Deployment Release",
      modalEditDeployDesc: "Specify which app release this issue was deployed to.",
      btnApplyTargetRelease: "Apply Current ({ver})",
      btnSaveRelease: "Save",
      btnCancel: "Cancel",
      tooltipClickToEditRelease: "Click to edit deployment release",
      deployNaTooltipIosOnly: "iOS Exclusive (N/A for Android)",
      deployNaTooltipAosOnly: "Android Exclusive (N/A for iOS)",


      // Detail Box
      detailCauseTitle: "🔍 Root Cause & Technical Background ({plat})",
      detailActionTitle: "🛠️ Resolution Details & Actions",
      detailCauseFallback: "Feature optimization and UX polishing.",
      platIosOnly: "🍎 iOS Exclusive",
      platAndroidOnly: "🤖 Android Exclusive",
      platCommon: "🌐 Universal",
      clickToPin: "Click to toggle bookmark/pin",

      // Status Badges
      badgeResolved: "✅ Resolved",
      badgePending: "⏳ Pending",

      // Executive KPI Cards
      kpiResolvedRateTitle: "Total Issues & Resolution Rate",
      kpiPeriodTitle: "Test Period & Velocity",
      kpiPeakTitle: "Peak Activity Day",
      kpiShiftTitle: "Quality Evolution (Phase Shift)",

      // Chart 1: Daily Stacked
      chart1Title: "📅 Daily Category Evolution (Stacked)",
      chart1Subtitle: "Tracks daily issue volume and category composition shifts over time. (Click bars to drill down)",
      chart1Badge: "Daily Trend",

      // Chart: Daily Severity Evolution (Stacked)
      chartSevEvolutionTitle: "🚨 Daily Severity Evolution & Risk Burndown (Stacked)",
      chartSevEvolutionSubtitle: "Tracks daily volume and burndown of S1 Blocker, S2 Critical, S3 Major, S4 Minor, and S5 Trivial issues.",
      chartSevEvolutionBadge: "Risk Burndown",

      // Chart: Severity Risk Donut
      chartSevDonutTitle: "🎯 Severity Risk Breakdown (IEEE 1044)",
      chartSevDonutSubtitle: "Cumulative distribution of issue criticality and stabilization ratio (Click slices to filter)",
      chartSevDonutBadge: "Severity Share",

      // Chart 2: Category Donut
      chart2Title: "🍩 Category Distribution",
      chart2Subtitle: "Cumulative composition across all categories (Click slices to filter)",
      chart2Badge: "Cumulative Share",

      // Chart 3: Maturity Curve & Volume Combo
      chart3Title: "📈 Maturity Golden Shift Curve & Daily Volume Combo",
      chart3Subtitle: "Dual-axis view combining daily resolution volume bars (peak vs stabilization) with 3-stage lifecycle curves (UI, Core, Stability)",
      chart3Badge: "Dual-Axis Combo",

      // Chart 4: Radar
      chart4Title: "🕸️ 6-Axis Quality Radar",
      chart4Subtitle: "Hexagonal balance across UI, Functionality, Stability, Logic, Security, and i18n",
      chart4Badge: "6-Axis Balance",

      // Chart 5: Hotspots
      chart5Title: "🔥 Top 10 Code Hotspot Modules",
      chart5Subtitle: "Ranking of core components with the highest issue remediations and refactoring",
      chart5Badge: "Code Concentration",

      // Chart 6: Burndown / Velocity
      chart6Title: "⚡ Cumulative Velocity S-Curve",
      chart6Subtitle: "Cumulative resolution velocity and convergence trajectory (100% Resolved)",
      chart6Badge: "Convergence",

      // Chart 7: OS Deployment Parity & Breakdown
      chart7Title: "🤖 🍎 OS Deployment Parity & Release Breakdown",
      chart7Subtitle: "Real-time cross-platform release tracking between Google Play (AOS) & App Store (iOS)",
      chart7Badge: "Release Parity",

      // Chart 8: Quality Domain Deployment & Pending Risk
      chart8Title: "📦 Quality Domain Deployment & Pending Risk",
      chart8Subtitle: "Deployment coverage across 8 ISO/IEC 25010 domains and un-deployed risk check",
      chart8Badge: "Release Gatekeeper",

      // Drilldown Panel
      drilldownTitle: "🔍 Interactive Drill-Down Inspector",
      drilldownOpenSheet: "📋 Open in Spreadsheet ➔",
      drilldownReset: "🔄 Reset Filter",
      drilldownEmpty: "No issues found matching the criteria."
    },
    ko: {
      // Top Bar & Controls
      appTitle: "📋 Modo QA 마스터 스프레드시트",
      analyticsTitle: "Modo QA 인텔리전스 & 분석 스튜디오",
      portalTitle: "QA 인텔리전스 & 트래커 포털",
      portalSubtitle: "완전 해결 검증 데이터 및 Phase별 시각화 트렌드 분석 시스템",
      spreadsheetView: "📋 스프레드시트",
      dashboardView: "📊 비주얼 대시보드",
      navMemo: "📝 메모",
      themeToggle: "🌓 테마",
      helpGuideBtn: "❓ 도움말",
      appProfileSectionTitle: "앱 & 공식 스토어",
      appProfileRowTitle: "앱 정보 & 스토어 링크",
      appProfilePopoverBtn: "📱 상세 정보 ↗",
      officialWebBtnTitle: "공식 웹사이트 바로가기",
      modalGuideTitle: "Modo QA 표준 & 결함 분류 가이드",
      modalGuideSubtitle: "소프트웨어 결함의 심각도와 조치 우선순위(SLA)를 판정하는 국제 표준 분류 기준입니다.",
      modalGuideClose: "닫기",
      modalGuideGotIt: "확인 완료",
      sevGuideS1Title: "S1 Blocker (치명적 차단 결함)",
      sevGuideS1Badge: "즉각 조치 (P0)",
      sevGuideS1Desc: "앱 크래시, 무한 프리징, 데이터 유실/손상, 결제 실패, 스토어 심사 리젝 등 사용자의 핵심 여정이 전면 중단되는 결함 (우회 불가).",
      sevGuideS2Title: "S2 Critical (핵심 로직 결함)",
      sevGuideS2Badge: "긴급 조치 (P1)",
      sevGuideS2Desc: "우회 경로가 없는 핵심 비즈니스 기능 장애, 데이터 동기화 누락, 권한/알림 실패, 주요 연동 오작동.",
      sevGuideS3Title: "S3 Major (일반 기능 결함)",
      sevGuideS3Badge: "우선 조치 (P2)",
      sevGuideS3Desc: "기능은 작동하지만 예외 케이스 발생, 우회 조작(Workaround)이 가능한 결함, 상태 지연, 비정상적 제스처 반응.",
      sevGuideS4Title: "S4 Minor (사소한 결함)",
      sevGuideS4Badge: "폴리싱 (P3)",
      sevGuideS4Desc: "UI 간격/여백 오차, 다크모드 대비 불일치, 오탈자, 텍스트 줄바꿈/클리핑 등 기능 작동에 영향이 없는 시각적 결함.",
      sevGuideS5Title: "S5 Trivial (개선 및 코드 관리)",
      sevGuideS5Badge: "유지보수 (P4)",
      sevGuideS5Desc: "코드 가독성 리팩토링, 미사용 변수/임포트 정리, 단일 파일 400줄 분리, 향후 확장성을 위한 사전 구조 정돈.",
      sevGuideTip: "💡 안내: CLI 도구(add_issue.py)로 이슈 등록 시 --severity 생략 시 키워드 분석을 통해 위험도가 자동 판정됩니다.",
      langToggle: "🌐 한국어 (KO)",
      langCode: "KO",
      langSwitchLabel: "🌐 KO",

      // Portal Index Cards
      portalVisualTitle: "비주얼 통계 대시보드",
      portalVisualDesc: "일자별 조치 스택 막대, 성숙도 골든 시프트, 6각 품질 레이더, 코드 핫스팟 실시간 시각화",
      portalSheetTitle: "마스터 스프레드시트",
      portalSheetDesc: "전수 조사 상세 목록, OS/날짜/카테고리 다차원 필터, 북마크, 실시간 인라인 검색",

      // Header Stats
      statTotal: "전체: ",
      statResolved: "해결: ",
      statPending: "대기: ",

      // Track Tabs
      trackAll: "전체 트랙",
      trackPhase1: "Phase 1 Android 비공개",
      trackPhase2: "Phase 2 iOS 테스트",
      trackPhase3: "Phase 3 정식 운영",
      trackPhase4: "Phase 4 장기 로드맵",
      trackFeedback: "유저 VOC",
      trackCountUnit: "건",
      btnConvertToQa: "🚀 QA 이슈로 승격",
      btnSyncSheet: "시트 동기화",
      btnOpenGoogleSheet: "구글 시트 ↗",
      btnSaveDeploy: "배포 영구 저장",
      btnSaveRelease: "저장",
      btnCopyQuote: "원문 복사",
      qaConvertedToast: "QA 이슈 등록 스니펫이 클립보드에 복사되었습니다!",

      // Filters Line 1
      filterDateLabel: "📅 날짜별:",
      allDates: "전체 일자",
      filterStatusLabel: "상태:",
      statusAll: "전체 상태",
      statusResolved: "✅ 해결됨",
      statusPending: "⏳ 대기중",
      statusHighlighted: "★ 북마크/고정",
      statusVoc: "💬 VOC 승격",
      vocExecTitle: "고객의 소리 (VOC) & CS 품질 인텔리전스",
      vocExecSubtitle: "실시간 유저 피드백 수렴, 앱 만족도 지표 및 QA 결함 승격 추적",
      vocExecOpenStudio: "💬 VOC Studio 열기 ↗",
      vocMetricRating: "평균 만족도 (Rating)",
      vocMetricTotal: "수집된 VOC 전체",
      vocMetricEscalation: "QA 결함 승격률",
      vocMetricCategory: "주요 건의 도메인",
      searchPlaceholder: "검색 (이슈, 원인, 파일명, OS, #ID)...",

      // Filters Line 2
      filterPlatformLabel: "📱 OS:",
      platformAll: "전체 OS",
      platformIos: "iOS",
      platformAndroid: "Android",
      platformCommon: "공통",

      filterCategoryLabel: "유형:",
      catAll: "전체 분류",
      catReliability: "🛡️ 안정성/결함",
      catCore: "⚡ 코어 기능",
      catUi: "🎨 UI/UX",
      catPerf: "🚀 성능/최적화",
      catMedia: "🎙️ 미디어/음성",
      catMonetization: "💰 수익화/광고",
      catAuth: "🔒 보안/인증",
      catDb: "💾 데이터/DB",

      // Severity Filters (IEEE 1044 / ISTQB)
      filterSeverityLabel: "위험도:",
      sevAll: "전체 위험도",
      sevS1: "🚨 S1 Blocker",
      sevS2: "🔥 S2 Critical",
      sevS3: "⚡ S3 Major",
      sevS4: "🌱 S4 Minor",
      sevS5: "☕ S5 Trivial",

      // Table Counts & Empty
      tableCount: "표시: {filtered} / {total}건",
      noMatch: "🔍 검색 및 필터 조건과 일치하는 이슈가 없습니다.",

      // Table Column Headers
      thDeploy: "배포 ↕",
      thId: "ID ↕",
      thSeverity: "위험도 ↕",
      thDate: "등록일 ↕",
      thPlatform: "OS ↕",
      thCategory: "유형 ↕",
      thTitle: "이슈 현상 ↕",
      thCause: "원인 분석 (Root Cause)",
      thSolution: "해결 대책 & 조치 내용",
      thFiles: "파일",
      popoverFilesTitle: "수정 파일 목록",
      popoverCopyAll: "📋 전체 복사",
      popoverCopied: "복사됨! ✅",
      popoverInspectAll: "🔍 하단 인스펙터에서 전체 보기 ↗",
      thStatus: "상태 ↕",
      thRating: "별점 (Rating) ↕",
      thDevice: "기기 / OS 환경 ↕",
      thFeedbackContent: "피드백 & 의견 내용 ↕",
      thUpvotes: "투표수 ↕",

      // Deploy & Release Notes
      thDeploy: "배포 ↕",
      thDeployAos: "AOS 배포 ↕",
      thDeployIos: "iOS 배포 ↕",
      statDeployed: "배포: ",
      statDeployedAos: "AOS: ",
      statDeployedIos: "iOS: ",
      filterDeployLabel: "배포:",
      filterDeployAll: "전체",
      filterDeployAos: "AOS 배포",
      filterDeployIos: "iOS 배포",
      filterDeployBoth: "양대 배포",
      filterDeployed: "배포완료",
      filterNotDeployed: "미배포",
      btnDetailFilters: "상세 필터",
      btnResetFilters: "초기화",
      btnCopyReleaseNotes: "릴리즈 노트",
      btnCopyReleaseNotesLatest: "최신 릴리즈",
      btnCopyReleaseNotesAll: "전체 릴리즈",
      btnCopyReleaseNotesAosLatest: "AOS 최신 복사",
      btnCopyReleaseNotesAosAll: "AOS 전체",
      btnCopyReleaseNotesIosLatest: "iOS 최신 복사",
      btnCopyReleaseNotesIosAll: "iOS 전체",
      btnCopyReleaseNotesLatestTooltip: "현재 지정된 최신 릴리즈 버전 항목만 스토어 릴리즈 노트로 클립보드 복사",
      btnCopyReleaseNotesAllTooltip: "모든 버전별 릴리즈 히스토리를 버전별 섹션으로 나누어 클립보드 복사",
      toastReleaseNotesCopied: "배포 완료 항목의 릴리즈 노트가 클립보드에 복사되었습니다!",
      toastReleaseNotesCopiedLatest: "최신 릴리즈({ver}) 배포 노트가 클립보드에 복사되었습니다!",
      toastReleaseNotesCopiedAll: "버전별 전체 릴리즈 노트가 클립보드에 복사되었습니다!",
      toastReleaseNotesCopiedAosLatest: "Android 최신 릴리즈({ver}) 배포 노트가 클립보드에 복사되었습니다!",
      toastReleaseNotesCopiedIosLatest: "iOS 최신 릴리즈({ver}) 배포 노트가 클립보드에 복사되었습니다!",
      toastReleaseNotesCopiedAosAll: "버전별 Android 전체 릴리즈 노트({count}건)가 클립보드에 복사되었습니다!",
      toastReleaseNotesCopiedIosAll: "버전별 iOS 전체 릴리즈 노트({count}건)가 클립보드에 복사되었습니다!",
      toastNoDeployedItems: "⚠️ 현재 배포 완료(ON)된 항목이 없습니다.",
      toastNoDeployedItemsAos: "⚠️ Android 배포 완료된 항목이 없습니다.",
      toastNoDeployedItemsIos: "⚠️ iOS 배포 완료된 항목이 없습니다.",
      toastNoLatestDeployedItems: "⚠️ 대상 릴리즈('{ver}')에 배포 완료된 항목이 없습니다.",
      toastNoLatestDeployedItemsAos: "⚠️ Android 대상 릴리즈('{ver}')에 배포 완료된 항목이 없습니다.",
      toastNoLatestDeployedItemsIos: "⚠️ iOS 대상 릴리즈('{ver}')에 배포 완료된 항목이 없습니다.",
      targetReleaseLabel: "릴리즈:",
      targetReleaseAosLabel: "AOS 릴리즈:",
      targetReleaseIosLabel: "iOS 릴리즈:",
      targetReleasePlaceholder: "기본 릴리즈 (예: 70 (1.1.3))",
      targetReleaseAosPlaceholder: "기본 릴리즈 (예: 71 (1.1.5))",
      targetReleaseIosPlaceholder: "기본 릴리즈 (예: 45 (1.1.5))",
      modalEditDeployTitle: "배포 릴리즈 버전 수정",
      modalEditDeployTitleAos: "Android 배포 릴리즈 버전 수정",
      modalEditDeployTitleIos: "iOS 배포 릴리즈 버전 수정",
      modalEditDeployDesc: "해당 이슈가 배포된 앱 릴리즈 버전을 지정합니다.",
      btnApplyTargetRelease: "현재 릴리즈 적용 ({ver})",
      btnSaveRelease: "저장",
      btnCancel: "취소",
      tooltipClickToEditRelease: "클릭하여 배포 릴리즈 버전 수정",
      deployNaTooltipIosOnly: "iOS 전용 항목 (AOS 배포 비해당)",
      deployNaTooltipAosOnly: "Android 전용 항목 (iOS 배포 비해당)",


      // Detail Box
      detailCauseTitle: "🔍 상세 원인 및 배경 ({plat})",
      detailActionTitle: "🛠️ 조치 내역",
      detailCauseFallback: "기능 최적화 및 UX 폴리싱",
      platIosOnly: "🍎 iOS 전용",
      platAndroidOnly: "🤖 Android 전용",
      platCommon: "🌐 전체 공통",
      clickToPin: "클릭하여 확인 체크(하이라이트 토글)",

      // Status Badges
      badgeResolved: "✅ 해결",
      badgePending: "⏳ 대기",

      // Executive KPI Cards
      kpiResolvedRateTitle: "누적 처리 건수 & 해결률",
      kpiPeriodTitle: "테스트 기간 & 집중도",
      kpiPeakTitle: "최대 조치 피크일",
      kpiShiftTitle: "품질 성숙도 진화 (PHASE SHIFT)",

      // Chart 1: Daily Stacked
      chart1Title: "📅 일자별 조치 카테고리 누적 변천 (Daily Evolution Stacked)",
      chart1Subtitle: "날짜별 이슈 볼륨과 조치 유형(UI/기능/버그/안정성)의 일자별 구성비 변화를 추적합니다. (막대 클릭 시 드릴다운)",
      chart1Badge: "일간 추이",

      // Chart: Daily Severity Evolution (Stacked)
      chartSevEvolutionTitle: "🚨 일자별 위험도 변화 및 수렴 추이 (Daily Severity Burndown)",
      chartSevEvolutionSubtitle: "치명적 위험(S1 Blocker, S2 Critical) 이슈의 발생 및 소멸, 경미한 위험(S4/S5)으로의 품질 수렴 과정을 추적합니다.",
      chartSevEvolutionBadge: "위험도 수렴",

      // Chart: Severity Risk Donut
      chartSevDonutTitle: "🎯 위험도별 구성 점유율 (IEEE 1044)",
      chartSevDonutSubtitle: "치명적(S1/S2: 42%) 조기 수렴 및 경미/개선(S4/S5: 41%) 안정화 분포 (도넛 클릭 시 필터링)",
      chartSevDonutBadge: "위험도 점유율",

      // Chart 2: Category Donut
      chart2Title: "🍩 6대 품질 영역 비중 (Distribution)",
      chart2Subtitle: "Phase 전체 누적 조치 비율 (도넛 조각 클릭 시 필터링)",
      chart2Badge: "누적 점유율",

      // Chart 3: Maturity Curve & Volume Combo
      chart3Title: "📈 성숙도 골든 시프트 & 일일 볼륨 콤보 (Maturity Golden Curve & Volume)",
      chart3Subtitle: "일일 해결 볼륨 막대(피크 vs 안정기)와 3대 품질 라이프사이클 곡선(UI, 기능, 시스템 안정성)의 듀얼 Y축 결합 뷰",
      chart3Badge: "듀얼 콤보 뷰",

      // Chart 4: Radar
      chart4Title: "🕸️ 소프트웨어 6대 품질 밸런스 레이더 (Quality Radar)",
      chart4Subtitle: "UI 완성도, 기능성, 시스템 안정성, 로직 무결성, 보안, 다국어 6각 지수",
      chart4Badge: "6각 밸런스",

      // Chart 5: Hotspots
      chart5Title: "🔥 최다 수정 핵심 코드 핫스팟 Top 10 (Code Hotspots)",
      chart5Subtitle: "가장 많은 이슈 대응 및 리팩토링이 집중된 핵심 컴포넌트 순위",
      chart5Badge: "코드 집중도",

      // Chart 6: Burndown / Velocity
      chart6Title: "⚡ 누적 해결 속도 S-Curve (Cumulative Velocity & Resolution)",
      chart6Subtitle: "누적 이슈 등록과 당일 해결 속도의 누적 수렴 추이 (100% Resolved)",
      chart6Badge: "수렴 안정화",

      // Chart 7: OS Deployment Parity & Breakdown
      chart7Title: "🤖 🍎 듀얼 OS 배포 진척도 & 릴리즈 버전 분포 (Deployment Parity)",
      chart7Subtitle: "Google Play (AOS) 및 Apple App Store (iOS) 실시간 크로스 플랫폼 배포 동기화 현황",
      chart7Badge: "릴리즈 동기화",

      // Chart 8: Quality Domain Deployment & Pending Risk
      chart8Title: "📦 8대 품질 도메인별 배포 완료율 & 미배포 리스크 (Release Gatekeeper)",
      chart8Subtitle: "8개 ISO/IEC 25010 품질 도메인별 배포 커버리지 및 미배포 잔여 리스크 점검",
      chart8Badge: "출시 게이트키퍼",

      // Drilldown Panel
      drilldownTitle: "🔍 상세 이슈 인스펙터 (Interactive Drill-Down)",
      drilldownOpenSheet: "📋 이 조건으로 스프레드시트 전체 열기 ➔",
      drilldownReset: "🔄 필터 초기화",
      drilldownEmpty: "일치하는 이슈가 없습니다."
    }
  };

  let currentLang = DEFAULT_LANG;

  function getLang() {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
    } catch {
      return DEFAULT_LANG;
    }
  }

  function setLang(lang) {
    if (!DICTIONARY[lang]) lang = DEFAULT_LANG;
    currentLang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
    document.documentElement.setAttribute('lang', lang);
    applyTranslations();
    if (typeof window.onQaLanguageChanged === 'function') {
      window.onQaLanguageChanged(lang);
    }
  }

  function toggleLang() {
    const next = currentLang === 'en' ? 'ko' : 'en';
    setLang(next);
  }

  function t(key, params) {
    const langDict = DICTIONARY[currentLang] || DICTIONARY[DEFAULT_LANG];
    let val = langDict[key] || DICTIONARY[DEFAULT_LANG][key] || key;
    if (params && typeof params === 'object') {
      Object.keys(params).forEach(k => {
        val = val.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
      });
    }
    return val;
  }

  function applyTranslations() {
    // 1. Text elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = t(key);
      }
    });

    // 2. Placeholder elements with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.setAttribute('placeholder', t(key));
      }
    });

    // 3. Title attributes with data-i18n-title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        el.setAttribute('title', t(key));
      }
    });

    // 3. Language switcher buttons
    document.querySelectorAll('.qa-lang-btn').forEach(btn => {
      btn.textContent = currentLang === 'en' ? '🌐 EN' : '🌐 KO';
      btn.title = currentLang === 'en' ? 'Switch Language to Korean' : '영어로 전환 (Switch to English)';
    });
  }

  function init() {
    currentLang = getLang();
    document.documentElement.setAttribute('lang', currentLang);
    applyTranslations();
  }

  window.QA_I18N = {
    init,
    getLang,
    setLang,
    toggleLang,
    t,
    applyTranslations,
    currentLang: () => currentLang,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
