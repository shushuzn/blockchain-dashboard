const express = require('express')
const router = express.Router()
const { Op } = require('sequelize')
const History = require('../models/History')
const Config = require('../models/Config')
const { logger } = require('../utils/logger')

router.get('/history/csv', async (req, res) => {
  try {
    const { chainId, days = 7, format = 'csv' } = req.query
    
    const since = new Date()
    since.setDate(since.getDate() - parseInt(days))
    
    const history = await History.findAll({
      where: {
        chainId: chainId || 'ethereum',
        timestamp: { [Op.gte]: since.getTime() }
      },
      order: [['timestamp', 'ASC']]
    })
    
    if (format === 'json') {
      return res.json(history)
    }
    
    const headers = ['timestamp', 'chainId', 'gas', 'baseFee', 'blobFee', 'util']
    const csvRows = [headers.join(',')]
    
    history.forEach(row => {
      csvRows.push([
        new Date(row.timestamp).toISOString(),
        row.chainId,
        row.gas || '',
        row.baseFee || '',
        row.blobFee || '',
        row.util || ''
      ].join(','))
    })
    
    const csv = csvRows.join('\n')
    const filename = `blockchain-history-${chainId || 'ethereum'}-${Date.now()}.csv`
    
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csv)
  } catch (error) {
    logger.error('Export history failed', { error: error.message })
    res.status(500).json({ error: 'Export failed' })
  }
})

router.get('/config/export', async (req, res) => {
  try {
    const { userId = 'default' } = req.query
    
    const config = await Config.findOne({ where: { userId } })
    
    if (!config) {
      return res.status(404).json({ error: 'Config not found' })
    }
    
    res.json({
      alertEnabled: config.alertEnabled,
      thresholds: config.thresholds ? JSON.parse(config.thresholds) : {},
      telegramToken: config.telegramToken,
      telegramChatId: config.telegramChatId,
      webhookUrl: config.webhookUrl,
      updatedAt: config.updatedAt
    })
  } catch (error) {
    logger.error('Export config failed', { error: error.message })
    res.status(500).json({ error: 'Export failed' })
  }
})

module.exports = router