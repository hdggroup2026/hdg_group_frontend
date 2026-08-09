<template>
  <header
    :style="{ backgroundColor: isDark ? '#111827' : '#FFFFFF' }"
    class="sticky top-0 z-50 h-[60px] flex items-center justify-between px-6 shadow-sm transition-colors duration-300"
    :class="isDark ? 'shadow-gray-800' : 'shadow-gray-200'"
  >
    <!-- Góc trái: Logo -->
    <div class="flex items-center">
      <img src="/logo-hdg.png" alt="Logo" class="w-10 h-10 object-contain cursor-pointer" />
    </div>

    <!-- Góc phải -->
    <div class="flex items-center space-x-6">

      <!-- Desktop Menu (chỉ hiện trên lg trở lên) -->
      <nav class="hidden lg:flex items-center space-x-6">
        <a
          v-for="item in menuItems"
          :key="item"
          href="#"
          @click.prevent="selectedProject = item"
          :class="selectedProject === item
            ? 'text-blue-600 dark:text-blue-400 font-bold'
            : 'text-[#141414] dark:text-gray-200 font-medium'"
          class="text-sm hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
        >{{ item }}</a>
      </nav>

      <!-- Đường kẻ chia (chỉ desktop) -->
      <div class="h-6 w-px bg-gray-300 dark:bg-gray-700 hidden lg:block"></div>

      <!-- Hành động (LUÔN hiển thị trên mọi màn hình) -->
      <div class="flex items-center space-x-4">
        <!-- Nút chuyển đổi Darkmode / Lightmode -->
        <el-button @click="handleToggle" circle :icon="isDark ? Moon : Sunny" />

        <!-- Nút User Avatar (Dropdown) -->
        <el-dropdown trigger="click">
          <span class="flex items-center cursor-pointer outline-none">
            <el-avatar :size="32" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :icon="User">Hồ sơ người dùng</el-dropdown-item>
              <el-dropdown-item :icon="SwitchButton" divided @click="handleLogout">Đăng xuất</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- Hamburger Button (chỉ hiện dưới lg) -->
        <button
          @click="toggleMobileMenu"
          class="lg:hidden relative w-10 h-10 flex items-center justify-center rounded-lg border transition-all duration-200"
          :class="isDark
            ? 'border-gray-600 text-gray-200 hover:bg-gray-700/50 hover:border-gray-500'
            : 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'"
          aria-label="Toggle menu"
        >
          <span class="flex flex-col items-center justify-center w-5 h-5">
            <span
              class="block h-0.5 w-5 rounded-full transition-all duration-300 ease-in-out"
              :class="[
                isDark ? 'bg-gray-200' : 'bg-gray-700',
                isMobileMenuOpen ? 'rotate-45 translate-y-[3px]' : ''
              ]"
            ></span>
            <span
              class="block h-0.5 w-5 rounded-full mt-1 transition-all duration-300 ease-in-out"
              :class="[
                isDark ? 'bg-gray-200' : 'bg-gray-700',
                isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
              ]"
            ></span>
            <span
              class="block h-0.5 w-5 rounded-full mt-1 transition-all duration-300 ease-in-out"
              :class="[
                isDark ? 'bg-gray-200' : 'bg-gray-700',
                isMobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
              ]"
            ></span>
          </span>
        </button>
      </div>
    </div>
  </header>

  <!-- Mobile/Tablet Dropdown Menu -->
  <!-- Backdrop overlay -->
  <Transition name="fade">
    <div
      v-if="isMobileMenuOpen"
      class="lg:hidden fixed inset-0 top-[60px] z-40 bg-black/30 backdrop-blur-sm"
      @click="closeMobileMenu"
    ></div>
  </Transition>

  <!-- Dropdown panel -->
  <Transition name="slide-down">
    <div
      v-if="isMobileMenuOpen"
      class="lg:hidden fixed left-0 right-0 top-[60px] z-50 border-t"
      :class="isDark
        ? 'bg-gray-900 border-gray-700'
        : 'bg-white border-gray-200'"
      style="box-shadow: 0 8px 24px rgba(0,0,0,0.12);"
    >
      <!-- Menu items -->
      <nav class="flex flex-col">
        <a
          v-for="item in menuItems"
          :key="item"
          href="#"
          @click.prevent="selectProject(item)"
          class="px-6 py-3 text-sm transition-colors duration-200 border-b last:border-b-0"
          :class="[
            selectedProject === item
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
              :class="selectedProject === item
                ? 'bg-blue-500'
                : isDark ? 'bg-gray-600' : 'bg-gray-300'"
            ></span>
            <span>{{ item }}</span>
          </span>
        </a>
      </nav>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDark } from '@vueuse/core'
import { Moon, Sunny, User, SwitchButton } from '@element-plus/icons-vue'
import { authService } from '@/api/auth'

const router = useRouter()
const selectedProject = defineModel('project', { type: String, default: 'Tiến Nga' })

// Menu items list (single source of truth)
const menuItems = ref<string[]>(['Tiến Nga', 'Ggomoosin', 'Rental', 'Credit', 'Thu hoạch', 'Dự án Telegram', 'Hụi', 'Other'])

// Trạng thái Darkmode
const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: '',
})

// Toggle thủ công để đảm bảo hoạt động
const handleToggle = () => {
  isDark.value = !isDark.value
}

// Xử lý khi nhấn Đăng xuất
const handleLogout = () => {
  authService.logout()
  router.push('/login')
}

// --- Mobile menu state ---
const isMobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const selectProject = (project: string) => {
  selectedProject.value = project
  closeMobileMenu()
}

// Close dropdown on window resize to desktop
const handleResize = () => {
  if (window.innerWidth >= 1024) {
    closeMobileMenu()
  }
}

onMounted(async () => {
  window.addEventListener('resize', handleResize)
  const isAdmin = await authService.checkIsAdmin()
  if (isAdmin && !menuItems.value.includes('Phân quyền')) {
    menuItems.value.push('Phân quyền')
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>
