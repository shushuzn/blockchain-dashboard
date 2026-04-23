let redisClient = null
let isConnected = false
let circuitBreaker = null
const { logger } = require('../utils/logger')

try {
  const { createClient } = require('redis')
  const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

  circuitBreaker = {
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
        logger.info('Circuit breaker recovered', { state: 'CLOSED' })
      }
    },
    
    recordFailure() {
      this.failures++
      this.lastFailure = Date.now()
      
      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN'
        logger.warn('Circuit breaker opened', { failures: this.failures })
      }
    },
    
    canAttempt() {
      if (this.state === 'CLOSED') return true
      
      if (this.state === 'OPEN') {
        if (Date.now() - this.lastFailure > this.timeout) {
          this.state = 'HALF_OPEN'
          logger.info('Circuit breaker half-open', { message: 'testing connection' })
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
              logger.error('Redis max reconnection attempts reached')
              return false
            }
            return Math.min(retries * 100, 3000)
          }
        }
      })

      redisClient.on('error', (err) => {
        logger.error('Redis client error', { error: err.message })
        isConnected = false
        circuitBreaker.recordFailure()
      })

      redisClient.on('connect', () => {
        logger.info('Redis connected successfully')
        isConnected = true
        circuitBreaker.recordSuccess()
      })

      redisClient.on('reconnecting', () => {
        logger.info('Redis reconnecting')
      })

      redisClient.on('end', () => {
        logger.info('Redis connection closed')
        isConnected = false
      })

      await redisClient.connect()
      isConnected = true
      circuitBreaker.recordSuccess()
      return redisClient
    } catch (error) {
      logger.error('Redis connection failed', { error: error.message })
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
        logger.info('Redis connection closed gracefully')
        isConnected = false
      } catch (error) {
        logger.error('Redis error closing connection', { error: error.message })
      }
    }
  }

  function isRedisConnected() {
    return isConnected && redisClient !== null && circuitBreaker.state !== 'OPEN'
  }

  function getCircuitBreakerStatus() {
    return circuitBreaker ? circuitBreaker.getState() : { state: 'CLOSED', failures: 0, lastFailure: null }
  }

  module.exports = {
    connectRedis,
    getRedisClient,
    closeRedis,
    isRedisConnected,
    ping,
    getCircuitBreakerStatus
  }
} catch (error) {
  logger.warn('Redis module not available', { error: error.message })
  
  module.exports = {
    connectRedis: async () => null,
    getRedisClient: async () => null,
    closeRedis: async () => {},
    isRedisConnected: () => false,
    ping: async () => false,
    getCircuitBreakerStatus: () => ({ state: 'CLOSED', failures: 0, lastFailure: null })
  }
}