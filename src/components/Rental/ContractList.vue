<template>
  <div class="rental-container h-full flex flex-col">
    <!-- Filter Bar -->
    <div class="flex justify-between items-center mb-4 shrink-0">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái:</span>
          <el-select
            v-model="filterStatus"
            placeholder="Tất cả"
            style="width: 150px"
            clearable
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Tất cả" value="" />
            <el-option label="Đang thuê" value="active" />
            <el-option label="Hết hạn" value="expired" />
            <el-option label="Đã hủy" value="cancelled" />
            <el-option label="Nợ xấu" value="bad_debt" />
            <el-option label="Bản nháp" value="draft" />
          </el-select>
        </div>
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
          <el-input
            v-model="searchQuery"
            placeholder="Tìm tên khách thuê, mã HĐ..."
            :prefix-icon="Search"
            clearable
            class="w-64 custom-dark-input"
          />
        </div>
      </div>
      <div class="flex items-center gap-2">
        <el-button :icon="Refresh" circle @click="fetchContracts" :loading="loading" />
        <el-button type="primary" @click="openAddDialog">Tạo hợp đồng mới</el-button>
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

           Đã bỏ 4 cột ghim ở bảng này.
           ══════════════════════════════════════════════════════════ -->
      <el-table v-if="hienBang" v-loading="loading" :data="paginatedData" style="width: 100%" class="flex-1" height="100%" @sort-change="handleSortChange">
        <el-table-column label="STT" width="52" align="center">
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="contract_id" label="Mã HĐ" width="101" sortable="custom">
          <template #default="{ row }">
            <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400">{{ row.contract_id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="customer_name" label="Khách thuê" width="144" sortable="custom">
          <template #default="{ row }">
            <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.customer_name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="customer_code" label="Mã khách" width="94" sortable="custom" />
        <!-- MỤC 420 (30/08/2026) — tên nhóm không còn bị cắt.
             `width` cố định + `show-overflow-tooltip` nghĩa là cắt rồi
             hiện lại khi rê chuột — mà trên iPad không rê chuột được.
             Đổi sang `min-width` co giãn + cho xuống dòng. -->
        <el-table-column prop="group_name" label="Tên nhóm" min- min-width="150" />
        <el-table-column prop="contact_info" label="Liên hệ" width="115" />
        <el-table-column prop="number_phone" label="Số điện thoại" width="101" />
        <el-table-column prop="type_contract" label="Loại HĐ" min-width="130" show-overflow-tooltip />
        <el-table-column prop="real_estate_id" label="Mã BĐS" width="94" />
        <el-table-column label="Giá thuê (Tháng)" width="115" align="right">
          <template #default="{ row }">
            <span class="font-semibold" :class="mauSo(row.monthly_rental)">{{ formatCurrency(row.monthly_rental) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Tiền cọc" width="108" align="right">
          <template #default="{ row }">
            <span :class="mauSo(row.deposit)">{{ formatCurrency(row.deposit) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Nợ tiền thuê" width="108" align="right">
          <template #default="{ row }">
            <span :class="row.rental_debt > 0 ? 'text-red-500 font-semibold' : 'text-gray-600 dark:text-gray-400'">
              {{ formatCurrency(row.rental_debt) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Ngày bắt đầu" width="90" align="center">
          <template #default="{ row }">
            <span class="text-xs">{{ row.start_rental }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Ngày kết thúc" width="90" align="center">
          <template #default="{ row }">
            <span class="text-xs text-gray-600 dark:text-gray-400">{{ row.end_rental }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="94" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" effect="light" size="small" round>
              {{ getStatusText(row.status) }}
            </el-tag>
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
                  <el-dropdown-item command="edit">Chỉnh sửa</el-dropdown-item>
                  <el-dropdown-item command="schedule">Lên lịch hẹn</el-dropdown-item>
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
                <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400">{{ row.contract_id }}</span>
              </div>
              <div class="shrink-0">
                <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
                              <el-button link type="info" class="p-1">
                                <el-icon class="text-xl"><MoreFilled /></el-icon>
                              </el-button>
                              <template #dropdown>
                                <el-dropdown-menu>
                                  <el-dropdown-item command="edit">Chỉnh sửa</el-dropdown-item>
                                  <el-dropdown-item command="schedule">Lên lịch hẹn</el-dropdown-item>
                                  <el-dropdown-item command="delete" divided class="!text-red-500">Xóa</el-dropdown-item>
                                </el-dropdown-menu>
                              </template>
                            </el-dropdown>
              </div>
            </div>
            <div class="space-y-2 text-sm text-left">
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Khách thuê:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.customer_name }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Mã khách:</span>
                <span class="text-right break-words min-w-0">
                  {{ row.customer_code }}
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tên nhóm:</span>
                <span class="text-right break-words min-w-0">
                  {{ row.group_name }}
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Liên hệ:</span>
                <span class="text-right break-words min-w-0">
                  {{ row.contact_info }}
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Số điện thoại:</span>
                <span class="text-right break-words min-w-0">
                  {{ row.number_phone }}
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Loại HĐ:</span>
                <span class="text-right break-words min-w-0">
                  {{ row.type_contract }}
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Mã BĐS:</span>
                <span class="text-right break-words min-w-0">
                  {{ row.real_estate_id }}
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Giá thuê (Tháng):</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-semibold" :class="mauSo(row.monthly_rental)">{{ formatCurrency(row.monthly_rental) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tiền cọc:</span>
                <span class="text-right break-words min-w-0">
                  <span :class="mauSo(row.deposit)">{{ formatCurrency(row.deposit) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Nợ tiền thuê:</span>
                <span class="text-right break-words min-w-0">
                  <span :class="row.rental_debt > 0 ? 'text-red-500 font-semibold' : 'text-gray-600 dark:text-gray-400'">
                                {{ formatCurrency(row.rental_debt) }}
                              </span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ngày bắt đầu:</span>
                <span class="text-right break-words min-w-0">
                  <span class="text-xs">{{ row.start_rental }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ngày kết thúc:</span>
                <span class="text-right break-words min-w-0">
                  <span class="text-xs text-gray-600 dark:text-gray-400">{{ row.end_rental }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Trạng thái:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag :type="getStatusTag(row.status)" effect="light" size="small" round>
                                {{ getStatusText(row.status) }}
                              </el-tag>
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
          :total="filteredContracts.length"
        />
      </div>
    </div>

    <!-- Add/Edit Contract Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'CHỈNH SỬA HỢP ĐỒNG CHO THUÊ' : 'TẠO HỢP ĐỒNG MỚI'"
      width="900px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="160px" class="mt-2 compact-form">
          <!-- THÔNG TIN HỢP ĐỒNG -->
          <div class="mb-6">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin hợp đồng
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã Hợp đồng" prop="contract_id">
                  <el-input v-model="form.contract_id" placeholder="VD: HĐ-2026-001..." :disabled="isEdit" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Bất động sản thuê" prop="real_estate_id">
                  <el-select
                    v-model="form.real_estate_id"
                    placeholder="Chọn BĐS thuê..."
                    :filterable="choLocDuoc"
                    clearable
                    style="width: 100%"
                    class="highlight-select"
                  >
                    <el-option
                      v-for="re in allRealEstates"
                      :key="re.id || re.real_estate_id"
                      :label="formatRealEstateLabel(re)"
                      :value="re.real_estate_id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Loại hợp đồng" prop="type_contract">
                  <el-input v-model="form.type_contract" placeholder="VD: Dài hạn, Ngắn hạn..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Trạng thái" prop="status">
                  <el-select v-model="form.status" style="width: 100%" class="highlight-select">
                    <el-option label="Đang thuê" value="active" />
                    <el-option label="Hết hạn" value="expired" />
                    <el-option label="Đã hủy" value="cancelled" />
                    <el-option label="Nợ xấu" value="bad_debt" />
                    <el-option label="Bản nháp" value="draft" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- THÔNG TIN KHÁCH THUÊ -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
                Thông tin khách thuê
              </h4>
              <div v-if="!isEdit" class="flex items-center gap-2">
                <span class="text-xs font-semibold text-gray-600 dark:text-gray-400">Tạo mới khách hàng:</span>
                <el-switch v-model="form.create_new_customer" active-text="Có" inactive-text="Không" />
              </div>
            </div>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã khách hàng" prop="customer_code">
                  <el-select
                    v-model="form.customer_code"
                    placeholder="Chọn hoặc nhập mã KH..."
                    :filterable="choLocDuoc"
                    allow-create
                    default-first-option
                    clearable
                    style="width: 100%"
                    class="highlight-select"
                  >
                    <el-option
                      v-for="cust in allCustomers"
                      :key="cust.id || cust.customer_id"
                      :label="`${cust.customer_id}${cust.customer_name ? ' - ' + cust.customer_name : ''}`"
                      :value="cust.customer_id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tên khách thuê" prop="customer_name">
                  <el-input v-model="form.customer_name" placeholder="Tên cá nhân/tổ chức thuê..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tên nhóm" prop="group_name">
                  <el-input v-model="form.group_name" placeholder="Tên nhóm..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Số điện thoại" prop="number_phone">
                  <el-input v-model="form.number_phone" placeholder="SĐT liên hệ..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Liên hệ" prop="contact_info">
                  <el-input v-model="form.contact_info" placeholder="Telegram @username..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- GIÁ TRỊ & THỜI HẠN -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-rose-500 rounded-full"></span>
              Giá trị & Thời hạn
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Giá thuê / Tháng" prop="monthly_rental">
                  <el-input v-model="form.monthly_rentalText" placeholder="Nhập giá thuê..." @input="handleMonthlyRentalInput">
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tiền đặt cọc" prop="deposit">
                  <el-input v-model="form.depositText" placeholder="Nhập tiền đặt cọc..." @input="handleDepositInput">
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Nợ tiền thuê" prop="rental_debt">
                  <el-input v-model="form.rental_debtText" placeholder="Nhập công nợ nếu có..." @input="handleRentalDebtInput">
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Ngày bắt đầu" prop="start_rental">
                  <el-date-picker :editable="false"
                    v-model="form.start_rental"
                    type="date"
                    placeholder="Chọn ngày"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ngày kết thúc" prop="end_rental">
                  <el-date-picker :editable="false"
                    v-model="form.end_rental"
                    type="date"
                    placeholder="Chọn ngày"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { mauSo } from '@/utils/mauSo'
import { Search, MoreFilled, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { rentalService } from '@/api/rentalService'
import ScheduledNotificationModal from '@/components/ScheduledNotification/ScheduledNotificationModal.vue'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'
// MỤC 417 — trên máy bảng/điện thoại KHÔNG cho gõ lọc, để iOS
// không bật bàn phím; bấm ẩn bàn phím thì droplist ở nguyên đó.
// Xem `src/composables/chonDuoc.ts`.
import { dungChonDuoc } from '@/composables/chonDuoc'

const { choLocDuoc } = dungChonDuoc()

const { laManHep, hienBang, hienThe } = dungManHep()

interface Contract {
  id: string
  customer_id: string
  customer_code: string
  customer_name: string
  group_name: string
  contact_info: string
  number_phone: string
  contract_id: string
  real_estate_id: string
  type_contract: string
  start_rental: string
  end_rental: string
  deposit: number
  monthly_rental: number
  rental_debt: number
  status: string
}

const loading = ref(false)
const searchQuery = ref('')
const filterStatus = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Active reactive contracts list state
const contracts = ref<Contract[]>([])

// Filters & Search logic
const filteredContracts = computed(() => {
  return contracts.value.filter(c => {
    const query = searchQuery.value.toLowerCase().trim()
    if (!query) return true

    return (
      c.customer_name.toLowerCase().includes(query) ||
      c.contract_id.toLowerCase().includes(query) ||
      c.real_estate_id.toLowerCase().includes(query) ||
      c.customer_code.toLowerCase().includes(query) ||
      c.group_name.toLowerCase().includes(query)
    )
  })
})

const sortProp = ref('')
const sortOrder = ref('')

const handleSortChange = ({ prop, order }: { prop: string, order: string }) => {
  sortProp.value = prop
  sortOrder.value = order
}

const sortedContracts = computed(() => {
  const result = [...filteredContracts.value]
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
  return sortedContracts.value.slice(start, end)
})

// Dialog Add/Edit State
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<any>(null)

const form = reactive({
  id: '',
  customer_id: '',
  customer_code: '',
  customer_name: '',
  group_name: '',
  contact_info: '',
  number_phone: '',
  contract_id: '',
  real_estate_id: '',
  type_contract: '',
  monthly_rental: 0,
  monthly_rentalText: '',
  deposit: 0,
  depositText: '',
  rental_debt: 0,
  rental_debtText: '',
  start_rental: '',
  end_rental: '',
  status: 'active',
  create_new_customer: true
})

const rules = reactive({
  contract_id: [{ required: true, message: 'Vui lòng nhập mã hợp đồng', trigger: 'blur' }],
  customer_name: [{ required: true, message: 'Vui lòng nhập tên khách thuê', trigger: 'blur' }],
  real_estate_id: [{ required: true, message: 'Vui lòng nhập mã BĐS thuê', trigger: 'blur' }],
  monthly_rental: [{ required: true, message: 'Vui lòng nhập giá thuê', trigger: 'blur' }],
  deposit: [{ required: true, message: 'Vui lòng nhập tiền cọc', trigger: 'blur' }],
  start_rental: [{ required: true, message: 'Vui lòng chọn ngày bắt đầu', trigger: 'change' }],
  end_rental: [{ required: true, message: 'Vui lòng chọn ngày kết thúc', trigger: 'change' }],
  status: [{ required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change' }]
})

const handleCommand = (cmd: string, row: Contract) => {
  if (cmd === 'edit') {
    openEditDialog(row)
  } else if (cmd === 'delete') {
    handleDelete(row)
  } else if (cmd === 'schedule') {
    openScheduleDialog(row)
  }
}

// Schedule notification
const scheduleModalVisible = ref(false)
const schedulePrefill = ref<any>(null)

const openScheduleDialog = (row: Contract) => {
  schedulePrefill.value = {
    notify_type: 'rental_payment',
    reference_id: row.contract_id,
    reference_name: row.customer_name,
    message_template: `Nhắc nhở đóng tiền thuê\nHợp đồng: ${row.contract_id}\nKhách hàng: ${row.customer_name}\nBĐS: ${row.real_estate_id}`,
  }
  scheduleModalVisible.value = true
}

const getStatusTag = (status: string) => {
  if (status === 'active') return 'success'
  if (status === 'expired') return 'danger'
  if (status === 'cancelled') return 'info'
  if (status === 'bad_debt') return 'warning'
  return 'info'
}

const getStatusText = (status: string) => {
  if (status === 'active') return 'Đang thuê'
  if (status === 'expired') return 'Hết hạn'
  if (status === 'cancelled') return 'Đã hủy'
  if (status === 'bad_debt') return 'Nợ xấu'
  if (status === 'draft') return 'Bản nháp'
  return status || 'Chưa rõ'
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('vi-VN').format(val) + ' VNĐ'
}

const handleMonthlyRentalInput = (val: string) => {
  const numericVal = val.replace(/[^0-9]/g, '')
  const num = parseInt(numericVal, 10)
  if (!isNaN(num)) {
    form.monthly_rental = num
    form.monthly_rentalText = new Intl.NumberFormat('vi-VN').format(num)
  } else {
    form.monthly_rental = 0
    form.monthly_rentalText = ''
  }
}

const handleDepositInput = (val: string) => {
  const numericVal = val.replace(/[^0-9]/g, '')
  const num = parseInt(numericVal, 10)
  if (!isNaN(num)) {
    form.deposit = num
    form.depositText = new Intl.NumberFormat('vi-VN').format(num)
  } else {
    form.deposit = 0
    form.depositText = ''
  }
}

const handleRentalDebtInput = (val: string) => {
  const numericVal = val.replace(/[^0-9]/g, '')
  const num = parseInt(numericVal, 10)
  if (!isNaN(num)) {
    form.rental_debt = num
    form.rental_debtText = new Intl.NumberFormat('vi-VN').format(num)
  } else {
    form.rental_debt = 0
    form.rental_debtText = ''
  }
}

const allCustomers = ref<any[]>([])
const allRealEstates = ref<any[]>([])

const fetchAllCustomers = async () => {
  try {
    allCustomers.value = await rentalService.getRentalCustomers()
  } catch (error) {
    console.error('Failed to fetch customers list:', error)
  }
}

const fetchAllRealEstates = async () => {
  try {
    allRealEstates.value = await rentalService.getRealEstates()
  } catch (error) {
    console.error('Failed to fetch real estates list:', error)
  }
}

const getRealEstateStatusText = (status: string) => {
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

const formatRealEstateLabel = (re: any) => {
  const statusText = getRealEstateStatusText(re.status)
  const addrText = re.address ? ` - ${re.address}` : ''
  return `${re.real_estate_id}${addrText} (${statusText})`
}

// Watch customer code to auto-populate fields
watch(() => form.customer_code, (newCode) => {
  if (!newCode) return
  const code = newCode.trim().toLowerCase()
  if (!code) return

  const found = allCustomers.value.find(cust =>
    cust.customer_id && cust.customer_id.toLowerCase().trim() === code
  )
  if (found) {
    form.customer_id = found.id // Database UUID
    form.customer_name = found.customer_name || ''
    form.group_name = found.group_name || ''
    form.number_phone = found.number_phone || ''
    form.contact_info = found.contact_info || ''
  }
})

const cleanDate = (d?: string) => {
  if (!d || d.trim() === '') return null
  return d
}

const openAddDialog = () => {
  fetchAllCustomers()
  fetchAllRealEstates()
  isEdit.value = false
  form.id = ''
  form.customer_id = ''
  form.customer_code = ''
  form.customer_name = ''
  form.group_name = ''
  form.contact_info = ''
  form.number_phone = ''
  form.contract_id = ''
  form.real_estate_id = ''
  form.type_contract = ''
  form.monthly_rental = 0
  form.monthly_rentalText = ''
  form.deposit = 0
  form.depositText = ''
  form.rental_debt = 0
  form.rental_debtText = ''
  form.start_rental = new Date().toISOString().substring(0, 10)
  form.end_rental = ''
  form.status = 'active'
  form.create_new_customer = true
  dialogVisible.value = true
}

const openEditDialog = (row: Contract) => {
  fetchAllCustomers()
  fetchAllRealEstates()
  isEdit.value = true
  form.id = row.id
  form.customer_id = row.customer_id
  form.customer_code = row.customer_code
  form.customer_name = row.customer_name
  form.group_name = row.group_name
  form.contact_info = row.contact_info
  form.number_phone = row.number_phone
  form.contract_id = row.contract_id
  form.real_estate_id = row.real_estate_id
  form.type_contract = row.type_contract
  form.monthly_rental = row.monthly_rental
  form.monthly_rentalText = new Intl.NumberFormat('vi-VN').format(row.monthly_rental)
  form.deposit = row.deposit
  form.depositText = new Intl.NumberFormat('vi-VN').format(row.deposit)
  form.rental_debt = row.rental_debt
  form.rental_debtText = new Intl.NumberFormat('vi-VN').format(row.rental_debt)
  form.start_rental = row.start_rental
  form.end_rental = row.end_rental
  form.status = row.status
  form.create_new_customer = false
  dialogVisible.value = true
}

const updateRealEstateStatus = async (realEstateId: string, targetStatus: string) => {
  if (!realEstateId) return
  const foundRE = allRealEstates.value.find(re => re.real_estate_id === realEstateId)
  if (foundRE) {
    try {
      await rentalService.updateRealEstates([{
        id: foundRE.id,
        real_estate_id: foundRE.real_estate_id,
        address: foundRE.address,
        start_buy: foundRE.start_buy,
        end_buy: foundRE.end_buy,
        total_cost: foundRE.total_cost,
        real_estate_cost: foundRE.real_estate_cost,
        construction_cost: foundRE.construction_cost,
        furniture_cost: foundRE.furniture_cost,
        sale_cost: foundRE.sale_cost,
        contributed_cost: foundRE.contributed_cost,
        monthly_interest_rate: foundRE.monthly_interest_rate,
        mining_profit: foundRE.mining_profit,
        rental_profit: foundRE.rental_profit,
        start_sale: foundRE.start_sale,
        end_sale: foundRE.end_sale,
        profit_after_tax: foundRE.profit_after_tax,
        profit_after_sale: foundRE.profit_after_sale,
        status: targetStatus,
        note: foundRE.note,
        current_estimated: foundRE.current_estimated
      }])
    } catch (err) {
      console.error(`Lỗi khi tự động chuyển trạng thái BĐS sang ${targetStatus}:`, err)
    }
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      try {
        // Tự động tạo khách hàng mới vào DB nếu toggle create_new_customer là true và tạo mới hợp đồng
        if (!isEdit.value && form.create_new_customer && form.customer_code) {
          const code = form.customer_code.trim().toLowerCase()
          const existingCust = allCustomers.value.find(cust =>
            cust.customer_id && cust.customer_id.toLowerCase().trim() === code
          )

          if (existingCust) {
            form.customer_id = existingCust.id
          } else {
            try {
              const addedCustomers = await rentalService.addRentalCustomers([{
                customer_id: form.customer_code,
                customer_name: form.customer_name || 'Khách thuê mới',
                group_name: form.group_name || '',
                number_phone: form.number_phone || '',
                contact_info: form.contact_info || ''
              }])
              if (addedCustomers && addedCustomers.length > 0) {
                form.customer_id = addedCustomers[0].id
                ElMessage.success(`Đã tự động tạo khách hàng mới "${form.customer_name || form.customer_code}" vào DB!`)
                await fetchAllCustomers()
              }
            } catch (custErr: any) {
              console.error('Lỗi khi tự động tạo mới khách hàng:', custErr)
              ElMessage.warning('Không thể tạo mới khách hàng vào DB, tiếp tục lưu hợp đồng...')
            }
          }
        }

        const payload = {
          id: isEdit.value ? form.id : undefined,
          customer_id: form.customer_id || null,
          contract_id: form.contract_id || null,
          real_estate_id: form.real_estate_id || null,
          type_contract: form.type_contract || null,
          start_rental: cleanDate(form.start_rental),
          end_rental: cleanDate(form.end_rental),
          deposit: Number(form.deposit) || 0,
          monthly_rental: Number(form.monthly_rental) || 0,
          rental_debt: Number(form.rental_debt) || 0,
          status: form.status || 'active'
        }

        if (isEdit.value) {
          await rentalService.updateRentals([payload])

          // Nếu trạng thái HĐ đổi sang "cancelled" (Đã hủy) hoặc "expired" (Hết hạn) -> Chuyển BĐS sang "vacant" (Để trống)
          if (form.status === 'cancelled' || form.status === 'expired') {
            await updateRealEstateStatus(form.real_estate_id, 'vacant')
          } else if (form.status === 'active') {
            await updateRealEstateStatus(form.real_estate_id, 'rented')
          }

          ElMessage.success('Cập nhật thông tin hợp đồng thành công!')
        } else {
          await rentalService.addRentals([payload])

          // Tự động chuyển trạng thái BĐS sang "vacant" (Để trống) nếu HĐ tạo ở trạng thái Hủy/Hết hạn, ngược lại chuyển "rented" (Đang cho thuê)
          if (form.status === 'cancelled' || form.status === 'expired') {
            await updateRealEstateStatus(form.real_estate_id, 'vacant')
          } else {
            await updateRealEstateStatus(form.real_estate_id, 'rented')
          }

          ElMessage.success('Tạo hợp đồng mới thành công!')
        }

        dialogVisible.value = false
        await fetchContracts()
        await fetchAllRealEstates()
      } catch (error: any) {
        ElMessage.error(error.message || (isEdit.value ? 'Lỗi khi cập nhật hợp đồng' : 'Lỗi khi tạo hợp đồng mới'))
      } finally {
        loading.value = false
      }
    }
  })
}

const handleDelete = async (row: Contract) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa hợp đồng "${row.contract_id}"? Hành động này không thể hoàn tác.`,
      'Xác nhận xóa hợp đồng',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy bỏ',
        type: 'warning'
      }
    )
    loading.value = true
    try {
      await rentalService.deleteRentals([row.id])
      if (row.real_estate_id) {
        await updateRealEstateStatus(row.real_estate_id, 'vacant')
      }
      ElMessage.success('Xóa hợp đồng thành công!')
      await fetchContracts()
      await fetchAllRealEstates()
    } catch (error: any) {
      ElMessage.error(error.message || 'Lỗi khi xóa hợp đồng')
    } finally {
      loading.value = false
    }
  } catch (err) {
    // cancelled
  }
}

const mapToContract = (item: any): Contract => {
  return {
    id: item.id,
    customer_id: item.customer_id || '',
    customer_code: item.customer_code || '',
    customer_name: item.customer_name || 'Chưa rõ',
    group_name: item.group_name || '',
    contact_info: item.contact_info || '',
    number_phone: item.number_phone || '',
    contract_id: item.contract_id || '',
    real_estate_id: item.real_estate_id || '',
    type_contract: item.type_contract || '',
    start_rental: item.start_rental || '',
    end_rental: item.end_rental || '',
    deposit: item.deposit || 0,
    monthly_rental: item.monthly_rental || 0,
    rental_debt: item.rental_debt || 0,
    status: item.status || 'draft'
  }
}

const fetchContracts = async () => {
  loading.value = true
  try {
    const data = await rentalService.getRentals(filterStatus.value)
    contracts.value = data.map(mapToContract)
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi tải danh sách hợp đồng')
  } finally {
    loading.value = false
  }
}

watch(filterStatus, () => {
  fetchContracts()
})

onMounted(() => {
  fetchContracts()
  fetchAllCustomers()
  fetchAllRealEstates()
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
