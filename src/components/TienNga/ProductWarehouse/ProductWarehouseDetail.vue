<template>
  <div class="h-full p-6 overflow-hidden flex flex-col product-detail-wrapper">
    <!-- Header Navigation -->
    <div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
      <div class="flex items-center gap-3">
        <el-button @click="emit('back')" circle class="shadow-sm hover:scale-105 transition-transform duration-200">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <div>
          <div class="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Chi Tiết Kho Thành Phẩm</div>
          <h2 class="text-2xl font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-2 mt-0.5">
            {{ warehouse.name }}
          </h2>
        </div>
      </div>
      <span class="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 font-medium">
        {{ warehouse.address }}
      </span>
    </div>

    <!-- Quick Stats -->
    <div v-show="activeTab !== 'lookup'" class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 shrink-0">
      <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm flex flex-col justify-between">
        <div>
          <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-violet-600 dark:text-violet-400">Tồn kho hiện tại</div>
          <div class="text-xl font-bold mt-1 text-violet-600 dark:text-violet-400">{{ formatNumber(warehouse.currentQty) }} kg</div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm flex flex-col justify-between">
        <div class="flex justify-between items-start">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Sức chứa</div>
            <div class="text-xl font-bold mt-1 text-gray-800 dark:text-gray-100">{{ warehouse.capacity }}</div>
          </div>
          <el-tag 
            :type="capacityPercentValue > 90 ? 'danger' : capacityPercentValue > 70 ? 'warning' : 'success'" 
            effect="light" 
            size="small" 
            class="font-bold border-none"
          >
            {{ capacityPercentText }}
          </el-tag>
        </div>
        <!-- Capacity Progress Bar -->
        <div class="mt-3">
          <div class="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              class="h-full rounded-full transition-all duration-500" 
              :style="{ width: capacityPercentValue + '%', backgroundColor: warehouse.color || '#8b5cf6' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Tabs -->
    <div class="flex-1 min-h-0 flex flex-col">
      <el-tabs v-model="activeTab" type="border-card" class="detail-tabs h-full flex flex-col flex-1">

        <!-- 1. TAB GIAO DỊCH -->
        <el-tab-pane name="transaction" class="h-full flex flex-col">
          <template #label>
            <span class="custom-tabs-label flex items-center gap-1">
              <el-icon><List /></el-icon>
              <span>Giao dịch</span>
            </span>
          </template>

          <div class="flex-1 flex flex-col min-h-0">
            <!-- Filter Bar -->
            <div class="flex flex-wrap justify-between items-center mb-4 gap-x-4 gap-y-4 shrink-0">
              <div class="flex flex-wrap items-center gap-x-4 gap-y-4">
                <div class="flex items-center gap-2">
                  <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Loại GD:</span>
                  <el-select
                    v-model="txFilters.transactionType"
                    placeholder="Tất cả"
                    style="width: 130px"
                    class="custom-dark-select highlight-select"
                    popper-class="custom-dark-select-popper"
                  >
                    <el-option label="Tất cả" value="all" />
                    <el-option label="Nhập" value="import" />
                    <el-option label="Xuất" value="export" />
                  </el-select>
                </div>
                <div class="flex items-center gap-2">
                  <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Nguyên liệu:</span>
                  <el-select
                    v-model="txFilters.material"
                    placeholder="Tất cả"
                    style="width: 170px"
                    class="custom-dark-select highlight-select"
                    popper-class="custom-dark-select-popper"
                  >
                    <el-option label="Tất cả" value="all" />
                    <el-option label="Cao su RSS3" value="Cao su RSS3" />
                    <el-option label="Phế phẩm Cao su" value="Phế phẩm Cao su" />
                  </el-select>
                </div>
                <div class="flex items-center gap-2">
                  <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian:</span>
                  <el-date-picker :editable="false"
                    v-model="txFilters.dateRange"
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
                  <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
                  <el-input
                    v-model="txFilters.search"
                    placeholder="Tên khách hàng, mã hàng..."
                    :prefix-icon="Search"
                    clearable
                    class="w-60 custom-dark-input"
                  />
                </div>
              </div>
              <!-- Thêm giao dịch Button & Refresh Button -->
              <div class="flex items-center gap-2">
                <el-button :icon="Refresh" circle @click="emit('refresh-transactions')" />
                <el-button type="primary" @click="openTxDialog">Thêm giao dịch</el-button>
              </div>
            </div>

            <!-- Table & Pagination -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0 border border-gray-100 dark:border-gray-700">
              <el-table :data="paginatedTx" style="width: 100%" class="flex-1 custom-table" height="100%" @sort-change="handleTxSortChange">
                <el-table-column label="STT" width="60" align="center" fixed>
                  <template #default="{ $index }">
                    <span class="font-mono text-xs text-gray-500">{{ (txPage - 1) * txPageSize + $index + 1 }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Ngày giao dịch" prop="date" width="150" sortable="custom" fixed>
                  <template #default="scope">
                    <span class="text-xs font-semibold text-gray-600 dark:text-gray-400">{{ formatDate(scope.row.date) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Mã KH" prop="customerCode" width="110" sortable="custom" fixed />
                <el-table-column label="Tên Khách hàng" prop="customerName" min-width="300" show-overflow-tooltip>
                  <template #default="scope">
                    <span class="whitespace-nowrap font-semibold text-gray-800 dark:text-gray-200">{{ scope.row.customerName }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Loại giao dịch" width="140" align="center">
                  <template #default="scope">
                    <el-tag :type="scope.row.transactionType === 'import' ? 'success' : 'danger'" effect="light" size="small" round>
                      {{ scope.row.transactionType === 'import' ? 'Nhập' : 'Xuất' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="Nguyên liệu" width="150">
                  <template #default="scope">
                    <el-tag :type="scope.row.material === 'Cao su RSS3' ? 'info' : 'warning'" effect="light" size="small" round>
                      {{ scope.row.material }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="Tên Kho" prop="warehouseName" width="200" show-overflow-tooltip />
                <el-table-column label="Số lượng" width="130" align="right">
                  <template #default="scope">
                    <span class="font-medium">{{ formatNumber(scope.row.quantity) }} kg</span>
                  </template>
                </el-table-column>
                <el-table-column label="Đơn giá" width="130" align="right">
                  <template #default="scope">{{ formatCurrency(scope.row.unitPrice) }}</template>
                </el-table-column>
                <el-table-column label="Thành tiền" width="160" align="right">
                  <template #default="scope">
                    <span class="font-bold text-green-500">{{ formatCurrency(scope.row.totalAmount) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Công nợ" width="150" align="right">
                  <template #default="scope">
                    <span class="font-bold" :class="scope.row.debt > 0 ? 'text-rose-500' : (scope.row.debt < 0 ? 'text-teal-500' : 'text-gray-400')">{{ formatCurrency(scope.row.debt) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Mã hàng" prop="productCode" width="130" />
                <!-- Thao tác -->
                <el-table-column fixed="right" label="Thao tác" width="90" align="center">
                  <template #default="scope">
                    <el-dropdown trigger="click" @command="(cmd) => handleTxCommand(cmd, scope.row)">
                      <el-button link type="info" class="p-1">
                        <el-icon class="text-xl"><MoreFilled /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="detail">Chi tiết</el-dropdown-item>
                          <el-dropdown-item command="delete" class="!text-red-500">Xóa</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </template>
                </el-table-column>
              </el-table>

              <div class="mt-auto shrink-0 p-4 flex flex-wrap justify-end gap-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                <el-pagination
                  v-model:current-page="txPage"
                  v-model:page-size="txPageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  :background="true"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="filteredTx.length"
                />
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 2. TAB TRUY XUẤT THÔNG TIN -->
        <el-tab-pane name="lookup" class="h-full flex flex-col">
          <template #label>
            <span class="custom-tabs-label flex items-center gap-1">
              <el-icon><Search /></el-icon>
              <span>Truy xuất thông tin</span>
            </span>
          </template>

          <div class="lookup-container flex-1 flex flex-col min-h-0">
            <!-- Filter bar -->
            <div class="flex flex-wrap justify-between items-center gap-x-4 gap-y-4 mb-4 shrink-0">
              <div class="flex flex-wrap items-center gap-x-4 gap-y-4">
                <div class="flex items-center gap-2">
                  <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Loại GD:</span>
                  <el-select
                    v-model="lookupFilters.transactionType"
                    placeholder="Tất cả"
                    style="width: 130px"
                    class="custom-dark-select highlight-select"
                    popper-class="custom-dark-select-popper"
                  >
                    <el-option label="Tất cả" value="all" />
                    <el-option label="Nhập" value="import" />
                    <el-option label="Xuất" value="export" />
                  </el-select>
                </div>
                <div class="flex items-center gap-2">
                  <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Nguyên liệu:</span>
                  <el-select
                    v-model="lookupFilters.material"
                    placeholder="Tất cả"
                    style="width: 170px"
                    class="custom-dark-select highlight-select"
                    popper-class="custom-dark-select-popper"
                  >
                    <el-option label="Tất cả" value="all" />
                    <el-option label="Cao su RSS3" value="Cao su RSS3" />
                    <el-option label="Phế phẩm Cao su" value="Phế phẩm Cao su" />
                  </el-select>
                </div>
                <div class="flex items-center gap-2">
                  <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian:</span>
                  <el-date-picker :editable="false"
                    v-model="lookupFilters.dateRange"
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
              </div>
              <el-button type="primary" :icon="Search" :loading="lookupLoading" @click="handleLookupSearch">Tìm kiếm</el-button>
            </div>

            <!-- Stat Cards (after search) -->
            <div v-if="lookupSearched" class="summary-cards mb-4 shrink-0">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="stat-card stat-card--cyan">
                  <div class="stat-card__label">Tổng Số lượng</div>
                  <div class="stat-card__value text-cyan-600 dark:text-cyan-400">{{ formatNumber(lookupStats.totalQty) }} kg</div>
                </div>
                <div class="stat-card stat-card--green">
                  <div class="stat-card__label">Tổng Thành tiền</div>
                  <div class="stat-card__value text-green-600 dark:text-green-400">{{ formatCurrency(lookupStats.totalAmount) }} VNĐ</div>
                </div>
                <div class="stat-card stat-card--blue">
                  <div class="stat-card__label">Tổng Công nợ</div>
                  <div class="stat-card__value text-blue-600 dark:text-blue-400">{{ formatCurrency(lookupStats.totalDebt) }} VNĐ</div>
                </div>
              </div>
            </div>

            <!-- Table (after search) -->
            <div v-if="lookupSearched" class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0 border border-gray-100 dark:border-gray-700">
              <el-table v-loading="lookupLoading" :data="paginatedLookup" style="width: 100%" class="flex-1 custom-table" height="100%" @sort-change="handleLookupSortChange">
                <el-table-column label="STT" width="60" align="center" fixed>
                  <template #default="{ $index }">
                    <span class="font-mono text-xs text-gray-500">{{ (lookupPage - 1) * lookupPageSize + $index + 1 }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Ngày giao dịch" prop="date" width="150" sortable="custom" fixed>
                  <template #default="scope">
                    <span class="text-xs font-semibold text-gray-600 dark:text-gray-400">{{ formatDate(scope.row.date) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Mã KH" prop="customerCode" width="110" sortable="custom" />
                <el-table-column label="Tên Khách hàng" prop="customerName" min-width="300" show-overflow-tooltip>
                  <template #default="scope">
                    <span class="whitespace-nowrap font-semibold text-gray-800 dark:text-gray-200">{{ scope.row.customerName }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Loại giao dịch" width="140" align="center">
                  <template #default="scope">
                    <el-tag :type="scope.row.transactionType === 'import' ? 'success' : 'danger'" effect="light" size="small" round>
                      {{ scope.row.transactionType === 'import' ? 'Nhập' : 'Xuất' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="Nguyên liệu" width="150">
                  <template #default="scope">
                    <el-tag :type="scope.row.material === 'Cao su RSS3' ? 'info' : 'warning'" effect="light" size="small" round>
                      {{ scope.row.material }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="Tên Kho" prop="warehouseName" width="200" show-overflow-tooltip />
                <el-table-column label="Số lượng" width="130" align="right">
                  <template #default="scope">
                    <span class="font-medium">{{ formatNumber(scope.row.quantity) }} kg</span>
                  </template>
                </el-table-column>
                <el-table-column label="Đơn giá" width="130" align="right">
                  <template #default="scope">{{ formatCurrency(scope.row.unitPrice) }}</template>
                </el-table-column>
                <el-table-column label="Thành tiền" width="160" align="right">
                  <template #default="scope">
                    <span class="font-bold text-green-500">{{ formatCurrency(scope.row.totalAmount) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Công nợ" width="150" align="right">
                  <template #default="scope">
                    <span class="font-bold" :class="scope.row.debt > 0 ? 'text-rose-500' : (scope.row.debt < 0 ? 'text-teal-500' : 'text-gray-400')">{{ formatCurrency(scope.row.debt) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Mã hàng" prop="productCode" width="130" />
              </el-table>

              <div class="mt-auto shrink-0 p-4 flex flex-wrap justify-end gap-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                <el-pagination
                  v-model:current-page="lookupPage"
                  v-model:page-size="lookupPageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  :background="true"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="filteredLookup.length"
                />
              </div>
            </div>

            <!-- Empty state -->
            <div v-if="!lookupSearched" class="flex-1 flex items-center justify-center">
              <div class="text-center text-gray-400 dark:text-gray-500">
                <el-icon class="text-6xl mb-4"><Search /></el-icon>
                <p class="text-lg">Vui lòng chọn các tiêu chí và nhấn <strong>Tìm kiếm</strong> để truy xuất thông tin</p>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- ADD TRANSACTION DIALOG -->
    <el-dialog 
      v-model="txDialogVisible" 
      title="THÊM GIAO DỊCH THÀNH PHẨM" 
      width="900px" 
      destroy-on-close 
      align-center
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form 
          :model="txForm" 
          :rules="txRules" 
          ref="txFormRef" 
          label-width="180px" 
          class="mt-2 compact-form"
        >
          <!-- PHẦN 1: GIAO DỊCH THÀNH PHẨM -->
          <div class="mb-5 pb-3 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-base font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              1. GIAO DỊCH THÀNH PHẨM
            </h3>

            <!-- Thông tin chung -->
            <div class="mb-4">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5 pl-3 border-l-2 border-blue-400">
                Thông tin chung
              </h4>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Mã khách hàng" prop="customerCode">
                    <el-input v-model="txForm.customerCode" placeholder="Nhập mã khách hàng..." />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Tên khách hàng" prop="customerName">
                    <el-input v-model="txForm.customerName" placeholder="Nhập tên khách hàng..." />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Ngày giao dịch" prop="date">
                    <el-date-picker :editable="false" 
                      v-model="txForm.date" 
                      type="date" 
                      placeholder="Chọn ngày" 
                      format="DD/MM/YYYY" 
                      value-format="YYYY-MM-DD" 
                      style="width: 100%" 
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <!-- Loại giao dịch & Kho bãi -->
            <div class="mb-4">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5 pl-3 border-l-2 border-green-400">
                Loại giao dịch &amp; Kho bãi
              </h4>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Loại giao dịch" prop="transactionType">
                    <el-radio-group v-model="txForm.transactionType" class="w-full flex">
                      <el-radio-button value="import" class="flex-1">Nhập</el-radio-button>
                      <el-radio-button value="export" class="flex-1">Xuất</el-radio-button>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Nguyên liệu" prop="material">
                    <el-select v-model="txForm.material" placeholder="Chọn loại" style="width: 100%">
                      <el-option label="Cao su RSS3" value="Cao su RSS3" />
                      <el-option label="Phế phẩm Cao su" value="Phế phẩm Cao su" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Tên Kho">
                    <el-input :model-value="warehouse.name" disabled />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <!-- Khối lượng & Đơn giá -->
            <div class="mb-4">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5 pl-3 border-l-2 border-violet-400">
                Khối lượng &amp; Đơn giá
              </h4>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Đơn vị tính" prop="unit">
                    <el-select v-model="txForm.unit" placeholder="Chọn đơn vị" style="width: 100%" @change="handleUnitChange">
                      <el-option label="Kg" value="kg" />
                      <el-option label="Cục 33Kg" value="cuc_33" />
                      <el-option label="Cục 35Kg" value="cuc_35" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12" v-if="txForm.unit !== 'kg'">
                  <el-form-item label="Số lượng cục" prop="balesCount">
                    <el-input-number 
                      v-model="txForm.balesCount" 
                      :min="1" 
                      :step="1" 
                      controls-position="right" 
                      style="width: 100%" 
                      @change="handleBalesCountChange" 
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Khối lượng (kg)" prop="quantity">
                    <el-input-number 
                      v-model="txForm.quantity" 
                      :min="1" 
                      :step="100" 
                      :precision="2" 
                      :disabled="txForm.unit !== 'kg'" 
                      controls-position="right" 
                      style="width: 100%" 
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Đơn giá (VNĐ)" prop="unitPrice">
                    <el-input 
                      v-model="txForm.unitPriceText" 
                      placeholder="Nhập đơn giá..."
                      @input="handleUnitPriceInput"
                    >
                      <template #suffix>
                        <span class="text-xs text-gray-400">VNĐ</span>
                      </template>
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Thành tiền (VNĐ)">
                    <el-input :model-value="formatCurrency(computedTotal)" disabled>
                      <template #suffix>
                        <span class="text-xs text-gray-400">VNĐ</span>
                      </template>
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <!-- Công nợ & Thông tin thêm -->
            <div class="mb-2">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5 pl-3 border-l-2 border-rose-400">
                Công nợ &amp; Thông tin thêm
              </h4>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Công nợ (VNĐ)" prop="debt">
                    <el-input 
                      v-model="txForm.debtText" 
                      placeholder="Nhập công nợ..."
                      @input="handleDebtInput"
                    >
                      <template #suffix>
                        <span class="text-xs text-gray-400">VNĐ</span>
                      </template>
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Mã hàng" prop="productCode" :required="txForm.transactionType === 'import'">
                    <el-input v-model="txForm.productCode" :placeholder="computedProductCodePlaceholder" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="24">
                  <el-form-item label="Ghi chú" prop="note">
                    <el-input v-model="txForm.note" type="textarea" :rows="2" placeholder="Nhập ghi chú (nếu có)..." />
                  </el-form-item>
                </el-col>
              </el-row>

            </div>
          </div>

        </el-form>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2 pr-2">
          <el-button @click="txDialogVisible = false">Hủy bỏ</el-button>
          <el-button type="primary" :loading="submitting" @click="submitTx">Lưu giao dịch</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- DETAIL TRANSACTION DIALOG -->
    <el-dialog 
      v-model="detailDialogVisible" 
      title="CHI TIẾT GIAO DỊCH THÀNH PHẨM" 
      width="90%" 
      style="max-width: 700px"
      destroy-on-close
      class="custom-dark-dialog"
    >
      <div v-if="selectedTx" class="px-2 space-y-5">
        <!-- Row 1: Khách hàng + Ngày giao dịch -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Khách hàng</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-100">
              {{ selectedTx.customerName || 'Chưa rõ' }} <span v-if="selectedTx.customerCode" class="text-gray-400 dark:text-gray-500">({{ selectedTx.customerCode }})</span>
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày giao dịch</div>
            <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatDate(selectedTx.date) }}</div>
          </div>
        </div>

        <!-- Row 2: Tên Kho + Nguyên liệu -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tên Kho</div>
            <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedTx.warehouseName }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Nguyên liệu</div>
            <el-tag :type="selectedTx.material === 'Cao su RSS3' ? 'info' : 'warning'" effect="light" size="small" round>
              {{ selectedTx.material }}
            </el-tag>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- Row 3: Loại giao dịch + Mã hàng -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Loại giao dịch</div>
            <el-tag :type="selectedTx.transactionType === 'import' ? 'success' : 'danger'" effect="light" size="small" round>
              {{ selectedTx.transactionType === 'import' ? 'Nhập' : 'Xuất' }}
            </el-tag>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã hàng</div>
            <div class="text-sm font-bold text-gray-700 dark:text-gray-300">{{ selectedTx.productCode || '—' }}</div>
          </div>
        </div>

        <!-- Row 4: Số lượng + Đơn giá -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số lượng</div>
            <div class="text-sm font-bold text-gray-700 dark:text-gray-300">{{ formatNumber(selectedTx.quantity) }} kg</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Đơn giá</div>
            <div class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ formatCurrency(selectedTx.unitPrice) }} VNĐ</div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- Row 5: Thành tiền + Công nợ -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Thành tiền</div>
            <div class="text-base font-extrabold text-green-500">{{ formatCurrency(selectedTx.totalAmount) }} VNĐ</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Công nợ</div>
            <div class="text-sm font-extrabold text-red-500">{{ formatCurrency(selectedTx.debt) }} VNĐ</div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- Row 6: Ghi chú -->
        <div>
          <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ghi chú</div>
          <div class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ selectedTx.note || '—' }}</div>
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
import { dinhDangSo, dinhDangSoLe } from '@/utils/dinhDangSo'
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  ArrowLeft,
  Search,
  List,
  MoreFilled,
  Refresh
} from '@element-plus/icons-vue'
import { tienNgaService } from '@/api/tienNgaService'

interface ProductWarehouse {
  id: string
  name: string
  address: string
  capacity: string
  currentQty: number
  icon: string
  color: string
}

interface ProductTransaction {
  id: string
  warehouseId: string
  date: string
  customerCode: string
  customerName: string
  transactionType: 'import' | 'export'
  material: 'Cao su RSS3' | 'Phế phẩm Cao su'
  warehouseName: string
  quantity: number
  unitPrice: number
  totalAmount: number
  debt: number
  productCode: string
  note?: string
}

const props = defineProps<{
  warehouse: ProductWarehouse
  transactions: ProductTransaction[]
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'add-transaction', tx: Omit<ProductTransaction, 'id' | 'warehouseId'>): void
  (e: 'refresh-transactions'): void
}>()

const activeTab = ref('transaction')

const capacityPercentValue = computed(() => {
  const capNum = parseInt(props.warehouse.capacity.replace(/[^0-9]/g, ''))
  if (!capNum) return 0
  return Math.min(100, (props.warehouse.currentQty / capNum) * 100)
})

const capacityPercentText = computed(() => {
  const capNum = parseInt(props.warehouse.capacity.replace(/[^0-9]/g, ''))
  if (!capNum) return '0%'
  const pct = (props.warehouse.currentQty / capNum) * 100
  if (pct === 0) return '0%'
  if (pct < 0.1) return '< 0.1%'
  return `${Math.min(100, Math.round(pct * 10) / 10)}%`
})

// ========== 1. GIAO DỊCH ==========
const txFilters = reactive({
  transactionType: 'all',
  material: 'all',
  dateRange: null as null | [string, string],
  search: ''
})
const txPage = ref(1)
const txPageSize = ref(10)

watch(() => txFilters, () => { txPage.value = 1 }, { deep: true })

const filteredTx = computed(() => {
  return props.transactions.filter(t => {
    if (txFilters.transactionType !== 'all' && t.transactionType !== txFilters.transactionType) return false
    if (txFilters.material !== 'all' && t.material !== txFilters.material) return false
    if (txFilters.dateRange) {
      const [s, e] = txFilters.dateRange
      if (t.date < s || t.date > e) return false
    }
    if (txFilters.search) {
      const q = txFilters.search.toLowerCase()
      if (!t.customerName.toLowerCase().includes(q) && !t.productCode.toLowerCase().includes(q) && !t.customerCode.toLowerCase().includes(q)) return false
    }
    return true
  })
})

// --- Sắp xếp toàn cục (trên toàn bộ dữ liệu, không chỉ trang hiện tại) ---
const compareValues = (valA: any, valB: any) => {
  if (typeof valA === 'number' && typeof valB === 'number') return valA - valB
  return String(valA).localeCompare(String(valB), 'vi', { numeric: true })
}

const sortList = (list: any[], prop: string, order: string) => {
  if (!prop || !order) return list
  return [...list].sort((a, b) => {
    const res = compareValues(a[prop] ?? '', b[prop] ?? '')
    return order === 'ascending' ? res : -res
  })
}

const txSortProp = ref('')
const txSortOrder = ref('')

const handleTxSortChange = ({ prop, order }: { prop: string; order: string }) => {
  txSortProp.value = prop
  txSortOrder.value = order
  txPage.value = 1
}

const sortedTx = computed(() => sortList(filteredTx.value, txSortProp.value, txSortOrder.value))

const paginatedTx = computed(() => {
  const s = (txPage.value - 1) * txPageSize.value
  return sortedTx.value.slice(s, s + txPageSize.value)
})

// TX Dialog
const txDialogVisible = ref(false)
const submitting = ref(false)

// Detail Dialog
const detailDialogVisible = ref(false)
const selectedTx = ref<ProductTransaction | null>(null)

const showTxDetail = (row: ProductTransaction) => {
  selectedTx.value = row
  detailDialogVisible.value = true
}

const handleTxCommand = (command: string, row: ProductTransaction) => {
  if (command === 'detail') {
    showTxDetail(row)
  } else if (command === 'delete') {
    const displayDate = row.date ? formatDate(row.date) : 'chưa rõ'
    const displayCustomer = row.customerName || 'Chưa rõ'
    ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa giao dịch ngày ${displayDate} của khách hàng "${displayCustomer}" không?`,
      'Xác nhận xóa',
      {
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy bỏ',
        type: 'warning'
      }
    ).then(async () => {
      try {
        submitting.value = true
        await tienNgaService.deleteProductTransactions([row.id])
        ElMessage.success('Xóa giao dịch thành công!')
        emit('refresh-transactions')
      } catch (error: any) {
        ElMessage.error(error.message || 'Xóa giao dịch thất bại!')
      } finally {
        submitting.value = false
      }
    }).catch(() => {})
  }
}
const subFunds = ref<any[]>([])
const fetchSubFunds = async () => {
  try {
    const data = await tienNgaService.getInvestments({ role: 'member' })
    subFunds.value = data.filter((item: any) => item.status === 'ACTIVE')
  } catch (error: any) {
    console.error('Failed to fetch sub funds:', error)
  }
}

const customersList = ref<any[]>([])
const partnersList = ref<any[]>([])
const fetchCustomersAndPartners = async () => {
  try {
    const [custData, partnerData] = await Promise.all([
      tienNgaService.getCustomers(),
      tienNgaService.getPartners()
    ])
    customersList.value = custData
    partnersList.value = partnerData
  } catch (error) {
    console.error('Failed to fetch customers and partners:', error)
  }
}

onMounted(() => {
  fetchSubFunds()
  fetchCustomersAndPartners()
})

const txFormRef = ref<FormInstance>()
const txForm = reactive({
  unit: 'kg' as 'kg' | 'cuc_33' | 'cuc_35',
  balesCount: 1,
  customerCode: '',
  customerName: '',
  date: new Date().toISOString().substring(0, 10),
  transactionType: 'export' as 'import' | 'export',
  material: 'Cao su RSS3' as 'Cao su RSS3' | 'Phế phẩm Cao su',
  quantity: 1000,
  unitPrice: 35000,
  unitPriceText: '35.000',
  debt: 0,
  debtText: '',
  productCode: '',
  note: '',
  isPaid: false,
  subFundId: '',
  financeDate: new Date().toISOString().substring(0, 10),
  financeType: 'thu' as 'thu' | 'chi',
  financeTransactionCode: 'MTP',
  requestingParty: '',
  executingParty: '',
  receivingParty: 'Tiến Nga',
  financeStatus: 'approved',
  purpose: '',
  financeNote: '',
  reason: '',
  financeAmount: 0,
  financeAmountText: ''
})
const txRules = computed<FormRules>(() => ({
  date: [{ required: true, message: 'Vui lòng chọn ngày', trigger: 'change' }],
  transactionType: [{ required: true, message: 'Vui lòng chọn loại giao dịch', trigger: 'change' }],
  material: [{ required: true, message: 'Vui lòng chọn nguyên liệu', trigger: 'change' }],
  quantity: [{ required: true, message: 'Vui lòng nhập số lượng', trigger: 'blur' }],
  productCode: txForm.transactionType === 'import'
    ? [{ required: true, message: 'Vui lòng nhập mã hàng', trigger: 'blur' }]
    : [],
  subFundId: txForm.isPaid ? [{ required: true, message: 'Vui lòng chọn Quỹ tiền', trigger: 'change' }] : [],
  financeDate: txForm.isPaid ? [{ required: true, message: 'Vui lòng chọn ngày giao dịch', trigger: 'change' }] : [],
  requestingParty: txForm.isPaid ? [{ required: true, message: 'Vui lòng nhập bên yêu cầu', trigger: 'blur' }] : [],
  executingParty: txForm.isPaid ? [{ required: true, message: 'Vui lòng nhập bên thực hiện', trigger: 'blur' }] : [],
  receivingParty: txForm.isPaid ? [{ required: true, message: 'Vui lòng nhập bên nhận', trigger: 'blur' }] : [],
  purpose: txForm.isPaid ? [{ required: true, message: 'Vui lòng nhập mục đích', trigger: 'blur' }] : [],
  financeAmount: txForm.isPaid ? [{ required: true, message: 'Vui lòng nhập số tiền giao dịch', trigger: 'blur' }] : []
}))

const handlePaymentTypeChange = (val: any) => {
  const type = String(val)
  const name = txForm.customerName || 'Khách hàng'
  if (type === 'chi') {
    txForm.requestingParty = name
    txForm.executingParty = 'Tiến Nga'
    txForm.receivingParty = name
    txForm.purpose = `Chi tiền nhập mủ thành phẩm từ ${name}`
  } else {
    txForm.requestingParty = name
    txForm.executingParty = name
    txForm.receivingParty = 'Tiến Nga'
    txForm.purpose = `Thu tiền xuất mủ thành phẩm bán cho ${name}`
  }
}

watch(
  () => [txForm.isPaid, txForm.customerName, txForm.date, txForm.transactionType] as const,
  ([isPaid, customerName, date, type]) => {
    if (isPaid) {
      const name = customerName || 'Khách hàng'
      if (!txForm.subFundId && subFunds.value.length > 0) {
        txForm.subFundId = subFunds.value[0].id
      }
      txForm.financeDate = date || new Date().toISOString().substring(0, 10)
      
      if (type === 'import') {
        txForm.financeType = 'chi'
        txForm.requestingParty = name
        txForm.executingParty = 'Tiến Nga'
        txForm.receivingParty = name
        txForm.purpose = `Chi tiền nhập mủ thành phẩm từ ${name}`
      } else {
        txForm.financeType = 'thu'
        txForm.requestingParty = name
        txForm.executingParty = name
        txForm.receivingParty = 'Tiến Nga'
        txForm.purpose = `Thu tiền xuất mủ thành phẩm bán cho ${name}`
      }
      
      txForm.reason = `Thanh toán giao dịch ngày ${date ? new Date(date).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}`
    }
  }
)

watch(() => txForm.transactionType, () => {
  if (txFormRef.value) {
    txFormRef.value.clearValidate('productCode')
  }
})

watch(() => txForm.customerCode, (newCode) => {
  if (!newCode) {
    txForm.customerName = ''
    return
  }
  const cleanCode = newCode.trim().toLowerCase()
  
  const matchedCustomer = customersList.value.find(
    c => c.hoursehold_id?.toLowerCase() === cleanCode || c.id?.toLowerCase() === cleanCode
  )
  if (matchedCustomer) {
    txForm.customerName = matchedCustomer.fullname
    return
  }
  
  const matchedPartner = partnersList.value.find(
    p => p.partner_id?.toLowerCase() === cleanCode
  )
  if (matchedPartner) {
    txForm.customerName = matchedPartner.partner_name
    return
  }
  
  txForm.customerName = ''
})

const computedTotal = computed(() => parseFloat((txForm.quantity * txForm.unitPrice).toFixed(2)))

// Watch changes in isPaid to default the financial variables
watch(
  () => txForm.isPaid,
  (isPaid) => {
    const total = computedTotal.value
    if (isPaid) {
      txForm.financeAmount = total
      txForm.financeAmountText = total > 0 ? new Intl.NumberFormat('vi-VN').format(total) : '0'
      txForm.debt = 0
      txForm.debtText = '0'
    } else {
      txForm.financeAmount = 0
      txForm.financeAmountText = '0'
      txForm.debt = total
      txForm.debtText = total > 0 ? new Intl.NumberFormat('vi-VN').format(total) : '0'
    }
  }
)

// Watch changes in computedTotal to update defaults dynamically
watch(
  () => computedTotal.value,
  (total) => {
    if (txForm.isPaid) {
      txForm.financeAmount = total
      txForm.financeAmountText = total > 0 ? new Intl.NumberFormat('vi-VN').format(total) : '0'
      txForm.debt = 0
      txForm.debtText = '0'
    } else {
      txForm.debt = total
      txForm.debtText = total > 0 ? new Intl.NumberFormat('vi-VN').format(total) : '0'
    }
  }
)

// Tự động tính Mã hàng placeholder dạng GA[YYYYMMDD] theo Ngày giao dịch
const computedProductCodePlaceholder = computed(() => {
  if (!txForm.date) return 'GA20260614'
  const cleanDate = txForm.date.replace(/[^0-9]/g, '')
  return `GA${cleanDate}`
})

const openTxDialog = () => {
  txForm.unit = 'kg'
  txForm.balesCount = 1
  txForm.customerCode = ''
  txForm.customerName = ''
  const todayStr = new Date().toISOString().substring(0, 10)
  txForm.date = todayStr
  txForm.transactionType = 'export'
  txForm.material = 'Cao su RSS3'
  txForm.quantity = 1000
  txForm.unitPrice = 0
  txForm.unitPriceText = ''
  txForm.debt = 0
  txForm.debtText = ''
  txForm.productCode = ''
  txForm.note = ''
  
  txForm.isPaid = false
  txForm.subFundId = subFunds.value[0]?.id || ''
  txForm.financeDate = todayStr
  txForm.financeType = 'thu'
  txForm.financeTransactionCode = 'MTP'
  txForm.requestingParty = ''
  txForm.executingParty = ''
  txForm.receivingParty = 'Tiến Nga'
  txForm.financeStatus = 'approved'
  txForm.purpose = 'Thu tiền xuất mủ thành phẩm'
  txForm.financeNote = ''
  txForm.reason = `Thanh toán giao dịch ngày ${new Date().toLocaleDateString('vi-VN')}`
  txForm.financeAmount = 0
  txForm.financeAmountText = ''
  
  txDialogVisible.value = true
}

// Handlers cho Đơn vị và số lượng cục
const handleUnitChange = (val: any) => {
  const unit = String(val)
  if (unit === 'cuc_33') {
    if (!txForm.balesCount || txForm.balesCount < 1) txForm.balesCount = 1
    txForm.quantity = txForm.balesCount * 33
  } else if (unit === 'cuc_35') {
    if (!txForm.balesCount || txForm.balesCount < 1) txForm.balesCount = 1
    txForm.quantity = txForm.balesCount * 35
  }
}

const handleBalesCountChange = (val: any) => {
  const count = Number(val) || 0
  if (txForm.unit === 'cuc_33') {
    txForm.quantity = count * 33
  } else if (txForm.unit === 'cuc_35') {
    txForm.quantity = count * 35
  }
}

// Format helpers cho input tiền
const handleUnitPriceInput = (val: string) => {
  const numericVal = val.replace(/[^0-9]/g, '')
  const num = parseInt(numericVal, 10)
  if (!isNaN(num)) {
    txForm.unitPrice = num
    txForm.unitPriceText = new Intl.NumberFormat('vi-VN').format(num)
  } else {
    txForm.unitPrice = 0
    txForm.unitPriceText = ''
  }
}

const handleDebtInput = (val: string) => {
  const numericVal = val.replace(/[^0-9]/g, '')
  const num = parseInt(numericVal, 10)
  if (!isNaN(num)) {
    txForm.debt = num
    txForm.debtText = new Intl.NumberFormat('vi-VN').format(num)
  } else {
    txForm.debt = 0
    txForm.debtText = ''
  }

  // Recalculate financeAmount (Thanh toán) if isPaid is true
  const total = computedTotal.value
  if (txForm.isPaid) {
    const computedVal = Math.max(0, parseFloat((total - txForm.debt).toFixed(2)))
    txForm.financeAmount = computedVal
    txForm.financeAmountText = computedVal > 0 ? new Intl.NumberFormat('vi-VN').format(computedVal) : '0'
  }
}

const handleFinanceAmountInput = (val: string) => {
  const numericVal = val.replace(/[^0-9]/g, '')
  const num = parseInt(numericVal, 10)
  if (!isNaN(num)) {
    txForm.financeAmount = num
    txForm.financeAmountText = new Intl.NumberFormat('vi-VN').format(num)
  } else {
    txForm.financeAmount = 0
    txForm.financeAmountText = ''
  }

  // Recalculate debt (Công nợ)
  const total = computedTotal.value
  const computedVal = Math.max(0, parseFloat((total - txForm.financeAmount).toFixed(2)))
  txForm.debt = computedVal
  txForm.debtText = computedVal > 0 ? new Intl.NumberFormat('vi-VN').format(computedVal) : '0'
}

const submitTx = async () => {
  if (!txFormRef.value) return
  await txFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        submitting.value = true
        // 1. Ghi nhận Giao dịch thành phẩm
        const payload = [{
          product_code: txForm.productCode,
          transaction_date: txForm.date,
          customer_id: txForm.customerCode,
          transaction_type: txForm.transactionType,
          material_type: txForm.material,
          storage_id: props.warehouse.id,
          storage_name: props.warehouse.name,
          quantity: parseFloat(txForm.quantity.toFixed(2)),
          unit_price: txForm.unitPrice,
          total_amount: computedTotal.value,
          debt: txForm.debt,
          note: txForm.note || ''
        }]
        await tienNgaService.addProductTransactions(payload)

        // 2. Ghi nhận Giao dịch tài chính phát sinh nếu isPaid = true
        if (txForm.isPaid) {
          const paymentPayload = [{
            investment_id: txForm.subFundId,
            requester: txForm.requestingParty,
            executor: txForm.executingParty,
            receiver: txForm.receivingParty,
            payment_type: txForm.financeType,
            purpose: txForm.purpose,
            reason: txForm.reason,
            amount: txForm.financeAmount,
            day: txForm.financeDate,
            status: txForm.financeStatus === 'approved' ? 'APPROVED' : 'UNAPPROVED',
            notes: txForm.financeNote,
            transaction_code: txForm.financeTransactionCode
          }]
          await tienNgaService.addDailyPayments(paymentPayload)
        }

        txDialogVisible.value = false
        ElMessage.success('Đã thêm giao dịch thành công!')
        emit('refresh-transactions')
      } catch (error: any) {
        ElMessage.error(error.message || 'Thêm giao dịch thất bại!')
      } finally {
        submitting.value = false
      }
    }
  })
}

// ========== 2. TRUY XUẤT THÔNG TIN ==========
const lookupFilters = reactive({
  transactionType: 'all',
  material: 'all',
  dateRange: null as null | [string, string]
})
const lookupSearched = ref(false)
const lookupPage = ref(1)
const lookupPageSize = ref(10)

const lookupTransactions = ref<ProductTransaction[]>([])
const lookupLoading = ref(false)

const handleLookupSearch = async () => {
  try {
    lookupLoading.value = true
    
    const params: {
      transaction_type?: string
      material_type?: string
      start_date?: string
      end_date?: string
      storage_name?: string
    } = {
      storage_name: props.warehouse.name
    }
    
    if (lookupFilters.transactionType !== 'all') {
      params.transaction_type = lookupFilters.transactionType
    }
    if (lookupFilters.material !== 'all') {
      params.material_type = lookupFilters.material
    }
    if (lookupFilters.dateRange && lookupFilters.dateRange.length === 2) {
      params.start_date = lookupFilters.dateRange[0]
      params.end_date = lookupFilters.dateRange[1]
    }
    
    const data = await tienNgaService.getProductTransactions(params)
    
    lookupTransactions.value = data.map((item: any) => ({
      id: String(item.id),
      warehouseId: props.warehouse.id,
      date: item.transaction_date || '',
      customerCode: item.customer_id || '',
      customerName: item.fullname || item.customer_id || 'Chưa rõ',
      transactionType: item.transaction_type || 'export',
      material: item.material_type || 'Cao su RSS3',
      warehouseName: item.storage_name || '',
      quantity: item.quantity || 0,
      unitPrice: item.unit_price || 0,
      totalAmount: item.total_amount || 0,
      debt: item.debt || 0,
      productCode: item.product_code || '',
      note: item.note || ''
    }))
    
    lookupSearched.value = true
    lookupPage.value = 1
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi truy xuất thông tin giao dịch!')
    console.error(error)
  } finally {
    lookupLoading.value = false
  }
}

const filteredLookup = computed(() => {
  return lookupTransactions.value
})

const lookupSortProp = ref('')
const lookupSortOrder = ref('')

const handleLookupSortChange = ({ prop, order }: { prop: string; order: string }) => {
  lookupSortProp.value = prop
  lookupSortOrder.value = order
  lookupPage.value = 1
}

const sortedLookup = computed(() =>
  sortList(filteredLookup.value, lookupSortProp.value, lookupSortOrder.value)
)

const paginatedLookup = computed(() => {
  const s = (lookupPage.value - 1) * lookupPageSize.value
  return sortedLookup.value.slice(s, s + lookupPageSize.value)
})

const lookupStats = computed(() => ({
  totalQty: parseFloat(filteredLookup.value.reduce((sum, t) => sum + t.quantity, 0).toFixed(2)),
  totalAmount: parseFloat(filteredLookup.value.reduce((sum, t) => sum + t.totalAmount, 0).toFixed(2)),
  totalDebt: parseFloat(filteredLookup.value.reduce((sum, t) => sum + t.debt, 0).toFixed(2)),
}))

// ========== HELPERS ==========
// MỤC 355 — hàm hiển thị, bỏ phần lẻ.
const formatCurrency = (value: any) => dinhDangSo(value)
// ══ MỤC 372 (28/08/2026) — SỐ ĐO GIỮ PHẦN LẺ ══
// MỤC 355 áp quá rộng: bỏ phần lẻ cả khối lượng. s68 làm rõ 28/08 —
// chỉ KẾT QUẢ TÍNH RA SỐ TIỀN mới bỏ phần lẻ. `formatCurrency` ở trên
// giữ nguyên; `formatNumber` (số đo) nay giữ phần lẻ.
const formatNumber = (value: any, _decimals?: number) =>
  dinhDangSoLe(value, _decimals ?? 2)
const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}
</script>

<style scoped>
.detail-tabs {
  border-radius: 8px;
  overflow: hidden;
}
.detail-tabs :deep(.el-tabs__content) {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}
.detail-tabs :deep(.el-tab-pane) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.custom-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

/* Cho phân trang tự xuống dòng khi có nhiều trang */
.product-detail-wrapper :deep(.el-pagination) {
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
.stat-card--cyan { border-left: 4px solid #06b6d4; }
.stat-card--green { border-left: 4px solid #22c55e; }
.stat-card--blue { border-left: 4px solid #3b82f6; }

/* Dark Mode */
html.dark .detail-tabs {
  background-color: #1f2937;
  border-color: #374151;
}
html.dark .detail-tabs :deep(.el-tabs__header) {
  background-color: #111827;
  border-bottom-color: #374151;
}
html.dark .detail-tabs :deep(.el-tabs__item) {
  color: #9ca3af;
  border-color: transparent;
  transition: all 0.3s;
}
html.dark .detail-tabs :deep(.el-tabs__item:hover) {
  color: #d1d5db;
}
html.dark .detail-tabs :deep(.el-tabs__item.is-active) {
  background-color: #1f2937;
  border-right-color: #374151;
  border-left-color: #374151;
  border-bottom-color: #1f2937;
  color: #60a5fa;
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

html.dark .product-detail-wrapper :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}
html.dark .product-detail-wrapper :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}
html.dark .product-detail-wrapper :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}
html.dark .product-detail-wrapper :deep(.el-table .el-table-fixed-column--left),
html.dark .product-detail-wrapper :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important;
}

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

.highlight-select :deep(.el-select__wrapper) {
  background-color: transparent;
}
html.dark .highlight-select :deep(.el-select__wrapper) {
  background-color: #111827 !important;
  box-shadow: 0 0 0 1px #374151 inset !important;
  color: #f3f4f6;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}
</style>
