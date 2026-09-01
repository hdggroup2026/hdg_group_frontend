<!--
  MỤC 441 (01/09/2026) — TAB PHỤ KIỆN.

  s68 31/08: *"1 thiết bị có thể đi với phụ kiện nữa. Nghiên cứu thiết kế
  add phụ kiện luôn để quản lý luôn cả phụ kiện."*

  🔴 MỖI PHỤ KIỆN MỘT DÒNG CÓ MÃ, không đếm theo loại — lý do đầy đủ ở
  `app/models/device.py` lớp `Accessory`.

  🔴 GẮN MÁY LÀ CHUYỂN, KHÔNG PHẢI SAO CHÉP. Phụ kiện là vật thể; gắn vào
  máy mới thì tự rời máy cũ. Khác hẳn app (MỤC 436) — một tài khoản dùng
  chung nhiều máy là bình thường.

  ⚠️ Hai bản hiển thị: bảng cho màn rộng, thẻ cho màn hẹp. Sửa một bản là
  phải sửa bản kia (MỤC 424).
-->
<template>
  <div class="h-full overflow-auto">
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <el-input v-model="tuKhoa" placeholder="Tìm mã, tên, hãng, số seri..."
                clearable style="width: 240px" />

      <el-select v-model="locLoai" placeholder="Loại" clearable style="width: 140px">
        <el-option v-for="l in CAC_LOAI" :key="l" :label="l" :value="l" />
      </el-select>

      <el-select v-model="locTrangThai" placeholder="Trạng thái" clearable style="width: 150px">
        <el-option label="Đang dùng" value="in_use" />
        <el-option label="Trong kho" value="in_stock" />
        <el-option label="Hỏng" value="broken" />
        <el-option label="Mất" value="lost" />
        <el-option label="Đã thanh lý" value="disposed" />
      </el-select>

      <div class="flex-1"></div>

      <!-- Đếm nhanh, để nhìn là biết kho còn gì. -->
      <span class="text-sm text-gray-500 dark:text-gray-400">
        Tổng <b>{{ dsPhuKien.length }}</b> · trong kho <b>{{ soTrongKho }}</b>
      </span>

      <el-button :icon="Refresh" circle @click="taiDanhSach" />
      <el-button type="primary" :icon="Plus" @click="moThem">Thêm Phụ kiện</el-button>
    </div>

    <!-- ══════════════════ BẢNG ══════════════════ -->
    <el-table v-if="hienBang" :data="trangHienTai" v-loading="dangTai"
              border stripe size="small" class="w-full">
      <el-table-column label="STT" width="52" align="center">
        <template #default="{ $index }">{{ (trang - 1) * moiTrang + $index + 1 }}</template>
      </el-table-column>

      <el-table-column prop="id" label="Mã PK" width="90" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.id }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="accessory_type" label="Loại" width="104" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tag v-if="row.accessory_type" size="small" effect="plain">{{ row.accessory_type }}</el-tag>
          <span v-else class="text-gray-400">—</span>
        </template>
      </el-table-column>

      <el-table-column prop="name" label="Tên / model" min-width="150" show-overflow-tooltip />
      <el-table-column prop="brand" label="Hãng" width="94" show-overflow-tooltip />

      <el-table-column prop="serial_number" label="Số seri" width="116" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="font-mono text-xs">{{ row.serial_number || '—' }}</span>
        </template>
      </el-table-column>

      <!-- ⚠️ Rỗng thì hiện "Trong kho", KHÔNG hiện dấu gạch. Dấu gạch
           nghĩa là chưa có dữ liệu; đây là một sự thật đã biết. -->
      <el-table-column prop="device_id" label="Đang ở máy" width="116" align="center">
        <template #default="{ row }">
          <span v-if="row.device_id" class="font-mono font-bold text-xs">{{ row.device_id }}</span>
          <span v-else class="text-xs text-gray-500 dark:text-gray-400">Trong kho</span>
        </template>
      </el-table-column>

      <el-table-column prop="status" label="Trạng thái" width="104" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="mauTrangThai(row.status)" effect="dark" class="font-bold">
            {{ chuTrangThai(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="condition" label="Tình trạng" min-width="120" show-overflow-tooltip />

      <el-table-column prop="purchase_price" label="Giá mua" width="104" align="right">
        <template #default="{ row }">
          <span class="font-mono text-xs">{{ tien(row.purchase_price) }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="purchase_date" label="Ngày mua" width="86" align="center">
        <template #default="{ row }">
          <div v-if="row.purchase_date" class="font-mono text-xs leading-tight">
            <div class="whitespace-nowrap">{{ ngayThang(row.purchase_date) }}</div>
            <div class="whitespace-nowrap">{{ namCua(row.purchase_date) }}</div>
          </div>
          <span v-else class="text-gray-400">—</span>
        </template>
      </el-table-column>

      <el-table-column prop="warranty_expiry" label="Hết bảo hành" width="92" align="center">
        <template #default="{ row }">
          <span v-if="row.warranty_expiry" class="font-mono text-xs" :class="lopHan(row.warranty_expiry)">
            {{ ngayDayDu(row.warranty_expiry) }}
          </span>
          <span v-else class="text-gray-400">—</span>
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
                <el-dropdown-item command="gan">Gắn vào máy</el-dropdown-item>
                <el-dropdown-item v-if="row.device_id" command="kho">Trả về kho</el-dropdown-item>
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
            <span class="ml-2 font-semibold text-gray-800 dark:text-gray-100">{{ row.name || '—' }}</span>
          </div>
          <el-dropdown trigger="click" @command="(c: string) => chonLenh(c, row)">
            <el-button link><el-icon><MoreFilled /></el-icon></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="sua">Chỉnh sửa</el-dropdown-item>
                <el-dropdown-item command="gan">Gắn vào máy</el-dropdown-item>
                <el-dropdown-item v-if="row.device_id" command="kho">Trả về kho</el-dropdown-item>
                <el-dropdown-item command="xoa" divided class="!text-red-500">Xóa</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <div class="flex flex-col gap-2 text-sm">
          <div class="flex justify-between gap-3">
            <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Loại:</span>
            <span class="text-right break-words min-w-0 text-xs">{{ row.accessory_type || '—' }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Hãng:</span>
            <span class="text-right break-words min-w-0 text-xs">{{ row.brand || '—' }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Số seri:</span>
            <span class="text-right break-words min-w-0 font-mono text-xs">{{ row.serial_number || '—' }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Đang ở máy:</span>
            <span class="text-right break-words min-w-0 text-xs">
              <span v-if="row.device_id" class="font-mono font-bold">{{ row.device_id }}</span>
              <span v-else class="text-gray-500 dark:text-gray-400">Trong kho</span>
            </span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Trạng thái:</span>
            <span class="text-right break-words min-w-0">
              <el-tag size="small" :type="mauTrangThai(row.status)" effect="dark" class="font-bold">
                {{ chuTrangThai(row.status) }}
              </el-tag>
            </span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Giá mua:</span>
            <span class="text-right break-words min-w-0 font-mono text-xs">{{ tien(row.purchase_price) }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Hết bảo hành:</span>
            <span class="text-right break-words min-w-0 font-mono text-xs" :class="lopHan(row.warranty_expiry)">
              {{ row.warranty_expiry ? ngayDayDu(row.warranty_expiry) : '—' }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="!dangTai && trangHienTai.length === 0" class="text-center text-gray-400 py-8">
        Chưa có phụ kiện nào. Bấm “Thêm Phụ kiện” để bắt đầu.
      </div>
    </div>

    <div class="mt-4 flex justify-end">
      <el-pagination v-model:current-page="trang" v-model:page-size="moiTrang"
                     :total="daLoc.length" :page-sizes="[10, 20, 50]"
                     layout="total, sizes, prev, pager, next" background />
    </div>

    <!-- ══════════════════ FORM ══════════════════ -->
    <el-dialog v-model="hienForm" :title="dangSua ? 'Chỉnh sửa Phụ kiện' : 'Thêm Phụ kiện'"
               width="680px" align-center destroy-on-close>
      <el-form :model="form" label-position="top">
        <el-row :gutter="14">
          <el-col :xs="24" :sm="8">
            <el-form-item label="Mã phụ kiện">
              <!-- ⚠️ Khoá khi sửa. Mã này là thứ dán lên chính cái phụ
                   kiện ngoài đời; đổi trong máy mà nhãn ngoài đời không
                   đổi là hai bên nói hai chuyện. -->
              <el-input v-model="form.id" :disabled="dangSua" placeholder="VD: PK001" />
              <span v-if="dangSua" class="text-xs text-gray-400">
                Không sửa — mã này dán trên vật thật.
              </span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="Loại">
              <el-select v-model="form.accessory_type" style="width: 100%" clearable allow-create filterable>
                <el-option v-for="l in CAC_LOAI" :key="l" :label="l" :value="l" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="Hãng"><el-input v-model="form.brand" /></el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12">
            <el-form-item label="Tên / model"><el-input v-model="form.name" placeholder="VD: Củ sạc Apple 20W" /></el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="Số seri"><el-input v-model="form.serial_number" /></el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12">
            <el-form-item label="Trạng thái">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="Đang dùng" value="in_use" />
                <el-option label="Trong kho" value="in_stock" />
                <el-option label="Hỏng" value="broken" />
                <el-option label="Mất" value="lost" />
                <el-option label="Đã thanh lý" value="disposed" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="Tình trạng vật lý">
              <el-input v-model="form.condition" placeholder="VD: còn mới, xước nhẹ" />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="8">
            <el-form-item label="Ngày mua">
              <el-date-picker v-model="form.purchase_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="Giá mua (VNĐ)">
              <el-input-number v-model="form.purchase_price" :min="0" :step="10000"
                               controls-position="right" style="width: 100%" />
              <span class="text-xs text-gray-400">Chỉ ghi để xem, không vào sổ.</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="Hết hạn bảo hành">
              <el-date-picker v-model="form.warranty_expiry" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>

          <el-col :xs="24">
            <el-form-item label="Ghi chú">
              <el-input v-model="form.notes" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="hienForm = false">Hủy</el-button>
        <el-button type="primary" :loading="dangLuu" @click="luuForm">Xác nhận</el-button>
      </template>
    </el-dialog>

    <!-- ══════════════════ GẮN VÀO MÁY ══════════════════ -->
    <el-dialog v-model="hienGan" width="520px" align-center destroy-on-close>
      <template #header>
        <span class="font-bold">GẮN <span class="text-blue-600 font-mono">{{ pkDangGan?.id }}</span> VÀO MÁY</span>
      </template>

      <div v-loading="dangTaiMay" class="space-y-3">
        <!-- 🔴 Nói TRƯỚC hậu quả. Phụ kiện là vật thể, gắn máy mới là rời
             máy cũ — không phải nhân bản như app. -->
        <el-alert v-if="pkDangGan?.device_id" type="info" show-icon :closable="false"
                  :title="`Phụ kiện này đang ở máy ${pkDangGan.device_id}.`"
                  description="Chọn máy khác là nó rời máy cũ — một cục sạc không ở hai chỗ cùng lúc." />

        <el-select v-model="mayDuocChon" filterable clearable style="width: 100%"
                   placeholder="Chọn máy, hoặc để trống = trả về kho">
          <el-option v-for="m in dsMay" :key="m.khoa" :value="m.khoa"
                     :label="`${m.device_id} — ${m.ten} (${nhanLoai(m.device_type)})`" />
        </el-select>
      </div>

      <template #footer>
        <el-button @click="hienGan = false">Hủy</el-button>
        <el-button type="primary" :loading="dangLuuGan" @click="luuGan">
          {{ mayDuocChon ? 'Gắn vào máy' : 'Trả về kho' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MoreFilled, Plus, Refresh } from '@element-plus/icons-vue'
import { otherService } from '@/api/otherService'
import { dungManHep } from '@/composables/manHep'

const { hienBang, hienThe } = dungManHep()

const CAC_LOAI = [
  'Sạc', 'Cáp', 'Tai nghe', 'Ốp lưng', 'Chuột', 'Bàn phím',
  'Túi / Balo', 'Adapter', 'Chân đế', 'Thẻ nhớ', 'Khác',
]

const dsPhuKien = ref<any[]>([])
const dangTai = ref(false)
const tuKhoa = ref('')
const locLoai = ref('')
const locTrangThai = ref('')
const trang = ref(1)
const moiTrang = ref(10)

const daLoc = computed(() => {
  const k = tuKhoa.value.trim().toLowerCase()
  return dsPhuKien.value.filter((a) => {
    if (locLoai.value && a.accessory_type !== locLoai.value) return false
    if (locTrangThai.value && a.status !== locTrangThai.value) return false
    if (!k) return true
    return [a.id, a.name, a.brand, a.serial_number, a.device_id]
      .some((v) => String(v || '').toLowerCase().includes(k))
  })
})

const trangHienTai = computed(() => {
  const dau = (trang.value - 1) * moiTrang.value
  return daLoc.value.slice(dau, dau + moiTrang.value)
})

const soTrongKho = computed(() =>
  dsPhuKien.value.filter((a) => !a.device_id).length)

const taiDanhSach = async () => {
  dangTai.value = true
  try {
    dsPhuKien.value = await otherService.getAccessories() || []
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không tải được danh sách phụ kiện.')
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

const formRong = () => ({
  id: '', accessory_type: '', name: '', brand: '', serial_number: '',
  device_id: null as any, device_type: null as any, status: 'in_stock',
  condition: '', purchase_date: null as any, purchase_price: 0,
  warranty_expiry: null as any, notes: '',
})

const form = reactive<any>(formRong())

const moThem = () => { Object.assign(form, formRong()); dangSua.value = false; hienForm.value = true }
const moSua = (row: any) => { Object.assign(form, formRong(), row); dangSua.value = true; hienForm.value = true }

const luuForm = async () => {
  if (!form.id?.trim()) { ElMessage.warning('Phải có Mã phụ kiện.'); return }
  dangLuu.value = true
  try {
    if (dangSua.value) await otherService.updateAccessories([{ ...form }])
    else await otherService.addAccessories([{ ...form }])
    ElMessage.success(dangSua.value ? 'Đã cập nhật.' : 'Đã thêm phụ kiện.')
    hienForm.value = false
    await taiDanhSach()
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không lưu được.')
  } finally {
    dangLuu.value = false
  }
}

const xoaPhuKien = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `Xoá phụ kiện ${row.id}${row.name ? ' — ' + row.name : ''}?`,
      'Xác nhận xoá', { type: 'warning', confirmButtonText: 'Xoá', cancelButtonText: 'Hủy' })
  } catch { return }
  try {
    await otherService.deleteAccessories([row.id])
    ElMessage.success('Đã xoá.')
    await taiDanhSach()
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không xoá được.')
  }
}

// ══════════════════════════════════════════════════════════════════════
// GẮN VÀO MÁY
//
// 🔴 Khoá chọn là `<loại>|<mã máy>`, không phải mã máy trần — sáu bảng
// thiết bị riêng, hai loại trùng mã thì gắn nhầm (bài học MỤC 436).
// ══════════════════════════════════════════════════════════════════════
const hienGan = ref(false)
const dangTaiMay = ref(false)
const dangLuuGan = ref(false)
const pkDangGan = ref<any>(null)
const dsMay = ref<any[]>([])
const mayDuocChon = ref('')

const nhanLoai = (loai: string) => ({
  smartphone: 'Điện thoại', tablet: 'Máy tính bảng', laptop: 'Laptop',
  screen: 'Màn hình', camera: 'Camera', other: 'Khác',
}[loai] || loai)

const moGan = async (row: any) => {
  pkDangGan.value = row
  mayDuocChon.value = row.device_id ? `${row.device_type || 'smartphone'}|${row.device_id}` : ''
  hienGan.value = true
  dangTaiMay.value = true
  try {
    const [dt, mtb, lt, mh, cam, khac] = await Promise.all([
      otherService.getSmartphones(), otherService.getTablets(),
      otherService.getLaptops(), otherService.getScreens(),
      otherService.getCameras(), otherService.getOtherDevices(),
    ])
    const gom = (ds: any[], loai: string) => (ds || []).map((m) => ({
      khoa: `${loai}|${m.id}`, device_id: m.id, device_type: loai,
      ten: m.model_name || m.brand || '',
    }))
    dsMay.value = [
      ...gom(dt, 'smartphone'), ...gom(mtb, 'tablet'), ...gom(lt, 'laptop'),
      ...gom(mh, 'screen'), ...gom(cam, 'camera'), ...gom(khac, 'other'),
    ]
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không tải được danh sách máy.')
  } finally {
    dangTaiMay.value = false
  }
}

const luuGan = async () => {
  if (!pkDangGan.value) return
  dangLuuGan.value = true
  try {
    let maMay: string | undefined
    let loaiMay: string | undefined
    if (mayDuocChon.value) {
      const [loai, ...phan] = mayDuocChon.value.split('|')
      loaiMay = loai
      maMay = phan.join('|')
    }
    await otherService.ganPhuKien([pkDangGan.value.id], maMay, loaiMay)
    ElMessage.success(maMay ? `Đã gắn vào ${maMay}.` : 'Đã trả về kho.')
    hienGan.value = false
    await taiDanhSach()
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không lưu được.')
  } finally {
    dangLuuGan.value = false
  }
}

const traVeKho = async (row: any) => {
  try {
    await otherService.ganPhuKien([row.id])
    ElMessage.success('Đã trả về kho.')
    await taiDanhSach()
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không lưu được.')
  }
}

const chonLenh = (lenh: string, row: any) => {
  if (lenh === 'sua') moSua(row)
  else if (lenh === 'gan') moGan(row)
  else if (lenh === 'kho') traVeKho(row)
  else if (lenh === 'xoa') xoaPhuKien(row)
}

// ══════════════════════════════════════════════════════════════════════
// HIỂN THỊ
// ══════════════════════════════════════════════════════════════════════
const chuTrangThai = (tt: string) => ({
  in_use: 'Đang dùng', in_stock: 'Trong kho', broken: 'Hỏng',
  lost: 'Mất', disposed: 'Đã thanh lý',
}[tt] || 'Chưa rõ')

const mauTrangThai = (tt: string) => ({
  in_use: 'success', in_stock: 'info', broken: 'warning',
  lost: 'danger', disposed: 'info',
}[tt] as any || 'info')

const tien = (v: any) => {
  const so = Number(v || 0)
  return so ? so.toLocaleString('vi-VN') + ' đ' : '—'
}

const ngayThang = (d: any) => {
  const p = String(d || '').split('-')
  return p.length >= 3 ? `${p[2]}/${p[1]}` : String(d || '')
}
const namCua = (d: any) => {
  const p = String(d || '').split('-')
  return p.length >= 3 ? p[0] : ''
}
const ngayDayDu = (d: any) => {
  const p = String(d || '').split('-')
  return p.length >= 3 ? `${p[2]}/${p[1]}/${p[0]}` : String(d || '')
}

// ⚠️ Cảnh báo hạn: đỏ khi đã hết, hổ phách khi còn dưới 30 ngày. Hết hạn
// rồi mà vẫn hiện màu thường thì không ai để ý.
const lopHan = (d: any) => {
  if (!d) return ''
  const con = (new Date(d).getTime() - Date.now()) / 86400000
  if (con < 0) return 'text-red-600 dark:text-red-400 font-bold'
  if (con < 30) return 'text-amber-600 dark:text-amber-400 font-bold'
  return ''
}
</script>
