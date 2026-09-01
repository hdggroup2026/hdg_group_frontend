<template>
  <div ref="sidebarContainer" class="h-full bg-white dark:bg-gray-800 flex flex-col">
    <!-- Tiêu đề Dự án Khác -->
    <div class="h-14 flex shrink-0 items-center justify-center font-bold text-xl text-blue-600 dark:text-blue-400 border-b border-gray-100 dark:border-gray-700 transition-all overflow-hidden whitespace-nowrap">
      <span v-if="!isCollapsed">Other</span>
      <span v-else>O</span>
    </div>
    
    <!-- Menu Sidebar -->
    <el-menu
      :collapse="isCollapsed"
      class="flex-1 overflow-y-auto border-r-0 custom-menu"
      :default-active="activeMenu"
      @select="handleSelect"
    >
      <el-menu-item index="1-1">
        <el-icon><Cpu /></el-icon>
        <template #title>Quản lý Thiết bị</template>
      </el-menu-item>

      <el-menu-item index="1-2">
        <el-icon><Van /></el-icon>
        <template #title>Quản lý Phương tiện</template>
      </el-menu-item>

      <el-menu-item index="1-3">
        <el-icon><FolderOpened /></el-icon>
        <template #title>Quản lý Hình ảnh, Giấy tờ</template>
      </el-menu-item>

      <!-- MỤC 437 (31/08/2026) — s68: *"thêm mục Quản lý App"*. -->
      <el-menu-item index="1-4">
        <el-icon><Iphone /></el-icon>
        <template #title>Quản lý App</template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useElementSize, useWindowSize } from '@vueuse/core'
import { Cpu, Van, FolderOpened, Iphone } from '@element-plus/icons-vue'  // MỤC 437

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
   MỤC 434 (31/08/2026) — MỤC MENU HIỆN ĐỦ CHỮ

   s68 (ảnh 31/08, số 1): *"số 1 bị thiếu chữ, hiện ...., fix lại hiện đủ
   chữ."*

   🔴 `el-menu-item` của Element Plus mặc định `white-space: nowrap` +
   `text-overflow: ellipsis`, và chiều cao khoá cứng 56px. Nên
   "Quản lý Hình ảnh, Giấy tờ" bị cắt thành "Quản lý Hình ảnh, ...".
   Sidebar rộng 15% màn hình, không nới thêm được.

   Cách xử: cho xuống hai dòng và bỏ khoá chiều cao.

   ⚠️ CHỈ áp khi menu ĐANG MỞ (`:not(.el-menu--collapse)`). Lúc thu gọn
   còn 64px thì chữ phải ẩn hẳn — cho xuống dòng ở trạng thái đó là chữ
   tràn ra ngoài icon.

   ⚠️ Dùng `:deep()` vì `<style scoped>` không với tới được phần bên
   trong component của Element Plus.
   ══════════════════════════════════════════════════════════════════ */
.custom-menu:not(.el-menu--collapse) :deep(.el-menu-item) {
  height: auto;
  min-height: 48px;
  line-height: 1.35;
  padding-top: 10px;
  padding-bottom: 10px;
  white-space: normal;
}

.custom-menu:not(.el-menu--collapse) :deep(.el-menu-item span),
.custom-menu:not(.el-menu--collapse) :deep(.el-menu-item .el-menu-item__title) {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
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
  border-radius: 8px;
}
.custom-menu .el-menu-item:hover,
.custom-menu :deep(.el-sub-menu__title:hover) {
  background-color: var(--el-color-primary-light-8) !important;
  color: var(--el-color-primary);
  border-radius: 8px;
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
