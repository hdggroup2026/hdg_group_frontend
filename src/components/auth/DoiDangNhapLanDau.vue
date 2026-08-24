<!--
  MỤC 259 (23/08/2026) — MÀN ĐỔI THÔNG TIN ĐĂNG NHẬP LẦN ĐẦU.

  Ai thấy màn này: tài khoản mới tạo, hoặc tài khoản vừa được cấp lại mật
  khẩu tạm từ nhóm Operation Center. Người đang dùng KHÔNG bị bắt đổi —
  s68 chốt như vậy.

  🔴 BA ĐIỀU CỐ Ý:

  1. KHÔNG CÓ NÚT BỎ QUA, KHÔNG CÓ NÚT ĐÓNG.
     Mật khẩu tạm vừa được đọc to trong nhóm chat Telegram, và nằm nguyên
     trong lịch sử nhóm. Cho bỏ qua là mật khẩu ai cũng đọc được trở thành
     mật khẩu thật. Chỉ có hai đường ra: đổi xong, hoặc đăng xuất.

  2. BÁO LỖI NGAY LÚC ĐANG GÕ, không đợi bấm nút.
     Luật mật khẩu có bốn điều kiện. Gõ xong bấm gửi mới biết thiếu một
     cái, sửa rồi lại thiếu cái khác — ba bốn lượt là bực. Hiện ngay từng
     điều kiện đã đạt chưa.

  3. ĐỔI XONG PHẢI ĐĂNG NHẬP LẠI.
     Thẻ phiên hiện tại mang tên đăng nhập CŨ nên hết dùng được. Nói rõ
     điều đó thay vì để người dùng bấm tiếp rồi bị văng ra.
-->
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
    <div class="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">

      <div class="text-center mb-6">
        <div class="text-4xl mb-3">🔑</div>
        <h1 class="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Đổi thông tin đăng nhập
        </h1>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          Đây là lần đăng nhập đầu tiên của tài khoản này.
          <br />
          Vui lòng đặt <b>tên đăng nhập</b> và <b>mật khẩu</b> của riêng bạn.
        </p>
      </div>

      <!-- Tên đăng nhập -->
      <div class="mb-1">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tên đăng nhập mới
        </label>
        <el-input
          v-model="loginName"
          placeholder="ví dụ: nguyenvanan"
          size="large"
          :disabled="dangGui"
        />
      </div>
      <p class="text-xs mb-1"
         :class="loiLogin ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'">
        {{ loiLogin || 'Ít nhất 8 chữ cái. Không số, không dấu, không dấu cách.' }}
      </p>
      <p v-if="!loiLogin && loginName"
         class="text-xs text-gray-400 dark:text-gray-500 mb-4">
        Sẽ lưu thành: <code>{{ chuanHoaLogin(loginName) }}</code>
        — chữ hoa hay thường đăng nhập đều được.
      </p>
      <div v-else class="mb-4"></div>

      <!-- Mật khẩu -->
      <div class="mb-1">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Mật khẩu mới
        </label>
        <el-input
          v-model="matKhau"
          type="password"
          show-password
          placeholder="Nhập mật khẩu mới"
          size="large"
          :disabled="dangGui"
        />
      </div>

      <!-- Thanh độ mạnh + từng điều kiện -->
      <div class="flex gap-1 mt-2 mb-2">
        <div v-for="i in 4" :key="i"
             class="h-1 flex-1 rounded-full transition-colors"
             :class="i <= manh ? mauManh : 'bg-gray-200 dark:bg-gray-700'"></div>
      </div>
      <ul class="text-xs space-y-0.5 mb-3">
        <li v-for="dk in dieuKien" :key="dk.chu"
            :class="dk.dat ? 'text-green-600 dark:text-green-400'
                           : 'text-gray-400 dark:text-gray-500'">
          {{ dk.dat ? '✓' : '○' }} {{ dk.chu }}
        </li>
      </ul>

      <!-- Nhập lại -->
      <div class="mb-1">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nhập lại mật khẩu
        </label>
        <el-input
          v-model="matKhau2"
          type="password"
          show-password
          placeholder="Gõ lại mật khẩu vừa nhập"
          size="large"
          :disabled="dangGui"
          @keyup.enter="gui"
        />
      </div>
      <p class="text-xs mb-5"
         :class="loiKhop ? 'text-red-500' : 'text-transparent'">
        {{ loiKhop || '.' }}
      </p>

      <el-button
        type="primary"
        size="large"
        class="w-full"
        :loading="dangGui"
        :disabled="!hopLe"
        @click="gui"
      >
        Đổi và đăng nhập lại
      </el-button>

      <!-- KHÔNG có nút Bỏ qua. Chỉ có đường ra là đăng xuất. -->
      <button
        class="w-full mt-3 text-xs text-gray-400 dark:text-gray-500 hover:underline"
        :disabled="dangGui"
        @click="dangXuat"
      >
        Đăng xuất
      </button>

      <p class="mt-5 text-xs text-center text-gray-400 dark:text-gray-500 leading-relaxed">
        Sau khi đổi, bạn sẽ được đưa về màn đăng nhập để vào lại bằng
        thông tin mới.
      </p>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authService } from '@/api/auth'
import { xoaBoNhoQuyen } from '@/constants/duAn'
import {
  chuanHoaLogin, kiemLoginName, kiemMatKhau, doManh,
  DAI_TOI_THIEU_MAT_KHAU,
} from '@/constants/luatDangNhap'

const router = useRouter()

const loginName = ref('')
const matKhau = ref('')
const matKhau2 = ref('')
const dangGui = ref(false)

// Chỉ báo lỗi khi người dùng ĐÃ GÕ gì đó. Hiện lỗi "chưa nhập" ngay lúc
// màn vừa mở là chê người ta trước khi họ kịp làm gì.
const loiLogin = computed(() =>
  loginName.value ? kiemLoginName(loginName.value) : null)

const loiKhop = computed(() => {
  if (!matKhau2.value) return null
  if (matKhau.value !== matKhau2.value) return 'Hai lần nhập không giống nhau.'
  return null
})

const manh = computed(() => doManh(matKhau.value))
const mauManh = computed(() =>
  manh.value <= 1 ? 'bg-red-400'
    : manh.value === 2 ? 'bg-orange-400'
      : manh.value === 3 ? 'bg-yellow-400'
        : 'bg-green-500')

const dieuKien = computed(() => {
  const mk = matKhau.value
  return [
    { chu: `Ít nhất ${DAI_TOI_THIEU_MAT_KHAU} ký tự`, dat: mk.length >= DAI_TOI_THIEU_MAT_KHAU },
    { chu: 'Có chữ HOA', dat: /[A-Z]/.test(mk) },
    { chu: 'Có số', dat: /[0-9]/.test(mk) },
    { chu: 'Có ký tự đặc biệt (@ # ! $ …)', dat: /[^A-Za-z0-9\s]/.test(mk) },
  ]
})

const hopLe = computed(() =>
  !kiemLoginName(loginName.value)
  && !kiemMatKhau(matKhau.value, chuanHoaLogin(loginName.value))
  && matKhau.value === matKhau2.value)

const gui = async () => {
  // Kiểm lại lần nữa ngay trước khi gửi. Nút có thể bị bật lên do một lỗi
  // hiển thị, và máy chủ vẫn kiểm — nhưng báo ở đây thì người dùng hiểu
  // nhanh hơn là chờ máy chủ trả lỗi.
  const l1 = kiemLoginName(loginName.value)
  if (l1) { ElMessage.warning(l1); return }
  const l2 = kiemMatKhau(matKhau.value, chuanHoaLogin(loginName.value))
  if (l2) { ElMessage.warning(l2); return }
  if (matKhau.value !== matKhau2.value) {
    ElMessage.warning('Hai lần nhập mật khẩu không giống nhau.')
    return
  }

  dangGui.value = true
  try {
    await authService.doiDangNhapLanDau(
      chuanHoaLogin(loginName.value), matKhau.value)
    xoaBoNhoQuyen()
    ElMessage.success('Đã đổi xong. Vui lòng đăng nhập lại bằng thông tin mới.')
    router.push('/login')
  } catch (e: any) {
    // Câu lỗi từ máy chủ là câu tiếng Việt cụ thể (trùng tên, mật khẩu
    // trùng cái cũ...). Hiện nguyên câu đó.
    ElMessage.error(e?.message || 'Không đổi được thông tin đăng nhập.')
  } finally {
    dangGui.value = false
  }
}

const dangXuat = () => {
  xoaBoNhoQuyen()
  authService.logout()
  router.push('/login')
}
</script>
