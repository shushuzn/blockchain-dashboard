const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const DCAOrder = sequelize.define('DCAOrder', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  walletAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fromToken: {
    type: DataTypes.STRING,
    defaultValue: 'ETH',
  },
  toToken: {
    type: DataTypes.STRING,
    defaultValue: 'USDC',
  },
  amount: {
    type: DataTypes.DECIMAL(36, 18),
    allowNull: false,
  },
  frequency: {
    type: DataTypes.ENUM('daily', 'weekly', 'biweekly', 'monthly'),
    defaultValue: 'weekly',
  },
  dayOfWeek: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  hourOfDay: {
    type: DataTypes.INTEGER,
    defaultValue: 9,
  },
  minuteOfHour: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('active', 'paused', 'completed', 'cancelled'),
    defaultValue: 'active',
  },
  lastExecution: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  nextExecution: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  totalExecuted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(36, 18),
    defaultValue: 0,
  },
  gasOptimization: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  maxGasPrice: {
    type: DataTypes.DECIMAL(36, 9),
    allowNull: true,
  },
  slippageTolerance: {
    type: DataTypes.DECIMAL(8, 4),
    defaultValue: 0.5,
  },
}, {
  tableName: 'dca_orders',
  timestamps: true,
})

const DCAExecution = sequelize.define('DCAExecution', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.UUID,
    references: { model: 'dca_orders', key: 'id' },
  },
  hash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fromToken: {
    type: DataTypes.STRING,
  },
  fromAmount: {
    type: DataTypes.DECIMAL(36, 18),
  },
  toToken: {
    type: DataTypes.STRING,
  },
  toAmount: {
    type: DataTypes.DECIMAL(36, 18),
  },
  executedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.ENUM('pending', 'executed', 'failed', 'skipped'),
    defaultValue: 'pending',
  },
  gasUsed: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  gasPrice: {
    type: DataTypes.DECIMAL(36, 9),
    allowNull: true,
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'dca_executions',
  timestamps: true,
})

DCAOrder.hasMany(DCAExecution, { foreignKey: 'orderId' })
DCAExecution.belongsTo(DCAOrder, { foreignKey: 'orderId' })

function calculateNextExecution(order) {
  const now = new Date()
  const next = new Date(now)

  switch (order.frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1)
      break
    case 'weekly':
      next.setDate(next.getDate() + 7)
      break
    case 'biweekly':
      next.setDate(next.getDate() + 14)
      break
    case 'monthly':
      next.setMonth(next.getMonth() + 1)
      break
  }

  if (order.hourOfDay !== undefined) {
    next.setHours(order.hourOfDay, order.minuteOfHour || 0, 0, 0)
  }

  return next
}

async function getActiveOrders() {
  return DCAOrder.findAll({ where: { status: 'active' } })
}

async function executeOrder(order) {
  const execution = await DCAExecution.create({
    orderId: order.id,
    fromToken: order.fromToken,
    fromAmount: order.amount,
    toToken: order.toToken,
    status: 'pending',
  })

  try {
    const { executeDCA } = require('../services/dcaExecutor')
    const result = await executeDCA(order)

    await execution.update({
      status: 'executed',
      toAmount: result.toAmount,
      hash: result.hash,
      gasUsed: result.gasUsed,
      gasPrice: result.gasPrice,
    })

    await order.update({
      lastExecution: new Date(),
      nextExecution: calculateNextExecution(order),
      totalExecuted: order.totalExecuted + 1,
      totalAmount: order.totalAmount + order.amount,
    })

    return result
  } catch (error) {
    await execution.update({
      status: 'failed',
      error: error.message,
    })
    throw error
  }
}

async function getOrderHistory(orderId) {
  return DCAExecution.findAll({
    where: { orderId },
    order: [['executedAt', 'DESC']],
    limit: 50,
  })
}

module.exports = {
  DCAOrder,
  DCAExecution,
  calculateNextExecution,
  getActiveOrders,
  executeOrder,
  getOrderHistory,
}
