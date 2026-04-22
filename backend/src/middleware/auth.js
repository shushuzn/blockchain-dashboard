const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN })
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { expired: true }
    }
    return { invalid: true }
  }
}

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
    return res.status(403).json({ error: 'Invalid token' })
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
  authMiddleware,
  optionalAuthMiddleware,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
}
