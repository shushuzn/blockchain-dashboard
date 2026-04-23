const { Sequelize } = require('sequelize')

const getDatabaseConfig = () => {
  const dialect = process.env.DB_DIALECT || 'sqlite'
  
  const baseConfig = {
    logging: process.env.NODE_ENV === 'development' ? (msg) => console.log(msg) : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    retry: {
      max: 3
    },
    define: {
      timestamps: false,
      underscored: true,
      freezeTableName: true
    }
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
      } : false
    }
  }

  return {
    ...baseConfig,
    dialect: 'sqlite',
    storage: process.env.DB_PATH || './database.db'
  }
}

const DB_CONFIG = getDatabaseConfig()
const sequelize = new Sequelize(DB_CONFIG)

sequelize.beforeConnect((config) => {
  console.log('[DB] Connecting to database...')
})

sequelize.afterConnect((connection, config) => {
  console.log('[DB] Connected successfully')
})

sequelize.afterDisconnect((connection, config) => {
  console.warn('[DB] Disconnected')
})

async function testConnection() {
  try {
    await sequelize.authenticate()
    console.log('Database connection successful')
  } catch (error) {
    console.error('Database connection failed:', error)
  }
}

if (process.env.NODE_ENV !== 'test') {
  testConnection()
}

module.exports = sequelize
module.exports.getDatabaseConfig = getDatabaseConfig