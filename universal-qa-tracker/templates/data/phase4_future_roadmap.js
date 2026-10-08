/**
 * Modo QA Master Dataset - Phase 4: Long-Term Roadmap & Future R&D (장기 로드맵 & R&D 트랙)
 * Total Issues: 1 Item (차세대 v1.2+ / v2.0 R&D 과제)
 */
window.MODO_QA_PHASE4 = [
  {
    "id": 1,
    "originalId": 103,
    "phase": "phase4",
    "track": "phase4",
    "trackLabel": "🔭 Phase 4: Long-Term Roadmap & R&D",
    "date": "2026-10-08",
    "severity": "S4",
    "severityLabel": "🌱 S4 Minor (Feature Request)",
    "platform": "cross",
    "platformLabel": "🌐 Cross Platform (Android & iOS)",
    "category": "ui",
    "categoryLabel": "🎨 UI/UX (Customization)",
    "title": "사용자 커스텀 강화 VOC 제안: S펜(스타일러스) 필기/그리기 지원, 다이어리 스티커 팩 및 신규 위젯 스타일 확장",
    "problem": "1) Google Play 실사용자 VOC 피드백: 'Wonderful app highly recommend kindly add more widgets more new features and S pen support to customise notes , Sticker , diary packs'. 2) 텍스트 입력 중심의 현재 에디터에서 삼성 갤럭시 S-Pen 등 스타일러스 펜을 활용한 손글씨 메모, 주석(Handwriting/Drawing), 다이어리용 데코 스티커 팩 등 아날로그 감성 커스터마이징 기능 부재. 3) 홈 화면 위젯의 추가적인 테마/비주얼 프리셋 확장 요구 인입.",
    "solution": "(장기 R&D / Roadmap) 1) 에디터 내 스타일러스(S-Pen/Apple Pencil) 드로잉 캔버스 레이어(손글씨/그리기 삽입) 연동 타당성 검토. 2) 감성 다이어리 기록을 위한 벡터/이모지 스티커 데코레이션 팩 에셋 파이프라인 설계. 3) 위젯 스튜디오(Widget Studio)에 감성 다이어리형/캘린더 복합형 신규 위젯 레이아웃 템플릿 추가. 4) 20개 글로벌 언어팩에 관련 설정 및 기능명 1:1 동기화.",
    "files": [
      "components/editor/RichTextEditor.tsx",
      "components/widget/WidgetPreviewCard.tsx",
      "stores/useSettingsStore.ts",
      "i18n/locales/ko.ts"
    ],
    "status": "pending",
    "deployed": false,
    "deployedVersion": "Roadmap (v1.2+ / v2.0)",
    "deployedDate": "Future Milestone",
    "cause": "초기 버전이 미니멀리스트 텍스트 타이핑 및 보이스 레코딩에 집중되어 있어, 스타일러스 펜 필기 및 저널/다이어리 꾸미기(Sticker/Deco) 요소를 다루는 확장 레이어가 설계되지 않았던 점.",
    "actions": [
      "1. components/editor/: 에디터 내 S-Pen/스타일러스 필기 캔버스(드로잉/손글씨 삽입) 아키텍처 R&D",
      "2. stores/useSettingsStore.ts: 다이어리 스티커/데코 팩 로컬 상태 및 위젯 템플릿 확장 스토어 구조 설계",
      "3. components/widget/: 위젯 스튜디오 신규 다이어리/미니멀 스타일 레이아웃 프리셋 추가 검토",
      "4. i18n 20개 전 언어팩에 신규 위젯/스티커 관련 번역 키 100% 동기화",
      "5. 동기식 3중 검증 완주 (tsc 0건, Jest 단위 테스트 100% PASS)"
    ],
    "title_en": "[Feature Request] S-Pen/Stylus Handwriting Support, Diary Deco Sticker Packs & Expanded Widget Styles",
    "problem_en": "Google Play Store review: User highly recommended the app and requested S-Pen support to customize notes, deco sticker/diary packs, and more widget styles.",
    "solution_en": "1) Research S-Pen/Stylus drawing canvas layer for handwriting & doodle notes. 2) Design diary deco sticker packs for personal journaling. 3) Expand Widget Studio templates with new aesthetic layouts. 4) Synchronize strings across 20 languages.",
    "deployedAos": false,
    "deployedIos": false
  }
];
