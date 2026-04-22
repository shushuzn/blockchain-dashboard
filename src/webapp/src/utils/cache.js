const CACHE_PREFIX = 'mcm_cache_'
const DEFAULT_TTL = 5 * 60 * 1000

export function getCache(key) {
  try {
    const item = localStorage.getItem(CACHE_PREFIX + key)
    if (!item) return null

    const { data, timestamp, ttl } = JSON.parse(item)
    const now = Date.now()

    if (now - timestamp > ttl) {
      localStorage.removeItem(CACHE_PREFIX + key)
      return null
    }

    return data
  } catch {
    return null
  }
}

export function setCache(key, data, ttl = DEFAULT_TTL) {
  try {
    const item = {
      data,
      timestamp: Date.now(),
      ttl,
    }
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item))
    return true
  } catch (error) {
    console.error('Cache write error:', error)
    return false
  }
}

export function removeCache(key) {
  localStorage.removeItem(CACHE_PREFIX + key)
}

export function clearCache() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX))
  keys.forEach(k => localStorage.removeItem(k))
}

export function getCacheStats() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX))
  let totalSize = 0

  keys.forEach(k => {
    totalSize += localStorage.getItem(k)?.length || 0
  })

  return {
    count: keys.length,
    sizeBytes: totalSize,
    sizeKB: (totalSize / 1024).toFixed(2),
  }
}

export function isCacheValid(key, maxAge = DEFAULT_TTL) {
  try {
    const item = localStorage.getItem(CACHE_PREFIX + key)
    if (!item) return false

    const { timestamp } = JSON.parse(item)
    return Date.now() - timestamp < maxAge
  } catch {
    return false
  }
}

export default {
  getCache,
  setCache,
  removeCache,
  clearCache,
  getCacheStats,
  isCacheValid,
}
