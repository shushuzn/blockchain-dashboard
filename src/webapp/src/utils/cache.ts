import { getLogger } from './logger'

const logger = getLogger('cache')
const CACHE_PREFIX = 'mcm_cache_'
const DEFAULT_TTL = 5 * 60 * 1000

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
  size: number
}

interface CacheStats {
  count: number
  sizeBytes: number
  sizeKB: string
  hits: number
  misses: number
  hitRate: string
}

class CacheManager {
  private hits = 0
  private misses = 0

  getCache<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(CACHE_PREFIX + key)
      if (!item) {
        this.misses++
        return null
      }

      const cacheItem: CacheItem<T> = JSON.parse(item)
      const now = Date.now()

      if (now - cacheItem.timestamp > cacheItem.ttl) {
        localStorage.removeItem(CACHE_PREFIX + key)
        this.misses++
        return null
      }

      this.hits++
      return cacheItem.data
    } catch {
      this.misses++
      return null
    }
  }

  setCache<T>(key: string, data: T, ttl = DEFAULT_TTL): boolean {
    try {
      const dataStr = JSON.stringify(data)
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        size: dataStr.length,
      }
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item))
      return true
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Cache write error:', { error: errorMessage })
      
      if (this.isQuotaExceeded(error)) {
        this.evictOldest(0.3)
        try {
          const dataStr = JSON.stringify(data)
          const item: CacheItem<T> = {
            data,
            timestamp: Date.now(),
            ttl,
            size: dataStr.length,
          }
          localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item))
          return true
        } catch {
          return false
        }
      }
      
      return false
    }
  }

  removeCache(key: string): void {
    localStorage.removeItem(CACHE_PREFIX + key)
  }

  clearCache(): void {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX))
    keys.forEach(k => localStorage.removeItem(k))
    this.hits = 0
    this.misses = 0
  }

  getCacheStats(): CacheStats {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX))
    let totalSize = 0

    keys.forEach(k => {
      totalSize += localStorage.getItem(k)?.length || 0
    })

    const totalRequests = this.hits + this.misses
    const hitRate = totalRequests > 0 ? ((this.hits / totalRequests) * 100).toFixed(2) : '0.00'

    return {
      count: keys.length,
      sizeBytes: totalSize,
      sizeKB: (totalSize / 1024).toFixed(2),
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`
    }
  }

  isCacheValid(key: string, maxAge = DEFAULT_TTL): boolean {
    try {
      const item = localStorage.getItem(CACHE_PREFIX + key)
      if (!item) return false

      const cacheItem: CacheItem<unknown> = JSON.parse(item)
      return Date.now() - cacheItem.timestamp < maxAge
    } catch {
      return false
    }
  }

  getCacheInfo(key: string): CacheItem<unknown> | null {
    try {
      const item = localStorage.getItem(CACHE_PREFIX + key)
      if (!item) return null

      return JSON.parse(item)
    } catch {
      return null
    }
  }

  getCacheKeys(): string[] {
    return Object.keys(localStorage)
      .filter(k => k.startsWith(CACHE_PREFIX))
      .map(k => k.replace(CACHE_PREFIX, ''))
  }

  private evictOldest(percentage: number): void {
    const items: Array<{ key: string; timestamp: number }> = []
    
    Object.keys(localStorage)
      .filter(k => k.startsWith(CACHE_PREFIX))
      .forEach(k => {
        try {
          const item = JSON.parse(localStorage.getItem(k) || '')
          items.push({ key: k, timestamp: item.timestamp })
        } catch {
          localStorage.removeItem(k)
        }
      })

    items.sort((a, b) => a.timestamp - b.timestamp)
    const toRemove = Math.ceil(items.length * percentage)
    
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(items[i].key)
    }

    logger.info(`Cache eviction: removed ${toRemove} items`)
  }

  private isQuotaExceeded(error: unknown): boolean {
    if (error instanceof DOMException) {
      return error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    }
    return false
  }

  getOrSet<T>(key: string, factory: () => T | Promise<T>, ttl = DEFAULT_TTL): T | Promise<T> {
    const cached = this.getCache<T>(key)
    if (cached !== null) {
      return cached
    }

    const result = factory()
    
    if (result instanceof Promise) {
      return result.then((data: T) => {
        this.setCache(key, data, ttl)
        return data
      })
    }

    this.setCache(key, result, ttl)
    return result
  }

  async getOrSetAsync<T>(key: string, factory: () => Promise<T>, ttl = DEFAULT_TTL): Promise<T> {
    const cached = this.getCache<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await factory()
    this.setCache(key, data, ttl)
    return data
  }

  resetStats(): void {
    this.hits = 0
    this.misses = 0
  }
}

export const cache = new CacheManager()

export function getCache<T>(key: string): T | null {
  return cache.getCache<T>(key)
}

export function setCache<T>(key: string, data: T, ttl = DEFAULT_TTL): boolean {
  return cache.setCache<T>(key, data, ttl)
}

export function removeCache(key: string): void {
  cache.removeCache(key)
}

export function clearCache(): void {
  cache.clearCache()
}

export function getCacheStats(): CacheStats {
  return cache.getCacheStats()
}

export function isCacheValid(key: string, maxAge = DEFAULT_TTL): boolean {
  return cache.isCacheValid(key, maxAge)
}

export function getCacheInfo(key: string) {
  return cache.getCacheInfo(key)
}

export function getCacheKeys(): string[] {
  return cache.getCacheKeys()
}

export default cache