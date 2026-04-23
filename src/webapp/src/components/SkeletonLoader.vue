<template>
  <div class="skeleton-wrapper" :class="wrapperClass">
    <div v-if="type === 'text'" class="skeleton-text" :style="textStyle"></div>
    <div v-else-if="type === 'circle'" class="skeleton-circle" :style="circleStyle"></div>
    <div v-else-if="type === 'card'" class="skeleton-card">
      <div class="skeleton-card-header">
        <div class="skeleton-circle" style="width: 40px; height: 40px;"></div>
        <div class="skeleton-card-title">
          <div class="skeleton-text" style="width: 60%; height: 16px;"></div>
          <div class="skeleton-text" style="width: 40%; height: 12px;"></div>
        </div>
      </div>
      <div class="skeleton-card-body">
        <div class="skeleton-text" style="width: 100%;"></div>
        <div class="skeleton-text" style="width: 90%;"></div>
        <div class="skeleton-text" style="width: 95%;"></div>
      </div>
    </div>
    <div v-else-if="type === 'table'" class="skeleton-table">
      <div class="skeleton-table-header">
        <div v-for="i in 5" :key="i" class="skeleton-text" :style="{ width: `${80 + Math.random() * 40}%` }"></div>
      </div>
      <div v-for="i in rows" :key="i" class="skeleton-table-row">
        <div v-for="j in 5" :key="j" class="skeleton-text" :style="{ width: `${60 + Math.random() * 60}%` }"></div>
      </div>
    </div>
    <div v-else class="skeleton-rect" :style="rectStyle"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type?: 'text' | 'circle' | 'card' | 'table' | 'rect'
  width?: string
  height?: string
  rows?: number
  animation?: 'pulse' | 'wave' | 'fade'
  variant?: 'light' | 'dark'
  rounded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  width: '100%',
  height: '16px',
  rows: 5,
  animation: 'wave',
  variant: 'dark',
  rounded: false
})

const wrapperClass = computed(() => [
  `skeleton-${props.animation}`,
  `skeleton-variant-${props.variant}`,
  { 'skeleton-rounded': props.rounded }
])

const textStyle = computed(() => ({
  width: props.width,
  height: props.height
}))

const circleStyle = computed(() => ({
  width: props.width,
  height: props.width
}))

const rectStyle = computed(() => ({
  width: props.width,
  height: props.height
}))
</script>

<style scoped>
.skeleton-wrapper {
  display: inline-block;
}

.skeleton-text,
.skeleton-circle,
.skeleton-rect {
  background: linear-gradient(
    90deg,
    var(--skeleton-base) 25%,
    var(--skeleton-highlight) 50%,
    var(--skeleton-base) 75%
  );
  background-size: 200% 100%;
  border-radius: 4px;
}

.skeleton-rounded {
  border-radius: 9999px;
}

/* Pulse animation */
.skeleton-pulse {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Wave animation */
.skeleton-wave {
  animation: skeleton-wave 1.5s linear infinite;
}

@keyframes skeleton-wave {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Fade animation */
.skeleton-fade {
  animation: skeleton-fade 1.5s ease-in-out infinite;
}

@keyframes skeleton-fade {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

/* Variants */
.skeleton-variant-light {
  --skeleton-base: #e0e0e0;
  --skeleton-highlight: #f5f5f5;
}

.skeleton-variant-dark {
  --skeleton-base: #2a2a2a;
  --skeleton-highlight: #3a3a3a;
}

/* Card skeleton */
.skeleton-card {
  padding: 16px;
  background: var(--skeleton-base);
  border-radius: 8px;
}

.skeleton-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.skeleton-card-title {
  flex: 1;
}

.skeleton-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-card-body .skeleton-text {
  height: 14px;
}

/* Table skeleton */
.skeleton-table {
  width: 100%;
}

.skeleton-table-header {
  display: flex;
  gap: 16px;
  padding: 12px;
  background: var(--skeleton-base);
  border-radius: 4px 4px 0 0;
}

.skeleton-table-row {
  display: flex;
  gap: 16px;
  padding: 12px;
  border-bottom: 1px solid var(--skeleton-base);
}

.skeleton-table-row:last-child {
  border-bottom: none;
}
</style>