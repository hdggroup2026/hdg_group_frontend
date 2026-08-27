<template>
  <div class="h-full p-6 overflow-hidden flex flex-col warehouse-detail-wrapper">
    <!-- Header Navigation -->
    <div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
      <div class="flex items-center gap-3">
        <el-button @click="emit('back')" circle class="shadow-sm hover:scale-105 transition-transform duration-200">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <div>
          <div class="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Chi Tiết Kho</div>
          <h2 class="text-2xl font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-2 mt-0.5">
            {{ warehouse.name }}
          </h2>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <el-tag type="warning" size="large" effect="plain" class="font-bold">{{ warehouse.material }}</el-tag>
        <span class="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 font-medium">
          {{ warehouse.address }}
        </span>
      </div>
    </div>

    <!-- Quick Stats Cards -->
    <div v-show="activeTab !== 'lookup'" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 shrink-0">
      <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm flex flex-col justify-between">
        <div>
          <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-blue-600 dark:text-blue-400">Số lượng hiện tại</div>
          <div class="text-xl font-bold mt-1 text-blue-600 dark:text-blue-400">{{ formatNumber(warehouse.currentQty) }} kg</div>
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
              :style="{ width: capacityPercentValue + '%', backgroundColor: warehouse.color || '#ef4444' }"
            ></div>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm flex flex-col justify-between">
        <div>
          <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-green-600 dark:text-green-400">Thành tiền</div>
          <div class="text-xl font-bold mt-1 text-green-600 dark:text-green-400">{{ formatCurrency(totalPurchasesAmount) }} VNĐ</div>
        </div>
      </div>
    </div>

    <!-- Main Tabs -->
    <div class="flex-1 min-h-0 flex flex-col overflow-hidden">
      <el-tabs v-model="activeTab" type="border-card" class="detail-tabs h-full flex flex-col flex-1">

        <!-- 1. TAB THU MUA -->
        <el-tab-pane name="purchase" class="h-full flex flex-col">
          <template #label>
            <span class="custom-tabs-label flex items-center gap-1">
              <el-icon><ShoppingCart /></el-icon>
              <span>Thu mua</span>
            </span>
          </template>

          <div class="flex-1 flex flex-col min-h-0">
            <!-- Filter Bar -->
            <div class="flex flex-wrap justify-between items-center mb-4 gap-x-4 gap-y-4 shrink-0">
              <div class="flex flex-wrap items-center gap-x-4 gap-y-4">
                <div class="flex items-center gap-2">
                  <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian:</span>
                  <el-date-picker :editable="false"
                    v-model="purchaseFilters.dateRange"
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
                    v-model="purchaseFilters.search"
                    placeholder="Tên khách hàng..."
                    :prefix-icon="Search"
                    clearable
                    class="w-60 custom-dark-input"
                  />
                </div>
              </div>
              <!-- Thêm giao dịch Button & Refresh Button -->
              <div class="flex items-center gap-2">
                <el-button :icon="Refresh" circle @click="emit('refresh-purchases')" />
                <el-button type="primary" @click="openPurchaseDialog">Thêm giao dịch</el-button>
              </div>
            </div>

            <!-- Table & Pagination -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0 border border-gray-100 dark:border-gray-700">
              <el-table :data="paginatedPurchases" style="width: 100%" class="flex-1 custom-table" height="100%" @sort-change="handlePurchaseSortChange">
                <el-table-column label="STT" width="60" align="center" fixed>
                  <template #default="{ $index }">
                    <span class="font-mono text-xs text-gray-500">{{ (purchasePage - 1) * purchasePageSize + $index + 1 }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Ngày giao dịch" prop="date" width="150" sortable="custom" fixed>
                  <template #default="scope">
                    <span class="text-xs font-semibold text-gray-600 dark:text-gray-400">{{ formatDate(scope.row.date) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Tên khách hàng" prop="customerName" min-width="300" fixed show-overflow-tooltip>
                  <template #default="scope">
                    <span class="whitespace-nowrap font-semibold text-gray-800 dark:text-gray-200">{{ scope.row.customerName }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Nguyên liệu" prop="material" width="130">
                  <template #default="scope">
                    <el-tag type="warning" effect="light" round size="small">{{ scope.row.material }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="Tên Kho" prop="warehouseName" width="180" show-overflow-tooltip />
                <el-table-column label="Số chuyến" prop="trips" width="110" align="right">
                  <template #default="scope">
                    <span class="font-medium">{{ scope.row.trips }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Khối lượng" width="130" align="right">
                  <template #default="scope">
                    <span>{{ formatNumber(scope.row.weight) }} kg</span>
                  </template>
                </el-table-column>
                <el-table-column label="Đơn giá" width="130" align="right">
                  <template #default="scope">
                    <span>{{ formatCurrency(scope.row.unitPrice) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Thành tiền" width="150" align="right">
                  <template #default="scope">
                    <span class="font-bold text-green-500">{{ formatCurrency(scope.row.totalAmount) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Ứng tiền" width="150" align="right">
                  <template #default="scope">
                    <span class="font-medium text-orange-500">{{ formatCurrency(scope.row.advanceAmount) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Công nợ" width="150" align="right">
                  <template #default="scope">
                    <span class="font-bold">{{ formatCurrency(scope.row.debt) }}</span>
                  </template>
                </el-table-column>
                <!-- Thao tác -->
                <el-table-column fixed="right" label="Thao tác" width="90" align="center">
                  <template #default="scope">
                    <el-dropdown trigger="click" @command="(cmd) => handlePurchaseCommand(cmd, scope.row)">
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
                  v-model:current-page="purchasePage"
                  v-model:page-size="purchasePageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  :background="true"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="filteredPurchases.length"
                />
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 2. TAB XUẤT KHO -->
        <el-tab-pane name="export" class="h-full flex flex-col">
          <template #label>
            <span class="custom-tabs-label flex items-center gap-1">
              <el-icon><Van /></el-icon>
              <span>Xuất kho</span>
            </span>
          </template>

          <div class="flex-1 flex flex-col min-h-0">
            <!-- Filter Bar -->
            <div class="flex flex-wrap justify-between items-center mb-4 gap-x-4 gap-y-4 shrink-0">
              <div class="flex flex-wrap items-center gap-x-4 gap-y-4">
                <div class="flex items-center gap-2">
                  <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian:</span>
                  <el-date-picker :editable="false"
                    v-model="exportFilters.dateRange"
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
                    v-model="exportFilters.search"
                    placeholder="Người thực hiện..."
                    :prefix-icon="Search"
                    clearable
                    class="w-60 custom-dark-input"
                  />
                </div>
              </div>
              <!-- Xuất kho Button & Refresh Button -->
              <div class="flex items-center gap-2">
                <el-button :icon="Refresh" circle @click="emit('refresh-purchases')" />
                <el-button type="primary" @click="openExportDialog">Xuất kho</el-button>
              </div>
            </div>

            <!-- Table & Pagination -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0 border border-gray-100 dark:border-gray-700">
              <el-table :data="paginatedExports" style="width: 100%" class="flex-1 custom-table" height="100%" @sort-change="handleExportSortChange">
                <el-table-column label="STT" width="60" align="center" fixed>
                  <template #default="{ $index }">
                    <span class="font-mono text-xs text-gray-500">{{ (exportPage - 1) * exportPageSize + $index + 1 }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Thời gian" prop="date" width="140" sortable="custom" fixed>
                  <template #default="scope">
                    <span class="text-xs font-semibold text-gray-600 dark:text-gray-400">{{ formatDate(scope.row.date) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Người thực hiện" prop="executor" min-width="180" fixed show-overflow-tooltip />
                <el-table-column label="Loại nguyên liệu" prop="material" width="150">
                  <template #default="scope">
                    <el-tag type="warning" effect="light" round size="small">{{ scope.row.material }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="Tên Kho" prop="warehouseName" width="200" show-overflow-tooltip />
                <el-table-column label="Khối lượng xuất" width="160" align="right">
                  <template #default="scope">
                    <span class="font-bold text-rose-500 dark:text-rose-400">-{{ formatNumber(scope.row.exportWeight) }} kg</span>
                  </template>
                </el-table-column>
                <el-table-column label="Khối lượng còn lại" width="180" align="right">
                  <template #default="scope">
                    <span class="font-bold text-blue-600 dark:text-blue-400">{{ formatNumber(scope.row.remainingWeight) }} kg</span>
                  </template>
                </el-table-column>
                <!-- Thao tác -->
                <el-table-column fixed="right" label="Thao tác" width="90" align="center">
                  <template #default="scope">
                    <el-dropdown trigger="click" @command="(cmd) => handleExportCommand(cmd, scope.row)">
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
                  v-model:current-page="exportPage"
                  v-model:page-size="exportPageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  :background="true"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="filteredExports.length"
                />
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 3. TAB TRUY XUẤT THÔNG TIN -->
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
                  <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Loại:</span>
                  <el-select
                    v-model="lookupFilters.category"
                    placeholder="Chọn loại"
                    style="width: 160px"
                    class="custom-dark-select highlight-select"
                    popper-class="custom-dark-select-popper"
                  >
                    <el-option label="Thu mua" value="purchase" />
                    <el-option label="Xuất kho" value="export" />
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
              <!-- Thu mua stats -->
              <div v-if="lookupFilters.category === 'purchase'" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div class="stat-card stat-card--cyan">
                  <div class="stat-card__label">Tổng Khối lượng</div>
                  <div class="stat-card__value text-cyan-600 dark:text-cyan-400">{{ formatNumber(lookupPurchaseStats.totalWeight) }} kg</div>
                </div>
                <div class="stat-card stat-card--green">
                  <div class="stat-card__label">Tổng Thành tiền</div>
                  <div class="stat-card__value text-green-600 dark:text-green-400">{{ formatCurrency(lookupPurchaseStats.totalAmount) }} VNĐ</div>
                </div>
                <div class="stat-card stat-card--orange">
                  <div class="stat-card__label">Tổng Ứng tiền</div>
                  <div class="stat-card__value text-orange-600 dark:text-orange-400">{{ formatCurrency(lookupPurchaseStats.totalAdvance) }} VNĐ</div>
                </div>
                <div class="stat-card stat-card--blue">
                  <div class="stat-card__label">Tổng Công nợ</div>
                  <div class="stat-card__value text-blue-600 dark:text-blue-400">{{ formatCurrency(lookupPurchaseStats.totalDebt) }} VNĐ</div>
                </div>
              </div>
              <!-- Xuất kho stats -->
              <div v-if="lookupFilters.category === 'export'" class="grid grid-cols-1 sm:grid-cols-2 gap-4" style="max-width: 600px">
                <div class="stat-card stat-card--rose">
                  <div class="stat-card__label">Tổng Khối lượng xuất</div>
                  <div class="stat-card__value text-rose-600 dark:text-rose-400">{{ formatNumber(lookupExportStats.totalExportWeight) }} kg</div>
                </div>
                <div class="stat-card stat-card--blue">
                  <div class="stat-card__label">Số tồn kho còn lại</div>
                  <div class="stat-card__value text-blue-600 dark:text-blue-400">{{ formatNumber(warehouse.currentQty) }} kg</div>
                </div>
              </div>
            </div>

            <!-- Table (after search) -->
            <div v-if="lookupSearched" class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0 border border-gray-100 dark:border-gray-700">
              <!-- Purchase Lookup Table -->
              <template v-if="lookupFilters.category === 'purchase'">
                <el-table v-loading="lookupLoading" :data="paginatedLookupPurchases" style="width: 100%" class="flex-1 custom-table" height="100%" @sort-change="handleLookupSortChange">
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
                  <el-table-column label="Tên khách hàng" prop="customerName" min-width="300" show-overflow-tooltip>
                    <template #default="scope">
                      <span class="whitespace-nowrap font-semibold text-gray-800 dark:text-gray-200">{{ scope.row.customerName }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="Nguyên liệu" prop="material" width="130">
                    <template #default="scope">
                      <el-tag type="warning" effect="light" round size="small">{{ scope.row.material }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="Tên Kho" prop="warehouseName" width="180" show-overflow-tooltip />
                  <el-table-column label="Số chuyến" prop="trips" width="110" align="right" />
                  <el-table-column label="Khối lượng" width="130" align="right">
                    <template #default="scope">{{ formatNumber(scope.row.weight) }} kg</template>
                  </el-table-column>
                  <el-table-column label="Đơn giá" width="130" align="right">
                    <template #default="scope">{{ formatCurrency(scope.row.unitPrice) }}</template>
                  </el-table-column>
                  <el-table-column label="Thành tiền" width="150" align="right">
                    <template #default="scope">
                      <span class="font-bold text-green-500">{{ formatCurrency(scope.row.totalAmount) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="Ứng tiền" width="150" align="right">
                    <template #default="scope">
                      <span class="font-medium text-orange-500">{{ formatCurrency(scope.row.advanceAmount) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="Công nợ" width="150" align="right">
                    <template #default="scope">
                      <span class="font-bold">{{ formatCurrency(scope.row.debt) }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </template>

              <!-- Export Lookup Table -->
              <template v-if="lookupFilters.category === 'export'">
                <el-table v-loading="lookupLoading" :data="paginatedLookupExports" style="width: 100%" class="flex-1 custom-table" height="100%" @sort-change="handleLookupSortChange">
                  <el-table-column label="STT" width="60" align="center" fixed>
                    <template #default="{ $index }">
                      <span class="font-mono text-xs text-gray-500">{{ (lookupPage - 1) * lookupPageSize + $index + 1 }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="Thời gian" prop="date" width="140" sortable="custom" fixed>
                    <template #default="scope">
                      <span class="text-xs font-semibold text-gray-600 dark:text-gray-400">{{ formatDate(scope.row.date) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="Người thực hiện" prop="executor" min-width="180" show-overflow-tooltip />
                  <el-table-column label="Loại nguyên liệu" prop="material" width="150">
                    <template #default="scope">
                      <el-tag type="warning" effect="light" round size="small">{{ scope.row.material }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="Tên Kho" prop="warehouseName" width="200" show-overflow-tooltip />
                  <el-table-column label="Khối lượng xuất" width="160" align="right">
                    <template #default="scope">
                      <span class="font-bold text-rose-500">-{{ formatNumber(scope.row.exportWeight) }} kg</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="KL còn lại" width="160" align="right">
                    <template #default="scope">
                      <span class="font-bold text-blue-600 dark:text-blue-400">{{ formatNumber(scope.row.remainingWeight) }} kg</span>
                    </template>
                  </el-table-column>
                </el-table>
              </template>

              <!-- Pagination -->
              <div class="mt-auto shrink-0 p-4 flex flex-wrap justify-end gap-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                <el-pagination
                  v-model:current-page="lookupPage"
                  v-model:page-size="lookupPageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  :background="true"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="lookupFilters.category === 'purchase' ? filteredLookupPurchases.length : filteredLookupExports.length"
                />
              </div>
            </div>

            <!-- Empty state before search -->
            <div v-if="!lookupSearched" class="flex-1 flex items-center justify-center">
              <div class="text-center text-gray-400 dark:text-gray-500">
                <el-icon class="text-6xl mb-4"><Search /></el-icon>
                <p class="text-lg">Vui lòng chọn loại và nhấn <strong>Tìm kiếm</strong> để truy xuất thông tin</p>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- ADD PURCHASE DIALOG -->
    <el-dialog 
      v-model="purchaseDialogVisible" 
      title="THÊM GIAO DỊCH THU MUA & PHIẾU THU CHI" 
      width="900px" 
      destroy-on-close 
      align-center
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form 
          :model="purchaseForm" 
          :rules="purchaseRules" 
          ref="purchaseFormRef" 
          label-width="180px" 
          class="mt-2 compact-form"
        >
          <!-- PHẦN 1: GIAO DỊCH THU MUA -->
          <div class="mb-5 pb-3 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-base font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              1. GIAO DỊCH THU MUA
            </h3>

            <!-- Thông tin chung -->
            <div class="mb-4">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5 pl-3 border-l-2 border-blue-400">
                Thông tin chung
              </h4>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Mã khách hàng" prop="customerCode">
                    <el-input v-model="purchaseForm.customerCode" placeholder="Nhập mã khách hàng..." />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Tên khách hàng" prop="customerName">
                    <el-input v-model="purchaseForm.customerName" placeholder="Nhập tên khách hàng..." />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Ngày giao dịch" prop="date">
                    <el-date-picker :editable="false" 
                      v-model="purchaseForm.date" 
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

            <!-- Thông tin kho & Nguyên liệu -->
            <div class="mb-4">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5 pl-3 border-l-2 border-green-400">
                Thông tin kho &amp; Nguyên liệu
              </h4>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Tên Kho">
                    <el-input :model-value="warehouse.name" disabled />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Nguyên liệu">
                    <el-input :model-value="warehouse.material" disabled />
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
                  <el-form-item label="Số chuyến" prop="trips">
                    <el-input-number v-model="purchaseForm.trips" :min="1" controls-position="right" style="width: 100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Khối lượng (kg)" prop="weight">
                    <el-input-number v-model="purchaseForm.weight" :min="1" :step="100" :precision="2" controls-position="right" style="width: 100%" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Đơn giá (VNĐ)" prop="unitPrice">
                    <el-input 
                      v-model="purchaseForm.unitPriceText" 
                      placeholder="Nhập đơn giá..."
                      @input="handleUnitPriceInput"
                    >
                      <template #suffix>
                        <span class="text-xs text-gray-400">VNĐ</span>
                      </template>
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Thành tiền (VNĐ)">
                    <el-input :model-value="formatCurrency(computedTotalAmount)" disabled>
                      <template #suffix>
                        <span class="text-xs text-gray-400">VNĐ</span>
                      </template>
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <!-- Thanh toán & Công nợ -->
            <div class="mb-2">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5 pl-3 border-l-2 border-rose-400">
                Thanh toán &amp; Công nợ
              </h4>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Ứng tiền (VNĐ)" prop="advanceAmount">
                    <el-input 
                      v-model="purchaseForm.advanceAmountText" 
                      placeholder="Nhập số tiền ứng..."
                      @input="handleAdvanceAmountInput"
                    >
                      <template #suffix>
                        <span class="text-xs text-gray-400">VNĐ</span>
                      </template>
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Công nợ (VNĐ)" prop="debt">
                    <el-input 
                      v-model="purchaseForm.debtText" 
                      placeholder="Nhập công nợ..."
                      @input="handleDebtInput"
                    >
                      <template #suffix>
                        <span class="text-xs text-gray-400">VNĐ</span>
                      </template>
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="24">
                  <el-form-item label="Ghi chú">
                    <el-input v-model="purchaseForm.notes" type="textarea" :rows="2" placeholder="Nhập ghi chú (nếu có)..." />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Thanh toán">
                    <el-switch 
                      v-model="purchaseForm.isPaid" 
                      active-text="Có" 
                      inactive-text="Không" 
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </div>

          <!-- PHẦN 2: GIAO DỊCH TÀI CHÍNH PHÁT SINH -->
          <div v-if="purchaseForm.isPaid" class="mb-2">
            <h3 class="text-base font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-green-500 rounded-full"></span>
              2. Giao dịch tài chính phát sinh
            </h3>

            <!-- Phân loại giao dịch -->
            <div class="mb-4">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5 pl-3 border-l-2 border-green-400">
                Phân loại giao dịch
              </h4>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Quỹ tiền" prop="subFundId">
                    <el-select v-model="purchaseForm.subFundId" placeholder="Chọn Quỹ tiền" class="w-full highlight-select" style="width: 100%">
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
                  <el-form-item label="Thời gian" prop="financeDate">
                    <el-date-picker :editable="false" 
                      v-model="purchaseForm.financeDate" 
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
                      v-model="purchaseForm.financeType" 
                      active-value="chi" 
                      inactive-value="thu" 
                      active-text="Chi tiền" 
                      inactive-text="Thu tiền" 
                      @change="handlePaymentTypeChange" 
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Mã giao dịch" prop="financeTransactionCode">
                    <el-select v-model="purchaseForm.financeTransactionCode" placeholder="Chọn mã giao dịch" class="w-full highlight-select" style="width: 100%">
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
                  <el-form-item label="Số tiền giao dịch" prop="financeAmount">
                    <el-input 
                      v-model="purchaseForm.financeAmountText" 
                      placeholder="Số tiền..."
                      @input="handleFinanceAmountInput"
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
                    <el-input v-model="purchaseForm.requestingParty" placeholder="Nhập bên yêu cầu..." />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Bên thực hiện" prop="executingParty">
                    <el-input v-model="purchaseForm.executingParty" placeholder="Nhập bên thực hiện..." />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Bên nhận" prop="receivingParty">
                    <el-input v-model="purchaseForm.receivingParty" placeholder="Nhập bên nhận..." />
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
                  <el-form-item label="Trạng thái" prop="financeStatus">
                    <el-select v-model="purchaseForm.financeStatus" placeholder="Chọn trạng thái" class="w-full highlight-select" style="width: 100%">
                      <el-option label="Đã chấp thuận" value="approved" />
                      <el-option label="Chưa chấp thuận" value="unapproved" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Mục đích" prop="purpose">
                    <el-input v-model="purchaseForm.purpose" placeholder="Nhập mục đích..." />
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
                  <el-form-item label="Ghi chú" prop="financeNote">
                    <el-input v-model="purchaseForm.notes" placeholder="Nhập ghi chú thêm..." />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="24">
                  <el-form-item label="Lí do" prop="reason">
                    <el-input 
                      v-model="purchaseForm.reason" 
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
        <div class="flex justify-end gap-2 pr-2">
          <el-button @click="purchaseDialogVisible = false" :disabled="submitting">Hủy bỏ</el-button>
          <el-button type="primary" @click="submitPurchase" :loading="submitting">Lưu giao dịch</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ADD EXPORT DIALOG -->
    <el-dialog 
      v-model="exportDialogVisible" 
      title="XUẤT KHO" 
      width="900px" 
      destroy-on-close 
      align-center
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form 
          :model="exportForm" 
          :rules="exportRules" 
          ref="exportFormRef" 
          label-width="180px" 
          class="mt-2 compact-form"
        >
          <!-- PHẦN 1: THÔNG TIN KHO & NGUYÊN LIỆU -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin kho &amp; Nguyên liệu
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tên Kho">
                  <el-input :model-value="warehouse.name" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Nguyên liệu">
                  <el-input :model-value="warehouse.material" disabled />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: CHI TIẾT THỰC HIỆN -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-green-500 rounded-full"></span>
              Chi tiết thực hiện
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Người thực hiện" prop="executor">
                  <el-input v-model="exportForm.executor" placeholder="Nhập tên người thực hiện..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Thời gian" prop="date">
                  <el-date-picker :editable="false" v-model="exportForm.date" type="date" placeholder="Chọn ngày" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 3: SỐ LƯỢNG XUẤT -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-rose-500 rounded-full"></span>
              Số lượng xuất
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Khối lượng xuất (kg)" prop="exportWeight">
                  <el-input-number v-model="exportForm.exportWeight" :min="1" :step="100" :precision="2" controls-position="right" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Ghi chú">
                  <el-input v-model="exportForm.notes" type="textarea" :rows="2" placeholder="Nhập ghi chú (nếu có)..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-form>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2 pr-2">
          <el-button @click="exportDialogVisible = false" :disabled="submitting">Hủy bỏ</el-button>
          <el-button type="primary" @click="submitExport" :loading="submitting">Xác nhận</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- DETAIL PURCHASE DIALOG -->
    <el-dialog 
      v-model="detailDialogVisible" 
      title="CHI TIẾT GIAO DỊCH THU MUA" 
      width="90%" 
      style="max-width: 700px"
      destroy-on-close
      class="custom-dark-dialog"
    >
      <div v-if="selectedPurchase" class="px-2 space-y-5">
        <!-- Row 1: Khách hàng + Ngày giao dịch -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Khách hàng</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-100">
              {{ selectedPurchase.customerName }} <span v-if="selectedPurchase.customerCode" class="text-gray-400 dark:text-gray-500">({{ selectedPurchase.customerCode }})</span>
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày giao dịch</div>
            <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatDate(selectedPurchase.date) }}</div>
          </div>
        </div>

        <!-- Row 2: Tên Kho + Nguyên liệu -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tên Kho</div>
            <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedPurchase.warehouseName }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Nguyên liệu</div>
            <el-tag type="warning" effect="light" size="small" round>
              {{ selectedPurchase.material }}
            </el-tag>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- Row 3: Số chuyến + Khối lượng -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số chuyến</div>
            <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedPurchase.trips }} chuyến</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Khối lượng</div>
            <div class="text-sm font-bold text-gray-700 dark:text-gray-300">{{ formatNumber(selectedPurchase.weight) }} kg</div>
          </div>
        </div>

        <!-- Row 4: Đơn giá + Thành tiền -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Đơn giá</div>
            <div class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ formatCurrency(selectedPurchase.unitPrice) }} VNĐ</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Thành tiền</div>
            <div class="text-base font-extrabold text-green-500">{{ formatCurrency(selectedPurchase.totalAmount) }} VNĐ</div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- Row 5: Ứng tiền + Công nợ -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ứng tiền</div>
            <div class="text-sm font-semibold text-orange-500">{{ formatCurrency(selectedPurchase.advanceAmount) }} VNĐ</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Công nợ</div>
            <div class="text-sm font-extrabold text-red-500">{{ formatCurrency(selectedPurchase.debt) }} VNĐ</div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- Row 6: Ghi chú -->
        <div>
          <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ghi chú</div>
          <div class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ selectedPurchase.notes || '—' }}</div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end pr-2">
          <el-button @click="detailDialogVisible = false">Đóng</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- DETAIL EXPORT DIALOG -->
    <el-dialog 
      v-model="detailExportDialogVisible" 
      title="CHI TIẾT GIAO DỊCH XUẤT KHO" 
      width="90%" 
      style="max-width: 700px"
      destroy-on-close
      class="custom-dark-dialog"
    >
      <div v-if="selectedExport" class="px-2 space-y-5">
        <!-- Row 1: Người thực hiện + Ngày xuất kho -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Người thực hiện</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-100">
              {{ selectedExport.executor }}
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày xuất kho</div>
            <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatDate(selectedExport.date) }}</div>
          </div>
        </div>

        <!-- Row 2: Tên Kho + Loại nguyên liệu -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tên Kho</div>
            <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedExport.warehouseName }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Nguyên liệu</div>
            <el-tag type="warning" effect="light" size="small" round>
              {{ selectedExport.material }}
            </el-tag>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- Row 3: Khối lượng xuất + Khối lượng còn lại -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Khối lượng xuất</div>
            <div class="text-sm font-extrabold text-rose-500">-{{ formatNumber(selectedExport.exportWeight) }} kg</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Khối lượng còn lại</div>
            <div class="text-sm font-bold text-blue-600 dark:text-blue-400">{{ formatNumber(selectedExport.remainingWeight) }} kg</div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- Row 4: Ghi chú -->
        <div>
          <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ghi chú</div>
          <div class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ selectedExport.notes || '—' }}</div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end pr-2">
          <el-button @click="detailExportDialogVisible = false">Đóng</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { dinhDangSo } from '@/utils/dinhDangSo'
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  Van,
  MoreFilled,
  Refresh
} from '@element-plus/icons-vue'
import { tienNgaService } from '@/api/tienNgaService'

// Types
interface Warehouse {
  id: string
  name: string
  material: string
  address: string
  capacity: string
  currentQty: number
  icon: string
  color: string
}

interface PurchaseTransaction {
  id: string
  warehouseId: string
  date: string
  customerCode?: string
  customerName: string
  material: string
  warehouseName: string
  trips: number
  weight: number
  unitPrice: number
  totalAmount: number
  advanceAmount: number
  debt: number
  notes?: string
}

interface ExportTransaction {
  id: string
  warehouseId: string
  date: string
  executor: string
  material: string
  warehouseName: string
  exportWeight: number
  remainingWeight: number
  notes?: string
}

const props = defineProps<{
  warehouse: Warehouse
  purchases: PurchaseTransaction[]
  exports: ExportTransaction[]
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'add-purchase', tx: Omit<PurchaseTransaction, 'id' | 'warehouseId'>): void
  (e: 'add-export', tx: Omit<ExportTransaction, 'id' | 'warehouseId'>): void
  (e: 'refresh-purchases'): void
}>()

const submitting = ref(false)

const activeTab = ref('purchase')

// ========== 1. THU MUA ==========
const purchaseFilters = reactive({
  dateRange: null as null | [string, string],
  search: ''
})
const purchasePage = ref(1)
const purchasePageSize = ref(10)

watch(() => purchaseFilters, () => { purchasePage.value = 1 }, { deep: true })

const totalPurchasesAmount = computed(() => {
  return props.purchases.reduce((sum, item) => sum + item.totalAmount, 0)
})

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

const filteredPurchases = computed(() => {
  return props.purchases.filter(t => {
    if (purchaseFilters.dateRange) {
      const [s, e] = purchaseFilters.dateRange
      if (t.date < s || t.date > e) return false
    }
    if (purchaseFilters.search) {
      const q = purchaseFilters.search.toLowerCase()
      if (!t.customerName.toLowerCase().includes(q)) return false
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

const purchaseSortProp = ref('')
const purchaseSortOrder = ref('')

const handlePurchaseSortChange = ({ prop, order }: { prop: string; order: string }) => {
  purchaseSortProp.value = prop
  purchaseSortOrder.value = order
  purchasePage.value = 1
}

const sortedPurchases = computed(() =>
  sortList(filteredPurchases.value, purchaseSortProp.value, purchaseSortOrder.value)
)

const paginatedPurchases = computed(() => {
  const s = (purchasePage.value - 1) * purchasePageSize.value
  return sortedPurchases.value.slice(s, s + purchasePageSize.value)
})

// Purchase Dialog
const purchaseDialogVisible = ref(false)
const purchaseFormRef = ref<FormInstance>()
const subFunds = ref<any[]>([])

const fetchSubFunds = async () => {
  try {
    const data = await tienNgaService.getInvestments({ role: 'member' })
    subFunds.value = data.filter((item: any) => item.status === 'ACTIVE')
  } catch (error: any) {
    console.error('Failed to fetch sub funds:', error)
  }
}

onMounted(() => {
  fetchSubFunds()
})

const purchaseForm = reactive({
  customerCode: '',
  customerName: '',
  date: new Date().toISOString().substring(0, 10),
  trips: 1,
  weight: 1000,
  unitPrice: 10000,
  unitPriceText: '10.000',
  advanceAmount: 0,
  advanceAmountText: '',
  notes: '',
  debt: 0,
  debtText: '',
  // Giao dịch tài chính phát sinh
  isPaid: false,
  subFundId: '',
  financeDate: new Date().toISOString().substring(0, 10),
  financeType: 'chi' as 'chi' | 'thu',
  financeTransactionCode: 'NL',
  requestingParty: '',
  executingParty: 'Tiến Nga',
  receivingParty: '',
  financeStatus: 'approved',
  purpose: '',
  financeNote: '',
  reason: '',
  financeAmount: 0,
  financeAmountText: ''
})

const purchaseRules = computed<FormRules>(() => {
  const rules: FormRules = {
    customerCode: [{ required: true, message: 'Vui lòng nhập mã khách hàng', trigger: 'blur' }],
    customerName: [{ required: true, message: 'Vui lòng nhập tên khách hàng', trigger: 'blur' }],
    date: [{ required: true, message: 'Vui lòng chọn ngày', trigger: 'change' }],
    weight: [{ required: true, message: 'Vui lòng nhập khối lượng', trigger: 'blur' }],
    unitPrice: [{ required: true, message: 'Vui lòng nhập đơn giá', trigger: 'blur' }]
  }

  if (purchaseForm.isPaid) {
    rules.subFundId = [{ required: true, message: 'Vui lòng chọn Quỹ tiền', trigger: 'change' }]
    rules.financeDate = [{ required: true, message: 'Vui lòng chọn ngày giao dịch', trigger: 'change' }]
    rules.requestingParty = [{ required: true, message: 'Vui lòng nhập bên yêu cầu', trigger: 'blur' }]
    rules.executingParty = [{ required: true, message: 'Vui lòng nhập bên thực hiện', trigger: 'blur' }]
    rules.receivingParty = [{ required: true, message: 'Vui lòng nhập bên nhận', trigger: 'blur' }]
    rules.purpose = [{ required: true, message: 'Vui lòng nhập mục đích', trigger: 'blur' }]
    rules.financeAmount = [{ required: true, message: 'Vui lòng nhập số tiền giao dịch', trigger: 'blur' }]
  }

  return rules
})

const computedTotalAmount = computed(() => parseFloat((purchaseForm.weight * purchaseForm.unitPrice).toFixed(2)))

// Watch changes in isPaid to default the financial variables
watch(
  () => purchaseForm.isPaid,
  (isPaid) => {
    const total = computedTotalAmount.value
    if (isPaid) {
      // By default, payment is equal to remaining: total - advanceAmount
      const remaining = Math.max(0, parseFloat((total - purchaseForm.advanceAmount).toFixed(2)))
      purchaseForm.financeAmount = remaining
      purchaseForm.financeAmountText = remaining > 0 ? new Intl.NumberFormat('vi-VN').format(remaining) : '0'
      purchaseForm.debt = 0
      purchaseForm.debtText = '0'
    } else {
      purchaseForm.financeAmount = 0
      purchaseForm.financeAmountText = '0'
      const computedVal = parseFloat((total - purchaseForm.advanceAmount).toFixed(2))
      purchaseForm.debt = computedVal
      purchaseForm.debtText = computedVal > 0 ? new Intl.NumberFormat('vi-VN').format(computedVal) : '0'
    }
  }
)

// Watch changes in computedTotalAmount to update defaults dynamically
watch(
  () => computedTotalAmount.value,
  (total) => {
    if (purchaseForm.isPaid) {
      const remaining = Math.max(0, parseFloat((total - purchaseForm.advanceAmount).toFixed(2)))
      purchaseForm.financeAmount = remaining
      purchaseForm.financeAmountText = remaining > 0 ? new Intl.NumberFormat('vi-VN').format(remaining) : '0'
      purchaseForm.debt = 0
      purchaseForm.debtText = '0'
    } else {
      const computedVal = parseFloat((total - purchaseForm.advanceAmount).toFixed(2))
      purchaseForm.debt = computedVal
      purchaseForm.debtText = computedVal > 0 ? new Intl.NumberFormat('vi-VN').format(computedVal) : '0'
    }
  }
)

const handlePaymentTypeChange = (val: any) => {
  const type = String(val)
  const name = purchaseForm.customerName || 'Khách hàng'
  if (type === 'chi') {
    purchaseForm.requestingParty = name
    purchaseForm.executingParty = 'Tiến Nga'
    purchaseForm.receivingParty = name
    purchaseForm.purpose = `Chi tiền thu mua nguyên liệu từ ${name}`
  } else {
    purchaseForm.requestingParty = name
    purchaseForm.executingParty = name
    purchaseForm.receivingParty = 'Tiến Nga'
    purchaseForm.purpose = `Thu tiền thu mua nguyên liệu từ ${name}`
  }
}

watch(
  () => [purchaseForm.isPaid, purchaseForm.customerName, purchaseForm.date, purchaseForm.financeType] as const,
  ([isPaid, customerName, date, type]) => {
    if (isPaid) {
      const name = customerName || 'Khách hàng'
      if (!purchaseForm.subFundId && subFunds.value.length > 0) {
        purchaseForm.subFundId = subFunds.value[0].id
      }
      purchaseForm.financeDate = date || new Date().toISOString().substring(0, 10)
      
      if (type === 'chi') {
        purchaseForm.requestingParty = name
        purchaseForm.executingParty = 'Tiến Nga'
        purchaseForm.receivingParty = name
        purchaseForm.purpose = `Chi tiền thu mua nguyên liệu từ ${name}`
      } else {
        purchaseForm.requestingParty = name
        purchaseForm.executingParty = name
        purchaseForm.receivingParty = 'Tiến Nga'
        purchaseForm.purpose = `Thu tiền thu mua nguyên liệu từ ${name}`
      }
      
      purchaseForm.reason = `Thanh toán thu mua nguyên liệu ngày ${date ? new Date(date).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}`
    }
  }
)

const openPurchaseDialog = () => {
  purchaseForm.customerCode = ''
  purchaseForm.customerName = ''
  const todayStr = new Date().toISOString().substring(0, 10)
  purchaseForm.date = todayStr
  purchaseForm.trips = 1
  purchaseForm.weight = 1000
  purchaseForm.unitPrice = 0
  purchaseForm.unitPriceText = ''
  purchaseForm.advanceAmount = 0
  purchaseForm.advanceAmountText = ''
  purchaseForm.notes = ''
  
  purchaseForm.debt = 0
  purchaseForm.debtText = ''
  purchaseForm.isPaid = false
  purchaseForm.subFundId = subFunds.value[0]?.id || ''
  purchaseForm.financeDate = todayStr
  purchaseForm.financeType = 'chi'
  purchaseForm.financeTransactionCode = 'NL'
  purchaseForm.requestingParty = ''
  purchaseForm.executingParty = 'Tiến Nga'
  purchaseForm.receivingParty = ''
  purchaseForm.financeStatus = 'approved'
  purchaseForm.purpose = 'Chi tiền thu mua nguyên liệu'
  purchaseForm.financeNote = ''
  purchaseForm.reason = `Thanh toán thu mua nguyên liệu ngày ${new Date().toLocaleDateString('vi-VN')}`
  purchaseForm.financeAmount = 0
  purchaseForm.financeAmountText = ''
  
  purchaseDialogVisible.value = true
}

// Format helpers cho input tiền (tham khảo Finance)
const handleUnitPriceInput = (val: string) => {
  const numericVal = val.replace(/[^0-9]/g, '')
  const num = parseInt(numericVal, 10)
  if (!isNaN(num)) {
    purchaseForm.unitPrice = num
    purchaseForm.unitPriceText = new Intl.NumberFormat('vi-VN').format(num)
  } else {
    purchaseForm.unitPrice = 0
    purchaseForm.unitPriceText = ''
  }
}

const handleAdvanceAmountInput = (val: string) => {
  const numericVal = val.replace(/[^0-9]/g, '')
  const num = parseInt(numericVal, 10)
  if (!isNaN(num)) {
    purchaseForm.advanceAmount = num
    purchaseForm.advanceAmountText = new Intl.NumberFormat('vi-VN').format(num)
  } else {
    purchaseForm.advanceAmount = 0
    purchaseForm.advanceAmountText = ''
  }
  // Recalculate financeAmount / debt
  const total = computedTotalAmount.value
  if (purchaseForm.isPaid) {
    // Keep financeAmount as total - advanceAmount, and debt as 0
    const remaining = Math.max(0, parseFloat((total - purchaseForm.advanceAmount).toFixed(2)))
    purchaseForm.financeAmount = remaining
    purchaseForm.financeAmountText = remaining > 0 ? new Intl.NumberFormat('vi-VN').format(remaining) : '0'
    purchaseForm.debt = 0
    purchaseForm.debtText = '0'
  } else {
    const computedVal = parseFloat((total - purchaseForm.advanceAmount).toFixed(2))
    purchaseForm.debt = computedVal
    purchaseForm.debtText = computedVal > 0 ? new Intl.NumberFormat('vi-VN').format(computedVal) : '0'
  }
}

const handleDebtInput = (val: string) => {
  const numericVal = val.replace(/[^0-9]/g, '')
  const num = parseInt(numericVal, 10)
  if (!isNaN(num)) {
    purchaseForm.debt = num
    purchaseForm.debtText = new Intl.NumberFormat('vi-VN').format(num)
  } else {
    purchaseForm.debt = 0
    purchaseForm.debtText = ''
  }
  
  // Recalculate financeAmount (Thanh toán) if isPaid is true
  const total = computedTotalAmount.value
  if (purchaseForm.isPaid) {
    const computedVal = Math.max(0, parseFloat((total - purchaseForm.advanceAmount - purchaseForm.debt).toFixed(2)))
    purchaseForm.financeAmount = computedVal
    purchaseForm.financeAmountText = computedVal > 0 ? new Intl.NumberFormat('vi-VN').format(computedVal) : '0'
  }
}

const handleFinanceAmountInput = (val: string) => {
  const numericVal = val.replace(/[^0-9]/g, '')
  const num = parseInt(numericVal, 10)
  if (!isNaN(num)) {
    purchaseForm.financeAmount = num
    purchaseForm.financeAmountText = new Intl.NumberFormat('vi-VN').format(num)
  } else {
    purchaseForm.financeAmount = 0
    purchaseForm.financeAmountText = ''
  }
  
  // Recalculate debt (Công nợ)
  const total = computedTotalAmount.value
  const computedVal = Math.max(0, parseFloat((total - purchaseForm.advanceAmount - purchaseForm.financeAmount).toFixed(2)))
  purchaseForm.debt = computedVal
  purchaseForm.debtText = computedVal > 0 ? new Intl.NumberFormat('vi-VN').format(computedVal) : '0'
}

const submitPurchase = async () => {
  if (!purchaseFormRef.value) return
  await purchaseFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        submitting.value = true
        // 1. Ghi nhận giao dịch thu mua
        const payload = [{
          transaction_date: purchaseForm.date,
          customer_id: purchaseForm.customerCode,
          material_type: props.warehouse.material,
          storage_name: props.warehouse.name,
          trip_count: purchaseForm.trips,
          weight: parseFloat(purchaseForm.weight.toFixed(2)),
          unit_price: purchaseForm.unitPrice,
          total_amount: computedTotalAmount.value,
          advance_payment: purchaseForm.advanceAmount,
          debt: purchaseForm.debt,
          notes: purchaseForm.notes || null
        }]
        await tienNgaService.addMaterialPurchases(payload)

        // 2. Ghi nhận Giao dịch tài chính phát sinh nếu isPaid = true
        if (purchaseForm.isPaid) {
          const paymentPayload = [{
            investment_id: purchaseForm.subFundId,
            requester: purchaseForm.requestingParty,
            executor: purchaseForm.executingParty,
            receiver: purchaseForm.receivingParty,
            payment_type: purchaseForm.financeType,
            purpose: purchaseForm.purpose,
            reason: purchaseForm.reason,
            amount: purchaseForm.financeAmount,
            day: purchaseForm.financeDate,
            status: purchaseForm.financeStatus === 'approved' ? 'APPROVED' : 'UNAPPROVED',
            notes: purchaseForm.financeNote,
            transaction_code: purchaseForm.financeTransactionCode
          }]
          await tienNgaService.addDailyPayments(paymentPayload)
        }

        purchaseDialogVisible.value = false
        ElMessage.success('Đã thêm giao dịch thu mua thành công!')
        emit('refresh-purchases')
      } catch (error: any) {
        ElMessage.error(error.message || 'Thêm giao dịch thất bại!')
      } finally {
        submitting.value = false
      }
    }
  })
}

const detailDialogVisible = ref(false)
const selectedPurchase = ref<PurchaseTransaction | null>(null)

const showPurchaseDetail = (row: PurchaseTransaction) => {
  selectedPurchase.value = row
  detailDialogVisible.value = true
}

const handlePurchaseCommand = (command: string, row: PurchaseTransaction) => {
  console.log('handlePurchaseCommand trigger:', command, row)
  if (command === 'detail') {
    showPurchaseDetail(row)
  } else if (command === 'delete') {
    const displayDate = row.date ? formatDate(row.date) : 'chưa rõ'
    ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa giao dịch thu mua của khách hàng "${row.customerName || 'Chưa rõ'}" ngày ${displayDate} không?`,
      'Xác nhận xóa',
      {
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy bỏ',
        type: 'warning'
      }
    ).then(async () => {
      try {
        submitting.value = true
        await tienNgaService.deleteMaterialPurchases([row.id])
        ElMessage.success('Xóa giao dịch thu mua thành công!')
        emit('refresh-purchases')
      } catch (error: any) {
        ElMessage.error(error.message || 'Xóa giao dịch thất bại!')
      } finally {
        submitting.value = false
      }
    }).catch(() => {})
  }
}

const detailExportDialogVisible = ref(false)
const selectedExport = ref<ExportTransaction | null>(null)

const showExportDetail = (row: ExportTransaction) => {
  console.log('showExportDetail called with:', row)
  selectedExport.value = row
  detailExportDialogVisible.value = true
  console.log('detailExportDialogVisible state is now:', detailExportDialogVisible.value)
}

const handleExportCommand = (command: string, row: ExportTransaction) => {
  console.log('handleExportCommand trigger:', command, row)
  if (command === 'detail') {
    showExportDetail(row)
  } else if (command === 'delete') {
    const displayDate = row.date ? formatDate(row.date) : 'chưa rõ'
    ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa giao dịch xuất kho ngày ${displayDate} không?`,
      'Xác nhận xóa',
      {
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy bỏ',
        type: 'warning'
      }
    ).then(async () => {
      try {
        submitting.value = true
        await tienNgaService.deleteInventoryExports([row.id])
        ElMessage.success('Xóa giao dịch xuất kho thành công!')
        emit('refresh-purchases')
      } catch (error: any) {
        ElMessage.error(error.message || 'Xóa giao dịch thất bại!')
      } finally {
        submitting.value = false
      }
    }).catch(() => {})
  }
}

// ========== 2. XUẤT KHO ==========
const exportFilters = reactive({
  dateRange: null as null | [string, string],
  search: ''
})
const exportPage = ref(1)
const exportPageSize = ref(10)

watch(() => exportFilters, () => { exportPage.value = 1 }, { deep: true })

const filteredExports = computed(() => {
  return props.exports.filter(t => {
    if (exportFilters.dateRange) {
      const [s, e] = exportFilters.dateRange
      if (t.date < s || t.date > e) return false
    }
    if (exportFilters.search) {
      const q = exportFilters.search.toLowerCase()
      if (!t.executor.toLowerCase().includes(q)) return false
    }
    return true
  })
})

const exportSortProp = ref('')
const exportSortOrder = ref('')

const handleExportSortChange = ({ prop, order }: { prop: string; order: string }) => {
  exportSortProp.value = prop
  exportSortOrder.value = order
  exportPage.value = 1
}

const sortedExports = computed(() =>
  sortList(filteredExports.value, exportSortProp.value, exportSortOrder.value)
)

const paginatedExports = computed(() => {
  const s = (exportPage.value - 1) * exportPageSize.value
  return sortedExports.value.slice(s, s + exportPageSize.value)
})

// Export Dialog
const exportDialogVisible = ref(false)
const exportFormRef = ref<FormInstance>()
const exportForm = reactive({
  executor: '',
  date: new Date().toISOString().substring(0, 10),
  exportWeight: 100,
  notes: ''
})
const exportRules = reactive<FormRules>({
  executor: [{ required: true, message: 'Vui lòng nhập tên người thực hiện', trigger: 'blur' }],
  date: [{ required: true, message: 'Vui lòng chọn ngày', trigger: 'change' }],
  exportWeight: [{ required: true, message: 'Vui lòng nhập khối lượng xuất', trigger: 'blur' }],
})

const openExportDialog = () => {
  exportForm.executor = ''
  exportForm.date = new Date().toISOString().substring(0, 10)
  exportForm.exportWeight = 100
  exportForm.notes = ''
  exportDialogVisible.value = true
}

const submitExport = async () => {
  if (!exportFormRef.value) return
  await exportFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        submitting.value = true
        const payload = [{
          export_date: exportForm.date,
          performer_name: exportForm.executor,
          material_type: props.warehouse.material,
          storage_name: props.warehouse.name,
          export_weight: parseFloat(exportForm.exportWeight.toFixed(2)),
          notes: exportForm.notes || null
        }]
        console.log('submitExport payload sending:', payload)
        const res = await tienNgaService.addInventoryExports(payload)
        console.log('submitExport API response:', res)
        exportDialogVisible.value = false
        ElMessage.success('Đã xuất kho thành công!')
        emit('refresh-purchases')
      } catch (error: any) {
        ElMessage.error(error.message || 'Xuất kho thất bại!')
      } finally {
        submitting.value = false
      }
    }
  })
}

// ========== 3. TRUY XUẤT THÔNG TIN ==========
const lookupFilters = reactive({
  category: 'purchase' as 'purchase' | 'export',
  dateRange: null as null | [string, string]
})
const lookupSearched = ref(false)
const lookupPage = ref(1)
const lookupPageSize = ref(10)
const lookupLoading = ref(false)
const lookupPurchases = ref<PurchaseTransaction[]>([])
const lookupExports = ref<ExportTransaction[]>([])

const handleLookupSearch = async () => {
  lookupSearched.value = true
  lookupPage.value = 1
  
  let start_date = undefined
  let end_date = undefined
  if (lookupFilters.dateRange) {
    start_date = lookupFilters.dateRange[0]
    end_date = lookupFilters.dateRange[1]
  }

  try {
    lookupLoading.value = true
    if (lookupFilters.category === 'purchase') {
      const data = await tienNgaService.getMaterialPurchases({
        material_type: props.warehouse.material,
        storage_name: props.warehouse.name,
        start_date,
        end_date
      })
      lookupPurchases.value = data.map((item: any) => ({
        id: String(item.id),
        warehouseId: props.warehouse.id,
        date: item.transaction_date || '',
        customerCode: item.customer_id || '',
        customerName: item.fullname || '',
        material: item.material_type || '',
        warehouseName: item.storage_name || '',
        trips: item.trip_count || 0,
        weight: item.weight || 0,
        unitPrice: item.unit_price || 0,
        totalAmount: item.total_amount || 0,
        advanceAmount: item.advance_payment || 0,
        debt: item.debt || 0,
        notes: item.notes || ''
      }))
    } else {
      const data = await tienNgaService.getInventoryExports({
        storage_name: props.warehouse.name,
        material_type: props.warehouse.material,
        start_date,
        end_date
      })
      lookupExports.value = data.map((item: any) => ({
        id: String(item.id),
        warehouseId: props.warehouse.id,
        date: item.export_date || '',
        executor: item.performer_name || '',
        material: item.material_type || '',
        warehouseName: item.storage_name || '',
        exportWeight: item.export_weight || 0,
        remainingWeight: item.remaining_weight || 0,
        notes: item.notes || ''
      }))
    }
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi truy xuất dữ liệu!')
  } finally {
    lookupLoading.value = false
  }
}

const filteredLookupPurchases = computed(() => {
  return lookupPurchases.value
})

const filteredLookupExports = computed(() => {
  return lookupExports.value
})

// Hai bảng tra cứu dùng chung phân trang nên cũng dùng chung trạng thái sắp xếp
const lookupSortProp = ref('')
const lookupSortOrder = ref('')

const handleLookupSortChange = ({ prop, order }: { prop: string; order: string }) => {
  lookupSortProp.value = prop
  lookupSortOrder.value = order
  lookupPage.value = 1
}

const sortedLookupPurchases = computed(() =>
  sortList(filteredLookupPurchases.value, lookupSortProp.value, lookupSortOrder.value)
)

const sortedLookupExports = computed(() =>
  sortList(filteredLookupExports.value, lookupSortProp.value, lookupSortOrder.value)
)

const paginatedLookupPurchases = computed(() => {
  const s = (lookupPage.value - 1) * lookupPageSize.value
  return sortedLookupPurchases.value.slice(s, s + lookupPageSize.value)
})

const paginatedLookupExports = computed(() => {
  const s = (lookupPage.value - 1) * lookupPageSize.value
  return sortedLookupExports.value.slice(s, s + lookupPageSize.value)
})

const lookupPurchaseStats = computed(() => ({
  totalWeight: filteredLookupPurchases.value.reduce((sum, t) => sum + t.weight, 0),
  totalAmount: filteredLookupPurchases.value.reduce((sum, t) => sum + t.totalAmount, 0),
  totalAdvance: filteredLookupPurchases.value.reduce((sum, t) => sum + t.advanceAmount, 0),
  totalDebt: filteredLookupPurchases.value.reduce((sum, t) => sum + t.debt, 0),
}))

const lookupExportStats = computed(() => ({
  totalExportWeight: filteredLookupExports.value.reduce((sum, t) => sum + t.exportWeight, 0),
}))

// ========== HELPERS ==========
const formatCurrency = (value: number) => {
  return dinhDangSo(value)
}

const formatNumber = (value: any, _decimals?: number) => {
  // MỤC 355 — bỏ phần lẻ khi hiển thị, CẮT chứ không làm tròn.
  // Tham số `_decimals` giữ lại để 105 chỗ gọi cũ không phải sửa; nay
  // không dùng tới vì mọi số đều hiện phần nguyên.
  return dinhDangSo(value)
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const parts = dateString.split('-')
  if (parts.length !== 3) return dateString
  const [year, month, day] = parts
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
  overflow: hidden;
}

.custom-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

/* Cho phân trang tự xuống dòng khi có nhiều trang */
.warehouse-detail-wrapper :deep(.el-pagination) {
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
.stat-card--orange { border-left: 4px solid #f59e0b; }
.stat-card--blue { border-left: 4px solid #3b82f6; }
.stat-card--rose { border-left: 4px solid #f43f5e; }

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

html.dark .warehouse-detail-wrapper :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}
html.dark .warehouse-detail-wrapper :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}
html.dark .warehouse-detail-wrapper :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}
html.dark .warehouse-detail-wrapper :deep(.el-table .el-table-fixed-column--left),
html.dark .warehouse-detail-wrapper :deep(.el-table .el-table-fixed-column--right) {
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
