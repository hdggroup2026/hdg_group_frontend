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
          <!-- ══ MỤC 407 (29/08/2026) — ẢNH ĐẠI DIỆN THẬT ══
               🔴 Bản cũ nạp ảnh từ `cube.elemecdn.com` — máy chủ CDN của
               Element Plus bên Trung Quốc, và là ảnh MẪU trong tài liệu
               của họ. Nghĩa là:
                 · mạng công ty chặn hoặc CDN đó chết là ô này trống
                 · mỗi lần mở trang là báo cho một máy chủ ngoài biết có
                   người vừa vào hệ thống
               Không ai chọn thế cả — nó là ảnh mẫu chép từ tài liệu rồi
               quên đổi.

               Nay: ảnh của chính tài khoản (MỤC 406), chưa đặt thì hiện
               chữ cái đầu của tên. Không gọi ra ngoài internet nữa. -->
          <span class="flex items-center cursor-pointer outline-none">
            <el-avatar v-if="anhDaiDien" :size="32" :src="anhDaiDien" />
            <el-avatar v-else :size="32"
                       class="!bg-[#004274] !text-white font-semibold">
              {{ chuDauTen }}
            </el-avatar>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <!--
                MỤC 339 (27/08/2026) — GẮN HÀNH ĐỘNG CHO DÒNG NÀY.

                Trước đó dòng này KHÔNG có @click. Bấm vào không đi đâu,
                không báo lỗi — người dùng tưởng màn hồ sơ bị hỏng, trong
                khi thật ra nó chưa từng tồn tại.
              -->
              <el-dropdown-item :icon="User" @click="handleXemHoSo">Hồ sơ người dùng</el-dropdown-item>
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
// MỤC 255 (23/08/2026) — bảng dự án dùng chung, xem src/constants/duAn.ts
import { layQuyen, danhSachDuocVao, xoaBoNhoQuyen } from '@/constants/duAn'

// ══════════════════════════════════════════════════════════════════════
// MỤC 407 (29/08/2026) — ẢNH ĐẠI DIỆN TRÊN THANH ĐIỀU HƯỚNG
//
// ⚠️ Đọc MỘT LẦN lúc mở trang, không đọc lại mỗi khi chuyển màn. Ảnh
// base64 nặng vài chục KB; gọi lại mỗi lần đổi tab là tốn băng thông cho
// một thứ không đổi.
//
// 🔴 Hỏng thì im lặng và hiện chữ cái đầu. Đây là ô trang trí — không
// đáng để một lỗi mạng làm hiện dòng đỏ trên mọi màn.
const anhDaiDien = ref<string>('')
const chuDauTen = ref<string>('?')

onMounted(async () => {
  try {
    const { hoSoService } = await import('@/api/hoSo')
    const tt: any = await hoSoService.layHoSoCuaToi()
    const tk = tt?.tai_khoan || {}
    anhDaiDien.value = tk.anh_dai_dien || ''
    const ten = (tk.ho_ten || tk.username || '').trim()
    chuDauTen.value = ten ? ten.charAt(0).toUpperCase() : '?'
  } catch (e) {
    // im lặng có chủ ý — xem lời ghi trên
  }
})

const router = useRouter()
const selectedProject = defineModel('project', { type: String, default: 'Trang Chủ' })

/**
 * MỤC 255 — MENU DỰNG TỪ QUYỀN, KHÔNG VIẾT CỨNG NỮA.
 *
 * Trước đây dòng này là một danh sách 8 dự án gõ tay, ai đăng nhập cũng
 * thấy đủ 8 — kế toán chỉ làm Tiến Nga vẫn nhìn thấy Credit, Hụi, Other.
 *
 * ⚠️ Ẩn menu KHÔNG PHẢI là chặn. Chốt chặn thật nằm ở router
 * (src/router/index.ts). Ở đây chỉ để mắt đỡ rối. Hai chỗ đó đọc CÙNG
 * một bảng nên không bao giờ lệch nhau: menu hiện gì thì vào được đúng
 * cái đó, không hơn không kém.
 *
 * Bắt đầu bằng mảng RỖNG chứ không phải danh sách đầy đủ: nếu đọc quyền
 * hỏng thì thà không thấy gì còn hơn thấy dự án không có quyền rồi bấm
 * vào bị đá ra.
 */
const menuItems = ref<string[]>([])

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
// MỤC 339 (27/08/2026) — mở màn Hồ sơ người dùng.
const handleXemHoSo = () => {
  router.push('/ho-so')
}

const handleLogout = () => {
  // MỤC 255 — PHẢI xoá bộ nhớ quyền khi đăng xuất.
  // Không xoá thì người đăng nhập sau trên cùng máy sẽ thấy menu của
  // người trước, cho tới khi trình duyệt tự dọn. Kế toán và owner dùng
  // chung một máy là lộ ngay.
  xoaBoNhoQuyen()
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

  // MỤC 255 — dựng menu từ quyền thật.
  // Mục "Phân quyền" và "Dự án Telegram" nằm sẵn trong bảng DU_AN với cờ
  // chiAdmin, nên không phải push tay ở đây nữa.
  const kq = await layQuyen()
  if (kq.trangThai === 'xong') {
    menuItems.value = danhSachDuocVao(kq.quyen).map((d) => d.ten)
  }
  // Đọc lỗi thì để menu rỗng. Router sẽ đưa người dùng sang trang báo lỗi
  // có nút Thử lại — không cần Navigation tự xử lý.
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>
