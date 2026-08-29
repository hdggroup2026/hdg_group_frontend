<template>
  <div class="rental-container h-full flex flex-col">
    <!-- Filter Bar -->
    <div class="flex justify-between items-center mb-4 shrink-0">
      <div class="flex items-center gap-4">
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
        <!-- Search filter -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
          <el-input
            v-model="searchQuery"
            placeholder="Tìm mã HĐ, mã BĐS, tên KH..."
            :prefix-icon="Search"
            clearable
            class="w-64 custom-dark-input"
          />
        </div>
      </div>
      <div class="flex items-center gap-2">
        <el-button :icon="Refresh" circle @click="fetchPayments" :loading="loading" />
        <el-button type="primary" @click="openAddDialog">Thêm thanh toán</el-button>
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
          :total="filteredPayments.length"
        />
      </div>
    </div>

    <!-- Add/Edit Payment Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'CHỈNH SỬA PHIẾU THANH TOÁN' : 'GHI NHẬN THANH TOÁN MỚI'"
      width="900px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form 
          :model="form" 
          :rules="rules" 
          ref="formRef" 
          label-width="180px" 
          class="mt-2 compact-form"
        >
          <!-- PHẦN 1: THÔNG TIN HỢP ĐỒNG -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin hợp đồng
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Hợp đồng" prop="contract_id">
                  <el-select
                    v-model="form.contract_id"
                    placeholder="Chọn hợp đồng..."
                    style="width: 100%"
                    class="highlight-select"
                    @change="handleContractChange"
                    :disabled="isEdit"
                  >
                    <el-option
                      v-for="c in activeContracts"
                      :key="c.contract_id"
                      :label="`${c.contract_id} - ${c.customer_name} (${c.real_estate_id})`"
                      :value="c.contract_id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- Read-only auto filled info from selected contract -->
            <div v-if="selectedContractInfo" class="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 text-xs mb-4 space-y-2 grid grid-cols-2 gap-4">
              <div class="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-1">
                <span class="text-gray-400">Khách hàng:</span>
                <span class="font-bold text-gray-700 dark:text-gray-300">{{ selectedContractInfo.customer_name }}</span>
              </div>
              <div class="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-1">
                <span class="text-gray-400">Bất động sản:</span>
                <span class="font-mono text-gray-700 dark:text-gray-300">{{ selectedContractInfo.real_estate_id }}</span>
              </div>
              <div class="flex justify-between pb-1">
                <span class="text-gray-400">Tiền thuê / Tháng:</span>
                <span class="font-semibold" :class="mauSo(selectedContractInfo.monthly_rental)">{{ formatCurrency(selectedContractInfo.monthly_rental) }}</span>
              </div>
              <div class="flex justify-between pb-1">
                <span class="text-gray-400">Công nợ hiện tại:</span>
                <span class="font-bold" :class="mauSo(selectedContractInfo.rental_debt)">{{ formatCurrency(selectedContractInfo.rental_debt) }}</span>
              </div>
            </div>
          </div>

          <!-- PHẦN 2: CHI TIẾT THANH TOÁN -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-green-500 rounded-full"></span>
              Chi tiết thanh toán
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Ngày thanh toán" prop="payment_date">
                  <el-date-picker :editable="false"
                    v-model="form.payment_date"
                    type="date"
                    placeholder="Chọn ngày đóng"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Giờ thanh toán" prop="payment_time_str">
                  <el-time-picker
                    v-model="form.payment_time_str"
                    format="HH:mm:ss"
                    value-format="HH:mm:ss"
                    placeholder="Chọn giờ đóng"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Số tiền đóng" prop="payment_amount_text">
                  <el-input
                    v-model="form.payment_amount_text"
                    placeholder="Nhập số tiền đã đóng..."
                    @input="(v) => handlePriceInput(v)"
                  >
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-form>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2 pr-2">
          <el-button @click="dialogVisible = false">Hủy</el-button>
          <el-button type="primary" @click="submitForm">Xác nhận</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Payment Details Dialog -->
    <el-dialog 
      v-model="detailDialogVisible" 
      title="CHI TIẾT PHIẾU THANH TOÁN" 
      width="750px" 
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedPayment" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto overflow-x-hidden text-left">
        <!-- Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-emerald-500 dark:bg-emerald-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32">
              <CreditCard />
            </el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-left">Phiếu thanh toán</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5 text-left">
              Hợp đồng: {{ selectedPayment.contract_id }}
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span class="flex items-center gap-1">
                <el-icon><Calendar /></el-icon>
                Đóng ngày: {{ formatDate(selectedPayment.payment_date) }} lúc {{ formatTime(selectedPayment.payment_time) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 1. THÔNG TIN KHÁCH HÀNG & HỢP ĐỒNG -->
        <div>
          <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            Thông tin Khách hàng & Hợp đồng
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã Hợp đồng</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedPayment.contract_id }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã Bất động sản</div>
              <div class="text-sm font-mono text-gray-800 dark:text-gray-200">{{ selectedPayment.real_estate_id }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã khách</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedPayment.customer_code || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Loại hợp đồng</div>
              <div class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ selectedPayment.type_contract || '—' }}</div>
            </div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
            <div class="col-span-2">
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tên khách hàng</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedPayment.customer_name }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số điện thoại</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedPayment.number_phone || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tên nhóm</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedPayment.group_name || '—' }}</div>
            </div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
            <div class="col-span-2">
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Liên hệ</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedPayment.contact_info || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày bắt đầu thuê</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatDate(selectedPayment.start_rental || '') }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày kết thúc thuê</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatDate(selectedPayment.end_rental || '') }}</div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 2. CHI TIẾT THANH TOÁN -->
        <div>
          <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
            Chi tiết giao dịch
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tiền đặt cọc</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatCurrency(selectedPayment.deposit) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tiền thuê / Tháng</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatCurrency(selectedPayment.monthly_rental) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Công nợ hợp đồng</div>
              <div class="text-sm font-semibold text-rose-600 dark:text-rose-400">{{ formatCurrency(selectedPayment.rental_debt) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 font-bold text-emerald-600 dark:text-emerald-400">Số tiền đã đóng</div>
              <div class="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{{ formatCurrency(selectedPayment.payment_amount) }}</div>
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { mauSo } from '@/utils/mauSo'
import { Search, MoreFilled, CreditCard, Calendar, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { rentalService } from '@/api/rentalService'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'

const { laManHep, hienBang, hienThe } = dungManHep()

interface Payment {
  id: string
  contract_id: string
  payment_date: string
  payment_time: string
  payment_amount: number
  // Joined fields
  customer_name: string
  group_name: string
  number_phone: string
  real_estate_id: string
  monthly_rental: number
  rental_debt: number
  // Extra fields from response
  customer_code?: string
  contact_info?: string
  type_contract?: string
  start_rental?: string
  end_rental?: string
  deposit?: number
  status?: string
}

const loading = ref(false)
const searchQuery = ref('')
const currentYear = new Date().getFullYear()
const monthRange = ref<[string, string] | null>([`${currentYear}-01`, `${currentYear}-12`])

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Active activeContracts list state fetched dynamically
const activeContracts = ref<any[]>([])
const payments = ref<Payment[]>([])

// Auto populating selected contract details in the Add/Edit form
const selectedContractInfo = computed(() => {
  if (!form.contract_id) return null
  return activeContracts.value.find(c => c.contract_id === form.contract_id) || null
})

const handleContractChange = (val: string) => {
  const info = activeContracts.value.find(c => c.contract_id === val)
  if (info) {
    // Suggest payment amount
    form.payment_amount = info.rental_debt || info.monthly_rental || 0
    form.payment_amount_text = new Intl.NumberFormat('vi-VN').format(form.payment_amount)
  }
}

// Search and Date range filters
const filteredPayments = computed(() => {
  return payments.value.filter(p => {
    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return true

    return (
      p.contract_id.toLowerCase().includes(q) ||
      p.real_estate_id.toLowerCase().includes(q) ||
      p.customer_name.toLowerCase().includes(q) ||
      (p.customer_code && p.customer_code.toLowerCase().includes(q)) ||
      (p.group_name && p.group_name.toLowerCase().includes(q))
    )
  })
})

const sortProp = ref('')
const sortOrder = ref('')

const handleSortChange = ({ prop, order }: { prop: string, order: string }) => {
  sortProp.value = prop
  sortOrder.value = order
}

const sortedPayments = computed(() => {
  const result = [...filteredPayments.value]
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

// Add/Edit Dialog State
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<any>(null)

// Details Dialog State
const detailDialogVisible = ref(false)
const selectedPayment = ref<Payment | null>(null)

const openDetailDialog = (row: Payment) => {
  selectedPayment.value = row
  detailDialogVisible.value = true
}

const form = reactive({
  id: '',
  contract_id: '',
  payment_date: '',
  payment_time_str: '',
  payment_amount: 0,
  payment_amount_text: ''
})

const rules = reactive({
  contract_id: [{ required: true, message: 'Vui lòng chọn hợp đồng', trigger: 'change' }],
  payment_date: [{ required: true, message: 'Vui lòng chọn ngày thanh toán', trigger: 'change' }],
  payment_amount_text: [{ required: true, message: 'Vui lòng nhập số tiền thanh toán', trigger: 'blur' }]
})

const handlePriceInput = (val: string) => {
  const numericVal = val.replace(/[^0-9]/g, '')
  const num = parseInt(numericVal, 10)
  if (!isNaN(num)) {
    form.payment_amount = num
    form.payment_amount_text = new Intl.NumberFormat('vi-VN').format(num)
  } else {
    form.payment_amount = 0
    form.payment_amount_text = ''
  }
}

const handleCommand = (cmd: string, row: Payment) => {
  if (cmd === 'detail') {
    openDetailDialog(row)
  } else if (cmd === 'edit') {
    openEditDialog(row)
  } else if (cmd === 'delete') {
    handleDelete(row)
  }
}

const openAddDialog = () => {
  fetchActiveContracts()
  isEdit.value = false
  form.id = ''
  form.contract_id = ''
  form.payment_date = new Date().toISOString().substring(0, 10)
  
  // Format current local time string: HH:MM:ss
  const now = new Date()
  const hrs = String(now.getHours()).padStart(2, '0')
  const mins = String(now.getMinutes()).padStart(2, '0')
  const secs = String(now.getSeconds()).padStart(2, '0')
  form.payment_time_str = `${hrs}:${mins}:${secs}`
  
  form.payment_amount = 0
  form.payment_amount_text = ''
  dialogVisible.value = true
}

const openEditDialog = (row: Payment) => {
  fetchActiveContracts()
  isEdit.value = true
  form.id = row.id
  form.contract_id = row.contract_id
  form.payment_date = row.payment_date
  // Extract HH:mm:ss if it is a full datetime ISO string for el-time-picker compatibility
  form.payment_time_str = row.payment_time && row.payment_time.includes('T')
    ? (row.payment_time.split('T')[1]?.split('.')[0] || '12:00:00')
    : row.payment_time
  form.payment_amount = row.payment_amount
  form.payment_amount_text = new Intl.NumberFormat('vi-VN').format(row.payment_amount)
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      if (isEdit.value) {
        loading.value = true
        try {
          const apiPayload = {
            id: form.id,
            contract_id: form.contract_id,
            payment_date: form.payment_date,
            payment_time: `${form.payment_date}T${form.payment_time_str || '12:00:00'}.000Z`,
            payment_amount: Number(form.payment_amount) || 0
          }
          await rentalService.updateRentalPayments([apiPayload])
          ElMessage.success('Cập nhật phiếu thanh toán thành công!')
          dialogVisible.value = false
          await fetchPayments()
        } catch (error: any) {
          ElMessage.error(error.message || 'Lỗi khi cập nhật thanh toán')
        } finally {
          loading.value = false
        }
      } else {
        loading.value = true
        try {
          const apiPayload = {
            contract_id: form.contract_id,
            payment_date: form.payment_date,
            payment_time: `${form.payment_date}T${form.payment_time_str || '12:00:00'}.000Z`,
            payment_amount: Number(form.payment_amount) || 0
          }
          await rentalService.addRentalPayments([apiPayload])
          ElMessage.success('Ghi nhận thanh toán mới thành công!')
          dialogVisible.value = false
          await fetchPayments()
        } catch (error: any) {
          ElMessage.error(error.message || 'Lỗi khi ghi nhận thanh toán mới')
        } finally {
          loading.value = false
        }
      }
    }
  })
}

const handleDelete = async (row: Payment) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa giao dịch thanh toán hợp đồng "${row.contract_id}" vào ngày ${formatDate(row.payment_date)}?`,
      'Xác nhận xóa thanh toán',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy bỏ',
        type: 'warning'
      }
    )
    loading.value = true
    try {
      await rentalService.deleteRentalPayments([row.id])
      ElMessage.success('Xóa phiếu thanh toán thành công!')
      await fetchPayments()
    } catch (error: any) {
      ElMessage.error(error.message || 'Lỗi khi xóa thanh toán')
    } finally {
      loading.value = false
    }
  } catch (err) {
    // cancelled
  }
}

// Fetch payments from the backend get-rental-payments API
const fetchPayments = async () => {
  loading.value = true
  try {
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
      start_date: startDateParam,
      end_date: endDateParam
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
    ElMessage.error(error.message || 'Lỗi khi tải danh sách thanh toán')
  } finally {
    loading.value = false
  }
}

const fetchActiveContracts = async () => {
  try {
    const all = await rentalService.getRentals()
    activeContracts.value = all.filter(c => c.status === 'active' || c.status === 'bad_debt')
  } catch (error) {
    console.error('Failed to fetch active contracts:', error)
  }
}

watch(monthRange, () => {
  fetchPayments()
})

// Helpers
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

onMounted(() => {
  fetchPayments()
  fetchActiveContracts()
})
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

html.dark .custom-dark-input :deep(.el-input__wrapper) {
  background-color: #1f2937;
  box-shadow: 0 0 0 1px #374151 inset;
}
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
/* Unscoped date picker dark mode overrides matching Tien Nga */
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
