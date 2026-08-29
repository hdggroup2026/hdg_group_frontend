<template>
  <div class="lookup-container h-full flex flex-col">
    <!-- Filter bar -->
    <div class="flex flex-wrap justify-between items-center gap-x-4 gap-y-4 mb-4 shrink-0">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-4">
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Mục:</span>
          <el-select 
            v-model="selectedCategory" 
            placeholder="Chọn mục" 
            style="width: 160px"
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Hộ dân" value="household" />
            <el-option label="Thu mua" value="purchasing" />
          </el-select>
        </div>

        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Điểm thu mua:</span>
          <el-select 
            v-model="selectedPoints" 
            multiple
            collapse-tags
            collapse-tags-tooltip
            clearable
            placeholder="Tất cả" 
            style="width: 240px"
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option 
              v-for="point in collectionPoints" 
              :key="point.id" 
              :label="point.collection_name" 
              :value="point.id" 
            />
          </el-select>
        </div>

        <div v-if="selectedCategory === 'purchasing'" class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Mã hộ:</span>
          <el-input
            v-model="householdId"
            placeholder="Nhập mã hộ..."
            clearable
            class="w-40 custom-dark-input"
          />
        </div>

        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian:</span>
          <el-date-picker :editable="false"
            v-model="dateRange"
            :disabled="selectedCategory === 'household'"
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

        <el-button type="primary" :icon="Search" @click="handleSearch">Tìm kiếm</el-button>

        <!-- Export Invoices buttons -->
        <template v-if="hasSearched && selectedCategory === 'purchasing'">
          <el-button 
            type="success" 
            :disabled="selectedPurchases.length === 0"
            @click="exportBookSavedInvoice"
          >
            Xuất Hóa đơn Lưu sổ
          </el-button>
          <el-button 
            type="warning" 
            :disabled="selectedPurchases.length === 0"
            @click="exportPaidInvoice"
          >
            Xuất Hóa đơn đã Thanh toán
          </el-button>
          <el-button 
            type="primary" 
            :icon="Download"
            :disabled="allPurchasingData.length === 0 || selectedPoints.length === 0"
            :loading="exportingReport"
            @click="exportSummaryReport"
          >
            Xuất báo cáo
          </el-button>
        </template>
      </div>
    </div>

    <!-- Summary Statistics Cards -->
    <div v-if="hasSearched" class="summary-cards mb-4 shrink-0">
      <el-collapse v-model="activeCollapseNames" class="custom-collapse border-0">
        <el-collapse-item name="statistics" title="Thống kê tổng quan">
          <!-- Hộ dân stats -->
          <div v-if="selectedCategory === 'household'" class="grid grid-cols-1 md:grid-cols-3 gap-4 px-1">
            <div class="stat-card stat-card--red">
              <div class="stat-card__label">Tổng số tiền nợ</div>
              <div class="stat-card__value text-red-500 dark:text-red-400">{{ formatCurrency(householdStats.totalDebt) }} VNĐ</div>
            </div>
            <div class="stat-card stat-card--orange">
              <div class="stat-card__label">Tổng số tiền ứng</div>
              <div class="stat-card__value text-orange-500 dark:text-orange-400">{{ formatCurrency(householdStats.totalAdvance) }} VNĐ</div>
            </div>
            <div class="stat-card stat-card--blue">
              <div class="stat-card__label">Tổng Công nợ</div>
              <div class="stat-card__value text-blue-600 dark:text-blue-400">{{ formatCurrency(householdStats.totalBalance) }} VNĐ</div>
            </div>
          </div>

          <!-- Thu mua stats -->
          <div v-if="selectedCategory === 'purchasing'" class="space-y-4 px-1">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="stat-card stat-card--cyan">
                <div class="stat-card__label">Tổng khối lượng</div>
                <div class="stat-card__value text-cyan-600 dark:text-cyan-400">{{ formatNumber(purchasingStats.totalWeight) }} kg</div>
              </div>
              <div class="stat-card stat-card--blue">
                <div class="stat-card__label">Tổng KL thực tế</div>
                <div class="stat-card__value text-blue-600 dark:text-blue-400">{{ formatNumber(purchasingStats.totalNetWeight) }} kg</div>
              </div>
              <div class="stat-card stat-card--indigo">
                <div class="stat-card__label">Mủ khô</div>
                <div class="stat-card__value text-indigo-600 dark:text-indigo-400">{{ formatNumber(purchasingStats.totalDryRubber, 2) }} kg</div>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="stat-card stat-card--green">
                <div class="stat-card__label">Tổng thành tiền</div>
                <div class="stat-card__value text-green-600 dark:text-green-400">{{ formatCurrency(purchasingStats.totalAmount) }} VNĐ</div>
              </div>
              <div class="stat-card stat-card--emerald">
                <div class="stat-card__label">Tổng đã thanh toán</div>
                <div class="stat-card__value text-emerald-600 dark:text-emerald-400">{{ formatCurrency(purchasingStats.totalPaid) }} VNĐ</div>
              </div>
              <div class="stat-card stat-card--amber">
                <div class="stat-card__label">Tổng lưu sổ</div>
                <div class="stat-card__value text-amber-600 dark:text-amber-400">{{ formatCurrency(purchasingStats.totalBookSaved) }} VNĐ</div>
              </div>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <!-- Table Results -->
    <div v-if="hasSearched" class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
      <!-- Hộ dân table -->
      <template v-if="selectedCategory === 'household'">
        <!-- ══════════════════════════════════════════════════════════════
             MỤC 396 (29/08/2026) — BỎ CỘT GHIM, BẢNG CHỈ HIỆN TỪ 768px

             Cột ghim `fixed` chiếm chỗ CỐ ĐỊNH và không co theo màn hình.
             Trên màn 390px, mấy cột ghim cộng lại đã hết chỗ, nên vùng
             cuộn còn lại bằng 0 và vuốt ngang không có tác dụng — người
             dùng vuốt mà màn hình không nhúc nhích.

             Đã bỏ 3 cột ghim ở bảng này.
             ══════════════════════════════════════════════════════════ -->
        <el-table v-if="hienBang" :data="householdTableData" style="width: 100%" class="flex-1" height="100%" v-loading="loading" @sort-change="handleHouseholdSortChange">
          <el-table-column type="selection" width="55" />
          <el-table-column label="STT" width="52" align="center">
            <template #default="{ $index }">
              <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="code" label="Mã Hộ dân" width="86" sortable="custom" />
          <el-table-column prop="name" label="Họ và tên" width="130" />
          <el-table-column prop="purchasingPoint" label="Điểm thu mua" width="108" />
          <el-table-column prop="material" label="Nguyên liệu" width="94" align="center">
            <template #default="scope">
              <el-tag type="info" effect="light" round>
                {{ scope.row.material || 'Cao su' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="phone" label="Số điện thoại" width="94" />
          <el-table-column prop="address" label="Địa chỉ" min-width="180" />
          <el-table-column prop="bankAccount" label="STK Ngân hàng" width="108" />
          <el-table-column prop="bankName" label="Ngân hàng" min-width="158" show-overflow-tooltip />
          <el-table-column prop="status" label="Trạng thái" width="101" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.status === 'Hoạt động' ? 'success' : 'danger'" effect="light" round>
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="is_subsidized" label="Trợ giá" width="86" align="right">
            <template #default="scope">
              <span class="font-medium" :class="mauSo(scope.row.is_subsidized || 0)">{{ formatCurrency(scope.row.is_subsidized || 0) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="username" label="Username" width="108">
            <template #default="scope">
              <span class="text-blue-500">{{ scope.row.username }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="telegramGroup" label="Tên nhóm Telegram" width="166" />
          <el-table-column prop="debtAmount" label="Số tiền nợ" width="108" align="right">
            <template #default="scope">
              <span class="font-medium" :class="mauSo(scope.row.debtAmount)">{{ formatCurrency(scope.row.debtAmount) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="advanceAmount" label="Ứng tiền" width="108" align="right">
            <template #default="scope">
              <span class="font-medium" :class="mauSo(scope.row.advanceAmount)">{{ formatCurrency(scope.row.advanceAmount) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="totalDebt" label="Công nợ" width="108" align="right">
            <template #default="scope">
              <span class="font-bold" :class="mauSo(scope.row.totalDebt)">{{ formatCurrency(scope.row.totalDebt) }}</span>
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
          <div v-if="householdTableData.length > 0" class="grid grid-cols-1 gap-4">
            <div
              v-for="(row, i) in householdTableData"
              :key="row.id || row.contract_id || i"
              class="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-sm"
            >
              <div class="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
                <div class="min-w-0 break-words">
                  {{ row.code }}
                </div>
              </div>
              <div class="space-y-2 text-sm text-left">
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Họ và tên:</span>
                  <span class="text-right break-words min-w-0">
                    {{ row.name }}
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Điểm thu mua:</span>
                  <span class="text-right break-words min-w-0">
                    {{ row.purchasingPoint }}
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Nguyên liệu:</span>
                  <span class="text-right break-words min-w-0">
                    <el-tag type="info" effect="light" round>
                                    {{ row.material || 'Cao su' }}
                                  </el-tag>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Số điện thoại:</span>
                  <span class="text-right break-words min-w-0">
                    {{ row.phone }}
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Địa chỉ:</span>
                  <span class="text-right break-words min-w-0">
                    {{ row.address }}
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">STK Ngân hàng:</span>
                  <span class="text-right break-words min-w-0">
                    {{ row.bankAccount }}
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ngân hàng:</span>
                  <span class="text-right break-words min-w-0">
                    {{ row.bankName }}
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Trạng thái:</span>
                  <span class="text-right break-words min-w-0">
                    <el-tag :type="row.status === 'Hoạt động' ? 'success' : 'danger'" effect="light" round>
                                    {{ row.status }}
                                  </el-tag>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Trợ giá:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="font-medium" :class="mauSo(row.is_subsidized || 0)">{{ formatCurrency(row.is_subsidized || 0) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Username:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="text-blue-500">{{ row.username }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tên nhóm Telegram:</span>
                  <span class="text-right break-words min-w-0">
                    {{ row.telegramGroup }}
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Số tiền nợ:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="font-medium" :class="mauSo(row.debtAmount)">{{ formatCurrency(row.debtAmount) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ứng tiền:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="font-medium" :class="mauSo(row.advanceAmount)">{{ formatCurrency(row.advanceAmount) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Công nợ:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="font-bold" :class="mauSo(row.totalDebt)">{{ formatCurrency(row.totalDebt) }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
            <p class="text-base font-medium">Không có dòng nào khớp bộ lọc</p>
          </div>
        </div>
      </template>

      <!-- Thu mua table -->
      <template v-if="selectedCategory === 'purchasing'">
        <!-- ══════════════════════════════════════════════════════════════
             MỤC 396 (29/08/2026) — BỎ CỘT GHIM, BẢNG CHỈ HIỆN TỪ 768px

             Cột ghim `fixed` chiếm chỗ CỐ ĐỊNH và không co theo màn hình.
             Trên màn 390px, mấy cột ghim cộng lại đã hết chỗ, nên vùng
             cuộn còn lại bằng 0 và vuốt ngang không có tác dụng — người
             dùng vuốt mà màn hình không nhúc nhích.

             Đã bỏ 3 cột ghim ở bảng này.
             ══════════════════════════════════════════════════════════ -->
        <el-table v-if="hienBang" 
          :data="purchasingTableData" 
          style="width: 100%" 
          class="flex-1" 
          height="100%" 
          v-loading="loading"
          @selection-change="handlePurchasingSelectionChange"
          @sort-change="handlePurchasingSortChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column label="STT" width="52" align="center">
            <template #default="{ $index }">
              <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="code" label="Mã Hộ dân" width="86" sortable="custom" />
          <el-table-column prop="name" label="Họ và tên" min-width="130" />
          <el-table-column prop="purchasingPoint" label="Điểm thu mua" min-width="108" />
          <el-table-column prop="date" label="Ngày" min-width="86" />
          <el-table-column prop="subsidize" label="Trợ giá" min-width="86" align="right">
            <template #default="scope">
              <span>{{ formatCurrency(scope.row.subsidize) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="weight" label="Khối lượng" min-width="86" align="right">
            <template #default="scope">
              <span>{{ formatNumber(scope.row.weight) }} kg</span>
            </template>
          </el-table-column>
          <el-table-column prop="tare" label="Trừ bì" min-width="72" align="right">
            <template #default="scope">
              <span class="text-gray-500">{{ formatNumber(scope.row.tare) }} kg</span>
            </template>
          </el-table-column>
          <el-table-column prop="netWeight" label="KL thực tế" min-width="94" align="right">
            <template #default="scope">
              <span class="font-medium text-blue-500">{{ formatNumber(scope.row.netWeight) }} kg</span>
            </template>
          </el-table-column>
          <el-table-column prop="drc" label="Số độ" min-width="72" align="right">
            <template #default="scope">
              <span>{{ scope.row.drc }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="dryRubber" label="Mủ khô" min-width="86" align="right">
            <template #default="scope">
              <span class="font-medium">{{ formatNumber(scope.row.dryRubber, 2) }} kg</span>
            </template>
          </el-table-column>
          <el-table-column prop="unitPrice" label="Đơn giá" min-width="94" align="right">
            <template #default="scope">
              <span>{{ formatCurrency(scope.row.unitPrice) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="totalAmount" label="Thành tiền" min-width="108" align="right">
            <template #default="scope">
              <span class="font-bold" :class="mauSo(scope.row.totalAmount)">{{ formatCurrency(scope.row.totalAmount) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="paid" label="Đã thanh toán" min-width="108" align="right">
            <template #default="scope">
              <span class="font-medium" :class="mauSo(scope.row.paid)">{{ formatCurrency(scope.row.paid) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="bookSaved" label="Lưu sổ" min-width="94" align="right">
            <template #default="scope">
              <span class="font-medium" :class="mauSo(scope.row.bookSaved)">{{ formatCurrency(scope.row.bookSaved) }}</span>
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
          <div v-if="purchasingTableData.length > 0" class="grid grid-cols-1 gap-4">
            <div
              v-for="(row, i) in purchasingTableData"
              :key="row.id || row.contract_id || i"
              class="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-sm"
            >
              <div class="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
                <div class="min-w-0 break-words">
                  {{ row.code }}
                </div>
              </div>
              <div class="space-y-2 text-sm text-left">
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Họ và tên:</span>
                  <span class="text-right break-words min-w-0">
                    {{ row.name }}
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Điểm thu mua:</span>
                  <span class="text-right break-words min-w-0">
                    {{ row.purchasingPoint }}
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ngày:</span>
                  <span class="text-right break-words min-w-0">
                    {{ row.date }}
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Trợ giá:</span>
                  <span class="text-right break-words min-w-0">
                    <span>{{ formatCurrency(row.subsidize) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Khối lượng:</span>
                  <span class="text-right break-words min-w-0">
                    <span>{{ formatNumber(row.weight) }} kg</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Trừ bì:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="text-gray-500">{{ formatNumber(row.tare) }} kg</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">KL thực tế:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="font-medium text-blue-500">{{ formatNumber(row.netWeight) }} kg</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Số độ:</span>
                  <span class="text-right break-words min-w-0">
                    <span>{{ row.drc }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Mủ khô:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="font-medium">{{ formatNumber(row.dryRubber, 2) }} kg</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Đơn giá:</span>
                  <span class="text-right break-words min-w-0">
                    <span>{{ formatCurrency(row.unitPrice) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Thành tiền:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="font-bold" :class="mauSo(row.totalAmount)">{{ formatCurrency(row.totalAmount) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Đã thanh toán:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="font-medium" :class="mauSo(row.paid)">{{ formatCurrency(row.paid) }}</span>
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Lưu sổ:</span>
                  <span class="text-right break-words min-w-0">
                    <span class="font-medium" :class="mauSo(row.bookSaved)">{{ formatCurrency(row.bookSaved) }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
            <p class="text-base font-medium">Không có dòng nào khớp bộ lọc</p>
          </div>
        </div>
      </template>

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
        <p class="text-lg">Vui lòng chọn các tiêu chí và nhấn <strong>Tìm kiếm</strong> để truy xuất thông tin</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { dinhDangSo, dinhDangSoLe } from '@/utils/dinhDangSo'
import { ref, computed, onMounted, watch } from 'vue'
import { mauSo } from '@/utils/mauSo'
import { Search, Download } from '@element-plus/icons-vue'
import { tienNgaService } from '@/api/tienNgaService'
import * as XLSX from 'xlsx-js-style'
import { ElMessage, ElNotification } from 'element-plus'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'

const { laManHep, hienBang, hienThe } = dungManHep()

const selectedCategory = ref('household')
const selectedPoints = ref<string[]>([])
const dateRange = ref<[string, string] | null>(null)
const householdId = ref('')
const hasSearched = ref(false)
const loading = ref(false)

const currentPage = ref(1)
const pageSize = ref(10)
const activeCollapseNames = ref(['statistics'])

const selectedPurchases = ref<any[]>([])
const exportingReport = ref(false)
const handlePurchasingSelectionChange = (val: any[]) => {
  selectedPurchases.value = val
}

const exportBookSavedInvoice = async () => {
  if (selectedPurchases.value.length === 0) return
  
  // Filter records that have saved amount > 0
  const validRecords = selectedPurchases.value.filter(r => (r.bookSaved || 0) > 0)
  if (validRecords.length === 0) {
    ElMessage.warning('Vui lòng chọn ít nhất một bản ghi có số tiền Lưu sổ > 0')
    return
  }

  loading.value = true
  try {
    // Group records by household code
    const groups = new Map<string, any[]>()
    for (const rec of validRecords) {
      const code = rec.code || 'unknown'
      if (!groups.has(code)) {
        groups.set(code, [])
      }
      groups.get(code)!.push(rec)
    }

    ElNotification({
      title: 'Đang xuất hóa đơn',
      message: `Đang kết nối server để tải ${groups.size} hóa đơn lưu sổ...`,
      type: 'info'
    })

    for (const [code, records] of groups.entries()) {
      // Fetch customer to get cash_advance (tien_da_ung)
      const customers = await tienNgaService.getCustomers('cao su', undefined, code)
      const customer = customers.find(c => c.hoursehold_id === code) || { fullname: records[0].name, cash_advance: 0 }

      // Sort records by date ascending
      records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      // Helper date formatters
      const formatDate = (dateStr: string) => {
        if (!dateStr) return '—'
        const parts = dateStr.split('-')
        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr
      }
      const formatDayMonth = (dateStr: string) => {
        if (!dateStr) return '—'
        const parts = dateStr.split('-')
        return parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr
      }

      let timeframe = ''
      if (dateRange.value && dateRange.value.length === 2) {
        timeframe = `Từ ${formatDate(dateRange.value[0])} Đến ${formatDate(dateRange.value[1])}`
      } else {
        const dates = records.map(r => r.date).filter(Boolean)
        if (dates.length > 0) {
          dates.sort()
          timeframe = `Từ ${formatDate(dates[0])} Đến ${formatDate(dates[dates.length - 1])}`
        } else {
          timeframe = `Mùa vụ ${new Date().getFullYear()}`
        }
      }

      // Calculate totals
      const tong_kl = records.reduce((sum, r) => sum + (r.weight || 0), 0)
      const tong_kl_tt = records.reduce((sum, r) => sum + (r.netWeight || 0), 0)
      const tong_thanh_tien = records.reduce((sum, r) => sum + (r.totalAmount || 0), 0)
      const tong_thanh_tien_kht = records.reduce((sum, r) => sum + ((r.dryRubber || 0) * (r.unitPrice || 0)), 0)
      const tong_luu_so = records.reduce((sum, r) => sum + (r.bookSaved || 0), 0)
      const tong_thanh_toan = records.reduce((sum, r) => sum + (r.paid || 0), 0)

      const payload = {
        ten_kh: customer.fullname || records[0].name || 'Chưa rõ',
        ma_ho: code,
        diem_thu_mua: records[0].purchasingPoint || 'Không rõ',
        timeframe: timeframe,
        records: records.map(r => {
          const subsidize = r.subsidize || 0
          const supportPrice = r.supportPrice || ((r.unitPrice || 0) + subsidize)
          const unitPrice = r.unitPrice || (supportPrice > 0 ? Math.max(0, supportPrice - subsidize) : 0)
          return {
            ngay: formatDayMonth(r.date),
            tuan: '—',
            tro_gia: subsidize,
            kl: r.weight || 0,
            bi: r.tare || 0,
            kl_tt: r.netWeight || 0,
            so_do: r.drc || 0,
            mu_kho: r.dryRubber || 0,
            don_gia: unitPrice,
            gia_ht: supportPrice,
            thanh_tien: r.totalAmount || 0,
            thanh_tien_kht: (r.dryRubber || 0) * unitPrice,
            luu_so: r.bookSaved || 0,
            thanh_toan: r.paid || 0
          }
        }),
        tong_kl,
        tong_kl_tt,
        tong_thanh_tien,
        tong_thanh_toan,
        tong_thanh_tien_kht,
        tong_luu_so,
        tien_da_ung: customer.cash_advance || 0
      }

      // Call API
      const blob = await tienNgaService.exportSavedBill(payload)
      
      // Download PNG
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `hoa_don_luu_so_${code}_${new Date().getTime()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      ElNotification({
        title: 'Thành công',
        message: `Đã xuất Hóa đơn Lưu sổ cho Hộ dân ${customer.fullname || code} thành công!`,
        type: 'success'
      })
    }
  } catch (error: any) {
    console.error(error)
    ElMessage.error(error.message || 'Không thể xuất hóa đơn lưu sổ')
  } finally {
    loading.value = false
  }
}

const exportPaidInvoice = async () => {
  if (selectedPurchases.value.length === 0) return
  
  // Filter records that have paid amount > 0
  const validRecords = selectedPurchases.value.filter(r => (r.paid || 0) > 0)
  if (validRecords.length === 0) {
    ElMessage.warning('Vui lòng chọn ít nhất một bản ghi có số tiền Đã thanh toán > 0')
    return
  }

  loading.value = true
  try {
    // Group records by household code
    const groups = new Map<string, any[]>()
    for (const rec of validRecords) {
      const code = rec.code || 'unknown'
      if (!groups.has(code)) {
        groups.set(code, [])
      }
      groups.get(code)!.push(rec)
    }

    ElNotification({
      title: 'Đang xuất hóa đơn',
      message: `Đang kết nối server để tải ${groups.size} hóa đơn đã thanh toán...`,
      type: 'info'
    })

    for (const [code, records] of groups.entries()) {
      // Fetch customer to get cash_advance (tien_da_ung)
      const customers = await tienNgaService.getCustomers('cao su', undefined, code)
      const customer = customers.find(c => c.hoursehold_id === code) || { fullname: records[0].name, cash_advance: 0 }

      // Sort records by date ascending
      records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      // Helper date formatters
      const formatDate = (dateStr: string) => {
        if (!dateStr) return '—'
        const parts = dateStr.split('-')
        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr
      }
      const formatDayMonth = (dateStr: string) => {
        if (!dateStr) return '—'
        const parts = dateStr.split('-')
        return parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr
      }

      let timeframe = ''
      if (dateRange.value && dateRange.value.length === 2) {
        timeframe = `Từ ${formatDate(dateRange.value[0])} Đến ${formatDate(dateRange.value[1])}`
      } else {
        const dates = records.map(r => r.date).filter(Boolean)
        if (dates.length > 0) {
          dates.sort()
          timeframe = `Từ ${formatDate(dates[0])} Đến ${formatDate(dates[dates.length - 1])}`
        } else {
          timeframe = `Mùa vụ ${new Date().getFullYear()}`
        }
      }

      // Calculate totals
      const tong_kl = records.reduce((sum, r) => sum + (r.weight || 0), 0)
      const tong_kl_tt = records.reduce((sum, r) => sum + (r.netWeight || 0), 0)
      const tong_thanh_tien = records.reduce((sum, r) => sum + (r.totalAmount || 0), 0)
      const tong_thanh_toan = records.reduce((sum, r) => sum + (r.paid || 0), 0)

      const payload = {
        ten_kh: customer.fullname || records[0].name || 'Chưa rõ',
        ma_ho: code,
        diem_thu_mua: records[0].purchasingPoint || 'Không rõ',
        timeframe: timeframe,
        records: records.map(r => {
          const subsidize = r.subsidize || 0
          const supportPrice = r.supportPrice || ((r.unitPrice || 0) + subsidize)
          const unitPrice = r.unitPrice || (supportPrice > 0 ? Math.max(0, supportPrice - subsidize) : 0)
          return {
            ngay: formatDayMonth(r.date),
            tuan: '—',
            tro_gia: subsidize,
            kl: r.weight || 0,
            bi: r.tare || 0,
            kl_tt: r.netWeight || 0,
            so_do: r.drc || 0,
            mu_kho: r.dryRubber || 0,
            don_gia: unitPrice,
            gia_ht: supportPrice,
            thanh_tien: r.totalAmount || 0,
            thanh_toan: r.paid || 0
          }
        }),
        tong_kl,
        tong_kl_tt,
        tong_thanh_tien,
        tong_thanh_toan,
        tien_da_ung: customer.cash_advance || 0
      }

      // Call API
      const blob = await tienNgaService.exportPaidBill(payload)
      
      // Download PNG
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `hoa_don_da_thanh_toan_${code}_${new Date().getTime()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      ElNotification({
        title: 'Thành công',
        message: `Đã xuất Hóa đơn đã Thanh toán cho Hộ dân ${customer.fullname || code} thành công!`,
        type: 'success'
      })
    }
  } catch (error: any) {
    console.error(error)
    ElMessage.error(error.message || 'Không thể xuất hóa đơn đã thanh toán')
  } finally {
    loading.value = false
  }
}

// =========== XUẤT BÁO CÁO TỔNG HỢP (Export Summary Report) ===========
const exportSummaryReport = async () => {
  if (allPurchasingData.value.length === 0 || selectedPoints.value.length === 0) {
    ElMessage.warning('Vui lòng chọn ít nhất một Xưởng và có dữ liệu thu mua để xuất báo cáo.')
    return
  }

  exportingReport.value = true

  try {
    // Map collection point id -> name
    const cpMap = new Map<string, string>()
    for (const pt of collectionPoints.value) {
      cpMap.set(pt.id, pt.collection_name)
    }

    // Get selected points info
    const selectedCpList: { id: string; name: string }[] = []
    for (const ptId of selectedPoints.value) {
      selectedCpList.push({ id: ptId, name: cpMap.get(ptId) || 'Không rõ' })
    }

    // Group all purchasing data by collection point
    const dataByPoint = new Map<string, any[]>()
    for (const row of allPurchasingData.value) {
      // Find matching point by name
      const pointName = row.purchasingPoint || 'Không rõ'
      let matchedId = ''
      for (const cp of selectedCpList) {
        if (cp.name === pointName) {
          matchedId = cp.id
          break
        }
      }
      if (!matchedId) continue // skip if not in selected points
      if (!dataByPoint.has(matchedId)) dataByPoint.set(matchedId, [])
      dataByPoint.get(matchedId)!.push(row)
    }

    if (dataByPoint.size === 0) {
      ElMessage.warning('Không có dữ liệu phù hợp với các Xưởng đã chọn.')
      exportingReport.value = false
      return
    }

    // ===== Excel Styles (matching backend format) =====
    const headerStyle: any = {
      font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '2F5496' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      }
    }
    const totalStyle: any = {
      font: { bold: true, sz: 11 },
      fill: { fgColor: { rgb: 'FFC000' } },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      },
      alignment: { vertical: 'center' }
    }
    const cellBorder: any = {
      top: { style: 'thin', color: { rgb: 'D6DCE4' } },
      bottom: { style: 'thin', color: { rgb: 'D6DCE4' } },
      left: { style: 'thin', color: { rgb: 'D6DCE4' } },
      right: { style: 'thin', color: { rgb: 'D6DCE4' } }
    }
    const altFill: any = { fgColor: { rgb: 'D9E2F3' } }
    const numFmtVN = '#,##0'
    const numFmtKg = '#,##0.0'

    const detailHeaderStyle: any = {
      font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1F4E79' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      }
    }

    const wb = XLSX.utils.book_new()

    // Helper: format date from YYYY-MM-DD to DD/MM/YYYY
    const fmtDate = (d: string) => {
      if (!d) return ''
      const parts = d.split('-')
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
      return d
    }

    // ===== SUMMARY SHEETS (aggregated by day per Xưởng) =====
    const summaryHeaders = ['Ngày', 'Tổng Số Kg', 'Tổng Kg Trừ Bì', 'Tổng Mủ Khô', 'Tổng Thành Tiền', 'Tổng Đã Thanh Toán', 'Tổng Lưu Sổ']
    const summaryColWidths = [14, 16, 16, 16, 20, 20, 20]

    // Helper: create a styled summary sheet from data rows
    const createSummarySheet = (dataRows: any[], sheetTitle: string) => {
      // Aggregate by date
      const dayMap = new Map<string, { weight: number; tare: number; dryRubber: number; totalAmount: number; paid: number; bookSaved: number }>()
      for (const r of dataRows) {
        const day = r.date || ''
        if (!dayMap.has(day)) dayMap.set(day, { weight: 0, tare: 0, dryRubber: 0, totalAmount: 0, paid: 0, bookSaved: 0 })
        const agg = dayMap.get(day)!
        agg.weight += r.weight || 0
        agg.tare += r.netWeight || 0
        agg.dryRubber += r.dryRubber || 0
        agg.totalAmount += r.totalAmount || 0
        agg.paid += r.paid || 0
        agg.bookSaved += r.bookSaved || 0
      }

      const sortedDays = Array.from(dayMap.keys()).sort()
      const wsData: any[][] = [summaryHeaders]
      let sumWeight = 0, sumTare = 0, sumDry = 0, sumAmount = 0, sumPaid = 0, sumSaved = 0

      for (const day of sortedDays) {
        const agg = dayMap.get(day)!
        wsData.push([fmtDate(day), agg.weight, agg.tare, agg.dryRubber, agg.totalAmount, agg.paid, agg.bookSaved])
        sumWeight += agg.weight
        sumTare += agg.tare
        sumDry += agg.dryRubber
        sumAmount += agg.totalAmount
        sumPaid += agg.paid
        sumSaved += agg.bookSaved
      }

      wsData.push(['TỔNG CỘNG', sumWeight, sumTare, sumDry, sumAmount, sumPaid, sumSaved])

      const ws = XLSX.utils.aoa_to_sheet(wsData)
      ws['!cols'] = summaryColWidths.map(w => ({ wch: w }))

      const colCount = summaryHeaders.length
      for (let c = 0; c < colCount; c++) {
        const ref = XLSX.utils.encode_cell({ r: 0, c })
        if (ws[ref]) ws[ref].s = headerStyle
      }
      for (let i = 0; i < sortedDays.length; i++) {
        const rowIdx = i + 1
        const rowFill = i % 2 === 0 ? altFill : null
        for (let c = 0; c < colCount; c++) {
          const ref = XLSX.utils.encode_cell({ r: rowIdx, c })
          if (!ws[ref]) ws[ref] = { v: '', t: 's' }
          const style: any = { border: cellBorder, alignment: { vertical: 'center' } }
          if (rowFill) style.fill = rowFill
          if (c === 0) {
            style.alignment = { horizontal: 'center', vertical: 'center' }
          } else {
            style.alignment = { horizontal: 'right', vertical: 'center' }
            ws[ref].z = (c >= 1 && c <= 3) ? numFmtKg : numFmtVN
          }
          ws[ref].s = style
        }
      }
      const totalRowIdx = sortedDays.length + 1
      for (let c = 0; c < colCount; c++) {
        const ref = XLSX.utils.encode_cell({ r: totalRowIdx, c })
        if (!ws[ref]) ws[ref] = { v: '', t: 's' }
        const style: any = { ...totalStyle }
        if (c === 0) {
          style.alignment = { horizontal: 'center', vertical: 'center' }
        } else {
          style.alignment = { horizontal: 'right', vertical: 'center' }
          ws[ref].z = (c >= 1 && c <= 3) ? numFmtKg : numFmtVN
        }
        ws[ref].s = style
      }

      XLSX.utils.book_append_sheet(wb, ws, sheetTitle.substring(0, 31))
    }

    // ===== TAB TỔNG HỢP TẤT CẢ (aggregate all selected xưởng) =====
    const allSelectedRows = Array.from(dataByPoint.values()).flat()
    if (allSelectedRows.length > 0) {
      createSummarySheet(allSelectedRows, 'TỔNG HỢP TẤT CẢ')
    }

    // ===== Per-Xưởng summary sheets =====
    for (const cp of selectedCpList) {
      const rows = dataByPoint.get(cp.id)
      if (!rows || rows.length === 0) continue
      createSummarySheet(rows, cp.name)
    }

    // ===== DETAIL SHEETS (individual records per Xưởng) =====
    const detailHeaders = ['Ngày', 'Mã Hộ', 'Tên KH', 'Mã Hàng', 'KL (kg)', 'Trừ Bì (kg)', 'KL Thực Tế (kg)', 'Số Độ (%)', 'Mủ Khô (kg)', 'Đơn Giá', 'Trợ Giá', 'Thành Tiền', 'Đã TT', 'Lưu Sổ']
    const detailColWidths = [14, 12, 22, 16, 14, 14, 16, 12, 14, 14, 14, 18, 18, 18]

    for (const cp of selectedCpList) {
      const rows = dataByPoint.get(cp.id)
      if (!rows || rows.length === 0) continue

      // Sort by date then household code
      const sortedRows = [...rows].sort((a, b) => {
        const dateCompare = (a.date || '').localeCompare(b.date || '')
        if (dateCompare !== 0) return dateCompare
        return (a.code || '').localeCompare(b.code || '')
      })

      const wsData: any[][] = [detailHeaders]
      let dSumWeight = 0, dSumTare = 0, dSumActual = 0, dSumDry = 0, dSumAmount = 0, dSumPaid = 0, dSumSaved = 0

      for (const r of sortedRows) {
        const w = r.weight || 0
        const t = r.tare || 0
        const a = r.netWeight || 0
        const deg = r.drc || 0
        const dr = r.dryRubber || 0
        const up = r.unitPrice || 0
        const sub = r.subsidize || 0
        const ta = r.totalAmount || 0
        const pd = r.paid || 0
        const sv = r.bookSaved || 0

        dSumWeight += w
        dSumTare += t
        dSumActual += a
        dSumDry += dr
        dSumAmount += ta
        dSumPaid += pd
        dSumSaved += sv

        wsData.push([fmtDate(r.date), r.code || '', r.name || '', '', w, t, a, deg, dr, up, sub, ta, pd, sv])
      }

      wsData.push(['TỔNG CỘNG', '', '', '', dSumWeight, dSumTare, dSumActual, '', dSumDry, '', '', dSumAmount, dSumPaid, dSumSaved])

      const dws = XLSX.utils.aoa_to_sheet(wsData)

      // Column widths
      dws['!cols'] = detailColWidths.map(w => ({ wch: w }))

      const dColCount = detailHeaders.length
      // Header
      for (let c = 0; c < dColCount; c++) {
        const ref = XLSX.utils.encode_cell({ r: 0, c })
        if (dws[ref]) dws[ref].s = detailHeaderStyle
      }
      // Data rows
      for (let i = 0; i < sortedRows.length; i++) {
        const rowIdx = i + 1
        const rowFill = i % 2 === 0 ? altFill : null
        for (let c = 0; c < dColCount; c++) {
          const ref = XLSX.utils.encode_cell({ r: rowIdx, c })
          if (!dws[ref]) dws[ref] = { v: '', t: 's' }
          const style: any = { border: cellBorder, alignment: { vertical: 'center' } }
          if (rowFill) style.fill = rowFill
          if (c <= 3) {
            style.alignment = c !== 2
              ? { horizontal: 'center', vertical: 'center' }
              : { horizontal: 'left', vertical: 'center' }
          } else {
            style.alignment = { horizontal: 'right', vertical: 'center' }
            if (c >= 4 && c <= 8) {
              dws[ref].z = numFmtKg
            } else if (c >= 9) {
              dws[ref].z = numFmtVN
            }
          }
          dws[ref].s = style
        }
      }
      // Total row
      const dTotalRowIdx = sortedRows.length + 1
      for (let c = 0; c < dColCount; c++) {
        const ref = XLSX.utils.encode_cell({ r: dTotalRowIdx, c })
        if (!dws[ref]) dws[ref] = { v: '', t: 's' }
        const style: any = { ...totalStyle }
        if (c <= 3) {
          style.alignment = { horizontal: 'center', vertical: 'center' }
        } else {
          style.alignment = { horizontal: 'right', vertical: 'center' }
          if (c >= 4 && c <= 8) {
            dws[ref].z = numFmtKg
          } else if (c >= 9) {
            dws[ref].z = numFmtVN
          }
        }
        dws[ref].s = style
      }

      const detailSheetName = `CT ${cp.name}`.substring(0, 31)
      XLSX.utils.book_append_sheet(wb, dws, detailSheetName)
    }

    // Generate filename
    const today = new Date()
    const dateStr = `${today.getFullYear()}_${String(today.getMonth() + 1).padStart(2, '0')}_${String(today.getDate()).padStart(2, '0')}`
    const fileName = `bao_cao_tong_hop_${dateStr}.xlsx`

    XLSX.writeFile(wb, fileName)

    ElNotification({
      title: 'Xuất báo cáo thành công',
      message: `Đã xuất báo cáo tổng hợp ${selectedCpList.length} xưởng — ${fileName}`,
      type: 'success'
    })
  } catch (error: any) {
    console.error('Export summary report error:', error)
    ElMessage.error(error.message || 'Không thể xuất báo cáo tổng hợp')
  } finally {
    exportingReport.value = false
  }
}

const collectionPoints = ref<any[]>([])
const allHouseholdData = ref<any[]>([])
const allPurchasingData = ref<any[]>([])

const fetchCollectionPoints = async () => {
  try {
    const data = await tienNgaService.getCollectionPoints('Cao su')
    collectionPoints.value = data
  } catch (error: any) {
    console.error('Failed to fetch collection points:', error)
  }
}

onMounted(() => {
  fetchCollectionPoints()
})

watch(selectedCategory, (newCategory) => {
  if (newCategory === 'household') {
    dateRange.value = null
    householdId.value = ''
  }
  selectedPurchases.value = []
})

// --- Handlers ---
const handleSearch = async () => {
  loading.value = true
  hasSearched.value = true
  currentPage.value = 1
  selectedPurchases.value = []

  try {
    if (selectedCategory.value === 'household') {
      // Fetch customers without date filters
      let collectionPointId: string | undefined = undefined
      if (selectedPoints.value && selectedPoints.value.length > 0) {
        collectionPointId = selectedPoints.value.join(',')
      }
      
      const rawCustomers = await tienNgaService.getCustomers('cao su', collectionPointId)
      
      allHouseholdData.value = rawCustomers.map(item => ({
        id: item.id,
        code: item.hoursehold_id || item.id,
        name: item.fullname || 'Chưa rõ',
        purchasingPoint: item.collection_name || 'Không rõ',
        phone: item.number_phone || 'Chưa có',
        address: item.address || 'Chưa có',
        bankAccount: item.number_bank || 'Chưa có',
        bankName: item.bank_name || 'Chưa có',
        status: item.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động',
        debtAmount: item.amount_of_debt || 0,
        // Tổng cả hai loại ứng — hộ dân có thể ứng cuối mùa lẫn ứng trong tháng.
        advanceAmount: (item.cash_advance || 0) + (item.cash_advance_monthly || 0),
        totalDebt: item.total_debt || 0,
        material: item.ingredient || 'Cao su',
        is_subsidized: item.is_subsidized || 0,
        username: item.username ? (item.username.startsWith('@') ? item.username : `@${item.username}`) : 'Chưa có',
        telegramGroup: item.telegram_group || 'Chưa có'
      }))
    } else {
      // Fetch daily purchases with date range and collection point filters
      const params: any = {}
      if (dateRange.value && dateRange.value.length === 2) {
        params.start_date = dateRange.value[0]
        params.end_date = dateRange.value[1]
      }
      if (selectedPoints.value && selectedPoints.value.length > 0) {
        params.collection_point_id = selectedPoints.value.join(',')
      }
      if (householdId.value) {
        params.hoursehold_id = householdId.value.trim()
      }
      
      const rawPurchases = await tienNgaService.getDailyPurchases(params)
      allPurchasingData.value = rawPurchases.map(item => {
        const subsidize = item.is_subsidized || 0
        const supportPrice = item.subsidy_price || ((item.unit_price || 0) + subsidize)
        const unitPrice = item.unit_price || (supportPrice > 0 ? Math.max(0, supportPrice - subsidize) : 0)
        return {
          id: item.id || Math.random().toString(36).substring(2, 9),
          code: item.hoursehold_id || '',
          name: item.fullname || 'Chưa rõ',
          purchasingPoint: item.collection_name || 'Không rõ',
          date: item.day || '',
          subsidize: subsidize,
          weight: item.weight || 0,
          tare: item.tare_weight || 0,
          netWeight: item.actual_weight || 0,
          drc: item.degree || 0,
          dryRubber: item.dry_rubber || 0,
          unitPrice: unitPrice,
          supportPrice: supportPrice,
          totalAmount: item.total_amount || 0,
          paid: item.paid_amount || 0,
          bookSaved: item.saved_amount || 0
        }
      })
    }
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi truy xuất thông tin')
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (val: number) => {
  console.log(`${val} items per page`)
}

const handleCurrentChange = (val: number) => {
  console.log(`current page: ${val}`)
}

// --- Formatters ---
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

// --- Stats ---
const householdStats = computed(() => {
  const data = allHouseholdData.value
  return {
    totalDebt: data.reduce((sum, r) => sum + r.debtAmount, 0),
    totalAdvance: data.reduce((sum, r) => sum + r.advanceAmount, 0),
    totalBalance: data.reduce((sum, r) => sum + r.totalDebt, 0),
  }
})

const purchasingStats = computed(() => {
  const data = allPurchasingData.value
  return {
    totalWeight: data.reduce((sum, r) => sum + r.weight, 0),
    totalNetWeight: data.reduce((sum, r) => sum + r.netWeight, 0),
    totalDryRubber: data.reduce((sum, r) => sum + r.dryRubber, 0),
    totalAmount: data.reduce((sum, r) => sum + r.totalAmount, 0),
    totalPaid: data.reduce((sum, r) => sum + r.paid, 0),
    totalBookSaved: data.reduce((sum, r) => sum + r.bookSaved, 0),
  }
})

// --- Pagination ---
const total = computed(() => {
  if (selectedCategory.value === 'household') return allHouseholdData.value.length
  return allPurchasingData.value.length
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

const householdSortProp = ref('')
const householdSortOrder = ref('')

const handleHouseholdSortChange = ({ prop, order }: { prop: string; order: string }) => {
  householdSortProp.value = prop
  householdSortOrder.value = order
  currentPage.value = 1
}

const purchasingSortProp = ref('')
const purchasingSortOrder = ref('')

const handlePurchasingSortChange = ({ prop, order }: { prop: string; order: string }) => {
  purchasingSortProp.value = prop
  purchasingSortOrder.value = order
  currentPage.value = 1
}

const sortedHouseholdData = computed(() =>
  sortList(allHouseholdData.value, householdSortProp.value, householdSortOrder.value)
)

const sortedPurchasingData = computed(() =>
  sortList(allPurchasingData.value, purchasingSortProp.value, purchasingSortOrder.value)
)

const householdTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedHouseholdData.value.slice(start, end)
})

const purchasingTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedPurchasingData.value.slice(start, end)
})
</script>

<style scoped>
.lookup-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

/* Cho phân trang tự xuống dòng khi có nhiều trang */
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
.stat-card--red { border-left: 4px solid #ef4444; }
.stat-card--orange { border-left: 4px solid #f97316; }
.stat-card--blue { border-left: 4px solid #3b82f6; }
.stat-card--cyan { border-left: 4px solid #06b6d4; }
.stat-card--indigo { border-left: 4px solid #6366f1; }
.stat-card--green { border-left: 4px solid #22c55e; }
.stat-card--emerald { border-left: 4px solid #10b981; }
.stat-card--amber { border-left: 4px solid #f59e0b; }

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

/* Custom Collapse styling */
.custom-collapse {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}
.custom-collapse :deep(.el-collapse-item__header) {
  padding: 0 16px;
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
}
.custom-collapse :deep(.el-collapse-item__wrap) {
  padding: 16px 8px 8px;
  border-bottom: none;
  background-color: transparent;
}
.custom-collapse :deep(.el-collapse-item__content) {
  padding-bottom: 8px;
}

/* Dark mode Collapse */
html.dark .custom-collapse {
  border-color: #374151;
}
html.dark .custom-collapse :deep(.el-collapse-item__header) {
  background-color: #1f2937;
  color: #f3f4f6;
  border-bottom-color: #374151;
}
html.dark .custom-collapse :deep(.el-collapse-item__wrap) {
  border-bottom-color: #374151;
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
