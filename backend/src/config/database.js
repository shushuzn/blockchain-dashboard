const { Sequelize } = require('sequelize')

const DB_CONFIG = {
  dialect: 'sqlite',
  storage: process.env.DB_PATH || './database.db',
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

testConnection()

module.exports = sequelize