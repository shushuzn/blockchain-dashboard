const { DataTypes } = require('sequelize')
const sequelize = require('../../config/database')

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.STRING,
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
}, {
  tableName: 'roles',
  timestamps: true,
})

const PERMISSIONS = {
  READ_CHAIN_DATA: 'read:chain_data',
  READ_ALERTS: 'read:alerts',
  WRITE_ALERTS: 'write:alerts',
  READ_CONFIG: 'read:config',
  WRITE_CONFIG: 'write:config',
  READ_METRICS: 'read:metrics',
  MANAGE_USERS: 'manage:users',
  MANAGE_ROLES: 'manage:roles',
  MANAGE_WEBHOOKS: 'manage:webhooks',
  VIEW_ADMIN: 'view:admin',
}

const ROLES = {
  ADMIN: {
    name: 'admin',
    description: 'Full system access',
    permissions: Object.values(PERMISSIONS),
  },
  USER: {
    name: 'user',
    description: 'Standard user access',
    permissions: [
      PERMISSIONS.READ_CHAIN_DATA,
      PERMISSIONS.READ_ALERTS,
      PERMISSIONS.WRITE_ALERTS,
      PERMISSIONS.READ_CONFIG,
      PERMISSIONS.WRITE_CONFIG,
    ],
  },
  VIEWER: {
    name: 'viewer',
    description: 'Read-only access',
    permissions: [
      PERMISSIONS.READ_CHAIN_DATA,
      PERMISSIONS.READ_ALERTS,
      PERMISSIONS.READ_CONFIG,
    ],
  },
}

async function initRoles() {
  try {
    await Role.sync()

    for (const roleData of Object.values(ROLES)) {
      await Role.findOrCreate({
        where: { name: roleData.name },
        defaults: roleData,
      })
    }

    console.log('Roles initialized')
  } catch (error) {
    console.error('Error initializing roles:', error)
  }
}

initRoles()

module.exports = { Role, PERMISSIONS, ROLES }
