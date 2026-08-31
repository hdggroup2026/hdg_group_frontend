<template>
  <div ref="sidebarContainer" class="h-full bg-white dark:bg-gray-800 flex flex-col">
    <!-- Tiêu đề Rental -->
    <div class="h-14 flex shrink-0 items-center justify-center font-bold text-xl text-blue-600 dark:text-blue-400 border-b border-gray-100 dark:border-gray-700 transition-all overflow-hidden whitespace-nowrap">
      <span v-if="!isCollapsed">Rental</span>
      <span v-else>R</span>
    </div>
    
    <!-- Menu Sidebar -->
    <el-menu
      :collapse="isCollapsed"
      class="flex-1 overflow-y-auto border-r-0 custom-menu"
      :default-active="activeMenu"
      @select="handleSelect"
    >
      <el-menu-item index="1-1">
        <el-icon><OfficeBuilding /></el-icon>
        <template #title>Quản lý Bất động sản</template>
      </el-menu-item>

      <el-menu-item index="1-2">
        <el-icon><Files /></el-icon>
        <template #title>Quản lý hợp đồng</template>
      </el-menu-item>

      <el-menu-item index="1-3">
        <el-icon><Bell /></el-icon>
        <template #title>Quản lý Thông báo</template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useElementSize, useWindowSize } from '@vueuse/core'
import {
  OfficeBuilding,
  Files,
  Bell
} from '@element-plus/icons-vue'

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

// Nếu width của panel nhỏ hơn 10% width của window thì thu gọn
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
/* ══════════════════════════════════════════════════════════════════════
   MỤC 416 (30/08/2026) — CHỮ MENU KHÔNG BỊ CẮT NỮA

   s68 khoanh trên ảnh: ô đầu hiện "Quản lý Bất động s…", cụt chữ.

   🔴 Element Plus đặt sẵn `white-space: nowrap` + `text-overflow: ellipsis`
   cho `.el-menu-item`. Nhãn dài nhất ở đây là "Quản lý Bất động sản" —
   20 ký tự — không vừa bề rộng cột, nên bị cắt.

   ➜ Cho XUỐNG DÒNG thay vì cắt, và giảm đệm hai bên để có thêm chỗ.

   ⚠️ Phải mở `height: auto` cùng lúc. Element Plus khoá chiều cao
   `el-menu-item` ở 56px; chỉ đổi `white-space` mà không mở chiều cao thì
   dòng thứ hai bị cắt mất — cụt y như cũ, chỉ khác chỗ cụt.

   ⚠️ Chỉ áp khi menu ĐANG MỞ (`:not(.el-menu--collapse)`). Lúc thu gọn
   còn 64px thì nhãn vốn đã ẩn, cho xuống dòng ở đó là hỏng bố cục.
   ══════════════════════════════════════════════════════════════════════ */
.custom-menu:not(.el-menu--collapse) :deep(.el-menu-item) {
  white-space: normal;
  line-height: 1.35;
  height: auto;
  min-height: 44px;
  padding-left: 14px !important;
  padding-right: 10px !important;
}

/* Tùy chỉnh màu sắc nổi bật khi active hoặc hover */
.custom-menu:not(.el-menu--collapse) .el-menu-item,
.custom-menu:not(.el-menu--collapse) :deep(.el-sub-menu__title) {
  margin: 4px 8px;
  border-radius: 8px;
}
.custom-menu .el-menu-item.is-active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: bold;
}
.custom-menu .el-menu-item:hover,
.custom-menu :deep(.el-sub-menu__title:hover) {
  background-color: var(--el-color-primary-light-8) !important;
  color: var(--el-color-primary);
}

/* Cho Dark mode */
html.dark .custom-menu .el-menu-item.is-active {
  background-color: rgba(37, 99, 235, 0.2);
}
html.dark .custom-menu .el-menu-item:hover,
html.dark .custom-menu :deep(.el-sub-menu__title:hover) {
  background-color: rgba(37, 99, 235, 0.3) !important;
  color: var(--el-color-primary);
}

.custom-menu {
  overflow-x: hidden;
}
</style>
