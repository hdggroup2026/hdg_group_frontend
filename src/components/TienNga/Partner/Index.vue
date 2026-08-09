<template>
  <div class="partner-tabs-container h-full p-4 bg-gray-50 dark:bg-gray-900">
    <el-tabs v-model="activeTab" type="border-card" class="demo-tabs h-full flex flex-col">
      <el-tab-pane name="list">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><User /></el-icon>
            <span>Đối tác</span>
          </span>
        </template>
        <PartnerList />
      </el-tab-pane>
      <el-tab-pane name="transaction">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><ShoppingCart /></el-icon>
            <span>Giao dịch</span>
          </span>
        </template>
        <Transaction />
      </el-tab-pane>
      <el-tab-pane name="lookup">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><DataAnalysis /></el-icon>
            <span>Truy xuất thông tin</span>
          </span>
        </template>
        <InformationLookup />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { User, ShoppingCart, DataAnalysis } from '@element-plus/icons-vue'
import PartnerList from './PartnerList.vue'
import Transaction from './Transaction.vue'
import InformationLookup from './InformationLookup.vue'

const activeTab = ref('list')
</script>

<style scoped>
.demo-tabs {
  border-radius: 8px;
  overflow: hidden;
}
.demo-tabs :deep(.el-tabs__content) {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.demo-tabs :deep(.el-tab-pane) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
.demo-tabs .custom-tabs-label .el-icon {
  vertical-align: middle;
}
.demo-tabs .custom-tabs-label span {
  vertical-align: middle;
  margin-left: 4px;
}

html.dark .demo-tabs {
  background-color: #1f2937;
  border-color: #374151;
}
html.dark .demo-tabs :deep(.el-tabs__header) {
  background-color: #111827;
  border-bottom-color: #374151;
}
html.dark .demo-tabs :deep(.el-tabs__item) {
  color: #9ca3af;
  border-color: transparent;
  transition: all 0.3s;
}
html.dark .demo-tabs :deep(.el-tabs__item:hover) {
  color: #d1d5db;
}
html.dark .demo-tabs :deep(.el-tabs__item.is-active) {
  background-color: #1f2937;
  border-right-color: #374151;
  border-left-color: #374151;
  border-bottom-color: #1f2937;
  color: #60a5fa;
}
</style>
