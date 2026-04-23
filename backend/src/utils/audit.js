const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')
const { logger } = require('./logger')

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  resource: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resourceId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  ip: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'success',
  },
}, {
  tableName: 'audit_logs',
  timestamps: true,
  paranoid: false,
})

const AUDIT_ACTIONS = {
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_REGISTER: 'user.register',
  USER_PASSWORD_CHANGE: 'user.password_change',
  USER_PROFILE_UPDATE: 'user.profile_update',
  TOKEN_REFRESH: 'token.refresh',
  TOKEN_REVOKE: 'token.revoke',
  CONFIG_READ: 'config.read',
  CONFIG_UPDATE: 'config.update',
  ALERT_CREATE: 'alert.create',
  ALERT_DELETE: 'alert.delete',
  ALERT_TRIGGERED: 'alert.triggered',
  ADMIN_ROLE_CREATE: 'admin.role.create',
  ADMIN_ROLE_UPDATE: 'admin.role.update',
  ADMIN_ROLE_DELETE: 'admin.role.delete',
  ADMIN_USER_UPDATE: 'admin.user.update',
  PUSH_REGISTER: 'push.register',
  PUSH_SEND: 'push.send',
  EXPORT_DATA: 'data.export',
  IMPORT_DATA: 'data.import',
  API_KEY_CREATE: 'api_key.create',
  API_KEY_DELETE: 'api_key.delete',
  SECURITY_VIOLATION: 'security.violation',
  PERMISSION_DENIED: 'permission.denied',
}

async function logAudit(data) {
  try {
    const log = await AuditLog.create({
      userId: data.userId || null,
      action: data.action,
      resource: data.resource || null,
      resourceId: data.resourceId || null,
      details: data.details || null,
      ip: data.ip || null,
      userAgent: data.userAgent || null,
      status: data.status || 'success',
    })
    return log
  } catch (error) {
    logger.error('Failed to create audit log', { error: error.message })
    return null
  }
}

function auditMiddleware(action, resource) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res)

    res.json = function(data) {
      const status = res.statusCode >= 400 ? 'failure' : 'success'

      logAudit({
        userId: req.user?.id || null,
        action,
        resource,
        resourceId: req.params.id || null,
        details: {
          method: req.method,
          path: req.path,
          body: sanitizeBody(req.body),
        },
        ip: req.ip,
        userAgent: req.get('user-agent'),
        status,
      })

      return originalJson(data)
    }

    next()
  }
}

function sanitizeBody(body) {
  if (!body) return null

  const sanitized = { ...body }
  const sensitiveFields = ['password', 'currentPassword', 'newPassword', 'refreshToken', 'token', 'secret', 'apiKey']

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]'
    }
  }

  return sanitized
}

async function getAuditLogs(options = {}) {
  const { page = 1, limit = 50, userId, action, startDate, endDate } = options

  const where = {}

  if (userId) where.userId = userId
  if (action) where.action = action
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(startDate)
    if (endDate) where.createdAt.lte = new Date(endDate)
  }

  const { rows, count } = await AuditLog.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: Math.min(limit, 100),
    offset: (page - 1) * limit,
  })

  return {
    logs: rows,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  }
}

module.exports = {
  AuditLog,
  AUDIT_ACTIONS,
  logAudit,
  auditMiddleware,
  sanitizeBody,
  getAuditLogs,
}