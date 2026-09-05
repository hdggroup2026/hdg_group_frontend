<template>
  <div class="assignment-container h-full flex flex-col">
    <!-- Filter Bar -->
    <div class="flex flex-wrap justify-between items-center gap-4 mb-4 shrink-0">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Search Username -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Người sử dụng:</span>
          <el-input
            v-model="searchUsername"
            placeholder="Nhập tên nhân viên..."
            clearable
            class="w-56 custom-dark-input"
            style="width: 160px"
            @change="fetchAssignments"
            @clear="fetchAssignments"
          />
        </div>

        <!-- Search Device ID -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Mã thiết bị:</span>
          <el-input
            v-model="searchDeviceId"
            placeholder="Mã thiết bị..."
            clearable
            class="w-56 custom-dark-input"
            style="width: 140px"
            @change="fetchAssignments"
            @clear="fetchAssignments"
          />
        </div>

        <!-- Filter Assigned At -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian nhận:</span>
          <el-date-picker :editable="false"
            v-model="filterAssignedAt"
            type="date"
            placeholder="Chọn ngày nhận..."
            value-format="YYYY-MM-DD"
            class="custom-dark-input date-filter-picker"
            style="width: 160px"
            @change="fetchAssignments"
            clearable
          />
        </div>

        <!-- Filter Returned At -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian trả:</span>
          <el-date-picker :editable="false"
            v-model="filterReturnedAt"
            type="date"
            placeholder="Chọn ngày trả..."
            value-format="YYYY-MM-DD"
            class="custom-dark-input date-filter-picker"
            style="width: 160px"
            @change="fetchAssignments"
            clearable
          />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <el-button :icon="Refresh" circle @click="fetchAssignments" :loading="loading" />
        <el-button type="primary" @click="openAddDialog">
          <el-icon class="mr-1"><Plus /></el-icon> Thêm Bàn giao
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
      <el-table v-if="hienBang" v-loading="loading" :data="paginatedAssignments" style="width: 100%" class="flex-1" height="100%">
        <!-- STT Column -->
        <el-table-column label="STT" width="52" align="center">
          <template #default="{ $index }">
            <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>

        <!-- Mã Bàn giao -->
        <!-- ══════════════════════════════════════════════════════════
             MỤC 523 (05/09/2026) — RÚT GỌN BẢNG BÀN GIAO

             s68 05/09: *"rút gọn luôn. Thông số chi tiết không cần coi
             thường xuyên nên ẩn cho gọn."*

             Đã dời vào hộp Chi tiết: tình trạng ban đầu · tình trạng thu
             hồi · cột Thao tác. Cùng cách làm MỤC 518 cho sáu tab thiết
             bị, để các tab của màn này hành xử như nhau.
             ══════════════════════════════════════════════════════════ -->
        <el-table-column prop="id" label="Mã bàn giao" width="122" show-overflow-tooltip>
          <template #default="{ row }">
            <button type="button"
                    class="font-mono text-xs text-blue-600 dark:text-blue-400 underline decoration-dotted underline-offset-2 hover:text-blue-800"
                    :title="`Xem đầy đủ phiếu bàn giao ${row.id || ''}`"
                    @click.stop="handleCommand('detail', row)">
              {{ row.id ? row.id.substring(0, 8) + '...' : '—' }}
            </button>
          </template>
        </el-table-column>

        <!-- Người nhận bàn giao -->
        <el-table-column prop="username" label="Người sử dụng" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-bold text-gray-800 dark:text-gray-200">{{ row.username }}</span>
          </template>
        </el-table-column>

        <!-- Loại thiết bị -->
        <el-table-column prop="device_type" label="Loại thiết bị" width="108" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag size="small" :type="getDeviceTypeTag(row.device_type)" effect="plain">
              {{ getDeviceTypeLabel(row.device_type) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Mã thiết bị -->
        <el-table-column prop="device_id" label="Mã thiết bị" width="108" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.device_id }}</span>
          </template>
        </el-table-column>

        <!-- Ngày bàn giao -->
        <el-table-column prop="assigned_at" label="Ngày bàn giao" width="108" align="center">
          <template #default="{ row }">
            <span class="font-mono text-xs text-gray-700 dark:text-gray-300 font-semibold">
              {{ formatDate(row.assigned_at) }}
            </span>
          </template>
        </el-table-column>

        <!-- Ngày thu hồi -->
        <el-table-column prop="returned_at" label="Ngày thu hồi" width="108" align="center">
          <template #default="{ row }">
            <span v-if="row.returned_at" class="font-mono text-xs text-green-600 dark:text-green-400 font-semibold">
              {{ formatDate(row.returned_at) }}
            </span>
            <el-tag v-else size="small" type="danger" effect="light" class="font-bold">Đang bàn giao</el-tag>
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
        <div v-if="paginatedAssignments.length > 0" class="grid grid-cols-1 gap-4">
          <div
            v-for="(row, i) in (paginatedAssignments as any[])"
            :key="row.id || row.contract_id || i"
            class="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-sm"
          >
            <!-- MỤC 523 — thẻ dọc đi theo bảng: mã bấm được, bỏ nút ⋯ -->
            <div class="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
              <div class="min-w-0 break-words">
                <button type="button"
                        class="font-mono text-xs text-blue-600 dark:text-blue-400 underline decoration-dotted underline-offset-2"
                        @click.stop="handleCommand('detail', row)">
                  {{ row.id ? row.id.substring(0, 8) + '...' : '—' }}
                </button>
              </div>
              <div class="shrink-0 text-xs text-gray-400">Bấm mã để xem đủ</div>
            </div>
            <div class="space-y-2 text-sm text-left">
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Người sử dụng:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-bold text-gray-800 dark:text-gray-200">{{ row.username }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Loại thiết bị:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag size="small" :type="getDeviceTypeTag(row.device_type)" effect="plain">
                                {{ getDeviceTypeLabel(row.device_type) }}
                              </el-tag>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Mã thiết bị:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.device_id }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ngày bàn giao:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-mono text-xs text-gray-700 dark:text-gray-300 font-semibold">
                                {{ formatDate(row.assigned_at) }}
                              </span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ngày thu hồi:</span>
                <span class="text-right break-words min-w-0">
                  <span v-if="row.returned_at" class="font-mono text-xs text-green-600 dark:text-green-400 font-semibold">
                                {{ formatDate(row.returned_at) }}
                              </span>
                              <el-tag v-else size="small" type="danger" effect="light" class="font-bold">Đang bàn giao</el-tag>
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
          :total="filteredAssignments.length"
        />
      </div>
    </div>

    <!-- Dialog: Add / Edit Assignment -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'CHỈNH SỬA THÔNG TIN BÀN GIAO' : 'THÊM THÔNG TIN BÀN GIAO'"
      width="800px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="160px" class="mt-2 compact-form">
          <!-- THÔNG TIN ĐỐI TƯỢNG VÀ THIẾT BỊ -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin bàn giao
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Người sử dụng" prop="username">
                  <el-input v-model="form.username" placeholder="Nhập tên nhân viên sử dụng..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Loại thiết bị" prop="device_type">
                  <el-select v-model="form.device_type" placeholder="Chọn loại thiết bị..." class="w-full">
                    <el-option label="Điện thoại" value="phone" />
                    <el-option label="Laptop" value="laptop" />
                    <el-option label="Máy tính bảng" value="tablet" />
                    <el-option label="Màn hình" value="monitor" />
                    <el-option label="Camera" value="camera" />
                    <el-option label="Thiết bị khác" value="other" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã thiết bị (ID)" prop="device_id">
                  <el-input v-model="form.device_id" placeholder="VD: LT0001, PH0003..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- THỜI GIAN BÀN GIAO -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Thời gian
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Ngày bàn giao" prop="assigned_at">
                  <el-date-picker :editable="false" v-model="form.assigned_at" type="date" value-format="YYYY-MM-DD" placeholder="Chọn ngày bàn giao..." class="!w-full" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ngày thu hồi" prop="returned_at">
                  <el-date-picker :editable="false" v-model="form.returned_at" type="date" value-format="YYYY-MM-DD" placeholder="Chọn ngày thu hồi (nếu có)..." class="!w-full" clearable />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- TÌNH TRẠNG VẬT LÝ -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-violet-650 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
              Tình trạng thiết bị
            </h4>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Tình trạng ban đầu" prop="initial_condition">
                  <el-input v-model="form.initial_condition" type="textarea" :rows="2" placeholder="Nhập tình trạng vật lý, trầy xước, phụ kiện kèm theo lúc bàn giao..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20" class="mt-2">
              <el-col :span="24">
                <el-form-item label="Tình trạng thu hồi" prop="final_condition">
                  <el-input v-model="form.final_condition" type="textarea" :rows="2" placeholder="Nhập tình trạng vật lý lúc thu hồi thiết bị..." />
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

    <!-- Dialog: Detail Assignment -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT THÔNG TIN BÀN GIAO THIẾT BỊ"
      width="700px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedAssignment" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto text-left">
        <!-- Visual Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-indigo-500 dark:bg-indigo-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32"><Switch /></el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Bàn giao thiết bị</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {{ selectedAssignment.username }}
              <span class="text-gray-400 dark:text-gray-500 font-medium">({{ selectedAssignment.device_id }})</span>
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <span class="text-gray-500 dark:text-gray-400">Loại: <strong class="text-gray-750 dark:text-gray-250">{{ getDeviceTypeLabel(selectedAssignment.device_type) }}</strong></span>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span class="text-gray-500 dark:text-gray-400">Ngày giao: <strong>{{ formatDate(selectedAssignment.assigned_at) }}</strong></span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Người sử dụng</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedAssignment.username }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã thiết bị (ID)</div>
            <div class="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">{{ selectedAssignment.device_id }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Loại thiết bị</div>
            <div>
              <el-tag size="small" :type="getDeviceTypeTag(selectedAssignment.device_type)" effect="plain">
                {{ getDeviceTypeLabel(selectedAssignment.device_type) }}
              </el-tag>
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Trạng thái bàn giao</div>
            <div>
              <el-tag v-if="selectedAssignment.returned_at" size="small" type="success" effect="dark" class="font-bold">Đã thu hồi</el-tag>
              <el-tag v-else size="small" type="danger" effect="dark" class="font-bold">Đang sử dụng</el-tag>
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày bàn giao</div>
            <div class="text-sm font-semibold text-gray-700 dark:text-gray-300 font-mono">{{ formatDate(selectedAssignment.assigned_at) }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày thu hồi</div>
            <div class="text-sm font-semibold text-gray-700 dark:text-gray-300 font-mono">{{ formatDate(selectedAssignment.returned_at) }}</div>
          </div>
          <div class="col-span-1 md:col-span-2">
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tình trạng ban đầu</div>
            <div class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded border border-gray-100 dark:border-gray-800 min-h-[50px]">
              {{ selectedAssignment.initial_condition || 'Không có ghi nhận' }}
            </div>
          </div>
          <div class="col-span-1 md:col-span-2">
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tình trạng thu hồi</div>
            <div class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded border border-gray-100 dark:border-gray-800 min-h-[50px]">
              {{ selectedAssignment.final_condition || 'Chưa ghi nhận (thiết bị chưa thu hồi)' }}
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <!-- MỤC 523 — hai việc chuyển từ cột Thao tác xuống đây.
               Đóng hộp Chi tiết TRƯỚC khi gọi việc khác, cùng lý do
               MỤC 518: hai hộp thoại chồng nhau thì hộp dưới khoá cuộn
               của hộp trên. -->
          <el-button @click="viecTuChiTiet('edit')">Chỉnh sửa</el-button>
          <el-button class="!text-red-500" @click="viecTuChiTiet('delete')">Xóa</el-button>
          <el-button type="primary" @click="detailDialogVisible = false">Đóng</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Refresh, Plus, MoreFilled, Switch } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { otherService } from '@/api/otherService'
import { DeviceStatus } from '@/constants/deviceStatus'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'

const { laManHep, hienBang, hienThe } = dungManHep()

// Filters
const searchUsername = ref('')
const searchDeviceId = ref('')
const filterAssignedAt = ref('')
const filterReturnedAt = ref('')
const loading = ref(false)

const assignments = ref<any[]>([])

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Fetch device assignments from GET API
const fetchAssignments = async () => {
  loading.value = true
  currentPage.value = 1
  try {
    const data = await otherService.getDeviceAssignments({
      username: searchUsername.value.trim() || undefined,
      device_id: searchDeviceId.value.trim() || undefined,
      assigned_at: filterAssignedAt.value || undefined,
      returned_at: filterReturnedAt.value || undefined
    })
    assignments.value = data
  } catch (error: any) {
    console.error('API get-device-assignments failed:', error)
    ElMessage.error(error.message || 'Lỗi khi tải danh sách bàn giao thiết bị từ API')
    assignments.value = []
  } finally {
    loading.value = false
  }
}

// Search Computed
const filteredAssignments = computed(() => {
  return assignments.value
})

const paginatedAssignments = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredAssignments.value.slice(start, end)
})

// Dialog States
const dialogVisible = ref(false)
const isEdit = ref(false)
const detailDialogVisible = ref(false)
const selectedAssignment = ref<any | null>(null)
const formRef = ref<any>(null)

const form = reactive({
  id: '',
  username: '',
  device_type: 'laptop',
  device_id: '',
  assigned_at: new Date().toISOString().split('T')[0],
  returned_at: '',
  initial_condition: '',
  final_condition: ''
})

const rules = reactive({
  username: [{ required: true, message: 'Vui lòng nhập tên người sử dụng', trigger: 'blur' }],
  device_type: [{ required: true, message: 'Vui lòng chọn loại thiết bị', trigger: 'change' }],
  device_id: [{ required: true, message: 'Vui lòng nhập mã thiết bị (ID)', trigger: 'blur' }]
})

// Action Handlers
// MỤC 523 (05/09/2026) — chạy một việc từ chân hộp Chi tiết.
const viecTuChiTiet = (cmd: string) => {
  const phieu = selectedAssignment.value
  if (!phieu) return
  detailDialogVisible.value = false
  handleCommand(cmd, phieu)
}

const handleCommand = (cmd: string, row: any) => {
  if (cmd === 'detail') {
    selectedAssignment.value = row
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
  form.username = ''
  form.device_type = 'laptop'
  form.device_id = ''
  form.assigned_at = new Date().toISOString().split('T')[0]
  form.returned_at = ''
  form.initial_condition = ''
  form.final_condition = ''
  dialogVisible.value = true
}

const openEditDialog = (row: any) => {
  isEdit.value = true
  form.id = row.id
  form.username = row.username
  form.device_type = row.device_type || 'laptop'
  form.device_id = row.device_id
  form.assigned_at = row.assigned_at || ''
  form.returned_at = row.returned_at || ''
  form.initial_condition = row.initial_condition || ''
  form.final_condition = row.final_condition || ''
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      const payload = {
        username: form.username,
        device_type: form.device_type,
        device_id: form.device_id,
        assigned_at: form.assigned_at || null,
        returned_at: form.returned_at || null,
        initial_condition: form.initial_condition || null,
        final_condition: form.final_condition || null
      }

      try {
        if (isEdit.value) {
          const editPayload = { ...payload, id: form.id }
          await otherService.updateDeviceAssignments([editPayload])

          const idx = assignments.value.findIndex(s => s.id === form.id)
          if (idx !== -1) {
            assignments.value[idx] = { ...assignments.value[idx], ...editPayload }
          }

          // If returned_at is filled on edit, return device to ready_for_handover status
          if (form.returned_at) {
            const targetStatus = DeviceStatus.READY_FOR_HANDOVER
            const devPayload = { id: form.device_id, status: targetStatus }
            try {
              if (form.device_type === 'phone') await otherService.updateSmartphones([devPayload])
              else if (form.device_type === 'laptop') await otherService.updateLaptops([devPayload])
              else if (form.device_type === 'tablet') await otherService.updateTablets([devPayload])
              else if (form.device_type === 'monitor') await otherService.updateScreens([devPayload])
              else if (form.device_type === 'camera') await otherService.updateCameras([devPayload])
              else await otherService.updateOtherDevices([devPayload])
            } catch (statusErr) {
              console.warn('Device status update on return warning:', statusErr)
            }
          }

          ElMessage.success('Cập nhật thông tin bàn giao thành công!')
        } else {
          const res = await otherService.addDeviceAssignments([payload])
          if (res && res.length > 0) {
            assignments.value.unshift(res[0])
          } else {
            await fetchAssignments()
          }

          // Update device status to handed_over (or ready_for_handover if returned_at provided immediately)
          const targetStatus = form.returned_at ? DeviceStatus.READY_FOR_HANDOVER : DeviceStatus.HANDED_OVER
          const devPayload = { id: form.device_id, status: targetStatus }
          try {
            if (form.device_type === 'phone') await otherService.updateSmartphones([devPayload])
            else if (form.device_type === 'laptop') await otherService.updateLaptops([devPayload])
            else if (form.device_type === 'tablet') await otherService.updateTablets([devPayload])
            else if (form.device_type === 'monitor') await otherService.updateScreens([devPayload])
            else if (form.device_type === 'camera') await otherService.updateCameras([devPayload])
            else await otherService.updateOtherDevices([devPayload])
          } catch (statusErr) {
            console.warn('Device status update on new assignment warning:', statusErr)
          }

          ElMessage.success('Thêm thông tin bàn giao thành công!')
        }
        dialogVisible.value = false
      } catch (error: any) {
        ElMessage.error(error.message || 'Lỗi khi lưu thông tin bàn giao')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa bản ghi bàn giao thiết bị "${row.device_id}" cho nhân viên "${row.username}"?`,
      'Xác nhận xóa bản ghi bàn giao',
      {
        confirmButtonText: 'Xóa bỏ',
        cancelButtonText: 'Hủy',
        type: 'warning'
      }
    )
    loading.value = true
    await otherService.deleteDeviceAssignments([row.id])

    assignments.value = assignments.value.filter(s => s.id !== row.id)
    ElMessage.success('Xóa bản ghi bàn giao thành công!')
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || 'Lỗi khi xóa bản ghi bàn giao')
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

const getDeviceTypeLabel = (type: string) => {
  switch (type) {
    case 'phone': return 'Điện thoại'
    case 'laptop': return 'Laptop'
    case 'tablet': return 'Máy tính bảng'
    case 'monitor': return 'Màn hình'
    case 'camera': return 'Camera'
    case 'other': return 'Thiết bị khác'
    default: return type
  }
}

const getDeviceTypeTag = (type: string) => {
  switch (type) {
    case 'phone': return 'primary'
    case 'laptop': return 'success'
    case 'tablet': return 'warning'
    case 'monitor': return 'info'
    case 'camera': return 'danger'
    case 'other': return 'info'
    default: return 'info'
  }
}

onMounted(() => {
  fetchAssignments()
})
</script>

<style scoped>
html.dark .assignment-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .assignment-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .assignment-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

html.dark .assignment-container :deep(.el-table .el-table-fixed-column--left),
html.dark .assignment-container :deep(.el-table .el-table-fixed-column--right) {
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

<style>
/* Custom background & text colors for date filter pickers (unscoped to bypass Element Plus shadow DOM/attributes) */
.date-filter-picker .el-input__wrapper {
  background-color: #ffffff !important; /* Match light mode inputs */
  box-shadow: 0 0 0 1px var(--el-border-color) inset !important;
}

.date-filter-picker .el-input__inner {
  color: var(--el-text-color-regular) !important;
  font-weight: normal;
}

.date-filter-picker .el-input__icon {
  color: var(--el-text-color-placeholder) !important;
}

html.dark .date-filter-picker .el-input__wrapper {
  background-color: #1f2937 !important; /* Match dark mode inputs */
  box-shadow: 0 0 0 1px #374151 inset !important; /* Match dark mode borders */
}

html.dark .date-filter-picker .el-input__inner {
  color: #f3f4f6 !important;
  -webkit-text-fill-color: #f3f4f6 !important;
}

html.dark .date-filter-picker .el-input__icon {
  color: #9ca3af !important;
}
</style>
