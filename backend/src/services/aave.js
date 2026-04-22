const axios = require('axios')

const AAVE_SUBGRAPH = 'https://api.thegraph.com/subgraphs/name/aave/aave-v2'
const AAVE_V3_SUBGRAPH = 'https://api.thegraph.com/subgraphs/name/aave/aave-v3'

async function fetchAaveTVLV2() {
  try {
    const query = `{
      markets(first: 10, orderBy: totalLiquidityUSD, orderDirection: desc) {
        id
        name
        symbol
        totalLiquidityUSD
        totalDebtUSD
        availableLiquidityUSD
        priceInUSD
        reserve {
          name
          symbol
        }
      }
      _meta {
        block {
          number
          timestamp
        }
      }
    }`
    
    const response = await axios.post(AAVE_SUBGRAPH, { query })
    
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message)
    }
    
    const data = response.data.data
    const markets = data.markets || []
    
    let totalLiquidity = 0
    let totalDebt = 0
    
    markets.forEach(market => {
      totalLiquidity += parseFloat(market.totalLiquidityUSD || 0)
      totalDebt += parseFloat(market.totalDebtUSD || 0)
    })
    
    return {
      protocol: 'Aave V2',
      totalLiquidityUSD: totalLiquidity,
      totalDebtUSD: totalDebt,
      markets: markets.map(m => ({
        name: m.name || m.reserve?.name,
        symbol: m.symbol || m.reserve?.symbol,
        liquidity: parseFloat(m.totalLiquidityUSD || 0),
        debt: parseFloat(m.totalDebtUSD || 0),
        available: parseFloat(m.availableLiquidityUSD || 0)
      })),
      block: data._meta?.block?.number,
      timestamp: data._meta?.block?.timestamp
    }
  } catch (error) {
    console.error('Failed to fetch Aave V2 data:', error.message)
    return null
  }
}

async function fetchAaveTVLV3() {
  try {
    const query = `{
      markets(first: 10, orderBy: totalLiquidityUSD, orderDirection: desc) {
        id
        name
        symbol
        totalLiquidityUSD
        totalDebtUSD
        availableLiquidityUSD
        priceInUSD
        reserve {
          name
          symbol
        }
      }
      _meta {
        block {
          number
          timestamp
        }
      }
    }`
    
    const response = await axios.post(AAVE_V3_SUBGRAPH, { query })
    
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message)
    }
    
    const data = response.data.data
    const markets = data.markets || []
    
    let totalLiquidity = 0
    let totalDebt = 0
    
    markets.forEach(market => {
      totalLiquidity += parseFloat(market.totalLiquidityUSD || 0)
      totalDebt += parseFloat(market.totalDebtUSD || 0)
    })
    
    return {
      protocol: 'Aave V3',
      totalLiquidityUSD: totalLiquidity,
      totalDebtUSD: totalDebt,
      markets: markets.map(m => ({
        name: m.name || m.reserve?.name,
        symbol: m.symbol || m.reserve?.symbol,
        liquidity: parseFloat(m.totalLiquidityUSD || 0),
        debt: parseFloat(m.totalDebtUSD || 0),
        available: parseFloat(m.availableLiquidityUSD || 0)
      })),
      block: data._meta?.block?.number,
      timestamp: data._meta?.block?.timestamp
    }
  } catch (error) {
    console.error('Failed to fetch Aave V3 data:', error.message)
    return null
  }
}

async function getAaveMetrics() {
  const [v2, v3] = await Promise.all([
    fetchAaveTVLV2(),
    fetchAaveTVLV3()
  ])
  
  let totalLiquidity = 0
  let totalDebt = 0
  
  if (v2) {
    totalLiquidity += v2.totalLiquidityUSD
    totalDebt += v2.totalDebtUSD
  }
  
  if (v3) {
    totalLiquidity += v3.totalLiquidityUSD
    totalDebt += v3.totalDebtUSD
  }
  
  return {
    totalLiquidityUSD: totalLiquidity,
    totalDebtUSD: totalDebt,
    v2: v2,
    v3: v3,
    timestamp: new Date().toISOString()
  }
}

module.exports = {
  fetchAaveTVLV2,
  fetchAaveTVLV3,
  getAaveMetrics
}