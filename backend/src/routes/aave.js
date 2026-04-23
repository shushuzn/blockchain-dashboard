const express = require('express')
const router = express.Router()
const { getAaveMetrics } = require('../services/aave')
const { getAaveCache, setAaveCache } = require('../services/cache')
const { logger } = require('../utils/logger')

router.get('/', async (req, res) => {
  try {
    let metrics = await getAaveCache()
    
    if (!metrics) {
      logger.info('Fetching fresh Aave data')
      metrics = await getAaveMetrics()
      
      if (!metrics) {
        return res.status(500).json({ error: 'Failed to fetch Aave metrics' })
      }
      
      await setAaveCache(metrics)
    }
    
    res.json(metrics)
  } catch (error) {
    logger.error('Error fetching Aave metrics', { error: error.message })
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/refresh', async (req, res) => {
  try {
    logger.info('Force refresh Aave metrics')
    const metrics = await getAaveMetrics()
    
    if (!metrics) {
      return res.status(500).json({ error: 'Failed to fetch Aave metrics' })
    }
    
    await setAaveCache(metrics)
    res.json({ message: 'Cache refreshed', metrics })
  } catch (error) {
    logger.error('Error refreshing Aave metrics', { error: error.message })
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router