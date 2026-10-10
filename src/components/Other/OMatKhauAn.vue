<!--
  MỤC 699 / 700 — Ô MẬT KHẨU ẨN ●●●, bấm mắt để hiện (dùng chung).
  Mỗi ô tự nhớ trạng thái của nó: bấm mắt ô này không lộ ô khác.
-->
<template>
  <div v-if="giaTri" class="flex items-center gap-1 text-gray-400 text-xs">
    <span class="font-mono">{{ hien ? giaTri : '••••••••' }}</span>
    <el-button link type="info" size="small" class="!p-0 h-auto" @click.stop="hien = !hien">
      <el-icon :size="10"><component :is="hien ? Hide : View" /></el-icon>
    </el-button>
  </div>
  <span v-else class="text-gray-400">—</span>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { View, Hide } from '@element-plus/icons-vue'

defineProps<{ giaTri: string | null | undefined }>()
const hien = ref(false)
</script>
