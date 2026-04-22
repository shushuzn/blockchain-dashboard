<template>
  <div class="charts-view">
    <div class="chain-tabs">
      <button 
        v-for="chain in chains" 
        :key="chain.id"
        class="chain-tab" 
        :class="{ active: activeChart === chain.id }"
        @click="switchChart(chain.id)"
      >
        {{ chain.name }}
      </button>
    </div>

    <div class="metric-toggles">
      <button 
        class="metric-toggle" 
        :class="{ active: activeMetrics.gas }"
        @click="toggleMetric('gas')"
      >
        ⛽ Priority Fee
      </button>
      <button 
        class="metric-toggle" 
        :class="{ active: activeMetrics.baseFee }"
        @click="toggleMetric('baseFee')"
      >
        📊 Base Fee
      </button>
      <button 
        v-if="currentChain.hasBlob"
        class="metric-toggle" 
        :class="{ active: activeMetrics.blobFee }"
        @click="toggleMetric('blobFee')"
      >
        🟣 Blob Fee
      </button>
      <button 
        class="metric-toggle" 
        :class="{ active: activeMetrics.util }"
        @click="toggleMetric('util')"
      >
        📈 Gas Util
      </button>
    </div>

    <div class="chart-controls">
      <span>Range:</span>
      <button 
        v-for="range in ranges" 
        :key="range.days"
        class="chart-range-btn" 
        :class="{ active: chartRange === range.days }"
        @click="setChartRange(range.days)"
      >
        {{ range.label }}
      </button>
      <span class="data-points">{{ dataPoints }} data points</span>
    </div>

    <div class="chart-container">
      <div class="chart-header">
        <span class="chart-title">{{ chartTitle }}</span>
        <span class="chart-meta">{{ chartMeta }}</span>
      </div>
      <div ref="chartContainer" id="chart"></div>
    </div>

    <div class="storage-bar">
      <div class="storage-row">
        <span class="storage-label">History stored</span>
        <span class="storage-value">{{ storageUsed }}</span>
      </div>
      <div class="storage-meter">
        <div class="storage-fill" :style="{ width: storageUsage + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useChainStore } from '../stores/chain'
import { LightweightCharts } from 'lightweight-charts'

const chainStore = useChainStore()

const activeChart = ref('ethereum')
const chartRange = ref(1)
const activeMetrics = ref({ gas: true, baseFee: true, blobFee: false, util: true })
const chartContainer = ref(null)
let chartInstance = null

const chains = computed(() => chainStore.chains)
const currentChain = computed(() => {
  return chains.value.find(c => c.id === activeChart.value) || chains.value[0]
})

const ranges = [
  { days: 1, label: '24h' },
  { days: 3, label: '3d' },
  { days: 7, label: '7d' }
]

const chartTitle = computed(() => {
  const metrics = []
  if (activeMetrics.value.gas) metrics.push('Priority Fee')
  if (activeMetrics.value.baseFee) metrics.push('Base Fee')
  if (activeMetrics.value.blobFee && currentChain.value.hasBlob) metrics.push('Blob Fee')
  if (activeMetrics.value.util) metrics.push('Gas Util %')
  return `${metrics.join(' & ')} — ${currentChain.value.name}`
})

const chartMeta = computed(() => {
  // Chart meta logic
  return 'No data yet'
})

const dataPoints = computed(() => {
  // Data points logic
  return 0
})

const storageUsed = computed(() => {
  // Storage usage logic
  return '0 MB / 5 MB'
})

const storageUsage = computed(() => {
  // Storage usage percentage
  return 0
})

const switchChart = (chainId) => {
  activeChart.value = chainId
  renderChart()
}

const setChartRange = (days) => {
  chartRange.value = days
  renderChart()
}

const toggleMetric = (metric) => {
  if (metric === 'blobFee' && !currentChain.value.hasBlob) return
  activeMetrics.value[metric] = !activeMetrics.value[metric]
  renderChart()
}

const renderChart = () => {
  if (!chartContainer.value) return

  if (chartInstance) {
    chartInstance.remove()
  }

  chartInstance = LightweightCharts.createChart(chartContainer.value, {
    width: chartContainer.value.clientWidth || 600,
    height: 220,
    layout: {
      background: { color: '#111827' },
      textColor: '#6b7280',
      fontSize: 10,
    },
    grid: {
      vertLines: { color: '#1f2937' },
      horzLines: { color: '#1f2937' },
    },
    crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
    timeScale: {
      borderColor: '#1f2937',
      timeVisible: true,
      secondsVisible: false,
    },
    rightPriceScale: { borderColor: '#1f2937' },
  })

  // Add series based on active metrics
  if (activeMetrics.value.gas) {
    const gasSeries = chartInstance.addLineSeries({
      color: '#10b981', lineWidth: 1.5, title: 'Priority Fee',
      priceFormat: { precision: 3, minMove: 0.001 },
    })
    // Set data for gas series
  }

  if (activeMetrics.value.baseFee) {
    const baseFeeSeries = chartInstance.addLineSeries({
      color: '#f59e0b', lineWidth: 1.5, title: 'Base Fee',
      priceFormat: { precision: 3, minMove: 0.001 },
    })
    // Set data for base fee series
  }

  if (activeMetrics.value.blobFee && currentChain.value.hasBlob) {
    const blobFeeSeries = chartInstance.addLineSeries({
      color: '#a78bfa', lineWidth: 1.5, title: 'Blob Fee',
      priceFormat: { precision: 5, minMove: 0.00001 },
    })
    // Set data for blob fee series
  }

  if (activeMetrics.value.util) {
    const utilSeries = chartInstance.addLineSeries({
      color: '#22d3ee', lineWidth: 1.5, title: 'Gas Util %',
      priceFormat: { precision: 1, minMove: 0.1 },
      priceScaleId: 'util',
    })
    chartInstance.priceScale('util').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })
    // Set data for util series
  }

  chartInstance.timeScale().fitContent()
}

onMounted(() => {
  renderChart()
  window.addEventListener('resize', renderChart)
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.remove()
  }
  window.removeEventListener('resize', renderChart)
})

watch(activeChart, renderChart)
watch(chartRange, renderChart)
watch(activeMetrics, renderChart, { deep: true })
</script>

<style scoped>
.charts-view {
  padding: 0;
}

.metric-toggles {
  display: flex;
  gap: 5px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.metric-toggle {
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid #1f2937;
  background: #0d1117;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.68rem;
}

.metric-toggle.active {
  border-color: #374151;
  color: #e2e8f0;
}

.metric-toggle[data-metric="gas"].active {
  border-color: #10b981;
  color: #10b981;
}

.metric-toggle[data-metric="baseFee"].active {
  border-color: #f59e0b;
  color: #f59e0b;
}

.metric-toggle[data-metric="blobFee"].active {
  border-color: #a78bfa;
  color: #a78bfa;
}

.metric-toggle[data-metric="util"].active {
  border-color: #22d3ee;
  color: #22d3ee;
}

.chart-controls {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-bottom: 10px;
}

.chart-controls span {
  font-size: 0.65rem;
  color: #4b5563;
  margin-right: 4px;
}

.chart-range-btn {
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid #1f2937;
  background: #0d1117;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.68rem;
}

.chart-range-btn:hover {
  border-color: #374151;
  color: #9ca3af;
}

.chart-range-btn.active {
  background: #1e1b4b;
  border-color: #6366f1;
  color: #a5b4fc;
}

.data-points {
  margin-left: auto;
}

.chart-container {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 14px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 8px;
}

.chart-title {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chart-meta {
  font-size: 0.68rem;
  color: #4b5563;
}

#chart {
  width: 100%;
  height: 220px;
}

.storage-bar {
  background: #0d1117;
  border: 1px solid #161b22;
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 12px;
}

.storage-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.storage-row:last-child {
  margin-bottom: 0;
}

.storage-label {
  font-size: 0.65rem;
  color: #6b7280;
}

.storage-value {
  font-size: 0.65rem;
  color: #9ca3af;
}

.storage-meter {
  height: 4px;
  background: #1f2937;
  border-radius: 2px;
  margin-top: 4px;
  overflow: hidden;
}

.storage-fill {
  height: 100%;
  background: #6366f1;
  border-radius: 2px;
  transition: width 0.3s;
}
</style>