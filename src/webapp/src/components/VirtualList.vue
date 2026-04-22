<template>
  <div
    ref="containerRef"
    class="virtual-list"
    :style="{ height: `${height}px`, overflow: 'auto' }"
    @scroll="onScroll"
  >
    <div :style="{ height: `${totalHeight}px`, position: 'relative' }">
      <div
        v-for="item in visibleItems"
        :key="item.index"
        :style="{
          position: 'absolute',
          top: `${item.offset}px`,
          left: 0,
          right: 0,
          height: `${itemHeight}px`,
        }"
      >
        <slot :item="items[item.index]" :index="item.index" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  itemHeight: { type: Number, default: 50 },
  height: { type: Number, default: 400 },
  buffer: { type: Number, default: 5 },
})

const containerRef = ref(null)
const scrollTop = ref(0)

const totalHeight = computed(() => props.items.length * props.itemHeight)

const startIndex = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.buffer)
})

const endIndex = computed(() => {
  const visibleCount = Math.ceil(props.height / props.itemHeight)
  return Math.min(
    props.items.length,
    startIndex.value + visibleCount + props.buffer * 2
  )
})

const visibleItems = computed(() => {
  const items = []
  for (let i = startIndex.value; i < endIndex.value; i++) {
    items.push({
      index: i,
      offset: i * props.itemHeight,
    })
  }
  return items
})

let rafId = null

function onScroll(event) {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    scrollTop.value = event.target.scrollTop
  })
}

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
.virtual-list {
  position: relative;
}

.virtual-list::-webkit-scrollbar {
  width: 6px;
}

.virtual-list::-webkit-scrollbar-track {
  background: #1f2937;
}

.virtual-list::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 3px;
}
</style>
