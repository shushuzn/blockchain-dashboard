const { getRedisClient, isRedisConnected } = require('../config/redis')

const CACHE_TTL = {
  PRICE: 60,
  CHAIN: 30,
  LIDO: 300,
  AAVE: 300,
  MEME: 60
}

const CACHE_KEYS = {
  PRICE: 'price:',
  CHAIN: 'chain:',
  LIDO: 'lido:',
  AAVE: 'aave:',
  MEME: 'meme:'
}

const MEMORY_CACHE_TTL = 60000
const memoryCache = new Map()

function cleanupMemoryCache() {
  const now = Date.now()
  for (const [key, { data, expires }] of memoryCache.entries()) {
    if (now > expires) {
      memoryCache.delete(key)
    }
  }
}

setInterval(cleanupMemoryCache, MEMORY_CACHE_TTL)

async function getCache(key) {
  try {
    const client = await getRedisClient()
    
    if (client) {
      try {
        const value = await client.get(key)
        if (value) {
          console.log(`[CACHE HIT] ${key} (Redis)`)
          return JSON.parse(value)
        }
      } catch (redisError) {
        console.warn(`[CACHE] Redis error, falling back to memory: ${redisError.message}`)
      }
    }
    
    const memCached = memoryCache.get(key)
    if (memCached && Date.now() < memCached.expires) {
      console.log(`[CACHE HIT] ${key} (Memory)`)
      return memCached.data
    }
    
    console.log(`[CACHE MISS] ${key}`)
    return null
  } catch (error) {
    console.error(`[CACHE ERROR] Get ${key}:`, error.message)
    return null
  }
}

async function setCache(key, value, ttlSeconds) {
  try {
    const client = await getRedisClient()
    
    if (client) {
      try {
        await client.setEx(key, ttlSeconds, JSON.stringify(value))
        console.log(`[CACHE SET] ${key} (TTL: ${ttlSeconds}s) [Redis]`)
      } catch (redisError) {
        console.warn(`[CACHE] Redis set error: ${redisError.message}`)
      }
    }
    
    memoryCache.set(key, {
      data: value,
      expires: Date.now() + Math.min(ttlSeconds * 1000, MEMORY_CACHE_TTL)
    })
    console.log(`[CACHE SET] ${key} (TTL: ${ttlSeconds}s) [Memory]`)
    return true
  } catch (error) {
    console.error(`[CACHE ERROR] Set ${key}:`, error.message)
    return false
  }
}

async function deleteCache(key) {
  try {
    memoryCache.delete(key)
    
    const client = await getRedisClient()
    if (client) {
      await client.del(key)
    }
    
    console.log(`[CACHE DELETE] ${key}`)
    return true
  } catch (error) {
    console.error(`[CACHE ERROR] Delete ${key}:`, error.message)
    return false
  }
}

async function getCachedOrFetch(key, ttlSeconds, fetchFn) {
  const cached = await getCache(key)
  if (cached !== null) {
    return cached
  }

  const data = await fetchFn()
  if (data !== null) {
    await setCache(key, data, ttlSeconds)
  }
  return data
}

async function getPriceCache(symbol = 'eth') {
  return await getCache(`${CACHE_KEYS.PRICE}${symbol}`)
}

async function setPriceCache(symbol, data) {
  return await setCache(`${CACHE_KEYS.PRICE}${symbol}`, data, CACHE_TTL.PRICE)
}

async function getChainCache(chainId) {
  return await getCache(`${CACHE_KEYS.CHAIN}${chainId}`)
}

async function setChainCache(chainId, data) {
  return await setCache(`${CACHE_KEYS.CHAIN}${chainId}`, data, CACHE_TTL.CHAIN)
}

async function getLidoCache() {
  return await getCache(CACHE_KEYS.LIDO)
}

async function setLidoCache(data) {
  return await setCache(CACHE_KEYS.LIDO, data, CACHE_TTL.LIDO)
}

async function getAaveCache(poolId = 'main') {
  return await getCache(`${CACHE_KEYS.AAVE}${poolId}`)
}

async function setAaveCache(poolId, data) {
  return await setCache(`${CACHE_KEYS.AAVE}${poolId}`, data, CACHE_TTL.AAVE)
}

async function getMemeCache() {
  return await getCache(CACHE_KEYS.MEME)
}

async function setMemeCache(data) {
  return await setCache(CACHE_KEYS.MEME, data, CACHE_TTL.MEME)
}

async function invalidateAllChainCache() {
  try {
    const client = await getRedisClient()
    if (!client) return false

    const keys = await client.keys(`${CACHE_KEYS.CHAIN}*`)
    if (keys.length > 0) {
      await client.del(keys)
      console.log(`[CACHE INVALIDATE] ${keys.length} chain cache keys`)
    }
    return true
  } catch (error) {
    console.error('[CACHE ERROR] Invalidate chain cache:', error.message)
    return false
  }
}

module.exports = {
  CACHE_TTL,
  CACHE_KEYS,
  getCache,
  setCache,
  deleteCache,
  getCachedOrFetch,
  getPriceCache,
  setPriceCache,
  getChainCache,
  setChainCache,
  getLidoCache,
  setLidoCache,
  getAaveCache,
  setAaveCache,
  getMemeCache,
  setMemeCache,
  invalidateAllChainCache,
  isRedisConnected
}