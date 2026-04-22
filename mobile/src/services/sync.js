import AsyncStorage from '@react-native-async-storage/async-storage'

const CACHE_KEY = 'blockchain_data_cache'
const CACHE_TIMESTAMP_KEY = 'blockchain_data_cache_timestamp'
const CACHE_EXPIRY_MS = 5 * 60 * 1000

export async function getCachedData() {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY)
    const timestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY)

    if (!cached || !timestamp) {
      return null
    }

    const age = Date.now() - parseInt(timestamp, 10)
    if (age > CACHE_EXPIRY_MS) {
      await AsyncStorage.multiRemove([CACHE_KEY, CACHE_TIMESTAMP_KEY])
      return null
    }

    return JSON.parse(cached)
  } catch (error) {
    console.error('Failed to get cached data:', error)
    return null
  }
}

export async function setCachedData(data) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data))
    await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
  } catch (error) {
    console.error('Failed to cache data:', error)
  }
}

export async function clearCache() {
  try {
    await AsyncStorage.multiRemove([CACHE_KEY, CACHE_TIMESTAMP_KEY])
  } catch (error) {
    console.error('Failed to clear cache:', error)
  }
}

export async function getCacheAge() {
  try {
    const timestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY)
    if (!timestamp) return Infinity
    return Date.now() - parseInt(timestamp, 10)
  } catch {
    return Infinity
  }
}
