<template>
  <div class="rental-container h-full flex flex-col">
    <!-- Filter Bar -->
    <div class="flex justify-between items-center mb-4 shrink-0">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
          <el-input
            v-model="searchQuery"
            placeholder="Tìm mã KH, tên khách hàng, tên nhóm, SĐT..."
            :prefix-icon="Search"
            clearable
            class="w-64 custom-dark-input"
          />
        </div>
      </div>
      <div class="flex items-center gap-2">
        <el-button :icon="Refresh" circle @click="fetchCustomers" :loading="loading" />
        <el-button type="primary" @click="openAddDialog">Thêm khách hàng</el-button>
      </div>
    </div>

    <!-- Table Container -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
      <el-table v-loading="loading" :data="paginatedData" style="width: 100%" class="flex-1" height="100%" @sort-change="handleSortChange">
        <el-table-column label="STT" width="70" align="center" fixed>
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="customer_id" label="Mã KH" width="140" sortable="custom" fixed>
          <template #default="{ row }">
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.customer_id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="customer_name" label="Tên khách hàng" width="220" sortable="custom" fixed>
          <template #default="{ row }">
            <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.customer_name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="group_name" label="Tên nhóm" min-width="250">
          <template #default="{ row }">
            <span class="text-gray-600 dark:text-gray-400 font-medium">{{ row.group_name || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="number_phone" label="Số điện thoại" width="150" />
        <el-table-column prop="contact_info" label="Liên hệ (Telegram)" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono text-violet-600 dark:text-violet-400">{{ row.contact_info || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Actions -->
        <el-table-column fixed="right" label="Thao tác" width="90" align="center">
          <template #default="{ row }">
            <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
              <el-button link type="info" class="p-1">
                <el-icon class="text-xl"><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="detail">Chi tiết</el-dropdown-item>
                  <el-dropdown-item command="edit">Chỉnh sửa</el-dropdown-item>
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
          :page-sizes="[10, 20, 50, 100]"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredCustomers.length"
        />
      </div>
    </div>

    <!-- Add/Edit Customer Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'CHỈNH SỬA THÔNG TIN KHÁCH HÀNG' : 'THÊM KHÁCH HÀNG MỚI'"
      width="900px"
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
        >
          <!-- PHẦN 1: THÔNG TIN CHUNG -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin chung
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã Khách hàng" prop="customer_id">
                  <el-input v-model="form.customer_id" placeholder="VD: KH-001..." :disabled="isEdit" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tên khách hàng" prop="customer_name">
                  <el-input v-model="form.customer_name" placeholder="Nhập tên khách hàng..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tên Nhóm" prop="group_name">
                  <el-input v-model="form.group_name" placeholder="Nhập tên nhóm..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: LIÊN LẠC & TELEGRAM -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-green-500 rounded-full"></span>
              Liên lạc &amp; Telegram
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Số điện thoại" prop="number_phone">
                  <el-input v-model="form.number_phone" placeholder="Nhập số điện thoại..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Liên hệ (Telegram)" prop="contact_info">
                  <el-input v-model="form.contact_info" placeholder="VD: @telegram_username..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-form>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2 pr-2">
          <el-button @click="dialogVisible = false">Hủy</el-button>
          <el-button type="primary" @click="submitForm">Xác nhận</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Customer Details Dialog -->
    <el-dialog 
      v-model="detailDialogVisible" 
      title="CHI TIẾT THÔNG TIN KHÁCH HÀNG" 
      width="750px" 
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedCustomer" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto overflow-x-hidden text-left">
        <!-- Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-blue-500 dark:bg-blue-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32">
              <User />
            </el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-left">Khách hàng</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5 text-left">
              {{ selectedCustomer.customer_name }}
              <span class="text-gray-400 dark:text-gray-500 font-medium">({{ selectedCustomer.customer_id }})</span>
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span v-if="selectedCustomer.number_phone" class="flex items-center gap-1">
                <el-icon><Phone /></el-icon>
                {{ selectedCustomer.number_phone }}
              </span>
              <span v-if="selectedCustomer.number_phone && selectedCustomer.contact_info" class="text-gray-300 dark:text-gray-600">|</span>
              <span v-if="selectedCustomer.contact_info" class="flex items-center gap-1">
                <el-icon><Message /></el-icon>
                {{ selectedCustomer.contact_info }}
              </span>
            </div>
          </div>
        </div>

        <!-- 1. THÔNG TIN KHÁCH HÀNG -->
        <div>
          <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            Thông tin chung
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã Khách hàng</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedCustomer.customer_id }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tên khách hàng</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedCustomer.customer_name }}</div>
            </div>
            <div class="col-span-2">
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tên Nhóm</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedCustomer.group_name || '—' }}</div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 2. THÔNG TIN LIÊN HỆ -->
        <div>
          <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
            Thông tin liên hệ
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số điện thoại</div>
              <div class="text-sm font-bold text-gray-850 dark:text-gray-200">{{ selectedCustomer.number_phone || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Liên hệ (Telegram)</div>
              <div class="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">{{ selectedCustomer.contact_info || '—' }}</div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="detailDialogVisible = false">Đóng</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Search, MoreFilled, User, Location, Phone, Message, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { rentalService } from '@/api/rentalService'

interface Customer {
  id: string
  customer_id: string
  group_name: string
  customer_name: string
  contact_info: string
  number_phone: string
}

const loading = ref(false)
const searchQuery = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Active reactive customers list state
const customers = ref<Customer[]>([])

// Filters & Search logic
const filteredCustomers = computed(() => {
  return customers.value.filter(c => {
    const q = searchQuery.value.toLowerCase()
    return !q ||
      c.customer_name.toLowerCase().includes(q) ||
      c.customer_id.toLowerCase().includes(q) ||
      c.number_phone.includes(q) ||
      (c.group_name && c.group_name.toLowerCase().includes(q)) ||
      (c.contact_info && c.contact_info.toLowerCase().includes(q))
  })
})

const sortProp = ref('')
const sortOrder = ref('')

const handleSortChange = ({ prop, order }: { prop: string, order: string }) => {
  sortProp.value = prop
  sortOrder.value = order
}

const sortedCustomers = computed(() => {
  const result = [...filteredCustomers.value]
  if (sortProp.value && sortOrder.value) {
    result.sort((a: any, b: any) => {
      const valA = a[sortProp.value] ?? ''
      const valB = b[sortProp.value] ?? ''
      const compare = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' })
      return sortOrder.value === 'ascending' ? compare : -compare
    })
  }
  return result
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedCustomers.value.slice(start, end)
})

// Dialog Add/Edit State
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<any>(null)

// Detail Dialog State
const detailDialogVisible = ref(false)
const selectedCustomer = ref<Customer | null>(null)

const openDetailDialog = (row: Customer) => {
  selectedCustomer.value = row
  detailDialogVisible.value = true
}

const form = reactive({
  id: '',
  customer_id: '',
  group_name: '',
  customer_name: '',
  contact_info: '',
  number_phone: ''
})

const rules = reactive({
  customer_id: [{ required: true, message: 'Vui lòng nhập mã khách hàng', trigger: 'blur' }],
  customer_name: [{ required: true, message: 'Vui lòng nhập tên khách hàng', trigger: 'blur' }]
})

const handleCommand = (cmd: string, row: Customer) => {
  if (cmd === 'detail') {
    openDetailDialog(row)
  } else if (cmd === 'edit') {
    openEditDialog(row)
  } else if (cmd === 'delete') {
    handleDelete(row)
  }
}

const openAddDialog = () => {
  isEdit.value = false
  form.id = ''
  form.customer_id = ''
  form.group_name = ''
  form.customer_name = ''
  form.contact_info = ''
  form.number_phone = ''
  dialogVisible.value = true
}

const openEditDialog = (row: Customer) => {
  isEdit.value = true
  form.id = row.id
  form.customer_id = row.customer_id
  form.group_name = row.group_name
  form.customer_name = row.customer_name
  form.contact_info = row.contact_info
  form.number_phone = row.number_phone
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      const payload = {
        customer_id: form.customer_id,
        group_name: form.group_name,
        customer_name: form.customer_name,
        contact_info: form.contact_info,
        number_phone: form.number_phone
      }

      if (isEdit.value) {
        loading.value = true
        try {
          const editPayload = { ...payload, id: form.id }
          const updatedCustomers = await rentalService.updateRentalCustomers([editPayload])
          if (updatedCustomers && updatedCustomers.length > 0) {
            const index = customers.value.findIndex(c => c.id === form.id)
            if (index !== -1) {
              customers.value[index] = updatedCustomers[0]
            }
            ElMessage.success('Cập nhật khách hàng thành công!')
            dialogVisible.value = false
          } else {
            ElMessage.error('Không nhận được phản hồi từ server')
          }
        } catch (error: any) {
          ElMessage.error(error.message || 'Lỗi khi cập nhật khách hàng')
        } finally {
          loading.value = false
        }
      } else {
        loading.value = true
        try {
          const addedCustomers = await rentalService.addRentalCustomers([payload])
          if (addedCustomers && addedCustomers.length > 0) {
            customers.value.push(addedCustomers[0])
            ElMessage.success('Thêm mới khách hàng thành công!')
            dialogVisible.value = false
          } else {
            ElMessage.error('Không nhận được phản hồi từ server')
          }
        } catch (error: any) {
          ElMessage.error(error.message || 'Lỗi khi thêm mới khách hàng')
        } finally {
          loading.value = false
        }
      }
    }
  })
}

const handleDelete = async (row: Customer) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa khách hàng "${row.customer_name}"? Hành động này không thể hoàn tác.`,
      'Xác nhận xóa khách hàng',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy bỏ',
        type: 'warning'
      }
    )
    loading.value = true
    try {
      await rentalService.deleteRentalCustomers([row.id])
      customers.value = customers.value.filter(c => c.id !== row.id)
      ElMessage.success('Xóa khách hàng thành công!')
    } catch (error: any) {
      ElMessage.error(error.message || 'Lỗi khi xóa khách hàng')
    } finally {
      loading.value = false
    }
  } catch (err) {
    // cancelled
  }
}

const fetchCustomers = async () => {
  loading.value = true
  try {
    const data = await rentalService.getRentalCustomers()
    customers.value = data
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi tải danh sách khách hàng')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCustomers()
})
</script>

<style scoped>
.rental-container {
  height: 100%;
}

.rental-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

html.dark .rental-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}
html.dark .rental-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}
html.dark .rental-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}
html.dark .rental-container :deep(.el-table .el-table-fixed-column--left),
html.dark .rental-container :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important;
}

html.dark .custom-dark-select :deep(.el-input__wrapper),
html.dark .custom-dark-input :deep(.el-input__wrapper) {
  background-color: #111827 !important;
  box-shadow: 0 0 0 1px #4b5563 inset !important;
}
html.dark .custom-dark-select :deep(.el-input__inner),
html.dark .custom-dark-input :deep(.el-input__inner) {
  color: #f3f4f6;
}
</style>
