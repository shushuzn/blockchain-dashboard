const express = require('express')
const router = express.Router()
const Config = require('../models/Config')
const { encrypt, decrypt } = require('../utils/encryption')
const { logger } = require('../utils/logger')

router.get('/', async (req, res) => {
  try {
    const { userId = 'default' } = req.query
    
    if (Config) {
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
    } else {
      res.json({
        id: 1,
        userId: userId,
        alertEnabled: false,
        cooldownMin: 5,
        thresholds: {
          ethereum: { gas: 50, baseFee: 50, blobFee: 0.1 },
          base: { gas: 30, baseFee: 30, blobFee: 0.1 },
          arbitrum: { gas: 5, baseFee: 5, blobFee: 0 },
          optimism: { gas: 5, baseFee: 5, blobFee: 0 }
        },
        alertLog: [],
        alertState: {},
        hasTelegramToken: false,
        hasTelegramChatId: false,
        hasSmtpConfig: false,
        smtpHost: 'smtp.gmail.com',
        smtpPort: '587'
      })
    }
  } catch (error) {
    logger.error('Error fetching config', { error: error.message })
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/sensitive', async (req, res) => {
  try {
    const { userId = 'default' } = req.query
    
    if (!Config) {
      return res.status(503).json({ error: 'Database not available' })
    }

    const config = await Config.findOne({ where: { userId } })
    
    if (!config) {
      return res.status(404).json({ error: 'Config not found' })
    }

    res.json({
      hasTelegramToken: !!config.telegramToken,
      hasTelegramChatId: !!config.telegramChatId,
      hasSmtpConfig: !!config.smtpUser
    })
  } catch (error) {
    logger.error('Error fetching sensitive config', { error: error.message })
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { userId = 'default', alertEnabled, cooldownMin, thresholds, smtpHost, smtpPort, smtpUser, smtpPass, smtpTo, telegramToken, telegramChatId } = req.body
    
    if (!Config) {
      return res.status(503).json({ error: 'Database not available' })
    }

    const configData = { userId }
    
    if (alertEnabled !== undefined) configData.alertEnabled = alertEnabled
    if (cooldownMin !== undefined) configData.cooldownMin = cooldownMin
    if (thresholds) configData.thresholds = JSON.stringify(thresholds)
    if (smtpHost) configData.smtpHost = smtpHost
    if (smtpPort) configData.smtpPort = smtpPort
    if (smtpUser) configData.smtpUser = smtpUser
    if (smtpPass) configData.smtpPass = encrypt(smtpPass)
    if (smtpTo) configData.smtpTo = smtpTo
    if (telegramToken) configData.telegramToken = encrypt(telegramToken)
    if (telegramChatId) configData.telegramChatId = telegramChatId

    const [config, created] = await Config.upsert(configData)

    res.json({
      success: true,
      data: {
        id: config.id,
        userId: config.userId,
        alertEnabled: config.alertEnabled,
        cooldownMin: config.cooldownMin,
        thresholds: JSON.parse(config.thresholds)
      }
    })
  } catch (error) {
    logger.error('Error saving config', { error: error.message })
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/alert-log', async (req, res) => {
  try {
    const { userId = 'default' } = req.query
    
    if (!Config) {
      return res.status(503).json({ error: 'Database not available' })
    }

    const config = await Config.findOne({ where: { userId } })
    
    if (!config) {
      return res.status(404).json({ error: 'Config not found' })
    }

    config.alertLog = JSON.stringify([])
    await config.save()

    res.json({ success: true, message: 'Alert log cleared' })
  } catch (error) {
    logger.error('Error clearing alert log', { error: error.message })
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/test-telegram', async (req, res) => {
  try {
    const { telegramToken, telegramChatId } = req.body
    
    if (!telegramToken || !telegramChatId) {
      return res.status(400).json({ error: 'Telegram token and chat ID are required' })
    }

    const TelegramBot = require('node-telegram-bot-api')
    const bot = new TelegramBot(telegramToken, { polling: false })
    
    await bot.sendMessage(telegramChatId, '🔔 Test message from Blockchain Dashboard')
    
    res.json({ success: true, message: 'Telegram notification sent' })
  } catch (error) {
    logger.error('Error sending test telegram', { error: error.message, code: error.code })
    res.status(500).json({ error: 'Failed to send telegram notification' })
  }
})

router.post('/test-email', async (req, res) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPass, smtpTo } = req.body
    
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !smtpTo) {
      return res.status(400).json({ error: 'All SMTP fields are required' })
    }

    const nodemailer = require('nodemailer')

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10),
      secure: smtpPort === '465',
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    })

    await transporter.sendMail({
      from: `"Blockchain Dashboard" <${smtpUser}>`,
      to: smtpTo,
      subject: '🔔 Test Alert from Blockchain Dashboard',
      text: 'This is a test email from Blockchain Dashboard.'
    })

    res.json({ success: true, message: 'Test email sent' })
  } catch (error) {
    logger.error('Error sending test email', { error: error.message })
    res.status(500).json({ error: 'Failed to send test email' })
  }
})

module.exports = router