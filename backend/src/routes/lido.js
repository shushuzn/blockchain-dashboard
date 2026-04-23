const express = require('express')
const router = express.Router()

// Mock Lido metrics data
const mockLidoMetrics = {
  totalETH: 925000,
  totalShares: 950000,
  bufferedEther: 5000,
  activeValidators: 250000,
  tvlUSD: 3600000000,
  apr: 3.8
}

router.get('/', (req, res) => {
  res.json(mockLidoMetrics)
})

router.post('/refresh', (req, res) => {
  res.json({ message: 'Cache refreshed', metrics: mockLidoMetrics })
})

module.exports = router