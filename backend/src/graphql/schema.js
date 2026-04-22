const { gql } = require('graphql-tag')

const typeDefs = gql`
  type ChainData {
    id: String!
    name: String!
    color: String!
    isSolana: Boolean
    hasBlob: Boolean
    hasMEV: Boolean
    decimals: Int
    current: ChainCurrent
    history: [HistoryPoint]
  }

  type ChainCurrent {
    gas: Float
    baseFee: Float
    blobFee: Float
    blockNumber: Float
    util: Float
    blockUtil: Float
    txs: Int
    mev: Float
    supply: Float
    marketCap: Float
  }

  type HistoryPoint {
    t: Int
    gas: Float
    baseFee: Float
    blobFee: Float
    util: Float
  }

  type PriceData {
    eth: CryptoPrice
    btc: CryptoPrice
  }

  type CryptoPrice {
    usd: Float
    usd_24h_change: Float
  }

  type Config {
    alertEnabled: Boolean
    cooldownMin: Int
    thresholds: Thresholds
  }

  type Thresholds {
    ethereum: ChainThresholds
    base: ChainThresholds
    arbitrum: ChainThresholds
    optimism: ChainThresholds
  }

  type ChainThresholds {
    gas: Float
    baseFee: Float
    blobFee: Float
    mev: Float
  }

  type Alert {
    id: Int
    time: String
    chain: String
    metric: String
    value: String
    threshold: String
  }

  type HealthStatus {
    status: String!
    uptime: String!
    cache: Boolean!
  }

  type MemeCoin {
    symbol: String
    name: String
    price_usd: Float
    volume_24h: Float
    percent_change_24h: Float
  }

  type LidoData {
    totalTvlUsd: Float
    ethTvlUsd: Float
    ethStakedCount: Int
    apy: Float
  }

  type AaveData {
    totalLiquidityUSD: Float
    totalBorrowsUSD: Float
    markets: [AaveMarket]
  }

  type AaveMarket {
    symbol: String
    totalSupply: Float
    totalBorrows: Float
    supplyAPY: Float
    borrowAPY: Float
  }

  type Query {
    chains: [ChainData]
    chain(id: String!): ChainData
    prices: PriceData
    config: Config
    alerts(limit: Int): [Alert]
    health: HealthStatus
    memeCoins: [MemeCoin]
    lidoTVL: LidoData
    aaveTVL: AaveData
    metrics: MetricsData
  }

  type MetricsData {
    uptime: String
    requests: Int
    errors: Int
    cache: Boolean
    slowQueries: [SlowQuery]
    endpoints: [EndpointStats]
  }

  type SlowQuery {
    path: String
    duration: Int
    timestamp: String
  }

  type EndpointStats {
    path: String
    count: Int
    errors: Int
    avgDuration: Float
    p95Duration: Int
    p99Duration: Int
  }
`

module.exports = { typeDefs }
