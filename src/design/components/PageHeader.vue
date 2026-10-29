<!--
  MỤC 718 (29/10/2026) — G1. Tiêu đề trang: chữ serif lớn + dòng mô tả + vùng nút bên phải.
  Điện thoại: nút xuống dòng dưới tiêu đề (không bóp tiêu đề).
-->
<template>
  <header class="hdg-page-header">
    <div class="hdg-page-header__text">
      <h1 class="hdg-page-header__title">{{ title }}</h1>
      <p v-if="subtitle || $slots.subtitle" class="hdg-page-header__sub">
        <slot name="subtitle">{{ subtitle }}</slot>
      </p>
    </div>
    <div v-if="$slots.actions" class="hdg-page-header__actions"><slot name="actions" /></div>
  </header>
</template>

<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>()
</script>

<style scoped>
.hdg-page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
.hdg-page-header__title { margin: 0; font-family: var(--hdg-font-serif); font-size: var(--hdg-fs-page-title); font-weight: 700; line-height: 1.2; color: var(--hdg-text); }
.hdg-page-header__sub { margin: 4px 0 0; color: var(--hdg-text-muted); font-size: var(--hdg-fs-body); }
.hdg-page-header__actions { display: flex; gap: 10px; flex-wrap: wrap; }
@media (max-width: 767px) {
  .hdg-page-header__title { font-size: 25px; }
  .hdg-page-header__actions { width: 100%; }
}
</style>
