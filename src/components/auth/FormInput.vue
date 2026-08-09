<template>
  <div class="w-full mb-4">
    <el-input
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :type="type"
      :placeholder="placeholder"
      class="custom-login-input"
    />
  </div>
</template>

<script setup>
defineProps({
  modelValue: String,
  placeholder: String,
  type: { type: String, default: 'text' }
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
:deep(.custom-login-input .el-input__wrapper) {
  border-radius: 9999px !important; /* Bo tròn hoàn toàn */
  padding: 8px 20px !important;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important; /* Đổ bóng nhẹ */
  border: none !important;
}
</style>