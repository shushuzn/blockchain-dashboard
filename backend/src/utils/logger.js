const crypto = require('crypto')

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
}

const LOG_CATEGORIES = {
  AUDIT: 'audit',
  SECURITY: 'security',
  PERFORMANCE: 'performance',
  BUSINESS: 'business',
  SYSTEM: 'system'
}

const currentLevel = process.env.LOG_LEVEL
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] || LOG_LEVELS.INFO
  : LOG_LEVELS.INFO

function formatMessage(level, message, meta = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  })
}

function formatAuditMessage(action, userId, details = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    category: LOG_CATEGORIES.AUDIT,
    action,
    userId,
    ...details
  })
}

const logger = {
  error(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.ERROR) {
      console.error(formatMessage('ERROR', message, meta))
    }
  },

  warn(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.WARN) {
      console.warn(formatMessage('WARN', message, meta))
    }
  },

  info(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.INFO) {
      console.log(formatMessage('INFO', message, meta))
    }
  },

  debug(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.DEBUG) {
      console.log(formatMessage('DEBUG', message, meta))
    }
  },

  audit(action, userId, details = {}) {
    if (currentLevel >= LOG_LEVELS.INFO) {
      console.log(formatAuditMessage(action, userId, details))
    }
  },

  security(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.INFO) {
      console.log(formatMessage('SECURITY', `[SECURITY] ${message}`, { category: LOG_CATEGORIES.SECURITY, ...meta }))
    }
  },

  performance(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.INFO) {
      console.log(formatMessage('PERFORMANCE', `[PERF] ${message}`, { category: LOG_CATEGORIES.PERFORMANCE, ...meta }))
    }
  }
}

function generateRequestId() {
  return crypto.randomUUID()
}

function requestLogger(req, res, next) {
  req.requestId = generateRequestId()
  res.setHeader('X-Request-ID', req.requestId)
  
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.info('HTTP Request', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    })
  })
  
  next()
}

module.exports = {
  logger,
  generateRequestId,
  requestLogger,
  LOG_LEVELS,
  LOG_CATEGORIES
}
