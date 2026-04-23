const Sentry = require('@sentry/node')
const { nodeProfilingIntegration } = require('@sentry/profiling-node')
const { logger } = require('./logger')

let isInitialized = false

function initSentry() {
  const dsn = process.env.SENTRY_DSN
  
  if (!dsn) {
    logger.info('Sentry initialization skipped - SENTRY_DSN not configured')
    return false
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      nodeProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express(),
      new Sentry.Integrations.Sqlite(),
      new Sentry.Integrations.Redis()
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Sentry event captured', { message: event.message })
      }
      return event
    },
    beforeSendTransaction(transaction) {
      if (transaction.op === 'http' && transaction.url.includes('/api/health')) {
        return null
      }
      return transaction
    }
  })

  isInitialized = true
  logger.info('Sentry initialized successfully')
  return true
}

function getSentryHandler() {
  if (!isInitialized) {
    return (req, res, next) => next()
  }
  return Sentry.Handlers.requestHandler()
}

function getSentryTrenerHandler() {
  if (!isInitialized) {
    return (req, res, next) => next()
  }
  return Sentry.Handlers.tracingHandler()
}

function getErrorHandler() {
  if (!isInitialized) {
    return (err, req, res, next) => {
      logger.error('Unhandled error', { error: err.message, stack: err.stack })
      res.status(500).json({ error: 'Internal server error' })
    }
  }
  return Sentry.Handlers.errorHandler()
}

function captureException(error, context = {}) {
  if (!isInitialized) {
    logger.error('Error captured', { error: error.message, context })
    return null
  }
  return Sentry.captureException(error, { extra: context })
}

function captureMessage(message, level = 'info') {
  if (!isInitialized) {
    logger.info('Message captured', { message, level })
    return null
  }
  return Sentry.captureMessage(message, level)
}

function addBreadcrumb(message, data = {}) {
  if (!isInitialized) {
    return
  }
  Sentry.addBreadcrumb({
    message,
    data,
    timestamp: Date.now()
  })
}

module.exports = {
  initSentry,
  getSentryHandler,
  getSentryTrenerHandler,
  getErrorHandler,
  captureException,
  captureMessage,
  addBreadcrumb
}