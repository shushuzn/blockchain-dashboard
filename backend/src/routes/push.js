const express = require('express')
const router = express.Router()
const { sendPushNotification, processOfflineQueue, getOfflineQueueStatus, clearOfflineQueue } = require('../services/push')
const { validatePushRequest } = require('../utils/validation')

const registeredTokens = new Map()

router.post('/register', (req, res) => {
  const { userId, token, preferences } = req.body

  if (!userId || !token) {
    return res.status(400).json({ error: 'userId and token are required' })
  }

  registeredTokens.set(token, {
    userId,
    token,
    preferences: preferences || { gasAlerts: true, blobAlerts: true },
    registeredAt: Date.now(),
  })

  res.json({ success: true, message: 'Token registered' })
})

router.post('/send', async (req, res) => {
  const { tokens, title, body, data } = req.body

  if (!tokens || !title || !body) {
    return res.status(400).json({ error: 'tokens, title and body are required' })
  }

  try {
    const result = await sendPushNotification(tokens, title, body, data)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/alert', async (req, res) => {
  const { chain, metric, value, threshold } = req.body

  if (!chain || !metric) {
    return res.status(400).json({ error: 'chain and metric are required' })
  }

  const title = `Gas Alert: ${chain}`
  const body = `${metric} is at ${value} (threshold: ${threshold})`

  const tokensForChain = Array.from(registeredTokens.values())
    .filter((t) => t.preferences[`${metric}Alerts`])
    .map((t) => t.token)

  if (tokensForChain.length === 0) {
    return res.json({ success: true, message: 'No tokens to notify' })
  }

  try {
    const result = await sendPushNotification(
      tokensForChain,
      title,
      body,
      { chain, metric, value, threshold }
    )
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/process-queue', async (req, res) => {
  try {
    const result = await processOfflineQueue()
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/queue-status', (req, res) => {
  const status = getOfflineQueueStatus()
  res.json(status)
})

router.delete('/queue', (req, res) => {
  clearOfflineQueue()
  res.json({ success: true, message: 'Queue cleared' })
})

router.get('/tokens', (req, res) => {
  const tokens = Array.from(registeredTokens.values()).map((t) => ({
    userId: t.userId,
    registeredAt: t.registeredAt,
    preferences: t.preferences,
  }))
  res.json(tokens)
})

router.post('/preferences', (req, res) => {
  const { token, preferences } = req.body

  if (!token || !preferences) {
    return res.status(400).json({ error: 'token and preferences are required' })
  }

  const registered = registeredTokens.get(token)
  if (!registered) {
    return res.status(404).json({ error: 'Token not registered' })
  }

  registered.preferences = { ...registered.preferences, ...preferences }
  registeredTokens.set(token, registered)

  res.json({ success: true, preferences: registered.preferences })
})

router.delete('/token/:token', (req, res) => {
  const { token } = req.params
  registeredTokens.delete(token)
  res.json({ success: true, message: 'Token removed' })
})

module.exports = router
