const express = require('express')
const router = express.Router()
const axios = require('axios')
const nodemailer = require('nodemailer')

// Create email transporter
function createTransporter(config) {
  return nodemailer.createTransporter({
    host: config.smtpHost,
    port: parseInt(config.smtpPort) || 587,
    secure: (parseInt(config.smtpPort) || 587) === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass
    },
    tls: {
      rejectUnauthorized: false
    }
  })
}

// Trigger alert
router.post('/', async (req, res) => {
  try {
    const { chain, metric, value, threshold, config } = req.body
    
    if (!chain || !metric || !value || !threshold || !config) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    const results = {
      telegram: false,
      email: false
    }

    // Send Telegram alert
    if (config.telegramToken && config.telegramChatId) {
      try {
        const names = { gas: 'Priority Fee', baseFee: 'Base Fee', blobFee: 'Blob Fee' }
        const emojis = { gas: '⛽', baseFee: '📊', blobFee: '🟣' }
        const chainName = chain
        const msg = `${emojis[metric]} <b>${chainName} Alert</b>\n${names[metric]}: <b>${typeof value === 'number' ? value.toFixed(3) : value}</b> > threshold ${threshold}`
        
        await axios.post(
          `https://api.telegram.org/bot${config.telegramToken}/sendMessage`,
          {
            chat_id: config.telegramChatId,
            text: msg,
            parse_mode: 'HTML'
          }
        )
        results.telegram = true
      } catch (telegramError) {
        console.error('Telegram alert failed:', telegramError.message)
      }
    }

    // Send email alert using Nodemailer
    if (config.smtpUser && config.smtpPass && config.smtpTo) {
      try {
        const transporter = createTransporter(config)
        
        const names = { gas: 'Priority Fee', baseFee: 'Base Fee', blobFee: 'Blob Fee' }
        const subject = `[MCM] ${chain} ${names[metric]} Alert`
        const htmlBody = `
          <h2>Blockchain Dashboard Alert</h2>
          <p><strong>Chain:</strong> ${chain}</p>
          <p><strong>Metric:</strong> ${names[metric]}</p>
          <p><strong>Current Value:</strong> ${typeof value === 'number' ? value.toFixed(3) : value}</p>
          <p><strong>Threshold:</strong> ${typeof threshold === 'number' ? threshold.toFixed(3) : threshold}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        `
        
        await transporter.sendMail({
          from: config.smtpUser,
          to: config.smtpTo,
          subject: subject,
          html: htmlBody,
          text: `${chain} ${names[metric]} is ${value} (threshold: ${threshold})`
        })
        
        results.email = true
      } catch (emailError) {
        console.error('Email alert failed:', emailError.message)
      }
    }

    res.json({ 
      message: 'Alert triggered', 
      results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error triggering alert:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Test alert
router.post('/test', async (req, res) => {
  try {
    const { type, config } = req.body
    
    if (!type || !config) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    if (type === 'telegram' && config.telegramToken && config.telegramChatId) {
      try {
        await axios.post(
          `https://api.telegram.org/bot${config.telegramToken}/sendMessage`,
          {
            chat_id: config.telegramChatId,
            text: '✅ MCM test',
            parse_mode: 'HTML'
          }
        )
        res.json({ message: 'Telegram test sent successfully' })
      } catch (error) {
        res.status(400).json({ error: 'Telegram test failed: ' + error.message })
      }
    } else if (type === 'email' && config.smtpUser && config.smtpPass && config.smtpTo) {
      try {
        const transporter = createTransporter(config)
        
        await transporter.sendMail({
          from: config.smtpUser,
          to: config.smtpTo,
          subject: 'MCM Test',
          html: '<p>Test ✅</p>',
          text: 'Test ✅'
        })
        
        res.json({ message: 'Email test sent successfully' })
      } catch (error) {
        res.status(400).json({ error: 'Email test failed: ' + error.message })
      }
    } else {
      res.status(400).json({ error: 'Invalid alert type or missing credentials' })
    }
  } catch (error) {
    console.error('Error sending test alert:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router