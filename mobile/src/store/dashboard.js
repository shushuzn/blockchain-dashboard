import { create } from 'zustand'
import { getHistory, getConfig, getMemeCoins, getLidoTVL, getAaveTVL } from '../services/api'

export const useDashboardStore = create((set) => ({
  loading: false,
  error: null,
  chains: {},
  config: null,
  memeCoins: [],
  lidoTVL: null,
  aaveTVL: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchHistory: async (chainId) => {
    set({ loading: true })
    try {
      const res = await getHistory(chainId)
      set((state) => ({
        chains: { ...state.chains, [chainId]: res.data },
        loading: false,
        error: null,
      }))
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  fetchConfig: async () => {
    try {
      const res = await getConfig()
      set({ config: res.data })
    } catch (err) {
      set({ error: err.message })
    }
  },

  fetchMemeCoins: async () => {
    try {
      const res = await getMemeCoins()
      set({ memeCoins: res.data })
    } catch (err) {
      set({ error: err.message })
    }
  },

  fetchLidoTVL: async () => {
    try {
      const res = await getLidoTVL()
      set({ lidoTVL: res.data })
    } catch (err) {
      set({ error: err.message })
    }
  },

  fetchAaveTVL: async () => {
    try {
      const res = await getAaveTVL()
      set({ aaveTVL: res.data })
    } catch (err) {
      set({ error: err.message })
    }
  },

  refreshAll: async () => {
    set({ loading: true })
    const chains = ['ethereum', 'base', 'arbitrum', 'optimism']
    for (const chain of chains) {
      try {
        const res = await getHistory(chain)
        set((state) => ({
          chains: { ...state.chains, [chain]: res.data },
        }))
      } catch (err) {
        console.error(`Failed to fetch ${chain}:`, err.message)
      }
    }
    set({ loading: false })
  },
}))
