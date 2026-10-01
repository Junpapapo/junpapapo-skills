/**
 * Modo QA Master Tracker - Floating Scratchpad / Sticky Memo Widget
 * Cross-page persistence via localStorage ('MODO_QA_SCRATCHPAD_V1')
 * Supports Bold, 4-color Highlighter, 5-color Post-it Themes, Checklists, Tabs, and Dragging.
 * Zero-dependency, under 350 lines strictly adhering to Proactive Code Architect.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'MODO_QA_SCRATCHPAD_V1';

  const THEMES = {
    yellow: { id: 'yellow', name: 'Classic Yellow', bg: '#FEF9C3', headerBg: '#FEF08A', border: '#FACC15', text: '#422006' },
    green: { id: 'green', name: 'Mint Green', bg: '#DCFCE7', headerBg: '#BBF7D0', border: '#4ADE80', text: '#052E16' },
    purple: { id: 'purple', name: 'Lavender Purple', bg: '#F3E8FF', headerBg: '#E9D5FF', border: '#C084FC', text: '#3B0764' },
    peach: { id: 'peach', name: 'Peach Coral', bg: '#FFEDD5', headerBg: '#FED7AA', border: '#FB923C', text: '#431407' },
    dark: { id: 'dark', name: 'Dark Slate', bg: '#18181B', headerBg: '#27272A', border: '#3F3F46', text: '#F4F4F5' },
  };

  const HIGHLIGHTS = ['#FFE066', '#B2F2BB', '#FFA8A8', '#A5D8FF'];

  const DEFAULT_STATE = {
    isOpen: false,
    isMinimized: false,
    x: 80,
    y: 90,
    width: 360,
    height: 380,
    activeTabId: 'tab-1',
    tabs: [{ id: 'tab-1', title: '메모 1', theme: 'yellow', content: '<p><b>📌 QA 임시 작업 메모</b></p><p>테스트 중 발견된 버그나 임시 아이디어를 자유롭게 메모하세요.</p>' }]
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : { ...DEFAULT_STATE };
    } catch { return { ...DEFAULT_STATE }; }
  }

  function saveState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  class QaMemoWidget {
    constructor() {
      this.state = loadState();
      this.debounceTimer = null;
      this.isDragging = false;
      this.dragOffset = { x: 0, y: 0 };
      this.isResizing = false;
      this.resizeStart = { x: 0, y: 0, w: 0, h: 0 };
      this.init();
    }

    init() {
      if (document.getElementById('qaFloatingMemoWidget')) return;
      if (!document.getElementById('qa-memo-link')) {
        const link = document.createElement('link');
        link.id = 'qa-memo-link';
        link.rel = 'stylesheet';
        link.href = 'css/qa_memo.css?v=1.1';
        document.head.appendChild(link);
      }
      this.renderWidget();
      window.addEventListener('beforeunload', () => this.persistImmediate());
      if (this.state.isOpen) this.showWidget();
    }

    renderWidget() {
      const widget = document.createElement('div');
      widget.id = 'qaFloatingMemoWidget';
      widget.className = `qa-memo-widget ${this.state.isMinimized ? 'minimized' : ''}`;
      widget.style.cssText = `left:${this.state.x}px; top:${this.state.y}px; width:${this.state.width || 360}px; height:${this.state.height || 380}px; display:${this.state.isOpen ? 'flex' : 'none'};`;

      const activeTab = this.getActiveTab();
      this.applyTheme(widget, activeTab.theme);

      widget.innerHTML = `
        <div class="qa-memo-header" id="qaMemoHeader">
          <div class="qa-memo-title-row">
            <span>📝</span>
            <span id="qaMemoHeaderTitle">${this.escape(activeTab.title || 'QA Scratchpad')}</span>
          </div>
          <div class="qa-memo-header-actions">
            <button class="qa-memo-head-btn" id="qaMemoBtnMin" title="최소화/복원">${this.state.isMinimized ? '□' : '—'}</button>
            <button class="qa-memo-head-btn" id="qaMemoBtnClose" title="닫기">✕</button>
          </div>
        </div>
        <div class="qa-memo-tabs-bar" id="qaMemoTabsBar">
          ${this.renderTabsHtml()}
          <button type="button" class="qa-memo-tab-add" id="qaMemoBtnAddTab" title="새 메모 탭 추가">+</button>
        </div>
        <div class="qa-memo-toolbar">
          <div class="qa-memo-tool-group">
            <button type="button" class="qa-memo-tool-btn" id="qaMemoBtnBold" title="굵게 (Ctrl+B)"><b>B</b></button>
            ${HIGHLIGHTS.map(c => `<button type="button" class="qa-memo-tool-btn" data-hl="${c}" style="background:${c}; width:20px; padding:0;" title="형광펜"></button>`).join('')}
            <button type="button" class="qa-memo-tool-btn" id="qaMemoBtnClearHl" title="형광펜 지우기" style="font-size:10px;">✕</button>
            <button type="button" class="qa-memo-tool-btn" id="qaMemoBtnCheck" title="체크박스 삽입">☑️</button>
          </div>
          <div class="qa-memo-tool-group">
            ${Object.values(THEMES).map(th => `<div class="qa-memo-color-dot ${th.id === activeTab.theme ? 'active' : ''}" data-th="${th.id}" style="background:${th.headerBg};" title="${th.name}"></div>`).join('')}
            <button type="button" class="qa-memo-tool-btn" id="qaMemoBtnCopy" title="전체 복사" style="margin-left:4px;">📋</button>
            <button type="button" class="qa-memo-tool-btn" id="qaMemoBtnClear" title="비우기">🗑️</button>
          </div>
        </div>
        <div class="qa-memo-body" id="qaMemoBody" contenteditable="true" data-placeholder="QA 임시 메모, 검증 시나리오, 오류 로그를 작성하세요...">${activeTab.content || ''}</div>
        <div class="qa-memo-footer">
          <span id="qaMemoWordCount">0 chars</span>
          <span id="qaMemoSaveBadge" style="color: #0CA678; font-weight: 700;">● 저장됨</span>
          <div class="qa-memo-resizer" id="qaMemoResizer" title="드래그하여 크기 조절 (더블클릭 시 기본 크기)"></div>
        </div>
      `;

      document.body.appendChild(widget);
      this.bindEvents();
      this.updateWordCount();
    }

    renderTabsHtml() {
      return this.state.tabs.map(tab => `
        <div class="qa-memo-tab ${tab.id === this.state.activeTabId ? 'active' : ''}" data-tab="${tab.id}">
          <span class="qa-memo-tab-title">${this.escape(tab.title)}</span>
          ${this.state.tabs.length > 1 ? `<span class="qa-memo-tab-close" data-del="${tab.id}" title="삭제">✕</span>` : ''}
        </div>`).join('');
    }

    applyTheme(el, themeId) {
      const th = THEMES[themeId] || THEMES.yellow;
      ['bg', 'headerBg', 'border', 'text'].forEach(k => el.style.setProperty(`--memo-${k === 'headerBg' ? 'header-bg' : k}`, th[k]));
    }

    getActiveTab() {
      let tab = this.state.tabs.find(t => t.id === this.state.activeTabId);
      if (!tab) { tab = this.state.tabs[0] || { id: 'tab-1', title: '메모 1', theme: 'yellow', content: '' }; this.state.activeTabId = tab.id; }
      return tab;
    }

    bindEvents() {
      const widget = document.getElementById('qaFloatingMemoWidget');
      const header = document.getElementById('qaMemoHeader');
      const body = document.getElementById('qaMemoBody');

      // Dragging via pointer events
      header.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.qa-memo-head-btn')) return;
        this.isDragging = true;
        header.setPointerCapture(e.pointerId);
        const rect = widget.getBoundingClientRect();
        this.dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      });
      header.addEventListener('pointermove', (e) => {
        if (!this.isDragging) return;
        const nx = Math.max(10, Math.min(window.innerWidth - widget.offsetWidth - 10, e.clientX - this.dragOffset.x));
        const ny = Math.max(10, Math.min(window.innerHeight - 40, e.clientY - this.dragOffset.y));
        widget.style.left = `${nx}px`;
        widget.style.top = `${ny}px`;
        this.state.x = nx;
        this.state.y = ny;
      });
      header.addEventListener('pointerup', () => {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.persistImmediate();
      });

      // Resizing via bottom-right grip
      const resizer = document.getElementById('qaMemoResizer');
      if (resizer) {
        resizer.addEventListener('pointerdown', (e) => {
          if (this.state.isMinimized) return;
          this.isResizing = true;
          resizer.setPointerCapture(e.pointerId);
          this.resizeStart = { x: e.clientX, y: e.clientY, w: widget.offsetWidth, h: widget.offsetHeight };
          e.stopPropagation();
        });
        resizer.addEventListener('pointermove', (e) => {
          if (!this.isResizing) return;
          const nw = Math.max(260, Math.min(window.innerWidth - widget.offsetLeft - 10, this.resizeStart.w + (e.clientX - this.resizeStart.x)));
          const nh = Math.max(180, Math.min(window.innerHeight - widget.offsetTop - 10, this.resizeStart.h + (e.clientY - this.resizeStart.y)));
          widget.style.width = `${nw}px`;
          widget.style.height = `${nh}px`;
          this.state.width = nw;
          this.state.height = nh;
        });
        const stopResize = () => { if (this.isResizing) { this.isResizing = false; this.persistImmediate(); } };
        resizer.addEventListener('pointerup', stopResize);
        resizer.addEventListener('pointercancel', stopResize);
        resizer.ondblclick = () => {
          widget.style.width = '360px'; widget.style.height = '380px';
          this.state.width = 360; this.state.height = 380;
          this.persistImmediate();
        };
      }

      // Window controls
      document.getElementById('qaMemoBtnClose').onclick = () => this.hideWidget();
      document.getElementById('qaMemoBtnMin').onclick = () => this.toggleMinimize();

      // Editor events
      body.addEventListener('input', () => { this.setSaveStatus('● 작성 중...', '#F59E0B'); this.updateWordCount(); this.debounceSave(); });
      body.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') { e.preventDefault(); document.execCommand('bold', false, null); }
      });

      // Tool buttons
      document.getElementById('qaMemoBtnBold').onmousedown = (e) => e.preventDefault();
      document.getElementById('qaMemoBtnBold').onclick = () => { body.focus(); document.execCommand('bold'); this.debounceSave(); };
      widget.querySelectorAll('[data-hl]').forEach(btn => {
        btn.onmousedown = (e) => e.preventDefault();
        btn.onclick = () => {
          const wasActive = btn.classList.contains('active');
          widget.querySelectorAll('[data-hl]').forEach(b => b.classList.remove('active'));
          body.focus();
          if (!wasActive) {
            btn.classList.add('active');
            document.execCommand('hiliteColor', false, btn.dataset.hl);
          } else {
            document.execCommand('hiliteColor', false, 'transparent');
          }
          this.debounceSave();
        };
      });
      const btnClearHl = document.getElementById('qaMemoBtnClearHl');
      btnClearHl.onmousedown = (e) => e.preventDefault();
      btnClearHl.onclick = () => {
        widget.querySelectorAll('[data-hl]').forEach(b => b.classList.remove('active'));
        body.focus();
        document.execCommand('hiliteColor', false, 'transparent');
        this.debounceSave();
      };
      document.getElementById('qaMemoBtnCheck').onclick = () => { body.focus(); document.execCommand('insertHTML', false, '<div>☑️ <span>체크 항목</span></div><br/>'); this.debounceSave(); };
      widget.querySelectorAll('[data-th]').forEach(dot => { dot.onclick = () => this.changeTheme(dot.dataset.th); });
      document.getElementById('qaMemoBtnCopy').onclick = () => {
        if (navigator.clipboard) navigator.clipboard.writeText(body.innerText || '').then(() => this.setSaveStatus('📋 복사 완료!', '#0CA678'));
      };
      document.getElementById('qaMemoBtnClear').onclick = async () => {
        let ok = false;
        if (window.QA_DIALOG) {
          ok = await window.QA_DIALOG.confirm({
            title: '메모 비우기',
            message: '현재 탭의 메모를 모두 비우시겠습니까? 작성 중인 내용이 지워집니다.',
            confirmText: '비우기',
            cancelText: '취소',
            danger: true
          });
        }
        if (ok) {
          widget.querySelectorAll('[data-hl]').forEach(b => b.classList.remove('active'));
          body.innerHTML = '';
          this.debounceSave();
          this.updateWordCount();
        }
      };

      this.bindTabEvents();
    }

    bindTabEvents() {
      const bar = document.getElementById('qaMemoTabsBar');
      bar.querySelectorAll('.qa-memo-tab').forEach(tabEl => {
        tabEl.onclick = (e) => {
          if (e.target.dataset.del) { this.deleteTab(e.target.dataset.del); return; }
          this.switchTab(tabEl.dataset.tab);
        };
        tabEl.ondblclick = async () => {
          const tab = this.state.tabs.find(t => t.id === tabEl.dataset.tab);
          if (!tab) return;
          let next = null;
          if (window.QA_DIALOG) {
            next = await window.QA_DIALOG.prompt({
              title: '탭 이름 변경',
              message: '새로운 메모 탭 이름을 입력하세요:',
              defaultValue: tab.title,
              confirmText: '변경',
              cancelText: '취소'
            });
          }
          if (next && next.trim()) {
            tab.title = next.trim();
            this.refreshTabs();
            this.persistImmediate();
          }
        };
      });
      document.getElementById('qaMemoBtnAddTab').onclick = () => this.addTab();
    }

    refreshTabs() {
      const bar = document.getElementById('qaMemoTabsBar');
      if (!bar) return;
      bar.innerHTML = `${this.renderTabsHtml()}<button type="button" class="qa-memo-tab-add" id="qaMemoBtnAddTab" title="새 메모 탭 추가">+</button>`;
      this.bindTabEvents();
      const tab = this.getActiveTab();
      const titleEl = document.getElementById('qaMemoHeaderTitle');
      if (titleEl) titleEl.textContent = tab.title || 'QA Scratchpad';
    }

    switchTab(tabId) {
      this.syncContent();
      this.state.activeTabId = tabId;
      const tab = this.getActiveTab();
      const body = document.getElementById('qaMemoBody');
      if (body) body.innerHTML = tab.content || '';
      const widget = document.getElementById('qaFloatingMemoWidget');
      this.applyTheme(widget, tab.theme);
      widget.querySelectorAll('[data-th]').forEach(dot => dot.classList.toggle('active', dot.dataset.th === tab.theme));
      this.refreshTabs();
      this.updateWordCount();
      this.persistImmediate();
    }

    addTab() {
      this.syncContent();
      const newId = `tab-${Date.now()}`;
      this.state.tabs.push({ id: newId, title: `메모 ${this.state.tabs.length + 1}`, theme: 'yellow', content: '' });
      this.switchTab(newId);
    }

    async deleteTab(tabId) {
      if (this.state.tabs.length <= 1) return;
      let ok = false;
      if (window.QA_DIALOG) {
        ok = await window.QA_DIALOG.confirm({
          title: '메모 탭 삭제',
          message: '이 메모 탭을 삭제하시겠습니까? 탭 안의 내용이 영구 삭제됩니다.',
          confirmText: '삭제',
          cancelText: '취소',
          danger: true
        });
      }
      if (!ok) return;
      this.state.tabs = this.state.tabs.filter(t => t.id !== tabId);
      if (this.state.activeTabId === tabId) this.state.activeTabId = this.state.tabs[0].id;
      this.switchTab(this.state.activeTabId);
    }

    changeTheme(themeId) {
      this.getActiveTab().theme = themeId;
      const widget = document.getElementById('qaFloatingMemoWidget');
      this.applyTheme(widget, themeId);
      widget.querySelectorAll('[data-th]').forEach(dot => dot.classList.toggle('active', dot.dataset.th === themeId));
      this.persistImmediate();
    }

    syncContent() {
      const body = document.getElementById('qaMemoBody');
      if (body) this.getActiveTab().content = body.innerHTML;
    }

    debounceSave() {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.syncContent();
        saveState(this.state);
        this.setSaveStatus('● 저장됨', '#0CA678');
      }, 350);
    }

    persistImmediate() {
      this.syncContent();
      saveState(this.state);
    }

    setSaveStatus(text, color) {
      const badge = document.getElementById('qaMemoSaveBadge');
      if (badge) { badge.style.color = color; badge.textContent = text; }
    }

    updateWordCount() {
      const body = document.getElementById('qaMemoBody');
      const counter = document.getElementById('qaMemoWordCount');
      if (!body || !counter) return;
      counter.textContent = `${(body.innerText || '').trim().length} 글자`;
    }

    toggleMinimize() {
      const widget = document.getElementById('qaFloatingMemoWidget');
      const minBtn = document.getElementById('qaMemoBtnMin');
      this.state.isMinimized = !this.state.isMinimized;
      widget.classList.toggle('minimized', this.state.isMinimized);
      if (!this.state.isMinimized) {
        widget.style.width = `${this.state.width || 360}px`;
        widget.style.height = `${this.state.height || 380}px`;
      }
      if (minBtn) minBtn.textContent = this.state.isMinimized ? '□' : '—';
      this.persistImmediate();
    }

    showWidget() {
      this.state.isOpen = true;
      const widget = document.getElementById('qaFloatingMemoWidget');
      if (widget) {
        widget.style.display = 'flex';
        if (!this.state.isMinimized) {
          widget.style.width = `${this.state.width || 360}px`;
          widget.style.height = `${this.state.height || 380}px`;
        }
      }
      document.querySelectorAll('.nav-memo-btn').forEach(btn => btn.classList.add('active'));
      this.persistImmediate();
    }

    hideWidget() {
      this.state.isOpen = false;
      const widget = document.getElementById('qaFloatingMemoWidget');
      if (widget) widget.style.display = 'none';
      document.querySelectorAll('.nav-memo-btn').forEach(btn => btn.classList.remove('active'));
      this.persistImmediate();
    }

    toggle() { this.state.isOpen ? this.hideWidget() : this.showWidget(); }

    escape(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }

  function initMemo() { window.QA_MEMO = new QaMemoWidget(); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initMemo);
  else initMemo();
})();
