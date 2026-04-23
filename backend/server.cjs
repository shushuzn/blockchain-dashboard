require('dotenv').config()

const { validateEnvironment } = require('./src/config/envValidator')
validateEnvironment()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const { connectRedis, isRedisConnected } = require('./src/config/redis')
const { notFoundHandler, globalErrorHandler, logError } = require('./src/utils/errors')
const { middleware: metricsMiddleware, getMetrics } = require('./src/utils/metrics')
const { i18nMiddleware } = require('./src/utils/i18n')
const { createGraphQLServer, expressMiddleware: graphqlExpressMiddleware } = require('./src/graphql/server')
const { apiLimiter, authLimiter, enhancedSecurityHeaders } = require('./src/middleware/security')
const { logger } = require('./src/utils/logger')

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
app.use(enhancedSecurityHeaders)
app.use(express.json({ limit: '10kb' }))
app.use(metricsMiddleware)
app.use(i18nMiddleware)

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
const rolesRoutes = require('./src/routes/roles')
const analyticsRoutes = require('./src/routes/analytics')

app.use('/api/history', apiLimiter, historyRoutes)
app.use('/api/config', apiLimiter, configRoutes)
app.use('/api/alerts', apiLimiter, alertRoutes)
app.use('/api/meme', apiLimiter, memeRoutes)
app.use('/api/lido', apiLimiter, lidoRoutes)
app.use('/api/aave', apiLimiter, aaveRoutes)
app.use('/api/webhook', apiLimiter, webhookRoutes)
app.use('/api/export', apiLimiter, exportRoutes)
app.use('/api/push', apiLimiter, pushRoutes)
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/roles', apiLimiter, rolesRoutes)
app.use('/api/analytics', apiLimiter, analyticsRoutes)

async function initGraphQL() {
  try {
    const { createGraphQLServer } = require('./src/graphql/server')
    const graphqlServer = await createGraphQLServer()
    app.use('/graphql', express.json(), graphqlExpressMiddleware(graphqlServer))
    logger.info('GraphQL endpoint ready', { path: '/graphql' })
  } catch (err) {
    logger.error('Failed to initialize GraphQL server', { error: err.message })
  }
}
initGraphQL()

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
  logger.info('Starting Blockchain Dashboard Backend', {
    env: process.env.NODE_ENV || 'development',
    allowedOrigins: ALLOWED_ORIGINS
  })

  logger.info('Connecting to Redis...')
  await connectRedis()

  if (!isRedisConnected()) {
    logger.warn('Redis not connected. Running without cache.')
  }

  const server = app.listen(PORT, () => {
    logger.info('Server started', {
      port: PORT,
      endpoints: {
        health: `http://localhost:${PORT}/api/health`,
        websocket: `ws://localhost:${PORT}/ws`,
        graphql: `http://localhost:${PORT}/graphql`
      }
    })
  })

  const gracefulShutdown = (signal) => {
    logger.info(`Received ${signal}, starting graceful shutdown...`)
    server.close(() => {
      logger.info('HTTP server closed')
      process.exit(0)
    })

    setTimeout(() => {
      logger.error('Forced shutdown after timeout')
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
    logger.error('Unhandled Rejection', { promise: String(promise), reason: String(reason) })
  })
}

startServer()

module.exports = app
