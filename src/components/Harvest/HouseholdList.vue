<template>
  <div class="households-container h-full flex flex-col">
    <!-- Filter Bar -->
    <div class="flex justify-between items-center mb-4 shrink-0 flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <!-- Search Input -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
          <el-input
            v-model="searchQuery"
            placeholder="Tìm mã hộ, tên, số điện thoại, telegram..."
            :prefix-icon="Search"
            clearable
            class="w-80 custom-dark-input"
          />
        </div>

        <!-- Status Select -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái:</span>
          <el-select
            v-model="selectedStatus"
            class="filter-select status-select"
            style="width: 160px"
            popper-class="filter-select-popper"
          >
            <el-option label="Tất cả" value="all" />
            <el-option label="Hoạt động" value="ACTIVE" />
            <el-option label="Ngừng hoạt động" value="INACTIVE" />
          </el-select>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <el-button :icon="Refresh" circle @click="fetchHouseholds" :loading="loading" />
        <el-button type="primary" @click="openAddDialog">
          <el-icon class="mr-1"><Plus /></el-icon> Thêm Hộ dân
        </el-button>
      </div>
    </div>

    <!-- Table Container -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
      <el-table v-loading="loading" :data="paginatedData" style="width: 100%" class="flex-1" height="100%" @sort-change="handleSortChange">
        <!-- STT Column -->
        <el-table-column label="STT" width="60" align="center" fixed>
          <template #default="{ $index }">
            <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="household_code" label="Mã Hộ Dân" min-width="140" sortable="custom" fixed>
          <template #default="{ row }">
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.household_code }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="purchase_code" label="Mã Thu Mua" min-width="140">
          <template #default="{ row }">
            <span class="font-mono font-bold text-violet-650 dark:text-violet-400">{{ row.purchase_code || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="land_code" label="Mã Đất" min-width="130">
          <template #default="{ row }">
            <span class="font-mono text-gray-500 dark:text-gray-400">{{ row.land_code || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="fullname" label="Họ và tên" min-width="180">
          <template #default="{ row }">
            <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.fullname }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="Số điện thoại" min-width="140">
          <template #default="{ row }">
            <span class="font-mono text-gray-600 dark:text-gray-300">{{ row.phone || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="Liên hệ" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.username" class="font-mono text-blue-500">{{ row.username }}</span>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column prop="telegram_group" label="Nhóm Telegram" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.telegram_group" class="text-gray-600 dark:text-gray-300 font-medium">{{ row.telegram_group }}</span>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_debt" label="Công nợ" min-width="160" align="right">
          <template #default="{ row }">
            <span :class="row.total_debt > 0 ? 'text-rose-600 dark:text-rose-450 font-extrabold' : 'text-gray-400'">
              {{ formatCurrency(row.total_debt) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column 
          prop="price" 
          :label="cropType === 'cao_su' ? 'Giá cạo mủ' : 'Giá công'" 
          min-width="160" 
          align="right"
        >
          <template #default="{ row }">
            <span class="font-semibold text-gray-700 dark:text-gray-300">
              {{ cropType === 'cao_su' ? formatCurrency(row.tapping_price) : formatCurrency(row.labor_price) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="bank" label="Tài khoản ngân hàng" min-width="220">
          <template #default="{ row }">
            <div v-if="row.bank_account" class="text-xs">
              <div class="font-semibold text-gray-750 dark:text-gray-250">{{ row.bank_account }}</div>
              <div class="text-gray-400">{{ row.bank_name }}</div>
            </div>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="Địa chỉ" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="Trạng thái" min-width="140" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'" effect="light" size="small" round>
              {{ row.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động' }}
            </el-tag>
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
          :total="filteredHouseholds.length"
        />
      </div>
    </div>

    <!-- Add/Edit Household Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? (cropType === 'sau_rieng' ? 'CHỈNH SỬA HỘ DÂN SẦU RIÊNG' : 'CHỈNH SỬA THÔNG TIN HỘ DÂN') : (cropType === 'sau_rieng' ? 'THÊM HỘ DÂN SẦU RIÊNG MỚI' : 'THÊM HỘ DÂN MỚI')"
      width="900px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="180px" class="mt-2 compact-form">
          <!-- PHẦN 1: THÔNG TIN CHUNG -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin chung
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã Hộ Dân" prop="household_code">
                  <el-input v-model="form.household_code" :placeholder="cropType === 'cao_su' ? 'VD: HD-CS-001...' : 'VD: HD-SR-001...'" :disabled="isEdit" />
                </el-form-item>
              </el-col>
              <el-col :span="12" v-if="cropType === 'cao_su'">
                <el-form-item label="Mã Hộ Thu Mua" prop="purchase_code">
                  <el-input v-model="form.purchase_code" placeholder="VD: TM-01..." />
                </el-form-item>
              </el-col>
              <el-col :span="12" v-else>
                <el-form-item label="Mã Đất" prop="land_code">
                  <el-input v-model="form.land_code" placeholder="VD: DT-SR-01..." />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12" v-if="cropType === 'cao_su'">
                <el-form-item label="Mã Đất" prop="land_code">
                  <el-input v-model="form.land_code" placeholder="VD: DT-CS-01..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Họ Và Tên" prop="fullname">
                  <el-input v-model="form.fullname" placeholder="Nhập tên hộ dân..." />
                </el-form-item>
              </el-col>
              <el-col :span="12" v-if="cropType === 'sau_rieng'">
                <el-form-item label="SĐT" prop="phone">
                  <el-input v-model="form.phone" placeholder="Nhập số điện thoại..." />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12" v-if="cropType === 'cao_su'">
                <el-form-item label="SĐT" prop="phone">
                  <el-input v-model="form.phone" placeholder="Nhập số điện thoại..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Trạng thái" prop="status">
                  <el-select v-model="form.status" placeholder="Chọn trạng thái" style="width: 100%">
                    <el-option label="Hoạt động" value="ACTIVE" />
                    <el-option label="Ngừng hoạt động" value="INACTIVE" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Địa Chi" prop="address">
                  <el-input v-model="form.address" placeholder="Nhập địa chỉ..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: LIÊN LẠC, TÀI KHOẢN & TÀI CHÍNH -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Liên lạc, Tài khoản &amp; Tài chính
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Username" prop="username">
                  <el-input v-model="form.username" placeholder="VD: @ten_telegram..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Nhóm Telegram" prop="telegram_group">
                  <el-input v-model="form.telegram_group" placeholder="Nhập tên nhóm Telegram..." />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Số TK" prop="bank_account">
                  <el-input v-model="form.bank_account" placeholder="Nhập STK ngân hàng..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ngân Hàng" prop="bank_name">
                  <el-input v-model="form.bank_name" placeholder="VD: Vietcombank..." />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Công Nợ" prop="total_debt_text">
                  <el-input v-model="form.total_debt_text" placeholder="Nhập công nợ..." @input="(v) => handlePriceInput(v, 'total_debt')">
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="cropType === 'cao_su' ? 'Đơn Giá Cạo Mủ' : 'Tiền Công'" prop="price_text">
                  <el-input v-model="form.price_text" :placeholder="cropType === 'cao_su' ? 'Nhập đơn giá...' : 'Nhập tiền công...'" @input="(v) => handlePriceInput(v, 'price')">
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

    <!-- Household Details Dialog -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT THÔNG TIN HỘ DÂN"
      width="800px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedHousehold" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto overflow-x-hidden text-left">
        <!-- Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-emerald-500 dark:bg-emerald-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32">
              <User />
            </el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Hộ Dân Thu Hoạch</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {{ selectedHousehold.fullname }}
              <span class="text-gray-400 dark:text-gray-500 font-medium">({{ selectedHousehold.household_code }})</span>
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <el-tag :type="selectedHousehold.status === 'ACTIVE' ? 'success' : 'danger'" effect="light" size="small" round>
                {{ selectedHousehold.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động' }}
              </el-tag>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span class="text-gray-500 dark:text-gray-400">Mã đất: <strong class="text-blue-500 font-mono">{{ selectedHousehold.land_code || '—' }}</strong></span>
            </div>
          </div>
        </div>

        <!-- 1. THÔNG TIN CHUNG -->
        <div>
          <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            Thông tin liên lạc
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã Hộ dân</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-250">{{ selectedHousehold.household_code }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã Thu Mua</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-250">{{ selectedHousehold.purchase_code || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số điện thoại</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedHousehold.phone || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Địa chỉ</div>
              <div class="text-sm text-gray-700 dark:text-gray-300">{{ selectedHousehold.address || '—' }}</div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 2. TELEGRAM VÀ TÀI KHOẢN -->
        <div>
          <h4 class="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
            Mạng xã hội & Ngân hàng
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Username Telegram</div>
              <div class="text-sm font-mono text-violet-600 dark:text-violet-400">{{ selectedHousehold.username || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Nhóm Telegram</div>
              <div class="text-sm font-mono text-gray-750 dark:text-gray-350">{{ selectedHousehold.telegram_group || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tài khoản ngân hàng</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedHousehold.bank_account || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tên ngân hàng</div>
              <div class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ selectedHousehold.bank_name || '—' }}</div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 3. CÔNG NỢ & ĐƠN GIÁ -->
        <div>
          <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
            Thông tin Tài chính
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Công nợ hiện tại</div>
              <div class="text-base font-extrabold" :class="selectedHousehold.total_debt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400'">
                {{ formatCurrency(selectedHousehold.total_debt) }}
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                {{ cropType === 'cao_su' ? 'Đơn giá cạo mủ' : 'Tiền công' }}
              </div>
              <div class="text-base font-bold text-gray-850 dark:text-gray-150">
                {{ cropType === 'cao_su' ? formatCurrency(selectedHousehold.tapping_price) : formatCurrency(selectedHousehold.labor_price) }}
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
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { Search, MoreFilled, User, Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { harvestService } from '@/api/harvestService'

const props = defineProps<{
  cropType: 'cao_su' | 'sau_rieng'
}>()

const loading = ref(false)
const searchQuery = ref('')
const selectedStatus = ref('all')

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Dialog states
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<any>(null)
const detailDialogVisible = ref(false)
const selectedHousehold = ref<Household | null>(null)

interface Household {
  id: string
  household_code: string
  purchase_code: string | null
  land_code: string | null
  fullname: string
  username: string | null
  telegram_group: string | null
  phone: string | null
  address: string | null
  total_debt: number
  tapping_price: number  // Cao su
  labor_price: number    // Sầu riêng
  bank_account: string | null
  bank_name: string | null
  status: 'ACTIVE' | 'INACTIVE'
}

// Mock database
const households = ref<Household[]>([])

// Form state
const form = reactive({
  id: '',
  household_code: '',
  purchase_code: '',
  land_code: '',
  fullname: '',
  username: '',
  telegram_group: '',
  phone: '',
  address: '',
  total_debt: 0,
  total_debt_text: '',
  price: 0,
  price_text: '',
  bank_account: '',
  bank_name: '',
  status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
})

const rules = reactive<any>({
  household_code: [{ required: true, message: 'Vui lòng nhập mã hộ dân', trigger: 'blur' }],
  purchase_code: [{ required: true, message: 'Vui lòng nhập mã hộ thu mua', trigger: 'blur' }],
  fullname: [{ required: true, message: 'Vui lòng nhập họ và tên', trigger: 'blur' }]
})

watch(() => props.cropType, (newType) => {
  if (newType === 'sau_rieng') {
    delete rules.purchase_code
  } else {
    rules.purchase_code = [{ required: true, message: 'Vui lòng nhập mã hộ thu mua', trigger: 'blur' }]
  }
}, { immediate: true })


// Filter data depending on cropType
const filteredHouseholds = computed(() => {
  return households.value.filter(hh => {
    // Crop type filter: classify dynamically based on tapping_price / labor_price or code prefixes
    const isDurian = (hh.household_code && hh.household_code.startsWith('HD-SR')) ||
                     (hh.purchase_code && hh.purchase_code.startsWith('TM-SR')) ||
                     (hh.labor_price !== undefined && hh.labor_price > 0)
    const isRubber = !isDurian

    if (props.cropType === 'cao_su' && !isRubber) return false
    if (props.cropType === 'sau_rieng' && isRubber) return false

    // Filter by status
    if (selectedStatus.value !== 'all' && hh.status !== selectedStatus.value) {
      return false
    }

    // Search query
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      return (hh.household_code ? hh.household_code.toLowerCase().includes(q) : false) ||
        (hh.purchase_code ? hh.purchase_code.toLowerCase().includes(q) : false) ||
        (hh.land_code ? hh.land_code.toLowerCase().includes(q) : false) ||
        (hh.fullname ? hh.fullname.toLowerCase().includes(q) : false) ||
        (hh.phone ? hh.phone.includes(q) : false) ||
        (hh.username ? hh.username.toLowerCase().includes(q) : false)
    }

    return true
  })
})

const sortProp = ref('')
const sortOrder = ref('')

const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  sortProp.value = prop
  sortOrder.value = order
  currentPage.value = 1
}

const sortedHouseholds = computed(() => {
  const list = [...filteredHouseholds.value]
  if (!sortProp.value || !sortOrder.value) return list

  return list.sort((a: any, b: any) => {
    const valA = a[sortProp.value] ?? ''
    const valB = b[sortProp.value] ?? ''

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
  return sortedHouseholds.value.slice(start, end)
})

// Reset filters on cropType changes
watch(() => props.cropType, () => {
  searchQuery.value = ''
  currentPage.value = 1
})

const formatCurrency = (val: number) => {
  if (!val) return '0 VNĐ'
  return new Intl.NumberFormat('vi-VN').format(val) + ' VNĐ'
}

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

// Dialog management
const openDetailDialog = (row: Household) => {
  selectedHousehold.value = row
  detailDialogVisible.value = true
}

const openAddDialog = () => {
  isEdit.value = false
  form.id = ''
  form.household_code = ''
  form.purchase_code = ''
  form.land_code = ''
  form.fullname = ''
  form.username = ''
  form.telegram_group = ''
  form.phone = ''
  form.address = ''
  form.total_debt = 0
  form.total_debt_text = '0'
  form.price = 0
  form.price_text = '0'
  form.bank_account = ''
  form.bank_name = ''
  form.status = 'ACTIVE'
  dialogVisible.value = true
}

const openEditDialog = (row: Household) => {
  isEdit.value = true
  form.id = row.id
  form.household_code = row.household_code
  form.purchase_code = row.purchase_code || ''
  form.land_code = row.land_code || ''
  form.fullname = row.fullname
  form.username = row.username || ''
  form.telegram_group = row.telegram_group || ''
  form.phone = row.phone || ''
  form.address = row.address || ''
  
  form.total_debt = row.total_debt
  form.total_debt_text = row.total_debt ? new Intl.NumberFormat('vi-VN').format(row.total_debt) : ''

  const priceVal = props.cropType === 'cao_su' ? row.tapping_price : row.labor_price
  form.price = priceVal
  form.price_text = priceVal ? new Intl.NumberFormat('vi-VN').format(priceVal) : ''

  form.bank_account = row.bank_account || ''
  form.bank_name = row.bank_name || ''
  form.status = row.status
  dialogVisible.value = true
}

const handleCommand = (cmd: string, row: Household) => {
  if (cmd === 'detail') {
    openDetailDialog(row)
  } else if (cmd === 'edit') {
    openEditDialog(row)
  } else if (cmd === 'delete') {
    handleDelete(row)
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      const payload = {
        household_code: form.household_code ? form.household_code.trim() : '',
        purchase_code: form.purchase_code ? form.purchase_code.trim() : null,
        land_code: form.land_code ? form.land_code.trim() : null,
        fullname: form.fullname ? form.fullname.trim() : '',
        username: form.username ? form.username.trim() : null,
        telegram_group: form.telegram_group ? form.telegram_group.trim() : null,
        phone: form.phone ? form.phone.trim() : null,
        address: form.address ? form.address.trim() : null,
        total_debt: form.total_debt || 0,
        tapping_price: props.cropType === 'cao_su' ? form.price || 0 : 0,
        labor_price: props.cropType === 'sau_rieng' ? form.price || 0 : 0,
        bank_account: form.bank_account ? form.bank_account.trim() : null,
        bank_name: form.bank_name ? form.bank_name.trim() : null,
        status: form.status || 'ACTIVE'
      }

      if (isEdit.value) {
        loading.value = true
        try {
          const payloadWithId = {
            ...payload,
            id: form.id
          }
          const updatedHouseholds = await harvestService.updateHouseholds([payloadWithId])
          if (updatedHouseholds && updatedHouseholds.length > 0) {
            const index = households.value.findIndex(h => h.id === form.id)
            if (index !== -1) {
              households.value[index] = updatedHouseholds[0]
              ElMessage.success('Cập nhật thông tin hộ dân thành công!')
              dialogVisible.value = false
            } else {
              ElMessage.error('Không tìm thấy hộ dân cần cập nhật trong danh sách')
            }
          } else {
            ElMessage.error('Không nhận được phản hồi từ server')
          }
        } catch (error: any) {
          ElMessage.error(error.message || 'Lỗi khi cập nhật thông tin hộ dân')
        } finally {
          loading.value = false
        }
      } else {
        loading.value = true
        try {
          const addedHouseholds = await harvestService.addHouseholds([payload])
          if (addedHouseholds && addedHouseholds.length > 0) {
            households.value.unshift(addedHouseholds[0])
            ElMessage.success('Thêm mới hộ dân thành công!')
            dialogVisible.value = false
          } else {
            ElMessage.error('Không nhận được phản hồi từ server')
          }
        } catch (error: any) {
          ElMessage.error(error.message || 'Lỗi khi thêm mới hộ dân')
        } finally {
          loading.value = false
        }
      }
    }
  })
}

const handleDelete = async (row: Household) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa hộ dân "${row.fullname}" (${row.household_code})?`,
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy bỏ',
        type: 'warning'
      }
    )
    loading.value = true
    try {
      await harvestService.deleteHouseholds([row.id])
      households.value = households.value.filter(h => h.id !== row.id)
      ElMessage.success('Xóa hộ dân thành công!')
    } catch (error: any) {
      ElMessage.error(error.message || 'Lỗi khi xóa hộ dân')
    } finally {
      loading.value = false
    }
  } catch (err) {
    // cancelled
  }
}

// Fetch households from API
const fetchHouseholds = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (props.cropType === 'cao_su') {
      params.has_purchase_code = true
    }
    const data = await harvestService.getHouseholds(params)
    households.value = data
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi tải danh sách hộ dân')
  } finally {
    loading.value = false
  }
}

// Watch for crop type changes to re-fetch
watch(() => props.cropType, () => {
  searchQuery.value = ''
  selectedStatus.value = 'all'
  currentPage.value = 1
  fetchHouseholds()
})

// Reset page on filter changes
watch([selectedStatus, searchQuery], () => {
  currentPage.value = 1
})

onMounted(() => {
  fetchHouseholds()
})
</script>

<style scoped>
.households-container {
  height: 100%;
}

.households-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

.households-container :deep(.el-table td.el-table__cell .cell) {
  white-space: nowrap !important;
}

.households-container :deep(.el-pagination) {
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

/* Custom dark mode styles for households table */
html.dark .households-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .households-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .households-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

html.dark .households-container :deep(.el-table .el-table-fixed-column--left),
html.dark .households-container :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important;
}
html.dark .custom-dark-select,
html.dark .custom-dark-input {
  --el-input-text-color: #f3f4f6 !important;
  --el-text-color-regular: #f3f4f6 !important;
  --el-text-color-placeholder: #9ca3af !important;
}

html.dark .custom-dark-input :deep(.el-input__wrapper),
html.dark .custom-dark-select :deep(.el-input__wrapper) {
  background-color: #1f2937;
  box-shadow: 0 0 0 1px #374151 inset;
}

html.dark .custom-dark-input :deep(.el-input__inner),
html.dark .custom-dark-select :deep(.el-input__inner) {
  color: #f3f4f6 !important;
  -webkit-text-fill-color: #f3f4f6 !important;
  opacity: 1 !important;
}

/* Filter select styles (Affiliation & Status dropdowns) */
html.dark .filter-select :deep(.el-select__wrapper),
html.dark .filter-select :deep(.el-input__wrapper) {
  background-color: #111827 !important;
  box-shadow: 0 0 0 1px #374151 inset !important;
  color: #f3f4f6 !important;
}

html.dark .filter-select :deep(.el-select__placeholder),
html.dark .filter-select :deep(.el-select__selected-item),
html.dark .filter-select :deep(.el-input__inner) {
  color: #f3f4f6 !important;
  -webkit-text-fill-color: #f3f4f6 !important;
  opacity: 1 !important;
}

html.dark .filter-select :deep(.el-select__caret),
html.dark .filter-select :deep(.el-select__suffix .el-icon) {
  color: #9ca3af !important;
}

.status-select {
  width: 160px !important;
  min-width: 160px !important;
}
.status-select :deep(.el-select__wrapper) {
  width: 100% !important;
  min-width: 160px !important;
}
</style>

<style>
/* Popper dropdown in Dark Mode */
html.dark .custom-dark-select-popper.el-popper {
  background-color: #1f2937;
  border-color: #374151;
}

html.dark .custom-dark-select-popper .el-select-dropdown__item {
  color: #d1d5db;
}

html.dark .custom-dark-select-popper .el-select-dropdown__item.hover,
html.dark .custom-dark-select-popper .el-select-dropdown__item:hover {
  background-color: #374151;
  color: #ffffff;
}

html.dark .custom-dark-select-popper .el-select-dropdown__item.selected {
  color: #60a5fa;
  background-color: #111827;
  font-weight: bold;
}

html.dark .custom-dark-select-popper .el-popper__arrow::before {
  background-color: #1f2937 !important;
  border-color: #374151 !important;
}

/* Unscoped overrides for select placeholders in dark mode dialogs */
html.dark .custom-dark-dialog .el-input__inner {
  color: #f3f4f6 !important;
  -webkit-text-fill-color: #f3f4f6 !important;
  opacity: 1 !important;
}
html.dark .custom-dark-dialog .el-input__inner::placeholder {
  color: #9ca3af !important;
  -webkit-text-fill-color: #9ca3af !important;
}
html.dark .custom-dark-dialog {
  --el-input-text-color: #f3f4f6 !important;
  --el-text-color-regular: #f3f4f6 !important;
  --el-text-color-placeholder: #9ca3af !important;
}

/* Filter select popper dropdown in Dark Mode */
html.dark .filter-select-popper.el-popper {
  background-color: #1f2937;
  border-color: #374151;
}

html.dark .filter-select-popper .el-select-dropdown__item {
  color: #d1d5db;
}

html.dark .filter-select-popper .el-select-dropdown__item.hover,
html.dark .filter-select-popper .el-select-dropdown__item:hover {
  background-color: #374151;
  color: #ffffff;
}

html.dark .filter-select-popper .el-select-dropdown__item.is-selected {
  color: #60a5fa;
  font-weight: bold;
}

html.dark .filter-select-popper .el-popper__arrow::before {
  background-color: #1f2937 !important;
  border-color: #374151 !important;
}
</style>
