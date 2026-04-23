import axios, { type AxiosInstance } from 'axios'
import type { ApiError, HistoryResponse, ConfigResponse, LidoMetrics, AaveMetrics } from '../types'
import { getLogger } from '../utils/logger'

const logger = getLogger('api')
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const MAX_RETRIES = 3
const INITIAL_DELAY = 1000
const RATE_LIMIT_WINDOW = 60000
const MAX_REQUESTS_PER_WINDOW = 100

interface RateLimitState {
  requests: number[]
  lastReset: number
}

const rateLimitState: RateLimitState = {
  requests: [],
  lastReset: Date.now()
}

const pendingRequests = new Map<string, Promise<unknown>>()

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function calculateDelay(attempt: number): number {
  return INITIAL_DELAY * Math.pow(2, attempt)
}

function checkRateLimit(): boolean {
  const now = Date.now()
  
  if (now - rateLimitState.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitState.requests = []
    rateLimitState.lastReset = now
  }
  
  if (rateLimitState.requests.length >= MAX_REQUESTS_PER_WINDOW) {
    logger.warn('[API] Rate limit reached', {
      requests: rateLimitState.requests.length,
      limit: MAX_REQUESTS_PER_WINDOW
    })
    return false
  }
  
  rateLimitState.requests.push(now)
  return true
}

function generateRequestKey(config: { method?: string; url?: string; params?: unknown; data?: unknown }): string {
  return `${config.method || 'GET'}:${config.url}:${JSON.stringify(config.params)}:${JSON.stringify(config.data)}`
}

interface RetryableConfig {
  __retryCount?: number
  __customResolve?: (value: unknown) => void
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
    if (!checkRateLimit()) {
      return Promise.reject(new Error('Rate limit exceeded'))
    }
    
    config.headers['X-Request-ID'] = crypto.randomUUID()
    
    const requestKey = generateRequestKey(config)
    const existingRequest = pendingRequests.get(requestKey)
    
    if (existingRequest && config.method === 'GET') {
      logger.info('[API] Deduplicating request', { url: config.url })
      return Promise.reject({ __deduplicated: true, originalPromise: existingRequest })
    }
    
    pendingRequests.set(requestKey, new Promise(resolve => {
      ;(config as unknown as { __customResolve?: (value: unknown) => void }).__customResolve = resolve
    }))
    
    return config
  },
  error => Promise.reject(error)
)

apiClient.interceptors.response.use(
  response => {
    const requestKey = generateRequestKey(response.config)
    pendingRequests.delete(requestKey)
    
    const customResolve = (response.config as unknown as { __customResolve?: (value: unknown) => void }).__customResolve
    if (customResolve) {
      customResolve(response.data)
    }
    
    return response.data
  },
  async (error: RetryableError) => {
    if ((error as { __deduplicated?: boolean }).__deduplicated) {
      return (error as { originalPromise: Promise<unknown> }).originalPromise
    }
    
    const originalRequest = error.config
    
    if (originalRequest) {
      const requestKey = generateRequestKey(originalRequest)
      pendingRequests.delete(requestKey)
    }
    
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
    
    logger.error('[API Error]', { ...errorResponse })
    
    return Promise.reject(errorResponse)
  }
)

export const getRateLimitStatus = () => ({
  used: rateLimitState.requests.length,
  limit: MAX_REQUESTS_PER_WINDOW,
  remaining: MAX_REQUESTS_PER_WINDOW - rateLimitState.requests.length,
  windowReset: rateLimitState.lastReset + RATE_LIMIT_WINDOW
})

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
