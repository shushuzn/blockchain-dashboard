const express = require('express')
const router = express.Router()
const { sendAlertWebhook } = require('../services/webhook')

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
    console.error('[Webhook API]', error)
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
    console.error('[Webhook Test]', error)
    res.status(500).json({ error: 'Webhook test failed' })
  }
})

module.exports = router
