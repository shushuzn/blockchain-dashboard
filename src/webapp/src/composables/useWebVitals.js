import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } from 'web-vitals'

const vitals = []

function formatMetric(value) {
  return typeof value === 'number' ? value.toFixed(2) : value
}

function sendToAnalytics({ name, delta, id, rating }) {
  const metric = {
    name,
    value: delta,
    id,
    rating,
    timestamp: Date.now(),
  }

  vitals.push(metric)

  console.log(`[Web Vitals] ${name}:`, {
    value: formatMetric(delta),
    rating,
    id,
  })

  if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
    fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
    }).catch(console.error)
  }
}

function initWebVitals() {
  try {
    onCLS(sendToAnalytics)
    onFID(sendToAnalytics)
    onFCP(sendToAnalytics)
    onLCP(sendToAnalytics)
    onTTFB(sendToAnalytics)
    onINP(sendToAnalytics)

    console.log('[Web Vitals] Monitoring initialized')
  } catch (error) {
    console.error('[Web Vitals] Failed to initialize:', error)
  }
}

function getVitals() {
  return [...vitals]
}

function getVitalsSummary() {
  const summary = {}
  const latest = {}

  vitals.forEach((v) => {
    if (!latest[v.name] || v.timestamp > latest[v.name].timestamp) {
      latest[v.name] = v
    }

    if (!summary[v.name]) {
      summary[v.name] = { values: [], count: 0 }
    }
    summary[v.name].values.push(v.value)
    summary[v.name].count++
  })

  Object.keys(summary).forEach((name) => {
    const values = summary[name].values
    summary[name] = {
      count: values.length,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      latest: latest[name]?.value,
      rating: latest[name]?.rating,
    }
  })

  return summary
}

function clearVitals() {
  vitals.length = 0
}

export {
  initWebVitals,
  getVitals,
  getVitalsSummary,
  clearVitals,
}
