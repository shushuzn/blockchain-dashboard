let memeData = [];
let memeRefreshTimer = null;

async function refreshMemeData() {
  const loading = document.getElementById('meme-loading');
  const error = document.getElementById('meme-error');
  const grid = document.getElementById('meme-grid');
  if (loading) loading.hidden = false;
  if (error) error.hidden = true;
  if (grid) grid.hidden = true;
  try {
    const res = await fetch('http://localhost:8765/api/meme');
    if (!res.ok) throw new Error('Proxy not running (localhost:8765)');
    memeData = await res.json();
    renderMemeTable();
    document.getElementById('meme-total').textContent = memeData.length;
    const top = memeData.reduce((best, t) => {
      const mcap = parseFloat(t.marketCap) || 0;
      return mcap > (parseFloat(best.marketCap) || 0) ? t : best;
    }, memeData[0] || {});
    document.getElementById('meme-top-mcap').textContent = fmtMCap(top.marketCap);
    document.getElementById('meme-updated').textContent = new Date().toLocaleTimeString();
    if (loading) loading.hidden = true;
    if (grid) grid.hidden = false;
  } catch(e) {
    if (loading) loading.hidden = true;
    if (error) { error.hidden = false; error.textContent = 'Error: ' + e.message + ' — start meme_proxy.py'; }
  }
}

function renderMemeTable() {
  const sortBy = document.getElementById('meme-sort')?.value || 'marketCap';
  const search = (document.getElementById('meme-search')?.value || '').toLowerCase();
  let rows = memeData.filter(t => {
    if (!search) return true;
    return (t.memeCoin?.name || '').toLowerCase().includes(search) ||
           (t.memeCoin?.symbol || '').toLowerCase().includes(search);
  });
  rows.sort((a, b) => parseFloat(b[sortBy] || 0) - parseFloat(a[sortBy] || 0));
  const grid = document.getElementById('meme-grid');
  if (!grid) return;
  grid.innerHTML = rows.map(t => {
    const mc = parseFloat(t.marketCap) || 0;
    const price = parseFloat(t.price) || 0;
    const snipers = parseFloat(t.sniperRate) || 0;
    const holders = parseInt(t.holders) || 0;
    const bonded = t.memeCoin?.bondedBtn || false;
    const risk = t.risk || 'unknown';
    const name = t.memeCoin?.name || '?';
    const sym = t.memeCoin?.symbol || '?';
    const img = t.memeCoin?.imageUri || '';
    const riskClass = risk === 'honor' ? 'risk-honor' : 'risk-risk';
    const bondedClass = bonded ? 'bonded' : 'bonded-none';
    return `<div class="meme-card" onclick="window.open('https://pump.fun/${t.memeCoin?.mint || ''}', '_blank')">
  <div class="meme-card-top">
    <div>
      <div class="meme-card-name">${escHtml(name)}</div>
      <div class="meme-card-sym">${escHtml(sym)}</div>
    </div>
    ${img ? `<img class="meme-card-img" src="${escHtml(img)}" onerror="this.style.display='none'" loading="lazy">` : ''}
  </div>
  <div class="meme-card-price">$${price < 0.001 ? price.toExponential(2) : price.toFixed(6)}</div>
  <div class="meme-card-mcap">MCap: ${fmtMCap(mc)}</div>
  <div class="meme-card-row"><span>Sniper Rate</span><span>${snipers.toFixed(1)}%</span></div>
  <div class="meme-card-row"><span>Holders</span><span>${holders.toLocaleString()}</span></div>
  <div class="meme-card-row"><span>Bonded</span><span class="${bondedClass}">${bonded ? 'Yes' : 'No'}</span></div>
  <div class="meme-card-row"><span>Risk</span><span class="${riskClass}">${risk}</span></div>
</div>`;
  }).join('');
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtMCap(n) {
  n = parseFloat(n) || 0;
  if (n >= 1e6) return '$' + (n/1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n/1e3).toFixed(1) + 'K';
  return '$' + n.toFixed(0);
}
