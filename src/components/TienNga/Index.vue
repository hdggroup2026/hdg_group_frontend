<template>
  <!-- ============ DESKTOP (≥ 1024px): el-splitter giữ nguyên ============ -->
  <el-splitter v-if="isDesktop" class="h-full">
      <el-splitter-panel size="15%">
        <Sidebar v-model:activeMenu="activeMenu" />
      </el-splitter-panel>
      <el-splitter-panel :min="200" v-loading="loading">
<div id="hdg-noi-dung-tienga" class="h-full"></div>
    </el-splitter-panel>
    </el-splitter>
 
    <!-- ============ TABLET & MOBILE (< 1024px) ============ -->
    <div v-else class="h-full flex" :class="isMobile ? 'flex-col' : 'flex-row'">
 
      <!-- MOBILE (< 768px): Toggle bar + dropdown panel giống Navigation -->
      <template v-if="isMobile">
        <!-- Toggle bar hiển thị menu hiện tại -->
        <div
          class="shrink-0 px-4 py-2.5 border-b flex items-center justify-between cursor-pointer select-none transition-colors duration-200"
          :class="isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
          @click="toggleMobileMenu"
        >
          <span
            class="flex items-center text-sm font-medium"
            :class="isDark ? 'text-gray-200' : 'text-gray-700'"
          >
            <el-icon class="mr-2" :size="16">
              <component :is="currentMenuItem.icon" />
            </el-icon>
            <span>{{ currentMenuItem.label }}</span>
          </span>
          <!-- Chevron xoay khi mở -->
          <span
            class="transition-transform duration-300"
            :class="[
              isMobileMenuOpen ? 'rotate-180' : '',
              isDark ? 'text-gray-400' : 'text-gray-500'
            ]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
            </svg>
          </span>
        </div>
 
        <!-- Dropdown panel + backdrop (relative to this container) -->
        <div class="relative flex-1 overflow-hidden">
          <!-- Backdrop overlay -->
          <Transition name="fade">
            <div
              v-if="isMobileMenuOpen"
              class="absolute inset-0 z-40 bg-black/30 backdrop-blur-sm"
              @click="closeMobileMenu"
            ></div>
          </Transition>
 
          <!-- Dropdown panel -->
          <Transition name="slide-down">
            <div
              v-if="isMobileMenuOpen"
              class="absolute left-0 right-0 top-0 z-50 border-b"
              :class="isDark
                ? 'bg-gray-900 border-gray-700'
                 : 'bg-white border-gray-200'"
              style="box-shadow: 0 8px 24px rgba(0,0,0,0.12);"
            >
              <nav class="flex flex-col">
                <a
                  v-for="item in sidebarMenuItems"
                  :key="item.index"
                  href="#"
                  @click.prevent="selectMenu(item.index)"
                  class="px-6 py-3 text-sm transition-colors duration-200 border-b last:border-b-0"
                  :class="[
                    activeMenu === item.index
                      ? 'text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-gray-700 dark:text-gray-200 font-medium',
                    isDark
                      ? 'border-gray-800 hover:bg-gray-800/60'
                      : 'border-gray-100 hover:bg-gray-50'
                  ]"
                >
                  <span class="flex items-center space-x-3">
                    <span
                      class="w-1.5 h-1.5 rounded-full transition-colors duration-200"
                      :class="activeMenu === item.index
                        ? 'bg-blue-500'
                        : isDark ? 'bg-gray-600' : 'bg-gray-300'"
                    ></span>
                    <el-icon :size="15">
                      <component :is="item.icon" />
                    </el-icon>
                    <span>{{ item.label }}</span>
                  </span>
                </a>
              </nav>
            </div>
          </Transition>
 
          <!-- Content area -->
          <div class="h-full overflow-hidden" v-loading="loading">
<div id="hdg-noi-dung-tienga" class="h-full"></div>
        </div>
        </div>
      </template>
 
      <!-- TABLET (768 – 1023px): Sidebar thu gọn chỉ hiện icon -->
      <template v-if="isTablet">
        <div
          class="shrink-0 w-[64px] border-r h-full"
          :class="isDark ? 'border-gray-700' : 'border-gray-200'"
        >
          <Sidebar v-model:activeMenu="activeMenu" :force-collapsed="true" />
        </div>
 
        <!-- Nội dung chính -->
        <div class="flex-1 overflow-hidden" v-loading="loading">
<div id="hdg-noi-dung-tienga" class="h-full"></div>
      </div>
      </template>
    </div>

  <!-- ══════════════════════════════════════════════════════════════════
       MỤC 450 (01/09/2026) — XOAY MÁY KHÔNG MẤT GÌ, GIỮ THANH KÉO GIÃN

       Rải cách làm của MỤC 429 (đã chạy thật trên mảng Credit) ra mảng
       này.

       🔴 VẤN ĐỀ. Ba nhánh bố cục ở trên (`el-splitter` cho máy tính,
       `isMobile`, `isTablet`) trước đây MỖI NHÁNH chứa một bản nội dung
       riêng. Xoay máy đổi bề rộng -> Vue gỡ nhánh cũ, dựng nhánh mới ->
       màn con là thực thể hoàn toàn mới -> mất sạch tab, bộ lọc, ô tìm
       kiếm, số trang.

       🔴 CÁCH LÀM. Nội dung nay khai MỘT LẦN, ở đây. Teleport chuyển
       nó vào ô trống của nhánh đang hiện. Đổi nhánh thì Teleport DỜI các
       nút DOM sang chỗ mới — KHÔNG gỡ và dựng lại. Thực thể component
       sống nguyên, mọi `ref` bên trong giữ nguyên giá trị.

       `el-splitter` giữ nguyên, thanh kéo giãn trên máy tính giữ nguyên.

       ⚠️ `defer` LÀ BẮT BUỘC. Không có nó, Teleport đi tìm `#hdg-noi-dung-tienga`
       ngay khi được xử lý, mà lúc đó ô trống có thể chưa gắn vào DOM.
       Không tìm thấy đích thì Teleport KHÔNG hiện gì: màn trắng. Có từ
       Vue 3.5; dự án dùng ^3.5.32.

       ⚠️ `id` mang tên mảng. Trùng id giữa hai mảng là nội dung mảng này
       nhảy vào khung mảng kia.
       ══════════════════════════════════════════════════════════════════ -->
  <Teleport defer to="#hdg-noi-dung-tienga">
    <component :is="activeView" v-if="activeView" />
    <div v-else class="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 text-gray-500 text-lg">
      Tính năng đang phát triển
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, provide, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWindowSize, useDark } from '@vueuse/core'
import { Odometer, Van, User, Avatar, Wallet, HomeFilled, Goods, UserFilled } from '@element-plus/icons-vue'
import Sidebar from './Sidebar.vue'
import Overall from './Overall.vue'
import RubberPurching from './RubberPurching/Index.vue'
import MaterialPurchasing from './MaterialPurchasing/Index.vue'
import Partner from './Partner/Index.vue'
import Finance from './Finance/Index.vue'
import Warehouse from './Warehouse/Index.vue'
import ProductWarehouse from './ProductWarehouse/Index.vue'
import HR from './HR/Index.vue'
import Shareholder from './Shareholder/Index.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)

// Cung cấp hàm setLoading cho các component con để có thể bật/tắt khi tải dữ liệu thực tế
provide('setLoading', (val: boolean) => {
  loading.value = val
})

// Tự động kích hoạt hiệu ứng loading chuyển tab trong 300ms
watch(
  () => route.params.subview,
  () => {
    loading.value = true
    setTimeout(() => {
      loading.value = false
    }, 300)
  }
)

const subviewMap: Record<string, string> = {
  'overall': '1',
  'hr': '1-1',
  'rubber-purchasing': '2-1',
  'material-purchasing': '2-2',
  'partner': '3',
  'shareholders': '4',
  'finance': '5',
  'warehouse': '6',
  'product-warehouse': '7',
}

const indexMap: Record<string, string> = {
  '1': 'overall',
  '1-1': 'hr',
  '2-1': 'rubber-purchasing',
  '2-2': 'material-purchasing',
  '3': 'partner',
  '4': 'shareholders',
  '5': 'finance',
  '6': 'warehouse',
  '7': 'product-warehouse',
}

const activeMenu = computed({
  get() {
    const subview = (route.params.subview as string) || 'overall'
    return subviewMap[subview] || '1'
  },
  set(val) {
    const subview = indexMap[val] || 'overall'
    router.push(`/tien-nga/${subview}`)
  }
})

const { width: windowWidth } = useWindowSize()

const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: '',
})

// Breakpoints chuẩn Tailwind
const isDesktop = computed(() => windowWidth.value >= 1024)
const isTablet = computed(() => windowWidth.value >= 768 && windowWidth.value < 1024)
const isMobile = computed(() => windowWidth.value < 768)

// Map menu index → component
const viewMap: Record<string, Component> = {
  '1': Overall,
  '1-1': HR,
  '2-1': RubberPurching,
  '2-2': MaterialPurchasing,
  '3': Partner,
  '4': Shareholder,
  '5': Finance,
  '6': Warehouse,
  '7': ProductWarehouse,
}

const activeView = computed(() => viewMap[activeMenu.value] || null)

// Menu items cho mobile dropdown (flatten từ Sidebar)
const sidebarMenuItems = [
  { index: '1', label: 'Tổng thể', icon: Odometer },
  { index: '1-1', label: 'Nhân sự', icon: UserFilled },
  { index: '2-1', label: 'Thu mua Mủ', icon: Van },
  { index: '2-2', label: 'Thu mua Nguyên liệu', icon: Van },
  { index: '3', label: 'Đối tác', icon: User },
  { index: '4', label: 'Cổ đông', icon: Avatar },
  { index: '5', label: 'Tài chính', icon: Wallet },
  { index: '6', label: 'Kho', icon: HomeFilled },
  { index: '7', label: 'Thành phẩm', icon: Goods },
]

const currentMenuItem = computed(() =>
  sidebarMenuItems.find(item => item.index === activeMenu.value) || { index: '1', label: 'Tổng thể', icon: Odometer }
)

// --- Mobile menu state ---
const isMobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const selectMenu = (index: string) => {
  activeMenu.value = index
  closeMobileMenu()
}

// Auto-close khi resize lên tablet/desktop
const handleResize = () => {
  if (windowWidth.value >= 768) {
    closeMobileMenu()
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>
