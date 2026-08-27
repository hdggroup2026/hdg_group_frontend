<template>
  <el-dialog
    v-model="visible"
    title="NHẬT KÝ GỬI THÔNG BÁO"
    width="900px"
    destroy-on-close
    align-center
    class="custom-dark-dialog"
  >
    <div class="space-y-4 max-h-[65vh] overflow-hidden flex flex-col">
      <!-- Filter Bar -->
      <div class="flex flex-wrap items-center gap-3 shrink-0">
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái:</span>
          <el-select
            v-model="filterStatus"
            placeholder="Tất cả"
            clearable
            style="width: 140px"
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Thành công" value="SUCCESS" />
            <el-option label="Thất bại" value="FAILED" />
            <el-option label="Bỏ qua" value="SKIPPED" />
          </el-select>
        </div>
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian:</span>
          <el-date-picker :editable="false"
            v-model="dateRange"
            type="daterange"
            range-separator="đến"
            start-placeholder="Từ ngày"
            end-placeholder="Đến ngày"
            value-format="YYYY-MM-DD"
            style="width: 260px"
            class="custom-dark-date-picker highlight-select"
            popper-class="custom-dark-select-popper"
          />
        </div>
        <el-button type="primary" class="ml-auto" @click="fetchLogs" :loading="loading">Tìm kiếm</el-button>
      </div>

      <!-- Logs Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
        <el-table v-loading="loading" :data="paginatedLogs" style="width: 100%" class="flex-1" height="100%">
          <el-table-column label="STT" width="60" align="center">
            <template #default="{ $index }">
              {{ (currentPage - 1) * pageSize + $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="sent_at" label="Thời gian gửi" width="170" align="center">
            <template #default="{ row }">
              <span class="text-gray-700 dark:text-gray-300 text-xs">{{ formatDateTime(row.sent_at) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="Trạng thái" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)" size="small" effect="plain" class="font-semibold">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reference_id" label="Mã tham chiếu" width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="font-mono text-blue-600 dark:text-blue-400 text-xs">{{ row.reference_id || '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="message_content" label="Nội dung" min-width="250" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="text-gray-700 dark:text-gray-300 text-xs">{{ row.message_content || '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="error_message" label="Lỗi" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.error_message" class="text-red-500 text-xs">{{ row.error_message }}</span>
              <span v-else class="text-gray-400 text-xs">—</span>
            </template>
          </el-table-column>
        </el-table>

        <!-- Pagination -->
        <div class="mt-auto shrink-0 p-3 flex justify-end border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            :background="true"
            layout="total, sizes, prev, pager, next"
            :total="filteredLogs.length"
            small
          />
        </div>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="visible = false">Đóng</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { scheduledNotificationService, type ScheduledNotifyLog } from '@/api/scheduledNotificationService'

const props = defineProps<{
  modelValue: boolean
  configId: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const logs = ref<ScheduledNotifyLog[]>([])
const filterStatus = ref('')
const dateRange = ref<[string, string] | null>(null)

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    if (filterStatus.value && log.status !== filterStatus.value) return false
    return true
  })
})

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredLogs.value.slice(start, start + pageSize.value)
})

const fetchLogs = async () => {
  loading.value = true
  try {
    logs.value = await scheduledNotificationService.getLogs({
      config_id: props.configId,
      status: filterStatus.value || undefined,
      start_date: dateRange.value?.[0] || undefined,
      end_date: dateRange.value?.[1] || undefined,
    })
  } catch (error: any) {
    ElMessage.error(error.message || 'Không thể tải nhật ký gửi thông báo')
  } finally {
    loading.value = false
  }
}

watch(visible, (val) => {
  if (val && props.configId) {
    filterStatus.value = ''
    dateRange.value = null
    currentPage.value = 1
    fetchLogs()
  }
})

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

const getStatusTagType = (status: string): TagType => {
  if (status === 'SUCCESS') return 'success'
  if (status === 'FAILED') return 'danger'
  if (status === 'SKIPPED') return 'warning'
  return 'info'
}

const getStatusLabel = (status: string) => {
  if (status === 'SUCCESS') return 'Thành công'
  if (status === 'FAILED') return 'Thất bại'
  if (status === 'SKIPPED') return 'Bỏ qua'
  return status
}
</script>
