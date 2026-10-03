/**
 * Modo QA Unit Manifest & Track Registry
 */
window.MODO_QA_MANIFEST = {
  tracks: [
    {
      id: 'all',
      label: '전체 트랙',
      badge: 'All Tracks',
      color: '#7950F2',
      getData: function() {
        return [
          ...(window.MODO_QA_PHASE1 || []),
          ...(window.MODO_QA_PHASE2 || []),
          ...(window.MODO_QA_PHASE3 || []),
        ];
      }
    },
    {
      id: 'phase1',
      label: 'Phase 1 Android 비공개',
      badge: 'Phase 1 (5건)',
      color: '#228BE6',
      icon: 'assets/icons/logo_google_play.svg',
      getData: function() {
        return window.MODO_QA_PHASE1 || [];
      }
    },
    {
      id: 'phase2',
      label: 'Phase 2 iOS 테스트',
      badge: 'Phase 2 (0건)',
      color: '#007AFF',
      icon: 'assets/icons/logo_app_store.svg',
      getData: function() {
        return window.MODO_QA_PHASE2 || [];
      }
    },
    {
      id: 'phase3',
      label: 'Phase 3 정식 운영',
      badge: 'Phase 3 (63건)',
      color: '#E67700',
      getData: function() {
        return window.MODO_QA_PHASE3 || [];
      }
    },
    {
      id: 'feedback',
      label: '유저 VOC',
      badge: 'Live Feedback',
      color: '#0CA678',
      getData: function() {
        return window.MODO_FEEDBACK_DATA || [];
      }
    }
  ]
};

/**
 * Official Release & Version Progression Registry
 * Maintained for Production Operations (Phase 3) Cadence Intelligence
 */
window.MODO_RELEASE_REGISTRY = [
  {
    version: "v1.0.0",
    build: "1",
    aosBuild: "1",
    iosBuild: "1",
    date: "2026-08-22",
    aosDate: "2026-08-22",
    iosDate: "2026-08-22",
    platform: "all",
    phase: "phase1",
    type: "major",
    label: "🚀 Initial Official Launch",
    description: "Modo initial release with timeline notes, SQLite offline-first engine, and core typography.",
    highlights: [
      "Initial production launch for Android & iOS",
      "SQLite 3.45 with WAL mode and local-first note persistence",
      "Rich minimalist editor and timeline feed"
    ]
  },
  {
    version: "v1.0.11",
    build: "12",
    aosBuild: "12",
    iosBuild: "12",
    date: "2026-08-31",
    aosDate: "2026-08-31",
    iosDate: "2026-09-01",
    platform: "all",
    phase: "phase1",
    type: "patch",
    label: "🌱 Milestone 1 Foundation & Gestures",
    description: "QA tracker v1 architecture setup, smooth gesture recognizers, and widget preview foundations.",
    highlights: [
      "Smooth note swipe actions and haptic feedback",
      "Widget preview architecture integration",
      "Automated keystore injection pipeline"
    ]
  },
  {
    version: "v1.0.57",
    build: "58",
    aosBuild: "58",
    iosBuild: "58",
    date: "2026-09-14",
    aosDate: "2026-09-14",
    iosDate: "2026-09-15",
    platform: "all",
    phase: "phase1",
    type: "minor",
    label: "🌐 17-Locale i18n & Elder Advice",
    description: "Expanded elder advice wisdom datasets for Japanese (ja) and Chinese (zh) and polished widget layout.",
    highlights: [
      "Complete 17-language parity across all UI strings",
      "Elder advice dataset cultural expansion",
      "High-density widget preview refinements"
    ]
  },
  {
    version: "v1.0.64",
    build: "65",
    aosBuild: "65",
    iosBuild: "65",
    date: "2026-09-16",
    aosDate: "2026-09-16",
    iosDate: "2026-09-16",
    platform: "android",
    phase: "phase1",
    type: "patch",
    label: "🛡️ Pre-Release Audit Closure (AOS)",
    description: "Resolved all P0/P1 audit issues, closed pre-release tracking, and established post-release roadmap.",
    highlights: [
      "444 issues in Phase 1 100% resolved on Google Play Console",
      "Multi-photo self-healing and syncStore unit test suite",
      "Zero unhandled exception guarantee in core editor"
    ]
  },
  {
    version: "v1.0.65",
    build: "66",
    aosBuild: "66",
    iosBuild: "66",
    date: "2026-09-16",
    aosDate: "2026-09-16",
    iosDate: "2026-09-17",
    platform: "all",
    phase: "phase1",
    type: "patch",
    label: "💎 Final Pre-Launch Stability Gate",
    description: "Pre-deployment audit final gate pass and stability lock.",
    highlights: [
      "Pre-release audit report finalized",
      "Cloud sync re-authentication pipeline hardened",
      "Build verification pass on Android Release AAB"
    ]
  },
  {
    version: "v1.1.0",
    build: "67",
    aosBuild: "67",
    iosBuild: "",
    date: "2026-09-17",
    aosDate: "2026-09-17",
    iosDate: "",
    platform: "android",
    phase: "phase3",
    type: "minor",
    label: "🎉 Phase 3 V1.1 Production Launch (AOS)",
    description: "Official start of Phase 3 operations on Android Google Play. Integrated in-app VOC survey system and enhanced widget styling.",
    highlights: [
      "In-app VOC customer feedback survey & Google Apps Script webhook integration",
      "Home screen widget visual overhaul",
      "Production telemetry and analytics pipeline setup"
    ]
  },
  {
    version: "v1.1.1",
    build: "68",
    aosBuild: "68",
    iosBuild: "",
    date: "2026-09-17",
    aosDate: "2026-09-17",
    iosDate: "",
    platform: "android",
    phase: "phase3",
    type: "patch",
    label: "🎙️ Voice Equalizer Visuals (AOS)",
    description: "Added organic audio wave visual feedback and refined haptics for voice recording session on Android.",
    highlights: [
      "Horizontal voice equalizer wings with 60FPS native transform",
      "Audio metering decibel normalization (-60dB to -15dB)",
      "Zero-latency micro-haptics on record trigger"
    ]
  },
  {
    version: "v1.1.2",
    build: "69",
    aosBuild: "69",
    iosBuild: "",
    date: "2026-09-21",
    aosDate: "2026-09-21",
    iosDate: "",
    platform: "android",
    phase: "phase3",
    type: "patch",
    label: "🎙️ Voice Equalizer & Android Minify (AOS)",
    description: "Voice equalizer wings, R8 minification keep rules, and initial post-launch stabilization on Android.",
    highlights: [
      "Real-time voice recording equalizer wings",
      "Android R8 and ProGuard keep rules parity"
    ]
  },
  {
    version: "v1.1.3",
    build: "70",
    aosBuild: "70",
    iosBuild: "",
    date: "2026-09-23",
    aosDate: "2026-09-23",
    iosDate: "",
    platform: "android",
    phase: "phase3",
    type: "patch",
    label: "📷 Multi-Photo Self-Healing (AOS)",
    description: "Fixed photo attachment preview and viewer defect with recursive unwrap flatMap.",
    highlights: [
      "Image attachments nested serialization self-healing",
      "PhotoSourcePickerModal photo list preserve"
    ]
  },
  {
    version: "v1.1.4",
    build: "71",
    aosBuild: "71",
    iosBuild: "82",
    date: "2026-09-23",
    aosDate: "2026-09-23",
    iosDate: "2026-09-30",
    platform: "all",
    phase: "phase3",
    type: "minor",
    label: "📱 Widget Suite & iOS Bundled Release",
    description: "Android home screen widgets, calendar grid, and major bundled release for iOS (18 issues).",
    highlights: [
      "Android home screen widget suite stabilization",
      "iOS App Store major bundled release (Build 82 covering #1~#21)",
      "Pastel cube calendar grid and KeepHub color sync"
    ]
  },
  {
    version: "v1.1.5",
    build: "71",
    aosBuild: "71",
    iosBuild: "",
    date: "2026-09-25",
    aosDate: "2026-09-25",
    iosDate: "",
    platform: "android",
    phase: "phase3",
    type: "patch",
    label: "🧩 Multi-Instance Widgets (AOS)",
    description: "Multi-instance widget isolation, fast note save session, and timeline audio playback.",
    highlights: [
      "Multi-instance widget state management",
      "Fixed fast note save session overwrite"
    ]
  },
  {
    version: "v1.1.7",
    build: "74",
    aosBuild: "74",
    iosBuild: "",
    date: "2026-09-26",
    aosDate: "2026-09-26",
    iosDate: "",
    platform: "android",
    phase: "phase3",
    type: "patch",
    label: "📦 Storage Vault & KeepHub",
    description: "Streamlined single-file backup restore and KeepHub wide widget routing.",
    highlights: [
      "Removed legacy clipboard restore and unified backup vault",
      "KeepHub wide widget deep linking"
    ]
  },
  {
    version: "v1.1.8",
    build: "75",
    aosBuild: "75",
    iosBuild: "",
    date: "2026-09-27",
    aosDate: "2026-09-27",
    iosDate: "",
    platform: "android",
    phase: "phase3",
    type: "patch",
    label: "🔔 Notification Bundles & DSP Boost",
    description: "Schedule notification bundles, DSP voice boost spec, and widget reload fixes.",
    highlights: [
      "Pinned notification bundle bidirectional sync",
      "Audio recording clarity DSP filter pipeline"
    ]
  },
  {
    version: "v1.1.9",
    build: "76",
    aosBuild: "76",
    iosBuild: "",
    date: "2026-09-28",
    aosDate: "2026-09-28",
    iosDate: "",
    platform: "android",
    phase: "phase3",
    type: "patch",
    label: "✍️ Compact Editor Line Height (AOS)",
    description: "Optimized editor line height to compact and added horizontal step slider.",
    highlights: [
      "Compact line height option for high-density writing",
      "Horizontal step slider component in settings"
    ]
  },
  {
    version: "v1.1.11",
    build: "78",
    aosBuild: "78",
    iosBuild: "",
    date: "2026-10-01",
    aosDate: "2026-10-01",
    iosDate: "",
    platform: "android",
    phase: "phase3",
    type: "patch",
    label: "📅 Quick Schedule & Calendar Cells (AOS)",
    description: "Fixed schedule modal save button disabled state and calendar double tap burst popup.",
    highlights: [
      "Always-actionable schedule save button with fallback title",
      "D-Day monthly grid tap vs long press strict isolation"
    ]
  },
  {
    version: "v1.1.12",
    build: "79",
    aosBuild: "79",
    iosBuild: "",
    date: "2026-10-02",
    aosDate: "2026-10-02",
    iosDate: "",
    platform: "android",
    phase: "phase3",
    type: "patch",
    label: "✨ For You Space Curation (AOS)",
    description: "Excluded schedule and D-Day notes from For You smart space with value curation score.",
    highlights: [
      "Value-based curation scoring algorithm in spacesRepository",
      "Google Play Store live release (Build 79)"
    ]
  },
  {
    version: "v1.1.13",
    build: "80",
    aosBuild: "80",
    iosBuild: "",
    date: "2026-10-03",
    aosDate: "2026-10-03",
    iosDate: "",
    platform: "android",
    phase: "phase3",
    type: "patch",
    label: "📷 Image Grid & Nav Bar Fit (AOS Latest)",
    description: "Fixed editor image paste overflow with Keep-style responsive grid (#49) and Android navigation bar breathing room (#51).",
    highlights: [
      "Google Keep style smart responsive image grid (1/2/3 cols) and full-screen lightbox viewer (#49)",
      "Android system gesture navigation bar comfortable bottom breathing room (#51)",
      "Google Play Store live release (Build 80)"
    ]
  },
  {
    version: "v1.1.15",
    build: "91",
    aosBuild: "",
    iosBuild: "91",
    date: "2026-10-01",
    aosDate: "",
    iosDate: "2026-10-01",
    platform: "ios",
    phase: "phase3",
    type: "minor",
    label: "🍎 iOS Major App Store Release (Build 91)",
    description: "Major iOS App Store bundle resolving 24 navigation, widget studio, i18n locale, and CocoaPods issues.",
    highlights: [
      "App Store major release covering issues #22~#46",
      "CFBundleLocalizations 17-language parity and expo-localization native detection",
      "Widget Studio FontGridModal and ClockFrame modals iOS navigation stack hardening"
    ]
  },
  {
    version: "v1.1.16",
    build: "86",
    aosBuild: "",
    iosBuild: "86",
    date: "2026-10-03",
    aosDate: "",
    iosDate: "2026-10-03",
    platform: "ios",
    phase: "phase3",
    type: "patch",
    label: "🍎 Focus Mode Return & Image Grid (iOS Latest)",
    description: "Fixed iPhone Focus Mode exit button touch unresponsiveness (#50) and integrated image grid (#49).",
    highlights: [
      "Modern iPhone Focus Mode exit button touch unresponsiveness fix and header return button (#50)",
      "Google Keep style smart responsive image grid (1/2/3 cols) and full-screen lightbox viewer (#49)",
      "Apple App Store live release (Build 86)"
    ]
  }
];
