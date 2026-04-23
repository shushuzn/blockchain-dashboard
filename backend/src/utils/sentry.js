const Sentry = require('@sentry/node')
const { nodeProfilingIntegration } = require('@sentry/profiling-node')

let isInitialized = false

function initSentry() {
  const dsn = process.env.SENTRY_DSN
  
  if (!dsn) {
    console.log('[Sentry] SENTRY_DSN not configured, skipping initialization')
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
        console.log('[Sentry] Event captured:', event.message)
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
  console.log('[Sentry] Initialized successfully')
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
      console.error('[Unhandled Error]', err)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
  return Sentry.Handlers.errorHandler()
}

function captureException(error, context = {}) {
  if (!isInitialized) {
    console.error('[Error]', error, context)
    return null
  }
  return Sentry.captureException(error, { extra: context })
}

function captureMessage(message, level = 'info') {
  if (!isInitialized) {
    console.log(`[${level.toUpperCase()}]`, message)
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
