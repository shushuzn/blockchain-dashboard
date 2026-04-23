const { Role, PERMISSIONS } = require('../models/Role')
const { logger } = require('../utils/logger')

function hasPermission(userPermissions, requiredPermission) {
  return userPermissions.includes(requiredPermission)
}

function hasAnyPermission(userPermissions, requiredPermissions) {
  return requiredPermissions.some(p => userPermissions.includes(p))
}

function hasAllPermissions(userPermissions, requiredPermissions) {
  return requiredPermissions.every(p => userPermissions.includes(p))
}

function requirePermission(permission) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    try {
      const userRole = await Role.findOne({ where: { name: req.user.role } })
      const userPermissions = userRole?.permissions || []

      if (!hasPermission(userPermissions, permission)) {
        return res.status(403).json({
          error: 'Permission denied',
          required: permission,
        })
      }

      next()
    } catch (error) {
      logger.error('Permission check error', { error: error.message })
      res.status(500).json({ error: 'Permission check failed' })
    }
  }
}

function requireAnyPermission(permissions) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    try {
      const userRole = await Role.findOne({ where: { name: req.user.role } })
      const userPermissions = userRole?.permissions || []

      if (!hasAnyPermission(userPermissions, permissions)) {
        return res.status(403).json({
          error: 'Permission denied',
          required: permissions,
        })
      }

      next()
    } catch (error) {
      logger.error('Permission check error', { error: error.message })
      res.status(500).json({ error: 'Permission check failed' })
    }
  }
}

function requireAllPermissions(permissions) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    try {
      const userRole = await Role.findOne({ where: { name: req.user.role } })
      const userPermissions = userRole?.permissions || []

      if (!hasAllPermissions(userPermissions, permissions)) {
        return res.status(403).json({
          error: 'Permission denied',
          required: permissions,
        })
      }

      next()
    } catch (error) {
      logger.error('Permission check error', { error: error.message })
      res.status(500).json({ error: 'Permission check failed' })
    }
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Role not authorized',
        required: roles,
      })
    }

    next()
  }
}

module.exports = {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  PERMISSIONS,
}