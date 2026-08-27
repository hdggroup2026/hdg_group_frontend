<template>
  <div class="lookup-container h-full flex flex-col">
    <!-- Filter bar -->
    <div class="flex flex-wrap items-center gap-x-4 gap-y-4 mb-4 shrink-0 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <!-- Category Selection -->
      <div class="flex items-center gap-2">
        <span class="whitespace-nowrap text-sm font-medium text-gray-750 dark:text-gray-300">Mục:</span>
        <el-select
          v-model="activeCategory"
          style="width: 200px"
          class="custom-dark-select highlight-select"
          popper-class="custom-dark-select-popper"
          @change="handleCategoryChange"
        >
          <el-option label="Thu hoạch hằng ngày" value="daily_harvest" />
          <el-option label="Vật tư" value="supplies" />
          <el-option v-if="cropType === 'cao_su'" label="Thu mua hằng ngày" value="daily_purchase" />
        </el-select>
      </div>

      <!-- Time range filter -->
      <div class="flex items-center gap-2">
        <span class="whitespace-nowrap text-sm font-medium text-gray-750 dark:text-gray-300">Thời gian:</span>
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

      <!-- Household Code Input (Only for Daily Harvest) -->
      <div v-if="activeCategory === 'daily_harvest'" class="flex items-center gap-2">
        <span class="whitespace-nowrap text-sm font-medium text-gray-750 dark:text-gray-300">Mã Hộ dân:</span>
        <el-input
          v-model="householdCode"
          placeholder="Nhập mã hộ dân..."
          clearable
          class="w-48 custom-dark-input"
        />
      </div>

      <!-- Household Code Input (for Daily Purchase) -->
      <div v-if="activeCategory === 'daily_purchase'" class="flex items-center gap-2">
        <span class="whitespace-nowrap text-sm font-medium text-gray-750 dark:text-gray-300">Mã Thu Mua:</span>
        <el-input
          v-model="purchaseCodeFilter"
          placeholder="Nhập mã thu mua..."
          clearable
          class="w-48 custom-dark-input"
        />
      </div>

      <!-- Land Code Input (Only for daily_harvest and supplies) -->
      <div v-if="activeCategory !== 'daily_purchase'" class="flex items-center gap-2">
        <span class="whitespace-nowrap text-sm font-medium text-gray-750 dark:text-gray-300">Mã Đất:</span>
        <el-input
          v-model="landCode"
          placeholder="Nhập mã đất..."
          clearable
          class="w-48 custom-dark-input"
        />
      </div>

      <!-- Search Button -->
      <el-button type="primary" :icon="Search" @click="handleSearch" :loading="loading" class="ml-auto">Tìm kiếm</el-button>

      <!-- Export Report Button (for Daily Purchase) -->
      <el-button
        v-if="activeCategory === 'daily_purchase' && hasSearched && dailyPurchaseData.length > 0"
        type="success"
        :icon="Download"
        :loading="exportingReport"
        @click="exportDailyPurchaseReport"
      >
        Xuất báo cáo
      </el-button>
    </div>

    <!-- Summary Statistics Cards -->
    <div v-if="hasSearched" class="summary-cards mb-4 shrink-0">
      <!-- 1. Daily Harvest Statistics Cards -->
      <template v-if="activeCategory === 'daily_harvest'">
        <!-- Rubber (Cao su) -->
        <div v-if="cropType === 'cao_su'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="stat-card stat-card--blue">
            <div class="stat-card__label">Tổng khối lượng thu hoạch</div>
            <div class="stat-card__value text-blue-600 dark:text-blue-400">
              {{ formatWeight(totalWeight) }} Kg
            </div>
          </div>
          <div class="stat-card stat-card--emerald">
            <div class="stat-card__label">Tổng chi phí cạo mủ (Tổng thành tiền)</div>
            <div class="stat-card__value text-emerald-600 dark:text-emerald-400">
              {{ formatCurrency(totalAmount) }}
            </div>
          </div>
        </div>

        <!-- Durian (Sầu riêng) -->
        <template v-else>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="stat-card stat-card--blue">
              <div class="stat-card__label">Tổng khối lượng thu hoạch</div>
              <div class="stat-card__value text-blue-600 dark:text-blue-400">
                {{ formatWeight(totalWeight) }} Kg
              </div>
            </div>
            <div class="stat-card stat-card--indigo">
              <div class="stat-card__label">Tổng Số lượng Trái</div>
              <div class="stat-card__value text-indigo-600 dark:text-indigo-400">
                {{ formatInt(totalFruits) }} trái
              </div>
            </div>
            <div class="stat-card stat-card--emerald">
              <div class="stat-card__label">Tổng thành tiền</div>
              <div class="stat-card__value text-emerald-600 dark:text-emerald-400">
                {{ formatCurrency(totalAmount) }}
              </div>
            </div>
          </div>
          <el-collapse v-model="activeCollapseNames" class="custom-collapse border-0 mt-4">
            <el-collapse-item name="harvest_profit" title="Lợi nhuận thu hoạch">
              <div class="px-1">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="stat-card" :class="harvestProfitStats.profit >= 0 ? 'stat-card--profit-positive' : 'stat-card--profit-negative'">
                    <div class="stat-card__label">Lợi nhuận</div>
                    <div class="stat-card__value" :class="harvestProfitStats.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
                      {{ harvestProfitStats.profit >= 0 ? '+' : '' }}{{ formatCurrencyVND(harvestProfitStats.profit) }} VNĐ
                    </div>
                  </div>
                  <div class="stat-card stat-card--green">
                    <div class="stat-card__label">Tổng thành tiền (Bên thu hoạch hằng ngày)</div>
                    <div class="stat-card__value text-green-600 dark:text-green-400">{{ formatCurrencyVND(harvestProfitStats.totalHarvestAmount) }} VNĐ</div>
                  </div>
                  <div class="stat-card stat-card--red">
                    <div class="stat-card__label">Tổng chi phí (Bên vật tư)</div>
                    <div class="stat-card__value text-red-600 dark:text-red-400">{{ formatCurrencyVND(harvestProfitStats.totalSuppliesCost) }} VNĐ</div>
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </template>
      </template>

      <!-- 2. Supplies Statistics Cards -->
      <template v-else-if="activeCategory === 'supplies'">
        <div class="grid grid-cols-1 gap-4">
          <div class="stat-card stat-card--emerald">
            <div class="stat-card__label">Tổng thành tiền</div>
            <div class="stat-card__value text-emerald-600 dark:text-emerald-400">
              {{ formatCurrency(totalAmount) }}
            </div>
          </div>
        </div>
      </template>

      <!-- 3. Daily Purchase Statistics Cards -->
      <template v-else-if="activeCategory === 'daily_purchase'">
        <el-collapse v-model="activeCollapseNames" class="custom-collapse border-0">
          <el-collapse-item name="statistics" title="Thống kê tổng quan">
            <div class="space-y-4 px-1">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="stat-card stat-card--cyan">
                  <div class="stat-card__label">Tổng khối lượng</div>
                  <div class="stat-card__value text-cyan-600 dark:text-cyan-400">{{ formatNumber(purchaseStats.totalWeight) }} kg</div>
                </div>
                <div class="stat-card stat-card--blue">
                  <div class="stat-card__label">Tổng KL thực tế</div>
                  <div class="stat-card__value text-blue-600 dark:text-blue-400">{{ formatNumber(purchaseStats.totalNetWeight) }} kg</div>
                </div>
                <div class="stat-card stat-card--indigo">
                  <div class="stat-card__label">Mủ khô</div>
                  <div class="stat-card__value text-indigo-600 dark:text-indigo-400">{{ formatNumber(purchaseStats.totalDryRubber, 2) }} kg</div>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="stat-card stat-card--green">
                  <div class="stat-card__label">Tổng thành tiền</div>
                  <div class="stat-card__value text-green-600 dark:text-green-400">{{ formatCurrencyVND(purchaseStats.totalAmount) }} VNĐ</div>
                </div>
                <div class="stat-card stat-card--emerald">
                  <div class="stat-card__label">Tổng đã thanh toán</div>
                  <div class="stat-card__value text-emerald-600 dark:text-emerald-400">{{ formatCurrencyVND(purchaseStats.totalPaid) }} VNĐ</div>
                </div>
                <div class="stat-card stat-card--amber">
                  <div class="stat-card__label">Tổng lưu sổ</div>
                  <div class="stat-card__value text-amber-600 dark:text-amber-400">{{ formatCurrencyVND(purchaseStats.totalBookSaved) }} VNĐ</div>
                </div>
              </div>
            </div>
          </el-collapse-item>
          <el-collapse-item name="profit" title="Lợi nhuận thu hoạch">
            <div class="px-1">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="stat-card" :class="profitStats.profit >= 0 ? 'stat-card--profit-positive' : 'stat-card--profit-negative'">
                  <div class="stat-card__label">Lợi nhuận</div>
                  <div class="stat-card__value" :class="profitStats.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
                    {{ profitStats.profit >= 0 ? '+' : '' }}{{ formatCurrencyVND(profitStats.profit) }} VNĐ
                  </div>
                </div>
                <div class="stat-card stat-card--green">
                  <div class="stat-card__label">Tổng thành tiền (Bên thu mua)</div>
                  <div class="stat-card__value text-green-600 dark:text-green-400">{{ formatCurrencyVND(profitStats.totalPurchaseAmount) }} VNĐ</div>
                </div>
                <div class="stat-card stat-card--red">
                  <div class="stat-card__label">Tổng chi phí (Bên vật tư)</div>
                  <div class="stat-card__value text-red-600 dark:text-red-400">{{ formatCurrencyVND(profitStats.totalSuppliesCost) }} VNĐ</div>
                </div>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </template>
    </div>

    <!-- Table Results -->
    <div v-if="hasSearched" class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
      <!-- 1. Daily Harvest Table -->
      <el-table v-if="activeCategory === 'daily_harvest'" v-loading="loading" :data="paginatedData" style="width: 100%" class="flex-1" height="100%" @sort-change="handleResultSortChange">
        <!-- STT Column -->
        <el-table-column label="STT" width="60" align="center" fixed>
          <template #default="{ $index }">
            <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="day" label="Ngày" min-width="120" sortable fixed>
          <template #default="{ row }">
            <span class="font-semibold text-gray-800 dark:text-gray-200">{{ formatDate(row.day) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="household_code" label="Mã Hộ Dân" min-width="130" sortable="custom">
          <template #default="{ row }">
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.household_code }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="household_name" label="Tên Hộ Dân" min-width="160">
          <template #default="{ row }">
            <span class="font-semibold text-gray-700 dark:text-gray-300">{{ row.household_name || getHouseholdName(row.household_code) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="land_code" label="Mã Đất" min-width="120" sortable="custom">
          <template #default="{ row }">
            <span class="font-mono text-gray-500 dark:text-gray-400">{{ row.land_code || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="tree_count" :label="cropType === 'cao_su' ? 'Số cây cạo' : 'Số trái hái'" min-width="140" align="right">
          <template #default="{ row }">
            <span>{{ formatInt(row.tree_count) }} {{ cropType === 'cao_su' ? 'cây' : 'trái' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="harvest_weight" label="Khối lượng thu hoạch (Kg)" min-width="180" align="right">
          <template #default="{ row }">
            <span class="font-bold">{{ formatWeight(row.harvest_weight) }} Kg</span>
          </template>
        </el-table-column>
        <el-table-column prop="unit_price" label="Đơn giá" min-width="120" align="right">
          <template #default="{ row }">
            <span>{{ formatCurrency(row.unit_price) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="Thành tiền" min-width="170" align="right">
          <template #default="{ row }">
            <span class="text-emerald-650 dark:text-emerald-400 font-extrabold">
              {{ formatCurrency(row.total_amount) }}
            </span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 2. Supplies Table -->
      <el-table v-else-if="activeCategory === 'supplies'" v-loading="loading" :data="paginatedData" style="width: 100%" class="flex-1" height="100%" @sort-change="handleResultSortChange">
        <!-- STT Column -->
        <el-table-column label="STT" width="60" align="center" fixed>
          <template #default="{ $index }">
            <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="day" label="Ngày" min-width="120" sortable fixed>
          <template #default="{ row }">
            <span class="font-semibold text-gray-800 dark:text-gray-200">{{ formatDate(row.day) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="land_code" label="Mã đất" min-width="110" sortable="custom">
          <template #default="{ row }">
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.land_code || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="supplies_name" label="Tên vật tư" min-width="160">
          <template #default="{ row }">
            <span class="font-bold text-gray-850 dark:text-gray-100">{{ row.supplies_name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="supplier" label="Nhà cung cấp" min-width="150" show-overflow-tooltip />
        <el-table-column prop="quantity" label="Số lượng" min-width="120" align="right">
          <template #default="{ row }">
            <span>{{ formatWeight(row.quantity) }} {{ row.unit }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="unit_price" label="Đơn giá" min-width="130" align="right">
          <template #default="{ row }">
            <span>{{ formatCurrency(row.unit_price) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="Thành tiền" min-width="170" align="right">
          <template #default="{ row }">
            <span class="text-emerald-650 dark:text-emerald-400 font-extrabold">
              {{ formatCurrency(row.total_amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="purpose" label="Mục đích sử dụng" min-width="180" show-overflow-tooltip />
        <el-table-column prop="buyer" label="Người mua" min-width="130" show-overflow-tooltip />
        <el-table-column prop="notes" label="Ghi chú" min-width="150" show-overflow-tooltip />
      </el-table>

      <!-- 3. Daily Purchase Table -->
      <el-table v-else-if="activeCategory === 'daily_purchase'" v-loading="loading" :data="paginatedPurchaseData" style="width: 100%" class="flex-1" height="100%" @sort-change="handlePurchaseSortChange">
        <!-- STT Column -->
        <el-table-column label="STT" width="60" align="center" fixed>
          <template #default="{ $index }">
            <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="date" label="Ngày" min-width="110" sortable fixed>
          <template #default="{ row }">
            <span class="font-semibold text-gray-800 dark:text-gray-200">{{ formatDate(row.date) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="Mã Thu Mua" min-width="120" sortable="custom">
          <template #default="{ row }">
            <span class="font-mono font-bold text-violet-600 dark:text-violet-400">{{ row.code }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="Họ và tên" min-width="180">
          <template #default="{ row }">
            <span class="font-semibold text-gray-700 dark:text-gray-300">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="purchasingPoint" label="Điểm thu mua" min-width="150" />
        <el-table-column prop="subsidize" label="Trợ giá" min-width="120" align="right">
          <template #default="{ row }">
            <span>{{ formatCurrencyVND(row.subsidize) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="Khối lượng" min-width="120" align="right">
          <template #default="{ row }">
            <span>{{ formatNumber(row.weight) }} kg</span>
          </template>
        </el-table-column>
        <el-table-column prop="tare" label="Trừ bì" min-width="100" align="right">
          <template #default="{ row }">
            <span class="text-gray-500">{{ formatNumber(row.tare) }} kg</span>
          </template>
        </el-table-column>
        <el-table-column prop="netWeight" label="KL thực tế" min-width="130" align="right">
          <template #default="{ row }">
            <span class="font-medium text-blue-500">{{ formatNumber(row.netWeight) }} kg</span>
          </template>
        </el-table-column>
        <el-table-column prop="drc" label="Số độ" min-width="100" align="right">
          <template #default="{ row }">
            <span>{{ row.drc }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="dryRubber" label="Mủ khô" min-width="120" align="right">
          <template #default="{ row }">
            <span class="font-medium">{{ formatNumber(row.dryRubber, 2) }} kg</span>
          </template>
        </el-table-column>
        <el-table-column prop="unitPrice" label="Đơn giá" min-width="130" align="right">
          <template #default="{ row }">
            <span>{{ formatCurrencyVND(row.unitPrice) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="Thành tiền" min-width="150" align="right">
          <template #default="{ row }">
            <span class="font-bold text-green-500">{{ formatCurrencyVND(row.totalAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="paid" label="Đã thanh toán" min-width="150" align="right">
          <template #default="{ row }">
            <span class="font-medium text-emerald-500">{{ formatCurrencyVND(row.paid) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="bookSaved" label="Lưu sổ" min-width="130" align="right">
          <template #default="{ row }">
            <span class="font-medium text-amber-500">{{ formatCurrencyVND(row.bookSaved) }}</span>
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
          :total="activeCategory === 'daily_purchase' ? dailyPurchaseData.length : searchResults.length"
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
import { dinhDangSo } from '@/utils/dinhDangSo'
import { ref, computed, onMounted, watch } from 'vue'
import { Search, Download } from '@element-plus/icons-vue'
import { ElMessage, ElNotification } from 'element-plus'
import { harvestService } from '@/api/harvestService'
import { tienNgaService } from '@/api/tienNgaService'
import * as XLSX from 'xlsx-js-style'

const props = defineProps<{
  cropType: 'cao_su' | 'sau_rieng'
}>()

const activeCategory = ref<'daily_harvest' | 'supplies' | 'daily_purchase'>('daily_harvest')
const loading = ref(false)
const hasSearched = ref(false)
const dateRange = ref<[string, string] | null>(null)
const householdCode = ref('')
const landCode = ref('')
const purchaseCodeFilter = ref('')
const exportingReport = ref(false)
const activeCollapseNames = ref(['statistics'])

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

const searchResults = ref<any[]>([])
const households = ref<any[]>([])
const dailyPurchaseData = ref<any[]>([])
const suppliesExpenseData = ref<any[]>([])

// Total metrics for daily_harvest
const totalWeight = computed(() => {
  if (activeCategory.value !== 'daily_harvest') return 0
  return searchResults.value.reduce((sum, item) => {
    const val = parseFloat(item.harvest_weight)
    return sum + (isNaN(val) ? 0 : val)
  }, 0)
})

const totalFruits = computed(() => {
  if (activeCategory.value !== 'daily_harvest') return 0
  return searchResults.value.reduce((sum, item) => {
    const val = parseInt(item.tree_count, 10)
    return sum + (isNaN(val) ? 0 : val)
  }, 0)
})

const totalAmount = computed(() => {
  return searchResults.value.reduce((sum, item) => {
    const val = parseFloat(item.total_amount)
    return sum + (isNaN(val) ? 0 : val)
  }, 0)
})

// Stats for daily purchase
const purchaseStats = computed(() => {
  const data = dailyPurchaseData.value
  return {
    totalWeight: data.reduce((sum, r) => sum + (r.weight || 0), 0),
    totalNetWeight: data.reduce((sum, r) => sum + (r.netWeight || 0), 0),
    totalDryRubber: data.reduce((sum, r) => sum + (r.dryRubber || 0), 0),
    totalAmount: data.reduce((sum, r) => sum + (r.totalAmount || 0), 0),
    totalPaid: data.reduce((sum, r) => sum + (r.paid || 0), 0),
    totalBookSaved: data.reduce((sum, r) => sum + (r.bookSaved || 0), 0),
  }
})

// Profit stats: Purchase amount - Supplies cost (for daily_purchase / rubber)
const profitStats = computed(() => {
  const totalPurchaseAmount = dailyPurchaseData.value.reduce((sum, r) => sum + (r.totalAmount || 0), 0)
  const totalSuppliesCost = suppliesExpenseData.value.reduce((sum, item) => {
    const val = parseFloat(item.total_amount)
    return sum + (isNaN(val) ? 0 : val)
  }, 0)
  return {
    totalPurchaseAmount,
    totalSuppliesCost,
    profit: totalPurchaseAmount - totalSuppliesCost,
  }
})

// Harvest profit stats: daily harvest amount - Supplies cost (for daily_harvest / durian)
const harvestProfitStats = computed(() => {
  const totalHarvestAmount = searchResults.value.reduce((sum, item) => {
    const val = parseFloat(item.total_amount)
    return sum + (isNaN(val) ? 0 : val)
  }, 0)
  const totalSuppliesCost = suppliesExpenseData.value.reduce((sum, item) => {
    const val = parseFloat(item.total_amount)
    return sum + (isNaN(val) ? 0 : val)
  }, 0)
  return {
    totalHarvestAmount,
    totalSuppliesCost,
    profit: totalHarvestAmount - totalSuppliesCost,
  }
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

// Bảng Thu hoạch và Vật tư dùng chung searchResults + phân trang nên dùng chung trạng thái sắp xếp
const resultSortProp = ref('')
const resultSortOrder = ref('')

const handleResultSortChange = ({ prop, order }: { prop: string; order: string }) => {
  resultSortProp.value = prop
  resultSortOrder.value = order
  currentPage.value = 1
}

const purchaseSortProp = ref('')
const purchaseSortOrder = ref('')

const handlePurchaseSortChange = ({ prop, order }: { prop: string; order: string }) => {
  purchaseSortProp.value = prop
  purchaseSortOrder.value = order
  currentPage.value = 1
}

// Đổi loại tra cứu thì bỏ sắp xếp cũ vì mỗi bảng có bộ cột khác nhau
watch(activeCategory, () => {
  resultSortProp.value = ''
  resultSortOrder.value = ''
  purchaseSortProp.value = ''
  purchaseSortOrder.value = ''
})

const sortedResults = computed(() =>
  sortList(searchResults.value, resultSortProp.value, resultSortOrder.value)
)

const sortedPurchaseData = computed(() =>
  sortList(dailyPurchaseData.value, purchaseSortProp.value, purchaseSortOrder.value)
)

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedResults.value.slice(start, end)
})

const paginatedPurchaseData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedPurchaseData.value.slice(start, end)
})

const getHouseholdName = (code: string) => {
  const matched = households.value.find(h => h.household_code === code)
  return matched ? matched.fullname : '—'
}

// Formatters
const formatDate = (val: string) => {
  if (!val) return '—'
  const [y, m, d] = val.split('-')
  return `${d}/${m}/${y}`
}

const formatCurrency = (val: number) => {
  if (!val) return '0 VNĐ'
  return dinhDangSo(val) + ' VNĐ'
}

const formatCurrencyVND = (value: number) => {
  return dinhDangSo(value)
}

const formatInt = (val: number) => {
  return dinhDangSo(val)
}

const formatWeight = (val: number) => {
  return dinhDangSo(val)
}

const formatNumber = (value: any, _decimals?: number) => {
  // MỤC 355 — bỏ phần lẻ khi hiển thị, CẮT chứ không làm tròn.
  // Tham số `_decimals` giữ lại để 105 chỗ gọi cũ không phải sửa; nay
  // không dùng tới vì mọi số đều hiện phần nguyên.
  return dinhDangSo(value)
}

// Fetch helper data
const fetchHouseholds = async () => {
  try {
    const data = await harvestService.getHouseholds()
    households.value = data
  } catch (error) {
    console.error('Error fetching households:', error)
  }
}

// Reset state when category changes
const handleCategoryChange = () => {
  hasSearched.value = false
  searchResults.value = []
  dailyPurchaseData.value = []
  suppliesExpenseData.value = []
  currentPage.value = 1
  dateRange.value = null
  householdCode.value = ''
  landCode.value = ''
  purchaseCodeFilter.value = ''
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

    if (activeCategory.value === 'daily_harvest') {
      const params: any = {
        crop_type: props.cropType
      }
      if (start_date) params.start_date = start_date
      if (end_date) params.end_date = end_date
      if (landCode.value.trim()) params.land_code = landCode.value.trim()
      if (householdCode.value.trim()) params.household_code = householdCode.value.trim()

      // Fetch daily harvests + supplies in parallel for profit calculation
      const suppliesParams: any = { crop_type: props.cropType }
      if (start_date) suppliesParams.start_date = start_date
      if (end_date) suppliesParams.end_date = end_date
      if (landCode.value.trim()) suppliesParams.land_code = landCode.value.trim()

      const [harvestData] = await Promise.all([
        harvestService.getDailyHarvests(params),
        harvestService.getSuppliesExpenses(suppliesParams).then(data => {
          suppliesExpenseData.value = data
        }).catch(() => {
          suppliesExpenseData.value = []
        })
      ])
      searchResults.value = harvestData
    } else if (activeCategory.value === 'supplies') {
      const params: any = {
        crop_type: props.cropType
      }
      if (start_date) params.start_date = start_date
      if (end_date) params.end_date = end_date
      if (landCode.value.trim()) params.land_code = landCode.value.trim()
      const data = await harvestService.getSuppliesExpenses(params)
      searchResults.value = data
    } else if (activeCategory.value === 'daily_purchase') {
      // Fetch daily purchases + supplies in parallel for profit calculation
      const suppliesParams: any = { crop_type: props.cropType }
      if (start_date) suppliesParams.start_date = start_date
      if (end_date) suppliesParams.end_date = end_date

      await Promise.all([
        fetchDailyPurchases(start_date, end_date),
        harvestService.getSuppliesExpenses(suppliesParams).then(data => {
          suppliesExpenseData.value = data
        }).catch(() => {
          suppliesExpenseData.value = []
        })
      ])
    }
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi truy xuất dữ liệu')
  } finally {
    loading.value = false
  }
}

// Fetch daily purchases using purchase_code from households
const fetchDailyPurchases = async (start_date?: string, end_date?: string) => {
  try {
    // Get all households with purchase_code
    const householdData = await harvestService.getHouseholds({ has_purchase_code: true })
    
    // Collect all purchase codes
    const purchaseCodes = householdData
      .filter(h => h.purchase_code)
      .map(h => ({
        purchase_code: h.purchase_code,
        household_code: h.household_code,
        fullname: h.fullname
      }))

    if (purchaseCodes.length === 0) {
      dailyPurchaseData.value = []
      ElMessage.info('Không có hộ dân nào có Mã Thu Mua')
      return
    }

    // If filter by purchase code, filter the list
    let filteredCodes = purchaseCodes
    if (purchaseCodeFilter.value.trim()) {
      const filterVal = purchaseCodeFilter.value.trim().toLowerCase()
      filteredCodes = purchaseCodes.filter(pc => 
        pc.purchase_code.toLowerCase().includes(filterVal)
      )
      if (filteredCodes.length === 0) {
        dailyPurchaseData.value = []
        ElMessage.info('Không tìm thấy Mã Thu Mua phù hợp')
        return
      }
    }

    // Build params for getDailyPurchases
    const params: any = {}
    if (start_date) params.start_date = start_date
    if (end_date) params.end_date = end_date

    // Fetch all daily purchases (without filtering by household - we filter client-side)
    // If we have a specific purchase code filter, use it
    if (filteredCodes.length === 1) {
      params.hoursehold_id = filteredCodes[0]!.purchase_code
    }

    const rawPurchases = await tienNgaService.getDailyPurchases(params)

    // Create a map of purchase_code -> household info
    const purchaseCodeMap = new Map<string, { household_code: string; fullname: string }>()
    for (const pc of purchaseCodes) {
      purchaseCodeMap.set(pc.purchase_code, {
        household_code: pc.household_code,
        fullname: pc.fullname
      })
    }

    // Filter purchases that belong to our harvest households' purchase codes
    const validPurchaseCodes = new Set(filteredCodes.map(pc => pc.purchase_code))

    const mappedData = rawPurchases
      .filter(item => validPurchaseCodes.has(item.hoursehold_id))
      .map(item => ({
        id: item.id || Math.random().toString(36).substring(2, 9),
        code: item.hoursehold_id || '',
        name: item.fullname || purchaseCodeMap.get(item.hoursehold_id)?.fullname || 'Chưa rõ',
        householdCode: purchaseCodeMap.get(item.hoursehold_id)?.household_code || '',
        purchasingPoint: item.collection_name || 'Không rõ',
        date: item.day || '',
        subsidize: item.is_subsidized || 0,
        weight: item.weight || 0,
        tare: item.tare_weight || 0,
        netWeight: item.actual_weight || 0,
        drc: item.degree || 0,
        dryRubber: item.dry_rubber || 0,
        unitPrice: item.unit_price || 0,
        totalAmount: item.total_amount || 0,
        paid: item.paid_amount || 0,
        bookSaved: item.saved_amount || 0
      }))

    dailyPurchaseData.value = mappedData
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi truy xuất dữ liệu thu mua')
    dailyPurchaseData.value = []
  }
}

// =========== XUẤT BÁO CÁO THU MUA HẰNG NGÀY ===========
const exportDailyPurchaseReport = async () => {
  if (dailyPurchaseData.value.length === 0) {
    ElMessage.warning('Không có dữ liệu để xuất báo cáo.')
    return
  }

  exportingReport.value = true

  try {
    // ===== Excel Styles =====
    const headerStyle: any = {
      font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '2F5496' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      }
    }
    const totalStyle: any = {
      font: { bold: true, sz: 11 },
      fill: { fgColor: { rgb: 'FFC000' } },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      },
      alignment: { vertical: 'center' }
    }
    const cellBorder: any = {
      top: { style: 'thin', color: { rgb: 'D6DCE4' } },
      bottom: { style: 'thin', color: { rgb: 'D6DCE4' } },
      left: { style: 'thin', color: { rgb: 'D6DCE4' } },
      right: { style: 'thin', color: { rgb: 'D6DCE4' } }
    }
    const altFill: any = { fgColor: { rgb: 'D9E2F3' } }
    const numFmtVN = '#,##0'
    const numFmtKg = '#,##0.0'

    const wb = XLSX.utils.book_new()

    const fmtDate = (d: string) => {
      if (!d) return ''
      const parts = d.split('-')
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
      return d
    }

    // ===== SUMMARY SHEET (aggregated by day) =====
    const summaryHeaders = ['Ngày', 'Tổng Số Kg', 'Tổng Kg Trừ Bì', 'Tổng Mủ Khô', 'Tổng Thành Tiền', 'Tổng Đã Thanh Toán', 'Tổng Lưu Sổ']
    const summaryColWidths = [14, 16, 16, 16, 20, 20, 20]

    // Aggregate by date
    const dayMap = new Map<string, { weight: number; tare: number; dryRubber: number; totalAmount: number; paid: number; bookSaved: number }>()
    for (const r of dailyPurchaseData.value) {
      const day = r.date || ''
      if (!dayMap.has(day)) dayMap.set(day, { weight: 0, tare: 0, dryRubber: 0, totalAmount: 0, paid: 0, bookSaved: 0 })
      const agg = dayMap.get(day)!
      agg.weight += r.weight || 0
      agg.tare += r.netWeight || 0
      agg.dryRubber += r.dryRubber || 0
      agg.totalAmount += r.totalAmount || 0
      agg.paid += r.paid || 0
      agg.bookSaved += r.bookSaved || 0
    }

    const sortedDays = Array.from(dayMap.keys()).sort()
    const summaryData: any[][] = [summaryHeaders]
    let sumWeight = 0, sumTare = 0, sumDry = 0, sumAmount = 0, sumPaid = 0, sumSaved = 0

    for (const day of sortedDays) {
      const agg = dayMap.get(day)!
      summaryData.push([fmtDate(day), agg.weight, agg.tare, agg.dryRubber, agg.totalAmount, agg.paid, agg.bookSaved])
      sumWeight += agg.weight
      sumTare += agg.tare
      sumDry += agg.dryRubber
      sumAmount += agg.totalAmount
      sumPaid += agg.paid
      sumSaved += agg.bookSaved
    }

    summaryData.push(['TỔNG CỘNG', sumWeight, sumTare, sumDry, sumAmount, sumPaid, sumSaved])

    const ws = XLSX.utils.aoa_to_sheet(summaryData)
    ws['!cols'] = summaryColWidths.map(w => ({ wch: w }))

    const colCount = summaryHeaders.length
    for (let c = 0; c < colCount; c++) {
      const ref = XLSX.utils.encode_cell({ r: 0, c })
      if (ws[ref]) ws[ref].s = headerStyle
    }
    for (let i = 0; i < sortedDays.length; i++) {
      const rowIdx = i + 1
      const rowFill = i % 2 === 0 ? altFill : null
      for (let c = 0; c < colCount; c++) {
        const ref = XLSX.utils.encode_cell({ r: rowIdx, c })
        if (!ws[ref]) ws[ref] = { v: '', t: 's' }
        const style: any = { border: cellBorder, alignment: { vertical: 'center' } }
        if (rowFill) style.fill = rowFill
        if (c === 0) {
          style.alignment = { horizontal: 'center', vertical: 'center' }
        } else {
          style.alignment = { horizontal: 'right', vertical: 'center' }
          ws[ref].z = (c >= 1 && c <= 3) ? numFmtKg : numFmtVN
        }
        ws[ref].s = style
      }
    }
    const totalRowIdx = sortedDays.length + 1
    for (let c = 0; c < colCount; c++) {
      const ref = XLSX.utils.encode_cell({ r: totalRowIdx, c })
      if (!ws[ref]) ws[ref] = { v: '', t: 's' }
      const style: any = { ...totalStyle }
      if (c === 0) {
        style.alignment = { horizontal: 'center', vertical: 'center' }
      } else {
        style.alignment = { horizontal: 'right', vertical: 'center' }
        ws[ref].z = (c >= 1 && c <= 3) ? numFmtKg : numFmtVN
      }
      ws[ref].s = style
    }

    XLSX.utils.book_append_sheet(wb, ws, 'TỔNG HỢP THEO NGÀY')

    // ===== DETAIL SHEET =====
    const detailHeaders = ['Ngày', 'Mã Thu Mua', 'Tên KH', 'Mã Hộ Dân', 'KL (kg)', 'Trừ Bì (kg)', 'KL Thực Tế (kg)', 'Số Độ (%)', 'Mủ Khô (kg)', 'Đơn Giá', 'Trợ Giá', 'Thành Tiền', 'Đã TT', 'Lưu Sổ']
    const detailColWidths = [14, 14, 22, 14, 14, 14, 16, 12, 14, 14, 14, 18, 18, 18]

    const sortedRows = [...dailyPurchaseData.value].sort((a, b) => {
      const dateCompare = (a.date || '').localeCompare(b.date || '')
      if (dateCompare !== 0) return dateCompare
      return (a.code || '').localeCompare(b.code || '')
    })

    const detailData: any[][] = [detailHeaders]
    let dSumWeight = 0, dSumTare = 0, dSumActual = 0, dSumDry = 0, dSumAmount = 0, dSumPaid = 0, dSumSaved = 0

    for (const r of sortedRows) {
      const w = r.weight || 0
      const t = r.tare || 0
      const a = r.netWeight || 0
      const dr = r.dryRubber || 0
      const ta = r.totalAmount || 0
      const pd = r.paid || 0
      const sv = r.bookSaved || 0

      dSumWeight += w
      dSumTare += t
      dSumActual += a
      dSumDry += dr
      dSumAmount += ta
      dSumPaid += pd
      dSumSaved += sv

      detailData.push([fmtDate(r.date), r.code || '', r.name || '', r.householdCode || '', w, t, a, r.drc || 0, dr, r.unitPrice || 0, r.subsidize || 0, ta, pd, sv])
    }

    detailData.push(['TỔNG CỘNG', '', '', '', dSumWeight, dSumTare, dSumActual, '', dSumDry, '', '', dSumAmount, dSumPaid, dSumSaved])

    const dws = XLSX.utils.aoa_to_sheet(detailData)
    dws['!cols'] = detailColWidths.map(w => ({ wch: w }))

    const detailHeaderStyle: any = {
      font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1F4E79' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      }
    }

    const dColCount = detailHeaders.length
    for (let c = 0; c < dColCount; c++) {
      const ref = XLSX.utils.encode_cell({ r: 0, c })
      if (dws[ref]) dws[ref].s = detailHeaderStyle
    }
    for (let i = 0; i < sortedRows.length; i++) {
      const rowIdx = i + 1
      const rowFill = i % 2 === 0 ? altFill : null
      for (let c = 0; c < dColCount; c++) {
        const ref = XLSX.utils.encode_cell({ r: rowIdx, c })
        if (!dws[ref]) dws[ref] = { v: '', t: 's' }
        const style: any = { border: cellBorder, alignment: { vertical: 'center' } }
        if (rowFill) style.fill = rowFill
        if (c <= 3) {
          style.alignment = c !== 2
            ? { horizontal: 'center', vertical: 'center' }
            : { horizontal: 'left', vertical: 'center' }
        } else {
          style.alignment = { horizontal: 'right', vertical: 'center' }
          if (c >= 4 && c <= 8) {
            dws[ref].z = numFmtKg
          } else if (c >= 9) {
            dws[ref].z = numFmtVN
          }
        }
        dws[ref].s = style
      }
    }
    const dTotalRowIdx = sortedRows.length + 1
    for (let c = 0; c < dColCount; c++) {
      const ref = XLSX.utils.encode_cell({ r: dTotalRowIdx, c })
      if (!dws[ref]) dws[ref] = { v: '', t: 's' }
      const style: any = { ...totalStyle }
      if (c <= 3) {
        style.alignment = { horizontal: 'center', vertical: 'center' }
      } else {
        style.alignment = { horizontal: 'right', vertical: 'center' }
        if (c >= 4 && c <= 8) {
          dws[ref].z = numFmtKg
        } else if (c >= 9) {
          dws[ref].z = numFmtVN
        }
      }
      dws[ref].s = style
    }

    XLSX.utils.book_append_sheet(wb, dws, 'CHI TIẾT THU MUA')

    // Generate filename
    const today = new Date()
    const dateStr = `${today.getFullYear()}_${String(today.getMonth() + 1).padStart(2, '0')}_${String(today.getDate()).padStart(2, '0')}`
    const fileName = `thu_mua_hang_ngay_thu_hoach_${dateStr}.xlsx`

    XLSX.writeFile(wb, fileName)

    ElNotification({
      title: 'Xuất báo cáo thành công',
      message: `Đã xuất báo cáo thu mua hằng ngày — ${fileName}`,
      type: 'success'
    })
  } catch (error: any) {
    console.error('Export daily purchase report error:', error)
    ElMessage.error(error.message || 'Không thể xuất báo cáo')
  } finally {
    exportingReport.value = false
  }
}

onMounted(() => {
  fetchHouseholds()
})

watch(() => props.cropType, () => {
  handleCategoryChange()
})
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

html.dark .stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.stat-card--blue {
  border-left: 4px solid #3b82f6;
}

.stat-card--indigo {
  border-left: 4px solid #6366f1;
}

.stat-card--emerald {
  border-left: 4px solid #10b981;
}

.stat-card--cyan {
  border-left: 4px solid #06b6d4;
}

.stat-card--green {
  border-left: 4px solid #22c55e;
}

.stat-card--amber {
  border-left: 4px solid #f59e0b;
}

.stat-card--red {
  border-left: 4px solid #ef4444;
}

.stat-card--profit-positive {
  border-left: 4px solid #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%);
}

html.dark .stat-card--profit-positive {
  background: linear-gradient(135deg, #064e3b33 0%, #1f2937 100%);
}

.stat-card--profit-negative {
  border-left: 4px solid #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
}

html.dark .stat-card--profit-negative {
  background: linear-gradient(135deg, #7f1d1d33 0%, #1f2937 100%);
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

/* Custom Collapse styling */
.custom-collapse {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}
.custom-collapse :deep(.el-collapse-item__header) {
  padding: 0 16px;
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
}
.custom-collapse :deep(.el-collapse-item__wrap) {
  padding: 16px 8px 8px;
  border-bottom: none;
  background-color: transparent;
}
.custom-collapse :deep(.el-collapse-item__content) {
  padding-bottom: 8px;
}

/* Dark mode Collapse */
html.dark .custom-collapse {
  border-color: #374151;
}
html.dark .custom-collapse :deep(.el-collapse-item__header) {
  background-color: #1f2937;
  color: #f3f4f6;
  border-bottom-color: #374151;
}
html.dark .custom-collapse :deep(.el-collapse-item__wrap) {
  border-bottom-color: #374151;
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

.lookup-container :deep(.el-table td.el-table__cell .cell) {
  white-space: nowrap !important;
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
html.dark .custom-dark-date-picker :deep(.el-input__wrapper) {
  background-color: #1f2937;
  box-shadow: 0 0 0 1px #374151 inset;
}

html.dark .custom-dark-input :deep(.el-input__inner),
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
