const jwt = require('jsonwebtoken')
const { logger } = require('../utils/logger')

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}
if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters for security')
}
if (JWT_SECRET === 'change-this-in-production' || JWT_SECRET === 'your-secret-key-here') {
  throw new Error('JWT_SECRET cannot be a default or placeholder value')
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

const blacklist = new Map()
const BLACKLIST_CLEANUP_INTERVAL = 60 * 60 * 1000

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN })
}

function verifyToken(token) {
  if (isBlacklisted(token)) {
    return { invalid: true, reason: 'blacklisted' }
  }

  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { expired: true }
    }
    return { invalid: true }
  }
}

function addToBlacklist(token, reason = 'logout') {
  try {
    const decoded = jwt.decode(token)
    if (!decoded) return false

    const ttl = decoded.exp - Math.floor(Date.now() / 1000)
    if (ttl > 0) {
      blacklist.set(token, { reason, exp: decoded.exp, revokedAt: Date.now() })
      return true
    }
    return false
  } catch (err) {
    logger.error('Failed to blacklist token', { error: err.message })
    return false
  }
}

function isBlacklisted(token) {
  return blacklist.has(token)
}

function cleanupBlacklist() {
  const now = Math.floor(Date.now() / 1000)
  let cleaned = 0

  for (const [token, data] of blacklist.entries()) {
    if (data.exp < now) {
      blacklist.delete(token)
      cleaned++
    }
  }

  if (cleaned > 0) {
    logger.info('Blacklist cleanup completed', { removed: cleaned })
  }

  return cleaned
}

setInterval(cleanupBlacklist, BLACKLIST_CLEANUP_INTERVAL)

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]
  const decoded = verifyToken(token)

  if (decoded.expired) {
    return res.status(401).json({ error: 'Token expired', expired: true })
  }

  if (decoded.invalid) {
    const reason = decoded.reason === 'blacklisted' ? 'Token has been revoked' : 'Invalid token'
    return res.status(403).json({ error: reason })
  }

  req.user = decoded
  next()
}

function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)

    if (!decoded.expired && !decoded.invalid) {
      req.user = decoded
    }
  }

  next()
}

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  addToBlacklist,
  isBlacklisted,
  cleanupBlacklist,
  authMiddleware,
  optionalAuthMiddleware,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
}