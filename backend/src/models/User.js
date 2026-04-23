const { DataTypes } = require('sequelize')
const { sequelize, isDatabaseConnected } = require('../config/database')
const { logger } = require('../utils/logger')

let User = null

if (isDatabaseConnected() && sequelize) {
  User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'user',
    },
    refreshToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'users',
    timestamps: true,
  })

  async function syncUsers() {
    try {
      await User.sync()
      logger.info('Users table synchronized')
    } catch (error) {
      logger.error('Error synchronizing Users table', { error: error.message })
    }
  }

  syncUsers()
}

module.exports = User