<template>
  <div class="harvest-module-container h-full p-4 bg-gray-50 dark:bg-gray-900">
    <el-tabs v-model="activeTab" type="border-card" class="harvest-tabs h-full flex flex-col">
      
      <!-- Tab 1: Điện thoại -->
      <el-tab-pane name="phone">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Iphone /></el-icon>
            <span>Điện thoại</span>
          </span>
        </template>
        <PhoneTab />
      </el-tab-pane>

      <!-- Tab 2: Laptop -->
      <el-tab-pane name="laptop">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Cpu /></el-icon>
            <span>Laptop</span>
          </span>
        </template>
        <LaptopTab />
      </el-tab-pane>

      <!-- Tab 3: Máy tính bảng -->
      <el-tab-pane name="tablet">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Notebook /></el-icon>
            <span>Máy tính bảng</span>
          </span>
        </template>
        <TabletTab />
      </el-tab-pane>

      <!-- Tab 4: Màn hình -->
      <el-tab-pane name="monitor">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Monitor /></el-icon>
            <span>Màn hình</span>
          </span>
        </template>
        <ScreenTab />
      </el-tab-pane>

      <!-- Tab 5: Camera -->
      <el-tab-pane name="camera">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><VideoCamera /></el-icon>
            <span>Camera</span>
          </span>
        </template>
        <CameraTab />
      </el-tab-pane>

      <!-- Tab 6: Thiết bị khác -->
      <el-tab-pane name="other">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><More /></el-icon>
            <span>Thiết bị khác</span>
          </span>
        </template>
        <OtherDeviceTab />
      </el-tab-pane>

      <!-- ══════════════════════════════════════════════════════════════
           MỤC 441 · 442 (01/09/2026) — HAI TAB MỚI

           Đặt TRƯỚC tab Bàn giao, có chủ ý: Bàn giao là việc cuối cùng
           trong luồng (có máy -> có phụ kiện -> có SIM -> giao cho ai).
           Xếp theo luồng việc thì người dùng không phải nhảy tới nhảy lui.
           ══════════════════════════════════════════════════════════════ -->
      <el-tab-pane name="accessory">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Headset /></el-icon>
            <span>Phụ kiện</span>
          </span>
        </template>
        <AccessoryTab />
      </el-tab-pane>

      <el-tab-pane name="sim">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Postcard /></el-icon>
            <span>SIM</span>
          </span>
        </template>
        <SimTab />
      </el-tab-pane>

      <!-- Tab cuối: Bàn giao -->
      <el-tab-pane name="assignment">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Switch /></el-icon>
            <span>Bàn giao</span>
          </span>
        </template>
        <AssignmentTab />
      </el-tab-pane>

    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { refTabBenVung } from '@/composables/tabBenVung'  // MỤC 423
import { Cpu, Iphone, Notebook, Monitor, VideoCamera, More, Switch, Headset, Postcard } from '@element-plus/icons-vue'   // MỤC 441, 442
import PhoneTab from './PhoneTab.vue'
import LaptopTab from './LaptopTab.vue'
import TabletTab from './TabletTab.vue'
import ScreenTab from './ScreenTab.vue'
import CameraTab from './CameraTab.vue'
import OtherDeviceTab from './OtherDeviceTab.vue'
import AssignmentTab from './AssignmentTab.vue'
import AccessoryTab from './AccessoryTab.vue'   // MỤC 441
import SimTab from './SimTab.vue'               // MỤC 442

const activeTab = refTabBenVung('other/device', 'phone')  // MỤC 423
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
