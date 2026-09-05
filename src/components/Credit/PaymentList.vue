<template>
  <div class="credit-container h-full flex flex-col">
    <!-- Filter Bar -->
    <div class="flex justify-between items-center mb-4 shrink-0 flex-wrap gap-y-4">
      <div class="flex items-center gap-4 flex-wrap">
        <!-- Contract ID Filter -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Mã HĐ:</span>
          <el-input
            v-model="filterContractId"
            placeholder="Nhập mã hợp đồng..."
            clearable
            class="w-48 custom-dark-input"
          />
        </div>

        <!-- Date range filter -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian:</span>
          <el-date-picker :editable="false"
            v-model="dateRange"
            type="daterange"
            range-separator="đến"
            start-placeholder="Từ ngày"
            end-placeholder="Đến ngày"
            value-format="YYYY-MM-DD"
            style="width: 260px"
            class="custom-dark-date-picker highlight-select"
            popper-class="custom-dark-select-popper"
          />
        </div>
      </div>
      <div class="flex items-center gap-2">
        <el-button type="success" :icon="Search" @click="fetchPayments">Tìm kiếm</el-button>
        <el-button type="primary" @click="openAddDialog">Thêm thanh toán</el-button>
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
        <el-table-column label="STT" width="52" align="center">
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="contract_id" label="Mã HĐ" min-width="130" sortable="custom">
          <template #default="{ row }">
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{{ row.contract_id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="customer_name" label="Tên khách hàng" width="144" sortable="custom" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.customer_name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="loan_type" label="Loại vay" width="86" align="center">
          <template #default="{ row }">
            <el-tag :type="row.loan_type === 'Collateral' ? 'primary' : 'warning'" size="small">
              {{ row.loan_type === 'Collateral' ? 'Thế chấp' : 'Tín chấp' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="initial_principal" label="Gốc ban đầu" width="108" align="right">
          <template #default="{ row }">
            <span :class="mauSo(row.initial_principal)">{{ formatCurrency(row.initial_principal) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="remaining_principal" label="Gốc còn lại" width="115" align="right">
          <template #default="{ row }">
            <span class="font-bold" :class="mauSo(row.remaining_principal)">{{ formatCurrency(row.remaining_principal) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="monthly_interest_rate" label="Lãi suất / Tháng" width="94" align="right">
          <template #default="{ row }">
            <span>{{ row.monthly_interest_rate ? `${row.monthly_interest_rate}%` : '0%' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="interest_amount" label="Số tiền lãi" width="115" align="right">
          <template #default="{ row }">
            <span class="font-bold" :class="mauSo(row.interest_amount)">{{ formatCurrency(row.interest_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="interest_payment_date" label="Ngày thanh toán lãi" width="115" align="center">
          <template #default="{ row }">
            <span class="font-medium">{{ formatDate(row.interest_payment_date) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="payment_time" label="Thời gian ghi nhận" width="130" align="center">
          <template #default="{ row }">
            <span class="text-gray-600 dark:text-gray-400">{{ formatDateTime(row.payment_time) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="credit_status" label="Trạng thái HĐ" width="101" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.credit_status)" effect="plain" size="small" class="capitalize">
              {{ getStatusText(row.credit_status) }}
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
                  <el-dropdown-item command="detail">Chi tiết</el-dropdown-item>
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
                <span class="font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{{ row.contract_id }}</span>
              </div>
              <div class="shrink-0">
                <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
                              <el-button link type="info" class="p-1">
                                <el-icon class="text-xl"><MoreFilled /></el-icon>
                              </el-button>
                              <template #dropdown>
                                <el-dropdown-menu>
                                  <el-dropdown-item command="detail">Chi tiết</el-dropdown-item>
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
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Loại vay:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag :type="row.loan_type === 'Collateral' ? 'primary' : 'warning'" size="small">
                                {{ row.loan_type === 'Collateral' ? 'Thế chấp' : 'Tín chấp' }}
                              </el-tag>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Gốc ban đầu:</span>
                <span class="text-right break-words min-w-0">
                  <span :class="mauSo(row.initial_principal)">{{ formatCurrency(row.initial_principal) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Gốc còn lại:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-bold" :class="mauSo(row.remaining_principal)">{{ formatCurrency(row.remaining_principal) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Lãi suất / Tháng:</span>
                <span class="text-right break-words min-w-0">
                  <span>{{ row.monthly_interest_rate ? `${row.monthly_interest_rate}%` : '0%' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Số tiền lãi:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-bold" :class="mauSo(row.interest_amount)">{{ formatCurrency(row.interest_amount) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ngày thanh toán lãi:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-medium">{{ formatDate(row.interest_payment_date) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Thời gian ghi nhận:</span>
                <span class="text-right break-words min-w-0">
                  <span class="text-gray-600 dark:text-gray-400">{{ formatDateTime(row.payment_time) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Trạng thái HĐ:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag :type="getStatusTag(row.credit_status)" effect="plain" size="small" class="capitalize">
                                {{ getStatusText(row.credit_status) }}
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
          :total="payments.length"
        />
      </div>
    </div>

    <!-- Add Payment Dialog -->
    <el-dialog
      v-model="addDialogVisible"
      title="THÊM THANH TOÁN LÃI MỚI"
      width="800px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="170px" class="mt-2 compact-form">
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin thanh toán
            </h4>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Mã Hợp đồng" prop="contract_id">
                  <el-select v-model="addForm.contract_id" placeholder="Chọn hợp đồng..." style="width: 100%" class="highlight-select" :filterable="choLocDuoc">
                    <el-option
                      v-for="c in contractsList"
                      :key="c.contract_id"
                      :label="`${c.contract_id} - ${c.customer_name}`"
                      :value="c.contract_id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- Contract Info Display -->
            <div v-if="selectedAddContract" class="mx-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 text-xs mb-4 space-y-2">
              <div class="flex justify-between">
                <span class="text-gray-400">Khách hàng:</span>
                <span class="font-bold text-gray-700 dark:text-gray-300">{{ selectedAddContract.customer_name }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Loại vay:</span>
                <span class="font-medium text-gray-700 dark:text-gray-300">{{ selectedAddContract.loan_type === 'Collateral' ? 'Thế chấp' : 'Tín chấp' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Gốc ban đầu:</span>
                <span class="font-semibold" :class="mauSo(selectedAddContract.initial_principal)">{{ formatCurrency(selectedAddContract.initial_principal) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Gốc còn lại:</span>
                <span class="font-bold" :class="mauSo(selectedAddContract.remaining_principal)">{{ formatCurrency(selectedAddContract.remaining_principal) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Lãi suất / Tháng:</span>
                <span class="font-medium text-gray-700 dark:text-gray-300">{{ selectedAddContract.monthly_interest_rate }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Tiền lãi / Tháng:</span>
                <span class="font-semibold" :class="mauSo(selectedAddContract.monthly_interest_amount)">{{ formatCurrency(selectedAddContract.monthly_interest_amount) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Nợ lãi hiện tại:</span>
                <span class="font-bold" :class="selectedAddContract.interest_debt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500'">{{ formatCurrency(selectedAddContract.interest_debt) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Trạng thái:</span>
                <el-tag :type="getStatusTag(selectedAddContract.credit_status)" effect="plain" size="small">{{ getStatusText(selectedAddContract.credit_status) }}</el-tag>
              </div>
            </div>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Ngày thanh toán lãi" prop="interest_payment_date">
                  <el-date-picker :editable="false" v-model="addForm.interest_payment_date" type="date" placeholder="Chọn ngày" format="DD/MM/YYYY" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Thời gian thanh toán" prop="payment_time">
                  <el-date-picker :editable="false" v-model="addForm.payment_time" type="datetime" placeholder="Chọn thời gian" format="DD/MM/YYYY HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Số tiền lãi" prop="interest_amount">
                  <el-input v-model="addForm.interest_amount_text" placeholder="Nhập số tiền..." @input="(v) => handleAddPriceInput(v)">
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
          <el-button @click="addDialogVisible = false">Hủy</el-button>
          <el-button type="primary" @click="submitAddForm" :loading="loading">Xác nhận</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Payment Details Dialog -->
    <el-dialog 
      v-model="detailDialogVisible" 
      title="CHI TIẾT THANH TOÁN LÃI" 
      width="850px" 
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedPayment" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto overflow-x-hidden text-left">
        <!-- Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-emerald-500 dark:bg-emerald-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32">
              <Wallet />
            </el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-left">Thanh toán lãi</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5 text-left">
              {{ selectedPayment.contract_id }}
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span class="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                {{ selectedPayment.customer_name }}
              </span>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span>Số tiền: {{ formatCurrency(selectedPayment.interest_amount) }}</span>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span>Ngày trả: {{ formatDate(selectedPayment.interest_payment_date) }}</span>
            </div>
          </div>
        </div>

        <!-- 1. THÔNG TIN HỢP ĐỒNG & KHÁCH HÀNG -->
        <div>
          <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            Thông tin Hợp đồng & Đối tác
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã Hợp đồng</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedPayment.contract_id }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Khách hàng</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedPayment.customer_name }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã khách hàng</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedPayment.customer_code || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Nhóm khách hàng</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedPayment.group_name || '—' }}</div>
            </div>
            <div class="col-span-2">
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Thông tin liên hệ</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedPayment.contact_info || '—' }}</div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 2. THÔNG TIN TÀI CHÍNH HỢP ĐỒNG -->
        <div>
          <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
            Thông tin tài chính hợp đồng
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Gốc ban đầu</div>
              <div class="text-sm font-bold text-gray-700 dark:text-gray-300">{{ formatCurrency(selectedPayment.initial_principal) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Lãi suất / Tháng</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedPayment.monthly_interest_rate }}%</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 font-bold text-emerald-600 dark:text-emerald-400">Gốc còn lại</div>
              <div class="text-sm font-extrabold text-emerald-650 dark:text-emerald-400">{{ formatCurrency(selectedPayment.remaining_principal) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Trạng thái HĐ</div>
              <el-tag :type="getStatusTag(selectedPayment.credit_status)" effect="light" size="small" class="capitalize">
                {{ getStatusText(selectedPayment.credit_status) }}
              </el-tag>
            </div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4 pt-4 border-t border-dashed border-gray-100 dark:border-gray-800">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Loại hợp đồng</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ selectedPayment.loan_type === 'Collateral' ? 'Thế chấp' : 'Tín chấp' }}
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày bắt đầu</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatDate(selectedPayment.start_date) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 font-bold text-red-500">Ngày đáo hạn</div>
              <div class="text-sm font-bold text-red-500">{{ formatDate(selectedPayment.due_date) }}</div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 3. CHI TIẾT THANH TOÁN -->
        <div>
          <h4 class="text-sm font-bold text-violet-650 dark:text-violet-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
            Chi tiết giao dịch thanh toán
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số tiền lãi thanh toán</div>
              <div class="text-lg font-black text-emerald-650 dark:text-emerald-450">{{ formatCurrency(selectedPayment.interest_amount) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày thanh toán lãi</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ formatDate(selectedPayment.interest_payment_date) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Thời gian ghi nhận</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ formatDateTime(selectedPayment.payment_time) }}</div>
            </div>
            <div class="col-span-2 md:col-span-3">
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã bản ghi thanh toán (ID)</div>
              <div class="text-xs font-mono text-gray-600 dark:text-gray-400">{{ selectedPayment.id || '—' }}</div>
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

// ══════════════════════════════════════════════════════════════════
// MỤC 527 (05/09/2026) — MÀN NÀY CHẠY TRONG MỘT LUỒNG
//
// s68 05/09: *"bấm ô 1 vào luồng PQCredit, ô 2 vào luồng KCredit.
// Trong mỗi luồng đều có đầy đủ nội dung từng luồng."*
//
// 🔴 `luong` gửi THẲNG lên máy chủ làm bộ lọc, không lọc sau khi tải.
// Tải hết rồi giấu bớt thì mọi con số tổng vẫn tính trên cả hai luồng.
//
// ⚠️ Rỗng = không lọc. Giữ nguyên hành vi cũ cho chỗ nào dùng lại
// component này ngoài hai luồng.
// ══════════════════════════════════════════════════════════════════
const props = defineProps<{ luong?: string }>()
import { ref, reactive, computed, onMounted } from 'vue'
import { mauSo } from '@/utils/mauSo'
import { Search, Wallet, MoreFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { creditService } from '@/api/creditService'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'
// MỤC 417 — trên máy bảng/điện thoại KHÔNG cho gõ lọc, để iOS
// không bật bàn phím; bấm ẩn bàn phím thì droplist ở nguyên đó.
// Xem `src/composables/chonDuoc.ts`.
import { dungChonDuoc } from '@/composables/chonDuoc'

const { choLocDuoc } = dungChonDuoc()

const { laManHep, hienBang, hienThe } = dungManHep()

interface PaymentRecord {
  id: string
  contract_id: string
  interest_payment_date: string
  payment_time: string
  interest_amount: number
  loan_type: string
  initial_principal: number
  remaining_principal: number
  monthly_interest_rate: number
  credit_status: string
  start_date: string
  due_date: string
  customer_code: string
  customer_name: string
  group_name: string
  contact_info: string
}

const loading = ref(false)
const filterContractId = ref('')

const formatDateString = (date: Date) => {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const getInitialDateRange = (): [string, string] => {
  const today = new Date()
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(today.getMonth() - 3)
  return [formatDateString(threeMonthsAgo), formatDateString(today)]
}

const dateRange = ref<[string, string] | null>(getInitialDateRange())

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

const payments = ref<PaymentRecord[]>([])

// Contracts list for add dialog dropdown
const contractsList = ref<any[]>([])

const selectedAddContract = computed(() => {
  if (!addForm.contract_id) return null
  return contractsList.value.find(c => c.contract_id === addForm.contract_id) || null
})

const sortProp = ref('')
const sortOrder = ref('')

const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  sortProp.value = prop
  sortOrder.value = order
}

const sortedPayments = computed(() => {
  const list = [...payments.value]
  if (!sortProp.value || !sortOrder.value) return list

  return list.sort((a, b) => {
    const valA = (a as any)[sortProp.value] || ''
    const valB = (b as any)[sortProp.value] || ''

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
  return sortedPayments.value.slice(start, end)
})

// Add Dialog State
const addDialogVisible = ref(false)
const addFormRef = ref<any>(null)

// Detail Dialog State
const detailDialogVisible = ref(false)
const selectedPayment = ref<PaymentRecord | null>(null)

const openDetailDialog = (row: PaymentRecord) => {
  selectedPayment.value = row
  detailDialogVisible.value = true
}

const addForm = reactive({
  contract_id: '',
  interest_payment_date: '',
  payment_time: '',
  interest_amount: 0,
  interest_amount_text: ''
})

const addRules = reactive({
  contract_id: [{ required: true, message: 'Vui lòng chọn hợp đồng', trigger: 'change' }],
  interest_payment_date: [{ required: true, message: 'Vui lòng chọn ngày thanh toán', trigger: 'change' }],
  payment_time: [{ required: true, message: 'Vui lòng chọn thời gian thanh toán', trigger: 'change' }]
})

const handleAddPriceInput = (val: string) => {
  const numericVal = val.replace(/[^0-9]/g, '')
  const num = parseInt(numericVal, 10)
  if (!isNaN(num)) {
    addForm.interest_amount = num
    addForm.interest_amount_text = new Intl.NumberFormat('vi-VN').format(num)
  } else {
    addForm.interest_amount = 0
    addForm.interest_amount_text = ''
  }
}

const resetAddForm = () => {
  addForm.contract_id = ''
  addForm.interest_payment_date = formatDateString(new Date())
  addForm.payment_time = new Date().toISOString().slice(0, 19)
  addForm.interest_amount = 0
  addForm.interest_amount_text = ''
}

const openAddDialog = () => {
  resetAddForm()
  addDialogVisible.value = true
}

const submitAddForm = async () => {
  if (!addFormRef.value) return
  await addFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      const apiPayload = {
        contract_id: addForm.contract_id,
        interest_payment_date: addForm.interest_payment_date,
        payment_time: addForm.payment_time ? addForm.payment_time + 'Z' : new Date().toISOString(),
        interest_amount: addForm.interest_amount || 0
      }

      loading.value = true
      try {
        const result = await creditService.addCreditInterests([apiPayload])
        if (result && result.length > 0) {
          ElMessage.success('Thêm thanh toán lãi thành công!')
          addDialogVisible.value = false
          await fetchPayments()
        } else {
          ElMessage.error('Không nhận được phản hồi từ server')
        }
      } catch (error: any) {
        ElMessage.error(error.message || 'Lỗi khi thêm thanh toán lãi')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleCommand = (cmd: string, row: PaymentRecord) => {
  if (cmd === 'detail') {
    openDetailDialog(row)
  } else if (cmd === 'delete') {
    handleDelete(row)
  }
}

const handleDelete = async (row: PaymentRecord) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa thanh toán lãi của hợp đồng "${row.contract_id}"?`,
      'Xác nhận xóa thanh toán',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy bỏ',
        type: 'warning'
      }
    )
    loading.value = true
    try {
      await creditService.deleteCreditInterests([row.id])
      ElMessage.success('Xóa thanh toán lãi thành công!')
      await fetchPayments()
    } catch (error: any) {
      ElMessage.error(error.message || 'Lỗi khi xóa thanh toán lãi')
    } finally {
      loading.value = false
    }
  } catch (err) {
    // cancelled
  }
}

const getStatusTag = (status: string) => {
  if (status === 'active') return 'success'
  if (status === 'paid') return 'info'
  if (status === 'cancelled') return 'warning'
  if (status === 'bad_debt') return 'danger'
  return 'info'
}

const getStatusText = (status: string) => {
  if (status === 'active') return 'Đang vay'
  if (status === 'paid') return 'Đã tất toán'
  if (status === 'cancelled') return 'Đã hủy'
  if (status === 'bad_debt') return 'Nợ xấu'
  return 'Chưa rõ'
}

const fetchPayments = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (filterContractId.value) params.contract_id = filterContractId.value
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }

    if (props.luong) params.classification = props.luong   // MỤC 527
    const data = await creditService.getCreditInterests(params)
    payments.value = data.map((item: any) => ({
      id: item.id || '',
      contract_id: item.contract_id || '',
      interest_payment_date: item.interest_payment_date || '',
      payment_time: item.payment_time || '',
      interest_amount: item.interest_amount || 0,
      loan_type: item.loan_type || 'Collateral',
      initial_principal: item.initial_principal || 0,
      remaining_principal: item.remaining_principal || 0,
      monthly_interest_rate: item.monthly_interest_rate || 0,
      credit_status: item.credit_status || 'active',
      start_date: item.start_date || '',
      due_date: item.due_date || '',
      customer_code: item.customer_code || '',
      customer_name: item.customer_name || 'Chưa rõ',
      group_name: item.group_name || '',
      contact_info: item.contact_info || ''
    }))
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi tải danh sách thanh toán lãi')
  } finally {
    loading.value = false
  }
}

// Helpers
const formatCurrency = (val: number) => {
  if (!val) return '0 VNĐ'
  return new Intl.NumberFormat('vi-VN').format(val) + ' VNĐ'
}

const formatDate = (d: string) => {
  if (!d) return '—'
  const [y, m, dd] = d.split('-')
  return `${dd}/${m}/${y}`
}

const formatDateTime = (d: string) => {
  if (!d) return '—'
  try {
    const date = new Date(d)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  } catch {
    return d
  }
}

onMounted(() => {
  fetchPayments()
  fetchContractsList()
})

const fetchContractsList = async () => {
  try {
    const data = await creditService.getCredits({ classification: props.luong })
    contractsList.value = data
  } catch (error: any) {
    console.error('Failed to load contracts list:', error)
  }
}
</script>

<style scoped>
.credit-container {
  height: 100%;
}

.credit-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

html.dark .credit-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}
html.dark .credit-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}
html.dark .credit-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}
html.dark .credit-container :deep(.el-table .el-table-fixed-column--left),
html.dark .credit-container :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important;
}

html.dark .custom-dark-input :deep(.el-input__wrapper) {
  background-color: #111827 !important;
  box-shadow: 0 0 0 1px #4b5563 inset !important;
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
/* Unscoped date picker dark mode overrides */
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
