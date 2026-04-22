require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const { connectRedis, isRedisConnected } = require('./src/config/redis')

const app = express()
const PORT = process.env.PORT || 8000

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(morgan('combined'))

// Routes
const historyRoutes = require('./src/routes/history')
const configRoutes = require('./src/routes/config')
const alertRoutes = require('./src/routes/alerts')
const memeRoutes = require('./src/routes/meme')
const lidoRoutes = require('./src/routes/lido')
const aaveRoutes = require('./src/routes/aave')

app.use('/api/history', historyRoutes)
app.use('/api/config', configRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/meme', memeRoutes)
app.use('/api/lido', lidoRoutes)
app.use('/api/aave', aaveRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    cache: isRedisConnected() ? 'connected' : 'disconnected'
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

// Start server
async function startServer() {
  console.log('='.repeat(50))
  console.log('Blockchain Dashboard Backend')
  console.log('='.repeat(50))
  
  // Try to connect to Redis
  console.log('Connecting to Redis...')
  await connectRedis()
  
  if (!isRedisConnected()) {
    console.warn('⚠️  Redis not connected. Running without cache.')
    console.warn('   Set REDIS_URL environment variable to enable caching.')
  }
  
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`)
    console.log(`   Health check: http://localhost:${PORT}/api/health`)
    console.log()
    console.log('📡 API routes:')
    console.log('   GET  /api/health    - Health check (includes cache status)')
    console.log('   GET  /api/history   - Get chain history data')
    console.log('   POST /api/history   - Add history data')
    console.log('   GET  /api/config    - Get user config')
    console.log('   POST /api/config    - Save user config')
    console.log('   POST /api/alerts    - Trigger alert')
    console.log('   GET  /api/meme      - Get Solana meme coins')
    console.log('   GET  /api/lido      - Get Lido TVL metrics (cached)')
    console.log('   POST /api/lido/refresh - Force refresh Lido cache')
    console.log('   GET  /api/aave      - Get Aave TVL metrics (cached)')
    console.log('   POST /api/aave/refresh - Force refresh Aave cache')
    console.log('='.repeat(50))
  })
}

startServer()

module.exports = app