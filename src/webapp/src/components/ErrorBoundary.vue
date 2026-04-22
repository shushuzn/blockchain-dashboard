<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <div class="error-icon">⚠️</div>
      <h2>Something went wrong</h2>
      <p>{{ errorMessage }}</p>
      <button @click="handleRetry" class="retry-btn">
        🔄 Try Again
      </button>
    </div>
  </div>
  <slot v-else />
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)
const errorMessage = ref('')

onErrorCaptured((err, instance, info) => {
  console.error('[ErrorBoundary]', {
    error: err.message || String(err),
    stack: err.stack,
    info
  })
  
  hasError.value = true
  errorMessage.value = err.message || 'An unexpected error occurred'
  
  return false
})

function handleRetry() {
  hasError.value = false
  errorMessage.value = ''
  window.location.reload()
}
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 2rem;
  background: #1f2937;
  border-radius: 8px;
  margin: 1rem;
}

.error-content {
  text-align: center;
  max-width: 400px;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

h2 {
  color: #ef4444;
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

p {
  color: #9ca3af;
  margin: 0 0 1.5rem 0;
  font-size: 0.875rem;
  word-break: break-word;
}

.retry-btn {
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.15s;
}

.retry-btn:hover {
  background: #4f46e5;
}
</style>
