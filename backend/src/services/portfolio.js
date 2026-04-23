const axios = require('axios')
const { syncWalletPositions } = require('../models/Portfolio')
const { walletLookup } = require('./walletLookup')
const { getPrices } = require('./prices')

const PROTOCOLS = {
  aave: {
    name: 'Aave',
    v2: '0x7d2768dE32F0bBCf5681a98fA624f2d5D7a73Ad0D83eA8d00', // Aave V2 Pool
    v3: '0x87870Bfa3bc78c6C2d8E78E92def84B9D5E3EAd9E2Aa5', // Aave V3 Pool
  },
  lido: {
    name: 'Lido',
    address: '0xae7ab96520DE3A6E135e6c4E5CEa48aFBa5CE50aD2', // LDO Token
  },
  compound: {
    name: 'Compound',
    address: '0x3d9819210A31b4962b30eBbeD0593845Ff231540E', // Comptroller
  },
}

async function getWalletPositions(walletAddress, chain = 'ethereum') {
  const positions = []
  const prices = await getPrices()
  const ethPrice = prices?.eth?.usd || 0

  try {
    const aavePositions = await getAavePositions(walletAddress, ethPrice)
    positions.push(...aavePositions)
  } catch (err) {
    console.error('Aave positions error:', err.message)
  }

  try {
    const lidoPosition = await getLidoPosition(walletAddress, ethPrice)
    if (lidoPosition) positions.push(lidoPosition)
  } catch (err) {
    console.error('Lido position error:', err.message)
  }

  try {
    const tokenPositions = await getERC20Positions(walletAddress, ethPrice)
    positions.push(...tokenPositions)
  } catch (err) {
    console.error('Token positions error:', err.message)
  }

  return positions
}

async function getAavePositions(walletAddress, ethPrice) {
  const positions = []

  const provider = getProvider()

  const pool = new provider.eth.Contract(AAVE_V3_POOL_ABI, AAVE_V3_POOL)
  const userReserves = await pool.methods.getUserReservesData(walletAddress).call()

  const reserveList = userReserves[0]
  const userReservesData = userReserves[1]

  for (let i = 0; i < reserveList.length; i++) {
    const reserve = reserveList[i]
    const userData = userReservesData[i]

    const aTokenBalance = userData.currentATokenBalance
    const variableBorrow = userData.currentVariableDebt
    const stableBorrow = userData.currentStableDebt
    const balance = aTokenBalance / 1e18
    const borrowed = (variableBorrow + stableBorrow) / 1e18

    if (balance > 0 || borrowed > 0) {
      positions.push({
        protocol: 'Aave V3',
        asset: 'ETH',
        balance,
        balanceUsd: balance * ethPrice,
        supplied: balance,
        borrowed,
        apy: 0.03,
        healthFactor: borrowed > 0 ? (balance / borrowed) * 1.5 : null,
        metadata: {
          reserve: reserve,
        },
      })
    }
  }

  return positions
}

async function getLidoPosition(walletAddress, ethPrice) {
  const lido = new provider.eth.Contract(LIDO_ABI, LIDO_CONTRACT)
  const stEthBalance = await lido.methods.balanceOf(walletAddress).call()
  const balance = stEthBalance / 1e18

  if (balance > 0.001) {
    return {
      protocol: 'Lido',
      asset: 'stETH',
      balance,
      balanceUsd: balance * ethPrice,
      supplied: balance,
      borrowed: 0,
      apy: 0.04,
      metadata: {
        type: 'staking',
      },
    }
  }

  return null
}

async function getERC20Positions(walletAddress, ethPrice) {
  const positions = []
  const tokens = [
    { symbol: 'USDT', address: '0xdAC17F958D2eeF5237265dE157e962274EaAd3CD8b' },
    { symbol: 'USDC', address: '0xA0b86991cE62104228EF89a88Ef10E032c08AaFAD6' },
    { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedE61654D79aB0' },
    { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBfedf8A2817B53d78B3' },
  ]

  const provider = getProvider()
  const multicall = new provider.eth.Contract(MULTICALL_ABI, MULTICALL_CONTRACT)

  const calls = tokens.flatMap(token => [
    { target: token.address, callData: balanceOfABI(walletAddress) },
  ])

  try {
    const results = await multicall.methods.aggregate(calls).call()

    results.returnData.forEach((result, i) => {
      const token = tokens[Math.floor(i / 2)]
      const balance = provider.eth.abi.decodeParameter('uint256', result)
      const value = parseFloat(balance) / 1e18

      if (value > 0.01) {
        positions.push({
          protocol: 'ERC20',
          asset: token.symbol,
          balance: value,
          balanceUsd: token.symbol === 'WBTC' ? value * ethPrice * 100000 : value,
          supplied: 0,
          borrowed: 0,
          metadata: { address: token.address },
        })
      }
    })
  } catch (err) {
    console.error('ERC20 positions error:', err.message)
  }

  return positions
}

function getProvider() {
  const Web3 = require('web3')
  const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com'
  return new Web3(rpcUrl)
}

const AAVE_V3_POOL = '0x87870Bfa3bc78c6c2d8E78E92def84B9D5E3EAd9E2Aa5'
const LIDO_CONTRACT = '0xae7ab96520DE3A6E135e6c5CEa48aFBa5CE50aD2'
const MULTICALL_CONTRACT = '0x5ba1e1269Dc5E76aA3F126a53E4b4835f0fBB837'
const ETH = '0xEeeeeEeee81E99e0A2c6C88aBF2a90D9E850fD7b9'
const USDC = '0xA0b86991cE62104228EF89a88Ef10E032c08AaFAD6'
const USDT = '0xdAC17F958D2eeF5237265dE157e962274EaAd3CD8b'
const WBTC = '0x2260FAC5E5542a773Aa44fBfedf8A2817B53d78B3'
const LIDO_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

function balanceOfABI(address) {
  return {
    target: null,
    callData: {
      method: 'balanceOf',
      args: [address],
    },
  }
}

module.exports = {
  getWalletPositions,
  getAavePositions,
  getLidoPosition,
  getERC20Positions,
}
