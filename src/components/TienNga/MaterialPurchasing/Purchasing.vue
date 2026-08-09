<template>
  <div class="mat-purchasing-container h-full flex flex-col">
    <!-- Filter bar -->
    <div class="flex flex-wrap justify-between items-center gap-x-4 gap-y-4 mb-4 shrink-0">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-4">
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Nguyên liệu:</span>
          <el-select 
            v-model="selectedMaterial" 
            placeholder="Chọn nguyên liệu" 
            style="width: 160px"
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Tất cả" value="all" />
            <el-option label="Acid" value="Acid" />
            <el-option label="Amoniac" value="Amoniac" />
            <el-option label="Củi" value="Củi" />
            <el-option label="Dầu ăn" value="Dầu ăn" />
            <el-option label="Túi PE" value="Túi PE" />
          </el-select>
        </div>

        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Kho:</span>
          <el-select 
            v-model="selectedWarehouse" 
            placeholder="Chọn kho" 
            style="width: 200px"
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Tất cả" value="all" />
            <el-option 
              v-for="name in warehouses" 
              :key="name" 
              :label="name" 
              :value="name" 
            />
          </el-select>
        </div>

        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian:</span>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="~"
            start-placeholder="Từ ngày"
            end-placeholder="Đến ngày"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            class="custom-dark-input highlight-select"
            popper-class="custom-dark-select-popper"
            style="width: 280px"
          />
        </div>
      </div>
      <el-button type="primary" :icon="Search" @click="handleSearch">Tìm kiếm</el-button>
    </div>

    <!-- Summary Statistics Cards -->
    <div class="summary-cards mb-4 shrink-0">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="stat-card stat-card--cyan">
          <div class="stat-card__label">Tổng Khối lượng</div>
          <div class="stat-card__value text-cyan-600 dark:text-cyan-400">{{ formatNumber(stats.totalWeight) }} kg</div>
        </div>
        <div class="stat-card stat-card--green">
          <div class="stat-card__label">Tổng Thành tiền</div>
          <div class="stat-card__value text-green-600 dark:text-green-400">{{ formatCurrency(stats.totalAmount) }} VNĐ</div>
        </div>
        <div class="stat-card stat-card--blue">
          <div class="stat-card__label">Tổng Công nợ</div>
          <div class="stat-card__value text-blue-600 dark:text-blue-400">{{ formatCurrency(stats.totalDebt) }} VNĐ</div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
      <el-table :data="tableData" style="width: 100%" class="flex-1" height="100%" v-loading="loading" @sort-change="handleSortChange">
        <!-- Fixed Columns -->
        <el-table-column type="selection" width="55" fixed />
        <el-table-column label="STT" width="60" align="center" fixed>
          <template #default="{ $index }">
            <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="date" label="Ngày giao dịch" width="170" sortable="custom" fixed />

        <el-table-column prop="customerName" label="Tên khách hàng" min-width="300" sortable="custom" show-overflow-tooltip>
          <template #default="scope">
            <span class="whitespace-nowrap font-semibold text-gray-800 dark:text-gray-200">{{ scope.row.customerName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="material" label="Nguyên liệu" width="140">
          <template #default="scope">
            <el-tag :type="getMaterialTagType(scope.row.material)" effect="light" round>
              {{ scope.row.material }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="warehouse" label="Kho hàng" min-width="180" />
        <el-table-column prop="trips" label="Số chuyến" width="110" align="right">
          <template #default="scope">
            <span class="font-medium">{{ scope.row.trips }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="Khối lượng" width="130" align="right">
          <template #default="scope">
            <span>{{ formatNumber(scope.row.weight) }} kg</span>
          </template>
        </el-table-column>
        <el-table-column prop="unitPrice" label="Đơn giá" width="130" align="right">
          <template #default="scope">
            <span>{{ formatCurrency(scope.row.unitPrice) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="Thành tiền" width="150" align="right">
          <template #default="scope">
            <span class="font-bold text-green-500">{{ formatCurrency(scope.row.totalAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="advanceAmount" label="Ứng tiền" width="150" align="right">
          <template #default="scope">
            <span class="font-medium text-orange-500">{{ formatCurrency(scope.row.advanceAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="debt" label="Công nợ" width="150" align="right">
          <template #default="scope">
            <span class="font-bold">{{ formatCurrency(scope.row.debt) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- Phân trang -->
      <div class="mt-auto shrink-0 p-4 flex flex-wrap justify-end gap-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
        />
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { tienNgaService } from '@/api/tienNgaService'

const selectedMaterial = ref('all')
const selectedWarehouse = ref('all')
const dateRange = ref<[string, string] | null>(null)
const hasSearched = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const warehouses = ref<string[]>([])

const fetchInventories = async () => {
  try {
    const data = await tienNgaService.getInventories()
    const names = data.map(item => item.storage_name).filter((val, idx, self) => val && self.indexOf(val) === idx)
    warehouses.value = names
  } catch (error: any) {
    console.error('Failed to fetch inventories:', error)
  }
}

const fetchMaterialPurchases = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (selectedMaterial.value !== 'all') {
      params.material_type = selectedMaterial.value
    }
    if (selectedWarehouse.value !== 'all') {
      params.storage_name = selectedWarehouse.value
    }

    const data = await tienNgaService.getMaterialPurchases(params)
    allData.value = data.map(item => ({
      id: item.id || Math.random().toString(36).substring(2, 9),
      date: item.transaction_date || '',
      customerName: item.fullname || 'Chưa rõ',
      material: item.material_type || 'Không rõ',
      warehouse: item.storage_name || 'Không rõ',
      trips: item.trip_count || 0,
      weight: item.weight || 0,
      unitPrice: item.unit_price || 0,
      totalAmount: item.total_amount || 0,
      advanceAmount: item.advance_payment || 0,
      debt: item.debt || 0,
      notes: item.notes || ''
    }))
  } catch (error: any) {
    ElMessage.error(error.message || 'Không thể tải danh sách thu mua nguyên liệu')
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  hasSearched.value = true
  currentPage.value = 1
  await fetchMaterialPurchases()
}

onMounted(() => {
  fetchInventories()
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value)
}

const formatNumber = (value: number, decimals: number = 0) => {
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

const getMaterialTagType = (material: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined => {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined> = {
    'Acid': undefined,
    'Amoniac': 'success',
    'Dầu ăn': 'warning',
    'Củi': 'info',
    'Túi PE': 'primary',
  }
  return map[material] ?? undefined
}

const generateMockData = () => {
  const data = []
  const names = ['Nguyễn Văn An', 'Trần Thị Bình', 'Lê Hữu Cường', 'Phạm Minh Dũng', 'Hoàng Đức Em',
    'Huỳnh Ngọc Phong', 'Phan Quang Giang', 'Vũ Hải Hải', 'Võ Thanh Linh', 'Đặng Tuấn Khánh']
  const materials = ['Acid', 'Amoniac', 'Củi', 'Dầu ăn']
  const warehouses = ['Kho Củi Tiến Nga', 'Kho Acid Tiến Nga', 'Kho Amoniac Tiến Nga', 'Kho Dầu ăn Tiến Nga']

  for (let i = 1; i <= 25; i++) {
    const weight = Math.floor(Math.random() * 5000) + 500
    const unitPrice = [3500, 12000, 1500, 25000][i % 4] ?? 3500
    const totalAmount = weight * unitPrice
    const advanceAmount = Math.random() > 0.4 ? Math.floor(totalAmount * 0.5) : 0
    const debt = totalAmount - advanceAmount

    data.push({
      id: i,
      date: `2026-05-${String(i % 28 + 1).padStart(2, '0')}`,
      customerName: names[i % 10],
      material: materials[i % 4],
      warehouse: warehouses[i % 4],
      trips: Math.floor(Math.random() * 5) + 1,
      weight,
      unitPrice,
      totalAmount,
      advanceAmount,
      debt
    })
  }
  return data
}

const allData = ref<any[]>([])

const filteredData = computed(() => {
  return allData.value.filter(item => {
    // Filter by material
    if (selectedMaterial.value !== 'all' && item.material !== selectedMaterial.value) {
      return false
    }
    // Filter by warehouse
    if (selectedWarehouse.value !== 'all' && item.warehouse !== selectedWarehouse.value) {
      return false
    }
    // Filter by date range
    if (dateRange.value && dateRange.value.length === 2) {
      const [start, end] = dateRange.value
      if (item.date < start || item.date > end) {
        return false
      }
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

  return list.sort((a, b) => {
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

const total = computed(() => filteredData.value.length)

const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedData.value.slice(start, end)
})

const stats = computed(() => {
  const data = filteredData.value
  return {
    totalWeight: data.reduce((sum, r) => sum + r.weight, 0),
    totalAmount: data.reduce((sum, r) => sum + r.totalAmount, 0),
    totalDebt: data.reduce((sum, r) => sum + r.debt, 0),
  }
})
</script>

<style scoped>
.mat-purchasing-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

/* Cho phân trang tự xuống dòng khi có nhiều trang */
.mat-purchasing-container :deep(.el-pagination) {
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

/* Summary stat cards */
.stat-card {
  padding: 16px 20px;
  border-radius: 10px;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-card__label {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 6px;
}

.stat-card__value {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.stat-card--cyan { border-left: 4px solid #06b6d4; }
.stat-card--green { border-left: 4px solid #22c55e; }
.stat-card--blue { border-left: 4px solid #3b82f6; }

/* Dark Mode: Table */
html.dark .mat-purchasing-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .mat-purchasing-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .mat-purchasing-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

html.dark .mat-purchasing-container :deep(.el-table .el-table-fixed-column--left),
html.dark .mat-purchasing-container :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important;
}

/* Dark Mode: Stat cards */
html.dark .stat-card {
  background-color: #1f2937;
  border-color: #374151;
}

html.dark .stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

html.dark .stat-card__label {
  color: #9ca3af;
}

/* Dark Mode: Select & Input */
html.dark .custom-dark-select :deep(.el-input__wrapper),
html.dark .custom-dark-input :deep(.el-input__wrapper) {
  background-color: #1f2937;
  box-shadow: 0 0 0 1px #374151 inset;
}

html.dark .custom-dark-select :deep(.el-input__inner),
html.dark .custom-dark-input :deep(.el-input__inner) {
  color: #f3f4f6;
}
</style>

<style>
/* Select dropdown popper dark mode */
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

/* Highlight selects dark mode */
html.dark .highlight-select .el-input__wrapper,
html.dark .highlight-select .el-select__wrapper {
  background-color: #111827 !important;
  border-color: #111827 !important;
}

/* Date picker range dark mode */
html.dark .highlight-select.el-date-editor.el-range-editor {
  background-color: #111827 !important;
  box-shadow: 0 0 0 1px #111827 inset !important;
}

html.dark .highlight-select.el-date-editor .el-range-input {
  background-color: transparent !important;
  color: #f3f4f6 !important;
}

html.dark .highlight-select.el-date-editor .el-range-separator {
  color: #9ca3af !important;
}

html.dark .highlight-select.el-date-editor .el-range-input::placeholder {
  color: #6b7280 !important;
}

/* Dialog dark mode */
.custom-dark-dialog .el-form-item__label {
  white-space: nowrap;
  color: #2563eb;
  font-weight: 500;
}

.custom-dark-dialog .el-dialog__title {
  color: #2563eb;
  font-weight: bold;
}

.custom-dark-dialog .el-dialog__header {
  text-align: center;
}

html.dark .custom-dark-dialog {
  background-color: #1f2937;
}

html.dark .custom-dark-dialog .el-dialog__title {
  color: #3b82f6;
}

html.dark .custom-dark-dialog .el-form-item__label {
  color: #60a5fa;
}

html.dark .custom-dark-dialog .el-input__wrapper,
html.dark .custom-dark-dialog .el-select__wrapper {
  background-color: #374151;
  box-shadow: 0 0 0 1px #4b5563 inset;
}

html.dark .custom-dark-dialog .el-input__inner {
  color: #f3f4f6;
}
</style>
