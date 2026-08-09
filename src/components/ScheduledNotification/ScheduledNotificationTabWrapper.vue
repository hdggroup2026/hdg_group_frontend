<template>
  <div class="notification-module-container h-full p-4 bg-gray-50 dark:bg-gray-900">
    <el-tabs v-model="activeTab" type="border-card" class="notification-tabs h-full flex flex-col">
      <!-- Tab 1: Cấu hình thông báo -->
      <el-tab-pane name="configs">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Bell /></el-icon>
            <span>Cấu hình thông báo</span>
          </span>
        </template>
        <ScheduledNotificationManagement :module-key="moduleKey" />
      </el-tab-pane>

      <!-- Tab 2: Nhật ký gửi -->
      <el-tab-pane name="logs">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Document /></el-icon>
            <span>Nhật ký gửi</span>
          </span>
        </template>
        <ScheduledNotificationLogs :module-key="moduleKey" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Bell, Document } from '@element-plus/icons-vue'
import ScheduledNotificationManagement from './ScheduledNotificationManagement.vue'
import ScheduledNotificationLogs from './ScheduledNotificationLogs.vue'

defineProps<{
  moduleKey: string
}>()

const activeTab = ref('configs')
</script>

<style scoped>
.notification-tabs {
  border-radius: 8px;
  overflow: hidden;
}
.notification-tabs :deep(.el-tabs__content) {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.notification-tabs :deep(.el-tab-pane) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
.notification-tabs .custom-tabs-label .el-icon {
  vertical-align: middle;
}
.notification-tabs .custom-tabs-label span {
  vertical-align: middle;
  margin-left: 4px;
}

html.dark .notification-tabs {
  background-color: #1f2937;
  border-color: #374151;
}
html.dark .notification-tabs :deep(.el-tabs__header) {
  background-color: #111827;
  border-bottom-color: #374151;
}
html.dark .notification-tabs :deep(.el-tabs__item) {
  color: #9ca3af;
  border-color: transparent;
  transition: all 0.3s;
}
html.dark .notification-tabs :deep(.el-tabs__item:hover) {
  color: #d1d5db;
}
html.dark .notification-tabs :deep(.el-tabs__item.is-active) {
  background-color: #1f2937;
  border-right-color: #374151;
  border-left-color: #374151;
  border-bottom-color: #1f2937;
  color: #60a5fa;
}
</style>
