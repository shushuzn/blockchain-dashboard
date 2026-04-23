const express = require('express')
const router = express.Router()
const { logger } = require('../utils/logger')

const mockMemeCoins = [
  {
    name: 'Solana Monkey Business',
    symbol: 'SMB',
    price: 0.00001234,
    change24h: 15.5,
    marketCap: 123456789,
    volume24h: 12345678,
    logo: 'https://example.com/smb.png'
  },
  {
    name: 'Doge Solana',
    symbol: 'DOGESOL',
    price: 0.00000987,
    change24h: -5.2,
    marketCap: 98765432,
    volume24h: 9876543,
    logo: 'https://example.com/dogesol.png'
  },
  {
    name: 'Solana Pepe',
    symbol: 'SOLPEPE',
    price: 0.00000543,
    change24h: 25.8,
    marketCap: 54321098,
    volume24h: 5432109,
    logo: 'https://example.com/solpepe.png'
  },
  {
    name: 'Solana Shiba',
    symbol: 'SOLSHIB',
    price: 0.00000321,
    change24h: 8.9,
    marketCap: 32109876,
    volume24h: 3210987,
    logo: 'https://example.com/solshib.png'
  },
  {
    name: 'Solana Cat',
    symbol: 'SOLCAT',
    price: 0.00000123,
    change24h: -2.1,
    marketCap: 12309876,
    volume24h: 1230987,
    logo: 'https://example.com/solcat.png'
  }
]

router.get('/', (req, res) => {
  try {
    res.json(mockMemeCoins)
  } catch (error) {
    logger.error('Error fetching meme coins', { error: error.message })
    res.status(500).json({
      error: 'Failed to fetch meme coins',
      details: error.message
    })
  }
})

router.get('/health', (req, res) => {
  try {
    res.json({ status: 'ok', message: 'Meme service is available (using mock data)' })
  } catch (error) {
    logger.error('Meme health check error', { error: error.message })
    res.status(500).json({ status: 'error', message: error.message })
  }
})

module.exports = router