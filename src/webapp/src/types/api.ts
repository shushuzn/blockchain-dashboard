export interface ApiError {
  message: string
  code: string
  status: number
  url: string
  timestamp: string
}

export interface HistoryResponse {
  data: Array<{
    timestamp: number
    gas: number
    baseFee: number
    blobFee?: number
    util: number
  }>
}

export interface ConfigResponse {
  userId: string
  alertEnabled: boolean
  thresholds: Record<string, ThresholdConfig>
  alertLog: AlertLogEntry[]
}

export interface ThresholdConfig {
  gas: number
  baseFee: number
  blobFee: number
}

export interface AlertLogEntry {
  time: string
  chain: string
  metric: string
  value: string
  threshold: string
}

export interface LidoMetrics {
  totalETH: string
  totalShares: string
  bufferedEther: string
  activeValidators: string
  priceMetrics?: {
    stethPrice: string
    stethRatio: string
    marketCap: string
  }
  dailyData?: Array<{
    date: number
    totalETH: string
  }>
}

export interface AaveMetrics {
  totalLiquidityUSD: string
  totalDebtUSD: string
  v2?: {
    markets: Market[]
  }
  v3?: {
    markets: Market[]
  }
}

export interface Market {
  symbol: string
  name: string
  liquidity: string
  debt: string
}
