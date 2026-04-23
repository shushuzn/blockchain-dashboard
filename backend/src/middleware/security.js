const rateLimit = require('express-rate-limit')
const helmet = require('helmet')

const WHITELIST = process.env.IP_WHITELIST?.split(',') || []

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000'
const COINGECKO_API = 'https://api.coingecko.com'
const EXPO_API = 'https://exp.host'

const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'connect-src': ["'self'", API_BASE_URL, COINGECKO_API, EXPO_API],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'media-src': ["'self'"],
  'worker-src': ["'self'", 'blob:'],
  'manifest-src': ["'self'"],
}

function buildCSP() {
  return Object.entries(CSP_CONFIG)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ')
}

function createRateLimiter(options = {}) {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  }

  return rateLimit({ ...defaultOptions, ...options })
}

const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
})

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again later',
})

const sensitiveLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many sensitive operations, please try again later',
})

function ipWhitelist(req, res, next) {
  if (WHITELIST.length === 0) return next()

  const clientIp = req.ip || req.connection.remoteAddress

  if (WHITELIST.includes(clientIp)) {
    next()
  } else {
    res.status(403).json({ error: 'Access denied' })
  }
}

function enhancedSecurityHeaders(req, res, next) {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': buildCSP(),
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
  })
  next()
}

function securityHeaders(req, res, next) {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'X-Download-Options': 'noopen',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': buildCSP(),
  })
  next()
}

function requestLogger(req, res, next) {
  const start = Date.now()
  const requestId = req.get('x-request-id') || generateRequestId()

  res.on('finish', () => {
    const duration = Date.now() - start
    const log = {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }

    if (res.statusCode >= 400) {
      console.error('Request error:', JSON.stringify(log))
    } else {
      console.log('Request:', JSON.stringify(log))
    }
  })

  res.set('x-request-id', requestId)
  next()
}

function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function corsOptions(req, res, next) {
  const origin = req.headers.origin
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000']

  if (allowedOrigins.includes(origin) || !origin) {
    res.set({
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'true',
    })
  }

  next()
}

module.exports = {
  apiLimiter,
  authLimiter,
  sensitiveLimiter,
  ipWhitelist,
  enhancedSecurityHeaders,
  securityHeaders,
  requestLogger,
  corsOptions,
  buildCSP,
}
