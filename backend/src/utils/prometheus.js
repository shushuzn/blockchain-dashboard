const Prometheus = require('prom-client')

const register = new Prometheus.Registry()

Prometheus.collectDefaultMetrics({ register })

const httpRequestDuration = new Prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
})

const httpRequestTotal = new Prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
})

const dbQueryDuration = new Prometheus.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
})

const cacheHits = new Prometheus.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['key'],
  registers: [register],
})

const cacheMisses = new Prometheus.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['key'],
  registers: [register],
})

const activeUsers = new Prometheus.Gauge({
  name: 'active_users_total',
  help: 'Number of active users',
  registers: [register],
})

const alertTotal = new Prometheus.Counter({
  name: 'alerts_total',
  help: 'Total number of alerts triggered',
  labelNames: ['chain', 'metric'],
  registers: [register],
})

function middleware(req, res, next) {
  const start = Date.now()

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000
    const route = req.route ? req.route.path : req.path

    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration)

    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc()
  })

  next()
}

function recordDbQuery(operation, table, duration) {
  dbQueryDuration
    .labels(operation, table)
    .observe(duration / 1000)
}

function recordCacheHit(key) {
  cacheHits.labels(key).inc()
}

function recordCacheMiss(key) {
  cacheMisses.labels(key).inc()
}

function recordAlert(chain, metric) {
  alertTotal.labels(chain, metric).inc()
}

async function getMetrics() {
  return await register.metrics()
}

module.exports = {
  middleware,
  recordDbQuery,
  recordCacheHit,
  recordCacheMiss,
  recordAlert,
  getMetrics,
  register,
  activeUsers,
}
