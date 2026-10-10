<!--
  MỤC 699 (09/10/2026) — KHUNG THÔNG TIN MỘT SIM (rê chuột vào SĐT ở tab Điện thoại).
  s68: *"khi đưa chuột vào số điện thoại thì hiện thông tin liên quan đến sđt đó
  luôn. esim hay sim vật lý luôn"*.
  Trống thì bỏ dòng (không in "0" hay chữ giả — bài học 7.1).
  `gon`: bản rút gọn dùng trong danh sách nhiều SIM.
-->
<template>
  <div class="text-xs">
    <div class="flex items-center gap-2 mb-1">
      <span class="font-mono font-bold">{{ sim.phone_number }}</span>
      <el-tag size="small" :type="laEsim ? 'warning' : 'info'" effect="plain">{{ sim.sim_type || 'Chưa rõ loại' }}</el-tag>
      <el-tag v-if="chinh" size="small" type="success">SIM chính</el-tag>
      <span v-else-if="!gon" class="text-amber-600 text-[11px]">chưa chọn SIM chính</span>
    </div>
    <template v-for="d in dong" :key="d[0]">
      <div v-if="d[1]" class="flex justify-between gap-3 py-0.5">
        <span class="text-gray-500 shrink-0">{{ d[0] }}</span>
        <span class="text-right break-words min-w-0">{{ d[1] }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ sim: any; chinh?: boolean; gon?: boolean }>()

const laEsim = computed(() => /esim/i.test(String(props.sim?.sim_type || '')))
const TRANG_THAI: Record<string, string> = { active: 'Đang dùng', cancelled: 'Đã huỷ', suspended: 'Tạm khoá' }
const ngay = (d: any) => (d ? String(d).split('-').reverse().join('/') : '')

const dong = computed(() => {
  const s = props.sim || {}
  const ra: [string, any][] = [
    ['Nhà mạng', s.carrier],
    ['Trạng thái', TRANG_THAI[s.status] || s.status],
    ['Hạn sử dụng', ngay(s.expiry_date)],
  ]
  if (!props.gon) {
    ra.push(['Gói cước', s.plan_name], ['Người đứng tên', s.registered_owner],
            ['Người quản lý', s.sim_manager], ['Mã SIM', s.id], ['Ghi chú', s.notes])
  }
  return ra
})
</script>
