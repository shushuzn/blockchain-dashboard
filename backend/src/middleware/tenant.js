const { Tenant, checkPlanLimits } = require('../models/Tenant')
const { verifyToken } = require('../middleware/auth')

const tenantCache = new Map()
const CACHE_TTL = 60000

function getCachedTenant(id, lookupFn) {
  const cached = tenantCache.get(id)
  if (cached && Date.now() < cached.expires) {
    return Promise.resolve(cached.data)
  }
  return lookupFn().then(data => {
    if (data) {
      tenantCache.set(id, { data, expires: Date.now() + CACHE_TTL })
    }
    return data
  })
}

function clearTenantCache(tenantId) {
  tenantCache.delete(tenantId)
}

async function tenantMiddleware(req, res, next) {
  const tenantId = req.headers['x-tenant-id']
  const apiKey = req.headers['x-api-key']

  if (apiKey) {
    try {
      const tenant = await getCachedTenant(`apiKey:${apiKey}`, () => 
        Tenant.findOne({ where: { apiKey } })
      )
      if (tenant) {
        req.tenant = tenant
        req.tenantId = tenant.id
        return next()
      }
    } catch (err) {
      console.error('API key validation error:', err)
    }
  }

  if (tenantId) {
    try {
      const tenant = await getCachedTenant(`id:${tenantId}`, () => 
        Tenant.findByPk(tenantId)
      )
      if (tenant) {
        req.tenant = tenant
        req.tenantId = tenant.id
        return next()
      }
      return res.status(404).json({ error: 'Tenant not found' })
    } catch (err) {
      console.error('Tenant validation error:', err)
      return res.status(500).json({ error: 'Tenant validation failed' })
    }
  }

  if (req.user?.id) {
    const { User } = require('../models/User')
    try {
      const user = await User.findByPk(req.user.id)
      if (user?.tenantId) {
        const tenant = await getCachedTenant(`id:${user.tenantId}`, () => 
          Tenant.findByPk(user.tenantId)
        )
        if (tenant) {
          req.tenant = tenant
          req.tenantId = tenant.id
          return next()
        }
      }
    } catch (err) {
      console.error('User tenant lookup error:', err)
    }
  }

  next()
}

function requireTenant(req, res, next) {
  if (!req.tenantId) {
    return res.status(401).json({ error: 'Tenant context required' })
  }
  next()
}

async function requirePlanLimit(resource) {
  return async (req, res, next) => {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant context required' })
    }

    let currentUsage = 0

    switch (resource) {
      case 'chain':
        const { Config } = require('../models/Config')
        const configs = await Config.findAll({ where: { tenantId: req.tenantId } })
        currentUsage = configs.length
        break
      case 'alert':
        const alertConfigs = await Config.findAll({
          where: { tenantId: req.tenantId, alertEnabled: true },
        })
        currentUsage = alertConfigs.length
        break
      case 'webhook':
        const { webhooks } = require('../routes/webhooks')
        const tenantWebhooks = Array.from(webhooks.values()).filter(
          (w) => w.tenantId === req.tenantId
        )
        currentUsage = tenantWebhooks.length
        break
    }

    const result = await checkPlanLimits(req.tenantId, resource, currentUsage)

    if (!result.allowed) {
      return res.status(403).json({
        error: result.error,
        upgrade: result.upgrade,
        limit: true,
      })
    }

    next()
  }
}

function rateLimitByPlan(tenant) {
  const limits = {
    free: 100,
    pro: 1000,
    enterprise: 10000,
  }
  return limits[tenant?.plan] || limits.free
}

async function getTenantUsage(tenantId) {
  const { Config, AuditLog } = require('../models')

  const configs = await Config.findAll({ where: { tenantId } })
  const alerts = configs.filter((c) => c.alertEnabled)

  const webhookConfigs = Array.from(require('../routes/webhooks').webhooks.values()).filter(
    (w) => w.tenantId === tenantId
  )

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const apiCalls = await AuditLog.count({
    where: {
      tenantId,
      createdAt: { [require('sequelize').Op.gte]: thirtyDaysAgo },
    },
  })

  return {
    chains: configs.length,
    alerts: alerts.length,
    webhooks: webhookConfigs.length,
    apiCalls30d: apiCalls,
  }
}

module.exports = {
  tenantMiddleware,
  requireTenant,
  requirePlanLimit,
  rateLimitByPlan,
  getTenantUsage,
  clearTenantCache,
}
