<template>
  <div class="harvest-module-container h-full p-4 bg-gray-50 dark:bg-gray-900">
    <el-tabs v-slot="{ activeTab }" v-model="activeTab" type="border-card" class="harvest-tabs h-full flex flex-col">
      <!-- Tab 1: Đất trồng trọt -->
      <el-tab-pane name="lands">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Location /></el-icon>
            <span>Đất trồng trọt</span>
          </span>
        </template>
        <LandList :crop-type="cropType" />
      </el-tab-pane>

      <!-- Tab 2: Hộ dân -->
      <el-tab-pane name="households">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><User /></el-icon>
            <span>Hộ dân</span>
          </span>
        </template>
        <HouseholdList :crop-type="cropType" />
      </el-tab-pane>

      <!-- Tab 3: Thu hoạch hằng ngày -->
      <el-tab-pane name="harvests">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Calendar /></el-icon>
            <span>Thu hoạch hằng ngày</span>
          </span>
        </template>
        <DailyHarvestList :crop-type="cropType" />
      </el-tab-pane>

      <!-- Tab 4: Vật tư -->
      <el-tab-pane name="supplies">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Box /></el-icon>
            <span>Vật tư</span>
          </span>
        </template>
        <SuppliesList :crop-type="cropType" />
      </el-tab-pane>

      <!-- Tab 5: Truy xuất thông tin -->
      <el-tab-pane name="lookup">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Search /></el-icon>
            <span>Truy xuất thông tin</span>
          </span>
        </template>
        <InfoRetrieval :crop-type="cropType" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { User, Location, Calendar, Search, Box } from '@element-plus/icons-vue'
import LandList from './LandList.vue'
import HouseholdList from './HouseholdList.vue'
import DailyHarvestList from './DailyHarvestList.vue'
import InfoRetrieval from './InfoRetrieval.vue'
import SuppliesList from './SuppliesList.vue'

defineProps<{
  cropType: 'cao_su' | 'sau_rieng'
}>()

const activeTab = ref('lands')
</script>

<style scoped>
.harvest-tabs {
  border-radius: 8px;
  overflow: hidden;
}
.harvest-tabs :deep(.el-tabs__content) {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.harvest-tabs :deep(.el-tab-pane) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
.harvest-tabs .custom-tabs-label .el-icon {
  vertical-align: middle;
}
.harvest-tabs .custom-tabs-label span {
  vertical-align: middle;
  margin-left: 4px;
}

html.dark .harvest-tabs {
  background-color: #1f2937;
  border-color: #374151;
}
html.dark .harvest-tabs :deep(.el-tabs__header) {
  background-color: #111827;
  border-bottom-color: #374151;
}
html.dark .harvest-tabs :deep(.el-tabs__item) {
  color: #9ca3af;
  border-color: transparent;
  transition: all 0.3s;
}
html.dark .harvest-tabs :deep(.el-tabs__item:hover) {
  color: #d1d5db;
}
html.dark .harvest-tabs :deep(.el-tabs__item.is-active) {
  background-color: #1f2937;
  border-right-color: #374151;
  border-left-color: #374151;
  border-bottom-color: #1f2937;
  color: #60a5fa;
}
</style>
