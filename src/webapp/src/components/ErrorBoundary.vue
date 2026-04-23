<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <div class="error-icon">
        <BaseIcon name="alert" :size="64" color="var(--danger)" />
      </div>
      
      <h2>Something went wrong</h2>
      <p class="error-message">{{ errorMessage }}</p>
      
      <div v-if="showDetails" class="error-details">
        <div class="details-header" @click="toggleDetails">
          <BaseIcon :name="expanded ? 'chevron-up' : 'chevron-down'" :size="16" />
          <span>Technical Details</span>
        </div>
        
        <div v-if="expanded" class="details-content">
          <div class="detail-section">
            <h4>Error Info</h4>
            <pre class="stack-trace">{{ errorInfo.stack || 'No stack trace available' }}</pre>
          </div>
          
          <div v-if="errorInfo.component" class="detail-section">
            <h4>Component</h4>
            <code>{{ errorInfo.component }}</code>
          </div>
          
          <div v-if="errorInfo.info" class="detail-section">
            <h4>Additional Info</h4>
            <pre>{{ errorInfo.info }}</pre>
          </div>
          
          <div class="detail-section">
            <h4>Error ID</h4>
            <code class="error-id">{{ errorId }}</code>
          </div>
        </div>
      </div>
      
      <div class="error-actions">
        <button @click="handleRetry" class="action-btn primary">
          <BaseIcon name="refresh" :size="16" />
          Try Again
        </button>
        
        <button @click="toggleDetails" class="action-btn secondary">
          <BaseIcon name="info" :size="16" />
          {{ showDetails ? 'Hide Details' : 'Show Details' }}
        </button>
      </div>
      
      <p class="error-help">
        If this problem persists, please contact support with the error ID above.
      </p>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { getLogger } from '../utils/logger'
import BaseIcon from './BaseIcon.vue'

const logger = getLogger('ErrorBoundary')

interface ErrorInfo {
  message?: string
  stack?: string
  component?: string
  info?: string
}

const hasError = ref(false)
const errorMessage = ref('')
const errorInfo = ref<ErrorInfo>({})
const errorId = ref('')
const showDetails = ref(false)
const expanded = ref(false)

function generateErrorId(): string {
  return `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
}

function toggleDetails() {
  showDetails.value = !showDetails.value
  if (showDetails.value) {
    expanded.value = true
  }
}

onErrorCaptured((err: Error, instance: unknown, info: string) => {
  errorId.value = generateErrorId()
  
  errorInfo.value = {
    message: err?.message || String(err),
    stack: err?.stack,
    component: (instance as { $options?: { name?: string } })?.$options?.name,
    info
  }
  
  errorMessage.value = err?.message || 'An unexpected error occurred'
  
  logger.error('[ErrorBoundary]', {
    errorId: errorId.value,
    error: errorInfo.value.message,
    stack: errorInfo.value.stack,
    component: errorInfo.value.component,
    info: errorInfo.value.info,
    timestamp: new Date().toISOString()
  })
  
  if (import.meta.env.VITE_SENTRY_DSN) {
    import('@sentry/vue').then(({ captureException }) => {
      captureException(err, { 
        extra: { 
          errorId: errorId.value,
          component: errorInfo.value.component,
          info 
        } 
      })
    }).catch(() => {})
  }
  
  hasError.value = true
  
  return false
})

function handleRetry() {
  hasError.value = false
  errorMessage.value = ''
  errorInfo.value = {}
  errorId.value = ''
  window.location.reload()
}
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: var(--bg-primary);
}

.error-content {
  text-align: center;
  max-width: 600px;
  padding: 3rem;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
}

.error-icon {
  margin-bottom: 1.5rem;
}

h2 {
  color: var(--danger);
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.error-message {
  color: var(--text-secondary);
  margin: 0 0 2rem 0;
  font-size: 1rem;
  line-height: 1.6;
}

.error-details {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  margin-bottom: 2rem;
  text-align: left;
  overflow: hidden;
}

.details-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}

.details-header:hover {
  background: var(--bg-tertiary);
}

.details-content {
  padding: 1rem;
  border-top: 1px solid var(--border-primary);
}

.detail-section {
  margin-bottom: 1rem;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h4 {
  color: var(--text-tertiary);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  margin: 0 0 0.5rem 0;
}

.detail-section pre,
.detail-section code {
  background: var(--bg-tertiary);
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-family: 'Monaco', 'Menlo', monospace;
  color: var(--text-secondary);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

.error-id {
  color: var(--accent-primary);
  font-weight: 600;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn.primary {
  background: var(--accent-primary);
  color: white;
}

.action-btn.primary:hover {
  background: var(--accent-secondary);
}

.action-btn.secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.action-btn.secondary:hover {
  background: var(--border-primary);
}

.error-help {
  color: var(--text-tertiary);
  font-size: 0.75rem;
  margin: 0;
}

@media (max-width: 640px) {
  .error-content {
    padding: 2rem 1.5rem;
  }
  
  .error-actions {
    flex-direction: column;
  }
}
</style>