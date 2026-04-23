<template>
  <div class="perf-analyzer">
    <h3>Performance Analyzer</h3>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <p>FCP: {{ metrics.fcp }}ms</p>
      <p>TTFB: {{ metrics.ttfb }}ms</p>
      <p>Network: {{ metrics.networkRequests }} requests</p>
      <button @click="refresh">Refresh</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const loading = ref(true)
const metrics = ref({
  fcp: 0,
  ttfb: 0,
  networkRequests: 0
})

function refresh() {
  if (typeof performance !== 'undefined') {
    const entries = performance.getEntriesByType('navigation')
    if (entries.length > 0) {
      const nav = entries[0] as PerformanceNavigationTiming
      metrics.value.ttfb = Math.round(nav.responseStart)
    }
    
    const paintEntries = performance.getEntriesByType('paint')
    const fcp = paintEntries.find(e => e.name === 'first-contentful-paint')
    if (fcp) {
      metrics.value.fcp = Math.round(fcp.startTime)
    }
    
    const resourceEntries = performance.getEntriesByType('resource')
    metrics.value.networkRequests = resourceEntries.length
  }
  loading.value = false
}

onMounted(() => {
  refresh()
})
</script>

<style scoped>
.perf-analyzer {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  padding: 1rem;
}

.perf-analyzer h3 {
  margin: 0 0 1rem 0;
}
</style>