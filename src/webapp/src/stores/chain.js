import { defineStore } from 'pinia'

const CHAINS = [
  { id: 'ethereum',  name: 'Ethereum',   color: '#627eea', rpc: 'https://eth.llamarpc.com',       explorer: 'https://etherscan.io',            decimals: 18, hasBlob: true, hasMEV: true },
  { id: 'base',      name: 'Base',        color: '#0052ff', rpc: 'https://mainnet.base.org',        explorer: 'https://basescan.org',            decimals: 18, hasBlob: true, hasMEV: false },
  { id: 'arbitrum',  name: 'Arbitrum',    color: '#28a0f0', rpc: 'https://arb1.arbitrum.io/rpc',   explorer: 'https://arbiscan.io',            decimals: 18, hasBlob: false, hasMEV: true },
  { id: 'optimism',  name: 'Optimism',    color: '#ff0420', rpc: 'https://mainnet.optimism.io',    explorer: 'https://optimistic.etherscan.io', decimals: 18, hasBlob: false, hasMEV: true },
  { id: 'solana',    name: 'Solana',      color: '#00ffa3', rpc: 'https://api.mainnet-beta.solana.com', explorer: 'https://solscan.io', decimals: 0, hasBlob: false, hasMEV: false, isSolana: true },
  { id: 'bsc',       name: 'BSC',         color: '#F3BA2F', rpc: 'https://bsc-dataseed.binance.org', explorer: 'https://bscscan.com',            decimals: 18, hasBlob: false, hasMEV: false },
  { id: 'polygon',   name: 'Polygon',     color: '#8247E5', rpc: 'https://polygon-rpc.com',        explorer: 'https://polygonscan.com',         decimals: 18, hasBlob: false, hasMEV: false },
]

export const useChainStore = defineStore('chain', {
  state: () => ({
    chains: CHAINS,
    activeChain: 'ethereum',
    ethPrice: '$--',
    ethChange: 0,
    btcPrice: '$--',
    lastUpdated: '--',
    history: {},
    refreshInterval: 15000,
    sampleInterval: 15,
    alertTimer: null,
    lastSampleTime: 0
  }),

  actions: {
    async fetchPrice() {
      try {
        const d = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd&include_24hr_change=true'
        ).then(r => r.json())
        
        this.ethPrice = '$' + d.ethereum.usd.toLocaleString()
        this.ethChange = d.ethereum.usd_24h_change
        this.btcPrice = '$' + d.bitcoin.usd.toLocaleString()
      } catch(e) {
        console.error('Failed to fetch price:', e)
      }
    },

    async rpcCall(url, method, params = []) {
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 })
        }).then(r => r.json())
        return r.result
      } catch(e) {
        return null
      }
    },

    async fetchChainData(chain) {
      const promises = [
        this.rpcCall(chain.rpc, 'eth_getBlockByNumber', ['latest', false]),
        this.rpcCall(chain.rpc, 'eth_feeHistory', ['0x4', 'latest', [50]]),
        this.rpcCall(chain.rpc, 'eth_totalSupply', [])
      ]
      
      // Add MEV data for supported chains
      if (chain.hasMEV) {
        promises.push(this.fetchMEVData(chain))
      }
      
      const [block, feeHistory, supply, mevData] = await Promise.all(promises)
      
      if (!block) return null

      const bNum = parseInt(block.number, 16)
      const ts = parseInt(block.timestamp, 16)
      const gasUsed = parseInt(block.gasUsed, 16)
      const gasLimit = parseInt(block.gasLimit, 16)
      const utilPct = (gasUsed / gasLimit * 100)
      const txs = block.transactions.length
      const bfArr = feeHistory ? feeHistory.baseFeePerGas : []
      const baseFee = bfArr.length ? parseInt(bfArr[bfArr.length - 1], 16) / 1e9 : 0

      let priorityFee = 0
      if (feeHistory?.reward) {
        const rw = feeHistory.reward.map(r => parseInt(r, 16) / 1e9).filter(r => r > 0)
        if (rw.length) priorityFee = rw.reduce((a, b) => a + b, 0) / rw.length
      }

      let blobFee = null
      if (chain.hasBlob) {
        try {
          const bfr = await this.rpcCall(chain.rpc, 'eth_getBlobPrice', [])
          if (bfr) blobFee = parseInt(bfr, 16) / 1e9
        } catch(e) {}
      }

      const totalSupply = supply ? parseInt(supply, 16) / Math.pow(10, chain.decimals) : 0
      const mcap = this.ethPrice !== '$--' ? '$' + (totalSupply * parseFloat(this.ethPrice.replace(/[^0-9.]/g, '')) / 1e9).toFixed(2) + 'B' : '--'

      return {
        block: bNum, blockFmt: bNum.toLocaleString(),
        blockSub: `${txs} txs · ${utilPct.toFixed(1)}% gas · ${new Date(ts * 1000).toLocaleTimeString()}`,
        gas: priorityFee, gasFmt: priorityFee.toFixed(3),
        baseFee, baseFeeFmt: baseFee.toFixed(3),
        blobFee: blobFee, blobFeeFmt: blobFee !== null ? blobFee.toFixed(4) : 'N/A',
        utilPct, utilPctFmt: utilPct.toFixed(1),
        supply: (totalSupply / 1e6).toFixed(2) + 'M',
        mcap
      }
    },

    async refresh() {
      await this.fetchPrice()
      this.lastUpdated = new Date().toLocaleTimeString()
    },

    startRefresh() {
      this.refresh()
      this.alertTimer = setInterval(() => this.refresh(), this.refreshInterval)
    },

    stopRefresh() {
      if (this.alertTimer) {
        clearInterval(this.alertTimer)
        this.alertTimer = null
      }
    },

    loadHistory() {
      try {
        const history = localStorage.getItem('mcm_history_v2')
        if (history) {
          this.history = JSON.parse(history)
        }
      } catch(e) {
        this.history = {}
      }
    },

    loadConfig() {
      try {
        const config = localStorage.getItem('mcm_config_v3')
        if (config) {
          const parsed = JSON.parse(config)
          // Load config if needed
        }
      } catch(e) {
        // Default config
      }
    },

    async fetchMEVData(chain) {
      try {
        // Use flashbots API for MEV data
        const response = await fetch(`https://api.flashbots.net/v2/blocks?limit=1&chain_id=${chain.id === 'ethereum' ? '1' : chain.id === 'arbitrum' ? '42161' : '10'}`)
        const data = await response.json()
        
        if (data.blocks && data.blocks.length > 0) {
          const block = data.blocks[0]
          return {
            mevReward: block.total_miner_reward || 0,
            mevCount: block.transactions.length || 0,
            mevShare: block.mev_percent || 0
          }
        }
        return null
      } catch (error) {
        console.error('Failed to fetch MEV data:', error)
        return null
      }
    }
  }
})