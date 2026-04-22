const sequelize = require('../config/database')

async function addIndexes() {
  try {
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_config_userId ON config(userId);
    `)
    console.log('Database indexes created successfully')
  } catch (error) {
    console.error('Error creating indexes:', error.message)
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
        console.warn(`Slow query detected (${duration}ms):`, sql.substring(0, 200))
      }
      
      return result
    } catch (error) {
      console.error('Query error:', error.message, '\nSQL:', sql.substring(0, 200))
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
    console.log('SQLite pragmas optimized')
  } catch (error) {
    console.error('Error optimizing database:', error.message)
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
    
    console.log('Database tables:')
    tables.forEach(table => {
      console.log(`  ${table.name}: ${table.index_count} indexes`)
    })
    
    return tables
  } catch (error) {
    console.error('Error analyzing tables:', error.message)
    return []
  }
}

module.exports = {
  addIndexes,
  addQueryMonitoring,
  optimizeDatabase,
  analyzeTables,
}
