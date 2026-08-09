<template>
  <div class="lands-container h-full flex flex-col">
    <!-- Filter Bar -->
    <div class="flex flex-wrap justify-between items-center gap-4 mb-4 shrink-0">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Search Input -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
          <el-input
            v-model="searchQuery"
            placeholder="Tìm mã đất, tên đất, địa chỉ..."
            :prefix-icon="Search"
            clearable
            class="w-64 custom-dark-input"
          />
        </div>

        <!-- Affiliation Select -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Trực thuộc:</span>
          <el-select
            v-model="selectedAffiliation"
            class="filter-select affiliation-select"
            style="width: 140px"
            popper-class="filter-select-popper"
          >
            <el-option label="Tất cả" value="all" />
            <el-option v-for="aff in affiliationOptions" :key="aff" :label="aff" :value="aff" />
          </el-select>
        </div>

        <!-- Status Select -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái:</span>
          <el-select
            v-model="selectedStatus"
            class="filter-select status-select"
            style="width: 140px"
            popper-class="filter-select-popper"
          >
            <el-option label="Tất cả" value="all" />
            <el-option label="Hoạt động" value="ACTIVE" />
            <el-option label="Ngừng hoạt động" value="INACTIVE" />
          </el-select>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <el-button :icon="Refresh" circle @click="fetchLands" :loading="loading" />
        <el-button type="primary" @click="openAddDialog">
          <el-icon class="mr-1"><Plus /></el-icon> Thêm Đất trồng trọt
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
        <el-table-column prop="land_code" label="Mã đất" width="120" sortable="custom" fixed>
          <template #default="{ row }">
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.land_code }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="land_name" label="Tên đất" min-width="180">
          <template #default="{ row }">
            <span class="font-semibold text-gray-850 dark:text-gray-100">{{ row.land_name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="affiliation" label="Trực thuộc" width="140">
          <template #default="{ row }">
            <span class="text-gray-650 dark:text-gray-300 font-medium">{{ row.affiliation }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_area" label="Tổng diện tích (ha)" width="150" align="right">
          <template #default="{ row }">
            <span class="font-bold text-gray-800 dark:text-gray-200">{{ formatNumber(row.total_area) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="harvest_area" label="Đang thu hoạch (ha)" width="165" align="right">
          <template #default="{ row }">
            <span class="font-semibold text-emerald-600 dark:text-emerald-400">{{ formatNumber(row.harvest_area) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="planting_area" label="Đang trồng (ha)" width="150" align="right">
          <template #default="{ row }">
            <span class="font-semibold text-blue-500 dark:text-blue-400">{{ formatNumber(row.planting_area) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="empty_area" label="Diện tích trống (ha)" width="160" align="right">
          <template #default="{ row }">
            <span class="font-semibold text-amber-500 dark:text-amber-400">{{ formatNumber(row.empty_area) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="harvesting_trees" :label="cropType === 'cao_su' ? 'Cây thu hoạch' : 'Số cây thu hoạch'" width="140" align="right">
          <template #default="{ row }">
            <span>{{ formatInt(row.harvesting_trees) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="planting_trees" :label="cropType === 'cao_su' ? 'Cây đang trồng' : 'Số cây đang trồng'" width="145" align="right">
          <template #default="{ row }">
            <span>{{ formatInt(row.planting_trees) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="Địa chỉ" min-width="180" show-overflow-tooltip />
        <el-table-column prop="status" label="Trạng thái" width="130" align="center">
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
          :total="filteredLands.length"
        />
      </div>
    </div>

    <!-- Add/Edit Land Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'CHỈNH SỬA ĐẤT TRỒNG TRỌT' : 'THÊM ĐẤT TRỒNG TRỌT MỚI'"
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
                <el-form-item label="Mã Đất" prop="land_code">
                  <el-input v-model="form.land_code" placeholder="VD: DT-CS-01..." :disabled="isEdit" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tên Đất" prop="land_name">
                  <el-input v-model="form.land_name" placeholder="VD: Vườn cao su A..." />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Trực Thuộc" prop="affiliation">
                  <el-select v-model="form.affiliation" placeholder="Chọn đơn vị trực thuộc" style="width: 100%">
                    <el-option v-for="opt in affiliationOptions" :key="opt" :label="opt" :value="opt" />
                  </el-select>
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
              <el-col :span="12">
                <el-form-item label="Loại cây trồng" prop="crop_type">
                  <el-select v-model="form.crop_type" placeholder="Chọn loại cây trồng" style="width: 100%">
                    <el-option label="Cao su" value="cao_su" />
                    <el-option label="Sầu riêng" value="sau_rieng" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Địa chỉ" prop="address">
                  <el-input v-model="form.address" placeholder="Nhập địa chỉ khu đất..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: PHÂN BỔ DIỆN TÍCH & CÂY TRỒNG -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Phân bổ diện tích &amp; Cây trồng
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tổng diện tích (ha)" prop="total_area">
                  <el-input-number v-model="form.total_area" :precision="2" :step="0.5" :min="0" class="w-full" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Diện tích trống (ha)" prop="empty_area">
                  <el-input-number v-model="form.empty_area" :precision="2" :step="0.5" :min="0" class="w-full" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Đang thu hoạch (ha)" prop="harvest_area">
                  <el-input-number v-model="form.harvest_area" :precision="2" :step="0.5" :min="0" class="w-full" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Đang trồng (ha)" prop="planting_area">
                  <el-input-number v-model="form.planting_area" :precision="2" :step="0.5" :min="0" class="w-full" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item :label="cropType === 'cao_su' ? 'Cây thu hoạch' : 'Số cây thu hoạch'" prop="harvesting_trees">
                  <el-input-number v-model="form.harvesting_trees" :step="50" :min="0" class="w-full" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="cropType === 'cao_su' ? 'Cây đang trồng' : 'Số cây đang trồng'" prop="planting_trees">
                  <el-input-number v-model="form.planting_trees" :step="50" :min="0" class="w-full" style="width: 100%" />
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

    <!-- Land Details Dialog -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT ĐẤT TRỒNG TRỌT"
      width="750px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedLand" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto overflow-x-hidden text-left">
        <!-- Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-blue-500 dark:bg-blue-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32">
              <Location />
            </el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              {{ cropType === 'cao_su' ? 'Đất trồng Cao su' : 'Đất trồng Sầu riêng' }}
            </div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {{ selectedLand.land_name }}
              <span class="text-gray-400 dark:text-gray-500 font-medium">({{ selectedLand.land_code }})</span>
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <el-tag :type="selectedLand.status === 'ACTIVE' ? 'success' : 'danger'" effect="light" size="small" round>
                {{ selectedLand.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động' }}
              </el-tag>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span class="text-gray-500 dark:text-gray-400">Trực thuộc: <strong class="text-gray-700 dark:text-gray-200">{{ selectedLand.affiliation }}</strong></span>
            </div>
          </div>
        </div>

        <!-- 1. THÔNG TIN CHUNG -->
        <div>
          <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            Thông tin chung
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã Đất</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedLand.land_code }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tên khu đất</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedLand.land_name }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Trực thuộc đơn vị</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedLand.affiliation }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Địa chỉ</div>
              <div class="text-sm text-gray-700 dark:text-gray-300">{{ selectedLand.address || '—' }}</div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 2. PHÂN BỔ DIỆN TÍCH (ha) -->
        <div>
          <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
            Phân bổ diện tích
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tổng diện tích</div>
              <div class="text-base font-extrabold text-gray-800 dark:text-gray-100">{{ formatNumber(selectedLand.total_area) }} ha</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Đang thu hoạch</div>
              <div class="text-base font-bold text-emerald-600 dark:text-emerald-400">{{ formatNumber(selectedLand.harvest_area) }} ha</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Đang trồng mới</div>
              <div class="text-base font-semibold text-blue-500 dark:text-blue-400">{{ formatNumber(selectedLand.planting_area) }} ha</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Diện tích trống</div>
              <div class="text-base font-semibold text-amber-500 dark:text-amber-400">{{ formatNumber(selectedLand.empty_area) }} ha</div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 3. SỐ CÂY TRÊN ĐẤT -->
        <div>
          <h4 class="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
            Mật độ cây trồng
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                {{ cropType === 'cao_su' ? 'Cây đang thu hoạch (cây)' : 'Cây sầu riêng đang thu hoạch (trái/cây)' }}
              </div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-100">{{ formatInt(selectedLand.harvesting_trees) }} cây</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                {{ cropType === 'cao_su' ? 'Cây đang trồng mới (cây)' : 'Cây sầu riêng đang trồng mới (cây)' }}
              </div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-100">{{ formatInt(selectedLand.planting_trees) }} cây</div>
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
import { Search, MoreFilled, Location, Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { harvestService } from '@/api/harvestService'

interface AgriculturalLand {
  id: string
  land_code: string
  land_name: string
  address: string
  total_area: number
  harvest_area: number
  empty_area: number
  planting_area: number
  harvesting_trees: number
  planting_trees: number
  affiliation: string
  status: 'ACTIVE' | 'INACTIVE'
  crop_type?: string
}

const props = defineProps<{
  cropType: 'cao_su' | 'sau_rieng'
}>()

const loading = ref(false)
const searchQuery = ref('')
const selectedAffiliation = ref('all')
const selectedStatus = ref('all')

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Dialog states
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<any>(null)
const detailDialogVisible = ref(false)
const selectedLand = ref<AgriculturalLand | null>(null)

// Affiliation options (Vĩnh Hà, Tiến Nga, Phong Điền, vv.)
const affiliationOptions = computed(() => {
  return props.cropType === 'cao_su'
    ? ['Vĩnh Hà', 'Tiến Nga', 'Nông trường Cao su 1', 'Nông trường Cao su 2']
    : ['Vĩnh Hà', 'Tiến Nga']
})

// Lands database
const lands = ref<AgriculturalLand[]>([])

// Form model
const form = reactive({
  id: '',
  land_code: '',
  land_name: '',
  address: '',
  total_area: 0,
  harvest_area: 0,
  empty_area: 0,
  planting_area: 0,
  harvesting_trees: 0,
  planting_trees: 0,
  affiliation: '',
  status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  crop_type: ''
})

const rules = reactive({
  land_code: [{ required: true, message: 'Vui lòng nhập mã đất', trigger: 'blur' }],
  land_name: [{ required: true, message: 'Vui lòng nhập tên đất', trigger: 'blur' }],
  affiliation: [{ required: true, message: 'Vui lòng chọn đơn vị trực thuộc', trigger: 'change' }],
  crop_type: [{ required: true, message: 'Vui lòng chọn loại cây trồng', trigger: 'change' }]
})

// Filter data depending on cropType
const filteredLands = computed(() => {
  return lands.value.filter(l => {
    // No cropType filtering - lands are shared between crop types

    // Filter by affiliation
    if (selectedAffiliation.value !== 'all' && l.affiliation !== selectedAffiliation.value) {
      return false
    }

    // Filter by status
    if (selectedStatus.value !== 'all' && l.status !== selectedStatus.value) {
      return false
    }

    // Search query
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      return (l.land_code ? l.land_code.toLowerCase().includes(q) : false) ||
        (l.land_name ? l.land_name.toLowerCase().includes(q) : false) ||
        (l.address ? l.address.toLowerCase().includes(q) : false)
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

const sortedLands = computed(() => {
  const list = [...filteredLands.value]
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
  return sortedLands.value.slice(start, end)
})

// Reset filters on cropType changes
watch(() => props.cropType, () => {
  selectedAffiliation.value = 'all'
  selectedStatus.value = 'all'
  searchQuery.value = ''
  currentPage.value = 1
  fetchLands()
})

const formatNumber = (val: number) => {
  return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(val)
}

const formatInt = (val: number) => {
  return new Intl.NumberFormat('vi-VN').format(val)
}

// Dialog management
const openDetailDialog = (row: AgriculturalLand) => {
  selectedLand.value = row
  detailDialogVisible.value = true
}

const openAddDialog = () => {
  isEdit.value = false
  form.id = ''
  form.land_code = ''
  form.land_name = ''
  form.address = ''
  form.total_area = 0
  form.harvest_area = 0
  form.empty_area = 0
  form.planting_area = 0
  form.harvesting_trees = 0
  form.planting_trees = 0
  form.affiliation = affiliationOptions.value[0] || ''
  form.status = 'ACTIVE'
  form.crop_type = props.cropType
  dialogVisible.value = true
}

const openEditDialog = (row: AgriculturalLand) => {
  isEdit.value = true
  form.id = row.id
  form.land_code = row.land_code
  form.land_name = row.land_name
  form.address = row.address
  form.total_area = row.total_area
  form.harvest_area = row.harvest_area
  form.empty_area = row.empty_area
  form.planting_area = row.planting_area
  form.harvesting_trees = row.harvesting_trees
  form.planting_trees = row.planting_trees
  form.affiliation = row.affiliation
  form.status = row.status
  form.crop_type = row.crop_type || props.cropType
  dialogVisible.value = true
}

const handleCommand = (cmd: string, row: AgriculturalLand) => {
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
      if (form.total_area < (form.harvest_area + form.planting_area + form.empty_area)) {
        ElMessage.warning('Tổng diện tích phải lớn hơn hoặc bằng tổng diện tích thành phần!')
        return
      }

      if (isEdit.value) {
        const payload: AgriculturalLand = {
          id: form.id,
          land_code: form.land_code,
          land_name: form.land_name,
          address: form.address,
          total_area: form.total_area,
          harvest_area: form.harvest_area,
          empty_area: form.empty_area,
          planting_area: form.planting_area,
          harvesting_trees: form.harvesting_trees,
          planting_trees: form.planting_trees,
          affiliation: form.affiliation,
          status: form.status,
          crop_type: form.crop_type || props.cropType
        }
        loading.value = true
        try {
          const updatedLands = await harvestService.updateAgriculturalLands([payload])
          if (updatedLands && updatedLands.length > 0) {
            const index = lands.value.findIndex(l => l.id === form.id)
            if (index !== -1) {
              lands.value[index] = updatedLands[0]
            }
            ElMessage.success('Cập nhật đất trồng trọt thành công!')
            dialogVisible.value = false
          } else {
            ElMessage.error('Không nhận được phản hồi từ server')
          }
        } catch (error: any) {
          ElMessage.error(error.message || 'Lỗi khi cập nhật đất trồng trọt')
        } finally {
          loading.value = false
        }
      } else {
        const payload = {
          land_code: form.land_code,
          land_name: form.land_name,
          address: form.address,
          total_area: form.total_area,
          harvest_area: form.harvest_area,
          empty_area: form.empty_area,
          planting_area: form.planting_area,
          harvesting_trees: form.harvesting_trees,
          planting_trees: form.planting_trees,
          affiliation: form.affiliation,
          status: form.status,
          crop_type: form.crop_type || props.cropType
        }

        loading.value = true
        try {
          const addedLands = await harvestService.addAgriculturalLands([payload])
          if (addedLands && addedLands.length > 0) {
            lands.value.unshift(addedLands[0])
            ElMessage.success('Thêm mới đất trồng trọt thành công!')
            dialogVisible.value = false
          } else {
            ElMessage.error('Không nhận được phản hồi từ server')
          }
        } catch (error: any) {
          ElMessage.error(error.message || 'Lỗi khi thêm mới đất trồng trọt')
        } finally {
          loading.value = false
        }
      }
    }
  })
}

const handleDelete = async (row: AgriculturalLand) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa đất trồng trọt "${row.land_name}" (${row.land_code})?`,
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy bỏ',
        type: 'warning'
      }
    )
    loading.value = true
    try {
      await harvestService.deleteAgriculturalLands([row.id])
      lands.value = lands.value.filter(l => l.id !== row.id)
      ElMessage.success('Xóa đất trồng trọt thành công!')
    } catch (error: any) {
      ElMessage.error(error.message || 'Lỗi khi xóa đất trồng trọt')
    } finally {
      loading.value = false
    }
  } catch (err) {
    // cancelled
  }
}

// Fetch lands from API
const fetchLands = async () => {
  loading.value = true
  try {
    const data = await harvestService.getAgriculturalLands({ crop_type: props.cropType })
    lands.value = data
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi tải danh sách đất trồng trọt')
  } finally {
    loading.value = false
  }
}

// Reset page on filter changes
watch([selectedAffiliation, selectedStatus, searchQuery], () => {
  currentPage.value = 1
})

onMounted(() => {
  fetchLands()
})
</script>

<style scoped>
.lands-container {
  height: 100%;
}

.lands-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

.lands-container :deep(.el-table td.el-table__cell .cell) {
  white-space: nowrap !important;
}

.lands-container :deep(.el-pagination) {
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

/* Custom dark mode styles for lands table */
html.dark .lands-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .lands-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .lands-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

html.dark .lands-container :deep(.el-table .el-table-fixed-column--left),
html.dark .lands-container :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important;
}

html.dark .custom-dark-input {
  --el-input-text-color: #f3f4f6 !important;
  --el-text-color-regular: #f3f4f6 !important;
  --el-text-color-placeholder: #9ca3af !important;
}

html.dark .custom-dark-input :deep(.el-input__wrapper) {
  background-color: #1f2937;
  box-shadow: 0 0 0 1px #374151 inset;
}

html.dark .custom-dark-input :deep(.el-input__inner) {
  color: #f3f4f6 !important;
  -webkit-text-fill-color: #f3f4f6 !important;
}

html.dark .custom-dark-input :deep(.el-input__inner::placeholder) {
  color: #9ca3af !important;
  -webkit-text-fill-color: #9ca3af !important;
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

.affiliation-select {
  width: 160px !important;
  min-width: 160px !important;
}
.affiliation-select :deep(.el-select__wrapper) {
  width: 100% !important;
  min-width: 160px !important;
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

/* Unscoped overrides for dark mode dialogs */
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
</style>
