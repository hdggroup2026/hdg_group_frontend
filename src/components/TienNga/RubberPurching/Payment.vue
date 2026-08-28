<template>
  <div class="payment-container h-full flex flex-col">
    <!-- Filter bar -->
    <div class="flex flex-wrap justify-between items-center gap-x-4 gap-y-4 mb-4 shrink-0">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-4">
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Điểm thu mua:</span>
          <el-select 
            v-model="selectedFactory" 
            placeholder="Chọn xưởng/đại lý" 
            style="width: 200px"
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Tất cả" value="all" />
            <el-option 
              v-for="point in collectionPoints" 
              :key="point.id" 
              :label="point.collection_name" 
              :value="point.collection_name" 
            />
          </el-select>
        </div>

        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian:</span>
          <el-date-picker :editable="false"
            v-model="dateRange"
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

        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Mã hộ dân:</span>
          <el-input
            v-model="householdId"
            placeholder="Nhập mã hộ..."
            clearable
            class="w-48 custom-dark-input"
          />
        </div>

        <el-button type="primary" :icon="Search" @click="fetchDailyPurchases">Tìm kiếm</el-button>
        <el-button 
          type="success" 
          :disabled="selectedRows.length === 0" 
          @click="handlePayment"
        >
          Thanh toán
        </el-button>
        <el-button 
          type="danger" 
          :disabled="selectedRows.length === 0" 
          @click="handleDeletePayment"
        >
          Xóa đã thanh toán
        </el-button>
      </div>
    </div>

    <!-- Summary Statistics Cards -->
    <div v-if="hasSearched" class="summary-cards mb-4 shrink-0">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="stat-card stat-card--green">
          <div class="stat-card__label">Tổng thành tiền</div>
          <div class="stat-card__value text-green-600 dark:text-green-400">{{ formatCurrency(paymentStats.totalAmount) }} VNĐ</div>
        </div>
        <div class="stat-card stat-card--orange">
          <div class="stat-card__label">Tổng đã thanh toán</div>
          <div class="stat-card__value text-orange-500 dark:text-orange-400">{{ formatCurrency(paymentStats.totalPaid) }} VNĐ</div>
        </div>
        <div class="stat-card stat-card--blue">
          <div class="stat-card__label">Tổng lưu sổ</div>
          <div class="stat-card__value text-blue-600 dark:text-blue-400">{{ formatCurrency(paymentStats.totalBookSaved) }} VNĐ</div>
        </div>
      </div>
    </div>

    <!-- Table Results -->
    <div v-if="hasSearched" class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
      <el-table 
        :data="tableData" 
        style="width: 100%" 
        class="flex-1" 
        height="100%" 
        v-loading="loading"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <!-- Fixed Columns -->
        <el-table-column type="selection" width="55" fixed />
        <el-table-column label="STT" width="60" align="center" fixed>
          <template #default="{ $index }">
            <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="Mã Hộ dân" width="120" sortable="custom" fixed />

        <!-- Scrollable Columns -->
        <el-table-column prop="name" label="Họ và tên" min-width="180" />
        <el-table-column prop="purchasingPoint" label="Điểm thu mua" min-width="150" />
        <el-table-column prop="date" label="Ngày" min-width="120" />
        <el-table-column prop="productCode" label="Mã hàng" min-width="140" align="center" />
        <el-table-column prop="subsidize" label="Trợ giá" min-width="120" align="right">
          <template #default="scope">
            <span>{{ formatCurrency(scope.row.subsidize) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="Khối lượng" min-width="120" align="right">
          <template #default="scope">
            <span>{{ formatNumber(scope.row.weight) }} kg</span>
          </template>
        </el-table-column>
        <el-table-column prop="tare" label="Trừ bì" min-width="100" align="right">
          <template #default="scope">
            <span class="text-gray-500">{{ formatNumber(scope.row.tare) }} kg</span>
          </template>
        </el-table-column>
        <el-table-column prop="netWeight" label="KL thực tế" min-width="130" align="right">
          <template #default="scope">
            <span class="font-medium text-blue-500">{{ formatNumber(scope.row.netWeight) }} kg</span>
          </template>
        </el-table-column>
        <el-table-column prop="drc" label="Số độ" min-width="100" align="right">
          <template #default="scope">
            <span>{{ scope.row.drc }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="dryRubber" label="Mủ khô" min-width="120" align="right">
          <template #default="scope">
            <span class="font-medium">{{ formatNumber(scope.row.dryRubber, 2) }} kg</span>
          </template>
        </el-table-column>
        <el-table-column prop="unitPrice" label="Đơn giá" min-width="130" align="right">
          <template #default="scope">
            <span>{{ formatCurrency(scope.row.unitPrice) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="supportPrice" label="Giá hỗ trợ" min-width="120" align="right">
          <template #default="scope">
            <span>{{ formatCurrency(scope.row.supportPrice) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="Thành tiền" min-width="150" align="right">
          <template #default="scope">
            <span class="font-bold text-green-500">{{ formatCurrency(scope.row.totalAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="paidAmount" label="Đã thanh toán" min-width="150" align="right">
          <template #default="scope">
            <span class="font-medium text-orange-500">{{ formatCurrency(scope.row.paidAmount || 0) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="savedAmount" label="Lưu sổ" min-width="150" align="right">
          <template #default="scope">
            <span class="font-medium text-gray-600 dark:text-gray-400">{{ formatCurrency(scope.row.savedAmount || 0) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- Phân trang -->
      <div class="mt-auto shrink-0 p-4 flex flex-wrap justify-end gap-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- Empty state before search -->
    <div v-if="!hasSearched" class="flex-1 flex items-center justify-center">
      <div class="text-center text-gray-400 dark:text-gray-500">
        <el-icon class="text-6xl mb-4"><Search /></el-icon>
        <p class="text-lg">Vui lòng chọn các tiêu chí và nhấn <strong>Tìm kiếm</strong> để xem thông tin thanh toán chi phí</p>
      </div>
    </div>

    <!-- Modal Thanh toán -->
    <el-dialog
      v-model="paymentDialogVisible"
      title="XÁC NHẬN THANH TOÁN & GIAO DỊCH TÀI CHÍNH"
      class="custom-dark-dialog"
      width="850px"
      destroy-on-close
      align-center
    >
      <div class="max-h-[70vh] overflow-y-auto overflow-x-hidden px-4">
        <el-form 
          :model="paymentForm" 
          :rules="paymentRules"
          ref="paymentFormRef"
          label-width="140px" 
          class="mt-2 compact-form"
        >
          <!-- PHẦN 1: XÁC NHẬN THANH TOÁN CÔNG NỢ -->
          <div class="mb-5 pb-5 border-b border-gray-200 dark:border-gray-700">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              1. Xác nhận thanh toán công nợ
            </h4>

            <el-row :gutter="20">
              <template v-if="isSingleHouseholdSelected">
                <el-col :span="12">
                  <el-form-item label="Mã hộ dân">
                    <el-input v-model="paymentForm.code" disabled />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Tên hộ dân">
                    <el-input v-model="paymentForm.name" disabled />
                  </el-form-item>
                </el-col>
              </template>
              <template v-else>
                <el-col :span="24">
                  <el-form-item label="Số hộ dân đã chọn">
                    <el-input :model-value="uniqueHouseholdCount + ' hộ dân'" disabled />
                  </el-form-item>
                </el-col>
              </template>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tổng công nợ">
                  <el-input :model-value="formatCurrency(paymentForm.totalDebt) + ' VNĐ'" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tổng tiền lưu sổ">
                  <el-input :model-value="formatCurrency(paymentForm.savedAmount) + ' VNĐ'" disabled />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Khấu trừ ứng tiền">
                  <el-switch 
                    v-model="paymentForm.deductAdvance" 
                    active-text="Bật"
                    inactive-text="Tắt"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12" v-if="paymentForm.deductAdvance">
                <el-form-item label="Số tiền đã ứng">
                  <el-input :model-value="formatCurrency(paymentForm.advanceAmount) + ' VNĐ'" disabled />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Hình thức">
                  <el-radio-group v-model="paymentForm.type" @change="handlePaymentTypeChange">
                    <el-radio-button label="chi">Chi tiền</el-radio-button>
                    <el-radio-button label="thu">Thu tiền</el-radio-button>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Số tiền" prop="payAmountText">
                  <el-input 
                    v-model="paymentForm.payAmountText" 
                    placeholder="Nhập số tiền..." 
                    @input="handlePayAmountInput"
                  >
                    <template #suffix>
                      <span class="text-xs text-gray-400">VNĐ</span>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: THÊM MỚI GIAO DỊCH TÀI CHÍNH -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-green-500 rounded-full"></span>
              2. Giao dịch tài chính
            </h4>

            <!-- Phân loại giao dịch -->
            <div class="mb-4">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5 pl-3 border-l-2 border-green-400">
                Phân loại giao dịch
              </h4>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Quỹ tiền" prop="subFundId">
                    <el-select v-model="paymentForm.subFundId" placeholder="Chọn Quỹ tiền" class="w-full highlight-select" style="width: 100%">
                      <el-option 
                        v-for="sub in subFunds" 
                        :key="sub.id" 
                        :label="sub.name" 
                        :value="sub.id" 
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Thời gian" prop="date">
                    <el-date-picker :editable="false" 
                      v-model="paymentForm.date" 
                      type="date" 
                      placeholder="Chọn ngày giao dịch" 
                      value-format="YYYY-MM-DD"
                      class="w-full"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Loại thanh toán" required>
                    <el-switch 
                      v-model="paymentForm.type" 
                      active-value="chi" 
                      inactive-value="thu" 
                      active-text="Chi tiền" 
                      inactive-text="Thu tiền" 
                      @change="handlePaymentTypeChange" 
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Mã giao dịch" prop="transactionCode">
                    <el-select v-model="paymentForm.transactionCode" placeholder="Chọn mã giao dịch" class="w-full highlight-select" style="width: 100%">
                      <el-option label="MN - Mủ Nước" value="MN" />
                      <el-option label="MTP - Mủ Thành Phẩm" value="MTP" />
                      <el-option label="MPP - Mủ Phụ Phẩm" value="MPP" />
                      <el-option label="NL - Nguyên Liệu" value="NL" />
                      <el-option label="LNV - Lương Nhân Viên" value="LNV" />
                      <el-option label="K - Khác" value="K" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Số tiền giao dịch">
                    <el-input 
                      :model-value="displayTransactionAmount" 
                      disabled 
                      placeholder="Số tiền..."
                    >
                      <template #suffix>
                        <span class="text-xs text-gray-400">VNĐ</span>
                      </template>
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <!-- Đối tượng giao dịch -->
            <div class="mb-4">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5 pl-3 border-l-2 border-green-400">
                Đối tượng giao dịch
              </h4>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Bên yêu cầu" prop="requestingParty">
                    <el-input v-model="paymentForm.requestingParty" placeholder="Nhập bên yêu cầu..." />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Bên thực hiện" prop="executingParty">
                    <el-input v-model="paymentForm.executingParty" placeholder="Nhập bên thực hiện..." />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Bên nhận" prop="receivingParty">
                    <el-input v-model="paymentForm.receivingParty" placeholder="Nhập bên nhận..." />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <!-- Chi tiết giao dịch -->
            <div class="mb-4">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5 pl-3 border-l-2 border-green-400">
                Chi tiết giao dịch
              </h4>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Trạng thái" prop="status">
                    <el-select v-model="paymentForm.status" placeholder="Chọn trạng thái" class="w-full highlight-select" style="width: 100%">
                      <el-option label="Đã chấp thuận" value="approved" />
                      <el-option label="Chưa chấp thuận" value="unapproved" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Mục đích" prop="purpose">
                    <el-input v-model="paymentForm.purpose" placeholder="Nhập mục đích..." />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <!-- Lý do & Ghi chú -->
            <div class="mb-2">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5 pl-3 border-l-2 border-green-400">
                Lý do &amp; Ghi chú
              </h4>
              <el-row :gutter="20">
                <el-col :span="24">
                  <el-form-item label="Ghi chú" prop="note">
                    <el-input v-model="paymentForm.note" placeholder="Nhập ghi chú thêm..." />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="24">
                  <el-form-item label="Lí do" prop="reason">
                    <el-input 
                      v-model="paymentForm.reason" 
                      type="textarea" 
                      :rows="2" 
                      placeholder="Mô tả lý do..." 
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </div>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="paymentDialogVisible = false">Hủy</el-button>
          <el-button type="primary" :loading="loading" @click="submitPayment">
            Xác nhận &amp; Lưu giao dịch
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Modal Xóa đã thanh toán -->
    <el-dialog
      v-model="deletePaymentDialogVisible"
      title="XÓA THANH TOÁN & CẬP NHẬT CÔNG NỢ"
      class="custom-dark-dialog"
      width="600px"
      destroy-on-close
      align-center
    >
      <div class="px-4 py-2">
        <!-- Thông tin hộ dân -->
        <div class="flex items-center gap-4 pb-3 mb-4 border-b border-gray-100 dark:border-gray-700">
          <el-avatar :size="48" class="bg-red-100 dark:bg-red-900">
            <span class="text-lg font-bold text-red-600 dark:text-red-400">
              {{ deletePaymentForm.name ? deletePaymentForm.name.charAt(0).toUpperCase() : 'H' }}
            </span>
          </el-avatar>
          <div>
            <h4 class="text-base font-bold text-gray-800 dark:text-gray-100">
              {{ deletePaymentForm.name }}
              <span class="text-gray-400 dark:text-gray-500 font-medium">({{ deletePaymentForm.code }})</span>
            </h4>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Điểm thu mua: <span class="font-semibold text-gray-700 dark:text-gray-300">{{ deletePaymentForm.purchasingPoint }}</span>
            </div>
          </div>
        </div>

        <!-- Trạng thái công nợ hiện tại -->
        <div class="grid grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 mb-4">
          <div class="text-center">
            <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Nợ hiện tại</div>
            <div class="text-xs font-bold text-red-500 mt-0.5">{{ formatCurrency(deletePaymentForm.debtAmount) }}</div>
          </div>
          <div class="text-center border-x border-gray-100 dark:border-gray-700">
            <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Đã ứng</div>
            <div class="text-xs font-bold text-orange-500 mt-0.5">{{ formatCurrency(deletePaymentForm.advanceAmount) }}</div>
          </div>
          <div class="text-center">
            <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Công nợ</div>
            <div class="text-xs font-bold text-gray-700 dark:text-gray-300 mt-0.5">{{ formatCurrency(deletePaymentForm.totalDebt) }}</div>
          </div>
        </div>

        <!-- Số tiền thanh toán cần xóa -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Số tiền đã thanh toán cần xóa</label>
          <el-input 
            :model-value="formatCurrency(deletePaymentForm.revertAmount) + ' VNĐ'"
            disabled 
          />
        </div>

        <!-- Cập nhật số liệu sau khi xóa -->
        <div class="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/30 rounded-lg text-sm flex justify-between items-center h-[40px] mb-4">
          <span class="text-gray-500 dark:text-gray-400">Công nợ mới sau khi xóa:</span>
          <span class="font-semibold text-red-600 dark:text-red-400">{{ formatCurrency(computedNewDebtTotal) }} VNĐ</span>
        </div>

        <!-- Cảnh báo/Lưu ý -->
        <div class="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg text-sm text-red-600 dark:text-red-400 flex items-start gap-2.5">
          <el-icon class="mt-0.5 shrink-0"><Warning /></el-icon>
          <div>
            <span class="font-bold">Lưu ý:</span> Nhớ xóa dữ liệu liên quan trong Tài chính nhé!!!
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deletePaymentDialogVisible = false">Hủy</el-button>
          <el-button type="danger" :loading="loading" @click="submitDeletePayment">
            Xác nhận xóa
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { dinhDangSo, dinhDangSoLe } from '@/utils/dinhDangSo'
import { ref, computed, onMounted, reactive } from 'vue'
import { Search, Warning } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { tienNgaService } from '@/api/tienNgaService'

const formatDate = (date: Date) => {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const getInitialDateRange = (): [string, string] => {
  const today = new Date()
  const lastWeek = new Date()
  lastWeek.setDate(today.getDate() - 6)
  return [formatDate(lastWeek), formatDate(today)]
}

const currentPage = ref(1)
const pageSize = ref(10)
const selectedFactory = ref('all')
const dateRange = ref<[string, string] | null>(null)
const householdId = ref('')
const hasSearched = ref(false)
const loading = ref(false)
const collectionPoints = ref<any[]>([])
const allData = ref<any[]>([])
const selectedRows = ref<any[]>([])

const handleSelectionChange = (val: any[]) => {
  selectedRows.value = val
}

const paymentDialogVisible = ref(false)
const paymentFormRef = ref<any>(null)
const subFunds = ref<any[]>([])
const deletePaymentDialogVisible = ref(false)
const deletePaymentForm = ref({
  code: '',
  name: '',
  purchasingPoint: '',
  debtAmount: 0,
  advanceAmount: 0,
  totalDebt: 0,
  revertAmount: 0
})

const computedNewDebtTotal = computed(() => {
  return deletePaymentForm.value.totalDebt + deletePaymentForm.value.revertAmount
})

const paymentForm = ref({
  id: '',
  code: '',
  name: '',
  savedAmount: 0,
  paidAmount: 0,
  totalAmount: 0,
  payAmount: '',
  payAmountText: '',
  totalDebt: 0,
  advanceAmount: 0,
  deductAdvance: false,
  type: 'chi',
  subFundId: '',
  date: new Date().toISOString().substring(0, 10),
  status: 'approved',
  requestingParty: '',
  executingParty: '',
  receivingParty: '',
  purpose: '',
  note: '',
  reason: '',
  transactionCode: 'MN'
})

const paymentRules = reactive({
  payAmountText: [{ required: true, message: 'Vui lòng nhập số tiền', trigger: 'blur' }],
  subFundId: [{ required: true, message: 'Vui lòng chọn Quỹ tiền', trigger: 'change' }],
  date: [{ required: true, message: 'Vui lòng chọn ngày giao dịch', trigger: 'change' }],
  requestingParty: [{ required: true, message: 'Vui lòng nhập bên yêu cầu', trigger: 'blur' }],
  executingParty: [{ required: true, message: 'Vui lòng nhập bên thực hiện', trigger: 'blur' }],
  receivingParty: [{ required: true, message: 'Vui lòng nhập bên nhận', trigger: 'blur' }],
  purpose: [{ required: true, message: 'Vui lòng nhập mục đích', trigger: 'blur' }],
})

const parseNumberString = (val: string | number | null | undefined) => {
  if (val === undefined || val === null || val === '') return 0
  if (typeof val === 'number') return val
  let str = String(val).trim()
  if (str.includes(',')) {
    str = str.replace(/\./g, '').replace(/,/g, '.')
  } else if ((str.split('.').length - 1) > 1) {
    str = str.replace(/\./g, '')
  }
  return parseFloat(str) || 0
}

const handlePayAmountInput = (val: string) => {
  const numericVal = val.replace(/[^0-9]/g, '')
  const num = parseInt(numericVal, 10)
  if (!isNaN(num)) {
    paymentForm.value.payAmount = String(num)
    paymentForm.value.payAmountText = new Intl.NumberFormat('vi-VN').format(num)
  } else {
    paymentForm.value.payAmount = ''
    paymentForm.value.payAmountText = ''
  }
}

const uniqueHouseholdCount = computed(() => {
  const codes = new Set(selectedRows.value.map(r => r.code).filter(Boolean))
  return codes.size
})

const isSingleHouseholdSelected = computed(() => {
  return uniqueHouseholdCount.value === 1
})

const handlePayment = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('Vui lòng chọn ít nhất một hộ dân để thanh toán.')
    return
  }

  const uniqueHouseholdIds = Array.from(new Set(selectedRows.value.map(r => r.code).filter(Boolean)))
  if (uniqueHouseholdIds.length === 0) {
    ElMessage.warning('Không tìm thấy mã hộ dân từ các dòng đã chọn.')
    return
  }
  if (uniqueHouseholdIds.length > 1) {
    ElMessage.warning('Chỉ có thể thanh toán cho một hộ dân tại một thời điểm. Vui lòng chọn các dòng của cùng một hộ dân.')
    return
  }

  loading.value = true
  try {
    let totalDebt = 0
    let advanceAmount = 0

    const customerPromises = uniqueHouseholdIds.map(hId => 
      tienNgaService.getCustomers('cao su', undefined, hId)
    )
    const results = await Promise.all(customerPromises)
    
    results.forEach(customers => {
      if (customers && customers.length > 0) {
        totalDebt += customers[0].total_debt || 0
        advanceAmount += customers[0].cash_advance || 0
      }
    })

    const totalSavedAmount = selectedRows.value.reduce((sum, r) => sum + (r.savedAmount || 0), 0)

    const firstRow = selectedRows.value[0]
    paymentForm.value = {
      id: firstRow.id,
      code: firstRow.code,
      name: firstRow.name,
      savedAmount: totalSavedAmount,
      paidAmount: selectedRows.value.reduce((sum, r) => sum + (r.paidAmount || 0), 0),
      totalAmount: selectedRows.value.reduce((sum, r) => sum + (r.totalAmount || 0), 0),
      payAmount: String(totalSavedAmount),
      payAmountText: formatCurrency(totalSavedAmount),
      totalDebt: totalDebt,
      advanceAmount: advanceAmount,
      deductAdvance: false,
      type: 'chi',
      subFundId: subFunds.value[0]?.id || '',
      date: new Date().toISOString().substring(0, 10),
      status: 'approved',
      requestingParty: firstRow.name || '',
      executingParty: 'Tiến Nga',
      receivingParty: firstRow.name || '',
      purpose: `Thanh toán chi phí thu mua mủ cao su cho hộ ${firstRow.name}`,
      note: '',
      reason: `Thanh toán công nợ/lưu sổ ngày ${new Date().toLocaleDateString('vi-VN')}`,
      transactionCode: 'MN'
    }

    paymentDialogVisible.value = true
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi lấy thông tin công nợ hộ dân')
  } finally {
    loading.value = false
  }
}

const displayTransactionAmount = computed(() => {
  if (paymentForm.value.deductAdvance) {
    const payAmt = parseNumberString(paymentForm.value.payAmountText)
    const amt = Math.max(0, payAmt - paymentForm.value.advanceAmount)
    return formatCurrency(amt)
  }
  return paymentForm.value.payAmountText || ''
})

const submitPayment = async () => {
  if (!paymentFormRef.value) return
  await paymentFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      const payAmt = parseNumberString(paymentForm.value.payAmountText)
      if (payAmt <= 0) {
        ElMessage.warning('Vui lòng nhập số tiền thanh toán hợp lệ.')
        return
      }

      loading.value = true
      try {
        if (paymentForm.value.deductAdvance) {
          const deductionAmount = Math.min(payAmt, paymentForm.value.advanceAmount)
          const transactionAmt = Math.max(0, payAmt - deductionAmount)

          // 1. Khấu trừ ứng tiền
          if (deductionAmount > 0) {
            await tienNgaService.processDeductionAdvanceAmount([
              {
                hoursehold_id: paymentForm.value.code,
                amount: deductionAmount
              }
            ])
          }

          // 2. Trả nợ
          await tienNgaService.processDebt({
            hoursehold_id: paymentForm.value.code || null,
            employee_id: null,
            partner_id: null,
            amount: payAmt,
            type_transaction: paymentForm.value.type,
            start_date: dateRange.value ? dateRange.value[0] : null,
            end_date: dateRange.value ? dateRange.value[1] : null
          })

          // 3. Ghi nhận giao dịch tài chính thực chi
          if (transactionAmt > 0) {
            const paymentPayload = [{
              investment_id: paymentForm.value.subFundId,
              requester: paymentForm.value.requestingParty,
              executor: paymentForm.value.executingParty,
              receiver: paymentForm.value.receivingParty,
              payment_type: paymentForm.value.type,
              purpose: paymentForm.value.purpose,
              reason: paymentForm.value.reason,
              amount: transactionAmt,
              day: paymentForm.value.date,
              status: paymentForm.value.status === 'approved' ? 'APPROVED' : 'UNAPPROVED',
              notes: paymentForm.value.note,
              transaction_code: paymentForm.value.transactionCode
            }]
            
            await tienNgaService.addDailyPayments(paymentPayload)
          }
        } else {
          // Luồng thanh toán bình thường
          await tienNgaService.processDebt({
            hoursehold_id: paymentForm.value.code || null,
            employee_id: null,
            partner_id: null,
            amount: payAmt,
            type_transaction: paymentForm.value.type,
            start_date: dateRange.value ? dateRange.value[0] : null,
            end_date: dateRange.value ? dateRange.value[1] : null
          })

          const paymentPayload = [{
            investment_id: paymentForm.value.subFundId,
            requester: paymentForm.value.requestingParty,
            executor: paymentForm.value.executingParty,
            receiver: paymentForm.value.receivingParty,
            payment_type: paymentForm.value.type,
            purpose: paymentForm.value.purpose,
            reason: paymentForm.value.reason,
            amount: payAmt,
            day: paymentForm.value.date,
            status: paymentForm.value.status === 'approved' ? 'APPROVED' : 'UNAPPROVED',
            notes: paymentForm.value.note,
            transaction_code: paymentForm.value.transactionCode
          }]
          
          await tienNgaService.addDailyPayments(paymentPayload)
        }

        ElMessage.success('Thanh toán và Lưu giao dịch tài chính thành công!')
        
        paymentDialogVisible.value = false
        selectedRows.value = [] // Clear selected rows
        fetchDailyPurchases() // Refresh table data
      } catch (error: any) {
        ElMessage.error(error.message || 'Lỗi khi thực hiện thanh toán & lưu giao dịch')
      } finally {
        loading.value = false
      }
    }
  })
}

const getWeekNumber = (dateString: string): number => {
  if (!dateString) return 0
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 0
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

const handleDeletePayment = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('Vui lòng chọn ít nhất một dòng để xóa thanh toán.')
    return
  }

  const uniqueHouseholdIds = Array.from(new Set(selectedRows.value.map(r => r.code).filter(Boolean)))
  if (uniqueHouseholdIds.length === 0) {
    ElMessage.warning('Không tìm thấy mã hộ dân từ các dòng đã chọn.')
    return
  }
  if (uniqueHouseholdIds.length > 1) {
    ElMessage.warning('Chỉ có thể xóa thanh toán cho một hộ dân tại một thời điểm. Vui lòng chọn các dòng của cùng một hộ dân.')
    return
  }

  const totalPaidToRevert = selectedRows.value.reduce((sum, r) => sum + (r.paidAmount || 0), 0)
  if (totalPaidToRevert <= 0) {
    ElMessage.warning('Các dòng đã chọn không có số tiền đã thanh toán để xóa.')
    return
  }

  loading.value = true
  try {
    const hId = uniqueHouseholdIds[0]
    const customers = await tienNgaService.getCustomers('cao su', undefined, hId)
    
    let totalDebt = 0
    let advanceAmount = 0
    let debtAmount = 0

    if (customers && customers.length > 0) {
      totalDebt = customers[0].total_debt || 0
      advanceAmount = customers[0].cash_advance || 0
      debtAmount = customers[0].amount_of_debt || 0
    }

    const firstRow = selectedRows.value[0]
    deletePaymentForm.value = {
      code: firstRow.code,
      name: firstRow.name,
      purchasingPoint: firstRow.purchasingPoint,
      debtAmount: debtAmount,
      advanceAmount: advanceAmount,
      totalDebt: totalDebt,
      revertAmount: totalPaidToRevert
    }

    deletePaymentDialogVisible.value = true
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi lấy thông tin công nợ hộ dân')
  } finally {
    loading.value = false
  }
}

const submitDeletePayment = async () => {
  loading.value = true
  try {
    // 1. Trả Số tiền đã thanh toán về Lưu sổ
    const updatePromises = selectedRows.value.map(row => {
      const matchedPoint = collectionPoints.value.find(p => p.collection_name === row.purchasingPoint)
      const payload = {
        id: row.id,
        hoursehold_id: row.code,
        collection_point_id: matchedPoint ? matchedPoint.id : null,
        product_code: row.productCode,
        week: getWeekNumber(row.date),
        day: row.date,
        is_subsidized: row.subsidize,
        weight: row.weight,
        tare_weight: row.tare,
        actual_weight: row.netWeight,
        degree: row.drc,
        dry_rubber: row.dryRubber,
        unit_price: row.unitPrice,
        subsidy_price: row.supportPrice,
        total_amount: row.totalAmount,
        paid_amount: 0,
        saved_amount: row.totalAmount
      }
      return tienNgaService.updateDailyPurchases([payload])
    })

    await Promise.all(updatePromises)

    // 2. Cập nhật Công nợ cho Hộ dân trực tiếp bằng giá trị Công nợ mới sau khi xóa
    const customers = await tienNgaService.getCustomers('cao su', undefined, deletePaymentForm.value.code)
    if (customers && customers.length > 0) {
      const customer = customers[0]
      const customerPayload = {
        id: customer.id,
        fullname: customer.fullname,
        hoursehold_id: customer.hoursehold_id,
        collection_point_id: customer.collection_point_id,
        number_phone: customer.number_phone,
        address: customer.address,
        ingredient: customer.ingredient || 'cao su',
        amount_of_debt: customer.amount_of_debt || 0,
        cash_advance: customer.cash_advance || 0,
        total_debt: computedNewDebtTotal.value, // Ghi đè chính xác công nợ mới sau khi xóa
        status: customer.status || 'ACTIVE',
        username: customer.username,
        telegram_group: customer.telegram_group,
        number_bank: customer.number_bank,
        bank_name: customer.bank_name,
        is_subsidized: customer.is_subsidized || 0
      }
      await tienNgaService.updateCustomers([customerPayload])
    }

    ElMessage.success('Xóa thanh toán và cập nhật công nợ hộ dân thành công!')
    
    deletePaymentDialogVisible.value = false
    selectedRows.value = [] // Clear selected rows
    fetchDailyPurchases() // Refresh table data
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi thực hiện xóa thanh toán & cập nhật công nợ')
  } finally {
    loading.value = false
  }
}

const fetchCollectionPoints = async () => {
  try {
    const data = await tienNgaService.getCollectionPoints('Cao su')
    collectionPoints.value = data
  } catch (error: any) {
    console.error('Failed to fetch collection points:', error)
  }
}

const fetchDailyPurchases = async () => {
  loading.value = true
  hasSearched.value = true
  try {
    const params: any = {}
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    if (selectedFactory.value !== 'all') {
      const matchedPoint = collectionPoints.value.find(p => p.collection_name === selectedFactory.value)
      if (matchedPoint) {
        params.collection_point_id = matchedPoint.id
      }
    }
    if (householdId.value.trim()) {
      params.hoursehold_id = householdId.value.trim()
    }

    const data = await tienNgaService.getDailyPurchases(params)
    allData.value = data.map(item => ({
      id: item.id || Math.random().toString(36).substring(2, 9),
      code: item.hoursehold_id || '',
      name: item.fullname || 'Chưa rõ',
      purchasingPoint: item.collection_name || 'Không rõ',
      date: item.day || '',
      subsidize: item.is_subsidized || 0,
      weight: item.weight || 0,
      tare: item.tare_weight || 0,
      netWeight: item.actual_weight || 0,
      drc: item.degree || 0,
      dryRubber: item.dry_rubber || 0,
      unitPrice: item.unit_price || 0,
      supportPrice: item.subsidy_price || 0,
      totalAmount: item.total_amount || 0,
      paidAmount: item.paid_amount || 0,
      savedAmount: item.saved_amount || 0,
      productCode: item.product_code || ''
    }))
  } catch (error: any) {
    ElMessage.error(error.message || 'Không thể tải danh sách thu mua')
  } finally {
    loading.value = false
  }
}

const handlePaymentTypeChange = (val: any) => {
  const type = String(val)
  const name = paymentForm.value.name || 'Hộ dân'
  if (type === 'chi') {
    paymentForm.value.requestingParty = name
    paymentForm.value.executingParty = 'Tiến Nga'
    paymentForm.value.receivingParty = name
  } else {
    paymentForm.value.requestingParty = name
    paymentForm.value.executingParty = name
    paymentForm.value.receivingParty = 'Tiến Nga'
  }
}

const fetchSubFunds = async () => {
  try {
    const data = await tienNgaService.getInvestments({ role: 'member' })
    // Chỉ lấy các Quỹ con hoạt động (status là ACTIVE)
    subFunds.value = data.filter((item: any) => item.status === 'ACTIVE')
  } catch (error: any) {
    console.error('Failed to fetch sub funds:', error)
  }
}

onMounted(() => {
  fetchCollectionPoints()
  fetchSubFunds()
})

const handleSizeChange = (val: number) => {
  currentPage.value = 1
  pageSize.value = val
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

const formatCurrency = (value: number) => {
  return dinhDangSo(value)
}

const formatNumber = (value: any, _decimals?: number) => {
  // ══ MỤC 372 (28/08/2026) — SỐ ĐO GIỮ PHẦN LẺ ══
  //
  // 🔴 MỤC 355 áp quá rộng: nó bỏ phần lẻ cho MỌI con số, kể cả khối
  // lượng và số độ. Kế toán nhắn 28/08: "hộ Thành 87.6 − 1 = 86.6 mà
  // hiện đang ra số chẵn", "em thử nhập mấy hộ đều bị vậy" — cả buổi
  // chiều phải bấm máy tính tay kiểm lại từng phiếu.
  //
  // s68 làm rõ: chỉ KẾT QUẢ TÍNH RA SỐ TIỀN CUỐI CÙNG mới bỏ phần lẻ.
  // Mọi thông số và ô nhập liệu vẫn hiện đủ.
  //
  // ➜ `formatNumber`  — số đo (kg, số độ). Giữ phần lẻ.
  // ➜ `formatCurrency` — tiền. Vẫn cắt sạch phần lẻ như MỤC 355.
  //
  // Vẫn CẮT chứ không làm tròn, và bỏ đuôi ",00" cho số tròn.
  return dinhDangSoLe(value, _decimals ?? 2)
}

const total = computed(() => allData.value.length)

const paymentStats = computed(() => {
  const data = allData.value
  return {
    totalAmount: data.reduce((sum, r) => sum + r.totalAmount, 0),
    totalPaid: data.reduce((sum, r) => sum + r.paidAmount, 0),
    totalBookSaved: data.reduce((sum, r) => sum + r.savedAmount, 0),
  }
})

const sortProp = ref('')
const sortOrder = ref('')

const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  sortProp.value = prop
  sortOrder.value = order
  currentPage.value = 1
}

const sortedData = computed(() => {
  const list = [...allData.value]
  if (!sortProp.value || !sortOrder.value) return list

  return list.sort((a, b) => {
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
  return sortedData.value.slice(start, end)
})
</script>

<style scoped>
.payment-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

/* Cho phân trang tự xuống dòng khi có nhiều trang */
.payment-container :deep(.el-pagination) {
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

/* Summary stat cards */
.stat-card {
  padding: 16px 20px;
  border-radius: 10px;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-card__label {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 6px;
}

.stat-card__value {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* Card accent borders */
.stat-card--orange { border-left: 4px solid #f97316; }
.stat-card--blue { border-left: 4px solid #3b82f6; }
.stat-card--green { border-left: 4px solid #22c55e; }

/* Dark Mode: Stat cards */
html.dark .stat-card {
  background-color: #1f2937;
  border-color: #374151;
}

html.dark .stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

html.dark .stat-card__label {
  color: #9ca3af;
}

/* Tùy chỉnh toàn diện bảng cho Dark Mode */
html.dark .payment-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827; /* bg-gray-900 */
  --el-table-row-hover-bg-color: #374151; /* bg-gray-700 */
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .payment-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .payment-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

/* Fix nền cột cố định (fixed columns) trong Dark mode */
html.dark .payment-container :deep(.el-table .el-table-fixed-column--left),
html.dark .payment-container :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important; /* bg-gray-800 */
}

/* Tùy chỉnh select và input trong Dark Mode */
html.dark .custom-dark-select :deep(.el-input__wrapper),
html.dark .custom-dark-input :deep(.el-input__wrapper) {
  background-color: #1f2937;
  box-shadow: 0 0 0 1px #374151 inset;
}

html.dark .custom-dark-select :deep(.el-input__inner),
html.dark .custom-dark-input :deep(.el-input__inner) {
  color: #f3f4f6;
}
</style>
