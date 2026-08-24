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
           class="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20
                  dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200 mb-4">
        {{ loi }}
      </div>

      <!-- Bảng ĐĂNG NHẬP -->
      <el-table v-if="the === 'dangnhap' && !loi" :data="dong"
                v-loading="dangTai" size="small" stripe
                empty-text="Chưa có dòng nào">
        <el-table-column label="Lúc" width="150">
          <template #default="{ row }">{{ gio(row.luc) }}</template>
        </el-table-column>
        <el-table-column prop="ten_go_vao" label="Tên gõ vào" width="150" />
        <el-table-column label="Kết quả" width="180">
          <template #default="{ row }">
            <span :class="row.ket_qua === 'THANH_CONG'
                            ? 'text-green-600' : 'text-red-500'">
              {{ row.ket_qua === 'THANH_CONG' ? '✓' : '✕' }}
              {{ row.ket_qua_chu }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="IP kết nối" width="130">
          <template #default="{ row }">
            <code class="text-xs">{{ row.ip_ket_noi || '—' }}</code>
          </template>
        </el-table-column>
        <el-table-column label="IP khai báo" width="130">
          <template #default="{ row }">
            <code class="text-xs">{{ row.ip_khai_bao || '—' }}</code>
          </template>
        </el-table-column>
        <el-table-column label="Trình duyệt" min-width="200">
          <template #default="{ row }">
            <span class="text-xs text-gray-500" :title="row.trinh_duyet">
              {{ (row.trinh_duyet || '—').slice(0, 60) }}
            </span>
          </template>
        </el-table-column>
      </el-table>

      <!-- Bảng THAY ĐỔI -->
      <el-table v-if="the === 'thaydoi' && !loi" :data="dong"
                v-loading="dangTai" size="small" stripe
                empty-text="Chưa có dòng nào">
        <el-table-column label="Lúc" width="150">
          <template #default="{ row }">{{ gio(row.luc) }}</template>
        </el-table-column>
        <el-table-column prop="ten_dang_nhap" label="Ai làm" width="140" />
        <el-table-column prop="cach" label="Kiểu" width="80" />
        <el-table-column prop="duong" label="Chức năng" min-width="230" />
        <el-table-column label="Kết quả" width="90">
          <template #default="{ row }">
            <span :class="row.ma_tra_ve && row.ma_tra_ve < 400
                            ? 'text-green-600' : 'text-red-500'">
              {{ row.ma_tra_ve }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Dữ liệu gửi lên" min-width="240">
          <template #default="{ row }">
            <span class="text-xs text-gray-500" :title="row.du_lieu">
              {{ (row.du_lieu || '—').slice(0, 80) }}
            </span>
          </template>
        </el-table-column>
      </el-table>

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
