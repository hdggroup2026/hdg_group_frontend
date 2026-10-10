<!--
  MỤC 698 / 700 — Ô "TÊN THIẾT BỊ": rê chuột / bấm hiện danh sách app gắn vào máy.
  Máy chưa gắn app thì chữ trơn, không gạch chân (bài học 7.3).
-->
<template>
  <el-popover v-if="apps.length" :trigger="['hover', 'click']" placement="bottom-start" :width="320" :show-after="150">
    <template #reference>
      <span class="font-bold text-gray-850 dark:text-gray-100 cursor-help underline decoration-dotted underline-offset-4">{{ ten }}</span>
    </template>
    <div class="text-xs">
      <div class="font-semibold mb-1.5">App trên {{ ma }} ({{ apps.length }})</div>
      <div v-for="a in apps" :key="a.id"
           class="flex justify-between gap-3 py-0.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
        <span class="font-medium uppercase">{{ a.app_name }}</span>
        <span class="text-gray-500 break-all text-right min-w-0">{{ a.account_email || '—' }}</span>
      </div>
    </div>
  </el-popover>
  <span v-else class="font-bold text-gray-850 dark:text-gray-100">{{ ten }}</span>
</template>

<script setup lang="ts">
defineProps<{ ma: string; ten: string; apps: any[] }>()
</script>
