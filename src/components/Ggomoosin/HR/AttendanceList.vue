<template>
  <div class="attendance-container h-full flex flex-col">
    <!-- Filter Bar -->
    <div class="flex justify-between items-center mb-4 shrink-0">
      <div class="flex items-center gap-4 flex-wrap">
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Nhân viên:</span>
          <el-input
            v-model="filters.search"
            placeholder="Mã NV hoặc Họ tên..."
            :prefix-icon="Search"
            clearable
            class="w-60 custom-dark-input"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian:</span>
          <el-date-picker :editable="false"
            v-model="filters.month"
            type="month"
            placeholder="Chọn tháng"
            format="MM/YYYY"
            value-format="YYYY-MM"
            class="custom-dark-input highlight-select"
            style="width: 150px"
          />
        </div>
        <el-button type="primary" :icon="Search" @click="handleSearch">Tìm kiếm</el-button>
      </div>
      <el-button type="success" :icon="Plus" @click="openAddDialog">Cập nhật công</el-button>
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
      <el-table :data="paginatedData" :empty-text="tableEmptyText" v-loading="loading" style="width: 100%" class="flex-1" height="100%" @sort-change="handleSortChange">
        <!-- STT Column -->
        <el-table-column label="STT" width="60" align="center" fixed>
          <template #default="{ $index }">
            <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="employeeCode" label="Mã NV" width="120" sortable="custom" fixed />
        <el-table-column prop="employeeName" label="Tên nhân viên" width="200" fixed show-overflow-tooltip />
        <el-table-column prop="year" label="Năm" width="90" align="center" />
        <el-table-column prop="month" label="Tháng" width="90" align="center" />
        <el-table-column prop="day" label="Ngày" width="90" align="center" />
        <el-table-column prop="dayOfWeek" label="Thứ" width="110" align="center">
          <template #default="scope">
            <span :class="scope.row.dayOfWeek === 'Chủ Nhật' ? 'text-red-500 font-bold' : ''">{{ scope.row.dayOfWeek }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="weekOfYear" label="Tuần" width="90" align="center" />
        <el-table-column prop="breakTime" label="Thời gian nghỉ" width="140" align="center" />
        <el-table-column prop="checkIn" label="Vào ca" width="120" align="center">
          <template #default="scope">
            <span :class="scope.row.isLate ? 'text-red-500 font-bold' : ''">{{ scope.row.checkIn || '--:--' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="checkOut" label="Ra ca" width="120" align="center">
          <template #default="scope">
            <span :class="scope.row.isEarlyLeave ? 'text-orange-500 font-bold' : ''">{{ scope.row.checkOut || '--:--' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="otStart" label="Bắt đầu OT" width="130" align="center" />
        <el-table-column prop="otEnd" label="Kết thúc OT" width="130" align="center" />
        <el-table-column label="Giờ làm việc" width="140" align="center">
          <template #default="scope">
            <span class="font-semibold text-gray-700 dark:text-gray-200">{{ scope.row.workHours }}h</span>
          </template>
        </el-table-column>
        <el-table-column label="Đi trễ" width="120" align="center">
          <template #default="scope">
            <span v-if="scope.row.lateMinutes > 0" class="text-red-500 font-medium">{{ scope.row.lateMinutes }} phút</span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column label="Giờ OT" width="120" align="center">
          <template #default="scope">
            <span v-if="scope.row.otHours > 0" class="text-green-500 font-bold">{{ scope.row.otHours }}h</span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column label="Nửa ngày" width="110" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.isHalfDay" type="warning" size="small" effect="dark" round>½</el-tag>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="errors" label="Lỗi" width="180" align="center">
          <template #default="scope">
            <div class="flex flex-wrap gap-1 justify-center">
              <el-tag
                v-for="err in scope.row.errors"
                :key="err"
                :type="getTagType(err)"
                size="small"
                effect="dark"
                round
              >
                {{ err }}
              </el-tag>
              <span v-if="!scope.row.errors || scope.row.errors.length === 0" class="text-green-500 text-xs">Không có lỗi</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="Thao tác" width="90" align="center">
          <template #default="scope">
            <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, scope.row)">
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
          :total="filteredData.length"
        />
      </div>
    </div>

    <!-- MODAL CẬP NHẬT CÔNG (BỔ SUNG CÔNG THIẾU) -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'CHỈNH SỬA CÔNG' : 'CẬP NHẬT CÔNG CÒN THIẾU'"
      width="900px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form :model="form" ref="formRef" :rules="rules" label-width="180px" class="mt-2 compact-form">
          <!-- PHẦN 1: THÔNG TIN CHUNG -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin chung
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã nhân viên" prop="employeeCode">
                  <el-input v-model="form.employeeCode" placeholder="Nhập mã nhân viên (ví dụ: NV001)..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ngày bổ sung" prop="date">
                  <el-date-picker :editable="false"
                    v-model="form.date"
                    type="date"
                    placeholder="Chọn ngày bổ sung công"
                    format="DD/MM/YYYY"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: THÔNG TIN GIỜ CÔNG & OT -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Thông tin giờ công &amp; Tăng ca (OT)
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Thời gian vào ca" prop="checkIn">
                  <el-time-picker
                    v-model="form.checkIn"
                    format="HH:mm"
                    value-format="HH:mm"
                    placeholder="Giờ vào"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Thời gian ra ca" prop="checkOut">
                  <el-time-picker
                    v-model="form.checkOut"
                    format="HH:mm"
                    value-format="HH:mm"
                    placeholder="Giờ ra"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Bắt đầu tăng ca" prop="otStart">
                  <el-time-picker
                    v-model="form.otStart"
                    format="HH:mm"
                    value-format="HH:mm"
                    placeholder="Bắt đầu"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Kết thúc tăng ca" prop="otEnd">
                  <el-time-picker
                    v-model="form.otEnd"
                    format="HH:mm"
                    value-format="HH:mm"
                    placeholder="Kết thúc"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Thời gian nghỉ (phút)" prop="breakMinutes">
                  <el-input-number
                    v-model="form.breakMinutes"
                    :min="0"
                    :step="15"
                    controls-position="right"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Nửa ngày công">
                  <el-switch v-model="form.isHalfDay" active-text="Có" inactive-text="Không" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 3: THÔNG TIN BỔ SUNG -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-violet-650 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
              Thông tin bổ sung
            </h4>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Lý do cập nhật" prop="reason">
                  <el-input v-model="form.reason" placeholder="Ví dụ: Quên quét thẻ, Đi công tác..." />
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
    <!-- CHI TIẾT CHẤM CÔNG DIALOG -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT THÔNG TIN CHẤM CÔNG"
      width="800px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedAttendance" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto overflow-x-hidden">
        <!-- Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <el-avatar :size="64" :src="selectedAttendance.photoUrl || ''">
            <span class="text-xl font-bold text-gray-500 dark:text-gray-400">
              {{ selectedAttendance.employeeName ? selectedAttendance.employeeName.charAt(0).toUpperCase() : 'N' }}
            </span>
          </el-avatar>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Bản ghi chấm công</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {{ selectedAttendance.employeeName }} 
              <span class="text-gray-400 dark:text-gray-500 font-medium">({{ selectedAttendance.employeeCode }})</span>
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <span class="text-blue-500 dark:text-blue-400 font-semibold">
                Ngày {{ selectedAttendance.day }}/{{ selectedAttendance.month }}/{{ selectedAttendance.year }} ({{ selectedAttendance.dayOfWeek }})
              </span>
              <span class="text-gray-400 dark:text-gray-500">|</span>
              <span class="text-gray-600 dark:text-gray-400">Tuần {{ selectedAttendance.weekOfYear }}</span>
              <span v-if="selectedAttendance.position" class="text-gray-400 dark:text-gray-500">|</span>
              <span v-if="selectedAttendance.position" class="text-gray-600 dark:text-gray-400 font-medium">{{ selectedAttendance.position }}</span>
              <span v-if="selectedAttendance.department" class="text-gray-400 dark:text-gray-500">|</span>
              <span v-if="selectedAttendance.department" class="text-gray-600 dark:text-gray-400 font-medium">{{ selectedAttendance.department }}</span>
            </div>
          </div>
        </div>

        <!-- 1. THÔNG TIN GIỜ CÔNG -->
        <div>
          <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            Thông tin giờ công
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Giờ vào ca</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ selectedAttendance.checkIn || '—' }}
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Giờ ra ca</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ selectedAttendance.checkOut || '—' }}
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Giờ làm việc</div>
              <div class="text-sm font-bold text-emerald-500 dark:text-emerald-400">
                {{ selectedAttendance.workHours }} giờ
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Thời gian nghỉ</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ selectedAttendance.breakTime || '—' }}
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 2. TĂNG CA (OT) -->
        <div>
          <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
            Tăng ca (OT)
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Bắt đầu OT</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ selectedAttendance.otStart || '—' }}
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Kết thúc OT</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ selectedAttendance.otEnd || '—' }}
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Giờ tăng ca (OT)</div>
              <div class="text-sm font-bold text-green-500 dark:text-green-400">
                {{ selectedAttendance.otHours > 0 ? `${selectedAttendance.otHours} giờ` : '—' }}
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 3. TRẠNG THÁI & LỖI -->
        <div>
          <h4 class="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-rose-500 rounded-full"></span>
            Trạng thái & Lỗi
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Đi trễ</div>
              <div class="text-sm font-medium" :class="selectedAttendance.lateMinutes > 0 ? 'text-red-500 font-bold' : 'text-gray-700 dark:text-gray-300'">
                {{ selectedAttendance.lateMinutes > 0 ? `${selectedAttendance.lateMinutes} phút` : '—' }}
              </div>
            </div>
            <div class="col-span-2">
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Trạng thái / Lỗi</div>
              <div class="flex flex-wrap gap-1">
                <el-tag
                  v-for="err in selectedAttendance.errors"
                  :key="err"
                  :type="getTagType(err)"
                  size="small"
                  effect="dark"
                  round
                >
                  {{ err }}
                </el-tag>
                <span v-if="!selectedAttendance.errors || selectedAttendance.errors.length === 0" class="text-green-500 text-sm font-medium">Không có lỗi</span>
              </div>
            </div>
          </div>
          <div v-if="selectedAttendance.reason" class="mt-4">
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Lý do cập nhật</div>
            <div class="text-sm text-gray-700 dark:text-gray-300 italic">
              "{{ selectedAttendance.reason }}"
            </div>
          </div>
        </div>

        <div v-if="selectedAttendance.phone || selectedAttendance.email || selectedAttendance.position || selectedAttendance.department" class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 4. THÔNG TIN NHÂN VIÊN -->
        <div v-if="selectedAttendance.phone || selectedAttendance.email || selectedAttendance.position || selectedAttendance.department">
          <h4 class="text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-cyan-500 rounded-full"></span>
            Thông tin nhân viên
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Chức vụ</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedAttendance.position || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Phòng ban</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedAttendance.department || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Giới tính</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedAttendance.gender || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số điện thoại</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedAttendance.phone || '—' }}</div>
            </div>
            <div class="col-span-2">
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Email</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300 break-all">{{ selectedAttendance.email || '—' }}</div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end pr-2">
          <el-button type="primary" @click="detailDialogVisible = false">Đóng</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Search, Plus, MoreFilled } from '@element-plus/icons-vue'
import { ElNotification, ElMessageBox } from 'element-plus'
import { employeeService } from '@/api/employeeService'

// Filters (bound to inputs)
const filters = reactive({
  search: '',
  month: '2026-06'
})

const hasSearched = ref(false)
const loading = ref(false)
const loadingEmployees = ref(false)
const employeeOptions = ref<any[]>([])

const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const formRef = ref()

// Rules for Supplement Form
const rules = {
  employeeCode: [{ required: true, message: 'Vui lòng nhập nhân viên', trigger: 'change' }],
  date: [{ required: true, message: 'Vui lòng chọn ngày bổ sung', trigger: 'change' }],
  checkIn: [{ required: true, message: 'Vui lòng chọn giờ vào ca', trigger: 'change' }],
  checkOut: [{ required: true, message: 'Vui lòng chọn giờ ra ca', trigger: 'change' }]
}

// Dialog Supplement Form state
const form = reactive({
  employeeCode: '',
  date: '',
  checkIn: '',
  checkOut: '',
  otStart: '',
  otEnd: '',
  breakMinutes: undefined as number | undefined,
  isHalfDay: false,
  reason: ''
})

// Day Names map
const dayNamesVi = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

// Helper: Get Week of Year
const getWeekNumber = (d: Date): number => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// Helper to format ISO datetime string to HH:MM in local timezone
const formatTimeOnly = (isoStr: string | null | undefined) => {
  if (!isoStr) return ''
  if (typeof isoStr === 'string' && /^\d{2}:\d{2}/.test(isoStr)) {
    return isoStr.substring(0, 5)
  }
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return ''
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  } catch {
    return ''
  }
}

// Load employee list for dynamic matching in background on mount
const fetchEmployees = async () => {
  loadingEmployees.value = true
  try {
    const data = await employeeService.getEmployees('G')
    employeeOptions.value = data.map((emp: any) => ({
      id: emp.id,
      lastName: emp.last_name || '',
      firstName: emp.first_name || '',
      photoUrl: emp.employee_photo || '',
      position: emp.position || '',
      department: emp.department || '',
      phone: emp.number_phone || '',
      email: emp.email || '',
      gender: emp.gender || ''
    }))
  } catch (error: any) {
    console.error('Failed to fetch employee options:', error)
  } finally {
    loadingEmployees.value = false
  }
}

onMounted(() => {
  fetchEmployees()
})

const allData = ref<any[]>([])

const mapApiAttendanceRecord = (item: any, employeeName: string, employeeCode: string) => {
  const dateObj = new Date(item.year, item.month - 1, item.day)
  const dayOfWeek = dayNamesVi[dateObj.getDay()]
  const weekOfYear = getWeekNumber(dateObj)

  // Break time
  const breakMinutes = item.break_time || 0
  const breakTime = `${breakMinutes} phút`

  // Parse errors
  let errors: string[] = []
  if (item.error) {
    if (item.error.trim().startsWith('[') && item.error.trim().endsWith(']')) {
      try {
        errors = JSON.parse(item.error)
      } catch {
        errors = [item.error]
      }
    } else {
      errors = item.error.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
  }

  const isLate = errors.some(e => e.includes('Đi trễ')) || (item.late_time && item.late_time > 0)
  const isEarlyLeave = errors.some(e => e.includes('Về sớm'))

  return {
    id: item.id || `${employeeCode}-${item.year}-${item.month}-${item.day}`,
    employeeCode: employeeCode,
    employeeName: employeeName,
    year: item.year,
    month: item.month,
    day: item.day,
    dayOfWeek,
    weekOfYear,
    breakTime,
    breakMinutes,
    checkIn: formatTimeOnly(item.check_in_time),
    checkOut: formatTimeOnly(item.check_out_time),
    otStart: formatTimeOnly(item.start_overtime),
    otEnd: formatTimeOnly(item.end_overtime),
    workHours: item.work_hours || 0,
    lateMinutes: item.late_time || 0,
    otHours: item.overtime || 0,
    isHalfDay: item.is_half_day || false,
    isLate,
    isEarlyLeave,
    errors,
    reason: ''
  }
}

// Search and Filter computation
const handleSearch = async () => {
  if (!filters.search) {
    ElNotification({
      title: 'Thông báo',
      message: 'Vui lòng nhập mã nhân viên (employee_id) trước khi tìm kiếm.',
      type: 'warning'
    })
    return
  }
  if (!filters.month) {
    ElNotification({
      title: 'Thông báo',
      message: 'Vui lòng chọn thời gian tìm kiếm.',
      type: 'warning'
    })
    return
  }

  const resolvedId = filters.search.trim()

  loading.value = true
  hasSearched.value = true
  currentPage.value = 1

  try {
    // API wants date in mm/yyyy format
    const [year, month] = filters.month.split('-')
    const apiDateFormat = `${month}/${year}`

    const res = await employeeService.getAttendance(resolvedId, apiDateFormat)
    const empName = `${res.last_name || ''} ${res.first_name || ''}`.trim() || res.employee_id
    const empCode = res.employee_id

    if (res.attendance && Array.isArray(res.attendance)) {
      allData.value = res.attendance.map((record: any) => 
        mapApiAttendanceRecord(record, empName, empCode)
      )
    } else {
      allData.value = []
    }
  } catch (error: any) {
    console.error('Failed to search attendance:', error)
    ElNotification({
      title: 'Lỗi',
      message: error.message || 'Không thể lấy dữ liệu chấm công.',
      type: 'error'
    })
    allData.value = []
  } finally {
    loading.value = false
  }
}

const filteredData = computed(() => {
  if (!hasSearched.value) return []
  return allData.value
})

const sortProp = ref('')
const sortOrder = ref('')

const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  sortProp.value = prop
  sortOrder.value = order
  currentPage.value = 1
}

const sortedData = computed(() => {
  const list = [...filteredData.value]
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
  return sortedData.value.slice(start, start + pageSize.value)
})

const tableEmptyText = computed(() => {
  return hasSearched.value
    ? 'Không có dữ liệu chấm công phù hợp'
    : 'Vui lòng nhập thông tin bộ lọc và nhấn nút "Tìm kiếm" để hiển thị dữ liệu'
})

// Dialog actions
const isEdit = ref(false)
const editingRecordId = ref<string | null>(null)
const detailDialogVisible = ref(false)
const selectedAttendance = ref<any>(null)

const openAddDialog = () => {
  isEdit.value = false
  editingRecordId.value = null
  form.employeeCode = ''
  form.date = ''
  form.checkIn = ''
  form.checkOut = ''
  form.otStart = ''
  form.otEnd = ''
  form.breakMinutes = undefined
  form.isHalfDay = false
  form.reason = ''
  dialogVisible.value = true
}

const openEditDialog = (row: any) => {
  isEdit.value = true
  editingRecordId.value = row.id
  form.employeeCode = row.employeeCode
  const monthStr = String(row.month).padStart(2, '0')
  const dayStr = String(row.day).padStart(2, '0')
  form.date = `${row.year}-${monthStr}-${dayStr}`
  form.checkIn = row.checkIn
  form.checkOut = row.checkOut
  form.otStart = row.otStart
  form.otEnd = row.otEnd
  form.breakMinutes = row.breakMinutes !== undefined ? row.breakMinutes : undefined
  form.isHalfDay = row.isHalfDay || false
  form.reason = row.reason
  dialogVisible.value = true
}

const showAttendanceDetail = (row: any) => {
  const emp = employeeOptions.value.find(e => e.id === row.employeeCode)
  selectedAttendance.value = {
    ...row,
    photoUrl: emp?.photoUrl || '',
    position: emp?.position || '',
    department: emp?.department || '',
    phone: emp?.phone || '',
    email: emp?.email || '',
    gender: emp?.gender || ''
  }
  detailDialogVisible.value = true
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(
    `Bạn có chắc chắn muốn xóa bản ghi chấm công ngày ${row.day}/${row.month}/${row.year} của nhân viên "${row.employeeName}" không?`,
    'Xác nhận xóa',
    {
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy bỏ',
      type: 'warning'
    }
  ).then(async () => {
    loading.value = true
    try {
      await employeeService.deleteAttendance([row.id])
      allData.value = allData.value.filter(r => r.id !== row.id)
      ElNotification({
        title: 'Thành công',
        message: 'Đã xóa bản ghi chấm công thành công!',
        type: 'success'
      })
    } catch (error: any) {
      ElNotification({
        title: 'Lỗi',
        message: error.message || 'Không thể xóa bản ghi chấm công.',
        type: 'error'
      })
    } finally {
      loading.value = false
    }
  }).catch(() => {})
}

const handleCommand = (command: string, row: any) => {
  if (command === 'detail') {
    showAttendanceDetail(row)
  } else if (command === 'edit') {
    openEditDialog(row)
  } else if (command === 'delete') {
    handleDelete(row)
  }
}

const makeIsoDateTime = (dateStr: string, timeStr: string | null | undefined): string | null => {
  if (!dateStr || !timeStr) return null
  return `${dateStr}T${timeStr}:00`
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      const enteredCode = form.employeeCode.trim().toUpperCase()
      let targetId = enteredCode
      if (targetId.startsWith('NV')) {
        targetId = 'G' + targetId.substring(2)
      }
      const emp = employeeOptions.value.find(e => e.id === targetId)
      if (!emp) {
        ElNotification({
          title: 'Lỗi',
          message: `Không tìm thấy nhân viên với mã ${enteredCode}!`,
          type: 'error'
        })
        return
      }

      const dateObj = new Date(form.date)
      const year = dateObj.getFullYear()
      const month = dateObj.getMonth() + 1
      const day = dateObj.getDate()
      const dayOfWeek = dayNamesVi[dateObj.getDay()]
      const weekOfYear = getWeekNumber(dateObj)

      // Calculate standard mock metrics for display
      const parseTimeToMinutes = (timeStr: string): number => {
        if (!timeStr) return 0
        const parts = timeStr.split(':')
        const h = Number(parts[0]) || 0
        const m = Number(parts[1]) || 0
        return h * 60 + m
      }

      const inMin = parseTimeToMinutes(form.checkIn)
      const outMin = parseTimeToMinutes(form.checkOut)
      const standardStartMin = 7 * 60
      const standardEndMin = 16 * 60
      const breakMin = form.breakMinutes || 0

      let workHours = 0
      if (outMin > inMin) {
        workHours = Math.max(0, parseFloat(((outMin - inMin - breakMin) / 60).toFixed(1)))
      }

      let lateMinutes = 0
      if (inMin > standardStartMin) {
        lateMinutes = inMin - standardStartMin
      }

      let earlyLeaveMinutes = 0
      if (outMin < standardEndMin) {
        earlyLeaveMinutes = standardEndMin - outMin
      }

      let otHours = 0
      if (form.otStart && form.otEnd) {
        const otSMin = parseTimeToMinutes(form.otStart)
        const otEMin = parseTimeToMinutes(form.otEnd)
        if (otEMin > otSMin) {
          otHours = parseFloat(((otEMin - otSMin) / 60).toFixed(1))
        }
      }

      const errors: string[] = []
      if (!form.checkIn) {
        errors.push('Thiếu Check-In')
      } else if (lateMinutes > 15) {
        errors.push('Đi trễ')
      }

      if (!form.checkOut) {
        errors.push('Thiếu Check-Out')
      } else if (earlyLeaveMinutes > 15) {
        errors.push('Về sớm')
      }

      loading.value = true
      try {
        if (isEdit.value && editingRecordId.value) {
          const payload = {
            id: editingRecordId.value,
            employee_id: targetId,
            year,
            month,
            day,
            date_str: dayOfWeek,
            work_hours: workHours,
            off_hours: "16:00:00",
            check_in_time: makeIsoDateTime(form.date, form.checkIn),
            check_out_time: makeIsoDateTime(form.date, form.checkOut),
            start_overtime: makeIsoDateTime(form.date, form.otStart),
            end_overtime: makeIsoDateTime(form.date, form.otEnd),
            break_time: breakMin,
            working_time: workHours,
            late_time: lateMinutes,
            overtime: otHours,
            error: errors.join(', '),
            is_half_day: form.isHalfDay
          }

          const updatedObj = await employeeService.updateAttendance(payload)

          const newRecord = {
            id: updatedObj.id,
            employeeCode: updatedObj.employee_id,
            employeeName: `${emp.lastName} ${emp.firstName}`,
            year: updatedObj.year,
            month: updatedObj.month,
            day: updatedObj.day,
            dayOfWeek: dayOfWeek,
            weekOfYear: weekOfYear,
            breakTime: `${updatedObj.break_time} phút`,
            breakMinutes: updatedObj.break_time,
            checkIn: formatTimeOnly(updatedObj.check_in_time),
            checkOut: formatTimeOnly(updatedObj.check_out_time),
            otStart: formatTimeOnly(updatedObj.start_overtime),
            otEnd: formatTimeOnly(updatedObj.end_overtime),
            workHours: updatedObj.work_hours,
            lateMinutes: updatedObj.late_time,
            otHours: updatedObj.overtime,
            isHalfDay: updatedObj.is_half_day || false,
            isLate: updatedObj.late_time > 15,
            isEarlyLeave: (updatedObj.error || '').includes('Về sớm'),
            errors: updatedObj.error ? updatedObj.error.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
            reason: form.reason
          }

          const index = allData.value.findIndex(r => r.id === editingRecordId.value)
          if (index !== -1) {
            allData.value[index] = newRecord
          }
          ElNotification({
            title: 'Thành công',
            message: `Đã chỉnh sửa công ngày ${day}/${month}/${year} cho nhân viên ${newRecord.employeeName}!`,
            type: 'success'
          })
        } else {
          const payload = {
            employee_id: targetId,
            year,
            month,
            day,
            date_str: dayOfWeek,
            work_hours: workHours,
            off_hours: "16:00:00",
            check_in_time: makeIsoDateTime(form.date, form.checkIn),
            check_out_time: makeIsoDateTime(form.date, form.checkOut),
            start_overtime: makeIsoDateTime(form.date, form.otStart),
            end_overtime: makeIsoDateTime(form.date, form.otEnd),
            break_time: breakMin,
            working_time: workHours,
            late_time: lateMinutes,
            overtime: otHours,
            error: errors.join(', '),
            is_half_day: form.isHalfDay
          }

          const createdObj = await employeeService.addAttendance(payload)

          const newRecord = {
            id: createdObj.id,
            employeeCode: createdObj.employee_id,
            employeeName: `${emp.lastName} ${emp.firstName}`,
            year: createdObj.year,
            month: createdObj.month,
            day: createdObj.day,
            dayOfWeek: dayOfWeek,
            weekOfYear: weekOfYear,
            breakTime: `${createdObj.break_time} phút`,
            breakMinutes: createdObj.break_time,
            checkIn: formatTimeOnly(createdObj.check_in_time),
            checkOut: formatTimeOnly(createdObj.check_out_time),
            otStart: formatTimeOnly(createdObj.start_overtime),
            otEnd: formatTimeOnly(createdObj.end_overtime),
            workHours: createdObj.work_hours,
            lateMinutes: createdObj.late_time,
            otHours: createdObj.overtime,
            isHalfDay: createdObj.is_half_day || false,
            isLate: createdObj.late_time > 15,
            isEarlyLeave: (createdObj.error || '').includes('Về sớm'),
            errors: createdObj.error ? createdObj.error.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
            reason: form.reason
          }

          allData.value.unshift(newRecord)
          ElNotification({
            title: 'Thành công',
            message: `Đã bổ sung công ngày ${day}/${month}/${year} cho nhân viên ${newRecord.employeeName}!`,
            type: 'success'
          })
        }

        filters.search = targetId
        const newMonth = `${year}-${String(month).padStart(2, '0')}`
        filters.month = newMonth
        hasSearched.value = true

        dialogVisible.value = false
      } catch (error: any) {
        ElNotification({
          title: 'Lỗi',
          message: error.message || 'Không thể bổ sung công.',
          type: 'error'
        })
      } finally {
        loading.value = false
      }
    }
  })
}

// Get tag styling based on error message
const getTagType = (err: string) => {
  if (err.includes('Đi trễ')) return 'danger'
  if (err.includes('Về sớm')) return 'warning'
  if (err.includes('Thiếu')) return 'danger'
  if (err.includes('Nghỉ')) return 'info'
  return 'primary'
}
</script>

<style scoped>
.attendance-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

.attendance-container :deep(.el-table td.el-table__cell .cell) {
  white-space: nowrap !important;
}

html.dark .attendance-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}
html.dark .attendance-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}
html.dark .attendance-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}
html.dark .attendance-container :deep(.el-table .el-table-fixed-column--left),
html.dark .attendance-container :deep(.el-table .el-table-fixed-column--right) {
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

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}
</style>

<style>
/* Date picker dark mode (unscoped to properly override Element Plus) */
html.dark .highlight-select .el-input__wrapper,
html.dark .highlight-select .el-select__wrapper {
  background-color: #111827 !important;
  border-color: #111827 !important;
}
html.dark .highlight-select.el-date-editor .el-input__wrapper {
  background-color: #111827 !important;
  box-shadow: 0 0 0 1px #111827 inset !important;
}
html.dark .highlight-select.el-date-editor .el-input__inner {
  color: #f3f4f6 !important;
}
html.dark .highlight-select.el-date-editor .el-input__inner::placeholder {
  color: #6b7280 !important;
}
</style>
