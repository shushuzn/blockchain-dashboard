const express = require('express')
const router = express.Router()
const { generateReport } = require('../utils/analytics')
const { requirePermission, PERMISSIONS } = require('../middleware/permissions')
const { logger } = require('../utils/logger')

router.get('/report/:chainId', requirePermission(PERMISSIONS.READ_CHAIN_DATA), (req, res) => {
  try {
    const { chainId } = req.params
    const { period = '24h' } = req.query

    const report = generateReport(chainId, period)
    res.json(report)
  } catch (error) {
    logger.error('Report generation error', { error: error.message })
    res.status(500).json({ error: 'Failed to generate report' })
  }
})

router.get('/compare', requirePermission(PERMISSIONS.READ_CHAIN_DATA), (req, res) => {
  try {
    const { chains, period = '24h' } = req.query
    const chainList = chains ? chains.split(',') : ['ethereum', 'base', 'arbitrum', 'optimism']

    const reports = chainList.map(chainId => ({
      chainId,
      ...generateReport(chainId, period),
    }))

    const comparison = {
      period,
      generatedAt: new Date().toISOString(),
      chains: reports.map(r => ({
        chainId: r.chainId,
        currentGas: r.gas?.current,
        avgGas: r.gas?.avg?.toFixed(2),
        trend: r.gas?.trend?.trend,
        changePercent: r.gas?.trend?.change?.toFixed(2),
      })),
    }

    res.json(comparison)
  } catch (error) {
    logger.error('Comparison error', { error: error.message })
    res.status(500).json({ error: 'Failed to generate comparison' })
  }
})

module.exports = router