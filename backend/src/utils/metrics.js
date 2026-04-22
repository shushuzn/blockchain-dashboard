const metrics = {
  requests: 0,
  errors: 0,
  startTime: Date.now(),
  slowQueries: [],
  endpoints: {}
}

const SLOW_THRESHOLD = 1000

function recordRequest(endpoint, duration, status) {
  metrics.requests++
  
  if (status >= 400) {
    metrics.errors++
  }
  
  if (!metrics.endpoints[endpoint]) {
    metrics.endpoints[endpoint] = { count: 0, totalDuration: 0, errors: 0 }
  }
  metrics.endpoints[endpoint].count++
  metrics.endpoints[endpoint].totalDuration += duration
  if (status >= 400) {
    metrics.endpoints[endpoint].errors++
  }
  
  if (duration > SLOW_THRESHOLD) {
    metrics.slowQueries.push({ endpoint, duration, timestamp: Date.now() })
    if (metrics.slowQueries.length > 100) {
      metrics.slowQueries.shift()
    }
  }
}

function getMetrics() {
  const uptime = Date.now() - metrics.startTime
  return {
    requests: metrics.requests,
    errors: metrics.errors,
    errorRate: metrics.requests > 0 ? (metrics.errors / metrics.requests * 100).toFixed(2) + '%' : '0%',
    uptime: formatUptime(uptime),
    endpoints: Object.entries(metrics.endpoints).map(([path, stats]) => ({
      path,
      count: stats.count,
      avgDuration: (stats.totalDuration / stats.count).toFixed(2) + 'ms',
      errorRate: stats.count > 0 ? (stats.errors / stats.count * 100).toFixed(2) + '%' : '0%'
    })),
    slowQueries: metrics.slowQueries.slice(-10)
  }
}

function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h ${minutes % 60}m`
}

function middleware(req, res, next) {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    recordRequest(req.path, duration, res.statusCode)
  })
  next()
}

module.exports = { metrics, recordRequest, getMetrics, middleware }
