import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error.message)
    return Promise.reject(error)
  }
)

export const historyApi = {
  getHistory(chainId, days = 7) {
    return apiClient.get('/history', { params: { chainId, days } })
  },
  
  addHistoryPoint(chainId, timestamp, gas, baseFee, blobFee, util) {
    return apiClient.post('/history', { chainId, timestamp, gas, baseFee, blobFee, util })
  },
  
  cleanupOldHistory() {
    return apiClient.delete('/history/cleanup')
  }
}

export const configApi = {
  getConfig(userId = 'default') {
    return apiClient.get('/config', { params: { userId } })
  },
  
  saveConfig(configData, userId = 'default') {
    return apiClient.post('/config', { userId, ...configData })
  },
  
  clearAlertLog(userId = 'default') {
    return apiClient.delete('/config/alerts', { params: { userId } })
  }
}

export const alertsApi = {
  triggerAlert(chain, metric, value, threshold, alertConfig) {
    return apiClient.post('/alerts', { chain, metric, value, threshold, config: alertConfig })
  },
  
  testAlert(type, alertConfig) {
    return apiClient.post('/alerts/test', { type, config: alertConfig })
  }
}

export const memeApi = {
  getMemeCoins() {
    return apiClient.get('/meme')
  },
  
  checkHealth() {
    return apiClient.get('/meme/health')
  }
}

export const healthApi = {
  check() {
    return apiClient.get('/health')
  }
}

export const lidoApi = {
  getMetrics() {
    return apiClient.get('/lido')
  }
}

export default apiClient