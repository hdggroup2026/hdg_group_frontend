<template>
  <div class="rental-module-container h-full p-4 bg-gray-50 dark:bg-gray-900">
    <el-tabs v-model="activeTab" type="border-card" class="rental-tabs h-full flex flex-col">
      <!-- Tab 1: Bất động sản (Cards) -->
      <el-tab-pane name="cards">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><OfficeBuilding /></el-icon>
            <span>Bất động sản</span>
          </span>
        </template>
        <RealEstateCards
          :properties="properties"
          @add="openAddDialog"
          @refresh="fetchProperties"
          @edit="openEditDialog"
          @delete="handleDelete"
          @detail="openDetailDialog"
        />
      </el-tab-pane>

      <!-- Tab 2: Truy xuất thông tin (Table) -->
      <el-tab-pane name="query">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Search /></el-icon>
            <span>Truy xuất thông tin</span>
          </span>
        </template>
        <RealEstateTableQuery :properties="properties" />
      </el-tab-pane>
    </el-tabs>

    <!-- Add/Edit RealEstate Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'CHỈNH SỬA THÔNG TIN BẤT ĐỘNG SẢN' : 'THÊM MỚI BẤT ĐỘNG SẢN'"
      width="900px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="170px" class="mt-2 compact-form">
          
          <!-- PHẦN 1: THÔNG TIN CHUNG -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin chung
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã BĐS" prop="real_estate_id">
                  <el-input v-model="form.real_estate_id" placeholder="Mã BĐS (real_estate_id)..." :disabled="isEdit" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tình trạng" prop="status">
                  <el-select v-model="form.status" style="width: 100%" class="highlight-select">
                    <el-option label="Đang ở" value="living" />
                    <el-option label="Đang cho thuê" value="rented" />
                    <el-option label="Tự khai thác" value="self_exploited" />
                    <el-option label="Để trống" value="vacant" />
                    <el-option label="Thanh toán góp" value="installment" />
                    <el-option label="Vướng pháp lý" value="legal_issues" />
                    <el-option label="Đã bán" value="sold" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Địa chỉ" prop="address">
                  <el-input v-model="form.address" placeholder="Địa chỉ chi tiết..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ghi chú" prop="note">
                  <el-input v-model="form.note" type="textarea" :rows="2" placeholder="Ghi chú thêm..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: THÔNG TIN MUA VÀ ĐẦU TƯ -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Thông tin Mua & Đầu tư
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Ngày bắt đầu mua" prop="start_buy">
                  <el-date-picker :editable="false" v-model="form.start_buy" type="date" placeholder="Chọn ngày" format="DD/MM/YYYY" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ngày kết thúc mua" prop="end_buy">
                  <el-date-picker :editable="false" v-model="form.end_buy" type="date" placeholder="Chọn ngày" format="DD/MM/YYYY" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tổng đầu tư (VNĐ)">
                  <el-input v-model="form.total_cost_text" placeholder="Nhập số tiền..." @input="(v) => handlePriceInput(v, 'total_cost')">
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tiền Bất động sản (VNĐ)">
                  <el-input v-model="form.real_estate_cost_text" placeholder="Nhập số tiền..." @input="(v) => handlePriceInput(v, 'real_estate_cost')">
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tiền xây dựng (VNĐ)">
                  <el-input v-model="form.construction_cost_text" placeholder="Nhập số tiền..." @input="(v) => handlePriceInput(v, 'construction_cost')">
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tiền nội thất (VNĐ)">
                  <el-input v-model="form.furniture_cost_text" placeholder="Nhập số tiền..." @input="(v) => handlePriceInput(v, 'furniture_cost')">
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 3: KHAI THÁC VÀ BÁN RA -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-rose-500 rounded-full"></span>
              Thông tin Khai thác & Bán ra
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Lợi nhuận khai thác">
                  <el-input v-model="form.mining_profit_text" placeholder="Nhập số tiền..." @input="(v) => handlePriceInput(v, 'mining_profit')">
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Lợi nhuận cho thuê">
                  <el-input v-model="form.rental_profit_text" placeholder="Nhập số tiền..." @input="(v) => handlePriceInput(v, 'rental_profit')">
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Giá tạm tính hiện tại">
                  <el-input v-model="form.current_estimated_text" placeholder="Nhập số tiền..." @input="(v) => handlePriceInput(v, 'current_estimated')">
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tiền bán ra (sale_cost)">
                  <el-input v-model="form.sale_cost_text" placeholder="Nhập số tiền..." @input="(v) => handlePriceInput(v, 'sale_cost')">
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Ngày bắt đầu bán" prop="start_sale">
                  <el-date-picker :editable="false" v-model="form.start_sale" type="date" placeholder="Chọn ngày" format="DD/MM/YYYY" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ngày kết thúc bán" prop="end_sale">
                  <el-date-picker :editable="false" v-model="form.end_sale" type="date" placeholder="Chọn ngày" format="DD/MM/YYYY" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Bán ra sau thuế (VNĐ)">
                  <el-input v-model="form.profit_after_tax_text" placeholder="Nhập số tiền..." @input="(v) => handlePriceInput(v, 'profit_after_tax')">
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Lợi nhuận sau bán (VNĐ)">
                  <el-input v-model="form.profit_after_sale_text" placeholder="Tự động tính..." disabled>
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Lãi suất / Tháng (%)">
                  <el-input-number v-model="form.monthly_interest_rate" :min="0" :max="100" :precision="2" style="width: 100%" controls-position="right" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">Hủy</el-button>
          <el-button type="primary" @click="submitForm">Xác nhận</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Real Estate Details Dialog -->
    <el-dialog 
      v-model="detailDialogVisible" 
      title="CHI TIẾT THÔNG TIN BẤT ĐỘNG SẢN" 
      width="850px" 
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedProperty" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto overflow-x-hidden text-left">
        <!-- Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-blue-500 dark:bg-blue-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32">
              <OfficeBuilding />
            </el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-left">Bất động sản</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5 text-left">
              {{ selectedProperty.real_estate_id }}
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span class="flex items-center gap-1">
                <el-icon><Location /></el-icon>
                {{ selectedProperty.address }}
              </span>
            </div>
          </div>
        </div>

        <!-- 1. THÔNG TIN CHUNG -->
        <div>
          <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            Thông tin chung
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã BĐS</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedProperty.real_estate_id }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tình trạng</div>
              <el-tag :type="getStatusTag(selectedProperty.status)" effect="light" size="small" class="capitalize">
                {{ getStatusText(selectedProperty.status) }}
              </el-tag>
            </div>
            <div class="col-span-2 md:col-span-1">
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Địa chỉ</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedProperty.address }}</div>
            </div>
          </div>
          <div class="mt-4">
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ghi chú</div>
            <div class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ selectedProperty.note || '—' }}</div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 2. THÔNG TIN MUA VÀ ĐẦU TƯ -->
        <div>
          <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
            Thông tin Mua & Đầu tư
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Bắt đầu mua</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatDate(selectedProperty.start_buy) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Kết thúc mua</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatDate(selectedProperty.end_buy) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Lãi suất / Tháng</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">
                {{ selectedProperty.monthly_interest_rate ? `${selectedProperty.monthly_interest_rate}%` : '0%' }}
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 font-bold text-emerald-600 dark:text-emerald-400">Tổng đầu tư</div>
              <div class="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{{ formatCurrency(selectedProperty.total_cost) }}</div>
            </div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4 pt-4 border-t border-dashed border-gray-100 dark:border-gray-800">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tiền Bất động sản</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatCurrency(selectedProperty.real_estate_cost) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tiền xây dựng</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatCurrency(selectedProperty.construction_cost) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tiền nội thất</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatCurrency(selectedProperty.furniture_cost) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tiền đã góp</div>
              <div class="text-sm font-bold text-blue-600 dark:text-blue-400">{{ formatCurrency(selectedProperty.contributed_cost) }}</div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 3. KHAI THÁC VÀ BÁN RA -->
        <div>
          <h4 class="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-rose-500 rounded-full"></span>
            Thông tin Khai thác & Bán ra
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">LN Khai thác</div>
              <div class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">+{{ formatCurrency(selectedProperty.mining_profit) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">LN Cho thuê</div>
              <div class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">+{{ formatCurrency(selectedProperty.rental_profit) }}</div>
            </div>
            <div class="col-span-2">
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Giá tạm tính hiện tại</div>
              <div class="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{{ formatCurrency(selectedProperty.current_estimated) }}</div>
            </div>
          </div>
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4 pt-4 border-t border-dashed border-gray-100 dark:border-gray-800">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Bắt đầu bán</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatDate(selectedProperty.start_sale) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Kết thúc bán</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatDate(selectedProperty.end_sale) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tiền bán ra</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatCurrency(selectedProperty.sale_cost) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Bán ra sau thuế</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatCurrency(selectedProperty.profit_after_tax) }}</div>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-6 mt-4">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 font-bold text-violet-600 dark:text-violet-400">Lợi nhuận sau bán</div>
              <div class="text-sm font-extrabold text-violet-600 dark:text-violet-400">{{ formatCurrency(selectedProperty.profit_after_sale) }}</div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="detailDialogVisible = false">Đóng</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, inject, watch } from 'vue'
import { refTabBenVung } from '@/composables/tabBenVung'  // MỤC 423
import { OfficeBuilding, Search, Location } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import RealEstateCards from './RealEstateCards.vue'
import RealEstateTableQuery from './RealEstateTableQuery.vue'
import { rentalService } from '@/api/rentalService'

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

const activeTab = refTabBenVung('rental/realestate', 'cards')  // MỤC 423

// Shared reactive properties list state
const properties = ref<Property[]>([])

// Dialog control state
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<any>(null)

// Detail Dialog state
const detailDialogVisible = ref(false)
const selectedProperty = ref<Property | null>(null)

const openDetailDialog = (row: Property) => {
  selectedProperty.value = row
  detailDialogVisible.value = true
}

const getStatusTag = (status: string) => {
  if (status === 'living') return 'success'
  if (status === 'rented') return 'success'
  if (status === 'self_exploited') return 'warning'
  if (status === 'vacant') return 'primary'
  if (status === 'installment') return 'info'
  if (status === 'legal_issues') return 'danger'
  if (status === 'sold') return 'danger'
  
  // Fallbacks for old values
  if (status === 'occupied') return 'success'
  if (status === 'selling') return 'warning'
  return 'info'
}

const getStatusText = (status: string) => {
  if (status === 'living') return 'Đang ở'
  if (status === 'rented') return 'Đang cho thuê'
  if (status === 'self_exploited') return 'Tự khai thác'
  if (status === 'vacant') return 'Để trống'
  if (status === 'installment') return 'Thanh toán góp'
  if (status === 'legal_issues') return 'Vướng pháp lý'
  if (status === 'sold') return 'Đã bán'
  
  // Fallbacks for old values
  if (status === 'occupied') return 'Đang cho thuê'
  if (status === 'selling') return 'Đang bán'
  if (status === 'maintenance') return 'Bảo trì'
  return status || '—'
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

// Form fields matching schema
const form = reactive({
  id: '',
  real_estate_id: '',
  address: '',
  start_buy: '',
  end_buy: '',
  total_cost: 0,
  total_cost_text: '',
  real_estate_cost: 0,
  real_estate_cost_text: '',
  construction_cost: 0,
  construction_cost_text: '',
  furniture_cost: 0,
  furniture_cost_text: '',
  sale_cost: 0,
  sale_cost_text: '',
  contributed_cost: 0,
  contributed_cost_text: '',
  monthly_interest_rate: 0.0,
  mining_profit: 0,
  mining_profit_text: '',
  rental_profit: 0,
  rental_profit_text: '',
  start_sale: '',
  end_sale: '',
  profit_after_tax: 0,
  profit_after_tax_text: '',
  profit_after_sale: 0,
  profit_after_sale_text: '',
  status: 'vacant',
  note: '',
  current_estimated: 0,
  current_estimated_text: ''
})

const rules = reactive({
  real_estate_id: [{ required: true, message: 'Vui lòng nhập mã BĐS', trigger: 'blur' }],
  address: [{ required: true, message: 'Vui lòng nhập địa chỉ', trigger: 'blur' }]
})

// Auto-calculate profit_after_sale = profit_after_tax + mining_profit - total_cost
watch(
  () => [form.profit_after_tax, form.mining_profit, form.total_cost],
  ([tax, mining, total]) => {
    const profit = (tax || 0) + (mining || 0) - (total || 0)
    form.profit_after_sale = profit
    form.profit_after_sale_text = new Intl.NumberFormat('vi-VN').format(profit)
  }
)

// Handles formatting of currency inputs
const handlePriceInput = (val: string, field: string) => {
  const numericVal = val.replace(/[^0-9]/g, '')
  const num = parseInt(numericVal, 10)
  const formAny = form as any
  if (!isNaN(num)) {
    formAny[field] = num
    formAny[`${field}_text`] = new Intl.NumberFormat('vi-VN').format(num)
  } else {
    formAny[field] = 0
    formAny[`${field}_text`] = ''
  }
}

const openAddDialog = () => {
  isEdit.value = false
  form.id = ''
  form.real_estate_id = ''
  form.address = ''
  form.start_buy = new Date().toISOString().substring(0, 10)
  form.end_buy = ''
  
  // Clean all costs
  const fields = [
    'total_cost', 'real_estate_cost', 'construction_cost', 'furniture_cost',
    'sale_cost', 'contributed_cost', 'mining_profit', 'rental_profit',
    'profit_after_tax', 'profit_after_sale', 'current_estimated'
  ]
  const formAny = form as any
  fields.forEach(f => {
    formAny[f] = 0
    formAny[`${f}_text`] = ''
  })
  
  form.monthly_interest_rate = 0.0
  form.status = 'vacant'
  form.note = ''
  dialogVisible.value = true
}

const openEditDialog = (row: Property) => {
  isEdit.value = true
  form.id = row.id
  form.real_estate_id = row.real_estate_id
  form.address = row.address
  form.start_buy = row.start_buy
  form.end_buy = row.end_buy
  
  // Fill values and format strings
  const fields = [
    'total_cost', 'real_estate_cost', 'construction_cost', 'furniture_cost',
    'sale_cost', 'contributed_cost', 'mining_profit', 'rental_profit',
    'profit_after_tax', 'profit_after_sale', 'current_estimated'
  ]
  const formAny = form as any
  const rowAny = row as any
  fields.forEach(f => {
    const val = rowAny[f] || 0
    formAny[f] = val
    formAny[`${f}_text`] = val ? new Intl.NumberFormat('vi-VN').format(val) : ''
  })

  form.monthly_interest_rate = row.monthly_interest_rate || 0
  form.start_sale = row.start_sale || ''
  form.end_sale = row.end_sale || ''
  form.status = row.status
  form.note = row.note || ''
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      const cleanDate = (d: string) => d ? d : null
      
      const payload: any = {
        real_estate_id: form.real_estate_id,
        address: form.address,
        start_buy: cleanDate(form.start_buy),
        end_buy: cleanDate(form.end_buy),
        total_cost: form.total_cost,
        real_estate_cost: form.real_estate_cost,
        construction_cost: form.construction_cost,
        furniture_cost: form.furniture_cost,
        sale_cost: form.sale_cost,
        contributed_cost: form.contributed_cost,
        monthly_interest_rate: form.monthly_interest_rate,
        mining_profit: form.mining_profit,
        rental_profit: form.rental_profit,
        start_sale: cleanDate(form.start_sale),
        end_sale: cleanDate(form.end_sale),
        profit_after_tax: form.profit_after_tax,
        profit_after_sale: form.profit_after_sale,
        status: form.status,
        note: form.note,
        current_estimated: form.current_estimated
      }

      if (isEdit.value) {
        if (setLoading) setLoading(true)
        try {
          const editPayload = { ...payload, id: form.id }
          const updatedRealEstates = await rentalService.updateRealEstates([editPayload])
          if (updatedRealEstates && updatedRealEstates.length > 0) {
            const index = properties.value.findIndex(p => p.id === form.id)
            if (index !== -1) {
              properties.value[index] = updatedRealEstates[0]
            }
            ElMessage.success('Cập nhật thông tin bất động sản thành công!')
            dialogVisible.value = false
          } else {
            ElMessage.error('Không nhận được phản hồi từ server')
          }
        } catch (error: any) {
          ElMessage.error(error.message || 'Lỗi khi cập nhật bất động sản')
        } finally {
          if (setLoading) setLoading(false)
        }
      } else {
        if (setLoading) setLoading(true)
        try {
          const addedRealEstates = await rentalService.addRealEstates([payload])
          if (addedRealEstates && addedRealEstates.length > 0) {
            properties.value.push(addedRealEstates[0])
            ElMessage.success('Thêm mới bất động sản thành công!')
            dialogVisible.value = false
          } else {
            ElMessage.error('Không nhận được phản hồi từ server')
          }
        } catch (error: any) {
          ElMessage.error(error.message || 'Lỗi khi thêm mới bất động sản')
        } finally {
          if (setLoading) setLoading(false)
        }
      }
    }
  })
}

const handleDelete = async (row: Property) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa bất động sản "${row.real_estate_id}"? Hành động này không thể hoàn tác.`,
      'Xác nhận xóa tài sản',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy bỏ',
        type: 'warning'
      }
    )
    if (setLoading) setLoading(true)
    try {
      await rentalService.deleteRealEstates([row.id])
      properties.value = properties.value.filter(p => p.id !== row.id)
      ElMessage.success('Xóa bất động sản thành công!')
    } catch (error: any) {
      ElMessage.error(error.message || 'Lỗi khi xóa bất động sản')
    } finally {
      if (setLoading) setLoading(false)
    }
  } catch (err) {
    // cancelled
  }
}

const setLoading = inject<((val: boolean) => void) | null>('setLoading', null)

const fetchProperties = async () => {
  if (setLoading) setLoading(true)
  try {
    const data = await rentalService.getRealEstates()
    properties.value = data
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi tải danh sách bất động sản')
  } finally {
    if (setLoading) setLoading(false)
  }
}

onMounted(() => {
  fetchProperties()
})
</script>

<style scoped>
.rental-tabs {
  border-radius: 8px;
  overflow: hidden;
}
.rental-tabs :deep(.el-tabs__content) {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.rental-tabs :deep(.el-tab-pane) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
.rental-tabs .custom-tabs-label .el-icon {
  vertical-align: middle;
}
.rental-tabs .custom-tabs-label span {
  vertical-align: middle;
  margin-left: 4px;
}

html.dark .rental-tabs {
  background-color: #1f2937;
  border-color: #374151;
}
html.dark .rental-tabs :deep(.el-tabs__header) {
  background-color: #111827;
  border-bottom-color: #374151;
}
html.dark .rental-tabs :deep(.el-tabs__item) {
  color: #9ca3af;
  border-color: transparent;
  transition: all 0.3s;
}
html.dark .rental-tabs :deep(.el-tabs__item:hover) {
  color: #d1d5db;
}
html.dark .rental-tabs :deep(.el-tabs__item.is-active) {
  background-color: #1f2937;
  border-right-color: #374151;
  border-left-color: #374151;
  border-bottom-color: #1f2937;
  color: #60a5fa;
}
</style>
