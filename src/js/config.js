const HISTORY_KEY = 'mcm_history_v2';
const CONFIG_KEY = 'mcm_config_v3';
const ALERT_STATE_KEY = 'mcm_alert_state_v2';
const MAX_BYTES = 4 * 1024 * 1024;

const DEFAULT_CONFIG = {
  alertEnabled: false,
  telegramToken: '', telegramChatId: '',
  smtpHost: 'smtp.gmail.com', smtpPort: '587', smtpUser: '', smtpPass: '', smtpTo: '',
  cooldownMin: 5,
  thresholds: {
    ethereum: { gas: 50, baseFee: 50, blobFee: 0.1 },
    base:      { gas: 30, baseFee: 30, blobFee: 0.1 },
    arbitrum:  { gas: 5,  baseFee: 5,  blobFee: 0 },
    optimism:  { gas: 5,  baseFee: 5,  blobFee: 0 },
  },
  alertLog: [],
};

let config = {};
let alertState = {};
let history = {};

function loadConfig() {
  try {
    const s = localStorage.getItem(CONFIG_KEY);
    if (s) {
      const p = JSON.parse(s);
      config = { ...DEFAULT_CONFIG, ...p, thresholds: { ...DEFAULT_CONFIG.thresholds, ...(p.thresholds || {}) } };
      CHAINS.forEach(c => { config.thresholds[c.id] = { ...DEFAULT_CONFIG.thresholds[c.id], ...config.thresholds[c.id] }; });
    } else { config = { ...DEFAULT_CONFIG }; }
  } catch(e) { config = { ...DEFAULT_CONFIG }; }
}

function saveConfig() {
  try {
    const d = JSON.stringify(config);
    if (d.length > MAX_BYTES) d = d.slice(0, MAX_BYTES);
    localStorage.setItem(CONFIG_KEY, d);
  } catch(e) {}
}

function loadHistory() {
  try {
    const s = localStorage.getItem(HISTORY_KEY);
    if (s) {
      history = JSON.parse(s);
      CHAINS.forEach(c => { if (!history[c.id]) history[c.id] = []; });
    } else { CHAINS.forEach(c => { history[c.id] = []; }); }
  } catch(e) { CHAINS.forEach(c => { history[c.id] = []; }); }
}

function trimHistory(chainId) {
  const maxPoints = Math.floor((7 * 24 * 60) / sampleInterval) + 20;
  if (history[chainId].length > maxPoints) {
    history[chainId] = history[chainId].slice(-maxPoints);
  }
}

function addHistoryPoint(chainId, point) {
  if (!history[chainId]) history[chainId] = [];
  const arr = history[chainId];
  const bucket = Math.floor(point.t / (sampleInterval * 60 * 1000)) * (sampleInterval * 60 * 1000);
  const existing = arr.findIndex(p => Math.floor(p.t / (sampleInterval * 60 * 1000)) * (sampleInterval * 60 * 1000) === bucket);
  if (existing >= 0) {
    arr[existing] = point;
  } else {
    arr.push(point);
    trimHistory(chainId);
  }
  persistHistory();
}

function persistHistory() {
  try {
    const d = JSON.stringify(history);
    if (d.length > MAX_BYTES) {
      const chainIds = Object.keys(history).sort((a,b) => {
        const aOld = history[a][0]?.t || 0;
        const bOld = history[b][0]?.t || 0;
        return aOld - bOld;
      });
      for (const cid of chainIds) {
        history[cid] = history[cid].slice(Math.ceil(history[cid].length * 0.2));
        const d2 = JSON.stringify(history);
        if (d2.length <= MAX_BYTES * 0.9) break;
      }
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch(e) {
    CHAINS.forEach(c => { if (history[c.id]) history[c.id] = history[c.id].slice(Math.ceil(history[c.id].length * 0.3)); });
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch(e2) {}
  }
}

function loadAlertState() {
  try { alertState = JSON.parse(localStorage.getItem(ALERT_STATE_KEY)) || {}; } catch(e) { alertState = {}; }
}

function saveAlertState() {
  try { localStorage.setItem(ALERT_STATE_KEY, JSON.stringify(alertState)); } catch(e) {}
}

function getStorageUsage() {
  let total = 0;
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith('mcm_')) {
      try { total += localStorage.getItem(k).length * 2; } catch(e) {}
    }
  }
  return total;
}

function updateStorageBar() {
  const used = getStorageUsage();
  const mb = (used / 1024 / 1024).toFixed(2);
  document.getElementById('storageUsed').textContent = mb + ' MB / 5 MB';
  document.getElementById('storageFill').style.width = Math.min(100, (used / (5 * 1024 * 1024) * 100)) + '%';
  const chainPts = history[activeChart] || [];
  document.getElementById('dataPointsInfo').textContent = chainPts.length + ' data points';
}
