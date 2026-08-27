<template>
  <div class="h-full p-6 overflow-hidden flex flex-col finance-detail-wrapper">
    <!-- Header Navigation -->
    <div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
      <div class="flex items-center gap-3">
        <el-button 
          @click="emit('back')" 
          circle 
          class="shadow-sm hover:scale-105 transition-transform duration-200"
        >
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <div>
          <div class="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Chi Tiết Quỹ Cha</div>
          <h2 class="text-2xl font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-2 mt-0.5">
            {{ fund.name }}
          </h2>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <el-tag :type="getStatusType(fund.status)" size="large" effect="plain" class="font-bold">
          {{ getStatusText(fund.status) }}
        </el-tag>
        <span class="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 font-medium">
          {{ fund.startDate }} - {{ fund.endDate }}
        </span>
      </div>
    </div>

    <!-- Quick Stats Cards -->
    <transition name="stats-slide">
      <div v-show="activeTab !== 'query' && activeTab !== 'cashflow'" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 shrink-0">
      <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm">
        <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Vốn ban đầu</div>
        <div class="text-xl font-bold mt-1 text-gray-800 dark:text-gray-100">{{ formatCurrency(fund.initialCapital) }}</div>
      </div>
      <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm">
        <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Tổng thu</div>
        <div class="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">+{{ formatCurrency(fund.totalRevenue) }}</div>
      </div>
      <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm">
        <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-rose-500 dark:text-rose-400">Tổng chi</div>
        <div class="text-xl font-bold mt-1 text-rose-500 dark:text-rose-400">-{{ formatCurrency(fund.totalExpense) }}</div>
      </div>
      <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm">
        <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Số dư còn lại</div>
        <div class="text-xl font-bold mt-1" :class="(fund.initialCapital + (fund.totalRevenue - fund.totalExpense)) >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'">
          {{ formatCurrency(fund.initialCapital + (fund.totalRevenue - fund.totalExpense)) }}
        </div>
      </div>
      </div>
    </transition>

    <!-- Main Tabs Layout -->
    <div class="flex-1 min-h-0 flex flex-col overflow-hidden">
      <el-tabs v-model="activeTab" type="border-card" class="detail-tabs h-full flex flex-col flex-1">
        <!-- 1. TAB QUỸ CON -->
        <el-tab-pane name="fund-info" class="h-full flex flex-col">
          <template #label>
            <span class="custom-tabs-label flex items-center gap-1">
              <el-icon><List /></el-icon>
              <span>Quỹ con</span>
            </span>
          </template>
          
          <div class="space-y-6 overflow-y-auto pr-1 flex-1">
            <div>
              <h3 class="text-base font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                <span class="w-1.5 h-3 bg-blue-600 dark:bg-blue-400 rounded-full"></span>
                Danh sách Quỹ thành viên trực thuộc (Quỹ con)
              </h3>
              <p class="text-sm text-gray-400 dark:text-gray-500">
                Các quỹ trực thuộc trực tiếp quản lý hạn mức và luồng giao dịch của {{ fund.name }}
              </p>
            </div>

            <!-- Sub Funds Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div 
                v-for="sub in fund.subFunds" 
                :key="sub.id"
                class="border border-gray-100 dark:border-gray-700/80 rounded-2xl bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
              >
                <!-- Card Header -->
                <div class="flex items-start gap-3 mb-3">
                  <div class="p-2.5 rounded-xl text-white shadow-sm flex items-center justify-center" :style="{ backgroundColor: sub.color }">
                    <el-icon :size="20">
                      <component :is="getIcon(sub.icon)" />
                    </el-icon>
                  </div>
                  <div class="flex-1 min-w-0 text-left">
                    <div class="flex items-center justify-between gap-1">
                      <h4 class="font-bold text-gray-800 dark:text-gray-100 text-[15px] line-clamp-1 leading-snug flex-1">{{ sub.name }}</h4>
                      
                      <!-- Dropdown Action Menu -->
                      <div @click.stop>
                        <el-dropdown trigger="click" @command="(cmd) => handleSubFundCommand(cmd, sub)">
                          <el-button link type="info" class="p-1 !text-gray-400 hover:!text-gray-600 dark:hover:!text-gray-200" @click.stop>
                            <el-icon :size="16"><MoreFilled /></el-icon>
                          </el-button>
                          <template #dropdown>
                            <el-dropdown-menu>
                              <el-dropdown-item command="edit">Chỉnh sửa</el-dropdown-item>
                              <el-dropdown-item command="delete" divided class="!text-red-500">Xóa</el-dropdown-item>
                            </el-dropdown-menu>
                          </template>
                        </el-dropdown>
                      </div>
                    </div>
                    <div class="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mt-1 justify-start">
                      <el-icon :size="12"><Calendar /></el-icon>
                      <span>{{ sub.startDate }}</span>
                    </div>
                  </div>
                </div>

                <!-- Status Tag -->
                <div class="mb-5 flex justify-start text-left">
                  <el-tag :type="getStatusType(sub.status)" size="small" class="capitalize" effect="plain">
                    {{ getStatusText(sub.status) }}
                  </el-tag>
                </div>

                <!-- Card Body / Details -->
                <div class="space-y-3 pt-3 border-t border-gray-50 dark:border-gray-700/40">
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-400 dark:text-gray-500 font-medium">Vốn ban đầu</span>
                    <span class="font-bold text-gray-700 dark:text-gray-300">{{ formatCurrency(sub.initialCapital) }}</span>
                  </div>
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-400 dark:text-gray-500 font-medium">Tổng thu (+)</span>
                    <span class="font-bold text-emerald-600 dark:text-emerald-400">+{{ formatCurrency(sub.totalRevenue) }}</span>
                  </div>
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-400 dark:text-gray-500 font-medium">Tổng chi (-)</span>
                    <span class="font-bold text-rose-500 dark:text-rose-400">-{{ formatCurrency(sub.totalExpense) }}</span>
                  </div>
                  
                  <!-- Remaining Balance Box -->
                  <div class="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 flex justify-between items-center border border-gray-100/50 dark:border-gray-800">
                    <div class="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Số dư còn lại</div>
                    <div class="text-[15px] font-extrabold" :class="(sub.initialCapital + (sub.totalRevenue - sub.totalExpense)) >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'">
                      {{ formatCurrency(sub.initialCapital + (sub.totalRevenue - sub.totalExpense)) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fund Rules/Policies Mock -->
            <div class="mt-8 p-5 rounded-2xl bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border border-blue-500/10 dark:border-blue-500/20">
              <h4 class="text-sm font-bold text-blue-700 dark:text-blue-400 mb-2">Quy chế dòng tiền</h4>
              <ul class="text-xs text-gray-500 dark:text-gray-400 space-y-2 list-disc list-inside">
                <li>Mọi khoản giao dịch phát sinh trên Quỹ con đều phải được cập nhật ngay trong ngày làm việc.</li>
                <li>Số dư thực tế tại các Quỹ con sẽ tự động được tổng hợp lên kết quả tổng quát của Quỹ cha.</li>
                <li>Giao dịch vượt quá 100,000,000 VNĐ cần có phê duyệt số từ Ban Giám Đốc Tiến Nga.</li>
              </ul>
            </div>
          </div>
        </el-tab-pane>

        <!-- 2. TAB THU CHI HẰNG NGÀY (CÓ PHÂN TRANG THEO LAYOUT BÊN HỘ DÂN) -->
        <el-tab-pane name="cashflow" class="h-full flex flex-col">
          <template #label>
            <span class="custom-tabs-label flex items-center gap-1">
              <el-icon><Calendar /></el-icon>
              <span>Thu chi hằng ngày</span>
            </span>
          </template>

          <div class="flex-1 flex flex-col min-h-0">
            <!-- Filter Bar -->
            <div class="flex flex-wrap justify-between items-center mb-4 gap-x-4 gap-y-4 shrink-0">
              <div class="flex flex-wrap items-center gap-x-4 gap-y-4">
                <!-- Tên Quỹ Select -->
                <div class="flex items-center gap-2">
                  <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tên Quỹ con:</span>
                  <el-select 
                    v-model="cashflowFilters.subFundId" 
                    placeholder="Chọn Quỹ con" 
                    style="width: 180px"
                    class="custom-dark-select highlight-select"
                    popper-class="custom-dark-select-popper"
                  >
                    <el-option label="Tất cả" value="all" />
                    <el-option 
                      v-for="sub in fund.subFunds" 
                      :key="sub.id" 
                      :label="sub.name" 
                      :value="sub.id" 
                    />
                  </el-select>
                </div>
                
                <!-- Loại thanh toán Select (Thu, Chi) -->
                <div class="flex items-center gap-2">
                  <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Loại:</span>
                  <el-select 
                    v-model="cashflowFilters.type" 
                    placeholder="Loại giao dịch" 
                    style="width: 140px"
                    class="custom-dark-select highlight-select"
                    popper-class="custom-dark-select-popper"
                  >
                    <el-option label="Tất cả" value="all" />
                    <el-option label="Thu" value="thu" />
                    <el-option label="Chi" value="chi" />
                  </el-select>
                </div>

                <!-- Thời gian Picker -->
                <div class="flex items-center gap-2">
                  <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian:</span>
                  <el-date-picker :editable="false"
                    v-model="cashflowFilters.dateRange"
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
                
                <!-- Tìm kiếm Input -->
                <div class="flex items-center gap-2">
                  <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
                  <el-input
                    v-model="cashflowFilters.searchQuery"
                    placeholder="Bên yêu cầu, bên nhận, lý do..."
                    :prefix-icon="Search"
                    clearable
                    class="w-60 custom-dark-input"
                  />
                </div>
              </div>

              <!-- Thêm giao dịch Button & Refresh Button -->
              <div class="flex items-center gap-2">
                <el-button :icon="Refresh" circle @click="emit('refresh-transactions')" />
                <el-button type="primary" @click="openAddDialog">Thêm giao dịch</el-button>
              </div>
            </div>

            <!-- Transaction Table & Pagination Wrapper -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0 border border-gray-100 dark:border-gray-700">
              <el-table 
                :data="paginatedCashflowTransactions"
                style="width: 100%"
                class="flex-1 custom-table"
                height="100%"
                @sort-change="handleCashflowSortChange"
              >
                <!-- Fixed columns -->
                <el-table-column label="STT" width="60" align="center" fixed>
                  <template #default="{ $index }">
                    <span class="font-mono text-xs text-gray-500">{{ (cashflowCurrentPage - 1) * cashflowPageSize + $index + 1 }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="id" label="Mã Giao dịch" width="140" sortable="custom" fixed show-overflow-tooltip>
                  <template #default="scope">
                    <span class="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{{ scope.row.id }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Thời gian" width="115" sortable="custom" prop="date" fixed>
                  <template #default="scope">
                    <span class="text-xs font-semibold text-gray-600 dark:text-gray-400">{{ formatDate(scope.row.date) }}</span>
                  </template>
                </el-table-column>
                
                <el-table-column label="Tên Quỹ" width="160" fixed show-overflow-tooltip>
                  <template #default="scope">
                    <span class="text-xs font-semibold text-blue-600 dark:text-blue-400">{{ getSubFundName(scope.row.subFundId) }}</span>
                  </template>
                </el-table-column>

                <!-- Scrollable columns -->
                <el-table-column label="Bên yêu cầu" prop="requestingParty" width="150" show-overflow-tooltip />
                <el-table-column label="Bên thực hiện" prop="executingParty" width="150" show-overflow-tooltip />
                <el-table-column label="Bên nhận" prop="receivingParty" width="150" show-overflow-tooltip />
                
                <el-table-column label="Loại thanh toán" width="140" align="center">
                  <template #default="scope">
                    <el-tag :type="scope.row.type === 'thu' ? 'success' : 'danger'" effect="light" size="small" round>
                      {{ scope.row.type === 'thu' ? 'Thu' : 'Chi' }}
                    </el-tag>
                  </template>
                </el-table-column>
                
                <el-table-column label="Mục đích" prop="purpose" width="150" show-overflow-tooltip />
                <el-table-column label="Lí do" prop="reason" min-width="220" show-overflow-tooltip />
                
                <el-table-column label="Số lượng" width="160" align="right">
                  <template #default="scope">
                    <span class="font-extrabold text-sm" :class="scope.row.type === 'thu' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'">
                      {{ scope.row.type === 'thu' ? '+' : '-' }}{{ formatCurrency(scope.row.amount) }}
                    </span>
                  </template>
                </el-table-column>

                <el-table-column label="Trạng thái" width="120" align="center">
                  <template #default="scope">
                    <el-tag :type="getTransactionStatusType(scope.row.status)" effect="light" size="small" round>
                      {{ getTransactionStatusText(scope.row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>

                <el-table-column label="Ghi chú" prop="note" width="180" show-overflow-tooltip />

                <!-- Fixed Right Operations -->
                <el-table-column fixed="right" label="Thao tác" width="90" align="center">
                  <template #default="scope">
                    <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, scope.row.id)">
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

              <!-- Phân trang (Pagination) -->
              <div class="mt-auto shrink-0 p-4 flex flex-wrap justify-end gap-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                <el-pagination
                  v-model:current-page="cashflowCurrentPage"
                  v-model:page-size="cashflowPageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  :background="true"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="filteredCashflowTransactions.length"
                />
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 3. TAB TRUY VẤN DỮ LIỆU -->
        <el-tab-pane name="query" class="h-full flex flex-col">
          <template #label>
            <span class="custom-tabs-label flex items-center gap-1">
              <el-icon><Search /></el-icon>
              <span>Truy vấn dữ liệu</span>
            </span>
          </template>

          <div class="query-container flex-1 flex flex-col min-h-0">
            <!-- Filter bar (inline, matching InformationLookup) -->
            <div class="flex flex-wrap justify-between items-center gap-x-4 gap-y-4 mb-4 shrink-0">
              <div class="flex flex-wrap items-center gap-x-4 gap-y-4">
                <div class="flex items-center gap-2">
                  <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tên Quỹ con:</span>
                  <el-select 
                    v-model="queryFilters.subFundId" 
                    placeholder="Chọn Quỹ con" 
                    style="width: 180px"
                    class="custom-dark-select highlight-select"
                    popper-class="custom-dark-select-popper"
                  >
                    <el-option label="Tất cả" value="all" />
                    <el-option 
                      v-for="sub in fund.subFunds" 
                      :key="sub.id" 
                      :label="sub.name" 
                      :value="sub.id" 
                    />
                  </el-select>
                </div>

                <div class="flex items-center gap-2">
                  <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Loại:</span>
                  <el-select 
                    v-model="queryFilters.type" 
                    placeholder="Loại giao dịch" 
                    style="width: 140px"
                    class="custom-dark-select highlight-select"
                    popper-class="custom-dark-select-popper"
                  >
                    <el-option label="Tất cả" value="all" />
                    <el-option label="Thu" value="thu" />
                    <el-option label="Chi" value="chi" />
                  </el-select>
                </div>

                <div class="flex items-center gap-2">
                  <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian:</span>
                  <el-date-picker :editable="false"
                    v-model="queryFilters.dateRange"
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

                <!-- Tìm kiếm Input -->
                <div class="flex items-center gap-2">
                  <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
                  <el-input
                    v-model="queryFilters.searchQuery"
                    placeholder="Bên yêu cầu, bên nhận, lý do..."
                    :prefix-icon="Search"
                    clearable
                    class="w-60 custom-dark-input"
                  />
                </div>
              </div>
              <div class="flex items-center gap-2">
                <el-button type="primary" :icon="Search" :loading="queryLoading" @click="handleQuerySearch">Tìm kiếm</el-button>
                <el-button type="success" :icon="Download" :disabled="selectedQueryRows.length === 0" @click="exportQueryToExcel">Xuất Excel ({{ selectedQueryRows.length }})</el-button>
              </div>
            </div>

            <!-- Summary Statistics Cards (after search) -->
            <div v-if="querySearched" class="summary-cards mb-4 shrink-0">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="stat-card stat-card--green">
                  <div class="stat-card__label">Tổng Thu lọc</div>
                  <div class="stat-card__value text-emerald-600 dark:text-emerald-400">{{ formatCurrency(queryTotals.revenue) }}</div>
                </div>
                <div class="stat-card stat-card--rose">
                  <div class="stat-card__label">Tổng Chi lọc</div>
                  <div class="stat-card__value text-rose-500 dark:text-rose-400">{{ formatCurrency(queryTotals.expense) }}</div>
                </div>
                <div class="stat-card stat-card--indigo">
                  <div class="stat-card__label">Lợi nhuận</div>
                  <div class="stat-card__value" :class="queryTotals.balance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'">{{ formatCurrency(queryTotals.balance) }}</div>
                </div>
              </div>
            </div>

            <!-- Query Result Table (after search) -->
            <div v-if="querySearched" class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0 border border-gray-100 dark:border-gray-700">
              <el-table 
                ref="queryTableRef"
                v-loading="queryLoading"
                :data="paginatedQueryTransactions" 
                style="width: 100%"
                height="100%"
                class="flex-1 custom-table"
                @selection-change="handleQuerySelectionChange"
                @sort-change="handleQuerySortChange"
              >
                <el-table-column type="selection" width="45" fixed />
                <el-table-column label="STT" width="60" align="center" fixed>
                  <template #default="{ $index }">
                    <span class="font-mono text-xs text-gray-500">{{ (queryCurrentPage - 1) * queryPageSize + $index + 1 }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="id" label="Mã Giao dịch" width="140" sortable="custom" fixed show-overflow-tooltip>
                  <template #default="scope">
                    <span class="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{{ scope.row.id }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Thời gian" width="115" sortable="custom" prop="date" fixed>
                  <template #default="scope">
                    <span class="text-xs text-gray-600 dark:text-gray-400">{{ formatDate(scope.row.date) }}</span>
                  </template>
                </el-table-column>
                
                <el-table-column label="Tên Quỹ" width="160" fixed show-overflow-tooltip>
                  <template #default="scope">
                    <span class="text-xs font-semibold text-blue-600 dark:text-blue-400">{{ getSubFundName(scope.row.subFundId) }}</span>
                  </template>
                </el-table-column>

                <el-table-column label="Bên yêu cầu" prop="requestingParty" width="150" show-overflow-tooltip />
                <el-table-column label="Bên thực hiện" prop="executingParty" width="150" show-overflow-tooltip />
                <el-table-column label="Bên nhận" prop="receivingParty" width="150" show-overflow-tooltip />
                <el-table-column label="Loại thanh toán" width="140" align="center">
                  <template #default="scope">
                    <el-tag :type="scope.row.type === 'thu' ? 'success' : 'danger'" effect="light" size="small" round>
                      {{ scope.row.type === 'thu' ? 'Thu' : 'Chi' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="Mục đích" prop="purpose" width="150" show-overflow-tooltip />
                <el-table-column label="Lí do" prop="reason" min-width="220" show-overflow-tooltip />
                
                <el-table-column label="Số lượng" width="160" align="right">
                  <template #default="scope">
                    <span class="font-extrabold text-sm" :class="scope.row.type === 'thu' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'">
                      {{ scope.row.type === 'thu' ? '+' : '-' }}{{ formatCurrency(scope.row.amount) }}
                    </span>
                  </template>
                </el-table-column>

                <el-table-column label="Trạng thái" width="140" align="center">
                  <template #default="scope">
                    <el-tag :type="getTransactionStatusType(scope.row.status)" effect="light" size="small" round>
                      {{ getTransactionStatusText(scope.row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>

                <el-table-column label="Ghi chú" prop="note" width="180" show-overflow-tooltip />
              </el-table>

              <!-- Phân trang (Pagination) cho Truy vấn -->
              <div class="mt-auto shrink-0 p-4 flex flex-wrap justify-end gap-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                <el-pagination
                  v-model:current-page="queryCurrentPage"
                  v-model:page-size="queryPageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  :background="true"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="filteredQueryTransactions.length"
                />
              </div>
            </div>

            <!-- Empty state before search -->
            <div v-if="!querySearched" class="flex-1 flex items-center justify-center">
              <div class="text-center text-gray-400 dark:text-gray-500">
                <el-icon class="text-6xl mb-4"><Search /></el-icon>
                <p class="text-lg">Vui lòng chọn các tiêu chí và nhấn <strong>Tìm kiếm</strong> để truy vấn dữ liệu</p>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- ADD TRANSACTION DIALOG -->
    <el-dialog 
      v-model="addDialogVisible" 
      title="THÊM MỚI GIAO DỊCH TÀI CHÍNH" 
      width="900px" 
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form 
          :model="formModel" 
          :rules="formRules" 
          ref="formRef" 
          label-width="180px"
          class="mt-2 compact-form"
        >
          <!-- PHẦN 1: PHÂN LOẠI GIAO DỊCH -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Phân loại giao dịch
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Quỹ tiền" prop="subFundId">
                  <el-select v-model="formModel.subFundId" placeholder="Chọn Quỹ tiền" class="w-full highlight-select" style="width: 100%">
                    <el-option 
                      v-for="sub in fund.subFunds" 
                      :key="sub.id" 
                      :label="sub.name" 
                      :value="sub.id" 
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Loại thanh toán" prop="type">
                  <el-radio-group v-model="formModel.type" class="w-full flex">
                    <el-radio-button label="thu" class="flex-1">Thu</el-radio-button>
                    <el-radio-button label="chi" class="flex-1">Chi</el-radio-button>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Thời gian" prop="date">
                  <el-date-picker :editable="false" 
                    v-model="formModel.date" 
                    type="date" 
                    placeholder="Chọn ngày giao dịch" 
                    value-format="YYYY-MM-DD"
                    class="w-full"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: ĐỐI TƯỢNG GIAO DỊCH -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-green-500 rounded-full"></span>
              Đối tượng giao dịch
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Bên yêu cầu" prop="requestingParty">
                  <el-input v-model="formModel.requestingParty" placeholder="Nhập tên bên yêu cầu..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Bên thực hiện" prop="executingParty">
                  <el-input v-model="formModel.executingParty" placeholder="Nhập tên bên thực hiện..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Bên nhận" prop="receivingParty">
                  <el-input v-model="formModel.receivingParty" placeholder="Nhập tên bên nhận..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 3: CHI TIẾT GIAO DỊCH -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-violet-655 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
              Chi tiết giao dịch
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Số lượng (VNĐ)" prop="amount">
                  <el-input 
                    v-model="formModel.amountText" 
                    placeholder="Nhập số tiền..."
                    @input="handleAmountInput"
                    class="w-full"
                  >
                    <template #suffix>
                      <span class="text-xs text-gray-400">VNĐ</span>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Trạng thái" prop="status">
                  <el-select v-model="formModel.status" placeholder="Chọn trạng thái" class="w-full highlight-select" style="width: 100%">
                    <el-option label="Đã chấp thuận" value="approved" />
                    <el-option label="Chưa chấp thuận" value="unapproved" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mục đích" prop="purpose">
                  <el-input v-model="formModel.purpose" placeholder="Nhập mục đích giao dịch..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Mã giao dịch" prop="transactionCode">
                  <el-select v-model="formModel.transactionCode" placeholder="Chọn mã giao dịch" class="w-full highlight-select" style="width: 100%">
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
          </div>

          <!-- PHẦN 4: LÝ DO & GHI CHÚ -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-rose-500 rounded-full"></span>
              Lý do &amp; Ghi chú
            </h4>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Ghi chú" prop="note">
                  <el-input v-model="formModel.note" placeholder="Nhập ghi chú thêm..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Lí do" prop="reason">
                  <el-input 
                    v-model="formModel.reason" 
                    type="textarea" 
                    :rows="3" 
                    placeholder="Mô tả lý do cho khoản thu/chi phát sinh này..." 
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-form>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2 pr-2">
          <el-button @click="addDialogVisible = false">Hủy bỏ</el-button>
          <el-button type="primary" :loading="submitting" @click="submitForm">Lưu giao dịch</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- DETAIL TRANSACTION DIALOG -->
    <el-dialog 
      v-model="detailDialogVisible" 
      title="CHI TIẾT GIAO DỊCH TÀI CHÍNH" 
      width="90%" 
      style="max-width: 700px"
      destroy-on-close
      class="custom-dark-dialog"
    >
      <div v-if="selectedTransaction" class="px-2 space-y-5">
        <!-- Row 1: Quỹ tiền + Loại -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Quỹ tiền</div>
            <div class="text-sm font-bold text-blue-600 dark:text-blue-400">{{ getSubFundName(selectedTransaction.subFundId) }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Loại thanh toán</div>
            <el-tag :type="selectedTransaction.type === 'thu' ? 'success' : 'danger'" effect="light" size="small" round>
              {{ selectedTransaction.type === 'thu' ? 'Thu' : 'Chi' }}
            </el-tag>
          </div>
        </div>

        <!-- Row 2: Số tiền + Thời gian -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số tiền</div>
            <div class="text-lg font-extrabold" :class="selectedTransaction.type === 'thu' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'">
              {{ selectedTransaction.type === 'thu' ? '+' : '-' }}{{ formatCurrency(selectedTransaction.amount) }}
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Thời gian</div>
            <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatDate(selectedTransaction.date) }}</div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- Row 3: Bên yêu cầu + Bên thực hiện -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Bên yêu cầu</div>
            <div class="text-sm text-gray-700 dark:text-gray-300">{{ selectedTransaction.requestingParty || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Bên thực hiện</div>
            <div class="text-sm text-gray-700 dark:text-gray-300">{{ selectedTransaction.executingParty || '—' }}</div>
          </div>
        </div>

        <!-- Row 4: Bên nhận + Trạng thái -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Bên nhận</div>
            <div class="text-sm text-gray-700 dark:text-gray-300">{{ selectedTransaction.receivingParty || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Trạng thái</div>
            <el-tag :type="getTransactionStatusType(selectedTransaction.status)" effect="light" size="small" round>
              {{ getTransactionStatusText(selectedTransaction.status) }}
            </el-tag>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- Row 5: Mục đích -->
        <div>
          <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mục đích</div>
          <div class="text-sm text-gray-700 dark:text-gray-300">{{ selectedTransaction.purpose || '—' }}</div>
        </div>

        <!-- Row 6: Lí do -->
        <div>
          <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Lí do</div>
          <div class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ selectedTransaction.reason || '—' }}</div>
        </div>

        <!-- Row 7: Ghi chú -->
        <div>
          <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ghi chú</div>
          <div class="text-sm text-gray-700 dark:text-gray-300">{{ selectedTransaction.note || '—' }}</div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end pr-2">
          <el-button @click="detailDialogVisible = false">Đóng</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { tienNgaService } from '@/api/tienNgaService'
import type { FormInstance, FormRules } from 'element-plus'
import { 
  ArrowLeft, 
  List, 
  Calendar, 
  Search, 
  CreditCard,
  Briefcase,
  Lock,
  Wallet,
  MoreFilled,
  Refresh,
  Download
} from '@element-plus/icons-vue'
import * as XLSX from 'xlsx-js-style'

// Định nghĩa types
interface SubFund {
  id: string
  name: string
  initialCapital: number
  startDate: string
  endDate: string
  status: 'active' | 'suspended' | 'settled'
  icon: string
  color: string
  totalRevenue: number
  totalExpense: number
  profit: number
}

interface Fund {
  id: string
  name: string
  initialCapital: number
  startDate: string
  endDate: string
  totalRevenue: number
  totalExpense: number
  profit: number
  status: 'active' | 'suspended' | 'settled'
  icon: string
  color: string
  bgColor: string
  subFunds: SubFund[]
}

interface Transaction {
  id: string
  fundId: string
  subFundId: string
  type: 'thu' | 'chi'
  requestingParty: string
  executingParty: string
  receivingParty: string
  purpose: string
  reason: string
  amount: number
  status: 'approved' | 'unapproved'
  note: string
  date: string
}

const props = defineProps<{
  fund: Fund
  transactions: Transaction[]
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'add-transaction', tx: Omit<Transaction, 'id' | 'fundId'>): void
  (e: 'delete-transaction', id: string): void
  (e: 'edit-subfund', sub: SubFund): void
  (e: 'delete-subfund', sub: SubFund): void
  (e: 'refresh-transactions'): void
}>()

const handleSubFundCommand = (command: string, sub: SubFund) => {
  if (command === 'edit') {
    emit('edit-subfund', sub)
  } else if (command === 'delete') {
    emit('delete-subfund', sub)
  }
}

// Helper: format số tiền nhập vào có dấu chấm
const formatAmountText = (value: number) => {
  if (!value || value === 0) return ''
  return new Intl.NumberFormat('vi-VN').format(value)
}

const handleAmountInput = (val: string) => {
  // Xóa tất cả ký tự không phải số
  const numericVal = val.replace(/[^0-9]/g, '')
  const num = parseInt(numericVal, 10)
  if (!isNaN(num)) {
    formModel.amount = num
    formModel.amountText = new Intl.NumberFormat('vi-VN').format(num)
  } else {
    formModel.amount = 0
    formModel.amountText = ''
  }
}

const activeTab = ref('fund-info')

// 1. Quản lý Bộ Lọc & Phân Trang Thu Chi Hằng Ngày (Tab 2)
const cashflowFilters = reactive({
  subFundId: 'all',
  type: 'all',
  dateRange: null as null | [string, string],
  searchQuery: ''
})

const cashflowCurrentPage = ref(1)
const cashflowPageSize = ref(10)

// Reset trang về 1 khi thay đổi bộ lọc
watch(() => cashflowFilters, () => {
  cashflowCurrentPage.value = 1
}, { deep: true })

const filteredCashflowTransactions = computed(() => {
  return props.transactions.filter(t => {
    if (cashflowFilters.subFundId !== 'all' && t.subFundId !== cashflowFilters.subFundId) return false
    if (cashflowFilters.type !== 'all' && t.type !== cashflowFilters.type) return false
    if (cashflowFilters.dateRange) {
      const [start, end] = cashflowFilters.dateRange
      if (t.date < start || t.date > end) return false
    }
    if (cashflowFilters.searchQuery) {
      const q = cashflowFilters.searchQuery.toLowerCase()
      const matchReq = t.requestingParty.toLowerCase().includes(q)
      const matchRec = t.receivingParty.toLowerCase().includes(q)
      const matchReason = t.reason.toLowerCase().includes(q)
      const matchPurpose = t.purpose.toLowerCase().includes(q)
      const matchNote = t.note.toLowerCase().includes(q)
      if (!matchReq && !matchRec && !matchReason && !matchPurpose && !matchNote) return false
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

const cashflowSortProp = ref('')
const cashflowSortOrder = ref('')

const handleCashflowSortChange = ({ prop, order }: { prop: string; order: string }) => {
  cashflowSortProp.value = prop
  cashflowSortOrder.value = order
  cashflowCurrentPage.value = 1
}

const sortedCashflowTransactions = computed(() =>
  sortList(filteredCashflowTransactions.value, cashflowSortProp.value, cashflowSortOrder.value)
)

const paginatedCashflowTransactions = computed(() => {
  const start = (cashflowCurrentPage.value - 1) * cashflowPageSize.value
  const end = start + cashflowPageSize.value
  return sortedCashflowTransactions.value.slice(start, end)
})

// 2. Quản lý trạng thái Dialog Thêm Giao Dịch
const addDialogVisible = ref(false)
const formRef = ref<FormInstance>()

const formModel = reactive({
  type: 'chi' as 'thu' | 'chi',
  subFundId: '',
  amount: 0,
  amountText: '',
  date: new Date().toISOString().substring(0, 10),
  requestingParty: '',
  executingParty: '',
  receivingParty: '',
  status: 'approved' as 'approved' | 'unapproved',
  purpose: '',
  note: '',
  reason: '',
  transactionCode: 'K'
})

const submitting = ref(false)

const formRules = reactive<FormRules>({
  type: [{ required: true, message: 'Vui lòng chọn loại thanh toán', trigger: 'change' }],
  subFundId: [{ required: true, message: 'Vui lòng chọn Quỹ tiền', trigger: 'change' }],
  amount: [{ required: true, message: 'Vui lòng nhập số lượng tiền', trigger: 'blur' }],
  date: [{ required: true, message: 'Vui lòng chọn ngày giao dịch', trigger: 'change' }],
  requestingParty: [{ required: true, message: 'Vui lòng nhập bên yêu cầu', trigger: 'blur' }],
  executingParty: [{ required: true, message: 'Vui lòng nhập bên thực hiện', trigger: 'blur' }],
  status: [{ required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change' }],
  purpose: [{ required: true, message: 'Vui lòng nhập mục đích giao dịch', trigger: 'blur' }]
})

const openAddDialog = () => {
  formModel.type = 'chi'
  formModel.subFundId = props.fund.subFunds[0]?.id || ''
  formModel.amount = 0
  formModel.amountText = ''
  formModel.date = new Date().toISOString().substring(0, 10)
  formModel.requestingParty = ''
  formModel.executingParty = ''
  formModel.receivingParty = ''
  formModel.status = 'approved'
  formModel.purpose = ''
  formModel.note = ''
  formModel.reason = ''
  formModel.transactionCode = 'K'
  addDialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true
      try {
        const payload = [{
          investment_id: formModel.subFundId,
          requester: formModel.requestingParty,
          executor: formModel.executingParty,
          receiver: formModel.receivingParty,
          payment_type: formModel.type,
          purpose: formModel.purpose,
          reason: formModel.reason,
          amount: formModel.amount,
          day: formModel.date,
          status: formModel.status === 'approved' ? 'APPROVED' : 'UNAPPROVED',
          notes: formModel.note,
          transaction_code: formModel.transactionCode
        }]

        await tienNgaService.addDailyPayments(payload)
        addDialogVisible.value = false
        ElMessage.success('Đã thêm mới giao dịch thành công!')

        // Emit event để parent (Index.vue) refresh lại transactions
        emit('add-transaction', {
          type: formModel.type,
          subFundId: formModel.subFundId,
          amount: formModel.amount,
          date: formModel.date,
          requestingParty: formModel.requestingParty,
          executingParty: formModel.executingParty,
          receivingParty: formModel.receivingParty,
          status: formModel.status,
          purpose: formModel.purpose,
          note: formModel.note,
          reason: formModel.reason
        })
      } catch (error: any) {
        console.error('Lỗi khi thêm giao dịch:', error)
        ElMessage.error(error.message || 'Không thể thêm giao dịch mới')
      } finally {
        submitting.value = false
      }
    }
  })
}

const detailDialogVisible = ref(false)
const selectedTransaction = ref<Transaction | null>(null)

const openDetail = (id: string) => {
  const tx = props.transactions.find(t => t.id === id)
  if (tx) {
    selectedTransaction.value = tx
    detailDialogVisible.value = true
  }
}

const handleCommand = (command: string, id: string) => {
  if (command === 'delete') {
    confirmDelete(id)
  } else if (command === 'detail') {
    openDetail(id)
  }
}

const confirmDelete = (id: string) => {
  ElMessageBox.confirm(
    'Bạn chắc chắn muốn xóa bỏ giao dịch này? Số dư các Quỹ tương ứng sẽ được cập nhật lại.',
    'Xác nhận xóa giao dịch',
    {
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy bỏ',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await tienNgaService.deleteDailyPayments([id])
      ElMessage.success('Đã xóa giao dịch thành công!')
      // Emit để parent refresh lại transactions + fund stats
      emit('delete-transaction', id)
    } catch (error: any) {
      console.error('Lỗi khi xóa giao dịch:', error)
      ElMessage.error(error.message || 'Không thể xóa giao dịch')
    }
  }).catch(() => {})
}

// 3. Quản lý Bộ Lọc & Phân Trang Truy Vấn (Tab 3)
const queryFilters = reactive({
  subFundId: 'all',
  dateRange: null as null | [string, string],
  type: 'all' as 'all' | 'thu' | 'chi',
  searchQuery: ''
})

const querySearched = ref(false)
const queryCurrentPage = ref(1)
const queryPageSize = ref(10)
const queryLoading = ref(false)
const queryTransactions = ref<Transaction[]>([])
const queryTableRef = ref<any>(null)
const selectedQueryRows = ref<Transaction[]>([])

const handleQuerySelectionChange = (rows: Transaction[]) => {
  selectedQueryRows.value = rows
}

const handleQuerySearch = async () => {
  queryLoading.value = true
  try {
    const targetIds = queryFilters.subFundId === 'all' 
      ? [props.fund.id, ...props.fund.subFunds.map(sf => sf.id)]
      : [queryFilters.subFundId]

    const paymentType = queryFilters.type !== 'all' ? queryFilters.type : undefined

    const startDate = queryFilters.dateRange ? queryFilters.dateRange[0] : undefined
    const endDate = queryFilters.dateRange ? queryFilters.dateRange[1] : undefined

    const fetchPromises = targetIds.map(id =>
      tienNgaService.getDailyPayments({ 
        investment_id: id,
        payment_type: paymentType,
        start_date: startDate,
        end_date: endDate
      })
    )

    const results = await Promise.all(fetchPromises)
    const rawPayments = results.flat()

    // Deduplicate by ID
    const seen = new Set()
    const uniquePayments = rawPayments.filter(p => {
      if (!p.id) return true
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })

    // Map raw payments to the Transaction interface
    queryTransactions.value = uniquePayments.map(p => {
      let fundId = props.fund.id
      let subFundId = ''

      if (p.investment_id === props.fund.id) {
        fundId = props.fund.id
      } else {
        const sub = props.fund.subFunds.find(sf => sf.id === p.investment_id)
        if (sub) {
          subFundId = sub.id
        } else {
          subFundId = p.investment_id || ''
        }
      }

      return {
        id: p.id || `tx-${Date.now()}-${Math.random()}`,
        fundId: fundId,
        subFundId: subFundId,
        type: p.payment_type?.toLowerCase() === 'thu' ? 'thu' : 'chi',
        requestingParty: p.requester || '',
        executingParty: p.executor || '',
        receivingParty: p.receiver || '',
        purpose: p.purpose || '',
        reason: p.reason || '',
        amount: p.amount || 0,
        status: p.status?.toLowerCase() === 'approved' ? 'approved' : 'unapproved',
        note: p.notes || '',
        date: p.day || ''
      }
    })

    querySearched.value = true
    queryCurrentPage.value = 1
  } catch (error: any) {
    console.error('Lỗi khi truy vấn giao dịch:', error)
    ElMessage.error(error.message || 'Không thể truy vấn danh sách giao dịch')
  } finally {
    queryLoading.value = false
  }
}

const filteredQueryTransactions = computed(() => {
  if (!queryFilters.searchQuery) return queryTransactions.value
  const q = queryFilters.searchQuery.toLowerCase()
  return queryTransactions.value.filter(t => {
    const matchReq = t.requestingParty.toLowerCase().includes(q)
    const matchRec = t.receivingParty.toLowerCase().includes(q)
    const matchReason = t.reason.toLowerCase().includes(q)
    const matchPurpose = t.purpose.toLowerCase().includes(q)
    const matchNote = t.note.toLowerCase().includes(q)
    return matchReq || matchRec || matchReason || matchPurpose || matchNote
  })
})

const querySortProp = ref('')
const querySortOrder = ref('')

const handleQuerySortChange = ({ prop, order }: { prop: string; order: string }) => {
  querySortProp.value = prop
  querySortOrder.value = order
  queryCurrentPage.value = 1
}

const sortedQueryTransactions = computed(() =>
  sortList(filteredQueryTransactions.value, querySortProp.value, querySortOrder.value)
)

const paginatedQueryTransactions = computed(() => {
  const start = (queryCurrentPage.value - 1) * queryPageSize.value
  const end = start + queryPageSize.value
  return sortedQueryTransactions.value.slice(start, end)
})

const queryTotals = computed(() => {
  const revenue = filteredQueryTransactions.value
    .filter(t => t.type === 'thu')
    .reduce((sum, t) => sum + t.amount, 0)
    
  const expense = filteredQueryTransactions.value
    .filter(t => t.type === 'chi')
    .reduce((sum, t) => sum + t.amount, 0)
    
  return {
    revenue,
    expense,
    balance: revenue - expense
  }
})

// 4. Helpers định dạng và icon
const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'Wallet': return Wallet
    case 'CreditCard': return CreditCard
    case 'Briefcase': return Briefcase
    case 'Lock': return Lock
    default: return Wallet
  }
}

const getSubFundName = (subFundId: string) => {
  const sub = props.fund.subFunds.find(s => s.id === subFundId)
  return sub ? sub.name : subFundId
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value) + ' VNĐ'
}

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

const getStatusType = (status: string) => {
  return status === 'active' ? 'success' : 'danger'
}

const getStatusText = (status: string) => {
  return status === 'active' ? 'Đang hoạt động' : 'Ngưng hoạt động'
}

const getTransactionStatusType = (status: string) => {
  switch (status) {
    case 'approved': return 'success'
    case 'unapproved': return 'warning'
    default: return 'info'
  }
}

const getTransactionStatusText = (status: string) => {
  switch (status) {
    case 'approved': return 'Đã chấp thuận'
    case 'unapproved': return 'Chưa chấp thuận'
    default: return status
  }
}
// 5. Xuất Excel cho tab Truy vấn dữ liệu
const exportQueryToExcel = () => {
  if (selectedQueryRows.value.length === 0) {
    ElMessage.warning('Vui lòng chọn ít nhất một giao dịch để xuất Excel')
    return
  }

  const rows = selectedQueryRows.value

  // Header row
  const headers = [
    'STT', 'Mã Giao dịch', 'Thời gian', 'Tên Quỹ', 'Bên yêu cầu',
    'Bên thực hiện', 'Bên nhận', 'Loại thanh toán', 'Mục đích', 'Lí do',
    'Số lượng', 'Trạng thái', 'Ghi chú', 'Tổng'
  ]

  // Data rows
  let runningTotal = 0
  const dataRows = rows.map((t, idx) => {
    const signedAmount = t.type === 'thu' ? t.amount : -t.amount
    runningTotal += signedAmount
    return [
      idx + 1,
      t.id,
      formatDate(t.date),
      getSubFundName(t.subFundId),
      t.requestingParty,
      t.executingParty,
      t.receivingParty,
      t.type === 'thu' ? 'Thu' : 'Chi',
      t.purpose,
      t.reason,
      t.amount,
      t.status === 'approved' ? 'Đã chấp thuận' : 'Chưa chấp thuận',
      t.note,
      runningTotal
    ]
  })

  // Total row
  const totalRevenue = rows.filter(t => t.type === 'thu').reduce((s, t) => s + t.amount, 0)
  const totalExpense = rows.filter(t => t.type === 'chi').reduce((s, t) => s + t.amount, 0)
  const totalRow = [
    '', '', '', '', '', '', '', '', '', 'TỔNG CỘNG',
    totalRevenue - totalExpense,
    '',
    '',
    totalRevenue - totalExpense
  ]

  const wsData = [headers, ...dataRows, totalRow]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Style header row
  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
    fill: { fgColor: { rgb: '4472C4' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } }
    }
  }

  for (let c = 0; c < headers.length; c++) {
    const ref = XLSX.utils.encode_cell({ r: 0, c })
    if (ws[ref]) ws[ref].s = headerStyle
  }

  // Style data rows
  const dataCellStyle = {
    border: {
      top: { style: 'thin', color: { rgb: 'D9D9D9' } },
      bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
      left: { style: 'thin', color: { rgb: 'D9D9D9' } },
      right: { style: 'thin', color: { rgb: 'D9D9D9' } }
    },
    alignment: { vertical: 'center' }
  }

  for (let rowIdx = 1; rowIdx <= dataRows.length; rowIdx++) {
    for (let c = 0; c < headers.length; c++) {
      const ref = XLSX.utils.encode_cell({ r: rowIdx, c })
      if (ws[ref]) {
        ws[ref].s = { ...dataCellStyle }
        // Format số lượng và tổng columns with number format
        if (c === 10 || c === 13) {
          ws[ref].s.numFmt = '#,##0'
          ws[ref].s.alignment = { ...dataCellStyle.alignment, horizontal: 'right' }
        }
      }
    }
  }

  // Style total row
  const totalRowIdx = dataRows.length + 1
  const totalStyle = {
    font: { bold: true, sz: 11 },
    fill: { fgColor: { rgb: 'FFF2CC' } },
    border: {
      top: { style: 'medium', color: { rgb: '000000' } },
      bottom: { style: 'medium', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } }
    },
    alignment: { vertical: 'center' }
  }

  for (let c = 0; c < headers.length; c++) {
    const ref = XLSX.utils.encode_cell({ r: totalRowIdx, c })
    if (ws[ref]) {
      ws[ref].s = { ...totalStyle }
      if (c === 10 || c === 13) {
        ws[ref].s.numFmt = '#,##0'
        ws[ref].s.alignment = { ...totalStyle.alignment, horizontal: 'right' }
      }
    }
  }

  // Column widths
  ws['!cols'] = [
    { wch: 5 },   // STT
    { wch: 18 },  // Mã GD
    { wch: 12 },  // Thời gian
    { wch: 18 },  // Tên Quỹ
    { wch: 16 },  // Bên yêu cầu
    { wch: 16 },  // Bên thực hiện
    { wch: 16 },  // Bên nhận
    { wch: 14 },  // Loại thanh toán
    { wch: 16 },  // Mục đích
    { wch: 24 },  // Lí do
    { wch: 18 },  // Số lượng
    { wch: 16 },  // Trạng thái
    { wch: 20 },  // Ghi chú
    { wch: 18 },  // Tổng
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Truy vấn tài chính')

  // Generate filename: export_tai_chinh_yyyy_mm_dd_hh_mm_ss.xlsx
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const dateStr = `${now.getFullYear()}_${pad(now.getMonth() + 1)}_${pad(now.getDate())}_${pad(now.getHours())}_${pad(now.getMinutes())}_${pad(now.getSeconds())}`
  const fileName = `export_tai_chinh_${dateStr}.xlsx`

  XLSX.writeFile(wb, fileName)
  ElMessage.success(`Đã xuất ${rows.length} giao dịch ra file ${fileName}`)
}
</script>

<style scoped>
.detail-tabs {
  border-radius: 8px;
  overflow: hidden;
  min-height: 0;
}
.detail-tabs :deep(.el-tabs__content) {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  min-height: 0;
}
.detail-tabs :deep(.el-tab-pane) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.custom-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

/* Tùy chỉnh Dark Mode */
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

/* Custom Table in Dark Mode */
html.dark .finance-detail-wrapper :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .finance-detail-wrapper :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .finance-detail-wrapper :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

html.dark .finance-detail-wrapper :deep(.el-table .el-table-fixed-column--left),
html.dark .finance-detail-wrapper :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important;
}

/* Custom Element UI input classes */
:deep(.el-input-number .el-input__inner) {
  text-align: left;
}

.highlight-select :deep(.el-select__wrapper) {
  background-color: transparent;
}

html.dark .highlight-select :deep(.el-select__wrapper) {
  background-color: #111827 !important;
  box-shadow: 0 0 0 1px #374151 inset !important;
  color: #f3f4f6;
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

.stat-card--green { border-left: 4px solid #22c55e; }
.stat-card--rose { border-left: 4px solid #f43f5e; }
.stat-card--indigo { border-left: 4px solid #6366f1; }

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

/* Cho phân trang tự xuống dòng khi có nhiều trang */
.finance-detail-wrapper :deep(.el-pagination) {
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

/* Dark Mode: Query container table */
.query-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

/* Stats slide-up transition */
.stats-slide-enter-active,
.stats-slide-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.stats-slide-enter-from {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0;
  transform: translateY(-10px);
}

.stats-slide-enter-to {
  opacity: 1;
  max-height: 200px;
  margin-bottom: 1.5rem;
  transform: translateY(0);
}

.stats-slide-leave-from {
  opacity: 1;
  max-height: 200px;
  margin-bottom: 1.5rem;
  transform: translateY(0);
}

.stats-slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0;
  transform: translateY(-10px);
}
</style>
