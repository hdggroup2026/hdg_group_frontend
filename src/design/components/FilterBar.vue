<!--
  MỤC 718 (29/10/2026) — G1. Hàng bộ lọc: các ô lọc nằm trong slot mặc định, nút bên phải.
  Điện thoại: ô lọc xếp dọc, chiếm hết bề ngang.
-->
<template>
  <div class="hdg-filter hdg-card">
    <div class="hdg-filter__fields"><slot /></div>
    <div v-if="$slots.actions" class="hdg-filter__actions"><slot name="actions" /></div>
  </div>
</template>

<style scoped>
.hdg-filter { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; padding: 14px 16px; margin-bottom: 16px; }
.hdg-filter__fields { display: flex; flex-wrap: wrap; gap: 12px; flex: 1 1 auto; }
.hdg-filter__fields > :deep(*) { flex: 0 1 220px; min-width: 180px; }
.hdg-filter__actions { display: flex; gap: 8px; }
@media (max-width: 767px) {
  .hdg-filter__fields { flex-direction: column; width: 100%; }
  .hdg-filter__fields > :deep(*) { flex: 1 1 auto; width: 100%; }
  .hdg-filter__actions { width: 100%; }
}
</style>
