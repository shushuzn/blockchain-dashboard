const express = require('express')
const router = express.Router()
const { DCAOrder, getOrderHistory, calculateNextExecution } = require('../models/DCA')
const { executeDCA, simulateDCA, getCurrentGasPrice } = require('../services/dcaExecutor')
const { logger } = require('../utils/logger')

router.post('/orders', async (req, res) => {
  try {
    const { walletAddress, fromToken = 'ETH', toToken, amount, frequency = 'weekly', hourOfDay = 9, gasOptimization = true } = req.body
    const tenantId = req.headers['x-tenant-id']

    if (!walletAddress || !toToken || !amount) {
      return res.status(400).json({ error: 'walletAddress, toToken, and amount are required' })
    }

    const order = await DCAOrder.create({
      walletAddress,
      fromToken,
      toToken,
      amount,
      frequency,
      hourOfDay,
      gasOptimization,
      tenantId,
      nextExecution: calculateNextExecution({ frequency, hourOfDay }),
    })

    res.status(201).json({
      order: {
        id: order.id,
        walletAddress: order.walletAddress,
        fromToken: order.fromToken,
        toToken: order.toToken,
        amount: order.amount,
        frequency: order.frequency,
        status: order.status,
        nextExecution: order.nextExecution,
      },
      message: 'DCA order created successfully',
    })
  } catch (error) {
    logger.error('Create DCA order error', { error: error.message })
    res.status(500).json({ error: 'Failed to create DCA order' })
  }
})

router.get('/orders', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id']
    const { status } = req.query
    const where = tenantId ? { tenantId } : {}
    if (status) where.status = status

    const orders = await DCAOrder.findAll({ where, order: [['createdAt', 'DESC']] })

    res.json({
      orders: orders.map(o => ({
        id: o.id,
        walletAddress: o.walletAddress,
        fromToken: o.fromToken,
        toToken: o.toToken,
        amount: o.amount,
        frequency: o.frequency,
        status: o.status,
        lastExecution: o.lastExecution,
        nextExecution: o.nextExecution,
        totalExecuted: o.totalExecuted,
        totalAmount: o.totalAmount,
      })),
      count: orders.length,
    })
  } catch (error) {
    logger.error('Get DCA orders error', { error: error.message })
    res.status(500).json({ error: 'Failed to get orders' })
  }
})

router.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params
    const order = await DCAOrder.findByPk(id)
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const history = await getOrderHistory(id)

    res.json({
      order: {
        id: order.id,
        walletAddress: order.walletAddress,
        fromToken: order.fromToken,
        toToken: order.toToken,
        amount: order.amount,
        frequency: order.frequency,
        status: order.status,
        lastExecution: order.lastExecution,
        nextExecution: order.nextExecution,
        totalExecuted: order.totalExecuted,
        gasOptimization: order.gasOptimization,
        slippageTolerance: order.slippageTolerance,
      },
      history: history.map(h => ({
        id: h.id,
        fromAmount: h.fromAmount,
        toAmount: h.toAmount,
        status: h.status,
        executedAt: h.executedAt,
        hash: h.hash,
      })),
    })
  } catch (error) {
    logger.error('Get DCA order error', { error: error.message })
    res.status(500).json({ error: 'Failed to get order' })
  }
})

router.patch('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { status, amount, frequency } = req.body

    const order = await DCAOrder.findByPk(id)
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const updates = {}
    if (status) updates.status = status
    if (amount) updates.amount = amount
    if (frequency) {
      updates.frequency = frequency
      updates.nextExecution = calculateNextExecution({ frequency, hourOfDay: order.hourOfDay })
    }

    await order.update(updates)

    res.json({ success: true, order: { id: order.id, ...updates } })
  } catch (error) {
    logger.error('Update DCA order error', { error: error.message })
    res.status(500).json({ error: 'Failed to update order' })
  }
})

router.delete('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params
    await DCAOrder.update({ status: 'cancelled' }, { where: { id } })

    res.json({ success: true, message: 'Order cancelled' })
  } catch (error) {
    logger.error('Cancel DCA order error', { error: error.message })
    res.status(500).json({ error: 'Failed to cancel order' })
  }
})

router.post('/orders/:id/execute', async (req, res) => {
  try {
    const { id } = req.params
    const order = await DCAOrder.findByPk(id)

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    if (order.status !== 'active') {
      return res.status(400).json({ error: 'Order is not active' })
    }

    const result = await executeDCA(order)

    res.json({
      success: true,
      execution: result,
    })
  } catch (error) {
    logger.error('Execute DCA error', { error: error.message })
    res.status(500).json({ error: error.message })
  }
})

router.get('/orders/:id/simulate', async (req, res) => {
  try {
    const { id } = req.params
    const order = await DCAOrder.findByPk(id)

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const simulation = await simulateDCA(order)
    const gasPrice = await getCurrentGasPrice()

    res.json({
      simulation,
      currentGasPrice: gasPrice,
      recommendation: gasPrice > 50 ? 'High gas - consider waiting' : 'Good time to execute',
    })
  } catch (error) {
    logger.error('Simulate DCA error', { error: error.message })
    res.status(500).json({ error: 'Failed to simulate' })
  }
})

module.exports = router