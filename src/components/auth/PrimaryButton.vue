<template>
    <el-button
        :native-type="nativeType"
        :loading="loading"
        type="primary"
        class="w-full !rounded-full !bg-[#004274] !border-none !h-12 !text-lg !font-medium hover:!bg-[#00335a] transition-colors"
        @click="$emit('click')"
    >
        <slot />
    </el-button>
</template>

<script setup>
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