<!--
  MỤC 532 (05/09/2026) — LỊCH BẢO TRÌ, BẢO DƯỠNG XE.

  s68 05/09/2026: *"Add thêm lịch nhắc bảo trì, bảo dưỡng xe luôn"*, và khi
  được hỏi lịch chạy kiểu nào: *"Khi bảo trì / bảo dưỡng xong thì ghi hẹn
  lần tới vào và bot ghi lịch hẹn mới vào."*

  🔴 KHÔNG tự lặp theo chu kỳ cố định. Làm xong mới ghi hẹn lần tới — xe
  chạy nhiều chạy ít khác nhau, chu kỳ cứng là hẹn sai.

  🔴 Bấm "Đã xong" KHÔNG sửa dòng cũ thành lần sau. Dòng cũ đóng lại làm
  lịch sử bảo dưỡng của xe; lần hẹn mới là MỘT DÒNG MỚI trỏ về nó. Ghi đè
  là mất hết dấu vết xe đã bảo dưỡng bao nhiêu lần.
-->
<template>
  <div class="h-full flex flex-col">
    <div class="flex flex-wrap items-center gap-3 mb-3 shrink-0">
      <el-input v-model="tuKhoa" placeholder="Tìm biển số, mã xe, nội dung..."
                clearable style="width: 250px" />

      <el-select v-model="locTrangThai" placeholder="Trạng thái" clearable style="width: 160px">
        <el-option label="Đang chờ" value="dang_cho" />
        <el-option label="Đã xong" value="da_xong" />
      </el-select>

      <div class="flex-1"></div>

      <span class="text-sm">
        <span class="text-gray-500 dark:text-gray-400">Đang chờ <b>{{ soDangCho }}</b></span>
        <span v-if="soQuaHan" class="ml-2 text-red-600 dark:text-red-400 font-bold">
          · {{ soQuaHan }} quá hẹn
        </span>
      </span>

      <el-button :icon="Refresh" circle @click="taiTatCa" :loading="dangTai" />
      <el-button type="primary" :icon="Plus" @click="moThem">Thêm lịch</el-button>
    </div>

    <div v-loading="dangTai" class="flex-1 min-h-0 overflow-y-auto pr-1">
      <div v-if="daLoc.length" class="flex flex-col gap-3">
        <div v-for="b in daLoc" :key="b.id"
             class="rounded-xl border bg-white dark:bg-gray-800 p-3"
             :class="b.trang_thai === 'da_xong'
                       ? 'border-gray-200 dark:border-gray-700 opacity-75'
                       : 'border-blue-200 dark:border-blue-900/60'">
          <div class="flex flex-wrap items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400">
              {{ maXe(b.vehicle_id) }}
            </span>
            <span class="font-bold text-gray-800 dark:text-gray-100">{{ bienSo(b.vehicle_id) }}</span>
            <el-tag size="small" effect="plain">
              {{ b.loai === 'bao_tri' ? 'Bảo trì' : 'Bảo dưỡng' }}
            </el-tag>
            <el-tag size="small" :type="b.trang_thai === 'da_xong' ? 'info' : 'primary'"
                    effect="dark" class="font-bold">
              {{ b.trang_thai === 'da_xong' ? 'Đã xong' : 'Đang chờ' }}
            </el-tag>
            <span v-if="b.trang_thai !== 'da_xong'"
                  class="ml-auto text-xs font-bold" :class="lopHen(b.ngay_hen)">
              {{ chuHen(b.ngay_hen) }}
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
            <div>Ngày hẹn: <span class="font-mono font-bold">{{ ngayGon(b.ngay_hen) }}</span></div>
            <div v-if="b.trang_thai !== 'da_xong'">Nhắc trước: <b>{{ b.nhac_truoc_ngay || 3 }}</b> ngày</div>
            <div v-if="b.ngay_hoan_thanh">Đã làm ngày: <span class="font-mono">{{ ngayGon(b.ngay_hoan_thanh) }}</span></div>
            <div v-if="b.noi_sua">Nơi sửa: <b>{{ b.noi_sua }}</b></div>
            <div v-if="b.chi_phi">Chi phí: <span class="font-mono">{{ tien(b.chi_phi) }}</span>
              <span class="text-gray-400"> (ghi để xem)</span></div>
            <div v-if="b.noi_dung" class="sm:col-span-2">Nội dung: {{ b.noi_dung }}</div>
            <div v-if="b.ghi_chu" class="sm:col-span-2">Ghi chú: {{ b.ghi_chu }}</div>
          </div>

          <div v-if="b.trang_thai !== 'da_xong' && !coNhomPhuTrach(b.vehicle_id)"
               class="mt-2 text-xs text-red-600 dark:text-red-400">
            ⚠️ Xe này <b>chưa gắn nhóm nào</b> — nhắc lịch sẽ không gửi được
            cho ai. Vào tab <b>Nhóm liên kết</b> gắn nhóm trước.
          </div>

          <div class="flex flex-wrap gap-2 mt-3">
            <el-button v-if="b.trang_thai !== 'da_xong'" size="small" type="primary"
                       @click="moXong(b)">Đã xong</el-button>
            <el-button v-if="b.trang_thai !== 'da_xong'" size="small" @click="moSua(b)">Chỉnh sửa</el-button>
            <el-button size="small" class="!text-red-500" @click="xoa(b)">Xoá</el-button>
          </div>
        </div>
      </div>

      <div v-else-if="!dangTai" class="text-center text-gray-400 py-10 text-sm">
        <template v-if="tuKhoa || locTrangThai">Không có lịch nào khớp bộ lọc.</template>
        <template v-else>
          Chưa có lịch bảo trì, bảo dưỡng nào.<br />
          Bấm <b>Thêm lịch</b> ở góc trên bên phải.
        </template>
      </div>
    </div>

    <!-- ══════════════════ FORM THÊM / SỬA ══════════════════ -->
    <el-dialog v-model="hienForm" :title="dangSua ? 'Chỉnh sửa lịch' : 'Thêm lịch bảo trì, bảo dưỡng'"
               :width="hepMan ? '95%' : '600px'" align-center destroy-on-close>
      <el-form :model="form" label-position="top">
        <el-row :gutter="14">
          <el-col :xs="24" :sm="12">
            <el-form-item label="Xe">
              <el-select v-model="form.vehicle_id" filterable placeholder="Chọn xe..."
                         :disabled="dangSua" style="width: 100%">
                <el-option v-for="x in dsXe" :key="x.id" :value="x.id"
                           :label="`${x.vehicle_code || '(chưa có mã)'} — ${x.license_plate}`" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="Loại việc">
              <el-select v-model="form.loai" style="width: 100%">
                <el-option label="Bảo dưỡng định kỳ" value="bao_duong" />
                <el-option label="Bảo trì, sửa chữa" value="bao_tri" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12">
            <el-form-item label="Ngày hẹn">
              <el-date-picker v-model="form.ngay_hen" type="date"
                              value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="Nhắc trước bao nhiêu ngày">
              <el-input-number v-model="form.nhac_truoc_ngay" :min="0" :max="60"
                               controls-position="right" style="width: 100%" />
              <span class="text-xs text-gray-400">Bot nhắc trước ngần này ngày, và nhắc lại đúng ngày hẹn.</span>
            </el-form-item>
          </el-col>

          <el-col :xs="24">
            <el-form-item label="Nội dung cần làm">
              <el-input v-model="form.noi_dung" type="textarea" :rows="2"
                        placeholder="VD: Thay nhớt, kiểm tra phanh, đảo lốp..." />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="hienForm = false">Hủy</el-button>
        <el-button type="primary" :loading="dangLuu" @click="luuForm">Xác nhận</el-button>
      </template>
    </el-dialog>

    <!-- ══════════════════ FORM ĐÁNH DẤU XONG ══════════════════ -->
    <el-dialog v-model="hienXong" title="Đánh dấu đã xong và hẹn lần tới"
               :width="hepMan ? '95%' : '600px'" align-center destroy-on-close>
      <div v-if="dangXong" class="mb-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-sm">
        <b>{{ maXe(dangXong.vehicle_id) }} — {{ bienSo(dangXong.vehicle_id) }}</b><br />
        <span class="text-xs text-gray-600 dark:text-gray-300">
          {{ dangXong.loai === 'bao_tri' ? 'Bảo trì' : 'Bảo dưỡng' }} ·
          hẹn ngày {{ ngayGon(dangXong.ngay_hen) }}
        </span>
      </div>

      <el-form :model="formXong" label-position="top">
        <el-row :gutter="14">
          <el-col :xs="24" :sm="12">
            <el-form-item label="Ngày đã làm">
              <el-date-picker v-model="formXong.ngay_hoan_thanh" type="date"
                              value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="Nơi sửa">
              <el-input v-model="formXong.noi_sua" placeholder="VD: Garage Thành Đạt" />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12">
            <el-form-item label="Chi phí (VNĐ)">
              <el-input-number v-model="formXong.chi_phi" :min="0" :step="100000"
                               controls-position="right" style="width: 100%" />
              <span class="text-xs text-gray-400">Chỉ ghi để xem, không vào sổ.</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="Ghi chú lần này">
              <el-input v-model="formXong.ghi_chu" />
            </el-form-item>
          </el-col>

          <el-col :xs="24">
            <div class="p-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-900/20">
              <div class="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">
                HẸN LẦN TỚI
              </div>
              <el-row :gutter="14">
                <el-col :xs="24" :sm="12">
                  <el-form-item label="Ngày hẹn lần tới">
                    <el-date-picker v-model="formXong.ngay_hen_ke_tiep" type="date"
                                    value-format="YYYY-MM-DD" style="width: 100%" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12">
                  <el-form-item label="Nội dung lần tới">
                    <el-input v-model="formXong.noi_dung_ke_tiep"
                              placeholder="Để trống thì lấy lại nội dung lần này" />
                  </el-form-item>
                </el-col>
              </el-row>
              <!-- ⚠️ Để trống là hợp lệ — có lần làm xong thì thôi, chưa
                   biết khi nào làm tiếp. Nói rõ để người dùng khỏi bịa
                   ra một ngày. -->
              <div class="text-xs text-gray-500 dark:text-gray-400">
                Điền ngày thì hệ thống tự đặt lịch mới và bot sẽ nhắc.
                Để trống cũng được — khi nào biết thì thêm lịch sau.
              </div>
            </div>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="hienXong = false">Hủy</el-button>
        <el-button type="primary" :loading="dangLuu" @click="luuXong">Xác nhận</el-button>
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
const hienXong = ref(false)
const dangXong = ref<any | null>(null)

const dsBaoTri = ref<any[]>([])
const dsXe = ref<any[]>([])
const dsNhom = ref<any[]>([])
const tuKhoa = ref('')
const locTrangThai = ref('')

const formRong = () => ({
  id: null as any, vehicle_id: '', loai: 'bao_duong', noi_dung: '',
  ngay_hen: null as any, nhac_truoc_ngay: 3,
})
const form = ref<any>(formRong())

const formXongRong = () => ({
  ngay_hoan_thanh: new Date().toISOString().split('T')[0],
  noi_sua: '', chi_phi: 0, ghi_chu: '',
  ngay_hen_ke_tiep: null as any, noi_dung_ke_tiep: '',
})
const formXong = ref<any>(formXongRong())

const xeTheoId = computed(() => {
  const m: Record<string, any> = {}
  for (const x of dsXe.value) m[x.id] = x
  return m
})

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

const tien = (v: any) => {
  const n = Number(v || 0)
  return n ? n.toLocaleString('vi-VN') + ' đ' : '—'
}

const chuHen = (d: any) => {
  const n = soNgayConLai(d)
  if (n === null) return 'Chưa đặt ngày'
  if (n < 0) return `Quá hẹn ${-n} ngày`
  if (n === 0) return 'ĐẾN HẸN HÔM NAY'
  return `Còn ${n} ngày`
}

const lopHen = (d: any) => {
  const n = soNgayConLai(d)
  if (n === null) return 'text-gray-400'
  if (n < 0) return 'text-red-600 dark:text-red-400'
  if (n <= 7) return 'text-amber-600 dark:text-amber-400'
  return 'text-green-600 dark:text-green-400'
}

const soDangCho = computed(() =>
  dsBaoTri.value.filter((b: any) => b.trang_thai !== 'da_xong').length)

const soQuaHan = computed(() =>
  dsBaoTri.value.filter((b: any) => {
    if (b.trang_thai === 'da_xong') return false
    const n = soNgayConLai(b.ngay_hen)
    return n !== null && n < 0
  }).length)

const daLoc = computed(() => {
  const k = tuKhoa.value.trim().toLowerCase()
  return dsBaoTri.value.filter((b: any) => {
    if (locTrangThai.value && b.trang_thai !== locTrangThai.value) return false
    if (!k) return true
    const x = xeTheoId.value[b.vehicle_id] || {}
    return [b.noi_dung, b.noi_sua, b.ghi_chu, x.vehicle_code, x.license_plate]
      .some((v) => String(v || '').toLowerCase().includes(k))
  })
})

const taiTatCa = async () => {
  dangTai.value = true
  try {
    const [bt, xe, nhom] = await Promise.all([
      vehicleService.getBaoTriXe(),
      vehicleService.getVehicles(),
      vehicleService.getNhomXe(),
    ])
    dsBaoTri.value = bt || []
    dsXe.value = xe || []
    dsNhom.value = nhom || []
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không tải được lịch bảo trì.')
  } finally {
    dangTai.value = false
  }
}

const moThem = () => {
  form.value = formRong()
  dangSua.value = false
  hienForm.value = true
}

const moSua = (b: any) => {
  form.value = { ...formRong(), ...b }
  dangSua.value = true
  hienForm.value = true
}

const luuForm = async () => {
  if (!form.value.vehicle_id) {
    ElMessage.warning('Phải chọn xe.')
    return
  }
  if (!form.value.ngay_hen) {
    ElMessage.warning('Phải có ngày hẹn, nếu không bot không nhắc được.')
    return
  }
  dangLuu.value = true
  try {
    const goi: any = {
      vehicle_id: form.value.vehicle_id,
      loai: form.value.loai,
      noi_dung: form.value.noi_dung || null,
      ngay_hen: form.value.ngay_hen,
      nhac_truoc_ngay: form.value.nhac_truoc_ngay ?? 3,
    }
    if (dangSua.value) {
      await vehicleService.updateBaoTriXe({ ...goi, id: form.value.id })
    } else {
      await vehicleService.addBaoTriXe(goi)
    }
    ElMessage.success('Đã lưu lịch.')
    hienForm.value = false
    await taiTatCa()
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không lưu được lịch.')
  } finally {
    dangLuu.value = false
  }
}

const moXong = (b: any) => {
  dangXong.value = b
  formXong.value = formXongRong()
  hienXong.value = true
}

const luuXong = async () => {
  if (!dangXong.value) return
  dangLuu.value = true
  try {
    const kq = await vehicleService.xongBaoTriXe({
      id: dangXong.value.id,
      ngay_hoan_thanh: formXong.value.ngay_hoan_thanh || null,
      chi_phi: formXong.value.chi_phi || null,
      noi_sua: formXong.value.noi_sua || null,
      ghi_chu: formXong.value.ghi_chu || null,
      ngay_hen_ke_tiep: formXong.value.ngay_hen_ke_tiep || null,
      noi_dung_ke_tiep: formXong.value.noi_dung_ke_tiep || null,
    })
    // Nói rõ ĐÃ ĐẶT LỊCH MỚI HAY CHƯA. Báo "thành công" trống thì người
    // dùng không biết lần tới có được nhắc không.
    if (kq && kq.ngay_hen_moi) {
      ElMessage.success(`Đã ghi xong. Lịch mới: ${ngayGon(kq.ngay_hen_moi)}.`)
    } else {
      ElMessage.success('Đã ghi xong. Chưa đặt lịch lần tới.')
    }
    hienXong.value = false
    await taiTatCa()
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không ghi được.')
  } finally {
    dangLuu.value = false
  }
}

const xoa = async (b: any) => {
  try {
    await ElMessageBox.confirm(
      `Xoá lịch ${b.loai === 'bao_tri' ? 'bảo trì' : 'bảo dưỡng'} ngày ` +
      `${ngayGon(b.ngay_hen)} của xe ${bienSo(b.vehicle_id)}?`,
      'Xác nhận xoá', { type: 'warning', confirmButtonText: 'Xoá', cancelButtonText: 'Hủy' })
  } catch {
    return
  }
  try {
    await vehicleService.deleteBaoTriXe(b.id)
    ElMessage.success('Đã xoá.')
    await taiTatCa()
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không xoá được.')
  }
}

onMounted(taiTatCa)
</script>
