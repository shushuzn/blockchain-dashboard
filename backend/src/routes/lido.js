const express = require('express')
const router = express.Router()
const { getLidoMetrics } = require('../services/lido')

router.get('/', async (req, res) => {
  try {
    const metrics = await getLidoMetrics()
    
    if (!metrics) {
      return res.status(500).json({ error: 'Failed to fetch Lido metrics' })
    }
    
    res.json(metrics)
  } catch (error) {
    console.error('Error fetching Lido metrics:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router