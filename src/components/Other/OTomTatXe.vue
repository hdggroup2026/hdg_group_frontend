<!--
  MỤC 702 (10/10/2026) — RÊ CHUỘT / BẤM VÀO BIỂN SỐ HIỆN TÓM TẮT XE.

  s68: *"đưa vào biển số thì thấy luôn thông tin liên quan chiếc xe như bảo
  hiểm, hạn đăng kiểm, lịch bảo trì gần nhất luôn"*.

  🔴 Frontend KHÔNG tự tính. `tt` lấy từ `/vehicle/get-tom-tat-xe`, CÙNG hàm
  `tom_tat_xe` với bộ nhắc của bot — số trên web và số trong tin nhắc là một.
  Chưa có `tt` (máy chủ cũ / đang tải) thì in biển số trơn, không gạch chân.
-->
<template>
  <el-popover v-if="tt" :trigger="['hover', 'click']" placement="bottom-start" :width="340" :show-after="150">
    <template #reference>
      <span class="font-bold text-gray-850 dark:text-gray-100 cursor-help underline decoration-dotted underline-offset-4">
        {{ bien }}<span v-if="(tt.thieu || []).length" class="ml-1 text-red-500">●</span>
      </span>
    </template>
    <div class="text-xs space-y-2">
      <div class="font-semibold">{{ bien }}</div>

      <div>
        <div class="text-gray-400 uppercase tracking-wide text-[10px] mb-0.5">Bảo hiểm</div>
        <div v-if="!(tt.bao_hiem || []).length" class="text-red-600">Chưa có hợp đồng nào</div>
        <div v-for="(b, i) in tt.bao_hiem" :key="i" class="flex justify-between gap-2">
          <span>{{ b.loai || 'Chưa ghi loại' }}<span v-if="b.cong_ty" class="text-gray-400"> · {{ b.cong_ty }}</span></span>
          <span class="font-mono shrink-0" :class="mau(b.con_lai, 30)">{{ b.het_han || '—' }} {{ chuCon(b.con_lai) }}</span>
        </div>
      </div>

      <div v-if="tt.can_dang_kiem">
        <div class="text-gray-400 uppercase tracking-wide text-[10px] mb-0.5">Đăng kiểm</div>
        <div v-if="!tt.dang_kiem" class="text-red-600 font-semibold">Chưa khai báo</div>
        <div v-else class="flex justify-between gap-2">
          <span>Hết hạn<span v-if="tt.dang_kiem.noi" class="text-gray-400"> · {{ tt.dang_kiem.noi }}</span></span>
          <span class="font-mono shrink-0 font-semibold" :class="mau(tt.dang_kiem.con_lai, 15)">
            {{ tt.dang_kiem.het_han }} {{ chuCon(tt.dang_kiem.con_lai) }}</span>
        </div>
      </div>

      <div>
        <div class="text-gray-400 uppercase tracking-wide text-[10px] mb-0.5">Bảo trì</div>
        <div class="flex justify-between gap-2">
          <span>Gần nhất</span>
          <span class="font-mono">{{ tt.bao_tri_gan_nhat?.ngay || '—' }}</span>
        </div>
        <div v-if="tt.bao_tri_gan_nhat?.noi_dung" class="text-gray-400">{{ tt.bao_tri_gan_nhat.noi_dung }}</div>
        <div v-if="tt.lich_hen" class="flex justify-between gap-2">
          <span>Lịch hẹn</span>
          <span class="font-mono" :class="mau(tt.lich_hen.con_lai, 7)">{{ tt.lich_hen.ngay }} {{ chuCon(tt.lich_hen.con_lai) }}</span>
        </div>
        <div v-else-if="tt.han_bao_tri_dinh_ky" class="flex justify-between gap-2">
          <span>Hạn định kỳ ({{ tt.ky_bao_tri_thang }} tháng)</span>
          <span class="font-mono" :class="mau(tt.bao_tri_con_lai, 7)">{{ tt.han_bao_tri_dinh_ky }} {{ chuCon(tt.bao_tri_con_lai) }}</span>
        </div>
      </div>

      <div v-if="(tt.thieu || []).length" class="pt-1.5 border-t border-gray-100 dark:border-gray-700 text-red-600 dark:text-red-400">
        <div v-for="t in tt.thieu" :key="t">• {{ t }}</div>
      </div>
    </div>
  </el-popover>
  <span v-else class="font-bold text-gray-850 dark:text-gray-100">{{ bien }}</span>
</template>

<script setup lang="ts">
defineProps<{ bien: string; tt: any }>()

const chuCon = (n: number | null | undefined) => {
  if (n === null || n === undefined) return ''
  if (n < 0) return `(quá ${-n} ngày)`
  if (n === 0) return '(HÔM NAY)'
  return `(còn ${n} ngày)`
}
const mau = (n: number | null | undefined, sap: number) => {
  if (n === null || n === undefined) return 'text-gray-500'
  if (n < 0) return 'text-red-600 dark:text-red-400'
  if (n <= sap) return 'text-amber-600 dark:text-amber-400'
  return 'text-green-600 dark:text-green-400'
}
</script>
