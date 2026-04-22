import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const MAX_RETRIES = 3
const INITIAL_DELAY = 1000

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function calculateDelay(attempt) {
  return INITIAL_DELAY * Math.pow(2, attempt)
}

const shouldRetry = (error) => {
  if (!error.config || error.config.__retryCount >= MAX_RETRIES) {
    return false
  }
  
  const status = error.response?.status
  if (status === 429 || status >= 500 || status === 0) {
    return true
  }
  
  if (!error.response && error.code === 'ECONNABORTED') {
    return true
  }
  
  return false
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use(
  config => {
    config.headers['X-Request-ID'] = crypto.randomUUID()
    return config
  },
  error => Promise.reject(error)
)

apiClient.interceptors.response.use(
  response => response.data,
  async error => {
    const originalRequest = error.config
    
    if (shouldRetry(error)) {
      originalRequest.__retryCount = originalRequest.__retryCount || 0
      originalRequest.__retryCount++
      
      const delay = calculateDelay(originalRequest.__retryCount - 1)
      console.warn(`[API] Retry ${originalRequest.__retryCount}/${MAX_RETRIES} after ${delay}ms: ${originalRequest.url}`)
      
      await sleep(delay)
      return apiClient(originalRequest)
    }
    
    const errorResponse = {
      message: error.response?.data?.message || error.message || 'Network error',
      code: error.response?.data?.code || error.code || 'UNKNOWN_ERROR',
      status: error.response?.status || 0,
      url: originalRequest?.url || 'unknown',
      timestamp: new Date().toISOString()
    }
    
    console.error('[API Error]', errorResponse)
    
    return Promise.reject(errorResponse)
  }
)

export const historyApi = {
  async getHistory(chainId, days = 7) {
    return apiClient.get('/history', { params: { chainId, days } })
  },
  
  async addHistoryPoint(chainId, timestamp, gas, baseFee, blobFee, util) {
    return apiClient.post('/history', { chainId, timestamp, gas, baseFee, blobFee, util })
  },
  
  async cleanupOldHistory() {
    return apiClient.delete('/history/cleanup')
  }
}

export const configApi = {
  async getConfig(userId = 'default') {
    return apiClient.get('/config', { params: { userId } })
  },
  
  async saveConfig(configData, userId = 'default') {
    return apiClient.post('/config', { userId, ...configData })
  },
  
  async clearAlertLog(userId = 'default') {
    return apiClient.delete('/config/alerts', { params: { userId } })
  }
}

export const alertsApi = {
  async triggerAlert(chain, metric, value, threshold, alertConfig) {
    return apiClient.post('/alerts', { chain, metric, value, threshold, config: alertConfig })
  },
  
  async testAlert(type, alertConfig) {
    return apiClient.post('/alerts/test', { type, config: alertConfig })
  }
}

export const memeApi = {
  async getMemeCoins() {
    return apiClient.get('/meme')
  },
  
  async checkHealth() {
    return apiClient.get('/meme/health')
  }
}

export const healthApi = {
  async check() {
    return apiClient.get('/health')
  }
}

export const lidoApi = {
  async getMetrics() {
    return apiClient.get('/lido')
  }
}

export const aaveApi = {
  async getMetrics() {
    return apiClient.get('/aave')
  }
}

export const isRetryableError = (error) => {
  return shouldRetry({ config: { __retryCount: 0 }, response: error.response, code: error.code })
}

export default apiClient
