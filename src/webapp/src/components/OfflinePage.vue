<template>
  <div class="offline-container">
    <div class="offline-content">
      <div class="offline-icon">📡</div>
      <h1>You're Offline</h1>
      <p>The Blockchain Dashboard requires an internet connection to fetch live data.</p>
      <div class="offline-info">
        <h3>What you can do:</h3>
        <ul>
          <li>📊 View cached data from your last session</li>
          <li>⚙️ Access settings (stored locally)</li>
          <li>📋 View alert history</li>
        </ul>
      </div>
      <button @click="retryConnection" class="retry-btn">
        🔄 Try Again
      </button>
      <p class="hint">Your data will automatically sync when you're back online.</p>
    </div>
  </div>
</template>

<script setup>
const retryConnection = () => {
  window.location.reload()
}
</script>

<style scoped>
.offline-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #0f172a;
  color: #f9fafb;
  padding: 2rem;
}

.offline-content {
  text-align: center;
  max-width: 400px;
}

.offline-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
}

h1 {
  font-size: 1.75rem;
  margin-bottom: 0.75rem;
  color: #f9fafb;
}

p {
  color: #9ca3af;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.offline-info {
  background: #1e293b;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  text-align: left;
}

.offline-info h3 {
  font-size: 0.875rem;
  color: #a5b4fc;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.offline-info ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.offline-info li {
  padding: 0.5rem 0;
  color: #d1d5db;
  font-size: 0.875rem;
  border-bottom: 1px solid #334155;
}

.offline-info li:last-child {
  border-bottom: none;
}

.retry-btn {
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.875rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
}

.retry-btn:hover {
  background: #4f46e5;
}

.hint {
  margin-top: 1rem;
  font-size: 0.75rem;
  color: #64748b;
}
</style>
