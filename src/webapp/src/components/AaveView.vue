<template>
  <div class="aave-view">
    <div class="aave-header">
      <h2>📈 Aave Lending</h2>
      <button class="btn" @click="refreshData">🔄 Refresh</button>
    </div>

    <div v-if="loading" class="loading-state">
      Loading Aave data...
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn" @click="refreshData">Retry</button>
    </div>

    <div v-else class="aave-content">
      <div class="aave-summary">
        <div class="aave-stat-card">
          <div class="aave-stat-label">Total Supply</div>
          <div class="aave-stat-value aave-positive">${{ formatUsd(data.totalLiquidityUSD) }}</div>
          <div class="aave-stat-sub">Total deposits</div>
        </div>
        
        <div class="aave-stat-card">
          <div class="aave-stat-label">Total Borrowed</div>
          <div class="aave-stat-value aave-negative">${{ formatUsd(data.totalDebtUSD) }}</div>
          <div class="aave-stat-sub">Active loans</div>
        </div>

        <div class="aave-stat-card">
          <div class="aave-stat-label">Utilization</div>
          <div class="aave-stat-value">{{ getUtilization() }}%</div>
          <div class="aave-stat-sub">Pool utilization</div>
        </div>
      </div>

      <div v-if="data.v2" class="aave-version">
        <h3>Aave V2</h3>
        <div class="market-list">
          <div 
            v-for="market in data.v2.markets?.slice(0, 5)" 
            :key="market.symbol"
            class="market-item"
          >
            <div class="market-info">
              <span class="market-symbol">{{ market.symbol || market.name }}</span>
            </div>
            <div class="market-stats">
              <div class="market-stat">
                <span class="stat-label">Liquidity</span>
                <span class="stat-value">${{ formatCompact(market.liquidity) }}</span>
              </div>
              <div class="market-stat">
                <span class="stat-label">Borrowed</span>
                <span class="stat-value">${{ formatCompact(market.debt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="data.v3" class="aave-version">
        <h3>Aave V3</h3>
        <div class="market-list">
          <div 
            v-for="market in data.v3.markets?.slice(0, 5)" 
            :key="market.symbol"
            class="market-item"
          >
            <div class="market-info">
              <span class="market-symbol">{{ market.symbol || market.name }}</span>
            </div>
            <div class="market-stats">
              <div class="market-stat">
                <span class="stat-label">Liquidity</span>
                <span class="stat-value">${{ formatCompact(market.liquidity) }}</span>
              </div>
              <div class="market-stat">
                <span class="stat-label">Borrowed</span>
                <span class="stat-value">${{ formatCompact(market.debt) }}</span>
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
import { aaveApi } from '../api'

const data = ref({})
const loading = ref(true)
const error = ref(null)

const fetchAaveData = async () => {
  loading.value = true
  error.value = null
  try {
    const result = await aaveApi.getMetrics()
    data.value = result
  } catch (err) {
    error.value = 'Failed to load Aave data: ' + (err.message || 'Unknown error')
    console.error('Aave fetch error:', err)
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  fetchAaveData()
}

const formatUsd = (value) => {
  if (!value) return '0.00'
  const num = parseFloat(value)
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(2)
}

const formatCompact = (value) => {
  if (!value) return '--'
  const num = parseFloat(value)
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K'
  return num.toFixed(2)
}

const getUtilization = () => {
  if (!data.value.totalLiquidityUSD) return '0.00'
  const liquidity = parseFloat(data.value.totalLiquidityUSD)
  const debt = parseFloat(data.value.totalDebtUSD)
  if (liquidity === 0) return '0.00'
  return ((debt / liquidity) * 100).toFixed(2)
}

onMounted(() => {
  fetchAaveData()
})
</script>

<style scoped>
.aave-view {
  padding: 0;
}

.aave-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.aave-header h2 {
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

.aave-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.aave-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.aave-stat-card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 10px;
  padding: 14px;
}

.aave-stat-label {
  font-size: 0.62rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.aave-stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #e2e8f0;
}

.aave-positive {
  color: #10b981;
}

.aave-negative {
  color: #f87171;
}

.aave-stat-sub {
  font-size: 0.62rem;
  color: #4b5563;
  margin-top: 4px;
}

.aave-version {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 10px;
  padding: 14px;
}

.aave-version h3 {
  font-size: 0.82rem;
  font-weight: 600;
  color: #9ca3af;
  margin-bottom: 12px;
}

.market-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.market-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #0d1117;
  border-radius: 8px;
  border: 1px solid #161b22;
}

.market-symbol {
  font-weight: 600;
  color: #e2e8f0;
  font-size: 0.82rem;
}

.market-stats {
  display: flex;
  gap: 16px;
}

.market-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stat-label {
  font-size: 0.58rem;
  color: #4b5563;
  text-transform: uppercase;
}

.stat-value {
  font-size: 0.78rem;
  color: #9ca3af;
  font-weight: 600;
}
</style>
