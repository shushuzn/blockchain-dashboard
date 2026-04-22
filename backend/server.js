require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const { connectRedis, isRedisConnected } = require('./src/config/redis')
const { notFoundHandler, globalErrorHandler, logError } = require('./src/utils/errors')

const app = express()
const PORT = process.env.PORT || 8000

app.use(helmet())
app.use(cors())
app.use(express.json())

morgan.token('request-id', (req) => req.get('x-request-id') || '-')
app.use(morgan(':method :url :status :response-time ms - :res[content-length] [:request-id]'))

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

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    cache: isRedisConnected() ? 'connected' : 'disconnected',
    version: process.env.npm_package_version || '1.0.0'
  })
})

app.use(notFoundHandler)
app.use(globalErrorHandler)

async function startServer() {
  console.log('='.repeat(50))
  console.log('Blockchain Dashboard Backend')
  console.log('='.repeat(50))
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  
  console.log('Connecting to Redis...')
  await connectRedis()
  
  if (!isRedisConnected()) {
    console.warn('⚠️  Redis not connected. Running without cache.')
  }
  
  const server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`)
    console.log(`   Health check: http://localhost:${PORT}/api/health`)
    console.log()
    console.log('📡 API routes:')
    console.log('   GET  /api/health    - Health check')
    console.log('   GET  /api/history   - Get chain history data')
    console.log('   POST /api/history   - Add history data')
    console.log('   GET  /api/config    - Get user config')
    console.log('   POST /api/config    - Save user config')
    console.log('   POST /api/alerts    - Trigger alert')
    console.log('   GET  /api/meme      - Get Solana meme coins')
    console.log('   GET  /api/lido      - Get Lido TVL (cached)')
    console.log('   POST /api/lido/refresh - Refresh Lido cache')
    console.log('   GET  /api/aave      - Get Aave TVL (cached)')
    console.log('   POST /api/aave/refresh - Refresh Aave cache')
    console.log('='.repeat(50))
  })
  
  const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`)
    server.close(() => {
      console.log('HTTP server closed.')
      process.exit(0)
    })
    
    setTimeout(() => {
      console.error('Forced shutdown after timeout')
      process.exit(1)
    }, 10000)
  }
  
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  
  process.on('uncaughtException', (err) => {
    logError(err)
    process.exit(1)
  })
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  })
}

startServer()

module.exports = app
