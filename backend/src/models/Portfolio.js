const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Wallet = sequelize.define('Wallet', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isAddress(value) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
          throw new Error('Invalid Ethereum address')
        }
      },
    },
  },
  label: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  chain: {
    type: DataTypes.STRING,
    defaultValue: 'ethereum',
  },
}, {
  tableName: 'wallets',
  timestamps: true,
})

const Position = sequelize.define('Position', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  walletId: {
    type: DataTypes.UUID,
    references: { model: 'wallets', key: 'id' },
  },
  protocol: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  protocolVersion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  asset: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  assetAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  balance: {
    type: DataTypes.DECIMAL(36, 18),
    defaultValue: 0,
  },
  balanceUsd: {
    type: DataTypes.DECIMAL(36, 2),
    defaultValue: 0,
  },
  supplied: {
    type: DataTypes.DECIMAL(36, 18),
    defaultValue: 0,
  },
  borrowed: {
    type: DataTypes.DECIMAL(36, 18),
    defaultValue: 0,
  },
  apy: {
    type: DataTypes.DECIMAL(8, 4),
    defaultValue: 0,
  },
  healthFactor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  lastSynced: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
}, {
  tableName: 'positions',
  timestamps: true,
})

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  walletId: {
    type: DataTypes.UUID,
    references: { model: 'wallets', key: 'id' },
  },
  hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('deposit', 'withdraw', 'borrow', 'repay', 'swap', 'transfer', 'claim', 'other'),
    allowNull: false,
  },
  protocol: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  chain: {
    type: DataTypes.STRING,
    defaultValue: 'ethereum',
  },
  blockNumber: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  from: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  to: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  value: {
    type: DataTypes.DECIMAL(36, 18),
    defaultValue: 0,
  },
  gasUsed: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  gasPrice: {
    type: DataTypes.DECIMAL(36, 9),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'failed'),
    defaultValue: 'confirmed',
  },
  tokens: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
}, {
  tableName: 'transactions',
  timestamps: true,
})

Wallet.hasMany(Position, { foreignKey: 'walletId' })
Position.belongsTo(Wallet)
Wallet.hasMany(Transaction, { foreignKey: 'walletId' })
Transaction.belongsTo(Wallet)

async function syncWalletPositions(walletId, positions) {
  for (const pos of positions) {
    await Position.upsert({
      walletId,
      protocol: pos.protocol,
      asset: pos.asset,
      balance: pos.balance,
      balanceUsd: pos.balanceUsd,
      supplied: pos.supplied,
      borrowed: pos.borrowed,
      apy: pos.apy,
      healthFactor: pos.healthFactor,
      lastSynced: new Date(),
      metadata: pos.metadata || {},
    })
  }
}

async function getPortfolioSummary(tenantId) {
  const where = tenantId ? { tenantId } : {}

  const wallets = await Wallet.findAll({ where })

  const walletIds = wallets.map(w => w.id)

  const positions = walletIds.length > 0
    ? await Position.findAll({ where: { walletId: walletIds } })
    : []

  const transactions = walletIds.length > 0
    ? await Transaction.findAll({
        where: { walletId: walletIds },
        order: [['timestamp', 'DESC']],
        limit: 100,
      })
    : []

  const totalValueUsd = positions.reduce((sum, p) => sum + parseFloat(p.balanceUsd || 0), 0)

  const totalSupplied = positions.reduce((sum, p) => sum + parseFloat(p.supplied || 0), 0)
  const totalBorrowed = positions.reduce((sum, p) => sum + parseFloat(p.borrowed || 0), 0)

  const positionsByProtocol = {}
  positions.forEach(p => {
    if (!positionsByProtocol[p.protocol]) {
      positionsByProtocol[p.protocol] = []
    }
    positionsByProtocol[p.protocol].push(p)
  })

  const protocolSummaries = Object.entries(positionsByProtocol).map(([protocol, posns]) => ({
    protocol,
    totalValueUsd: posns.reduce((sum, p) => sum + parseFloat(p.balanceUsd || 0), 0),
    positions: posns.length,
  }))

  return {
    wallets: wallets.map(w => ({
      address: w.address,
      chain: w.chain,
      label: w.label,
    })),
    totalValueUsd,
    totalSupplied,
    totalBorrowed,
    netWorth: totalValueUsd,
    leverageRatio: totalSupplied > 0 ? totalBorrowed / totalSupplied : 0,
    protocolSummaries,
    recentTransactions: transactions.slice(0, 20),
    syncedAt: new Date().toISOString(),
  }
}

module.exports = {
  Wallet,
  Position,
  Transaction,
  syncWalletPositions,
  getPortfolioSummary,
}
