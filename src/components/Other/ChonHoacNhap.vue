<!--
  MỤC 698 (09/10/2026) — Ô CHỌN SẴN, CHỌN "KHÁC" MỚI NHẬP TAY

  s68: *"hãng sản xuất làm drop list, khi nào chọn khác thì mới nhập. tương
  tự dung lượng bộ nhớ cũng vậy luôn."*

  Giá trị LƯU vẫn là một chuỗi như cũ (`brand`, `storage_capacity`) — không
  đổi cột, không đổi API. Giá trị cũ không nằm trong danh sách (vd "Oppo"
  gõ tay từ trước) ➜ tự mở sẵn ở "Khác" kèm chữ cũ, không mất dữ liệu.
-->
<template>
  <div class="flex gap-2 w-full">
    <el-select :model-value="giaTriChon" :placeholder="placeholder" class="flex-1 min-w-0"
               @update:model-value="chon">
      <el-option v-for="o in options" :key="o" :label="o" :value="o" />
      <el-option label="Khác (nhập tay)" :value="KHAC" />
    </el-select>
    <el-input v-if="giaTriChon === KHAC" :model-value="modelValue" class="flex-1 min-w-0"
              placeholder="Nhập…" @update:model-value="(v: string) => emit('update:modelValue', v)" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string | null | undefined
  options: string[]
  placeholder?: string
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const KHAC = '__khac__'
// Nhớ đã bấm "Khác": ô nhập đang trống thì giá trị rỗng, không suy ra được.
const dangKhac = ref(false)

const coTrongDs = (v: any) => props.options.includes(String(v || ''))

watch(() => props.modelValue, (v) => {
  if (v && coTrongDs(v)) dangKhac.value = false
  else if (v) dangKhac.value = true
}, { immediate: true })

const giaTriChon = computed(() => (dangKhac.value ? KHAC : (props.modelValue || '')))

const chon = (v: string) => {
  if (v === KHAC) {
    dangKhac.value = true
    emit('update:modelValue', '')
  } else {
    dangKhac.value = false
    emit('update:modelValue', v)
  }
}
</script>
