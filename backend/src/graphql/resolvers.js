const { isRedisConnected } = require('../config/redis')
const lidoService = require('../services/lido')
const aaveService = require('../services/aave')
const { logger } = require('../utils/logger')

const resolvers = {
  Query: {
    chains: async () => {
      return [
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
        { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
        { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB' },
        { id: 'optimism', name: 'Optimism', symbol: 'OP' },
        { id: 'base', name: 'Base', symbol: 'BASE' },
      ]
    },

    chain: async (_, { id }) => {
      const chains = {
        ethereum: { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
        polygon: { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
        arbitrum: { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB' },
        optimism: { id: 'optimism', name: 'Optimism', symbol: 'OP' },
        base: { id: 'base', name: 'Base', symbol: 'BASE' },
      }
      return chains[id] || null
    },

    prices: () => ({
      eth: 3000,
      btc: 60000,
    }),

    config: () => {
      return {
        alertEnabled: false,
        cooldownMin: 5,
        thresholds: {},
      }
    },

    alerts: () => [],

    health: () => ({
      status: 'ok',
      uptime: Math.floor(process.uptime()) + 's',
      cache: isRedisConnected(),
    }),

    memeCoins: () => [],

    lidoTVL: async () => {
      try {
        return await lidoService.getLidoTVL()
      } catch (error) {
        logger.error('Error fetching Lido TVL', { error: error.message })
        return {}
      }
    },

    aaveTVL: async () => {
      try {
        return await aaveService.getAaveTVL()
      } catch (error) {
        logger.error('Error fetching Aave TVL', { error: error.message })
        return {}
      }
    },

    metrics: () => {
      const metrics = require('../utils/metrics').getMetrics()
      return metrics
    },
  },
}

module.exports = { resolvers }