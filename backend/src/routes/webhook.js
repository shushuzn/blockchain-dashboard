const express = require('express')
const router = express.Router()
const { sendAlertWebhook } = require('../services/webhook')
const { logger } = require('../utils/logger')

router.post('/alert', async (req, res) => {
  try {
    const { webhookUrl, alert } = req.body
    
    if (!webhookUrl) {
      return res.status(400).json({ error: 'Webhook URL required' })
    }
    
    if (!alert || !alert.chain || !alert.metric) {
      return res.status(400).json({ error: 'Alert data required' })
    }
    
    const result = await sendAlertWebhook({ url: webhookUrl }, alert)
    
    res.json(result)
  } catch (error) {
    logger.error('Webhook send failed', { error: error.message })
    res.status(500).json({ error: 'Webhook send failed' })
  }
})

router.post('/test', async (req, res) => {
  try {
    const { webhookUrl } = req.body
    
    if (!webhookUrl) {
      return res.status(400).json({ error: 'Webhook URL required' })
    }
    
    const testAlert = {
      chain: 'TEST',
      metric: 'Test Alert',
      value: '100',
      threshold: '50'
    }
    
    const result = await sendAlertWebhook({ url: webhookUrl }, testAlert)
    
    res.json(result)
  } catch (error) {
    logger.error('Webhook test failed', { error: error.message })
    res.status(500).json({ error: 'Webhook test failed' })
  }
})

module.exports = router