<!--
  MỤC 255 (23/08/2026) — TRANG CHỦ (KHUNG).

  s68 chốt: dựng khung trước, nội dung thiết kế sau.

  VÌ SAO CẦN TRANG CHỦ, KHÔNG CHỈ LÀ CHUYỆN GIAO DIỆN:

  Trước đây trang mặc định viết cứng là /tien-nga/overall. Người không có
  quyền Tiến Nga đăng nhập vào là rơi thẳng vào một màn hình họ không được
  xem — không có lỗi, chỉ là trống trơn, và họ tưởng hệ thống hỏng.

  Trang chủ là chỗ HẠ CÁNH AN TOÀN: ai đăng nhập được cũng vào được, và từ
  đây họ thấy đúng những dự án mình có quyền.

  ⚠️ Phần "Nội dung đang thiết kế" bên dưới là chỗ để trống CÓ CHỦ Ý.
  Đừng xoá khối đó khi thêm nội dung thật — thay nó, và giữ lại phần lưới
  dự án phía trên vì đó mới là thứ giúp người dùng đi tiếp.
-->
<template>
  <div class="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
    <div class="max-w-5xl mx-auto">

      <!-- Lời chào -->
      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          Trang Chủ
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ loiChao }}
        </p>
      </div>

      <!-- Lưới dự án: chỉ hiện dự án người này có quyền -->
      <div v-if="dangTai" class="text-sm text-gray-500 dark:text-gray-400">
        Đang tải…
      </div>

      <div v-else-if="loi"
           class="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20
                  dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200">
        {{ loi }}
      </div>

      <template v-else>
        <h2 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
          Dự án của bạn
        </h2>

        <div v-if="duAnCuaToi.length === 0"
             class="text-sm text-gray-500 dark:text-gray-400">
          Chưa có dự án nào được cấp cho tài khoản này.
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            v-for="d in duAnCuaToi"
            :key="d.ten"
            class="text-left rounded-xl border border-gray-200 dark:border-gray-700
                   bg-white dark:bg-gray-800 p-5 transition
                   hover:border-blue-400 hover:shadow-md"
            @click="moDuAn(d)"
          >
            <div class="font-medium text-gray-800 dark:text-gray-100">
              {{ d.ten }}
            </div>
            <div class="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {{ d.duongMacDinh }}
            </div>
          </button>
        </div>
      </template>

      <!-- Chỗ để trống CÓ CHỦ Ý — chờ s68 thiết kế nội dung -->
      <div class="mt-10 rounded-xl border border-dashed border-gray-300
                  dark:border-gray-700 p-8 text-center">
        <div class="text-sm font-medium text-gray-500 dark:text-gray-400">
          Nội dung trang chủ đang được thiết kế
        </div>
        <div class="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Số liệu tổng hợp, việc cần làm, nhắc hẹn… sẽ hiện ở đây.
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { layQuyen, danhSachDuocVao, type DuAn } from '@/constants/duAn'

const router = useRouter()

const dangTai = ref(true)
const loi = ref('')
const duAnCuaToi = ref<DuAn[]>([])

const loiChao = new Date().getHours() < 12
  ? 'Chào buổi sáng.'
  : new Date().getHours() < 18
    ? 'Chào buổi chiều.'
    : 'Chào buổi tối.'

const moDuAn = (d: DuAn) => {
  // Bỏ qua chính Trang Chủ — bấm vào nó là đứng yên tại chỗ.
  if (d.duong === '/trang-chu') return
  router.push(d.duongMacDinh)
}

onMounted(async () => {
  const kq = await layQuyen()
  if (kq.trangThai === 'loi') {
    // Đọc lỗi KHÔNG được hiểu là "không có dự án nào" — nói rõ là lỗi.
    loi.value = 'Không đọc được danh sách dự án: ' + kq.loi
  } else {
    duAnCuaToi.value = danhSachDuocVao(kq.quyen).filter(
      (d) => d.duong !== '/trang-chu'
    )
  }
  dangTai.value = false
})
</script>
