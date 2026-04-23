const express = require('express')
const router = express.Router()
const Config = require('../models/Config')
const { encrypt, decrypt } = require('../utils/encryption')

// Get config (sensitive data sanitized)
router.get('/', async (req, res) => {
  try {
    const { userId = 'default' } = req.query
    
    let config = await Config.findOne({ where: { userId } })
    
    if (!config) {
      config = await Config.create({ userId })
    }

    res.json({
      ...config.toJSON(),
      thresholds: JSON.parse(config.thresholds),
      alertLog: JSON.parse(config.alertLog),
      alertState: JSON.parse(config.alertState),
      hasTelegramToken: !!config.telegramToken,
      hasTelegramChatId: !!config.telegramChatId,
      hasSmtpConfig: !!config.smtpUser,
      telegramToken: undefined,
      telegramChatId: undefined,
      smtpUser: undefined,
      smtpPass: undefined,
      smtpTo: undefined
    })
  } catch (error) {
    console.error('Error fetching config:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get sensitive config (requires authentication in real app)
router.get('/sensitive', async (req, res) => {
  try {
    const { userId = 'default' } = req.query
    
    let config = await Config.findOne({ where: { userId } })
    
    if (!config) {
      config = await Config.create({ userId })
    }

    res.json({
      thresholds: JSON.parse(config.thresholds),
      telegramToken: config.telegramToken ? decrypt(config.telegramToken) : '',
      telegramChatId: config.telegramChatId ? decrypt(config.telegramChatId) : '',
      smtpUser: config.smtpUser ? decrypt(config.smtpUser) : '',
      smtpPass: config.smtpPass ? decrypt(config.smtpPass) : '',
      smtpTo: config.smtpTo ? decrypt(config.smtpTo) : ''
    })
  } catch (error) {
    console.error('Error fetching sensitive config:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Save config
router.post('/', async (req, res) => {
  try {
    const { userId = 'default', ...configData } = req.body
    
    // Handle JSON fields
    const thresholds = JSON.stringify(configData.thresholds || {})
    const alertLog = JSON.stringify(configData.alertLog || [])
    const alertState = JSON.stringify(configData.alertState || {})

    // Encrypt sensitive fields
    const encryptedData = {
      ...configData,
      telegramToken: configData.telegramToken ? encrypt(configData.telegramToken) : '',
      telegramChatId: configData.telegramChatId ? encrypt(configData.telegramChatId) : '',
      smtpUser: configData.smtpUser ? encrypt(configData.smtpUser) : '',
      smtpPass: configData.smtpPass ? encrypt(configData.smtpPass) : '',
      smtpTo: configData.smtpTo ? encrypt(configData.smtpTo) : ''
    }

    let config = await Config.findOne({ where: { userId } })
    
    if (config) {
      // Update existing config
      await config.update({
        ...encryptedData,
        thresholds,
        alertLog,
        alertState
      })
    } else {
      // Create new config
      config = await Config.create({
        userId,
        ...encryptedData,
        thresholds,
        alertLog,
        alertState
      })
    }

    res.json({
      ...config.toJSON(),
      thresholds: JSON.parse(config.thresholds),
      alertLog: JSON.parse(config.alertLog),
      alertState: JSON.parse(config.alertState),
      telegramToken: config.telegramToken ? decrypt(config.telegramToken) : '',
      telegramChatId: config.telegramChatId ? decrypt(config.telegramChatId) : '',
      smtpUser: config.smtpUser ? decrypt(config.smtpUser) : '',
      smtpPass: config.smtpPass ? decrypt(config.smtpPass) : '',
      smtpTo: config.smtpTo ? decrypt(config.smtpTo) : ''
    })
  } catch (error) {
    console.error('Error saving config:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Clear alert log
router.delete('/alerts', async (req, res) => {
  try {
    const { userId = 'default' } = req.query
    
    let config = await Config.findOne({ where: { userId } })
    
    if (config) {
      await config.update({
        alertLog: '[]',
        alertState: '{}'
      })
    }

    res.json({ message: 'Alert log cleared' })
  } catch (error) {
    console.error('Error clearing alert log:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router