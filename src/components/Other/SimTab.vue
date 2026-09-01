<!--
  MỤC 442 (01/09/2026) — TAB SIM.

  s68 01/09: *"Sim vừa là phụ kiện. Vừa trong danh sách để theo dõi hạn sử
  dụng luôn."*

  🔴 SIM GIỮ BẢNG RIÊNG `sim_cards`, không nhét vào bảng phụ kiện chung.
  Nó có bốn cột không phụ kiện nào có — `iccid`, `puk_code`, `plan_name`,
  `sim_type`. Nhét chung là bốn cột rỗng cho mọi dòng khác.

  Việc "SIM cũng là phụ kiện" giải quyết ở đường
  `/other/get-phu-kien-cua-may`: nó trả về CẢ hai nguồn cùng một khuôn,
  và đó là thứ hiện ra khi bấm vào cột Phụ kiện ở bảng thiết bị.

  ⚠️ Bảng này đã tồn tại từ lâu nhưng CHƯA TỪNG có màn nào — giống hệt
  `applications` trước MỤC 436. Nên phần lớn dữ liệu sẽ trống lúc đầu.
-->
<template>
  <div class="h-full overflow-auto">
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <el-input v-model="tuKhoa" placeholder="Tìm số ĐT, nhà mạng, ICCID, máy..."
                clearable style="width: 250px" />

      <el-select v-model="locHan" placeholder="Hạn sử dụng" clearable style="width: 170px">
        <el-option label="Đã hết hạn" value="het" />
        <el-option label="Sắp hết (30 ngày)" value="sap" />
        <el-option label="Chưa khai hạn" value="trong" />
      </el-select>

      <div class="flex-1"></div>

      <!-- ⚠️ Đếm ngay trên thanh công cụ. SIM hết hạn mà phải mở bảng ra
           mới thấy thì không ai thấy. -->
      <span class="text-sm">
        <span class="text-gray-500 dark:text-gray-400">Tổng <b>{{ dsSim.length }}</b></span>
        <span v-if="soHetHan" class="ml-2 text-red-600 dark:text-red-400 font-bold">
          · {{ soHetHan }} đã hết hạn
        </span>
        <span v-if="soSapHet" class="ml-2 text-amber-600 dark:text-amber-400 font-bold">
          · {{ soSapHet }} sắp hết
        </span>
      </span>

      <el-button :icon="Refresh" circle @click="taiDanhSach" />
      <el-button type="primary" :icon="Plus" @click="moThem">Thêm SIM</el-button>
    </div>

    <!-- ══════════════════ BẢNG ══════════════════ -->
    <el-table v-if="hienBang" :data="trangHienTai" v-loading="dangTai"
              border stripe size="small" class="w-full">
      <el-table-column label="STT" width="52" align="center">
        <template #default="{ $index }">{{ (trang - 1) * moiTrang + $index + 1 }}</template>
      </el-table-column>

      <el-table-column prop="id" label="Mã SIM" width="90" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.id }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="phone_number" label="Số điện thoại" width="126">
        <template #default="{ row }">
          <span class="font-mono font-bold text-xs">{{ row.phone_number || '—' }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="carrier" label="Nhà mạng" width="100" show-overflow-tooltip />
      <el-table-column prop="sim_type" label="Loại SIM" width="104" show-overflow-tooltip />
      <el-table-column prop="plan_name" label="Gói cước" width="110" show-overflow-tooltip />

      <el-table-column prop="monthly_fee" label="Cước/tháng" width="104" align="right">
        <template #default="{ row }">
          <span class="font-mono text-xs">{{ tien(row.monthly_fee) }}</span>
        </template>
      </el-table-column>

      <!-- 🔴 Cột chính của màn này, theo đúng yêu cầu s68 ngày 01/09. -->
      <el-table-column prop="expiry_date" label="Hạn sử dụng" width="110" align="center">
        <template #default="{ row }">
          <div v-if="row.expiry_date" class="font-mono text-xs" :class="lopHan(row.expiry_date)">
            {{ ngayDayDu(row.expiry_date) }}
            <div class="text-[10px] font-normal">{{ chuConLai(row.expiry_date) }}</div>
          </div>
          <span v-else class="text-xs text-amber-600 dark:text-amber-400">Chưa khai</span>
        </template>
      </el-table-column>

      <el-table-column prop="iccid" label="ICCID" width="140" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="font-mono text-xs">{{ row.iccid || '—' }}</span>
        </template>
      </el-table-column>

      <!-- ⚠️ Mã PUK che mặc định. Nó là thứ mở khoá được cả SIM. -->
      <el-table-column label="Mã PUK" width="104">
        <template #default="{ row }">
          <div v-if="row.puk_code" class="flex items-center gap-1 text-xs">
            <span class="font-mono">{{ hienPuk[row.id] ? row.puk_code : '••••••' }}</span>
            <el-button link type="info" size="small" class="!p-0 h-auto"
                       @click="hienPuk[row.id] = !hienPuk[row.id]">
              <el-icon :size="10"><component :is="hienPuk[row.id] ? Hide : View" /></el-icon>
            </el-button>
          </div>
          <span v-else class="text-gray-400">—</span>
        </template>
      </el-table-column>

      <el-table-column prop="device_id" label="Đang ở máy" width="116" align="center">
        <template #default="{ row }">
          <span v-if="row.device_id" class="font-mono font-bold text-xs">{{ row.device_id }}</span>
          <span v-else class="text-xs text-gray-500 dark:text-gray-400">Trong kho</span>
        </template>
      </el-table-column>

      <el-table-column prop="notes" label="Ghi chú" min-width="120" show-overflow-tooltip />

      <el-table-column label="Thao tác" width="60" align="center">
        <template #default="{ row }">
          <el-dropdown trigger="click" @command="(c: string) => chonLenh(c, row)">
            <el-button link><el-icon><MoreFilled /></el-icon></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="sua">Chỉnh sửa</el-dropdown-item>
                <el-dropdown-item command="xoa" divided class="!text-red-500">Xóa</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <!-- ══════════════════ THẺ ══════════════════ -->
    <div v-if="hienThe" v-loading="dangTai" class="flex flex-col gap-3">
      <div v-for="row in trangHienTai" :key="row.id"
           class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
        <div class="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
          <div class="min-w-0 break-words">
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.id }}</span>
            <span class="ml-2 font-mono font-semibold">{{ row.phone_number || '—' }}</span>
          </div>
          <el-dropdown trigger="click" @command="(c: string) => chonLenh(c, row)">
            <el-button link><el-icon><MoreFilled /></el-icon></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="sua">Chỉnh sửa</el-dropdown-item>
                <el-dropdown-item command="xoa" divided class="!text-red-500">Xóa</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <div class="flex flex-col gap-2 text-sm">
          <div class="flex justify-between gap-3">
            <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Hạn sử dụng:</span>
            <span class="text-right break-words min-w-0 font-mono text-xs" :class="lopHan(row.expiry_date)">
              <template v-if="row.expiry_date">
                {{ ngayDayDu(row.expiry_date) }} — {{ chuConLai(row.expiry_date) }}
              </template>
              <span v-else class="text-amber-600 dark:text-amber-400">Chưa khai</span>
            </span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Nhà mạng:</span>
            <span class="text-right break-words min-w-0 text-xs">{{ row.carrier || '—' }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Gói cước:</span>
            <span class="text-right break-words min-w-0 text-xs">{{ row.plan_name || '—' }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Cước/tháng:</span>
            <span class="text-right break-words min-w-0 font-mono text-xs">{{ tien(row.monthly_fee) }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">ICCID:</span>
            <span class="text-right break-words min-w-0 font-mono text-xs">{{ row.iccid || '—' }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Mã PUK:</span>
            <span class="text-right break-words min-w-0">
              <span v-if="row.puk_code" class="inline-flex items-center gap-1 text-xs">
                <span class="font-mono">{{ hienPuk[row.id] ? row.puk_code : '••••••' }}</span>
                <el-button link type="info" size="small" class="!p-0 h-auto"
                           @click="hienPuk[row.id] = !hienPuk[row.id]">
                  <el-icon :size="10"><component :is="hienPuk[row.id] ? Hide : View" /></el-icon>
                </el-button>
              </span>
              <span v-else class="text-gray-400">—</span>
            </span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Đang ở máy:</span>
            <span class="text-right break-words min-w-0 text-xs">
              <span v-if="row.device_id" class="font-mono font-bold">{{ row.device_id }}</span>
              <span v-else class="text-gray-500 dark:text-gray-400">Trong kho</span>
            </span>
          </div>
        </div>
      </div>

      <div v-if="!dangTai && trangHienTai.length === 0" class="text-center text-gray-400 py-8">
        Chưa có SIM nào. Bấm “Thêm SIM” để bắt đầu.
      </div>
    </div>

    <div class="mt-4 flex justify-end">
      <el-pagination v-model:current-page="trang" v-model:page-size="moiTrang"
                     :total="daLoc.length" :page-sizes="[10, 20, 50]"
                     layout="total, sizes, prev, pager, next" background />
    </div>

    <!-- ══════════════════ FORM ══════════════════ -->
    <el-dialog v-model="hienForm" :title="dangSua ? 'Chỉnh sửa SIM' : 'Thêm SIM'"
               width="680px" align-center destroy-on-close>
      <el-form :model="form" label-position="top">
        <el-row :gutter="14">
          <el-col :xs="24" :sm="8">
            <el-form-item label="Mã SIM">
              <el-input v-model="form.id" :disabled="dangSua" placeholder="VD: SIM001" />
              <span v-if="dangSua" class="text-xs text-gray-400">Không sửa được.</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="Số điện thoại"><el-input v-model="form.phone_number" /></el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="Nhà mạng">
              <el-select v-model="form.carrier" style="width: 100%" clearable allow-create filterable>
                <el-option label="Viettel" value="Viettel" />
                <el-option label="Vinaphone" value="Vinaphone" />
                <el-option label="MobiFone" value="MobiFone" />
                <el-option label="Vietnamobile" value="Vietnamobile" />
                <el-option label="Itel" value="Itel" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="8">
            <el-form-item label="Loại SIM">
              <el-select v-model="form.sim_type" style="width: 100%" clearable>
                <el-option label="SIM vật lý" value="SIM vật lý" />
                <el-option label="eSIM" value="eSIM" />
                <el-option label="Trả trước" value="Trả trước" />
                <el-option label="Trả sau" value="Trả sau" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="Gói cước"><el-input v-model="form.plan_name" placeholder="VD: V120" /></el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="Cước/tháng (VNĐ)">
              <el-input-number v-model="form.monthly_fee" :min="0" :step="10000"
                               controls-position="right" style="width: 100%" />
              <span class="text-xs text-gray-400">Chỉ ghi để xem, không vào sổ.</span>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12">
            <el-form-item label="ICCID (20 số trên phôi SIM)"><el-input v-model="form.iccid" /></el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="Mã PUK">
              <el-input v-model="form.puk_code" type="password" show-password />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="8">
            <el-form-item label="Ngày kích hoạt">
              <el-date-picker v-model="form.activation_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="Hạn sử dụng">
              <el-date-picker v-model="form.expiry_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="Trạng thái">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="Đang dùng" value="active" />
                <el-option label="Tạm khoá" value="suspended" />
                <el-option label="Đã huỷ" value="cancelled" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12">
            <el-form-item label="Lắp ở máy nào">
              <el-select v-model="mayDuocChon" filterable clearable style="width: 100%"
                         placeholder="Để trống = trong kho">
                <el-option v-for="m in dsMay" :key="m.khoa" :value="m.khoa"
                           :label="`${m.device_id} — ${m.ten}`" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="Ghi chú"><el-input v-model="form.notes" /></el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="hienForm = false">Hủy</el-button>
        <el-button type="primary" :loading="dangLuu" @click="luuForm">Xác nhận</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MoreFilled, Plus, Refresh, View, Hide } from '@element-plus/icons-vue'
import { otherService } from '@/api/otherService'
import { dungManHep } from '@/composables/manHep'

const { hienBang, hienThe } = dungManHep()

const dsSim = ref<any[]>([])
const dsMay = ref<any[]>([])
const dangTai = ref(false)
const tuKhoa = ref('')
const locHan = ref('')
const trang = ref(1)
const moiTrang = ref(10)
const hienPuk = reactive<Record<string, boolean>>({})

const soNgayConLai = (d: any) => {
  if (!d) return null
  return Math.floor((new Date(d).getTime() - Date.now()) / 86400000)
}

const soHetHan = computed(() =>
  dsSim.value.filter((s) => { const n = soNgayConLai(s.expiry_date); return n !== null && n < 0 }).length)

const soSapHet = computed(() =>
  dsSim.value.filter((s) => { const n = soNgayConLai(s.expiry_date); return n !== null && n >= 0 && n < 30 }).length)

const daLoc = computed(() => {
  const k = tuKhoa.value.trim().toLowerCase()
  return dsSim.value.filter((s) => {
    if (locHan.value) {
      const n = soNgayConLai(s.expiry_date)
      if (locHan.value === 'trong' && s.expiry_date) return false
      if (locHan.value === 'het' && !(n !== null && n < 0)) return false
      if (locHan.value === 'sap' && !(n !== null && n >= 0 && n < 30)) return false
    }
    if (!k) return true
    return [s.id, s.phone_number, s.carrier, s.iccid, s.plan_name, s.device_id]
      .some((v) => String(v || '').toLowerCase().includes(k))
  })
})

const trangHienTai = computed(() => {
  const dau = (trang.value - 1) * moiTrang.value
  return daLoc.value.slice(dau, dau + moiTrang.value)
})

const taiDanhSach = async () => {
  dangTai.value = true
  try {
    const [sim, dt, mtb] = await Promise.all([
      otherService.getSimCards(),
      otherService.getSmartphones(),
      otherService.getTablets(),
    ])
    dsSim.value = sim || []
    const gom = (ds: any[], loai: string) => (ds || []).map((m) => ({
      khoa: `${loai}|${m.id}`, device_id: m.id, device_type: loai,
      ten: m.model_name || m.brand || '',
    }))
    // Chỉ điện thoại và máy tính bảng — laptop, màn hình, camera không có
    // khe SIM. Đưa vào là mời người dùng khai một chuyện không có thật.
    dsMay.value = [...gom(dt, 'smartphone'), ...gom(mtb, 'tablet')]
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không tải được danh sách SIM.')
  } finally {
    dangTai.value = false
  }
}

onMounted(taiDanhSach)

// ══════════════════════════════════════════════════════════════════════
// FORM
// ══════════════════════════════════════════════════════════════════════
const hienForm = ref(false)
const dangSua = ref(false)
const dangLuu = ref(false)
const mayDuocChon = ref('')

const formRong = () => ({
  id: '', phone_number: '', carrier: '', iccid: '', puk_code: '',
  plan_name: '', status: 'active', sim_type: '', device_id: null as any,
  device_type: null as any, expiry_date: null as any,
  activation_date: null as any, monthly_fee: 0, notes: '',
})

const form = reactive<any>(formRong())

const moThem = () => {
  Object.assign(form, formRong())
  mayDuocChon.value = ''
  dangSua.value = false
  hienForm.value = true
}

const moSua = (row: any) => {
  Object.assign(form, formRong(), row)
  mayDuocChon.value = row.device_id ? `${row.device_type || 'smartphone'}|${row.device_id}` : ''
  dangSua.value = true
  hienForm.value = true
}

const luuForm = async () => {
  if (!form.id?.trim() || !form.phone_number?.trim()) {
    ElMessage.warning('Phải có Mã SIM và Số điện thoại.')
    return
  }
  dangLuu.value = true
  try {
    // Tách khoá chọn máy về hai trường trước khi gửi.
    if (mayDuocChon.value) {
      const [loai, ...phan] = mayDuocChon.value.split('|')
      form.device_type = loai
      form.device_id = phan.join('|')
    } else {
      form.device_type = null
      form.device_id = null
    }
    if (dangSua.value) await otherService.updateSimCards([{ ...form }])
    else await otherService.addSimCards([{ ...form }])
    ElMessage.success(dangSua.value ? 'Đã cập nhật SIM.' : 'Đã thêm SIM.')
    hienForm.value = false
    await taiDanhSach()
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không lưu được.')
  } finally {
    dangLuu.value = false
  }
}

const xoaSim = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `Xoá SIM ${row.id} — ${row.phone_number}?`,
      'Xác nhận xoá', { type: 'warning', confirmButtonText: 'Xoá', cancelButtonText: 'Hủy' })
  } catch { return }
  try {
    await otherService.deleteSimCards([row.id])
    ElMessage.success('Đã xoá.')
    await taiDanhSach()
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không xoá được.')
  }
}

const chonLenh = (lenh: string, row: any) => {
  if (lenh === 'sua') moSua(row)
  else if (lenh === 'xoa') xoaSim(row)
}

// ══════════════════════════════════════════════════════════════════════
// HIỂN THỊ HẠN SỬ DỤNG
//
// ⚠️ Hết hạn rồi mà hiện màu thường thì không ai để ý — mà SIM hết hạn
// là mất số, không lấy lại được.
// ══════════════════════════════════════════════════════════════════════
const lopHan = (d: any) => {
  const n = soNgayConLai(d)
  if (n === null) return ''
  if (n < 0) return 'text-red-600 dark:text-red-400 font-bold'
  if (n < 30) return 'text-amber-600 dark:text-amber-400 font-bold'
  return ''
}

const chuConLai = (d: any) => {
  const n = soNgayConLai(d)
  if (n === null) return ''
  if (n < 0) return `quá ${Math.abs(n)} ngày`
  if (n === 0) return 'hết hôm nay'
  return `còn ${n} ngày`
}

const tien = (v: any) => {
  const so = Number(v || 0)
  return so ? so.toLocaleString('vi-VN') + ' đ' : '—'
}

const ngayDayDu = (d: any) => {
  const p = String(d || '').split('-')
  return p.length >= 3 ? `${p[2]}/${p[1]}/${p[0]}` : String(d || '')
}
</script>
