<template>
  <div class="salary-export-container h-full flex flex-col">
    <!-- Filter Bar -->
    <div class="flex justify-between items-center mb-4 shrink-0">
      <div class="flex items-center gap-4 flex-wrap">
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian:</span>
          <el-date-picker :editable="false"
            v-model="filters.month"
            type="month"
            placeholder="Chọn tháng"
            format="MM/YYYY"
            value-format="YYYY-MM"
            clearable
            class="custom-dark-input highlight-select"
            style="width: 150px"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Khoảng thời gian:</span>
          <el-date-picker :editable="false"
            v-model="filters.dateRange"
            type="daterange"
            range-separator="đến"
            start-placeholder="Từ ngày"
            end-placeholder="Đến ngày"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            :shortcuts="dateShortcuts"
            unlink-panels
            clearable
            class="custom-dark-input highlight-select"
            style="width: 280px"
          />
        </div>
        <el-button type="primary" :icon="Search" @click="handleSearch">Tìm kiếm</el-button>
      </div>
      <div class="flex items-center gap-2">
        <el-button
          type="primary"
          :icon="Check"
          :disabled="selectedRows.length === 0"
          @click="saveSalary"
        >
          Xuất lương ({{ selectedRows.length }})
        </el-button>
        <el-button
          type="success"
          :icon="Download"
          :disabled="selectedRows.length === 0"
          @click="exportSelected"
        >
          Xuất Excel ({{ selectedRows.length }})
        </el-button>
        <el-button
          type="warning"
          :icon="Download"
          :disabled="filteredData.length === 0"
          @click="exportAll"
        >
          Xuất tất cả
        </el-button>
      </div>
    </div>

    <!-- Active period -->
    <div v-if="hasSearched" class="flex items-center gap-2 mb-3 shrink-0">
      <el-tag type="info" effect="plain" size="small">Kỳ lương: {{ activeFilters.periodLabel }}</el-tag>
      <el-tag v-if="activeFilters.isRange" type="warning" effect="plain" size="small">
        Kỳ lương tính bằng 1 tháng lương — công chuẩn là số ngày làm việc trong kỳ. Bảng lương ghi vào {{ payrollMonthLabel }}
      </el-tag>
    </div>

    <!-- Summary Cards -->
    <div v-if="hasSearched" class="grid grid-cols-4 gap-4 mb-4 shrink-0">
      <div class="summary-card bg-white dark:bg-gray-900 rounded-lg shadow p-4 border-l-4 border-indigo-500">
        <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Tổng nhân viên</div>
        <div class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{{ filteredData.length }}</div>
      </div>
      <div class="summary-card bg-white dark:bg-gray-900 rounded-lg shadow p-4 border-l-4 border-blue-500">
        <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Tổng lương cơ bản</div>
        <div class="text-lg font-bold text-blue-600 dark:text-blue-400">{{ formatCurrency(totalBaseSalary) }}</div>
      </div>
      <div class="summary-card bg-white dark:bg-gray-900 rounded-lg shadow p-4 border-l-4 border-amber-500">
        <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Tổng phụ cấp</div>
        <div class="text-lg font-bold text-amber-500">{{ formatCurrency(totalAllowance) }}</div>
      </div>
      <div class="summary-card bg-white dark:bg-gray-900 rounded-lg shadow p-4 border-l-4 border-emerald-500">
        <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Tổng chi lương</div>
        <div class="text-lg font-bold text-emerald-600 dark:text-emerald-400">{{ formatCurrency(totalNetSalary) }}</div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="paginatedData"
        :empty-text="tableEmptyText"
        style="width: 100%"
        class="flex-1"
        height="100%"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" />
        <!-- STT Column -->
        <el-table-column label="STT" width="52" align="center">
          <template #default="{ $index }">
            <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="employeeCode" label="Mã NV" width="86" sortable="custom" />
        <el-table-column prop="employeeName" label="Tên nhân viên" width="144" show-overflow-tooltip />
        <el-table-column prop="standardWorkdays" label="Công chuẩn" width="79" align="center">
          <template #default="scope">
            <span class="font-medium text-gray-500 dark:text-gray-400">{{ scope.row.standardWorkdays }} ngày</span>
          </template>
        </el-table-column>
        <el-table-column prop="workDays" label="Công thực tế" width="86" align="center">
          <template #default="scope">
            <span class="font-medium">{{ scope.row.workDays }} ngày</span>
          </template>
        </el-table-column>
        <el-table-column label="Lương cơ bản" width="108" align="right">
          <template #default="scope">
            <span class="font-medium" :class="mauSo(scope.row.baseSalary)">{{ formatCurrency(scope.row.baseSalary) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Lương theo ngày công" width="130" align="right">
          <template #default="scope">
            <span class="font-medium" :class="mauSo(scope.row.receivedSalary)">{{ formatCurrency(scope.row.receivedSalary) }}</span>
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
        <el-table-column label="Phụ cấp khác" width="101" align="right">
          <template #default="scope">
            <span :class="scope.row.allowance > 0 ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-400'">
              {{ formatCurrency(scope.row.allowance) }}
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
        <el-table-column label="Thưởng khác" width="101" align="right">
          <template #default="scope">
            <span :class="scope.row.bonus > 0 ? 'text-amber-500 font-bold' : 'text-gray-400'">
              {{ formatCurrency(scope.row.bonus) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="BHXH" width="101" align="right">
          <template #default="scope">
            <span class="text-orange-500 font-medium">-{{ formatCurrency(scope.row.socialInsurance) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Phạt" width="94" align="right">
          <template #default="scope">
            <span :class="scope.row.penalty > 0 ? 'text-red-500 font-semibold' : 'text-gray-400'">
              {{ scope.row.penalty > 0 ? '-' + formatCurrency(scope.row.penalty) : formatCurrency(0) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Thực nhận" width="122" align="right">
          <template #default="scope">
            <span class="text-emerald-600 dark:text-emerald-400 font-bold text-base">
              {{ formatCurrency(scope.row.netSalary) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="94" align="center">
          <template #default="scope">
            <el-tag
              :type="getStatusType(scope.row.status)"
              effect="dark"
              size="small"
              round
            >
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { mauSo } from '@/utils/mauSo'
import { Search, Download, Check } from '@element-plus/icons-vue'
import { ElNotification, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx-js-style'
import { employeeService } from '@/api/employeeService'

// Employee ID prefix this tab is scoped to
const PRE_ID = 'G'

type DateRange = [string, string] | null

// Filters — month and day-range are mutually exclusive; picking one clears the other
const filters = reactive({
  month: '2026-06' as string | null,
  dateRange: null as DateRange
})
const activeFilters = reactive({
  month: '2026-06' as string | null,
  dateRange: null as DateRange,
  isRange: false,
  periodLabel: 'Tháng 06/2026'
})

const dateShortcuts = [
  {
    text: 'Tháng này',
    value: () => {
      const now = new Date()
      return [new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 0)]
    }
  },
  {
    text: 'Tháng trước',
    value: () => {
      const now = new Date()
      return [new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 0)]
    }
  },
  {
    text: '30 ngày qua',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 29)
      return [start, end]
    }
  },
  {
    text: 'Quý này',
    value: () => {
      const now = new Date()
      const firstMonth = Math.floor(now.getMonth() / 3) * 3
      return [new Date(now.getFullYear(), firstMonth, 1), new Date(now.getFullYear(), firstMonth + 3, 0)]
    }
  }
]

const hasSearched = ref(false)
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const tableRef = ref()
const selectedRows = ref<any[]>([])

// Format currency
const formatCurrency = (value: number): string => {
  if (value === undefined || value === null) return '0 VNĐ'
  return new Intl.NumberFormat('vi-VN').format(value) + ' VNĐ'
}

// Format status label
const getStatusLabel = (status: string) => {
  if (!status) return 'Chưa xuất'
  switch (status.toLowerCase()) {
    case 'paid': return 'Đã thanh toán'
    case 'exported': return 'Đã xuất'
    case 'approved': return 'Đã duyệt'
    case 'draft': return 'Nháp'
    default: return status
  }
}

// Format status type for ElTag
const getStatusType = (status: string) => {
  if (!status) return 'info'
  switch (status.toLowerCase()) {
    case 'paid':
    case 'exported':
      return 'success'
    case 'approved':
      return 'warning'
    case 'draft':
      return 'info'
    default:
      return 'primary'
  }
}

const allData = ref<any[]>([])

// A valid range needs both ends
const isRangeSelected = () =>
  !!(filters.dateRange && filters.dateRange.length === 2 && filters.dateRange[0] && filters.dateRange[1])

// "2026-06-15" -> "15/06/2026"
const formatDay = (iso: string): string => {
  const parts = iso.split('-')
  return `${parts[2] || ''}/${parts[1] || ''}/${parts[0] || ''}`
}

const formatMonth = (month: string): string => {
  const parts = month.split('-')
  return `Tháng ${parts[1] || ''}/${parts[0] || ''}`
}

const buildPeriodLabel = (month: string | null, range: DateRange): string => {
  const hasRange = !!(range && range[0] && range[1])
  if (month && hasRange) return `${formatMonth(month)} (${formatDay(range![0])} - ${formatDay(range![1])})`
  if (hasRange) return `${formatDay(range![0])} - ${formatDay(range![1])}`
  if (month) return formatMonth(month)
  return ''
}

// Search
const handleSearch = async () => {
  const useRange = isRangeSelected()

  if (!useRange && !filters.month) {
    ElNotification({
      title: 'Thông báo',
      message: 'Vui lòng chọn tháng hoặc khoảng thời gian tìm kiếm.',
      type: 'warning'
    })
    return
  }

  loading.value = true
  hasSearched.value = true
  currentPage.value = 1
  selectedRows.value = []

  try {
    const useMonth = !!filters.month
    const parts = (filters.month || '').split('-')
    const year = parts[0] || ''
    const month = parts[1] || ''

    const rangeStart = useRange ? filters.dateRange![0] : null
    const rangeEnd = useRange ? filters.dateRange![1] : null

    // Payroll records stay keyed by year/month. The month picker decides which
    // month the period is filed under; without it the period falls under the
    // month it starts in. The API echoes this back as period_year/period_month.
    const startParts = (rangeStart || '').split('-')
    const keyYear = parseInt((useMonth ? year : startParts[0]) || '0')
    const keyMonth = parseInt((useMonth ? month : startParts[1]) || '0')

    const res = await employeeService.getSalaries(
      PRE_ID,
      useMonth ? `${month}/${year}` : undefined,
      rangeStart || undefined,
      rangeEnd || undefined
    )

    allData.value = res.map((item: any) => {
      const lunchAllowance = item.lunch_allowance || 0;
      const otherAllowance = item.other_allowance || 0;
      const productivityBonus = item.productivity_bonus || 0;
      const bonus = item.bonus || 0;
      const baseSalary = item.base_salary || 0;
      const receivedSalary = item.received_salary || 0;
      const overtimeSalary = item.overtime_salary || 0;
      const socialInsurance = item.bhxh || 0;
      const penalty = item.penalty || 0;
      
      const calculatedNetSalary = item.total_received || 0;

      return {
        id: `${item.employee_id}-${useRange ? `${rangeStart}_${rangeEnd}` : `${year}-${month}`}-${keyYear}${keyMonth}`,
        employeeCode: item.employee_id,
        employeeName: item.employee_name || item.employee_id,
        year: item.period_year || keyYear,
        month: item.period_month || keyMonth,
        startDate: rangeStart,
        endDate: rangeEnd,
        standardWorkdays: item.standard_workdays || 0,
        workDays: item.actual_workdays || 0,
        baseSalary,
        receivedSalary,
        overtimeSalary,
        lunchAllowance,
        allowance: otherAllowance,
        productivityBonus,
        bonus,
        socialInsurance,
        penalty,
        netSalary: calculatedNetSalary,
        status: item.status || '',
        exported: item.status === 'paid' || item.status === 'exported'
      };
    })

    activeFilters.month = filters.month
    activeFilters.dateRange = useRange ? [rangeStart!, rangeEnd!] : null
    activeFilters.isRange = useRange
    activeFilters.periodLabel = buildPeriodLabel(activeFilters.month, activeFilters.dateRange)
  } catch (error: any) {
    console.error('Failed to search salaries:', error)
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

// Filtered Data — the API already scopes the result to the requested period
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
    ? 'Không có dữ liệu lương phù hợp'
    : 'Vui lòng chọn tháng hoặc khoảng thời gian và nhấn nút "Tìm kiếm" để hiển thị dữ liệu'
})

// Summary totals
const totalBaseSalary = computed(() => filteredData.value.reduce((sum, e) => sum + e.baseSalary, 0))
const totalAllowance = computed(() => filteredData.value.reduce((sum, e) => sum + (e.lunchAllowance || 0) + (e.allowance || 0), 0))
const totalNetSalary = computed(() => filteredData.value.reduce((sum, e) => sum + e.netSalary, 0))

// Selection
const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows
}

// Month the payroll records are filed under — the month the period starts in
const payrollMonthLabel = computed(() => {
  const first = filteredData.value[0]
  if (!first) return ''
  return `tháng ${String(first.month).padStart(2, '0')}/${first.year}`
})

// Period naming shared by the sheet title, file name and sheet tab
const periodTitle = computed(() => {
  const range = activeFilters.dateRange
  const rangeText = range && range[0] && range[1]
    ? `${formatDay(range[0])} - ${formatDay(range[1])}`
    : ''
  if (activeFilters.month && rangeText) {
    return `BẢNG LƯƠNG ${formatMonth(activeFilters.month).toUpperCase()} (KỲ ${rangeText})`
  }
  if (rangeText) return `BẢNG LƯƠNG KỲ ${rangeText}`
  return `BẢNG LƯƠNG ${activeFilters.periodLabel.toUpperCase()}`
})

// "06_2026" when a month is chosen, otherwise "05072026_04082026"
const periodSlug = computed(() => {
  if (activeFilters.month) {
    const parts = activeFilters.month.split('-')
    return `${parts[1] || '00'}_${parts[0] || '0000'}`
  }
  if (activeFilters.dateRange) {
    const [from, to] = activeFilters.dateRange
    return `${(from || '').replace(/-/g, '')}_${(to || '').replace(/-/g, '')}`
  }
  return 'ky_luong'
})

// Excel Export with styling
const generateExcel = (data: any[], fileName: string) => {

  // Style definitions
  const companyStyle = {
    font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1F4E79' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  }
  const titleStyle = {
    font: { bold: true, sz: 13, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '2E75B6' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  }
  const headerStyle = {
    font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '2F5496' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: '1F4E79' } },
      bottom: { style: 'thin', color: { rgb: '1F4E79' } },
      left: { style: 'thin', color: { rgb: '1F4E79' } },
      right: { style: 'thin', color: { rgb: '1F4E79' } }
    }
  }
  const cellBorder = {
    top: { style: 'thin', color: { rgb: 'D6DCE4' } },
    bottom: { style: 'thin', color: { rgb: 'D6DCE4' } },
    left: { style: 'thin', color: { rgb: 'D6DCE4' } },
    right: { style: 'thin', color: { rgb: 'D6DCE4' } }
  }
  const dataStyleEven = {
    fill: { fgColor: { rgb: 'F2F7FB' } },
    border: cellBorder,
    alignment: { vertical: 'center' }
  }
  const dataStyleOdd = {
    fill: { fgColor: { rgb: 'FFFFFF' } },
    border: cellBorder,
    alignment: { vertical: 'center' }
  }
  const numberFormat = '#,##0'
  const totalStyle = {
    font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1B7A43' } },
    border: {
      top: { style: 'medium', color: { rgb: '145A32' } },
      bottom: { style: 'medium', color: { rgb: '145A32' } },
      left: { style: 'thin', color: { rgb: '145A32' } },
      right: { style: 'thin', color: { rgb: '145A32' } }
    },
    alignment: { vertical: 'center' }
  }

  // Build sheet data
  const headerRows = [
    ['CÔNG TY TNHH HDG GROUP'],
    [periodTitle.value],
    [],
    ['STT', 'Mã NV', 'Tên nhân viên', 'Công chuẩn', 'Công thực tế', 'Lương cơ bản', 'Lương theo ngày công', 'Lương tăng ca', 'Phụ cấp ăn trưa', 'Phụ cấp khác', 'Thưởng năng suất', 'Thưởng khác', 'BHXH', 'Phạt', 'Thực nhận']
  ]

  const dataRows = data.map((row, index) => [
    index + 1, row.employeeCode, row.employeeName, row.standardWorkdays, row.workDays,
    row.baseSalary, row.receivedSalary, row.overtimeSalary, row.lunchAllowance, row.allowance,
    row.productivityBonus, row.bonus, row.socialInsurance, row.penalty, row.netSalary
  ])

  const totalRow = [
    '', '', 'TỔNG CỘNG', '', '',
    data.reduce((s, r) => s + r.baseSalary, 0),
    data.reduce((s, r) => s + r.receivedSalary, 0),
    data.reduce((s, r) => s + r.overtimeSalary, 0),
    data.reduce((s, r) => s + r.lunchAllowance, 0),
    data.reduce((s, r) => s + r.allowance, 0),
    data.reduce((s, r) => s + r.productivityBonus, 0),
    data.reduce((s, r) => s + r.bonus, 0),
    data.reduce((s, r) => s + r.socialInsurance, 0),
    data.reduce((s, r) => s + r.penalty, 0),
    data.reduce((s, r) => s + r.netSalary, 0)
  ]

  const wsData = [...headerRows, ...dataRows, totalRow]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Column widths
  ws['!cols'] = [
    { wch: 5 }, { wch: 10 }, { wch: 22 }, { wch: 12 }, { wch: 12 },
    { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 15 }, { wch: 15 },
    { wch: 17 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }
  ]

  // Row heights
  ws['!rows'] = [
    { hpt: 30 }, // Company
    { hpt: 25 }, // Title
    { hpt: 15 }, // Empty
    { hpt: 28 }, // Header
  ]

  // Merge header cells
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 14 } }
  ]

  // Apply styles - Company name row
  for (let c = 0; c <= 14; c++) {
    const ref = XLSX.utils.encode_cell({ r: 0, c })
    if (!ws[ref]) ws[ref] = { v: '', t: 's' }
    ws[ref].s = companyStyle
  }

  // Title row
  for (let c = 0; c <= 14; c++) {
    const ref = XLSX.utils.encode_cell({ r: 1, c })
    if (!ws[ref]) ws[ref] = { v: '', t: 's' }
    ws[ref].s = titleStyle
  }

  // Header row (row index 3)
  for (let c = 0; c <= 14; c++) {
    const ref = XLSX.utils.encode_cell({ r: 3, c })
    if (ws[ref]) ws[ref].s = headerStyle
  }

  // Data rows
  const numberCols = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
  for (let i = 0; i < dataRows.length; i++) {
    const rowIdx = 4 + i
    const baseStyle = i % 2 === 0 ? dataStyleEven : dataStyleOdd
    for (let c = 0; c <= 14; c++) {
      const ref = XLSX.utils.encode_cell({ r: rowIdx, c })
      if (!ws[ref]) ws[ref] = { v: '', t: 's' }
      if (numberCols.includes(c)) {
        ws[ref].s = { ...baseStyle, alignment: { ...baseStyle.alignment, horizontal: 'right' }, numFmt: numberFormat }
        ws[ref].z = numberFormat
      } else if (c === 0 || c === 3 || c === 4) {
        ws[ref].s = { ...baseStyle, alignment: { ...baseStyle.alignment, horizontal: 'center' } }
      } else {
        ws[ref].s = baseStyle
      }
    }
  }

  // Total row
  const totalRowIdx = 4 + dataRows.length
  for (let c = 0; c <= 14; c++) {
    const ref = XLSX.utils.encode_cell({ r: totalRowIdx, c })
    if (!ws[ref]) ws[ref] = { v: '', t: 's' }
    if (numberCols.includes(c)) {
      ws[ref].s = { ...totalStyle, alignment: { ...totalStyle.alignment, horizontal: 'right' }, numFmt: numberFormat }
      ws[ref].z = numberFormat
    } else {
      ws[ref].s = totalStyle
    }
  }

  const wb = XLSX.utils.book_new()
  // Excel caps sheet names at 31 characters
  XLSX.utils.book_append_sheet(wb, ws, `Lương ${periodSlug.value}`.slice(0, 31))
  XLSX.writeFile(wb, fileName)
}

const exportSelected = () => {
  if (selectedRows.value.length === 0) return
  const fileName = `Bang_luong_${periodSlug.value}_${selectedRows.value.length}NV.xlsx`
  generateExcel(selectedRows.value, fileName)
  ElNotification({
    title: 'Xuất Excel thành công',
    message: `Đã xuất bảng lương ${selectedRows.value.length} nhân viên — ${fileName}`,
    type: 'success'
  })
}

const exportAll = () => {
  if (filteredData.value.length === 0) return
  const fileName = `Bang_luong_${periodSlug.value}.xlsx`
  generateExcel(filteredData.value, fileName)
  ElNotification({
    title: 'Xuất Excel thành công',
    message: `Đã xuất bảng lương tất cả ${filteredData.value.length} nhân viên — ${fileName}`,
    type: 'success'
  })
}

// Save to DB
const saveSalary = () => {
  if (selectedRows.value.length === 0) return
  const names = selectedRows.value.map(r => r.employeeName).join(', ')
  const count = selectedRows.value.length

  ElMessageBox.confirm(
    `Xác nhận xuất lương kỳ ${activeFilters.periodLabel} cho ${count} nhân viên?\n${names}`,
    'Xác nhận xuất lương',
    {
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy',
      type: 'warning'
    }
  ).then(async () => {
    loading.value = true
    try {
      const payload = selectedRows.value.map(row => ({
        employee_id: row.employeeCode,
        year: row.year,
        month: row.month,
        unapproved_leave: Math.max(0, row.standardWorkdays - row.workDays),
        base_salary_amount: row.receivedSalary,
        overtime_salary_amount: row.overtimeSalary,
        total_salary: row.netSalary,
        // Only sent for a day range — the backend records it as the pay period
        ...(row.startDate && row.endDate
          ? { start_date: row.startDate, end_date: row.endDate }
          : {})
      }))

      await employeeService.addPayrolls(payload)

      // Mark as exported in allData
      selectedRows.value.forEach(row => {
        const item = allData.value.find(d => d.id === row.id)
        if (item) {
          item.status = 'exported'
          item.exported = true
        }
      })
      selectedRows.value = []
      ElNotification({
        title: 'Xuất lương thành công',
        message: `Đã lưu xuất lương cho ${count} nhân viên vào hệ thống!`,
        type: 'success'
      })
    } catch (error: any) {
      console.error('Failed to export salaries:', error)
      ElNotification({
        title: 'Lỗi',
        message: error.message || 'Không thể xuất lương vào hệ thống.',
        type: 'error'
      })
    } finally {
      loading.value = false
    }
  }).catch(() => {})
}
</script>

<style scoped>
.salary-export-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

.salary-export-container :deep(.el-table td.el-table__cell .cell) {
  white-space: nowrap !important;
}

html.dark .salary-export-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}
html.dark .salary-export-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}
html.dark .salary-export-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}
html.dark .salary-export-container :deep(.el-table .el-table-fixed-column--left),
html.dark .salary-export-container :deep(.el-table .el-table-fixed-column--right) {
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

/* Range picker uses .el-range-editor instead of .el-input__wrapper */
html.dark .highlight-select.el-range-editor {
  background-color: #111827 !important;
  box-shadow: 0 0 0 1px #4b5563 inset !important;
}
html.dark .highlight-select.el-range-editor .el-range-input {
  background-color: #111827 !important;
  color: #f3f4f6 !important;
}
html.dark .highlight-select.el-range-editor .el-range-input::placeholder {
  color: #6b7280 !important;
}
html.dark .highlight-select.el-range-editor .el-range-separator,
html.dark .highlight-select.el-range-editor .el-input__icon {
  color: #9ca3af !important;
}
</style>
