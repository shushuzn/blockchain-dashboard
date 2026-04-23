const sequelize = require('../config/database')
const { logger } = require('./logger')

async function addIndexes() {
  try {
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_config_userId ON config(userId);
    `)
    logger.info('Database indexes created successfully')
  } catch (error) {
    logger.error('Error creating indexes', { error: error.message })
  }
}

async function addQueryMonitoring() {
  const originalQuery = sequelize.query.bind(sequelize)
  
  sequelize.query = async function(sql, options) {
    const start = Date.now()
    
    try {
      const result = await originalQuery(sql, options)
      const duration = Date.now() - start
      
      if (duration > 100) {
        logger.warn('Slow query detected', { duration, sql: sql.substring(0, 200) })
      }
      
      return result
    } catch (error) {
      logger.error('Query error', { error: error.message, sql: sql.substring(0, 200) })
      throw error
    }
  }
}

async function optimizeDatabase() {
  try {
    await sequelize.query('PRAGMA journal_mode = WAL;')
    await sequelize.query('PRAGMA synchronous = NORMAL;')
    await sequelize.query('PRAGMA cache_size = -64000;')
    await sequelize.query('PRAGMA temp_store = MEMORY;')
    logger.info('SQLite pragmas optimized')
  } catch (error) {
    logger.error('Error optimizing database', { error: error.message })
  }
}

async function analyzeTables() {
  try {
    const [tables] = await sequelize.query(`
      SELECT name, 
             (SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND tbl_name = t.name) as index_count
      FROM sqlite_master t 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `)
    
    logger.info('Database tables analyzed', { tableCount: tables.length })
    tables.forEach(table => {
      logger.debug('Table info', { name: table.name, indexCount: table.index_count })
    })
    
    return tables
  } catch (error) {
    logger.error('Error analyzing tables', { error: error.message })
    return []
  }
}

module.exports = {
  addIndexes,
  addQueryMonitoring,
  optimizeDatabase,
  analyzeTables,
}