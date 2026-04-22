<template>
  <div class="alert-history">
    <div class="history-header">
      <h2>📋 Alert History</h2>
      <div class="header-actions">
        <select v-model="filterChain" class="filter-select">
          <option value="">All Chains</option>
          <option v-for="chain in chains" :key="chain.id" :value="chain.id">{{ chain.name }}</option>
        </select>
        <select v-model="filterMetric" class="filter-select">
          <option value="">All Metrics</option>
          <option value="gas">Gas Fee</option>
          <option value="baseFee">Base Fee</option>
          <option value="blobFee">Blob Fee</option>
          <option value="util">Utilization</option>
        </select>
        <button class="btn" @click="exportAlerts">📥 Export</button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">{{ filteredAlerts.length }}</div>
        <div class="stat-label">Total Alerts</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ alertStats.critical }}</div>
        <div class="stat-label">Critical</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ alertStats.warning }}</div>
        <div class="stat-label">Warning</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ alertStats.info }}</div>
        <div class="stat-label">Info</div>
      </div>
    </div>

    <div class="alert-list">
      <div v-if="filteredAlerts.length === 0" class="empty-state">
        <p>No alerts found</p>
      </div>
      <div 
        v-for="(alert, index) in filteredAlerts" 
        :key="index"
        class="alert-item"
        :class="getAlertClass(alert)"
      >
        <div class="alert-icon">{{ getAlertIcon(alert.severity) }}</div>
        <div class="alert-content">
          <div class="alert-main">
            <span class="alert-chain">{{ alert.chain }}</span>
            <span class="alert-metric">{{ alert.metric }}: {{ alert.value }} > {{ alert.threshold }}</span>
          </div>
          <div class="alert-meta">
            <span class="alert-time">{{ formatTime(alert.timestamp) }}</span>
            <span class="alert-severity" :class="alert.severity">{{ alert.severity || 'warning' }}</span>
          </div>
        </div>
        <button class="delete-btn" @click="deleteAlert(index)">×</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useChainStore } from '../stores/chain'
import { useConfigStore } from '../stores/config'

const chainStore = useChainStore()
const configStore = useConfigStore()

const filterChain = ref('')
const filterMetric = ref('')

const chains = computed(() => chainStore.chains)

const alerts = computed(() => {
  return configStore.alertLog || []
})

const filteredAlerts = computed(() => {
  let result = alerts.value
  
  if (filterChain.value) {
    result = result.filter(a => a.chain === filterChain.value)
  }
  
  if (filterMetric.value) {
    result = result.filter(a => a.metric?.toLowerCase().includes(filterMetric.value.toLowerCase()))
  }
  
  return result
})

const alertStats = computed(() => {
  const stats = { critical: 0, warning: 0, info: 0 }
  filteredAlerts.value.forEach(alert => {
    if (alert.value > alert.threshold * 1.5) stats.critical++
    else if (alert.value > alert.threshold) stats.warning++
    else stats.info++
  })
  return stats
})

function getAlertClass(alert) {
  const ratio = alert.value / alert.threshold
  if (ratio > 1.5) return 'critical'
  if (ratio > 1) return 'warning'
  return 'info'
}

function getAlertIcon(severity) {
  const icons = { critical: '🔴', warning: '🟡', info: '🔵' }
  return icons[severity] || '🟡'
}

function formatTime(timestamp) {
  if (!timestamp) return '--'
  const date = new Date(timestamp)
  return date.toLocaleString()
}

function exportAlerts() {
  const data = JSON.stringify(filteredAlerts.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `alerts-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function deleteAlert(index) {
  configStore.alertLog.splice(index, 1)
  configStore.saveConfig()
}
</script>

<style scoped>
.alert-history {
  padding: 0;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.history-header h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #818cf8;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 6px 12px;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 6px;
  color: #9ca3af;
  font-size: 0.78rem;
  cursor: pointer;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 10px;
  padding: 12px;
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #e2e8f0;
}

.stat-label {
  font-size: 0.68rem;
  color: #6b7280;
  margin-top: 4px;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 8px;
  border-left: 3px solid #f59e0b;
}

.alert-item.critical {
  border-left-color: #ef4444;
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.1), transparent);
}

.alert-item.warning {
  border-left-color: #f59e0b;
}

.alert-item.info {
  border-left-color: #3b82f6;
}

.alert-icon {
  font-size: 1.2rem;
}

.alert-content {
  flex: 1;
}

.alert-main {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.alert-chain {
  font-weight: 600;
  color: #e2e8f0;
}

.alert-metric {
  color: #9ca3af;
}

.alert-meta {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  font-size: 0.72rem;
  color: #6b7280;
}

.alert-severity {
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  font-size: 0.62rem;
}

.alert-severity.critical {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.alert-severity.warning {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
}

.alert-severity.info {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}

.delete-btn {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px 8px;
}

.delete-btn:hover {
  color: #ef4444;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
