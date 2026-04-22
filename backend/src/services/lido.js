const axios = require('axios')

const LIDO_CONTRACT = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'
const LIDO_API = 'https://api.thegraph.com/subgraphs/name/lidofinance/lido-mainnet'

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
    console.error('Failed to fetch Lido TVL:', error.message)
    return null
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
    console.error('Failed to fetch Lido APR:', error.message)
    return null
  }
}

async function getLidoMetrics() {
  const [tvl, apr] = await Promise.all([
    fetchLidoTVL(),
    fetchLidoAPR()
  ])
  
  if (!tvl) {
    return null
  }
  
  return {
    ...tvl,
    apr
  }
}

module.exports = { fetchLidoTVL, fetchLidoAPR, getLidoMetrics }