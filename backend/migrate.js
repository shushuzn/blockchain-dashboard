#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations')
const DB_FILE = path.join(__dirname, '..', 'database.db')
const SEQUELIZE_META_TABLE = 'SequelizeMeta'

function ensureMigrationsDir() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true })
  }
}

function getTimestamp() {
  const now = new Date()
  return now.toISOString().replace(/[-:T.]/g, '').slice(0, 14)
}

function createMigration(name) {
  ensureMigrationsDir()
  const filename = `${getTimestamp()}-${name}.js`
  const filepath = path.join(MIGRATIONS_DIR, filename)

  const template = `'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add migration logic here
  },

  async down(queryInterface, Sequelize) {
    // Add rollback logic here
  }
}
`

  fs.writeFileSync(filepath, template)
  console.log(`Created migration: ${filepath}`)
  return filepath
}

function listMigrations() {
  ensureMigrationsDir()
  const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.js')).sort()
  if (files.length === 0) {
    console.log('No migrations found.')
    return []
  }
  console.log('Migrations:')
  files.forEach((f, i) => console.log(`  ${i + 1}. ${f}`))
  return files
}

function getAppliedMigrations() {
  const sqlite3 = require('sqlite3').verbose()
  const db = new sqlite3.Database(DB_FILE)

  return new Promise((resolve, reject) => {
    db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name='${SEQUELIZE_META_TABLE}'`, (err, rows) => {
      if (err) return reject(err)
      if (rows.length === 0) {
        db.close()
        return resolve([])
      }
      db.all(`SELECT name FROM ${SEQUELIZE_META_TABLE} ORDER BY name`, (err, migrations) => {
        db.close()
        if (err) return reject(err)
        resolve(migrations.map(m => m.name))
      })
    })
  })
}

async function checkStatus() {
  ensureMigrationsDir()
  const allFiles = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.js')).sort()
  const applied = await getAppliedMigrations()

  console.log('\nMigration Status:')
  console.log('='.repeat(60))

  allFiles.forEach(f => {
    const status = applied.includes(f) ? '✅ Applied' : '⬜ Pending'
    console.log(`  ${status}  ${f}`)
  })

  console.log(`\nTotal: ${allFiles.length} | Applied: ${applied.length} | Pending: ${allFiles.length - applied.length}`)
}

async function backup() {
  const backupFile = path.join(__dirname, '..', `backup-${getTimestamp()}.db`)
  fs.copyFileSync(DB_FILE, backupFile)
  console.log(`Database backed up to: ${backupFile}`)
  return backupFile
}

function restore(backupFile) {
  if (!fs.existsSync(backupFile)) {
    console.error(`Backup file not found: ${backupFile}`)
    process.exit(1)
  }
  fs.copyFileSync(backupFile, DB_FILE)
  console.log(`Database restored from: ${backupFile}`)
}

function printUsage() {
  console.log(`
Usage: node migrate.js <command> [options]

Commands:
  create <name>       Create a new migration file
  list                List all migration files
  status              Show migration status (applied vs pending)
  backup              Backup the current database
  restore <file>      Restore database from a backup file
  help                Show this help message
`)
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'create':
      if (!args[1]) {
        console.error('Error: Migration name required')
        console.log('Usage: node migrate.js create <name>')
        process.exit(1)
      }
      createMigration(args[1])
      break

    case 'list':
      listMigrations()
      break

    case 'status':
      await checkStatus()
      break

    case 'backup':
      if (!fs.existsSync(DB_FILE)) {
        console.error('Error: Database file not found')
        process.exit(1)
      }
      await backup()
      break

    case 'restore':
      if (!args[1]) {
        console.error('Error: Backup file path required')
        console.log('Usage: node migrate.js restore <file>')
        process.exit(1)
      }
      restore(args[1])
      break

    case 'help':
    case '--help':
    case '-h':
      printUsage()
      break

    default:
      console.error(`Unknown command: ${command}`)
      printUsage()
      process.exit(1)
  }
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
