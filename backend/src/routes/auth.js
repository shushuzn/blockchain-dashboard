const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { isDatabaseConnected } = require('../config/database')
const { registerSchema, loginSchema, refreshSchema, changePasswordSchema, validateBody } = require('../utils/validation')
const { logger } = require('../utils/logger')

const SALT_ROUNDS = 10

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

const mockUsers = new Map()
const mockRefreshTokens = new Map()

function generateMockToken(userId) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
  const payload = Buffer.from(JSON.stringify({
    id: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString('base64')
  const signature = Buffer.from('mock-signature').toString('base64')
  return `${header}.${payload}.${signature}`
}

function generateMockRefreshToken(userId) {
  const token = `mock-refresh-${userId}-${Date.now()}`
  mockRefreshTokens.set(token, { userId, expires: Date.now() + 7 * 24 * 60 * 60 * 1000 })
  return token
}

function verifyMockToken(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return { invalid: true }
    }
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return { expired: true }
    }
    return payload
  } catch (e) {
    return { invalid: true }
  }
}

function generateRealToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

function generateRealRefreshToken(userId) {
  const token = jwt.sign({ id: userId, type: 'refresh' }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN })
  return token
}

function verifyRealToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { expired: true }
    }
    return { invalid: true }
  }
}

router.post('/register', validateBody(registerSchema), async (req, res) => {
  try {
    const { email, password } = req.body
    const useDatabase = isDatabaseConnected() && User !== null

    if (useDatabase) {
      const existingUser = await User.findOne({ where: { email } })
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' })
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
      const user = await User.create({
        email,
        password: hashedPassword,
        role: 'user'
      })

      const token = generateRealToken({ id: user.id, email: user.email, role: user.role })
      const refreshToken = generateRealRefreshToken(user.id)

      await user.update({ refreshToken })

      res.status(201).json({
        user: { id: user.id, email: user.email, role: user.role },
        token,
        refreshToken,
      })
    } else {
      if (mockUsers.has(email)) {
        return res.status(409).json({ error: 'Email already registered' })
      }

      const userId = `user-${Date.now()}`
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

      mockUsers.set(email, {
        id: userId,
        email,
        password: hashedPassword,
        role: 'user'
      })

      const token = generateMockToken(userId)
      const refreshToken = generateMockRefreshToken(userId)

      res.status(201).json({
        user: { id: userId, email, role: 'user' },
        token,
        refreshToken,
      })
    }
  } catch (error) {
    logger.error('Register error', { error: error.message })
    res.status(500).json({ error: 'Registration failed' })
  }
})

router.post('/login', validateBody(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body
    const useDatabase = isDatabaseConnected() && User !== null

    if (useDatabase) {
      const user = await User.findOne({ where: { email } })
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const validPassword = await bcrypt.compare(password, user.password)
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const token = generateRealToken({ id: user.id, email: user.email, role: user.role })
      const refreshToken = generateRealRefreshToken(user.id)

      await user.update({ refreshToken })

      res.json({
        user: { id: user.id, email: user.email, role: user.role },
        token,
        refreshToken,
      })
    } else {
      const user = mockUsers.get(email)
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const validPassword = await bcrypt.compare(password, user.password)
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const token = generateMockToken(user.id)
      const refreshToken = generateMockRefreshToken(user.id)

      res.json({
        user: { id: user.id, email: user.email, role: user.role },
        token,
        refreshToken,
      })
    }
  } catch (error) {
    logger.error('Login error', { error: error.message })
    res.status(500).json({ error: 'Login failed' })
  }
})

router.post('/refresh', validateBody(refreshSchema), async (req, res) => {
  try {
    const { refreshToken } = req.body
    const useDatabase = isDatabaseConnected() && User !== null

    if (useDatabase) {
      const decoded = verifyRealToken(refreshToken)
      if (decoded.invalid || !decoded.id) {
        return res.status(403).json({ error: 'Invalid refresh token' })
      }

      const user = await User.findByPk(decoded.id)
      if (!user) {
        return res.status(403).json({ error: 'User not found' })
      }

      const newToken = generateRealToken({ id: user.id, email: user.email, role: user.role })
      const newRefreshToken = generateRealRefreshToken(user.id)

      await user.update({ refreshToken: newRefreshToken })

      res.json({
        token: newToken,
        refreshToken: newRefreshToken,
      })
    } else {
      const tokenData = mockRefreshTokens.get(refreshToken)
      if (!tokenData || tokenData.expires < Date.now()) {
        mockRefreshTokens.delete(refreshToken)
        return res.status(403).json({ error: 'Invalid refresh token' })
      }

      const user = Array.from(mockUsers.values()).find(u => u.id === tokenData.userId)
      if (!user) {
        return res.status(403).json({ error: 'User not found' })
      }

      const newToken = generateMockToken(user.id)
      const newRefreshToken = generateMockRefreshToken(user.id)

      mockRefreshTokens.delete(refreshToken)

      res.json({
        token: newToken,
        refreshToken: newRefreshToken,
      })
    }
  } catch (error) {
    logger.error('Token refresh error', { error: error.message })
    res.status(500).json({ error: 'Token refresh failed' })
  }
})

router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      verifyMockToken(token)
    }

    const { refreshToken } = req.body
    if (refreshToken) {
      mockRefreshTokens.delete(refreshToken)
    }

    res.json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    logger.error('Logout error', { error: error.message })
    res.status(500).json({ error: 'Logout failed' })
  }
})

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const useDatabase = isDatabaseConnected() && User !== null

    if (useDatabase) {
      const decoded = verifyRealToken(token)
      if (decoded.invalid || decoded.expired) {
        return res.status(401).json({ error: 'Invalid token' })
      }

      const user = await User.findByPk(decoded.id)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      })
    } else {
      const decoded = verifyMockToken(token)
      if (decoded.invalid || decoded.expired) {
        return res.status(401).json({ error: 'Invalid token' })
      }

      const user = Array.from(mockUsers.values()).find(u => u.id === decoded.id)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      })
    }
  } catch (error) {
    logger.error('Get profile error', { error: error.message })
    res.status(500).json({ error: 'Failed to get profile' })
  }
})

router.put('/password', validateBody(changePasswordSchema), async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const { currentPassword, newPassword } = req.body
    const useDatabase = isDatabaseConnected() && User !== null

    if (useDatabase) {
      const decoded = verifyRealToken(token)
      if (decoded.invalid || decoded.expired) {
        return res.status(401).json({ error: 'Invalid token' })
      }

      const user = await User.findByPk(decoded.id)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password)
      if (!validPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' })
      }

      user.password = await bcrypt.hash(newPassword, SALT_ROUNDS)
      await user.save()

      res.json({ success: true, message: 'Password updated successfully' })
    } else {
      const decoded = verifyMockToken(token)
      if (decoded.invalid || decoded.expired) {
        return res.status(401).json({ error: 'Invalid token' })
      }

      const user = Array.from(mockUsers.values()).find(u => u.id === decoded.id)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password)
      if (!validPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' })
      }

      user.password = await bcrypt.hash(newPassword, SALT_ROUNDS)

      res.json({ success: true, message: 'Password updated successfully' })
    }
  } catch (error) {
    logger.error('Password change error', { error: error.message })
    res.status(500).json({ error: 'Password change failed' })
  }
})

module.exports = router