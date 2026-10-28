/**
 * Universal QA Unit Manifest & Track Registry
 */
window.MODO_QA_MANIFEST = {
  tracks: [
    {
      id: 'all',
      label: '전체 트랙',
      badge: 'All Tracks (1건)',
      color: '#7950F2',
      getData: function() {
        return [
          ...(window.MODO_QA_PHASE1 || []),
          ...(window.MODO_QA_PHASE2 || []),
          ...(window.MODO_QA_PHASE3 || []),
          ...(window.MODO_QA_PHASE4 || []),
        ];
      }
    },
    {
      id: 'phase1',
      label: 'Phase 1 초기 개발 및 클로즈드 테스트',
      badge: 'Phase 1 (1건)',
      color: '#228BE6',
      icon: 'assets/icons/icon_rocket_qa.webp',
      getData: function() {
        return window.MODO_QA_PHASE1 || [];
      }
    },
    {
      id: 'phase2',
      label: 'Phase 2 오픈 베타 테스트',
      badge: 'Phase 2 (0건)',
      color: '#007AFF',
      icon: 'assets/icons/icon_shield.webp',
      getData: function() {
        return window.MODO_QA_PHASE2 || [];
      }
    },
    {
      id: 'phase3',
      label: 'Phase 3 정식 운영 및 배포 백로그',
      badge: 'Phase 3 (0건)',
      color: '#E67700',
      icon: 'assets/icons/icon_dashboard.webp',
      getData: function() {
        return window.MODO_QA_PHASE3 || [];
      }
    },
    {
      id: 'phase4',
      label: 'Phase 4 중장기 로드맵 & R&D',
      badge: 'Phase 4 (0건)',
      color: '#40C057',
      icon: 'assets/icons/icon_feature.webp',
      getData: function() {
        return window.MODO_QA_PHASE4 || [];
      }
    }
  ]
};
