<template>
  <div class="hr-module-container h-full p-4 bg-gray-50 dark:bg-gray-900">
    <el-tabs v-model="activeTab" type="border-card" class="hr-tabs h-full flex flex-col">
      <el-tab-pane name="employees">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><UserFilled /></el-icon>
            <span>Nhân viên</span>
          </span>
        </template>
        <EmployeeList />
      </el-tab-pane>
      <el-tab-pane name="attendance">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Calendar /></el-icon>
            <span>Chấm công</span>
          </span>
        </template>
        <AttendanceList />
      </el-tab-pane>
      <el-tab-pane name="salary">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Wallet /></el-icon>
            <span>Danh sách Lương</span>
          </span>
        </template>
        <SalaryList />
      </el-tab-pane>
      <el-tab-pane name="salary-export">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Document /></el-icon>
            <span>Xuất lương</span>
          </span>
        </template>
        <SalaryExport />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { refTabBenVung } from '@/composables/tabBenVung'  // MỤC 423
import { UserFilled, Calendar, Wallet, Document } from '@element-plus/icons-vue'
import EmployeeList from './EmployeeList.vue'
import AttendanceList from './AttendanceList.vue'
import SalaryList from './SalaryList.vue'
import SalaryExport from './SalaryExport.vue'

const activeTab = refTabBenVung('ggomoosin/hr', 'employees')  // MỤC 423
</script>

<style scoped>
.hr-tabs {
  border-radius: 8px;
  overflow: hidden;
}
.hr-tabs :deep(.el-tabs__content) {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.hr-tabs :deep(.el-tab-pane) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
.hr-tabs .custom-tabs-label .el-icon {
  vertical-align: middle;
}
.hr-tabs .custom-tabs-label span {
  vertical-align: middle;
  margin-left: 4px;
}

html.dark .hr-tabs {
  background-color: #1f2937;
  border-color: #374151;
}
html.dark .hr-tabs :deep(.el-tabs__header) {
  background-color: #111827;
  border-bottom-color: #374151;
}
html.dark .hr-tabs :deep(.el-tabs__item) {
  color: #9ca3af;
  border-color: transparent;
  transition: all 0.3s;
}
html.dark .hr-tabs :deep(.el-tabs__item:hover) {
  color: #d1d5db;
}
html.dark .hr-tabs :deep(.el-tabs__item.is-active) {
  background-color: #1f2937;
  border-right-color: #374151;
  border-left-color: #374151;
  border-bottom-color: #1f2937;
  color: #60a5fa;
}
</style>
