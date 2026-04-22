const { Sequelize } = require('sequelize')

// SQLite database connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.db',
  logging: process.env.NODE_ENV === 'development'
})

// Test connection
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