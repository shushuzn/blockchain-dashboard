const express = require('express')
const router = express.Router()
const { Wallet, getPortfolioSummary, syncWalletPositions } = require('../models/Portfolio')
const { getWalletPositions } = require('../services/portfolio')

router.post('/wallets', async (req, res) => {
  try {
    const { address, label, chain = 'ethereum' } = req.body
    const tenantId = req.headers['x-tenant-id']

    if (!address) {
      return res.status(400).json({ error: 'address is required' })
    }

    const existing = await Wallet.findOne({ where: { address, chain } })
    if (existing) {
      return res.json({ wallet: existing, message: 'Wallet already tracked' })
    }

    const wallet = await Wallet.create({ address, label, chain, tenantId })

    await syncWalletData(wallet.id, address, chain)

    res.status(201).json({
      wallet: { address: wallet.address, label: wallet.label, chain: wallet.chain },
      message: 'Wallet added successfully',
    })
  } catch (error) {
    console.error('Add wallet error:', error)
    res.status(500).json({ error: 'Failed to add wallet' })
  }
})

router.get('/wallets', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id']
    const where = tenantId ? { tenantId } : {}
    const wallets = await Wallet.findAll({ where })

    res.json({
      wallets: wallets.map(w => ({
        address: w.address,
        label: w.label,
        chain: w.chain,
        lastSynced: w.updatedAt,
      }),
      count: wallets.length,
    })
  } catch (error) {
    console.error('Get wallets error:', error)
    res.status(500).json({ error: 'Failed to get wallets' })
  }
})

router.delete('/wallets/:address', async (req, res) => {
  try {
    const { address } = req.params
    const deleted = await Wallet.destroy({ where: { address } })

    if (deleted === 0) {
      return res.status(404).json({ error: 'Wallet not found' })
    }

    res.json({ success: true, message: 'Wallet removed' })
  } catch (error) {
    console.error('Delete wallet error:', error)
    res.status(500).json({ error: 'Failed to delete wallet' })
  }
})

router.get('/summary', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id']
    const summary = await getPortfolioSummary(tenantId)
    res.json(summary)
  } catch (error) {
    console.error('Portfolio summary error:', error)
    res.status(500).json({ error: 'Failed to get portfolio summary' })
  }
})

router.post('/sync/:address', async (req, res) => {
  try {
    const { address } = req.params
    const { chain = 'ethereum' } = req.body

    await syncWalletData(null, address, chain)

    res.json({ success: true, message: 'Wallet synced' })
  } catch (error) {
    console.error('Sync wallet error:', error)
    res.status(500).json({ error: 'Failed to sync wallet' })
  }
})

router.get('/health', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id']
    const summary = await getPortfolioSummary(tenantId)

    const totalValue = parseFloat(summary.totalValueUsd || 0)
    const totalBorrowed = parseFloat(summary.totalBorrowed || 0)
    const totalSupplied = parseFloat(summary.totalSupplied || 0)

    let status = 'healthy'
    let warnings = []

    if (summary.leverageRatio > 0.8) {
      status = 'risky'
      warnings.push('High leverage ratio')
    }

    if (totalValue < 1000) {
      warnings.push('Low portfolio value')
    }

    const positions = await Position.findAll()
    const risky = positions.filter(p => {
      const hf = parseFloat(p.healthFactor)
      return hf && hf < 1.5
    })

    if (risky.length > 0) {
      status = 'danger'
      warnings.push(`${risky.length} positions near liquidation`)
    }

    res.json({
      status,
      warnings,
      metrics: {
        totalValue,
        totalSupplied,
        totalBorrowed,
        netWorth: totalValue,
        leverageRatio: summary.leverageRatio,
      },
      riskScore: calculateRiskScore(summary),
      recommendations: getRecommendations(summary),
    })
  } catch (error) {
    console.error('Health check error:', error)
    res.status(500).json({ error: 'Failed to calculate health' })
  }
})

function calculateRiskScore(summary) {
  let score = 100

  if (summary.leverageRatio > 0.5) score -= 20
  if (summary.leverageRatio > 0.7) score -= 20
  if (summary.leverageRatio > 0.9) score -= 30

  const protocolCount = Object.keys(summary.protocolSummaries || {}).length
  if (protocolCount < 2) score -= 10

  return Math.max(0, score)
}

function getRecommendations(summary) {
  const recs = []

  if (summary.leverageRatio > 0.7) {
    recs.push({
      type: 'warning',
      message: 'Consider reducing leverage to avoid liquidation risk',
    })
  }

  if (Object.keys(summary.protocolSummaries || {}).length < 2) {
    recs.push({
      type: 'info',
      message: 'Diversify across protocols to reduce risk',
    })
  }

  const protocols = Object.entries(summary.protocolSummaries || {})
  protocols.forEach(([name, data]) => {
    if (data.totalValueUsd < 100) {
      recs.push({
        type: 'info',
        message: `${name} position ($${data.totalValueUsd.toFixed(2)}) is small - consider consolidating`,
      })
    }
  })

  return recs
}

async function syncWalletData(walletId, address, chain) {
  const { Wallet, Position } = require('../models/Portfolio')

  let wallet = walletId
    ? await Wallet.findByPk(walletId)
    : await Wallet.findOne({ where: { address, chain } })

  if (!wallet) {
    wallet = await Wallet.create({ address, chain })
  }

  try {
    const positions = await getWalletPositions(address, chain)
    await syncWalletPositions(wallet.id, positions.map(p => ({ ...p, walletId: wallet.id }))
    console.log(`Synced ${positions.length} positions for ${address}`)
  } catch (err) {
    console.error('Sync positions error:', err)
  }
}

module.exports = router
