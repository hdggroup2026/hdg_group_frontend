<!--
  MỤC 339 (27/08/2026) — MÀN HỒ SƠ NGƯỜI DÙNG.

  s68 báo 27/08: bấm "Hồ sơ người dùng" trong menu ảnh đại diện không
  hiện gì cả. Soi ra: dòng đó ở Navigation.vue chỉ là CHỮ, không có hành
  động, và cũng chưa từng có màn nào phía sau.

  🔴 MÀN NÀY CHỈ HIỆN HỒ SƠ CỦA CHÍNH NGƯỜI ĐANG ĐĂNG NHẬP.

  Không có ô nhập mã nhân viên, không có nút xem người khác. Muốn xem tài
  khoản người khác thì vào màn Phân quyền — nơi đã có kiểm quyền admin.

  ⚠️ BỐ CỤC PHẢI XEM ĐƯỢC TRÊN ĐIỆN THOẠI (rộng ~390 điểm ảnh).
  s68 duyệt việc trên iPhone. Xem docs/quy_uoc_bo_cuc_the.md.
-->
<template>
  <div class="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
    <div class="max-w-3xl mx-auto">

      <h1 class="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-1">
        Hồ sơ người dùng
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Thông tin tài khoản của bạn.
      </p>

      <!-- Đang tải -->
      <div v-if="dangTai" class="text-sm text-gray-500 dark:text-gray-400">
        Đang tải…
      </div>

      <!--
        Lỗi. KHÔNG hiện màn trống trơn: người dùng vừa mới bấm vào một
        dòng không làm gì suốt mấy tháng, hiện tiếp màn trống là họ tưởng
        vẫn hỏng như cũ.
      -->
      <div
        v-else-if="loi"
        class="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200"
      >
        <div class="font-medium mb-1">Không đọc được hồ sơ</div>
        <div>{{ loi }}</div>
      </div>

      <template v-else-if="hoSo">

        <!-- ═══ KHỐI 1 — TÀI KHOẢN ═══ -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 mb-4">
          <h2 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
            Tài khoản
          </h2>

          <!-- ══════════════════════════════════════════════════════════
               MỤC 407 (29/08/2026) — ẢNH ĐẠI DIỆN, ĐỔI ĐƯỢC

               🔴 THU NHỎ Ở TRÌNH DUYỆT TRƯỚC KHI GỬI.
               Ảnh điện thoại chụp thường 3–5 MB; mã hoá base64 còn phình
               thêm 33%. Gửi thẳng là máy chủ từ chối (giới hạn 200 KB) và
               người dùng chỉ nhận một câu "ảnh quá nặng" mà không biết
               phải làm gì. Thu về 256×256 rồi nén JPEG thì ảnh nào cũng
               lọt, không cần bắt ai đi cắt ảnh.

               ⚠️ 256px là đủ: ô lớn nhất hiện ảnh này rộng 80px, màn hình
               2× thì cần 160px. Để 512 chỉ làm nặng gấp bốn mà mắt không
               thấy khác.
               ══════════════════════════════════════════════════════ -->
          <div class="flex items-center gap-4 pb-4 mb-4 border-b border-gray-100 dark:border-gray-700">
            <div class="shrink-0">
              <img v-if="anhHienTai" :src="anhHienTai" alt="Ảnh đại diện"
                   class="w-20 h-20 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
              <div v-else
                   class="w-20 h-20 rounded-full bg-[#004274] text-white flex items-center justify-center text-2xl font-semibold">
                {{ chuDauTen }}
              </div>
            </div>

            <div class="min-w-0">
              <!-- ⚠️ Ô chọn file bị giấu, bấm qua nhãn. Ô `input file`
                   nguyên bản mỗi trình duyệt vẽ một kiểu và không tô màu
                   được. -->
              <input ref="oChonFile" type="file"
                     accept="image/png,image/jpeg,image/webp"
                     class="hidden" @change="chonAnh" />

              <div class="flex flex-wrap gap-2">
                <el-button size="small" type="primary" :loading="dangLuuAnh"
                           @click="oChonFile?.click()">
                  {{ anhHienTai ? 'Đổi ảnh' : 'Chọn ảnh' }}
                </el-button>
                <!-- 🔴 Phải có đường quay lại. Đặt được mà không gỡ được
                     thì người lỡ tải nhầm ảnh phải đi tìm ảnh khác đè
                     lên — không phải cách sửa. -->
                <el-button v-if="anhHienTai" size="small" :loading="dangLuuAnh"
                           @click="xoaAnh">
                  Gỡ ảnh
                </el-button>
              </div>

              <p class="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                PNG, JPG hoặc WEBP. Ảnh được thu nhỏ tự động.
              </p>

              <!-- Hỏng thì nói ra NGAY CẠNH nút, không nuốt. -->
              <p v-if="loiAnh"
                 class="mt-1.5 text-xs text-red-600 dark:text-red-400">
                {{ loiAnh }}
              </p>
              <p v-else-if="daLuuAnh"
                 class="mt-1.5 text-xs text-green-600 dark:text-green-400">
                Đã lưu ảnh.
              </p>
            </div>
          </div>
          <dl class="space-y-2.5 text-sm">
            <div class="flex justify-between gap-3">
              <dt class="text-gray-500 dark:text-gray-400 shrink-0">Tên đăng nhập</dt>
              <dd class="font-medium text-gray-800 dark:text-gray-100 text-right break-all">
                {{ hoSo.tai_khoan.username || chuaCo }}
              </dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-gray-500 dark:text-gray-400 shrink-0">Họ tên</dt>
              <dd class="font-medium text-gray-800 dark:text-gray-100 text-right">
                {{ hoSo.tai_khoan.ho_ten || chuaCo }}
              </dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-gray-500 dark:text-gray-400 shrink-0">Mã nhân viên</dt>
              <dd class="font-medium text-gray-800 dark:text-gray-100 text-right break-all">
                {{ hoSo.tai_khoan.ma_nhan_vien || chuaCo }}
              </dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-gray-500 dark:text-gray-400 shrink-0">Vai trò</dt>
              <dd class="font-medium text-gray-800 dark:text-gray-100 text-right">
                {{ hoSo.tai_khoan.vai_tro || chuaCo }}
                <span
                  v-if="hoSo.tai_khoan.la_admin"
                  class="ml-1.5 text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                >quản trị</span>
              </dd>
            </div>
          </dl>
        </div>

        <!-- ═══ KHỐI 2 — QUYỀN ═══ -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 mb-4">
          <h2 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
            Quyền được cấp
            <span class="ml-1 text-xs font-normal text-gray-400">
              ({{ hoSo.quyen.length }})
            </span>
          </h2>
          <div v-if="hoSo.quyen.length === 0"
               class="text-sm text-gray-500 dark:text-gray-400">
            Tài khoản chưa được cấp quyền nào.
          </div>
          <div v-else class="flex flex-wrap gap-1.5">
            <span
              v-for="q in hoSo.quyen"
              :key="q"
              class="text-xs px-2 py-1 rounded border bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-200 dark:border-gray-600"
            >{{ q }}</span>
          </div>
        </div>

        <!-- ═══ KHỐI 3 — TRẠNG THÁI ═══ -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 mb-4">
          <h2 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
            Trạng thái
          </h2>
          <dl class="space-y-2.5 text-sm">
            <div class="flex justify-between gap-3">
              <dt class="text-gray-500 dark:text-gray-400">Tài khoản</dt>
              <dd class="font-medium text-right"
                  :class="hoSo.trang_thai.dang_bat
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'">
                {{ hoSo.trang_thai.dang_bat ? 'Đang hoạt động' : 'Đã bị tắt' }}
              </dd>
            </div>
            <!--
              ⚠️ "bị khoá" và "bị tắt" là HAI chuyện khác nhau, không gộp:
              tắt = nghỉ việc; khoá = gõ sai mật khẩu nhiều lần, mở lại được.
              Xem lời ghi ở models/employee.py, cột `bi_khoa`.
            -->
            <div v-if="hoSo.trang_thai.bi_khoa" class="flex justify-between gap-3">
              <dt class="text-gray-500 dark:text-gray-400">Tạm khoá</dt>
              <dd class="font-medium text-right text-red-600 dark:text-red-400">
                Từ {{ ngayGio(hoSo.trang_thai.khoa_luc) }}
              </dd>
            </div>
            <div v-if="hoSo.trang_thai.phai_doi_dang_nhap"
                 class="flex justify-between gap-3">
              <dt class="text-gray-500 dark:text-gray-400">Yêu cầu</dt>
              <dd class="font-medium text-right text-amber-600 dark:text-amber-400">
                Phải đổi tên đăng nhập và mật khẩu
              </dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-gray-500 dark:text-gray-400">Số lần gõ sai liên tiếp</dt>
              <dd class="font-medium text-gray-800 dark:text-gray-100 text-right">
                {{ hoSo.trang_thai.so_lan_sai_lien_tiep }} /
                {{ hoSo.trang_thai.so_lan_sai_toi_da }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- ═══ KHỐI 4 — MỐC THỜI GIAN ═══ -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5">
          <h2 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
            Mốc thời gian
          </h2>
          <dl class="space-y-2.5 text-sm">
            <div class="flex justify-between gap-3">
              <dt class="text-gray-500 dark:text-gray-400 shrink-0">Ngày tạo tài khoản</dt>
              <dd class="font-medium text-gray-800 dark:text-gray-100 text-right">
                {{ ngayGio(hoSo.moc_thoi_gian.ngay_tao) }}
              </dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-gray-500 dark:text-gray-400 shrink-0">Sửa lần cuối</dt>
              <dd class="font-medium text-gray-800 dark:text-gray-100 text-right">
                {{ ngayGio(hoSo.moc_thoi_gian.sua_lan_cuoi) }}
              </dd>
            </div>

            <!--
              🔴 GHI RÕ LÀ "LẦN TRƯỚC", KHÔNG PHẢI "LẦN CUỐI".

              Người đang đọc màn này thì vừa đăng nhập xong. Ghi "lần
              đăng nhập cuối" rồi hiện đúng giờ hiện tại là con số vô
              nghĩa. Máy chủ cố ý bỏ qua phiên đang mở và trả về lần
              trước đó — đây mới là con số dùng được để tự kiểm tra xem
              có ai khác vào tài khoản của mình không.
            -->
            <div class="pt-2 mt-1 border-t border-gray-100 dark:border-gray-700">
              <dt class="text-gray-500 dark:text-gray-400 mb-1.5">
                Lần đăng nhập trước
              </dt>
              <dd v-if="!hoSo.moc_thoi_gian.dang_nhap_lan_truoc"
                  class="text-gray-500 dark:text-gray-400">
                Đây là lần đăng nhập đầu tiên.
              </dd>
              <dd v-else class="space-y-1">
                <div class="font-medium text-gray-800 dark:text-gray-100">
                  {{ ngayGio(hoSo.moc_thoi_gian.dang_nhap_lan_truoc.luc) }}
                </div>
                <div class="text-xs text-gray-400 dark:text-gray-500 break-all">
                  IP {{ hoSo.moc_thoi_gian.dang_nhap_lan_truoc.ip || chuaCo }}
                </div>
                <div class="text-xs text-gray-400 dark:text-gray-500 break-all">
                  {{ hoSo.moc_thoi_gian.dang_nhap_lan_truoc.trinh_duyet || chuaCo }}
                </div>
              </dd>
            </div>

            <!--
              Chỉ hiện khi CÓ lần gõ sai. Hiện "0 lần" ở mọi màn hình là
              nhiễu, và nhìn quen mắt thì lúc nó lên 12 cũng không ai để ý.
            -->
            <div
              v-if="hoSo.moc_thoi_gian.so_lan_go_sai_tu_lan_dang_nhap_truoc > 0"
              class="pt-2 mt-1 border-t border-gray-100 dark:border-gray-700"
            >
              <div class="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-amber-800 dark:text-amber-200 text-sm">
                Có <b>{{ hoSo.moc_thoi_gian.so_lan_go_sai_tu_lan_dang_nhap_truoc }}</b>
                lần gõ sai mật khẩu vào tài khoản này kể từ lần đăng nhập trước.
                Nếu không phải bạn, hãy đổi mật khẩu.
              </div>
            </div>
          </dl>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
// MỤC 407 — thêm `computed` cho `chuDauTen`. Quên tên ở đây là màn
// trắng, `vue-tsc` báo ngay lúc dựng.
import { computed, ref, onMounted } from 'vue'
import { hoSoService, type HoSoCuaToi } from '@/api/hoSo'

const chuaCo = '—'

const dangTai = ref(true)
const loi = ref('')
const hoSo = ref<HoSoCuaToi | null>(null)

// ══════════════════════════════════════════════════════════════════════
// MỤC 407 (29/08/2026) — ẢNH ĐẠI DIỆN
// ══════════════════════════════════════════════════════════════════════
const oChonFile = ref<HTMLInputElement | null>(null)
const anhHienTai = ref<string>('')
const dangLuuAnh = ref(false)
const loiAnh = ref('')
const daLuuAnh = ref(false)

const chuDauTen = computed(() => {
  const tk: any = hoSo.value?.tai_khoan || {}
  const ten = String(tk.ho_ten || tk.username || '').trim()
  return ten ? ten.charAt(0).toUpperCase() : '?'
})

const CANH_ANH = 256          // xem lời ghi ở phần template

/**
 * Thu ảnh về ô vuông 256×256, cắt giữa, xuất JPEG chất lượng 0,82.
 *
 * ⚠️ CẮT GIỮA chứ không bóp méo. Ảnh chân dung 3:4 mà kéo cho vừa ô
 * vuông thì mặt bị dẹt — người dùng tưởng web hỏng.
 *
 * 🔴 `URL.revokeObjectURL` ở CẢ HAI nhánh. Quên ở nhánh lỗi thì mỗi lần
 * chọn nhầm file là rò một vùng nhớ, và không có gì báo.
 */
const thuNhoAnh = (file: File): Promise<string> =>
  new Promise((giaiQuyet, tuChoi) => {
    const duongDan = URL.createObjectURL(file)
    const anh = new Image()
    anh.onload = () => {
      URL.revokeObjectURL(duongDan)
      try {
        const canh = Math.min(anh.width, anh.height)
        const x = (anh.width - canh) / 2
        const y = (anh.height - canh) / 2
        const khung = document.createElement('canvas')
        khung.width = CANH_ANH
        khung.height = CANH_ANH
        const ctx = khung.getContext('2d')
        if (!ctx) return tuChoi(new Error('Trình duyệt không vẽ được ảnh.'))
        ctx.drawImage(anh, x, y, canh, canh, 0, 0, CANH_ANH, CANH_ANH)
        giaiQuyet(khung.toDataURL('image/jpeg', 0.82))
      } catch (e) {
        tuChoi(e as Error)
      }
    }
    anh.onerror = () => {
      URL.revokeObjectURL(duongDan)
      tuChoi(new Error('Không đọc được file ảnh này.'))
    }
    anh.src = duongDan
  })

const chonAnh = async (su: Event) => {
  const o = su.target as HTMLInputElement
  const file = o.files && o.files[0]
  // ⚠️ Xoá giá trị ô chọn NGAY. Không xoá thì chọn lại đúng file vừa
  // chọn sẽ không kích hoạt `change`, và người dùng tưởng nút hỏng.
  o.value = ''
  if (!file) return

  loiAnh.value = ''
  daLuuAnh.value = false
  dangLuuAnh.value = true
  try {
    const anh = await thuNhoAnh(file)
    await hoSoService.datAnhDaiDien(anh)
    anhHienTai.value = anh
    daLuuAnh.value = true
  } catch (e: any) {
    // 🔴 In NGUYÊN VĂN câu máy chủ trả. Nó đã phân biệt sẵn 400 sai loại
    // ảnh / 400 quá nặng / 500 chưa chạy migration.
    loiAnh.value = e?.message || 'Không lưu được ảnh.'
  } finally {
    dangLuuAnh.value = false
  }
}

const xoaAnh = async () => {
  loiAnh.value = ''
  daLuuAnh.value = false
  dangLuuAnh.value = true
  try {
    await hoSoService.xoaAnhDaiDien()
    anhHienTai.value = ''
  } catch (e: any) {
    loiAnh.value = e?.message || 'Không gỡ được ảnh.'
  } finally {
    dangLuuAnh.value = false
  }
}

/**
 * Đổi chuỗi ISO của máy chủ sang ngày giờ đọc được.
 *
 * ⚠️ Không có ngày thì trả gạch ngang, KHÔNG trả chuỗi rỗng và KHÔNG trả
 * ngày 01/01/1970. Ô trống nhìn như màn chưa tải xong; 1970 nhìn như dữ
 * liệu thật và sẽ làm người đọc hoang mang.
 */
const ngayGio = (iso: string | null | undefined): string => {
  if (!iso) return chuaCo
  const d = new Date(iso)
  if (isNaN(d.getTime())) return chuaCo
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

onMounted(async () => {
  try {
    hoSo.value = await hoSoService.layHoSoCuaToi()
    // MỤC 407 — ảnh đi kèm trong chính gói hồ sơ, không gọi thêm lượt
    // nữa. Máy chủ đã trả `tai_khoan.anh_dai_dien`.
    anhHienTai.value = (hoSo.value as any)?.tai_khoan?.anh_dai_dien || ''
  } catch (e: any) {
    // Phân biệt hết phiên với máy chủ hỏng — hai việc phải làm khác nhau.
    loi.value = e?.status === 401
      ? 'Phiên đăng nhập đã hết hạn. Hãy đăng xuất rồi đăng nhập lại.'
      : (e?.message || 'Không đọc được hồ sơ từ máy chủ.')
  } finally {
    dangTai.value = false
  }
})
</script>
