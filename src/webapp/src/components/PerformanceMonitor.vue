<template>
  <div v-if="isVisible" class="performance-monitor" :class="{ expanded }">
    <div class="performance-header" @click="toggle">
      <BaseIcon :name="expanded ? 'chevron-up' : 'chevron-down'" :size="16" />
      <span>性能监控</span>
      <div class="performance-score" :class="scoreClass">
        {{ score }}分
      </div>
    </div>
    
    <div v-if="expanded" class="performance-content">
      <div class="performance-metrics">
        <div
          v-for="metric in metrics"
          :key="metric.name"
          class="metric-item"
          :class="getMetricClass(metric)"
        >
          <div class="metric-header">
            <span class="metric-name">{{ metric.name }}</span>
            <span class="metric-value">{{ formatMetricValue(metric) }}</span>
          </div>
          <div class="metric-bar">
            <div
              class="metric-bar-fill"
              :style="{ width: `${getMetricPercentage(metric)}%` }"
            />
          </div>
          <div class="metric-rating">
            {{ metric.rating === 'good' ? '✅ 优秀' : metric.rating === 'needs-improvement' ? '⚠️ 一般' : '❌ 需优化' }}
          </div>
        </div>
      </div>
      
      <div class="performance-stats">
        <div class="stat-item">
          <span class="stat-label">页面加载</span>
          <span class="stat-value">{{ loadTime }}ms</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">DOM Ready</span>
          <span class="stat-value">{{ domContentLoaded }}ms</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">首次渲染</span>
          <span class="stat-value">{{ firstPaint }}ms</span>
        </div>
      </div>
      
      <div class="performance-actions">
        <button class="action-btn" @click="clearData">
          <BaseIcon name="refresh" :size="14" />
          清除数据
        </button>
        <button class="action-btn" @click="exportData">
          <BaseIcon name="download" :size="14" />
          导出报告
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BaseIcon from './BaseIcon.vue'
import { getVitalsSummary, getOverallScore, clearVitals } from '../composables/useWebVitals'

interface Props {
  isVisible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isVisible: true
})

const expanded = ref(false)
const loadTime = ref(0)
const domContentLoaded = ref(0)
const firstPaint = ref(0)

const metrics = computed(() => {
  const summary = getVitalsSummary()
  return Object.entries(summary).map(([name, data]) => ({
    name,
    ...data
  }))
})

const score = computed(() => {
  return Math.round(getOverallScore())
})

const scoreClass = computed(() => {
  if (score.value >= 80) return 'good'
  if (score.value >= 50) return 'medium'
  return 'poor'
})

function toggle() {
  expanded.value = !expanded.value
}

function formatMetricValue(metric: { name: string; avg: number }): string {
  if (metric.name === 'CLS') {
    return metric.avg.toFixed(4)
  }
  return `${Math.round(metric.avg)}ms`
}

function getMetricPercentage(metric: { name: string; avg: number; rating: string }): number {
  const thresholds = {
    CLS: { good: 0.1, poor: 0.25 },
    LCP: { good: 2500, poor: 4000 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 }
  }
  
  const threshold = thresholds[metric.name as keyof typeof thresholds]
  if (!threshold) return 100
  
  if (metric.rating === 'good') return 100
  if (metric.rating === 'poor') return 30
  
  const ratio = metric.avg / threshold.good
  return Math.max(0, Math.min(100, (1 - ratio) * 100))
}

function getMetricClass(metric: { rating: string }) {
  return {
    good: metric.rating === 'good',
    medium: metric.rating === 'needs-improvement',
    poor: metric.rating === 'poor'
  }
}

function clearData() {
  clearVitals()
}

function exportData() {
  const data = {
    timestamp: new Date().toISOString(),
    score: score.value,
    metrics: getVitalsSummary(),
    performance: {
      loadTime: loadTime.value,
      domContentLoaded: domContentLoaded.value,
      firstPaint: firstPaint.value
    }
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `performance-report-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  if (typeof performance !== 'undefined') {
    loadTime.value = Math.round(performance.timing.loadEventEnd - performance.timing.navigationStart)
    domContentLoaded.value = Math.round(performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart)
    
    const paintEntries = performance.getEntriesByType('paint')
    const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint')
    firstPaint.value = fcpEntry ? Math.round(fcpEntry.startTime) : 0
  }
})
</script>

<style scoped>
.performance-monitor {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  z-index: 9999;
  min-width: 280px;
  font-family: monospace;
  font-size: 12px;
}

.performance-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-primary);
}

.performance-header:hover {
  background: var(--bg-tertiary);
}

.performance-score {
  margin-left: auto;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.performance-score.good {
  background: var(--success);
  color: white;
}

.performance-score.medium {
  background: var(--warning);
  color: white;
}

.performance-score.poor {
  background: var(--danger);
  color: white;
}

.performance-content {
  padding: 12px;
}

.performance-metrics {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.metric-item {
  padding: 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
}

.metric-item.good {
  border-left: 3px solid var(--success);
}

.metric-item.medium {
  border-left: 3px solid var(--warning);
}

.metric-item.poor {
  border-left: 3px solid var(--danger);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.metric-name {
  font-weight: bold;
}

.metric-value {
  color: var(--text-secondary);
}

.metric-bar {
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.metric-bar-fill {
  height: 100%;
  background: var(--accent-primary);
  transition: width 0.3s ease;
}

.metric-rating {
  font-size: 10px;
  color: var(--text-secondary);
}

.performance-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.stat-item {
  text-align: center;
  padding: 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
}

.stat-label {
  display: block;
  font-size: 10px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.stat-value {
  font-weight: bold;
  color: var(--accent-primary);
}

.performance-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
}

.action-btn:hover {
  opacity: 0.9;
}
</style>