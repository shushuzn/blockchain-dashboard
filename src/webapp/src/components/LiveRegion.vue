<template>
  <div
    role="status"
    :aria-live="politeness"
    :aria-atomic="true"
    class="sr-only"
  >
    {{ message }}
  </div>
</template>

<script setup lang="ts">
import { useAnnouncer } from '../composables/useAccessibility'

const { message, politeness } = useAnnouncer()
</script>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only:focus {
  position: fixed;
  top: 0;
  left: 0;
  width: auto;
  height: auto;
  padding: 1rem;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
  background: var(--accent-primary);
  color: white;
  border-radius: 4px;
  z-index: 10000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>