const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api'

import axios from 'axios'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export const getHealth = () => api.get('/health')

export const getHistory = (chainId) => api.get('/history', { params: { chainId } })

export const getConfig = (userId = 'default') => api.get(`/config?userId=${userId}`)

export const saveConfig = (userId, configData) => api.post('/config', { userId, ...configData })

export const getMemeCoins = () => api.get('/meme')

export const getLidoTVL = () => api.get('/lido')

export const getAaveTVL = () => api.get('/aave')

export const getMetrics = () => api.get('/metrics')

export default api
