<template>
  <div ref="sidebarContainer" class="h-full bg-white dark:bg-gray-800 flex flex-col">
    <!-- Tiêu đề Quản lý Nhóm Telegram -->
    <div class="h-14 flex shrink-0 items-center justify-center font-bold text-[14px] text-blue-600 dark:text-blue-400 border-b border-gray-100 dark:border-gray-700 transition-all overflow-hidden whitespace-nowrap px-4">
      <span v-if="!isCollapsed">Quản Lý Nhóm Telegram</span>
      <span v-else>TG</span>
    </div>
    
    <!-- Menu Sidebar -->
    <el-menu
      :collapse="isCollapsed"
      class="flex-1 overflow-y-auto border-r-0 custom-menu"
      :default-active="activeMenu"
      @select="handleSelect"
    >
      <el-menu-item index="project-management">
        <el-icon><Connection /></el-icon>
        <template #title>Quản lý Dự án</template>
      </el-menu-item>

      <el-menu-item index="groups">
        <el-icon><ChatLineRound /></el-icon>
        <template #title>Nhóm Telegram</template>
      </el-menu-item>

      <el-menu-item index="messages">
        <el-icon><ChatDotSquare /></el-icon>
        <template #title>Tin nhắn</template>
      </el-menu-item>

      <el-menu-item index="notifications">
        <el-icon><Bell /></el-icon>
        <template #title>Cấu hình thông báo</template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useElementSize, useWindowSize } from '@vueuse/core'
import { Connection, ChatLineRound, List, Bell, ChatDotSquare } from '@element-plus/icons-vue'

const props = defineProps<{
  activeMenu: string
  forceCollapsed?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:activeMenu', val: string): void
}>()

const sidebarContainer = ref(null)
const { width } = useElementSize(sidebarContainer)
const { width: windowWidth } = useWindowSize()

const isCollapsed = computed(() => {
  if (props.forceCollapsed) return true
  if (!windowWidth.value) return false
  return (width.value / windowWidth.value) < 0.1
})

const handleSelect = (index: string) => {
  emit('update:activeMenu', index)
}
</script>

<style scoped>
.custom-menu:not(.el-menu--collapse) .el-menu-item {
  margin: 4px 8px;
  border-radius: 8px;
}
.custom-menu .el-menu-item.is-active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: bold;
}
.custom-menu .el-menu-item:hover {
  background-color: var(--el-color-primary-light-8) !important;
  color: var(--el-color-primary);
}

html.dark .custom-menu .el-menu-item.is-active {
  background-color: rgba(37, 99, 235, 0.2);
}
html.dark .custom-menu .el-menu-item:hover {
  background-color: rgba(37, 99, 235, 0.3) !important;
}

.custom-menu {
  overflow-x: hidden;
}
</style>
