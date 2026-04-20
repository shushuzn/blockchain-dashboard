# Blockchain Dashboard

Monitor ETH / Base / ARB / OP on-chain metrics, plus a Solana meme coin tracker.

## Files

- `multi_chain_monitor.html` — Full dashboard (ETH/Base/ARB/OP monitor + charts + alerts + Solana Meme)
- `base_monitor.html` — Standalone Base Chain monitor
- `meme_proxy.py` — Local proxy for Solana meme coin data (requires onchainos CLI)

## Running Meme Tab

```bash
# 1. Install onchainos CLI if not present
#    Download from OKX official source

# 2. Start proxy server
python meme_proxy.py

# 3. Open dashboard
http://localhost:8765/multi_chain_monitor.html
```

## Live Dashboard (ETH/Base/ARB/OP only)

https://shushuzn.github.io/blockchain-dashboard/multi_chain_monitor.html

Note: The Meme tab requires running meme_proxy.py locally (onchainos CLI calls cant be made from browser).
