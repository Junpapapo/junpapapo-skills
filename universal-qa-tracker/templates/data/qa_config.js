/**
 * Modo QA Tracker - App Profile & Store Registry
 * Mode: Universal Skill Template (English Default)
 */
window.QA_APP_CONFIG = {
  app: {
    name: "{{PROJECT_NAME}}",
    tagline: "Productivity & Mobile Application",
    bundleId: "com.example.{{PROJECT_NAME_LOWER}}",
    packageName: "com.example.{{PROJECT_NAME_LOWER}}",
    appleAppId: "",
    currentVersion: "v1.0.0",
    developer: "{{DEVELOPER_NAME}}",
    supportEmail: "support@example.com"
  },
  stores: {
    playStore: "https://play.google.com/store/apps/details?id=com.example.{{PROJECT_NAME_LOWER}}",
    appStore: "",
    playClosedTesting: "https://play.google.com/apps/testing/com.example.{{PROJECT_NAME_LOWER}}",
    testFlight: ""
  },
  web: {
    homepage: "https://example.com/{{PROJECT_NAME_LOWER}}",
    privacyPolicy: "https://example.com/{{PROJECT_NAME_LOWER}}/privacy",
    termsOfService: "https://example.com/{{PROJECT_NAME_LOWER}}/terms"
  },
  api: {
    // Google Apps Script Web App API endpoint URL (ending with /exec)
    // Used for VOC / User Feedback synchronization with Google Sheets
    sheetSyncUrl: "",
    // Optional: Web link to the Google Spreadsheet for QA viewing
    spreadsheetViewUrl: ""
  }
};

(function () {
  const STYLES = `
    .qa-app-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.48);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      z-index: 99999;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      opacity: 0;
      transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .qa-app-modal-overlay.active {
      opacity: 1;
    }
    .qa-app-modal-card {
      background: var(--bg-surface, #FFFFFF);
      color: var(--text-primary, #1C1C1E);
      border: 1px solid var(--border, rgba(60, 60, 67, 0.14));
      border-radius: 22px;
      width: 100%;
      max-width: 700px;
      max-height: 88vh;
      overflow-y: auto;
      box-shadow: 0 28px 72px rgba(0, 0, 0, 0.3);
      transform: scale(0.96) translateY(12px);
      transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Pretendard", "SF Pro Display", sans-serif);
    }
    [data-theme="dark"] .qa-app-modal-card {
      background: #1C1C1E;
      color: #FFFFFF;
      border-color: rgba(255, 255, 255, 0.14);
      box-shadow: 0 28px 72px rgba(0, 0, 0, 0.75);
    }
    .qa-app-modal-overlay.active .qa-app-modal-card {
      transform: scale(1) translateY(0);
    }
    .qa-app-modal-header {
      padding: 22px 28px 18px 28px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      border-bottom: 1px solid var(--border-subtle, rgba(60, 60, 67, 0.08));
    }
    .qa-app-modal-avatar {
      width: 54px;
      height: 54px;
      border-radius: 14px;
      background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 25px;
      font-weight: 900;
      flex-shrink: 0;
      box-shadow: 0 6px 18px rgba(0, 122, 255, 0.32);
    }
    .qa-app-modal-title-wrap {
      flex: 1;
      min-width: 0;
    }
    .qa-app-modal-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .qa-app-modal-app-name {
      font-size: 19px;
      font-weight: 800;
      letter-spacing: -0.3px;
    }
    .qa-app-modal-ver-badge {
      font-size: 11.5px;
      font-weight: 700;
      padding: 2.5px 9px;
      border-radius: 999px;
      background: rgba(52, 199, 89, 0.15);
      color: #34C759;
      font-family: var(--font-mono, monospace);
    }
    .qa-app-modal-tagline {
      font-size: 13px;
      color: var(--text-muted, #8E8E93);
      margin-top: 4px;
      line-height: 1.4;
    }
    .qa-app-modal-close-btn {
      background: var(--bg-hover, #E9E9EE);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 15px;
      color: var(--text-secondary, #48484A);
      transition: all 0.15s ease;
      flex-shrink: 0;
      margin-top: 2px;
    }
    [data-theme="dark"] .qa-app-modal-close-btn {
      background: #2C2C2E;
      color: #EBEBF5;
    }
    .qa-app-modal-close-btn:hover {
      background: #D1D1D6;
      transform: scale(1.08);
    }
    .qa-app-modal-body {
      padding: 22px 28px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .qa-app-section-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--text-muted, #8E8E93);
      margin-bottom: 10px;
    }
    .qa-app-store-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    @media (max-width: 520px) {
      .qa-app-store-grid {
        grid-template-columns: 1fr;
      }
    }
    .qa-app-store-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 13px 16px;
      border-radius: 14px;
      background: var(--bg-card, rgba(0, 0, 0, 0.03));
      border: 1px solid var(--border, rgba(60, 60, 67, 0.1));
      text-decoration: none;
      color: inherit;
      transition: all 0.15s ease;
    }
    [data-theme="dark"] .qa-app-store-card {
      background: #2C2C2E;
      border-color: rgba(255, 255, 255, 0.08);
    }
    .qa-app-store-card:hover:not(.disabled) {
      background: var(--bg-hover, #E9E9EE);
      border-color: var(--border-subtle, rgba(0, 122, 255, 0.4));
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
    }
    .qa-app-store-card.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .qa-app-store-icon {
      font-size: 24px;
      flex-shrink: 0;
    }
    .qa-app-store-info {
      flex: 1;
      min-width: 0;
    }
    .qa-app-store-name {
      font-size: 13.5px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .qa-app-store-status {
      font-size: 11.5px;
      color: var(--text-muted, #8E8E93);
      margin-top: 2px;
    }
    .qa-app-arrow {
      font-size: 13px;
      color: var(--text-muted, #8E8E93);
      flex-shrink: 0;
    }
    .qa-app-row-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 11px 16px;
      border-radius: 12px;
      background: var(--bg-card, rgba(0, 0, 0, 0.02));
      border: 1px solid var(--border-subtle, rgba(60, 60, 67, 0.06));
      font-size: 13px;
    }
    [data-theme="dark"] .qa-app-row-item {
      background: #242426;
      border-color: rgba(255, 255, 255, 0.06);
    }
    .qa-app-row-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      flex: 1;
    }
    .qa-app-row-label {
      font-weight: 700;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .qa-app-row-val {
      font-family: var(--font-mono, monospace);
      font-size: 12px;
      color: var(--text-secondary, #48484A);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    [data-theme="dark"] .qa-app-row-val {
      color: #AEAEB2;
    }
    .qa-app-action-btn {
      padding: 5px 12px;
      border-radius: 7px;
      border: 1px solid var(--border, rgba(60, 60, 67, 0.14));
      background: var(--bg-surface, #FFFFFF);
      color: var(--text-primary, #1C1C1E);
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
      transition: all 0.12s ease;
      flex-shrink: 0;
    }
    [data-theme="dark"] .qa-app-action-btn {
      background: #2C2C2E;
      color: #FFFFFF;
      border-color: rgba(255, 255, 255, 0.12);
    }
    .qa-app-action-btn:hover {
      background: var(--bg-hover, #E9E9EE);
      transform: translateY(-1px);
    }
    .qa-app-modal-footer {
      padding: 14px 28px 18px 28px;
      border-top: 1px solid var(--border-subtle, rgba(60, 60, 67, 0.08));
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .qa-app-footer-note {
      font-size: 11.5px;
      color: var(--text-muted, #8E8E93);
    }
    .qa-app-footer-dismiss-btn {
      padding: 7px 20px;
      border-radius: 999px;
      background: var(--ios-blue, #007AFF);
      color: #FFFFFF;
      border: none;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .qa-app-footer-dismiss-btn:hover {
      opacity: 0.9;
      transform: scale(1.02);
    }
  `;

  function injectStyles() {
    if (document.getElementById('qa-app-profile-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'qa-app-profile-styles';
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);
  }

  window.copyAppInfo = function (text, btnEl) {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      const orig = btnEl.innerHTML;
      btnEl.innerHTML = '✅ Copied!';
      btnEl.style.borderColor = 'var(--ios-green, #34C759)';
      btnEl.style.color = 'var(--ios-green, #34C759)';
      setTimeout(() => {
        btnEl.innerHTML = orig;
        btnEl.style.borderColor = '';
        btnEl.style.color = '';
      }, 1500);
      if (typeof window.showToast === 'function') {
        window.showToast('📋 Copied: ' + text);
      }
    });
  };

  window.closeAppProfileModal = function () {
    const overlay = document.getElementById('qaAppProfileModalOverlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 220);
  };

  window.openOfficialWebsite = function () {
    const cfg = window.QA_APP_CONFIG || {};
    const url = (cfg.web && cfg.web.homepage) || "";
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      if (typeof window.showToast === 'function') {
        window.showToast('⚠️ Official website URL is not configured.');
      } else {
        console.warn('Official website URL not configured');
      }
    }
  };

  window.openAppProfileModal = function () {
    injectStyles();

    const isKo = window.QA_I18N && window.QA_I18N.getLang() === 'ko';
    const cfg = window.QA_APP_CONFIG || { app: {}, stores: {}, web: {} };
    const app = cfg.app || {};
    const stores = cfg.stores || {};
    const web = cfg.web || {};

    let overlay = document.getElementById('qaAppProfileModalOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'qaAppProfileModalOverlay';
      overlay.className = 'qa-app-modal-overlay';
      overlay.onclick = function (e) {
        if (e.target === overlay) window.closeAppProfileModal();
      };
      document.body.appendChild(overlay);

      window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') window.closeAppProfileModal();
      });
    }

    const initialLetter = (app.name || 'M').charAt(0).toUpperCase();

    function renderStoreCard(icon, name, status, url) {
      if (url) {
        return `
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="qa-app-store-card">
            <span class="qa-app-store-icon">${icon}</span>
            <div class="qa-app-store-info">
              <div class="qa-app-store-name">${name}</div>
              <div class="qa-app-store-status">${status}</div>
            </div>
            <span class="qa-app-arrow">↗</span>
          </a>
        `;
      } else {
        return `
          <div class="qa-app-store-card disabled" title="${isKo ? '등록 준비 중' : 'Coming Soon'}">
            <span class="qa-app-store-icon">${icon}</span>
            <div class="qa-app-store-info">
              <div class="qa-app-store-name">${name}</div>
              <div class="qa-app-store-status">${isKo ? '출시 준비 중' : 'Coming Soon'}</div>
            </div>
            <span class="qa-app-arrow">⏳</span>
          </div>
        `;
      }
    }

    overlay.innerHTML = `
      <div class="qa-app-modal-card" role="dialog" aria-modal="true">
        <!-- Header -->
        <div class="qa-app-modal-header">
          <div class="qa-app-modal-avatar">${initialLetter}</div>
          <div class="qa-app-modal-title-wrap">
            <div class="qa-app-modal-title-row">
              <span class="qa-app-modal-app-name">${app.name || 'Target App'}</span>
              <span class="qa-app-modal-ver-badge">${app.currentVersion || 'v1.0.0'}</span>
            </div>
            <div class="qa-app-modal-tagline">${app.tagline || ''}</div>
          </div>
          <button type="button" class="qa-app-modal-close-btn" onclick="window.closeAppProfileModal()" title="${isKo ? '닫기' : 'Close'}">✕</button>
        </div>

        <!-- Body -->
        <div class="qa-app-modal-body">
          <!-- Section 1: Official Stores & Testing -->
          <div>
            <div class="qa-app-section-title">📱 ${isKo ? '공식 스토어 & 테스터 배포' : 'Official Stores & Beta Releases'}</div>
            <div class="qa-app-store-grid">
              ${renderStoreCard('🤖', isKo ? 'Google Play 스토어' : 'Google Play Store', isKo ? '스토어 앱 페이지' : 'Store Release', stores.playStore)}
              ${renderStoreCard('🍎', isKo ? 'Apple App Store' : 'Apple App Store', isKo ? '스토어 앱 페이지' : 'Store Release', stores.appStore)}
              ${renderStoreCard('🧪', isKo ? 'Play 비공개 테스트' : 'Play Closed Beta', isKo ? '테스터 즉시 참여' : 'Tester Opt-In', stores.playClosedTesting)}
              ${renderStoreCard('✈️', isKo ? 'Apple TestFlight' : 'Apple TestFlight', isKo ? '베타 빌드 초대' : 'Beta Invite', stores.testFlight)}
            </div>
          </div>

          <!-- Section 2: Web & Support -->
          <div>
            <div class="qa-app-section-title">🌐 ${isKo ? '공식 웹 & 개발 지원' : 'Official Web & Support'}</div>
            <div style="display:flex; flex-direction:column; gap:9px;">
              <div class="qa-app-row-item">
                <div class="qa-app-row-left">
                  <span>🏠</span>
                  <span class="qa-app-row-label">${isKo ? '공식 웹사이트' : 'Website'}:</span>
                  <span class="qa-app-row-val">${web.homepage || 'N/A'}</span>
                </div>
                ${web.homepage ? `<a href="${web.homepage}" target="_blank" rel="noopener noreferrer" class="qa-app-action-btn">${isKo ? '방문 ↗' : 'Visit ↗'}</a>` : ''}
              </div>
              <div class="qa-app-row-item">
                <div class="qa-app-row-left">
                  <span>📧</span>
                  <span class="qa-app-row-label">${isKo ? '지원 문의' : 'Support'}:</span>
                  <span class="qa-app-row-val">${app.supportEmail || 'N/A'}</span>
                </div>
                ${app.supportEmail ? `<button type="button" class="qa-app-action-btn" onclick="window.copyAppInfo('${app.supportEmail}', this)">${isKo ? '복사 📋' : 'Copy 📋'}</button>` : ''}
              </div>
            </div>
          </div>

          <!-- Section 3: Legal & Store Compliance -->
          <div>
            <div class="qa-app-section-title">🔒 ${isKo ? '법적 신뢰 & 스토어 심사 요건' : 'Store Compliance & Legal'}</div>
            <div style="display:flex; flex-direction:column; gap:9px;">
              <div class="qa-app-row-item">
                <div class="qa-app-row-left">
                  <span>🛡️</span>
                  <span class="qa-app-row-label">${isKo ? '개인정보 처리방침' : 'Privacy Policy'}:</span>
                  <span class="qa-app-row-val">${web.privacyPolicy || 'N/A'}</span>
                </div>
                ${web.privacyPolicy ? `<a href="${web.privacyPolicy}" target="_blank" rel="noopener noreferrer" class="qa-app-action-btn">${isKo ? '보기 ↗' : 'View ↗'}</a>` : ''}
              </div>
              <div class="qa-app-row-item">
                <div class="qa-app-row-left">
                  <span>📜</span>
                  <span class="qa-app-row-label">${isKo ? '서비스 이용약관' : 'Terms of Service'}:</span>
                  <span class="qa-app-row-val">${web.termsOfService || 'N/A'}</span>
                </div>
                ${web.termsOfService ? `<a href="${web.termsOfService}" target="_blank" rel="noopener noreferrer" class="qa-app-action-btn">${isKo ? '보기 ↗' : 'View ↗'}</a>` : ''}
              </div>
              <div class="qa-app-row-item">
                <div class="qa-app-row-left">
                  <span>📦</span>
                  <span class="qa-app-row-label">${isKo ? '패키지 / 번들 ID' : 'Package ID'}:</span>
                  <span class="qa-app-row-val">${app.packageName || app.bundleId || 'N/A'}</span>
                </div>
                ${(app.packageName || app.bundleId) ? `<button type="button" class="qa-app-action-btn" onclick="window.copyAppInfo('${app.packageName || app.bundleId}', this)">${isKo ? '복사 📋' : 'Copy 📋'}</button>` : ''}
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="qa-app-modal-footer">
          <span class="qa-app-footer-note">${app.developer ? `© ${app.developer}` : ''}</span>
          <button type="button" class="qa-app-footer-dismiss-btn" onclick="window.closeAppProfileModal()">${isKo ? '확인 및 닫기' : 'Dismiss'}</button>
        </div>
      </div>
    `;

    overlay.style.display = 'flex';
    setTimeout(() => {
      overlay.classList.add('active');
    }, 10);
  };
})();
