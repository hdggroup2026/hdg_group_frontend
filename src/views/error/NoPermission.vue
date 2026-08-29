<!--
  MỤC 255 (23/08/2026) — TRANG "CHƯA ĐƯỢC CẤP QUYỀN".

  🔴 TRANG NÀY PHÂN BIỆT HAI CHUYỆN KHÁC HẲN NHAU:

    Chưa được cấp quyền  = đã hỏi máy chủ, máy chủ trả về danh sách RỖNG.
                           Chắc chắn: tài khoản này chưa được cấp gì.

    Không đọc được quyền = mạng hỏng, máy chủ chết, chưa biết mã nhân viên.
                           KHÔNG BIẾT GÌ CẢ.

  Gộp hai cái làm một là sai nguy hiểm: mạng chập một cái thì cả công ty
  thấy "Chưa được cấp quyền", tưởng bị thu hồi quyền, và gọi điện loạn lên.

  Nên trang này có hai bộ mặt, và trường hợp lỗi có nút Thử lại.
-->
<template>
  <div class="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
    <div class="max-w-md w-full text-center">

      <!-- Trường hợp 1: thật sự chưa có quyền nào -->
      <template v-if="!laLoi">
        <div class="text-5xl mb-4">🔒</div>
        <h1 class="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Chưa được cấp quyền
        </h1>
        <p class="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          Tài khoản của bạn đăng nhập được nhưng <b>chưa được cấp quyền vào dự
          án nào</b>.
          <br />
          Vui lòng liên hệ quản trị để được cấp quyền.
        </p>
        <p v-if="tenDangNhap" class="mt-4 text-xs text-gray-400 dark:text-gray-500">
          Tài khoản: <code>{{ tenDangNhap }}</code>
          <br />
          <span class="text-gray-400">Báo mã này cho quản trị để tra nhanh hơn.</span>
        </p>
      </template>

      <!-- Trường hợp 2: không đọc được quyền — KHÁC hẳn trường hợp 1 -->
      <template v-else>
        <div class="text-5xl mb-4">⚠️</div>
        <h1 class="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Không đọc được quyền
        </h1>
        <p class="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          Chưa xác định được bạn có quyền gì — <b>không phải là bạn bị mất
          quyền</b>. Thường do mạng chập hoặc máy chủ đang bận.
        </p>
        <p class="mt-2 text-xs text-gray-400 dark:text-gray-500">
          {{ loi }}
        </p>
      </template>

      <div class="mt-8 flex items-center justify-center gap-3">
        <button
          v-if="laLoi"
          class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
          @click="thuLai"
        >
          Thử lại
        </button>
        <button
          class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          @click="dangXuat"
        >
          Đăng xuất
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '@/api/auth'
import { xoaBoNhoQuyen } from '@/constants/duAn'

const route = useRoute()
const router = useRouter()

// Router truyền ?loi=... khi rơi vào đây vì ĐỌC LỖI, không phải vì rỗng.
const loi = ref(String(route.query.loi || ''))
const laLoi = ref(!!route.query.loi)
const tenDangNhap = ref('')

const thuLai = () => {
  // Xoá bộ nhớ tạm rồi mới thử — không thì nó đọc lại đúng cái cũ.
  xoaBoNhoQuyen()
  router.replace('/trang-chu')
}

const dangXuat = () => {
  xoaBoNhoQuyen()
  authService.logout()
  router.push('/login')
}

onMounted(() => {
  // Lấy tên đăng nhập từ thẻ phiên để người dùng báo cho quản trị.
  // Hỏng thì thôi, không phải thứ quan trọng.
  try {
    const token = authService.getToken()
    if (token) {
      const phan = token.split('.')[1]
      if (phan) {
        const json = decodeURIComponent(
          atob(phan.replace(/-/g, '+').replace(/_/g, '/'))
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )
        tenDangNhap.value = JSON.parse(json)?.sub || ''
      }
    }
  } catch {
    // Không đọc được tên thì bỏ qua.
  }
})
</script>
