<!--
  MỤC 699 / 700 — Ô "SĐT" CỦA MỘT MÁY (dùng chung 3 tab).
  SIM chính (chưa chọn thì SIM đầu, khung ghi "chưa chọn SIM chính"); có từ 2
  SIM thì thêm "+N", rê chuột ra danh sách kèm nút "Đặt làm SIM chính".
  Rê chuột HOẶC bấm (điện thoại không có chuột).
-->
<template>
  <span v-if="!sims.length" class="text-gray-400">—</span>
  <span v-else class="inline-flex items-center">
    <el-popover :trigger="['hover', 'click']" placement="bottom-start" :width="300" :show-after="150">
      <template #reference>
        <span class="font-mono text-xs font-semibold cursor-help underline decoration-dotted underline-offset-4">{{ sims[0].phone_number }}</span>
      </template>
      <ThongTinSim :sim="sims[0]" :chinh="!!sims[0].la_sim_chinh" />
    </el-popover>
    <el-popover v-if="sims.length > 1" :trigger="['hover', 'click']" placement="bottom-start" :width="340" :show-after="150">
      <template #reference>
        <span class="ml-1 px-1.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 cursor-help">+{{ sims.length - 1 }}</span>
      </template>
      <div class="text-xs">
        <div class="font-semibold mb-1.5">SIM trên {{ ma }} ({{ sims.length }})</div>
        <div v-for="(sim, i) in sims" :key="sim.id"
             class="py-1 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
          <ThongTinSim :sim="sim" :chinh="!!sim.la_sim_chinh" gon />
          <el-button v-if="!sim.la_sim_chinh" link type="primary" size="small"
                     @click.stop="emit('dat-chinh', sim)">{{ i === 0 ? 'Xác nhận là SIM chính' : 'Đặt làm SIM chính' }}</el-button>
        </div>
      </div>
    </el-popover>
  </span>
</template>

<script setup lang="ts">
import ThongTinSim from './ThongTinSim.vue'

defineProps<{ ma: string; sims: any[] }>()
const emit = defineEmits<{ (e: 'dat-chinh', sim: any): void }>()
</script>
