<!--
  MỤC 718 (29/10/2026) — G1. Hộp hỏi lại trước việc không lùi được (xoá, gửi, chốt tiền).
  `danger`: nút xác nhận màu đỏ. Chữ nút phải nói rõ việc ("Xoá hợp đồng"), không ghi "OK".
-->
<template>
  <el-dialog
    :model-value="modelValue" :title="title" width="min(440px, 92vw)"
    class="hdg-theme hdg-confirm" append-to-body align-center
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <div class="hdg-confirm__msg"><slot>{{ message }}</slot></div>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">{{ cancelText }}</el-button>
      <el-button :type="danger ? 'danger' : 'primary'" :loading="loading" @click="emit('confirm')">{{ confirmText }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: boolean
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  loading?: boolean
}>(), { message: '', confirmText: 'Xác nhận', cancelText: 'Huỷ', danger: false, loading: false })
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; confirm: [] }>()
</script>

<style>
.hdg-confirm { border-radius: var(--hdg-radius-card); }
.hdg-confirm .el-dialog__title { font-family: var(--hdg-font-serif); font-size: var(--hdg-fs-block-title); font-weight: 700; }
.hdg-confirm__msg { color: var(--hdg-text); line-height: 1.55; }
</style>
