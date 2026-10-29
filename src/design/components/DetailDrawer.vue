<!--
  MỤC 718 (29/10/2026) — G1. Ngăn chi tiết bên phải (bấm một dòng bảng thì mở).
  Máy tính: rộng 420px · máy tính bảng: 70% · điện thoại: toàn màn hình (PROMPT_01 mục 4.8).
-->
<template>
  <el-drawer
    :model-value="modelValue" :size="size" :title="title" direction="rtl"
    class="hdg-theme hdg-drawer" append-to-body
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <div v-if="subtitle" class="hdg-drawer__sub">{{ subtitle }}</div>
    <slot />
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWindowSize } from '@vueuse/core'

defineProps<{ modelValue: boolean; title: string; subtitle?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { width } = useWindowSize()
const size = computed(() => (width.value < 768 ? '100%' : width.value < 1280 ? '70%' : 'var(--hdg-drawer-w)'))
</script>

<style>
/* Không scoped: el-drawer gắn ra ngoài <body> (append-to-body), lớp scoped không với tới. */
.hdg-drawer .el-drawer__header { margin-bottom: 0; padding: 20px 22px 8px; font-family: var(--hdg-font-serif); font-size: var(--hdg-fs-block-title); font-weight: 700; color: var(--hdg-text); }
.hdg-drawer .el-drawer__body { padding: 8px 22px 22px; }
.hdg-drawer__sub { color: var(--hdg-text-muted); font-size: var(--hdg-fs-caption); margin-bottom: 14px; }
</style>
