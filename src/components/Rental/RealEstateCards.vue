<template>
  <div class="rental-container h-full flex flex-col">
    <!-- Filter Bar -->
    <div class="flex flex-wrap justify-between items-center mb-6 shrink-0 gap-3">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Display Mode Select -->
        <!-- MỤC 400 — giấu ở màn hẹp: dưới 768px chỉ còn một chế độ dùng
             được, để ô chọn ở đó là người dùng chọn rồi không thấy gì
             đổi. `hidden md:flex` theo đúng quy ước bố cục. -->
        <div class="hidden md:flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Hiển thị:</span>
          <el-select
            v-model="displayMode"
            placeholder="Chọn dạng"
            style="width: 170px"
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Hiển thị dạng List" value="list" />
            <el-option label="Hiển thị dạng Card" value="card" />
          </el-select>
        </div>

        <!-- Total BĐS Badge -->
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/60 shadow-sm shrink-0">
          <el-icon :size="15"><OfficeBuilding /></el-icon>
          <span class="text-xs font-semibold uppercase tracking-wider">Tổng BĐS:</span>
          <span class="text-sm font-extrabold">{{ filteredProperties.length }}</span>
          <span v-if="filteredProperties.length !== properties.length" class="text-xs text-gray-400">/ {{ properties.length }}</span>
        </div>

        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tình trạng:</span>
          <el-select
            v-model="filterStatus"
            placeholder="Tất cả"
            style="width: 150px"
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
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
          <el-input
            v-model="searchQuery"
            placeholder="Tìm mã BĐS, địa chỉ..."
            :prefix-icon="Search"
            clearable
            class="w-64 custom-dark-input"
          />
        </div>
      </div>
      <div class="flex items-center gap-2">
        <el-button :icon="Refresh" circle @click="emit('refresh')" />
        <el-button type="primary" :icon="Plus" @click="emit('add')">Thêm bất động sản</el-button>
      </div>
    </div>

    <!-- LIST VIEW (Default) -->
    <template v-if="displayMode === 'list'">
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
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0 border border-gray-100 dark:border-gray-700">
        <!-- ══════════════════════════════════════════════════════════════
             MỤC 396 (29/08/2026) — BỎ CỘT GHIM, BẢNG CHỈ HIỆN TỪ 768px

             Cột ghim `fixed` chiếm chỗ CỐ ĐỊNH và không co theo màn hình.
             Trên màn 390px, mấy cột ghim cộng lại đã hết chỗ, nên vùng
             cuộn còn lại bằng 0 và vuốt ngang không có tác dụng — người
             dùng vuốt mà màn hình không nhúc nhích.

             Đã bỏ 4 cột ghim ở bảng này.
             ══════════════════════════════════════════════════════════ -->
        <el-table v-if="hienBang" :data="paginatedProperties" style="width: 100%" class="flex-1 custom-table" height="100%" @sort-change="handleSortChange">
          <el-table-column label="STT" width="52" align="center">
            <template #default="{ $index }">
              <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="real_estate_id" label="Mã BĐS" width="94" sortable="custom">
            <template #default="{ row }">
              <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.real_estate_id }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="address" label="Địa chỉ" min-width="158" show-overflow-tooltip />
          <el-table-column label="Tình trạng" width="101" align="center">
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

          <el-table-column label="Thao tác" width="60" align="center">
            <template #default="{ row }">
              <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
                <el-button link type="info" class="p-1">
                  <el-icon class="text-xl"><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="detail">Chi tiết</el-dropdown-item>
                    <el-dropdown-item command="edit">Chỉnh sửa</el-dropdown-item>
                    <el-dropdown-item command="schedule">Lên lịch hẹn</el-dropdown-item>
                    <el-dropdown-item command="delete" class="!text-red-500">Xóa</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>

<!-- ══════════════════════════════════════════════════════════════
     MỤC 400 (29/08/2026) — MÀN NÀY KHÔNG DÙNG THẺ TỰ SINH

     🔴 MỤC 397 sinh một khối thẻ cho màn này như 59 màn khác. Nhưng màn
     Bất động sản ĐÃ CÓ SẴN chế độ thẻ riêng (`displayMode === 'card'`),
     dựng tay cho đúng loại dữ liệu này.

     Để cả hai thì trên điện thoại chọn "List" ra thẻ tự sinh, chọn
     "Card" ra thẻ dựng tay — hai kiểu thẻ khác nhau cho cùng một dữ
     liệu, và người dùng không hiểu vì sao.

     ➜ Bỏ thẻ tự sinh. Màn hẹp ép về chế độ thẻ có sẵn (xem `watch` trên
     `laManHep` trong phần script), và ô chọn List/Card bị giấu đi vì ở
     bề rộng đó nó không còn lựa chọn nào để chọn — một ô chọn không làm
     gì là lỗi im lặng.
     ══════════════════════════════════════════════════════════ -->

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

    <!-- CARD VIEW -->
    <template v-else>
      <div class="flex-1 min-h-0 overflow-y-auto pb-4">
        <div v-if="filteredProperties.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <el-card
            v-for="prop in filteredProperties"
            :key="prop.id"
            shadow="hover"
            class="prop-card border border-gray-100 dark:border-gray-700/80 rounded-2xl bg-white dark:bg-gray-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <!-- Card Header -->
            <div class="flex items-start gap-3 mb-4">
              <div class="p-2.5 rounded-xl text-white shadow-sm flex items-center justify-center bg-blue-500 dark:bg-blue-600">
                <el-icon :size="20">
                  <OfficeBuilding />
                </el-icon>
              </div>
              <div class="flex-1 min-w-0 text-left">
                <div class="flex items-center justify-between gap-1">
                  <h4 class="font-bold text-gray-800 dark:text-gray-100 text-[15px] line-clamp-1 leading-snug flex-1">
                    {{ prop.real_estate_id }}
                  </h4>
                  
                  <!-- Dropdown Menu -->
                  <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, prop)">
                    <el-button link type="info" class="p-1 !text-gray-400 hover:!text-gray-600 dark:hover:!text-gray-200">
                      <el-icon :size="16"><MoreFilled /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="detail">Chi tiết</el-dropdown-item>
                        <el-dropdown-item command="edit">Chỉnh sửa</el-dropdown-item>
                        <el-dropdown-item command="schedule">Lên lịch hẹn</el-dropdown-item>
                        <el-dropdown-item command="delete" divided class="!text-red-500">Xóa</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
                <div class="text-[11px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                  <el-icon><Location /></el-icon>
                  <span class="truncate">{{ prop.address }}</span>
                </div>
              </div>
            </div>

            <!-- Status Tag -->
            <div class="mb-4 flex justify-start">
              <el-tag :type="getStatusTag(prop.status)" size="small" class="capitalize" effect="plain">
                {{ getStatusText(prop.status) }}
              </el-tag>
            </div>

            <!-- Card Body details -->
            <div class="space-y-3 pt-3 border-t border-gray-50 dark:border-gray-700/40">
              <div class="flex justify-between items-center text-xs">
                <span class="text-gray-400 dark:text-gray-500 font-medium">Tổng đầu tư</span>
                <span class="font-bold" :class="mauSo(prop.total_cost)">{{ formatCurrency(prop.total_cost) }}</span>
              </div>
              <div class="flex justify-between items-center text-xs">
                <span class="text-gray-400 dark:text-gray-500 font-medium">Tiền đã góp</span>
                <span class="font-bold" :class="mauSo(prop.contributed_cost)">{{ formatCurrency(prop.contributed_cost) }}</span>
              </div>
              <div class="flex justify-between items-center text-xs">
                <span class="text-gray-400 dark:text-gray-500 font-medium">LN Cho thuê</span>
                <span class="font-bold text-emerald-600 dark:text-emerald-400">+{{ formatCurrency(prop.rental_profit) }}</span>
              </div>

              <!-- Estimated value box -->
              <div class="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 flex justify-between items-center border border-gray-100/50 dark:border-gray-800">
                <div class="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Giá tạm tính hiện tại</div>
                <div class="text-[14px] font-extrabold text-indigo-600 dark:text-indigo-400">
                  {{ formatCurrency(prop.current_estimated) }}
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- Empty State -->
        <div v-else class="flex flex-col items-center justify-center py-12 text-gray-400">
          <el-empty description="Không tìm thấy bất động sản nào" />
        </div>
      </div>
    </template>

    <!-- Schedule Notification Modal -->
    <ScheduledNotificationModal
      v-model="scheduleModalVisible"
      module-key="rental"
      :prefill-data="schedulePrefill"
      @saved="scheduleModalVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { mauSo } from '@/utils/mauSo'
import {
  Search,
  Plus,
  Refresh,
  OfficeBuilding,
  MoreFilled,
  Location,
  Wallet,
  Money,
  Stamp,
  TrendCharts
} from '@element-plus/icons-vue'
import ScheduledNotificationModal from '@/components/ScheduledNotification/ScheduledNotificationModal.vue'
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

const props = defineProps<{
  properties: Property[]
}>()

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'refresh'): void
  (e: 'edit', val: Property): void
  (e: 'delete', val: Property): void
  (e: 'detail', val: Property): void
}>()

// Display mode: 'list' (default) or 'card'
const displayMode = ref<'list' | 'card'>('list')

// ══════════════════════════════════════════════════════════════════════
// MỤC 400 (29/08/2026) — MÀN HẸP ÉP VỀ CHẾ ĐỘ THẺ CÓ SẴN
//
// ⚠️ `{ immediate: true }` là BẮT BUỘC. Không có nó thì lần mở đầu tiên
// trên điện thoại vẫn ở chế độ "list" — tức dựng bảng 22 cột trên màn
// 390px, đúng thứ MỤC 396-398 dựng ra để tránh. `watch` chỉ chạy khi giá
// trị ĐỔI, mà lúc mở màn nó chưa đổi lần nào.
watch(laManHep, (hep) => {
  if (hep) displayMode.value = 'card'
}, { immediate: true })

const searchQuery = ref('')
const filterStatus = ref('')

// Pagination state for List mode
const currentPage = ref(1)
const pageSize = ref(10)

watch([searchQuery, filterStatus, displayMode], () => {
  currentPage.value = 1
})

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

const filteredProperties = computed(() => {
  return props.properties.filter(p => {
    const q = searchQuery.value.toLowerCase()
    const matchesSearch = !q ||
      p.real_estate_id.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q)
    
    const matchesStatus = isStatusMatch(p.status, filterStatus.value)

    return matchesSearch && matchesStatus
  })
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

const paginatedProperties = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedProperties.value.slice(start, start + pageSize.value)
})

// Metrics summary based on filtered properties
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

const handleCommand = (cmd: string, prop: Property) => {
  if (cmd === 'detail') {
    emit('detail', prop)
  } else if (cmd === 'edit') {
    emit('edit', prop)
  } else if (cmd === 'delete') {
    emit('delete', prop)
  } else if (cmd === 'schedule') {
    openScheduleDialog(prop)
  }
}

// Schedule notification
const scheduleModalVisible = ref(false)
const schedulePrefill = ref<any>(null)

const openScheduleDialog = (prop: Property) => {
  schedulePrefill.value = {
    notify_type: 'rental_maintenance',
    reference_id: prop.real_estate_id,
    reference_name: prop.address,
    message_template: `Nhắc nhở bảo trì BĐS\nMã BĐS: ${prop.real_estate_id}\nĐịa chỉ: ${prop.address}`,
  }
  scheduleModalVisible.value = true
}
</script>

<style scoped>
.rental-container {
  height: 100%;
}
.prop-card:hover {
  transform: translateY(-4px);
}
:deep(.el-card) {
  border-radius: 1rem;
}
:deep(.el-card__body) {
  padding: 1.5rem;
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

html.dark .custom-dark-input :deep(.el-input__wrapper) {
  background-color: #111827 !important;
  box-shadow: 0 0 0 1px #4b5563 inset !important;
}
html.dark .custom-dark-input :deep(.el-input__inner) {
  color: #f3f4f6;
}

html.dark .custom-dark-select :deep(.el-input__wrapper) {
  background-color: #111827 !important;
  box-shadow: 0 0 0 1px #4b5563 inset !important;
}
html.dark .custom-dark-select :deep(.el-input__inner) {
  color: #f3f4f6;
}
</style>
