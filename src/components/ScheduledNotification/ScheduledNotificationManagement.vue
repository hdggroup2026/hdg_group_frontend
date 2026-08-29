<template>
  <div class="notification-container h-full flex flex-col overflow-y-auto">
    <!-- Filter Bar -->
    <div class="flex flex-wrap justify-between items-center gap-4 mb-4 shrink-0">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Status filter -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái:</span>
          <el-select
            v-model="filterEnabled"
            placeholder="Tất cả"
            clearable
            style="width: 130px"
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Đang bật" value="true" />
            <el-option label="Đã tắt" value="false" />
          </el-select>
        </div>

        <!-- Notify type filter -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Loại thông báo:</span>
          <el-select
            v-model="filterNotifyType"
            placeholder="Tất cả"
            clearable
            style="width: 200px"
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option
              v-for="opt in notifyTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>

        <!-- Search -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
          <el-input
            v-model="searchQuery"
            placeholder="Tên nhóm, Chat ID..."
            :prefix-icon="Search"
            clearable
            class="w-56 custom-dark-input"
          />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <el-button :icon="Refresh" circle @click="fetchConfigs" :loading="loading" />
        <el-button
          type="primary"
          class="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 border-none rounded-xl font-semibold shadow-sm text-white flex items-center"
          @click="openCreateDialog"
        >
          <el-icon class="mr-1"><Plus /></el-icon>
          Tạo thông báo
        </el-button>
      </div>
    </div>

    <!-- Data Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
      <!-- ══════════════════════════════════════════════════════════════
           MỤC 398 (29/08/2026) — BỎ CỘT GHIM, BẢNG CHỈ HIỆN TỪ 768px

           Cột ghim `fixed` chiếm chỗ CỐ ĐỊNH và không co theo màn hình.
           Trên màn 390px, mấy cột ghim cộng lại đã hết chỗ, nên vùng
           cuộn còn lại bằng 0 và vuốt ngang không có tác dụng — người
           dùng vuốt mà màn hình không nhúc nhích.

           Đã bỏ 0 cột ghim ở bảng này.
           ══════════════════════════════════════════════════════════ -->
      <el-table v-if="hienBang" v-loading="loading" :data="paginatedData" style="width: 100%" class="flex-1" height="100%">
        <el-table-column label="STT" width="60" align="center">
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="group_name" label="Tên nhóm / Chat ID" min-width="200">
          <template #default="{ row }">
            <div>
              <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.group_name || '—' }}</span>
              <div class="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">{{ row.chat_id }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Đối tượng liên kết" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <div v-if="row.reference_id">
              <span class="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">{{ row.reference_id }}</span>
              <div v-if="row.reference_name" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ row.reference_name }}</div>
            </div>
            <span v-else class="text-xs text-gray-400">— (Tất cả)</span>
          </template>
        </el-table-column>
        <el-table-column prop="notify_type" label="Loại thông báo" width="200" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain" class="font-semibold">
              {{ getNotifyTypeLabel(row.notify_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="schedule_type" label="Tần suất" width="130" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getScheduleTagType(row.schedule_type)" effect="plain">
              {{ getScheduleLabel(row.schedule_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Giờ gửi" width="90" align="center">
          <template #default="{ row }">
            <span class="font-mono font-bold text-gray-800 dark:text-gray-200">
              {{ String(row.schedule_hour).padStart(2, '0') }}:{{ String(row.schedule_minute).padStart(2, '0') }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="is_enabled" label="Bật/Tắt" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.is_enabled"
              @change="handleToggle(row)"
              :loading="row._toggling"
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column label="Thao tác" width="90" align="center">
          <template #default="{ row }">
            <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, row)">
              <el-button link type="info" class="p-1">
                <el-icon class="text-xl"><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="test">Gửi thử</el-dropdown-item>
                  <el-dropdown-item command="edit">Chỉnh sửa</el-dropdown-item>
                  <el-dropdown-item command="logs">Xem nhật ký</el-dropdown-item>
                  <el-dropdown-item command="delete" divided class="!text-red-500">Xóa</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

<!-- ══════════════════════════════════════════════════════════════
           MỤC 398 (29/08/2026) — THẺ DỌC CHO MÀN HẸP

           🔴 SINH RA TỪ CHÍNH ĐỊNH NGHĨA CỘT CỦA BẢNG Ở TRÊN.
           Mỗi ô dưới đây là NGUYÊN VĂN phần hiển thị của cột tương
           ứng, chỉ đổi chỗ đặt. Nên thẻ và bảng không thể lệch nhau về
           màu, định dạng số hay nhãn trạng thái — chúng là cùng một
           đoạn mã.

           ⚠️ Sửa cách hiển thị một cột thì phải sửa CẢ HAI chỗ. Sửa mỗi
           bảng là điện thoại và máy tính hiện hai kiểu khác nhau cho
           cùng một con số.
           ══════════════════════════════════════════════════════════ -->
      <div v-if="hienThe" v-loading="loading" class="flex-1 min-h-0 overflow-y-auto p-3">
        <div v-if="paginatedData.length > 0" class="grid grid-cols-1 gap-4">
          <div
            v-for="(row, i) in paginatedData"
            :key="row.id || row.contract_id || i"
            class="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
              <div class="min-w-0 break-words">
                <div>
                              <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.group_name || '—' }}</span>
                              <div class="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">{{ row.chat_id }}</div>
                            </div>
              </div>
              <div class="shrink-0">
                <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, row)">
                              <el-button link type="info" class="p-1">
                                <el-icon class="text-xl"><MoreFilled /></el-icon>
                              </el-button>
                              <template #dropdown>
                                <el-dropdown-menu>
                                  <el-dropdown-item command="test">Gửi thử</el-dropdown-item>
                                  <el-dropdown-item command="edit">Chỉnh sửa</el-dropdown-item>
                                  <el-dropdown-item command="logs">Xem nhật ký</el-dropdown-item>
                                  <el-dropdown-item command="delete" divided class="!text-red-500">Xóa</el-dropdown-item>
                                </el-dropdown-menu>
                              </template>
                            </el-dropdown>
              </div>
            </div>
            <div class="space-y-2 text-sm text-left">
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Đối tượng liên kết:</span>
                <span class="text-right break-words min-w-0">
                  <div v-if="row.reference_id">
                                <span class="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">{{ row.reference_id }}</span>
                                <div v-if="row.reference_name" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ row.reference_name }}</div>
                              </div>
                              <span v-else class="text-xs text-gray-400">— (Tất cả)</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Loại thông báo:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag size="small" type="info" effect="plain" class="font-semibold">
                                {{ getNotifyTypeLabel(row.notify_type) }}
                              </el-tag>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tần suất:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag size="small" :type="getScheduleTagType(row.schedule_type)" effect="plain">
                                {{ getScheduleLabel(row.schedule_type) }}
                              </el-tag>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Giờ gửi:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-mono font-bold text-gray-800 dark:text-gray-200">
                                {{ String(row.schedule_hour).padStart(2, '0') }}:{{ String(row.schedule_minute).padStart(2, '0') }}
                              </span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Bật/Tắt:</span>
                <span class="text-right break-words min-w-0">
                  <el-switch
                                v-model="row.is_enabled"
                                @change="handleToggle(row)"
                                :loading="row._toggling"
                                size="small"
                              />
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
          <p class="text-base font-medium">Không có dòng nào khớp bộ lọc</p>
        </div>
      </div>

      <!-- Pagination -->
      <div class="mt-auto shrink-0 p-4 flex justify-end border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredData.length"
        />
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <ScheduledNotificationModal
      v-model="modalVisible"
      :module-key="moduleKey"
      :edit-data="editingConfig"
      :prefill-data="prefillData"
      @saved="fetchConfigs"
    />

    <!-- Logs Modal -->
    <ScheduledNotificationLogsModal
      v-model="logsModalVisible"
      :config-id="logsConfigId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, Refresh, Plus, MoreFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { scheduledNotificationService, type ScheduledNotifyConfig } from '@/api/scheduledNotificationService'
import ScheduledNotificationModal from './ScheduledNotificationModal.vue'
import ScheduledNotificationLogsModal from './ScheduledNotificationLogsModal.vue'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'

const { laManHep, hienBang, hienThe } = dungManHep()

const props = defineProps<{
  moduleKey: string
}>()

// ── State ──
const loading = ref(false)
const configs = ref<(ScheduledNotifyConfig & { _toggling?: boolean })[]>([])

// Filters
const filterEnabled = ref('')
const filterNotifyType = ref('')
const searchQuery = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Modal state
const modalVisible = ref(false)
const editingConfig = ref<any>(null)
const prefillData = ref<any>(null)

// Logs modal state
const logsModalVisible = ref(false)
const logsConfigId = ref('')

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

// ── Helpers ──
const getNotifyTypeLabel = (type: string) => {
  for (const opts of Object.values(notifyTypeOptionsMap)) {
    const found = opts.find(o => o.value === type)
    if (found) return found.label
  }
  return type
}

const getScheduleLabel = (type: string) => {
  const map: Record<string, string> = {
    daily: 'Hàng ngày',
    weekly: 'Hàng tuần',
    monthly: 'Hàng tháng',
    yearly: 'Hàng năm',
    specific_date: 'Ngày cụ thể',
  }
  return map[type] || type
}

type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

const getScheduleTagType = (type: string): TagType => {
  const map: Record<string, TagType> = {
    daily: 'info',
    weekly: 'success',
    monthly: 'warning',
    yearly: 'danger',
    specific_date: 'primary',
  }
  return map[type] || 'info'
}

// ── Data fetching ──
const fetchConfigs = async () => {
  loading.value = true
  try {
    const data = await scheduledNotificationService.getConfigs({
      module_key: props.moduleKey,
      is_enabled: filterEnabled.value || undefined,
      notify_type: filterNotifyType.value || undefined,
    })
    configs.value = data.map(c => ({ ...c, _toggling: false }))
  } catch (error: any) {
    ElMessage.error(error.message || 'Không thể tải danh sách cấu hình thông báo')
  } finally {
    loading.value = false
  }
}

// ── Computed: filter & paginate ──
const filteredData = computed(() => {
  return configs.value.filter(c => {
    const q = searchQuery.value.toLowerCase()
    if (q && !(
      (c.group_name || '').toLowerCase().includes(q) ||
      (c.chat_id || '').toLowerCase().includes(q) ||
      (c.reference_id || '').toLowerCase().includes(q) ||
      (c.reference_name || '').toLowerCase().includes(q)
    )) return false
    return true
  })
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

// ── Actions ──
const openCreateDialog = () => {
  editingConfig.value = null
  prefillData.value = null
  modalVisible.value = true
}

const handleCommand = (cmd: string, row: any) => {
  if (cmd === 'edit') {
    editingConfig.value = { ...row }
    prefillData.value = null
    modalVisible.value = true
  } else if (cmd === 'delete') {
    handleDelete(row)
  } else if (cmd === 'test') {
    handleTest(row)
  } else if (cmd === 'logs') {
    logsConfigId.value = row.id
    logsModalVisible.value = true
  }
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `Xóa cấu hình thông báo "${row.group_name || row.chat_id}"?`,
      'Xác nhận xóa',
      { type: 'warning', confirmButtonText: 'Xóa', cancelButtonText: 'Hủy' }
    )
    await scheduledNotificationService.deleteConfig(row.id)
    ElMessage.success('Đã xóa cấu hình thông báo')
    fetchConfigs()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || 'Không thể xóa cấu hình')
    }
  }
}

const handleToggle = async (row: any) => {
  row._toggling = true
  try {
    await scheduledNotificationService.toggleConfig(row.id)
    ElMessage.success(row.is_enabled ? 'Đã bật thông báo' : 'Đã tắt thông báo')
  } catch (error: any) {
    row.is_enabled = !row.is_enabled // revert
    ElMessage.error(error.message || 'Không thể thay đổi trạng thái')
  } finally {
    row._toggling = false
  }
}

const handleTest = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `Gửi thử thông báo tới "${row.group_name || row.chat_id}"?`,
      'Gửi thử',
      { type: 'info', confirmButtonText: 'Gửi', cancelButtonText: 'Hủy' }
    )
    ElMessage.info('Đang gửi thử...')
    const result = await scheduledNotificationService.testConfig(row.id)
    if (result.status === 'SUCCESS' || result.success) {
      ElMessage.success('Gửi thử thành công!')
    } else {
      ElMessage.warning(`Kết quả: ${result.status || 'UNKNOWN'} — ${result.error_message || ''}`)
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || 'Gửi thử thất bại')
    }
  }
}

onMounted(() => {
  fetchConfigs()
})
</script>

<style scoped>
.notification-container {
  height: 100%;
}

.notification-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

html.dark .notification-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}
html.dark .notification-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}
html.dark .notification-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}
html.dark .notification-container :deep(.el-table .el-table-fixed-column--left),
html.dark .notification-container :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important;
}

html.dark .notification-container .custom-dark-select :deep(.el-input__wrapper),
html.dark .notification-container .custom-dark-input :deep(.el-input__wrapper) {
  background-color: #1f2937;
  box-shadow: 0 0 0 1px #374151 inset;
}
html.dark .notification-container .custom-dark-select :deep(.el-input__inner),
html.dark .notification-container .custom-dark-input :deep(.el-input__inner) {
  color: #f3f4f6;
}
</style>
