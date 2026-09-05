<!--
  MỤC 530 (05/09/2026), sửa ở MỤC 533 — NHÓM TELEGRAM PHỤ TRÁCH MỘT CHIẾC XE.

  🔴 MỤC 533: s68 chốt *"Mỗi nhóm 1 xe."* — gắn theo TỪNG XE, không theo
  loại xe như bản đầu.

  s68 05/09/2026: *"Từng loại phương tiện thêm nhóm liên kết. Add nhóm liên
  kết trực tiếp trên web, add đúng chatid và dưới nhóm xác nhận hoặc từ
  chối."*

  🔴 LIÊN KẾT MỚI TẠO CHƯA CÓ HIỆU LỰC. Người gõ chat_id có thể gõ nhầm một
  chữ số và trỏ vào nhóm của người khác — hậu quả không phải "không chạy",
  mà là cảnh báo bảo hiểm bắn sang nhóm lạ, còn xe thật thì không ai nhắc.
  Kiểu hỏng đó không ai phát hiện cho tới lúc hết hạn bảo hiểm thật.

  Nên bot gửi tin xin xác nhận xuống chính nhóm đó, nhóm bấm ✅ mới dùng.
  Chỉ OWNER/ADMIN bấm được — s68 chốt.
-->
<template>
  <div class="h-full flex flex-col">
    <!-- ══════════════════ THANH CÔNG CỤ ══════════════════ -->
    <div class="flex flex-wrap items-center gap-3 mb-3 shrink-0">
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Xe:</span>
      <el-select v-model="locXe" placeholder="Tất cả xe" clearable filterable style="width: 240px">
        <el-option v-for="x in dsXe" :key="x.id" :value="x.id"
                   :label="`${x.vehicle_code || '(chưa có mã)'} — ${x.license_plate}`" />
      </el-select>

      <div class="flex-1"></div>

      <span class="text-sm text-gray-500 dark:text-gray-400">
        <b>{{ soDaXacNhan }}</b> đã xác nhận
        <span v-if="soChoXacNhan" class="ml-2 text-amber-600 dark:text-amber-400 font-bold">
          · {{ soChoXacNhan }} đang chờ
        </span>
      </span>

      <el-button :icon="Refresh" circle @click="taiDanhSach" :loading="dangTai" />
      <el-button type="primary" :icon="Plus" @click="moThem">Thêm nhóm liên kết</el-button>
    </div>

    <!-- ══════════════════ DANH SÁCH ══════════════════
         Dùng thẻ cho mọi cỡ màn hình: mỗi liên kết chỉ có 5 thông tin,
         bảng ngang là thừa và trên điện thoại lại phải vuốt.
         ══════════════════════════════════════════════════════════════ -->
    <div v-loading="dangTai" class="flex-1 min-h-0 overflow-y-auto pr-1">
      <div v-if="daLoc.length" class="flex flex-col gap-3">
        <div
          v-for="n in daLoc"
          :key="n.id"
          class="rounded-xl border bg-white dark:bg-gray-800 p-3"
          :class="n.trang_thai === 'da_xac_nhan'
                    ? 'border-green-200 dark:border-green-900/60'
                    : n.trang_thai === 'tu_choi'
                      ? 'border-red-200 dark:border-red-900/60'
                      : 'border-amber-200 dark:border-amber-900/60'"
        >
          <div class="flex flex-wrap items-center gap-2 mb-2">
            <el-tag size="small" :type="mauTrangThai(n.trang_thai)" effect="dark" class="font-bold">
              {{ chuTrangThai(n.trang_thai) }}
            </el-tag>
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400">
              {{ maXe(n.vehicle_id) }}
            </span>
            <span class="font-bold text-gray-800 dark:text-gray-100">{{ bienSo(n.vehicle_id) }}</span>
            <span class="font-semibold text-gray-800 dark:text-gray-100 break-words">
              {{ n.group_name || '(chưa có tên nhóm)' }}
            </span>
          </div>

          <div class="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-300">
            <div>Chat ID: <span class="font-mono select-all">{{ n.chat_id }}</span></div>
            <div v-if="n.nguoi_xac_nhan">
              {{ n.trang_thai === 'tu_choi' ? 'Người từ chối' : 'Người xác nhận' }}:
              <b>{{ n.nguoi_xac_nhan }}</b>
            </div>
            <!-- ⚠️ Trạng thái chờ thì nói rõ PHẢI LÀM GÌ, không chỉ nói là chờ. -->
            <div v-if="n.trang_thai === 'cho_xac_nhan'" class="text-amber-700 dark:text-amber-400">
              Đang chờ nhóm bấm ✅ trong Telegram. Không thấy tin nhắn nào trong
              nhóm nghĩa là <b>bot chưa được thêm vào nhóm đó</b> — thêm bot rồi
              bấm "Gửi lại lời mời".
            </div>
          </div>

          <div class="flex flex-wrap gap-2 mt-3">
            <el-button v-if="n.trang_thai !== 'da_xac_nhan'" size="small"
                       :loading="dangGui === n.id" @click="guiLai(n)">
              Gửi lại lời mời
            </el-button>
            <el-button size="small" class="!text-red-500" @click="xoa(n)">Xoá liên kết</el-button>
          </div>
        </div>
      </div>

      <div v-else-if="!dangTai" class="text-center text-gray-400 py-10 text-sm">
        Chưa có nhóm liên kết nào.<br />
        Bấm <b>Thêm nhóm liên kết</b> ở góc trên bên phải, nhập Chat ID nhóm
        Telegram, rồi vào nhóm đó bấm <b>✅ Xác nhận</b>.
      </div>
    </div>

    <!-- ══════════════════ FORM THÊM ══════════════════ -->
    <el-dialog v-model="hienForm" title="Thêm nhóm liên kết"
               :width="hepMan ? '95%' : '560px'" align-center destroy-on-close>
      <el-form :model="form" label-position="top">
        <el-form-item label="Xe">
          <el-select v-model="form.vehicle_id" placeholder="Chọn xe..." filterable style="width: 100%">
            <el-option v-for="x in dsXe" :key="x.id" :value="x.id"
                       :label="`${x.vehicle_code || '(chưa có mã)'} — ${x.license_plate}`" />
          </el-select>
          <!-- 🔴 s68 chốt "Mỗi nhóm 1 xe": một nhóm Telegram chỉ phụ trách
               đúng một xe. Máy chủ chặn nếu nhóm đó đang giữ xe khác, và
               nói rõ đang giữ xe nào. -->
          <span class="text-xs text-gray-400">
            Mỗi nhóm Telegram chỉ phụ trách một xe. Một xe vẫn gắn được
            nhiều nhóm.
          </span>
        </el-form-item>

        <el-form-item label="Chat ID nhóm Telegram">
          <el-input v-model="form.chat_id" placeholder="VD: -1001234567890" />
          <span class="text-xs text-gray-400">
            Nhóm Telegram có Chat ID bắt đầu bằng dấu trừ. Lấy bằng lệnh
            <b>/chat_id</b> gõ ngay trong nhóm đó.
          </span>
        </el-form-item>

        <el-form-item label="Tên nhóm (ghi để dễ nhớ)">
          <el-input v-model="form.group_name" placeholder="VD: HDG - Đội xe tải" />
          <span class="text-xs text-gray-400">
            Không bắt buộc. Khi nhóm bấm xác nhận, hệ thống tự lấy tên thật
            từ Telegram và ghi đè lên chỗ này.
          </span>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="text-xs text-gray-400 mr-3 block text-left sm:inline">
          Lưu xong bot sẽ gửi tin xin xác nhận xuống nhóm.
        </span>
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
const dangGui = ref<string | null>(null)
const dsNhom = ref<any[]>([])
const dsXe = ref<any[]>([])
const locXe = ref('')
const hienForm = ref(false)

const form = ref<any>({ vehicle_id: '', chat_id: '', group_name: '' })

// MỤC 533 — tra xe theo id. Dựng dict MỘT lần, không tìm tuyến tính
// trong mỗi lần vẽ một thẻ.
const xeTheoId = computed(() => {
  const m: Record<string, any> = {}
  for (const x of dsXe.value) m[x.id] = x
  return m
})

const maXe = (id: string) => xeTheoId.value[id]?.vehicle_code || '(chưa có mã)'
const bienSo = (id: string) => xeTheoId.value[id]?.license_plate || '(xe đã bị xoá)'

const chuTrangThai = (tt: string) => ({
  da_xac_nhan: 'Đã xác nhận',
  cho_xac_nhan: 'Đang chờ xác nhận',
  tu_choi: 'Đã từ chối',
}[tt] || tt)

// ⚠️ `as any` là BẮT BUỘC. Thuộc tính `type` của `el-tag` nhận một tập
// chữ cố định ('success' | 'warning' | ...), không nhận `string` chung.
// Thiếu nó là `vue-tsc` chặn build với TS2322 — cách làm này chép từ
// `AccessoryTab.vue` dòng 523, nơi đã chạy thật từ MỤC 439.
const mauTrangThai = (tt: string) => ({
  da_xac_nhan: 'success',
  cho_xac_nhan: 'warning',
  tu_choi: 'danger',
}[tt] as any || 'info')

const daLoc = computed(() =>
  locXe.value
    ? dsNhom.value.filter((n: any) => n.vehicle_id === locXe.value)
    : dsNhom.value)

const soDaXacNhan = computed(() =>
  dsNhom.value.filter((n: any) => n.trang_thai === 'da_xac_nhan').length)

const soChoXacNhan = computed(() =>
  dsNhom.value.filter((n: any) => n.trang_thai === 'cho_xac_nhan').length)

const taiDanhSach = async () => {
  dangTai.value = true
  try {
    // Hai lời gọi song song — nối tiếp là chờ hai lượt mạng.
    const [nhom, xe] = await Promise.all([
      vehicleService.getNhomXe(),
      vehicleService.getVehicles(),
    ])
    dsNhom.value = nhom || []
    dsXe.value = xe || []
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không tải được danh sách nhóm liên kết.')
  } finally {
    dangTai.value = false
  }
}

const moThem = () => {
  form.value = { vehicle_id: locXe.value || '', chat_id: '', group_name: '' }
  hienForm.value = true
}

const luuForm = async () => {
  if (!form.value.vehicle_id) {
    ElMessage.warning('Phải chọn xe.')
    return
  }
  if (!String(form.value.chat_id || '').trim()) {
    ElMessage.warning('Phải nhập Chat ID nhóm.')
    return
  }
  dangLuu.value = true
  try {
    await vehicleService.addNhomXe({
      vehicle_id: form.value.vehicle_id,
      chat_id: String(form.value.chat_id).trim(),
      group_name: form.value.group_name || null,
    })
    // ⚠️ Nói rõ việc CHƯA XONG. Báo "thành công" trống là người dùng tưởng
    // đã dùng được, trong khi liên kết còn đang chờ nhóm bấm.
    ElMessage.success('Đã lưu. Vào nhóm Telegram đó bấm ✅ Xác nhận để dùng.')
    hienForm.value = false
    await taiDanhSach()
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không lưu được liên kết.')
  } finally {
    dangLuu.value = false
  }
}

const guiLai = async (n: any) => {
  dangGui.value = n.id
  try {
    await vehicleService.guiLaiLoiMoiNhom(n.id)
    ElMessage.success('Đã gửi lại lời mời xuống nhóm.')
    await taiDanhSach()
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không gửi được. Kiểm tra bot đã ở trong nhóm chưa.')
  } finally {
    dangGui.value = null
  }
}

const xoa = async (n: any) => {
  try {
    await ElMessageBox.confirm(
      `Xoá liên kết giữa nhóm "${n.group_name || n.chat_id}" và xe ` +
      `${bienSo(n.vehicle_id)}? Nhóm này sẽ không nhận cảnh báo bảo hiểm ` +
      `và nhắc bảo dưỡng nữa.`,
      'Xác nhận xoá', { type: 'warning', confirmButtonText: 'Xoá', cancelButtonText: 'Hủy' })
  } catch {
    return
  }
  try {
    await vehicleService.deleteNhomXe(n.id)
    ElMessage.success('Đã xoá liên kết.')
    await taiDanhSach()
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không xoá được.')
  }
}

onMounted(taiDanhSach)
</script>
