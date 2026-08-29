<template>
  <div class="rental-container h-full flex flex-col">
    <!-- Filter Bar -->
    <div class="flex justify-between items-center mb-6 shrink-0">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tình trạng:</span>
          <el-select
            v-model="filterStatus"
            placeholder="Tất cả"
            style="width: 180px"
            clearable
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Tất cả" value="" />
            <el-option label="Đang ở" value="living" />
            <el-option label="Đang cho thuê" value="rented" />
            <el-option label="Tự khai thác" value="self_exploited" />
            <el-option label="Để trống" value="vacant" />
            <el-option label="Thanh toán góp" value="installment" />
            <el-option label="Vướng pháp lý" value="legal_issues" />
            <el-option label="Đã bán" value="sold" />
          </el-select>
        </div>
        <el-button type="primary" :icon="Search" @click="handleSearch">Tìm kiếm</el-button>
      </div>
    </div>

    <template v-if="hasSearched">
      <!-- Stat Metrics Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 shrink-0">
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
          <el-table-column prop="real_estate_id" label="Mã BĐS" width="94" sortable="custom">
            <template #default="{ row }">
              <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.real_estate_id }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="address" label="Địa chỉ" min-width="158" show-overflow-tooltip />
          <el-table-column label="Tình trạng" width="94" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusTag(row.status)" effect="light" size="small" round>
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Tổng đầu tư" width="115" align="right">
            <template #default="{ row }">
              <span class="font-bold" :class="mauSo(row.total_cost)">{{ formatCurrency(row.total_cost) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Tiền BĐS" width="108" align="right">
            <template #default="{ row }">
              <span>{{ formatCurrency(row.real_estate_cost) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Tiền xây dựng" width="108" align="right">
            <template #default="{ row }">
              <span>{{ formatCurrency(row.construction_cost) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Tiền nội thất" width="108" align="right">
            <template #default="{ row }">
              <span>{{ formatCurrency(row.furniture_cost) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Tiền đã góp" width="108" align="right">
            <template #default="{ row }">
              <span  :class="mauSo(row.contributed_cost)">{{ formatCurrency(row.contributed_cost) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Lãi suất / Tháng" width="101" align="right">
            <template #default="{ row }">
              <span>{{ row.monthly_interest_rate ? `${row.monthly_interest_rate}%` : '0%' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="LN Khai thác" width="115" align="right">
            <template #default="{ row }">
              <span  :class="mauSo(row.mining_profit)">{{ formatCurrency(row.mining_profit) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="LN Cho thuê" width="115" align="right">
            <template #default="{ row }">
              <span  :class="mauSo(row.rental_profit)">{{ formatCurrency(row.rental_profit) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Giá tạm tính" width="115" align="right">
            <template #default="{ row }">
              <span>{{ formatCurrency(row.current_estimated) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Tiền bán ra" width="108" align="right">
            <template #default="{ row }">
              <span>{{ formatCurrency(row.sale_cost) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Bán ra sau thuế" width="115" align="right">
            <template #default="{ row }">
              <span>{{ formatCurrency(row.profit_after_tax) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="LN Sau bán" width="115" align="right">
            <template #default="{ row }">
              <span class="font-bold" :class="mauSo(row.profit_after_sale)">{{ formatCurrency(row.profit_after_sale) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Bắt đầu mua" prop="start_buy" width="94" sortable align="center">
            <template #default="{ row }">
              <span class="text-xs text-gray-600 dark:text-gray-400">{{ formatDate(row.start_buy) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Kết thúc mua" prop="end_buy" width="94" sortable align="center">
            <template #default="{ row }">
              <span class="text-xs text-gray-600 dark:text-gray-400">{{ formatDate(row.end_buy) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Bắt đầu bán" prop="start_sale" width="94" sortable align="center">
            <template #default="{ row }">
              <span class="text-xs text-gray-600 dark:text-gray-400">{{ formatDate(row.start_sale) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Kết thúc bán" prop="end_sale" width="94" sortable align="center">
            <template #default="{ row }">
              <span class="text-xs text-gray-600 dark:text-gray-400">{{ formatDate(row.end_sale) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="note" label="Ghi chú" min-width="144" show-overflow-tooltip />
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
              v-for="(row, i) in paginatedData"
              :key="row.id || row.contract_id || i"
              class="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-sm"
            >
              <div class="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
                <div class="min-w-0 break-words">
                  <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.real_estate_id }}</span>
                </div>
              </div>
              <div class="space-y-2 text-sm text-left">
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Địa chỉ:</span>
                  <span class="text-right break-words min-w-0">
                    {{ row.address }}
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tình trạng:</span>
                  <span class="text-right break-words min-w-0">
                    <el-tag :type="getStatusTag(row.status)" effect="light" size="small" round>
                                    {{ getStatusText(row.status) }}
                                  </el-tag>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tổng đầu tư:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="font-bold" :class="mauSo(row.total_cost)">{{ formatCurrency(row.total_cost) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tiền BĐS:</span>
                  <span class="text-right break-words min-w-0">
                    <span>{{ formatCurrency(row.real_estate_cost) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tiền xây dựng:</span>
                  <span class="text-right break-words min-w-0">
                    <span>{{ formatCurrency(row.construction_cost) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tiền nội thất:</span>
                  <span class="text-right break-words min-w-0">
                    <span>{{ formatCurrency(row.furniture_cost) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tiền đã góp:</span>
                  <span class="text-right break-words min-w-0">
                    <span  :class="mauSo(row.contributed_cost)">{{ formatCurrency(row.contributed_cost) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Lãi suất / Tháng:</span>
                  <span class="text-right break-words min-w-0">
                    <span>{{ row.monthly_interest_rate ? `${row.monthly_interest_rate}%` : '0%' }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">LN Khai thác:</span>
                  <span class="text-right break-words min-w-0">
                    <span  :class="mauSo(row.mining_profit)">{{ formatCurrency(row.mining_profit) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">LN Cho thuê:</span>
                  <span class="text-right break-words min-w-0">
                    <span  :class="mauSo(row.rental_profit)">{{ formatCurrency(row.rental_profit) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Giá tạm tính:</span>
                  <span class="text-right break-words min-w-0">
                    <span>{{ formatCurrency(row.current_estimated) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tiền bán ra:</span>
                  <span class="text-right break-words min-w-0">
                    <span>{{ formatCurrency(row.sale_cost) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Bán ra sau thuế:</span>
                  <span class="text-right break-words min-w-0">
                    <span>{{ formatCurrency(row.profit_after_tax) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">LN Sau bán:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="font-bold" :class="mauSo(row.profit_after_sale)">{{ formatCurrency(row.profit_after_sale) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Bắt đầu mua:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="text-xs text-gray-600 dark:text-gray-400">{{ formatDate(row.start_buy) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Kết thúc mua:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="text-xs text-gray-600 dark:text-gray-400">{{ formatDate(row.end_buy) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Bắt đầu bán:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="text-xs text-gray-600 dark:text-gray-400">{{ formatDate(row.start_sale) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Kết thúc bán:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="text-xs text-gray-600 dark:text-gray-400">{{ formatDate(row.end_sale) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ghi chú:</span>
                  <span class="text-right break-words min-w-0">
                    {{ row.note }}
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
            :total="filteredProperties.length"
          />
        </div>
      </div>
    </template>

    <!-- Empty state before search -->
    <div v-else class="flex-1 flex items-center justify-center">
      <div class="text-center text-gray-400 dark:text-gray-500">
        <el-icon class="text-6xl mb-4"><Search /></el-icon>
        <p class="text-lg">Vui lòng chọn trạng thái và nhấn <strong>Tìm kiếm</strong> để truy xuất thông tin</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { mauSo } from '@/utils/mauSo'
import { Search, Wallet, Money, Stamp, TrendCharts } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { rentalService } from '@/api/rentalService'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'

const { laManHep, hienBang, hienThe } = dungManHep()

interface Property {
  id: string
  real_estate_id: string
  address: string
  start_buy: string
  end_buy: string
  total_cost: number
  real_estate_cost: number
  construction_cost: number
  furniture_cost: number
  sale_cost: number
  contributed_cost: number
  monthly_interest_rate: number
  mining_profit: number
  rental_profit: number
  start_sale: string
  end_sale: string
  profit_after_tax: number
  profit_after_sale: number
  status: string
  note: string
  current_estimated: number
}

defineProps<{
  properties: Property[]
}>()

const loading = ref(false)
const hasSearched = ref(false)
const filterStatus = ref('')
const queriedProperties = ref<Property[]>([])

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

const isStatusMatch = (status: string, filter: string) => {
  if (!filter) return true
  if (!status) return false
  const s = status.toLowerCase().trim()
  const f = filter.toLowerCase().trim()

  if (s === f) return true

  if (f === 'rented') {
    return s === 'rented' || s === 'occupied' || s === 'cho thuê' || s === 'đang cho thuê'
  }
  if (f === 'living') {
    return s === 'living' || s === 'đang ở'
  }
  if (f === 'self_exploited') {
    return s === 'self_exploited' || s === 'tự khai thác'
  }
  if (f === 'vacant') {
    return s === 'vacant' || s === 'để trống'
  }
  if (f === 'installment') {
    return s === 'installment' || s === 'thanh toán góp'
  }
  if (f === 'legal_issues') {
    return s === 'legal_issues' || s === 'vướng pháp lý'
  }
  if (f === 'sold') {
    return s === 'sold' || s === 'đã bán'
  }

  return false
}

const handleSearch = async () => {
  loading.value = true
  hasSearched.value = true
  try {
    const data = await rentalService.getRealEstates()
    queriedProperties.value = data
    currentPage.value = 1
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi truy xuất dữ liệu')
  } finally {
    loading.value = false
  }
}

const filteredProperties = computed(() => {
  return queriedProperties.value.filter(p => isStatusMatch(p.status, filterStatus.value))
})

const sortProp = ref('')
const sortOrder = ref('')

const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  sortProp.value = prop
  sortOrder.value = order
  currentPage.value = 1
}

const sortedProperties = computed(() => {
  const list = [...filteredProperties.value]
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
  const end = start + pageSize.value
  return sortedProperties.value.slice(start, end)
})

// Metrics summary based on applied search status
const stats = computed(() => {
  const totalCost = filteredProperties.value.reduce((sum, p) => sum + (p.total_cost || 0), 0)
  const totalBeforeTax = filteredProperties.value.reduce((sum, p) => sum + (p.sale_cost || 0), 0)
  const totalAfterTax = filteredProperties.value.reduce((sum, p) => sum + (p.profit_after_tax || 0), 0)
  const totalEstimated = filteredProperties.value.reduce((sum, p) => sum + (p.current_estimated || 0), 0)

  return [
    { title: 'Tổng đầu tư', value: formatCurrency(totalCost), icon: Wallet, color: '#3b82f6' },
    { title: 'Tổng giá trị trước thuế', value: formatCurrency(totalBeforeTax), icon: Money, color: '#f59e0b' },
    { title: 'Tổng giá trị sau thuế', value: formatCurrency(totalAfterTax), icon: Stamp, color: '#10b981' },
    { title: 'Tổng giá trị tạm tính', value: formatCurrency(totalEstimated), icon: TrendCharts, color: '#8b5cf6' }
  ]
})

const getStatusTag = (status: string) => {
  if (!status) return 'info'
  const s = status.toLowerCase().trim()
  if (s === 'living' || s === 'đang ở') return 'success'
  if (s === 'rented' || s === 'occupied' || s === 'cho thuê' || s === 'đang cho thuê') return 'success'
  if (s === 'self_exploited' || s === 'tự khai thác') return 'warning'
  if (s === 'vacant' || s === 'để trống') return 'primary'
  if (s === 'installment' || s === 'thanh toán góp') return 'info'
  if (s === 'legal_issues' || s === 'vướng pháp lý') return 'danger'
  if (s === 'sold' || s === 'đã bán') return 'danger'
  return 'info'
}

const getStatusText = (status: string) => {
  if (!status) return '—'
  const s = status.toLowerCase().trim()
  if (s === 'living' || s === 'đang ở') return 'Đang ở'
  if (s === 'rented' || s === 'occupied' || s === 'cho thuê' || s === 'đang cho thuê') return 'Đang cho thuê'
  if (s === 'self_exploited' || s === 'tự khai thác') return 'Tự khai thác'
  if (s === 'vacant' || s === 'để trống') return 'Để trống'
  if (s === 'installment' || s === 'thanh toán góp') return 'Thanh toán góp'
  if (s === 'legal_issues' || s === 'vướng pháp lý') return 'Vướng pháp lý'
  if (s === 'sold' || s === 'đã bán') return 'Đã bán'
  if (s === 'selling' || s === 'đang bán') return 'Đang bán'
  if (s === 'maintenance' || s === 'bảo trì') return 'Bảo trì'
  return status
}

const formatCurrency = (val: number) => {
  if (!val) return '0 VNĐ'
  return new Intl.NumberFormat('vi-VN').format(val) + ' VNĐ'
}

const formatDate = (d: string) => {
  if (!d) return '—'
  const [y, m, dd] = d.split('-')
  return `${dd}/${m}/${y}`
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

html.dark .custom-dark-select :deep(.el-input__wrapper) {
  background-color: #111827 !important;
  box-shadow: 0 0 0 1px #4b5563 inset !important;
}
html.dark .custom-dark-select :deep(.el-input__inner) {
  color: #f3f4f6;
}
</style>
