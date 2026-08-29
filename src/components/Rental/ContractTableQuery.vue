<template>
  <div class="rental-container h-full flex flex-col">
    <!-- Filter Bar -->
    <div class="flex flex-wrap justify-between items-center mb-6 shrink-0 gap-3">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Status filter -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái:</span>
          <el-select
            v-model="filterStatus"
            placeholder="Tất cả"
            style="width: 180px"
            clearable
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Tất cả" value="" />
            <el-option label="Đang hoạt động" value="active" />
            <el-option label="Nợ xấu" value="bad_debt" />
            <el-option label="Đã kết thúc" value="completed" />
            <el-option label="Đã hủy" value="cancelled" />
          </el-select>
        </div>
        <!-- Month range filter -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian:</span>
          <el-date-picker :editable="false"
            v-model="monthRange"
            type="monthrange"
            range-separator="đến"
            start-placeholder="Từ tháng"
            end-placeholder="Đến tháng"
            format="MM/YYYY"
            value-format="YYYY-MM"
            style="width: 240px"
            class="custom-dark-date-picker highlight-select"
            popper-class="custom-dark-select-popper"
          />
        </div>
        <!-- Contract ID input -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Mã HĐ:</span>
          <el-input
            v-model="filterContractId"
            placeholder="Nhập mã hợp đồng..."
            clearable
            class="w-52 custom-dark-input"
            @keyup.enter="handleSearch"
          />
        </div>
        <el-button type="primary" :icon="Search" @click="handleSearch">Tìm kiếm</el-button>
      </div>
    </div>

    <!-- Results section: only show after search -->
    <template v-if="hasSearched">
      <!-- Stat Metrics Row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 shrink-0">
        <div 
          v-for="(stat, idx) in stats" 
          :key="idx" 
          class="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 transition-all duration-300 hover:shadow-md"
        >
          <div class="p-3 rounded-lg text-white flex items-center justify-center" :style="{ backgroundColor: stat.color }">
            <el-icon :size="20">
              <component :is="stat.icon" />
            </el-icon>
          </div>
          <div class="text-left">
            <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{{ stat.title }}</p>
            <p class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-1">{{ stat.value }}</p>
          </div>
        </div>
      </div>

      <!-- Table Container -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
        <!-- ══════════════════════════════════════════════════════════════
             MỤC 396 (29/08/2026) — BỎ CỘT GHIM, BẢNG CHỈ HIỆN TỪ 768px

             Cột ghim `fixed` chiếm chỗ CỐ ĐỊNH và không co theo màn hình.
             Trên màn 390px, mấy cột ghim cộng lại đã hết chỗ, nên vùng
             cuộn còn lại bằng 0 và vuốt ngang không có tác dụng — người
             dùng vuốt mà màn hình không nhúc nhích.

             Đã bỏ 3 cột ghim ở bảng này.
             ══════════════════════════════════════════════════════════ -->
        <el-table v-if="hienBang" v-loading="loading" :data="paginatedData" style="width: 100%" class="flex-1" height="100%" @sort-change="handleSortChange">
          <el-table-column label="STT" width="52" align="center">
            <template #default="{ $index }">
              {{ (currentPage - 1) * pageSize + $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="contract_id" label="Mã hợp đồng" width="101" sortable="custom">
            <template #default="{ row }">
              <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.contract_id }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="customer_name" label="Tên khách hàng" min-width="144" sortable="custom">
            <template #default="{ row }">
              <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.customer_name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="real_estate_id" label="Mã BĐS" min-width="86">
            <template #default="{ row }">
              <span class="font-mono text-gray-600 dark:text-gray-400">{{ row.real_estate_id }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="monthly_rental" label="Tiền thuê" min-width="94" align="right">
            <template #default="{ row }">
              <span :class="mauSo(row.monthly_rental)">{{ formatCurrency(row.monthly_rental) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="rental_debt" label="Công nợ" min-width="94" align="right">
            <template #default="{ row }">
              <span class="font-semibold" :class="mauSo(row.rental_debt)">{{ formatCurrency(row.rental_debt) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="payment_amount" label="Số tiền đóng" min-width="101" align="right">
            <template #default="{ row }">
              <span class="font-extrabold" :class="mauSo(row.payment_amount)">{{ formatCurrency(row.payment_amount) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="payment_date" label="Ngày đóng" min-width="86" align="center">
            <template #default="{ row }">
              <span>{{ formatDate(row.payment_date) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="payment_time" label="Giờ đóng" width="72" align="center">
            <template #default="{ row }">
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatTime(row.payment_time) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="Trạng thái" width="101" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusTag(row.status)" effect="plain" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>

<!-- ══════════════════════════════════════════════════════════════
             MỤC 397 (29/08/2026) — THẺ DỌC CHO MÀN HẸP

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
                  <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.contract_id }}</span>
                </div>
              </div>
              <div class="space-y-2 text-sm text-left">
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tên khách hàng:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.customer_name }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Mã BĐS:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="font-mono text-gray-600 dark:text-gray-400">{{ row.real_estate_id }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tiền thuê:</span>
                  <span class="text-right break-words min-w-0">
                    <span :class="mauSo(row.monthly_rental)">{{ formatCurrency(row.monthly_rental) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Công nợ:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="font-semibold" :class="mauSo(row.rental_debt)">{{ formatCurrency(row.rental_debt) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Số tiền đóng:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="font-extrabold" :class="mauSo(row.payment_amount)">{{ formatCurrency(row.payment_amount) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ngày đóng:</span>
                  <span class="text-right break-words min-w-0">
                    <span>{{ formatDate(row.payment_date) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Giờ đóng:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatTime(row.payment_time) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Trạng thái:</span>
                  <span class="text-right break-words min-w-0">
                    <el-tag :type="getStatusTag(row.status)" effect="plain" size="small">
                                    {{ getStatusText(row.status) }}
                                  </el-tag>
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
            :total="payments.length"
          />
        </div>
      </div>
    </template>

    <!-- Empty state before search -->
    <div v-else class="flex-1 flex flex-col items-center justify-center text-center">
      <div class="p-6 rounded-full bg-gray-100 dark:bg-gray-800 mb-5">
        <el-icon :size="48" class="text-gray-300 dark:text-gray-600"><Search /></el-icon>
      </div>
      <h3 class="text-lg font-bold text-gray-500 dark:text-gray-400 mb-2">Chọn bộ lọc và nhấn "Tìm kiếm"</h3>
      <p class="text-sm text-gray-400 dark:text-gray-500 max-w-md">
        Sử dụng bộ lọc trạng thái, khoảng thời gian hoặc mã hợp đồng để truy xuất lịch sử thanh toán.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { mauSo } from '@/utils/mauSo'
import { Search, Files, Wallet, Money } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { rentalService } from '@/api/rentalService'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'

const { laManHep, hienBang, hienThe } = dungManHep()

interface PaymentRecord {
  id: string
  contract_id: string
  payment_date: string
  payment_time: string
  payment_amount: number
  customer_name: string
  group_name: string
  number_phone: string
  real_estate_id: string
  monthly_rental: number
  rental_debt: number
  customer_code?: string
  contact_info?: string
  type_contract?: string
  start_rental?: string
  end_rental?: string
  deposit?: number
  status?: string
}

const loading = ref(false)
const hasSearched = ref(false)
const filterStatus = ref('')
const filterContractId = ref('')
const currentYear = new Date().getFullYear()
const monthRange = ref<[string, string] | null>([`${currentYear}-01`, `${currentYear}-12`])

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

const payments = ref<PaymentRecord[]>([])

const sortProp = ref('')
const sortOrder = ref('')

const handleSortChange = ({ prop, order }: { prop: string, order: string }) => {
  sortProp.value = prop
  sortOrder.value = order
}

const sortedPayments = computed(() => {
  const result = [...payments.value]
  if (sortProp.value && sortOrder.value) {
    result.sort((a: any, b: any) => {
      const valA = a[sortProp.value] ?? ''
      const valB = b[sortProp.value] ?? ''
      const compare = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' })
      return sortOrder.value === 'ascending' ? compare : -compare
    })
  }
  return result
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedPayments.value.slice(start, end)
})

// Metrics summary
const stats = computed(() => {
  const totalCount = payments.value.length
  const totalPaid = payments.value.reduce((sum, p) => sum + (p.payment_amount || 0), 0)

  // Tính công nợ chỉ 1 lần cho mỗi mã hợp đồng (tránh cộng trùng khi 1 HĐ có nhiều dòng thanh toán)
  const debtByContract = new Map<string, number>()
  for (const p of payments.value) {
    if (!debtByContract.has(p.contract_id)) {
      debtByContract.set(p.contract_id, p.rental_debt || 0)
    }
  }
  const totalDebt = Array.from(debtByContract.values()).reduce((sum, d) => sum + d, 0)

  return [
    { title: 'Tổng giao dịch', value: `${totalCount} giao dịch`, icon: Files, color: '#3b82f6' },
    { title: 'Tổng tiền đã đóng', value: formatCurrency(totalPaid), icon: Money, color: '#10b981' },
    { title: 'Tổng công nợ', value: formatCurrency(totalDebt), icon: Wallet, color: '#ef4444' }
  ]
})

const handleSearch = async () => {
  loading.value = true
  hasSearched.value = true
  currentPage.value = 1

  try {
    // Build API params
    let startDateParam: string | undefined = undefined
    let endDateParam: string | undefined = undefined

    if (monthRange.value && monthRange.value.length === 2) {
      const [start, end] = monthRange.value
      const startParts = start.split('-')
      const endParts = end.split('-')
      if (startParts.length === 2) startDateParam = `${startParts[1]}/${startParts[0]}`
      if (endParts.length === 2) endDateParam = `${endParts[1]}/${endParts[0]}`
    }

    const data = await rentalService.getRentalPayments({
      contract_id: filterContractId.value || undefined,
      start_date: startDateParam,
      end_date: endDateParam,
      status: filterStatus.value || undefined
    })

    payments.value = data.map((item: any) => ({
      id: item.id,
      contract_id: item.contract_id || '',
      payment_date: item.payment_date || '',
      payment_time: item.payment_time || '',
      payment_amount: item.payment_amount || 0,
      customer_name: item.customer_name || 'Chưa rõ',
      group_name: item.group_name || '',
      number_phone: item.number_phone || '',
      real_estate_id: item.real_estate_id || '',
      monthly_rental: item.monthly_rental || 0,
      rental_debt: item.rental_debt || 0,
      customer_code: item.customer_code || '',
      contact_info: item.contact_info || '',
      type_contract: item.type_contract || '',
      start_rental: item.start_rental || '',
      end_rental: item.end_rental || '',
      deposit: item.deposit || 0,
      status: item.status || 'active'
    }))
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi truy xuất dữ liệu thanh toán')
  } finally {
    loading.value = false
  }
}

const getStatusTag = (status: string) => {
  if (status === 'active') return 'success'
  if (status === 'bad_debt') return 'danger'
  if (status === 'completed') return 'info'
  if (status === 'cancelled') return 'warning'
  return 'info'
}

const getStatusText = (status: string) => {
  if (status === 'active') return 'Đang hoạt động'
  if (status === 'bad_debt') return 'Nợ xấu'
  if (status === 'completed') return 'Đã kết thúc'
  if (status === 'cancelled') return 'Đã hủy'
  return status || '—'
}

const formatCurrency = (val?: number) => {
  if (!val) return '0 VNĐ'
  return new Intl.NumberFormat('vi-VN').format(val) + ' VNĐ'
}

const formatDate = (d: string) => {
  if (!d) return '—'
  if (d.includes('T')) {
    d = d.split('T')[0] || ''
  }
  const parts = d.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return d
}

const formatTime = (t: string) => {
  if (!t) return '—'
  if (t.includes('T')) {
    const timePart = t.split('T')[1]
    if (timePart) {
      return timePart.split('.')[0]
    }
  }
  return t
}
</script>

<style scoped>
.rental-container {
  height: 100%;
}

.rental-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

html.dark .rental-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}
html.dark .rental-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}
html.dark .rental-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}
html.dark .rental-container :deep(.el-table .el-table-fixed-column--left),
html.dark .rental-container :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important;
}

html.dark .custom-dark-select :deep(.el-input__wrapper),
html.dark .custom-dark-input :deep(.el-input__wrapper) {
  background-color: #1f2937;
  box-shadow: 0 0 0 1px #374151 inset;
}
html.dark .custom-dark-select :deep(.el-input__inner),
html.dark .custom-dark-input :deep(.el-input__inner) {
  color: #f3f4f6;
}

/* Custom dark date picker overrides */
html.dark .custom-dark-date-picker :deep(.el-range-input) {
  background-color: transparent;
  color: #f3f4f6;
}
html.dark .custom-dark-date-picker :deep(.el-range-separator) {
  color: #9ca3af;
}
</style>

<style>
/* Unscoped date picker dark mode overrides */
html.dark .highlight-select.el-date-editor .el-input__wrapper {
  background-color: #111827 !important;
  box-shadow: 0 0 0 1px #111827 inset !important;
}
html.dark .highlight-select.el-date-editor .el-range-input {
  color: #f3f4f6 !important;
}
html.dark .highlight-select.el-date-editor .el-range-separator {
  color: #9ca3af !important;
}
</style>
