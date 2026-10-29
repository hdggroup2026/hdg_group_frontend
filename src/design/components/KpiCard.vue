<!--
  MỤC 718 (29/10/2026) — G1. Thẻ số liệu. `tone="gold"` = thẻ cần chú ý (nền vàng nhạt).
  Bấm được (`clickable`) thì có chữ gợi ý bên dưới, ví dụ "Bấm để xem lịch sử ›".
  Không có số (null) thì hiện "Chưa có dữ liệu" — KHÔNG hiện 0 (PROMPT_01 mục 4.7: không bịa số).
-->
<template>
  <component :is="clickable ? 'button' : 'div'" type="button" class="hdg-kpi hdg-card" :class="[`hdg-kpi--${tone}`, { 'hdg-kpi--click': clickable }]" @click="clickable && emit('click')">
    <div class="hdg-kpi__label">{{ label }}</div>
    <div v-if="value === null || value === undefined" class="hdg-kpi__empty">Chưa có dữ liệu</div>
    <div v-else class="hdg-kpi__value">
      <MoneyText v-if="money" :value="value" />
      <span v-else class="hdg-num">{{ value }}</span>
    </div>
    <div v-if="hint" class="hdg-kpi__hint">{{ hint }}</div>
  </component>
</template>

<script setup lang="ts">
import MoneyText from './MoneyText.vue'

withDefaults(defineProps<{
  label: string
  value?: number | string | null
  money?: boolean
  hint?: string
  tone?: 'default' | 'gold'
  clickable?: boolean
}>(), { value: null, money: false, hint: '', tone: 'default', clickable: false })
const emit = defineEmits<{ click: [] }>()
</script>

<style scoped>
.hdg-kpi { display: block; width: 100%; text-align: left; padding: 18px 20px; font: inherit; color: inherit; }
.hdg-kpi--click { cursor: pointer; transition: border-color .15s; }
.hdg-kpi--click:hover { border-color: var(--hdg-green-500); }
.hdg-kpi--gold { background: var(--hdg-gold-soft); border-color: transparent; }
.hdg-kpi__label { color: var(--hdg-text-muted); font-size: var(--hdg-fs-body); }
.hdg-kpi__value { margin-top: 4px; font-family: var(--hdg-font-serif); font-size: 32px; font-weight: 700; color: var(--hdg-primary); line-height: 1.2; }
.hdg-kpi--gold .hdg-kpi__value { color: var(--hdg-gold-text); }
.hdg-kpi__value :deep(.hdg-num) { font-family: var(--hdg-font-serif); }
.hdg-kpi__empty { margin-top: 8px; color: var(--hdg-text-muted); font-size: var(--hdg-fs-body); font-style: italic; }
.hdg-kpi__hint { margin-top: 4px; color: var(--hdg-text-muted); font-size: var(--hdg-fs-caption); }
</style>
