<template>
  <div class="rosca-players-container h-full p-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex flex-col">
    <!-- Tab container mimicking Telegram Groups style -->
    <el-tabs v-model="activeTab" type="border-card" class="harvest-tabs h-full flex flex-col">
      <el-tab-pane name="players-list">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><User /></el-icon>
            <span>Thông tin người chơi Hụi</span>
          </span>
        </template>

        <div class="players-content h-full flex flex-col">
          <!-- Filter Bar -->
          <div class="flex flex-wrap justify-between items-center gap-4 mb-4 shrink-0">
            <div class="flex flex-wrap items-center gap-4">
              <!-- Vai trò (Role) -->
              <div class="flex items-center gap-2">
                <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Vai trò:</span>
                <el-select 
                  v-model="filters.role" 
                  placeholder="Tất cả" 
                  clearable 
                  class="custom-dark-input"
                  style="width: 140px"
                  @change="handleFilterChange"
                >
                  <el-option label="Tất cả" value="" />
                  <el-option label="Chủ hụi (Owner)" value="Owner" />
                  <el-option label="Người chơi (Player)" value="Player" />
                </el-select>
              </div>

              <!-- Trạng thái (Status) -->
              <div class="flex items-center gap-2">
                <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái:</span>
                <el-select 
                  v-model="filters.status" 
                  placeholder="Tất cả" 
                  clearable 
                  class="custom-dark-input"
                  style="width: 140px"
                  @change="handleFilterChange"
                >
                  <el-option label="Tất cả" value="" />
                  <el-option label="Đang hoạt động" value="Active" />
                  <el-option label="Hụi chết" value="Dead" />
                  <el-option label="Ngưng hoạt động" value="Closed" />
                </el-select>
              </div>

              <!-- Tìm kiếm (Search text) -->
              <div class="flex items-center gap-2">
                <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
                <el-input 
                  v-model="filters.search" 
                  placeholder="Nhập tên, mã, sđt..." 
                  clearable 
                  class="custom-dark-input"
                  style="width: 220px"
                  @input="handleSearchInput"
                  @clear="handleFilterChange"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </div>
            </div>

            <!-- Actions buttons -->
            <div class="flex items-center gap-2">
              <el-button :icon="Refresh" circle @click="fetchPlayers" :loading="loading" />
              <el-button 
                type="primary" 
                class="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 border-none rounded-xl font-semibold shadow-sm text-white flex items-center"
                @click="handleOpenCreateDialog"
              >
                <el-icon class="mr-1"><Plus /></el-icon>
                Thêm người chơi
              </el-button>
            </div>
          </div>

          <!-- Table Container -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
            <el-table 
              v-loading="loading"
              :data="paginatedPlayers" 
              style="width: 100%" 
              height="100%" 
              class="flex-1"
              @sort-change="handleSortChange"
            >
              <!-- STT -->
              <el-table-column label="STT" width="60" align="center" fixed>
                <template #default="{ $index }">
                  <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
                </template>
              </el-table-column>

              <!-- Mã ID (Code) -->
              <el-table-column prop="id" label="Mã ID" min-width="120" sortable="custom" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold select-all">{{ row.id }}</span>
                </template>
              </el-table-column>

              <!-- Họ & tên -->
              <el-table-column prop="full_name" label="Họ & tên" min-width="160" sortable="custom" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.full_name }}</span>
                </template>
              </el-table-column>

              <!-- Telegram Username -->
              <el-table-column label="Telegram" min-width="160" show-overflow-tooltip>
                <template #default="{ row }">
                  <a 
                    v-if="row.username" 
                    :href="'https://t.me/' + row.username.replace('@', '')" 
                    target="_blank"
                    class="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-semibold flex items-center gap-1"
                  >
                    <el-icon :size="14"><ChatLineRound /></el-icon>
                    <span>@{{ row.username.replace('@', '') }}</span>
                  </a>
                  <span v-else class="text-gray-400">—</span>
                </template>
              </el-table-column>

              <!-- Số điện thoại -->
              <el-table-column label="Số điện thoại" min-width="140" show-overflow-tooltip>
                <template #default="{ row }">
                  <span v-if="row.phone_number" class="font-mono text-xs text-gray-700 dark:text-gray-300 font-bold select-all">{{ row.phone_number }}</span>
                  <span v-else class="text-gray-400">—</span>
                </template>
              </el-table-column>

              <!-- CCCD -->
              <el-table-column label="CCCD" min-width="140" show-overflow-tooltip>
                <template #default="{ row }">
                  <span v-if="row.cccd" class="font-mono text-xs text-gray-700 dark:text-gray-300 font-bold select-all">{{ row.cccd }}</span>
                  <span v-else class="text-gray-400">—</span>
                </template>
              </el-table-column>

              <!-- Vai trò (Role) -->
              <el-table-column label="Vai trò" min-width="120" align="center">
                <template #default="{ row }">
                  <el-tag 
                    v-if="row.role"
                    :type="row.role === 'Owner' ? 'danger' : 'primary'"
                    effect="light"
                    class="font-bold"
                    size="small"
                  >
                    {{ row.role === 'Owner' ? 'Chủ Hụi' : 'Người Chơi' }}
                  </el-tag>
                  <span v-else class="text-gray-400">—</span>
                </template>
              </el-table-column>

              <!-- Trạng thái -->
              <el-table-column label="Trạng thái" min-width="130" align="center">
                <template #default="{ row }">
                  <el-tag 
                    v-if="row.status"
                    :type="row.status === 'Active' ? 'success' : 'info'"
                    effect="plain"
                    size="small"
                    class="font-semibold"
                  >
                    {{ row.status === 'Active' ? 'Đang hoạt động' : 'Ngừng hoạt động' }}
                  </el-tag>
                  <span v-else class="text-gray-400">—</span>
                </template>
              </el-table-column>

              <!-- Thao tác (Actions) -->
              <el-table-column fixed="right" label="Thao tác" width="90" align="center">
                <template #default="{ row }">
                  <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
                    <el-button link type="info" class="p-1 !text-gray-400 hover:!text-gray-600 dark:hover:!text-gray-200">
                      <el-icon :size="16"><MoreFilled /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="detail">Chi tiết</el-dropdown-item>
                        <el-dropdown-item command="edit">Chỉnh sửa</el-dropdown-item>
                        <el-dropdown-item command="schedule">Lên lịch hẹn</el-dropdown-item>
                        <el-dropdown-item command="delete" divided class="!text-red-500">Xóa</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </template>
              </el-table-column>
            </el-table>

            <!-- Pagination -->
            <div class="mt-auto shrink-0 p-4 flex justify-end border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50]"
                :background="true"
                layout="total, sizes, prev, pager, next, jumper"
                :total="filteredPlayers.length"
              />
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- Dialog: Add / Edit Player -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'CHỈNH SỬA THÔNG TIN NGƯỜI CHƠI' : 'THÊM MỚI NGƯỜI CHƠI'"
      width="850px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form 
          :model="form" 
          :rules="rules" 
          ref="formRef" 
          label-width="180px"
          class="mt-2 compact-form"
          @submit.prevent="submitForm"
        >
          <!-- PHẦN 1: THÔNG TIN CHUNG -->
          <div class="mb-6">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin chung
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã ID" prop="id" required>
                  <el-input 
                    v-model="form.id" 
                    placeholder="Ví dụ: TN001, G002..." 
                    :disabled="isEdit"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Họ và tên" prop="full_name" required>
                  <el-input v-model="form.full_name" placeholder="Nhập họ và tên..." />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Vai trò" prop="role" required>
                  <el-select v-model="form.role" placeholder="Chọn vai trò..." class="w-full highlight-select" style="width: 100%">
                    <el-option label="Chủ hụi (Owner)" value="Owner" />
                    <el-option label="Người chơi (Player)" value="Player" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Trạng thái" prop="status" required>
                  <el-select v-model="form.status" placeholder="Chọn trạng thái..." class="w-full highlight-select" style="width: 100%">
                    <el-option label="Đang hoạt động (Active)" value="Active" />
                    <el-option label="Hụi chết (Dead)" value="Dead" />
                    <el-option label="Ngưng hoạt động (Closed)" value="Closed" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: LIÊN LẠC & XÁC THỰC -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-violet-655 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
              Liên lạc &amp; Xác thực
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Username" prop="username">
                  <el-input v-model="form.username" placeholder="Telegram Username (không có @)..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Số điện thoại" prop="phone_number">
                  <el-input v-model="form.phone_number" placeholder="Nhập số điện thoại..." />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Số CCCD" prop="cccd">
                  <el-input v-model="form.cccd" placeholder="Nhập số CCCD..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-form>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3 pr-2">
          <el-button @click="dialogVisible = false">Hủy</el-button>
          <el-button 
            type="primary" 
            @click="submitForm" 
            :loading="submitting"
            class="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 border-none font-semibold text-white"
          >
            Xác nhận
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Dialog: Detail Player -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT NGƯỜI CHƠI HỤI"
      width="550px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedPlayer" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto text-left">
        <!-- Visual Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-150 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-blue-500 dark:bg-blue-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32"><User /></el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Hồ sơ người chơi Hụi</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {{ selectedPlayer.full_name }}
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <span class="text-gray-500 dark:text-gray-400">Vai trò: <strong class="text-gray-750 dark:text-gray-250">{{ selectedPlayer.role === 'Owner' ? 'Chủ Hụi' : 'Người Chơi' }}</strong></span>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span class="text-gray-500 dark:text-gray-400">Trạng thái: <strong>{{ selectedPlayer.status === 'Active' ? 'Đang hoạt động' : 'Ngừng hoạt động' }}</strong></span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã ID người chơi</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono select-all">{{ selectedPlayer.id }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Telegram Username</div>
            <div class="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono select-all">
              {{ selectedPlayer.username ? '@' + selectedPlayer.username : '—' }}
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số điện thoại</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono select-all">{{ selectedPlayer.phone_number || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số CCCD</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono select-all">{{ selectedPlayer.cccd || '—' }}</div>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="detailDialogVisible = false">Đóng</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Schedule Notification Modal -->
    <ScheduledNotificationModal
      v-model="scheduleModalVisible"
      module-key="rosca"
      :prefill-data="schedulePrefill"
      @saved="scheduleModalVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { User, Search, Refresh, Plus, ChatLineRound, MoreFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { roscaService, type UserRosca } from '@/api/roscaService'
import ScheduledNotificationModal from '@/components/ScheduledNotification/ScheduledNotificationModal.vue'

// State
const activeTab = ref('players-list')
const players = ref<UserRosca[]>([])
const loading = ref(false)
const submitting = ref(false)

// Schedule Notification Dialog State
const scheduleModalVisible = ref(false)
const schedulePrefill = ref<any>(null)

const openScheduleDialog = (row: UserRosca) => {
  schedulePrefill.value = {
    notify_type: 'rosca_payment',
    reference_id: row.id,
    reference_name: row.full_name,
    message_template: `Nhắc nhở đóng hụi\nNgười chơi: ${row.full_name} (ID: ${row.id})\nVai trò: ${row.role === 'Owner' ? 'Chủ Hụi' : 'Người Chơi'}\nSĐT: ${row.phone_number || 'Chưa cập nhật'}`,
  }
  scheduleModalVisible.value = true
}

// Pagination State
const currentPage = ref(1)
const pageSize = ref(10)

// Detail Dialog State
const detailDialogVisible = ref(false)
const selectedPlayer = ref<UserRosca | null>(null)

// Filters State
const filters = reactive({
  role: '',
  status: '',
  search: ''
})

// Dialog Form State
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

const form = reactive<UserRosca>({
  id: '',
  full_name: '',
  username: '',
  phone_number: '',
  cccd: '',
  role: 'Player',
  status: 'Active'
})

// Rules
const rules = {
  id: [
    { required: true, message: 'Vui lòng nhập Mã ID', trigger: 'blur' },
    { min: 2, message: 'Mã ID phải từ 2 ký tự trở lên', trigger: 'blur' }
  ],
  full_name: [
    { required: true, message: 'Vui lòng nhập Họ và tên', trigger: 'blur' }
  ],
  role: [
    { required: true, message: 'Vui lòng chọn vai trò', trigger: 'change' }
  ]
}

const isStatusMatch = (playerStatus?: string, filterVal?: string) => {
  if (!filterVal) return true
  const s = (playerStatus || '').toLowerCase()
  const f = filterVal.toLowerCase()

  if (f === 'active' || f === 'playing') {
    return s === 'active' || s === 'playing'
  }
  if (f === 'defaulted' || f === 'dead') {
    return s === 'defaulted' || s === 'dead'
  }
  if (f === 'deactivate' || f === 'closed' || f === 'inactive') {
    return s === 'deactivate' || s === 'closed' || s === 'inactive'
  }
  return s === f
}

// Fetch list of players from API
const fetchPlayers = async () => {
  loading.value = true
  try {
    const data = await roscaService.getUserRoscas({
      role: filters.role || undefined
    })
    players.value = data
  } catch (error: any) {
    console.error(error)
    ElMessage.error(error.message || 'Lỗi khi tải danh sách người chơi')
  } finally {
    loading.value = false
  }
}

// Handle change in filters
const handleFilterChange = () => {
  currentPage.value = 1
}

// Search input handling
let searchTimeout: any = null
const handleSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
  }, 300)
}

// Client-side filtration for search input to support name/cccd/telegram username
const filteredPlayers = computed(() => {
  return players.value.filter(player => {
    if (!isStatusMatch(player.status, filters.status)) {
      return false
    }

    if (!filters.search) return true
    const searchLower = filters.search.toLowerCase().trim()
    const idMatch = player.id?.toLowerCase().includes(searchLower)
    const nameMatch = player.full_name?.toLowerCase().includes(searchLower)
    const usernameMatch = player.username?.toLowerCase().includes(searchLower)
    const phoneMatch = player.phone_number?.toLowerCase().includes(searchLower)
    const cccdMatch = player.cccd?.toLowerCase().includes(searchLower)

    return idMatch || nameMatch || usernameMatch || phoneMatch || cccdMatch
  })
})

const sortProp = ref('')
const sortOrder = ref('')

const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  sortProp.value = prop
  sortOrder.value = order
}

const sortedPlayers = computed(() => {
  const list = [...filteredPlayers.value]
  if (!sortProp.value || !sortOrder.value) return list

  return list.sort((a, b) => {
    const valA = (a as any)[sortProp.value] || ''
    const valB = (b as any)[sortProp.value] || ''

    let res = 0
    if (typeof valA === 'number' && typeof valB === 'number') {
      res = valA - valB
    } else {
      res = String(valA).localeCompare(String(valB), 'vi', { numeric: true })
    }

    return sortOrder.value === 'ascending' ? res : -res
  })
})

// Computed paginated players
const paginatedPlayers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedPlayers.value.slice(start, end)
})

// Open create dialog
const handleOpenCreateDialog = () => {
  isEdit.value = false
  form.id = ''
  form.full_name = ''
  form.username = ''
  form.phone_number = ''
  form.cccd = ''
  form.role = 'Player'
  form.status = 'Active'
  dialogVisible.value = true
}

// Open edit dialog
const handleOpenEditDialog = (row: UserRosca) => {
  isEdit.value = true
  form.id = row.id
  form.full_name = row.full_name
  form.username = row.username || ''
  form.phone_number = row.phone_number || ''
  form.cccd = row.cccd || ''
  form.role = row.role || 'Player'
  form.status = row.status || 'Active'
  dialogVisible.value = true
}

// Open detail dialog
const handleOpenDetailDialog = (row: UserRosca) => {
  selectedPlayer.value = row
  detailDialogVisible.value = true
}

// Handle action menu command selection
const handleCommand = (cmd: string, row: UserRosca) => {
  if (cmd === 'detail') {
    handleOpenDetailDialog(row)
  } else if (cmd === 'edit') {
    handleOpenEditDialog(row)
  } else if (cmd === 'delete') {
    handleDelete(row)
  } else if (cmd === 'schedule') {
    openScheduleDialog(row)
  }
}

// Form Submit (Add/Update)
const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true
      try {
        const payload: UserRosca = {
          id: form.id.trim(),
          full_name: form.full_name.trim(),
          username: form.username?.trim() || undefined,
          phone_number: form.phone_number?.trim() || undefined,
          cccd: form.cccd?.trim() || undefined,
          role: form.role,
          status: form.status
        }

        if (isEdit.value) {
          await roscaService.updateUserRoscas([payload])
          ElMessage.success('Cập nhật thông tin người chơi thành công!')
        } else {
          await roscaService.addUserRoscas([payload])
          ElMessage.success('Thêm mới người chơi thành công!')
        }
        dialogVisible.value = false
        await fetchPlayers()
      } catch (error: any) {
        ElMessage.error(error.message || 'Không thể lưu thông tin người chơi')
      } finally {
        submitting.value = false
      }
    }
  })
}

// Delete player handler
const handleDelete = (row: UserRosca) => {
  ElMessageBox.confirm(
    `Bạn có chắc chắn muốn xóa người chơi "${row.full_name}" (ID: ${row.id}) không?`,
    'Xác nhận xóa người chơi',
    {
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy bỏ',
      type: 'warning'
    }
  ).then(async () => {
    loading.value = true
    try {
      await roscaService.deleteUserRoscas([row.id])
      ElMessage.success('Đã xóa người chơi thành công!')
      await fetchPlayers()
    } catch (error: any) {
      ElMessage.error(error.message || 'Lỗi khi xóa người chơi')
    } finally {
      loading.value = false
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchPlayers()
})
</script>

<style scoped>
.rosca-players-container {
  height: 100%;
}
.harvest-tabs {
  border-radius: 8px;
  overflow: hidden;
}
.harvest-tabs :deep(.el-tabs__content) {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}
.harvest-tabs :deep(.el-tab-pane) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
.harvest-tabs .custom-tabs-label .el-icon {
  vertical-align: middle;
}
.harvest-tabs .custom-tabs-label span {
  vertical-align: middle;
  margin-left: 4px;
}

html.dark .harvest-tabs {
  background-color: #1f2937;
  border-color: #374151;
}
html.dark .harvest-tabs :deep(.el-tabs__header) {
  background-color: #111827;
  border-bottom-color: #374151;
}
html.dark .harvest-tabs :deep(.el-tabs__item) {
  color: #9ca3af;
  border-color: transparent;
  transition: all 0.3s;
}
html.dark .harvest-tabs :deep(.el-tabs__item:hover) {
  color: #d1d5db;
}
html.dark .harvest-tabs :deep(.el-tabs__item.is-active) {
  background-color: #1f2937;
  border-right-color: #374151;
  border-left-color: #374151;
  border-bottom-color: #1f2937;
  color: #60a5fa;
}

.players-content {
  height: 100%;
}

/* Custom dark mode styles for table to match application theme */
html.dark .players-content :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .players-content :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .players-content :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

html.dark .players-content :deep(.el-table .el-table-fixed-column--left),
html.dark .players-content :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important;
}

html.dark .custom-dark-input {
  --el-input-text-color: #f3f4f6 !important;
  --el-text-color-regular: #f3f4f6 !important;
  --el-text-color-placeholder: #9ca3af !important;
}

html.dark .custom-dark-input :deep(.el-input__wrapper),
html.dark .custom-dark-input :deep(.el-select__wrapper) {
  background-color: #1f2937 !important;
  box-shadow: 0 0 0 1px #374151 inset !important;
}

html.dark .custom-dark-input :deep(.el-input__inner),
html.dark .custom-dark-input :deep(.el-select__placeholder) {
  color: #f3f4f6 !important;
  -webkit-text-fill-color: #f3f4f6 !important;
  opacity: 1 !important;
}
</style>
