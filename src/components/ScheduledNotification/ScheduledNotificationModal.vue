<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? 'CHỈNH SỬA CẤU HÌNH THÔNG BÁO' : 'TẠO LỊCH THÔNG BÁO MỚI'"
    width="800px"
    destroy-on-close
    align-center
    class="custom-dark-dialog"
    @close="handleClose"
  >
    <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="170px" class="mt-2 compact-form">
        <!-- PHẦN 1: LOẠI THÔNG BÁO -->
        <div class="mb-6">
          <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            Loại thông báo
          </h4>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Loại thông báo" prop="notify_type">
                <el-select v-model="form.notify_type" placeholder="Chọn loại..." style="width: 100%" class="highlight-select">
                  <el-option
                    v-for="opt in notifyTypeOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Bật thông báo">
                <el-switch v-model="form.is_enabled" active-text="Bật" inactive-text="Tắt" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- PHẦN 2: ĐỐI TƯỢNG NHẬN -->
        <div class="mb-6">
          <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
            Đối tượng nhận (Telegram)
          </h4>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Chat ID" prop="chat_id">
                <el-input v-model="form.chat_id" placeholder="VD: -1003991830930" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Tên nhóm">
                <el-input v-model="form.group_name" placeholder="Tên nhóm Telegram..." />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- PHẦN 2.5: ĐỐI TƯỢNG LIÊN KẾT -->
        <div class="mb-6">
          <h4 class="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-amber-500 rounded-full"></span>
            Đối tượng liên kết (Tùy chọn)
          </h4>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Mã tham chiếu">
                <el-input v-model="form.reference_id" placeholder="VD: Mã HĐ, Mã BĐS, Mã Hụi... (Để trống = Áp dụng tất cả)" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Tên tham chiếu">
                <el-input v-model="form.reference_name" placeholder="VD: Tên khách hàng, Tên nhà..." clearable />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- PHẦN 3: TẦN SUẤT GỬI -->
        <div class="mb-6">
          <h4 class="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
            Tần suất gửi
          </h4>
          <el-form-item label="Tần suất" prop="schedule_type">
            <el-radio-group v-model="form.schedule_type">
              <el-radio-button label="daily">Hàng ngày</el-radio-button>
              <el-radio-button label="weekly">Hàng tuần</el-radio-button>
              <el-radio-button label="monthly">Hàng tháng</el-radio-button>
              <el-radio-button label="yearly">Hàng năm</el-radio-button>
              <el-radio-button label="specific_date">Ngày cụ thể</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Giờ gửi" prop="schedule_hour">
                <el-time-picker
                  v-model="timePicker"
                  format="HH:mm"
                  placeholder="Chọn giờ"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <!-- Day of week (weekly) -->
            <el-col :span="12" v-if="form.schedule_type === 'weekly'">
              <el-form-item label="Thứ trong tuần" prop="schedule_day_of_week">
                <el-select v-model="form.schedule_day_of_week" placeholder="Chọn thứ..." style="width: 100%" class="highlight-select">
                  <el-option v-for="d in dayOfWeekOptions" :key="d.value" :label="d.label" :value="d.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <!-- Day of month (monthly/yearly) -->
            <el-col :span="12" v-if="form.schedule_type === 'monthly' || form.schedule_type === 'yearly'">
              <el-form-item label="Ngày trong tháng" prop="schedule_day_of_month">
                <el-input-number v-model="form.schedule_day_of_month" :min="1" :max="31" style="width: 100%" controls-position="right" />
              </el-form-item>
            </el-col>
          </el-row>
          <!-- Extra row for yearly month / specific date -->
          <el-row :gutter="20" v-if="form.schedule_type === 'yearly' || form.schedule_type === 'specific_date'">
            <el-col :span="12" v-if="form.schedule_type === 'yearly'">
              <el-form-item label="Tháng" prop="schedule_month">
                <el-input-number v-model="form.schedule_month" :min="1" :max="12" style="width: 100%" controls-position="right" />
              </el-form-item>
            </el-col>
            <el-col :span="12" v-if="form.schedule_type === 'specific_date'">
              <el-form-item label="Ngày cụ thể" prop="schedule_specific_date">
                <el-date-picker
                  v-model="form.schedule_specific_date"
                  type="date"
                  placeholder="Chọn ngày"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- PHẦN 4: NỘI DUNG TIN NHẮN -->
        <div class="mb-2">
          <h4 class="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-rose-500 rounded-full"></span>
            Nội dung tin nhắn (Tùy chọn)
          </h4>
          <!-- Placeholder chips -->
          <div class="mb-3 flex flex-wrap gap-1.5">
            <span class="text-xs text-gray-500 dark:text-gray-400 mr-1 leading-6">Chèn biến:</span>
            <el-tag
              v-for="ph in currentPlaceholders"
              :key="ph"
              size="small"
              type="info"
              class="cursor-pointer hover:!bg-blue-100 dark:hover:!bg-blue-900/40 transition-colors"
              @click="insertPlaceholder(ph)"
            >
              {{ ph }}
            </el-tag>
          </div>
          <el-form-item label="Message Template">
            <el-input
              ref="templateInput"
              v-model="form.message_template"
              type="textarea"
              :rows="5"
              placeholder="Nhập nội dung tin nhắn... (Để trống = dùng message mặc định của hệ thống)"
            />
          </el-form-item>
        </div>
      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">Hủy</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">Xác nhận</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { scheduledNotificationService, type ScheduledNotifyConfigPayload } from '@/api/scheduledNotificationService'

const props = defineProps<{
  moduleKey: string
  modelValue: boolean
  editData?: any | null
  prefillData?: {
    notify_type?: string
    message_template?: string
    [key: string]: any
  } | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'saved'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEdit = computed(() => !!props.editData?.id)

const formRef = ref<any>(null)
const templateInput = ref<any>(null)
const submitting = ref(false)

// ── Module name map ──
const moduleNameMap: Record<string, string> = {
  rental: 'Cho Thuê',
  credit: 'Tín Dụng',
  rosca: 'Hụi'
}

// ── Notify type options per module ──
const notifyTypeOptionsMap: Record<string, { value: string; label: string }[]> = {
  credit: [
    { value: 'credit_interest', label: 'Nhắc đóng lãi' },
    { value: 'credit_bad_debt', label: 'Cảnh báo nợ xấu' },
    { value: 'credit_maturity', label: 'Cảnh báo đáo hạn' },
    { value: 'credit_principal', label: 'Nhắc đóng gốc' },
    { value: 'credit_other', label: 'Thông báo tùy ý' },
  ],
  rental: [
    { value: 'rental_payment', label: 'Nhắc đóng tiền thuê' },
    { value: 'rental_maintenance', label: 'Nhắc bảo trì' },
    { value: 'rental_contract_expiry', label: 'Cảnh báo hết hạn HĐ' },
    { value: 'rental_deposit', label: 'Nhắc hoàn cọc' },
    { value: 'rental_other', label: 'Thông báo tùy ý' },
  ],
  rosca: [
    { value: 'rosca_payment', label: 'Nhắc đóng hụi' },
    { value: 'rosca_bidding', label: 'Nhắc khui hụi' },
    { value: 'rosca_defaulted', label: 'Cảnh báo bể hụi' },
    { value: 'rosca_other', label: 'Thông báo tùy ý' },
  ],
}

const notifyTypeOptions = computed(() => notifyTypeOptionsMap[props.moduleKey] || [])

// ── Placeholder per module ──
const placeholderMap: Record<string, string[]> = {
  credit: ['{customer_name}', '{customer_id}', '{contact_info}', '{contract_id}', '{loan_type}', '{initial_principal}', '{interest_amount}', '{remaining_principal}', '{interest_debt}', '{due_date}', '{interest_start_date}', '{days_late}', '{days_text}', '{monthly_interest_rate}'],
  rental: ['{customer_name}', '{customer_id}', '{contact_info}', '{contract_id}', '{real_estate_id}', '{type_contract}', '{start_rental}', '{end_rental}', '{monthly_rental}', '{deposit}', '{rental_debt}', '{days_late}', '{days_text}'],
  rosca: ['{rosca_code}', '{owner_name}', '{payment_day}', '{base_amount}', '{min_bid}', '{max_bid}', '{total_parts}', '{period_type}'],
}

const currentPlaceholders = computed(() => placeholderMap[props.moduleKey] || [])

// ── Day of week options ──
const dayOfWeekOptions = [
  { value: 0, label: 'Thứ Hai' },
  { value: 1, label: 'Thứ Ba' },
  { value: 2, label: 'Thứ Tư' },
  { value: 3, label: 'Thứ Năm' },
  { value: 4, label: 'Thứ Sáu' },
  { value: 5, label: 'Thứ Bảy' },
  { value: 6, label: 'Chủ Nhật' },
]

// ── Form state ──
const form = reactive({
  notify_type: '',
  chat_id: '',
  group_name: '',
  schedule_type: 'daily',
  schedule_hour: 8,
  schedule_minute: 0,
  schedule_day_of_week: null as number | null,
  schedule_day_of_month: null as number | null,
  schedule_month: null as number | null,
  schedule_specific_date: null as string | null,
  message_template: '',
  is_enabled: true,
  reference_id: null as string | null,
  reference_name: null as string | null,
})

// Time-picker helper — converts hour+minute to Date and back
const timePicker = computed({
  get() {
    const d = new Date()
    d.setHours(form.schedule_hour, form.schedule_minute, 0, 0)
    return d
  },
  set(val: Date | null) {
    if (val) {
      form.schedule_hour = val.getHours()
      form.schedule_minute = val.getMinutes()
    }
  }
})

const rules = reactive({
  notify_type: [{ required: true, message: 'Vui lòng chọn loại thông báo', trigger: 'change' }],
  chat_id: [{ required: true, message: 'Vui lòng nhập Chat ID', trigger: 'blur' }],
  schedule_type: [{ required: true, message: 'Vui lòng chọn tần suất', trigger: 'change' }],
})

// ── Populate form when opening ──
watch(visible, (val) => {
  if (val) {
    if (props.editData?.id) {
      // Edit mode
      const d = props.editData
      form.notify_type = d.notify_type || ''
      form.chat_id = d.chat_id || ''
      form.group_name = d.group_name || ''
      form.schedule_type = d.schedule_type || 'daily'
      form.schedule_hour = d.schedule_hour ?? 8
      form.schedule_minute = d.schedule_minute ?? 0
      form.schedule_day_of_week = d.schedule_day_of_week ?? null
      form.schedule_day_of_month = d.schedule_day_of_month ?? null
      form.schedule_month = d.schedule_month ?? null
      form.schedule_specific_date = d.schedule_specific_date ?? null
      form.message_template = d.message_template || ''
      form.is_enabled = d.is_enabled ?? true
      form.reference_id = d.reference_id ?? null
      form.reference_name = d.reference_name ?? null
    } else {
      // Create mode — reset
      form.notify_type = props.prefillData?.notify_type || ''
      form.chat_id = ''
      form.group_name = ''
      form.schedule_type = 'daily'
      form.schedule_hour = 8
      form.schedule_minute = 0
      form.schedule_day_of_week = null
      form.schedule_day_of_month = null
      form.schedule_month = null
      form.schedule_specific_date = null
      form.message_template = props.prefillData?.message_template || ''
      form.is_enabled = true
      form.reference_id = props.prefillData?.reference_id ?? null
      form.reference_name = props.prefillData?.reference_name ?? null
    }
  }
})

// ── Insert placeholder at cursor ──
const insertPlaceholder = (placeholder: string) => {
  form.message_template = (form.message_template || '') + placeholder
  nextTick(() => {
    templateInput.value?.focus()
  })
}

// ── Submit ──
const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    submitting.value = true
    try {
      const payload: ScheduledNotifyConfigPayload = {
        module_key: props.moduleKey,
        module_name: moduleNameMap[props.moduleKey] || props.moduleKey,
        notify_type: form.notify_type,
        chat_id: form.chat_id,
        group_name: form.group_name || undefined,
        schedule_type: form.schedule_type,
        schedule_hour: form.schedule_hour,
        schedule_minute: form.schedule_minute,
        schedule_day_of_week: form.schedule_type === 'weekly' ? form.schedule_day_of_week : null,
        schedule_day_of_month: ['monthly', 'yearly'].includes(form.schedule_type) ? form.schedule_day_of_month : null,
        schedule_month: form.schedule_type === 'yearly' ? form.schedule_month : null,
        schedule_specific_date: form.schedule_type === 'specific_date' ? form.schedule_specific_date : null,
        message_template: form.message_template || null,
        is_enabled: form.is_enabled,
        reference_id: form.reference_id || null,
        reference_name: form.reference_name || null,
      }

      if (isEdit.value) {
        await scheduledNotificationService.updateConfig(props.editData.id, payload)
        ElMessage.success('Cập nhật cấu hình thông báo thành công!')
      } else {
        await scheduledNotificationService.createConfig(payload)
        ElMessage.success('Tạo lịch thông báo mới thành công!')
      }
      emit('saved')
      handleClose()
    } catch (error: any) {
      ElMessage.error(error.message || 'Lỗi khi lưu cấu hình thông báo')
    } finally {
      submitting.value = false
    }
  })
}

const handleClose = () => {
  visible.value = false
}
</script>
