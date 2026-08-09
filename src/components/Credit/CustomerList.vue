<template>
  <div class="credit-container h-full flex flex-col">
    <!-- Filter Bar -->
    <div class="flex justify-between items-center mb-4 shrink-0">
      <div class="flex items-center gap-4">
        <!-- Classification Filter -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Phân loại:</span>
          <el-select
            v-model="selectedClassification"
            placeholder="Tất cả"
            clearable
            style="width: 140px"
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Tất cả" value="" />
            <el-option
              v-for="item in classifications"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </div>

        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
          <el-input
            v-model="searchQuery"
            placeholder="Tìm mã KH, tên khách hàng, tên nhóm..."
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
        <el-table-column prop="customer_id" label="Mã KH" width="130" sortable="custom" fixed>
          <template #default="{ row }">
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.customer_id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="customer_name" label="Tên khách hàng" width="200" sortable="custom" fixed show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.customer_name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="group_name" label="Tên nhóm" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-gray-600 dark:text-gray-400 font-medium">{{ row.group_name || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="contact_info" label="Liên hệ (Telegram)" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono text-violet-600 dark:text-violet-400">{{ row.contact_info || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="classification" label="Phân loại" width="130" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.classification" size="small" type="info" effect="plain" class="font-bold">
              {{ row.classification }}
            </el-tag>
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_credit_limit" label="Hạn mức tín dụng" width="160" align="right">
          <template #default="{ row }">
            <span class="font-semibold text-gray-700 dark:text-gray-300">{{ formatCurrency(row.total_credit_limit) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="remaining_credit_limit" label="Hạn mức còn lại" width="160" align="right">
          <template #default="{ row }">
            <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ formatCurrency(row.remaining_credit_limit) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_principal_outstanding" label="Tổng dư nợ gốc" width="160" align="right">
          <template #default="{ row }">
            <span :class="row.total_principal_outstanding > 0 ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-gray-400'">
              {{ formatCurrency(row.total_principal_outstanding) }}
            </span>
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
        <el-form :model="form" :rules="rules" ref="formRef" label-width="170px" class="mt-2 compact-form">

          <!-- PHẦN 1: THÔNG TIN CHUNG -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin chung
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã Khách hàng" prop="customer_id">
                  <el-input v-model="form.customer_id" placeholder="VD: KH-CR-001..." :disabled="isEdit" />
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
              <el-col :span="12">
                <el-form-item label="Liên hệ (Telegram)" prop="contact_info">
                  <el-input v-model="form.contact_info" placeholder="VD: @telegram_username..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Phân loại" prop="classification">
                  <el-select
                    v-model="form.classification"
                    placeholder="Chọn hoặc nhập phân loại..."
                    filterable
                    allow-create
                    default-first-option
                    clearable
                    class="w-full text-left"
                  >
                    <el-option
                      v-for="item in classifications"
                      :key="item"
                      :label="item"
                      :value="item"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: THÔNG TIN TÍN DỤNG -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Hạn mức &amp; Dư nợ tín dụng
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Hạn mức tín dụng (VNĐ)">
                  <el-input v-model="form.total_credit_limit_text" placeholder="Nhập hạn mức tín dụng..." @input="(v) => handlePriceInput(v, 'total_credit_limit')">
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Hạn mức còn lại (VNĐ)">
                  <el-input v-model="form.remaining_credit_limit_text" placeholder="Nhập hạn mức còn lại..." @input="(v) => handlePriceInput(v, 'remaining_credit_limit')">
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tổng dư nợ gốc (VNĐ)">
                  <el-input v-model="form.total_principal_outstanding_text" placeholder="Nhập tổng dư nợ gốc..." @input="(v) => handlePriceInput(v, 'total_principal_outstanding')">
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">Hủy</el-button>
          <el-button type="primary" @click="submitForm">Xác nhận</el-button>
        </span>
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
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-left">Khách hàng tín dụng</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5 text-left">
              {{ selectedCustomer.customer_name }}
              <span class="text-gray-400 dark:text-gray-500 font-medium">({{ selectedCustomer.customer_id }})</span>
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span v-if="selectedCustomer.contact_info" class="flex items-center gap-1">
                <el-icon><Message /></el-icon>
                {{ selectedCustomer.contact_info }}
              </span>
              <span v-if="selectedCustomer.contact_info && selectedCustomer.group_name" class="text-gray-300 dark:text-gray-600">|</span>
              <span v-if="selectedCustomer.group_name" class="flex items-center gap-1">
                <el-icon><Location /></el-icon>
                Nhóm: {{ selectedCustomer.group_name }}
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
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tên Nhóm</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedCustomer.group_name || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Liên hệ Telegram</div>
              <div class="text-sm font-mono text-violet-650 dark:text-violet-400">{{ selectedCustomer.contact_info || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Phân loại</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-250">
                <el-tag v-if="selectedCustomer.classification" size="small" type="info" effect="plain" class="font-bold">
                  {{ selectedCustomer.classification }}
                </el-tag>
                <span v-else class="text-gray-400">—</span>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 2. HẠN MỨC & DƯ NỢ -->
        <div>
          <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
            Hạn mức & Dư nợ tín dụng
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Hạn mức tín dụng</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ formatCurrency(selectedCustomer.total_credit_limit) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Hạn mức còn lại</div>
              <div class="text-sm font-extrabold text-emerald-650 dark:text-emerald-400">{{ formatCurrency(selectedCustomer.remaining_credit_limit) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tổng dư nợ gốc</div>
              <div class="text-sm font-extrabold" :class="selectedCustomer.total_principal_outstanding > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500'">
                {{ formatCurrency(selectedCustomer.total_principal_outstanding) }}
              </div>
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
import { Search, MoreFilled, User, Message, Location, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { creditService } from '@/api/creditService'

interface Customer {
  id: string
  customer_id: string
  group_name: string
  customer_name: string
  contact_info: string
  total_credit_limit: number
  remaining_credit_limit: number
  total_principal_outstanding: number
  classification?: string
}

const loading = ref(false)
const searchQuery = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

const customers = ref<Customer[]>([])
const classifications = ref<string[]>([])
const selectedClassification = ref('')

const fetchClassifications = async () => {
  try {
    const data = await creditService.getClassifications()
    classifications.value = data
  } catch (error) {
    console.error('Failed to fetch classifications:', error)
  }
}

const filteredCustomers = computed(() => {
  return customers.value.filter(c => {
    const q = searchQuery.value.toLowerCase()
    const matchesSearch = !q ||
      c.customer_name.toLowerCase().includes(q) ||
      c.customer_id.toLowerCase().includes(q) ||
      (c.group_name && c.group_name.toLowerCase().includes(q)) ||
      (c.contact_info && c.contact_info.toLowerCase().includes(q))

    const matchesClassification = !selectedClassification.value ||
      c.classification === selectedClassification.value

    return matchesSearch && matchesClassification
  })
})

const sortProp = ref('')
const sortOrder = ref('')

const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  sortProp.value = prop
  sortOrder.value = order
}

const sortedCustomers = computed(() => {
  const list = [...filteredCustomers.value]
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

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedCustomers.value.slice(start, end)
})

// Add/Edit Dialog State
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
  total_credit_limit: 0,
  total_credit_limit_text: '',
  remaining_credit_limit: 0,
  remaining_credit_limit_text: '',
  total_principal_outstanding: 0,
  total_principal_outstanding_text: '',
  classification: ''
})

const rules = reactive({
  customer_id: [{ required: true, message: 'Vui lòng nhập mã khách hàng', trigger: 'blur' }],
  customer_name: [{ required: true, message: 'Vui lòng nhập tên khách hàng', trigger: 'blur' }]
})

const handlePriceInput = (val: string, field: string) => {
  const numericVal = val.replace(/[^0-9]/g, '')
  const num = parseInt(numericVal, 10)
  const formAny = form as any
  if (!isNaN(num)) {
    formAny[field] = num
    formAny[`${field}_text`] = new Intl.NumberFormat('vi-VN').format(num)
  } else {
    formAny[field] = 0
    formAny[`${field}_text`] = ''
  }
}

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
  form.classification = ''
  
  const fields = ['total_credit_limit', 'remaining_credit_limit', 'total_principal_outstanding']
  const formAny = form as any
  fields.forEach(f => {
    formAny[f] = 0
    formAny[`${f}_text`] = ''
  })
  
  dialogVisible.value = true
}

const openEditDialog = (row: Customer) => {
  isEdit.value = true
  form.id = row.id
  form.customer_id = row.customer_id
  form.group_name = row.group_name
  form.customer_name = row.customer_name
  form.contact_info = row.contact_info
  form.classification = row.classification || ''
  
  const fields = ['total_credit_limit', 'remaining_credit_limit', 'total_principal_outstanding']
  const formAny = form as any
  fields.forEach(f => {
    const val = (row as any)[f] || 0
    formAny[f] = val
    formAny[`${f}_text`] = val ? new Intl.NumberFormat('vi-VN').format(val) : ''
  })
  
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
        total_credit_limit: Number(form.total_credit_limit) || 0,
        remaining_credit_limit: Number(form.remaining_credit_limit) || 0,
        total_principal_outstanding: Number(form.total_principal_outstanding) || 0,
        classification: form.classification || null
      }

      if (isEdit.value) {
        loading.value = true
        try {
          const editPayload = { ...payload, id: form.id }
          const updatedCustomers = await creditService.updateCreditCustomers([editPayload])
          if (updatedCustomers && updatedCustomers.length > 0) {
            const index = customers.value.findIndex(c => c.id === form.id)
            if (index !== -1) {
              customers.value[index] = updatedCustomers[0]
            }
            ElMessage.success('Cập nhật khách hàng thành công!')
            dialogVisible.value = false
            await fetchClassifications()
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
          const addedCustomers = await creditService.addCreditCustomers([payload])
          if (addedCustomers && addedCustomers.length > 0) {
            customers.value.push(addedCustomers[0])
            ElMessage.success('Thêm mới khách hàng thành công!')
            dialogVisible.value = false
            await fetchClassifications()
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
      await creditService.deleteCreditCustomers([row.id])
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
    const data = await creditService.getCreditCustomers()
    customers.value = data
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi tải danh sách khách hàng')
  } finally {
    loading.value = false
  }
}

// Helpers
const formatCurrency = (val: number) => {
  if (!val) return '0 VNĐ'
  return new Intl.NumberFormat('vi-VN').format(val) + ' VNĐ'
}

onMounted(() => {
  fetchCustomers()
  fetchClassifications()
})
</script>

<style scoped>
.credit-container {
  height: 100%;
}

.credit-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

html.dark .credit-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}
html.dark .credit-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}
html.dark .credit-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}
html.dark .credit-container :deep(.el-table .el-table-fixed-column--left),
html.dark .credit-container :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important;
}

html.dark .custom-dark-input :deep(.el-input__wrapper) {
  background-color: #111827 !important;
  box-shadow: 0 0 0 1px #4b5563 inset !important;
}
html.dark .custom-dark-input :deep(.el-input__inner) {
  color: #f3f4f6;
}
</style>
