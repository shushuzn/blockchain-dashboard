const express = require('express')
const router = express.Router()
const { getAaveMetrics } = require('../services/aave')
const { getAaveCache, setAaveCache } = require('../services/cache')

router.get('/', async (req, res) => {
  try {
    let metrics = await getAaveCache()
    
    if (!metrics) {
      console.log('[AAVE] Fetching fresh data...')
      metrics = await getAaveMetrics()
      
      if (!metrics) {
        return res.status(500).json({ error: 'Failed to fetch Aave metrics' })
      }
      
      await setAaveCache(metrics)
    }
    
    res.json(metrics)
  } catch (error) {
    console.error('Error fetching Aave metrics:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/refresh', async (req, res) => {
  try {
    console.log('[AAVE] Force refresh requested')
    const metrics = await getAaveMetrics()
    
    if (!metrics) {
      return res.status(500).json({ error: 'Failed to fetch Aave metrics' })
    }
    
    await setAaveCache(metrics)
    res.json({ message: 'Cache refreshed', metrics })
  } catch (error) {
    console.error('Error refreshing Aave metrics:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router