const chainStore = require('../stores/chain')

function calculateTrend(data, key = 'gas') {
  if (!data || data.length < 2) return { trend: 'stable', change: 0 }

  const recent = data.slice(-5)
  const old = data.slice(0, 5)

  const recentAvg = recent.reduce((sum, p) => sum + (p[key] || 0), 0) / recent.length
  const oldAvg = old.reduce((sum, p) => sum + (p[key] || 0), 0) / old.length

  const change = ((recentAvg - oldAvg) / oldAvg) * 100

  if (change > 10) return { trend: 'increasing', change }
  if (change < -10) return { trend: 'decreasing', change }
  return { trend: 'stable', change }
}

function calculateMovingAverage(data, key = 'gas', window = 10) {
  if (!data || data.length < window) return []

  const result = []
  for (let i = window - 1; i < data.length; i++) {
    const slice = data.slice(i - window + 1, i + 1)
    const avg = slice.reduce((sum, p) => sum + (p[key] || 0), 0) / window
    result.push({
      t: data[i].t,
      value: avg,
    })
  }

  return result
}

function detectAnomalies(data, key = 'gas', threshold = 2) {
  if (!data || data.length < 10) return []

  const values = data.map(p => p[key] || 0)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  return data.filter(p => {
    const value = p[key] || 0
    return Math.abs(value - mean) > threshold * stdDev
  }).map(p => ({
    t: p.t,
    value: p[key],
    deviation: ((p[key] - mean) / stdDev).toFixed(2),
  }))
}

function predictNextValue(data, key = 'gas') {
  if (!data || data.length < 5) return null

  const recent = data.slice(-10)
  const values = recent.map(p => p[key] || 0)

  const n = values.length
  const sumX = (n * (n - 1)) / 2
  const sumY = values.reduce((a, b) => a + b, 0)
  const sumXY = values.reduce((sum, y, x) => sum + x * y, 0)
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  const nextX = n
  const predicted = intercept + slope * nextX

  return {
    predicted: Math.max(0, predicted),
    slope: slope.toFixed(4),
    confidence: calculateConfidence(values),
  }
}

function calculateConfidence(values) {
  if (values.length < 3) return 'low'

  const variance = calculateVariance(values)
  if (variance < 0.1) return 'high'
  if (variance < 1) return 'medium'
  return 'low'
}

function calculateVariance(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
}

function generateReport(chainId, period = '24h') {
  const history = chainStore.chainHistory[chainId] || []
  const now = Date.now()
  const periodMs = period === '24h' ? 24 * 60 * 60 * 1000 : period === '7d' ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000

  const filtered = history.filter(p => now - p.t * 1000 < periodMs)

  if (filtered.length === 0) {
    return { error: 'No data available for the specified period' }
  }

  const gasValues = filtered.map(p => p.gas || 0)
  const baseFeeValues = filtered.map(p => p.baseFee || 0)

  return {
    chainId,
    period,
    generatedAt: new Date().toISOString(),
    summary: {
      dataPoints: filtered.length,
      timeRange: {
        start: new Date(filtered[0].t * 1000).toISOString(),
        end: new Date(filtered[filtered.length - 1].t * 1000).toISOString(),
      },
    },
    gas: {
      min: Math.min(...gasValues),
      max: Math.max(...gasValues),
      avg: gasValues.reduce((a, b) => a + b, 0) / gasValues.length,
      current: gasValues[gasValues.length - 1],
      trend: calculateTrend(filtered, 'gas'),
      movingAvg: calculateMovingAverage(filtered, 'gas', 10),
      anomalies: detectAnomalies(filtered, 'gas'),
      prediction: predictNextValue(filtered, 'gas'),
    },
    baseFee: {
      min: Math.min(...baseFeeValues),
      max: Math.max(...baseFeeValues),
      avg: baseFeeValues.reduce((a, b) => a + b, 0) / baseFeeValues.length,
      current: baseFeeValues[baseFeeValues.length - 1],
      trend: calculateTrend(filtered, 'baseFee'),
    },
  }
}

module.exports = {
  calculateTrend,
  calculateMovingAverage,
  detectAnomalies,
  predictNextValue,
  generateReport,
}
