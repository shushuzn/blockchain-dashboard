const CHAINS = [
  { id: 'ethereum',  name: 'Ethereum',   color: '#627eea', rpc: 'https://eth.llamarpc.com',       explorer: 'https://etherscan.io',            decimals: 18, hasBlob: true },
  { id: 'base',      name: 'Base',        color: '#0052ff', rpc: 'https://mainnet.base.org',        explorer: 'https://basescan.org',            decimals: 18, hasBlob: true },
  { id: 'arbitrum',  name: 'Arbitrum',    color: '#28a0f0', rpc: 'https://arb1.arbitrum.io/rpc',   explorer: 'https://arbiscan.io',            decimals: 18, hasBlob: false },
  { id: 'optimism',  name: 'Optimism',    color: '#ff0420', rpc: 'https://mainnet.optimism.io',    explorer: 'https://optimistic.etherscan.io', decimals: 18, hasBlob: false },
  { id: 'solana',    name: 'Solana',      color: '#00ffa3', rpc: 'https://api.mainnet-beta.solana.com', explorer: 'https://solscan.io', decimals: 0, hasBlob: false, isSolana: true },
];

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';

async function rpcCall(url, method, params = []) {
  try {
    const r = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 })
    }).then(r => r.json());
    return r.result;
  } catch(e) { return null; }
}

async function fetchPrice() {
  try {
    const d = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd&include_24hr_change=true'
    ).then(r => r.json());
    ethPrice = d.ethereum.usd;
    document.getElementById('ethPrice').textContent = '$' + d.ethereum.usd.toLocaleString();
    const c = d.ethereum.usd_24h_change;
    const el = document.getElementById('ethChange');
    el.textContent = (c >= 0 ? '+' : '') + c.toFixed(2) + '%';
    el.className = 'change ' + (c >= 0 ? 'green' : 'red');
    document.getElementById('btcPrice').textContent = '$' + d.bitcoin.usd.toLocaleString();
  } catch(e) {}
}

async function fetchSolPrice() {
  try {
    var r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
    var d = await r.json();
    return (d.solana && d.solana.usd) || 0;
  } catch (e) { return 0; }
}

async function fetchChainData(chain) {
  const [block, feeHistory, supply] = await Promise.all([
    rpcCall(chain.rpc, 'eth_getBlockByNumber', ['latest', false]),
    rpcCall(chain.rpc, 'eth_feeHistory', ['0x4', 'latest', [50]]),
    rpcCall(chain.rpc, 'eth_totalSupply', []),
  ]);
  if (!block) return null;

  const bNum    = parseInt(block.number, 16);
  const ts      = parseInt(block.timestamp, 16);
  const gasUsed = parseInt(block.gasUsed, 16);
  const gasLimit= parseInt(block.gasLimit, 16);
  const utilPct = (gasUsed / gasLimit * 100);
  const txs     = block.transactions.length;
  const bfArr   = feeHistory ? feeHistory.baseFeePerGas : [];
  const baseFee = bfArr.length ? parseInt(bfArr[bfArr.length - 1], 16) / 1e9 : 0;

  let priorityFee = 0;
  if (feeHistory?.reward) {
    const rw = feeHistory.reward.map(r => parseInt(r, 16) / 1e9).filter(r => r > 0);
    if (rw.length) priorityFee = rw.reduce((a, b) => a + b, 0) / rw.length;
  }

  let blobFee = null;
  if (chain.hasBlob) {
    try {
      const bfr = await rpcCall(chain.rpc, 'eth_getBlobPrice', []);
      if (bfr) blobFee = parseInt(bfr, 16) / 1e9;
    } catch(e) {}
  }

  const totalSupply = supply ? parseInt(supply, 16) / Math.pow(10, chain.decimals) : 0;
  const mcap = ethPrice ? '$' + (totalSupply * ethPrice / 1e9).toFixed(2) + 'B' : '--';

  return {
    block: bNum, blockFmt: bNum.toLocaleString(),
    blockSub: `${txs} txs · ${utilPct.toFixed(1)}% gas · ${new Date(ts * 1000).toLocaleTimeString()}`,
    gas: priorityFee, gasFmt: priorityFee.toFixed(3),
    baseFee, baseFeeFmt: baseFee.toFixed(3),
    blobFee: blobFee, blobFeeFmt: blobFee !== null ? blobFee.toFixed(4) : 'N/A',
    utilPct, utilPctFmt: utilPct.toFixed(1),
    supply: (totalSupply / 1e6).toFixed(2) + 'M',
    mcap,
  };
}

async function fetchSolanaData() {
  try {
    var [ei, ps, sp] = await Promise.all([
      rpcCall(SOLANA_RPC, {"jsonrpc":"2.0","id":1,"method":"getEpochInfo"}),
      rpcCall(SOLANA_RPC, {"jsonrpc":"2.0","id":1,"method":"getRecentPerformanceSamples","params":[5]}),
      fetchSolPrice(),
    ]);
    var abs = (ei.result && ei.result.absoluteSlot) || 0;
    var ep = (ei.result && ei.result.epoch) || 0;
    var si = (ei.result && ei.result.slotIndex) || 0;
    var sie = (ei.result && ei.result.slotsInEpoch) || 432000;
    var bh = (ei.result && ei.result.blockHeight) || 0;
    var tps = 0, sc = 0;
    if (ps.result) {
      for (var i2 = 0; i2 < ps.result.length; i2++) {
        var s = ps.result[i2];
        if (s.samplePeriodSecs > 0) { tps += s.numTransactions / s.samplePeriodSecs; sc++; }
      }
      tps = sc > 0 ? tps / sc : 0;
    }
    var su = sp || 0;
    var pr = sie > 0 ? ((si / sie) * 100).toFixed(1) : "0.0";
    var fmt = su > 0 ? "$" + su.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "-";
    return { slot: abs.toLocaleString(), blockHeight: bh.toLocaleString(), epoch: ep,
             slotInEpoch: si.toLocaleString(), slotsInEpoch: sie.toLocaleString(),
             epochProgress: pr + "%", tps: tps.toFixed(0),
             solPrice: fmt, solPriceRaw: su };
  } catch (e) { console.warn("Solana error:", e); return null; }
}
