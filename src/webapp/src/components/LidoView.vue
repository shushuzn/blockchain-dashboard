<template>
  <div class="lido-view">
    <div class="lido-header">
      <h2>📊 Lido Staking</h2>
      <button class="btn" @click="refreshData">🔄 Refresh</button>
    </div>

    <div v-if="loading" class="loading-state">
      Loading Lido data...
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn" @click="refreshData">Retry</button>
    </div>

    <div v-else class="lido-content">
      <div class="lido-summary">
        <div class="lido-stat-card">
          <div class="lido-stat-label">Total ETH Staked</div>
          <div class="lido-stat-value">{{ formatEth(data.totalETH) }} ETH</div>
          <div class="lido-stat-sub">{{ data.totalShares || 0 }} shares</div>
        </div>
        
        <div class="lido-stat-card">
          <div class="lido-stat-label">Buffered ETH</div>
          <div class="lido-stat-value">{{ formatEth(data.bufferedEther) }} ETH</div>
          <div class="lido-stat-sub">Ready to stake</div>
        </div>

        <div class="lido-stat-card">
          <div class="lido-stat-label">Active Validators</div>
          <div class="lido-stat-value">{{ formatNumber(data.activeValidators) }}</div>
          <div class="lido-stat-sub">Currently active</div>
        </div>
      </div>

      <div v-if="data.priceMetrics" class="lido-price-section">
        <h3>Market Data</h3>
        <div class="lido-price-grid">
          <div class="price-item">
            <span class="price-label">stETH Price</span>
            <span class="price-value">{{ data.priceMetrics.stethPrice || '--' }}</span>
          </div>
          <div class="price-item">
            <span class="price-label">stETH/ETH</span>
            <span class="price-value">{{ data.priceMetrics.stethRatio || '--' }}</span>
          </div>
          <div class="price-item">
            <span class="price-label">Market Cap</span>
            <span class="price-value">{{ data.priceMetrics.marketCap || '--' }}</span>
          </div>
        </div>
      </div>

      <div v-if="data.dailyData?.length > 0" class="lido-history">
        <h3>7-Day History</h3>
        <div class="history-chart">
          <div class="history-placeholder">
            <div class="history-bars">
              <div 
                v-for="(day, index) in data.dailyData" 
                :key="index"
                class="history-bar"
                :style="{ height: getBarHeight(day.totalETH) + '%' }"
                :title="formatDate(day.date) + ': ' + formatEth(day.totalETH) + ' ETH'"
              >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { lidoApi } from '../api'

const data = ref({})
const loading = ref(true)
const error = ref(null)

const fetchLidoData = async () => {
  loading.value = true
  error.value = null
  try {
    const result = await lidoApi.getMetrics()
    data.value = result
  } catch (err) {
    error.value = 'Failed to load Lido data: ' + (err.message || 'Unknown error')
    console.error('Lido fetch error:', err)
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  fetchLidoData()
}

const formatEth = (value) => {
  if (!value) return '--'
  const num = parseFloat(value)
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(2)
}

const formatNumber = (value) => {
  if (!value) return '--'
  return parseInt(value).toLocaleString()
}

const formatDate = (timestamp) => {
  if (!timestamp) return '--'
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString()
}

const getBarHeight = (value) => {
  if (!data.value.totalETH) return 0
  const max = parseFloat(data.value.totalETH)
  const current = parseFloat(value) || 0
  return Math.max(5, (current / max) * 100)
}

onMounted(() => {
  fetchLidoData()
})
</script>

<style scoped>
.lido-view {
  padding: 0;
}

.lido-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.lido-header h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #818cf8;
}

.btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #1f2937;
  background: #111827;
  color: #9ca3af;
  cursor: pointer;
  font-size: 0.78rem;
}

.btn:hover {
  border-color: #374151;
  color: #e2e8f0;
}

.loading-state, .error-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.error-state {
  color: #f87171;
}

.lido-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lido-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.lido-stat-card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 10px;
  padding: 14px;
}

.lido-stat-label {
  font-size: 0.62rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.lido-stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #10b981;
}

.lido-stat-sub {
  font-size: 0.62rem;
  color: #4b5563;
  margin-top: 4px;
}

.lido-price-section, .lido-history {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 10px;
  padding: 14px;
}

.lido-price-section h3, .lido-history h3 {
  font-size: 0.82rem;
  font-weight: 600;
  color: #9ca3af;
  margin-bottom: 12px;
}

.lido-price-grid {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.price-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.price-label {
  font-size: 0.62rem;
  color: #6b7280;
}

.price-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #e2e8f0;
}

.history-chart {
  height: 100px;
}

.history-bars {
  display: flex;
  align-items: flex-end;
  height: 80px;
  gap: 4px;
  padding-top: 10px;
}

.history-bar {
  flex: 1;
  background: linear-gradient(to top, #10b981, #059669);
  border-radius: 3px 3px 0 0;
  min-height: 5px;
  transition: height 0.3s;
}

.history-bar:hover {
  background: linear-gradient(to top, #34d399, #10b981);
}
</style>
