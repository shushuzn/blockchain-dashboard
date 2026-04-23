import type { Chain } from './chain'

export interface ChainState {
  chains: Chain[]
  activeChain: string
  ethPrice: string
  ethChange: number
  btcPrice: string
  lastUpdated: string
  history: Record<string, unknown[]>
  historyFromApi: boolean
  refreshInterval: number
  sampleInterval: number
  alertTimer: number | null
  lastSampleTime: number
}

export interface ChainStoreActions {
  fetchPrice(): Promise<void>
  loadConfig(): Promise<unknown>
  rpcCall(url: string, method: string, params?: unknown[]): Promise<unknown>
  fetchChainData(chain: Chain): Promise<unknown>
  refresh(): Promise<void>
  startRefresh(): void
  stopRefresh(): void
  loadHistory(chainId?: string | null, days?: number): Promise<void>
  loadHistoryFromLocal(): void
  saveHistoryPoint(chainId: string, point: unknown): Promise<void>
  trimHistory(chainId: string): void
  saveHistoryToLocal(): void
  reduceStorageUsage(): void
  fetchMEVData(chain: Chain): Promise<unknown>
}

export type ChainStore = ChainState & ChainStoreActions
