const express = require('express')
const router = express.Router()
const { Op } = require('sequelize')
const History = require('../models/History')

// Get history data for a chain
router.get('/', async (req, res) => {
  try {
    const { chainId, days = 7 } = req.query
    
    if (!chainId) {
      return res.status(400).json({ error: 'chainId is required' })
    }

    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000)
    
    const history = await History.findAll({
      where: {
        chainId,
        timestamp: { [History.sequelize.Op.gte]: cutoff }
      },
      order: [['timestamp', 'ASC']]
    })

    res.json(history.map(h => ({
      t: h.timestamp,
      gas: h.gas,
      baseFee: h.baseFee,
      blobFee: h.blobFee,
      util: h.util
    })))
  } catch (error) {
    console.error('Error fetching history:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add history data
router.post('/', async (req, res) => {
  try {
    const { chainId, timestamp, gas, baseFee, blobFee, util } = req.body
    
    if (!chainId || !timestamp) {
      return res.status(400).json({ error: 'chainId and timestamp are required' })
    }

    const history = await History.create({
      chainId,
      timestamp,
      gas,
      baseFee,
      blobFee,
      util
    })

    res.json(history)
  } catch (error) {
    console.error('Error adding history:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete old history data (keep last 30 days)
router.delete('/cleanup', async (req, res) => {
  try {
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000)
    
    await History.destroy({
      where: {
        timestamp: { [History.sequelize.Op.lt]: cutoff }
      }
    })

    res.json({ message: 'Old history data cleaned up' })
  } catch (error) {
    console.error('Error cleaning up history:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router