import { defineStore } from 'pinia'
import { historyApi } from '../api'

const CHAINS = [
  { id: 'ethereum',  name: 'Ethereum',   color: '#627eea', rpc: 'https://eth.llamarpc.com',       explorer: 'https://etherscan.io',            decimals: 18, hasBlob: true, hasMEV: true },
  { id: 'base',      name: 'Base',        color: '#0052ff', rpc: 'https://mainnet.base.org',        explorer: 'https://basescan.org',            decimals: 18, hasBlob: true, hasMEV: false },
  { id: 'arbitrum',  name: 'Arbitrum',    color: '#28a0f0', rpc: 'https://arb1.arbitrum.io/rpc',   explorer: 'https://arbiscan.io',            decimals: 18, hasBlob: false, hasMEV: true },
  { id: 'optimism',  name: 'Optimism',    color: '#ff0420', rpc: 'https://mainnet.optimism.io',    explorer: 'https://optimistic.etherscan.io', decimals: 18, hasBlob: false, hasMEV: true },
  { id: 'solana',    name: 'Solana',      color: '#00ffa3', rpc: 'https://api.mainnet-beta.solana.com', explorer: 'https://solscan.io', decimals: 0, hasBlob: false, hasMEV: false, isSolana: true },
  { id: 'bsc',       name: 'BSC',         color: '#F3BA2F', rpc: 'https://bsc-dataseed.binance.org', explorer: 'https://bscscan.com',            decimals: 18, hasBlob: false, hasMEV: false },
  { id: 'polygon',   name: 'Polygon',     color: '#8247E5', rpc: 'https://polygon-rpc.com',        explorer: 'https://polygonscan.com',         decimals: 18, hasBlob: false, hasMEV: false },
  { id: 'zksync',    name: 'zkSync Era',  color: '#8b5cf6', rpc: 'https://main.era.zksync.dev',   explorer: 'https://explorer.zksync.io',       decimals: 18, hasBlob: false, hasMEV: false },
  { id: 'starknet',  name: 'Starknet',    color: '#f97316', rpc: 'https://starknet-mainnet.public.blastapi.io', explorer: 'https://starkscan.co', decimals: 18, hasBlob: false, hasMEV: false, isStarknet: true },
]

const OFFLINE_MODE_KEY = 'mcm_offline_mode'
const HISTORY_KEY = 'mcm_history_v2'

export const useChainStore = defineStore('chain', {
  state: () => ({
    chains: CHAINS,
    activeChain: 'ethereum',
    ethPrice: '$--',
    ethChange: 0,
    btcPrice: '$--',
    lastUpdated: '--',
    history: {},
    historyFromApi: false,
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
        mcap,
        mevData
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

    async loadHistory(chainId = null, days = 7) {
      try {
        const history = await historyApi.getHistory(chainId || this.activeChain, days)
        if (chainId) {
          this.history[chainId] = history
        } else {
          this.history = { [this.activeChain]: history }
        }
        this.historyFromApi = true
      } catch (error) {
        console.warn('Failed to load history from API, using localStorage:', error.message)
        this.loadHistoryFromLocal()
        this.historyFromApi = false
      }
    },

    loadHistoryFromLocal() {
      try {
        const stored = localStorage.getItem(HISTORY_KEY)
        if (stored) {
          this.history = JSON.parse(stored)
        }
      } catch(e) {
        this.history = {}
      }
    },

    async saveHistoryPoint(chainId, point) {
      if (!this.history[chainId]) {
        this.history[chainId] = []
      }

      const sampleMs = this.sampleInterval * 60 * 1000
      const bucket = Math.floor(point.t / sampleMs) * sampleMs
      const arr = this.history[chainId]
      const existing = arr.findIndex(p => Math.floor(p.t / sampleMs) * sampleMs === bucket)

      if (existing >= 0) {
        arr[existing] = point
      } else {
        arr.push(point)
      }

      this.trimHistory(chainId)

      if (this.historyFromApi) {
        try {
          await historyApi.addHistoryPoint(
            chainId,
            point.t,
            point.gas,
            point.baseFee,
            point.blobFee,
            point.util
          )
        } catch (error) {
          console.warn('Failed to save to API, saving locally:', error.message)
          this.saveHistoryToLocal()
        }
      } else {
        this.saveHistoryToLocal()
      }
    },

    trimHistory(chainId) {
      const maxPoints = Math.floor((7 * 24 * 60) / this.sampleInterval) + 20
      if (this.history[chainId]?.length > maxPoints) {
        this.history[chainId] = this.history[chainId].slice(-maxPoints)
      }
    },

    saveHistoryToLocal() {
      try {
        const data = JSON.stringify(this.history)
        if (data.length < 4 * 1024 * 1024) {
          localStorage.setItem(HISTORY_KEY, data)
        }
      } catch(e) {
        console.warn('Failed to save history locally:', e.message)
      }
    },

    async fetchMEVData(chain) {
      try {
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