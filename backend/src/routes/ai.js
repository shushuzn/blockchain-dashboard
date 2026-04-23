const express = require('express')
const router = express.Router()
const { detectAnomaly, predictNextValue, recommendThresholds, getAnomalyStats } = require('../services/anomalyDetector')

router.get('/stats/:chainId', (req, res) => {
  try {
    const { chainId } = req.params
    const stats = getAnomalyStats(chainId)
    res.json(stats)
  } catch (error) {
    console.error('Stats error:', error)
    res.status(500).json({ error: 'Failed to get stats' })
  }
})

router.get('/recommendations/:chainId', (req, res) => {
  try {
    const { chainId } = req.params
    const recommendations = recommendThresholds(chainId)
    res.json({ chainId, recommendations })
  } catch (error) {
    console.error('Recommendations error:', error)
    res.status(500).json({ error: 'Failed to get recommendations' })
  }
})

router.get('/predict/:chainId', (req, res) => {
  try {
    const { chainId } = req.params
    const { metric = 'gas', periods = 5 } = req.query

    const prediction = predictNextValue(chainId, metric, parseInt(periods))

    if (!prediction) {
      return res.status(404).json({ error: 'Not enough data for prediction' })
    }

    res.json({ chainId, metric, ...prediction })
  } catch (error) {
    console.error('Prediction error:', error)
    res.status(500).json({ error: 'Failed to generate prediction' })
  }
})

router.get('/analyze/:chainId', (req, res) => {
  try {
    const { chainId } = req.params
    const { metric = 'gas' } = req.query

    const chainStore = require('../stores/chain')
    const currentData = chainStore.chainCurrentState[chainId]

    if (!currentData) {
      return res.status(404).json({ error: 'Chain data not found' })
    }

    const currentValue = currentData[metric]
    const anomaly = detectAnomaly(chainId, metric, currentValue)
    const stats = getAnomalyStats(chainId)
    const prediction = predictNextValue(chainId, metric)
    const recommendations = recommendThresholds(chainId)

    res.json({
      chainId,
      current: {
        metric,
        value: currentValue,
      },
      stats: stats[metric],
      anomaly,
      prediction,
      recommendations: recommendations[metric],
    })
  } catch (error) {
    console.error('Analysis error:', error)
    res.status(500).json({ error: 'Failed to analyze' })
  }
})

module.exports = router
