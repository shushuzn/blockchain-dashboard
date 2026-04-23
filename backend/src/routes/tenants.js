const express = require('express')
const router = express.Router()
const { Tenant, PLAN_LIMITS, getTenantStatus } = require('../models/Tenant')
const { getTenantUsage, rateLimitByPlan } = require('../middleware/tenant')
const { v4: uuidv4 } = require('uuid')
const { requireTenant } = require('../middleware/tenant')
const { logger } = require('../utils/logger')

const PRICING = {
  monthly: {
    free: 0,
    pro: 29,
    enterprise: 199,
  },
  yearly: {
    free: 0,
    pro: 290,
    enterprise: 1990,
  },
}

router.post('/', async (req, res) => {
  try {
    const { name, email, plan = 'free' } = req.body

    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' })
    }

    const existing = await Tenant.findOne({ where: { name } })
    if (existing) {
      return res.status(409).json({ error: 'Tenant name already exists' })
    }

    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    const tenant = await Tenant.create({
      name,
      plan: 'free',
      trialEndsAt,
    })

    res.status(201).json({
      id: tenant.id,
      name: tenant.name,
      plan: tenant.plan,
      trialEndsAt: tenant.trialEndsAt,
      message: 'Trial period activated (14 days)',
    })
  } catch (error) {
    logger.error('Tenant creation failed', { error: error.message })
    res.status(500).json({ error: 'Failed to create tenant' })
  }
})

router.get('/plans', (req, res) => {
  res.json({
    plans: Object.entries(PRICING.monthly).map(([name, price]) => ({
      name,
      monthly: price,
      yearly: PRICING.yearly[name],
      limits: PLAN_LIMITS[name],
      features: Object.entries(PLAN_LIMITS[name])
        .filter(([, v]) => v !== false)
        .map(([k, v]) => ({
          feature: k,
          value: v === -1 ? 'unlimited' : v,
        })),
    })),
  })
})

router.get('/me', requireTenant, async (req, res) => {
  try {
    const status = await getTenantStatus(req.tenantId)
    const usage = await getTenantUsage(req.tenantId)
    const pricing = {
      monthly: PRICING.monthly[req.tenant.plan],
      yearly: PRICING.yearly[req.tenant.plan],
    }

    res.json({
      ...status,
      usage,
      pricing,
    })
  } catch (error) {
    logger.error('Tenant status failed', { error: error.message })
    res.status(500).json({ error: 'Failed to get tenant status' })
  }
})

router.post('/upgrade', requireTenant, async (req, res) => {
  try {
    const { plan, billingCycle = 'monthly' } = req.body

    if (!['pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' })
    }

    if (req.tenant.plan === plan) {
      return res.status(400).json({ error: 'Already on this plan' })
    }

    const price = PRICING[billingCycle]?.[plan]
    if (price === undefined) {
      return res.status(400).json({ error: 'Invalid billing cycle' })
    }

    await req.tenant.update({
      plan,
      billingCycle,
      trialEndsAt: null,
      subscriptionEndsAt: null,
    })

    res.json({
      success: true,
      plan,
      billingCycle,
      price,
      message: `Upgraded to ${plan} (${billingCycle})`,
    })
  } catch (error) {
    logger.error('Plan upgrade failed', { error: error.message })
    res.status(500).json({ error: 'Failed to upgrade plan' })
  }
})

router.post('/api-key', requireTenant, async (req, res) => {
  try {
    const { name } = req.body
    const apiKey = `bcd_${uuidv4().replace(/-/g, '')}`

    await Tenant.update(
      {
        settings: {
          ...req.tenant.settings,
          apiKeys: [
            ...(req.tenant.settings?.apiKeys || []),
            { name, key: apiKey, createdAt: new Date().toISOString() },
          ],
        },
      },
      { where: { id: req.tenantId } }
    )

    res.json({
      success: true,
      apiKey,
      message: 'API key created. Store it securely - it will not be shown again.',
    })
  } catch (error) {
    logger.error('API key creation failed', { error: error.message })
    res.status(500).json({ error: 'Failed to create API key' })
  }
})

router.delete('/api-key/:name', requireTenant, async (req, res) => {
  try {
    const { name } = req.params
    const apiKeys = (req.tenant.settings?.apiKeys || []).filter((k) => k.name !== name)

    await Tenant.update(
      { settings: { ...req.tenant.settings, apiKeys } },
      { where: { id: req.tenantId } }
    )

    res.json({ success: true, message: 'API key deleted' })
  } catch (error) {
    logger.error('API key deletion failed', { error: error.message })
    res.status(500).json({ error: 'Failed to delete API key' })
  }
})

router.get('/usage', requireTenant, async (req, res) => {
  try {
    const usage = await getTenantUsage(req.tenantId)
    const rateLimit = rateLimitByPlan(req.tenant)

    res.json({
      ...usage,
      rateLimit,
      resetsIn: '30 days',
    })
  } catch (error) {
    logger.error('Usage fetch failed', { error: error.message })
    res.status(500).json({ error: 'Failed to get usage' })
  }
})

module.exports = router