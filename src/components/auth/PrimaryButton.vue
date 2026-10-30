<template>
    <el-button
        :native-type="nativeType"
        :loading="loading"
        type="primary"
:class="kieuMoi ? 'dn-nut-moi' : 'w-full !rounded-full !bg-[#004274] !border-none !h-12 !text-lg !font-medium hover:!bg-[#00335a] transition-colors'"
        @click="$emit('click')"
    >
        <slot />
    </el-button>
</template>

<script setup>
import { inject } from 'vue'
// MỤC 724 — kiểu mới: nút xanh HDG đặc, bo 9px (biến Element Plus của .hdg-theme), không !important.
const kieuMoi = inject('kieuMoiDangNhap', false)
defineProps({
  nativeType: {
    type: String,
    default: 'button'
  },
  loading: {
    type: Boolean,
    default: false
  }
})
defineEmits(['click'])
</script>