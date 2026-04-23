let sequelize = null
let isConnected = false
const { logger } = require('../utils/logger')

const getDatabaseConfig = () => {
  const dialect = process.env.DB_DIALECT || 'sqlite'
  
  const baseConfig = {
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 5,
      min: parseInt(process.env.DB_POOL_MIN) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    },
    retry: {
      max: parseInt(process.env.DB_RETRY_MAX) || 3,
      match: [/ TransientConditionError/],
      backoffBase: 100,
      backoffExponent: 1.5
    },
    define: {
      timestamps: false,
      underscored: true,
      freezeTableName: true
    },
    operatorsAliases: false,
    query: {
      raw: false,
      nest: false,
      type: 'SELECT'
    },
    transactionType: 'IMMEDIATE',
    isolationLevel: 'READ COMMITTED',
    replication: false
  }

  if (dialect === 'postgres') {
    return {
      ...baseConfig,
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'blockchain_dashboard',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
      } : false,
      dialectOptions: {
        decimalNumbers: true,
        supportBigNumbers: true,
        bigNumberStrings: true
      }
    }
  }

  return {
    ...baseConfig,
    dialect: 'sqlite',
    storage: process.env.DB_PATH || './database.db',
    dialectOptions: {
      busyTimeout: 5000,
      statementTimeout: 30000
    }
  }
}

function initializeDatabase() {
  try {
    const DB_CONFIG = getDatabaseConfig()
    const { Sequelize } = require('sequelize')
    sequelize = new Sequelize(DB_CONFIG)
    
    sequelize.beforeConnect(() => {
      logger.info('Connecting to database')
    })

    sequelize.afterConnect(() => {
      logger.info('Database connected successfully')
      isConnected = true
    })

    sequelize.afterDisconnect(() => {
      logger.warn('Database disconnected')
      isConnected = false
    })
  } catch (error) {
    logger.warn('Database initialization skipped', { error: error.message })
    sequelize = null
  }
}

async function testConnection() {
  if (!sequelize) {
    logger.warn('Database not initialized')
    return false
  }
  
  try {
    await sequelize.authenticate()
    logger.info('Database connection successful')
    isConnected = true
    return true
  } catch (error) {
    logger.warn('Database connection failed', { error: error.message })
    logger.warn('Running in mock mode - database features disabled')
    isConnected = false
    return false
  }
}

function isDatabaseConnected() {
  return isConnected && sequelize !== null
}

initializeDatabase()

if (process.env.NODE_ENV !== 'test' && process.env.SKIP_DB !== 'true') {
  testConnection().catch(err => {
    logger.warn('Database connection test failed', { error: err.message })
  })
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getDatabaseConfig,
    testConnection,
    isDatabaseConnected,
    initializeDatabase,
    sequelize
  }
}

if (typeof exports !== 'undefined') {
  exports.getDatabaseConfig = getDatabaseConfig
  exports.testConnection = testConnection
  exports.isDatabaseConnected = isDatabaseConnected
  exports.initializeDatabase = initializeDatabase
  exports.sequelize = sequelize
}