require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const { connectRedis, isRedisConnected } = require('./src/config/redis')
const { notFoundHandler, globalErrorHandler, logError } = require('./src/utils/errors')
const { middleware: metricsMiddleware, getMetrics } = require('./src/utils/metrics')

const app = express()
const PORT = process.env.PORT || 8000
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://localhost:5173']

const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://api.coingecko.com", "https://api.thegraph.com", "https://eth.llamarpc.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
  credentials: true,
  maxAge: 86400
}

app.use(helmet(helmetOptions))
app.use(cors(corsOptions))
app.use(express.json({ limit: '10kb' }))
app.use(metricsMiddleware)

morgan.token('request-id', (req) => req.get('x-request-id') || '-')
app.use(morgan(':method :url :status :response-time ms - :res[content-length] [:request-id]'))

const swaggerUi = require('swagger-ui-express')
const swaggerSpec = require('./src/config/swagger')
const historyRoutes = require('./src/routes/history')
const configRoutes = require('./src/routes/config')
const alertRoutes = require('./src/routes/alerts')
const memeRoutes = require('./src/routes/meme')
const lidoRoutes = require('./src/routes/lido')
const aaveRoutes = require('./src/routes/aave')
const webhookRoutes = require('./src/routes/webhook')
const exportRoutes = require('./src/routes/export')
const pushRoutes = require('./src/routes/push')
const authRoutes = require('./src/routes/auth')

app.use('/api/history', historyRoutes)
app.use('/api/config', configRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/meme', memeRoutes)
app.use('/api/lido', lidoRoutes)
app.use('/api/aave', aaveRoutes)
app.use('/api/webhook', webhookRoutes)
app.use('/api/export', exportRoutes)
app.use('/api/push', pushRoutes)
app.use('/api/auth', authRoutes)

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    cache: isRedisConnected() ? 'connected' : 'disconnected',
    version: process.env.npm_package_version || '1.0.0'
  })
})

app.get('/api/metrics', (req, res) => {
  res.json(getMetrics())
})

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: API documentation
 *     description: Swagger UI for API documentation
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Swagger UI page
 */
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use(notFoundHandler)
app.use(globalErrorHandler)

async function startServer() {
  console.log('='.repeat(50))
  console.log('Blockchain Dashboard Backend')
  console.log('='.repeat(50))
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`Allowed Origins: ${ALLOWED_ORIGINS.join(', ')}`)
  
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
