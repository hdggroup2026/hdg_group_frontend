<template>
  <div class="harvest-module-container h-full p-4 bg-gray-50 dark:bg-gray-900">
    <el-tabs v-model="activeTab" type="border-card" class="harvest-tabs h-full flex flex-col">
      
      <!-- Tab 1: Phương tiện -->
      <el-tab-pane name="vehicle">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Van /></el-icon>
            <span>Phương tiện</span>
          </span>
        </template>
        
        <div class="vehicle-tab-container h-full flex flex-col">
          <!-- Filter Bar -->
          <div class="flex flex-wrap justify-between items-center gap-4 mb-4 shrink-0">
            <div class="flex flex-wrap items-center gap-4">
              <!-- Status select -->
              <div class="flex items-center gap-2">
                <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái:</span>
                <el-select
                  v-model="filterStatus"
                  placeholder="Tất cả"
                  clearable
                  class="w-56 custom-dark-input"
                  style="width: 150px"
                  @change="handleStatusChange"
                >
                  <el-option label="Tất cả" value="" />
                  <el-option label="Hoạt động" value="activity" />
                  <el-option label="Không hoạt động" value="inactivity" />
                </el-select>
              </div>

              <!-- Search query input (Biển số xe) -->
              <div class="flex items-center gap-2">
                <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Biển số:</span>
                <el-input
                  v-model="searchLicensePlate"
                  placeholder="Nhập biển số xe..."
                  clearable
                  class="w-64 custom-dark-input"
                  style="width: 200px"
                  @input="handlePlateInput"
                />
              </div>
            </div>

            <div class="flex items-center gap-2">
              <el-button :icon="Refresh" circle @click="fetchVehicles" :loading="loading" />
              <el-button type="primary" @click="openAddDialog">
                <el-icon class="mr-1"><Plus /></el-icon> Thêm Phương tiện
              </el-button>
            </div>
          </div>

          <!-- Table Container -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
            <!-- ══════════════════════════════════════════════════════════════
                 MỤC 398 (29/08/2026) — BỎ CỘT GHIM, BẢNG CHỈ HIỆN TỪ 768px

                 Cột ghim `fixed` chiếm chỗ CỐ ĐỊNH và không co theo màn hình.
                 Trên màn 390px, mấy cột ghim cộng lại đã hết chỗ, nên vùng
                 cuộn còn lại bằng 0 và vuốt ngang không có tác dụng — người
                 dùng vuốt mà màn hình không nhúc nhích.

                 Đã bỏ 0 cột ghim ở bảng này.
                 ══════════════════════════════════════════════════════════ -->
            <el-table v-if="hienBang" v-loading="loading" :data="paginatedVehicles" style="width: 100%" class="flex-1" height="100%">
              <!-- STT Column -->
              <el-table-column label="STT" width="52" align="center">
                <template #default="{ $index }">
                  <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
                </template>
              </el-table-column>

              <!-- Mã phương tiện (ID) -->
              <el-table-column prop="id" label="Mã xe (ID)" width="108" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="font-mono text-xs text-gray-500 select-all">{{ row.id }}</span>
                </template>
              </el-table-column>

              <!-- Biển số xe -->
              <el-table-column prop="license_plate" label="Biển số" width="101" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="font-bold text-gray-850 dark:text-gray-100">{{ row.license_plate }}</span>
                </template>
              </el-table-column>

              <!-- Loại xe -->
              <el-table-column prop="vehicle_type" label="Loại xe" width="94" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="text-xs text-gray-750 dark:text-gray-300 font-semibold">{{ getVehicleTypeLabel(row.vehicle_type) }}</span>
                </template>
              </el-table-column>

              <!-- Hãng sản xuất -->
              <el-table-column prop="brand" label="Hãng" width="94" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="text-xs text-gray-700 dark:text-gray-300">{{ row.brand || '—' }}</span>
                </template>
              </el-table-column>

              <!-- Dòng xe (Model) -->
              <el-table-column prop="model" label="Dòng xe (Model)" width="115" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="text-xs text-gray-750 dark:text-gray-250">{{ row.model || '—' }}</span>
                </template>
              </el-table-column>

              <!-- Màu xe -->
              <el-table-column prop="color" label="Màu sắc" width="79" align="center" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="text-xs text-gray-700 dark:text-gray-300">{{ row.color || '—' }}</span>
                </template>
              </el-table-column>

              <!-- Chủ sở hữu -->
              <el-table-column prop="owner_name" label="Chủ sở hữu" min-width="122" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="text-xs text-gray-800 dark:text-gray-200 font-bold">{{ row.owner_name || '—' }}</span>
                </template>
              </el-table-column>

              <!-- Trạng thái -->
              <el-table-column prop="status" label="Trạng thái" width="108" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="getStatusTagType(row.status)" effect="dark" class="font-bold">
                    {{ getStatusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>

              <!-- Ngày tạo -->
              <el-table-column prop="created_time" label="Ngày tạo" width="122" align="center">
                <template #default="{ row }">
                  <span class="font-mono text-xs">{{ formatDateTime(row.created_time) }}</span>
                </template>
              </el-table-column>

              <!-- Actions -->
              <el-table-column label="Thao tác" width="60" align="center">
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
              <div v-if="paginatedVehicles.length > 0" class="grid grid-cols-1 gap-4">
                <div
                  v-for="(row, i) in (paginatedVehicles as any[])"
                  :key="row.id || row.contract_id || i"
                  class="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-sm"
                >
                  <div class="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
                    <div class="min-w-0 break-words">
                      <span class="font-mono text-xs text-gray-500 select-all">{{ row.id }}</span>
                    </div>
                    <div class="shrink-0">
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
                    </div>
                  </div>
                  <div class="space-y-2 text-sm text-left">
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Biển số:</span>
                      <span class="text-right break-words min-w-0">
                        <span class="font-bold text-gray-850 dark:text-gray-100">{{ row.license_plate }}</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Loại xe:</span>
                      <span class="text-right break-words min-w-0">
                        <span class="text-xs text-gray-750 dark:text-gray-300 font-semibold">{{ getVehicleTypeLabel(row.vehicle_type) }}</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Hãng:</span>
                      <span class="text-right break-words min-w-0">
                        <span class="text-xs text-gray-700 dark:text-gray-300">{{ row.brand || '—' }}</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Dòng xe (Model):</span>
                      <span class="text-right break-words min-w-0">
                        <span class="text-xs text-gray-750 dark:text-gray-250">{{ row.model || '—' }}</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Màu sắc:</span>
                      <span class="text-right break-words min-w-0">
                        <span class="text-xs text-gray-700 dark:text-gray-300">{{ row.color || '—' }}</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Chủ sở hữu:</span>
                      <span class="text-right break-words min-w-0">
                        <span class="text-xs text-gray-800 dark:text-gray-200 font-bold">{{ row.owner_name || '—' }}</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Trạng thái:</span>
                      <span class="text-right break-words min-w-0">
                        <el-tag size="small" :type="getStatusTagType(row.status)" effect="dark" class="font-bold">
                                            {{ getStatusLabel(row.status) }}
                                          </el-tag>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ngày tạo:</span>
                      <span class="text-right break-words min-w-0">
                        <span class="font-mono text-xs">{{ formatDateTime(row.created_time) }}</span>
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
                :page-sizes="[10, 20, 50]"
                :background="true"
                layout="total, sizes, prev, pager, next, jumper"
                :total="filteredVehicles.length"
              />
            </div>
          </div>
        </div>
      </el-tab-pane>

    </el-tabs>

    <!-- Dialog: Add / Edit Vehicle -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'CHỈNH SỬA THÔNG TIN PHƯƠNG TIỆN' : 'THÊM PHƯƠNG TIỆN MỚI'"
      width="900px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="170px" class="mt-2 compact-form">
          <!-- PHẦN 1: THÔNG TIN PHÁP LÝ & NHẬN DIỆN -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Đăng kiểm &amp; Biển số
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Biển số xe" prop="license_plate">
                  <el-input v-model="form.license_plate" placeholder="VD: 59A-123.45..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Chủ sở hữu" prop="owner_name">
                  <el-input v-model="form.owner_name" placeholder="VD: Nguyễn Văn A..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Loại phương tiện" prop="vehicle_type">
                  <el-input v-model="form.vehicle_type" placeholder="VD: Ô tô con, Xe tải, Xe máy..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Trạng thái hoạt động" prop="status">
                  <el-select v-model="form.status" placeholder="Chọn trạng thái..." class="w-full">
                    <el-option label="Hoạt động" value="activity" />
                    <el-option label="Không hoạt động" value="inactivity" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: THÔNG TIN HÃNG & DÒNG XE -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Chi tiết cấu hình phương tiện
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Hãng xe (Nhà sản xuất)" prop="brand">
                  <el-input v-model="form.brand" placeholder="VD: Toyota, Hyundai, Ford..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Dòng xe (Model)" prop="model">
                  <el-input v-model="form.model" placeholder="VD: Camry, Accent, Ranger..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Màu sắc ngoại thất" prop="color">
                  <el-input v-model="form.color" placeholder="VD: Trắng, Đen, Đỏ..." />
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

    <!-- Dialog: Detail Vehicle -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT THÔNG TIN PHƯƠNG TIỆN"
      width="700px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedVehicle" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto text-left">
        <!-- Visual Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-blue-500 dark:bg-blue-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32"><Van /></el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Phương tiện vận tải</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {{ selectedVehicle.license_plate }}
              <span class="text-gray-400 dark:text-gray-500 font-mono font-medium">({{ getVehicleTypeLabel(selectedVehicle.vehicle_type) }})</span>
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <span class="text-gray-500 dark:text-gray-400">Chủ xe: <strong class="text-gray-750 dark:text-gray-250">{{ selectedVehicle.owner_name || '—' }}</strong></span>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span class="text-gray-500 dark:text-gray-400">Model: <strong>{{ selectedVehicle.model || '—' }}</strong></span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã phương tiện (ID)</div>
            <div class="text-sm font-mono text-gray-600 dark:text-gray-400 select-all">{{ selectedVehicle.id }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Biển kiểm soát</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-150">{{ selectedVehicle.license_plate }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Hãng sản xuất</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedVehicle.brand || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Dòng xe (Model)</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedVehicle.model || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Màu ngoại thất</div>
            <div class="text-sm text-gray-700 dark:text-gray-300">{{ selectedVehicle.color || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Trạng thái xe</div>
            <div>
              <el-tag size="small" :type="getStatusTagType(selectedVehicle.status)" effect="dark" class="font-bold">
                {{ getStatusLabel(selectedVehicle.status) }}
              </el-tag>
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Thời điểm khởi tạo</div>
            <div class="text-sm font-mono text-gray-750 dark:text-gray-300">{{ formatDateTime(selectedVehicle.created_time) }}</div>
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
import { refTabBenVung } from '@/composables/tabBenVung'  // MỤC 423
import { Van, Refresh, Plus, MoreFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { vehicleService } from '@/api/vehicleService'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'

const { laManHep, hienBang, hienThe } = dungManHep()

const activeTab = refTabBenVung('other/vehicle', 'vehicle')  // MỤC 423

// Search, Status filters
const searchLicensePlate = ref('')
const filterStatus = ref('')
const loading = ref(false)

const vehicles = ref<any[]>([])

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Fetch vehicles list from GET API
const fetchVehicles = async () => {
  loading.value = true
  currentPage.value = 1
  try {
    const data = await vehicleService.getVehicles({
      license_plate: searchLicensePlate.value || undefined,
      status: filterStatus.value || undefined
    })
    vehicles.value = data
  } catch (error: any) {
    console.error('API get-vehicles failed:', error)
    ElMessage.error(error.message || 'Lỗi khi kết nối tới API để tải danh sách phương tiện')
    vehicles.value = []
  } finally {
    loading.value = false
  }
}

const handleStatusChange = () => {
  fetchVehicles()
}

let timeoutId: any = null
const handlePlateInput = () => {
  if (timeoutId) clearTimeout(timeoutId)
  timeoutId = setTimeout(() => {
    fetchVehicles()
  }, 400)
}

// Search and Filtered
const filteredVehicles = computed(() => {
  // Since the API handles plate and status filtering, we just map client-side fallbacks
  return vehicles.value
})

const paginatedVehicles = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredVehicles.value.slice(start, end)
})

// Dialog States
const dialogVisible = ref(false)
const isEdit = ref(false)
const detailDialogVisible = ref(false)
const selectedVehicle = ref<any | null>(null)
const formRef = ref<any>(null)

const form = reactive({
  id: '',
  license_plate: '',
  vehicle_type: '',
  brand: '',
  model: '',
  color: '',
  owner_name: '',
  status: 'activity'
})

const rules = reactive({
  license_plate: [{ required: true, message: 'Vui lòng nhập biển số xe', trigger: 'blur' }],
  vehicle_type: [{ required: true, message: 'Vui lòng nhập loại xe', trigger: 'blur' }],
  status: [{ required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change' }]
})

// Action Handlers
const handleCommand = (cmd: string, row: any) => {
  if (cmd === 'detail') {
    selectedVehicle.value = row
    detailDialogVisible.value = true
  } else if (cmd === 'edit') {
    openEditDialog(row)
  } else if (cmd === 'delete') {
    handleDelete(row)
  }
}

const openAddDialog = () => {
  isEdit.value = false
  form.id = ''
  form.license_plate = ''
  form.vehicle_type = ''
  form.brand = ''
  form.model = ''
  form.color = ''
  form.owner_name = ''
  form.status = 'activity'
  dialogVisible.value = true
}

const openEditDialog = (row: any) => {
  isEdit.value = true
  form.id = row.id
  form.license_plate = row.license_plate
  form.vehicle_type = row.vehicle_type || ''
  form.brand = row.brand || ''
  form.model = row.model || ''
  form.color = row.color || ''
  form.owner_name = row.owner_name || ''
  form.status = row.status || 'activity'
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      const payload = {
        license_plate: form.license_plate,
        vehicle_type: form.vehicle_type,
        brand: form.brand || null,
        model: form.model || null,
        color: form.color || null,
        owner_name: form.owner_name || null,
        status: form.status
      }

      try {
        if (isEdit.value) {
          const editPayload = { ...payload, id: form.id }
          await vehicleService.updateVehicles([editPayload])

          const idx = vehicles.value.findIndex(s => s.id === form.id)
          if (idx !== -1) {
            vehicles.value[idx] = { ...vehicles.value[idx], ...editPayload }
          }
          ElMessage.success('Cập nhật thông tin phương tiện thành công!')
        } else {
          // POST /add-vehicles accepts list. ID can be left blank (auto generated by backend uuid)
          const res = await vehicleService.addVehicles([payload])
          if (res && res.length > 0) {
            vehicles.value.unshift(res[0])
          } else {
            fetchVehicles()
          }
          ElMessage.success('Thêm mới phương tiện thành công!')
        }
        dialogVisible.value = false
      } catch (error: any) {
        ElMessage.error(error.message || 'Lỗi khi lưu thông tin phương tiện')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa phương tiện "${row.license_plate}" khỏi cơ sở dữ liệu?`,
      'Xác nhận xóa phương tiện',
      {
        confirmButtonText: 'Xóa bỏ',
        cancelButtonText: 'Hủy',
        type: 'warning'
      }
    )
    loading.value = true
    await vehicleService.deleteVehicles([row.id])

    vehicles.value = vehicles.value.filter(s => s.id !== row.id)
    ElMessage.success('Xóa phương tiện thành công!')
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || 'Lỗi khi xóa phương tiện')
    }
  } finally {
    loading.value = false
  }
}

// Helpers
const formatDateTime = (val: string) => {
  if (!val) return '—'
  try {
    const d = new Date(val)
    const dateStr = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear()
    const timeStr = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0')
    return `${dateStr} ${timeStr}`
  } catch {
    return val
  }
}

const getVehicleTypeLabel = (type: string) => {
  switch (type) {
    case 'car': return 'Ô tô con'
    case 'truck': return 'Xe tải'
    case 'motorcycle': return 'Xe máy'
    case 'container': return 'Xe container'
    case 'other': return 'Khác'
    default: return type || 'Chưa rõ'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'activity': return 'Hoạt động'
    case 'inactivity': return 'Không hoạt động'
    default: return status || '—'
  }
}

const getStatusTagType = (status: string) => {
  switch (status) {
    case 'activity': return 'success'
    case 'inactivity': return 'danger'
    default: return 'info'
  }
}

onMounted(() => {
  fetchVehicles()
})
</script>

<style scoped>
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

.vehicle-tab-container :deep(.el-table th.el-table__cell .cell) {
  white-space: nowrap !important;
}

html.dark .vehicle-tab-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .vehicle-tab-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .vehicle-tab-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

html.dark .vehicle-tab-container :deep(.el-table .el-table-fixed-column--left),
html.dark .vehicle-tab-container :deep(.el-table .el-table-fixed-column--right) {
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
