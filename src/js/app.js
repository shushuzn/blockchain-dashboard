let activeChain = 'ethereum';
let activeChart = 'ethereum';
let currentView = 'monitor';
let solanaData = null;
let ethPrice = null;
let refreshInterval = 15000;
let sampleInterval = 15;
let alertTimer = null;
let lastSampleTime = 0;

function renderTabs(chain) {
  const html = CHAINS.map(c => `<button class="chain-tab${c.id === chain ? ' active' : ''}" onclick="switchChain('${c.id}')">${c.name}</button>`).join('');
  document.getElementById('tabs').innerHTML = html;
  document.getElementById('chartTabs').innerHTML = html;
}

function renderDashboard(chain, data) {
  const c = CHAINS.find(ch => ch.id === chain);
  const th = config.thresholds[chain] || {};
  const blobCard = c.hasBlob && data.blobFee !== null ? `
    <div class="card" style="${data.blobFee > th.blobFee ? 'border-color:#ef4444;' : ''}">
      <div class="card-label">Blob Fee</div><div class="card-value purple">${data.blobFeeFmt}</div>
      <div class="card-sub">gwei · EIP-4844</div>
    </div>` : '';
  const utilColor = data.utilPct > 80 ? 'red' : data.utilPct > 50 ? 'yellow' : 'green';
  const baseFeeColor = data.baseFee > th.baseFee ? 'red' : data.baseFee > 20 ? 'yellow' : 'green';
  const gasColor = data.gas > th.gas ? 'red' : data.gas > 20 ? 'yellow' : 'green';

  return `<div class="chain-meta"><span class="chain-color" style="background:${c.color}"></span>${c.name}</div>
  <div class="grid">
    <div class="card"><div class="card-label">Latest Block</div><div class="card-value cyan">${data.blockFmt}</div><div class="card-sub">${data.blockSub}</div></div>
    <div class="card" style="${data.gas > th.gas ? 'border-color:#ef4444;' : ''}"><div class="card-label">Priority Fee</div><div class="card-value ${gasColor}">${data.gasFmt}</div><div class="card-sub">gwei · low</div></div>
    <div class="card" style="${data.baseFee > th.baseFee ? 'border-color:#ef4444;' : ''}"><div class="card-label">Base Fee</div><div class="card-value ${baseFeeColor}">${data.baseFeeFmt}</div><div class="card-sub">gwei</div></div>
    ${blobCard}
    <div class="card"><div class="card-label">Gas Util</div><div class="card-value ${utilColor}">${data.utilPctFmt}%</div><div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100,data.utilPct)}%;background:${utilColor==='red'?'#ef4444':utilColor==='yellow'?'#f59e0b':'#10b981'}"></div></div></div>
    <div class="card"><div class="card-label">ETH Supply</div><div class="card-value cyan">${data.supply}</div><div class="card-sub">million ETH</div></div>
    <div class="card"><div class="card-label">ETH Market Cap</div><div class="card-value orange">${data.mcap}</div><div class="card-sub">@ ETH price</div></div>
  </div>`;
}

function renderLoading() {
  return `<div class="grid">${Array(6).fill('<div class="card loading"><div class="card-label">Loading...</div><div class="card-value">--</div></div>').join('')}</div>`;
}

function updateBlobToggle() {
  const chain = CHAINS.find(c => c.id === activeChart);
  document.getElementById('blobToggle').hidden = !chain?.hasBlob;
}

async function maybeSample() {
  const now = Date.now();
  const sampleMs = sampleInterval * 60 * 1000;
  if (now - lastSampleTime < sampleMs) return;
  lastSampleTime = Math.floor(now / sampleMs) * sampleMs;

  for (const chain of CHAINS) {
    const data = await fetchChainData(chain);
    if (!data) continue;
    addHistoryPoint(chain.id, {
      t: lastSampleTime,
      gas: parseFloat(data.gas.toFixed(4)),
      baseFee: parseFloat(data.baseFee.toFixed(4)),
      blobFee: data.blobFee !== null ? parseFloat(data.blobFee.toFixed(6)) : null,
      util: parseFloat(data.utilPct.toFixed(2)),
    });
  }
}

async function refresh() {
  document.getElementById('dashboard').innerHTML = renderLoading();
  await fetchPrice();
  const chain = CHAINS.find(c => c.id === activeChain);
  const data = await fetchChainData(chain);
  if (!data) return;

  document.getElementById('dashboard').innerHTML = renderDashboard(activeChain, data);

  const th = config.thresholds[activeChain] || {};
  if (data.gas > th.gas) triggerAlert(activeChain, 'gas', data.gas, th.gas);
  if (data.baseFee > th.baseFee) triggerAlert(activeChain, 'baseFee', data.baseFee, th.baseFee);
  if (data.blobFee !== null && th.blobFee > 0 && data.blobFee > th.blobFee)
    triggerAlert(activeChain, 'blobFee', data.blobFee, th.blobFee);

  document.getElementById('updated').textContent = new Date().toLocaleTimeString();

  await maybeSample();
}

function switchView(view) {
  currentView = view;
  document.getElementById('view-monitor').hidden = view !== 'monitor';
  document.getElementById('view-charts').hidden  = view !== 'charts';
  document.getElementById('view-meme').hidden     = view !== 'meme';
  document.getElementById('tab-monitor').className = 'tab' + (view === 'monitor' ? ' active' : '');
  document.getElementById('tab-charts').className  = 'tab' + (view === 'charts'  ? ' active' : '');
  document.getElementById('tab-meme').className    = 'tab' + (view === 'meme'    ? ' active' : '');
  if (view === 'charts') {
    updateBlobToggle();
    renderChart();
    updateStorageBar();
  }
  if (view === 'meme') {
    refreshMemeData();
    if (memeRefreshTimer) clearInterval(memeRefreshTimer);
    memeRefreshTimer = setInterval(refreshMemeData, 30000);
  }
}

window.switchChain = function(id) {
  activeChain = id;
  renderTabs(id);
  refresh();
};

window.switchChartChain = function(id) {
  activeChart = id;
  renderTabs(id);
  updateBlobToggle();
  renderChart();
};

openSettingsModal = function() {
  document.getElementById('settingsModal').style.display = 'flex';
  document.getElementById('settingInterval').value = Math.round(refreshInterval / 1000);
  document.getElementById('settingSampleMin').value = sampleInterval;
};

closeSettingsModal = function() { document.getElementById('settingsModal').style.display = 'none'; };

saveSettings = function() {
  refreshInterval = (parseInt(document.getElementById('settingInterval').value) || 15) * 1000;
  sampleInterval = parseInt(document.getElementById('settingSampleMin').value) || 15;
  if (alertTimer) clearInterval(alertTimer);
  alertTimer = setInterval(refresh, refreshInterval);
  saveConfig();
  closeSettingsModal();
};

renderSolanaPanel = function(d) {
  var ids = ["sol-price","sol-slot","sol-block","sol-epoch","sol-epoch-progress","sol-tps"];
  var vals = [d.solPrice, d.slot, d.blockHeight, "Epoch "+d.epoch, d.epochProgress, d.tps];
  for (var i3=0; i3<ids.length; i3++) {
    var el = document.getElementById(ids[i3]);
    if (el) el.textContent = vals[i3];
  }
};

updateSolanaAlertState = function(d) {
  if (!config.alertEnabled) return;
  if (d.tps > 5000) {
    var key = "solana_tps", now = Date.now(), cd = (config.cooldownMin || 5) * 60000;
    if (!alertState[key] || (now - alertState[key]) >= cd) {
      alertState[key] = now; saveAlertState();
      var msg = "[SOL] TPS Alert: " + d.tps + " (limit: 5000)";
      Promise.all([sendTelegram(msg), sendEmail("[MCM] Solana TPS", "Solana TPS: " + d.tps + " (limit: 5000)")]);
      addAlertLog("solana", "TPS", d.tps, 5000);
    }
  }
};
