<!--
  MỤC 736 (02/11/2026) — NHẬP LỘN HỘ (HAI KHÁCH TRÙNG TÊN): CHUYỂN THU CHI SANG HỘ ĐÚNG.

  s68 02/11: "khách hàng tên Dũng mã A … operator chỉ ghi Dũng … Kế toán trước đã nhập vào A do trùng tên … kế toán
  điều chỉnh sửa cả 2 sổ Dũng A và Dũng A+. Thì bot sẽ báo lên nhóm Tổng Quản lý và 2 nhóm KH A và A+ liên quan."
  Một lần bấm sửa CẢ HAI sổ (máy chủ: app/services/chuyen_ho_thu_chi.py). Ghi ngay, không chờ duyệt — s68: "có thay
  đổi là báo lên nhóm liên quan để quản lý đi xác minh".
  `loai`: 'thanh_toan' (khoản đã trả trên các phiếu thu mua) | 'ung_tien' (dòng ứng / khấu trừ).
-->
<template>
  <el-dialog :model-value="modelValue" title="🔁 Chuyển sang hộ đúng (nhập lộn hộ)" width="min(560px, 94vw)"
             append-to-body @update:model-value="emit('update:modelValue', $event)">
    <div class="space-y-3 text-sm">
      <p>
        Đang ghi cho hộ <b class="font-mono">{{ hoCu }}</b><span v-if="tenCu"> — {{ tenCu }}</span>: {{ moTa }}
      </p>
      <ul class="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
        <template v-if="loai === 'thanh_toan'">
          <li>Sổ hộ <b>{{ hoCu }}</b>: các phiếu này trở lại <b>chưa thanh toán</b>, công nợ tăng lại đúng số đó.</li>
          <li>Sổ hộ đúng: trừ đúng số tiền đó vào các phiếu chưa trả, <b>ngày cũ trước</b> (như nút Thanh toán).</li>
        </template>
        <li v-else>Dòng ứng / khấu trừ chuyển nguyên sang hộ đúng; số dư ứng của cả 2 hộ tự đổi theo.</li>
        <li>Ghi <b>ngay</b>. Bot báo nhóm <b>I. TN - Tổng Quản Lý</b> và nhóm riêng của <b>cả 2 khách</b>
          (tin cho khách chỉ nói sổ của chính họ, không nêu khách kia).</li>
      </ul>
      <el-form label-position="top">
        <el-form-item label="Hộ đúng" required>
          <el-select v-model="hoMoi" filterable style="width: 100%" placeholder="Gõ mã hộ hoặc tên…">
            <el-option v-for="h in dsHo" :key="h.hoursehold_id" :value="h.hoursehold_id"
                       :label="`${h.hoursehold_id} — ${h.fullname} (${h.collection_name || 'chưa rõ điểm'})${trungTen(h) ? ' · TRÙNG TÊN' : ''}`" />
          </el-select>
          <span class="text-xs text-gray-400 dark:text-gray-500">Hộ trùng tên đứng đầu danh sách.</span>
        </el-form-item>
        <el-form-item :label="`Lý do (bắt buộc, ít nhất ${LY_DO_TOI_THIEU} ký tự)`" required>
          <el-input v-model="lyDo" type="textarea" :rows="2"
                    placeholder="VD: trùng tên Dũng — sổ tay Dũng LT063 có ghi khoản này" />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">Hủy</el-button>
      <el-button type="warning" :loading="dangGui"
                 :disabled="!hoMoi || lyDo.trim().length < LY_DO_TOI_THIEU" @click="gui">Chuyển sang hộ đúng</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { tienNgaService } from '@/api/tienNgaService'
import { LY_DO_TOI_THIEU } from '@/utils/khoaSoChoXacNhan'

const props = defineProps<{
  modelValue: boolean
  loai: 'thanh_toan' | 'ung_tien'
  ids: string[]
  hoCu: string
  tenCu?: string
  moTa?: string
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'xong'): void }>()

const hoMoi = ref('')
const lyDo = ref('')
const dangGui = ref(false)
const dsHo = ref<any[]>([])

const chuan = (s: any) => String(s || '').trim().toLowerCase()
const trungTen = (h: any) => !!props.tenCu && chuan(h.fullname) === chuan(props.tenCu)

watch(() => props.modelValue, async (mo) => {
  if (!mo) return
  hoMoi.value = ''
  lyDo.value = ''
  try {
    const kh = await tienNgaService.getCustomers('cao su')
    // Bỏ chính hộ đang giữ; hộ TRÙNG TÊN lên đầu — đúng ca s68 kể (hai khách cùng tên Dũng).
    dsHo.value = (kh || []).filter((c: any) => (c.hoursehold_id || '') !== props.hoCu)
      .sort((a: any, b: any) => Number(trungTen(b)) - Number(trungTen(a)))
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không tải được danh sách hộ dân.')
  }
})

async function gui() {
  dangGui.value = true
  try {
    const kq = props.loai === 'thanh_toan'
      ? await tienNgaService.chuyenThanhToanSangHo(props.ids, hoMoi.value, lyDo.value.trim())
      : await tienNgaService.chuyenUngTienSangHo(props.ids, hoMoi.value, lyDo.value.trim())
    const baoDu = kq?.da_bao && kq.da_bao.tong
    ElNotification({
      title: 'Đã chuyển sang hộ đúng',
      message: `${kq.ho_cu} ➜ ${kq.ho_moi}. ` + (baoDu ? 'Bot đã báo nhóm Tổng Quản Lý và nhóm 2 khách.'
        : 'Đã ghi sổ; bot CHƯA báo được nhóm Tổng Quản Lý — báo quản lý bằng tay.'),
      type: baoDu ? 'success' : 'warning',
      duration: 8000,
    })
    emit('update:modelValue', false)
    emit('xong')
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không chuyển được.')
  } finally {
    dangGui.value = false
  }
}
</script>
