<template>
  <div class="h-full bg-gray-50 dark:bg-gray-900 p-6 overflow-y-auto overflow-x-auto">
    <!-- Header của Panel 2 -->
    <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Thông tin tổng thể</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Tổng hợp số liệu tiến độ của Tiến Nga</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian:</span>
        <el-date-picker
          v-model="overallDateRange"
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

    <!-- Khung lưới chứa các thẻ Card -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- 1. Thu mua cao su -->
      <el-card shadow="hover" class="border-none rounded-xl bg-white dark:bg-gray-800">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-lg font-bold text-gray-800 dark:text-gray-100">Thu mua cao su</span>
            <div class="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <el-icon class="text-blue-500" :size="20"><Van /></el-icon>
            </div>
          </div>
        </template>
        <div class="space-y-2" v-loading="loadingYearlySummary" element-loading-text="Đang tải">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Mủ nước</div>
              <div class="text-2xl font-bold text-gray-800 dark:text-gray-100 leading-tight">{{ formatNumber(totalMuNuoc) }} <span class="text-sm font-normal text-gray-400">Kg</span></div>
            </div>
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Mủ khô</div>
              <div class="text-2xl font-bold text-gray-700 dark:text-gray-200 leading-tight">{{ formatNumber(totalMuKho) }} <span class="text-sm font-normal text-gray-400">Kg</span></div>
            </div>
          </div>
          <div class="pt-2 border-t border-gray-100 dark:border-gray-700 mt-1">
            <div class="text-xs text-gray-500 dark:text-gray-400">Tổng thành tiền</div>
            <div class="text-lg font-bold text-blue-600 dark:text-blue-400 leading-tight">{{ formatCurrency(totalThanhTien) }} <span class="text-sm font-normal text-blue-400/70">VNĐ</span></div>
          </div>
        </div>
      </el-card>

      <!-- 2. Mủ thành phẩm -->
      <el-card shadow="hover" class="border-none rounded-xl bg-white dark:bg-gray-800">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-lg font-bold text-gray-800 dark:text-gray-100">Mủ thành phẩm</span>
            <div class="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <el-icon class="text-green-500" :size="20"><Goods /></el-icon>
            </div>
          </div>
        </template>
        <div class="space-y-2" v-loading="loadingProductSummary" element-loading-text="Đang tải">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Tổng nhập kho</div>
              <div class="text-2xl font-bold text-gray-800 dark:text-gray-100 leading-tight">{{ formatNumber(totalImportQty) }} <span class="text-sm font-normal text-gray-400">Kg</span></div>
            </div>
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Tổng xuất kho</div>
              <div class="text-2xl font-bold text-gray-800 dark:text-gray-100 leading-tight">{{ formatNumber(totalExportQty) }} <span class="text-sm font-normal text-gray-400">Kg</span></div>
            </div>
          </div>
          <div class="pt-2 border-t border-gray-100 dark:border-gray-700 mt-1 space-y-1">
            <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <span>Tổng tự sản xuất</span>
              <span class="font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{{ formatNumber(totalSelfProduced) }} Kg</span>
            </div>
            <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <span>Tổng nhập từ đối tác</span>
              <span class="font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{{ formatNumber(totalPartnerImport) }} Kg</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 3. Giao dịch đối tác -->
      <el-card shadow="hover" class="border-none rounded-xl bg-white dark:bg-gray-800">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-lg font-bold text-gray-800 dark:text-gray-100">Giao dịch đối tác</span>
            <div class="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <el-icon class="text-purple-500" :size="20"><Connection /></el-icon>
            </div>
          </div>
        </template>
        <div class="space-y-2" v-loading="loadingPartnerSummary" element-loading-text="Đang tải">
          <!-- Mủ nước -->
          <div>
            <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Mủ nước</div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="text-xs text-gray-400 dark:text-gray-500">Nhập</div>
                <div class="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight">{{ formatNumber(partnerMuNuocImport) }} <span class="text-xs font-normal text-gray-400">Kg</span></div>
              </div>
              <div>
                <div class="text-xs text-gray-400 dark:text-gray-500">Xuất</div>
                <div class="text-lg font-bold text-gray-700 dark:text-gray-200 leading-tight">{{ formatNumber(partnerMuNuocExport) }} <span class="text-xs font-normal text-gray-400">Kg</span></div>
              </div>
            </div>
          </div>
          <!-- Mủ thành phẩm -->
          <div class="pt-2 border-t border-gray-100 dark:border-gray-700 mt-1">
            <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Mủ thành phẩm</div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="text-xs text-gray-400 dark:text-gray-500">Nhập</div>
                <div class="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight">{{ formatNumber(partnerProductImport) }} <span class="text-xs font-normal text-gray-400">Kg</span></div>
              </div>
              <div>
                <div class="text-xs text-gray-400 dark:text-gray-500">Xuất</div>
                <div class="text-lg font-bold text-gray-700 dark:text-gray-200 leading-tight">{{ formatNumber(partnerProductExport) }} <span class="text-xs font-normal text-gray-400">Kg</span></div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- Ẩn tạm: 3. Tài chính -->
      <!--
      <el-card shadow="hover" class="border-none rounded-xl bg-white dark:bg-gray-800">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-lg font-bold text-gray-800 dark:text-gray-100">Tài chính</span>
            <div class="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <el-icon class="text-orange-500" :size="20"><Wallet /></el-icon>
            </div>
          </div>
        </template>
        <div class="space-y-2">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Tổng thu</div>
              <div class="text-xl font-bold text-green-500 leading-tight">850,000,000 <span class="text-sm font-normal text-green-500/70">VNĐ</span></div>
            </div>
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Tổng chi</div>
              <div class="text-xl font-bold text-red-500 leading-tight">420,000,000 <span class="text-sm font-normal text-red-500/70">VNĐ</span></div>
            </div>
          </div>
          <div class="pt-2 border-t border-gray-100 dark:border-gray-700 mt-1 space-y-1">
            <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <span>Vốn ban đầu</span>
              <span class="font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">2,500,000,000 VNĐ</span>
            </div>
            <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <span>Chênh lệch</span>
              <span class="font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded">+430,000,000 VNĐ</span>
            </div>
          </div>
        </div>
      </el-card>
      -->

      <!-- Ẩn tạm: 4. Thu hoạch cao su -->
      <!--
      <el-card shadow="hover" class="border-none rounded-xl bg-white dark:bg-gray-800">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-lg font-bold text-gray-800 dark:text-gray-100">Thu hoạch cao su</span>
            <div class="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <el-icon class="text-purple-500" :size="20"><Odometer /></el-icon>
            </div>
          </div>
        </template>
        <div class="space-y-2">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Mủ nước</div>
              <div class="text-2xl font-bold text-gray-800 dark:text-gray-100 leading-tight">18,300 <span class="text-sm font-normal text-gray-400">Kg</span></div>
            </div>
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Mủ khô</div>
              <div class="text-2xl font-bold text-gray-800 dark:text-gray-100 leading-tight">6,500 <span class="text-sm font-normal text-gray-400">Kg</span></div>
            </div>
          </div>
          <div class="pt-2 border-t border-gray-100 dark:border-gray-700 mt-1 space-y-1">
            <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <span>Đang thu hoạch</span>
              <span class="font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">150 Ha</span>
            </div>
            <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <span>Đang trồng mới</span>
              <span class="font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">50 Ha</span>
            </div>
            <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <span>Diện tích trống</span>
              <span class="font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">20 Ha</span>
            </div>
          </div>
        </div>
      </el-card>
      -->
    </div>

    <!-- Biểu đồ thu mua cao su -->
    <div class="mt-6">
      <el-card shadow="hover" class="border-none rounded-xl bg-white dark:bg-gray-800">
        <template #header>
          <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <span class="text-lg font-bold text-gray-800 dark:text-gray-100">Biểu đồ thu mua cao su hằng ngày</span>
            <div class="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg overflow-x-auto">
              <template v-if="loadingCollectionPoints">
                <span class="px-3 py-1.5 text-sm text-gray-400 dark:text-gray-500 whitespace-nowrap">Đang tải...</span>
              </template>
              <template v-else>
                <button 
                  v-for="tab in purchaseChartTabs" 
                  :key="tab"
                  @click="chartFilter = tab"
                  :class="[
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                    chartFilter === tab 
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600/50'
                  ]"
                >
                  {{ tab }}
                </button>
              </template>
            </div>
          </div>
        </template>
        <!-- Custom Legend + DatePicker (cố định) -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pl-1">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-[3px] rounded-sm" style="background: #3b82f6;"></span>
              <span class="text-sm text-gray-600 dark:text-gray-300">Mủ nước</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-[3px] rounded-sm" style="background: #10b981;"></span>
              <span class="text-sm text-gray-600 dark:text-gray-300">Mủ khô</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian:</span>
            <el-date-picker
              v-model="purchaseDateRange"
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
        <!-- Biểu đồ với trục tung cố định -->
        <div v-loading="loadingPurchaseChart" element-loading-text="Đang tải" class="flex" style="height: 380px;">
          <!-- Trục tung cố định (bên trái) -->
          <div class="flex-shrink-0 overflow-hidden" style="width: 80px;">
            <VueApexCharts type="line" height="380" width="80" :options="purchaseYAxisOptions" :series="series" />
          </div>
          <!-- Biểu đồ chính (cuộn ngang) -->
          <div class="flex-1 overflow-x-auto overflow-y-hidden">
            <div :style="purchaseChartWidth > 0 ? { minWidth: purchaseChartWidth + 'px' } : {}" class="h-full">
              <VueApexCharts type="line" height="380" width="100%" :options="purchaseMainChartOptions" :series="series" />
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Biểu đồ hao hụt sản xuất -->
    <div class="mt-6">
      <el-card shadow="hover" class="border-none rounded-xl bg-white dark:bg-gray-800">
        <template #header>
          <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <span class="text-lg font-bold text-gray-800 dark:text-gray-100">Biểu đồ hao hụt sản xuất cao su</span>
            <div class="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg overflow-x-auto">
              <template v-if="loadingCollectionPoints">
                <span class="px-3 py-1.5 text-sm text-gray-400 dark:text-gray-500 whitespace-nowrap">Đang tải...</span>
              </template>
              <template v-else>
                <button 
                  v-for="tab in purchaseChartTabs" 
                  :key="'loss-' + tab"
                  @click="lossChartFilter = tab"
                  :class="[
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                    lossChartFilter === tab 
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600/50'
                  ]"
                >
                  {{ tab }}
                </button>
              </template>
            </div>
          </div>
        </template>
        <!-- Legend + DatePicker -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pl-1">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-[3px] rounded-sm" style="background: #3b82f6;"></span>
              <span class="text-sm text-gray-600 dark:text-gray-300">Hao hụt dương</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-[3px] rounded-sm" style="background: #ef4444;"></span>
              <span class="text-sm text-gray-600 dark:text-gray-300">Hao hụt âm</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian:</span>
            <el-date-picker
              v-model="lossDateRange"
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
        <!-- Biểu đồ với trục tung cố định -->
        <div v-loading="loadingLossChart" element-loading-text="Đang tải" class="flex" style="height: 380px;">
          <!-- Trục tung cố định (bên trái) -->
          <div class="flex-shrink-0 overflow-hidden" style="width: 80px;">
            <VueApexCharts type="bar" height="380" width="80" :options="lossYAxisOptions" :series="lossSeries" />
          </div>
          <!-- Biểu đồ chính (cuộn ngang) -->
          <div class="flex-1 overflow-x-auto overflow-y-hidden">
            <div :style="lossChartWidth > 0 ? { minWidth: lossChartWidth + 'px' } : {}" class="h-full">
              <VueApexCharts type="bar" height="380" width="100%" :options="lossMainChartOptions" :series="lossSeries" />
            </div>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- Ẩn tạm: Biểu đồ thu hoạch cao su và Tài chính -->
    <!--
    <div class="mt-6">
      <el-card shadow="hover" class="border-none rounded-xl bg-white dark:bg-gray-800">
        <template #header>
          <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <span class="text-lg font-bold text-gray-800 dark:text-gray-100">Biểu đồ thu hoạch cao su hằng ngày</span>
            <div class="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg overflow-x-auto">
              <button 
                v-for="tab in ['Tất cả', 'Vĩnh Hà', 'Tiến Nga']" 
                :key="tab"
                @click="chartFilter = tab"
                :class="[
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                  chartFilter === tab 
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600/50'
                ]"
              >
                {{ tab }}
              </button>
            </div>
          </div>
        </template>
        <div class="h-[350px]">
          <VueApexCharts type="line" height="350" :options="chartOptions" :series="series" />
        </div>
      </el-card>
    </div>

    <div class="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
      <el-card shadow="hover" class="border-none rounded-xl bg-white dark:bg-gray-800">
        <template #header>
          <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <span class="text-lg font-bold text-gray-800 dark:text-gray-100">Lượng chi / Lượng thu (Vốn ban đầu + thu)</span>
          </div>
        </template>
        <div class="h-[350px] flex justify-center items-center">
          <VueApexCharts type="radialBar" height="350" :options="financeRadialOptions" :series="financeRadialSeries" />
        </div>
      </el-card>

      <el-card shadow="hover" class="border-none rounded-xl bg-white dark:bg-gray-800">
        <template #header>
          <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <span class="text-lg font-bold text-gray-800 dark:text-gray-100">Phân bổ các Quỹ</span>
          </div>
        </template>
        <div class="h-[350px] flex justify-center items-center">
          <VueApexCharts type="donut" height="350" :options="fundOptions" :series="fundSeries" />
        </div>
      </el-card>

      <el-card shadow="hover" class="border-none rounded-xl bg-white dark:bg-gray-800">
        <template #header>
          <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <span class="text-lg font-bold text-gray-800 dark:text-gray-100">Tỷ trọng Thu theo Quỹ</span>
          </div>
        </template>
        <div class="h-[350px] flex justify-center items-center">
          <VueApexCharts type="donut" height="350" :options="revenueFundOptions" :series="revenueFundSeries" />
        </div>
      </el-card>
    </div>
    -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { useDark } from '@vueuse/core'
import {
  Odometer,
  Van,
  Wallet,
  Goods,
  Connection
} from '@element-plus/icons-vue'
import { tienNgaService } from '../../api/tienNgaService'

const chartFilter = ref('Tất cả')
const lossChartFilter = ref('Tất cả')

// === Date range cho biểu đồ thu mua ===
const formatDateUtil = (date: Date) => {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const getInitialPurchaseDateRange = (): [string, string] => {
  const year = new Date().getFullYear()
  return [`${year}-01-01`, `${year}-12-31`]
}

const getInitialOverallDateRange = (): [string, string] => {
  const year = new Date().getFullYear()
  return [`${year}-05-01`, `${year + 1}-03-31`]
}

const overallDateRange = ref<[string, string] | null>(getInitialOverallDateRange())
const purchaseDateRange = ref<[string, string] | null>(getInitialOverallDateRange())
const lossDateRange = ref<[string, string] | null>(getInitialOverallDateRange())

// === Collection Points (điểm thu mua) ===
interface CollectionPoint {
  id: string
  collection_name: string
  address: string
  code_prefix: string
  manager_name: string
  manager_phone: string
  notes: string
}

const collectionPoints = ref<CollectionPoint[]>([])
const loadingCollectionPoints = ref(false)

const purchaseChartTabs = computed(() => {
  return ['Tất cả', ...collectionPoints.value.map(cp => cp.collection_name)]
})

const fetchCollectionPoints = async () => {
  loadingCollectionPoints.value = true
  try {
    const data = await tienNgaService.getCollectionPoints('Cao su')
    collectionPoints.value = data
  } catch (error) {
    console.error('Failed to fetch collection points:', error)
    collectionPoints.value = []
  } finally {
    loadingCollectionPoints.value = false
  }
}

// === Daily Purchases Data ===
interface DailyPurchase {
  id: string
  hoursehold_id: string
  fullname: string
  collection_name: string
  day: string
  is_subsidized: number
  weight: number
  tare_weight: number
  actual_weight: number
  degree: number
  dry_rubber: number
  unit_price: number
  subsidy_price: number
  total_amount: number
  paid_amount: number
  saved_amount: number
  product_code: string
}

const purchaseChartCategories = ref<string[]>([])
const loadingPurchaseChart = ref(false)

// Tối đa 14 ngày hiển thị vừa khung, nếu nhiều hơn thì mở rộng để scroll
const MAX_VISIBLE_DAYS = 14
const PX_PER_DAY = 70

const purchaseChartWidth = computed(() => {
  const totalDays = purchaseChartCategories.value.length
  if (totalDays <= MAX_VISIBLE_DAYS) return 0 // 0 = auto / 100% container
  return totalDays * PX_PER_DAY
})

const fetchDailyPurchases = async () => {
  loadingPurchaseChart.value = true
  try {
    const params: any = {}

    // Truyền start_date / end_date nếu có
    if (purchaseDateRange.value && purchaseDateRange.value.length === 2) {
      params.start_date = purchaseDateRange.value[0]
      params.end_date = purchaseDateRange.value[1]
    }

    // Nếu chọn xưởng cụ thể, tìm collection_point_id tương ứng
    if (chartFilter.value !== 'Tất cả') {
      const selectedPoint = collectionPoints.value.find(
        cp => cp.collection_name === chartFilter.value
      )
      if (selectedPoint) {
        params.collection_point_id = selectedPoint.id
      }
    }

    const data: DailyPurchase[] = await tienNgaService.getDailyPurchases(params)

    // Nhóm theo ngày và tính tổng actual_weight (Mủ nước) và dry_rubber (Mủ khô)
    const groupedByDay = new Map<string, { actualWeight: number; dryRubber: number }>()

    data.forEach(item => {
      const day = item.day
      if (!groupedByDay.has(day)) {
        groupedByDay.set(day, { actualWeight: 0, dryRubber: 0 })
      }
      const group = groupedByDay.get(day)!
      group.actualWeight += item.actual_weight || 0
      group.dryRubber += item.dry_rubber || 0
    })

    // Sắp xếp theo ngày tăng dần
    const sortedDays = Array.from(groupedByDay.keys()).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    )

    // Format ngày hiển thị DD/MM
    purchaseChartCategories.value = sortedDays.map(day => {
      const d = new Date(day)
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    })

    series.value = [
      {
        name: 'Mủ nước',
        data: sortedDays.map(day => Math.round(groupedByDay.get(day)!.actualWeight * 100) / 100)
      },
      {
        name: 'Mủ khô',
        data: sortedDays.map(day => Math.round(groupedByDay.get(day)!.dryRubber * 100) / 100)
      }
    ]
  } catch (error) {
    console.error('Failed to fetch daily purchases:', error)
    purchaseChartCategories.value = []
    series.value = [
      { name: 'Mủ nước', data: [] },
      { name: 'Mủ khô', data: [] }
    ]
  } finally {
    loadingPurchaseChart.value = false
  }
}

// === Loss Chart Data ===
const lossChartCategories = ref<string[]>([])
const loadingLossChart = ref(false)

const lossChartWidth = computed(() => {
  const totalDays = lossChartCategories.value.length
  if (totalDays <= MAX_VISIBLE_DAYS) return 0
  return totalDays * PX_PER_DAY
})

const fetchLossData = async () => {
  loadingLossChart.value = true
  try {
    const params: any = {}

    // Truyền start_date / end_date
    if (lossDateRange.value && lossDateRange.value.length === 2) {
      params.start_date = lossDateRange.value[0]
      params.end_date = lossDateRange.value[1]
    }

    // Luôn gửi collection_point_id: rỗng cho Tất cả, id cụ thể cho từng xưởng
    if (lossChartFilter.value !== 'Tất cả') {
      const selectedPoint = collectionPoints.value.find(
        cp => cp.collection_name === lossChartFilter.value
      )
      if (selectedPoint) {
        params.collection_point_id = selectedPoint.id
      } else {
        params.collection_point_id = ''
      }
    } else {
      params.collection_point_id = ''
    }

    const data = await tienNgaService.processLossControl(params)
    const items = data.items || []

    // Sắp xếp theo ngày
    const sortedItems = [...items].sort(
      (a: any, b: any) => new Date(a.day).getTime() - new Date(b.day).getTime()
    )

    // Format ngày DD/MM
    lossChartCategories.value = sortedItems.map((item: any) => {
      const d = new Date(item.day)
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    })

    lossSeries.value = [
      {
        name: 'Hao hụt (%)',
        data: sortedItems.map((item: any) => Math.round((item.loss_percentage || 0) * 100) / 100)
      }
    ]
    rawLossData.value = sortedItems
  } catch (error) {
    console.error('Failed to fetch loss data:', error)
    lossChartCategories.value = []
    lossSeries.value = [{ name: 'Hao hụt (%)', data: [] }]
    rawLossData.value = []
  } finally {
    loadingLossChart.value = false
  }
}

// Watch chartFilter và purchaseDateRange để re-fetch khi chuyển tab hoặc đổi ngày
watch(chartFilter, () => {
  fetchDailyPurchases()
})

watch(purchaseDateRange, () => {
  fetchDailyPurchases()
})

watch(lossChartFilter, () => {
  fetchLossData()
})

watch(lossDateRange, () => {
  fetchLossData()
})

watch(overallDateRange, () => {
  fetchYearlySummary()
  fetchProductSummary()
  fetchPartnerSummary()
})

// === Tổng hợp thẻ Thu mua cao su (năm hiện tại) ===
const totalMuNuoc = ref(0)
const totalMuKho = ref(0)
const totalThanhTien = ref(0)
const loadingYearlySummary = ref(false)

// === Tổng hợp thẻ Mủ thành phẩm ===
const totalImportQty = ref(0)
const totalExportQty = ref(0)
const totalSelfProduced = ref(0)
const totalPartnerImport = ref(0)
const loadingProductSummary = ref(false)

// === Tổng hợp thẻ Giao dịch đối tác ===
const partnerMuNuocImport = ref(0)
const partnerMuNuocExport = ref(0)
const partnerProductImport = ref(0)
const partnerProductExport = ref(0)
const loadingPartnerSummary = ref(false)

const formatNumber = (val: number, decimals: number = 2) => {
  return val.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: decimals })
}

const formatCurrency = (val: number) => {
  return val.toLocaleString('vi-VN')
}

const fetchYearlySummary = async () => {
  if (!overallDateRange.value || !overallDateRange.value[0] || !overallDateRange.value[1]) {
    return
  }
  loadingYearlySummary.value = true
  try {
    const data = await tienNgaService.getDailyPurchases({
      start_date: overallDateRange.value[0],
      end_date: overallDateRange.value[1]
    })

    let sumMuNuoc = 0
    let sumMuKho = 0
    let sumThanhTien = 0

    data.forEach((item: any) => {
      sumMuNuoc += item.actual_weight || 0
      sumMuKho += item.dry_rubber || 0
      sumThanhTien += item.total_amount || 0
    })

    totalMuNuoc.value = Math.round(sumMuNuoc * 100) / 100
    totalMuKho.value = Math.round(sumMuKho * 100) / 100
    totalThanhTien.value = Math.round(sumThanhTien)
  } catch (error) {
    console.error('Failed to fetch yearly summary:', error)
    totalMuNuoc.value = 0
    totalMuKho.value = 0
    totalThanhTien.value = 0
  } finally {
    loadingYearlySummary.value = false
  }
}

const fetchProductSummary = async () => {
  if (!overallDateRange.value || !overallDateRange.value[0] || !overallDateRange.value[1]) {
    return
  }
  loadingProductSummary.value = true
  try {
    const data = await tienNgaService.getProductTransactions({
      start_date: overallDateRange.value[0],
      end_date: overallDateRange.value[1]
    })

    let sumImport = 0
    let sumExport = 0
    let sumSelf = 0
    let sumPartner = 0

    data.forEach((item: any) => {
      const qty = item.quantity || 0
      const tt = (item.transaction_type || '').toLowerCase()
      if (tt === 'nhập' || tt === 'import') {
        sumImport += qty
        if (item.customer_id === null || item.customer_id === '') {
          sumSelf += qty
        } else {
          sumPartner += qty
        }
      } else if (tt === 'xuất' || tt === 'export') {
        sumExport += qty
      }
    })

    totalImportQty.value = Math.round(sumImport * 100) / 100
    totalExportQty.value = Math.round(sumExport * 100) / 100
    totalSelfProduced.value = Math.round(sumSelf * 100) / 100
    totalPartnerImport.value = Math.round(sumPartner * 100) / 100
  } catch (error) {
    console.error('Failed to fetch product summary:', error)
    totalImportQty.value = 0
    totalExportQty.value = 0
    totalSelfProduced.value = 0
    totalPartnerImport.value = 0
  } finally {
    loadingProductSummary.value = false
  }
}

const fetchPartnerSummary = async () => {
  if (!overallDateRange.value || !overallDateRange.value[0] || !overallDateRange.value[1]) {
    return
  }
  loadingPartnerSummary.value = true
  try {
    const data = await tienNgaService.getPartnerBusinesses({
      start_date: overallDateRange.value[0],
      end_date: overallDateRange.value[1]
    })

    let muNuocImport = 0
    let muNuocExport = 0
    let productImport = 0
    let productExport = 0

    data.forEach((item: any) => {
      const pType = item.product_type || ''
      const imp = item.import_amount || 0
      const exp = item.export_amount || 0

      if (pType === 'Mủ nước') {
        muNuocImport += imp
        muNuocExport += exp
      } else if (pType === 'Mủ thành phẩm' || pType === 'Cao su RSS3') {
        productImport += imp
        productExport += exp
      }
    })

    partnerMuNuocImport.value = Math.round(muNuocImport * 100) / 100
    partnerMuNuocExport.value = Math.round(muNuocExport * 100) / 100
    partnerProductImport.value = Math.round(productImport * 100) / 100
    partnerProductExport.value = Math.round(productExport * 100) / 100
  } catch (error) {
    console.error('Failed to fetch partner summary:', error)
    partnerMuNuocImport.value = 0
    partnerMuNuocExport.value = 0
    partnerProductImport.value = 0
    partnerProductExport.value = 0
  } finally {
    loadingPartnerSummary.value = false
  }
}

onMounted(async () => {
  await fetchCollectionPoints()
  fetchDailyPurchases()
  fetchLossData()
  fetchYearlySummary()
  fetchProductSummary()
  fetchPartnerSummary()
})

// === Cấu hình Biểu đồ ===
const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: '',
})

const series = ref([
  { name: 'Mủ nước', data: [] as number[] },
  { name: 'Mủ khô', data: [] as number[] }
])

// === Biểu đồ thu mua: Trục tung cố định (chỉ hiển thị Y-axis) ===
const purchaseYAxisOptions = computed(() => {
  return {
    chart: {
      type: 'line' as const,
      fontFamily: 'inherit',
      toolbar: { show: false },
      zoom: { enabled: false },
      background: 'transparent',
      sparkline: { enabled: false },
      accessibility: { enabled: false }
    },
    colors: ['transparent', 'transparent'],
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    markers: { size: 0 },
    grid: { show: false },
    xaxis: {
      categories: purchaseChartCategories.value,
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
      title: { text: '' }
    },
    yaxis: {
      title: {
        text: 'Kg',
        style: { color: isDark.value ? '#9ca3af' : '#6b7280', fontSize: '11px' }
      },
      labels: {
        style: { colors: isDark.value ? '#9ca3af' : '#6b7280', fontSize: '11px' },
        formatter: (val: number) => {
          if (val >= 1000) return (val / 1000).toFixed(1) + 'k'
          return val.toLocaleString()
        }
      }
    },
    legend: { show: false },
    tooltip: { enabled: false },
    theme: {
      mode: (isDark.value ? 'dark' : 'light') as 'dark' | 'light'
    }
  }
})

// === Biểu đồ thu mua: Phần chính cuộn ngang (không có Y-axis labels và legend) ===
const purchaseMainChartOptions = computed(() => {
  return {
    chart: {
      type: 'line' as const,
      fontFamily: 'inherit',
      toolbar: { show: true },
      zoom: { enabled: false },
      background: 'transparent',
      accessibility: { enabled: false }
    },
    colors: ['#3b82f6', '#10b981'],
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth' as const,
      width: 3
    },
    grid: {
      borderColor: isDark.value ? '#374151' : '#e5e7eb',
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } }
    },
    markers: {
      size: 4,
      hover: { sizeOffset: 2 }
    },
    xaxis: {
      categories: purchaseChartCategories.value,
      title: {
        text: 'Thời gian (Ngày)',
        style: { color: isDark.value ? '#9ca3af' : '#6b7280' }
      },
      labels: {
        style: { colors: isDark.value ? '#9ca3af' : '#6b7280' }
      }
    },
    yaxis: {
      labels: { show: false },
      title: { text: '' }
    },
    legend: { show: false },
    theme: {
      mode: (isDark.value ? 'dark' : 'light') as 'dark' | 'light'
    },
    tooltip: {
      theme: isDark.value ? 'dark' as const : 'light' as const,
      y: {
        formatter: function (val: number) {
          return val.toLocaleString() + " Kg"
        }
      }
    }
  }
})

// === Biểu đồ thu hoạch (giữ nguyên chartOptions cho biểu đồ khác) ===
const chartOptions = computed(() => {
  return {
    chart: {
      type: 'line' as const,
      fontFamily: 'inherit',
      toolbar: { show: true },
      zoom: { enabled: false },
      background: 'transparent',
      accessibility: { enabled: false }
    },
    colors: ['#3b82f6', '#10b981'],
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth' as const,
      width: 3
    },
    grid: {
      borderColor: isDark.value ? '#374151' : '#e5e7eb',
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } }
    },
    markers: {
      size: 4,
      hover: { sizeOffset: 2 }
    },
    xaxis: {
      categories: purchaseChartCategories.value,
      title: {
        text: 'Thời gian (Ngày)',
        style: { color: isDark.value ? '#9ca3af' : '#6b7280' }
      },
      labels: {
        style: { colors: isDark.value ? '#9ca3af' : '#6b7280' }
      }
    },
    yaxis: {
      title: {
        text: 'Khối lượng (Kg)',
        style: { color: isDark.value ? '#9ca3af' : '#6b7280' }
      },
      labels: {
        style: { colors: isDark.value ? '#9ca3af' : '#6b7280' },
        formatter: (val: number) => {
          return val.toLocaleString() + ' Kg'
        }
      }
    },
    legend: {
      position: 'top' as const,
      horizontalAlign: 'left' as const,
      itemMargin: {
        horizontal: 10,
        vertical: 0
      },
      labels: { colors: isDark.value ? '#f3f4f6' : '#374151' }
    },
    theme: {
      mode: (isDark.value ? 'dark' : 'light') as 'dark' | 'light'
    },
    tooltip: {
      theme: isDark.value ? 'dark' as const : 'light' as const,
      y: {
        formatter: function (val: number) {
          return val.toLocaleString() + " Kg"
        }
      }
    }
  }
})

// === Cấu hình Biểu đồ Hao hụt ===
const lossSeries = ref([
  { name: 'Hao hụt (%)', data: [] as number[] }
])
const rawLossData = ref<any[]>([])

// Trục tung cố định cho biểu đồ hao hụt
const lossYAxisOptions = computed(() => {
  return {
    chart: {
      type: 'bar' as const,
      fontFamily: 'inherit',
      toolbar: { show: false },
      background: 'transparent',
      accessibility: { enabled: false }
    },
    colors: ['transparent'],
    plotOptions: {
      bar: {
        columnWidth: '60%',
        borderRadius: 4,
      }
    },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    grid: { show: false },
    xaxis: {
      categories: lossChartCategories.value,
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
      title: { text: '' }
    },
    yaxis: {
      title: {
        text: '%',
        style: { color: isDark.value ? '#9ca3af' : '#6b7280', fontSize: '11px' }
      },
      labels: {
        style: { colors: isDark.value ? '#9ca3af' : '#6b7280', fontSize: '11px' },
        formatter: (val: number) => val + '%'
      }
    },
    legend: { show: false },
    tooltip: { enabled: false },
    theme: {
      mode: (isDark.value ? 'dark' : 'light') as 'dark' | 'light'
    }
  }
})

// Phần chính cuộn ngang cho biểu đồ hao hụt
const lossMainChartOptions = computed(() => {
  return {
    chart: {
      type: 'bar' as const,
      fontFamily: 'inherit',
      toolbar: { show: true },
      background: 'transparent',
      accessibility: { enabled: false }
    },
    plotOptions: {
      bar: {
        colors: {
          ranges: [
            {
              from: -100,
              to: 0,
              color: '#ef4444'
            },
            {
              from: 0.01,
              to: 100,
              color: '#3b82f6'
            }
          ]
        },
        columnWidth: '60%',
        borderRadius: 4,
      }
    },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    grid: {
      borderColor: isDark.value ? '#374151' : '#e5e7eb',
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } }
    },
    xaxis: {
      categories: lossChartCategories.value,
      title: { text: '' },
      labels: {
        style: { colors: isDark.value ? '#9ca3af' : '#6b7280' }
      }
    },
    yaxis: {
      labels: { show: false },
      title: { text: '' }
    },
    legend: { show: false },
    theme: {
      mode: (isDark.value ? 'dark' : 'light') as 'dark' | 'light'
    },
    tooltip: {
      theme: isDark.value ? 'dark' as const : 'light' as const,
      custom: function ({ series, seriesIndex, dataPointIndex, w }: any) {
        const item = rawLossData.value[dataPointIndex]
        if (!item) return ''
        
        const dayStr = lossChartCategories.value[dataPointIndex]
        const percentage = series[seriesIndex][dataPointIndex]
        const lossKg = Math.round((item.total_dry_rubber - item.total_import_quantity) * 100) / 100
        
        const isNegative = percentage < 0
        const dotColor = isNegative ? '#ef4444' : '#3b82f6'
        
        return `
          <div class="apexcharts-tooltip-title" style="font-family: inherit; font-size: 12px; font-weight: 600; padding: 6px 10px;">Ngày ${dayStr}</div>
          <div class="apexcharts-tooltip-series-group apexcharts-active" style="display: flex; flex-direction: column; align-items: flex-start; padding: 6px 10px; gap: 4px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="apexcharts-tooltip-marker" style="background-color: ${dotColor}; width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 0;"></span>
              <span class="apexcharts-tooltip-text-y-label" style="font-size: 12px;">Hao hụt (%): </span>
              <span class="apexcharts-tooltip-text-y-value" style="font-weight: 600; font-size: 12px;">${percentage}%</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; margin-left: 18px;">
              <span class="apexcharts-tooltip-text-y-label" style="font-size: 12px;">Mủ khô hao hụt: </span>
              <span class="apexcharts-tooltip-text-y-value" style="font-weight: 600; font-size: 12px;">${formatNumber(lossKg)} Kg</span>
            </div>
          </div>
        `
      }
    }
  }
})

// === Cấu hình Biểu đồ RadialBar Tài chính ===
const financeRadialSeries = ref([45, 60, 25, 80, 50]) // Tỷ lệ Chi/Thu (%) của 5 quỹ

const financeRadialOptions = computed(() => {
  return {
    chart: {
      type: 'radialBar' as const,
      fontFamily: 'inherit',
      background: 'transparent',
    },
    plotOptions: {
      radialBar: {
        hollow: {
          size: '60%', // Thu nhỏ phần rỗng ở giữa để vòng có thể dày hơn
        },
        track: {
          margin: 1, // Thêm khoảng cách giữa các vòng
        },
        dataLabels: {
          name: {
            fontSize: '14px',
          },
          value: {
            fontSize: '14px',
            color: isDark.value ? '#9ca3af' : '#6b7280',
            formatter: function (val: number) {
              return val + '%'
            }
          },
          total: {
            show: true,
            label: 'Trung bình',
            color: isDark.value ? '#f3f4f6' : '#374151',
            formatter: function (w: any) {
              return '69%'
            }
          }
        }
      }
    },
    labels: [
      'Quỹ TM tại xưởng', 
      'Quỹ An Bình Bank', 
      'Quỹ TM kế toán', 
      'Quỹ Vietcombank', 
      'Quỹ Agribank'
    ],
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'],
    legend: {
      show: true,
      position: 'bottom' as const,
      labels: {
        colors: isDark.value ? '#9ca3af' : '#4b5563'
      }
    },
    theme: {
      mode: (isDark.value ? 'dark' : 'light') as 'dark' | 'light'
    }
  }
})

// === Cấu hình Biểu đồ Phân bổ Quỹ ===
const fundSeries = ref([500, 1200, 300, 800, 550]) // đơn vị triệu VNĐ

const fundOptions = computed(() => {
  return {
    chart: {
      type: 'donut' as const,
      fontFamily: 'inherit',
      background: 'transparent',
    },
    labels: [
      'Quỹ TM tại xưởng', 
      'Quỹ An Bình Bank', 
      'Quỹ TM kế toán', 
      'Quỹ Vietcombank', 
      'Quỹ Agribank'
    ],
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'],
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              fontSize: '14px',
              color: isDark.value ? '#9ca3af' : '#6b7280'
            },
            value: {
              fontSize: '18px',
              fontWeight: 'bold',
              color: isDark.value ? '#f3f4f6' : '#111827',
              formatter: function (val: number) {
                return val + ' Tr'
              }
            },
            total: {
              show: true,
              label: 'Tổng Quỹ',
              color: isDark.value ? '#9ca3af' : '#6b7280',
              formatter: function (w: any) {
                const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)
                return total + ' Tr'
              }
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: isDark.value ? 0 : 2,
      colors: isDark.value ? [] : ['#ffffff']
    },
    legend: {
      position: 'bottom' as const,
      labels: {
        colors: isDark.value ? '#9ca3af' : '#4b5563'
      }
    },
    theme: {
      mode: (isDark.value ? 'dark' : 'light') as 'dark' | 'light'
    },
    tooltip: {
      theme: isDark.value ? 'dark' as const : 'light' as const,
      y: {
        formatter: function (val: number) {
          return val.toLocaleString() + " Triệu VNĐ"
        }
      }
    }
  }
})

// === Cấu hình Biểu đồ Tỷ trọng Thu theo Quỹ ===
const revenueFundSeries = ref([150, 400, 50, 200, 100]) // Lượng thu của từng quỹ (triệu VNĐ)

const revenueFundOptions = computed(() => {
  return {
    chart: {
      type: 'donut' as const,
      fontFamily: 'inherit',
      background: 'transparent',
    },
    labels: [
      'Quỹ TM tại xưởng', 
      'Quỹ An Bình Bank', 
      'Quỹ TM kế toán', 
      'Quỹ Vietcombank', 
      'Quỹ Agribank'
    ],
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'],
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              fontSize: '14px',
              color: isDark.value ? '#9ca3af' : '#6b7280'
            },
            value: {
              fontSize: '18px',
              fontWeight: 'bold',
              color: isDark.value ? '#f3f4f6' : '#111827',
              formatter: function (val: number) {
                return val + ' Tr'
              }
            },
            total: {
              show: true,
              label: 'Tổng Thu',
              color: isDark.value ? '#9ca3af' : '#6b7280',
              formatter: function (w: any) {
                const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)
                return total + ' Tr'
              }
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val.toFixed(1) + "%"
      }
    },
    stroke: {
      width: isDark.value ? 0 : 2,
      colors: isDark.value ? [] : ['#ffffff']
    },
    legend: {
      position: 'bottom' as const,
      labels: {
        colors: isDark.value ? '#9ca3af' : '#4b5563'
      }
    },
    theme: {
      mode: (isDark.value ? 'dark' : 'light') as 'dark' | 'light'
    },
    tooltip: {
      theme: isDark.value ? 'dark' as const : 'light' as const,
      y: {
        formatter: function (val: number) {
          return val.toLocaleString() + " Triệu VNĐ"
        }
      }
    }
  }
})
</script>
