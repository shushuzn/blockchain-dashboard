const { DataTypes } = require('sequelize')
const { sequelize, isDatabaseConnected } = require('../config/database')
const { logger } = require('../utils/logger')

let History = null

if (isDatabaseConnected() && sequelize) {
  History = sequelize.define('History', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    chainId: {
      type: DataTypes.STRING,
      allowNull: false,
      index: true
    },
    timestamp: {
      type: DataTypes.BIGINT,
      allowNull: false,
      index: true
    },
    gas: {
      type: DataTypes.FLOAT
    },
    baseFee: {
      type: DataTypes.FLOAT
    },
    blobFee: {
      type: DataTypes.FLOAT
    },
    util: {
      type: DataTypes.FLOAT
    }
  }, {
    tableName: 'history',
    timestamps: false,
    indexes: [
      {
        name: 'idx_chain_timestamp',
        fields: ['chainId', 'timestamp']
      },
      {
        name: 'idx_chain_timestamp_desc',
        fields: ['chainId', ['timestamp', 'DESC']]
      }
    ]
  })

  async function syncHistory() {
    try {
      await History.sync()
      logger.info('History table synchronized')
    } catch (error) {
      logger.error('Error synchronizing History table', { error: error.message })
    }
  }

  syncHistory()
}

module.exports = History