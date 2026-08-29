<template>
  <div class="daily-harvests-container h-full flex flex-col">
    <!-- Filter Bar -->
    <div class="flex flex-wrap justify-between items-center gap-4 mb-4 shrink-0">
      <div class="flex flex-wrap items-center gap-4">
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

        <!-- Search query -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
          <el-input
            v-model="searchQuery"
            placeholder="Tìm mã hộ dân, mã đất..."
            :prefix-icon="Search"
            clearable
            class="w-64 custom-dark-input"
          />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <el-button :icon="Refresh" circle @click="fetchDailyHarvests" :loading="loading" />
        <el-button type="primary" @click="openAddDialog">
          <el-icon class="mr-1"><Plus /></el-icon> Thêm Thu hoạch
        </el-button>
      </div>
    </div>

    <!-- Table Container -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
      <!-- ══════════════════════════════════════════════════════════════
           MỤC 398 (29/08/2026) — BỎ CỘT GHIM, BẢNG CHỈ HIỆN TỪ 768px

           Cột ghim `fixed` chiếm chỗ CỐ ĐỊNH và không co theo màn hình.
           Trên màn 390px, mấy cột ghim cộng lại đã hết chỗ, nên vùng
           cuộn còn lại bằng 0 và vuốt ngang không có tác dụng — người
           dùng vuốt mà màn hình không nhúc nhích.

           Đã bỏ 0 cột ghim ở bảng này.
           ══════════════════════════════════════════════════════════ -->
      <el-table v-if="hienBang" v-loading="loading" :data="paginatedData" style="width: 100%" class="flex-1" height="100%" @sort-change="handleSortChange">
        <!-- STT Column -->
        <el-table-column label="STT" width="52" align="center">
          <template #default="{ $index }">
            <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="day" label="Ngày" min-width="86" sortable>
          <template #default="{ row }">
            <span class="font-semibold text-gray-800 dark:text-gray-200">{{ formatDate(row.day) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="household_code" label="Mã Hộ Dân" min-width="94" sortable="custom">
          <template #default="{ row }">
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.household_code }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="land_code" label="Mã Đất" min-width="86" sortable="custom">
          <template #default="{ row }">
            <span class="font-mono text-gray-500 dark:text-gray-400">{{ row.land_code || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="tree_count" :label="cropType === 'cao_su' ? 'Số lượng cây' : 'Số trái'" min-width="101" align="right">
          <template #default="{ row }">
            <span>{{ formatInt(row.tree_count) }} {{ cropType === 'cao_su' ? 'cây' : 'trái' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="harvest_weight" label="Khối lượng thu hoạch (Kg)" min-width="144" align="right">
          <template #default="{ row }">
            <span class="font-bold">{{ formatWeight(row.harvest_weight) }} Kg</span>
          </template>
        </el-table-column>
        <el-table-column prop="unit_price" label="Đơn giá" min-width="86" align="right">
          <template #default="{ row }">
            <span>{{ formatCurrency(row.unit_price) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="Thành tiền" min-width="130" align="right">
          <template #default="{ row }">
            <span class="text-emerald-650 dark:text-emerald-400 font-extrabold">
              {{ formatCurrency(row.total_amount) }}
            </span>
          </template>
        </el-table-column>

        <!-- Actions -->
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
                  <el-dropdown-item command="delete" divided class="!text-red-500">Xóa</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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
            v-for="(row, i) in paginatedData"
            :key="row.id || row.contract_id || i"
            class="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
              <div class="min-w-0 break-words">
                <span class="font-semibold text-gray-800 dark:text-gray-200">{{ formatDate(row.day) }}</span>
              </div>
              <div class="shrink-0">
                <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
                              <el-button link type="info" class="p-1">
                                <el-icon class="text-xl"><MoreFilled /></el-icon>
                              </el-button>
                              <template #dropdown>
                                <el-dropdown-menu>
                                  <el-dropdown-item command="detail">Chi tiết</el-dropdown-item>
                                  <el-dropdown-item command="edit">Chỉnh sửa</el-dropdown-item>
                                  <el-dropdown-item command="delete" divided class="!text-red-500">Xóa</el-dropdown-item>
                                </el-dropdown-menu>
                              </template>
                            </el-dropdown>
              </div>
            </div>
            <div class="space-y-2 text-sm text-left">
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Mã Hộ Dân:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.household_code }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Mã Đất:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-mono text-gray-500 dark:text-gray-400">{{ row.land_code || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">:</span>
                <span class="text-right break-words min-w-0">
                  <span>{{ formatInt(row.tree_count) }} {{ cropType === 'cao_su' ? 'cây' : 'trái' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Khối lượng thu hoạch (Kg):</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-bold">{{ formatWeight(row.harvest_weight) }} Kg</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Đơn giá:</span>
                <span class="text-right break-words min-w-0">
                  <span>{{ formatCurrency(row.unit_price) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Thành tiền:</span>
                <span class="text-right break-words min-w-0">
                  <span class="text-emerald-650 dark:text-emerald-400 font-extrabold">
                                {{ formatCurrency(row.total_amount) }}
                              </span>
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
          :total="filteredHarvests.length"
        />
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? (cropType === 'sau_rieng' ? 'CHỈNH SỬA PHIẾU THU HOẠCH SẦU RIÊNG' : 'CHỈNH SỬA PHIẾU THU HOẠCH HẰNG NGÀY') : (cropType === 'sau_rieng' ? 'THÊM PHIẾU THU HOẠCH SẦU RIÊNG MỚI' : 'THÊM PHIẾU THU HOẠCH MỚI')"
      width="900px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="180px" class="mt-2 compact-form">
          <!-- PHẦN 1: THÔNG TIN CHUNG -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin chung
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Ngày thu hoạch" prop="day">
                  <el-date-picker :editable="false"
                    v-model="form.day"
                    type="date"
                    placeholder="Chọn ngày"
                    format="DD/MM/YYYY"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Hộ dân" prop="household_code">
                  <el-select
                    v-model="form.household_code"
                    placeholder="Chọn hộ dân"
                    style="width: 100%"
                    @change="handleHouseholdChange"
                    filterable
                  >
                    <el-option
                      v-for="hh in availableHouseholds"
                      :key="hh.household_code"
                      :label="`${hh.fullname} (${hh.household_code})`"
                      :value="hh.household_code"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã Đất trồng" prop="land_code">
                  <el-input v-model="form.land_code" placeholder="VD: DT-CS-01..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: THÔNG SỐ SẢN LƯỢNG & TÀI CHÍNH -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Thông số sản lượng &amp; Tài chính
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item :label="cropType === 'cao_su' ? 'Số cây cạo' : 'Số trái hái'" prop="tree_count">
                  <el-input-number v-model="form.tree_count" :min="0" class="w-full" style="width: 100%" @change="calculateTotal" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="cropType === 'cao_su' ? 'Khối lượng mủ (Kg)' : 'Khối lượng SR (Kg)'" prop="harvest_weight">
                  <el-input-number v-model="form.harvest_weight" :precision="2" :step="1" :min="0" class="w-full" style="width: 100%" @change="calculateTotal" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Đơn giá thu hoạch" prop="unit_price_text">
                  <el-input v-model="form.unit_price_text" placeholder="Nhập đơn giá..." @input="handleUnitPriceInput">
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Thành tiền" prop="total_amount_text">
                  <el-input v-model="form.total_amount_text" placeholder="Tự động tính..." disabled>
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
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

    <!-- Details Dialog -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT PHIẾU THU HOẠCH HẰNG NGÀY"
      width="750px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedHarvest" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto overflow-x-hidden text-left">
        <!-- Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-cyan-500 dark:bg-cyan-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32">
              <Calendar />
            </el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Chi tiết thu hoạch</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {{ getHouseholdName(selectedHarvest) }}
              <span class="text-gray-400 dark:text-gray-500 font-medium">({{ selectedHarvest.household_code }})</span>
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <span class="text-gray-500 dark:text-gray-400">Ngày thu: <strong class="text-gray-700 dark:text-gray-200">{{ formatDate(selectedHarvest.day) }}</strong></span>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span class="text-gray-500 dark:text-gray-400">Mã đất: <strong class="text-blue-500 font-mono">{{ selectedHarvest.land_code }}</strong></span>
            </div>
          </div>
        </div>

        <!-- 1. THÔNG SỐ SẢN LƯỢNG -->
        <div>
          <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            Thông số sản lượng
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                {{ cropType === 'cao_su' ? 'Số lượng cây đã cạo' : 'Số lượng trái sầu riêng thu hoạch' }}
              </div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">
                {{ formatInt(selectedHarvest.tree_count) }} {{ cropType === 'cao_su' ? 'cây' : 'trái' }}
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                {{ cropType === 'cao_su' ? 'Khối lượng mủ cao su thu hoạch' : 'Khối lượng sầu riêng thu hoạch' }}
              </div>
              <div class="text-sm font-extrabold text-gray-800 dark:text-gray-200">{{ formatWeight(selectedHarvest.harvest_weight) }} Kg</div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 2. THÀNH TIỀN & ĐƠN GIÁ -->
        <div>
          <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
            Giá trị tạm tính
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Đơn giá áp dụng</div>
              <div class="text-sm font-bold text-gray-750 dark:text-gray-250">{{ formatCurrency(selectedHarvest.unit_price) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Thành tiền tạm tính</div>
              <div class="text-base font-extrabold text-emerald-650 dark:text-emerald-400">{{ formatCurrency(selectedHarvest.total_amount) }}</div>
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
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { Search, MoreFilled, Calendar, Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { harvestService } from '@/api/harvestService'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'

const { laManHep, hienBang, hienThe } = dungManHep()

const props = defineProps<{
  cropType: 'cao_su' | 'sau_rieng'
}>()

const loading = ref(false)
const searchQuery = ref('')
const monthRange = ref<[string, string] | null>(null)

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Dialog states
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<any>(null)
const detailDialogVisible = ref(false)
const selectedHarvest = ref<DailyHarvest | null>(null)

interface DailyHarvest {
  id: string
  day: string
  household_code: string
  land_code: string
  tree_count: number
  harvest_weight: number
  unit_price: number
  total_amount: number
  crop_type?: string
}

const householdsDropdown = ref<any[]>([])

// Available households list for lookup & auto-fill price/land_code
const availableHouseholds = computed(() => {
  return householdsDropdown.value
})

const getHouseholdName = (row: any) => {
  if (!row) return 'Không rõ'
  if (row.household_name) return row.household_name
  const matched = availableHouseholds.value.find(h => h.household_code === row.household_code)
  return matched ? matched.fullname : 'Không rõ'
}

// Mock Daily Harvests
const harvests = ref<DailyHarvest[]>([])

// Form state
const form = reactive({
  id: '',
  day: '',
  household_code: '',
  land_code: '',
  tree_count: 0,
  harvest_weight: 0,
  unit_price: 0,
  unit_price_text: '',
  total_amount: 0,
  total_amount_text: ''
})

const rules = reactive({
  day: [{ required: true, message: 'Vui lòng chọn ngày thu hoạch', trigger: 'change' }],
  household_code: [{ required: true, message: 'Vui lòng chọn hộ dân', trigger: 'change' }],
  land_code: [{ required: true, message: 'Vui lòng nhập mã đất', trigger: 'blur' }]
})

// Filter harvests depending on cropType and filters
const filteredHarvests = computed(() => {
  return harvests.value.filter(h => {
    // Crop type filter
    const isRubber = h.crop_type ? h.crop_type === 'cao_su' : h.household_code.startsWith('HD-CS')
    if (props.cropType === 'cao_su' && !isRubber) return false
    if (props.cropType === 'sau_rieng' && isRubber) return false

    // Month range filter
    if (monthRange.value && monthRange.value.length === 2) {
      const monthStr = h.day.substring(0, 7)
      const [startMonth, endMonth] = monthRange.value
      if (monthStr < startMonth || monthStr > endMonth) return false
    }

    // Search query
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      return h.household_code.toLowerCase().includes(q) ||
        h.land_code.toLowerCase().includes(q)
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

const sortedHarvests = computed(() => {
  const list = [...filteredHarvests.value]
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
  return sortedHarvests.value.slice(start, end)
})

// Auto-fill price and land code on choosing household
const handleHouseholdChange = (val: string) => {
  const hh = availableHouseholds.value.find(h => h.household_code === val)
  if (hh) {
    form.land_code = hh.land_code
    if (props.cropType === 'cao_su') {
      const priceVal = (hh as any).tapping_price
      form.unit_price = priceVal
      form.unit_price_text = new Intl.NumberFormat('vi-VN').format(priceVal)
    } else {
      form.unit_price = 0
      form.unit_price_text = '0'
    }
    calculateTotal()
  }
}

const handleUnitPriceInput = (val: string) => {
  const numericVal = val.replace(/[^0-9]/g, '')
  const num = parseInt(numericVal, 10)
  if (!isNaN(num)) {
    form.unit_price = num
    form.unit_price_text = new Intl.NumberFormat('vi-VN').format(num)
  } else {
    form.unit_price = 0
    form.unit_price_text = ''
  }
  calculateTotal()
}

const calculateTotal = () => {
  const total = props.cropType === 'sau_rieng'
    ? form.harvest_weight * form.unit_price
    : form.tree_count * form.unit_price
  form.total_amount = total
  form.total_amount_text = total ? new Intl.NumberFormat('vi-VN').format(total) : '0'
}

// Reset filters on cropType changes
watch(() => props.cropType, () => {
  searchQuery.value = ''
  monthRange.value = null
  currentPage.value = 1
})

const formatDate = (val: string) => {
  if (!val) return '—'
  const [y, m, d] = val.split('-')
  return `${d}/${m}/${y}`
}

const formatCurrency = (val: number) => {
  if (!val) return '0 VNĐ'
  return new Intl.NumberFormat('vi-VN').format(val) + ' VNĐ'
}

const formatInt = (val: number) => {
  return new Intl.NumberFormat('vi-VN').format(val)
}

const formatWeight = (val: number) => {
  return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(val)
}

// Dialog management
const openDetailDialog = (row: DailyHarvest) => {
  selectedHarvest.value = row
  detailDialogVisible.value = true
}

const openAddDialog = () => {
  isEdit.value = false
  form.id = ''
  form.day = new Date().toISOString().substring(0, 10)
  form.household_code = ''
  form.land_code = ''
  form.tree_count = 0
  form.harvest_weight = 0
  form.unit_price = 0
  form.unit_price_text = props.cropType === 'sau_rieng' ? '0' : ''
  form.total_amount = 0
  form.total_amount_text = ''
  dialogVisible.value = true
}

const openEditDialog = (row: DailyHarvest) => {
  isEdit.value = true
  form.id = row.id
  form.day = row.day
  form.household_code = row.household_code
  form.land_code = row.land_code
  form.tree_count = row.tree_count
  form.harvest_weight = row.harvest_weight
  form.unit_price = row.unit_price
  form.unit_price_text = new Intl.NumberFormat('vi-VN').format(row.unit_price)
  form.total_amount = row.total_amount
  form.total_amount_text = new Intl.NumberFormat('vi-VN').format(row.total_amount)
  dialogVisible.value = true
}

const handleCommand = (cmd: string, row: DailyHarvest) => {
  if (cmd === 'detail') {
    openDetailDialog(row)
  } else if (cmd === 'edit') {
    openEditDialog(row)
  } else if (cmd === 'delete') {
    handleDelete(row)
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      if (form.tree_count <= 0) {
        ElMessage.warning(props.cropType === 'cao_su' ? 'Số lượng cây phải lớn hơn 0!' : 'Số lượng trái phải lớn hơn 0!')
        return
      }
      if (form.harvest_weight <= 0) {
        ElMessage.warning('Khối lượng thu hoạch phải lớn hơn 0!')
        return
      }
      if (form.unit_price <= 0) {
        ElMessage.warning('Đơn giá thu hoạch phải lớn hơn 0!')
        return
      }

      const payload = {
        day: form.day,
        household_code: form.household_code,
        land_code: form.land_code,
        tree_count: form.tree_count,
        harvest_weight: form.harvest_weight,
        unit_price: form.unit_price,
        total_amount: form.total_amount,
        crop_type: props.cropType
      }

      if (isEdit.value) {
        loading.value = true
        try {
          const payloadWithId = {
            ...payload,
            id: form.id
          }
          const updatedHarvests = await harvestService.updateDailyHarvests([payloadWithId])
          if (updatedHarvests && updatedHarvests.length > 0) {
            const index = harvests.value.findIndex(h => h.id === form.id)
            if (index !== -1) {
              harvests.value[index] = updatedHarvests[0]
              ElMessage.success('Cập nhật phiếu thu hoạch thành công!')
              dialogVisible.value = false
            } else {
              ElMessage.error('Không tìm thấy phiếu thu hoạch trong danh sách')
            }
          } else {
            ElMessage.error('Không nhận được phản hồi từ server')
          }
        } catch (error: any) {
          ElMessage.error(error.message || 'Lỗi khi cập nhật phiếu thu hoạch')
        } finally {
          loading.value = false
        }
      } else {
        loading.value = true
        try {
          const addedHarvests = await harvestService.addDailyHarvests([payload])
          if (addedHarvests && addedHarvests.length > 0) {
            harvests.value.unshift(addedHarvests[0])
            ElMessage.success('Thêm phiếu thu hoạch mới thành công!')
            dialogVisible.value = false
          } else {
            ElMessage.error('Không nhận được phản hồi từ server')
          }
        } catch (error: any) {
          ElMessage.error(error.message || 'Lỗi khi thêm mới phiếu thu hoạch')
        } finally {
          loading.value = false
        }
      }
    }
  })
}

const handleDelete = async (row: DailyHarvest) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa phiếu thu hoạch ngày ${formatDate(row.day)} của hộ ${row.household_code}?`,
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy bỏ',
        type: 'warning'
      }
    )
    loading.value = true
    try {
      await harvestService.deleteDailyHarvests([row.id])
      harvests.value = harvests.value.filter(h => h.id !== row.id)
      ElMessage.success('Xóa phiếu thu hoạch thành công!')
    } catch (error: any) {
      ElMessage.error(error.message || 'Lỗi khi xóa phiếu thu hoạch')
    } finally {
      loading.value = false
    }
  } catch (err) {
    // cancelled
  }
}

const fetchDailyHarvests = async () => {
  loading.value = true
  try {
    let start_date = undefined
    let end_date = undefined
    if (monthRange.value && monthRange.value.length === 2) {
      start_date = `${monthRange.value[0]}-01`
      const parts = monthRange.value[1].split('-')
      const year = parseInt(parts[0] || '0', 10)
      const month = parseInt(parts[1] || '0', 10)
      const lastDay = new Date(year, month, 0).getDate()
      end_date = `${monthRange.value[1]}-${String(lastDay).padStart(2, '0')}`
    }

    const params = {
      crop_type: props.cropType,
      start_date,
      end_date
    }
    const data = await harvestService.getDailyHarvests(params)
    harvests.value = data
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi tải danh sách thu hoạch hằng ngày')
  } finally {
    loading.value = false
  }
}

const fetchHouseholds = async () => {
  try {
    const params: any = {}
    if (props.cropType === 'cao_su') {
      params.has_purchase_code = true
    }
    const data = await harvestService.getHouseholds(params)
    householdsDropdown.value = data
  } catch (error: any) {
    console.error('Lỗi khi tải danh sách hộ dân cho dropdown:', error)
  }
}

onMounted(() => {
  fetchDailyHarvests()
  fetchHouseholds()
})

watch(() => props.cropType, () => {
  searchQuery.value = ''
  monthRange.value = null
  currentPage.value = 1
  fetchDailyHarvests()
  fetchHouseholds()
})

watch(monthRange, () => {
  currentPage.value = 1
  fetchDailyHarvests()
})

watch(searchQuery, () => {
  currentPage.value = 1
})
</script>

<style scoped>
.daily-harvests-container {
  height: 100%;
}

.daily-harvests-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

.daily-harvests-container :deep(.el-table td.el-table__cell .cell) {
  white-space: nowrap !important;
}

.daily-harvests-container :deep(.el-pagination) {
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

/* Custom dark mode styles for harvests table */
html.dark .daily-harvests-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .daily-harvests-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .daily-harvests-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

html.dark .daily-harvests-container :deep(.el-table .el-table-fixed-column--left),
html.dark .daily-harvests-container :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important;
}
html.dark .custom-dark-input,
html.dark .custom-dark-date-picker,
html.dark .highlight-select {
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

/* Đổi màu background các ô select nổi bật trong Dark Mode */
html.dark .highlight-select :deep(.el-input__wrapper) {
  background-color: #111827 !important;
  box-shadow: 0 0 0 1px #111827 inset !important;
  border-color: #111827 !important;
}

/* Date picker range dark mode */
html.dark .highlight-select.el-date-editor.el-range-editor {
  background-color: #111827 !important;
  box-shadow: 0 0 0 1px #111827 inset !important;
  border-color: #111827 !important;
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

<style>
/* Popper dropdown in Dark Mode */
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

html.dark .custom-dark-select-popper .el-popper__arrow::before {
  background-color: #1f2937 !important;
  border-color: #374151 !important;
}

/* Unscoped overrides for select placeholders in dark mode dialogs */
html.dark .custom-dark-dialog .el-input__inner {
  color: #f3f4f6 !important;
  -webkit-text-fill-color: #f3f4f6 !important;
  opacity: 1 !important;
}
html.dark .custom-dark-dialog .el-input__inner::placeholder {
  color: #9ca3af !important;
  -webkit-text-fill-color: #9ca3af !important;
}
html.dark .custom-dark-dialog {
  --el-input-text-color: #f3f4f6 !important;
  --el-text-color-regular: #f3f4f6 !important;
  --el-text-color-placeholder: #9ca3af !important;
}
</style>
