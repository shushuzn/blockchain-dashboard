const express = require('express')
const router = express.Router()
const { getLidoMetrics } = require('../services/lido')
const { getLidoCache, setLidoCache } = require('../services/cache')

router.get('/', async (req, res) => {
  try {
    let metrics = await getLidoCache()
    
    if (!metrics) {
      console.log('[LIDO] Fetching fresh data...')
      metrics = await getLidoMetrics()
      
      if (!metrics) {
        return res.status(500).json({ error: 'Failed to fetch Lido metrics' })
      }
      
      await setLidoCache(metrics)
    }
    
    res.json(metrics)
  } catch (error) {
    console.error('Error fetching Lido metrics:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/refresh', async (req, res) => {
  try {
    console.log('[LIDO] Force refresh requested')
    const metrics = await getLidoMetrics()
    
    if (!metrics) {
      return res.status(500).json({ error: 'Failed to fetch Lido metrics' })
    }
    
    await setLidoCache(metrics)
    res.json({ message: 'Cache refreshed', metrics })
  } catch (error) {
    console.error('Error refreshing Lido metrics:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router