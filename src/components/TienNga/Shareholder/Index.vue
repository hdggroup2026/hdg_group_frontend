<template>
  <div class="shareholder-tabs-container h-full p-4 bg-gray-50 dark:bg-gray-900">
    <div class="shareholder-container h-full flex flex-col bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <!-- Filter Bar -->
      <div class="flex flex-wrap justify-between items-center gap-x-4 gap-y-4 mb-4 shrink-0">
        <div class="flex flex-wrap items-center gap-x-4 gap-y-4">
          <!-- Investment Filter -->
          <div class="flex items-center gap-2">
            <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Quỹ đầu tư:</span>
            <el-select 
              v-model="selectedInvestmentId" 
              placeholder="Tất cả" 
              style="width: 200px"
              clearable
              class="custom-dark-select highlight-select"
              popper-class="custom-dark-select-popper"
              @change="handleFilterChange"
            >
              <el-option label="Tất cả" value="" />
              <el-option 
                v-for="inv in investmentsList" 
                :key="inv.id" 
                :label="`${inv.investment_code || ''} - ${inv.name}`" 
                :value="inv.id" 
              />
            </el-select>
          </div>

          <!-- Search Input -->
          <div class="flex items-center gap-2">
            <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
            <el-input
              v-model="searchQuery"
              placeholder="Nhập mã, tên cổ đông, username..."
              :prefix-icon="Search"
              clearable
              class="w-64 custom-dark-input"
              style="width: 280px"
            />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <el-button :icon="Refresh" circle @click="fetchShareholders" :loading="loading" />
          <el-button type="primary" @click="openAddDialog">
            <el-icon class="mr-1"><Plus /></el-icon> Thêm Cổ đông
          </el-button>
        </div>
      </div>

      <!-- Table Container -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0 border border-gray-100 dark:border-gray-700">
        <!-- ══════════════════════════════════════════════════════════════
             MỤC 398 (29/08/2026) — BỎ CỘT GHIM, BẢNG CHỈ HIỆN TỪ 768px

             Cột ghim `fixed` chiếm chỗ CỐ ĐỊNH và không co theo màn hình.
             Trên màn 390px, mấy cột ghim cộng lại đã hết chỗ, nên vùng
             cuộn còn lại bằng 0 và vuốt ngang không có tác dụng — người
             dùng vuốt mà màn hình không nhúc nhích.

             Đã bỏ 0 cột ghim ở bảng này.
             ══════════════════════════════════════════════════════════ -->
        <el-table v-if="hienBang" :data="tableData" style="width: 100%" class="flex-1" height="100%" v-loading="loading" @sort-change="handleSortChange">
          <!-- Selection Column -->
          <el-table-column type="selection" width="55" />

          <!-- STT Column -->
          <el-table-column label="STT" width="52" align="center">
            <template #default="{ $index }">
              <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
            </template>
          </el-table-column>

          <!-- Mã Cổ đông -->
          <el-table-column prop="shareholder_code" label="Mã Cổ đông" width="94" sortable="custom">
            <template #default="{ row }">
              <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.shareholder_code }}</span>
            </template>
          </el-table-column>

          <!-- Tên Cổ đông -->
          <el-table-column prop="fullname" label="Tên Cổ đông" min-width="115">
            <template #default="{ row }">
              <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.fullname }}</span>
            </template>
          </el-table-column>

          <!-- Quỹ Liên kết -->
          <el-table-column prop="investment_name" label="Quỹ liên kết" width="130">
            <template #default="{ row }">
              <span v-if="row.investment_name" class="font-semibold text-gray-700 dark:text-gray-300">
                {{ row.investment_name }}
              </span>
              <span v-else class="text-gray-400">—</span>
            </template>
          </el-table-column>

          <!-- Số tiền góp vốn -->
          <el-table-column prop="investment_amount" label="Số tiền góp vốn" width="115" align="right">
            <template #default="{ row }">
              <span v-if="row.investment_amount" class="font-bold text-emerald-600 dark:text-emerald-450">
                {{ formatCurrency(row.investment_amount) }}
              </span>
              <span v-else class="text-gray-400">—</span>
            </template>
          </el-table-column>

          <!-- Ngày tham gia -->
          <el-table-column prop="start_date" label="Ngày bắt đầu" width="86" align="center">
            <template #default="{ row }">
              <span class="font-mono text-xs">{{ formatDate(row.start_date) }}</span>
            </template>
          </el-table-column>

          <!-- Username -->
          <el-table-column prop="username" label="Username Telegram" width="115">
            <template #default="{ row }">
              <span v-if="row.username" class="text-blue-500 font-mono text-xs">{{ row.username }}</span>
              <span v-else class="text-gray-400">—</span>
            </template>
          </el-table-column>

          <!-- Nhóm Telegram -->
          <el-table-column prop="telegram_group" label="Nhóm Telegram" width="144" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.telegram_group" class="text-xs text-gray-700 dark:text-gray-300 font-semibold">{{ row.telegram_group }}</span>
              <span v-else class="text-gray-400">—</span>
            </template>
          </el-table-column>

          <!-- Ghi chú -->
          <el-table-column prop="notes" label="Ghi chú" min-width="130" show-overflow-tooltip />

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
          <div v-if="tableData.length > 0" class="grid grid-cols-1 gap-4">
            <div
              v-for="(row, i) in tableData"
              :key="row.id || row.contract_id || i"
              class="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-sm"
            >
              <div class="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
                <div class="min-w-0 break-words">
                  <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.shareholder_code }}</span>
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
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tên Cổ đông:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.fullname }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Quỹ liên kết:</span>
                  <span class="text-right break-words min-w-0">
                    <span v-if="row.investment_name" class="font-semibold text-gray-700 dark:text-gray-300">
                                    {{ row.investment_name }}
                                  </span>
                                  <span v-else class="text-gray-400">—</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Số tiền góp vốn:</span>
                  <span class="text-right break-words min-w-0">
                    <span v-if="row.investment_amount" class="font-bold text-emerald-600 dark:text-emerald-450">
                                    {{ formatCurrency(row.investment_amount) }}
                                  </span>
                                  <span v-else class="text-gray-400">—</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ngày bắt đầu:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="font-mono text-xs">{{ formatDate(row.start_date) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Username Telegram:</span>
                  <span class="text-right break-words min-w-0">
                    <span v-if="row.username" class="text-blue-500 font-mono text-xs">{{ row.username }}</span>
                                  <span v-else class="text-gray-400">—</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Nhóm Telegram:</span>
                  <span class="text-right break-words min-w-0">
                    <span v-if="row.telegram_group" class="text-xs text-gray-700 dark:text-gray-300 font-semibold">{{ row.telegram_group }}</span>
                                  <span v-else class="text-gray-400">—</span>
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
        <div class="mt-auto shrink-0 p-4 flex flex-wrap justify-end gap-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :background="true"
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalCount"
          />
        </div>
      </div>
    </div>

    <!-- Modal Thêm/Sửa Cổ đông -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'CHỈNH SỬA CỔ ĐÔNG' : 'THÊM CỔ ĐÔNG MỚI'"
      class="custom-dark-dialog"
      width="900px"
      destroy-on-close
      align-center
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="180px" class="mt-2 compact-form">
          <!-- PHẦN 1: THÔNG TIN CƠ BẢN -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin cơ bản
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã Cổ đông" prop="shareholder_code">
                  <el-input v-model="form.shareholder_code" placeholder="VD: CD001..." :disabled="isEdit" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tên Cổ đông" prop="fullname">
                  <el-input v-model="form.fullname" placeholder="Nhập họ và tên cổ đông..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Quỹ liên kết" prop="investment_id">
                  <el-select v-model="form.investment_id" placeholder="Chọn quỹ liên kết (nếu có)..." clearable class="w-full text-left" style="width: 100%">
                    <el-option 
                      v-for="inv in investmentsList" 
                      :key="inv.id" 
                      :label="`${inv.investment_code || ''} - ${inv.name}`" 
                      :value="inv.id" 
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ngày tham gia" prop="start_date">
                  <el-date-picker :editable="false" 
                    v-model="form.start_date" 
                    type="date" 
                    placeholder="Chọn ngày tham gia..." 
                    format="DD/MM/YYYY" 
                    value-format="YYYY-MM-DD" 
                    style="width: 100%" 
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: THÔNG TIN GÓP VỐN & TELEGRAM -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Góp vốn &amp; Telegram
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Số tiền góp vốn (VNĐ)" prop="investment_amount">
                  <el-input 
                    v-model="form.investment_amount_text" 
                    placeholder="Nhập số tiền..."
                    @input="handlePriceInput"
                  >
                    <template #suffix>
                      <span class="text-xs text-gray-400">VNĐ</span>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Username Telegram" prop="username">
                  <el-input v-model="form.username" placeholder="VD: @username..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Nhóm Telegram" prop="telegram_group">
                  <el-input v-model="form.telegram_group" placeholder="VD: Nhóm Cổ Đông..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 3: GHI CHÚ -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
              Ghi chú thêm
            </h4>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Chi tiết ghi chú" prop="notes">
                  <el-input v-model="form.notes" type="textarea" :rows="2" placeholder="Ghi chú điều khoản, tỷ lệ hoặc thỏa thuận..." />
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

    <!-- Modal Chi tiết Cổ đông -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT CỔ ĐÔNG"
      class="custom-dark-dialog"
      width="90%"
      style="max-width: 800px"
      destroy-on-close
      align-center
    >
      <div v-if="selectedShareholder" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto overflow-x-hidden text-left">
        <!-- Visual Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <el-avatar :size="64" class="bg-blue-100 dark:bg-blue-900">
            <span class="text-xl font-bold text-blue-600 dark:text-blue-400">
              {{ selectedShareholder.fullname ? selectedShareholder.fullname.charAt(0).toUpperCase() : 'C' }}
            </span>
          </el-avatar>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Cổ đông Tiến Nga</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {{ selectedShareholder.fullname }}
              <span class="text-gray-400 dark:text-gray-500 font-mono font-medium">({{ selectedShareholder.shareholder_code }})</span>
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <span class="text-gray-500 dark:text-gray-400">Góp vốn: <strong class="text-emerald-650 dark:text-emerald-400">{{ formatCurrency(selectedShareholder.investment_amount) }} VNĐ</strong></span>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span class="text-gray-500 dark:text-gray-400">Bắt đầu: <strong>{{ formatDate(selectedShareholder.start_date) }}</strong></span>
            </div>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã Cổ đông</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-100 font-mono">{{ selectedShareholder.shareholder_code }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Họ và tên</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-100">{{ selectedShareholder.fullname }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày tham gia</div>
            <div class="text-sm font-mono text-gray-700 dark:text-gray-300">{{ formatDate(selectedShareholder.start_date) }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Quỹ liên kết</div>
            <div class="text-sm font-semibold text-blue-650 dark:text-blue-400">
              {{ selectedShareholder.investment_name || 'Không liên kết' }}
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số tiền góp vốn</div>
            <div class="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {{ formatCurrency(selectedShareholder.investment_amount) }} VNĐ
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Username Telegram</div>
            <div class="text-sm font-mono text-violet-650 dark:text-violet-400">
              {{ selectedShareholder.username || '—' }}
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Nhóm Telegram</div>
            <div class="text-sm text-gray-700 dark:text-gray-300 font-semibold">
              {{ selectedShareholder.telegram_group || '—' }}
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700 pt-4">
          <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ghi chú chi tiết</div>
          <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {{ selectedShareholder.notes || 'Không có ghi chú nào thêm.' }}
          </p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end pr-2">
          <el-button type="primary" @click="detailDialogVisible = false">Đóng</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { Plus, Search, Refresh, MoreFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { tienNgaService } from '@/api/tienNgaService'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'

const { laManHep, hienBang, hienThe } = dungManHep()

const loading = ref(false)
const searchQuery = ref('')
const selectedInvestmentId = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

const shareholders = ref<any[]>([])
const investmentsList = ref<any[]>([])

// Dialog States
const dialogVisible = ref(false)
const isEdit = ref(false)
const detailDialogVisible = ref(false)
const selectedShareholder = ref<any>(null)
const formRef = ref<any>(null)

const form = reactive({
  id: '',
  shareholder_code: '',
  fullname: '',
  investment_id: '',
  investment_amount: 0,
  investment_amount_text: '',
  start_date: '',
  username: '',
  telegram_group: '',
  notes: ''
})

const rules = reactive({
  shareholder_code: [{ required: true, message: 'Vui lòng nhập mã cổ đông', trigger: 'blur' }],
  fullname: [{ required: true, message: 'Vui lòng nhập họ tên cổ đông', trigger: 'blur' }]
})

// Fetch raw investments lists
const fetchInvestments = async () => {
  try {
    const mains = await tienNgaService.getInvestments({ role: 'main' })
    const members = await tienNgaService.getInvestments({ role: 'member' })
    investmentsList.value = [...mains, ...members]
  } catch (error: any) {
    console.error('Failed to load investments:', error)
  }
}

// Fetch shareholders list
const fetchShareholders = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (selectedInvestmentId.value) {
      params.investment_id = selectedInvestmentId.value
    }
    const data = await tienNgaService.getShareholders(params)
    shareholders.value = data
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi kết nối tới API để tải danh sách cổ đông')
    shareholders.value = []
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  currentPage.value = 1
  fetchShareholders()
}

// Search and Client-side search filters
const filteredShareholders = computed(() => {
  return shareholders.value.filter(s => {
    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return true
    
    return s.shareholder_code.toLowerCase().includes(q) ||
      s.fullname.toLowerCase().includes(q) ||
      (s.username && s.username.toLowerCase().includes(q)) ||
      (s.telegram_group && s.telegram_group.toLowerCase().includes(q))
  })
})

const totalCount = computed(() => filteredShareholders.value.length)

const sortProp = ref('')
const sortOrder = ref('')

const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  sortProp.value = prop
  sortOrder.value = order
  currentPage.value = 1
}

const sortedShareholders = computed(() => {
  const list = [...filteredShareholders.value]
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

const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedShareholders.value.slice(start, end)
})

// Add/Edit Dialog Helpers
const openAddDialog = () => {
  isEdit.value = false
  form.id = ''
  form.shareholder_code = ''
  form.fullname = ''
  form.investment_id = ''
  form.investment_amount = 0
  form.investment_amount_text = ''
  form.start_date = new Date().toISOString().substring(0, 10)
  form.username = ''
  form.telegram_group = ''
  form.notes = ''
  dialogVisible.value = true
}

const openEditDialog = (row: any) => {
  isEdit.value = true
  form.id = row.id
  form.shareholder_code = row.shareholder_code
  form.fullname = row.fullname
  form.investment_id = row.investment_id || ''
  form.investment_amount = row.investment_amount || 0
  form.investment_amount_text = row.investment_amount ? new Intl.NumberFormat('vi-VN').format(row.investment_amount) : ''
  form.start_date = row.start_date ? row.start_date.substring(0, 10) : ''
  form.username = row.username || ''
  form.telegram_group = row.telegram_group || ''
  form.notes = row.notes || ''
  dialogVisible.value = true
}

const handlePriceInput = (val: string) => {
  const numericVal = val.replace(/[^0-9]/g, '')
  const num = parseInt(numericVal, 10)
  if (!isNaN(num)) {
    form.investment_amount = num
    form.investment_amount_text = new Intl.NumberFormat('vi-VN').format(num)
  } else {
    form.investment_amount = 0
    form.investment_amount_text = ''
  }
}

const handleCommand = (cmd: string, row: any) => {
  if (cmd === 'detail') {
    selectedShareholder.value = row
    detailDialogVisible.value = true
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
      loading.value = true
      const payload = {
        shareholder_code: form.shareholder_code,
        fullname: form.fullname,
        investment_id: form.investment_id || null,
        investment_amount: Number(form.investment_amount) || null,
        start_date: form.start_date || null,
        username: form.username || null,
        telegram_group: form.telegram_group || null,
        notes: form.notes || null
      }

      try {
        if (isEdit.value) {
          const editPayload = { ...payload, id: form.id }
          await tienNgaService.updateShareholders([editPayload])
          ElNotification({
            title: 'Thành công',
            message: 'Đã cập nhật thông tin Cổ đông thành công!',
            type: 'success'
          })
        } else {
          await tienNgaService.addShareholders([payload])
          ElNotification({
            title: 'Thành công',
            message: 'Đã thêm Cổ đông mới thành công!',
            type: 'success'
          })
        }
        dialogVisible.value = false
        fetchShareholders()
      } catch (error: any) {
        ElMessage.error(error.message || 'Lỗi khi lưu thông tin cổ đông')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa Cổ đông "${row.fullname}" (${row.shareholder_code})?`,
      'Xác nhận xóa cổ đông',
      {
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy bỏ',
        type: 'warning'
      }
    )
    loading.value = true
    await tienNgaService.deleteShareholders([row.id])
    ElNotification({
      title: 'Thành công',
      message: 'Xóa cổ đông thành công!',
      type: 'success'
    })
    fetchShareholders()
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || 'Lỗi khi xóa cổ đông')
    }
  } finally {
    loading.value = false
  }
}

// Helpers
const formatCurrency = (val: number) => {
  if (!val) return '0'
  return new Intl.NumberFormat('vi-VN').format(val)
}

const formatDate = (val: string) => {
  if (!val) return '—'
  const parts = val.split('-')
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    const y = parts[0]
    const m = parts[1]
    const d = parts[2]
    // Handle YYYY-MM-DDThh:mm:ss format
    const cleanDay = d.substring(0, 2)
    return `${cleanDay}/${m}/${y}`
  }
  return val
}

onMounted(() => {
  fetchInvestments()
  fetchShareholders()
})
</script>

<style scoped>
.shareholder-tabs-container {
  height: 100%;
}

.shareholder-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

html.dark .shareholder-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .shareholder-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .shareholder-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

html.dark .shareholder-container :deep(.el-table .el-table-fixed-column--left),
html.dark .shareholder-container :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important;
}

html.dark .custom-dark-select :deep(.el-input__wrapper),
html.dark .custom-dark-input :deep(.el-input__wrapper) {
  background-color: #1f2937 !important;
  box-shadow: 0 0 0 1px #374151 inset !important;
}

html.dark .custom-dark-select :deep(.el-input__inner),
html.dark .custom-dark-input :deep(.el-input__inner) {
  color: #f3f4f6 !important;
  -webkit-text-fill-color: #f3f4f6 !important;
}
</style>
