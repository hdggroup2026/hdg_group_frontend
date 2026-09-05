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

      <!-- ══════════════════════════════════════════════════════════
           MỤC 523 (05/09/2026) — RÚT GỌN BẢNG PHỤ KIỆN

           s68 05/09: *"rút gọn luôn. Thông số chi tiết không cần coi
           thường xuyên nên ẩn cho gọn."*

           Đã dời vào hộp Chi tiết: số seri · tình trạng vật lý · giá mua
           · ngày mua · hết bảo hành · ghi chú · cột Thao tác.

           🔴 KHÁC sáu tab thiết bị và tab Bàn giao ở một điểm: tab này
           TRƯỚC ĐÓ KHÔNG CÓ hộp Chi tiết nào (đã tra cả file, chỉ có hộp
           Thêm/Sửa và hộp Gắn vào máy). Nên hộp Chi tiết bên dưới là
           DỰNG MỚI — ẩn cột mà không dựng nó là xoá thẳng bảy thứ khỏi
           màn hình, không còn đường nào xem lại.

           ⚠️ GIỮ cột Trạng thái, dù sáu tab thiết bị đã ẩn cột cùng tên.
           Ở đây nó không phải thông số: nó là bộ lọc chính ngay trên
           thanh công cụ, và là thứ trả lời "cục sạc này còn hay hỏng".
           ══════════════════════════════════════════════════════════ -->
      <el-table-column prop="id" label="Mã PK" width="106" show-overflow-tooltip>
        <template #default="{ row }">
          <button type="button"
                  class="font-mono font-bold text-blue-600 dark:text-blue-400 underline decoration-dotted underline-offset-2 hover:text-blue-800"
                  :title="`Xem đầy đủ thông tin của ${row.id}`"
                  @click.stop="moChiTiet(row)">
            {{ row.id }}
          </button>
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






    </el-table>

    <!-- ══════════════════ THẺ ══════════════════ -->
    <div v-if="hienThe" v-loading="dangTai" class="flex flex-col gap-3">
      <div v-for="row in trangHienTai" :key="row.id"
           class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
        <!-- MỤC 523 — thẻ dọc đi theo bảng: mã bấm được, bỏ nút ⋯ -->
        <div class="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
          <div class="min-w-0 break-words">
            <button type="button"
                    class="font-mono font-bold text-blue-600 dark:text-blue-400 underline decoration-dotted underline-offset-2"
                    @click.stop="moChiTiet(row)">
              {{ row.id }}
            </button>
            <span class="ml-2 font-semibold text-gray-800 dark:text-gray-100">{{ row.name || '—' }}</span>
          </div>
          <div class="shrink-0 text-xs text-gray-400">Bấm mã để xem đủ</div>
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

    <!-- ══════════════════════════════════════════════════════════════
         MỤC 523 (05/09/2026) — HỘP CHI TIẾT PHỤ KIỆN (DỰNG MỚI)

         Chứa ĐỦ bảy thứ vừa ẩn khỏi bảng, cộng bốn việc chuyển từ cột
         Thao tác xuống chân hộp.

         ⚠️ Mỗi ô dưới đây hiện y hệt cách bảng cũ hiện — cùng hàm
         `tien`, `ngayDayDu`, `lopHan`, `chuTrangThai`. Viết cách hiện
         riêng cho hộp này là hai chỗ định dạng cùng một con số, có ngày
         lệch nhau.
         ══════════════════════════════════════════════════════════════ -->
    <el-dialog v-model="hienChiTiet" :width="hienThe ? '95%' : '680px'"
               align-center destroy-on-close>
      <template #header>
        <span class="font-bold">
          CHI TIẾT PHỤ KIỆN
          <span class="text-blue-600 font-mono ml-1">{{ pkDangXem?.id }}</span>
        </span>
      </template>

      <div v-if="pkDangXem" class="text-left grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Loại</div>
          <div class="text-sm">
            <el-tag v-if="pkDangXem.accessory_type" size="small" effect="plain">{{ pkDangXem.accessory_type }}</el-tag>
            <span v-else class="text-gray-400">—</span>
          </div>
        </div>
        <div>
          <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Tên / model</div>
          <div class="text-sm font-bold text-gray-800 dark:text-gray-100">{{ pkDangXem.name || '—' }}</div>
        </div>
        <div>
          <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Hãng</div>
          <div class="text-sm">{{ pkDangXem.brand || '—' }}</div>
        </div>
        <div>
          <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Số seri</div>
          <div class="text-sm font-mono">{{ pkDangXem.serial_number || '—' }}</div>
        </div>
        <div>
          <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Đang ở máy</div>
          <div class="text-sm">
            <span v-if="pkDangXem.device_id" class="font-mono font-bold">{{ pkDangXem.device_id }}</span>
            <span v-else class="text-gray-500">Trong kho</span>
          </div>
        </div>
        <div>
          <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Trạng thái</div>
          <div class="text-sm">
            <el-tag size="small" :type="mauTrangThai(pkDangXem.status)" effect="dark" class="font-bold">
              {{ chuTrangThai(pkDangXem.status) }}
            </el-tag>
          </div>
        </div>
        <div>
          <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Tình trạng vật lý</div>
          <div class="text-sm">{{ pkDangXem.condition || '—' }}</div>
        </div>
        <div>
          <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Giá mua</div>
          <div class="text-sm font-mono">{{ tien(pkDangXem.purchase_price) }}</div>
        </div>
        <div>
          <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Ngày mua</div>
          <div class="text-sm font-mono">{{ pkDangXem.purchase_date ? ngayDayDu(pkDangXem.purchase_date) : '—' }}</div>
        </div>
        <div>
          <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Hết bảo hành</div>
          <div class="text-sm font-mono" :class="pkDangXem.warranty_expiry ? lopHan(pkDangXem.warranty_expiry) : ''">
            {{ pkDangXem.warranty_expiry ? ngayDayDu(pkDangXem.warranty_expiry) : '—' }}
          </div>
        </div>
        <div class="sm:col-span-2">
          <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Ghi chú</div>
          <div class="text-sm whitespace-pre-wrap">{{ pkDangXem.notes || 'Không có ghi chú nào thêm.' }}</div>
        </div>
      </div>

      <template #footer>
        <!-- MỤC 523 — bốn việc chuyển từ cột Thao tác. Đóng hộp Chi tiết
             TRƯỚC khi gọi việc khác: hai hộp thoại chồng nhau thì hộp
             dưới khoá cuộn của hộp trên. -->
        <el-button @click="viecTuChiTiet('sua')">Chỉnh sửa</el-button>
        <el-button @click="viecTuChiTiet('gan')">Gắn vào máy</el-button>
        <el-button v-if="pkDangXem?.device_id" @click="viecTuChiTiet('kho')">Trả về kho</el-button>
        <el-button class="!text-red-500" @click="viecTuChiTiet('xoa')">Xóa</el-button>
        <el-button type="primary" @click="hienChiTiet = false">Đóng</el-button>
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

// ══════════════════════════════════════════════════════════════════
// MỤC 523 (05/09/2026) — HỘP CHI TIẾT PHỤ KIỆN
// Xem lời ghi ở khối hộp thoại "CHI TIẾT PHỤ KIỆN" phía trên.
// ══════════════════════════════════════════════════════════════════
const hienChiTiet = ref(false)
const pkDangXem = ref<any | null>(null)

const moChiTiet = (row: any) => {
  pkDangXem.value = row
  hienChiTiet.value = true
}

const viecTuChiTiet = (lenh: string) => {
  const pk = pkDangXem.value
  if (!pk) return
  hienChiTiet.value = false
  chonLenh(lenh, pk)
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
