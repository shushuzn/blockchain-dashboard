#!/usr/bin/env node

/**
 * Database initialization script
 * Creates tables and initializes default data
 */

const sequelize = require('./src/config/database')
const History = require('./src/models/History')
const Config = require('./src/models/Config')

async function initializeDatabase() {
  console.log('Initializing database...')
  
  try {
    // Test database connection
    console.log('Testing database connection...')
    await sequelize.authenticate()
    console.log('✅ Database connection successful')
    
    // Sync models
    console.log('Syncing models...')
    await sequelize.sync({
      force: false, // Set to true to recreate tables (dangerous in production)
      alter: true    // Automatically add new columns
    })
    console.log('✅ Models synced successfully')
    
    // Create default config if not exists
    console.log('Creating default config...')
    const defaultConfig = await Config.findOne({ where: { userId: 'default' } })
    if (!defaultConfig) {
      await Config.create({
        userId: 'default'
      })
      console.log('✅ Default config created')
    } else {
      console.log('✅ Default config already exists')
    }
    
    console.log('\n🎉 Database initialization completed successfully!')
    console.log('\nDatabase tables created:')
    console.log('  - history (for chain data history)')
    console.log('  - config (for user configuration)')
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

initializeDatabase()