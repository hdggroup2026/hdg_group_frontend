<!--
  ══════════════════════════════════════════════════════════════════════
  MỤC 704 (10/10/2026) — BẢO HIỂM · ĐĂNG KIỂM · BẢO DƯỠNG NGAY TRONG HỘP
  "CHỈNH SỬA THÔNG TIN PHƯƠNG TIỆN"

  s68: *"thông tin hợp đồng ... đã có và liên kết phương tiện rồi thì hiển thị
  trong hình 1 luôn. thêm mục add đăng kiểm trong hình 1. thông tin add hợp
  đồng bảo hiểm cũng trong hình 1 có nút add luôn. hình 1 hiển thị luôn chi
  tiết bảo dưỡng luôn"*.

  🔴 CÙNG API, CÙNG BẢNG với ba tab Bảo hiểm / Đăng kiểm / Bảo trì — đây chỉ là
  một cửa khác vào cùng dữ liệu. Thêm ở đây là tab kia thấy ngay và ngược lại.
  Không giữ bản sao nào ở đây.

  Mỗi khối LƯU NGAY khi bấm "Lưu" của hộp nhỏ (độc lập với nút "Xác nhận" của
  hộp xe) — để không có chuyện thêm hợp đồng rồi bấm Hủy hộp xe tưởng là mất.
  Sửa / xoá chi tiết vẫn làm ở các tab (ở đây chỉ thêm + xem, cho gọn).
  ══════════════════════════════════════════════════════════════════════
-->
<template>
  <div v-loading="dangTai" class="space-y-4">
    <!-- BẢO HIỂM -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Bảo hiểm ({{ dsBH.length }})</h4>
        <el-button size="small" type="primary" plain @click="moHop('bh')">+ Thêm hợp đồng</el-button>
      </div>
      <div v-if="!dsBH.length" class="text-xs text-red-600">Xe chưa có hợp đồng bảo hiểm nào.</div>
      <div v-for="h in dsBH" :key="h.id"
           class="flex flex-wrap justify-between gap-2 text-xs py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
        <span><b>{{ h.loai_bao_hiem || 'Chưa ghi loại' }}</b> · HĐ {{ h.so_hop_dong || '—' }}<span v-if="h.cong_ty"> · {{ h.cong_ty }}</span></span>
        <span class="font-mono" :class="mau(h.ngay_het_han, 30)">{{ ngay(h.ngay_bat_dau) }} → {{ ngay(h.ngay_het_han) }} {{ chuCon(h.ngay_het_han) }}</span>
      </div>
    </div>

    <!-- ĐĂNG KIỂM (chỉ ô tô) -->
    <div v-if="canDangKiem">
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Đăng kiểm ({{ dsDK.length }})</h4>
        <el-button size="small" type="danger" plain @click="moHop('dk')">+ Thêm đăng kiểm</el-button>
      </div>
      <div v-if="!dsDK.length" class="text-xs text-red-600 font-semibold">🔴 Chưa khai đăng kiểm — bot nhắc mỗi thứ Hai tới khi có.</div>
      <div v-for="d in dsDK" :key="d.id"
           class="flex flex-wrap justify-between gap-2 text-xs py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
        <span>Tem {{ d.so_tem || '—' }}<span v-if="d.noi_kiem"> · {{ d.noi_kiem }}</span> · kiểm {{ ngay(d.ngay_kiem_dinh) }}</span>
        <span class="font-mono font-semibold" :class="mau(d.ngay_het_han, 15)">hết hạn {{ ngay(d.ngay_het_han) }} {{ chuCon(d.ngay_het_han) }}</span>
      </div>
    </div>

    <!-- BẢO DƯỠNG -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Bảo dưỡng ({{ dsBT.length }})</h4>
        <el-button size="small" type="success" plain @click="moHop('bt')">+ Ghi bảo dưỡng</el-button>
      </div>
      <div v-if="!dsBT.length" class="text-xs text-gray-500">
        Chưa có lịch sử. Ghi ở đây, hoặc gõ <code>/baoduong</code> trong nhóm Telegram của xe.
      </div>
      <div v-for="b in dsBT" :key="b.id"
           class="flex flex-wrap justify-between gap-2 text-xs py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
        <span>
          <el-tag size="small" :type="b.trang_thai === 'da_xong' ? 'success' : (b.trang_thai === 'dang_cho' ? 'warning' : 'info')" effect="plain">
            {{ b.trang_thai === 'da_xong' ? 'Đã làm' : (b.trang_thai === 'dang_cho' ? 'Lịch hẹn' : 'Đã huỷ') }}</el-tag>
          <span class="ml-1">{{ b.noi_dung || '(chưa ghi nội dung)' }}</span>
          <span v-if="b.chi_phi" class="text-gray-400"> · {{ tien(b.chi_phi) }} đ</span>
        </span>
        <span class="font-mono">{{ ngay(b.trang_thai === 'da_xong' ? b.ngay_hoan_thanh : b.ngay_hen) }}</span>
      </div>
    </div>

    <!-- HỘP NHỎ THÊM -->
    <el-dialog v-model="hienHop" :title="tieuDeHop" width="520px" append-to-body align-center destroy-on-close>
      <el-form label-position="top">
        <template v-if="loaiHop === 'bh'">
          <el-form-item label="Loại bảo hiểm">
            <el-select v-model="f.loai_bao_hiem" allow-create filterable clearable style="width: 100%">
              <el-option v-for="o in LOAI_BH" :key="o" :label="o" :value="o" />
            </el-select>
          </el-form-item>
          <el-form-item label="Số hợp đồng"><el-input v-model="f.so_hop_dong" /></el-form-item>
          <el-form-item label="Công ty bảo hiểm"><el-input v-model="f.cong_ty" /></el-form-item>
          <el-form-item label="Ngày bắt đầu"><el-date-picker v-model="f.ngay_bat_dau" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        </template>
        <template v-else-if="loaiHop === 'dk'">
          <el-form-item label="Số tem / số giấy chứng nhận"><el-input v-model="f.so_tem" /></el-form-item>
          <el-form-item label="Trung tâm đăng kiểm"><el-input v-model="f.noi_kiem" /></el-form-item>
          <el-form-item label="Ngày kiểm định"><el-date-picker v-model="f.ngay_kiem_dinh" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        </template>
        <template v-else>
          <el-radio-group v-model="f.kieu" class="mb-3">
            <el-radio-button value="da_lam">Lần ĐÃ LÀM</el-radio-button>
            <el-radio-button value="hen">Lịch hẹn sắp tới</el-radio-button>
          </el-radio-group>
          <el-form-item label="Nội dung"><el-input v-model="f.noi_dung" placeholder="VD: Thay nhớt, lọc gió" /></el-form-item>
          <el-form-item v-if="f.kieu === 'da_lam'" label="Chi phí (đ) — ghi để xem">
            <el-input-number v-model="f.chi_phi" :min="0" :step="10000" controls-position="right" style="width: 100%" />
          </el-form-item>
        </template>
        <el-form-item :label="nhanNgayChinh">
          <el-date-picker v-model="f.ngay" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="hienHop = false">Hủy</el-button>
        <el-button type="primary" :loading="dangLuu" @click="luu">Lưu</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { vehicleService } from '@/api/vehicleService'

const props = defineProps<{ vehicleId: string; vehicleType: string }>()
const emit = defineEmits<{ (e: 'doi'): void }>()

// CÙNG danh sách với `bot/utils/nhac_phuong_tien.py` LOAI_CAN_DANG_KIEM.
const canDangKiem = computed(() => ['car', 'truck', 'container'].includes(props.vehicleType))
const LOAI_BH = ['TNDS bắt buộc', 'TNDS tự nguyện', 'Vật chất xe', 'Tai nạn người ngồi trên xe']

const dangTai = ref(false)
const dsBH = ref<any[]>([])
const dsDK = ref<any[]>([])
const dsBT = ref<any[]>([])

const tai = async () => {
  if (!props.vehicleId) return
  dangTai.value = true
  try {
    const [bh, dk, bt] = await Promise.all([
      vehicleService.getBaoHiemXe(props.vehicleId),
      canDangKiem.value ? vehicleService.getDangKiemXe(props.vehicleId) : Promise.resolve([]),
      vehicleService.getBaoTriXe({ vehicle_id: props.vehicleId }),
    ])
    dsBH.value = bh || []
    dsDK.value = (dk || []).slice().sort((a: any, b: any) => String(b.ngay_het_han).localeCompare(String(a.ngay_het_han)))
    // Mới nhất lên trên: lịch hẹn theo ngày hẹn, lần đã làm theo ngày làm.
    dsBT.value = (bt || []).slice().sort((a: any, b: any) =>
      String(b.ngay_hoan_thanh || b.ngay_hen || '').localeCompare(String(a.ngay_hoan_thanh || a.ngay_hen || '')))
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không tải được bảo hiểm / đăng kiểm / bảo dưỡng của xe.')
  } finally {
    dangTai.value = false
  }
}
onMounted(tai)

const hienHop = ref(false)
const dangLuu = ref(false)
const loaiHop = ref<'bh' | 'dk' | 'bt'>('bh')
const f = ref<any>({})
const tieuDeHop = computed(() => ({ bh: 'Thêm hợp đồng bảo hiểm', dk: 'Thêm đăng kiểm', bt: 'Ghi bảo dưỡng' }[loaiHop.value]))
const nhanNgayChinh = computed(() => {
  if (loaiHop.value === 'bt') return f.value.kieu === 'da_lam' ? 'Ngày đã làm' : 'Ngày hẹn'
  return loaiHop.value === 'dk' ? 'Ngày hết hạn đăng kiểm (bắt buộc)' : 'Ngày hết hạn (bắt buộc)'
})
const moHop = (loai: 'bh' | 'dk' | 'bt') => {
  loaiHop.value = loai
  f.value = { kieu: 'da_lam', ngay: null, chi_phi: null }
  hienHop.value = true
}

const luu = async () => {
  if (!f.value.ngay) {
    ElMessage.warning('Phải có ngày — không có ngày thì bot không nhắc / không tính được hạn.')
    return
  }
  dangLuu.value = true
  try {
    const x = props.vehicleId
    if (loaiHop.value === 'bh') {
      await vehicleService.addBaoHiemXe({ vehicle_id: x, loai_bao_hiem: f.value.loai_bao_hiem || null,
        so_hop_dong: f.value.so_hop_dong || null, cong_ty: f.value.cong_ty || null,
        ngay_bat_dau: f.value.ngay_bat_dau || null, ngay_het_han: f.value.ngay })
    } else if (loaiHop.value === 'dk') {
      await vehicleService.addDangKiemXe({ vehicle_id: x, so_tem: f.value.so_tem || null,
        noi_kiem: f.value.noi_kiem || null, ngay_kiem_dinh: f.value.ngay_kiem_dinh || null,
        ngay_het_han: f.value.ngay })
    } else {
      const goi: any = { vehicle_id: x, loai: 'bao_duong', noi_dung: f.value.noi_dung || null,
        ngay_hen: f.value.ngay, nhac_truoc_ngay: 3 }
      if (f.value.kieu === 'da_lam') {
        goi.da_lam_ngay = f.value.ngay
        goi.chi_phi = f.value.chi_phi || null   // máy chủ nhận kèm (MỤC 704)
      }
      await vehicleService.addBaoTriXe(goi)
    }
    ElMessage.success('Đã lưu.')
    hienHop.value = false
    await tai()
    emit('doi')
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không lưu được.')
  } finally {
    dangLuu.value = false
  }
}

const ngay = (d: any) => {
  if (!d) return '—'
  const t = String(d).slice(0, 10).split('-')
  return t.length === 3 ? `${t[2]}/${t[1]}/${t[0]}` : String(d)
}
const conLai = (d: any) => {
  if (!d) return null
  const h = new Date(); h.setHours(0, 0, 0, 0)
  const x = new Date(String(d).slice(0, 10)); x.setHours(0, 0, 0, 0)
  return Math.round((x.getTime() - h.getTime()) / 86400000)
}
const chuCon = (d: any) => {
  const n = conLai(d)
  if (n === null) return ''
  return n < 0 ? `(quá ${-n} ngày)` : n === 0 ? '(HÔM NAY)' : `(còn ${n} ngày)`
}
const mau = (d: any, sap: number) => {
  const n = conLai(d)
  if (n === null) return 'text-gray-500'
  return n < 0 ? 'text-red-600 dark:text-red-400' : n <= sap ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'
}
const tien = (x: number) => new Intl.NumberFormat('vi-VN').format(x)
</script>
