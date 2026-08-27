<template>
  <div class="laptop-container h-full flex flex-col">
    <!-- Filter Bar -->
    <div class="flex flex-wrap justify-between items-center gap-4 mb-4 shrink-0">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Classification select -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Phân loại:</span>
          <el-select
            v-model="filterClassification"
            placeholder="Tất cả"
            clearable
            class="w-56 custom-dark-input"
            style="width: 120px"
            @change="handleClassificationChange"
          >
            <el-option label="Tất cả" value="" />
            <el-option label="Công việc" value="Công việc" />
            <el-option label="Cá nhân" value="Cá nhân" />
          </el-select>
        </div>

        <!-- Search query input -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
          <el-input
            v-model="searchQuery"
            placeholder="Dòng máy, hãng, CPU, Service Tag..."
            clearable
            class="w-64 custom-dark-input"
            style="width: 256px"
          />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <el-button :icon="Refresh" circle @click="fetchLaptops" :loading="loading" />
        <el-button type="primary" @click="openAddDialog">
          <el-icon class="mr-1"><Plus /></el-icon> Thêm Laptop
        </el-button>
      </div>
    </div>

    <!-- Table Container -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
      <el-table v-loading="loading" :data="paginatedLaptops" style="width: 100%" class="flex-1" height="100%">
        <!-- STT Column -->
        <el-table-column label="STT" width="60" align="center" fixed>
          <template #default="{ $index }">
            <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>

        <!-- Mã máy (ID) -->
        <el-table-column prop="id" label="Mã máy (ID)" width="140" fixed show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.id }}</span>
          </template>
        </el-table-column>

        <!-- Hãng sản xuất -->
        <el-table-column prop="brand" label="Hãng" width="130" fixed show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-bold text-gray-800 dark:text-gray-200">{{ row.brand || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Dòng máy -->
        <el-table-column prop="model_name" label="Dòng máy" min-width="180" fixed show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-bold text-gray-850 dark:text-gray-100">{{ row.model_name }}</span>
          </template>
        </el-table-column>

        <!-- Phân loại -->
        <el-table-column prop="classification" label="Phân loại" width="130" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.classification" size="small" :type="row.classification === 'Công việc' ? 'primary' : 'success'" effect="plain">
              {{ row.classification }}
            </el-tag>
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>

        <!-- CPU -->
        <el-table-column prop="processor_cpu" label="Bộ xử lý CPU" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-xs text-gray-700 dark:text-gray-300 font-semibold">{{ row.processor_cpu || '—' }}</span>
          </template>
        </el-table-column>

        <!-- RAM -->
        <el-table-column prop="ram_size" label="Dung lượng RAM" width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-xs text-gray-700 dark:text-gray-300">{{ row.ram_size || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Ổ cứng -->
        <el-table-column prop="storage_specs" label="Ổ cứng" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-xs text-gray-700 dark:text-gray-300">{{ row.storage_specs || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Card màn hình (GPU) -->
        <el-table-column prop="gpu_card" label="Card đồ họa (GPU)" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-xs text-gray-700 dark:text-gray-300">{{ row.gpu_card || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Service Tag / S/N -->
        <el-table-column prop="service_tag" label="Service Tag (S/N)" width="165" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono text-xs text-gray-700 dark:text-gray-300 font-bold">{{ row.service_tag || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Địa chỉ MAC -->
        <el-table-column prop="mac_address" label="Địa chỉ MAC" width="165" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono text-xs text-gray-650 dark:text-gray-350">{{ row.mac_address || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Hạn bảo hành -->
        <el-table-column prop="warranty_expiry" label="Hạn bảo hành" width="140" align="center">
          <template #default="{ row }">
            <span class="font-mono text-xs">{{ formatDate(row.warranty_expiry) }}</span>
          </template>
        </el-table-column>

        <!-- Trạng thái -->
        <el-table-column prop="status" label="Trạng thái" width="150" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getStatusTagType(row.status)" effect="dark" class="font-bold">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Phụ kiện đi kèm -->
        <el-table-column prop="accessories" label="Phụ kiện" min-width="180" show-overflow-tooltip />

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
                  <el-dropdown-item command="handover">Bàn giao</el-dropdown-item>
                  <el-dropdown-item command="return">Thu hồi</el-dropdown-item>
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
          :page-sizes="[10, 20, 50]"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredLaptops.length"
        />
      </div>
    </div>

    <!-- Dialog: Add / Edit Laptop -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'CHỈNH SỬA THÔNG TIN LAPTOP' : 'THÊM LAPTOP MỚI'"
      width="900px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="170px" class="mt-2 compact-form">
          <!-- PHẦN 1: THÔNG TIN CƠ BẢN -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin nhận diện máy
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã thiết bị (ID)" prop="id">
                  <el-input v-model="form.id" :disabled="isEdit" placeholder="VD: LT0001..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Hãng sản xuất" prop="brand">
                  <el-input v-model="form.brand" placeholder="VD: Dell, Apple, Lenovo..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Dòng máy" prop="model_name">
                  <el-input v-model="form.model_name" placeholder="VD: Dell XPS 13, MacBook Pro M3..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Service Tag (S/N)" prop="service_tag">
                  <el-input v-model="form.service_tag" placeholder="Nhập Service Tag..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Phân loại" prop="classification">
                  <el-select v-model="form.classification" placeholder="Chọn phân loại..." class="w-full">
                    <el-option label="Công việc" value="Công việc" />
                    <el-option label="Cá nhân" value="Cá nhân" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Địa chỉ MAC" prop="mac_address">
                  <el-input v-model="form.mac_address" placeholder="VD: AA:BB:CC:DD:EE:FF" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: THÔNG SỐ KỸ THUẬT -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Thông số phần cứng
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Bộ xử lý CPU" prop="processor_cpu">
                  <el-input v-model="form.processor_cpu" placeholder="VD: Intel Core i7 13700H, Apple M3..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Dung lượng RAM" prop="ram_size">
                  <el-input v-model="form.ram_size" placeholder="VD: 16 GB, 32 GB..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Cấu hình ổ cứng" prop="storage_specs">
                  <el-input v-model="form.storage_specs" placeholder="VD: SSD 512 GB PCIe, SSD 1 TB..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Card đồ họa (GPU)" prop="gpu_card">
                  <el-input v-model="form.gpu_card" placeholder="VD: NVIDIA RTX 4060, Intel Iris Xe..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 3: THỜI HẠN & TRẠNG THÁI -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-violet-650 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
              Thông tin bổ sung &amp; Bảo hành
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Thời hạn bảo hành" prop="warranty_expiry">
                  <el-date-picker :editable="false" v-model="form.warranty_expiry" type="date" value-format="YYYY-MM-DD" placeholder="Chọn ngày hết hạn..." class="!w-full" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Trạng thái máy" prop="status">
                  <el-select v-model="form.status" placeholder="Chọn trạng thái..." class="w-full">
                    <el-option
                      v-for="opt in DEVICE_STATUS_OPTIONS"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Phụ kiện đi kèm" prop="accessories">
                  <el-input v-model="form.accessories" placeholder="VD: Sạc zin, túi chống sốc, chuột không dây..." />
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

    <!-- Dialog: Detail Laptop -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT THÔNG TIN LAPTOP"
      width="750px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedLaptop" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto text-left">
        <!-- Visual Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-blue-500 dark:bg-blue-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32"><Cpu /></el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Máy tính xách tay</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {{ selectedLaptop.model_name }}
              <span class="text-gray-400 dark:text-gray-500 font-mono font-medium" v-if="selectedLaptop.brand">({{ selectedLaptop.brand }})</span>
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <span class="text-gray-500 dark:text-gray-400">Phân loại: <strong class="text-gray-750 dark:text-gray-250">{{ selectedLaptop.classification || '—' }}</strong></span>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span class="text-gray-500 dark:text-gray-400">CPU: <strong>{{ selectedLaptop.processor_cpu || '—' }}</strong></span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã máy (ID)</div>
            <div class="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">{{ selectedLaptop.id }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Service Tag (S/N)</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono">{{ selectedLaptop.service_tag || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Dung lượng RAM</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedLaptop.ram_size || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Cấu hình ổ cứng</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedLaptop.storage_specs || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Card đồ họa (GPU)</div>
            <div class="text-sm text-gray-700 dark:text-gray-300">{{ selectedLaptop.gpu_card || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Địa chỉ MAC</div>
            <div class="text-sm font-mono text-gray-700 dark:text-gray-300">{{ selectedLaptop.mac_address || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Thời hạn bảo hành</div>
            <div class="text-sm font-mono text-gray-750 dark:text-gray-300">{{ formatDate(selectedLaptop.warranty_expiry) }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Phụ kiện đi kèm</div>
            <div class="text-sm text-gray-700 dark:text-gray-300">{{ selectedLaptop.accessories || 'Không có' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Trạng thái</div>
            <div>
              <el-tag size="small" :type="getStatusTagType(selectedLaptop.status)" effect="dark" class="font-bold">
                {{ getStatusLabel(selectedLaptop.status) }}
              </el-tag>
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

    <!-- Modal: Bàn giao Laptop -->
    <DeviceHandoverModal
      v-model="handoverModalVisible"
      :device-info="handoverDeviceInfo"
      @success="handleHandoverSuccess"
    />

    <!-- Modal: Thu hồi Laptop -->
    <DeviceReturnModal
      v-model="returnModalVisible"
      :device-info="returnDeviceInfo"
      @success="handleReturnSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Cpu, Refresh, Plus, MoreFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { otherService } from '@/api/otherService'
import DeviceHandoverModal from './DeviceHandoverModal.vue'
import DeviceReturnModal from './DeviceReturnModal.vue'
import { DEVICE_STATUS_OPTIONS, getDeviceStatusLabel, getDeviceStatusTagType, isReadyForHandover, isHandedOverOrInUse, DeviceStatus } from '@/constants/deviceStatus'

// Search, Classification filters
const searchQuery = ref('')
const filterClassification = ref('')
const loading = ref(false)

const laptops = ref<any[]>([])

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Fetch laptops list from GET API
const fetchLaptops = async () => {
  loading.value = true
  currentPage.value = 1
  try {
    const data = await otherService.getLaptops({
      classification: filterClassification.value || undefined
    })
    laptops.value = data
  } catch (error: any) {
    console.error('API get-laptops failed:', error)
    ElMessage.error(error.message || 'Lỗi khi tải danh sách laptop từ API')
    laptops.value = []
  } finally {
    loading.value = false
  }
}

const handleClassificationChange = () => {
  fetchLaptops()
}

// Search Computed
const filteredLaptops = computed(() => {
  return laptops.value.filter(item => {
    const q = searchQuery.value.toLowerCase()
    
    const matchesSearch = !q ||
      item.model_name.toLowerCase().includes(q) ||
      (item.brand && item.brand.toLowerCase().includes(q)) ||
      (item.processor_cpu && item.processor_cpu.toLowerCase().includes(q)) ||
      (item.service_tag && item.service_tag.toLowerCase().includes(q)) ||
      (item.mac_address && item.mac_address.toLowerCase().includes(q))

    const matchesClassification = !filterClassification.value || 
      item.classification === filterClassification.value

    return matchesSearch && matchesClassification
  })
})

const paginatedLaptops = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredLaptops.value.slice(start, end)
})

// Dialog States
const dialogVisible = ref(false)
const isEdit = ref(false)
const detailDialogVisible = ref(false)
const selectedLaptop = ref<any | null>(null)
const formRef = ref<any>(null)

// Handover Modal State
const handoverModalVisible = ref(false)
const handoverDeviceInfo = ref<any | null>(null)

// Return Modal State
const returnModalVisible = ref(false)
const returnDeviceInfo = ref<any | null>(null)

const form = reactive({
  id: '',
  model_name: '',
  brand: '',
  processor_cpu: '',
  ram_size: '',
  storage_specs: '',
  gpu_card: '',
  service_tag: '',
  mac_address: '',
  warranty_expiry: '',
  status: 'available',
  accessories: '',
  classification: 'Công việc'
})

const rules = reactive({
  id: [{ required: true, message: 'Vui lòng nhập mã thiết bị (ID)', trigger: 'blur' }],
  model_name: [{ required: true, message: 'Vui lòng nhập tên dòng máy', trigger: 'blur' }],
  status: [{ required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change' }]
})

// Action Handlers
const handleCommand = (cmd: string, row: any) => {
  if (cmd === 'detail') {
    selectedLaptop.value = row
    detailDialogVisible.value = true
  } else if (cmd === 'handover') {
    if (!isReadyForHandover(row.status)) {
      ElMessage.warning('Chỉ thiết bị ở trạng thái "Sẵn sàng bàn giao" mới có thể thực hiện bàn giao!')
      return
    }
    handoverDeviceInfo.value = {
      id: row.id,
      type: 'laptop',
      status: row.status,
      model_name: row.model_name,
      brand: row.brand
    }
    handoverModalVisible.value = true
  } else if (cmd === 'return') {
    if (!isHandedOverOrInUse(row.status)) {
      ElMessage.warning('Chỉ thiết bị đang ở trạng thái "Đã bàn giao" hoặc "Đang sử dụng" mới có thể thực hiện thu hồi!')
      return
    }
    returnDeviceInfo.value = {
      id: row.id,
      type: 'laptop',
      status: row.status,
      model_name: row.model_name,
      brand: row.brand
    }
    returnModalVisible.value = true
  } else if (cmd === 'edit') {
    openEditDialog(row)
  } else if (cmd === 'delete') {
    handleDelete(row)
  }
}

const handleHandoverSuccess = () => {
  fetchLaptops()
}

const handleReturnSuccess = () => {
  fetchLaptops()
}

const openAddDialog = () => {
  isEdit.value = false
  form.id = ''
  form.brand = ''
  form.model_name = ''
  form.processor_cpu = ''
  form.ram_size = ''
  form.storage_specs = ''
  form.gpu_card = ''
  form.service_tag = ''
  form.mac_address = ''
  form.status = 'available'
  form.warranty_expiry = ''
  form.accessories = ''
  form.classification = 'Công việc'
  dialogVisible.value = true
}

const openEditDialog = (row: any) => {
  isEdit.value = true
  form.id = row.id
  form.brand = row.brand || ''
  form.model_name = row.model_name
  form.processor_cpu = row.processor_cpu || ''
  form.ram_size = row.ram_size || ''
  form.storage_specs = row.storage_specs || ''
  form.gpu_card = row.gpu_card || ''
  form.service_tag = row.service_tag || ''
  form.mac_address = row.mac_address || ''
  form.status = row.status
  form.warranty_expiry = row.warranty_expiry || ''
  form.accessories = row.accessories || ''
  form.classification = row.classification || 'Công việc'
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      const payload = {
        id: form.id,
        brand: form.brand || null,
        model_name: form.model_name,
        processor_cpu: form.processor_cpu || null,
        ram_size: form.ram_size || null,
        storage_specs: form.storage_specs || null,
        gpu_card: form.gpu_card || null,
        service_tag: form.service_tag || null,
        mac_address: form.mac_address || null,
        status: form.status,
        warranty_expiry: form.warranty_expiry || null,
        accessories: form.accessories || null,
        classification: form.classification || null
      }

      try {
        if (isEdit.value) {
          const editPayload = { ...payload }
          await otherService.updateLaptops([editPayload])

          const idx = laptops.value.findIndex(s => s.id === form.id)
          if (idx !== -1) {
            laptops.value[idx] = { ...laptops.value[idx], ...editPayload }
          }
          ElMessage.success('Cập nhật thông tin laptop thành công!')
        } else {
          const res = await otherService.addLaptops([payload])
          if (res && res.length > 0) {
            laptops.value.unshift(res[0])
          } else {
            laptops.value.unshift({ ...payload })
          }
          ElMessage.success('Thêm mới laptop thành công!')
        }
        dialogVisible.value = false
      } catch (error: any) {
        ElMessage.error(error.message || 'Lỗi khi lưu thông tin laptop')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa laptop "${row.model_name}" (${row.id}) khỏi cơ sở dữ liệu?`,
      'Xác nhận xóa thiết bị',
      {
        confirmButtonText: 'Xóa bỏ',
        cancelButtonText: 'Hủy',
        type: 'warning'
      }
    )
    loading.value = true
    await otherService.deleteLaptops([row.id])

    laptops.value = laptops.value.filter(s => s.id !== row.id)
    ElMessage.success('Xóa laptop thành công!')
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || 'Lỗi khi xóa laptop')
    }
  } finally {
    loading.value = false
  }
}

// Helpers
const formatDate = (val: string) => {
  if (!val) return '—'
  const parts = val.split('-')
  if (parts.length === 3) {
    const [y, m, d] = parts
    return `${d}/${m}/${y}`
  }
  return val
}

const getStatusLabel = (status: string) => {
  return getDeviceStatusLabel(status)
}

const getStatusTagType = (status: string) => {
  return getDeviceStatusTagType(status)
}

onMounted(() => {
  fetchLaptops()
})
</script>

<style scoped>
html.dark .laptop-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .laptop-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .laptop-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

html.dark .laptop-container :deep(.el-table .el-table-fixed-column--left),
html.dark .laptop-container :deep(.el-table .el-table-fixed-column--right) {
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
