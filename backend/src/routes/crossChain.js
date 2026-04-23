const express = require('express')
const router = express.Router()
const chainStore = require('../stores/chain')

const L2_CHAINS = ['base', 'arbitrum', 'optimism', 'zksync', 'starknet']

function aggregateCrossChain() {
  const chains = chainStore.chains
  const aggregated = {
    timestamp: new Date().toISOString(),
    chains: {},
    summary: {
      avgGas: 0,
      minGas: Infinity,
      maxGas: 0,
      bestChain: null,
      worstChain: null,
    },
  }

  let totalGas = 0
  let count = 0

  chains.forEach((chain) => {
    const current = chainStore.chainCurrentState[chain.id]
    if (!current) return

    aggregated.chains[chain.id] = {
      name: chain.name,
      gas: current.gas || 0,
      baseFee: current.baseFee || 0,
      blobFee: current.blobFee || 0,
      util: current.util || 0,
      isL2: L2_CHAINS.includes(chain.id),
    }

    if (current.gas) {
      totalGas += current.gas
      count++

      if (current.gas < aggregated.summary.minGas) {
        aggregated.summary.minGas = current.gas
        aggregated.summary.bestChain = chain.id
      }
      if (current.gas > aggregated.summary.maxGas) {
        aggregated.summary.maxGas = current.gas
        aggregated.summary.worstChain = chain.id
      }
    }
  })

  if (count > 0) {
    aggregated.summary.avgGas = totalGas / count
  }

  return aggregated
}

function compareL2() {
  const l2Data = {}

  L2_CHAINS.forEach((chainId) => {
    const chain = chainStore.chains.find((c) => c.id === chainId)
    const current = chainStore.chainCurrentState[chainId]

    if (chain && current) {
      l2Data[chainId] = {
        name: chain.name,
        gas: current.gas || 0,
        baseFee: current.baseFee || 0,
        blobFee: current.blobFee || 0,
        util: current.util || 0,
        txs: current.txs || 0,
      }
    }
  })

  const comparison = {
    timestamp: new Date().toISOString(),
    chains: l2Data,
    recommendation: getL2Recommendation(l2Data),
  }

  return comparison
}

function getL2Recommendation(l2Data) {
  const chains = Object.entries(l2Data)
  if (chains.length === 0) {
    return { bestFor: null, recommended: null, reasoning: 'No L2 data available' }
  }

  const byGas = [...chains].sort((a, b) => a[1].gas - b[1].gas)
  const bySpeed = [...chains].sort((a, b) => (b.txs || 0) - (a.txs || 0))

  const cheapest = byGas[0]
  const fastest = bySpeed[0]

  return {
    bestForCost: cheapest[0],
    bestForSpeed: fastest[0],
    recommended: cheapest[0],
    reasoning: `Cheapest L2: ${cheapest[1].name} (${cheapest[1].gas?.toFixed(2)} gwei)`,
  }
}

function detectArbitrage() {
  const opportunities = []
  const chains = chainStore.chains
  const prices = chainStore.prices

  if (!prices?.eth?.usd) return opportunities

  chains.forEach((chainA) => {
    chains.forEach((chainB) => {
      if (chainA.id === chainB.id) return

      const gasA = chainStore.chainCurrentState[chainA.id]?.gas || 0
      const gasB = chainStore.chainCurrentState[chainB.id]?.gas || 0

      const diff = Math.abs(gasA - gasB)
      const avgGas = (gasA + gasB) / 2
      const profitPercent = (diff / avgGas) * 100

      if (profitPercent > 10) {
        opportunities.push({
          chainA: chainA.id,
          chainB: chainB.id,
          gasDiff: diff.toFixed(2),
          profitPercent: profitPercent.toFixed(2),
          estimatedProfitUsd: ((diff * 21000 * prices.eth.usd) / 1e9).toFixed(2),
        })
      }
    })
  })

  return opportunities.sort((a, b) => parseFloat(b.profitPercent) - parseFloat(a.profitPercent))
}

router.get('/cross-chain', (req, res) => {
  try {
    const aggregated = aggregateCrossChain()
    res.json(aggregated)
  } catch (error) {
    console.error('Cross-chain aggregation error:', error)
    res.status(500).json({ error: 'Failed to aggregate cross-chain data' })
  }
})

router.get('/l2-comparison', (req, res) => {
  try {
    const comparison = compareL2()
    res.json(comparison)
  } catch (error) {
    console.error('L2 comparison error:', error)
    res.status(500).json({ error: 'Failed to compare L2 chains' })
  }
})

router.get('/arbitrage', (req, res) => {
  try {
    const opportunities = detectArbitrage()
    res.json({
      opportunities: opportunities.slice(0, 10),
      total: opportunities.length,
    })
  } catch (error) {
    console.error('Arbitrage detection error:', error)
    res.status(500).json({ error: 'Failed to detect arbitrage opportunities' })
  }
})

router.get('/gas-index', (req, res) => {
  try {
    const aggregated = aggregateCrossChain()
    const chains = Object.entries(aggregated.chains)
    const ranked = chains
      .sort((a, b) => a[1].gas - b[1].gas)
      .map(([id, data], index) => ({
        rank: index + 1,
        chain: id,
        name: data.name,
        gas: data.gas,
        score: 100 - index * (100 / chains.length),
      }))

    res.json({
      timestamp: aggregated.timestamp,
      ranked,
      cheapest: ranked[0],
      mostExpensive: ranked[ranked.length - 1],
    })
  } catch (error) {
    console.error('Gas index error:', error)
    res.status(500).json({ error: 'Failed to calculate gas index' })
  }
})

module.exports = router
