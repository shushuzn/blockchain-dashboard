const express = require('express')
const router = express.Router()
const { Role, PERMISSIONS } = require('../models/Role')
const { requirePermission, requireRole } = require('../middleware/permissions')
const { logger } = require('../utils/logger')

router.get('/roles', requirePermission(PERMISSIONS.MANAGE_ROLES), async (req, res) => {
  try {
    const roles = await Role.findAll({
      attributes: ['id', 'name', 'description', 'permissions'],
    })
    res.json(roles)
  } catch (error) {
    logger.error('Get roles error', { error: error.message })
    res.status(500).json({ error: 'Failed to get roles' })
  }
})

router.get('/roles/:id', requirePermission(PERMISSIONS.MANAGE_ROLES), async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id)
    if (!role) {
      return res.status(404).json({ error: 'Role not found' })
    }
    res.json(role)
  } catch (error) {
    logger.error('Get role error', { error: error.message })
    res.status(500).json({ error: 'Failed to get role' })
  }
})

router.post('/roles', requireRole('admin'), async (req, res) => {
  try {
    const { name, description, permissions } = req.body

    if (!name || !permissions) {
      return res.status(400).json({ error: 'Name and permissions are required' })
    }

    const existingRole = await Role.findOne({ where: { name } })
    if (existingRole) {
      return res.status(409).json({ error: 'Role already exists' })
    }

    const role = await Role.create({ name, description, permissions })
    res.status(201).json(role)
  } catch (error) {
    logger.error('Create role error', { error: error.message })
    res.status(500).json({ error: 'Failed to create role' })
  }
})

router.put('/roles/:id', requireRole('admin'), async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id)
    if (!role) {
      return res.status(404).json({ error: 'Role not found' })
    }

    const { description, permissions } = req.body
    await role.update({ description, permissions })

    res.json(role)
  } catch (error) {
    logger.error('Update role error', { error: error.message })
    res.status(500).json({ error: 'Failed to update role' })
  }
})

router.delete('/roles/:id', requireRole('admin'), async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id)
    if (!role) {
      return res.status(404).json({ error: 'Role not found' })
    }

    if (role.name === 'admin') {
      return res.status(400).json({ error: 'Cannot delete admin role' })
    }

    await role.destroy()
    res.json({ success: true, message: 'Role deleted' })
  } catch (error) {
    logger.error('Delete role error', { error: error.message })
    res.status(500).json({ error: 'Failed to delete role' })
  }
})

router.get('/permissions', (req, res) => {
  res.json(Object.entries(PERMISSIONS).map(([key, value]) => ({
    key,
    value,
    description: getPermissionDescription(value),
  })))
})

function getPermissionDescription(permission) {
  const descriptions = {
    'read:chain_data': 'View chain data and gas prices',
    'read:alerts': 'View alert history',
    'write:alerts': 'Create and manage alerts',
    'read:config': 'View user configuration',
    'write:config': 'Modify user configuration',
    'read:metrics': 'View system metrics',
    'manage:users': 'Create, update, and delete users',
    'manage:roles': 'Manage roles and permissions',
    'manage:webhooks': 'Configure webhooks',
    'view:admin': 'Access admin panel',
  }
  return descriptions[permission] || permission
}

module.exports = router