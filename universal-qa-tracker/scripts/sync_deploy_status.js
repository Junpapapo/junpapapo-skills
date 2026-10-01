/**
 * Modo QA Master - Deploy Registry Sync CLI
 * 
 * Synchronizes deploy statuses from `qa_deploy_registry.js` / `qa_deploy_registry.json`
 * into `phase3_v1_1_backlog.js` and `qa_manifest.js`.
 * 
 * Usage:
 *   node docs/02_Guides/internal_qa_issue_tracker/scripts/sync_deploy_status.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const BASE_DIR = path.resolve(__dirname, '..');
const REGISTRY_JSON = path.join(BASE_DIR, 'data', 'qa_deploy_registry.json');
const REGISTRY_JS = path.join(BASE_DIR, 'data', 'qa_deploy_registry.js');
const BACKLOG_JS = path.join(BASE_DIR, 'data', 'phase3_v1_1_backlog.js');

function loadRegistry() {
  if (fs.existsSync(REGISTRY_JSON)) {
    return JSON.parse(fs.readFileSync(REGISTRY_JSON, 'utf8'));
  }
  if (fs.existsSync(REGISTRY_JS)) {
    const raw = fs.readFileSync(REGISTRY_JS, 'utf8');
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(raw, sandbox);
    return sandbox.window.MODO_QA_DEPLOY_REGISTRY || {};
  }
  throw new Error('Could not find qa_deploy_registry.json or qa_deploy_registry.js');
}

function loadBacklog() {
  const raw = fs.readFileSync(BACKLOG_JS, 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(raw, sandbox);
  return sandbox.window.MODO_QA_PHASE3 || sandbox.window.PHASE3_V1_1_BACKLOG || [];
}

function sync() {
  console.log('🔄 Loading deploy registry...');
  const registry = loadRegistry();
  const keys = Object.keys(registry);
  console.log(`Found ${keys.length} items in deploy registry.`);

  // 1. Sync into phase3_v1_1_backlog.js
  if (fs.existsSync(BACKLOG_JS)) {
    console.log('🔄 Updating phase3_v1_1_backlog.js...');
    const items = loadBacklog();

    let updatedCount = 0;
    items.forEach(item => {
      const key = `phase3_${item.id}`;
      const rec = registry[key] || registry[String(item.id)];
      if (rec) {
        if (rec.android) {
          item.deployedAos = !!rec.android.deployed;
          item.deployedVersionAos = rec.android.version || '';
          item.deployedDateAos = rec.android.deployedAt || '';
        }
        if (rec.ios) {
          item.deployedIos = !!rec.ios.deployed;
          item.deployedVersionIos = rec.ios.version || '';
          item.deployedDateIos = rec.ios.deployedAt || '';
        }
        updatedCount++;
      }
    });

    const header = `/**\n * Modo QA Master Dataset - Phase 3: Production V1.1 & Feature Backlog (정식 출시/V1.1 트랙)\n * Total Issues: ${items.length} Items (정식 출시 후 유지보수/신규 기능 트랙)\n */\nwindow.MODO_QA_PHASE3 = `;
    fs.writeFileSync(BACKLOG_JS, header + JSON.stringify(items, null, 2) + ';\n', 'utf8');
    console.log(`✅ phase3_v1_1_backlog.js successfully synchronized (${updatedCount} items updated).`);
  }

  // 2. Ensure qa_deploy_registry.js & json are identical
  fs.writeFileSync(REGISTRY_JSON, JSON.stringify(registry, null, 2), 'utf8');
  const jsHeader = `/**\n * Modo QA Master - Deploy Registry (Permanent Record)\n * Auto-generated & synced with User Deploy Actions\n */\nwindow.MODO_QA_DEPLOY_REGISTRY = ${JSON.stringify(registry, null, 2)};\n`;
  fs.writeFileSync(REGISTRY_JS, jsHeader, 'utf8');

  console.log('🎉 Deploy status synchronization complete!');
}

sync();
