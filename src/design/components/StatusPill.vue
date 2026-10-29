<!--
  MỤC 718 (29/10/2026) — G1. Trạng thái = CHẤM MÀU + CHỮ, chỉ 4 màu (+ trung tính).
  VÌ SAO không dùng el-tag: el-tag chỉ đổi màu nền, người mù màu không phân biệt được;
  quy tắc ② của hệ thống thiết kế bắt buộc có chấm + chữ.
-->
<template>
  <span class="hdg-pill" :class="`hdg-pill--${tone}`">
    <span class="hdg-pill__dot" aria-hidden="true" />
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  label?: string
}>(), { tone: 'neutral', label: '' })
</script>

<style scoped>
.hdg-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: var(--hdg-radius-pill);
  font-size: var(--hdg-fs-caption);
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
}
.hdg-pill__dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.hdg-pill--success { color: var(--hdg-success-text); background: var(--hdg-success-soft); }
.hdg-pill--warning { color: var(--hdg-warning-text); background: var(--hdg-warning-soft); }
.hdg-pill--danger { color: var(--hdg-danger-text); background: var(--hdg-danger-soft); }
.hdg-pill--info { color: var(--hdg-info-text); background: var(--hdg-info-soft); }
.hdg-pill--neutral { color: var(--hdg-text-muted); background: var(--hdg-row-alt); border: 1px solid var(--hdg-border); }
</style>
