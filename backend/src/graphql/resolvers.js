const chainStore = require('../stores/chain')
const configStore = require('../stores/config')

const resolvers = {
  Query: {
    chains: () => {
      return chainStore.chains.map(chain => ({
        ...chain,
        current: chainStore.chainCurrentState[chain.id] || null,
        history: chainStore.chainHistory[chain.id] || [],
      }))
    },

    chain: (_, { id }) => {
      const chain = chainStore.chains.find(c => c.id === id)
      if (!chain) return null
      return {
        ...chain,
        current: chainStore.chainCurrentState[id] || null,
        history: chainStore.chainHistory[id] || [],
      }
    },

    prices: () => ({
      eth: chainStore.prices?.eth || null,
      btc: chainStore.prices?.btc || null,
    }),

    config: () => ({
      alertEnabled: configStore.alertEnabled,
      cooldownMin: configStore.cooldownMin,
      thresholds: configStore.thresholds,
    }),

    alerts: (_, { limit = 20 }) => {
      return configStore.alertLog.slice(-limit)
    },

    health: () => ({
      status: 'ok',
      uptime: Math.floor(process.uptime()) + 's',
      cache: chainStore.redisClient?.isOpen || false,
    }),

    memeCoins: () => chainStore.memeCoins || [],

    lidoTVL: () => chainStore.lidoTVL || {},

    aaveTVL: () => chainStore.aaveTVL || {},

    metrics: () => {
      const metrics = require('../utils/metrics').getMetrics()
      return metrics
    },
  },
}

module.exports = { resolvers }
