<!--
  ══════════════════════════════════════════════════════════════════════
  MỤC 715 (25/10/2026) — NGƯỜI NHẬN THÊM TIN CỦA XE

  s68: *"cấu hình báo thêm 1 nhóm để nhân viên cũng nhận được thông tin hết hạn hay
  đến kỳ bảo hiểm … Có thể gửi xuống 2-3 nhóm thì bấm dấu + có thể thêm nhóm. Và chọn
  nhóm là drop list chọn nhân viên trong danh sách GGO. Và có thể edit, xoá hay đổi
  nhân viên khác được luôn."* Chốt 1a: người nhận thêm nhận TẤT CẢ tin của xe.

  Tin vào NHÓM RIÊNG của nhân viên (ô «Nhóm Telegram» trong hồ sơ, vd G010 ➜ GGO0010).
  🔴 Lưu NGAY bằng nút "Lưu người nhận" (giống khối Bảo hiểm / Đăng kiểm của MỤC 704),
  độc lập với nút "Xác nhận" của hộp xe — để không có chuyện chọn xong bấm Hủy hộp xe.
  ⚠️ Máy chủ chặn quá 3 người và người đã nghỉ; web chặn trước cho dễ hiểu.
  ══════════════════════════════════════════════════════════════════════
-->
<template>
  <div v-loading="dangTai">
    <div class="flex items-center justify-between mb-2">
      <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
        Người nhận thêm ({{ chon.filter(Boolean).length }}/{{ TOI_DA }})
      </h4>
      <el-button size="small" type="success" plain :disabled="chon.length >= TOI_DA" @click="chon.push('')">
        + Thêm người nhận
      </el-button>
    </div>
    <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">
      Nhân viên được chọn nhận MỌI tin của xe này (nhắc bảo hiểm, đăng kiểm, bảo dưỡng, tin sửa trên web)
      vào nhóm riêng của họ.
    </div>
    <div v-for="(ma, i) in chon" :key="i" class="flex items-center gap-2 mb-2">
      <el-select v-model="chon[i]" filterable placeholder="Chọn nhân viên GGO" style="flex: 1">
        <el-option v-for="nv in dsNhanVien" :key="nv.employee_id" :value="nv.employee_id"
                   :label="`${nv.employee_id} — ${nv.ten}${nv.nhom ? ' · ' + nv.nhom : ''}`"
                   :disabled="chon.includes(nv.employee_id) && chon[i] !== nv.employee_id" />
      </el-select>
      <el-button size="small" type="danger" plain @click="chon.splice(i, 1)">🗑</el-button>
    </div>
    <div v-for="ma in thieuNhom" :key="'t' + ma" class="text-xs text-amber-600 mb-1">
      ⚠️ {{ ma }} chưa có nhóm Telegram riêng trong hồ sơ — sẽ không nhận được tin cho tới khi khai nhóm.
    </div>
    <div class="flex justify-end">
      <el-button size="small" type="primary" :loading="dangLuu" :disabled="!daDoi" @click="luu">Lưu người nhận</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { vehicleService } from '@/api/vehicleService'

const props = defineProps<{ vehicleId: string }>()
const TOI_DA = 3

const dsNhanVien = ref<any[]>([])
const chon = ref<string[]>([])
const goc = ref<string[]>([])
const dangTai = ref(false)
const dangLuu = ref(false)

const daChon = computed(() => chon.value.filter(Boolean))
const daDoi = computed(() => JSON.stringify(daChon.value) !== JSON.stringify(goc.value))
const thieuNhom = computed(() =>
  daChon.value.filter((m) => { const nv = dsNhanVien.value.find((x) => x.employee_id === m); return nv && !nv.co_nhom }))

const nap = async () => {
  if (!props.vehicleId) return
  dangTai.value = true
  try {
    const [nv, ds] = await Promise.all([
      vehicleService.getNhanVienGgo(),
      vehicleService.getNguoiNhanXe(props.vehicleId),
    ])
    dsNhanVien.value = nv || []
    goc.value = (ds || []).map((d: any) => d.employee_id)
    chon.value = [...goc.value]
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không tải được người nhận thêm.')
  } finally {
    dangTai.value = false
  }
}

const luu = async () => {
  dangLuu.value = true
  try {
    const kq = await vehicleService.setNguoiNhanXe(props.vehicleId, daChon.value)
    goc.value = [...daChon.value]
    chon.value = [...daChon.value]
    ElMessage.success('Đã lưu người nhận thêm. Bot đã báo vào nhóm của xe.')
    if (kq?.chua_co_nhom?.length) ElMessage.warning(`Chưa có nhóm riêng: ${kq.chua_co_nhom.join(', ')}`)
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không lưu được.')
  } finally {
    dangLuu.value = false
  }
}

onMounted(nap)
watch(() => props.vehicleId, nap)
</script>
