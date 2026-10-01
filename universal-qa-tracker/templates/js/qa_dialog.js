/**
 * Universal QA Issue Tracker - Premium Custom Dialog System
 * Replaces native browser popups (alert, confirm, prompt) with sleek, accessible custom modals.
 * Complies with GEMINI.md No Native Browser Popups directive.
 */

(function () {
  'use strict';

  // Inject Styles for Custom Dialogs
  const DIALOG_CSS = `
    .qa-dialog-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.58);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      opacity: 0;
      transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .qa-dialog-overlay.active {
      opacity: 1;
    }
    .qa-dialog-card {
      background: var(--bg-surface, #FFFFFF);
      color: var(--text-primary, #1C1C1E);
      border: 1px solid var(--border, rgba(0,0,0,0.12));
      border-radius: 14px;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.1);
      transform: scale(0.94) translateY(8px);
      transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .qa-dialog-overlay.active .qa-dialog-card {
      transform: scale(1) translateY(0);
    }
    .qa-dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px 12px;
      border-bottom: 1px solid var(--border-subtle, rgba(0,0,0,0.06));
    }
    .qa-dialog-title-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .qa-dialog-icon {
      font-size: 17px;
      line-height: 1;
    }
    .qa-dialog-title {
      font-size: 15px;
      font-weight: 800;
      margin: 0;
      color: var(--text-primary, #1C1C1E);
      letter-spacing: -0.3px;
    }
    .qa-dialog-close-btn {
      background: none;
      border: none;
      font-size: 20px;
      color: var(--text-muted, #8E8E93);
      cursor: pointer;
      line-height: 1;
      padding: 4px;
      border-radius: 6px;
      transition: color 0.15s, background 0.15s;
    }
    .qa-dialog-close-btn:hover {
      color: var(--text-primary, #1C1C1E);
      background: var(--bg-subtle, rgba(0,0,0,0.05));
    }
    .qa-dialog-body {
      padding: 16px 20px;
      font-size: 13.5px;
      line-height: 1.55;
      color: var(--text-secondary, #3A3A3C);
    }
    .qa-dialog-input {
      width: 100%;
      margin-top: 12px;
      padding: 10px 14px;
      font-size: 13.5px;
      border: 1px solid var(--border, #D1D1D6);
      border-radius: 8px;
      background: var(--bg-primary, #F8F9FA);
      color: var(--text-primary, #1C1C1E);
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .qa-dialog-input:focus {
      border-color: var(--ios-blue, #007AFF);
      box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.15);
      background: var(--bg-surface, #FFFFFF);
    }
    .qa-dialog-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 20px 16px;
      background: var(--bg-subtle, rgba(0,0,0,0.02));
      border-top: 1px solid var(--border-subtle, rgba(0,0,0,0.06));
    }
    .qa-dialog-btn {
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 72px;
    }
    .qa-dialog-btn-cancel {
      background: var(--bg-surface, #FFFFFF);
      color: var(--text-secondary, #3A3A3C);
      border-color: var(--border, #D1D1D6);
    }
    .qa-dialog-btn-cancel:hover {
      background: var(--bg-subtle, #F2F2F7);
      color: var(--text-primary, #1C1C1E);
    }
    .qa-dialog-btn-confirm {
      background: var(--ios-blue, #007AFF);
      color: #FFFFFF;
    }
    .qa-dialog-btn-confirm:hover {
      filter: brightness(1.08);
      box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
    }
    .qa-dialog-btn-danger {
      background: var(--ios-red, #FF3B30);
      color: #FFFFFF;
    }
    .qa-dialog-btn-danger:hover {
      filter: brightness(1.08);
      box-shadow: 0 2px 8px rgba(255, 59, 48, 0.3);
    }
  `;

  let styleInjected = false;
  function ensureStyles() {
    if (styleInjected) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'qaDialogStyles';
    styleEl.textContent = DIALOG_CSS;
    document.head.appendChild(styleEl);
    styleInjected = true;
  }

  function createDialogDom() {
    ensureStyles();
    const overlay = document.createElement('div');
    overlay.className = 'qa-dialog-overlay';
    overlay.id = 'qaDialogOverlay';
    overlay.innerHTML = `
      <div class="qa-dialog-card" role="dialog" aria-modal="true">
        <div class="qa-dialog-header">
          <div class="qa-dialog-title-wrap">
            <span class="qa-dialog-icon" id="qaDialogIcon">💬</span>
            <h4 class="qa-dialog-title" id="qaDialogTitle">알림</h4>
          </div>
          <button type="button" class="qa-dialog-close-btn" id="qaDialogCloseBtn" aria-label="닫기">&times;</button>
        </div>
        <div class="qa-dialog-body" id="qaDialogBody">
          <p id="qaDialogMessage" style="margin:0;"></p>
          <input type="text" class="qa-dialog-input" id="qaDialogInput" style="display:none;" />
        </div>
        <div class="qa-dialog-footer">
          <button type="button" class="qa-dialog-btn qa-dialog-btn-cancel" id="qaDialogBtnCancel" style="display:none;">취소</button>
          <button type="button" class="qa-dialog-btn qa-dialog-btn-confirm" id="qaDialogBtnConfirm">확인</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  function getDialogElements() {
    let overlay = document.getElementById('qaDialogOverlay');
    if (!overlay) {
      overlay = createDialogDom();
    }
    return {
      overlay,
      icon: document.getElementById('qaDialogIcon'),
      title: document.getElementById('qaDialogTitle'),
      message: document.getElementById('qaDialogMessage'),
      input: document.getElementById('qaDialogInput'),
      btnCancel: document.getElementById('qaDialogBtnCancel'),
      btnConfirm: document.getElementById('qaDialogBtnConfirm'),
      btnClose: document.getElementById('qaDialogCloseBtn')
    };
  }

  /**
   * Custom Alert Dialog
   * @param {Object|string} options
   * @returns {Promise<void>}
   */
  function alert(options) {
    return new Promise(resolve => {
      const opts = typeof options === 'string' ? { message: options } : (options || {});
      const els = getDialogElements();

      els.icon.textContent = opts.icon || 'ℹ️';
      els.title.textContent = opts.title || '알림';
      els.message.textContent = opts.message || '';
      els.input.style.display = 'none';
      els.btnCancel.style.display = 'none';
      els.btnConfirm.textContent = opts.confirmText || '확인';
      els.btnConfirm.className = 'qa-dialog-btn qa-dialog-btn-confirm';

      const cleanup = () => {
        els.overlay.classList.remove('active');
        setTimeout(() => {
          els.overlay.style.display = 'none';
        }, 180);
        document.removeEventListener('keydown', onKeyDown);
      };

      const closeDialog = () => {
        cleanup();
        resolve();
      };

      const onKeyDown = (e) => {
        if (e.key === 'Escape' || e.key === 'Enter') {
          e.preventDefault();
          closeDialog();
        }
      };

      els.btnConfirm.onclick = closeDialog;
      els.btnClose.onclick = closeDialog;
      els.overlay.onclick = (e) => {
        if (e.target === els.overlay) closeDialog();
      };

      document.addEventListener('keydown', onKeyDown);
      els.overlay.style.display = 'flex';
      requestAnimationFrame(() => {
        els.overlay.classList.add('active');
        els.btnConfirm.focus();
      });
    });
  }

  /**
   * Custom Confirm Dialog
   * @param {Object} options
   * @returns {Promise<boolean>}
   */
  function confirm(options) {
    return new Promise(resolve => {
      const opts = typeof options === 'string' ? { message: options } : (options || {});
      const els = getDialogElements();

      const isDanger = !!opts.danger;
      els.icon.textContent = opts.icon || (isDanger ? '⚠️' : '❓');
      els.title.textContent = opts.title || (isDanger ? '주의 및 확인' : '확인');
      els.message.textContent = opts.message || '';
      els.input.style.display = 'none';

      els.btnCancel.style.display = 'inline-flex';
      els.btnCancel.textContent = opts.cancelText || '취소';

      els.btnConfirm.textContent = opts.confirmText || (isDanger ? '삭제' : '확인');
      els.btnConfirm.className = isDanger ? 'qa-dialog-btn qa-dialog-btn-danger' : 'qa-dialog-btn qa-dialog-btn-confirm';

      const cleanup = () => {
        els.overlay.classList.remove('active');
        setTimeout(() => {
          els.overlay.style.display = 'none';
        }, 180);
        document.removeEventListener('keydown', onKeyDown);
      };

      const onConfirm = () => {
        cleanup();
        resolve(true);
      };

      const onCancel = () => {
        cleanup();
        resolve(false);
      };

      const onKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          onConfirm();
        }
      };

      els.btnConfirm.onclick = onConfirm;
      els.btnCancel.onclick = onCancel;
      els.btnClose.onclick = onCancel;
      els.overlay.onclick = (e) => {
        if (e.target === els.overlay) onCancel();
      };

      document.addEventListener('keydown', onKeyDown);
      els.overlay.style.display = 'flex';
      requestAnimationFrame(() => {
        els.overlay.classList.add('active');
        (isDanger ? els.btnCancel : els.btnConfirm).focus();
      });
    });
  }

  /**
   * Custom Prompt Dialog
   * @param {Object} options
   * @returns {Promise<string|null>}
   */
  function prompt(options) {
    return new Promise(resolve => {
      const opts = typeof options === 'string' ? { message: options } : (options || {});
      const els = getDialogElements();

      els.icon.textContent = opts.icon || '✏️';
      els.title.textContent = opts.title || '입력';
      els.message.textContent = opts.message || '';

      els.input.style.display = 'block';
      els.input.value = opts.defaultValue || '';
      els.input.placeholder = opts.placeholder || '';

      els.btnCancel.style.display = 'inline-flex';
      els.btnCancel.textContent = opts.cancelText || '취소';

      els.btnConfirm.textContent = opts.confirmText || '확인';
      els.btnConfirm.className = 'qa-dialog-btn qa-dialog-btn-confirm';

      const cleanup = () => {
        els.overlay.classList.remove('active');
        setTimeout(() => {
          els.overlay.style.display = 'none';
        }, 180);
        document.removeEventListener('keydown', onKeyDown);
      };

      const onConfirm = () => {
        const val = els.input.value;
        cleanup();
        resolve(val);
      };

      const onCancel = () => {
        cleanup();
        resolve(null);
      };

      const onKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          onConfirm();
        }
      };

      els.btnConfirm.onclick = onConfirm;
      els.btnCancel.onclick = onCancel;
      els.btnClose.onclick = onCancel;
      els.overlay.onclick = (e) => {
        if (e.target === els.overlay) onCancel();
      };

      document.addEventListener('keydown', onKeyDown);
      els.overlay.style.display = 'flex';
      requestAnimationFrame(() => {
        els.overlay.classList.add('active');
        els.input.focus();
        els.input.select();
      });
    });
  }

  // Global Dialog API
  window.QA_DIALOG = {
    alert,
    confirm,
    prompt
  };

})();
