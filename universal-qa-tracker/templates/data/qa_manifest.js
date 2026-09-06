/**
 * Universal QA Issue Tracker - Master Manifest & Track Registry
 */
window.UNIVERSAL_QA = window.UNIVERSAL_QA || {};
window.UNIVERSAL_QA.DATA = window.UNIVERSAL_QA.DATA || {};

window.UNIVERSAL_QA_MANIFEST = {
  projectName: "Universal QA",
  defaultTrack: "all",
  tracks: [
    {
      id: "all",
      label: "🚀 All Tracks Combined",
      badge: "All Tracks",
      color: "#7950F2",
      getData: function () {
        const dataMap = window.UNIVERSAL_QA.DATA || {};
        let combined = [];
        for (const key in dataMap) {
          if (Array.isArray(dataMap[key])) {
            combined = combined.concat(dataMap[key]);
          }
        }
        // Backward compatibility fallback
        if (combined.length === 0 && window.MODO_QA_PHASE1) {
          return (window.MODO_QA_PHASE1 || []).concat(window.MODO_QA_PHASE2 || []).concat(window.MODO_QA_PHASE3 || []);
        }
        return combined;
      }
    },
    {
      id: "phase1",
      label: "🔒 Phase 1: Closed Testing & Core",
      badge: "Phase 1 (Active)",
      color: "#228BE6",
      getData: function () {
        return (window.UNIVERSAL_QA.DATA && window.UNIVERSAL_QA.DATA["phase1"]) || window.MODO_QA_PHASE1 || [];
      }
    }
  ]
};

// Global alias for compatibility
window.MODO_QA_MANIFEST = window.UNIVERSAL_QA_MANIFEST;
