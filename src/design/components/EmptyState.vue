<!-- MỤC 718 (29/10/2026) — G1. Khi bảng/khối không có gì: một câu nói rõ + (tuỳ chọn) một nút. -->
<template>
  <div class="hdg-empty">
    <div class="hdg-empty__icon" aria-hidden="true">{{ icon }}</div>
    <div class="hdg-empty__title">{{ title }}</div>
    <div v-if="description" class="hdg-empty__desc">{{ description }}</div>
    <div v-if="$slots.default" class="hdg-empty__action"><slot /></div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ title: string; description?: string; icon?: string }>(), { description: '', icon: '○' })
</script>

<style scoped>
.hdg-empty { padding: 36px 16px; text-align: center; color: var(--hdg-text-muted); }
.hdg-empty__icon { font-size: 30px; line-height: 1; margin-bottom: 10px; color: var(--hdg-green-500); }
.hdg-empty__title { font-size: var(--hdg-fs-body); color: var(--hdg-text); font-weight: 600; }
.hdg-empty__desc { margin-top: 4px; font-size: var(--hdg-fs-caption); }
.hdg-empty__action { margin-top: 14px; }
</style>
