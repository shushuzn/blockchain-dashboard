const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const { generateToken, generateRefreshToken, verifyToken, authMiddleware } = require('../middleware/auth')

const SALT_ROUNDS = 10

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    const user = await User.create({
      email,
      password: hashedPassword,
    })

    const token = generateToken({ id: user.id, email: user.email, role: user.role })
    const refreshToken = generateRefreshToken({ id: user.id })

    await user.update({ refreshToken })

    res.status(201).json({
      user: { id: user.id, email: user.email, role: user.role },
      token,
      refreshToken,
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role })
    const refreshToken = generateRefreshToken({ id: user.id })

    await user.update({ refreshToken })

    res.json({
      user: { id: user.id, email: user.email, role: user.role },
      token,
      refreshToken,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' })
    }

    const decoded = verifyToken(refreshToken)
    if (decoded.expired || decoded.invalid) {
      return res.status(403).json({ error: 'Invalid refresh token' })
    }

    const user = await User.findByPk(decoded.id)
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: 'Refresh token revoked' })
    }

    const newToken = generateToken({ id: user.id, email: user.email, role: user.role })
    const newRefreshToken = generateRefreshToken({ id: user.id })

    await user.update({ refreshToken: newRefreshToken })

    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(500).json({ error: 'Token refresh failed' })
  }
})

router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    if (user) {
      await user.update({ refreshToken: null })
    }
    res.json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Logout failed' })
  }
})

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'role', 'createdAt'],
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: 'Failed to get profile' })
  }
})

router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const user = await User.findByPk(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password)
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)
    await user.update({ password: hashedPassword })

    res.json({ success: true, message: 'Password updated successfully' })
  } catch (error) {
    console.error('Password change error:', error)
    res.status(500).json({ error: 'Password change failed' })
  }
})

module.exports = router
