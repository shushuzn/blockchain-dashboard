const { createClient } = require('redis')

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

let redisClient = null
let isConnected = false

const circuitBreaker = {
  failures: 0,
  lastFailure: null,
  state: 'CLOSED',
  successThreshold: 3,
  failureThreshold: 5,
  timeout: 30000,
  
  recordSuccess() {
    this.failures = 0
    this.lastFailure = null
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED'
      console.log('Circuit breaker: CLOSED (recovered)')
    }
  },
  
  recordFailure() {
    this.failures++
    this.lastFailure = Date.now()
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN'
      console.warn(`Circuit breaker: OPEN (${this.failures} failures)`)
    }
  },
  
  canAttempt() {
    if (this.state === 'CLOSED') return true
    
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = 'HALF_OPEN'
        console.log('Circuit breaker: HALF_OPEN (testing connection)')
        return true
      }
      return false
    }
    
    return true
  },
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailure: this.lastFailure
    }
  }
}

async function connectRedis() {
  if (!circuitBreaker.canAttempt()) {
    return null
  }

  if (redisClient && isConnected) {
    return redisClient
  }

  try {
    redisClient = createClient({
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            circuitBreaker.recordFailure()
            console.error('Redis: Max reconnection attempts reached')
            return false
          }
          return Math.min(retries * 100, 3000)
        }
      }
    })

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err.message)
      isConnected = false
      circuitBreaker.recordFailure()
    })

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully')
      isConnected = true
      circuitBreaker.recordSuccess()
    })

    redisClient.on('reconnecting', () => {
      console.log('Redis: Reconnecting...')
    })

    redisClient.on('end', () => {
      console.log('Redis: Connection closed')
      isConnected = false
    })

    await redisClient.connect()
    isConnected = true
    circuitBreaker.recordSuccess()
    return redisClient
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message)
    isConnected = false
    circuitBreaker.recordFailure()
    return null
  }
}

async function getRedisClient() {
  if (!circuitBreaker.canAttempt()) {
    return null
  }
  
  if (!redisClient || !isConnected) {
    return await connectRedis()
  }
  return redisClient
}

async function ping() {
  if (!isConnected || !redisClient) {
    return false
  }
  
  try {
    const result = await redisClient.ping()
    circuitBreaker.recordSuccess()
    return result === 'PONG'
  } catch (error) {
    circuitBreaker.recordFailure()
    return false
  }
}

async function closeRedis() {
  if (redisClient) {
    try {
      await redisClient.quit()
      console.log('Redis: Connection closed gracefully')
      isConnected = false
    } catch (error) {
      console.error('Redis: Error closing connection:', error.message)
    }
  }
}

function isRedisConnected() {
  return isConnected && redisClient !== null && circuitBreaker.state !== 'OPEN'
}

function getCircuitBreakerStatus() {
  return circuitBreaker.getState()
}

module.exports = {
  connectRedis,
  getRedisClient,
  closeRedis,
  isRedisConnected,
  ping,
  getCircuitBreakerStatus
}