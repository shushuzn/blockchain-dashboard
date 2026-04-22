<template>
  <div class="language-selector">
    <select v-model="currentLocale" @change="changeLanguage" class="locale-select">
      <option value="en">English</option>
      <option value="zh">中文</option>
      <option value="ja">日本語</option>
      <option value="ko">한국어</option>
    </select>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale } from '../i18n'

const { locale } = useI18n()
const currentLocale = ref(locale.value)

const changeLanguage = () => {
  setLocale(currentLocale.value)
  locale.value = currentLocale.value
}

onMounted(() => {
  currentLocale.value = locale.value
})
</script>

<style scoped>
.language-selector {
  display: inline-flex;
  align-items: center;
}

.locale-select {
  background: #0d1117;
  border: 1px solid #1f2937;
  border-radius: 6px;
  color: #e2e8f0;
  padding: 4px 8px;
  font-size: 0.78rem;
  cursor: pointer;
}

.locale-select:focus {
  outline: none;
  border-color: #6366f1;
}
</style>
