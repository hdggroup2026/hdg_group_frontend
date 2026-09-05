<template>
  <el-dialog
    v-model="visible"
    title="THU HỒI THIẾT BỊ"
    width="650px"
    destroy-on-close
    align-center
    class="custom-dark-dialog"
  >
    <div class="max-h-[60vh] overflow-y-auto overflow-x-hidden px-2">
      <!-- Device Info Highlight Banner -->
      <div v-if="deviceInfo" class="mb-4 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-amber-500 text-white rounded-lg font-bold">
            <el-icon><RefreshLeft /></el-icon>
          </div>
          <div>
            <div class="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">Thiết bị thu hồi</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-100">
              {{ deviceInfo.model_name || deviceInfo.brand || deviceInfo.id }} 
              <span class="font-mono text-amber-600 dark:text-amber-400">({{ deviceInfo.id }})</span>
            </div>
          </div>
        </div>
        <div>
          <el-tag size="small" :type="getDeviceStatusTagType(deviceInfo.status)" effect="dark" class="font-bold">
            {{ getDeviceStatusLabel(deviceInfo.status) }}
          </el-tag>
        </div>
      </div>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="160px" class="mt-2 compact-form">
        <div class="mb-4">
          <h4 class="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-amber-500 rounded-full"></span>
            Thông tin thu hồi
          </h4>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="Mã thiết bị (ID)">
                <el-input v-model="form.device_id" disabled class="font-mono font-bold" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="Ngày thu hồi" prop="returned_at">
                <el-date-picker :editable="false" v-model="form.returned_at" type="date" value-format="YYYY-MM-DD" placeholder="Chọn ngày thu hồi..." class="!w-full" />
              </el-form-item>
            </el-col>
          </el-row>
          <!-- ══════════════════════════════════════════════════════
               MỤC 522 (05/09/2026) — NHẬN LẠI ĐỦ MÓN

               Nửa còn lại của việc "phụ kiện đi theo thiết bị". Giao mà
               không có danh sách lúc nhận lại thì người thu hồi không
               biết phải đòi những gì — và thiếu một cục sạc thì không ai
               phát hiện ra.

               ⚠️ Danh sách này là thứ ĐANG gắn máy lúc mở hộp, không
               phải thứ đã ghi trong biên bản lúc giao. Hai cái lệch nhau
               chính là thông tin đáng giá nhất: món nào đã bị tháo ra.
               ══════════════════════════════════════════════════════ -->
          <el-row :gutter="20" class="mb-3">
            <el-col :span="24">
              <div v-loading="dangTaiKem" class="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-900/20 p-3">
                <div class="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">
                  Phụ kiện và SIM đang gắn máy này
                </div>
                <div v-if="monDiKem.length" class="flex flex-col gap-1.5">
                  <div v-for="m in monDiKem" :key="m.nguon + '|' + m.id"
                       class="flex flex-wrap items-center gap-2 text-xs">
                    <el-tag size="small" :type="m.nguon === 'sim' ? 'warning' : 'info'" effect="plain">
                      {{ m.nguon === 'sim' ? 'SIM' : 'Phụ kiện' }}
                    </el-tag>
                    <span class="font-mono font-bold">{{ m.id }}</span>
                    <span class="text-gray-700 dark:text-gray-200 break-words">
                      {{ m.loai || '' }}<template v-if="m.ten"> — {{ m.ten }}</template>
                    </span>
                    <span v-if="m.so_hieu" class="font-mono text-gray-500">{{ m.so_hieu }}</span>
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 pt-1.5 border-t border-amber-200 dark:border-amber-900/60">
                    Phải nhận lại <b>{{ monDiKem.length }}</b> món. Đối chiếu đủ rồi
                    hãy xác nhận thu hồi.
                  </div>
                </div>
                <div v-else-if="!dangTaiKem" class="text-xs text-gray-500 dark:text-gray-400">
                  Máy này không còn phụ kiện hay SIM nào gắn kèm.
                </div>
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="Tình trạng thu hồi" prop="final_condition">
                <el-input v-model="form.final_condition" type="textarea" :rows="3" placeholder="Nhập tình trạng vật lý, hư hỏng, trầy xước lúc thu hồi thiết bị..." />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">Hủy</el-button>
        <el-button type="warning" :loading="submitting" @click="submitForm">Xác nhận Thu hồi</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { RefreshLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { otherService } from '@/api/otherService'
import { DeviceStatus, getDeviceStatusLabel, getDeviceStatusTagType } from '@/constants/deviceStatus'

interface DeviceInfo {
  id: string
  type: string
  status: string
  model_name?: string
  brand?: string
  [key: string]: any
}

const props = defineProps<{
  modelValue: boolean
  deviceInfo: DeviceInfo | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'success'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const submitting = ref(false)
const formRef = ref<any>(null)

const form = reactive({
  device_id: '',
  returned_at: new Date().toISOString().split('T')[0],
  final_condition: ''
})

const rules = reactive({
  returned_at: [{ required: true, message: 'Vui lòng chọn ngày thu hồi', trigger: 'change' }]
})

// MỤC 522 (05/09/2026) — xem lời ghi ở khối "Phụ kiện và SIM đang gắn
// máy này" phía trên.
const monDiKem = ref<any[]>([])
const dangTaiKem = ref(false)

const taiMonDiKem = async (deviceId: string) => {
  monDiKem.value = []
  if (!deviceId) return
  dangTaiKem.value = true
  try {
    monDiKem.value = (await otherService.getPhuKienCuaMay(deviceId)) || []
  } catch (e: any) {
    // ⚠️ Hỏng chỗ này KHÔNG được chặn việc thu hồi.
    console.warn('Không tải được phụ kiện của máy:', e)
  } finally {
    dangTaiKem.value = false
  }
}

watch(() => props.deviceInfo, (newVal) => {
  if (newVal) {
    form.device_id = newVal.id || ''
    form.returned_at = new Date().toISOString().split('T')[0]
    form.final_condition = ''
    taiMonDiKem(newVal.id || '')
  }
}, { immediate: true })

const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true
      try {
        // 1. Try to find the active assignment record for this device
        const assignments = await otherService.getDeviceAssignments({ device_id: form.device_id }).catch(() => [])
        const activeAssignment = Array.isArray(assignments) ? assignments.find((a: any) => !a.returned_at) : null

        if (activeAssignment && activeAssignment.id) {
          await otherService.updateDeviceAssignments([{
            id: activeAssignment.id,
            returned_at: form.returned_at,
            final_condition: form.final_condition || null
          }])
        }

        // 2. Update device status back to READY_FOR_HANDOVER (Sẵn sàng bàn giao)
        const deviceUpdatePayload = {
          id: form.device_id,
          status: DeviceStatus.READY_FOR_HANDOVER
        }
        if (props.deviceInfo) {
          Object.assign(deviceUpdatePayload, { ...props.deviceInfo, status: DeviceStatus.READY_FOR_HANDOVER })
        }

        const deviceType = props.deviceInfo?.type || 'laptop'
        if (deviceType === 'phone') {
          await otherService.updateSmartphones([deviceUpdatePayload])
        } else if (deviceType === 'laptop') {
          await otherService.updateLaptops([deviceUpdatePayload])
        } else if (deviceType === 'tablet') {
          await otherService.updateTablets([deviceUpdatePayload])
        } else if (deviceType === 'monitor') {
          await otherService.updateScreens([deviceUpdatePayload])
        } else if (deviceType === 'camera') {
          await otherService.updateCameras([deviceUpdatePayload])
        } else {
          await otherService.updateOtherDevices([deviceUpdatePayload])
        }

        ElMessage.success('Thu hồi thiết bị thành công! Trạng thái đã được cập nhật về "Sẵn sàng bàn giao".')
        emit('success')
        visible.value = false
      } catch (error: any) {
        ElMessage.error(error.message || 'Lỗi khi thực hiện thu hồi thiết bị')
      } finally {
        submitting.value = false
      }
    }
  })
}
</script>
