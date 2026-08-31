<template>
  <div class="rubber-purchasing-container h-full p-4 bg-gray-50 dark:bg-gray-900">
    <el-tabs v-model="activeTab" type="border-card" class="demo-tabs h-full flex flex-col">
      <el-tab-pane name="farmer">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><User /></el-icon>
            <span>Hộ dân</span>
          </span>
        </template>
        <Households />
      </el-tab-pane>
      <el-tab-pane name="purchasing">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><ShoppingCart /></el-icon>
            <span>Thu mua</span>
          </span>
        </template>
        <Purchasing />
      </el-tab-pane>
      <el-tab-pane name="lossControl">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Warning /></el-icon>
            <span>Kiểm soát hao hụt</span>
          </span>
        </template>
        <LossControl />
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
      <el-tab-pane name="payment">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><CreditCard /></el-icon>
            <span>Thanh toán chi phí</span>
          </span>
        </template>
        <Payment />
      </el-tab-pane>
      <el-tab-pane name="cashAdvance" lazy>
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Wallet /></el-icon>
            <span>Ứng tiền</span>
          </span>
        </template>
        <CashAdvance />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { refTabBenVung } from '@/composables/tabBenVung'  // MỤC 423
import { User, ShoppingCart, DataAnalysis, CreditCard, Warning, Wallet } from '@element-plus/icons-vue'
import Households from './Households.vue'
import Purchasing from './Purchasing.vue'
import LossControl from './LossControl.vue'
import InformationLookup from './InformationLookup.vue'
import Payment from './Payment.vue'
import CashAdvance from './CashAdvance.vue'

const activeTab = refTabBenVung('tienga/rubber-purching', 'farmer')  // MỤC 423
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
  background-color: #1f2937; /* bg-gray-800 */
  border-color: #374151; /* border-gray-700 */
}
html.dark .demo-tabs :deep(.el-tabs__header) {
  background-color: #111827; /* bg-gray-900 */
  border-bottom-color: #374151;
}
html.dark .demo-tabs :deep(.el-tabs__item) {
  color: #9ca3af; /* text-gray-400 */
  border-color: transparent;
  transition: all 0.3s;
}
html.dark .demo-tabs :deep(.el-tabs__item:hover) {
  color: #d1d5db; /* text-gray-300 */
}
html.dark .demo-tabs :deep(.el-tabs__item.is-active) {
  background-color: #1f2937; /* bg-gray-800 */
  border-right-color: #374151;
  border-left-color: #374151;
  border-bottom-color: #1f2937;
  color: #60a5fa; /* text-blue-400 */
}
</style>
