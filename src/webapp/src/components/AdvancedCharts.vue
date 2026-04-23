<template>
  <div class="charts-view">
    <div class="charts-header">
      <h2>📈 Analytics</h2>
      <div class="chart-controls">
        <select v-model="timeRange" class="control-select">
          <option value="24h">24 Hours</option>
          <option value="7d">7 Days</option>
          <option value="30d">30 Days</option>
          <option value="all">All Time</option>
        </select>
        <select v-model="granularity" class="control-select">
          <option value="1">1 min</option>
          <option value="5">5 min</option>
          <option value="15">15 min</option>
          <option value="1h">1 hour</option>
        </select>
        <button class="btn" @click="toggleCompare">📊 Compare</button>
      </div>
    </div>

    <div v-if="compareMode" class="compare-info">
      <span>Comparing: {{ compareChain }} vs {{ activeChain }}</span>
      <select v-model="compareChain" class="control-select">
        <option v-for="c in chains" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>

    <div class="charts-grid">
      <div class="chart-card">
        <h3>Base Fee History</h3>
        <div ref="baseFeeChart" class="chart-container"></div>
      </div>
      
      <div class="chart-card">
        <h3>Priority Fee History</h3>
        <div ref="gasChart" class="chart-container"></div>
      </div>
      
      <div class="chart-card">
        <h3>Gas Utilization</h3>
        <div ref="utilChart" class="chart-container"></div>
      </div>
      
      <div class="chart-card" v-if="hasBlobData">
        <h3>Blob Fee History</h3>
        <div ref="blobChart" class="chart-container"></div>
      </div>
    </div>

    <div class="predictions" v-if="showPredictions">
      <h3>📈 Predictions (Experimental)</h3>
      <div class="pred-grid">
        <div class="pred-card">
          <span class="pred-label">Base Fee Trend</span>
          <span class="pred-value" :class="trendClass">{{ trendText }}</span>
        </div>
        <div class="pred-card">
          <span class="pred-label">Estimated peak (24h)</span>
          <span class="pred-value">{{ predictedPeak }}</span>
        </div>
        <div class="pred-card">
          <span class="pred-label">Confidence</span>
          <span class="pred-value">{{ confidence }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useChainStore } from '../stores/chain'

const chainStore = useChainStore()
const baseFeeChart = ref(null)
const gasChart = ref(null)
const utilChart = ref(null)
const blobChart = ref(null)

const timeRange = ref('7d')
const granularity = ref('15')
const compareMode = ref(false)
const compareChain = ref('')
const activeChain = ref('ethereum')

const chains = computed(() => chainStore.chains)
const hasBlobData = computed(() => {
  const chain = chains.value.find(c => c.id === activeChain.value)
  return chain?.hasBlob
})

const trendText = computed(() => {
  const data = getChartData()
  if (data.length < 2) return '--'
  const first = data[0]?.baseFee || 0
  const last = data[data.length - 1]?.baseFee || 0
  if (last > first * 1.1) return '📈 Rising (+' + Math.round((last / first - 1) * 100) + '%)'
  if (last < first * 0.9) return '📉 Falling (' + Math.round((1 - last / first) * 100) + '%)'
  return '➡️ Stable'
})

const trendClass = computed(() => {
  const data = getChartData()
  if (data.length < 2) return ''
  const first = data[0]?.baseFee || 0
  const last = data[data.length - 1]?.baseFee || 0
  if (last > first * 1.1) return 'rising'
  if (last < first * 0.9) return 'falling'
  return 'stable'
})

const predictedPeak = computed(() => {
  return '-- Gwei'
})

const confidence = computed(() => {
  return '75'
})

function getChartData() {
  const history = chainStore.history[activeChain.value] || []
  return history
}

function toggleCompare() {
  compareMode.value = !compareMode.value
}

onMounted(() => {
  if (chains.value.length > 0) {
    activeChain.value = chains.value[0]?.id || 'ethereum'
    if (chains.value.length > 1) {
      compareChain.value = chains.value[1]?.id || ''
    }
  }
})
</script>

<style scoped>
.charts-view {
  padding: 0;
}

.charts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.charts-header h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #818cf8;
}

.chart-controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.control-select {
  padding: 6px 12px;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 6px;
  color: #9ca3af;
  font-size: 0.78rem;
  cursor: pointer;
}

.compare-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #1e293b;
  border-radius: 6px;
  font-size: 0.78rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.chart-card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 10px;
  padding: 14px;
}

.chart-card h3 {
  font-size: 0.82rem;
  color: #9ca3af;
  margin-bottom: 12px;
}

.chart-container {
  height: 200px;
  background: #0d1117;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
}

.predictions {
  margin-top: 16px;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 10px;
  padding: 14px;
}

.predictions h3 {
  font-size: 0.82rem;
  color: #818cf8;
  margin-bottom: 12px;
}

.pred-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.pred-card {
  background: #0d1117;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.pred-label {
  display: block;
  font-size: 0.68rem;
  color: #6b7280;
  margin-bottom: 6px;
}

.pred-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e2e8f0;
}

.pred-value.rising { color: #f87171; }
.pred-value.falling { color: #10b981; }
.pred-value.stable { color: #818cf8; }

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
