<template>
  <div class="lookup-container h-full flex flex-col text-left p-1">
    <!-- Filter bar -->
    <div class="flex flex-wrap items-center gap-x-4 gap-y-4 mb-4 shrink-0 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <!-- Rosca Code Input -->
      <div class="flex items-center gap-2">
        <span class="whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-gray-300">Mã dây hụi:</span>
        <el-input
          v-model="roscaCode"
          placeholder="Nhập mã dây hụi..."
          clearable
          class="w-48 custom-dark-input"
          @keyup.enter="handleSearch"
        />
      </div>

      <!-- Status Filter -->
      <div class="flex items-center gap-2">
        <span class="whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-gray-300">Trạng thái:</span>
        <el-select
          v-model="status"
          placeholder="Tất cả"
          clearable
          style="width: 140px"
          class="custom-dark-input highlight-select"
          popper-class="custom-dark-select-popper"
        >
          <el-option label="Paid" value="Paid" />
          <el-option label="Unpaid" value="Unpaid" />
        </el-select>
      </div>

      <!-- Flow Type Filter -->
      <div class="flex items-center gap-2">
        <span class="whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-gray-300">Dòng tiền:</span>
        <el-select
          v-model="flowType"
          placeholder="Tất cả"
          clearable
          style="width: 140px"
          class="custom-dark-input highlight-select"
          popper-class="custom-dark-select-popper"
        >
          <el-option label="Đóng tiền" value="pay" />
          <el-option label="Rút tiền" value="withdraw" />
        </el-select>
      </div>

      <!-- Time range filter -->
      <div class="flex items-center gap-2">
        <span class="whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-gray-300">Thời gian:</span>
        <el-date-picker :editable="false"
          v-model="dateRange"
          type="daterange"
          range-separator="~"
          start-placeholder="Từ ngày"
          end-placeholder="Đến ngày"
          format="DD/MM/YYYY"
          value-format="YYYY-MM-DD"
          class="custom-dark-date-picker highlight-select"
          popper-class="custom-dark-select-popper"
          style="width: 280px"
        />
      </div>

      <!-- Search Button -->
      <el-button 
        type="primary" 
        :icon="Search" 
        @click="handleSearch" 
        :loading="loading" 
        class="ml-auto bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 border-none font-semibold text-white shadow-sm"
      >
        Tìm kiếm
      </el-button>
    </div>

    <!-- Summary Statistics Cards -->
    <div v-if="hasSearched" class="summary-cards mb-4 shrink-0">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- 1. Total Paid Card -->
        <div class="stat-card stat-card--blue">
          <div class="stat-card__label">Tổng tiền đã đóng (Số tiền < 0)</div>
          <div class="stat-card__value text-blue-600 dark:text-blue-400">
            {{ formatCurrency(Math.abs(totalPaid)) }}
          </div>
        </div>

        <!-- 2. Total Withdrawn Card -->
        <div class="stat-card stat-card--emerald">
          <div class="stat-card__label">Tổng tiền đã rút (Số tiền > 0)</div>
          <div class="stat-card__value text-emerald-600 dark:text-emerald-400">
            {{ formatCurrency(totalWithdrawn) }}
          </div>
        </div>

        <!-- 3. Total Profit Card -->
        <div class="stat-card stat-card--indigo">
          <div class="stat-card__label">Tổng lợi nhuận</div>
          <div class="stat-card__value" :class="totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-650 dark:text-red-400'">
            {{ totalProfit >= 0 ? '+' : '' }}{{ formatCurrency(totalProfit) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Table Results -->
    <div v-if="hasSearched" class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
      <!-- ══════════════════════════════════════════════════════════════
           MỤC 398 (29/08/2026) — BỎ CỘT GHIM, BẢNG CHỈ HIỆN TỪ 768px

           Cột ghim `fixed` chiếm chỗ CỐ ĐỊNH và không co theo màn hình.
           Trên màn 390px, mấy cột ghim cộng lại đã hết chỗ, nên vùng
           cuộn còn lại bằng 0 và vuốt ngang không có tác dụng — người
           dùng vuốt mà màn hình không nhúc nhích.

           Đã bỏ 0 cột ghim ở bảng này.
           ══════════════════════════════════════════════════════════ -->
      <el-table v-if="hienBang" 
        v-loading="loading" 
        :data="paginatedData" 
        style="width: 100%" 
        class="flex-1" 
        height="100%"
      >
        <!-- STT Column -->
        <el-table-column label="STT" width="60" align="center">
          <template #default="{ $index }">
            <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>

        <!-- Mã Giao dịch ID -->
        <el-table-column label="Mã giao dịch" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono text-xs text-gray-550 select-all">{{ row.id }}</span>
          </template>
        </el-table-column>

        <!-- Mã Dây Hụi -->
        <el-table-column label="Mã Dây Hụi" width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-bold text-blue-600 dark:text-blue-400 font-mono select-all">{{ row.rosca_code }}</span>
          </template>
        </el-table-column>

        <!-- Kỳ hụi -->
        <el-table-column label="Kỳ hụi" width="95" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain" class="font-bold font-mono">
              Kỳ {{ row.round_number }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Người chơi -->
        <el-table-column prop="player_name" label="Người chơi" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-bold text-gray-800 dark:text-gray-100 select-all">{{ row.player_name || 'N/A' }}</span>
          </template>
        </el-table-column>

        <!-- Dòng tiền -->
        <el-table-column label="Dòng tiền" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="row.amount < 0 ? 'primary' : 'success'" size="default" class="font-semibold">
              {{ row.amount < 0 ? 'Đóng tiền' : 'Rút tiền' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Số tiền -->
        <el-table-column label="Số tiền" width="180" align="right">
          <template #default="{ row }">
            <span 
              class="font-bold font-mono select-all text-base"
              :class="row.amount < 0 ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-650 dark:text-emerald-400'"
            >
              {{ row.amount < 0 ? '-' : '+' }}{{ formatCurrency(Math.abs(row.amount)) }}
            </span>
          </template>
        </el-table-column>

        <!-- Ngày đóng thực tế -->
        <el-table-column label="Ngày thực hiện" width="180">
          <template #default="{ row }">
            <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {{ formatDate(row.actual_payment_date) }}
            </span>
          </template>
        </el-table-column>

        <!-- Trạng thái -->
        <el-table-column label="Trạng thái" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="default" class="font-semibold">
              {{ row.status || '—' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Ghi chú -->
        <el-table-column prop="note" label="Ghi chú" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-gray-500 text-xs">{{ row.note || '—' }}</span>
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
                <span class="font-mono text-xs text-gray-550 select-all">{{ row.id }}</span>
              </div>
            </div>
            <div class="space-y-2 text-sm text-left">
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Mã Dây Hụi:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-bold text-blue-600 dark:text-blue-400 font-mono select-all">{{ row.rosca_code }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Kỳ hụi:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag size="small" type="info" effect="plain" class="font-bold font-mono">
                                Kỳ {{ row.round_number }}
                              </el-tag>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Người chơi:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-bold text-gray-800 dark:text-gray-100 select-all">{{ row.player_name || 'N/A' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Dòng tiền:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag :type="row.amount < 0 ? 'primary' : 'success'" size="default" class="font-semibold">
                                {{ row.amount < 0 ? 'Đóng tiền' : 'Rút tiền' }}
                              </el-tag>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Số tiền:</span>
                <span class="text-right break-words min-w-0">
                  <span 
                                class="font-bold font-mono select-all text-base"
                                :class="row.amount < 0 ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-650 dark:text-emerald-400'"
                              >
                                {{ row.amount < 0 ? '-' : '+' }}{{ formatCurrency(Math.abs(row.amount)) }}
                              </span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ngày thực hiện:</span>
                <span class="text-right break-words min-w-0">
                  <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {{ formatDate(row.actual_payment_date) }}
                              </span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Trạng thái:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag :type="getStatusTagType(row.status)" size="default" class="font-semibold">
                                {{ row.status || '—' }}
                              </el-tag>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ghi chú:</span>
                <span class="text-right break-words min-w-0">
                  <span class="text-gray-500 text-xs">{{ row.note || '—' }}</span>
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
      <div class="mt-auto shrink-0 p-4 flex justify-between items-center border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        <span class="text-xs text-gray-500 dark:text-gray-400">Hiển thị {{ paginatedData.length }}/{{ searchResults.length }} dòng</span>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="searchResults.length"
          class="custom-pagination"
        />
      </div>
    </div>

    <!-- Empty state before search -->
    <div v-if="!hasSearched" class="flex-1 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <div class="text-center text-gray-400 dark:text-gray-500">
        <el-icon class="text-6xl mb-4"><Search /></el-icon>
        <p class="text-lg font-medium">Vui lòng chọn các tiêu chí và nhấn <strong>Tìm kiếm</strong> để truy xuất thông tin</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { roscaService, type RoscaContribution } from '@/api/roscaService'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'

const { laManHep, hienBang, hienThe } = dungManHep()

const loading = ref(false)
const hasSearched = ref(false)
const roscaCode = ref('')
const status = ref('')
const flowType = ref('')
const dateRange = ref<[string, string] | null>(null)

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)
const searchResults = ref<RoscaContribution[]>([])

// Total metrics
const totalPaid = computed(() => {
  return searchResults.value
    .filter(item => (item.amount || 0) < 0)
    .reduce((sum, item) => sum + (item.amount || 0), 0)
})

const totalWithdrawn = computed(() => {
  return searchResults.value
    .filter(item => (item.amount || 0) > 0)
    .reduce((sum, item) => sum + (item.amount || 0), 0)
})

const totalProfit = computed(() => {
  return totalPaid.value + totalWithdrawn.value
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return searchResults.value.slice(start, end)
})

// Formatters
const formatDate = (val?: string | null) => {
  if (!val) return '—'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return val
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return val
  }
}

const formatCurrency = (val: number) => {
  if (!val) return '0 VNĐ'
  return new Intl.NumberFormat('vi-VN').format(val) + ' VNĐ'
}

const getStatusTagType = (status?: string) => {
  switch (status) {
    case 'Paid': return 'success'
    case 'Unpaid': return 'warning'
    default: return 'info'
  }
}

// Search
const handleSearch = async () => {
  loading.value = true
  hasSearched.value = true
  currentPage.value = 1
  try {
    let start_date = undefined
    let end_date = undefined
    if (dateRange.value && dateRange.value.length === 2) {
      start_date = dateRange.value[0]
      end_date = dateRange.value[1]
    }

    const params: any = {}
    if (roscaCode.value.trim()) params.rosca_code = roscaCode.value.trim()
    if (status.value) params.status = status.value
    if (flowType.value) params.flow_type = flowType.value
    if (start_date) params.start_date = start_date
    if (end_date) params.end_date = end_date

    const data = await roscaService.getRoscaContributions(params)
    searchResults.value = data
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi truy xuất dữ liệu')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.lookup-container {
  height: 100%;
}

.stat-card {
  background: #ffffff;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: all 0.3s ease;
  text-align: left;
}

html.dark .stat-card {
  background: #1f2937;
  border-color: #374151;
  box-shadow: none;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.stat-card--blue {
  border-left: 4px solid #3b82f6;
}

.stat-card--emerald {
  border-left: 4px solid #10b981;
}

.stat-card--indigo {
  border-left: 4px solid #6366f1;
}

.stat-card__label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

html.dark .stat-card__label {
  color: #94a3b8;
}

.stat-card__value {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.2;
}

/* Custom dark mode styles for table */
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

html.dark .custom-dark-input,
html.dark .custom-dark-date-picker {
  --el-input-text-color: #f3f4f6 !important;
  --el-text-color-regular: #f3f4f6 !important;
  --el-text-color-placeholder: #9ca3af !important;
}

html.dark .custom-dark-input :deep(.el-input__wrapper),
html.dark .custom-dark-input :deep(.el-select__wrapper),
html.dark .custom-dark-date-picker :deep(.el-input__wrapper) {
  background-color: #1f2937 !important;
  box-shadow: 0 0 0 1px #374151 inset !important;
}

html.dark .custom-dark-input :deep(.el-input__inner),
html.dark .custom-dark-input :deep(.el-select__placeholder),
html.dark .custom-dark-date-picker :deep(.el-input__inner) {
  color: #f3f4f6 !important;
  -webkit-text-fill-color: #f3f4f6 !important;
  opacity: 1 !important;
}

/* Date picker range dark mode overrides */
html.dark .highlight-select.el-date-editor.el-range-editor {
  background-color: #1f2937 !important;
  box-shadow: 0 0 0 1px #374151 inset !important;
  border-color: #374151 !important;
}

html.dark .highlight-select.el-date-editor :deep(.el-range-input) {
  background-color: transparent !important;
  color: #f3f4f6 !important;
  -webkit-text-fill-color: #f3f4f6 !important;
}

html.dark .highlight-select.el-date-editor :deep(.el-range-separator) {
  color: #9ca3af !important;
}

html.dark .highlight-select.el-date-editor :deep(.el-range-input::placeholder) {
  color: #6b7280 !important;
}
</style>
