<template>
  <div class="supplies-container h-full flex flex-col">
    <!-- Filter Bar -->
    <div class="flex flex-wrap justify-between items-center gap-4 mb-4 shrink-0">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Date range picker -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian:</span>
          <el-date-picker :editable="false"
            v-model="dateRange"
            type="daterange"
            range-separator="đến"
            start-placeholder="Từ ngày"
            end-placeholder="Đến ngày"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            style="width: 280px"
            class="custom-dark-date-picker highlight-select"
            popper-class="custom-dark-select-popper"
            @change="fetchSupplies"
          />
        </div>

        <!-- Land Code filter -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Mã đất:</span>
          <el-input
            v-model="landCodeFilter"
            placeholder="Tìm mã đất..."
            clearable
            class="w-48 custom-dark-input"
            @change="fetchSupplies"
            @clear="fetchSupplies"
          />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <el-button :icon="Refresh" circle @click="fetchSupplies" :loading="loading" />
        <el-button type="primary" @click="openAddDialog">
          <el-icon class="mr-1"><Plus /></el-icon> Thêm Vật tư
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
        <el-table-column prop="land_code" label="Mã đất" min-width="79" sortable="custom">
          <template #default="{ row }">
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.land_code || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="supplies_name" label="Tên vật tư" min-width="115">
          <template #default="{ row }">
            <span class="font-bold text-gray-850 dark:text-gray-100">{{ row.supplies_name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="supplier" label="Nhà cung cấp" min-width="108" show-overflow-tooltip />
        <el-table-column prop="quantity" label="Số lượng" min-width="86" align="right">
          <template #default="{ row }">
            <span>{{ formatWeight(row.quantity) }} {{ row.unit }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="unit_price" label="Đơn giá" min-width="94" align="right">
          <template #default="{ row }">
            <span>{{ formatCurrency(row.unit_price) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="Thành tiền" min-width="122" align="right">
          <template #default="{ row }">
            <span class="text-emerald-650 dark:text-emerald-400 font-extrabold">
              {{ formatCurrency(row.total_amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="purpose" label="Mục đích sử dụng" min-width="130" show-overflow-tooltip />
        <el-table-column prop="buyer" label="Người mua" min-width="94" show-overflow-tooltip />
        <el-table-column prop="notes" label="Ghi chú" min-width="108" show-overflow-tooltip />

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
            v-for="(row, i) in (paginatedData as any[])"
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
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Mã đất:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.land_code || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tên vật tư:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-bold text-gray-850 dark:text-gray-100">{{ row.supplies_name }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Nhà cung cấp:</span>
                <span class="text-right break-words min-w-0">
                  {{ row.supplier }}
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Số lượng:</span>
                <span class="text-right break-words min-w-0">
                  <span>{{ formatWeight(row.quantity) }} {{ row.unit }}</span>
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
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Mục đích sử dụng:</span>
                <span class="text-right break-words min-w-0">
                  {{ row.purpose }}
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Người mua:</span>
                <span class="text-right break-words min-w-0">
                  {{ row.buyer }}
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ghi chú:</span>
                <span class="text-right break-words min-w-0">
                  {{ row.notes }}
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
          :total="supplies.length"
        />
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? (cropType === 'sau_rieng' ? 'CHỈNH SỬA VẬT TƯ SẦU RIÊNG' : 'CHỈNH SỬA VẬT TƯ CAO SU') : (cropType === 'sau_rieng' ? 'THÊM PHIẾU VẬT TƯ SẦU RIÊNG MỚI' : 'THÊM PHIẾU VẬT TƯ CAO SU MỚI')"
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
                <el-form-item label="Ngày nhập/sử dụng" prop="day">
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
                <el-form-item label="Mã Đất" prop="land_code">
                  <el-input v-model="form.land_code" :placeholder="cropType === 'cao_su' ? 'VD: DT-CS-01...' : 'VD: DT-SR-01...'" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tên vật tư" prop="supplies_name">
                  <el-input v-model="form.supplies_name" placeholder="VD: Phân NPK, Thuốc trừ sâu..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Nhà cung cấp" prop="supplier">
                  <el-input v-model="form.supplier" placeholder="Nhập nhà cung cấp..." />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Người mua" prop="buyer">
                  <el-input v-model="form.buyer" placeholder="Nhập người mua..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Mục đích sử dụng" prop="purpose">
                  <el-input v-model="form.purpose" placeholder="VD: Bón phân định kỳ..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: THÔNG SỐ ĐỊNH LƯỢNG & TÀI CHÍNH -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Thông số định lượng &amp; Tài chính
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Số lượng" prop="quantity">
                  <el-input-number v-model="form.quantity" :precision="2" :step="1" :min="0" class="w-full" style="width: 100%" @change="calculateTotal" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Đơn vị tính" prop="unit">
                  <el-input v-model="form.unit" placeholder="VD: Bao, Lít, Chai, Kg..." />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Đơn giá" prop="unit_price_text">
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

            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Ghi chú" prop="notes">
                  <el-input v-model="form.notes" type="textarea" placeholder="Nhập ghi chú thêm nếu có..." :rows="2" />
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
      title="CHI TIẾT VẬT TƯ SỬ DỤNG"
      width="750px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedSupply" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto overflow-x-hidden text-left">
        <!-- Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-blue-500 dark:bg-blue-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32">
              <Box />
            </el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Chi tiết Vật tư</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {{ selectedSupply.supplies_name }}
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <span class="text-gray-500 dark:text-gray-400">Ngày nhập: <strong class="text-gray-750 dark:text-gray-250">{{ formatDate(selectedSupply.day) }}</strong></span>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span class="text-gray-500 dark:text-gray-400">Mã đất: <strong class="text-blue-600 font-mono">{{ selectedSupply.land_code || '—' }}</strong></span>
            </div>
          </div>
        </div>

        <!-- 1. THÔNG SỐ ĐỊNH LƯỢNG -->
        <div>
          <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            Thông số sản lượng &amp; Sử dụng
          </h4>
          <div class="grid grid-cols-2 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số lượng sử dụng</div>
              <div class="text-sm font-bold text-gray-850 dark:text-gray-200">
                {{ formatWeight(selectedSupply.quantity) }} {{ selectedSupply.unit }}
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Nhà cung cấp</div>
              <div class="text-sm font-semibold text-gray-750 dark:text-gray-300">{{ selectedSupply.supplier || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Người mua</div>
              <div class="text-sm font-medium text-gray-770 dark:text-gray-300">{{ selectedSupply.buyer || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mục đích sử dụng</div>
              <div class="text-sm text-gray-700 dark:text-gray-300">{{ selectedSupply.purpose || '—' }}</div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 2. CHI PHÍ -->
        <div>
          <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
            Chi phí vật tư
          </h4>
          <div class="grid grid-cols-2 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Đơn giá</div>
              <div class="text-sm font-bold text-gray-750 dark:text-gray-250">{{ formatCurrency(selectedSupply.unit_price) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Thành tiền</div>
              <div class="text-base font-extrabold text-emerald-650 dark:text-emerald-400">{{ formatCurrency(selectedSupply.total_amount) }}</div>
            </div>
          </div>
        </div>

        <div v-if="selectedSupply.notes" class="border-t border-gray-100 dark:border-gray-700"></div>

        <div v-if="selectedSupply.notes">
          <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ghi chú</div>
          <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ selectedSupply.notes }}</p>
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
import { Search, Plus, MoreFilled, Box, Refresh } from '@element-plus/icons-vue'
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
const dateRange = ref<[string, string] | null>(null)
const landCodeFilter = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Dialog states
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<any>(null)
const detailDialogVisible = ref(false)
const selectedSupply = ref<any>(null)

// Supplies list
const supplies = ref<any[]>([])

// Total metrics
const totalQuantity = computed(() => {
  return supplies.value.reduce((sum, item) => {
    const val = parseFloat(item.quantity)
    return sum + (isNaN(val) ? 0 : val)
  }, 0)
})

const totalCost = computed(() => {
  return supplies.value.reduce((sum, item) => {
    const val = parseFloat(item.total_amount)
    return sum + (isNaN(val) ? 0 : val)
  }, 0)
})

const sortProp = ref('')
const sortOrder = ref('')

const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  sortProp.value = prop
  sortOrder.value = order
  currentPage.value = 1
}

const sortedSupplies = computed(() => {
  const list = [...supplies.value]
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
  return sortedSupplies.value.slice(start, end)
})

// Form state
const form = reactive({
  id: '',
  day: '',
  land_code: '',
  supplies_name: '',
  supplier: '',
  quantity: 0,
  unit: '',
  unit_price: 0,
  unit_price_text: '',
  total_amount: 0,
  total_amount_text: '',
  purpose: '',
  buyer: '',
  notes: ''
})

const rules = reactive({
  day: [{ required: true, message: 'Vui lòng chọn ngày', trigger: 'change' }],
  supplies_name: [{ required: true, message: 'Vui lòng nhập tên vật tư', trigger: 'blur' }],
  unit: [{ required: true, message: 'Vui lòng nhập đơn vị tính', trigger: 'blur' }]
})

// Formatters
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
  return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val)
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
  const total = form.quantity * form.unit_price
  form.total_amount = total
  form.total_amount_text = total ? new Intl.NumberFormat('vi-VN').format(total) : '0'
}

// Fetch supplies from API
const fetchSupplies = async () => {
  loading.value = true
  currentPage.value = 1
  try {
    let start_date = undefined
    let end_date = undefined
    if (dateRange.value && dateRange.value.length === 2) {
      start_date = dateRange.value[0]
      end_date = dateRange.value[1]
    }

    const params: any = {
      crop_type: props.cropType
    }
    if (start_date) params.start_date = start_date
    if (end_date) params.end_date = end_date
    if (landCodeFilter.value.trim()) params.land_code = landCodeFilter.value.trim()

    const data = await harvestService.getSuppliesExpenses(params)
    supplies.value = data
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi tải danh sách chi phí vật tư')
  } finally {
    loading.value = false
  }
}

// Dialog handlers
const openDetailDialog = (row: any) => {
  selectedSupply.value = row
  detailDialogVisible.value = true
}

const openAddDialog = () => {
  isEdit.value = false
  form.id = ''
  form.day = new Date().toISOString().substring(0, 10)
  form.land_code = ''
  form.supplies_name = ''
  form.supplier = ''
  form.quantity = 0
  form.unit = ''
  form.unit_price = 0
  form.unit_price_text = '0'
  form.total_amount = 0
  form.total_amount_text = '0'
  form.purpose = ''
  form.buyer = ''
  form.notes = ''
  dialogVisible.value = true
}

const openEditDialog = (row: any) => {
  isEdit.value = true
  form.id = row.id
  form.day = row.day
  form.land_code = row.land_code || ''
  form.supplies_name = row.supplies_name
  form.supplier = row.supplier || ''
  form.quantity = row.quantity
  form.unit = row.unit
  form.unit_price = row.unit_price
  form.unit_price_text = new Intl.NumberFormat('vi-VN').format(row.unit_price)
  form.total_amount = row.total_amount
  form.total_amount_text = new Intl.NumberFormat('vi-VN').format(row.total_amount)
  form.purpose = row.purpose || ''
  form.buyer = row.buyer || ''
  form.notes = row.notes || ''
  dialogVisible.value = true
}

const handleCommand = (cmd: string, row: any) => {
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
      if (form.quantity <= 0) {
        ElMessage.warning('Số lượng vật tư phải lớn hơn 0!')
        return
      }
      if (form.unit_price <= 0) {
        ElMessage.warning('Đơn giá vật tư phải lớn hơn 0!')
        return
      }

      const payload = {
        day: form.day,
        land_code: form.land_code || null,
        supplies_name: form.supplies_name,
        supplier: form.supplier || null,
        quantity: form.quantity,
        unit: form.unit,
        unit_price: form.unit_price,
        total_amount: form.total_amount,
        purpose: form.purpose || null,
        crop_type: props.cropType,
        buyer: form.buyer || null,
        notes: form.notes || null
      }

      loading.value = true
      try {
        if (isEdit.value) {
          const payloadWithId = {
            ...payload,
            id: form.id
          }
          const updated = await harvestService.updateSuppliesExpenses([payloadWithId])
          if (updated && updated.length > 0) {
            const index = supplies.value.findIndex(s => s.id === form.id)
            if (index !== -1) {
              supplies.value[index] = updated[0]
            }
            ElMessage.success('Cập nhật chi phí vật tư thành công!')
            dialogVisible.value = false
          }
        } else {
          const added = await harvestService.addSuppliesExpenses([payload])
          if (added && added.length > 0) {
            supplies.value.unshift(added[0])
            ElMessage.success('Thêm chi phí vật tư mới thành công!')
            dialogVisible.value = false
          }
        }
      } catch (error: any) {
        ElMessage.error(error.message || 'Lỗi khi ghi nhận chi phí vật tư')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa chi phí vật tư "${row.supplies_name}" ngày ${formatDate(row.day)}?`,
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy bỏ',
        type: 'warning'
      }
    )
    loading.value = true
    try {
      await harvestService.deleteSuppliesExpenses([row.id])
      supplies.value = supplies.value.filter(s => s.id !== row.id)
      ElMessage.success('Xóa chi phí vật tư thành công!')
    } catch (error: any) {
      ElMessage.error(error.message || 'Lỗi khi xóa chi phí vật tư')
    } finally {
      loading.value = false
    }
  } catch (err) {
    // cancelled
  }
}

onMounted(() => {
  fetchSupplies()
})

watch(() => props.cropType, () => {
  dateRange.value = null
  landCodeFilter.value = ''
  currentPage.value = 1
  fetchSupplies()
})
</script>

<style scoped>
.supplies-container {
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
html.dark .supplies-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .supplies-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .supplies-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

.supplies-container :deep(.el-table td.el-table__cell .cell) {
  white-space: nowrap !important;
}

html.dark .supplies-container :deep(.el-table .el-table-fixed-column--left),
html.dark .supplies-container :deep(.el-table .el-table-fixed-column--right) {
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
