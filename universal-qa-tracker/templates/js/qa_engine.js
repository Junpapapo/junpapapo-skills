/**
 * Universal QA Master Spreadsheet - Interactive Rendering & Filter Engine
 * Zero-server browser execution with Lightbox screenshot preview and Quick Issue Modal.
 */
(function () {
  'use strict';

  let currentTrackId = 'all';
  let currentDate = 'all';
  let currentPlatform = 'all';
  let currentCategory = 'all';
  let currentStatus = 'all';
  let searchQuery = '';
  let activeIssues = [];
  let sortColumn = null;
  let sortAsc = true;

  const STORAGE_KEY_HIGHLIGHTS = 'universal_qa_highlighted_ids';
  const STORAGE_KEY_THEME = 'universal_qa_theme';
  const STORAGE_KEY_TRACK = 'universal_qa_active_track';

  function t(key, params) {
    if (window.UNIVERSAL_QA_I18N && typeof window.UNIVERSAL_QA_I18N.get === 'function') {
      return window.UNIVERSAL_QA_I18N.get(key, params);
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

  function getItemKey(item) {
    if (!item) return '';
    const phaseKey = item.phase || item.trackId || (currentTrackId !== 'all' ? currentTrackId : 'phase1');
    return `${phaseKey}_${item.id}`;
  }

  function isHighlighted(itemOrId) {
    const highlights = getHighlights();
    if (typeof itemOrId === 'object' && itemOrId !== null) {
      const composite = getItemKey(itemOrId);
      return highlights.includes(composite) || highlights.includes(itemOrId.id);
    }
    // Backward compatibility for raw id numbers
    return highlights.includes(itemOrId) || highlights.some(k => typeof k === 'string' && k.endsWith(`_${itemOrId}`));
  }

  function toggleHighlight(itemOrId, event) {
    if (event) event.stopPropagation();
    const highlights = getHighlights();
    const key = (typeof itemOrId === 'object' && itemOrId !== null) ? getItemKey(itemOrId) : itemOrId;
    const idx = highlights.indexOf(key);
    const willBePinned = idx < 0;
    if (idx >= 0) {
      highlights.splice(idx, 1);
    } else {
      if (typeof itemOrId === 'object' && itemOrId.id) {
        const legIdx = highlights.indexOf(itemOrId.id);
        if (legIdx >= 0) highlights.splice(legIdx, 1);
      }
      highlights.push(key);
    }
    setHighlights(highlights);

    // In-place DOM update for instantaneous zero-lag response
    if (currentStatus === 'highlighted') {
      renderTable();
    } else {
      const star = event && event.target;
      if (star && star.classList.contains('bookmark-star')) {
        star.classList.toggle('active', willBePinned);
        star.textContent = willBePinned ? '★' : '☆';
        const row = star.closest('tr');
        if (row) row.classList.toggle('row-bookmarked', willBePinned);
      } else {
        renderTable();
      }
    }
    updateHeaderStats();
  }

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

  function switchTrack(trackId) {
    currentTrackId = trackId;
    localStorage.setItem(STORAGE_KEY_TRACK, trackId);
    currentDate = 'all';
    currentPlatform = 'all';
    currentCategory = 'all';
    currentStatus = 'all';
    searchQuery = '';

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';

    const categoryGroup = document.getElementById('categoryFilters');
    if (categoryGroup) {
      const allTag = categoryGroup.querySelector('[data-category="all"]');
      if (allTag) updateFilterTagActive(categoryGroup, allTag);
    }
    const platformGroup = document.getElementById('platformFilters');
    if (platformGroup) {
      const allTag = platformGroup.querySelector('[data-platform="all"]');
      if (allTag) updateFilterTagActive(platformGroup, allTag);
    }
    const statusGroup = document.getElementById('statusFilters');
    if (statusGroup) {
      const allTag = statusGroup.querySelector('[data-status="all"]');
      if (allTag) updateFilterTagActive(statusGroup, allTag);
    }

    renderTrackTabs();
    loadTrackData();
  }

  function getManifest() {
    return window.UNIVERSAL_QA_MANIFEST || window.MODO_QA_MANIFEST || null;
  }

  function loadTrackData() {
    const manifest = getManifest();
    if (!manifest) return;

    const track = manifest.tracks.find(t => t.id === currentTrackId) || manifest.tracks[0];
    activeIssues = track ? track.getData() : [];

    updateDateDropdown();
    updateHeaderStats();
    filterAndRender();
  }

  function renderTrackTabs() {
    const manifest = getManifest();
    const container = document.getElementById('trackTabsContainer');
    if (!manifest || !container) return;

    container.innerHTML = '';
    manifest.tracks.forEach(track => {
      const btn = document.createElement('button');
      btn.className = `track-tab-btn ${track.id === currentTrackId ? 'active' : ''}`;
      btn.innerHTML = `
        <span>${track.label}</span>
        <span class="tab-badge" style="background-color: ${track.color || 'var(--accent-blue)'};">${track.badge || ''}</span>
      `;
      btn.addEventListener('click', () => switchTrack(track.id));
      container.appendChild(btn);
    });
  }

  function updateDateDropdown() {
    const select = document.getElementById('dateFilterSelect');
    if (!select) return;

    const dates = Array.from(new Set(activeIssues.map(i => i.date).filter(Boolean))).sort().reverse();
    select.innerHTML = `<option value="all">${t('allDates')}</option>`;
    dates.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      select.appendChild(opt);
    });
    select.value = currentDate;
  }

  function updateHeaderStats() {
    const totalEl = document.getElementById('statTotal');
    const resEl = document.getElementById('statResolved');
    const pendEl = document.getElementById('statPending');

    const total = activeIssues.length;
    const resolved = activeIssues.filter(i => (i.status || '').toLowerCase() === 'resolved').length;
    const pending = total - resolved;

    if (totalEl) totalEl.textContent = total;
    if (resEl) resEl.textContent = resolved;
    if (pendEl) pendEl.textContent = pending;
  }

  function updateFilterTagActive(parentGroup, activeTag) {
    if (!parentGroup) return;
    parentGroup.querySelectorAll('.filter-tag').forEach(tag => tag.classList.remove('active'));
    if (activeTag) activeTag.classList.add('active');
  }

  function filterAndRender() {
    const highlights = getHighlights();
    const q = (searchQuery || '').trim().toLowerCase();

    let filtered = activeIssues.filter(item => {
      if (currentDate !== 'all' && item.date !== currentDate) return false;
      if (currentPlatform !== 'all') {
        const p = (item.platform || '').toLowerCase();
        if (p !== currentPlatform && p !== 'all' && currentPlatform !== 'common') return false;
      }
      if (currentCategory !== 'all') {
        const c = (item.category || '').toLowerCase();
        if (c !== currentCategory && !(currentCategory === 'core' && c === 'logic')) return false;
      }
      if (currentStatus === 'resolved' && (item.status || '').toLowerCase() !== 'resolved') return false;
      if (currentStatus === 'pending' && (item.status || '').toLowerCase() === 'resolved') return false;
      if (currentStatus === 'highlighted' && !isHighlighted(item)) return false;

      if (q) {
        const idStr = '#' + item.id;
        const textToSearch = [
          idStr,
          item.phase,
          item.date,
          item.title,
          item.title_en,
          item.problem,
          item.problem_en,
          item.solution,
          item.solution_en,
          item.cause,
          (item.files || []).join(' '),
          (item.actions || []).join(' ')
        ].filter(Boolean).join(' ').toLowerCase();

        if (!textToSearch.includes(q)) return false;
      }
      return true;
    });

    if (sortColumn) {
      filtered.sort((a, b) => {
        let valA = a[sortColumn] || '';
        let valB = b[sortColumn] || '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
    }

    renderTable(filtered);
  }

  function renderTable(list) {
    const items = list || activeIssues;
    const tbody = document.getElementById('qaTableBody');
    const noMatch = document.getElementById('noMatchBox');
    const countLabel = document.getElementById('tableCountLabel');

    if (countLabel) {
      countLabel.textContent = t('showingCount', { count: items.length, total: activeIssues.length });
    }

    if (!tbody) return;
    tbody.innerHTML = '';

    if (items.length === 0) {
      if (noMatch) noMatch.style.display = 'block';
      return;
    }
    if (noMatch) noMatch.style.display = 'none';

    items.forEach(item => {
      const isResolved = (item.status || '').toLowerCase() === 'resolved';
      const isBookmarked = isHighlighted(item);
      const isEn = window.UNIVERSAL_QA_I18N && window.UNIVERSAL_QA_I18N.currentLang === 'en';

      const title = (isEn && item.title_en) ? item.title_en : item.title;
      const problem = (isEn && item.problem_en) ? item.problem_en : item.problem;
      const solution = (isEn && item.solution_en) ? item.solution_en : item.solution;
      const cause = item.cause || '-';
      const actions = (item.actions || []).map(a => `<li>${a}</li>`).join('');
      const files = (item.files || []).map(f => `<code>${f}</code>`).join('<br>');

      // Screenshots badge
      let screenshotBadge = '';
      if (item.screenshots && item.screenshots.length > 0) {
        const firstImg = item.screenshots[0];
        const count = item.screenshots.length;
        screenshotBadge = `<span class="screenshot-pill" onclick="window.UNIVERSAL_QA.ENGINE.viewScreenshot('${firstImg}', event)" title="Click to preview screenshot">🖼️ ${count}</span>`;
      }

      const detailId = `d_${getItemKey(item)}`;

      const row = document.createElement('tr');
      row.className = `qa-row ${isBookmarked ? 'row-bookmarked' : ''}`;
      row.onclick = () => toggleDetail(detailId, row);
      row.innerHTML = `
        <td class="col-id">
          <span class="bookmark-star ${isBookmarked ? 'active' : ''}" onclick="window.UNIVERSAL_QA.ENGINE.toggleHighlight(${JSON.stringify(item).replace(/"/g, '&quot;')}, event)">${isBookmarked ? '★' : '☆'}</span>
          ${phaseBadge}#${item.id}
        </td>
        <td class="col-date">${item.date || '-'}</td>
        <td class="col-platform"><span class="badge-tag">${item.platformLabel || item.platform || 'Universal'}</span></td>
        <td class="col-cat"><span class="badge-tag">${item.categoryLabel || item.category || 'General'}</span></td>
        <td class="col-title">
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <strong>${title}</strong>
            ${screenshotBadge}
          </div>
          ${problem ? `<div class="sub-problem">⚠️ ${problem}</div>` : ''}
        </td>
        <td class="col-cause">${cause}</td>
        <td class="col-solution">
          ${solution ? `<div class="solution-summary">💡 ${solution}</div>` : ''}
          ${actions ? `<ul class="action-list">${actions}</ul>` : ''}
        </td>
        <td class="col-files">${files || '-'}</td>
        <td class="col-status" style="text-align: center;">
          <span class="status-pill ${isResolved ? 'status-resolved' : 'status-pending'}">
            ${isResolved ? t('badgeResolved') : t('badgePending')}
          </span>
        </td>
      `;

      // Expandable Detail Row
      const detailRow = document.createElement('tr');
      detailRow.className = 'detail-row';
      detailRow.id = detailId;
      detailRow.innerHTML = `
        <td colspan="9">
          <div class="detail-box">
            <div>
              <div class="detail-section-title">🔍 ${t('thCause') || 'Root Cause Analysis'}</div>
              <div class="detail-text">${cause}</div>
            </div>
            <div>
              <div class="detail-section-title">🛠️ ${t('thSolution') || 'Resolution & Action Items'}</div>
              <div class="detail-text">
                ${solution ? `<div style="font-weight: 600; margin-bottom: 6px;">${solution}</div>` : ''}
                ${actions ? `<ul class="action-list" style="margin-left: 16px;">${actions}</ul>` : ''}
              </div>
            </div>
            ${(item.screenshots && item.screenshots.length > 0) ? `
              <div>
                <div class="detail-section-title">🖼️ Screenshots & Evidence</div>
                <div class="detail-gallery">
                  ${item.screenshots.map(s => `<img src="${s}" class="detail-thumbnail" onclick="window.UNIVERSAL_QA.ENGINE.viewScreenshot('${s}', event)" alt="Evidence" />`).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </td>
      `;

      tbody.appendChild(row);
      tbody.appendChild(detailRow);
    });
  }

  function toggleDetail(detailId, rowEl) {
    const detailRow = document.getElementById(detailId);
    if (!detailRow) return;

    const isOpen = detailRow.classList.contains('open');
    if (isOpen) {
      detailRow.classList.remove('open');
      if (rowEl) rowEl.classList.remove('expanded');
    } else {
      detailRow.classList.add('open');
      if (rowEl) rowEl.classList.add('expanded');
    }
  }

  function sortTable(column) {
    if (sortColumn === column) {
      sortAsc = !sortAsc;
    } else {
      sortColumn = column;
      sortAsc = true;
    }
    filterAndRender();
  }

  // Lightbox Image Viewer
  function viewScreenshot(imgSrc, event) {
    if (event) event.stopPropagation();
    let box = document.getElementById('qaLightbox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'qaLightbox';
      box.className = 'qa-lightbox-overlay';
      box.innerHTML = `
        <div class="qa-lightbox-content">
          <button class="qa-lightbox-close" onclick="window.UNIVERSAL_QA.ENGINE.closeScreenshot()">&times;</button>
          <img id="qaLightboxImg" src="" alt="QA Screenshot Preview">
          <div id="qaLightboxCaption" class="qa-lightbox-caption"></div>
        </div>
      `;
      box.addEventListener('click', function (e) {
        if (e.target === box) closeScreenshot();
      });
      document.body.appendChild(box);
    }
    const imgEl = document.getElementById('qaLightboxImg');
    const capEl = document.getElementById('qaLightboxCaption');
    if (imgEl) imgEl.src = imgSrc;
    if (capEl) capEl.textContent = imgSrc;
    box.style.display = 'flex';
  }

  function closeScreenshot() {
    const box = document.getElementById('qaLightbox');
    if (box) box.style.display = 'none';
  }

  // Quick New Issue Modal Logic
  function openNewIssueModal() {
    const modal = document.getElementById('newIssueModal');
    if (!modal) return;

    // Populate phase select
    const phaseSelect = document.getElementById('modalIssuePhase');
    if (phaseSelect) {
      phaseSelect.innerHTML = '';
      const manifest = getManifest();
      if (manifest && manifest.tracks) {
        manifest.tracks.forEach(tr => {
          if (tr.id !== 'all') {
            const opt = document.createElement('option');
            opt.value = tr.id;
            opt.textContent = tr.label || tr.id;
            if (tr.id === currentTrackId) opt.selected = true;
            phaseSelect.appendChild(opt);
          }
        });
      }
      if (phaseSelect.options.length === 0) {
        const opt = document.createElement('option');
        opt.value = 'phase1';
        opt.textContent = 'Phase 1';
        phaseSelect.appendChild(opt);
      }
    }

    modal.style.display = 'flex';
    updateCliPreview();
  }

  function closeNewIssueModal() {
    const modal = document.getElementById('newIssueModal');
    if (modal) modal.style.display = 'none';
  }

  function updateCliPreview() {
    const previewEl = document.getElementById('modalCliPreview');
    if (!previewEl) return;

    const phase = document.getElementById('modalIssuePhase')?.value || 'phase1';
    const cat = document.getElementById('modalIssueCategory')?.value || 'core';
    const plat = document.getElementById('modalIssuePlatform')?.value || 'all';
    const status = document.getElementById('modalIssueStatus')?.value || 'resolved';
    const title = document.getElementById('modalIssueTitle')?.value || 'Example issue title';
    const prob = document.getElementById('modalIssueProblem')?.value || '';
    const sol = document.getElementById('modalIssueSolution')?.value || '';
    const files = document.getElementById('modalIssueFiles')?.value || '';
    const ss = document.getElementById('modalIssueScreenshots')?.value || '';

    let cmd = `python scripts/add_issue.py \\\n  --phase "${phase}" \\\n  --category "${cat}" \\\n  --platform "${plat}" \\\n  --status "${status}" \\\n  --title "${title.replace(/"/g, '\\"')}"`;

    if (prob) cmd += ` \\\n  --problem "${prob.replace(/"/g, '\\"')}"`;
    if (sol) cmd += ` \\\n  --solution "${sol.replace(/"/g, '\\"')}"`;
    if (files) {
      const fileList = files.split(/[,\s]+/).filter(Boolean);
      if (fileList.length > 0) {
        cmd += ` \\\n  --files ${fileList.map(f => `"${f}"`).join(' ')}`;
      }
    }
    if (ss) {
      const ssList = ss.split(/[,\s]+/).filter(Boolean);
      if (ssList.length > 0) {
        cmd += ` \\\n  --screenshots ${ssList.map(s => `"${s}"`).join(' ')}`;
      }
    }

    previewEl.textContent = cmd;
  }

  function copyCliCommand() {
    const previewEl = document.getElementById('modalCliPreview');
    if (!previewEl) return;
    navigator.clipboard.writeText(previewEl.textContent).then(() => {
      showModalToast(t('copiedToast') || '📋 Copied CLI command!');
    });
  }

  function copyJsSnippet() {
    const phase = document.getElementById('modalIssuePhase')?.value || 'phase1';
    const cat = document.getElementById('modalIssueCategory')?.value || 'core';
    const plat = document.getElementById('modalIssuePlatform')?.value || 'all';
    const status = document.getElementById('modalIssueStatus')?.value || 'resolved';
    const title = document.getElementById('modalIssueTitle')?.value || 'New Issue';
    const prob = document.getElementById('modalIssueProblem')?.value || '';
    const sol = document.getElementById('modalIssueSolution')?.value || '';
    const files = document.getElementById('modalIssueFiles')?.value || '';
    const ss = document.getElementById('modalIssueScreenshots')?.value || '';

    const obj = {
      id: 999,
      phase: phase,
      date: new Date().toISOString().split('T')[0],
      platform: plat,
      platformLabel: plat.toUpperCase(),
      category: cat,
      categoryLabel: cat.toUpperCase(),
      title: title,
      problem: prob,
      solution: sol,
      files: files ? files.split(/[,\s]+/).filter(Boolean) : [],
      status: status,
      cause: '',
      actions: sol ? [`1. ${sol}`] : []
    };
    if (ss) obj.screenshots = ss.split(/[,\s]+/).filter(Boolean);

    const jsonSnippet = JSON.stringify(obj, null, 2);
    navigator.clipboard.writeText(jsonSnippet).then(() => {
      showModalToast(t('copiedToast') || '📄 Copied JS snippet!');
    });
  }

  function showModalToast(msg) {
    const toast = document.getElementById('modalCopyToast');
    if (toast) {
      toast.textContent = msg;
      toast.style.display = 'inline-block';
      setTimeout(() => { toast.style.display = 'none'; }, 2000);
    }
  }

  function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        searchQuery = e.target.value;
        filterAndRender();
      });
    }

    const dateSelect = document.getElementById('dateFilterSelect');
    if (dateSelect) {
      dateSelect.addEventListener('change', e => {
        currentDate = e.target.value;
        filterAndRender();
      });
    }

    const statusGroup = document.getElementById('statusFilters');
    if (statusGroup) {
      statusGroup.querySelectorAll('.filter-tag').forEach(tag => {
        tag.addEventListener('click', () => {
          currentStatus = tag.getAttribute('data-status') || 'all';
          updateFilterTagActive(statusGroup, tag);
          filterAndRender();
        });
      });
    }

    const platformGroup = document.getElementById('platformFilters');
    if (platformGroup) {
      platformGroup.querySelectorAll('.filter-tag').forEach(tag => {
        tag.addEventListener('click', () => {
          currentPlatform = tag.getAttribute('data-platform') || 'all';
          updateFilterTagActive(platformGroup, tag);
          filterAndRender();
        });
      });
    }

    const categoryGroup = document.getElementById('categoryFilters');
    if (categoryGroup) {
      categoryGroup.querySelectorAll('.filter-tag').forEach(tag => {
        tag.addEventListener('click', () => {
          currentCategory = tag.getAttribute('data-category') || 'all';
          updateFilterTagActive(categoryGroup, tag);
          filterAndRender();
        });
      });
    }

    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn && window.UNIVERSAL_QA_I18N) {
      langBtn.addEventListener('click', () => window.UNIVERSAL_QA_I18N.cycleLang());
    }

    // Modal input listeners
    ['modalIssuePhase', 'modalIssueCategory', 'modalIssuePlatform', 'modalIssueStatus', 'modalIssueTitle', 'modalIssueProblem', 'modalIssueSolution', 'modalIssueFiles', 'modalIssueScreenshots'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', updateCliPreview);
    });

    // Global Keybindings
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeScreenshot();
        closeNewIssueModal();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInput?.focus();
      }
    });
  }

  function applyUrlParameters() {
    try {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get('category');
      const platParam = params.get('platform');
      const statusParam = params.get('status');
      const searchParam = params.get('search') || params.get('q');
      const trackParam = params.get('phase') || params.get('track');

      if (trackParam) {
        currentTrackId = trackParam;
      }
      if (catParam) {
        currentCategory = catParam.toLowerCase();
        const categoryGroup = document.getElementById('categoryFilters');
        if (categoryGroup) {
          const targetTag = categoryGroup.querySelector(`[data-category="${currentCategory}"]`);
          if (targetTag) updateFilterTagActive(categoryGroup, targetTag);
        }
      }
      if (platParam) {
        currentPlatform = platParam.toLowerCase();
        const platformGroup = document.getElementById('platformFilters');
        if (platformGroup) {
          const targetTag = platformGroup.querySelector(`[data-platform="${currentPlatform}"]`);
          if (targetTag) updateFilterTagActive(platformGroup, targetTag);
        }
      }
      if (statusParam) {
        currentStatus = statusParam.toLowerCase();
        const statusGroup = document.getElementById('statusFilters');
        if (statusGroup) {
          const targetTag = statusGroup.querySelector(`[data-status="${currentStatus}"]`);
          if (targetTag) updateFilterTagActive(statusGroup, targetTag);
        }
      }
      if (searchParam) {
        searchQuery = searchParam;
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = searchParam;
      }
    } catch (e) {
      console.warn('Failed to parse URL parameters:', e);
    }
  }

  window.UNIVERSAL_QA = window.UNIVERSAL_QA || {};
  window.UNIVERSAL_QA.ENGINE = {
    initTheme,
    toggleTheme,
    switchTrack,
    renderTable,
    filterAndRender,
    sortTable,
    toggleHighlight,
    viewScreenshot,
    closeScreenshot,
    openNewIssueModal,
    closeNewIssueModal,
    updateCliPreview,
    copyCliCommand,
    copyJsSnippet,
    applyUrlParameters,
    toggleDetail
  };

  // Compatibility bindings
  window.MODO_QA = window.UNIVERSAL_QA.ENGINE;

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
    renderTrackTabs();
    applyUrlParameters();
    loadTrackData();
  });
})();
