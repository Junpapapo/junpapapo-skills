/**
 * Modo QA Master Spreadsheet - Interactive Rendering & Filter Engine
 * Supports Multi-Track Ingestion, Dynamic Date Aggregation, Live Search, Pinning, Sort, and Universal i18n (EN/KO).
 */

(function () {
  'use strict';

  let currentTrackId = 'all';
  let currentDate = 'all';
  let currentPlatform = 'all';
  let currentCategory = 'all';
  let currentStatus = 'all';
  let currentSeverity = 'all';
  let currentDeployFilter = 'all';
  let searchQuery = '';
  let activeIssues = [];
  let sortColumn = null;
  let sortAsc = true;

  // Local Storage for Highlights/Bookmarks & Deploy Status
  const STORAGE_KEY_HIGHLIGHTS = 'modo_qa_highlighted_ids';
  const STORAGE_KEY_THEME = 'modo_sheet_theme';
  const STORAGE_KEY_TRACK = 'modo_qa_active_track';
  const STORAGE_KEY_DEPLOY_STATUS = 'MODO_QA_DEPLOY_STATUS_V2';
  const STORAGE_KEY_DEPLOY_STATUS_V1 = 'MODO_QA_DEPLOY_STATUS_V1';
  const STORAGE_KEY_TARGET_RELEASE_AOS = 'modo_qa_target_release_aos';
  const STORAGE_KEY_TARGET_RELEASE_IOS = 'modo_qa_target_release_ios';
  const STORAGE_KEY_DETAIL_FILTER_OPEN = 'modo_qa_detail_filter_open';
  const DEFAULT_TARGET_RELEASE_AOS = '77 (1.1.10)';
  const DEFAULT_TARGET_RELEASE_IOS = '84 (1.1.5)';

  let currentEditingDeployKey = null;
  let currentEditingDeployOs = 'android';
  let isDetailFilterOpen = false;

  function getTargetRelease(os = 'android') {
    try {
      if (os === 'ios') {
        return localStorage.getItem(STORAGE_KEY_TARGET_RELEASE_IOS) || DEFAULT_TARGET_RELEASE_IOS;
      }
      return localStorage.getItem(STORAGE_KEY_TARGET_RELEASE_AOS) || localStorage.getItem('modo_qa_target_release') || DEFAULT_TARGET_RELEASE_AOS;
    } catch {
      return os === 'ios' ? DEFAULT_TARGET_RELEASE_IOS : DEFAULT_TARGET_RELEASE_AOS;
    }
  }

  function setTargetRelease(os = 'android', val) {
    const clean = (val || '').trim();
    if (!clean) return;
    try {
      if (os === 'ios') {
        localStorage.setItem(STORAGE_KEY_TARGET_RELEASE_IOS, clean);
      } else {
        localStorage.setItem(STORAGE_KEY_TARGET_RELEASE_AOS, clean);
      }
    } catch (e) {
      console.warn('Failed to save target release:', e);
    }
    const inputId = os === 'ios' ? 'targetReleaseIosInput' : 'targetReleaseAosInput';
    const input = document.getElementById(inputId);
    if (input && input.value !== clean) {
      input.value = clean;
    }
  }

  function getOsLogoSvg(os = 'android', size = 13, extraStyle = '') {
    if (os === 'ios') {
      return `<svg class="qa-os-logo qa-ios-logo" viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" style="vertical-align: -2px; display: inline-block; flex-shrink: 0; ${extraStyle}" aria-hidden="true"><title>Apple</title><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>`;
    }
    return `<svg class="qa-os-logo qa-aos-logo" viewBox="0 0 24 24" width="${size}" height="${size}" fill="#3DDC84" style="vertical-align: -2px; display: inline-block; flex-shrink: 0; ${extraStyle}" aria-hidden="true"><title>Android</title><path d="M18.4395 5.5586c-.675 1.1664-1.352 2.3318-2.0274 3.498-.0366-.0155-.0742-.0286-.1113-.043-1.8249-.6957-3.484-.8-4.42-.787-1.8551.0185-3.3544.4643-4.2597.8203-.084-.1494-1.7526-3.021-2.0215-3.4864a1.1451 1.1451 0 0 0-.1406-.1914c-.3312-.364-.9054-.4859-1.379-.203-.475.282-.7136.9361-.3886 1.5019 1.9466 3.3696-.0966-.2158 1.9473 3.3593.0172.031-.4946.2642-1.3926 1.0177C2.8987 12.176.452 14.772 0 18.9902h24c-.119-1.1108-.3686-2.099-.7461-3.0683-.7438-1.9118-1.8435-3.2928-2.7402-4.1836a12.1048 12.1048 0 0 0-2.1309-1.6875c.6594-1.122 1.312-2.2559 1.9649-3.3848.2077-.3615.1886-.7956-.0079-1.1191a1.1001 1.1001 0 0 0-.8515-.5332c-.5225-.0536-.9392.3128-1.0488.5449zm-.0391 8.461c.3944.5926.324 1.3306-.1563 1.6503-.4799.3197-1.188.0985-1.582-.4941-.3944-.5927-.324-1.3307.1563-1.6504.4727-.315 1.1812-.1086 1.582.4941zM7.207 13.5273c.4803.3197.5506 1.0577.1563 1.6504-.394.5926-1.1038.8138-1.584.4941-.48-.3197-.5503-1.0577-.1563-1.6504.4008-.6021 1.1087-.8106 1.584-.4941z"/></svg>`;
  }

  function getDeployMap() {
    try {
      let localMap = {};
      const v2Raw = localStorage.getItem(STORAGE_KEY_DEPLOY_STATUS);
      if (v2Raw) {
        localMap = JSON.parse(v2Raw);
      } else {
        // Migrate from V1 if available
        const v1Raw = localStorage.getItem(STORAGE_KEY_DEPLOY_STATUS_V1);
        if (v1Raw) {
          const v1Map = JSON.parse(v1Raw);
          Object.keys(v1Map).forEach(key => {
            const val = v1Map[key];
            const isDep = typeof val === 'object' ? !!val.deployed : !!val;
            const ver = (typeof val === 'object' && val.version) ? val.version : '';
            const at = (typeof val === 'object' && val.deployedAt) ? val.deployedAt : '';
            localMap[key] = {
              android: { deployed: isDep, version: ver, deployedAt: at },
              ios: { deployed: isDep, version: ver, deployedAt: at }
            };
          });
          localStorage.setItem(STORAGE_KEY_DEPLOY_STATUS, JSON.stringify(localMap));
        }
      }

      // Merge with permanent registry from qa_deploy_registry.js
      const registry = window.MODO_QA_DEPLOY_REGISTRY || {};
      const merged = JSON.parse(JSON.stringify(registry));
      Object.keys(localMap).forEach(key => {
        if (!merged[key]) merged[key] = {};
        if (localMap[key].android) {
          merged[key].android = { ...(merged[key].android || {}), ...localMap[key].android };
        }
        if (localMap[key].ios) {
          merged[key].ios = { ...(merged[key].ios || {}), ...localMap[key].ios };
        }
      });
      return merged;
    } catch (e) {
      console.warn('Failed to load deploy map:', e);
      return window.MODO_QA_DEPLOY_REGISTRY || {};
    }
  }

  function isPlatformApplicable(item, os = 'android') {
    if (!item) return false;
    const plat = (item.platform || 'all').toLowerCase();
    if (os === 'android') return plat !== 'ios';
    if (os === 'ios') return plat !== 'android';
    return true;
  }

  function getItemKey(item) {
    if (!item) return '';
    if (item._uid) return item._uid;
    const phase = item.phase || item.track || (String(item.id).startsWith('FB-') ? 'feedback' : (currentTrackId && currentTrackId !== 'all' ? currentTrackId : 'phase3'));
    return `${phase}_${item.id}`;
  }

  function isItemDeployed(item, os = 'android') {
    if (!item) return false;
    const map = getDeployMap();
    const key = getItemKey(item);
    const idStr = String(item.id);
    const record = map[key] || map[`phase3_${item.id}`] || map[`phase1_${item.id}`] || map[idStr];

    if (record) {
      if (record[os] !== undefined) {
        return typeof record[os] === 'object' ? !!record[os].deployed : !!record[os];
      }
      // Fallback if record was old flat object { deployed: true, ... }
      if (record.deployed !== undefined) {
        return !!record.deployed;
      }
    }

    // Static fallback on item definition
    if (os === 'android') {
      if (item.deployedAos !== undefined) return !!item.deployedAos;
      if ((item.platform || '').toLowerCase() === 'ios') return false;
      return !!item.deployed;
    }
    if (os === 'ios') {
      if (item.deployedIos !== undefined) return !!item.deployedIos;
      if ((item.platform || '').toLowerCase() === 'android') return false;
      return !!item.deployed;
    }
    return !!item.deployed;
  }

  function getDeployTimestamp(item, os = 'android') {
    if (!item) return '';
    const map = getDeployMap();
    const key = getItemKey(item);
    const idStr = String(item.id);
    const record = map[key] || map[`phase3_${item.id}`] || map[`phase1_${item.id}`] || map[idStr];

    if (record && record[os] && typeof record[os] === 'object' && record[os].deployedAt) {
      return record[os].deployedAt;
    }
    if (record && typeof record === 'object' && record.deployedAt) {
      return record.deployedAt;
    }
    return item.deployedDate || '';
  }

  function getDeployVersion(item, os = 'android') {
    if (!item) return '';
    const map = getDeployMap();
    const key = getItemKey(item);
    const idStr = String(item.id);
    const record = map[key] || map[`phase3_${item.id}`] || map[`phase1_${item.id}`] || map[idStr];

    if (record && record[os] && typeof record[os] === 'object' && record[os].version) {
      return record[os].version;
    }
    if (record && typeof record === 'object' && record.version) {
      return record.version;
    }
    if (os === 'android' && item.deployedVersionAos) return item.deployedVersionAos;
    if (os === 'ios' && item.deployedVersionIos) return item.deployedVersionIos;
    return item.deployedVersion || item.release || '';
  }

  function toggleDeploy(targetKey, os = 'android', checked, event) {
    if (event) event.stopPropagation();
    const map = getDeployMap();
    const keyStr = String(targetKey);
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (!map[keyStr] || typeof map[keyStr] !== 'object') {
      map[keyStr] = {};
    }
    if (!map[keyStr][os] || typeof map[keyStr][os] !== 'object') {
      map[keyStr][os] = {};
    }

    let ver = '';
    if (checked) {
      const existingVer = map[keyStr][os].version;
      ver = (existingVer || getTargetRelease(os)).replace(/^🚀\s*/, '').trim();
    }

    map[keyStr][os] = {
      deployed: !!checked,
      deployedAt: checked ? dateStr : '',
      version: ver
    };

    try {
      localStorage.setItem(STORAGE_KEY_DEPLOY_STATUS, JSON.stringify(map));
    } catch (e) {
      console.warn('Failed to save deploy status to localStorage:', e);
    }
    updateDeployBadges();
    renderTable();
    markDeployUnsavedChange();
  }

  function openEditDeployVersionModal(targetKey, os = 'android', event) {
    if (event) event.stopPropagation();
    currentEditingDeployKey = String(targetKey);
    currentEditingDeployOs = os || 'android';
    const modal = document.getElementById('editDeployModal');
    if (!modal) return;

    const item = (activeIssues || []).find(i => getItemKey(i) === currentEditingDeployKey || String(i.id) === currentEditingDeployKey);
    const descEl = document.getElementById('editDeployItemDesc');
    if (descEl && item) {
      descEl.textContent = `#${item.id} - ${item.title || item.problem || ''}`;
    }

    const titleEl = document.getElementById('editDeployModalTitle');
    if (titleEl) {
      const logo = getOsLogoSvg(currentEditingDeployOs, 16, 'margin-right:5px;');
      titleEl.innerHTML = currentEditingDeployOs === 'ios'
        ? `${logo} iOS 배포 릴리즈 버전 수정`
        : `${logo} Android 배포 릴리즈 버전 수정`;
    }

    const osBadgeEl = document.getElementById('editDeployOsBadge');
    if (osBadgeEl) {
      if (currentEditingDeployOs === 'ios') {
        osBadgeEl.innerHTML = `${getOsLogoSvg('ios', 12, 'margin-right:3px;')} iOS`;
        osBadgeEl.style.background = 'rgba(34, 139, 230, 0.14)';
        osBadgeEl.style.color = '#228BE6';
        osBadgeEl.style.border = '1px solid rgba(34, 139, 230, 0.28)';
      } else {
        osBadgeEl.innerHTML = `${getOsLogoSvg('android', 12, 'margin-right:3px;')} Android`;
        osBadgeEl.style.background = 'rgba(43, 138, 62, 0.14)';
        osBadgeEl.style.color = '#2B8A3E';
        osBadgeEl.style.border = '1px solid rgba(43, 138, 62, 0.28)';
      }
    }

    const currentVer = String(item ? getDeployVersion(item, currentEditingDeployOs) : getTargetRelease(currentEditingDeployOs)).replace(/^🚀\s*/, '').trim();
    const input = document.getElementById('editDeployVersionInput');
    if (input) {
      input.value = currentVer || getTargetRelease(currentEditingDeployOs).replace(/^🚀\s*/, '').trim();
      input.style.color = currentEditingDeployOs === 'ios' ? '#228BE6' : '#2B8A3E';
    }

    const quickBtn = document.getElementById('btnQuickCurrentRelease');
    if (quickBtn) {
      quickBtn.textContent = getTargetRelease(currentEditingDeployOs).replace(/^🚀\s*/, '').trim();
    }

    const saveBtn = document.getElementById('btnSaveDeployVersion');
    if (saveBtn) {
      saveBtn.style.background = currentEditingDeployOs === 'ios' ? '#228BE6' : '#2B8A3E';
    }

    modal.style.display = 'flex';
    if (input) setTimeout(() => input.focus(), 100);
  }

  function closeEditDeployModal() {
    const modal = document.getElementById('editDeployModal');
    if (modal) modal.style.display = 'none';
    currentEditingDeployKey = null;
    currentEditingDeployOs = 'android';
  }

  function applyQuickTargetRelease() {
    const input = document.getElementById('editDeployVersionInput');
    if (input) {
      input.value = getTargetRelease(currentEditingDeployOs).replace(/^🚀\s*/, '').trim();
    }
  }

  function saveDeployVersion() {
    if (!currentEditingDeployKey) return;
    const input = document.getElementById('editDeployVersionInput');
    const newVer = input ? input.value.replace(/^🚀\s*/, '').trim() : '';

    const map = getDeployMap();
    const keyStr = currentEditingDeployKey;
    const os = currentEditingDeployOs || 'android';
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (!map[keyStr] || typeof map[keyStr] !== 'object') {
      map[keyStr] = {};
    }
    if (!map[keyStr][os] || typeof map[keyStr][os] !== 'object') {
      map[keyStr][os] = {};
    }

    map[keyStr][os].deployed = true;
    map[keyStr][os].version = newVer;
    if (!map[keyStr][os].deployedAt) map[keyStr][os].deployedAt = dateStr;

    try {
      localStorage.setItem(STORAGE_KEY_DEPLOY_STATUS, JSON.stringify(map));
    } catch (e) {
      console.warn('Failed to save deploy status to localStorage:', e);
    }

    closeEditDeployModal();
    updateDeployBadges();
    renderTable();
    markDeployUnsavedChange();
    const osPrefix = os === 'ios' ? 'iOS' : 'Android';
    showToast(`🚀 ${osPrefix} 배포 버전이 '${newVer}'(으)로 갱신되었습니다.`);
  }

  let hasUnsavedDeployChanges = false;
  function markDeployUnsavedChange() {
    hasUnsavedDeployChanges = true;
    const badge = document.getElementById('badgeDeployUnsaved');
    if (badge) {
      badge.style.display = 'inline-block';
    }
    const btn = document.getElementById('btnSaveDeployRegistry');
    if (btn) {
      btn.classList.add('has-unsaved');
    }
  }

  function openDeploySaveModal() {
    const modal = document.getElementById('deploySaveModal');
    if (!modal) {
      showToast('⚠️ 배포 저장 모달 요소를 찾을 수 없습니다.');
      return;
    }
    const map = getDeployMap();
    const keys = Object.keys(map);
    let aosCount = 0;
    let iosCount = 0;
    keys.forEach(k => {
      if (map[k]?.android?.deployed) aosCount++;
      if (map[k]?.ios?.deployed) iosCount++;
    });

    const infoEl = document.getElementById('deploySaveModalInfo');
    if (infoEl) {
      infoEl.innerHTML = `현재 브라우저에 기록된 총 <b>${keys.length}</b>개 안건 중 <b>Android: ${aosCount}건</b>, <b>iOS: ${iosCount}건</b>이 배포 상태로 설정되어 있습니다.`;
    }

    const codePreview = document.getElementById('deploySaveModalPreview');
    if (codePreview) {
      codePreview.textContent = JSON.stringify(map, null, 2);
    }

    modal.style.display = 'flex';
    showToast(`💾 배포 정보 저장 창이 열렸습니다 (AOS: ${aosCount}건 / iOS: ${iosCount}건)`);
  }

  function closeDeploySaveModal() {
    const modal = document.getElementById('deploySaveModal');
    if (modal) modal.style.display = 'none';
  }

  async function saveDeployRegistryDirectly() {
    const map = getDeployMap();
    const jsContent = `/**\n * Modo QA Master - Deploy Registry (Permanent Record)\n * Auto-generated & synced with User Deploy Actions\n */\nwindow.MODO_QA_DEPLOY_REGISTRY = ${JSON.stringify(map, null, 2)};\n`;

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: 'qa_deploy_registry.js',
          types: [{
            description: 'JavaScript File',
            accept: { 'text/javascript': ['.js'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(jsContent);
        await writable.close();
        hasUnsavedDeployChanges = false;
        const badge = document.getElementById('badgeDeployUnsaved');
        if (badge) badge.style.display = 'none';
        const btn = document.getElementById('btnSaveDeployRegistry');
        if (btn) btn.classList.remove('has-unsaved');
        showToast('💾 qa_deploy_registry.js 파일에 배포 정보가 영구 저장되었습니다!');
        closeDeploySaveModal();
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.warn('showSaveFilePicker error, falling back to download:', err);
      }
    }
    // Fallback to instant download
    downloadDeployRegistryJs();
  }

  function downloadDeployRegistryJs() {
    const map = getDeployMap();
    const jsContent = `/**\n * Modo QA Master - Deploy Registry (Permanent Record)\n * Auto-generated & synced with User Deploy Actions\n */\nwindow.MODO_QA_DEPLOY_REGISTRY = ${JSON.stringify(map, null, 2)};\n`;
    const blob = new Blob([jsContent], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qa_deploy_registry.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    hasUnsavedDeployChanges = false;
    const badge = document.getElementById('badgeDeployUnsaved');
    if (badge) badge.style.display = 'none';
    const btn = document.getElementById('btnSaveDeployRegistry');
    if (btn) btn.classList.remove('has-unsaved');
    showToast('💾 qa_deploy_registry.js 파일이 다운로드되었습니다. data/ 폴더에 저장하세요.');
    closeDeploySaveModal();
  }

  function downloadDeployRegistryJson() {
    const map = getDeployMap();
    const jsonContent = JSON.stringify(map, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qa_deploy_registry.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('💾 qa_deploy_registry.json 파일이 다운로드되었습니다.');
    closeDeploySaveModal();
  }

  function copyDeployRegistrySnippet() {
    const map = getDeployMap();
    const jsContent = `window.MODO_QA_DEPLOY_REGISTRY = ${JSON.stringify(map, null, 2)};`;
    navigator.clipboard?.writeText(jsContent).then(() => {
      showToast('📋 배포 레지스트리 JS 코드가 클립보드에 복사되었습니다!');
    });
  }

  function copyDeploySyncCli() {
    const cli = 'node docs/02_Guides/internal_qa_issue_tracker/scripts/sync_deploy_status.js';
    navigator.clipboard?.writeText(cli).then(() => {
      showToast('📋 영구 동기화 CLI 명령어가 복사되었습니다: ' + cli);
    });
  }


  function t(key, params) {
    if (window.QA_I18N && typeof window.QA_I18N.t === 'function') {
      return window.QA_I18N.t(key, params);
    }
    return key;
  }

  function getHighlights() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_HIGHLIGHTS) || '[]');
    } catch {
      return [];
    }
  }

  function setHighlights(ids) {
    try {
      localStorage.setItem(STORAGE_KEY_HIGHLIGHTS, JSON.stringify(ids));
    } catch {}
  }

  function isHighlighted(itemOrKey) {
    const highlights = getHighlights();
    const key = typeof itemOrKey === 'object' ? getItemKey(itemOrKey) : String(itemOrKey);
    const rawId = typeof itemOrKey === 'object' ? itemOrKey.id : itemOrKey;
    return highlights.includes(key) || highlights.includes(rawId) || highlights.includes(String(rawId));
  }

  function toggleHighlight(targetKey, event) {
    if (event) event.stopPropagation();
    const highlights = getHighlights();
    const keyStr = String(targetKey);
    const idx = highlights.indexOf(keyStr);
    const willBePinned = idx < 0;
    if (idx >= 0) {
      highlights.splice(idx, 1);
    } else {
      highlights.push(keyStr);
    }
    setHighlights(highlights);

    // In-place DOM update for zero-lag instantaneous UI response
    if (currentStatus === 'highlighted') {
      renderTable();
    } else {
      const row = document.querySelector(`.main-row[data-key="${keyStr}"]`) || document.querySelector(`.main-row[data-id="${keyStr}"]`);
      if (row) {
        if (willBePinned) {
          row.classList.add('highlighted');
        } else {
          row.classList.remove('highlighted');
        }
      }
    }
    updateHeaderStats();
  }

  // Theme Management
  function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEY_THEME) || 'light';
    document.documentElement.setAttribute('data-theme', saved);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEY_THEME, next);
  }

  // Severity Guide Modal Management
  function toggleSeverityGuideModal(show) {
    const modal = document.getElementById('severityGuideModal');
    if (!modal) return;
    const shouldOpen = show !== undefined ? !!show : !modal.classList.contains('active');
    if (shouldOpen) {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    } else {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  // Track Switching
  function switchTrack(trackId) {
    currentTrackId = trackId;
    try {
      localStorage.setItem(STORAGE_KEY_TRACK, trackId);
    } catch {}
    currentDate = 'all';
    currentPlatform = 'all';
    currentCategory = 'all';
    currentStatus = 'all';
    currentSeverity = 'all';
    searchQuery = '';

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';

    try {
      const url = new URL(window.location.href);
      url.searchParams.set('track', trackId);
      window.history.replaceState(null, '', url.toString());
    } catch {}

    renderTrackTabs();
    loadTrackData();
  }

  function loadTrackData() {
    const manifest = window.MODO_QA_MANIFEST;
    if (!manifest) return;

    if (currentTrackId === 'feedback') {
      activeIssues = window.MODO_FEEDBACK_DATA || [];
    } else {
      const track = manifest.tracks.find(t => t.id === currentTrackId) || manifest.tracks[0];
      activeIssues = track ? track.getData() : [];
    }

    updateDateDropdown();
    updateStatusBadges();
    updatePlatformBadges();
    updateCategoryBadges();
    updateSeverityBadges();
    updateHeaderStats();
    renderTable();
  }

  function getTrackLabel(track) {
    if (track.id === 'all') return t('trackAll');
    if (track.id === 'phase1') return t('trackPhase1');
    if (track.id === 'phase2') return t('trackPhase2');
    if (track.id === 'phase3') return t('trackPhase3');
    if (track.id === 'phase4') return t('trackPhase4') || 'Phase 4 장기 로드맵';
    if (track.id === 'feedback') return t('trackFeedback');
    return track.label;
  }

  function renderTrackTabs() {
    const trackBar = document.getElementById('trackTabsBar');
    if (!trackBar || !window.MODO_QA_MANIFEST) return;

    const manifest = window.MODO_QA_MANIFEST;
    const allTracks = [...manifest.tracks];
    if (window.MODO_FEEDBACK_DATA && !allTracks.some(t => t.id === 'feedback')) {
      allTracks.push({
        id: 'feedback',
        label: t('trackFeedback') || '💬 유저 VOC',
        color: '#0CA678',
        getData: () => window.MODO_FEEDBACK_DATA || []
      });
    }

    trackBar.innerHTML = allTracks.map(track => {
      const data = track.getData();
      const count = data.length;
      const isActive = track.id === currentTrackId;
      const label = getTrackLabel(track);
      const unit = t('trackCountUnit');
      const trackColor = track.color || 'var(--ios-blue)';

      let iconHtml = '';
      if (track.id === 'phase1') {
        iconHtml = '<img src="assets/icons/logo_google_play.svg" alt="Google Play" style="width:13px; height:13px; vertical-align:-1px; margin-right:5px; display:inline-block;" />';
      } else if (track.id === 'phase2') {
        iconHtml = '<img src="assets/icons/logo_app_store.svg" alt="App Store" style="width:13px; height:13px; vertical-align:-1px; margin-right:5px; display:inline-block;" />';
      } else if (track.id === 'all') {
        iconHtml = '<span style="font-size:12px; margin-right:4px;">🚀</span>';
      } else if (track.id === 'phase3') {
        iconHtml = '<span style="font-size:12px; margin-right:4px;">💎</span>';
      } else if (track.id === 'phase4') {
        iconHtml = '<span style="font-size:12px; margin-right:4px;">🔭</span>';
      } else if (track.id === 'feedback') {
        iconHtml = '<span style="font-size:12px; margin-right:4px;">💬</span>';
      }

      return `
        <button 
          type="button"
          class="track-tab-btn ${isActive ? 'active' : ''}" 
          onclick="window.MODO_QA.switchTrack('${track.id}')"
          style="${isActive ? `--active-track-color:${trackColor};` : ''}"
        >
          <span class="track-tab-label" style="display:inline-flex; align-items:center;">${iconHtml}${label}</span>
          <span class="track-tab-count" style="${isActive ? `background:${trackColor}; color:#FFFFFF;` : ''}">
            ${count} ${unit}
          </span>
        </button>
      `;
    }).join('');
  }

  function updateDateDropdown() {
    const dateSelect = document.getElementById('dateFilterSelect');
    if (!dateSelect) return;

    // Count issues per date
    const dateCounts = {};
    activeIssues.forEach(item => {
      dateCounts[item.date] = (dateCounts[item.date] || 0) + 1;
    });

    const dates = Object.keys(dateCounts).sort().reverse();
    const total = activeIssues.length;
    const unit = t('trackCountUnit');

    let options = `<option value="all" ${currentDate === 'all' ? 'selected' : ''}>${t('allDates')} (${total} ${unit})</option>`;
    dates.forEach(d => {
      options += `<option value="${d}" ${currentDate === d ? 'selected' : ''}>${d} (${dateCounts[d]} ${unit})</option>`;
    });

    dateSelect.innerHTML = options;
  }

  function updateStatusBadges() {
    const highlights = getHighlights();
    const statusCounts = {
      all: activeIssues.length,
      resolved: activeIssues.filter(i => i.status === 'resolved').length,
      pending: activeIssues.filter(i => i.status !== 'resolved').length,
      highlighted: activeIssues.filter(i => highlights.includes(i.id)).length,
      voc: activeIssues.filter(i => Boolean(
        i.vocRef ||
        (i.problem && i.problem.includes('FB-')) ||
        (i.title && i.title.includes('FB-')) ||
        (i.cause && i.cause.includes('FB-')) ||
        (i.solution && i.solution.includes('FB-'))
      )).length
    };

    const statusKeyMap = {
      all: 'statusAll',
      resolved: 'statusResolved',
      pending: 'statusPending',
      highlighted: 'statusHighlighted',
      voc: 'statusVoc'
    };

    document.querySelectorAll('#statusFilters .filter-tag').forEach(tag => {
      const st = tag.getAttribute('data-status');
      if (st) {
        tag.classList.toggle('active', currentStatus === st);
        const baseKey = statusKeyMap[st];
        const baseLabel = baseKey ? t(baseKey) : st;
        if (st === 'all') {
          tag.textContent = baseLabel;
        } else if (statusCounts[st] !== undefined) {
          tag.textContent = `${baseLabel} (${statusCounts[st]})`;
        }
      }
    });
  }

  function updatePlatformBadges() {
    const platCounts = { all: 0, ios: 0, android: 0, all_common: 0 };
    activeIssues.forEach(item => {
      const p = (item.platform || 'all').toLowerCase();
      platCounts.all++;
      if (p === 'ios') {
        platCounts.ios++;
      } else if (p === 'android') {
        platCounts.android++;
      } else {
        platCounts.all_common++;
      }
    });

    document.querySelectorAll('#platformFilters .filter-tag').forEach(tag => {
      const plat = tag.getAttribute('data-platform');
      if (plat === 'all') {
        tag.classList.toggle('active', currentPlatform === 'all');
        tag.textContent = t('platformAll');
      } else if (platCounts[plat] !== undefined) {
        tag.classList.toggle('active', currentPlatform === plat);
        if (plat === 'ios') {
          tag.innerHTML = `${getOsLogoSvg('ios', 13, 'margin-right:4px;')} iOS (${platCounts.ios})`;
        } else if (plat === 'android') {
          tag.innerHTML = `${getOsLogoSvg('android', 13, 'margin-right:4px;')} Android (${platCounts.android})`;
        } else if (plat === 'all_common') {
          tag.textContent = `${t('platformCommon')} (${platCounts.all_common})`;
        }
      }
    });
  }

  const DOMAIN_MAP = {
    reliability: ['reliability', 'bug', 'crash', 'stability', 'BUG', 'error', 'exception', 'freeze'],
    core: ['core', 'logic', 'feature', 'func', 'functional', 'editor', 'route', 'governance', 'setting', 'settings', 'FEATURE', 'system'],
    ui: ['ui', 'ui_ux', 'design', 'ux', 'theme', 'modal', 'widget', 'i18n', 'style', 'layout'],
    perf: ['perf', 'performance', 'navigation', 'architecture', 'arch', 'refactor', 'enhancement', 'speed', 'memory', 'leak'],
    media: ['media', 'voice', 'audio', 'sound', 'camera'],
    monetization: ['monetization', 'legal', 'release', 'billing', 'iap', 'subscription'],
    auth: ['auth', 'security', 'oauth', 'token', 'permission'],
    db: ['db', 'data', 'database', 'sqlite', 'storage', 'backup', 'vault'],
  };

  function normalizeCategory(rawCat) {
    const c = (rawCat || '').toLowerCase();
    for (const [domain, aliases] of Object.entries(DOMAIN_MAP)) {
      if (domain === c || aliases.includes(c)) return domain;
    }
    return 'core';
  }

  function updateCategoryBadges() {
    const catCounts = {
      reliability: 0,
      core: 0,
      ui: 0,
      perf: 0,
      media: 0,
      monetization: 0,
      auth: 0,
      db: 0,
    };

    activeIssues.forEach(item => {
      const norm = normalizeCategory(item.category);
      if (catCounts[norm] !== undefined) {
        catCounts[norm]++;
      }
    });

    const catKeyMap = {
      reliability: 'catReliability',
      core: 'catCore',
      ui: 'catUi',
      perf: 'catPerf',
      media: 'catMedia',
      monetization: 'catMonetization',
      auth: 'catAuth',
      db: 'catDb',
    };

    document.querySelectorAll('#categoryFilters .filter-tag').forEach(tag => {
      const cat = tag.getAttribute('data-cat');
      if (cat === 'all') {
        tag.classList.toggle('active', currentCategory === 'all');
        tag.textContent = t('catAll');
      } else if (catCounts[cat] !== undefined) {
        tag.classList.toggle('active', currentCategory === cat);
        const key = catKeyMap[cat];
        const baseLabel = key ? t(key) : tag.getAttribute('data-label-base');
        tag.textContent = `${baseLabel} (${catCounts[cat]})`;
      }
    });
  }

  const SEV_LABELS = {
    'S1': '🚨 S1 Blocker',
    'S2': '🔥 S2 Critical',
    'S3': '⚡ S3 Major',
    'S4': '🌱 S4 Minor',
    'S5': '☕ S5 Trivial'
  };

  function updateSeverityBadges() {
    const sevCounts = { all: 0, S1: 0, S2: 0, S3: 0, S4: 0, S5: 0 };
    activeIssues.forEach(item => {
      sevCounts.all++;
      const s = item.severity || 'S3';
      if (sevCounts[s] !== undefined) {
        sevCounts[s]++;
      }
    });

    document.querySelectorAll('#severityFilters .filter-tag').forEach(tag => {
      const sev = tag.getAttribute('data-sev');
      if (sev === 'all') {
        tag.classList.toggle('active', currentSeverity === 'all');
        tag.textContent = t('sevAll');
      } else if (sevCounts[sev] !== undefined) {
        tag.classList.toggle('active', currentSeverity === sev);
        const base = SEV_LABELS[sev] || tag.getAttribute('data-label-base');
        tag.textContent = `${base} (${sevCounts[sev]})`;
      }
    });
  }

  function updateHeaderStats() {
    const total = activeIssues.length;
    const resolved = activeIssues.filter(i => i.status === 'resolved').length;
    const pending = total - resolved;

    const elTotal = document.getElementById('statTotal');
    const elResolved = document.getElementById('statResolved');
    const elPending = document.getElementById('statPending');

    if (elTotal) elTotal.textContent = total;
    if (elResolved) elResolved.textContent = resolved;
    if (elPending) elPending.textContent = pending;

    updateDeployBadges();
  }

  function updateDeployBadges() {
    const isPreRelease = (currentTrackId === 'phase1' || currentTrackId === 'phase2' || currentTrackId === 'feedback');
    const deployGroup = document.getElementById('deployFilters');
    const targetReleaseRow = document.getElementById('targetReleaseRow');
    const badgeDeployedAos = document.getElementById('badgeStatDeployedAos');
    const badgeDeployedIos = document.getElementById('badgeStatDeployedIos');
    const thDeployAos = document.getElementById('thDeployAos');
    const thDeployIos = document.getElementById('thDeployIos');

    if (deployGroup) deployGroup.style.display = isPreRelease ? 'none' : 'flex';
    if (targetReleaseRow) targetReleaseRow.style.display = isPreRelease ? 'none' : 'flex';
    if (badgeDeployedAos) badgeDeployedAos.style.display = isPreRelease ? 'none' : 'inline-block';
    if (badgeDeployedIos) badgeDeployedIos.style.display = isPreRelease ? 'none' : 'inline-block';
    if (thDeployAos) thDeployAos.style.display = isPreRelease ? 'none' : '';
    if (thDeployIos) thDeployIos.style.display = isPreRelease ? 'none' : '';

    if (isPreRelease) return;

    let targetIssues = activeIssues.filter(i => !String(i.id).startsWith('FB-'));
    if (currentTrackId === 'all') {
      targetIssues = targetIssues.filter(i => i.phase === 'phase3');
    }
    const targetAosIssues = targetIssues.filter(i => isPlatformApplicable(i, 'android'));
    const deployedAosCount = targetAosIssues.filter(i => isItemDeployed(i, 'android')).length;

    const targetIosIssues = targetIssues.filter(i => isPlatformApplicable(i, 'ios'));
    const deployedIosCount = targetIosIssues.filter(i => isItemDeployed(i, 'ios')).length;

    const deployedBothCount = targetIssues.filter(i => isPlatformApplicable(i, 'android') && isPlatformApplicable(i, 'ios') && isItemDeployed(i, 'android') && isItemDeployed(i, 'ios')).length;
    const pendingCount = targetIssues.filter(i => {
      const aosApp = isPlatformApplicable(i, 'android');
      const iosApp = isPlatformApplicable(i, 'ios');
      const isAos = isItemDeployed(i, 'android');
      const isIos = isItemDeployed(i, 'ios');
      if (aosApp && iosApp) return !isAos && !isIos;
      if (aosApp) return !isAos;
      if (iosApp) return !isIos;
      return false;
    }).length;

    document.querySelectorAll('#deployFilters .filter-tag').forEach(tag => {
      const dep = tag.getAttribute('data-deploy');
      if (dep === 'all') {
        tag.classList.toggle('active', currentDeployFilter === 'all');
        tag.textContent = `${t('filterDeployAll')} (${targetIssues.length})`;
      } else if (dep === 'deployed_aos') {
        tag.classList.toggle('active', currentDeployFilter === 'deployed_aos');
        tag.innerHTML = `${getOsLogoSvg('android', 13, 'margin-right:4px;')} AOS 배포 (${deployedAosCount})`;
      } else if (dep === 'deployed_ios') {
        tag.classList.toggle('active', currentDeployFilter === 'deployed_ios');
        tag.innerHTML = `${getOsLogoSvg('ios', 13, 'margin-right:4px;')} iOS 배포 (${deployedIosCount})`;
      } else if (dep === 'deployed_both') {
        tag.classList.toggle('active', currentDeployFilter === 'deployed_both');
        tag.innerHTML = `${getOsLogoSvg('android', 11, 'margin-right:2px;')}${getOsLogoSvg('ios', 11, 'margin-right:4px;')} 양대 배포 (${deployedBothCount})`;
      } else if (dep === 'pending') {
        tag.classList.toggle('active', currentDeployFilter === 'pending');
        tag.textContent = `${t('filterNotDeployed')} (${pendingCount})`;
      }
    });

    const elStatAos = document.getElementById('statDeployedAos');
    if (elStatAos) {
      elStatAos.textContent = `${deployedAosCount}/${targetAosIssues.length}`;
    }
    const elStatIos = document.getElementById('statDeployedIos');
    if (elStatIos) {
      elStatIos.textContent = `${deployedIosCount}/${targetIosIssues.length}`;
    }

    const inputAos = document.getElementById('targetReleaseAosInput');
    if (inputAos && inputAos.value !== getTargetRelease('android')) {
      inputAos.value = getTargetRelease('android');
    }
    const inputIos = document.getElementById('targetReleaseIosInput');
    if (inputIos && inputIos.value !== getTargetRelease('ios')) {
      inputIos.value = getTargetRelease('ios');
    }
  }

  function toggleDetailFilters(force) {
    const drawer = document.getElementById('detailFiltersDrawer');
    const btn = document.getElementById('btnToggleDetailFilters');
    if (!drawer || !btn) return;
    isDetailFilterOpen = (typeof force === 'boolean') ? force : !isDetailFilterOpen;
    drawer.classList.toggle('open', isDetailFilterOpen);
    btn.classList.toggle('active', isDetailFilterOpen);
    try {
      localStorage.setItem(STORAGE_KEY_DETAIL_FILTER_OPEN, isDetailFilterOpen ? 'true' : 'false');
    } catch {}
    updateDetailFilterActiveBadge();
  }

  function updateDetailFilterActiveBadge() {
    const badge = document.getElementById('detailFilterActiveBadge');
    if (!badge) return;
    let activeCount = 0;
    if (currentDate !== 'all') activeCount++;
    if (currentSeverity !== 'all') activeCount++;
    if (currentCategory !== 'all') activeCount++;

    if (activeCount > 0) {
      badge.textContent = String(activeCount);
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  }

  function resetAllFilters() {
    currentDate = 'all';
    currentPlatform = 'all';
    currentCategory = 'all';
    currentStatus = 'all';
    currentSeverity = 'all';
    currentDeployFilter = 'all';
    searchQuery = '';

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';

    const dateSelect = document.getElementById('dateFilterSelect');
    if (dateSelect) dateSelect.value = 'all';

    updateStatusBadges();
    updatePlatformBadges();
    updateCategoryBadges();
    updateSeverityBadges();
    updateDeployBadges();
    updateDetailFilterActiveBadge();
    renderTable();
    showToast('↺ 모든 검색 및 필터가 초기화되었습니다.');
  }

  function getFilteredIssues() {
    const q = searchQuery.toLowerCase().trim();
    const highlights = getHighlights();

    return activeIssues.filter(item => {
      const matchDate = currentDate === 'all' || item.date === currentDate;
      const normCat = normalizeCategory(item.category);
      const matchCat = currentCategory === 'all' || item.category === currentCategory || normCat === currentCategory;
      const isPinned = isHighlighted(item);

      const plat = (item.platform || 'all').toLowerCase();
      let matchPlat = true;
      if (currentPlatform === 'ios') matchPlat = plat === 'ios';
      else if (currentPlatform === 'android') matchPlat = plat === 'android';
      else if (currentPlatform === 'all_common') matchPlat = plat === 'all' || plat === 'common';

      let matchStatus = true;
      if (currentStatus === 'resolved') matchStatus = item.status === 'resolved';
      else if (currentStatus === 'pending') matchStatus = item.status !== 'resolved';
      else if (currentStatus === 'highlighted') matchStatus = isPinned;
      else if (currentStatus === 'voc') {
        matchStatus = Boolean(
          item.vocRef ||
          (item.problem && item.problem.includes('FB-')) ||
          (item.title && item.title.includes('FB-')) ||
          (item.cause && item.cause.includes('FB-')) ||
          (item.solution && item.solution.includes('FB-'))
        );
      }

      let matchDeploy = true;
      if (currentDeployFilter !== 'all') {
        if (currentTrackId === 'all' && (item.phase === 'phase1' || item.phase === 'phase2')) {
          matchDeploy = (currentDeployFilter === 'deployed' || currentDeployFilter === 'deployed_both');
        } else {
          if (currentDeployFilter === 'deployed_aos') {
            matchDeploy = isPlatformApplicable(item, 'android') && isItemDeployed(item, 'android');
          } else if (currentDeployFilter === 'deployed_ios') {
            matchDeploy = isPlatformApplicable(item, 'ios') && isItemDeployed(item, 'ios');
          } else if (currentDeployFilter === 'deployed_both') {
            matchDeploy = isPlatformApplicable(item, 'android') && isPlatformApplicable(item, 'ios') && isItemDeployed(item, 'android') && isItemDeployed(item, 'ios');
          } else if (currentDeployFilter === 'deployed') {
            matchDeploy = (isPlatformApplicable(item, 'android') && isItemDeployed(item, 'android')) || (isPlatformApplicable(item, 'ios') && isItemDeployed(item, 'ios'));
          } else if (currentDeployFilter === 'pending') {
            const aosApp = isPlatformApplicable(item, 'android');
            const iosApp = isPlatformApplicable(item, 'ios');
            const isAos = isItemDeployed(item, 'android');
            const isIos = isItemDeployed(item, 'ios');
            if (aosApp && iosApp) matchDeploy = !isAos && !isIos;
            else if (aosApp) matchDeploy = !isAos;
            else if (iosApp) matchDeploy = !isIos;
            else matchDeploy = false;
          }
        }
      }

      const itemSev = item.severity || 'S3';
      const matchSev = currentSeverity === 'all' || itemSev === currentSeverity;

      let matchQuery = true;
      if (q) {
        const text = [
          `#${item.id}`,
          item.id.toString(),
          item.date,
          item.severity || '',
          item.severityLabel || '',
          item.platform || 'all',
          item.categoryLabel,
          item.title,
          item.problem,
          item.solution,
          (item.files || []).join(' '),
          item.cause || '',
          (item.actions || []).join(' ')
        ].join(' ').toLowerCase();
        matchQuery = text.includes(q);
      }

      return matchDate && matchPlat && matchCat && matchStatus && matchDeploy && matchSev && matchQuery;
    });
  }


  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function compareIds(idA, idB, asc) {
    const rawA = String(idA ?? '').trim();
    const rawB = String(idB ?? '').trim();
    const numPartA = rawA.replace(/^[^\d]*/, '');
    const numPartB = rawB.replace(/^[^\d]*/, '');
    const numA = Number(numPartA);
    const numB = Number(numPartB);
    const hasNumA = numPartA !== '' && !isNaN(numA);
    const hasNumB = numPartB !== '' && !isNaN(numB);

    if (hasNumA && hasNumB && numA !== numB) {
      return asc ? numA - numB : numB - numA;
    }
    const cmp = rawA.localeCompare(rawB, undefined, { numeric: true, sensitivity: 'base' });
    return asc ? cmp : -cmp;
  }

  function getSortIndicator(colKey) {
    if (sortColumn === colKey) {
      return sortAsc ? ' ▲' : ' ▼';
    }
    return ' ↕';
  }

  const CHUNK_SIZE = 50;
  let currentlyRenderedCount = 0;
  let currentFilteredItems = [];
  let chunkObserver = null;

  function renderRowHtml(item, isFeedback, highlights) {
    const itemKey = getItemKey(item);
    const isPinned = isHighlighted(item);
    const isSelected = currentSelectedKey === itemKey || (!currentSelectedKey && currentSelectedId === item.id);
    const paddedId = String(item.id).startsWith('FB-') ? String(item.id) : String(item.id).padStart(2, '0');

    if (isFeedback) {
      let stars = '';
      const r = item.rating || 5;
      for (let i = 0; i < r; i++) stars += '⭐';
      
      const catMap = {
        feature: '💡 기능 제안',
        bug: '🐛 버그 제보',
        ux: '🎨 사용성 개선',
        other: '💬 응원·기타'
      };
      const catLabel = catMap[item.category] || item.category || '기타';
      const titleSafe = escapeHtml(item.title || '');
      const contentSafe = escapeHtml(item.content || '');
      const showBoth = titleSafe && contentSafe && titleSafe !== contentSafe;
      const deviceSafe = escapeHtml(item.device || '-');
      const votes = item.upvotes || 1;

      return `
        <tr class="main-row ${isPinned ? 'highlighted' : ''} ${isSelected ? 'selected-row' : ''}" data-key="${itemKey}" data-id="${item.id}" onclick="window.MODO_QA.toggleDetail('${itemKey}', this)">
          <td>
            <span class="id-tag" title="${t('clickToPin')}" onclick="window.MODO_QA.toggleHighlight('${itemKey}', event)">#${paddedId}</span>
          </td>
          <td><span style="font-size: 11px; font-weight: 700; color: #F59E0B; white-space: nowrap;">${stars} (${r})</span></td>
          <td><span class="cat-tag cat-${item.category === 'bug' ? 'reliability' : (item.category === 'ux' ? 'ui' : 'core')}">${catLabel}</span></td>
          <td><span class="date-tag">${item.date || '-'}</span></td>
          <td><span style="font-size: 11.5px; color: var(--text-secondary);">${deviceSafe}</span></td>
          <td>
            ${showBoth ? `
              <div style="font-weight: 700; font-size: 12.5px; color: var(--text-primary); margin-bottom: 2px;">${titleSafe}</div>
              <div style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.4;">${contentSafe}</div>
            ` : `
              <div style="font-size: 12.5px; color: var(--text-primary); line-height: 1.45;">${contentSafe || titleSafe}</div>
            `}
          </td>
          <td style="text-align: center;"><span style="font-size: 11px; font-weight: 700; background: var(--bg-subtle); border: 1px solid var(--border); padding: 2px 7px; border-radius: 999px;">+${votes}</span></td>
          <td style="text-align: center;">
            <span class="status-tag status-${item.status === 'to_qa' ? 'pending' : (item.status === 'shipped' ? 'resolved' : 'pending')}">
              ${item.status === 'to_qa' ? '🛠️ QA승격' : (item.status === 'planned' ? '🚀 반영예정' : (item.status === 'shipped' ? '✅ 완료' : '📥 접수'))}
            </span>
          </td>
        </tr>
      `;
    }

    const sevCode = item.severity || 'S3';
    const sevLabel = item.severityLabel || SEV_LABELS[sevCode] || sevCode;
    const sevBadgeHtml = `<span class="sev-badge sev-${sevCode}">${escapeHtml(sevLabel)}</span>`;

    const plat = (item.platform || 'all').toLowerCase();
    let platTagHtml = '';
    if (plat === 'ios') {
      platTagHtml = `<span class="plat-tag plat-ios">${t('platformIos')}</span>`;
    } else if (plat === 'android') {
      platTagHtml = `<span class="plat-tag plat-android">${t('platformAndroid')}</span>`;
    } else {
      platTagHtml = `<span class="plat-tag plat-all">${t('platformCommon')}</span>`;
    }

    const fileCount = (item.files || []).length;
    let filesCellHtml = '';
    if (fileCount === 0) {
      filesCellHtml = `<td style="text-align: center; color: var(--text-muted); font-size: 11px;">-</td>`;
    } else {
      const fileListPreview = item.files.map(f => `• ${f}`).join('\n');
      filesCellHtml = `
        <td style="text-align: center;" onclick="event.stopPropagation()">
          <button type="button" class="qa-files-badge-btn" 
            title="${escapeHtml(fileListPreview)}" 
            onclick="window.MODO_QA.showFilesPopover('${itemKey}', this, event)">
            <span class="files-icon">📂</span>
            <span class="files-count">${fileCount}</span>
          </button>
        </td>
      `;
    }
    const titleSafe = escapeHtml(item.title);
    const problemSafe = escapeHtml(item.problem);
    const solutionSafe = escapeHtml(item.solution);
    const normCat = normalizeCategory(item.category);
    const catLabelSafe = escapeHtml(item.categoryLabel || item.category);

    if (item._vocRef === undefined) {
      item._vocRef = item.vocRef || 
        (item.problem && (item.problem.match(/FB-[A-Za-z0-9_-]+/i) || [])[0]) || 
        (item.title && (item.title.match(/FB-[A-Za-z0-9_-]+/i) || [])[0]) ||
        (item.cause && (item.cause.match(/FB-[A-Za-z0-9_-]+/i) || [])[0]) ||
        (item.solution && (item.solution.match(/FB-[A-Za-z0-9_-]+/i) || [])[0]) || null;
    }
    const vocRefMatch = item._vocRef;
    const vocBadgeHtml = vocRefMatch 
      ? `<a href="voc_dashboard.html?id=${encodeURIComponent(vocRefMatch)}" class="voc-ref-badge" onclick="event.stopPropagation()" title="Open in VOC Studio">💬 ${escapeHtml(vocRefMatch)} ↗</a>` 
      : '';

    // 1 & 2. Android & iOS Deploy Cells (Context-aware: Hidden in pre-release, Base in all, Interactive in phase3)
    const isPreRelease = (currentTrackId === 'phase1' || currentTrackId === 'phase2' || isFeedback);
    let deployCellAosHtml = '';
    let deployCellIosHtml = '';

    if (!isPreRelease) {
      if (currentTrackId === 'all' && (item.phase === 'phase1' || item.phase === 'phase2')) {
        deployCellAosHtml = `
          <td style="text-align: center; width: 84px;" onclick="event.stopPropagation()">
            <div class="qa-deploy-cell" title="출시 전 사전 검증 완료 (v1.0.0 Base 탑재)">
              <span class="qa-deploy-tag deployed" style="font-size:10px; padding:2px 6px;">✓ Base</span>
            </div>
          </td>
        `;
        deployCellIosHtml = `
          <td style="text-align: center; width: 84px;" onclick="event.stopPropagation()">
            <div class="qa-deploy-cell" title="출시 전 사전 검증 완료 (v1.0.0 Base 탑재)">
              <span class="qa-deploy-tag deployed" style="font-size:10px; padding:2px 6px;">✓ Base</span>
            </div>
          </td>
        `;
      } else {
        // 1. Android Deploy Cell
        const isPlatformIosOnly = !isPlatformApplicable(item, 'android');
        if (isPlatformIosOnly) {
          deployCellAosHtml = `
            <td style="text-align: center; width: 84px;" onclick="event.stopPropagation()">
              <div class="qa-deploy-cell" title="${t('deployNaTooltipIosOnly') || 'iOS 전용 항목 (AOS 배포 비해당)'}">
                <span class="qa-deploy-na">- (N/A)</span>
              </div>
            </td>
          `;
        } else {
          const isDeployedAos = isItemDeployed(item, 'android');
          const deployVerAos = getDeployVersion(item, 'android');
          const cleanVerAos = String(deployVerAos || '').replace(/^🚀\s*/, '').trim();
          const deployTimeAos = getDeployTimestamp(item, 'android');
          const tooltipAos = isDeployedAos
            ? (cleanVerAos ? `AOS 배포: ${cleanVerAos} (${deployTimeAos || '최근'}) - 클릭하여 미배포 전환` : 'AOS 배포 완료 - 클릭하여 미배포 전환')
            : '⏳ AOS 미배포 (클릭하여 배포 완료 전환)';
          const verBadgeAos = (isDeployedAos && cleanVerAos)
            ? `<span class="qa-deploy-ver-tag ver-aos" onclick="window.MODO_QA.openEditDeployVersionModal('${itemKey}', 'android', event)" title="${t('tooltipClickToEditRelease') || '클릭하여 AOS 배포 릴리즈 버전 수정'}">${getOsLogoSvg('android', 12, 'margin-right:3px;')} ${escapeHtml(cleanVerAos)}</span>`
            : '';
          deployCellAosHtml = `
            <td style="text-align: center; width: 84px;" onclick="event.stopPropagation()">
              <div class="qa-deploy-cell">
                <label class="qa-deploy-switch" title="${escapeHtml(tooltipAos)}">
                  <input type="checkbox" ${isDeployedAos ? 'checked' : ''} onchange="window.MODO_QA.toggleDeploy('${itemKey}', 'android', this.checked, event)">
                  <span class="qa-deploy-slider slider-aos"></span>
                </label>
                ${verBadgeAos}
              </div>
            </td>
          `;
        }

        // 2. iOS Deploy Cell
        const isPlatformAndroidOnly = !isPlatformApplicable(item, 'ios');
        if (isPlatformAndroidOnly) {
          deployCellIosHtml = `
            <td style="text-align: center; width: 84px;" onclick="event.stopPropagation()">
              <div class="qa-deploy-cell" title="${t('deployNaTooltipAosOnly') || 'Android 전용 항목 (iOS 배포 비해당)'}">
                <span class="qa-deploy-na">- (N/A)</span>
              </div>
            </td>
          `;
        } else {
          const isDeployedIos = isItemDeployed(item, 'ios');
          const deployVerIos = getDeployVersion(item, 'ios');
          const cleanVerIos = String(deployVerIos || '').replace(/^🚀\s*/, '').trim();
          const deployTimeIos = getDeployTimestamp(item, 'ios');
          const tooltipIos = isDeployedIos
            ? (cleanVerIos ? `iOS 배포: ${cleanVerIos} (${deployTimeIos || '최근'}) - 클릭하여 미배포 전환` : 'iOS 배포 완료 - 클릭하여 미배포 전환')
            : '⏳ iOS 미배포 (클릭하여 배포 완료 전환)';
          const verBadgeIos = (isDeployedIos && cleanVerIos)
            ? `<span class="qa-deploy-ver-tag ver-ios" onclick="window.MODO_QA.openEditDeployVersionModal('${itemKey}', 'ios', event)" title="${t('tooltipClickToEditRelease') || '클릭하여 iOS 배포 릴리즈 버전 수정'}">${getOsLogoSvg('ios', 12, 'margin-right:3px;')} ${escapeHtml(cleanVerIos)}</span>`
            : '';
          deployCellIosHtml = `
            <td style="text-align: center; width: 84px;" onclick="event.stopPropagation()">
              <div class="qa-deploy-cell">
                <label class="qa-deploy-switch" title="${escapeHtml(tooltipIos)}">
                  <input type="checkbox" ${isDeployedIos ? 'checked' : ''} onchange="window.MODO_QA.toggleDeploy('${itemKey}', 'ios', this.checked, event)">
                  <span class="qa-deploy-slider slider-ios"></span>
                </label>
                ${verBadgeIos}
              </div>
            </td>
          `;
        }
      }
    }

    const phaseTagHtml = (currentTrackId === 'all' && item.phase)
      ? ` <span class="phase-mini-tag" style="font-size:9.5px; opacity:0.8; font-weight:800; text-transform:uppercase; background:var(--bg-subtle); border:1px solid var(--border); padding:1px 4px; border-radius:3px; margin-left:3px;" title="${item.phase}">${item.phase === 'phase1' ? 'P1' : (item.phase === 'phase2' ? 'P2' : (item.phase === 'phase3' ? 'P3' : (item.phase === 'phase4' ? 'P4' : item.phase)))}</span>`
      : '';

    return `
      <tr class="main-row ${isPinned ? 'highlighted' : ''} ${isSelected ? 'selected-row' : ''}" data-key="${itemKey}" data-id="${item.id}" onclick="window.MODO_QA.toggleDetail('${itemKey}', this)">
        ${deployCellAosHtml}
        ${deployCellIosHtml}
        <td>
          <span class="id-tag" title="${t('clickToPin')}" onclick="window.MODO_QA.toggleHighlight('${itemKey}', event)">#${paddedId}${phaseTagHtml}</span>
        </td>
        <td>${sevBadgeHtml}</td>
        <td><span class="date-tag">${item.date}</span></td>
        <td>${platTagHtml}</td>
        <td><span class="cat-tag cat-${normCat}">${catLabelSafe}</span></td>
        <td><div class="issue-name title-clamp" title="${titleSafe}">${titleSafe} ${vocBadgeHtml}</div></td>
        <td><div class="cell-clamp">${problemSafe}</div></td>
        <td><div class="cell-clamp">${solutionSafe}</div></td>
        ${filesCellHtml}
        <td style="text-align: center;">
          <span class="status-tag status-${item.status}">
            ${item.status === 'resolved' ? t('badgeResolved') : t('badgePending')}
          </span>
        </td>
      </tr>
    `;

  }

  function renderNextChunk() {
    const tbody = document.getElementById('qaTableBody');
    if (!tbody) return;

    if (currentlyRenderedCount >= currentFilteredItems.length) {
      removeSentinel();
      updateCountLabel();
      return;
    }

    const nextBatch = currentFilteredItems.slice(currentlyRenderedCount, currentlyRenderedCount + CHUNK_SIZE);
    const highlights = getHighlights();
    const isFeedback = currentTrackId === 'feedback';

    const chunkHtml = nextBatch.map(item => renderRowHtml(item, isFeedback, highlights)).join('');
    tbody.insertAdjacentHTML('beforeend', chunkHtml);
    currentlyRenderedCount += nextBatch.length;

    updateCountLabel();

    if (currentlyRenderedCount < currentFilteredItems.length) {
      setupSentinel();
    } else {
      removeSentinel();
    }
  }

  function updateCountLabel() {
    const countLabel = document.getElementById('tableCountLabel');
    if (!countLabel) return;
    const totalFiltered = currentFilteredItems.length;
    const baseText = t('tableCount', { filtered: totalFiltered, total: activeIssues.length });
    if (currentlyRenderedCount < totalFiltered) {
      countLabel.textContent = `${baseText} (${currentlyRenderedCount}/${totalFiltered})`;
    } else {
      countLabel.textContent = baseText;
    }
  }

  function setupSentinel() {
    let sentinel = document.getElementById('qaChunkSentinel');
    if (!sentinel) {
      sentinel = document.createElement('div');
      sentinel.id = 'qaChunkSentinel';
      sentinel.style.cssText = 'padding: 14px 20px; text-align: center; font-size: 12px; font-weight: 600; color: var(--text-muted); cursor: pointer; user-select: none;';
      const wrapper = document.querySelector('.sheet-wrapper') || document.getElementById('qaTable')?.parentElement;
      if (wrapper) {
        wrapper.appendChild(sentinel);
      }
      sentinel.addEventListener('click', () => {
        renderNextChunk();
      });
    }

    const totalFiltered = currentFilteredItems.length;
    sentinel.textContent = `⏳ 더 많은 항목 불러오는 중... (${currentlyRenderedCount} / ${totalFiltered}건)`;
    sentinel.style.display = currentlyRenderedCount < totalFiltered ? 'block' : 'none';

    if (!chunkObserver && 'IntersectionObserver' in window) {
      chunkObserver = new IntersectionObserver((entries) => {
        if (entries[0] && entries[0].isIntersecting) {
          renderNextChunk();
        }
      }, {
        root: null,
        rootMargin: '300px',
        threshold: 0
      });
    }

    if (chunkObserver && sentinel) {
      chunkObserver.unobserve(sentinel);
      chunkObserver.observe(sentinel);
    }
  }

  function removeSentinel() {
    const sentinel = document.getElementById('qaChunkSentinel');
    if (sentinel) {
      if (chunkObserver) chunkObserver.unobserve(sentinel);
      sentinel.style.display = 'none';
    }
  }

  function renderTable() {
    const tbody = document.getElementById('qaTableBody');
    const noMatchBox = document.getElementById('noMatchBox');
    if (!tbody) return;

    let filtered = getFilteredIssues();

    // Sort if needed
    if (sortColumn !== null) {
      filtered = [...filtered].sort((a, b) => {
        let valA = a[sortColumn] ?? '';
        let valB = b[sortColumn] ?? '';

        if (sortColumn === 'deployed_android') {
          const depA = !isPlatformApplicable(a, 'android') ? -1 : (isItemDeployed(a, 'android') ? 1 : 0);
          const depB = !isPlatformApplicable(b, 'android') ? -1 : (isItemDeployed(b, 'android') ? 1 : 0);
          if (depA !== depB) return sortAsc ? depA - depB : depB - depA;
          return compareIds(a.id, b.id, sortAsc);
        }

        if (sortColumn === 'deployed_ios') {
          const depA = !isPlatformApplicable(a, 'ios') ? -1 : (isItemDeployed(a, 'ios') ? 1 : 0);
          const depB = !isPlatformApplicable(b, 'ios') ? -1 : (isItemDeployed(b, 'ios') ? 1 : 0);
          if (depA !== depB) return sortAsc ? depA - depB : depB - depA;
          return compareIds(a.id, b.id, sortAsc);
        }

        if (sortColumn === 'deployed') {
          const depA = (isItemDeployed(a, 'android') || isItemDeployed(a, 'ios')) ? 1 : 0;
          const depB = (isItemDeployed(b, 'android') || isItemDeployed(b, 'ios')) ? 1 : 0;
          if (depA !== depB) return sortAsc ? depA - depB : depB - depA;
          return compareIds(a.id, b.id, sortAsc);
        }

        if (sortColumn === 'id') {
          if (currentTrackId === 'all') {
            const pOrder = { phase1: 1, phase2: 2, phase3: 3, feedback: 4 };
            const pA = pOrder[a.phase] || 1;
            const pB = pOrder[b.phase] || 1;
            if (pA !== pB) {
              return sortAsc ? pA - pB : pB - pA;
            }
          }
          return compareIds(a.id, b.id, sortAsc);
        }

        if (sortColumn === 'date') {
          const cmp = String(valA).localeCompare(String(valB));
          if (cmp !== 0) return sortAsc ? cmp : -cmp;
          return compareIds(a.id, b.id, sortAsc);
        }

        if (sortColumn === 'severity') {
          const rank = { 'S1': 1, 'S2': 2, 'S3': 3, 'S4': 4, 'S5': 5 };
          const rA = rank[a.severity] || 3;
          const rB = rank[b.severity] || 3;
          if (rA !== rB) return sortAsc ? (rA - rB) : (rB - rA);
          return compareIds(a.id, b.id, sortAsc);
        }

        if (sortColumn === 'platform') {
          const pA = String(valA || 'all');
          const pB = String(valB || 'all');
          const cmp = pA.localeCompare(pB);
          if (cmp !== 0) return sortAsc ? cmp : -cmp;
          return compareIds(a.id, b.id, sortAsc);
        }

        if (sortColumn === 'rating' || sortColumn === 'upvotes') {
          const nA = Number(valA) || 0;
          const nB = Number(valB) || 0;
          if (nA !== nB) return sortAsc ? nA - nB : nB - nA;
          return compareIds(a.id, b.id, sortAsc);
        }

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }

        const cmp = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
        if (cmp !== 0) return sortAsc ? cmp : -cmp;
        return compareIds(a.id, b.id, sortAsc);
      });
    }

    currentFilteredItems = filtered;
    currentlyRenderedCount = 0;

    if (noMatchBox) {
      noMatchBox.style.display = filtered.length === 0 ? 'block' : 'none';
      noMatchBox.textContent = t('noMatch');
    }

    // Verify currently inspected issue is still present in filtered list
    if (currentSelectedKey || currentSelectedId) {
      const stillVisible = filtered.some(i => getItemKey(i) === currentSelectedKey || i.id === currentSelectedId);
      if (!stillVisible) {
        closeInspector();
      }
    }

    const thead = document.querySelector('#qaTable thead');
    const isFeedback = currentTrackId === 'feedback';

    if (thead) {
      if (isFeedback) {
        thead.innerHTML = `
          <tr>
            <th style="width: 130px; cursor: pointer;" onclick="window.MODO_QA.sortTable('id')">ID${getSortIndicator('id')}</th>
            <th style="width: 105px; cursor: pointer;" onclick="window.MODO_QA.sortTable('rating')">${(t('thRating') || '별점 (Rating) ↕').replace(/↕|▲|▼/g, '').trim()}${getSortIndicator('rating')}</th>
            <th style="width: 115px; cursor: pointer;" onclick="window.MODO_QA.sortTable('category')">${(t('thCategory') || '유형 (Category) ↕').replace(/↕|▲|▼/g, '').trim()}${getSortIndicator('category')}</th>
            <th style="width: 95px; cursor: pointer;" onclick="window.MODO_QA.sortTable('date')">${(t('thDate') || '등록일 ↕').replace(/↕|▲|▼/g, '').trim()}${getSortIndicator('date')}</th>
            <th style="width: 185px; cursor: pointer;" onclick="window.MODO_QA.sortTable('device')">${(t('thDevice') || '기기 / OS 환경 ↕').replace(/↕|▲|▼/g, '').trim()}${getSortIndicator('device')}</th>
            <th style="width: 40%; cursor: pointer;" onclick="window.MODO_QA.sortTable('title')">${(t('thFeedbackContent') || '피드백 & 의견 내용 ↕').replace(/↕|▲|▼/g, '').trim()}${getSortIndicator('title')}</th>
            <th style="width: 75px; text-align: center; cursor: pointer;" onclick="window.MODO_QA.sortTable('upvotes')">${(t('thUpvotes') || '투표수 ↕').replace(/↕|▲|▼/g, '').trim()}${getSortIndicator('upvotes')}</th>
            <th style="width: 85px; text-align: center; cursor: pointer;" onclick="window.MODO_QA.sortTable('status')">${(t('thStatus') || '상태 ↕').replace(/↕|▲|▼/g, '').trim()}${getSortIndicator('status')}</th>
          </tr>
        `;
      } else {
        thead.innerHTML = `
          <tr>
            <th style="width: 84px; text-align: center; cursor: pointer;" onclick="window.MODO_QA.sortTable('deployed_android')">${getOsLogoSvg('android', 13, 'margin-right:3px;')} AOS 배포${getSortIndicator('deployed_android')}</th>
            <th style="width: 84px; text-align: center; cursor: pointer;" onclick="window.MODO_QA.sortTable('deployed_ios')">${getOsLogoSvg('ios', 13, 'margin-right:3px;')} iOS 배포${getSortIndicator('deployed_ios')}</th>
            <th style="width: 68px; cursor: pointer;" onclick="window.MODO_QA.sortTable('id')">${(t('thId') || 'ID ↕').replace(/↕|▲|▼/g, '').trim()}${getSortIndicator('id')}</th>
            <th style="width: 100px; cursor: pointer;" onclick="window.MODO_QA.sortTable('severity')">${(t('thSeverity') || 'Severity ↕').replace(/↕|▲|▼/g, '').trim()}${getSortIndicator('severity')}</th>
            <th style="width: 82px; cursor: pointer;" onclick="window.MODO_QA.sortTable('date')">${(t('thDate') || 'Date ↕').replace(/↕|▲|▼/g, '').trim()}${getSortIndicator('date')}</th>
            <th style="width: 80px; cursor: pointer;" onclick="window.MODO_QA.sortTable('platform')">${(t('thPlatform') || 'OS ↕').replace(/↕|▲|▼/g, '').trim()}${getSortIndicator('platform')}</th>
            <th style="width: 110px; cursor: pointer;" onclick="window.MODO_QA.sortTable('category')">${(t('thCategory') || 'Category ↕').replace(/↕|▲|▼/g, '').trim()}${getSortIndicator('category')}</th>
            <th style="width: 21%; cursor: pointer;" onclick="window.MODO_QA.sortTable('title')">${(t('thTitle') || 'Issue Summary ↕').replace(/↕|▲|▼/g, '').trim()}${getSortIndicator('title')}</th>
            <th style="width: 22%;">${t('thCause') || 'Root Cause Analysis'}</th>
            <th style="width: 24%;">${t('thSolution') || 'Resolution & Action Items'}</th>
            <th style="width: 56px; text-align: center;">${t('thFiles') || 'Files'}</th>
            <th style="width: 72px; text-align: center; cursor: pointer;" onclick="window.MODO_QA.sortTable('status')">${(t('thStatus') || 'Status ↕').replace(/↕|▲|▼/g, '').trim()}${getSortIndicator('status')}</th>
          </tr>
        `;
      }
    }

    tbody.innerHTML = '';
    renderNextChunk();
  }

  let currentSelectedId = null;
  let currentSelectedKey = null;
  const STORAGE_KEY_DRAWER_HEIGHT = 'modo_qa_drawer_height';
  const DEFAULT_DRAWER_HEIGHT = 310;
  const MIN_DRAWER_HEIGHT = 160;

  function getSavedDrawerHeight() {
    try {
      const saved = parseInt(localStorage.getItem(STORAGE_KEY_DRAWER_HEIGHT), 10);
      return (saved && saved >= MIN_DRAWER_HEIGHT) ? saved : DEFAULT_DRAWER_HEIGHT;
    } catch {
      return DEFAULT_DRAWER_HEIGHT;
    }
  }

  function applyDrawerHeight(heightPx) {
    const drawer = document.getElementById('qaInspectorDrawer');
    if (!drawer) return DEFAULT_DRAWER_HEIGHT;
    const maxHeight = Math.floor(window.innerHeight * 0.85);
    const clamped = Math.max(MIN_DRAWER_HEIGHT, Math.min(heightPx, maxHeight));
    drawer.style.height = `${clamped}px`;
    if (drawer.classList.contains('open')) {
      document.body.style.paddingBottom = `${clamped + 20}px`;
    }
    return clamped;
  }

  function initDrawerResize() {
    const resizer = document.getElementById('inspectorResizer');
    const drawer = document.getElementById('qaInspectorDrawer');
    if (!resizer || !drawer) return;

    let isDragging = false;
    let startY = 0;
    let startHeight = DEFAULT_DRAWER_HEIGHT;

    // Apply saved height initially
    applyDrawerHeight(getSavedDrawerHeight());

    resizer.addEventListener('pointerdown', e => {
      e.preventDefault();
      isDragging = true;
      startY = e.clientY;
      startHeight = drawer.getBoundingClientRect().height;
      resizer.classList.add('is-dragging');
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';

      const onPointerMove = moveEv => {
        if (!isDragging) return;
        const delta = startY - moveEv.clientY;
        const newH = applyDrawerHeight(startHeight + delta);
        try {
          localStorage.setItem(STORAGE_KEY_DRAWER_HEIGHT, String(newH));
        } catch {}
      };

      const onPointerUp = () => {
        isDragging = false;
        resizer.classList.remove('is-dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    });

    // Double-click toggle between standard height and expanded height
    resizer.addEventListener('dblclick', () => {
      const curH = drawer.getBoundingClientRect().height;
      const targetH = curH > 400 ? DEFAULT_DRAWER_HEIGHT : Math.floor(window.innerHeight * 0.65);
      const applied = applyDrawerHeight(targetH);
      try {
        localStorage.setItem(STORAGE_KEY_DRAWER_HEIGHT, String(applied));
      } catch {}
    });
  }

  function closeInspector() {
    currentSelectedId = null;
    currentSelectedKey = null;
    const drawer = document.getElementById('qaInspectorDrawer');
    if (drawer) drawer.classList.remove('open');
    document.body.classList.remove('inspector-active');
    document.body.style.paddingBottom = '';
    document.querySelectorAll('.main-row.selected-row').forEach(r => r.classList.remove('selected-row'));
  }

  function openInspector(targetKey, rowEl) {
    const item = activeIssues.find(i => {
      const k = getItemKey(i);
      return k === String(targetKey) || String(i.id) === String(targetKey) || i.id === Number(targetKey);
    });
    if (!item) return;

    currentSelectedId = item.id;
    currentSelectedKey = getItemKey(item);
    const drawer = document.getElementById('qaInspectorDrawer');
    if (!drawer) return;

    // Highlight row
    document.querySelectorAll('.main-row.selected-row').forEach(r => r.classList.remove('selected-row'));
    if (rowEl) {
      rowEl.classList.add('selected-row');
    } else {
      const r = document.querySelector(`.main-row[data-key="${currentSelectedKey}"]`) || document.querySelector(`.main-row[data-id="${item.id}"]`);
      if (r) r.classList.add('selected-row');
    }

    const btnQa = document.getElementById('btnConvertToQa');
    if (btnQa) {
      btnQa.style.display = (currentTrackId === 'feedback' || String(item.id).startsWith('FB-')) ? 'inline-block' : 'none';
    }

    const paddedId = String(item.id).startsWith('FB-') ? String(item.id) : String(item.id).padStart(2, '0');
    const plat = (item.platform || (item.device ? (item.device.includes('iOS') ? 'ios' : (item.device.includes('Android') ? 'android' : 'all')) : 'all')).toLowerCase();
    let platTagHtml = '';
    if (plat === 'ios') {
      platTagHtml = `<span class="plat-tag plat-ios">${t('platformIos')}</span>`;
    } else if (plat === 'android') {
      platTagHtml = `<span class="plat-tag plat-android">${t('platformAndroid')}</span>`;
    } else {
      platTagHtml = `<span class="plat-tag plat-all">${t('platformCommon')}</span>`;
    }

    const platDetailLabel = plat === 'ios' ? t('platIosOnly') : (plat === 'android' ? t('platAndroidOnly') : t('platCommon'));
    const causeTitle = t('detailCauseTitle', { plat: platDetailLabel });
    const actionTitle = t('detailActionTitle');
    const causeText = escapeHtml(item.cause || t('detailCauseFallback'));
    const actionsHtml = (item.actions || []).map((a, idx) => {
      const cleanA = a.replace(/^\d+\.\s*/, '');
      const safeA = cleanA.replace(/<(?!\/?b>)/gi, '&lt;');
      return `<div>${idx + 1}. ${safeA}</div>`;
    }).join('');
    const fullFilesHtml = (item.files || []).map(f => `<span class="file-tag" style="padding: 2px 7px; font-size: 11px;">${escapeHtml(f)}</span>`).join(' ');
    const solutionSafe = escapeHtml(item.solution);

    // Populate drawer elements
    const elId = document.getElementById('inspectorId');
    const elSev = document.getElementById('inspectorSeverity');
    const elDate = document.getElementById('inspectorDate');
    const elPlat = document.getElementById('inspectorPlatform');
    const elCat = document.getElementById('inspectorCategory');
    const elStatus = document.getElementById('inspectorStatus');
    const elTitle = document.getElementById('inspectorTitle');
    const elCauseTitle = document.getElementById('inspectorCauseTitle');
    const elCauseText = document.getElementById('inspectorCauseText');
    const elFilesWrap = document.getElementById('inspectorFilesWrap');
    const elFilesTitle = document.getElementById('inspectorFilesTitle');
    const elActionTitle = document.getElementById('inspectorActionTitle');
    const elActionsText = document.getElementById('inspectorActionsText');

    if (elId) {
      const phaseBadge = item.phase ? ` [${item.phase === 'phase1' ? 'Phase 1' : (item.phase === 'phase2' ? 'Phase 2' : (item.phase === 'phase3' ? 'Phase 3' : item.phase))}]` : '';
      elId.textContent = `#${paddedId}${phaseBadge}`;
    }
    if (elSev) {
      const sCode = item.severity || 'S3';
      const sLabel = item.severityLabel || SEV_LABELS[sCode] || sCode;
      elSev.innerHTML = `<span class="sev-badge sev-${sCode}">${escapeHtml(sLabel)}</span>`;
    }
    if (elDate) elDate.textContent = item.date;
    if (elPlat) elPlat.innerHTML = platTagHtml;
    const inspectorNormCat = normalizeCategory(item.category);
    if (elCat) elCat.innerHTML = `<span class="cat-tag cat-${inspectorNormCat}">${escapeHtml(item.categoryLabel || item.category)}</span>`;
    if (elStatus) elStatus.innerHTML = `<span class="status-tag status-${item.status}">${item.status === 'resolved' ? t('badgeResolved') : t('badgePending')}</span>`;
    if (elTitle) {
      elTitle.textContent = item.title;
      elTitle.title = item.title;
    }

    const vocRefMatch = item.vocRef || 
      (item.problem && (item.problem.match(/FB-[A-Za-z0-9_-]+/i) || [])[0]) || 
      (item.title && (item.title.match(/FB-[A-Za-z0-9_-]+/i) || [])[0]) ||
      (item.cause && (item.cause.match(/FB-[A-Za-z0-9_-]+/i) || [])[0]) ||
      (item.solution && (item.solution.match(/FB-[A-Za-z0-9_-]+/i) || [])[0]);

    const btnVoc = document.getElementById('btnOpenInVocStudio');
    if (btnVoc) {
      if (vocRefMatch) {
        btnVoc.href = `voc_dashboard.html?id=${encodeURIComponent(vocRefMatch)}`;
        btnVoc.style.display = 'inline-flex';
      } else {
        btnVoc.style.display = 'none';
      }
    }

    // Dual Mode Inspector: QA Engineering vs Customer VOC Studio
    const isVoc = currentTrackId === 'feedback' || String(item.id).startsWith('FB-');
    const qaBody = document.getElementById('inspectorQaBody');
    const vocBody = document.getElementById('inspectorVocBody');

    if (isVoc && vocBody) {
      if (qaBody) qaBody.style.display = 'none';
      vocBody.style.display = 'flex';

      const elVocContent = document.getElementById('vocCustomerContent');
      if (elVocContent) elVocContent.textContent = item.content || item.title || '';

      const elTags = document.getElementById('vocDiagnosticsTags');
      if (elTags) {
        let stars = '';
        for (let i = 0; i < (item.rating || 5); i++) stars += '⭐';
        elTags.innerHTML = `
          <span style="font-size:11px; font-weight:700; color:#F59E0B; background:rgba(245,158,11,0.12); padding:2px 7px; border-radius:4px; border:1px solid rgba(245,158,11,0.25);">${stars} (${item.rating || 5}점)</span>
          <span style="font-size:11px; font-weight:600; color:var(--text-secondary); background:var(--bg-subtle); padding:2px 7px; border-radius:4px; border:1px solid var(--border);">📱 ${escapeHtml(item.device || item.os || 'universal')}</span>
          <span style="font-size:11px; font-weight:600; color:var(--accent-blue); background:rgba(34,139,230,0.1); padding:2px 7px; border-radius:4px; border:1px solid var(--border);">🏷️ v${escapeHtml(item.appVersion || '1.0.44')}</span>
          <span style="font-size:11px; font-weight:600; color:var(--text-secondary); background:var(--bg-subtle); padding:2px 7px; border-radius:4px; border:1px solid var(--border);">🌐 ${(item.language || 'ko').toUpperCase()}</span>
          <span style="font-size:11px; font-weight:700; color:var(--accent-purple); background:rgba(121,80,242,0.1); padding:2px 7px; border-radius:4px; border:1px solid var(--border);">${item.isPro ? '💎 PRO' : 'FREE'}</span>
        `;
      }

      const select = document.getElementById('vocInspectorTemplateSelect');
      if (select) {
        if ((item.rating || 5) === 5) {
          select.value = 'five_star_review';
          onVocTemplateSelect('five_star_review');
        } else if (item.category === 'bug') {
          select.value = 'bug_acknowledgement';
          onVocTemplateSelect('bug_acknowledgement');
        } else if (item.category === 'feature') {
          select.value = 'feature_planned';
          onVocTemplateSelect('feature_planned');
        } else {
          select.value = '';
          const replyText = document.getElementById('vocInspectorReplyText');
          if (replyText) replyText.value = '';
        }
      }
    } else {
      if (qaBody) qaBody.style.display = 'flex';
      if (vocBody) vocBody.style.display = 'none';

      if (elCauseTitle) elCauseTitle.textContent = causeTitle;
      if (elCauseText) elCauseText.innerHTML = causeText;
      if (elFilesTitle) elFilesTitle.textContent = `📂 ${t('thFiles') || 'Target Files'} (${(item.files || []).length})`;
      if (elFilesWrap) elFilesWrap.innerHTML = fullFilesHtml || '-';
      if (elActionTitle) elActionTitle.textContent = actionTitle;
      if (elActionsText) elActionsText.innerHTML = actionsHtml || solutionSafe;
    }

    drawer.classList.add('open');
    document.body.classList.add('inspector-active');
    applyDrawerHeight(getSavedDrawerHeight());
  }

  function toggleDetail(targetKey, rowEl) {
    if (String(currentSelectedKey) === String(targetKey) || (!currentSelectedKey && String(currentSelectedId) === String(targetKey))) {
      closeInspector();
    } else {
      openInspector(targetKey, rowEl);
    }
  }

  function convertCurrentFeedbackToQa() {
    if (!currentSelectedKey && !currentSelectedId) return;
    const item = activeIssues.find(i => getItemKey(i) === currentSelectedKey || i.id === currentSelectedId);
    if (!item) return;

    const allQaItems = [
      ...(window.MODO_QA_PHASE1 || []),
      ...(window.MODO_QA_PHASE2 || []),
      ...(window.MODO_QA_PHASE3 || [])
    ];
    const numIds = allQaItems
      .map(x => typeof x.id === 'number' ? x.id : parseInt(String(x.id).replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n) && n > 0);
    const nextId = numIds.length > 0 ? Math.max(...numIds) + 1 : 1;

    const dev = (item.device || '').toLowerCase();
    const platform = dev.includes('ios') ? 'ios' : (dev.includes('android') ? 'android' : 'all');
    const catCode = item.category === 'bug' ? 'cat-reliability' : (item.category === 'ux' ? 'cat-ui' : 'cat-core');
    const catLabel = item.category === 'bug' ? '오류' : (item.category === 'ux' ? '개선' : '기능');

    const snippet = `    {
      id: ${nextId},
      severity: "S3",
      severityLabel: "⚡ S3 Major",
      date: "${item.date || new Date().toISOString().split('T')[0]}",
      platform: "${platform}",
      category: "${catCode}",
      categoryLabel: "${catLabel}",
      title: "[유저 피드백] ${item.title}",
      problem: "${item.content || item.problem || ''}",
      solution: "유저 VOC 피드백 기반 분석 및 개선 패치 적용",
      files: [],
      status: "pending",
      cause: "기기 환경: ${item.device || '정보 없음'} (제보 ID: ${item.id})",
      actions: [
        "1. 피드백 재현 시나리오 검증",
        "2. 외과수술식 수정 및 3중 검증 (tsc/Jest/E2E)",
        "3. QA 이슈 상태 업데이트"
      ]
    }`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(snippet).then(() => {
        showToast(t('qaConvertedToast') || '✅ 클립보드에 QA 이슈 스니펫이 복사되었습니다.');
      }).catch(() => {
        showToast('⚠️ 클립보드 복사에 실패했습니다.');
      });
    } else {
      showToast('⚠️ 클립보드가 지원되지 않는 브라우저입니다.');
    }
  }

  const VOC_TEMPLATES = {
    five_star_review: (item) => {
      const isIos = (item.device || item.os || '').toLowerCase().includes('ios');
      const storeName = isIos ? '애플 앱스토어(App Store)' : '구글 플레이 스토어(Google Play)';
      const appCfg = window.QA_APP_CONFIG || {};
      const storeUrl = isIos 
        ? (appCfg.stores?.appStore || 'https://apps.apple.com/app/id6742358910')
        : (appCfg.stores?.playStore || 'https://play.google.com/store/apps/details?id=com.junpapapo.modo');
      return `안녕하세요, 모도(Modo) 개발팀입니다! 😊\n\n모도를 아껴주시고 별점 5점의 따뜻한 응원을 남겨주셔서 진심으로 감사드립니다.\n혹시 괜찮으시다면 ${storeName}에도 별점 5점과 함께 소중한 응원 리뷰를 남겨주실 수 있을까요? ⭐️\n👉 스토어 리뷰 남기기: ${storeUrl}\n\n항상 발전하는 모도가 되겠습니다. 감사합니다!`;
    },

    bug_acknowledgement: (item) => {
      const isIos = (item.device || item.os || '').toLowerCase().includes('ios');
      const platformName = isIos ? 'iOS' : ((item.device || item.os || '').toLowerCase().includes('android') ? 'Android' : (item.device || item.os || '기기 환경'));
      return `안녕하세요, 모도(Modo) 개발팀입니다.\n\n남겨주신 소중한 버그 제보에 감사드립니다. 제보해 주신 현상(${platformName}, v${item.appVersion || '1.0.44'})을 확인하였으며, 다음 마이너 패치에서 신속히 조치하겠습니다. 이용에 불편을 드려 죄송합니다!`;
    },

    feature_planned: (item) => 
      `안녕하세요, 모도(Modo) 개발팀입니다!\n\n제안해 주신 소중한 아이디어를 검토하였으며, 모도의 사용성을 높여줄 좋은 제안으로 판단되어 차기 기능 로드맵에 공식 반영하기로 결정했습니다. 🚀\n\n좋은 의견 주셔서 감사드리며 멋지게 개발하겠습니다!`,

    update_shipped: (item) => {
      const isIos = (item.device || item.os || '').toLowerCase().includes('ios');
      const storeName = isIos ? '앱스토어' : '구글 플레이 스토어';
      return `안녕하세요, 모도(Modo) 개발팀입니다.\n\n기다려 주셔서 감사합니다! 고객님께서 제안해 주신 사항(또는 제보 버그)이 최신 v${item.appVersion || '1.0.44'} 버전 업데이트에 정식 반영되었습니다. 🎉\n${storeName}에서 최신 버전으로 업데이트하여 확인해 보세요!`;
    },

    need_info: (item) => 
      `안녕하세요, 모도(Modo) 개발팀입니다.\n\n문제를 해결하기 위해 추가적인 정보가 필요합니다. 혹시 해당 현상이 발생할 때의 순서나 스크린샷을 junworkspace.official@gmail.com 으로 회신해 주실 수 있을까요? 빠르게 확인하여 개선하겠습니다!`
  };

  function onVocTemplateSelect(templateKey) {
    if (!currentSelectedKey && !currentSelectedId) return;
    const item = activeIssues.find(i => getItemKey(i) === currentSelectedKey || i.id === currentSelectedId);
    if (!item || !VOC_TEMPLATES[templateKey]) return;
    const generated = VOC_TEMPLATES[templateKey](item);
    const replyEl = document.getElementById('vocInspectorReplyText');
    if (replyEl) replyEl.value = generated;
  }

  function showToast(msg) {
    let t = document.getElementById('qaEngineToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'qaEngineToast';
      t.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.85); color:#fff; padding:8px 18px; border-radius:999px; font-size:12px; font-weight:700; z-index:9999; backdrop-filter:blur(8px); box-shadow:0 4px 16px rgba(0,0,0,0.3); transition:opacity 0.2s ease;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.display = 'block';
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => {
      t.style.opacity = '0';
      setTimeout(() => { t.style.display = 'none'; }, 200);
    }, 2200);
  }

  function copyVocCustomerQuote() {
    const quoteEl = document.getElementById('vocCustomerContent');
    if (!quoteEl || !quoteEl.textContent || quoteEl.textContent === '-') {
      showToast('⚠️ 복사할 유저 원문 내용이 없습니다.');
      return;
    }
    const text = quoteEl.textContent.trim();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('📋 유저 원문이 클립보드에 복사되었습니다!');
      }).catch(() => {
        showToast('❌ 클립보드 복사 실패');
      });
    }
  }

  function openGoogleSheet() {
    const p = document.getElementById('settingsPopover');
    if (p) p.classList.remove('open');
    const url = localStorage.getItem('modo_qa_google_spreadsheet_url') || 'https://docs.google.com/spreadsheets/';
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function copyVocReply() {
    const replyEl = document.getElementById('vocInspectorReplyText');
    if (!replyEl || !replyEl.value.trim()) {
      showToast('⚠️ 답변 내용을 먼저 선택하거나 작성해주세요.');
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(replyEl.value).then(() => {
        showToast('📋 고객 응대 답변이 클립보드에 복사되었습니다!');
      }).catch(() => {
        showToast('❌ 클립보드 복사 실패');
      });
    }
  }

  function navigateInspector(direction) {
    if (!currentSelectedKey && !currentSelectedId) return;
    const filtered = currentFilteredItems.length ? currentFilteredItems : getFilteredIssues();
    const curIdx = filtered.findIndex(i => getItemKey(i) === currentSelectedKey || i.id === currentSelectedId);
    if (curIdx < 0) return;
    const nextIdx = curIdx + direction;
    if (nextIdx >= 0 && nextIdx < filtered.length) {
      while (nextIdx >= currentlyRenderedCount && currentlyRenderedCount < filtered.length) {
        renderNextChunk();
      }
      const nextItem = filtered[nextIdx];
      const nextKey = getItemKey(nextItem);
      openInspector(nextKey);
      const targetRow = document.querySelector(`.main-row[data-key="${nextKey}"]`) || document.querySelector(`.main-row[data-id="${nextItem.id}"]`);
      if (targetRow) {
        targetRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }

  function sortTable(colKey) {
    if (sortColumn === colKey) {
      sortAsc = !sortAsc;
    } else {
      sortColumn = colKey;
      // For date, id, rating, upvotes, deployed, start with descending (latest / highest first) by default
      sortAsc = (colKey === 'date' || colKey === 'id' || colKey === 'rating' || colKey === 'upvotes' || colKey === 'deployed' || colKey === 'deployed_android' || colKey === 'deployed_ios') ? false : true;
    }
    renderTable();
  }

  // Filter Bindings
  function bindEvents() {
    const dateSelect = document.getElementById('dateFilterSelect');
    if (dateSelect) {
      dateSelect.addEventListener('change', e => {
        currentDate = e.target.value;
        updateDetailFilterActiveBadge();
        renderTable();
      });
    }

    const searchInput = document.getElementById('searchInput');
    let searchDebounceTimer = null;
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        searchQuery = e.target.value;
        if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
          renderTable();
        }, 120);
      });
    }

    // Passive scroll listener fallback for chunk loading
    window.addEventListener('scroll', () => {
      if (currentlyRenderedCount < currentFilteredItems.length) {
        if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 500)) {
          renderNextChunk();
        }
      }
    }, { passive: true });

    document.querySelectorAll('#platformFilters .filter-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        document.querySelectorAll('#platformFilters .filter-tag').forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        currentPlatform = tag.getAttribute('data-platform');
        renderTable();
      });
    });

    document.querySelectorAll('#categoryFilters .filter-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        document.querySelectorAll('#categoryFilters .filter-tag').forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        currentCategory = tag.getAttribute('data-cat');
        updateDetailFilterActiveBadge();
        renderTable();
      });
    });

    document.querySelectorAll('#statusFilters .filter-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        document.querySelectorAll('#statusFilters .filter-tag').forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        currentStatus = tag.getAttribute('data-status');
        renderTable();
      });
    });

    document.querySelectorAll('#severityFilters .filter-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        document.querySelectorAll('#severityFilters .filter-tag').forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        currentSeverity = tag.getAttribute('data-sev');
        updateDetailFilterActiveBadge();
        renderTable();
      });
    });

    document.querySelectorAll('#deployFilters .filter-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        document.querySelectorAll('#deployFilters .filter-tag').forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        currentDeployFilter = tag.getAttribute('data-deploy') || 'all';
        renderTable();
      });
    });

    // Inspector Drawer Action Buttons
    const btnClose = document.getElementById('btnCloseInspector');
    if (btnClose) {
      btnClose.addEventListener('click', closeInspector);
    }
    const btnPrev = document.getElementById('btnPrevIssue');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => navigateInspector(-1));
    }
    const btnNext = document.getElementById('btnNextIssue');
    if (btnNext) {
      btnNext.addEventListener('click', () => navigateInspector(1));
    }

    // Keyboard Shortcuts (Esc to close, Up/Down arrow to browse issues)
    window.addEventListener('keydown', e => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');
      if (e.key === 'Escape') {
        const guideModal = document.getElementById('severityGuideModal');
        if (guideModal && guideModal.classList.contains('active')) {
          toggleSeverityGuideModal(false);
          return;
        }
        if (currentSelectedId) {
          closeInspector();
        }
      } else if (!isInput && currentSelectedId) {
        if (e.key === 'ArrowUp' || e.key === 'k') {
          e.preventDefault();
          navigateInspector(-1);
        } else if (e.key === 'ArrowDown' || e.key === 'j') {
          e.preventDefault();
          navigateInspector(1);
        }
      }
    });

    // Close Severity Guide Modal on overlay click
    const guideModal = document.getElementById('severityGuideModal');
    if (guideModal) {
      guideModal.addEventListener('click', e => {
        if (e.target === guideModal) {
          toggleSeverityGuideModal(false);
        }
      });
    }

    // Modal Input Listeners for Quick Issue Generator
    ['modalIssueTitle', 'modalIssueProblem', 'modalIssueSolution', 'modalIssueCategory', 'modalIssuePlatform', 'modalIssueStatus', 'modalIssueFiles'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', updateModalCliPreview);
        el.addEventListener('change', updateModalCliPreview);
      }
    });

    const newIssueModal = document.getElementById('newIssueModal');
    if (newIssueModal) {
      newIssueModal.addEventListener('click', e => {
        if (e.target === newIssueModal) {
          closeNewIssueModal();
        }
      });
    }

    const editDeployModal = document.getElementById('editDeployModal');
    if (editDeployModal) {
      editDeployModal.addEventListener('click', e => {
        if (e.target === editDeployModal) {
          closeEditDeployModal();
        }
      });
    }

    const editDeployInput = document.getElementById('editDeployVersionInput');
    if (editDeployInput) {
      editDeployInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveDeployVersion();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closeEditDeployModal();
        }
      });
    }
  }

  // Handle language change callback from QA_I18N
  window.onQaLanguageChanged = function (lang) {
    renderTrackTabs();
    updateDateDropdown();
    updateStatusBadges();
    updatePlatformBadges();
    updateCategoryBadges();
    updateSeverityBadges();
    updateDeployBadges();
    renderTable();
  };

  // Initialize
  function init() {
    initTheme();
    const savedTrack = localStorage.getItem(STORAGE_KEY_TRACK);

    // Restore cached VOC feedbacks from local storage
    try {
      const cachedVoc = localStorage.getItem('modo_voc_live_feedbacks');
      if (cachedVoc) {
        const parsed = JSON.parse(cachedVoc);
        if (Array.isArray(parsed) && parsed.length > 0) {
          window.MODO_FEEDBACK_DATA = parsed;
        }
      }
    } catch(e) {}

    // Parse URL Search Parameters for Cross-Page Deep Linking
    const urlParams = new URLSearchParams(window.location.search);
    const paramTrack = urlParams.get('track');
    const paramDate = urlParams.get('date');
    const paramCat = urlParams.get('category') || urlParams.get('cat');
    const paramSev = urlParams.get('severity') || urlParams.get('sev');
    const paramPlatform = urlParams.get('platform') || urlParams.get('plat');
    const paramStatus = urlParams.get('status');
    const paramDeploy = urlParams.get('deploy');
    const paramSearch = urlParams.get('q') || urlParams.get('search');

    const targetTrack = paramTrack || savedTrack || 'all';
    currentTrackId = targetTrack;
    try {
      localStorage.setItem(STORAGE_KEY_TRACK, targetTrack);
      const url = new URL(window.location.href);
      url.searchParams.set('track', targetTrack);
      window.history.replaceState(null, '', url.toString());
    } catch {}

    if (paramDate) currentDate = paramDate;
    if (paramCat) currentCategory = paramCat;
    if (paramSev) currentSeverity = paramSev;
    if (paramPlatform) currentPlatform = paramPlatform;
    if (paramStatus) currentStatus = paramStatus;
    if (paramDeploy) currentDeployFilter = paramDeploy;
    if (paramSearch) searchQuery = paramSearch;

    renderTrackTabs();
    loadTrackData();

    // Sync input fields if parameters provided
    if (paramDate) {
      const dateSelect = document.getElementById('dateFilterSelect');
      if (dateSelect) dateSelect.value = paramDate;
    }
    if (paramCat) {
      document.querySelectorAll('#categoryFilters .filter-tag').forEach(t => {
        if (t.getAttribute('data-cat') === paramCat) {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      });
    }
    if (paramSev) {
      document.querySelectorAll('#severityFilters .filter-tag').forEach(t => {
        if (t.getAttribute('data-sev') === paramSev) {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      });
    }
    if (paramPlatform) {
      document.querySelectorAll('#platformFilters .filter-tag').forEach(t => {
        if (t.getAttribute('data-platform') === paramPlatform) {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      });
    }
    if (paramStatus) {
      document.querySelectorAll('#statusFilters .filter-tag').forEach(t => {
        if (t.getAttribute('data-status') === paramStatus) {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      });
    }
    if (paramDeploy) {
      document.querySelectorAll('#deployFilters .filter-tag').forEach(t => {
        if (t.getAttribute('data-deploy') === paramDeploy) {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      });
    }
    if (paramSearch) {
      const searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.value = paramSearch;
    }

    bindEvents();
    initDrawerResize();

    // Restore collapsible detail drawer state
    try {
      const savedDrawerState = localStorage.getItem(STORAGE_KEY_DETAIL_FILTER_OPEN);
      if (savedDrawerState === 'true') {
        toggleDetailFilters(true);
      } else {
        toggleDetailFilters(false);
      }
    } catch {}

    // Initialize dual target releases in UI
    const targetReleaseAosEl = document.getElementById('targetReleaseAosInput');
    if (targetReleaseAosEl) {
      targetReleaseAosEl.value = getTargetRelease('android');
    }
    const targetReleaseIosEl = document.getElementById('targetReleaseIosInput');
    if (targetReleaseIosEl) {
      targetReleaseIosEl.value = getTargetRelease('ios');
    }

    updateDetailFilterActiveBadge();
  }

  const STORAGE_KEY_SHEET_URL = 'qa_sheet_sync_url';
  const STORAGE_KEY_GOOGLESHEET_URL = 'qa_google_spreadsheet_url';

  function getConfigSheetSyncUrl() {
    const cfg = window.QA_APP_CONFIG;
    if (cfg && cfg.api && typeof cfg.api.sheetSyncUrl === 'string') {
      return cfg.api.sheetSyncUrl.trim();
    }
    return '';
  }

  function getConfigSpreadsheetViewUrl() {
    const cfg = window.QA_APP_CONFIG;
    if (cfg && cfg.api && typeof cfg.api.spreadsheetViewUrl === 'string') {
      return cfg.api.spreadsheetViewUrl.trim();
    }
    return '';
  }

  function getEffectiveSheetSyncUrl() {
    return localStorage.getItem(STORAGE_KEY_SHEET_URL) ||
           localStorage.getItem('modo_qa_sheet_sync_url') ||
           getConfigSheetSyncUrl();
  }

  function getEffectiveSpreadsheetViewUrl() {
    return localStorage.getItem(STORAGE_KEY_GOOGLESHEET_URL) ||
           localStorage.getItem('modo_qa_google_spreadsheet_url') ||
           getConfigSpreadsheetViewUrl();
  }

  function openSyncModal() {
    const modal = document.getElementById('googleSheetSyncModal');
    const input = document.getElementById('syncSheetUrlInput');
    const sheetViewInput = document.getElementById('syncSpreadsheetViewUrlInput');
    const msg = document.getElementById('syncStatusMsg');
    if (!modal) return;
    if (input) input.value = getEffectiveSheetSyncUrl();
    if (sheetViewInput) sheetViewInput.value = getEffectiveSpreadsheetViewUrl();
    if (msg) msg.style.display = 'none';
    modal.style.display = 'flex';
  }

  function closeSyncModal() {
    const modal = document.getElementById('googleSheetSyncModal');
    const sheetViewInput = document.getElementById('syncSpreadsheetViewUrlInput');
    if (sheetViewInput && sheetViewInput.value.trim()) {
      localStorage.setItem(STORAGE_KEY_GOOGLESHEET_URL, sheetViewInput.value.trim());
    }
    if (modal) modal.style.display = 'none';
  }

  const STORAGE_KEY_FEEDBACK_CACHE = 'modo_voc_live_feedbacks';

  function downloadLocalFeedbackManifest() {
    const data = window.MODO_FEEDBACK_DATA || [];
    const content = `/**
 * Modo User Feedback & VOC Manifest (data/feedback_manifest.js)
 * Synchronized automatically from Google Sheets.
 * Total Items: ${data.length}
 */

window.MODO_FEEDBACK_DATA = ${JSON.stringify(data, null, 2)};
`;
    const blob = new Blob([content], { type: 'application/javascript;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'feedback_manifest.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function applyLocalFeedbackData() {
    const msg = document.getElementById('syncStatusMsg');
    const localData = window.MODO_FEEDBACK_DATA || [];
    localStorage.setItem(STORAGE_KEY_FEEDBACK_CACHE, JSON.stringify(localData));
    if (msg) {
      msg.style.display = 'block';
      msg.style.color = 'var(--status-resolved-text)';
      msg.textContent = `✅ 로컬 feedback_manifest.js 데이터(${localData.length}건)를 즉시 동기화 적용했습니다!`;
    }
    setTimeout(() => {
      closeSyncModal();
      switchTrack('feedback');
    }, 600);
  }

  async function executeSheetSync() {
    const input = document.getElementById('syncSheetUrlInput');
    const msg = document.getElementById('syncStatusMsg');
    const btn = document.getElementById('btnExecuteSync');
    if (!input || !input.value.trim()) {
      if (msg) {
        msg.style.display = 'block';
        msg.style.color = 'var(--accent)';
        msg.textContent = '웹 앱 URL을 입력해주세요.';
      }
      return;
    }

    let url = input.value.trim();
    if (url.includes('script.google.com') && !url.endsWith('/exec')) {
      url = url.replace(/\/?$/, '/exec');
      input.value = url;
    }

    if (btn) btn.textContent = '동기화 중...';
    if (msg) {
      msg.style.display = 'block';
      msg.style.color = 'var(--accent-blue)';
      msg.textContent = '구글 시트로부터 최신 데이터를 가져오는 중입니다...';
    }

    try {
      const resp = await fetch(url);
      const text = await resp.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (parseErr) {
        if (text.trim().startsWith('<') || text.includes('<!DOCTYPE')) {
          throw new Error('Google 보안 정책으로 인해 브라우저의 로컬 파일(file://) 직접 통신이 차단되었습니다. 로컬 웹서버(http://)를 사용하시거나, [⚡ 로컬 최신 데이터 적용] 버튼을 눌러 로컬 데이터를 즉시 반영해주세요.');
        }
        throw parseErr;
      }

      if (json && json.data && Array.isArray(json.data)) {
        window.MODO_FEEDBACK_DATA = json.data;
        localStorage.setItem(STORAGE_KEY_SHEET_URL, url);
        localStorage.setItem(STORAGE_KEY_FEEDBACK_CACHE, JSON.stringify(json.data));
        if (msg) {
          msg.style.color = 'var(--status-resolved-text)';
          msg.textContent = `✅ ${json.data.length}건의 피드백을 실시간으로 가져와 로컬에 영구 보존했습니다!`;
        }
        setTimeout(() => {
          closeSyncModal();
          switchTrack('feedback');
        }, 800);
      } else {
        throw new Error(json.message || '응답 데이터 형식이 올바르지 않습니다.');
      }
    } catch (err) {
      if (msg) {
        msg.style.color = 'var(--accent)';
        msg.textContent = `❌ 동기화 실패: ${err.message || '네트워크 오류'}`;
      }
    } finally {
      if (btn) btn.textContent = '실시간 동기화 실행';
    }
  }

  // Release Notes Auto-Generator from Deployed Items (Dynamic & Real-Time)
  // Supports dual OS: 'android' vs 'ios'
  // Supports scope: 'latest' (Current target release only) | 'all' (Full release history grouped by version)
  function copyReleaseNotes(arg0 = 'android', arg1 = 'latest') {
    let os = 'android';
    let mode = 'latest';
    if (arg0 === 'latest' || arg0 === 'all') {
      mode = arg0;
      os = 'android';
    } else {
      os = (arg0 || 'android').toLowerCase();
      mode = arg1 || 'latest';
    }

    const isIos = os === 'ios';
    const osPlatformFilter = isIos ? 'android' : 'ios';
    const targetList = (activeIssues || []).filter(item => {
      const p = (item.platform || 'all').toLowerCase();
      if (p === osPlatformFilter) return false;
      return isItemDeployed(item, os);
    });

    if (!targetList || targetList.length === 0) {
      const noItemToast = isIos ? (t('toastNoDeployedItemsIos') || '⚠️ iOS 배포 완료된 항목이 없습니다.') : (t('toastNoDeployedItemsAos') || '⚠️ Android 배포 완료된 항목이 없습니다.');
      showToast(noItemToast);
      return;
    }

    const trackName = (currentTrackId || 'All').toUpperCase();
    const today = new Date().toISOString().slice(0, 10);
    const osLabel = isIos ? 'Apple iOS' : 'Google Android';
    const osStoreName = isIos ? 'Apple App Store' : 'Google Play Store';
    const osIcon = isIos ? '🍎' : '🤖';

    const catMap = {
      ui: '🎨 UI & UX 개선 (Design & Usability)',
      reliability: '🛡️ 안정성 및 결함 수정 (Stability & Bug Fixes)',
      core: '⚡ 핵심 기능 및 파이프라인 (Core Features)',
      perf: '🚀 성능 및 자원 최적화 (Performance)',
      media: '🎙️ 미디어 & 오디오 세션 (Media & Audio)',
      monetization: '💰 수익화 & 스토어 심사 (Monetization & Store)',
      auth: '🔒 보안 & 권한 관리 (Security & Permissions)',
      db: '💾 데이터베이스 & 로컬 저장소 (Database & Storage)'
    };

    function cleanVersionStr(v) {
      if (!v) return '';
      return String(v).replace(/^🚀\s*/, '').replace(/\s+/g, ' ').trim();
    }

    function getVersionKey(v) {
      return cleanVersionStr(v).replace(/\s+/g, '').toLowerCase();
    }

    let markdown = '';
    let successToastMsg = '';

    if (mode === 'latest') {
      const targetVer = cleanVersionStr(getTargetRelease(os));
      const targetVerKey = getVersionKey(targetVer);

      // 1. Strict key match against target release
      let matchedItems = targetList.filter(item => {
        const itemVerKey = getVersionKey(getDeployVersion(item, os));
        return itemVerKey === targetVerKey;
      });

      // 2. Fallback smart substring match if strict match yields 0
      if (matchedItems.length === 0 && targetVerKey) {
        matchedItems = targetList.filter(item => {
          const itemVerKey = getVersionKey(getDeployVersion(item, os));
          return itemVerKey && (itemVerKey.includes(targetVerKey) || targetVerKey.includes(itemVerKey));
        });
      }

      if (matchedItems.length === 0) {
        const fallbackMsg = isIos 
          ? (t('toastNoLatestDeployedItemsIos', { ver: targetVer }) || `⚠️ iOS 대상 릴리즈('${targetVer}')에 배포 완료된 항목이 없습니다.`)
          : (t('toastNoLatestDeployedItemsAos', { ver: targetVer }) || `⚠️ Android 대상 릴리즈('${targetVer}')에 배포 완료된 항목이 없습니다.`);
        showToast(fallbackMsg);
        return;
      }

      // Group by category
      const grouped = {};
      matchedItems.forEach(item => {
        const cat = normalizeCategory(item.category) || 'reliability';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
      });

      markdown = `## ${osIcon} Modo ${osLabel} Release Notes (${targetVer} - ${trackName})\n`;
      markdown += `- 배포 일자: ${today}\n`;
      markdown += `- 배포 스토어: ${osStoreName}\n`;
      markdown += `- 배포 버전: ${targetVer}\n`;
      markdown += `- 배포 항목: ${matchedItems.length}건\n\n`;

      Object.keys(grouped).forEach(cat => {
        const header = catMap[cat] || `📦 ${cat.toUpperCase()}`;
        markdown += `### ${header}\n`;
        grouped[cat].forEach(item => {
          const paddedId = String(item.id).startsWith('FB-') ? String(item.id) : String(item.id).padStart(2, '0');
          const plat = item.platform && item.platform !== 'all' ? `[${item.platform.toUpperCase()}] ` : '';
          markdown += `- [#${paddedId}] ${plat}${item.title || item.problem || ''}\n`;
        });
        markdown += `\n`;
      });

      successToastMsg = isIos
        ? (t('toastReleaseNotesCopiedIosLatest', { ver: targetVer }) || `🍎 iOS 최신 릴리즈(${targetVer}) 배포 노트가 클립보드에 복사되었습니다!`)
        : (t('toastReleaseNotesCopiedAosLatest', { ver: targetVer }) || `📢 Android 최신 릴리즈(${targetVer}) 배포 노트가 클립보드에 복사되었습니다!`);
    } else {
      // mode === 'all'
      // Group all deployed items by their deploy version
      const versionGroups = {};
      targetList.forEach(item => {
        const rawVer = cleanVersionStr(getDeployVersion(item, os)) || '기타 / 미지정 (Unassigned)';
        if (!versionGroups[rawVer]) versionGroups[rawVer] = [];
        versionGroups[rawVer].push(item);
      });

      // Sort versions descending (extract numbers: e.g. 71 vs 70 vs 69)
      const sortedVersions = Object.keys(versionGroups).sort((a, b) => {
        const numA = parseInt((a.match(/\d+/) || [0])[0], 10);
        const numB = parseInt((b.match(/\d+/) || [0])[0], 10);
        if (numA !== numB) return numB - numA;
        return b.localeCompare(a);
      });

      markdown = `# 📜 Modo ${osLabel} Master Release Notes (${trackName})\n`;
      markdown += `- 생성 일자: ${today}\n`;
      markdown += `- 배포 스토어: ${osStoreName}\n`;
      markdown += `- 전체 배포 항목: ${targetList.length}건 (총 ${sortedVersions.length}개 릴리즈 버전)\n\n`;

      sortedVersions.forEach(ver => {
        const items = versionGroups[ver];
        markdown += `---\n\n`;
        markdown += `## ${osIcon} Release ${ver} (${items.length}건)\n\n`;

        // Group by category within this version
        const catGroup = {};
        items.forEach(item => {
          const cat = normalizeCategory(item.category) || 'reliability';
          if (!catGroup[cat]) catGroup[cat] = [];
          catGroup[cat].push(item);
        });

        Object.keys(catGroup).forEach(cat => {
          const header = catMap[cat] || `📦 ${cat.toUpperCase()}`;
          markdown += `### ${header}\n`;
          catGroup[cat].forEach(item => {
            const paddedId = String(item.id).startsWith('FB-') ? String(item.id) : String(item.id).padStart(2, '0');
            const plat = item.platform && item.platform !== 'all' ? `[${item.platform.toUpperCase()}] ` : '';
            markdown += `- [#${paddedId}] ${plat}${item.title || item.problem || ''}\n`;
          });
          markdown += `\n`;
        });
      });

      successToastMsg = isIos
        ? (t('toastReleaseNotesCopiedIosAll', { count: targetList.length }) || `📜 버전별 iOS 전체 릴리즈 노트(${targetList.length}건)가 클립보드에 복사되었습니다!`)
        : (t('toastReleaseNotesCopiedAosAll', { count: targetList.length }) || `📜 버전별 Android 전체 릴리즈 노트(${targetList.length}건)가 클립보드에 복사되었습니다!`);
    }

    const fallbackCopy = (text) => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showToast(successToastMsg);
      } catch {
        showToast('❌ 클립보드 복사 실패');
      } finally {
        document.body.removeChild(textarea);
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(markdown.trim()).then(() => {
        showToast(successToastMsg);
      }).catch(() => {
        fallbackCopy(markdown.trim());
      });
    } else {
      fallbackCopy(markdown.trim());
    }
  }

  // CSV Export for active track
  function exportCSV() {
    if (!activeIssues || !activeIssues.length) return;
    const headers = ['ID', 'Date', 'Platform', 'Category', 'Severity', 'Title', 'Problem', 'Solution', 'Files', 'Status'];
    const rows = activeIssues.map(i => [
      i.id,
      i.date || '',
      i.platform || '',
      i.category || '',
      i.severity || 'S3',
      `"${(i.title || '').replace(/"/g, '""')}"`,
      `"${(i.problem || '').replace(/"/g, '""')}"`,
      `"${(i.solution || '').replace(/"/g, '""')}"`,
      `"${(i.files || []).join(', ').replace(/"/g, '""')}"`,
      i.status || 'resolved'
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modo_qa_${currentTrackId}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Settings Popover Toggle, Google Sheet Opener & Click Outside Handler
  window.openGoogleSheet = openGoogleSheet;
  window.toggleSettingsPopover = function (force) {
    const p = document.getElementById('settingsPopover');
    if (!p) return;
    if (typeof force === 'boolean') {
      p.classList.toggle('open', force);
    } else {
      p.classList.toggle('open');
    }
  };

  // Target Files Floating Popover Logic
  let activeFilesPopoverKey = null;

  function closeFilesPopover() {
    const existing = document.getElementById('qaFilesPopover');
    if (existing) existing.remove();
    activeFilesPopoverKey = null;
  }

  function copySingleFile(filePath, rowEl) {
    if (!filePath) return;
    navigator.clipboard.writeText(filePath).then(() => {
      const hint = rowEl ? rowEl.querySelector('.qa-popover-copy-hint') : null;
      if (hint) {
        const oldText = hint.textContent;
        hint.textContent = t('popoverCopied') || '복사됨! ✅';
        hint.style.opacity = '1';
        hint.style.color = 'var(--status-resolved-text)';
        setTimeout(() => {
          hint.textContent = oldText;
          hint.style.opacity = '';
          hint.style.color = '';
        }, 1300);
      }
    }).catch(() => {});
  }

  function copyAllFiles(itemKey, btnEl) {
    const item = activeIssues.find(i => getItemKey(i) === itemKey || String(i.id) === String(itemKey));
    if (!item || !item.files || item.files.length === 0) return;
    const text = item.files.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      if (btnEl) {
        const oldText = btnEl.textContent;
        btnEl.textContent = t('popoverCopied') || '복사됨! ✅';
        btnEl.style.borderColor = 'var(--status-resolved-text)';
        btnEl.style.color = 'var(--status-resolved-text)';
        setTimeout(() => {
          btnEl.textContent = oldText;
          btnEl.style.borderColor = '';
          btnEl.style.color = '';
        }, 1300);
      }
    }).catch(() => {});
  }

  function showFilesPopover(itemKey, btnEl, event) {
    if (event) event.stopPropagation();

    if (activeFilesPopoverKey === itemKey) {
      closeFilesPopover();
      return;
    }

    closeFilesPopover();

    const item = activeIssues.find(i => getItemKey(i) === itemKey || String(i.id) === String(itemKey));
    if (!item || !item.files || item.files.length === 0) return;

    activeFilesPopoverKey = itemKey;

    const files = item.files;
    const popover = document.createElement('div');
    popover.className = 'qa-files-popover';
    popover.id = 'qaFilesPopover';
    popover.onclick = (e) => e.stopPropagation();

    const titleText = t('popoverFilesTitle') || '수정 파일 목록';
    const copyAllText = t('popoverCopyAll') || '📋 전체 복사';
    const inspectText = t('popoverInspectAll') || '🔍 하단 인스펙터에서 전체 보기 ↗';

    popover.innerHTML = `
      <div class="qa-popover-header">
        <div class="qa-popover-title">
          <span>📂</span>
          <span>${titleText} <b style="color: var(--accent-purple);">(${files.length})</b></span>
        </div>
        <div class="qa-popover-actions">
          <button type="button" class="qa-popover-btn-copy-all" title="전체 파일 목록 복사" onclick="window.MODO_QA.copyAllFiles('${itemKey}', this)">${copyAllText}</button>
          <button type="button" class="qa-popover-btn-close" title="닫기 (Esc)" onclick="window.MODO_QA.closeFilesPopover()">✕</button>
        </div>
      </div>
      <div class="qa-popover-list">
        ${files.map(f => `
          <div class="qa-popover-file-row" onclick="window.MODO_QA.copySingleFile('${escapeHtml(f)}', this)" title="클릭하여 파일명 복사">
            <span style="font-size: 11px;">📄</span>
            <span class="qa-popover-file-path">${escapeHtml(f)}</span>
            <span class="qa-popover-copy-hint">복사</span>
          </div>
        `).join('')}
      </div>
      <div class="qa-popover-footer">
        <button type="button" class="qa-popover-btn-inspect" onclick="window.MODO_QA.closeFilesPopover(); window.MODO_QA.openInspector('${itemKey}');">
          ${inspectText}
        </button>
      </div>
    `;

    document.body.appendChild(popover);

    // Dynamic Positioning
    const rect = btnEl.getBoundingClientRect();
    const popoverWidth = 310;
    let left = rect.left + window.scrollX - (popoverWidth / 2) + (rect.width / 2);
    
    // Horizontal boundary check
    if (left + popoverWidth > window.innerWidth - 16) {
      left = window.innerWidth - popoverWidth - 16;
    }
    if (left < 16) left = 16;

    // Vertical boundary check
    const popoverHeight = popover.offsetHeight || 220;
    let top = rect.bottom + window.scrollY + 6;
    if (rect.bottom + popoverHeight + 20 > window.innerHeight && rect.top > popoverHeight + 20) {
      top = rect.top + window.scrollY - popoverHeight - 6;
    }

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
  }

  document.addEventListener('click', (e) => {
    const container = document.querySelector('.settings-menu-container');
    if (container && !container.contains(e.target)) {
      const p = document.getElementById('settingsPopover');
      if (p) p.classList.remove('open');
    }
    const popover = document.getElementById('qaFilesPopover');
    if (popover && !popover.contains(e.target) && !e.target.closest('.qa-files-badge-btn')) {
      closeFilesPopover();
    }
  });

  // ESC key handler for Settings Popover, Files Popover, and Guide Modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (activeFilesPopoverKey) {
        closeFilesPopover();
        return;
      }
      const p = document.getElementById('settingsPopover');
      if (p && p.classList.contains('open')) {
        p.classList.remove('open');
      }
      const modal = document.getElementById('severityGuideModal');
      if (modal && modal.classList.contains('active')) {
        toggleSeverityGuideModal(false);
      }
    }
  });

  // In-Browser Quick Issue Generator Modal
  function openNewIssueModal() {
    const modal = document.getElementById('newIssueModal');
    if (!modal) return;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    updateModalCliPreview();
  }

  function closeNewIssueModal() {
    const modal = document.getElementById('newIssueModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  function updateModalCliPreview() {
    const title = (document.getElementById('modalIssueTitle')?.value || '').trim();
    const problem = (document.getElementById('modalIssueProblem')?.value || '').trim();
    const solution = (document.getElementById('modalIssueSolution')?.value || '').trim();
    const category = document.getElementById('modalIssueCategory')?.value || 'reliability';
    const platform = document.getElementById('modalIssuePlatform')?.value || 'all';
    const status = document.getElementById('modalIssueStatus')?.value || 'resolved';
    const files = (document.getElementById('modalIssueFiles')?.value || '').trim();

    const preview = document.getElementById('modalCliPreview');
    if (!preview) return;

    let cmd = `python scripts/add_issue.py --title "${title || 'Issue Title'}" --category "${category}" --platform "${platform}" --status "${status}"`;
    if (problem) cmd += ` --problem "${problem}"`;
    if (solution) cmd += ` --solution "${solution}"`;
    if (files) cmd += ` --files ${files}`;

    preview.textContent = cmd;
  }

  function copyCliCommand() {
    const preview = document.getElementById('modalCliPreview');
    if (!preview) return;
    navigator.clipboard?.writeText(preview.textContent).then(() => {
      showModalToast('✅ CLI 명령어가 클립보드에 복사되었습니다!');
    });
  }

  function copyJsSnippet() {
    const title = (document.getElementById('modalIssueTitle')?.value || '').trim();
    const problem = (document.getElementById('modalIssueProblem')?.value || '').trim();
    const solution = (document.getElementById('modalIssueSolution')?.value || '').trim();
    const category = document.getElementById('modalIssueCategory')?.value || 'reliability';
    const platform = document.getElementById('modalIssuePlatform')?.value || 'all';
    const status = document.getElementById('modalIssueStatus')?.value || 'resolved';
    const files = (document.getElementById('modalIssueFiles')?.value || '').trim().split(/\s+/).filter(Boolean);

    const snippet = JSON.stringify({
      id: "AUTO_ASSIGN",
      date: new Date().toISOString().slice(0, 10),
      category,
      platform,
      title,
      problem,
      solution,
      files,
      status
    }, null, 2);

    navigator.clipboard?.writeText(snippet).then(() => {
      showModalToast('✅ JS 스니펫이 클립보드에 복사되었습니다!');
    });
  }

  function showModalToast(msg) {
    const toast = document.getElementById('modalCopyToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'inline';
    setTimeout(() => { toast.style.display = 'none'; }, 2500);
  }

  // Expose API to window
  window.MODO_QA = {
    init,
    switchTrack,
    toggleTheme,
    toggleSeverityGuideModal,
    toggleHighlight,
    toggleDetail,
    toggleDeploy,
    isItemDeployed,
    getDeployVersion,
    getTargetRelease,
    setTargetRelease,
    toggleDetailFilters,
    resetAllFilters,
    openEditDeployVersionModal,
    closeEditDeployModal,
    applyQuickTargetRelease,
    saveDeployVersion,
    openInspector,
    closeInspector,
    navigateInspector,
    sortTable,
    convertCurrentFeedbackToQa,
    openSyncModal,
    closeSyncModal,
    executeSheetSync,
    applyLocalFeedbackData,
    openGoogleSheet,
    copyVocCustomerQuote,
    onVocTemplateSelect,
    copyVocReply,
    downloadLocalFeedbackManifest,
    exportCSV,
    copyReleaseNotes,
    openNewIssueModal,
    closeNewIssueModal,
    copyCliCommand,
    copyJsSnippet,
    showFilesPopover,
    closeFilesPopover,
    copySingleFile,
    copyAllFiles,
    getOsLogoSvg,
    openDeploySaveModal,
    closeDeploySaveModal,
    saveDeployRegistryDirectly,
    downloadDeployRegistryJs,
    downloadDeployRegistryJson,
    copyDeployRegistrySnippet,
    copyDeploySyncCli
  };

  // Backward-compatibility bridge
  window.UNIVERSAL_QA = {
    ENGINE: window.MODO_QA
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
