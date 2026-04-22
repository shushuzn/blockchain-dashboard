// API base URL for backend
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api';

async function sendTelegram(msg) {
  if (!config.telegramToken || !config.telegramChatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${config.telegramToken}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: config.telegramChatId, text: msg, parse_mode: 'HTML' })
    });
  } catch(e) {}
}

async function sendEmail(subject, body) {
  // Email sending is now handled by backend API
  // This function is kept for backward compatibility
  console.log('Email alerts are handled by backend API');
}

async function triggerAlert(chain, metric, value, threshold) {
  if (!config.alertEnabled) return;
  const now = Date.now();
  const key = `${chain}_${metric}`;
  const cooldownMs = (config.cooldownMin || 5) * 60 * 1000;
  if (alertState[key] && (now - alertState[key]) < cooldownMs) return;
  alertState[key] = now;
  saveAlertState();

  const names = { gas: 'Priority Fee', baseFee: 'Base Fee', blobFee: 'Blob Fee' };
  const emojis = { gas: '⛽', baseFee: '📊', blobFee: '🟣' };
  const chainName = CHAINS.find(c => c.id === chain)?.name || chain;
  const msg = `${emojis[metric]} <b>${chainName} Alert</b>\n${names[metric]}: <b>${typeof value === 'number' ? value.toFixed(3) : value}</b> > threshold ${threshold}`;
  
  // Send Telegram alert directly from frontend
  await sendTelegram(msg);
  
  // Send alerts via backend API (includes email)
  try {
    await fetch(`${API_BASE_URL}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chain: chainName,
        metric,
        value,
        threshold,
        config: {
          telegramToken: config.telegramToken,
          telegramChatId: config.telegramChatId,
          smtpHost: config.smtpHost,
          smtpPort: config.smtpPort,
          smtpUser: config.smtpUser,
          smtpPass: config.smtpPass,
          smtpTo: config.smtpTo
        }
      })
    });
  } catch (error) {
    console.warn('Backend alert API failed:', error);
  }
  
  addAlertLog(chain, metric, value, threshold);
}

function addAlertLog(chain, metric, value, threshold) {
  const names = { gas: 'Priority Fee', baseFee: 'Base Fee', blobFee: 'Blob Fee' };
  config.alertLog.unshift({ time: new Date().toLocaleTimeString(), chain: CHAINS.find(c => c.id === chain)?.name || chain, metric: names[metric] || metric, value: typeof value === 'number' ? value.toFixed(3) : value, threshold: typeof threshold === 'number' ? threshold.toFixed(3) : threshold });
  if (config.alertLog.length > 50) config.alertLog.pop();
  saveConfig();
  renderAlertLog();
}

function renderAlertLog() {
  const count = config.alertLog.length;
  document.getElementById('alertCount').textContent = count + ' alert' + (count !== 1 ? 's' : '');
  document.getElementById('alertLogBody').innerHTML = count === 0
    ? '<div class="alert-empty">No alerts yet</div>'
    : config.alertLog.map(e => `<div class="alert-item"><span class="alert-time">${e.time}</span><span class="alert-chain">${e.chain}</span><span class="alert-msg"><span class="metric">${e.metric}</span> ${e.value} > ${e.threshold}</span></div>`).join('');
}

function openAlertModal() {
  document.getElementById('alertModal').style.display = 'flex';
  document.getElementById('alertEnabled').checked = config.alertEnabled;
  document.getElementById('telegramToken').value = config.telegramToken || '';
  document.getElementById('telegramChatId').value = config.telegramChatId || '';
  document.getElementById('smtpHost').value = config.smtpHost || 'smtp.gmail.com';
  document.getElementById('smtpPort').value = config.smtpPort || '587';
  document.getElementById('smtpUser').value = config.smtpUser || '';
  document.getElementById('smtpPass').value = config.smtpPass || '';
  document.getElementById('smtpTo').value = config.smtpTo || '';
  document.getElementById('cooldownMin').value = config.cooldownMin || 5;
  updateAlertToggle();
  document.getElementById('thresholdChains').innerHTML = CHAINS.map(c => `
    <div class="threshold-chain">
      <div class="threshold-chain-name">${c.name}</div>
      <div class="threshold-row"><label>Priority Fee &gt;</label><input id="th_${c.id}_gas" type="number" step="0.1" value="${config.thresholds[c.id]?.gas || 0}"><span style="font-size:0.62rem;color:#4b5563">gwei</span></div>
      <div class="threshold-row"><label>Base Fee &gt;</label><input id="th_${c.id}_baseFee" type="number" step="0.1" value="${config.thresholds[c.id]?.baseFee || 0}"><span style="font-size:0.62rem;color:#4b5563">gwei</span></div>
      ${c.hasBlob ? `<div class="threshold-row"><label>Blob Fee &gt;</label><input id="th_${c.id}_blobFee" type="number" step="0.001" value="${config.thresholds[c.id]?.blobFee || 0}"><span style="font-size:0.62rem;color:#4b5563">gwei</span></div>` : ''}
    </div>`).join('');
}

function updateAlertToggle() {
  const en = document.getElementById('alertEnabled').checked;
  document.getElementById('toggleTrack').style.background = en ? '#3f0f0f' : '#1f2937';
  document.getElementById('toggleThumb').style.background = en ? '#ef4444' : '#6b7280';
  document.getElementById('toggleThumb').style.left = en ? '16px' : '2px';
  document.getElementById('toggleLabel').textContent = en ? 'Enabled' : 'Disabled';
  document.getElementById('alertIndicator').className = 'alert-indicator ' + (en ? 'on' : 'off');
  document.getElementById('alertIndicator').textContent = en ? '🔔 Alerts On' : '🔔 Alerts Off';
}

function closeAlertModal() { document.getElementById('alertModal').style.display = 'none'; }

function saveAlertConfig() {
  config.alertEnabled = document.getElementById('alertEnabled').checked;
  config.telegramToken = document.getElementById('telegramToken').value.trim();
  config.telegramChatId = document.getElementById('telegramChatId').value.trim();
  config.smtpHost = document.getElementById('smtpHost').value.trim();
  config.smtpPort = document.getElementById('smtpPort').value.trim();
  config.smtpUser = document.getElementById('smtpUser').value.trim();
  config.smtpPass = document.getElementById('smtpPass').value;
  config.smtpTo = document.getElementById('smtpTo').value.trim();
  config.cooldownMin = parseInt(document.getElementById('cooldownMin').value) || 5;
  CHAINS.forEach(c => {
    config.thresholds[c.id] = {
      gas:    parseFloat(document.getElementById('th_' + c.id + '_gas').value) || 0,
      baseFee: parseFloat(document.getElementById('th_' + c.id + '_baseFee').value) || 0,
      ...(c.hasBlob ? { blobFee: parseFloat(document.getElementById('th_' + c.id + '_blobFee').value) || 0 } : {}),
    };
  });
  saveConfig();
  updateAlertToggle();
  closeAlertModal();
  refresh();
}

function clearAlertLog() {
  config.alertLog = [];
  alertState = {};
  saveConfig();
  saveAlertState();
  renderAlertLog();
}

async function testTelegram() {
  const token = document.getElementById('telegramToken').value.trim();
  const chatId = document.getElementById('telegramChatId').value.trim();
  const st = document.getElementById('telegramStatus');
  if (!token || !chatId) { st.textContent = 'Fill both fields'; st.style.color = '#f87171'; return; }
  st.textContent = 'Sending...'; st.style.color = '#6b7280';
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: '✅ MCM test', parse_mode: 'HTML' })
    }).then(r => r.json());
    st.textContent = r.ok ? 'Sent!' : r.description || 'Error';
    st.style.color = r.ok ? '#10b981' : '#f87171';
  } catch(e) { st.textContent = 'Network error'; st.style.color = '#f87171'; }
}

async function testEmail() {
  const user = document.getElementById('smtpUser').value.trim();
  const pass = document.getElementById('smtpPass').value;
  const to   = document.getElementById('smtpTo').value.trim();
  const host = document.getElementById('smtpHost').value.trim();
  const port = document.getElementById('smtpPort').value.trim();
  const st   = document.getElementById('emailStatus');
  if (!user || !pass || !to) { st.textContent = 'Fill all fields'; st.style.color = '#f87171'; return; }
  st.textContent = 'Sending...'; st.style.color = '#6b7280';
  
  // Use backend API for email test
  try {
    const response = await fetch(`${API_BASE_URL}/alerts/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'email',
        config: {
          smtpHost: host,
          smtpPort: port,
          smtpUser: user,
          smtpPass: pass,
          smtpTo: to
        }
      })
    });
    
    const result = await response.json();
    if (response.ok) {
      st.textContent = 'Sent!';
      st.style.color = '#10b981';
    } else {
      st.textContent = result.error || 'Error';
      st.style.color = '#f87171';
    }
  } catch(e) { 
    st.textContent = 'Error: ' + e.message; 
    st.style.color = '#f87171'; 
  }
}