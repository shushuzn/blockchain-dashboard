const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Config = sequelize.define('Config', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'default',
    unique: true
  },
  alertEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  telegramToken: {
    type: DataTypes.STRING
  },
  telegramChatId: {
    type: DataTypes.STRING
  },
  smtpHost: {
    type: DataTypes.STRING,
    defaultValue: 'smtp.gmail.com'
  },
  smtpPort: {
    type: DataTypes.STRING,
    defaultValue: '587'
  },
  smtpUser: {
    type: DataTypes.STRING
  },
  smtpPass: {
    type: DataTypes.STRING
  },
  smtpTo: {
    type: DataTypes.STRING
  },
  cooldownMin: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  thresholds: {
    type: DataTypes.TEXT,
    defaultValue: JSON.stringify({
      ethereum: { gas: 50, baseFee: 50, blobFee: 0.1 },
      base: { gas: 30, baseFee: 30, blobFee: 0.1 },
      arbitrum: { gas: 5, baseFee: 5, blobFee: 0 },
      optimism: { gas: 5, baseFee: 5, blobFee: 0 }
    })
  },
  alertLog: {
    type: DataTypes.TEXT,
    defaultValue: '[]'
  },
  alertState: {
    type: DataTypes.TEXT,
    defaultValue: '{}'
  }
}, {
  tableName: 'config',
  timestamps: false
})

// Create table if not exists
async function syncConfig() {
  try {
    await Config.sync()
    console.log('Config table synchronized')
  } catch (error) {
    console.error('Error synchronizing Config table:', error)
  }
}

syncConfig()

module.exports = Config