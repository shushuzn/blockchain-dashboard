const metrics = {
  requests: {
    total: 0,
    success: 0,
    errors: 0,
    byEndpoint: {},
    byMethod: {},
    byStatusCode: {}
  },
  responseTime: {
    sum: 0,
    count: 0,
    min: Infinity,
    max: 0
  },
  cache: {
    hits: 0,
    misses: 0
  },
  blockchain: {
    apiCalls: 0,
    errors: 0
  }
}

const middleware = (req, res, next) => {
  const start = Date.now()
  
  metrics.requests.total++
  
  metrics.requests.byMethod[req.method] = (metrics.requests.byMethod[req.method] || 0) + 1
  
  const endpoint = req.route ? req.route.path : req.path
  metrics.requests.byEndpoint[endpoint] = (metrics.requests.byEndpoint[endpoint] || 0) + 1
  
  res.on('finish', () => {
    const duration = Date.now() - start
    
    metrics.responseTime.sum += duration
    metrics.responseTime.count++
    metrics.responseTime.min = Math.min(metrics.responseTime.min, duration)
    metrics.responseTime.max = Math.max(metrics.responseTime.max, duration)
    
    const statusGroup = Math.floor(res.statusCode / 100) * 100
    metrics.requests.byStatusCode[statusGroup] = (metrics.requests.byStatusCode[statusGroup] || 0) + 1
    
    if (res.statusCode >= 400) {
      metrics.requests.errors++
    } else {
      metrics.requests.success++
    }
  })
  
  next()
}

function getMetrics() {
  const avgResponseTime = metrics.responseTime.count > 0
    ? (metrics.responseTime.sum / metrics.responseTime.count).toFixed(2)
    : 0
  
  return {
    requests: {
      total: metrics.requests.total,
      success: metrics.requests.success,
      errors: metrics.requests.errors,
      successRate: metrics.requests.total > 0
        ? ((metrics.requests.success / metrics.requests.total) * 100).toFixed(2) + '%'
        : '0%'
    },
    responseTime: {
      avg: avgResponseTime + 'ms',
      min: metrics.responseTime.min === Infinity ? 0 : metrics.responseTime.min + 'ms',
      max: metrics.responseTime.max + 'ms'
    },
    cache: {
      hits: metrics.cache.hits,
      misses: metrics.cache.misses,
      hitRate: metrics.cache.hits + metrics.cache.misses > 0
        ? ((metrics.cache.hits / (metrics.cache.hits + metrics.cache.misses)) * 100).toFixed(2) + '%'
        : '0%'
    },
    blockchain: {
      apiCalls: metrics.blockchain.apiCalls,
      errors: metrics.blockchain.errors
    },
    timestamp: new Date().toISOString()
  }
}

function recordCacheHit() {
  metrics.cache.hits++
}

function recordCacheMiss() {
  metrics.cache.misses++
}

function recordBlockchainApiCall() {
  metrics.blockchain.apiCalls++
}

function recordBlockchainError() {
  metrics.blockchain.errors++
}

function resetMetrics() {
  metrics.requests.total = 0
  metrics.requests.success = 0
  metrics.requests.errors = 0
  metrics.responseTime.sum = 0
  metrics.responseTime.count = 0
  metrics.responseTime.min = Infinity
  metrics.responseTime.max = 0
  metrics.cache.hits = 0
  metrics.cache.misses = 0
  metrics.blockchain.apiCalls = 0
  metrics.blockchain.errors = 0
}

module.exports = {
  middleware,
  getMetrics,
  recordCacheHit,
  recordCacheMiss,
  recordBlockchainApiCall,
  recordBlockchainError,
  resetMetrics
}
