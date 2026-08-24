<template>
  <div class="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <!-- Thanh điều hướng (sticky, luôn ở trên) -->
    <Navigation v-model:project="currentProject" />
    
    <!-- Đường phân cách nhẹ -->
    <div class="h-px bg-gray-200 dark:bg-gray-800 w-full"></div>

    <!-- Nội dung chính -->
    <main class="flex-1 overflow-hidden">
       <div class="h-full shadow-[0_0_10px_var(--el-border-color-light)]">

         <!-- === MỤC 255 — Trang Chủ. Đặt ĐẦU TIÊN vì đây là màn mặc định === -->
         <HomeView v-if="currentProject === 'Trang Chủ'" />

         <!-- MỤC 263 — Nhật ký -->
         <NhatKyView v-else-if="currentProject === 'Nhật ký'" />

         <!-- === Tiến Nga: có sidebar riêng (responsive bên trong) === -->
         <TienNgaDashboard v-else-if="currentProject === 'Tiến Nga'" />

         <!-- === Ggomoosin: có sidebar riêng (responsive bên trong) === -->
         <GgomoosinDashboard v-else-if="currentProject === 'Ggomoosin'" />

         <!-- === Rental: có sidebar riêng (responsive bên trong) === -->
         <RentalDashboard v-else-if="currentProject === 'Rental'" />

         <!-- === Credit: có sidebar riêng (responsive bên trong) === -->
         <CreditDashboard v-else-if="currentProject === 'Credit'" />

         <!-- === Thu hoạch: có sidebar riêng (responsive bên trong) === -->
         <HarvestDashboard v-else-if="currentProject === 'Thu hoạch'" />

         <!-- === Other: có sidebar riêng (responsive bên trong) === -->
         <OtherDashboard v-else-if="currentProject === 'Other'" />

         <!-- === Dự án Telegram === -->
         <TelegramProjects v-else-if="currentProject === 'Dự án Telegram'" />

         <!-- === Hụi === -->
         <RoscaDashboard v-else-if="currentProject === 'Hụi'" />

         <!-- === Phân quyền === -->
         <AuthorizationDashboard v-else-if="currentProject === 'Phân quyền'" />

         <!-- === Các project khác === -->
         <template v-else>
           <!-- Desktop (≥ 1024px): giữ el-splitter -->
           <el-splitter v-if="isDesktop">
             <el-splitter-panel size="15%">
                <div class="flex items-center justify-center h-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-lg border-r border-gray-100 dark:border-gray-700">
                  <span>{{ currentProject }}</span>
                </div>
             </el-splitter-panel>
             <el-splitter-panel :min="200">
                <div class="h-full bg-gray-50 dark:bg-gray-900 p-6 overflow-y-auto overflow-x-auto">
                  <!-- Chứa các view của project khác sau này -->
                </div>
             </el-splitter-panel>
           </el-splitter>

           <!-- Tablet & Mobile (< 1024px): không cần sidebar, chỉ hiện project name header -->
           <div v-else class="h-full flex flex-col">
             <div
               class="shrink-0 px-4 py-2.5 border-b flex items-center text-sm font-semibold"
               :class="isDark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700'"
             >
               <span>{{ currentProject }}</span>
             </div>
             <div class="flex-1 bg-gray-50 dark:bg-gray-900 p-6 overflow-y-auto overflow-x-auto">
               <!-- Chứa các view của project khác sau này -->
             </div>
           </div>
         </template>

       </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWindowSize, useDark } from '@vueuse/core'
import Navigation from '@/layouts/Navigation.vue'
import TienNgaDashboard from '@/components/TienNga/Index.vue'
import GgomoosinDashboard from '@/components/Ggomoosin/Index.vue'
import RentalDashboard from '@/components/Rental/Index.vue'
import CreditDashboard from '@/components/Credit/Index.vue'
import HarvestDashboard from '@/components/Harvest/Index.vue'
import OtherDashboard from '@/components/Other/Index.vue'
import TelegramProjects from '@/components/TienNga/TelegramProjects/Index.vue'
import RoscaDashboard from '@/components/Rosca/Index.vue'
import AuthorizationDashboard from '@/components/Authorization/Index.vue'
// MỤC 255 (23/08/2026) — Trang Chủ + bảng dự án dùng chung
import HomeView from '@/views/home/HomeView.vue'
// MỤC 263 (23/08/2026) — màn Nhật ký
import NhatKyView from '@/views/nhat_ky/NhatKyView.vue'
import { timTheoDuong, timTheoTen } from '@/constants/duAn'

const route = useRoute()
const router = useRouter()
const currentProject = ref('Trang Chủ')

/**
 * MỤC 255 — ĐƯỜNG DẪN -> TÊN DỰ ÁN, đọc từ bảng DU_AN.
 *
 * Trước đây đoạn này là 9 nhánh if/else gõ tay, và ngay bên dưới là 9
 * nhánh nữa cho chiều ngược lại. Thêm một dự án phải sửa cả hai, quên
 * một chỗ thì menu không sáng lên hoặc bấm không đi đâu — không có lỗi
 * nào báo, chỉ là nút bấm vào thấy trơ ra.
 */
watch(
  () => route.path,
  (path) => {
    const d = timTheoDuong(path)
    if (d) currentProject.value = d.ten
  },
  { immediate: true }
)

// MỤC 255 — TÊN DỰ ÁN -> ĐƯỜNG DẪN, cũng đọc từ bảng DU_AN.
// Điều kiện `!startsWith` giữ nguyên như cũ: tránh đá người dùng về màn
// mặc định khi họ đang đứng ở một màn con của chính dự án đó.
watch(currentProject, (newVal) => {
  const d = timTheoTen(newVal)
  if (d && !route.path.startsWith(d.duong)) {
    router.push(d.duongMacDinh)
  }
})

const { width: windowWidth } = useWindowSize()

const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: '',
})

const isDesktop = computed(() => windowWidth.value >= 1024)
</script>
