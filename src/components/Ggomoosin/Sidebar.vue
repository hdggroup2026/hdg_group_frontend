<template>
  <div ref="sidebarContainer" class="h-full bg-white dark:bg-gray-800 flex flex-col">
    <!-- ══════════════════════════════════════════════════════════════
         MỤC 669 (06/10/2026) — LOGO DỰ ÁN THAY CHO CHỮ "Ggomoosin"

         s68 06/10: *"Trên website bấm vào dự án ggomoosin bạn nghiên cứu
         đưa logo dự án vào."* Đã gửi ba ảnh mẫu để chọn; s68 chốt bản
         **logo đầy đủ** (có dòng "Giày tập đi cho trẻ đến từ Hàn Quốc"),
         nên thanh tiêu đề cao thêm từ h-14 (56px) lên h-[76px] để chứa
         trọn dòng chữ mà không bóp méo logo.

         ⚠️ THU GỌN THÌ VỀ LẠI CHỮ "G". Logo chữ dài 872×222; nhét vào
         thanh rộng ~48px khi thu gọn thì nó co lại thành một vệt xanh
         không đọc được. Chữ "G" vẫn là cách duy nhất còn nhận ra được ở
         bề rộng đó.

         ⚠️ `object-contain` — KHÔNG để ảnh tự kéo giãn. Logo méo còn tệ
         hơn không có logo, và không ai báo lỗi vì trang vẫn chạy.

         ⚠️ `alt` ghi rõ tên dự án: lúc mạng chậm hoặc ảnh hỏng thì vẫn
         đọc được đang ở dự án nào.
         ══════════════════════════════════════════════════════════════ -->
    <div
      class="flex shrink-0 items-center justify-center border-b border-gray-100 dark:border-gray-700 transition-all overflow-hidden whitespace-nowrap"
      :class="isCollapsed ? 'h-14 font-bold text-xl text-blue-600 dark:text-blue-400' : 'h-[76px] px-3'"
    >
      <img
        v-if="!isCollapsed"
        :src="logoGgomoosin"
        alt="Ggomoosin"
        class="max-h-[72%] max-w-[86%] object-contain"
      />
      <span v-else>G</span>
    </div>
    
    <!-- Menu Sidebar -->
    <el-menu
      :collapse="isCollapsed"
      class="flex-1 overflow-y-auto border-r-0 custom-menu"
      :default-active="activeMenu"
      @select="handleSelect"
    >
      <el-menu-item index="1-1">
        <el-icon><UserFilled /></el-icon>
        <template #title>Nhân sự</template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useElementSize, useWindowSize } from '@vueuse/core'
import {
  UserFilled
} from '@element-plus/icons-vue'

// MỤC 669 — `import` để Vite băm tên tệp và nhét vào gói build.
// ⚠️ ĐỪNG viết `src="/src/assets/..."`: đường đó chỉ chạy lúc dev, lên
// bản build là ảnh 404 mà trang vẫn hiện bình thường — hỏng im lặng.
import logoGgomoosin from '@/assets/logo_ggomoosin.png'

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
