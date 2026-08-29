<!--
  MỤC 263 (23/08/2026) — MÀN NHẬT KÝ.

  Gom HAI bảng vào một màn, hai thẻ:
    · Đăng nhập      — ai vào lúc nào, từ đâu, thành công hay thất bại
    · Thay đổi dữ liệu — ai sửa gì lúc nào

  🔴 CHỈ ADMIN THẤY. Khai bằng cờ chiAdmin trong src/constants/duAn.ts,
  và máy chủ CŨNG kiểm lại — hai lớp, vì ẩn menu không phải là chặn.

  ⚠️ HAI CỘT IP HIỆN CẢ HAI, KHÔNG GỘP.
  Máy chủ nằm sau ngrok nên IP kết nối có thể là IP của ngrok. Cột "khai
  báo" đúng hơn nhưng người dùng sửa được. Hiện cả hai để người đọc TỰ
  THẤY chúng có khác nhau không — giống hệt nhau ở mọi dòng nghĩa là proxy
  không gửi IP thật, và biết điều đó còn hơn tin nhầm một cột.
-->
<template>
  <div class="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
    <div class="max-w-6xl mx-auto">

      <h1 class="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">
        Nhật ký
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">
        Giữ {{ SO_NGAY_GIU }} ngày gần nhất. Cũ hơn sẽ được dọn tự động
        lúc 3 giờ sáng.
      </p>

      <el-tabs v-model="the" @tab-change="tai">
        <el-tab-pane label="Đăng nhập" name="dangnhap" />
        <el-tab-pane label="Thay đổi dữ liệu" name="thaydoi" />
      </el-tabs>

      <!-- Bộ lọc -->
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <el-select v-model="soDong" size="small" style="width: 140px"
                   @change="tai">
          <el-option :value="100" label="100 dòng" />
          <el-option :value="200" label="200 dòng" />
          <el-option :value="500" label="500 dòng" />
          <el-option :value="1000" label="1000 dòng" />
        </el-select>

        <el-checkbox v-if="the === 'dangnhap'" v-model="chiThatBai"
                     @change="tai">
          Chỉ xem lượt thất bại
        </el-checkbox>

        <el-input v-if="the === 'thaydoi'" v-model="cuaAi" size="small"
                  style="width: 200px" clearable
                  placeholder="Lọc theo tên đăng nhập"
                  @change="tai" />

        <el-button size="small" :loading="dangTai" @click="tai">
          Tải lại
        </el-button>
      </div>

      <!-- Lỗi -->
      <div v-if="loi"
           class="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200 mb-4">
        {{ loi }}
      </div>

      <!-- ═══════════════════════════════════════════════════════════
           MỤC 352 (27/08/2026) — THAY `el-table` BẰNG BẢNG HTML THƯỜNG.

           s68 chụp iPad dựng đứng ngày 27/08: các cột "Ai làm", "Kiểu",
           "Chức năng" TRỐNG TRƠN ở mấy dòng đầu, xoay ngang lại bình
           thường.

           🔴 NGUYÊN NHÂN: `el-table` dựng bảng bằng JavaScript và tự đo
           bề rộng lúc gắn vào trang. Tổng bề rộng cột cố định ở đây là
           150+140+80+230+90 = 690 điểm ảnh, cộng hai cột `min-width` nữa.
           iPad dựng đứng rộng ~820, trừ lề còn ~760 — Element Plus co cột
           lại rồi KHÔNG vẽ lại đúng sau khi xoay màn hình. Ô trống ra đời
           từ đó, và không có lỗi nào báo.

           ➜ Bảng HTML thường bọc trong khung cuộn ngang: trình duyệt tự
           dựng, không cần JavaScript đo đạc, xoay màn hình bao nhiêu lần
           cũng đúng. Đây đúng cách bảng cân đối ở MỤC 341 đang dùng, và
           bảng đó chạy đúng trên cả ba thiết bị.

           ⚠️ CUỘN NGANG LÀ CÓ CHỦ Ý. Bảng này có 6 cột, cắt bớt cột nào
           cũng mất thông tin cần để truy. `min-w-[900px]` giữ cột thẳng
           hàng; người xem vuốt ngang khi màn hẹp.
           ═══════════════════════════════════════════════════════════ -->

      <!-- Bảng ĐĂNG NHẬP -->
      <div v-if="the === 'dangnhap' && !loi" v-loading="dangTai"
           class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[900px]">
            <thead>
              <tr class="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th class="text-left font-medium px-3 py-2 whitespace-nowrap">Lúc</th>
                <th class="text-left font-medium px-3 py-2 whitespace-nowrap">Tên gõ vào</th>
                <th class="text-left font-medium px-3 py-2 whitespace-nowrap">Kết quả</th>
                <th class="text-left font-medium px-3 py-2 whitespace-nowrap">IP kết nối</th>
                <th class="text-left font-medium px-3 py-2 whitespace-nowrap">IP khai báo</th>
                <th class="text-left font-medium px-3 py-2">Trình duyệt</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="dong.length === 0">
                <td colspan="6" class="px-3 py-6 text-center text-gray-400">
                  Chưa có dòng nào
                </td>
              </tr>
              <tr v-for="(row, i) in dong" :key="i"
                  class="border-b border-gray-100 dark:border-gray-700/50">
                <td class="px-3 py-2 whitespace-nowrap tabular-nums">{{ gio(row.luc) }}</td>
                <td class="px-3 py-2 break-all">{{ row.ten_go_vao || '—' }}</td>
                <td class="px-3 py-2 whitespace-nowrap"
                    :class="row.ket_qua === 'THANH_CONG'
                              ? 'text-green-600' : 'text-red-500'">
                  {{ row.ket_qua === 'THANH_CONG' ? '✓' : '✕' }}
                  {{ row.ket_qua_chu }}
                </td>
                <td class="px-3 py-2 whitespace-nowrap tabular-nums text-xs">
                  {{ row.ip_ket_noi || '—' }}
                </td>
                <td class="px-3 py-2 whitespace-nowrap tabular-nums text-xs">
                  {{ row.ip_khai_bao || '—' }}
                </td>
                <td class="px-3 py-2 text-xs text-gray-500" :title="row.trinh_duyet">
                  {{ (row.trinh_duyet || '—').slice(0, 60) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Bảng THAY ĐỔI -->
      <div v-if="the === 'thaydoi' && !loi" v-loading="dangTai"
           class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[900px]">
            <thead>
              <tr class="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th class="text-left font-medium px-3 py-2 whitespace-nowrap">Lúc</th>
                <th class="text-left font-medium px-3 py-2 whitespace-nowrap">Ai làm</th>
                <th class="text-left font-medium px-3 py-2 whitespace-nowrap">Kiểu</th>
                <th class="text-left font-medium px-3 py-2">Chức năng</th>
                <th class="text-left font-medium px-3 py-2 whitespace-nowrap">Kết quả</th>
                <th class="text-left font-medium px-3 py-2">Dữ liệu gửi lên</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="dong.length === 0">
                <td colspan="6" class="px-3 py-6 text-center text-gray-400">
                  Chưa có dòng nào
                </td>
              </tr>
              <tr v-for="(row, i) in dong" :key="i"
                  class="border-b border-gray-100 dark:border-gray-700/50">
                <td class="px-3 py-2 whitespace-nowrap tabular-nums">{{ gio(row.luc) }}</td>
                <td class="px-3 py-2 break-all">{{ row.ten_dang_nhap || '—' }}</td>
                <td class="px-3 py-2 whitespace-nowrap">{{ row.cach || '—' }}</td>
                <td class="px-3 py-2 break-all text-xs">{{ row.duong || '—' }}</td>
                <td class="px-3 py-2 whitespace-nowrap tabular-nums"
                    :class="row.ma_tra_ve && row.ma_tra_ve < 400
                              ? 'text-green-600' : 'text-red-500'">
                  {{ row.ma_tra_ve }}
                </td>
                <td class="px-3 py-2 text-xs text-gray-500" :title="row.du_lieu">
                  {{ (row.du_lieu || '—').slice(0, 80) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p v-if="the === 'thaydoi'"
         class="mt-4 text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
        ⚠️ Nhật ký này ghi <b>dữ liệu gửi lên</b>, không ghi giá trị cũ.
        Nó trả lời "ai sửa, lúc nào, sửa thành gì" — không trả lời
        "trước khi sửa là bao nhiêu".
        <br />
        Mật khẩu và mã PUK đã được che bằng dấu sao trước khi ghi.
      </p>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authService } from '@/api/auth'
import { getApiUrl } from '@/api/apiConfig'

const SO_NGAY_GIU = 180

const the = ref('dangnhap')
const soDong = ref(200)
const chiThatBai = ref(false)
const cuaAi = ref('')
const dong = ref<any[]>([])
const dangTai = ref(false)
const loi = ref('')

const gio = (s: string) => {
  if (!s) return '—'
  const d = new Date(s)
  const hai = (n: number) => String(n).padStart(2, '0')
  return `${hai(d.getHours())}:${hai(d.getMinutes())} ${hai(d.getDate())}/${hai(d.getMonth() + 1)}`
}

const tai = async () => {
  dangTai.value = true
  loi.value = ''
  try {
    const baseUrl = await getApiUrl()
    const token = authService.getToken()
    const tokenType = localStorage.getItem('token_type') || 'Bearer'

    const duong = the.value === 'dangnhap'
      ? `${baseUrl}/auth/nhat-ky-dang-nhap?so_dong=${soDong.value}`
        + `&chi_that_bai=${chiThatBai.value}`
      : `${baseUrl}/auth/nhat-ky-thay-doi?so_dong=${soDong.value}`
        + (cuaAi.value ? `&cua_ai=${encodeURIComponent(cuaAi.value)}` : '')

    const r = await fetch(duong, {
      headers: {
        'Authorization': `${tokenType} ${token}`,
        'ngrok-skip-browser-warning': 'true',
      },
    })

    if (r.status === 403) {
      // Nói RÕ đây là chuyện quyền, không phải hệ thống hỏng.
      loi.value = 'Chỉ quản trị viên mới xem được nhật ký.'
      dong.value = []
      return
    }
    if (!r.ok) {
      // ⚠️ Đọc lỗi KHÁC "không có dòng nào". Bảng rỗng vì máy chủ hỏng
      // mà hiện "Chưa có dòng nào" thì người xem tưởng hệ thống chưa ghi
      // gì — và yên tâm nhầm.
      loi.value = `Không đọc được nhật ký (mã ${r.status}). `
        + 'Đây là lỗi kết nối, KHÔNG phải là nhật ký trống.'
      dong.value = []
      return
    }
    dong.value = await r.json()
  } catch (e: any) {
    loi.value = 'Không đọc được nhật ký: ' + (e?.message || 'lỗi kết nối')
      + '. Đây là lỗi, KHÔNG phải là nhật ký trống.'
    dong.value = []
  } finally {
    dangTai.value = false
  }
}

onMounted(tai)
</script>
