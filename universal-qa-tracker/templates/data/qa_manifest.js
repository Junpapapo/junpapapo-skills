/**
 * Universal QA Unit Manifest & Track Registry
 * Clean starter template for multi-track milestone management.
 */
window.UNIVERSAL_QA = window.UNIVERSAL_QA || {};

window.MODO_QA_MANIFEST = window.UNIVERSAL_QA.MANIFEST = {
  tracks: [
    {
      id: 'all',
      label: '🚀 전체 트랙',
      badge: 'All Tracks',
      color: '#7950F2',
      getData: function() {
        return [
          ...(window.MODO_QA_PHASE1 || (window.UNIVERSAL_QA.DATA && window.UNIVERSAL_QA.DATA.phase1) || []),
          ...(window.MODO_QA_PHASE2 || (window.UNIVERSAL_QA.DATA && window.UNIVERSAL_QA.DATA.phase2) || []),
          ...(window.MODO_QA_PHASE3 || (window.UNIVERSAL_QA.DATA && window.UNIVERSAL_QA.DATA.phase3) || []),
        ];
      }
    },
    {
      id: 'phase1',
      label: '🔒 Phase 1 Android 비공개',
      badge: 'Phase 1 (5 items)',
      color: '#228BE6',
      getData: function() {
        return window.MODO_QA_PHASE1 || (window.UNIVERSAL_QA.DATA && window.UNIVERSAL_QA.DATA.phase1) || [];
      }
    },
    {
      id: 'phase2',
      label: '🍎 Phase 2 iOS 테스트',
      badge: 'Phase 2 (0 items)',
      color: '#E0533C',
      getData: function() {
        return window.MODO_QA_PHASE2 || (window.UNIVERSAL_QA.DATA && window.UNIVERSAL_QA.DATA.phase2) || [];
      }
    },
    {
      id: 'phase3',
      label: '💎 Phase 3 정식 운영',
      badge: 'Phase 3 (0 items)',
      color: '#E67700',
      getData: function() {
        return window.MODO_QA_PHASE3 || (window.UNIVERSAL_QA.DATA && window.UNIVERSAL_QA.DATA.phase3) || [];
      }
    },
    {
      id: 'feedback',
      label: '💬 유저 VOC',
      badge: 'Live Feedback',
      color: '#0CA678',
      getData: function() {
        return window.MODO_FEEDBACK_DATA || (window.UNIVERSAL_QA && window.UNIVERSAL_QA.FEEDBACK) || [];
      }
    }
  ]
};
