<template>
  <div class="notification-logs-container h-full flex flex-col">
    <!-- Filter Bar -->
    <div class="flex flex-wrap items-center gap-3 mb-4 shrink-0">
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
      <div class="flex items-center gap-2">
        <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
        <el-input
          v-model="searchQuery"
          placeholder="Mã tham chiếu, nội dung..."
          :prefix-icon="Search"
          clearable
          class="w-56 custom-dark-input"
        />
      </div>
      <el-button :icon="Refresh" circle @click="fetchLogs" :loading="loading" />
    </div>

    <!-- Logs Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
      <el-table v-loading="loading" :data="paginatedLogs" style="width: 100%" class="flex-1" height="100%">
        <el-table-column label="STT" width="60" align="center">
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="sent_at" label="Thời gian gửi" width="170" align="center" sortable>
          <template #default="{ row }">
            <span class="text-gray-700 dark:text-gray-300 text-xs">{{ formatDateTime(row.sent_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="notify_type" label="Loại thông báo" width="180" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain" class="font-semibold">
              {{ row.notify_type || '—' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="Trạng thái" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small" effect="plain" class="font-semibold">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="group_name" label="Nhóm nhận" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-gray-700 dark:text-gray-300 text-xs">{{ row.group_name || row.chat_id || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reference_id" label="Mã tham chiếu" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono text-blue-600 dark:text-blue-400 text-xs">{{ row.reference_id || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="message_content" label="Nội dung" min-width="280" show-overflow-tooltip>
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
      <div class="mt-auto shrink-0 p-4 flex justify-end border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredLogs.length"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { scheduledNotificationService, type ScheduledNotifyLog } from '@/api/scheduledNotificationService'

const props = defineProps<{
  moduleKey: string
}>()

const loading = ref(false)
const logs = ref<ScheduledNotifyLog[]>([])

// Filters
const filterStatus = ref('')
const dateRange = ref<[string, string] | null>(null)
const searchQuery = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = ref(20)

const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    if (filterStatus.value && log.status !== filterStatus.value) return false
    const q = searchQuery.value.toLowerCase()
    if (q && !(
      (log.reference_id || '').toLowerCase().includes(q) ||
      (log.message_content || '').toLowerCase().includes(q) ||
      (log.group_name || '').toLowerCase().includes(q)
    )) return false
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
      module_key: props.moduleKey,
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

watch([filterStatus, dateRange], () => {
  currentPage.value = 1
})

onMounted(() => {
  fetchLogs()
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

<style scoped>
.notification-logs-container {
  height: 100%;
}

.notification-logs-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

html.dark .notification-logs-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}
html.dark .notification-logs-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}
html.dark .notification-logs-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}
html.dark .notification-logs-container :deep(.el-table .el-table-fixed-column--left),
html.dark .notification-logs-container :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important;
}

html.dark .notification-logs-container .custom-dark-select :deep(.el-input__wrapper),
html.dark .notification-logs-container .custom-dark-input :deep(.el-input__wrapper),
html.dark .notification-logs-container .custom-dark-date-picker :deep(.el-input__wrapper) {
  background-color: #1f2937;
  box-shadow: 0 0 0 1px #374151 inset;
}
html.dark .notification-logs-container .custom-dark-select :deep(.el-input__inner),
html.dark .notification-logs-container .custom-dark-input :deep(.el-input__inner),
html.dark .notification-logs-container .custom-dark-date-picker :deep(.el-input__inner) {
  color: #f3f4f6;
}
</style>
