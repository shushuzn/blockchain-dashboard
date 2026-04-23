import axios, { type AxiosInstance } from 'axios'
import type { ApiError, HistoryResponse, ConfigResponse, LidoMetrics, AaveMetrics } from '../types'
import { getLogger } from '../utils/logger'

const logger = getLogger('api')
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const MAX_RETRIES = 3
const INITIAL_DELAY = 1000

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function calculateDelay(attempt: number): number {
  return INITIAL_DELAY * Math.pow(2, attempt)
}

interface RetryableConfig {
  __retryCount?: number
  url?: string
  headers?: Record<string, string>
  baseURL?: string
  params?: Record<string, unknown>
  data?: unknown
  method?: string
}

interface RetryableError {
  config?: RetryableConfig
  response?: {
    status?: number
    data?: {
      message?: string
      code?: string
    }
  }
  code?: string
  message?: string
}

function shouldRetry(error: RetryableError): boolean {
  if (!error.config || (error.config.__retryCount ?? 0) >= MAX_RETRIES) {
    return false
  }
  
  const status = error.response?.status
  if (status === 429 || (status && status >= 500) || status === 0) {
    return true
  }
  
  if (!error.response && error.code === 'ECONNABORTED') {
    return true
  }
  
  return false
}

const apiClient: AxiosInstance = axios.create({
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
  async (error: RetryableError) => {
    const originalRequest = error.config
    
    if (shouldRetry(error) && originalRequest) {
      originalRequest.__retryCount = (originalRequest.__retryCount ?? 0) + 1
      
      const delay = calculateDelay((originalRequest.__retryCount ?? 1) - 1)
      logger.warn('[API] Retry', {
        attempt: originalRequest.__retryCount,
        maxRetries: MAX_RETRIES,
        delay: delay,
        url: originalRequest.url
      })
      
      await sleep(delay)
      return apiClient(originalRequest as never)
    }
    
    const errorResponse: ApiError = {
      message: error.response?.data?.message || error.message || 'Network error',
      code: error.response?.data?.code || error.code || 'UNKNOWN_ERROR',
      status: error.response?.status || 0,
      url: originalRequest?.url || 'unknown',
      timestamp: new Date().toISOString()
    }
    
    logger.error('[API Error]', errorResponse)
    
    return Promise.reject(errorResponse)
  }
)

export const historyApi = {
  async getHistory(chainId: string, days = 7): Promise<HistoryResponse> {
    return apiClient.get('/history', { params: { chainId, days } })
  },
  
  async addHistoryPoint(chainId: string, timestamp: number, gas: number, baseFee: number, blobFee: number, util: number): Promise<unknown> {
    return apiClient.post('/history', { chainId, timestamp, gas, baseFee, blobFee, util })
  },
  
  async cleanupOldHistory(): Promise<unknown> {
    return apiClient.delete('/history/cleanup')
  }
}

export const configApi = {
  async getConfig(userId = 'default'): Promise<ConfigResponse> {
    return apiClient.get('/config', { params: { userId } })
  },
  
  async saveConfig(configData: Record<string, unknown>, userId = 'default'): Promise<unknown> {
    return apiClient.post('/config', { userId, ...configData })
  },
  
  async clearAlertLog(userId = 'default'): Promise<unknown> {
    return apiClient.delete('/config/alerts', { params: { userId } })
  }
}

export const alertsApi = {
  async triggerAlert(chain: string, metric: string, value: number, threshold: number, alertConfig: Record<string, unknown>): Promise<unknown> {
    return apiClient.post('/alerts', { chain, metric, value, threshold, config: alertConfig })
  },
  
  async testAlert(type: string, alertConfig: Record<string, unknown>): Promise<unknown> {
    return apiClient.post('/alerts/test', { type, config: alertConfig })
  }
}

export const memeApi = {
  async getMemeCoins(): Promise<unknown> {
    return apiClient.get('/meme')
  },
  
  async checkHealth(): Promise<unknown> {
    return apiClient.get('/meme/health')
  }
}

export const healthApi = {
  async check(): Promise<{ status: string; timestamp: string }> {
    return apiClient.get('/health')
  }
}

export const lidoApi = {
  async getMetrics(): Promise<LidoMetrics> {
    return apiClient.get('/lido')
  }
}

export const aaveApi = {
  async getMetrics(): Promise<AaveMetrics> {
    return apiClient.get('/aave')
  }
}

export const isRetryableError = (error: RetryableError): boolean => {
  return shouldRetry({ ...error, config: { __retryCount: 0 } })
}

export default apiClient
