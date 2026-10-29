<!--
  MỤC 718 (29/10/2026) — G1. Một khối trong biểu mẫu (tiêu đề + lưới ô nhập).
  `readonly`: khối "chỉ xem" (vd. Số dư hiện tại ở form hộ dân — ảnh 06), nền vàng nhạt.
  Lưới: 2 cột trên máy tính, 1 cột trên điện thoại.
-->
<template>
  <section class="hdg-fsec" :class="{ 'hdg-fsec--ro': readonly }">
    <div class="hdg-fsec__head">
      <span class="hdg-label">{{ title }}</span>
      <span v-if="readonly" class="hdg-fsec__ro">Chỉ xem</span>
    </div>
    <div class="hdg-fsec__grid" :style="{ '--cot': columns }"><slot /></div>
  </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ title: string; readonly?: boolean; columns?: number }>(), { readonly: false, columns: 2 })
</script>

<style scoped>
.hdg-fsec { padding: 16px 0; border-top: 1px solid var(--hdg-border); }
.hdg-fsec:first-child { border-top: 0; padding-top: 0; }
.hdg-fsec--ro { background: var(--hdg-gold-soft); border: 0; border-radius: var(--hdg-radius-card); padding: 16px; margin: 8px 0; }
.hdg-fsec__head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.hdg-fsec__ro { font-size: var(--hdg-fs-caption); color: var(--hdg-gold-text); font-weight: 600; }
.hdg-fsec__grid { display: grid; grid-template-columns: repeat(var(--cot), minmax(0, 1fr)); gap: 4px 18px; }
@media (max-width: 767px) { .hdg-fsec__grid { grid-template-columns: 1fr; } }
</style>
