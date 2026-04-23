const chainStore = require('../stores/chain')
const configStore = require('../stores/config')
const { recordAlert } = require('../utils/metrics')
const { eventBus } = require('./eventBus')

const HISTORY_WINDOW = 100
const ZSCORE_THRESHOLD = 2.5
const ANOMALY_COOLDOWN = 5 * 60 * 1000

const recentAnomalies = new Map()

function calculateMean(values) {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

function calculateStd(values, mean) {
  if (values.length < 2) return 0
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2))
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length
  return Math.sqrt(variance)
}

function detectAnomaly(chainId, metric, currentValue) {
  const history = chainStore.chainHistory[chainId] || []
  if (history.length < 20) return null

  const recentHistory = history.slice(-HISTORY_WINDOW)
  const values = recentHistory.map((p) => p[metric]).filter((v) => v !== undefined)

  if (values.length < 20) return null

  const mean = calculateMean(values)
  const std = calculateStd(values, mean)

  if (std === 0) return null

  const zScore = Math.abs((currentValue - mean) / std)

  if (zScore > ZSCORE_THRESHOLD) {
    const cooldownKey = `${chainId}:${metric}`
    const lastAnomaly = recentAnomalies.get(cooldownKey)

    if (lastAnomaly && Date.now() - lastAnomaly < ANOMALY_COOLDOWN) {
      return null
    }

    recentAnomalies.set(cooldownKey, Date.now())

    const anomaly = {
      type: currentValue > mean ? 'spike' : 'drop',
      chain: chainId,
      metric,
      value: currentValue,
      mean,
      std,
      zScore: zScore.toFixed(2),
      severity: zScore > 3 ? 'high' : 'medium',
      timestamp: new Date().toISOString(),
    }

    eventBus.emit('anomaly.detected', anomaly)
    recordAlert(chainId, metric)

    return anomaly
  }

  return null
}

function predictNextValue(chainId, metric, periods = 5) {
  const history = chainStore.chainHistory[chainId] || []
  if (history.length < 10) return null

  const values = history.slice(-20).map((p) => p[metric]).filter((v) => v !== undefined)
  if (values.length < 10) return null

  const n = values.length
  const xValues = Array.from({ length: n }, (_, i) => i)

  const sumX = xValues.reduce((a, b) => a + b, 0)
  const sumY = values.reduce((a, b) => a + b, 0)
  const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0)
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  const predictions = []
  for (let i = 1; i <= periods; i++) {
    predictions.push({
      period: i,
      predicted: Math.max(0, intercept + slope * (n + i - 1),
    })
  }

  return {
    slope: slope.toFixed(4),
    intercept: intercept.toFixed(4),
    predictions,
    confidence: calculateConfidence(values),
  }
}

function calculateConfidence(values) {
  if (values.length < 10) return 'low'

  const mean = calculateMean(values)
  const variance = calculateStd(values, mean) / mean

  if (variance < 0.1) return 'high'
  if (variance < 0.3) return 'medium'
  return 'low'
}

function getAnomalyStats(chainId) {
  const history = chainStore.chainHistory[chainId] || []
  const stats = {}

  const metrics = ['gas', 'baseFee', 'blobFee', 'util']

  metrics.forEach((metric) => {
    const values = history.map((p) => p[metric]).filter((v) => v !== undefined)
    if (values.length === 0) return

    stats[metric] = {
      mean: calculateMean(values).toFixed(2),
      std: calculateStd(values, calculateMean(values)).toFixed(2),
      min: Math.min(...values).toFixed(2),
      max: Math.max(...values).toFixed(2),
    }
  })

  return stats
}

function recommendThresholds(chainId) {
  const stats = getAnomalyStats(chainId)

  const thresholds = {}

  if (stats.gas) {
    const mean = parseFloat(stats.gas.mean)
    const std = parseFloat(stats.gas.std)
    thresholds.gas = {
      warning: (mean + std).toFixed(2),
      critical: (mean + 2 * std).toFixed(2),
    }
  }

  if (stats.baseFee) {
    const mean = parseFloat(stats.baseFee.mean)
    const std = parseFloat(stats.baseFee.std)
    thresholds.baseFee = {
      warning: (mean + std).toFixed(2),
      critical: (mean + 2 * std).toFixed(2),
    }
  }

  return thresholds
}

module.exports = {
  detectAnomaly,
  predictNextValue,
  getAnomalyStats,
  recommendThresholds,
}
