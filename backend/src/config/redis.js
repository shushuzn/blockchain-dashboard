const { createClient } = require('redis')

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

let redisClient = null
let isConnected = false

async function connectRedis() {
  if (redisClient && isConnected) {
    return redisClient
  }

  try {
    redisClient = createClient({
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
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
    })

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully')
      isConnected = true
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
    return redisClient
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message)
    isConnected = false
    return null
  }
}

async function getRedisClient() {
  if (!redisClient || !isConnected) {
    return await connectRedis()
  }
  return redisClient
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
  return isConnected && redisClient !== null
}

module.exports = {
  connectRedis,
  getRedisClient,
  closeRedis,
  isRedisConnected
}