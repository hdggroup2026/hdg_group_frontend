<template>
  <div class="tablet-container h-full flex flex-col">
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
            placeholder="Dòng máy, hãng, IMEI, Serial..."
            clearable
            class="w-64 custom-dark-input"
            style="width: 256px"
          />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <el-button :icon="Refresh" circle @click="fetchTablets" :loading="loading" />
        <el-button type="primary" @click="openAddDialog">
          <el-icon class="mr-1"><Plus /></el-icon> Thêm Máy tính bảng
        </el-button>
      </div>
    </div>

    <!-- Table Container -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
      <el-table v-loading="loading" :data="paginatedTablets" style="width: 100%" class="flex-1" height="100%">
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
            <span class="font-bold text-gray-800 dark:text-gray-200">{{ row.brand }}</span>
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
            <el-tag size="small" :type="row.classification === 'Công việc' ? 'primary' : 'success'" effect="plain">
              {{ row.classification }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Số Serial -->
        <el-table-column prop="serial_number" label="Số Serial" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono text-xs text-gray-700 dark:text-gray-300 font-bold">{{ row.serial_number || '—' }}</span>
          </template>
        </el-table-column>

        <!-- IMEI 1 -->
        <el-table-column prop="imei_1" label="IMEI 1" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono text-xs text-gray-650 dark:text-gray-350">{{ row.imei_1 || '—' }}</span>
          </template>
        </el-table-column>

        <!-- IMEI 2 -->
        <el-table-column prop="imei_2" label="IMEI 2" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono text-xs text-gray-650 dark:text-gray-350">{{ row.imei_2 || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Phiên bản HĐH -->
        <el-table-column prop="os_version" label="HĐH" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-xs text-gray-700 dark:text-gray-300">{{ row.os_version || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Dung lượng bộ nhớ -->
        <el-table-column prop="storage_capacity" label="Dung lượng" width="130" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-xs text-gray-700 dark:text-gray-300">{{ row.storage_capacity || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Pin -->
        <el-table-column prop="battery_health" label="Pin" width="90" align="center">
          <template #default="{ row }">
            <span v-if="row.battery_health" class="font-bold font-mono text-xs" :class="getBatteryClass(row.battery_health)">
              {{ row.battery_health }}%
            </span>
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>

        <!-- Tài khoản liên kết -->
        <el-table-column prop="account" label="Tài khoản" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-semibold text-gray-700 dark:text-gray-300 text-xs">{{ row.account || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Mật khẩu tài khoản -->
        <el-table-column label="Mật khẩu" width="130" show-overflow-tooltip>
          <template #default="{ row }">
            <div v-if="row.account_password" class="flex items-center gap-1 text-gray-400 text-xs">
              <span class="font-mono">{{ isPasswordRevealed(row.id) ? row.account_password : '••••••••' }}</span>
              <el-button link type="info" size="small" class="!p-0 h-auto" @click="togglePasswordReveal(row.id)">
                <el-icon :size="10"><component :is="isPasswordRevealed(row.id) ? Hide : View" /></el-icon>
              </el-button>
            </div>
            <span v-else class="text-gray-400">—</span>
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

        <!-- Ngày mua -->
        <el-table-column prop="purchase_date" label="Ngày mua" width="120" align="center">
          <template #default="{ row }">
            <span class="font-mono text-xs">{{ formatDate(row.purchase_date) }}</span>
          </template>
        </el-table-column>

        <!-- Ghi chú -->
        <el-table-column prop="notes" label="Ghi chú" min-width="180" show-overflow-tooltip />

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
          :total="filteredTablets.length"
        />
      </div>
    </div>

    <!-- Dialog: Add / Edit Tablet -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'CHỈNH SỬA THÔNG TIN MÁY TÍNH BẢNG' : 'THÊM MÁY TÍNH BẢNG MỚI'"
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
                  <el-input v-model="form.id" :disabled="isEdit" placeholder="VD: MTIP07..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Hãng sản xuất" prop="brand">
                  <el-input v-model="form.brand" placeholder="VD: Apple, Samsung, Xiaomi..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Dòng máy" prop="model_name">
                  <el-input v-model="form.model_name" placeholder="VD: iPad Pro 11 inch..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Số Serial (S/N)" prop="serial_number">
                  <el-input v-model="form.serial_number" placeholder="Nhập số Serial..." />
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
                <el-form-item label="IMEI 1" prop="imei_1">
                  <el-input v-model="form.imei_1" placeholder="Nhập số IMEI 1 (nếu có)..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="IMEI 2" prop="imei_2">
                  <el-input v-model="form.imei_2" placeholder="Nhập số IMEI 2 (nếu có)..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: THÔNG SỐ & TÌNH TRẠNG -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Thông số kỹ thuật &amp; Trạng thái
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Phiên bản HĐH" prop="os_version">
                  <el-input v-model="form.os_version" placeholder="VD: iPadOS 17.5 hoặc Android 14" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Dung lượng bộ nhớ" prop="storage_capacity">
                  <el-input v-model="form.storage_capacity" placeholder="VD: 128 GB, 256 GB..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tình trạng pin (%)" prop="battery_health">
                  <el-input-number v-model="form.battery_health" :min="1" :max="100" class="!w-full" controls-position="right" />
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
                <el-form-item label="Ngày mua sắm" prop="purchase_date">
                  <el-date-picker v-model="form.purchase_date" type="date" value-format="YYYY-MM-DD" placeholder="Chọn ngày mua..." class="!w-full" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Phụ kiện đi kèm" prop="accessories">
                  <el-input v-model="form.accessories" placeholder="VD: Bút Apple Pencil, Bao da, Cáp sạc..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 3: TÀI KHOẢN & BẢO MẬT -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-violet-650 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
              Tài khoản &amp; Ghi chú bảo mật
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tài khoản liên kết" prop="account">
                  <el-input v-model="form.account" placeholder="iCloud / Google Account..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Mật khẩu tài khoản" prop="account_password">
                  <el-input v-model="form.account_password" type="password" show-password placeholder="Nhập mật khẩu..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Ghi chú chi tiết" prop="notes">
                  <el-input v-model="form.notes" type="textarea" :rows="2" placeholder="Ghi chú thêm về máy..." />
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

    <!-- Dialog: Detail Tablet -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT THÔNG TIN MÁY TÍNH BẢNG"
      width="750px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedTablet" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto text-left">
        <!-- Visual Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-blue-500 dark:bg-blue-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32"><Notebook /></el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Máy tính bảng</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {{ selectedTablet.model_name }}
              <span class="text-gray-400 dark:text-gray-500 font-mono font-medium">({{ selectedTablet.brand }})</span>
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <span class="text-gray-500 dark:text-gray-400">Phân loại: <strong class="text-gray-750 dark:text-gray-250">{{ selectedTablet.classification }}</strong></span>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span class="text-gray-500 dark:text-gray-400">HĐH: <strong>{{ selectedTablet.os_version || '—' }}</strong></span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã máy (ID)</div>
            <div class="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">{{ selectedTablet.id }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số Serial (S/N)</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono">{{ selectedTablet.serial_number || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Dung lượng ổ cứng</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedTablet.storage_capacity || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">IMEI 1</div>
            <div class="text-sm font-mono text-gray-700 dark:text-gray-300">{{ selectedTablet.imei_1 || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">IMEI 2</div>
            <div class="text-sm font-mono text-gray-700 dark:text-gray-300">{{ selectedTablet.imei_2 || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tình trạng pin hiệu dụng</div>
            <div class="text-sm font-bold flex items-center gap-1" :class="getBatteryClass(selectedTablet.battery_health)">
              {{ selectedTablet.battery_health ? selectedTablet.battery_health + '%' : '—' }}
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày mua sắm</div>
            <div class="text-sm font-mono text-gray-750 dark:text-gray-300">{{ formatDate(selectedTablet.purchase_date) }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Phụ kiện đi kèm</div>
            <div class="text-sm text-gray-700 dark:text-gray-300">{{ selectedTablet.accessories || 'Không có' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Trạng thái</div>
            <div>
              <el-tag size="small" :type="getStatusTagType(selectedTablet.status)" effect="dark" class="font-bold">
                {{ getStatusLabel(selectedTablet.status) }}
              </el-tag>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-150 dark:border-gray-700 pt-4 space-y-4">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tài khoản &amp; Giao thức đăng nhập</div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
              <div>
                <div class="text-xxs font-semibold text-gray-400">Tên đăng nhập (Email)</div>
                <div class="text-xs font-bold text-gray-800 dark:text-gray-200 mt-0.5 select-all">{{ selectedTablet.account || '—' }}</div>
              </div>
              <div>
                <div class="text-xxs font-semibold text-gray-400">Mật khẩu đăng nhập</div>
                <div class="text-xs font-mono font-bold text-gray-850 dark:text-gray-200 mt-0.5 select-all">{{ selectedTablet.account_password || '—' }}</div>
              </div>
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ghi chú chi tiết</div>
            <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ selectedTablet.notes || 'Không có ghi chú nào thêm.' }}</p>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="detailDialogVisible = false">Đóng</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Modal: Bàn giao Máy tính bảng -->
    <DeviceHandoverModal
      v-model="handoverModalVisible"
      :device-info="handoverDeviceInfo"
      @success="handleHandoverSuccess"
    />

    <!-- Modal: Thu hồi Máy tính bảng -->
    <DeviceReturnModal
      v-model="returnModalVisible"
      :device-info="returnDeviceInfo"
      @success="handleReturnSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Notebook, Refresh, Plus, MoreFilled, View, Hide } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { otherService } from '@/api/otherService'
import DeviceHandoverModal from './DeviceHandoverModal.vue'
import DeviceReturnModal from './DeviceReturnModal.vue'
import { DEVICE_STATUS_OPTIONS, getDeviceStatusLabel, getDeviceStatusTagType, isReadyForHandover, isHandedOverOrInUse, DeviceStatus } from '@/constants/deviceStatus'

// Search, Classification filters
const searchQuery = ref('')
const filterClassification = ref('')
const loading = ref(false)

const tablets = ref<any[]>([])

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Password mask reveal state
const revealedPasswords = ref<Record<string, boolean>>({})

const togglePasswordReveal = (id: string) => {
  revealedPasswords.value[id] = !revealedPasswords.value[id]
}

const isPasswordRevealed = (id: string) => {
  return !!revealedPasswords.value[id]
}

// Fetch tablets list from GET API directly
const fetchTablets = async () => {
  loading.value = true
  currentPage.value = 1
  try {
    const data = await otherService.getTablets({
      classification: filterClassification.value || undefined
    })
    tablets.value = data
  } catch (error: any) {
    console.error('API get-tablets failed:', error)
    ElMessage.error(error.message || 'Lỗi khi kết nối tới API để tải danh sách máy tính bảng')
    tablets.value = []
  } finally {
    loading.value = false
  }
}

const handleClassificationChange = () => {
  fetchTablets()
}

// Search Computed
const filteredTablets = computed(() => {
  return tablets.value.filter(t => {
    const q = searchQuery.value.toLowerCase()
    
    // Client-side search filters
    const matchesSearch = !q ||
      t.model_name.toLowerCase().includes(q) ||
      (t.brand && t.brand.toLowerCase().includes(q)) ||
      (t.imei_1 && t.imei_1.includes(q)) ||
      (t.serial_number && t.serial_number.toLowerCase().includes(q)) ||
      (t.account && t.account.toLowerCase().includes(q))

    // Client-side classification backup
    const matchesClassification = !filterClassification.value || 
      t.classification === filterClassification.value

    return matchesSearch && matchesClassification
  })
})

const paginatedTablets = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTablets.value.slice(start, end)
})

// Dialog States
const dialogVisible = ref(false)
const isEdit = ref(false)
const detailDialogVisible = ref(false)
const selectedTablet = ref<any | null>(null)
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
  imei_1: '',
  imei_2: '',
  serial_number: '',
  os_version: '',
  storage_capacity: '',
  battery_health: 100,
  purchase_date: '',
  status: 'available',
  notes: '',
  accessories: '',
  account: '',
  account_password: '',
  classification: 'Công việc'
})

const rules = reactive({
  id: [{ required: true, message: 'Vui lòng nhập mã thiết bị (ID)', trigger: 'blur' }],
  model_name: [{ required: true, message: 'Vui lòng nhập tên dòng máy', trigger: 'blur' }],
  brand: [{ required: true, message: 'Vui lòng nhập hãng sản xuất', trigger: 'blur' }],
  classification: [{ required: true, message: 'Vui lòng chọn phân loại', trigger: 'change' }],
  status: [{ required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change' }]
})

// Action Handlers
const handleCommand = (cmd: string, row: any) => {
  if (cmd === 'detail') {
    selectedTablet.value = row
    detailDialogVisible.value = true
  } else if (cmd === 'handover') {
    if (!isReadyForHandover(row.status)) {
      ElMessage.warning('Chỉ thiết bị ở trạng thái "Sẵn sàng bàn giao" mới có thể thực hiện bàn giao!')
      return
    }
    handoverDeviceInfo.value = {
      id: row.id,
      type: 'tablet',
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
      type: 'tablet',
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
  fetchTablets()
}

const handleReturnSuccess = () => {
  fetchTablets()
}

const openAddDialog = () => {
  isEdit.value = false
  form.id = ''
  form.brand = ''
  form.model_name = ''
  form.serial_number = ''
  form.classification = 'Công việc'
  form.imei_1 = ''
  form.imei_2 = ''
  form.os_version = ''
  form.storage_capacity = ''
  form.battery_health = 100
  form.status = 'available'
  form.purchase_date = new Date('2026-06-28T00:00:00').toISOString().substring(0, 10)
  form.accessories = ''
  form.account = ''
  form.account_password = ''
  form.notes = ''
  dialogVisible.value = true
}

const openEditDialog = (row: any) => {
  isEdit.value = true
  form.id = row.id
  form.brand = row.brand
  form.model_name = row.model_name
  form.serial_number = row.serial_number
  form.classification = row.classification
  form.imei_1 = row.imei_1
  form.imei_2 = row.imei_2
  form.os_version = row.os_version
  form.storage_capacity = row.storage_capacity
  form.battery_health = row.battery_health || 100
  form.status = row.status
  form.purchase_date = row.purchase_date
  form.accessories = row.accessories
  form.account = row.account
  form.account_password = row.account_password
  form.notes = row.notes || ''
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      const payload = {
        id: form.id,
        brand: form.brand,
        model_name: form.model_name,
        serial_number: form.serial_number,
        classification: form.classification,
        imei_1: form.imei_1,
        imei_2: form.imei_2,
        os_version: form.os_version,
        storage_capacity: form.storage_capacity,
        battery_health: Number(form.battery_health) || 100,
        status: form.status,
        purchase_date: form.purchase_date,
        accessories: form.accessories,
        account: form.account,
        account_password: form.account_password,
        notes: form.notes || null
      }

      try {
        if (isEdit.value) {
          const editPayload = { ...payload }
          // Trigger API call directly
          await otherService.updateTablets([editPayload])

          // Local state update
          const idx = tablets.value.findIndex(t => t.id === form.id)
          if (idx !== -1) {
            const existing = tablets.value[idx]
            if (existing) {
              tablets.value[idx] = { ...existing, ...editPayload }
            }
          }
          ElMessage.success('Cập nhật thông tin máy tính bảng thành công!')
        } else {
          // Trigger API call directly
          const res = await otherService.addTablets([payload])
          if (res && res.length > 0) {
            tablets.value.unshift(res[0])
          } else {
            tablets.value.unshift({ ...payload })
          }
          ElMessage.success('Thêm mới máy tính bảng thành công!')
        }
        dialogVisible.value = false
      } catch (error: any) {
        ElMessage.error(error.message || 'Lỗi khi lưu thông tin máy tính bảng')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa máy tính bảng "${row.model_name}" (${row.brand}) khỏi cơ sở dữ liệu?`,
      'Xác nhận xóa thiết bị',
      {
        confirmButtonText: 'Xóa bỏ',
        cancelButtonText: 'Hủy',
        type: 'warning'
      }
    )
    loading.value = true
    // Trigger API call directly
    await otherService.deleteTablets([row.id])

    tablets.value = tablets.value.filter(t => t.id !== row.id)
    ElMessage.success('Xóa máy tính bảng thành công!')
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || 'Lỗi khi xóa máy tính bảng')
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

const getBatteryClass = (health: number) => {
  if (health >= 85) return 'text-emerald-600 dark:text-emerald-400 font-bold'
  if (health >= 80) return 'text-blue-500 font-bold'
  if (health >= 70) return 'text-amber-500 font-bold'
  return 'text-rose-500 font-extrabold'
}

const getStatusLabel = (status: string) => {
  return getDeviceStatusLabel(status)
}

const getStatusTagType = (status: string) => {
  return getDeviceStatusTagType(status)
}

onMounted(() => {
  fetchTablets()
})
</script>

<style scoped>
/* Custom dark mode styles for table to match Harvest exactly */
html.dark .tablet-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .tablet-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .tablet-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

html.dark .tablet-container :deep(.el-table .el-table-fixed-column--left),
html.dark .tablet-container :deep(.el-table .el-table-fixed-column--right) {
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

.text-xxs {
  font-size: 0.7rem;
}
</style>
