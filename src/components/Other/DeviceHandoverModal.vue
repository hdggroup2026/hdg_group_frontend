<template>
  <el-dialog
    v-model="visible"
    title="THÊM THÔNG TIN BÀN GIAO"
    width="800px"
    destroy-on-close
    align-center
    class="custom-dark-dialog"
  >
    <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
      <!-- Device Info Highlight Banner -->
      <div v-if="deviceInfo" class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-blue-500 text-white rounded-lg font-bold">
            <el-icon><Switch /></el-icon>
          </div>
          <div>
            <div class="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">Thiết bị được chọn bàn giao</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-100">
              {{ deviceInfo.model_name || deviceInfo.brand || deviceInfo.id }} 
              <span class="font-mono text-blue-600 dark:text-blue-400">({{ deviceInfo.id }})</span>
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
        <!-- THÔNG TIN ĐỐI TƯỢNG VÀ THIẾT BỊ -->
        <div class="mb-4">
          <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            Thông tin bàn giao
          </h4>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Người sử dụng" prop="username">
                <el-input v-model="form.username" placeholder="Nhập tên nhân viên sử dụng..." />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Loại thiết bị" prop="device_type">
                <el-select v-model="form.device_type" placeholder="Chọn loại thiết bị..." class="w-full" disabled>
                  <el-option label="Điện thoại" value="phone" />
                  <el-option label="Laptop" value="laptop" />
                  <el-option label="Máy tính bảng" value="tablet" />
                  <el-option label="Màn hình" value="monitor" />
                  <el-option label="Camera" value="camera" />
                  <el-option label="Thiết bị khác" value="other" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Mã thiết bị (ID)" prop="device_id">
                <el-input v-model="form.device_id" placeholder="Mã thiết bị..." disabled />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- THỜI GIAN BÀN GIAO -->
        <div class="mb-4">
          <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
            Thời gian
          </h4>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Ngày bàn giao" prop="assigned_at">
                <el-date-picker :editable="false" v-model="form.assigned_at" type="date" value-format="YYYY-MM-DD" placeholder="Chọn ngày bàn giao..." class="!w-full" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Ngày thu hồi" prop="returned_at">
                <el-date-picker :editable="false" v-model="form.returned_at" type="date" value-format="YYYY-MM-DD" placeholder="Chọn ngày thu hồi (nếu có)..." class="!w-full" clearable />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- TÌNH TRẠNG VẬT LÝ -->
        <div class="mb-2">
          <h4 class="text-sm font-bold text-violet-650 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
            Tình trạng thiết bị
          </h4>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="Tình trạng ban đầu" prop="initial_condition">
                <el-input v-model="form.initial_condition" type="textarea" :rows="2" placeholder="Nhập tình trạng vật lý, trầy xước, phụ kiện kèm theo lúc bàn giao..." />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20" class="mt-2">
            <el-col :span="24">
              <el-form-item label="Tình trạng thu hồi" prop="final_condition">
                <el-input v-model="form.final_condition" type="textarea" :rows="2" placeholder="Nhập tình trạng vật lý lúc thu hồi thiết bị..." />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">Hủy</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">Xác nhận Bàn giao</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { Switch } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { otherService } from '@/api/otherService'
import { DeviceStatus, isReadyForHandover, getDeviceStatusLabel, getDeviceStatusTagType } from '@/constants/deviceStatus'

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
  (e: 'success', assignment: any): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const submitting = ref(false)
const formRef = ref<any>(null)

const form = reactive({
  username: '',
  device_type: 'laptop',
  device_id: '',
  assigned_at: new Date().toISOString().split('T')[0],
  returned_at: '',
  initial_condition: '',
  final_condition: ''
})

const rules = reactive({
  username: [{ required: true, message: 'Vui lòng nhập tên người sử dụng', trigger: 'blur' }],
  device_type: [{ required: true, message: 'Vui lòng chọn loại thiết bị', trigger: 'change' }],
  device_id: [{ required: true, message: 'Vui lòng nhập mã thiết bị (ID)', trigger: 'blur' }]
})

watch(() => props.deviceInfo, (newVal) => {
  if (newVal) {
    form.device_id = newVal.id || ''
    form.device_type = newVal.type || 'laptop'
    form.username = ''
    form.assigned_at = new Date().toISOString().split('T')[0]
    form.returned_at = ''
    form.initial_condition = ''
    form.final_condition = ''
  }
}, { immediate: true })

const submitForm = async () => {
  if (!formRef.value) return

  // Validation Check: Status must be "Sẵn sàng bàn giao"
  if (props.deviceInfo && !isReadyForHandover(props.deviceInfo.status)) {
    ElMessage.warning('Chỉ thiết bị ở trạng thái "Sẵn sàng bàn giao" mới có thể thực hiện bàn giao!')
    return
  }

  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true
      const payload = {
        username: form.username,
        device_type: form.device_type,
        device_id: form.device_id,
        assigned_at: form.assigned_at || null,
        returned_at: form.returned_at || null,
        initial_condition: form.initial_condition || null,
        final_condition: form.final_condition || null
      }

      try {
        // 1. Create Device Assignment record
        const res = await otherService.addDeviceAssignments([payload])
        
        // 2. Try to update device status to "handed_over" in backend
        try {
          const deviceUpdatePayload = {
            id: form.device_id,
            status: DeviceStatus.HANDED_OVER
          }
          if (props.deviceInfo) {
            // merge with existing device object fields if present
            Object.assign(deviceUpdatePayload, { ...props.deviceInfo, status: DeviceStatus.HANDED_OVER })
          }

          if (form.device_type === 'phone') {
            await otherService.updateSmartphones([deviceUpdatePayload])
          } else if (form.device_type === 'laptop') {
            await otherService.updateLaptops([deviceUpdatePayload])
          } else if (form.device_type === 'tablet') {
            await otherService.updateTablets([deviceUpdatePayload])
          } else if (form.device_type === 'monitor') {
            await otherService.updateScreens([deviceUpdatePayload])
          } else if (form.device_type === 'camera') {
            await otherService.updateCameras([deviceUpdatePayload])
          } else {
            await otherService.updateOtherDevices([deviceUpdatePayload])
          }
        } catch (updateErr) {
          console.warn('Backend status update warning:', updateErr)
        }

        ElMessage.success('Thêm thông tin bàn giao thành công!')
        emit('success', res && res[0] ? res[0] : payload)
        visible.value = false
      } catch (error: any) {
        ElMessage.error(error.message || 'Lỗi khi lưu thông tin bàn giao')
      } finally {
        submitting.value = false
      }
    }
  })
}
</script>
