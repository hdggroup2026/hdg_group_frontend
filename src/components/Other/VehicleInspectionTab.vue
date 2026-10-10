<!--
  MỤC 702 (10/10/2026) — ĐĂNG KIỂM PHƯƠNG TIỆN (tab mới, cùng khuôn tab Bảo hiểm
  MỤC 531).

  s68: *"quan trọng nhất là đăng kiểm. cái này phạt rất nặng. oto chưa có đăng
  kiểm nào khai báo"*. Bot nhắc vào nhóm từng xe khi còn 15, 7, 3, 1 ngày; quá hạn
  nhắc MỖI NGÀY (s68 chốt 10/10, bỏ mốc 30).

  Một xe nhiều lần đăng kiểm — lần có hạn xa nhất là "Đang hiệu lực", các lần
  trước là lịch sử, KHÔNG xoá khi thêm lần mới.
-->
<template>
  <div class="h-full flex flex-col">
    <div class="flex flex-wrap items-center gap-3 mb-3 shrink-0">
      <el-input v-model="tuKhoa" placeholder="Tìm biển số, mã xe, số tem, nơi kiểm..."
                clearable style="width: 260px" />

      <el-select v-model="locHan" placeholder="Hạn đăng kiểm" clearable style="width: 180px">
        <el-option label="Đã hết hạn" value="het" />
        <el-option label="Sắp hết (30 ngày)" value="sap" />
      </el-select>

      <div class="flex-1"></div>

      <!-- ⚠️ Đếm ngay trên thanh công cụ. Hợp đồng hết hạn mà phải mở bảng
           ra mới thấy thì không ai thấy (bài học MỤC 442). -->
      <span class="text-sm">
        <span class="text-gray-500 dark:text-gray-400">Tổng <b>{{ dsDangKiem.length }}</b></span>
        <span v-if="soHetHan" class="ml-2 text-red-600 dark:text-red-400 font-bold">
          · {{ soHetHan }} đã hết hạn
        </span>
        <span v-if="soSapHet" class="ml-2 text-amber-600 dark:text-amber-400 font-bold">
          · {{ soSapHet }} sắp hết
        </span>
      </span>

      <el-button :icon="Refresh" circle @click="taiTatCa" :loading="dangTai" />
      <el-button type="primary" :icon="Plus" @click="moThem()">Thêm đăng kiểm</el-button>
    </div>

    <!-- 🔴 Ô tô CHƯA khai đăng kiểm lên đầu, kèm nút thêm ngay. s68: *"oto chưa
         có đăng kiểm nào khai báo"* — thứ phải làm trước tiên, không được chìm. -->
    <div v-if="xeChuaDangKiem.length"
         class="mb-3 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm">
      <span class="font-bold text-red-700 dark:text-red-300">🔴 {{ xeChuaDangKiem.length }} ô tô chưa khai đăng kiểm:</span>
      <el-button v-for="x in xeChuaDangKiem" :key="x.id" size="small" type="danger" plain class="!ml-2 !mt-1"
                 @click="moThem(x.id)">+ {{ x.vehicle_code || '(chưa có mã)' }} {{ x.license_plate }}</el-button>
    </div>

    <div v-loading="dangTai" class="flex-1 min-h-0 overflow-y-auto pr-1">
      <div v-if="daLoc.length" class="flex flex-col gap-3">
        <div v-for="h in daLoc" :key="h.id"
             class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
          <div class="flex flex-wrap items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400">
              {{ maXe(h.vehicle_id) }}
            </span>
            <span class="font-bold text-gray-800 dark:text-gray-100">{{ bienSo(h.vehicle_id) }}</span>
            <el-tag v-if="laMoiNhat(h)" size="small" type="success" effect="plain">Đang hiệu lực</el-tag>
            <el-tag v-else size="small" type="info" effect="plain">Lần cũ</el-tag>
            <span class="ml-auto text-xs font-bold" :class="lopHan(h.ngay_het_han)">
              {{ chuHan(h.ngay_het_han) }}
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
            <div>Số tem / GCN: <b>{{ h.so_tem || '—' }}</b></div>
            <div>Nơi kiểm: <b>{{ h.noi_kiem || '—' }}</b></div>
            <div>Ngày kiểm định: <span class="font-mono">{{ ngayGon(h.ngay_kiem_dinh) }}</span></div>
            <div>Hết hạn: <span class="font-mono font-bold">{{ ngayGon(h.ngay_het_han) }}</span></div>
            <div v-if="h.ghi_chu" class="sm:col-span-2">Ghi chú: {{ h.ghi_chu }}</div>
          </div>

          <!-- 🔴 Cảnh báo bắn xuống nhóm phụ trách loại xe. Không có nhóm
               thì nói thẳng, đừng để người dùng tưởng đã có ai nhắc. -->
          <div v-if="!coNhomPhuTrach(h.vehicle_id)"
               class="mt-2 text-xs text-red-600 dark:text-red-400">
            ⚠️ Xe này <b>chưa gắn nhóm nào</b> — nhắc đăng kiểm sẽ không
            gửi được cho ai. Vào tab <b>Nhóm liên kết</b> gắn nhóm trước.
          </div>

          <div class="flex flex-wrap gap-2 mt-3">
            <el-button size="small" @click="moSua(h)">Chỉnh sửa</el-button>
            <el-button size="small" class="!text-red-500" @click="xoa(h)">Xoá</el-button>
          </div>
        </div>
      </div>

      <div v-else-if="!dangTai" class="text-center text-gray-400 py-10 text-sm">
        <template v-if="tuKhoa || locHan">Không có lần đăng kiểm nào khớp bộ lọc.</template>
        <template v-else>
          Chưa có lần đăng kiểm nào.<br />
          Bấm <b>Thêm đăng kiểm</b> ở góc trên bên phải.
        </template>
      </div>
    </div>

    <!-- ══════════════════ FORM ══════════════════ -->
    <el-dialog v-model="hienForm" :title="dangSua ? 'Chỉnh sửa đăng kiểm' : 'Thêm đăng kiểm'"
               :width="hepMan ? '95%' : '640px'" align-center destroy-on-close>
      <el-form :model="form" label-position="top">
        <el-row :gutter="14">
          <el-col :xs="24" :sm="12">
            <el-form-item label="Xe">
              <el-select v-model="form.vehicle_id" filterable placeholder="Chọn xe..."
                         :disabled="dangSua" style="width: 100%">
                <el-option v-for="x in dsXeCanDangKiem" :key="x.id" :value="x.id"
                           :label="`${x.vehicle_code || '(chưa có mã)'} — ${x.license_plate}`" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="Số tem / số giấy chứng nhận">
              <el-input v-model="form.so_tem" placeholder="VD: KD-1234567" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="Trung tâm đăng kiểm">
              <el-input v-model="form.noi_kiem" placeholder="VD: 50-03V" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="Ngày kiểm định">
              <el-date-picker v-model="form.ngay_kiem_dinh" type="date"
                              value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="Ngày hết hạn">
              <el-date-picker v-model="form.ngay_het_han" type="date"
                              value-format="YYYY-MM-DD" style="width: 100%" />
              <span class="text-xs text-gray-400">
                Bot nhắc vào nhóm xe khi còn 15, 7, 3, 1 ngày; quá hạn thì nhắc MỖI NGÀY.
              </span>
            </el-form-item>
          </el-col>

          <el-col :xs="24">
            <el-form-item label="Ghi chú">
              <el-input v-model="form.ghi_chu" type="textarea" :rows="2" />
            </el-form-item>
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
import { ref, computed, onMounted } from 'vue'
import { Refresh, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { vehicleService } from '@/api/vehicleService'
import { dungManHep } from '@/composables/manHep'

const { laManHep: hepMan } = dungManHep()

const dangTai = ref(false)
const dangLuu = ref(false)
const dangSua = ref(false)
const hienForm = ref(false)
const dsDangKiem = ref<any[]>([])
const dsXe = ref<any[]>([])
const dsNhom = ref<any[]>([])
const tuKhoa = ref('')
const locHan = ref('')

const formRong = () => ({
  id: null as any, vehicle_id: '', so_tem: '', noi_kiem: '',
  ngay_kiem_dinh: null as any, ngay_het_han: null as any, ghi_chu: '',
})

// Đăng kiểm chỉ cho Ô TÔ (car / truck / container) — xe máy hiện chưa phải đăng
// kiểm. CÙNG danh sách với `bot/utils/nhac_phuong_tien.py` LOAI_CAN_DANG_KIEM.
const LOAI_CAN_DANG_KIEM = ['car', 'truck', 'container']
const form = ref<any>(formRong())

const xeTheoId = computed(() => {
  const m: Record<string, any> = {}
  for (const x of dsXe.value) m[x.id] = x
  return m
})

const dsXeCanDangKiem = computed(() =>
  dsXe.value.filter((x: any) => LOAI_CAN_DANG_KIEM.includes(x.vehicle_type)))
const xeChuaDangKiem = computed(() => {
  const co = new Set(dsDangKiem.value.filter((h: any) => h.ngay_het_han).map((h: any) => h.vehicle_id))
  return dsXeCanDangKiem.value.filter((x: any) => !co.has(x.id))
})
// Lần có hạn XA nhất của mỗi xe là lần đang hiệu lực (cùng luật backend).
const moiNhatTheoXe = computed(() => {
  const m: Record<string, any> = {}
  for (const h of dsDangKiem.value) {
    const c = m[h.vehicle_id]
    if (!c || String(h.ngay_het_han) > String(c.ngay_het_han)) m[h.vehicle_id] = h
  }
  return m
})
const laMoiNhat = (h: any) => moiNhatTheoXe.value[h.vehicle_id]?.id === h.id

const maXe = (id: string) => xeTheoId.value[id]?.vehicle_code || '(chưa có mã)'
const bienSo = (id: string) => xeTheoId.value[id]?.license_plate || '(không rõ xe)'

// MỤC 533 — xe nào đã có nhóm ĐÃ XÁC NHẬN phụ trách.
// 🔴 s68 chốt "Mỗi nhóm 1 xe", nên tra theo `vehicle_id` chứ không theo
// loại xe như bản đầu.
const xeCoNhom = computed(() => {
  const t = new Set<string>()
  for (const n of dsNhom.value) {
    if (n.trang_thai === 'da_xac_nhan') t.add(n.vehicle_id)
  }
  return t
})

const coNhomPhuTrach = (vehicleId: string) => xeCoNhom.value.has(vehicleId)

const soNgayConLai = (d: any) => {
  if (!d) return null
  const hom_nay = new Date()
  hom_nay.setHours(0, 0, 0, 0)
  const h = new Date(String(d).slice(0, 10))
  h.setHours(0, 0, 0, 0)
  return Math.round((h.getTime() - hom_nay.getTime()) / 86400000)
}

const ngayGon = (d: any) => {
  if (!d) return '—'
  const t = String(d).slice(0, 10).split('-')
  return t.length === 3 ? `${t[2]}/${t[1]}/${t[0]}` : String(d)
}

const chuHan = (d: any) => {
  const n = soNgayConLai(d)
  if (n === null) return 'Chưa khai hạn'
  if (n < 0) return `Quá hạn ${-n} ngày`
  if (n === 0) return 'Hết hạn HÔM NAY'
  return `Còn ${n} ngày`
}

const lopHan = (d: any) => {
  const n = soNgayConLai(d)
  if (n === null) return 'text-amber-600 dark:text-amber-400'
  if (n < 0) return 'text-red-600 dark:text-red-400'
  if (n < 30) return 'text-amber-600 dark:text-amber-400'
  return 'text-green-600 dark:text-green-400'
}

const soHetHan = computed(() =>
  dsDangKiem.value.filter((h: any) => {
    const n = soNgayConLai(h.ngay_het_han); return n !== null && n < 0
  }).length)

const soSapHet = computed(() =>
  dsDangKiem.value.filter((h: any) => {
    const n = soNgayConLai(h.ngay_het_han); return n !== null && n >= 0 && n < 30
  }).length)

const daLoc = computed(() => {
  const k = tuKhoa.value.trim().toLowerCase()
  return dsDangKiem.value.filter((h: any) => {
    if (locHan.value) {
      const n = soNgayConLai(h.ngay_het_han)
      if (locHan.value === 'trong' && h.ngay_het_han) return false
      if (locHan.value === 'het' && !(n !== null && n < 0)) return false
      if (locHan.value === 'sap' && !(n !== null && n >= 0 && n < 30)) return false
    }
    if (!k) return true
    const x = xeTheoId.value[h.vehicle_id] || {}
    return [h.so_tem, h.noi_kiem, x.vehicle_code, x.license_plate]
      .some((v) => String(v || '').toLowerCase().includes(k))
  })
})

const taiTatCa = async () => {
  dangTai.value = true
  try {
    // Ba lời gọi song song, không nối tiếp — nối tiếp là chờ ba lượt mạng.
    const [bh, xe, nhom] = await Promise.all([
      vehicleService.getDangKiemXe(),
      vehicleService.getVehicles(),
      vehicleService.getNhomXe(),
    ])
    dsDangKiem.value = bh || []
    dsXe.value = xe || []
    dsNhom.value = nhom || []
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không tải được danh sách đăng kiểm.')
  } finally {
    dangTai.value = false
  }
}

const moThem = (vehicleId?: string) => {
  form.value = { ...formRong(), vehicle_id: vehicleId || '' }
  dangSua.value = false
  hienForm.value = true
}

const moSua = (h: any) => {
  form.value = { ...formRong(), ...h }
  dangSua.value = true
  hienForm.value = true
}

const luuForm = async () => {
  if (!form.value.vehicle_id) {
    ElMessage.warning('Phải chọn xe.')
    return
  }
  if (!form.value.ngay_het_han) {
    // ⚠️ Không có ngày hết hạn thì cả MỤC này vô nghĩa — không cảnh báo
    // được gì. Chặn ngay ở đây thay vì để dữ liệu câm nằm trong bảng.
    ElMessage.warning('Phải có ngày hết hạn đăng kiểm, nếu không bot không nhắc được.')
    return
  }
  dangLuu.value = true
  try {
    const goi: any = {
      vehicle_id: form.value.vehicle_id,
      so_tem: form.value.so_tem || null,
      noi_kiem: form.value.noi_kiem || null,
      ngay_kiem_dinh: form.value.ngay_kiem_dinh || null,
      ngay_het_han: form.value.ngay_het_han || null,
      ghi_chu: form.value.ghi_chu || null,
    }
    if (dangSua.value) {
      await vehicleService.updateDangKiemXe({ ...goi, id: form.value.id })
    } else {
      await vehicleService.addDangKiemXe(goi)
    }
    ElMessage.success('Đã lưu đăng kiểm.')
    hienForm.value = false
    await taiTatCa()
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không lưu được đăng kiểm.')
  } finally {
    dangLuu.value = false
  }
}

const xoa = async (h: any) => {
  try {
    await ElMessageBox.confirm(
      `Xoá lần đăng kiểm "${h.so_tem || ngayGon(h.ngay_het_han)}" của xe ` +
      `${bienSo(h.vehicle_id)}?`,
      'Xác nhận xoá', { type: 'warning', confirmButtonText: 'Xoá', cancelButtonText: 'Hủy' })
  } catch {
    return
  }
  try {
    await vehicleService.deleteDangKiemXe(h.id)
    ElMessage.success('Đã xoá.')
    await taiTatCa()
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không xoá được.')
  }
}

onMounted(taiTatCa)
</script>
