<template>
  <div class="rental-module-container h-full p-4 bg-gray-50 dark:bg-gray-900">
    <el-tabs v-model="activeTab" type="border-card" class="rental-tabs h-full flex flex-col">
      <!-- Tab 1: Khách hàng -->
      <el-tab-pane name="customers">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><User /></el-icon>
            <span>Khách hàng</span>
          </span>
        </template>
        <CustomerList />
      </el-tab-pane>

      <!-- Tab 2: Hợp đồng -->
      <el-tab-pane name="contracts">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Files /></el-icon>
            <span>Hợp đồng</span>
          </span>
        </template>
        <ContractList />
      </el-tab-pane>

      <!-- Tab 3: Thanh toán -->
      <el-tab-pane name="payments">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><CreditCard /></el-icon>
            <span>Thanh toán</span>
          </span>
        </template>
        <PaymentList />
      </el-tab-pane>

      <!-- Tab 4: Truy xuất thông tin -->
      <el-tab-pane name="query">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Search /></el-icon>
            <span>Truy xuất thông tin</span>
          </span>
        </template>
        <ContractTableQuery />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { refTabBenVung } from '@/composables/tabBenVung'  // MỤC 423
import { User, Files, CreditCard, Search } from '@element-plus/icons-vue'
import CustomerList from './CustomerList.vue'
import ContractList from './ContractList.vue'
import PaymentList from './PaymentList.vue'
import ContractTableQuery from './ContractTableQuery.vue'

const activeTab = refTabBenVung('rental/contract', 'customers')  // MỤC 423
</script>

<style scoped>
.rental-tabs {
  border-radius: 8px;
  overflow: hidden;
}
.rental-tabs :deep(.el-tabs__content) {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.rental-tabs :deep(.el-tab-pane) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
.rental-tabs .custom-tabs-label .el-icon {
  vertical-align: middle;
}
.rental-tabs .custom-tabs-label span {
  vertical-align: middle;
  margin-left: 4px;
}

html.dark .rental-tabs {
  background-color: #1f2937;
  border-color: #374151;
}
html.dark .rental-tabs :deep(.el-tabs__header) {
  background-color: #111827;
  border-bottom-color: #374151;
}
html.dark .rental-tabs :deep(.el-tabs__item) {
  color: #9ca3af;
  border-color: transparent;
  transition: all 0.3s;
}
html.dark .rental-tabs :deep(.el-tabs__item:hover) {
  color: #d1d5db;
}
html.dark .rental-tabs :deep(.el-tabs__item.is-active) {
  background-color: #1f2937;
  border-right-color: #374151;
  border-left-color: #374151;
  border-bottom-color: #1f2937;
  color: #60a5fa;
}
</style>
