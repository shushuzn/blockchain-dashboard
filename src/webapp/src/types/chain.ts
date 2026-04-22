export interface Chain {
  id: string
  name: string
  color: string
  rpc: string
  explorer: string
  decimals: number
  hasBlob: boolean
  hasMEV: boolean
  isSolana?: boolean
}

export interface ChainData {
  block: number
  blockFmt: string
  blockSub: string
  gas: number
  gasFmt: string
  baseFee: number
  baseFeeFmt: string
  blobFee: number | null
  blobFeeFmt: string
  utilPct: number
  utilPctFmt: string
  supply: string
  mcap: string
  mevData: MEVData | null
}

export interface MEVData {
  mevReward: number
  mevCount: number
  mevShare: string
}

export interface HistoryPoint {
  t: number
  gas: number
  baseFee: number
  blobFee: number
  util: number
}

export interface PriceData {
  ethPrice: string
  ethChange: number
  btcPrice: string
}
