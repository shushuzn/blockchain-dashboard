const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const History = sequelize.define('History', {
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

// Create table if not exists
async function syncHistory() {
  try {
    await History.sync()
    console.log('History table synchronized')
  } catch (error) {
    console.error('Error synchronizing History table:', error)
  }
}

syncHistory()

module.exports = History