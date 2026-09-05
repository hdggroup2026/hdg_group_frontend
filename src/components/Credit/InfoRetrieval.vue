<template>
  <div class="lookup-container h-full flex flex-col">
    <!-- Filter bar -->
    <div class="flex flex-wrap justify-between items-center gap-x-4 gap-y-4 mb-4 shrink-0 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-4">
        <!-- Category selector -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Mục:</span>
          <el-select 
            v-model="activeCategory" 
            placeholder="Chọn mục" 
            style="width: 160px"
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
            @change="handleCategoryChange"
          >
            <el-option label="Khách hàng" value="customer" />
            <el-option label="Hợp đồng" value="contract" />
            <el-option label="Thanh toán" value="payment" />
          </el-select>
        </div>

        <!-- 1. Customer Filters -->
        <template v-if="activeCategory === 'customer'">
          <div class="flex items-center gap-2">
            <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Phân loại:</span>
            <el-select
              v-model="custClassification"
              placeholder="Tất cả"
              clearable
              style="width: 140px"
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
          <div class="flex items-center gap-2">
            <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Mã khách hàng:</span>
            <el-input
              v-model="custCustomerId"
              placeholder="Nhập mã khách hàng..."
              clearable
              class="w-48 custom-dark-input"
            />
          </div>
        </template>

        <!-- 2. Contract Filters -->
        <template v-if="activeCategory === 'contract'">
          <div class="flex items-center gap-2">
            <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Phân loại:</span>
            <el-select
              v-model="contractClassification"
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
          <div class="flex items-center gap-2">
            <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Loại vay:</span>
            <el-select 
              v-model="contractLoanType" 
              placeholder="Tất cả" 
              style="width: 130px" 
              class="custom-dark-select highlight-select" 
              popper-class="custom-dark-select-popper"
              clearable
            >
              <el-option label="Thế chấp" value="Collateral" />
              <el-option label="Tín chấp" value="Unsecured" />
            </el-select>
          </div>
          <div class="flex items-center gap-2">
            <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái:</span>
            <el-select 
              v-model="contractStatus" 
              placeholder="Tất cả" 
              style="width: 140px" 
              class="custom-dark-select highlight-select" 
              popper-class="custom-dark-select-popper"
              clearable
            >
              <el-option label="Đang vay" value="active" />
              <el-option label="Đã tất toán" value="paid" />
              <el-option label="Đã hủy" value="cancelled" />
              <el-option label="Nợ xấu" value="bad_debt" />
            </el-select>
          </div>
          <div class="flex items-center gap-2">
            <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Mã khách hàng:</span>
            <el-input
              v-model="contractCustomerId"
              placeholder="Mã KH..."
              clearable
              class="w-40 custom-dark-input"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian:</span>
            <el-date-picker :editable="false"
              v-model="contractDateRange"
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
        </template>

        <!-- 3. Payment Filters -->
        <template v-if="activeCategory === 'payment'">
          <div class="flex items-center gap-2">
            <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Mã khách hàng:</span>
            <el-input
              v-model="payCustomerId"
              placeholder="Nhập mã khách hàng..."
              clearable
              class="w-48 custom-dark-input"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian:</span>
            <el-date-picker :editable="false"
              v-model="payDateRange"
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
        </template>

        <el-button type="primary" :icon="Search" @click="handleSearch">Tìm kiếm</el-button>
      </div>
    </div>

    <!-- Summary Statistics Cards -->
    <div v-if="hasSearched" class="summary-cards mb-4 shrink-0">
      <!-- Customer Cards -->
      <div v-if="activeCategory === 'customer'" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="stat-card stat-card--blue">
          <div class="stat-card__label">Tổng hạn mức tín dụng</div>
          <div class="stat-card__value text-blue-600 dark:text-blue-400">{{ formatCurrencyWithoutSuffix(totalCustCreditLimit) }} VNĐ</div>
        </div>
        <div class="stat-card stat-card--emerald">
          <div class="stat-card__label">Tổng hạn mức còn lại</div>
          <div class="stat-card__value text-emerald-600 dark:text-emerald-400">{{ formatCurrencyWithoutSuffix(totalCustRemainingLimit) }} VNĐ</div>
        </div>
        <div class="stat-card stat-card--red">
          <div class="stat-card__label">Tổng dư nợ gốc</div>
          <div class="stat-card__value text-red-500 dark:text-red-400">{{ formatCurrencyWithoutSuffix(totalCustPrincipalDebt) }} VNĐ</div>
        </div>
      </div>

      <!-- Contract Cards -->
      <div v-if="activeCategory === 'contract'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="stat-card stat-card--blue">
          <div class="stat-card__label">Tổng gốc ban đầu</div>
          <div class="stat-card__value text-blue-600 dark:text-blue-400">{{ formatCurrencyWithoutSuffix(totalConInitialPrincipal) }} VNĐ</div>
        </div>
        <div class="stat-card stat-card--emerald">
          <div class="stat-card__label">Tổng gốc còn lại</div>
          <div class="stat-card__value text-emerald-600 dark:text-emerald-400">{{ formatCurrencyWithoutSuffix(totalConRemainingPrincipal) }} VNĐ</div>
        </div>
        <div class="stat-card stat-card--indigo">
          <div class="stat-card__label">Tổng gốc đã trả</div>
          <div class="stat-card__value text-indigo-600 dark:text-indigo-400">{{ formatCurrencyWithoutSuffix(totalConPrincipalPaid) }} VNĐ</div>
        </div>
        <div class="stat-card stat-card--red">
          <div class="stat-card__label">Tổng nợ lãi</div>
          <div class="stat-card__value text-red-500 dark:text-red-400">{{ formatCurrencyWithoutSuffix(totalConInterestDebt) }} VNĐ</div>
        </div>
      </div>

      <!-- Payment Cards -->
      <div v-if="activeCategory === 'payment'" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="stat-card stat-card--emerald">
          <div class="stat-card__label">Tổng số tiền lãi đã đóng</div>
          <div class="stat-card__value text-emerald-600 dark:text-emerald-400">{{ formatCurrencyWithoutSuffix(totalPayInterestAmount) }} VNĐ</div>
        </div>
      </div>
    </div>

    <!-- Table Results -->
    <div v-if="hasSearched" class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
      <!-- 1. Customer Table -->
      <!-- ══════════════════════════════════════════════════════════════
           MỤC 398 (29/08/2026) — BỎ CỘT GHIM, BẢNG CHỈ HIỆN TỪ 768px

           Cột ghim `fixed` chiếm chỗ CỐ ĐỊNH và không co theo màn hình.
           Trên màn 390px, mấy cột ghim cộng lại đã hết chỗ, nên vùng
           cuộn còn lại bằng 0 và vuốt ngang không có tác dụng — người
           dùng vuốt mà màn hình không nhúc nhích.

           Đã bỏ 0 cột ghim ở bảng này.
           ══════════════════════════════════════════════════════════ -->
      <el-table v-if="hienBang && (activeCategory === 'customer')" v-loading="loading" :data="paginatedCustomers" style="width: 100%" class="flex-1" height="100%" @sort-change="handleSortChange">
        <el-table-column label="STT" width="52" align="center">
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="customer_id" label="Mã KH" width="94" sortable="custom">
          <template #default="{ row }">
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.customer_id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="customer_name" label="Tên khách hàng" width="144" sortable="custom" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.customer_name }}</span>
          </template>
        </el-table-column>
        <!-- MỤC 420 (30/08/2026) — tên nhóm không còn bị cắt.
             `width` cố định + `show-overflow-tooltip` nghĩa là cắt rồi
             hiện lại khi rê chuột — mà trên iPad không rê chuột được.
             Đổi sang `min-width` co giãn + cho xuống dòng. -->
        <el-table-column prop="group_name" label="Tên nhóm" min-width="150">
          <template #default="{ row }">
            <span class="text-gray-600 dark:text-gray-400 font-medium">{{ row.group_name || '—' }}</span>
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
        <el-table-column prop="contact_info" label="Liên hệ (Telegram)" min-width="158" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono text-violet-650 dark:text-violet-400">{{ row.contact_info || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_credit_limit" label="Hạn mức tín dụng" width="115" align="right">
          <template #default="{ row }">
            <span :class="mauSo(row.total_credit_limit)">{{ formatCurrency(row.total_credit_limit) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="remaining_credit_limit" label="Hạn mức còn lại" width="115" align="right">
          <template #default="{ row }">
            <span class="font-bold" :class="mauSo(row.remaining_credit_limit)">{{ formatCurrency(row.remaining_credit_limit) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_principal_outstanding" label="Tổng dư nợ gốc" width="115" align="right">
          <template #default="{ row }">
            <span :class="row.total_principal_outstanding > 0 ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-gray-400'">
              {{ formatCurrency(row.total_principal_outstanding) }}
            </span>
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
      <div v-if="hienThe && (activeCategory === 'customer')" v-loading="loading" class="flex-1 min-h-0 overflow-y-auto p-3">
        <div v-if="paginatedCustomers.length > 0" class="grid grid-cols-1 gap-4">
          <div
            v-for="(row, i) in (paginatedCustomers as any[])"
            :key="row.id || row.contract_id || i"
            class="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
              <div class="min-w-0 break-words">
                <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.customer_id }}</span>
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
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tên nhóm:</span>
                <span class="text-right break-words min-w-0">
                  <span class="text-gray-600 dark:text-gray-400 font-medium">{{ row.group_name || '—' }}</span>
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
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Liên hệ (Telegram):</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-mono text-violet-650 dark:text-violet-400">{{ row.contact_info || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Hạn mức tín dụng:</span>
                <span class="text-right break-words min-w-0">
                  <span :class="mauSo(row.total_credit_limit)">{{ formatCurrency(row.total_credit_limit) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Hạn mức còn lại:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-bold" :class="mauSo(row.remaining_credit_limit)">{{ formatCurrency(row.remaining_credit_limit) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tổng dư nợ gốc:</span>
                <span class="text-right break-words min-w-0">
                  <span :class="row.total_principal_outstanding > 0 ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-gray-400'">
                                {{ formatCurrency(row.total_principal_outstanding) }}
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

      <!-- 2. Contract Table -->
      <!-- ══════════════════════════════════════════════════════════════
           MỤC 398 (29/08/2026) — BỎ CỘT GHIM, BẢNG CHỈ HIỆN TỪ 768px

           Cột ghim `fixed` chiếm chỗ CỐ ĐỊNH và không co theo màn hình.
           Trên màn 390px, mấy cột ghim cộng lại đã hết chỗ, nên vùng
           cuộn còn lại bằng 0 và vuốt ngang không có tác dụng — người
           dùng vuốt mà màn hình không nhúc nhích.

           Đã bỏ 0 cột ghim ở bảng này.
           ══════════════════════════════════════════════════════════ -->
      <el-table v-if="hienBang && (activeCategory === 'contract')" v-loading="loading" :data="paginatedContracts" style="width: 100%" class="flex-1" height="100%" @sort-change="handleSortChange">
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
            <span class="block text-xxs font-mono text-gray-400">KH: {{ row.customer_code }}</span>
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
        <el-table-column prop="loan_type" label="Loại vay" width="79" align="center">
          <template #default="{ row }">
            <el-tag :type="row.loan_type === 'Collateral' ? 'primary' : 'warning'" size="small">
              {{ row.loan_type === 'Collateral' ? 'Thế chấp' : 'Tín chấp' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="initial_principal" label="Gốc ban đầu" width="101" align="right">
          <template #default="{ row }">
            <span :class="mauSo(row.initial_principal)">{{ formatCurrency(row.initial_principal) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="remaining_principal" label="Gốc còn lại" width="101" align="right">
          <template #default="{ row }">
            <span class="font-bold" :class="mauSo(row.remaining_principal)">{{ formatCurrency(row.remaining_principal) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_principal_paid" label="Gốc đã trả" width="101" align="right">
          <template #default="{ row }">
            <span :class="mauSo(row.total_principal_paid)">{{ formatCurrency(row.total_principal_paid) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="monthly_interest_rate" label="Lãi suất" width="72" align="right">
          <template #default="{ row }">
            <span>{{ row.monthly_interest_rate ? `${row.monthly_interest_rate}%` : '0%' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="interest_debt" label="Nợ lãi" width="94" align="right">
          <template #default="{ row }">
            <span :class="row.interest_debt > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-gray-400'">
              {{ formatCurrency(row.interest_debt) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="credit_status" label="Trạng thái" width="94" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.credit_status)" effect="plain" size="small" class="capitalize">
              {{ getStatusText(row.credit_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="due_date" label="Ngày đáo hạn" width="86" align="center">
          <template #default="{ row }">
            <span>{{ formatDate(row.due_date) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Thao tác" width="60" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openContractDetail(row)">Chi tiết</el-button>
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
      <div v-if="hienThe && (activeCategory === 'contract')" v-loading="loading" class="flex-1 min-h-0 overflow-y-auto p-3">
        <div v-if="paginatedContracts.length > 0" class="grid grid-cols-1 gap-4">
          <div
            v-for="(row, i) in (paginatedContracts as any[])"
            :key="row.id || row.contract_id || i"
            class="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
              <div class="min-w-0 break-words">
                <span class="font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{{ row.contract_id }}</span>
              </div>
              <div class="shrink-0">
                <el-button link type="primary" size="small" @click="openContractDetail(row)">Chi tiết</el-button>
              </div>
            </div>
            <div class="space-y-2 text-sm text-left">
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tên khách hàng:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.customer_name }}</span>
                              <span class="block text-xxs font-mono text-gray-400">KH: {{ row.customer_code }}</span>
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
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Gốc đã trả:</span>
                <span class="text-right break-words min-w-0">
                  <span :class="mauSo(row.total_principal_paid)">{{ formatCurrency(row.total_principal_paid) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Lãi suất:</span>
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
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Trạng thái:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag :type="getStatusTag(row.credit_status)" effect="plain" size="small" class="capitalize">
                                {{ getStatusText(row.credit_status) }}
                              </el-tag>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ngày đáo hạn:</span>
                <span class="text-right break-words min-w-0">
                  <span>{{ formatDate(row.due_date) }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
          <p class="text-base font-medium">Không có dòng nào khớp bộ lọc</p>
        </div>
      </div>

      <!-- 3. Payment Table -->
      <!-- ══════════════════════════════════════════════════════════════
           MỤC 398 (29/08/2026) — BỎ CỘT GHIM, BẢNG CHỈ HIỆN TỪ 768px

           Cột ghim `fixed` chiếm chỗ CỐ ĐỊNH và không co theo màn hình.
           Trên màn 390px, mấy cột ghim cộng lại đã hết chỗ, nên vùng
           cuộn còn lại bằng 0 và vuốt ngang không có tác dụng — người
           dùng vuốt mà màn hình không nhúc nhích.

           Đã bỏ 0 cột ghim ở bảng này.
           ══════════════════════════════════════════════════════════ -->
      <el-table v-if="hienBang && (activeCategory === 'payment')" v-loading="loading" :data="paginatedPayments" style="width: 100%" class="flex-1" height="100%" @sort-change="handleSortChange">
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
            <span class="block text-xxs font-mono text-gray-400">KH: {{ row.customer_code }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="loan_type" label="Loại vay" width="79" align="center">
          <template #default="{ row }">
            <el-tag :type="row.loan_type === 'Collateral' ? 'primary' : 'warning'" size="small">
              {{ row.loan_type === 'Collateral' ? 'Thế chấp' : 'Tín chấp' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="initial_principal" label="Gốc ban đầu" width="101" align="right">
          <template #default="{ row }">
            <span :class="mauSo(row.initial_principal)">{{ formatCurrency(row.initial_principal) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="remaining_principal" label="Gốc còn lại" width="101" align="right">
          <template #default="{ row }">
            <span class="font-bold" :class="mauSo(row.remaining_principal)">{{ formatCurrency(row.remaining_principal) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="monthly_interest_rate" label="Lãi suất / Tháng" width="94" align="right">
          <template #default="{ row }">
            <span>{{ row.monthly_interest_rate ? `${row.monthly_interest_rate}%` : '0%' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="interest_amount" label="Số tiền lãi" width="108" align="right">
          <template #default="{ row }">
            <span class="font-bold" :class="mauSo(row.interest_amount)">{{ formatCurrency(row.interest_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="interest_payment_date" label="Ngày trả lãi" width="94" align="center">
          <template #default="{ row }">
            <span>{{ formatDate(row.interest_payment_date) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="payment_time" label="Thời gian ghi nhận" width="119" align="center">
          <template #default="{ row }">
            <span class="text-gray-600 dark:text-gray-400">{{ formatDateTime(row.payment_time) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Thao tác" width="60" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openPaymentDetail(row)">Chi tiết</el-button>
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
      <div v-if="hienThe && (activeCategory === 'payment')" v-loading="loading" class="flex-1 min-h-0 overflow-y-auto p-3">
        <div v-if="paginatedPayments.length > 0" class="grid grid-cols-1 gap-4">
          <div
            v-for="(row, i) in (paginatedPayments as any[])"
            :key="row.id || row.contract_id || i"
            class="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
              <div class="min-w-0 break-words">
                <span class="font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{{ row.contract_id }}</span>
              </div>
              <div class="shrink-0">
                <el-button link type="primary" size="small" @click="openPaymentDetail(row)">Chi tiết</el-button>
              </div>
            </div>
            <div class="space-y-2 text-sm text-left">
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tên khách hàng:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.customer_name }}</span>
                              <span class="block text-xxs font-mono text-gray-400">KH: {{ row.customer_code }}</span>
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
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ngày trả lãi:</span>
                <span class="text-right break-words min-w-0">
                  <span>{{ formatDate(row.interest_payment_date) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Thời gian ghi nhận:</span>
                <span class="text-right break-words min-w-0">
                  <span class="text-gray-600 dark:text-gray-400">{{ formatDateTime(row.payment_time) }}</span>
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

    <!-- Empty state before search -->
    <div v-if="!hasSearched" class="flex-1 flex items-center justify-center">
      <div class="text-center text-gray-400 dark:text-gray-500">
        <el-icon class="text-6xl mb-4"><Search /></el-icon>
        <p class="text-lg">Vui lòng chọn các tiêu chí và nhấn <strong>Tìm kiếm</strong> để truy xuất thông tin</p>
      </div>
    </div>

    <!-- Details Dialogs (Reused from lists) -->
    <!-- 1. Contract Details Dialog -->
    <el-dialog 
      v-model="conDetailDialogVisible" 
      title="CHI TIẾT HỢP ĐỒNG TÍN DỤNG" 
      width="850px" 
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedContract" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto overflow-x-hidden text-left">
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-blue-500 dark:bg-blue-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32"><Files /></el-icon>
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
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="conDetailDialogVisible = false">Đóng</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 2. Payment Details Dialog -->
    <el-dialog 
      v-model="payDetailDialogVisible" 
      title="CHI TIẾT THANH TOÁN LÃI" 
      width="850px" 
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedPayment" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto overflow-x-hidden text-left">
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-emerald-500 dark:bg-emerald-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32"><Wallet /></el-icon>
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
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="payDetailDialogVisible = false">Đóng</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">

// MỤC 527 (05/09/2026) — màn này cũng chạy trong một luồng. Xem lời ghi
// đầy đủ ở `CustomerList.vue`.
const props = defineProps<{ luong?: string }>()
import { ref, computed, onMounted, watch } from 'vue'
import { mauSo } from '@/utils/mauSo'
import { Search, Wallet, CreditCard, Money, TrendCharts, Collection, Files } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { creditService } from '@/api/creditService'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'

const { laManHep, hienBang, hienThe } = dungManHep()

// Category type: 'customer' | 'contract' | 'payment'
const activeCategory = ref<'customer' | 'contract' | 'payment'>('customer')
const loading = ref(false)
const hasSearched = ref(false)

// Pagination state
const currentPage = ref(1)
const pageSize = ref(10)

// Filters State
const classifications = ref<string[]>([])

// 1. Customer
const custCustomerId = ref('')
const custClassification = ref('')
const customers = ref<any[]>([])

// 2. Contract
const contractLoanType = ref('')
const contractStatus = ref('')
const contractCustomerId = ref('')
const contractClassification = ref('')
const contractDateRange = ref<[string, string] | null>(null)
const contracts = ref<any[]>([])

// 3. Payment
const payCustomerId = ref('')
const payDateRange = ref<[string, string] | null>(null)
const payments = ref<any[]>([])

const fetchClassifications = async () => {
  try {
    const data = await creditService.getClassifications()
    classifications.value = data
  } catch (error) {
    console.error('Failed to fetch classifications:', error)
  }
}

// Details Dialogs State
const conDetailDialogVisible = ref(false)
const selectedContract = ref<any>(null)
const payDetailDialogVisible = ref(false)
const selectedPayment = ref<any>(null)

// Reset search state on category change
watch(activeCategory, () => {
  hasSearched.value = false
  currentPage.value = 1
  custCustomerId.value = ''
  custClassification.value = ''
  contractLoanType.value = ''
  contractStatus.value = ''
  contractCustomerId.value = ''
  contractClassification.value = ''
  contractDateRange.value = null
  payCustomerId.value = ''
  payDateRange.value = null
})

// Formatters
const formatCurrency = (val: number) => {
  if (!val) return '0 VNĐ'
  return new Intl.NumberFormat('vi-VN').format(val) + ' VNĐ'
}

const formatCurrencyWithoutSuffix = (val: number) => {
  if (!val) return '0'
  return new Intl.NumberFormat('vi-VN').format(val)
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

// Fetchers
const fetchCustomers = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (custCustomerId.value.trim()) {
      params.customer_id = custCustomerId.value.trim()
    }
    if (props.luong) params.classification = props.luong   // MỤC 527
    const data = await creditService.getCreditCustomers(params)
    customers.value = data
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi tải danh sách khách hàng')
  } finally {
    loading.value = false
  }
}

const fetchContracts = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (contractLoanType.value) params.loan_type = contractLoanType.value
    if (contractStatus.value) params.status = contractStatus.value
    if (contractCustomerId.value.trim()) params.customer_id = contractCustomerId.value.trim()
    if (contractDateRange.value && contractDateRange.value.length === 2) {
      params.start_date = contractDateRange.value[0]
      params.end_date = contractDateRange.value[1]
    }
    if (props.luong) params.classification = props.luong   // MỤC 527
    const data = await creditService.getCredits(params)
    contracts.value = data
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi tải danh sách hợp đồng')
  } finally {
    loading.value = false
  }
}

const fetchPayments = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (payCustomerId.value.trim()) params.customer_id = payCustomerId.value.trim()
    if (payDateRange.value && payDateRange.value.length === 2) {
      params.start_date = payDateRange.value[0]
      params.end_date = payDateRange.value[1]
    }
    if (props.luong) params.classification = props.luong   // MỤC 527
    const data = await creditService.getCreditInterests(params)
    payments.value = data
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi tải danh sách thanh toán lãi')
  } finally {
    loading.value = false
  }
}

// Search triggers
const handleSearch = async () => {
  hasSearched.value = true
  currentPage.value = 1
  if (activeCategory.value === 'customer') {
    await fetchCustomers()
  } else if (activeCategory.value === 'contract') {
    await fetchContracts()
  } else if (activeCategory.value === 'payment') {
    await fetchPayments()
  }
}

// Handlers
const handleCategoryChange = () => {
  // handled by watcher
}

const openContractDetail = (row: any) => {
  selectedContract.value = row
  conDetailDialogVisible.value = true
}

const openPaymentDetail = (row: any) => {
  selectedPayment.value = row
  payDetailDialogVisible.value = true
}

// Computeds for statistics
const filteredCustomers = computed(() => {
  return customers.value.filter(c => {
    return !custClassification.value || c.classification === custClassification.value
  })
})

const filteredContracts = computed(() => {
  return contracts.value.filter(c => {
    return !contractClassification.value || c.classification === contractClassification.value
  })
})

const totalCustCreditLimit = computed(() => {
  return filteredCustomers.value.reduce((sum, c) => sum + (c.total_credit_limit || 0), 0)
})
const totalCustRemainingLimit = computed(() => {
  return filteredCustomers.value.reduce((sum, c) => sum + (c.remaining_credit_limit || 0), 0)
})
const totalCustPrincipalDebt = computed(() => {
  return filteredCustomers.value.reduce((sum, c) => sum + (c.total_principal_outstanding || 0), 0)
})

const totalConInitialPrincipal = computed(() => {
  return filteredContracts.value.reduce((sum, c) => sum + (c.initial_principal || 0), 0)
})
const totalConRemainingPrincipal = computed(() => {
  return filteredContracts.value.reduce((sum, c) => sum + (c.remaining_principal || 0), 0)
})
const totalConPrincipalPaid = computed(() => {
  return filteredContracts.value.reduce((sum, c) => sum + (c.total_principal_paid || 0), 0)
})
const totalConInterestDebt = computed(() => {
  return filteredContracts.value.reduce((sum, c) => sum + (c.interest_debt || 0), 0)
})

const totalPayInterestAmount = computed(() => {
  return payments.value.reduce((sum, p) => sum + (p.interest_amount || 0), 0)
})

// Computeds for pagination
const totalCount = computed(() => {
  if (activeCategory.value === 'customer') return filteredCustomers.value.length
  if (activeCategory.value === 'contract') return filteredContracts.value.length
  return payments.value.length
})

const sortProp = ref('')
const sortOrder = ref('')

const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  sortProp.value = prop
  sortOrder.value = order
}

const sortedCustomers = computed(() => {
  const list = [...filteredCustomers.value]
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

const paginatedCustomers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedCustomers.value.slice(start, end)
})

const paginatedContracts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedContracts.value.slice(start, end)
})

const paginatedPayments = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedPayments.value.slice(start, end)
})

onMounted(() => {
  fetchClassifications()
})
</script>

<style scoped>
.lookup-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

.lookup-container :deep(.el-pagination) {
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
  text-align: left;
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
.stat-card--blue { border-left: 4px solid #3b82f6; }
.stat-card--emerald { border-left: 4px solid #10b981; }
.stat-card--indigo { border-left: 4px solid #6366f1; }
.stat-card--red { border-left: 4px solid #ef4444; }

/* Dark Mode: Table */
html.dark .lookup-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .lookup-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .lookup-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

html.dark .lookup-container :deep(.el-table .el-table-fixed-column--left),
html.dark .lookup-container :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important;
}

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

/* Dark Mode: Select & Input */
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

<style>
/* Select dropdown popper dark mode (unscoped) */
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

/* Highlight selects dark mode */
html.dark .highlight-select .el-input__wrapper,
html.dark .highlight-select .el-select__wrapper {
  background-color: #111827 !important;
  border-color: #111827 !important;
}

/* Date picker range dark mode */
html.dark .highlight-select.el-date-editor.el-range-editor {
  background-color: #111827 !important;
  box-shadow: 0 0 0 1px #111827 inset !important;
}

html.dark .highlight-select.el-date-editor .el-range-input {
  background-color: transparent !important;
  color: #f3f4f6 !important;
}

html.dark .highlight-select.el-date-editor .el-range-separator {
  color: #9ca3af !important;
}

html.dark .highlight-select.el-date-editor .el-range-input::placeholder {
  color: #6b7280 !important;
}
</style>
