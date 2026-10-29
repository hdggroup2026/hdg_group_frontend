<!--
  MỤC 718 (29/10/2026) — G1. Số tiền: chấm nghìn, chữ số đều cột, đơn vị "đ" nhỏ hơn.
  Định dạng gọi `dinhDangSo` (MỤC 355/392) — KHÔNG tự viết lại, để số trên trang
  mới và trang cũ luôn giống nhau.
  `signed`: hiện dấu +/− và tô xanh/đỏ (dùng cho chênh lệch, thu/chi).
-->
<template>
  <span class="hdg-money hdg-num" :class="toneClass">
    {{ text }}<span v-if="unit" class="hdg-money__unit">&nbsp;{{ unit }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { dinhDangSo } from '@/utils/dinhDangSo'

const props = withDefaults(defineProps<{
  value: number | string | null | undefined
  unit?: string
  signed?: boolean
}>(), { unit: 'đ', signed: false })

const so = computed(() => {
  const n = Number(props.value)
  return Number.isFinite(n) ? n : null
})

const text = computed(() => {
  if (so.value === null) return '—'
  const tri = dinhDangSo(Math.abs(so.value))
  if (so.value < 0) return `−${tri}`
  return props.signed && so.value > 0 ? `+${tri}` : tri
})

const toneClass = computed(() => {
  if (!props.signed || so.value === null || so.value === 0) return ''
  return so.value > 0 ? 'hdg-money--pos' : 'hdg-money--neg'
})
</script>

<style scoped>
.hdg-money { white-space: nowrap; }
.hdg-money__unit { font-size: .78em; font-weight: 500; color: var(--hdg-text-muted); }
.hdg-money--pos { color: var(--hdg-success-text); }
.hdg-money--neg { color: var(--hdg-danger-text); }
</style>
