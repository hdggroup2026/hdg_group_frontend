<template>
  <div class="lookup-container h-full flex flex-col">
    <!-- Filter bar -->
    <div class="flex flex-wrap justify-between items-center gap-x-4 gap-y-4 mb-4 shrink-0">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-4">
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Mục:</span>
          <el-select 
            v-model="selectedCategory" 
            placeholder="Chọn mục" 
            style="width: 160px"
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Đối tác" value="partner" />
            <el-option label="Giao dịch" value="transaction" />
          </el-select>
        </div>

        <!-- Extra filters for Giao dịch -->
        <template v-if="selectedCategory === 'transaction'">
          <div class="flex items-center gap-2">
            <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Loại sản phẩm:</span>
            <el-select 
              v-model="selectedProduct" 
              placeholder="Chọn loại" 
              style="width: 170px"
              class="custom-dark-select highlight-select"
              popper-class="custom-dark-select-popper"
            >
              <el-option label="Tất cả" value="all" />
              <el-option label="Mủ nước" value="Mủ nước" />
              <el-option label="Mủ thành phẩm" value="Mủ thành phẩm" />
            </el-select>
          </div>

          <div class="flex items-center gap-2">
            <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Loại giao dịch:</span>
            <el-select 
              v-model="selectedType" 
              placeholder="Chọn loại" 
              style="width: 140px"
              class="custom-dark-select highlight-select"
              popper-class="custom-dark-select-popper"
            >
              <el-option label="Tất cả" value="all" />
              <el-option label="Xuất" value="Xuất" />
              <el-option label="Nhập" value="Nhập" />
            </el-select>
          </div>

          <div class="flex items-center gap-2">
            <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian:</span>
            <el-date-picker :editable="false"
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
        </template>
      </div>
      <el-button type="primary" :icon="Search" @click="handleSearch">Tìm kiếm</el-button>
    </div>

    <!-- Summary Statistics Cards -->
    <div v-if="hasSearched" class="summary-cards mb-4 shrink-0">
      <!-- Đối tác stats -->
      <div v-if="selectedCategory === 'partner'" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="stat-card stat-card--blue">
          <div class="stat-card__label">Tổng Công nợ</div>
          <div class="stat-card__value text-blue-600 dark:text-blue-400">{{ formatCurrency(partnerStats.totalDebt) }} VNĐ</div>
        </div>
      </div>

      <!-- Giao dịch stats -->
      <div v-if="selectedCategory === 'transaction'" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div class="stat-card stat-card--cyan">
          <div class="stat-card__label">Tổng Khối lượng</div>
          <div class="stat-card__value text-cyan-600 dark:text-cyan-400">{{ formatNumber(transactionStats.totalQty) }}</div>
        </div>
        <div class="stat-card stat-card--green">
          <div class="stat-card__label">Tổng Thành tiền</div>
          <div class="stat-card__value text-green-600 dark:text-green-400">{{ formatCurrency(transactionStats.totalAmount) }} VNĐ</div>
        </div>
        <div class="stat-card stat-card--blue">
          <div class="stat-card__label">Tổng KL Thực tế</div>
          <div class="stat-card__value text-blue-600 dark:text-blue-400">{{ formatNumber(transactionStats.totalActualWeight) }} kg</div>
        </div>
        <div class="stat-card stat-card--indigo">
          <div class="stat-card__label">Tổng KL Mủ khô</div>
          <div class="stat-card__value text-indigo-600 dark:text-indigo-400">{{ formatNumber(transactionStats.totalDryRubber, 2) }} kg</div>
        </div>
      </div>
    </div>

    <!-- Table Results -->
    <div v-if="hasSearched" class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
      <!-- Đối tác table -->
      <template v-if="selectedCategory === 'partner'">
        <el-table :data="partnerTableData" style="width: 100%" class="flex-1" height="100%" v-loading="loading" @sort-change="handlePartnerSortChange">
          <el-table-column type="selection" width="55" fixed />
          <el-table-column label="STT" width="60" align="center" fixed>
            <template #default="{ $index }">
              <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="code" label="Mã Đối tác" width="130" sortable="custom" fixed />
          <el-table-column prop="name" label="Tên Đối tác" min-width="380" show-overflow-tooltip>
            <template #default="scope">
              <span class="whitespace-nowrap font-semibold text-gray-800 dark:text-gray-200">{{ scope.row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="debt" label="Công nợ" width="160" align="right">
            <template #default="scope">
              <span class="font-bold">{{ formatCurrency(scope.row.debt) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="username" label="Username" width="150">
            <template #default="scope">
              <span class="text-blue-500">{{ scope.row.username }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="telegramGroup" label="Nhóm Telegram" min-width="230" />
          <el-table-column prop="bankName" label="Ngân hàng" min-width="220" show-overflow-tooltip />
          <el-table-column prop="bankAccount" label="Số tài khoản" width="160" />
          <el-table-column prop="status" label="Trạng thái" width="140" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.status === 'Hoạt động' ? 'success' : 'danger'" effect="light" round>
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <!-- Giao dịch table -->
      <template v-if="selectedCategory === 'transaction'">
        <el-table :data="transactionTableData" style="width: 100%" class="flex-1" height="100%" v-loading="loading" @sort-change="handleTransactionSortChange">
          <el-table-column type="selection" width="55" fixed />
          <el-table-column label="STT" width="60" align="center" fixed>
            <template #default="{ $index }">
              <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="date" label="Ngày giao dịch" width="170" sortable="custom" fixed />
          <el-table-column prop="partnerCode" label="Mã Đối tác" width="130" sortable="custom" />
          <el-table-column prop="partnerName" label="Tên Đối tác" min-width="380" show-overflow-tooltip>
            <template #default="scope">
              <span class="whitespace-nowrap font-semibold text-gray-800 dark:text-gray-200">{{ scope.row.partnerName }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="importQty" label="SL Nhập" width="110" align="right">
            <template #default="scope">
              <span :class="scope.row.importQty > 0 ? 'font-medium text-blue-500' : 'text-gray-400'">
                {{ scope.row.importQty > 0 ? formatNumber(scope.row.importQty) : '-' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="exportQty" label="SL Xuất" width="110" align="right">
            <template #default="scope">
              <span :class="scope.row.exportQty > 0 ? 'font-medium text-orange-500' : 'text-gray-400'">
                {{ scope.row.exportQty > 0 ? formatNumber(scope.row.exportQty) : '-' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="productCode" label="Mã hàng" width="120" />
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
          <el-table-column prop="productType" label="Loại hàng" width="140">
            <template #default="scope">
              <el-tag :type="scope.row.productType === 'Mủ nước' ? 'info' : 'success'" effect="light" round>
                {{ scope.row.productType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="actualWeight" label="KL thực tế" width="130" align="right">
            <template #default="scope">
              <span class="font-medium text-blue-500">{{ formatNumber(scope.row.actualWeight) }} kg</span>
            </template>
          </el-table-column>
          <el-table-column prop="dryRubber" label="KL mủ khô" width="130" align="right">
            <template #default="scope">
              <span class="font-medium">{{ formatNumber(scope.row.dryRubber, 2) }} kg</span>
            </template>
          </el-table-column>
          <el-table-column prop="drc" label="Số độ" width="100" align="right">
            <template #default="scope">
              <span>{{ scope.row.drc }}</span>
            </template>
          </el-table-column>
        </el-table>
      </template>

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

    <!-- Empty state before search -->
    <div v-if="!hasSearched" class="flex-1 flex items-center justify-center">
      <div class="text-center text-gray-400 dark:text-gray-500">
        <el-icon class="text-6xl mb-4"><Search /></el-icon>
        <p class="text-lg">Vui lòng chọn các tiêu chí và nhấn <strong>Tìm kiếm</strong> để truy xuất thông tin</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { dinhDangSo } from '@/utils/dinhDangSo'
import { ref, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { tienNgaService } from '@/api/tienNgaService'

const selectedCategory = ref('partner')
const selectedProduct = ref('all')
const selectedType = ref('all')
const dateRange = ref<[string, string] | null>(null)
const hasSearched = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)

const handleSearch = async () => {
  if (selectedCategory.value === 'partner') {
    loading.value = true
    try {
      const data = await tienNgaService.getPartners()
      allPartnerData.value = data.map(item => ({
        id: item.id || Math.random().toString(36).substring(2, 9),
        code: item.partner_id || '',
        name: item.partner_name || 'Chưa rõ',
        debt: item.total_debt || 0,
        username: item.username || 'Chưa có',
        telegramGroup: item.telegram_group || 'Chưa có',
        bankName: item.bank_name || 'Chưa có',
        bankAccount: item.bank_account || 'Chưa có',
        status: item.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động'
      }))
      hasSearched.value = true
      currentPage.value = 1
    } catch (error: any) {
      ElMessage.error(error.message || 'Không thể tải danh sách đối tác')
    } finally {
      loading.value = false
    }
  } else {
    loading.value = true
    try {
      const params: any = {}
      if (selectedProduct.value !== 'all') {
        params.product_type = selectedProduct.value
      }
      if (selectedType.value === 'Nhập') {
        params.transaction_type = 'import'
      } else if (selectedType.value === 'Xuất') {
        params.transaction_type = 'export'
      }
      if (dateRange.value && dateRange.value.length === 2) {
        params.start_date = dateRange.value[0]
        params.end_date = dateRange.value[1]
      }

      const data = await tienNgaService.getPartnerBusinesses(params)
      allTransactionData.value = data.map(item => ({
        id: item.id || Math.random().toString(36).substring(2, 9),
        date: item.day || '',
        partnerCode: item.partner_id || '',
        partnerName: item.partner_name || 'Chưa rõ',
        importQty: item.import_amount || 0,
        exportQty: item.export_amount || 0,
        productCode: item.order_code || '',
        unitPrice: item.unit_price || 0,
        totalAmount: item.total_amount || 0,
        productType: item.product_type || 'Mủ nước',
        actualWeight: item.actual_weight || 0,
        dryRubber: item.dry_rubber || 0,
        drc: item.degree || 0,
        notes: item.notes || ''
      }))
      hasSearched.value = true
      currentPage.value = 1
    } catch (error: any) {
      ElMessage.error(error.message || 'Không thể tải danh sách giao dịch đối tác')
    } finally {
      loading.value = false
    }
  }
}

const formatCurrency = (value: number) => {
  return dinhDangSo(value)
}

const formatNumber = (value: any, _decimals?: number) => {
  // MỤC 355 — bỏ phần lẻ khi hiển thị, CẮT chứ không làm tròn.
  // Tham số `_decimals` giữ lại để 105 chỗ gọi cũ không phải sửa; nay
  // không dùng tới vì mọi số đều hiện phần nguyên.
  return dinhDangSo(value)
}

// --- Mock Data: Đối tác ---
const generatePartnerData = () => {
  const data = []
  const companyNames = [
    'Công ty TNHH Hòa Phát', 'Công ty CP Đại Việt', 'DNTN Minh Tâm', 'Công ty TNHH Thành Đạt',
    'Công ty CP Phú Thịnh', 'DNTN Quang Huy', 'Công ty TNHH An Khang', 'Công ty CP Việt Tiến',
    'DNTN Thanh Bình', 'Công ty TNHH Hoàng Long', 'Công ty CP Nam Á', 'DNTN Phước Lộc'
  ]
  const banks = ['Techcombank', 'Vietcombank', 'VietinBank', 'MB Bank', 'ACB', 'BIDV', 'Agribank']

  for (let i = 1; i <= 12; i++) {
    data.push({
      id: i,
      code: `DT${String(i).padStart(3, '0')}`,
      name: companyNames[(i - 1) % companyNames.length],
      debt: Math.floor(Math.random() * 100) * 1000000,
      username: `@doitac${i}`,
      telegramGroup: `Nhóm ĐT ${companyNames[(i - 1) % companyNames.length]?.split(' ').pop() ?? ''}`,
      bankName: banks[i % 7],
      bankAccount: `1903${Math.floor(Math.random() * 900000000 + 100000000)}`,
      status: i % 6 === 0 ? 'Ngừng hoạt động' : 'Hoạt động'
    })
  }
  return data
}

// --- Mock Data: Giao dịch ---
const generateTransactionData = () => {
  const data = []
  const partners = [
    { code: 'DT001', name: 'Công ty TNHH Hòa Phát' },
    { code: 'DT002', name: 'Công ty CP Đại Việt' },
    { code: 'DT003', name: 'DNTN Minh Tâm' },
    { code: 'DT004', name: 'Công ty TNHH Thành Đạt' },
    { code: 'DT005', name: 'Công ty CP Phú Thịnh' },
  ]
  const productTypes = ['Mủ nước', 'Mủ thành phẩm']
  const productCodes = ['MN-001', 'MN-002', 'MTP-001', 'MTP-002']

  for (let i = 1; i <= 20; i++) {
    const partner = partners[i % partners.length]
    const isImport = i % 3 !== 0
    const qty = Math.floor(Math.random() * 50) + 5
    const actualWeight = Math.floor(Math.random() * 3000) + 500
    const drc = Math.floor(Math.random() * 15) + 25
    const dryRubber = actualWeight * drc / 100
    const unitPrice = [28000, 30000, 32000, 35000][i % 4] ?? 28000
    const totalAmount = dryRubber * unitPrice

    data.push({
      id: i,
      date: `2026-05-${String(i % 28 + 1).padStart(2, '0')}`,
      partnerCode: partner!.code,
      partnerName: partner!.name,
      importQty: isImport ? qty : 0,
      exportQty: isImport ? 0 : qty,
      productCode: productCodes[i % productCodes.length],
      unitPrice,
      totalAmount,
      productType: productTypes[i % 2],
      actualWeight,
      dryRubber,
      drc
    })
  }
  return data
}

const allPartnerData = ref<any[]>([])
const allTransactionData = ref<any[]>([])

// --- Stats ---
const partnerStats = computed(() => ({
  totalDebt: allPartnerData.value.reduce((sum, r) => sum + r.debt, 0),
}))

const transactionStats = computed(() => {
  const data = allTransactionData.value
  return {
    totalQty: data.reduce((sum, r) => sum + r.importQty + r.exportQty, 0),
    totalAmount: data.reduce((sum, r) => sum + r.totalAmount, 0),
    totalActualWeight: data.reduce((sum, r) => sum + r.actualWeight, 0),
    totalDryRubber: data.reduce((sum, r) => sum + r.dryRubber, 0),
  }
})

// --- Pagination ---
const total = computed(() => {
  if (selectedCategory.value === 'partner') return allPartnerData.value.length
  return allTransactionData.value.length
})

// --- Sắp xếp toàn cục (trên toàn bộ dữ liệu, không chỉ trang hiện tại) ---
const compareValues = (valA: any, valB: any) => {
  if (typeof valA === 'number' && typeof valB === 'number') return valA - valB
  return String(valA).localeCompare(String(valB), 'vi', { numeric: true })
}

const sortList = (list: any[], prop: string, order: string) => {
  if (!prop || !order) return list
  return [...list].sort((a, b) => {
    const res = compareValues(a[prop] ?? '', b[prop] ?? '')
    return order === 'ascending' ? res : -res
  })
}

const partnerSortProp = ref('')
const partnerSortOrder = ref('')

const handlePartnerSortChange = ({ prop, order }: { prop: string; order: string }) => {
  partnerSortProp.value = prop
  partnerSortOrder.value = order
  currentPage.value = 1
}

const transactionSortProp = ref('')
const transactionSortOrder = ref('')

const handleTransactionSortChange = ({ prop, order }: { prop: string; order: string }) => {
  transactionSortProp.value = prop
  transactionSortOrder.value = order
  currentPage.value = 1
}

const sortedPartnerData = computed(() =>
  sortList(allPartnerData.value, partnerSortProp.value, partnerSortOrder.value)
)

const sortedTransactionData = computed(() =>
  sortList(allTransactionData.value, transactionSortProp.value, transactionSortOrder.value)
)

const partnerTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedPartnerData.value.slice(start, end)
})

const transactionTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedTransactionData.value.slice(start, end)
})
</script>

<style scoped>
.lookup-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

/* Cho phân trang tự xuống dòng khi có nhiều trang */
.lookup-container :deep(.el-pagination) {
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

.stat-card--blue { border-left: 4px solid #3b82f6; }
.stat-card--cyan { border-left: 4px solid #06b6d4; }
.stat-card--green { border-left: 4px solid #22c55e; }
.stat-card--indigo { border-left: 4px solid #6366f1; }

/* Dark Mode: Table */
html.dark .lookup-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .lookup-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .lookup-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

html.dark .lookup-container :deep(.el-table .el-table-fixed-column--left),
html.dark .lookup-container :deep(.el-table .el-table-fixed-column--right) {
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

html.dark .highlight-select .el-input__wrapper,
html.dark .highlight-select .el-select__wrapper {
  background-color: #111827 !important;
  border-color: #111827 !important;
}

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
</style>
