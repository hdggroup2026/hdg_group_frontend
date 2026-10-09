<!--
  ══════════════════════════════════════════════════════════════════════
  MỤC 694 (09/10/2026) — RÊ CHUỘT VÀO MÃ HỢP ĐỒNG THÌ HIỆN THÔNG TIN

  s68: *"phần rental và credit đưa chuột vào mã hợp đồng thì hiện thông
  tin của mã hợp đồng đó"* — Trang Chủ, thẻ Rental và Credit.

  🔴 FRONTEND KHÔNG TỰ TRA. Danh sách `tt` do backend dựng sẵn ngay trong
  vòng lặp sinh ra dòng mã (`bang_dieu_khien.py` → `_thong_tin`). Tự gọi
  `get-rentals` theo mã ở đây là nguồn thứ hai + mỗi lần rê chuột một lần
  gọi máy chủ (cùng lý do MỤC 674 / ChiTietO.vue).

  ⚠️ Mở bằng CẢ di chuột LẪN bấm — điện thoại không có di chuột.
  ⚠️ `tt` rỗng thì in mã trơn, KHÔNG gạch chân (bài học 7.3).
  ══════════════════════════════════════════════════════════════════════
-->
<template>
  <el-popover
    v-if="tt && tt.length"
    :trigger="['hover', 'click']"
    placement="bottom-start"
    :width="340"
    :show-after="150"
  >
    <template #reference>
      <span class="cursor-help underline decoration-dotted underline-offset-4 break-all">{{ ma }}</span>
    </template>

    <div class="text-xs">
      <div class="font-semibold text-gray-700 dark:text-gray-200 mb-2 break-all">{{ ma }}</div>
      <div
        v-for="(d, i) in tt"
        :key="i"
        class="flex justify-between gap-3 py-0.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
      >
        <span class="text-gray-500 dark:text-gray-400 shrink-0">{{ d.nhan }}</span>
        <span class="text-right break-words min-w-0 text-gray-700 dark:text-gray-200"
              :class="d.kieu === 'tien' ? 'tabular-nums' : ''">{{ inGiaTri(d) }}</span>
      </div>
    </div>
  </el-popover>
  <span v-else class="break-all">{{ ma }}</span>
</template>

<script setup lang="ts">
defineProps<{
  ma: string
  tt: { nhan: string; gt: string | number; kieu: string }[] | null | undefined
}>()

// Cùng cách in số với HomeView.vue / ChiTietO.vue.
const inGiaTri = (d: { gt: string | number; kieu: string }): string => {
  if (d.kieu === 'tien' && typeof d.gt === 'number')
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(d.gt)
  if (d.kieu === 'phan_tram' && typeof d.gt === 'number')
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(d.gt) + '%'
  return String(d.gt)
}
</script>
