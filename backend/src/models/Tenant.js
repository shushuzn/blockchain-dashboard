const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  plan: {
    type: DataTypes.ENUM('free', 'pro', 'enterprise'),
    defaultValue: 'free',
  },
  status: {
    type: DataTypes.ENUM('active', 'suspended', 'cancelled'),
    defaultValue: 'active',
  },
  maxChains: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
  },
  maxAlerts: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
  },
  maxWebhooks: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
  },
  maxApiCalls: {
    type: DataTypes.INTEGER,
    defaultValue: 1000,
  },
  customBranding: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  whiteLabel: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  logoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  primaryColor: {
    type: DataTypes.STRING,
    defaultValue: '#6366f1',
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  billingCycle: {
    type: DataTypes.ENUM('monthly', 'yearly'),
    defaultValue: 'monthly',
  },
  trialEndsAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  subscriptionEndsAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'tenants',
  timestamps: true,
})

const PLAN_LIMITS = {
  free: {
    maxChains: 3,
    maxAlerts: 10,
    maxWebhooks: 5,
    maxApiCalls: 1000,
    customBranding: false,
    whiteLabel: false,
    sso: false,
    apiAccess: false,
    priority: false,
  },
  pro: {
    maxChains: 20,
    maxAlerts: 100,
    maxWebhooks: 50,
    maxApiCalls: 50000,
    customBranding: false,
    whiteLabel: false,
    sso: false,
    apiAccess: true,
    priority: true,
  },
  enterprise: {
    maxChains: -1,
    maxAlerts: -1,
    maxWebhooks: -1,
    maxApiCalls: -1,
    customBranding: true,
    whiteLabel: true,
    sso: true,
    apiAccess: true,
    priority: true,
  },
}

function getPlanLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free
}

async function checkPlanLimits(tenantId, resource, currentUsage) {
  const tenant = await Tenant.findByPk(tenantId)
  if (!tenant) return { allowed: false, error: 'Tenant not found' }

  const limits = getPlanLimits(tenant.plan)
  const limitKey = `max${resource.charAt(0).toUpperCase() + resource.slice(1)}s`

  const limit = limits[resource] || limits[limitKey]

  if (limit === -1) return { allowed: true }

  if (currentUsage >= limit) {
    return {
      allowed: false,
      error: `Plan limit reached. Upgrade to ${tenant.plan === 'free' ? 'Pro' : 'Enterprise'} for more`,
      upgrade: tenant.plan === 'free' ? 'pro' : 'enterprise',
    }
  }

  return { allowed: true, remaining: limit - currentUsage }
}

async function isTrialActive(tenantId) {
  const tenant = await Tenant.findByPk(tenantId)
  if (!tenant || tenant.plan !== 'free') return false

  if (tenant.trialEndsAt && new Date(tenant.trialEndsAt) > new Date()) {
    return true
  }
  return false
}

async function getTenantStatus(tenantId) {
  const tenant = await Tenant.findByPk(tenantId)
  if (!tenant) return null

  const isTrial = await isTrialActive(tenantId)
  const limits = getPlanLimits(tenant.plan)

  return {
    id: tenant.id,
    name: tenant.name,
    plan: tenant.plan,
    status: tenant.status,
    isTrial,
    trialEndsAt: tenant.trialEndsAt,
    limits,
    features: Object.keys(limits).filter((k) => limits[k] !== false && limits[k] !== 0 && limits[k] !== -1),
  }
}

module.exports = {
  Tenant,
  PLAN_LIMITS,
  getPlanLimits,
  checkPlanLimits,
  isTrialActive,
  getTenantStatus,
}
