<template>
  <div class="credit-container h-full flex flex-col">
    <!-- Filter Bar -->
    <div class="flex justify-between items-center mb-4 shrink-0 flex-wrap gap-y-4">
      <div class="flex items-center gap-4 flex-wrap">
        <!-- Loan Type Filter -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Loại vay:</span>
          <el-select
            v-model="filterLoanType"
            placeholder="Tất cả"
            style="width: 130px"
            clearable
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Thế chấp" value="Collateral" />
            <el-option label="Tín chấp" value="Unsecured" />
          </el-select>
        </div>

        <!-- Date range filter (default: 3 years ago to now) -->
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

        <!-- Status Filter -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái:</span>
          <el-select
            v-model="filterStatus"
            placeholder="Tất cả"
            style="width: 160px"
            clearable
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Đang vay" value="active" />
            <el-option label="Đã tất toán" value="paid" />
            <el-option label="Đã hủy" value="cancelled" />
            <el-option label="Nợ xấu" value="bad_debt" />
          </el-select>
        </div>

        <!-- Classification Filter -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Phân loại:</span>
          <el-select
            v-model="filterClassification"
            placeholder="Tất cả"
            style="width: 140px"
            clearable
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Tất cả" value="" />
            <el-option
              v-for="item in classifications"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </div>

        <!-- Search input -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
          <el-input
            v-model="searchQuery"
            placeholder="Tìm mã HĐ, tên KH..."
            :prefix-icon="Search"
            clearable
            class="w-56 custom-dark-input"
          />
        </div>
      </div>
      <!--
        MỤC 357 (27/08/2026) — HAI NÚT DỜI SANG PHẢI.

        s68 khoanh đỏ ảnh iPad 27/08: hai nút "Tìm kiếm" và "Thêm hợp đồng"
        nằm ở đầu dòng thứ hai, còn cả nửa phải của dòng đó bỏ trống — trong
        khi ngay trên nó ô "Trạng thái" lại chạy ra tận mép phải.

        `ml-auto` đẩy cụm nút về mép phải, thẳng cột với ô "Trạng thái" ở
        dòng trên. Khoảng trống giữa biến mất mà không phải đổi bố cục.

        ⚠️ `ml-auto` chỉ ăn khi thẻ cha là flex — ở đây đúng vậy. Trên màn
        hẹp (điện thoại) thẻ cha xuống dòng, `ml-auto` tự vô hiệu và hai nút
        vẫn nằm bên trái như cũ. Không cần thêm điểm ngắt riêng.
      -->
      <div class="flex items-center gap-2 ml-auto">
        <el-button type="success" :icon="Search" @click="fetchCredits">Tìm kiếm</el-button>
        <el-button type="primary" @click="openAddDialog">Thêm hợp đồng</el-button>
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
        <el-table-column prop="classification" label="Phân loại" width="94" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.classification" size="small" type="info" effect="plain" class="font-bold">
              {{ row.classification }}
            </el-tag>
            <span v-else class="text-gray-400">—</span>
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
        <el-table-column prop="remaining_principal" label="Gốc còn lại" width="130" align="right">
          <template #default="{ row }">
            <span class="font-bold" :class="mauSo(row.remaining_principal)">{{ formatCurrency(row.remaining_principal) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="monthly_interest_rate" label="Lãi suất / Tháng" width="94" align="right">
          <template #default="{ row }">
            <span>{{ row.monthly_interest_rate ? `${row.monthly_interest_rate}%` : '0%' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="interest_debt" label="Nợ lãi" width="101" align="right">
          <template #default="{ row }">
            <span :class="row.interest_debt > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-gray-400'">
              {{ formatCurrency(row.interest_debt) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="start_date" label="Ngày bắt đầu" width="94" align="center">
          <template #default="{ row }">
            <span>{{ formatDate(row.start_date) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="due_date" label="Ngày đáo hạn" width="94" align="center">
          <template #default="{ row }">
            <span>{{ formatDate(row.due_date) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="send_message_arise" label="SMS tự động" width="86" align="center">
          <template #default="{ row }">
            <el-tag :type="row.send_message_arise ? 'success' : 'info'" size="small">
              {{ row.send_message_arise ? 'Có' : 'Không' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="credit_status" label="Trạng thái" width="101" align="center">
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
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tên khách hàng:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.customer_name }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Phân loại:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag v-if="row.classification" size="small" type="info" effect="plain" class="font-bold">
                                {{ row.classification }}
                              </el-tag>
                              <span v-else class="text-gray-400">—</span>
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
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Nợ lãi:</span>
                <span class="text-right break-words min-w-0">
                  <span :class="row.interest_debt > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-gray-400'">
                                {{ formatCurrency(row.interest_debt) }}
                              </span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ngày bắt đầu:</span>
                <span class="text-right break-words min-w-0">
                  <span>{{ formatDate(row.start_date) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ngày đáo hạn:</span>
                <span class="text-right break-words min-w-0">
                  <span>{{ formatDate(row.due_date) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">SMS tự động:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag :type="row.send_message_arise ? 'success' : 'info'" size="small">
                                {{ row.send_message_arise ? 'Có' : 'Không' }}
                              </el-tag>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Trạng thái:</span>
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
          :total="filteredContracts.length"
        />
      </div>
    </div>

    <!-- Add/Edit Contract Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'CHỈNH SỬA HỢP ĐỒNG TÍN DỤNG' : 'THÊM HỢP ĐỒNG TÍN DỤNG MỚI'"
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
                <el-form-item label="Khách hàng" prop="customer_id">
                  <el-select v-model="form.customer_id" placeholder="Chọn khách hàng..." style="width: 100%" class="highlight-select" filterable>
                    <el-option
                      v-for="c in customersList"
                      :key="c.id"
                      :label="`${c.customer_id} - ${c.customer_name}`"
                      :value="c.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Mã Hợp đồng" prop="contract_id">
                  <el-input v-model="form.contract_id" placeholder="VD: HĐ-TD-001..." :disabled="isEdit" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Loại vay" prop="loan_type">
                  <el-select v-model="form.loan_type" placeholder="Chọn loại vay" style="width: 100%" class="highlight-select" :disabled="isEdit">
                    <el-option label="Thế chấp (Collateral)" value="Collateral" />
                    <el-option label="Tín chấp (Unsecured)" value="Unsecured" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Trạng thái" prop="credit_status">
                  <el-select v-model="form.credit_status" placeholder="Chọn trạng thái" style="width: 100%" class="highlight-select">
                    <el-option label="Đang vay" value="active" />
                    <el-option label="Đã tất toán" value="paid" />
                    <el-option label="Đã hủy" value="cancelled" />
                    <el-option label="Nợ xấu" value="bad_debt" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Ghi chú" prop="notes">
                  <el-input v-model="form.notes" type="textarea" :rows="2" placeholder="Ghi chú điều khoản hợp đồng..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Phân loại" prop="classification">
                  <el-select
                    v-model="form.classification"
                    placeholder="Chọn hoặc nhập phân loại..."
                    filterable
                    allow-create
                    default-first-option
                    clearable
                    class="w-full text-left"
                  >
                    <el-option
                      v-for="item in classifications"
                      :key="item"
                      :label="item"
                      :value="item"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: THÔNG TIN TÀI CHÍNH -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Thông tin Tài chính
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Gốc ban đầu">
                  <el-input v-model="form.initial_principal_text" placeholder="Nhập số tiền..." @input="(v) => handlePriceInput(v, 'initial_principal')" :disabled="isEdit" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Gốc đã trả">
                  <el-input v-model="form.total_principal_paid_text" placeholder="Nhập số tiền..." @input="(v) => handlePriceInput(v, 'total_principal_paid')" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Gốc còn lại">
                  <el-input v-model="form.remaining_principal_text" placeholder="Nhập số tiền..." @input="(v) => handlePriceInput(v, 'remaining_principal')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Lãi suất / Tháng (%)">
                  <el-input-number v-model="form.monthly_interest_rate" :min="0" :max="100" :precision="2" style="width: 100%" controls-position="right" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Nợ lãi hiện tại">
                  <el-input v-model="form.interest_debt_text" placeholder="Nhập số tiền..." @input="(v) => handlePriceInput(v, 'interest_debt')" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 3: THỜI HẠN & TIN NHẮN -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-rose-500 rounded-full"></span>
              Thời hạn & Tin nhắn
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Ngày bắt đầu" prop="start_date">
                  <el-date-picker :editable="false" v-model="form.start_date" type="date" placeholder="Chọn ngày" format="DD/MM/YYYY" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ngày đáo hạn" prop="due_date">
                  <el-date-picker :editable="false" v-model="form.due_date" type="date" placeholder="Chọn ngày" format="DD/MM/YYYY" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Bắt đầu tính lãi" prop="interest_start_date">
                  <el-date-picker :editable="false" v-model="form.interest_start_date" type="date" placeholder="Chọn ngày" format="DD/MM/YYYY" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ngày tính lãi gần nhất">
                  <el-date-picker :editable="false" v-model="form.last_interest_charged_date" type="date" placeholder="Chọn ngày" format="DD/MM/YYYY" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Gửi tin khi phát sinh">
                  <el-switch v-model="form.send_message_arise" active-text="Có" inactive-text="Không" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20" v-if="form.send_message_arise">
              <el-col :span="24">
                <el-form-item label="Nội dung tin nhắn" prop="message_content">
                  <el-input v-model="form.message_content" type="textarea" :rows="3" placeholder="Nhập nội dung tin nhắn tự động khi có biến động..." />
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

    <!-- Contract Details Dialog -->
    <el-dialog 
      v-model="detailDialogVisible" 
      title="CHI TIẾT HỢP ĐỒNG TÍN DỤNG" 
      width="850px" 
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedContract" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto overflow-x-hidden text-left">
        <!-- Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-blue-500 dark:bg-blue-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32">
              <Files />
            </el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-left">Hợp đồng tín dụng</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5 text-left">
              {{ selectedContract.contract_id }}
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span class="flex items-center gap-1 font-bold text-blue-650 dark:text-blue-400">
                {{ selectedContract.customer_name }}
              </span>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span>Loại vay: {{ selectedContract.loan_type === 'Collateral' ? 'Thế chấp' : 'Tín chấp' }}</span>
            </div>
          </div>
        </div>

        <!-- 1. THÔNG TIN CHUNG -->
        <div>
          <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            Thông tin chung & Đối tác
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã Hợp đồng</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedContract.contract_id }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Khách hàng</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedContract.customer_name }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Trạng thái</div>
              <el-tag :type="getStatusTag(selectedContract.credit_status)" effect="light" size="small" class="capitalize">
                {{ getStatusText(selectedContract.credit_status) }}
              </el-tag>
            </div>
            <div class="col-span-2 md:col-span-1">
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Loại vay</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedContract.loan_type === 'Collateral' ? 'Thế chấp (Collateral)' : 'Tín chấp (Unsecured)' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Phân loại</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-250">
                <el-tag v-if="selectedContract.classification" size="small" type="info" effect="plain" class="font-bold">
                  {{ selectedContract.classification }}
                </el-tag>
                <span v-else class="text-gray-400">—</span>
              </div>
            </div>
          </div>
          <div class="mt-4">
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ghi chú điều khoản</div>
            <div class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{{ selectedContract.notes || '—' }}</div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 2. THÔNG TIN TÀI CHÍNH -->
        <div>
          <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
            Thông tin tài chính & Lãi suất
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Gốc ban đầu</div>
              <div class="text-sm font-bold text-gray-700 dark:text-gray-300">{{ formatCurrency(selectedContract.initial_principal) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Lãi suất / Tháng</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedContract.monthly_interest_rate }}%</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tiền lãi / Tháng</div>
              <div class="text-sm font-bold text-gray-700 dark:text-gray-300">{{ formatCurrency(selectedContract.monthly_interest_amount) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 font-bold text-emerald-600 dark:text-emerald-400">Gốc còn lại</div>
              <div class="text-sm font-extrabold text-emerald-650 dark:text-emerald-400">{{ formatCurrency(selectedContract.remaining_principal) }}</div>
            </div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4 pt-4 border-t border-dashed border-gray-100 dark:border-gray-800">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Gốc đã trả</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatCurrency(selectedContract.total_principal_paid) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Nợ lãi hiện tại</div>
              <div class="text-sm font-bold" :class="selectedContract.interest_debt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500'">
                {{ formatCurrency(selectedContract.interest_debt) }}
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 3. THỜI HẠN & TÍNH LÃI -->
        <div>
          <h4 class="text-sm font-bold text-violet-650 dark:text-violet-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
            Thời hạn & Lịch tính lãi
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày bắt đầu</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatDate(selectedContract.start_date) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày tính lãi đầu</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatDate(selectedContract.interest_start_date) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày tính lãi gần nhất</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatDate(selectedContract.last_interest_charged_date) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 font-bold text-red-500">Ngày đáo hạn</div>
              <div class="text-sm font-bold text-red-500">{{ formatDate(selectedContract.due_date) }}</div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 4. GỬI TIN NHẮN PHÁT SINH -->
        <div>
          <h4 class="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-rose-500 rounded-full"></span>
            Gửi tin nhắn phát sinh (SMS / Telegram)
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tự động gửi tin</div>
              <el-tag :type="selectedContract.send_message_arise ? 'success' : 'info'" effect="light">
                {{ selectedContract.send_message_arise ? 'Đang bật' : 'Đang tắt' }}
              </el-tag>
            </div>
          </div>
          <div class="mt-4" v-if="selectedContract.send_message_arise">
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Nội dung tin nhắn mẫu</div>
            <div class="text-sm text-gray-700 dark:text-gray-300 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
              {{ selectedContract.message_content || '—' }}
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

    <!-- Schedule Notification Modal -->
    <ScheduledNotificationModal
      v-model="scheduleModalVisible"
      module-key="credit"
      :prefill-data="schedulePrefill"
      @saved="scheduleModalVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { mauSo } from '@/utils/mauSo'
import { Search, MoreFilled, Files } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { creditService } from '@/api/creditService'
import ScheduledNotificationModal from '@/components/ScheduledNotification/ScheduledNotificationModal.vue'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'

const { laManHep, hienBang, hienThe } = dungManHep()

const emit = defineEmits(['switch-tab'])

interface Contract {
  id: string
  customer_id: string
  customer_name: string
  customer_code: string
  group_name: string
  contact_info: string
  contract_id: string
  loan_type: 'Collateral' | 'Unsecured'
  initial_principal: number
  start_date: string
  due_date: string
  interest_start_date: string
  monthly_interest_rate: number
  monthly_interest_amount: number
  total_principal_paid: number
  remaining_principal: number
  notes: string
  send_message_arise: boolean
  message_content: string
  credit_status: 'active' | 'paid' | 'cancelled' | 'bad_debt'
  interest_debt: number
  last_interest_charged_date: string
  classification?: string
}

const loading = ref(false)
const searchQuery = ref('')
const filterLoanType = ref('')
const filterStatus = ref('')
const filterClassification = ref('')
const classifications = ref<string[]>([])

const fetchClassifications = async () => {
  try {
    const data = await creditService.getClassifications()
    classifications.value = data
  } catch (error) {
    console.error('Failed to fetch classifications:', error)
  }
}

const formatDateString = (date: Date) => {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const getInitialDateRange = (): [string, string] => {
  const today = new Date()
  const threeYearsAgo = new Date()
  threeYearsAgo.setFullYear(today.getFullYear() - 3)
  return [formatDateString(threeYearsAgo), formatDateString(today)]
}

const dateRange = ref<[string, string] | null>(getInitialDateRange())

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Customers list for the add/edit dropdown (fetched from API)
const customersList = ref<any[]>([])

const contracts = ref<Contract[]>([])

const filteredContracts = computed(() => {
  return contracts.value.filter(c => {
    const q = searchQuery.value.toLowerCase()
    const matchesSearch = !q ||
      c.contract_id.toLowerCase().includes(q) ||
      c.customer_name.toLowerCase().includes(q)

    const matchesClassification = !filterClassification.value ||
      c.classification === filterClassification.value

    return matchesSearch && matchesClassification
  })
})

const sortProp = ref('')
const sortOrder = ref('')

const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  sortProp.value = prop
  sortOrder.value = order
}

const sortedContracts = computed(() => {
  const list = [...filteredContracts.value]
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
  return sortedContracts.value.slice(start, end)
})

// Dialog States
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<any>(null)

// Details Dialog State
const detailDialogVisible = ref(false)
const selectedContract = ref<Contract | null>(null)

const openDetailDialog = (row: Contract) => {
  selectedContract.value = row
  detailDialogVisible.value = true
}

const form = reactive({
  id: '',
  customer_id: '',
  contract_id: '',
  loan_type: 'Collateral' as 'Collateral' | 'Unsecured',
  initial_principal: 0,
  initial_principal_text: '',
  start_date: '',
  due_date: '',
  interest_start_date: '',
  monthly_interest_rate: 0.0,
  total_principal_paid: 0,
  total_principal_paid_text: '',
  remaining_principal: 0,
  remaining_principal_text: '',
  notes: '',
  send_message_arise: false,
  message_content: '',
  credit_status: 'active' as 'active' | 'paid' | 'cancelled' | 'bad_debt',
  interest_debt: 0,
  interest_debt_text: '',
  last_interest_charged_date: '',
  classification: ''
})

const rules = reactive({
  customer_id: [{ required: true, message: 'Vui lòng chọn khách hàng', trigger: 'change' }],
  contract_id: [{ required: true, message: 'Vui lòng nhập mã hợp đồng', trigger: 'blur' }],
  loan_type: [{ required: true, message: 'Vui lòng chọn loại vay', trigger: 'change' }],
  credit_status: [{ required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change' }]
})

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

  // Tự động tính toán số tiền gốc
  if (field === 'total_principal_paid') {
    const remaining = form.initial_principal - form.total_principal_paid
    form.remaining_principal = remaining
    form.remaining_principal_text = new Intl.NumberFormat('vi-VN').format(remaining)
  } else if (field === 'remaining_principal') {
    const paid = form.initial_principal - form.remaining_principal
    form.total_principal_paid = paid
    form.total_principal_paid_text = new Intl.NumberFormat('vi-VN').format(paid)
  } else if (field === 'initial_principal') {
    const remaining = form.initial_principal - form.total_principal_paid
    form.remaining_principal = remaining
    form.remaining_principal_text = new Intl.NumberFormat('vi-VN').format(remaining)
  }
}

const handleCommand = (cmd: string, row: Contract) => {
  if (cmd === 'detail') {
    openDetailDialog(row)
  } else if (cmd === 'edit') {
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
    notify_type: 'credit_interest',
    reference_id: row.contract_id,
    reference_name: row.customer_name,
    message_template: `Nhắc nhở đóng lãi\nMã HĐ: ${row.contract_id}\nKhách hàng: ${row.customer_name}\nGốc còn lại: ${new Intl.NumberFormat('vi-VN').format(row.remaining_principal)} VNĐ`,
  }
  scheduleModalVisible.value = true
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

const openAddDialog = () => {
  isEdit.value = false
  form.id = ''
  form.customer_id = ''
  form.contract_id = ''
  form.loan_type = 'Collateral'
  form.start_date = formatDateString(new Date())
  form.due_date = ''
  form.interest_start_date = ''
  form.monthly_interest_rate = 0.0
  form.notes = ''
  form.send_message_arise = false
  form.message_content = ''
  form.credit_status = 'active'
  form.last_interest_charged_date = ''
  form.classification = ''

  const fields = ['initial_principal', 'total_principal_paid', 'remaining_principal', 'interest_debt']
  const formAny = form as any
  fields.forEach(f => {
    formAny[f] = 0
    formAny[`${f}_text`] = ''
  })

  dialogVisible.value = true
}

// Store original contract values before editing to check for modifications
const originalContractValues = ref<{ remaining_principal: number; total_principal_paid: number } | null>(null)

const openEditDialog = (row: Contract) => {
  isEdit.value = true
  originalContractValues.value = {
    remaining_principal: row.remaining_principal || 0,
    total_principal_paid: row.total_principal_paid || 0
  }
  form.id = row.id
  form.customer_id = row.customer_id
  form.contract_id = row.contract_id
  form.loan_type = row.loan_type
  form.start_date = row.start_date
  form.due_date = row.due_date
  form.interest_start_date = row.interest_start_date
  form.monthly_interest_rate = row.monthly_interest_rate
  form.notes = row.notes
  form.send_message_arise = row.send_message_arise
  form.message_content = row.message_content || ''
  form.credit_status = row.credit_status
  form.last_interest_charged_date = row.last_interest_charged_date || ''
  form.classification = row.classification || ''

  const fields = ['initial_principal', 'total_principal_paid', 'remaining_principal', 'interest_debt']
  const formAny = form as any
  fields.forEach(f => {
    const val = (row as any)[f] || 0
    formAny[f] = val
    formAny[`${f}_text`] = val ? new Intl.NumberFormat('vi-VN').format(val) : ''
  })

  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      const selectedCust = customersList.value.find(c => c.id === form.customer_id)
      
      // Calculate monthly interest amount: principal * rate / 100
      const calculatedInterest = Math.round(form.remaining_principal * form.monthly_interest_rate / 100)

      const payload: Contract = {
        id: form.id || `cr-con-${Date.now()}`,
        customer_id: form.customer_id,
        customer_name: selectedCust ? selectedCust.customer_name : 'Khách hàng ẩn danh',
        customer_code: selectedCust ? selectedCust.customer_id : '',
        group_name: selectedCust ? selectedCust.group_name : '',
        contact_info: selectedCust ? selectedCust.contact_info : '',
        contract_id: form.contract_id,
        loan_type: form.loan_type,
        initial_principal: form.initial_principal,
        start_date: form.start_date,
        due_date: form.due_date,
        interest_start_date: form.interest_start_date,
        monthly_interest_rate: form.monthly_interest_rate,
        monthly_interest_amount: calculatedInterest,
        total_principal_paid: form.total_principal_paid,
        remaining_principal: form.remaining_principal,
        notes: form.notes,
        send_message_arise: form.send_message_arise,
        message_content: form.message_content,
        credit_status: form.credit_status,
        interest_debt: form.interest_debt,
        last_interest_charged_date: form.last_interest_charged_date,
        classification: form.classification || ''
      }

      if (isEdit.value) {
        // Chuẩn bị payload gửi đi API update
        const apiPayload = {
          id: form.id,
          customer_id: form.customer_id,
          contract_id: form.contract_id,
          loan_type: form.loan_type,
          initial_principal: form.initial_principal || 0,
          start_date: form.start_date || null,
          due_date: form.due_date || null,
          interest_start_date: form.interest_start_date || null,
          monthly_interest_rate: form.monthly_interest_rate || 0,
          monthly_interest_amount: calculatedInterest || 0,
          total_principal_paid: form.total_principal_paid || 0,
          remaining_principal: form.remaining_principal || 0,
          notes: form.notes || '',
          send_message_arise: form.send_message_arise || false,
          message_content: form.message_content || '',
          interest_debt: form.interest_debt || 0,
          last_interest_charged_date: form.last_interest_charged_date || null,
          credit_status: form.credit_status,
          classification: form.classification || null
        }

        loading.value = true
        try {
          const updatedContracts = await creditService.updateCredits([apiPayload])
          if (updatedContracts && updatedContracts.length > 0) {
            ElMessage.success('Cập nhật hợp đồng thành công!')
            dialogVisible.value = false

            // Check if remaining_principal or total_principal_paid changed
            const hasChanged = originalContractValues.value && (
              originalContractValues.value.remaining_principal !== form.remaining_principal ||
              originalContractValues.value.total_principal_paid !== form.total_principal_paid
            )

            await fetchCredits()
            await fetchClassifications()

            if (hasChanged) {
              await ElMessageBox.alert(
                'Hệ thống phát hiện có sự thay đổi về số tiền Gốc còn lại hoặc Gốc đã trả. Bạn nên cập nhật lại Tổng dư nợ gốc bên tab Khách hàng.',
                'Thông báo cập nhật dư nợ',
                {
                  confirmButtonText: 'Đồng ý',
                  type: 'warning'
                }
              )
              emit('switch-tab', 'customers')
            }
          } else {
            ElMessage.error('Không nhận được phản hồi từ server')
          }
        } catch (error: any) {
          ElMessage.error(error.message || 'Lỗi khi cập nhật hợp đồng')
        } finally {
          loading.value = false
        }
      } else {
        // Chuẩn bị payload gửi đi API (bỏ id tự sinh ở client, đổi date rỗng thành null)
        const apiPayload = {
          customer_id: form.customer_id,
          contract_id: form.contract_id,
          loan_type: form.loan_type,
          initial_principal: form.initial_principal || 0,
          start_date: form.start_date || null,
          due_date: form.due_date || null,
          interest_start_date: form.interest_start_date || null,
          monthly_interest_rate: form.monthly_interest_rate || 0,
          monthly_interest_amount: calculatedInterest || 0,
          total_principal_paid: form.total_principal_paid || 0,
          remaining_principal: form.remaining_principal || 0,
          notes: form.notes || '',
          send_message_arise: form.send_message_arise || false,
          message_content: form.message_content || '',
          interest_debt: form.interest_debt || 0,
          last_interest_charged_date: form.last_interest_charged_date || null,
          credit_status: form.credit_status,
          classification: form.classification || null
        }

        loading.value = true
        try {
          const addedContracts = await creditService.addCredits([apiPayload])
          if (addedContracts && addedContracts.length > 0) {
             ElMessage.success('Thêm mới hợp đồng thành công!')
             dialogVisible.value = false
             await fetchCredits()
             await fetchClassifications()
          } else {
            ElMessage.error('Không nhận được phản hồi từ server')
          }
        } catch (error: any) {
          ElMessage.error(error.message || 'Lỗi khi thêm mới hợp đồng')
        } finally {
          loading.value = false
        }
      }
    }
  })
}

const handleDelete = async (row: Contract) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa hợp đồng "${row.contract_id}"?`,
      'Xác nhận xóa hợp đồng',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy bỏ',
        type: 'warning'
      }
    )
    loading.value = true
    try {
      await creditService.deleteCredits([row.id])
      ElMessage.success('Xóa hợp đồng thành công!')
      await fetchCredits()
    } catch (error: any) {
      ElMessage.error(error.message || 'Lỗi khi xóa hợp đồng')
    } finally {
      loading.value = false
    }
  } catch (err) {
    // cancelled
  }
}

const fetchCredits = async () => {
  loading.value = true
  try {
    // Build params from filters
    const params: any = {}
    if (filterStatus.value) params.status = filterStatus.value
    if (filterLoanType.value) params.loan_type = filterLoanType.value
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }

    const data = await creditService.getCredits(params)
    contracts.value = data.map((item: any) => ({
      id: item.id || '',
      customer_id: item.customer_id || '',
      customer_name: item.customer_name || 'Chưa rõ',
      customer_code: item.customer_code || '',
      group_name: item.group_name || '',
      contact_info: item.contact_info || '',
      contract_id: item.contract_id || '',
      loan_type: item.loan_type || 'Collateral',
      initial_principal: item.initial_principal || 0,
      start_date: item.start_date || '',
      due_date: item.due_date || '',
      interest_start_date: item.interest_start_date || '',
      monthly_interest_rate: item.monthly_interest_rate || 0,
      monthly_interest_amount: item.monthly_interest_amount || 0,
      total_principal_paid: item.total_principal_paid || 0,
      remaining_principal: item.remaining_principal || 0,
      notes: item.notes || '',
      send_message_arise: item.send_message_arise || false,
      message_content: item.message_content || '',
      credit_status: item.credit_status || 'active',
      interest_debt: item.interest_debt || 0,
      last_interest_charged_date: item.last_interest_charged_date || '',
      classification: item.classification || ''
    }))
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi tải danh sách hợp đồng tín dụng')
  } finally {
    loading.value = false
  }
}

const fetchCustomersList = async () => {
  try {
    const data = await creditService.getCreditCustomers()
    customersList.value = data
  } catch (error: any) {
    // Silently fail - customer dropdown may not load
    console.error('Failed to load customers list:', error)
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

onMounted(() => {
  fetchCredits()
  fetchCustomersList()
  fetchClassifications()
})
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

html.dark .custom-dark-select :deep(.el-input__wrapper),
html.dark .custom-dark-input :deep(.el-input__wrapper) {
  background-color: #111827 !important;
  box-shadow: 0 0 0 1px #4b5563 inset !important;
}
html.dark .custom-dark-select :deep(.el-input__inner),
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
