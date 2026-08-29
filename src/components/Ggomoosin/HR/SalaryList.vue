<template>
  <div class="salary-container h-full flex flex-col">
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
    </div>

    <!-- Summary Cards -->
    <div v-if="hasSearched" class="grid grid-cols-4 gap-4 mb-4 shrink-0">
      <div class="summary-card bg-white dark:bg-gray-900 rounded-lg shadow p-4 border-l-4 border-blue-500">
        <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Tổng lương cơ bản</div>
        <div class="text-lg font-bold text-blue-600 dark:text-blue-400">{{ formatCurrency(totalBaseSalary) }}</div>
      </div>
      <div class="summary-card bg-white dark:bg-gray-900 rounded-lg shadow p-4 border-l-4 border-green-500">
        <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Tổng lương tăng ca</div>
        <div class="text-lg font-bold text-green-500">{{ formatCurrency(totalOvertimeSalary) }}</div>
      </div>
      <div class="summary-card bg-white dark:bg-gray-900 rounded-lg shadow p-4 border-l-4 border-amber-500">
        <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Tổng phụ cấp</div>
        <div class="text-lg font-bold text-amber-500">{{ formatCurrency(totalAllowance) }}</div>
      </div>
      <div class="summary-card bg-white dark:bg-gray-900 rounded-lg shadow p-4 border-l-4 border-emerald-500">
        <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Tổng lương thực nhận</div>
        <div class="text-lg font-bold text-emerald-600 dark:text-emerald-400">{{ formatCurrency(totalNetSalary) }}</div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
      <!-- ══════════════════════════════════════════════════════════════
           MỤC 398 (29/08/2026) — BỎ CỘT GHIM, BẢNG CHỈ HIỆN TỪ 768px

           Cột ghim `fixed` chiếm chỗ CỐ ĐỊNH và không co theo màn hình.
           Trên màn 390px, mấy cột ghim cộng lại đã hết chỗ, nên vùng
           cuộn còn lại bằng 0 và vuốt ngang không có tác dụng — người
           dùng vuốt mà màn hình không nhúc nhích.

           Đã bỏ 0 cột ghim ở bảng này.
           ══════════════════════════════════════════════════════════ -->
      <el-table v-if="hienBang" v-loading="loading" :data="paginatedData" :empty-text="tableEmptyText" style="width: 100%" class="flex-1" height="100%" @sort-change="handleSortChange">
        <!-- STT Column -->
        <el-table-column label="STT" width="52" align="center">
          <template #default="{ $index }">
            <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="employeeCode" label="Mã NV" width="86" sortable="custom" />
        <el-table-column prop="employeeName" label="Tên nhân viên" width="144" show-overflow-tooltip />
        <el-table-column prop="penaltyRate" label="Tỉ lệ phạt" width="86" align="center">
          <template #default="scope">
            <span :class="scope.row.penaltyRate > 0 ? 'text-red-500 font-semibold' : 'text-gray-400'">
              {{ scope.row.penaltyRate }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="year" label="Năm" width="70" align="center" />
        <el-table-column prop="month" label="Tháng" width="70" align="center" />
        <el-table-column prop="paidLeave" label="Nghỉ có phép" width="94" align="center">
          <template #default="scope">
            <span :class="scope.row.paidLeave > 0 ? 'text-blue-500 font-medium' : 'text-gray-400'">
              {{ scope.row.paidLeave }} ngày
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="unpaidLeave" label="Nghỉ không phép" width="108" align="center">
          <template #default="scope">
            <span :class="scope.row.unpaidLeave > 0 ? 'text-red-500 font-semibold' : 'text-gray-400'">
              {{ scope.row.unpaidLeave }} ngày
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Lương cơ bản" width="108" align="right">
          <template #default="scope">
            <span class="font-medium" :class="mauSo(scope.row.baseSalary)">{{ formatCurrency(scope.row.baseSalary) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Lương tăng ca" width="108" align="right">
          <template #default="scope">
            <span :class="scope.row.overtimeSalary > 0 ? 'text-green-500 font-medium' : 'text-gray-400'">
              {{ formatCurrency(scope.row.overtimeSalary) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Phụ cấp ăn trưa" width="115" align="right">
          <template #default="scope">
            <span :class="scope.row.lunchAllowance > 0 ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-400'">
              {{ formatCurrency(scope.row.lunchAllowance) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Phụ cấp khác" width="108" align="right">
          <template #default="scope">
            <span :class="scope.row.otherAllowance > 0 ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-400'">
              {{ formatCurrency(scope.row.otherAllowance) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Thưởng năng suất" width="122" align="right">
          <template #default="scope">
            <span :class="scope.row.productivityBonus > 0 ? 'text-amber-500 font-bold' : 'text-gray-400'">
              {{ formatCurrency(scope.row.productivityBonus) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="BHXH" width="101" align="right">
          <template #default="scope">
            <span :class="scope.row.socialInsurance > 0 ? 'text-orange-500 font-medium' : 'text-gray-400'">
              {{ scope.row.socialInsurance > 0 ? '-' + formatCurrency(scope.row.socialInsurance) : formatCurrency(0) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Phạt đi trễ" width="101" align="right">
          <template #default="scope">
            <span :class="scope.row.latePenalty > 0 ? 'text-red-500 font-semibold' : 'text-gray-400'">
              {{ scope.row.latePenalty > 0 ? '-' + formatCurrency(scope.row.latePenalty) : formatCurrency(0) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="Ghi chú" width="144" show-overflow-tooltip />
        <el-table-column label="Lương thực nhận" width="122" align="right">
          <template #default="scope">
            <span class="text-emerald-600 dark:text-emerald-400 font-bold text-base">
              {{ formatCurrency(scope.row.netSalary) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Thao tác" width="60" align="center">
          <template #default="scope">
            <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, scope.row)">
              <el-button link type="info" class="p-1">
                <el-icon class="text-xl"><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="delete" class="!text-red-500">Xóa</el-dropdown-item>
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
        <div v-if="paginatedData.length > 0" class="grid grid-cols-1 gap-4">
          <div
            v-for="(row, i) in (paginatedData as any[])"
            :key="row.id || row.contract_id || i"
            class="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
              <div class="min-w-0 break-words">
                {{ row.employeeCode }}
              </div>
              <div class="shrink-0">
                <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, row)">
                              <el-button link type="info" class="p-1">
                                <el-icon class="text-xl"><MoreFilled /></el-icon>
                              </el-button>
                              <template #dropdown>
                                <el-dropdown-menu>
                                  <el-dropdown-item command="delete" class="!text-red-500">Xóa</el-dropdown-item>
                                </el-dropdown-menu>
                              </template>
                            </el-dropdown>
              </div>
            </div>
            <div class="space-y-2 text-sm text-left">
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tên nhân viên:</span>
                <span class="text-right break-words min-w-0">
                  {{ row.employeeName }}
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tỉ lệ phạt:</span>
                <span class="text-right break-words min-w-0">
                  <span :class="row.penaltyRate > 0 ? 'text-red-500 font-semibold' : 'text-gray-400'">
                                {{ row.penaltyRate }}%
                              </span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Năm:</span>
                <span class="text-right break-words min-w-0">
                  {{ row.year }}
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tháng:</span>
                <span class="text-right break-words min-w-0">
                  {{ row.month }}
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Nghỉ có phép:</span>
                <span class="text-right break-words min-w-0">
                  <span :class="row.paidLeave > 0 ? 'text-blue-500 font-medium' : 'text-gray-400'">
                                {{ row.paidLeave }} ngày
                              </span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Nghỉ không phép:</span>
                <span class="text-right break-words min-w-0">
                  <span :class="row.unpaidLeave > 0 ? 'text-red-500 font-semibold' : 'text-gray-400'">
                                {{ row.unpaidLeave }} ngày
                              </span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Lương cơ bản:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-medium" :class="mauSo(row.baseSalary)">{{ formatCurrency(row.baseSalary) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Lương tăng ca:</span>
                <span class="text-right break-words min-w-0">
                  <span :class="row.overtimeSalary > 0 ? 'text-green-500 font-medium' : 'text-gray-400'">
                                {{ formatCurrency(row.overtimeSalary) }}
                              </span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Phụ cấp ăn trưa:</span>
                <span class="text-right break-words min-w-0">
                  <span :class="row.lunchAllowance > 0 ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-400'">
                                {{ formatCurrency(row.lunchAllowance) }}
                              </span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Phụ cấp khác:</span>
                <span class="text-right break-words min-w-0">
                  <span :class="row.otherAllowance > 0 ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-400'">
                                {{ formatCurrency(row.otherAllowance) }}
                              </span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Thưởng năng suất:</span>
                <span class="text-right break-words min-w-0">
                  <span :class="row.productivityBonus > 0 ? 'text-amber-500 font-bold' : 'text-gray-400'">
                                {{ formatCurrency(row.productivityBonus) }}
                              </span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">BHXH:</span>
                <span class="text-right break-words min-w-0">
                  <span :class="row.socialInsurance > 0 ? 'text-orange-500 font-medium' : 'text-gray-400'">
                                {{ row.socialInsurance > 0 ? '-' + formatCurrency(row.socialInsurance) : formatCurrency(0) }}
                              </span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Phạt đi trễ:</span>
                <span class="text-right break-words min-w-0">
                  <span :class="row.latePenalty > 0 ? 'text-red-500 font-semibold' : 'text-gray-400'">
                                {{ row.latePenalty > 0 ? '-' + formatCurrency(row.latePenalty) : formatCurrency(0) }}
                              </span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ghi chú:</span>
                <span class="text-right break-words min-w-0">
                  {{ row.note }}
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Lương thực nhận:</span>
                <span class="text-right break-words min-w-0">
                  <span class="text-emerald-600 dark:text-emerald-400 font-bold text-base">
                                {{ formatCurrency(row.netSalary) }}
                              </span>
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
          :page-sizes="[10, 20, 50, 100]"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredData.length"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { mauSo } from '@/utils/mauSo'
import { Search, MoreFilled } from '@element-plus/icons-vue'
import { ElNotification, ElMessageBox } from 'element-plus'
import { employeeService } from '@/api/employeeService'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'

const { laManHep, hienBang, hienThe } = dungManHep()

// Filters (bound to inputs)
const filters = reactive({
  search: '',
  month: '2026-06'
})

// Active Filters (used for actual table filtering on search click)
const activeFilters = reactive({
  search: '',
  month: '2026-06'
})

const hasSearched = ref(false)

const currentPage = ref(1)
const pageSize = ref(10)

// Format currency in VND
const formatCurrency = (value: number): string => {
  if (value === undefined || value === null) return '0 VNĐ'
  return new Intl.NumberFormat('vi-VN').format(value) + ' VNĐ'
}

const allData = ref<any[]>([])
const loading = ref(false)

// Search and Filter computation
const handleSearch = async () => {
  if (!filters.month) {
    ElNotification({
      title: 'Thông báo',
      message: 'Vui lòng chọn thời gian tìm kiếm.',
      type: 'warning'
    })
    return
  }

  loading.value = true
  hasSearched.value = true
  currentPage.value = 1

  try {
    const [year, month] = filters.month.split('-')
    const apiDateFormat = `${month}/${year}`

    let resolvedId = undefined
    if (filters.search) {
      const searchVal = filters.search.trim()
      if (/^(NV|G)\d+$/i.test(searchVal)) {
        resolvedId = searchVal.toUpperCase()
        if (resolvedId.startsWith('NV')) {
          resolvedId = 'G' + resolvedId.substring(2)
        }
      }
    }

    const res = await employeeService.getPayrolls(resolvedId, apiDateFormat)
    
    allData.value = res.map((payroll: any) => ({
      id: payroll.id,
      employeeCode: payroll.employee_id,
      employeeName: `${payroll.last_name || ''} ${payroll.first_name || ''}`.trim() || payroll.employee_id,
      penaltyRate: payroll.penalty_rate || 0,
      year: payroll.year,
      month: payroll.month,
      paidLeave: payroll.leave || 0,
      unpaidLeave: payroll.unapproved_leave || 0,
      baseSalary: payroll.base_salary_amount || 0,
      overtimeSalary: payroll.overtime_salary_amount || 0,
      lunchAllowance: payroll.lunch_allowance || 0,
      productivityBonus: payroll.productivity_bonus || 0,
      otherAllowance: payroll.other_allowance || 0,
      socialInsurance: payroll.bhxh || 0,
      latePenalty: payroll.late_penalty || 0,
      allowance: (payroll.lunch_allowance || 0) + (payroll.other_allowance || 0),
      bonus: payroll.productivity_bonus || 0,
      netSalary: payroll.total_salary || 0,
      note: payroll.note || ''
    }))

    activeFilters.search = filters.search
    activeFilters.month = filters.month
  } catch (error: any) {
    console.error('Failed to search payrolls:', error)
    ElNotification({
      title: 'Lỗi',
      message: error.message || 'Không thể lấy dữ liệu lương.',
      type: 'error'
    })
    allData.value = []
  } finally {
    loading.value = false
  }
}

const filteredData = computed(() => {
  if (!hasSearched.value) return []

  return allData.value.filter(e => {
    // Month filter
    if (activeFilters.month) {
      const [y, m] = activeFilters.month.split('-').map(Number)
      if (e.year !== y || e.month !== m) return false
    }

    // Search query (code or name)
    if (activeFilters.search) {
      const q = activeFilters.search.trim().toLowerCase()
      const matchesCode = e.employeeCode.toLowerCase().includes(q)
      const matchesName = e.employeeName.toLowerCase().includes(q)
      if (!matchesCode && !matchesName) return false
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
    ? 'Không có dữ liệu lương phù hợp'
    : 'Vui lòng nhập thông tin tìm kiếm và nhấn nút "Tìm kiếm" để hiển thị dữ liệu'
})

// Summary totals
const totalBaseSalary = computed(() => filteredData.value.reduce((sum, e) => sum + e.baseSalary, 0))
const totalOvertimeSalary = computed(() => filteredData.value.reduce((sum, e) => sum + e.overtimeSalary, 0))
const totalAllowance = computed(() => filteredData.value.reduce((sum, e) => sum + e.allowance, 0))
const totalNetSalary = computed(() => filteredData.value.reduce((sum, e) => sum + e.netSalary, 0))

// Delete handler
const handleDelete = async (row: any) => {
  loading.value = true
  try {
    await employeeService.deletePayrolls([row.id])
    const index = allData.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      allData.value.splice(index, 1)
    }
    ElNotification({
      title: 'Thành công',
      message: `Đã xóa bản ghi lương tháng ${row.month}/${row.year} của nhân viên ${row.employeeName}!`,
      type: 'success'
    })
  } catch (error: any) {
    console.error('Failed to delete payroll:', error)
    ElNotification({
      title: 'Lỗi',
      message: error.message || 'Không thể xóa bản ghi lương.',
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Dropdown command handler
const handleCommand = (command: string, row: any) => {
  if (command === 'delete') {
    ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa bản ghi lương tháng ${row.month}/${row.year} của nhân viên ${row.employeeName}?`,
      'Xác nhận xóa',
      { confirmButtonText: 'Xóa', cancelButtonText: 'Hủy', type: 'warning' }
    ).then(() => {
      handleDelete(row)
    }).catch(() => {})
  }
}
</script>

<style scoped>
.salary-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

.salary-container :deep(.el-table td.el-table__cell .cell) {
  white-space: nowrap !important;
}

html.dark .salary-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}
html.dark .salary-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}
html.dark .salary-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}
html.dark .salary-container :deep(.el-table .el-table-fixed-column--left),
html.dark .salary-container :deep(.el-table .el-table-fixed-column--right) {
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
