<!--
  ══════════════════════════════════════════════════════════════════════
  MỤC 674 (08/10/2026) — Ô SỐ CÓ CHI TIẾT HÌNH THÀNH

  s68 yêu cầu: *"đưa chuột vào số 49.000 là sẽ hiện chi tiết để hình
  thành số đó"* — bảng Cân đối toàn công ty, Trang Chủ.

  🔴 FRONTEND KHÔNG TỰ CỘNG GÌ Ở ĐÂY. Danh sách `ct` do backend sinh từ
  ĐÚNG vòng lặp đã cộng ra con số (`bang_dieu_khien.py` → `_chi_tiet`).
  Tự gọi `get-rentals` rồi cộng ở đây là tạo nguồn thứ hai — đúng bẫy
  MỤC 300/304/341.

  ⚠️ Mở bằng CẢ di chuột LẪN bấm. Điện thoại không có di chuột — chỉ
  hover thì trên điện thoại ô số này chết, mà không có gì báo.

  ⚠️ `ct` rỗng (null) thì in số trơn, KHÔNG gạch chân. Gạch chân mà bấm
  không ra gì là chỉ đường tới chỗ không tồn tại (bài học 7.3).
  ══════════════════════════════════════════════════════════════════════
-->
<template>
  <el-popover
    v-if="ct"
    :trigger="['hover', 'click']"
    placement="bottom-end"
    :width="380"
    :show-after="150"
  >
    <template #reference>
      <span class="cursor-help underline decoration-dotted underline-offset-4">{{ tien(so) }}</span>
    </template>

    <div class="text-xs">
      <div class="font-semibold text-gray-700 dark:text-gray-200 mb-2">
        {{ tieuDe }} = {{ tien(so) }}
      </div>

      <div v-if="ct.muc.length" class="max-h-72 overflow-y-auto pr-1">
        <div
          v-for="(m, i) in ct.muc"
          :key="i"
          class="flex justify-between gap-3 py-0.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
        >
          <span class="text-gray-600 dark:text-gray-300 break-words min-w-0">{{ m.ten }}</span>
          <span class="tabular-nums shrink-0" :class="mauSo(m.so)">{{ tien(m.so) }}</span>
        </div>
      </div>
      <div v-else class="text-gray-500 dark:text-gray-400">
        Không có mục nào khác 0.
      </div>

      <!-- Phần bị cắt vẫn ghi số mục và số tiền, để cộng lại khớp ô số. -->
      <div v-if="ct.so_muc_an" class="mt-1.5 flex justify-between gap-3 text-gray-500 dark:text-gray-400">
        <span>… và {{ ct.so_muc_an }} mục nhỏ hơn</span>
        <span class="tabular-nums">{{ tien(ct.tien_muc_an) }}</span>
      </div>

      <div v-if="ct.so_muc_bang_0 || ct.so_muc_trong"
           class="mt-2 pt-1.5 border-t border-gray-100 dark:border-gray-700 text-[11px] text-gray-400 dark:text-gray-500 leading-snug">
        <div v-if="ct.so_muc_bang_0">Không liệt kê {{ ct.so_muc_bang_0 }} mục bằng 0.</div>
        <!-- Ô trống ≠ số 0 (bài học 7.1): tô màu cam để nhìn ra cần đi điền. -->
        <div v-if="ct.so_muc_trong" class="text-amber-700 dark:text-amber-300">
          {{ ct.so_muc_trong }} mục để TRỐNG (chưa nhập số) — không cộng vào.
        </div>
      </div>
    </div>
  </el-popover>
  <span v-else>{{ tien(so) }}</span>
</template>

<script setup lang="ts">
import { mauSo } from '@/utils/mauSo'

defineProps<{
  so: number | null | undefined
  ct: {
    muc: { ten: string; so: number }[]
    so_muc_co_so: number
    so_muc_an: number
    tien_muc_an: number
    so_muc_bang_0: number
    so_muc_trong: number
  } | null | undefined
  tieuDe: string
}>()

// Cùng cách in số với HomeView.vue (hàm `tien`) — đổi một chỗ thì đổi cả hai.
const tien = (x: number | null | undefined): string => {
  if (x === null || x === undefined) return '—'
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(x)
}
</script>
