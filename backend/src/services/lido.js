const axios = require('axios')
const { logger } = require('../utils/logger')

const LIDO_CONTRACT = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'
const LIDO_API = 'https://api.thegraph.com/subgraphs/name/lidofinance/lido-mainnet'

const mockLidoMetrics = {
  totalETH: 925000,
  totalShares: 950000,
  bufferedEther: 5000,
  activeValidators: 250000,
  tvlUSD: 3600000000,
  apr: 3.8
}

async function fetchLidoTVL() {
  try {
    const query = `{
      lidoContract(id: "${LIDO_CONTRACT.toLowerCase()}") {
        totalETH
        totalShares
        bufferedEther
        withdrawaldestinations {
          isPartiallyWithdrawable
          isWithdrawable
        }
      }
      dailyData(first: 7, orderBy: date, orderDirection: desc) {
        date
        totalETH
        totalShares
        activeValidators
      }
    }`
    
    const response = await axios.post(LIDO_API, { query })
    
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message)
    }
    
    const data = response.data.data
    const lidoContract = data.lidoContract
    
    if (!lidoContract) {
      return null
    }
    
    const totalETH = parseFloat(lidoContract.totalETH) / 1e18
    const totalShares = parseFloat(lidoContract.totalShares) / 1e18
    const bufferedEther = parseFloat(lidoContract.bufferedEther) / 1e18
    
    const latestDaily = data.dailyData[0]
    const activeValidators = latestDaily ? parseInt(latestDaily.activeValidators) : 0
    
    return {
      totalETH,
      totalShares,
      bufferedEther,
      activeValidators,
      tvlUSD: null,
      apr: null
    }
  } catch (error) {
    logger.error('Failed to fetch Lido TVL', { error: error.message })
    return mockLidoMetrics
  }
}

async function fetchLidoAPR() {
  try {
    const query = `{
      lidoContract(id: "${LIDO_CONTRACT.toLowerCase()}") {
        apr
      }
    }`
    
    const response = await axios.post(LIDO_API, { query })
    
    if (response.data.errors || !response.data.data.lidoContract) {
      return null
    }
    
    return parseFloat(response.data.data.lidoContract.apr) * 100
  } catch (error) {
    logger.error('Failed to fetch Lido APR', { error: error.message })
    return mockLidoMetrics.apr
  }
}

async function getLidoMetrics() {
  try {
    const [tvl, apr] = await Promise.all([
      fetchLidoTVL(),
      fetchLidoAPR()
    ])
    
    if (!tvl) {
      return mockLidoMetrics
    }
    
    return {
      ...tvl,
      apr: apr || mockLidoMetrics.apr
    }
  } catch (error) {
    logger.error('Failed to get Lido metrics', { error: error.message })
    return mockLidoMetrics
  }
}

module.exports = { fetchLidoTVL, fetchLidoAPR, getLidoMetrics }