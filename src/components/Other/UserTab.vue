<!--
  MỤC 521 (05/09/2026) — TAB NGƯỜI SỬ DỤNG.

  s68 05/09/2026: *"Thêm 1 tab Người Sử Dụng nữa. Quy hoạch thiết bị thì sẽ
  đi kèm phụ kiện. Nếu bàn giao thiết bị thì mọi phụ kiện kèm theo thiết bị
  mặc định sẽ đi theo phụ kiện luôn. Hiện tại chỉ mới có danh sách thiết bị.
  Nếu muốn kiểm tra 1 người đang giữ danh sách thiết bị nào thì sẽ khó kiểm
  tra."*

  ══════════════════════════════════════════════════════════════════════
  🔴 MÀN NÀY KHÔNG TỰ GỘP DỮ LIỆU
  ══════════════════════════════════════════════════════════════════════

  Toàn bộ việc nối bàn giao ↔ thiết bị ↔ phụ kiện ↔ SIM nằm ở MỘT đường
  máy chủ: `/other/get-nguoi-su-dung`. Màn này chỉ hiện thứ nhận được.

  Lý do: luật nối có một chỗ hiểm — bảng bàn giao gọi điện thoại là
  `phone`, màn hình là `monitor`; bảng phụ kiện và SIM gọi chúng là
  `smartphone` và `screen`. Chép luật quy đổi đó sang phía web là hai nơi
  cùng giữ một luật, có ngày lệch nhau và không ai biết bên nào đúng.

  ⚠️ Phụ kiện "đi theo thiết bị" được SUY RA, không lưu cột nào. Phụ kiện
  gắn máy X, máy X ở tay người Y, nên phụ kiện ở tay người Y. Tháo phụ
  kiện sang máy khác là danh sách tự đổi theo, không phải sửa hai chỗ.
-->
<template>
  <div class="h-full flex flex-col">
    <!-- ══════════════════ THANH CÔNG CỤ ══════════════════ -->
    <div class="flex flex-wrap items-center gap-3 mb-3 shrink-0">
      <el-input
        v-model="tuKhoa"
        placeholder="Tìm tên người, mã máy, dòng máy..."
        clearable
        style="width: 280px"
      />

      <div class="flex-1"></div>

      <span class="text-sm text-gray-500 dark:text-gray-400">
        <b>{{ dsNguoi.length }}</b> người đang giữ
        <b>{{ tongThietBi }}</b> thiết bị
        <span v-if="tongMonKem"> · <b>{{ tongMonKem }}</b> món kèm theo</span>
      </span>

      <el-button :icon="Refresh" circle @click="taiDanhSach" :loading="dangTai" />
    </div>

    <!-- ══════════════════ DANH SÁCH ══════════════════
         Dùng THẺ chứ không dùng bảng, và dùng cho MỌI cỡ màn hình.
         Mỗi người giữ nhiều máy, mỗi máy kèm nhiều món — đây là dữ liệu
         lồng ba tầng. Bảng phẳng phải lặp lại tên người ở mỗi dòng và
         không có chỗ nào đặt danh sách phụ kiện.
         ══════════════════════════════════════════════════════════════ -->
    <div v-loading="dangTai" class="flex-1 min-h-0 overflow-y-auto pr-1">
      <div v-if="daLoc.length" class="flex flex-col gap-3">
        <div
          v-for="n in daLoc"
          :key="n.username"
          class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
        >
          <!-- Đầu thẻ: tên người, bấm để mở/thu -->
          <button
            type="button"
            class="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
            @click="doiMoThu(n.username)"
          >
            <span class="flex items-center gap-3 min-w-0">
              <span class="shrink-0 w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                {{ chuDau(n.username) }}
              </span>
              <span class="min-w-0">
                <span class="block font-bold text-gray-800 dark:text-gray-100 break-words">
                  {{ n.username }}
                </span>
                <span class="block text-xs text-gray-500 dark:text-gray-400">
                  {{ n.so_thiet_bi }} thiết bị
                  <template v-if="n.so_mon_kem"> · {{ n.so_mon_kem }} món kèm theo</template>
                </span>
              </span>
            </span>
            <span class="shrink-0 text-gray-400 text-xs">
              {{ dangMo(n.username) ? '▲ Thu gọn' : '▼ Xem chi tiết' }}
            </span>
          </button>

          <!-- Thân thẻ: từng thiết bị -->
          <div v-if="dangMo(n.username)" class="border-t border-gray-100 dark:border-gray-700 px-4 py-3 flex flex-col gap-3">
            <div
              v-for="tb in n.thiet_bi"
              :key="tb.device_type + '|' + tb.device_id"
              class="rounded-xl border border-gray-150 dark:border-gray-700 p-3"
            >
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ tb.device_id }}</span>
                <el-tag size="small" effect="plain">{{ tb.nhan_loai }}</el-tag>
                <span class="text-sm text-gray-700 dark:text-gray-200 font-semibold break-words">
                  {{ tb.ten_may || '—' }}
                  <span v-if="tb.hang" class="text-gray-400 font-normal">({{ tb.hang }})</span>
                </span>
              </div>

              <div class="text-xs text-gray-500 dark:text-gray-400">
                Nhận ngày: <b>{{ ngayGon(tb.ngay_ban_giao) }}</b>
                <template v-if="tb.tinh_trang_ban_dau">
                  · Tình trạng lúc giao: {{ tb.tinh_trang_ban_dau }}
                </template>
              </div>

              <!-- Món kèm theo -->
              <div v-if="tb.mon_kem_theo && tb.mon_kem_theo.length" class="mt-2 pl-3 border-l-2 border-blue-200 dark:border-blue-800">
                <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1">
                  Đi kèm {{ tb.mon_kem_theo.length }} món:
                </div>
                <div
                  v-for="m in tb.mon_kem_theo"
                  :key="m.nguon + '|' + m.id"
                  class="flex flex-wrap items-center gap-2 text-xs py-0.5"
                >
                  <el-tag size="small" :type="m.nguon === 'sim' ? 'warning' : 'info'" effect="plain">
                    {{ m.nguon === 'sim' ? 'SIM' : 'Phụ kiện' }}
                  </el-tag>
                  <span class="font-mono">{{ m.id }}</span>
                  <span class="text-gray-600 dark:text-gray-300 break-words">
                    {{ m.loai || '' }}<template v-if="m.ten"> — {{ m.ten }}</template>
                  </span>
                  <span v-if="m.so_hieu" class="font-mono text-gray-400">{{ m.so_hieu }}</span>
                </div>
              </div>

              <!-- ⚠️ Rỗng thì nói PHẢI LÀM GÌ, không chỉ nói là rỗng. -->
              <div v-else class="mt-2 text-xs text-gray-400">
                Không có phụ kiện hay SIM nào gắn máy này. Muốn gắn: vào tab
                <b>Phụ kiện</b> hoặc <b>SIM</b>, chọn một món rồi bấm
                <b>Gắn vào máy</b>.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="!dangTai" class="text-center text-gray-400 py-10 text-sm">
        <template v-if="tuKhoa">
          Không có ai khớp với <b>{{ tuKhoa }}</b>.
        </template>
        <template v-else>
          Chưa có ai đang giữ thiết bị nào.<br />
          Bàn giao ở tab <b>Bàn giao</b>, hoặc mở một thiết bị rồi bấm
          <b>Bàn giao</b> ở chân hộp Chi tiết.
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { otherService } from '@/api/otherService'

const dangTai = ref(false)
const dsNguoi = ref<any[]>([])
const tuKhoa = ref('')

// ⚠️ Giữ trạng thái mở/thu bằng TẬP HỢP TÊN, không phải chỉ số dòng.
// Lọc danh sách là chỉ số đổi hết, còn tên thì không.
const dangMoTen = ref<Set<string>>(new Set())

const dangMo = (ten: string) => dangMoTen.value.has(ten)

const doiMoThu = (ten: string) => {
  const moi = new Set(dangMoTen.value)
  if (moi.has(ten)) moi.delete(ten)
  else moi.add(ten)
  dangMoTen.value = moi
}

const chuDau = (ten: string) => (ten || '?').trim().charAt(0).toUpperCase()

const ngayGon = (d: any) => {
  if (!d) return '—'
  const t = String(d).slice(0, 10).split('-')
  return t.length === 3 ? `${t[2]}/${t[1]}/${t[0]}` : String(d)
}

const tongThietBi = computed(() =>
  dsNguoi.value.reduce((c, n) => c + (n.so_thiet_bi || 0), 0))

const tongMonKem = computed(() =>
  dsNguoi.value.reduce((c, n) => c + (n.so_mon_kem || 0), 0))

// Tìm được theo tên người, mã máy, dòng máy, và cả mã phụ kiện / số SIM —
// đúng câu hỏi thật của s68: "cái SIM này đang ở tay ai".
const daLoc = computed(() => {
  const k = tuKhoa.value.trim().toLowerCase()
  if (!k) return dsNguoi.value
  return dsNguoi.value.filter((n: any) => {
    if (String(n.username || '').toLowerCase().includes(k)) return true
    return (n.thiet_bi || []).some((tb: any) => {
      const cua_may = [tb.device_id, tb.ten_may, tb.hang, tb.nhan_loai]
        .some((v) => String(v || '').toLowerCase().includes(k))
      if (cua_may) return true
      return (tb.mon_kem_theo || []).some((m: any) =>
        [m.id, m.ten, m.loai, m.so_hieu]
          .some((v) => String(v || '').toLowerCase().includes(k)))
    })
  })
})

const taiDanhSach = async () => {
  dangTai.value = true
  try {
    dsNguoi.value = (await otherService.getNguoiSuDung()) || []
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không tải được danh sách người sử dụng.')
  } finally {
    dangTai.value = false
  }
}

onMounted(taiDanhSach)
</script>
