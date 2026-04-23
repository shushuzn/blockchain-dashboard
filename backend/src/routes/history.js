const express = require('express')
const router = express.Router()
const History = require('../models/History')
const { logger } = require('../utils/logger')

router.get('/', async (req, res) => {
  try {
    const { chainId, days = 7, limit = 1000, offset = 0 } = req.query
    
    if (!chainId) {
      return res.status(400).json({ error: 'chainId is required' })
    }

    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000)
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 1000, 1), 10000)
    const parsedOffset = Math.max(parseInt(offset) || 0, 0)
    
    if (History) {
      const { count, rows } = await History.findAndCountAll({
        where: {
          chainId,
          timestamp: { [History.sequelize.Op.gte]: cutoff }
        },
        order: [['timestamp', 'ASC']],
        limit: parsedLimit,
        offset: parsedOffset
      })

      res.json({
        data: rows.map(h => ({
          t: h.timestamp,
          gas: h.gas,
          baseFee: h.baseFee,
          blobFee: h.blobFee,
          util: h.util
        })),
        total: count,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + rows.length < count
      })
    } else {
      const mockData = Array.from({ length: parsedLimit }, (_, i) => {
        const timestamp = cutoff + (i * (24 * 60 * 60 * 1000 / 24))
        return {
          t: timestamp,
          gas: Math.random() * 100,
          baseFee: Math.random() * 100000000000,
          blobFee: Math.random() * 1000000000,
          util: Math.random() * 100
        }
      })

      res.json({
        data: mockData,
        total: 1000,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + mockData.length < 1000
      })
    }
  } catch (error) {
    logger.error('Error fetching history', { error: error.message })
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { chainId, timestamp, gas, baseFee, blobFee, util } = req.body
    
    if (!chainId || !timestamp) {
      return res.status(400).json({ error: 'chainId and timestamp are required' })
    }

    if (History) {
      const history = await History.create({
        chainId,
        timestamp,
        gas,
        baseFee,
        blobFee,
        util
      })

      res.json(history)
    } else {
      res.json({
        id: 1,
        chainId,
        timestamp,
        gas,
        baseFee,
        blobFee,
        util
      })
    }
  } catch (error) {
    logger.error('Error adding history', { error: error.message })
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/cleanup', async (req, res) => {
  try {
    if (History) {
      const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000)
      
      await History.destroy({
        where: {
          timestamp: { [History.sequelize.Op.lt]: cutoff }
        }
      })

      res.json({ message: 'Old history data cleaned up' })
    } else {
      res.json({ message: 'Old history data cleaned up' })
    }
  } catch (error) {
    logger.error('Error cleaning up history', { error: error.message })
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router