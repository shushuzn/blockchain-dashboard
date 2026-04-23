const express = require('express')
const router = express.Router()
const { getMetrics } = require('../utils/metrics')
const { getCircuitBreakerStatus } = require('../config/redis')
const { isDatabaseConnected } = require('../config/database')

router.get('/', (req, res) => {
  const metrics = getMetrics()
  const circuitBreaker = getCircuitBreakerStatus()
  
  let output = '# HELP blockchain_dashboard_requests_total Total number of requests\n'
  output += '# TYPE blockchain_dashboard_requests_total counter\n'
  output += `blockchain_dashboard_requests_total{status="success"} ${metrics.requests.success}\n`
  output += `blockchain_dashboard_requests_total{status="error"} ${metrics.requests.errors}\n`
  
  output += '\n# HELP blockchain_dashboard_response_time_ms Response time in milliseconds\n'
  output += '# TYPE blockchain_dashboard_response_time_ms gauge\n'
  const avgMatch = metrics.responseTime.avg.match(/^([\d.]+)/)
  const avg = avgMatch ? avgMatch[1] : '0'
  output += `blockchain_dashboard_response_time_ms{type="avg"} ${avg}\n`
  const maxMatch = metrics.responseTime.max.match(/^(\d+)/)
  const max = maxMatch ? maxMatch[1] : '0'
  output += `blockchain_dashboard_response_time_ms{type="max"} ${max}\n`
  
  output += '\n# HELP blockchain_dashboard_cache Cache metrics\n'
  output += '# TYPE blockchain_dashboard_cache gauge\n'
  output += `blockchain_dashboard_cache{type="hits"} ${metrics.cache.hits}\n`
  output += `blockchain_dashboard_cache{type="misses"} ${metrics.cache.misses}\n`
  
  output += '\n# HELP blockchain_dashboard_blockchain Blockchain API metrics\n'
  output += '# TYPE blockchain_dashboard_blockchain gauge\n'
  output += `blockchain_dashboard_blockchain{type="api_calls"} ${metrics.blockchain.apiCalls}\n`
  output += `blockchain_dashboard_blockchain{type="errors"} ${metrics.blockchain.errors}\n`
  
  output += '\n# HELP blockchain_dashboard_circuit_breaker Circuit breaker status\n'
  output += '# TYPE blockchain_dashboard_circuit_breaker gauge\n'
  output += `blockchain_dashboard_circuit_breaker{state="${circuitBreaker.state}"} 1\n`
  
  output += '\n# HELP blockchain_dashboard_database Database connection status\n'
  output += '# TYPE blockchain_dashboard_database gauge\n'
  output += `blockchain_dashboard_database{status="${isDatabaseConnected() ? 'connected' : 'disconnected'}"} 1\n`
  
  res.set('Content-Type', 'text/plain')
  res.send(output)
})

module.exports = router
