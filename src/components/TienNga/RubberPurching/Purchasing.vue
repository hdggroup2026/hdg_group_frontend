<template>
  <div class="purchasing-container h-full flex flex-col">
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
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
          <el-input
            v-model="searchQuery"
            placeholder="Nhập từ khóa..."
            :prefix-icon="Search"
            clearable
            class="w-64 custom-dark-input"
          />
        </div>
      </div>
      <div class="flex items-center gap-2">
        <el-button :icon="Refresh" circle @click="fetchDailyPurchases" :loading="loading" />
        <el-button type="primary" @click="dialogVisible = true">Thêm Thu mua</el-button>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
      <!-- ══════════════════════════════════════════════════════════════
           MỤC 396 (29/08/2026) — BỎ CỘT GHIM, BẢNG CHỈ HIỆN TỪ 768px

           Cột ghim `fixed` chiếm chỗ CỐ ĐỊNH và không co theo màn hình.
           Trên màn 390px, mấy cột ghim cộng lại đã hết chỗ, nên vùng
           cuộn còn lại bằng 0 và vuốt ngang không có tác dụng — người
           dùng vuốt mà màn hình không nhúc nhích.

           Đã bỏ 4 cột ghim ở bảng này.
           ══════════════════════════════════════════════════════════ -->
      <el-table v-if="hienBang" :data="tableData" style="width: 100%" class="flex-1" height="100%" v-loading="loading" @sort-change="handleSortChange">
        <!-- Fixed Columns -->
        <el-table-column type="selection" width="55" />
        <el-table-column label="STT" width="52" align="center">
          <template #default="{ $index }">
            <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="Mã Hộ dân" width="86" sortable="custom" />

        <!-- Scrollable Columns -->
        <el-table-column prop="name" label="Họ và tên" min-width="130" />
        <el-table-column prop="purchasingPoint" label="Điểm thu mua" min-width="108" />
        <el-table-column prop="date" label="Ngày" min-width="86" />
        <el-table-column prop="productCode" label="Mã hàng" min-width="101" align="center" />
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
        <el-table-column prop="supportPrice" label="Giá hỗ trợ" min-width="86" align="right">
          <template #default="scope">
            <span>{{ formatCurrency(scope.row.supportPrice) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="Thành tiền" min-width="108" align="right">
          <template #default="scope">
            <span class="font-bold" :class="mauSo(scope.row.totalAmount)">{{ formatCurrency(scope.row.totalAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="paidAmount" label="Đã thanh toán" min-width="108" align="right">
          <template #default="scope">
            <span class="font-medium" :class="mauSo(scope.row.paidAmount || 0)">{{ formatCurrency(scope.row.paidAmount || 0) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="savedAmount" label="Lưu sổ" min-width="108" align="right">
          <template #default="scope">
            <span class="font-medium" :class="mauSo(scope.row.savedAmount || 0)">{{ formatCurrency(scope.row.savedAmount || 0) }}</span>
          </template>
        </el-table-column>

        <!-- Fixed Right Operations -->
        <el-table-column label="Thao tác" width="60" align="center">
          <template #default="scope">
            <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, scope.row)">
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
        <div v-if="tableData.length > 0" class="grid grid-cols-1 gap-4">
          <div
            v-for="(row, i) in (tableData as any[])"
            :key="row.id || row.contract_id || i"
            class="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
              <div class="min-w-0 break-words">
                {{ row.code }}
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
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Mã hàng:</span>
                <span class="text-right break-words min-w-0">
                  {{ row.productCode }}
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
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Giá hỗ trợ:</span>
                <span class="text-right break-words min-w-0">
                  <span>{{ formatCurrency(row.supportPrice) }}</span>
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
                  <span class="font-medium" :class="mauSo(row.paidAmount || 0)">{{ formatCurrency(row.paidAmount || 0) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Lưu sổ:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-medium" :class="mauSo(row.savedAmount || 0)">{{ formatCurrency(row.savedAmount || 0) }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
          <p class="text-base font-medium">Không có dòng nào khớp bộ lọc</p>
        </div>
      </div>

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

    <!-- Modal Thêm Thu mua -->
    <el-dialog
      v-model="dialogVisible"
      title="THÊM THU MUA &amp; PHIẾU THU CHI"
      class="custom-dark-dialog"
      width="900px"
      destroy-on-close
      align-center
    >
      <div class="max-h-[70vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form :model="purchaseForm" label-width="180px" class="mt-2 compact-form">
          <!-- PHẦN 1: THU MUA -->
          <div class="mb-5 pb-3 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-base font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              1. Thu mua
            </h3>

            <!-- Thông tin chung -->
            <div class="mb-4">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5 pl-3 border-l-2 border-blue-400">
                Thông tin chung
              </h4>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Mã Hộ" required>
                    <el-input v-model="purchaseForm.householdCode" placeholder="Nhập mã hộ..." />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Tên Hộ Dân">
                    <el-input :model-value="computedHouseholdName" disabled placeholder="Tự động hiển thị..." />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Điểm thu mua" required>
                    <el-select v-model="purchaseForm.purchasingPoint" placeholder="Chọn điểm thu mua" class="w-full highlight-select" style="width: 100%">
                      <el-option 
                        v-for="point in collectionPoints" 
                        :key="point.id" 
                        :label="point.collection_name" 
                        :value="point.collection_name" 
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Mã hàng" required>
                    <el-input v-model="purchaseForm.productCode" disabled placeholder="Tự động tạo..." />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Ngày" required>
                    <el-date-picker :editable="false"
                      v-model="purchaseForm.day"
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

            <!-- Khối lượng & Chất lượng -->
            <div class="mb-4">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5 pl-3 border-l-2 border-emerald-400">
                Khối lượng &amp; Chất lượng
              </h4>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Khối lượng">
                    <el-input v-model="purchaseForm.weight" placeholder="Nhập khối lượng (kg)..." />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Trừ bì">
                    <el-input v-model="purchaseForm.tare" placeholder="Nhập trừ bì (kg)..." />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="KL Thực tế">
                    <el-input :model-value="computedNetWeight" disabled />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Số độ">
                    <el-input v-model="purchaseForm.drc" placeholder="Nhập số độ..." />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Mủ khô">
                    <el-input :model-value="computedDryRubber" disabled />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <!-- Đơn giá & Thành tiền -->
            <div class="mb-4">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5 pl-3 border-l-2 border-violet-400">
                Đơn giá &amp; Thành tiền
              </h4>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Đơn giá">
                    <el-input 
                      v-model="purchaseForm.unitPrice" 
                      placeholder="Nhập đơn giá..."
                      :formatter="(value) => !value ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                      :parser="(value) => value.replace(/\./g, '')"
                    >
                      <template #suffix>
                        <span class="text-xs text-gray-400">VNĐ</span>
                      </template>
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Trợ giá">
                    <el-input 
                      v-model="purchaseForm.isSubsidized" 
                      placeholder="Nhập trợ giá..."
                      :formatter="(value) => !value ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                      :parser="(value) => value.replace(/\./g, '')"
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
                  <el-form-item label="Giá hỗ trợ">
                    <el-input :model-value="computedSupportPrice > 0 ? formatCurrency(computedSupportPrice) : ''" disabled placeholder="Tự động tính...">
                      <template #suffix>
                        <span class="text-xs text-gray-400">VNĐ</span>
                      </template>
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Thành tiền">
                    <el-input :model-value="computedTotalAmount" disabled />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <!-- Thanh toán & Lưu sổ -->
            <div class="mb-2">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5 pl-3 border-l-2 border-rose-400">
                Thanh toán &amp; Lưu sổ
              </h4>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Lưu sổ (Ghi nợ)">
                    <el-switch v-model="purchaseForm.saveToBook" active-text="Có" inactive-text="Không" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Đã thanh toán">
                    <el-input 
                      v-model="purchaseForm.paidAmount" 
                      @input="handlePaidAmountInput" 
                      placeholder="Nhập số tiền đã thanh toán..."
                      :formatter="formatInputCurrency"
                      :parser="parseInputCurrency"
                    >
                      <template #suffix>
                        <span class="text-xs text-gray-400">VNĐ</span>
                      </template>
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Lưu sổ">
                    <el-input 
                      v-model="purchaseForm.savedAmount" 
                      @input="handleSavedAmountInput" 
                      placeholder="Nhập số tiền lưu sổ..."
                      :formatter="formatInputCurrency"
                      :parser="parseInputCurrency"
                    >
                      <template #suffix>
                        <span class="text-xs text-gray-400">VNĐ</span>
                      </template>
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </div>

          <!-- PHẦN 2: GIAO DỊCH TÀI CHÍNH (Chỉ hiển thị khi Lưu sổ = false) -->
          <div v-if="!purchaseForm.saveToBook" class="mb-2">
            <h3 class="text-base font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-green-500 rounded-full"></span>
              2. Giao dịch tài chính
            </h3>

            <!-- Phân loại giao dịch -->
            <div class="mb-4">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5 pl-3 border-l-2 border-green-400">
                Phân loại giao dịch
              </h4>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Quỹ tiền" required>
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
                  <el-form-item label="Thời gian" required>
                    <el-date-picker :editable="false" 
                      v-model="purchaseForm.date" 
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
                      v-model="purchaseForm.type" 
                      active-value="chi" 
                      inactive-value="thu" 
                      active-text="Chi tiền" 
                      inactive-text="Thu tiền" 
                      @change="handlePaymentTypeChange" 
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Mã giao dịch" required>
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
                  <el-form-item label="Số tiền giao dịch">
                    <el-input 
                      :model-value="formatInputCurrency(purchaseForm.paidAmount)" 
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
                  <el-form-item label="Bên yêu cầu" required>
                    <el-input v-model="purchaseForm.requestingParty" placeholder="Nhập bên yêu cầu..." />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Bên thực hiện" required>
                    <el-input v-model="purchaseForm.executingParty" placeholder="Nhập bên thực hiện..." />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Bên nhận" required>
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
                  <el-form-item label="Trạng thái" required>
                    <el-select v-model="purchaseForm.status" placeholder="Chọn trạng thái" class="w-full highlight-select" style="width: 100%">
                      <el-option label="Đã chấp thuận" value="approved" />
                      <el-option label="Chưa chấp thuận" value="unapproved" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Mục đích" required>
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
                  <el-form-item label="Ghi chú">
                    <el-input v-model="purchaseForm.note" placeholder="Nhập ghi chú thêm..." />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="24">
                  <el-form-item label="Lí do">
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
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">Hủy</el-button>
          <el-button type="primary" @click="submitForm">
            Xác nhận
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Modal Chỉnh sửa Thu mua -->
    <el-dialog
      v-model="editDialogVisible"
      title="CHỈNH SỬA THU MUA"
      class="custom-dark-dialog"
      width="900px"
      destroy-on-close
      align-center
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form :model="editForm" label-width="180px" class="mt-2 compact-form">
          <!-- PHẦN 1: THÔNG TIN CHUNG -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin chung
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã Hộ">
                  <el-input v-model="editForm.code" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Họ và tên">
                  <el-input v-model="editForm.name" placeholder="Nhập họ và tên..." />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Điểm thu mua">
                  <el-select v-model="editForm.purchasingPoint" placeholder="Chọn điểm thu mua" class="w-full highlight-select" style="width: 100%">
                    <el-option 
                      v-for="point in collectionPoints" 
                      :key="point.id" 
                      :label="point.collection_name" 
                      :value="point.collection_name" 
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ngày">
                  <el-date-picker :editable="false"
                    v-model="editForm.date"
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

          <!-- PHẦN 2: KHỐI LƯỢNG & CHẤT LƯỢNG -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Khối lượng &amp; Chất lượng
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Khối lượng">
                  <el-input v-model="editForm.weight" placeholder="Nhập khối lượng (kg)..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Trừ bì">
                  <el-input v-model="editForm.tare" placeholder="Nhập trừ bì (kg)..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="KL Thực tế">
                  <el-input :model-value="editComputedNetWeight" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Số độ">
                  <el-input v-model="editForm.drc" placeholder="Nhập số độ..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mủ khô">
                  <el-input :model-value="editComputedDryRubber" disabled />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 3: ĐƠN GIÁ & THÀNH TIỀN -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-violet-650 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
              Đơn giá &amp; Thành tiền
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Đơn giá">
                  <el-input 
                    v-model="editForm.unitPrice" 
                    placeholder="Nhập đơn giá..."
                    :formatter="(value) => !value ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                    :parser="(value) => value.replace(/\./g, '')"
                  >
                    <template #suffix>
                      <span class="text-xs text-gray-400">VNĐ</span>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Trợ giá">
                  <el-input 
                    v-model="editForm.subsidize" 
                    placeholder="Nhập trợ giá..."
                    :formatter="(value) => !value ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                    :parser="(value) => value.replace(/\./g, '')"
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
                <el-form-item label="Giá hỗ trợ">
                  <el-input :model-value="editComputedSupportPrice > 0 ? formatCurrency(editComputedSupportPrice) : ''" disabled placeholder="Tự động tính...">
                    <template #suffix>
                      <span class="text-xs text-gray-400">VNĐ</span>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Thành tiền">
                  <el-input :model-value="editComputedTotalAmount" disabled />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 4: THANH TOÁN & LƯU SỔ -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-rose-500 rounded-full"></span>
              Thanh toán &amp; Lưu sổ
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Đã thanh toán">
                  <el-input 
                    v-model="editForm.paidAmount" 
                    @input="handleEditPaidAmountInput" 
                    placeholder="Nhập số tiền đã thanh toán..."
                    :formatter="formatInputCurrency"
                    :parser="parseInputCurrency"
                  >
                    <template #suffix>
                      <span class="text-xs text-gray-400">VNĐ</span>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Lưu sổ">
                  <el-input 
                    v-model="editForm.savedAmount" 
                    @input="handleEditSavedAmountInput" 
                    placeholder="Nhập số tiền lưu sổ..."
                    :formatter="formatInputCurrency"
                    :parser="parseInputCurrency"
                  >
                    <template #suffix>
                      <span class="text-xs text-gray-400">VNĐ</span>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">Hủy</el-button>
          <el-button type="primary" @click="submitEditForm">
            Cập nhật
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Modal Chi tiết Thu mua -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT THU MUA"
      class="custom-dark-dialog"
      width="850px"
      destroy-on-close
      align-center
    >
      <div v-if="detailData" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto overflow-x-hidden">
        <!-- Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <el-avatar :size="64" class="bg-blue-100 dark:bg-blue-900">
            <span class="text-xl font-bold text-blue-600 dark:text-blue-400">
              {{ detailData.name ? detailData.name.charAt(0).toUpperCase() : 'T' }}
            </span>
          </el-avatar>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Thu mua</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {{ detailData.name }}
              <span class="text-gray-400 dark:text-gray-500 font-medium">({{ detailData.code }})</span>
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <span class="text-gray-600 dark:text-gray-400 font-semibold">{{ detailData.purchasingPoint || 'Chưa rõ điểm thu mua' }}</span>
              <span class="text-gray-400 dark:text-gray-500">|</span>
              <span class="text-gray-600 dark:text-gray-400">{{ detailData.date }}</span>
              <span class="text-gray-400 dark:text-gray-500">|</span>
              <span class="text-blue-500 dark:text-blue-400 font-semibold">{{ detailData.productCode }}</span>
            </div>
          </div>
        </div>

        <!-- 1. THÔNG TIN CƠ BẢN -->
        <div>
          <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            Thông tin cơ bản
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã Hộ dân</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-100">{{ detailData.code }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Họ và tên</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-100">{{ detailData.name }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Điểm thu mua</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ detailData.purchasingPoint || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã hàng</div>
              <div class="text-sm font-bold text-blue-600 dark:text-blue-400">{{ detailData.productCode || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ detailData.date || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Trợ giá</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatCurrency(detailData.subsidize || 0) }} VNĐ</div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 2. KHỐI LƯỢNG & CHẤT LƯỢNG -->
        <div>
          <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
            Khối lượng & Chất lượng
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Khối lượng</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatNumber(detailData.weight || 0) }} kg</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Trừ bì</div>
              <div class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ formatNumber(detailData.tare || 0) }} kg</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">KL thực tế</div>
              <div class="text-sm font-bold text-blue-500 dark:text-blue-400">{{ formatNumber(detailData.netWeight || 0) }} kg</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số độ</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ detailData.drc || 0 }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mủ khô</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-100">{{ formatNumber(detailData.dryRubber || 0, 2) }} kg</div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 3. GIÁ & THANH TOÁN -->
        <div>
          <h4 class="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-rose-500 rounded-full"></span>
            Giá & Thanh toán
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Đơn giá</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatCurrency(detailData.unitPrice || 0) }} VNĐ</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Giá hỗ trợ</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatCurrency(detailData.supportPrice || 0) }} VNĐ</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Thành tiền</div>
              <div class="text-sm font-bold text-green-500 dark:text-green-400">{{ formatCurrency(detailData.totalAmount || 0) }} VNĐ</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Đã thanh toán</div>
              <div class="text-sm font-bold text-orange-500 dark:text-orange-400">{{ formatCurrency(detailData.paidAmount || 0) }} VNĐ</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Lưu sổ</div>
              <div class="text-sm font-bold text-gray-600 dark:text-gray-400">{{ formatCurrency(detailData.savedAmount || 0) }} VNĐ</div>
            </div>
          </div>
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
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { mauSo } from '@/utils/mauSo'
import { MoreFilled, Search, Refresh } from '@element-plus/icons-vue'
import { ElNotification, ElMessage, ElMessageBox } from 'element-plus'
import { tienNgaService } from '@/api/tienNgaService'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'

const { laManHep, hienBang, hienThe } = dungManHep()

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
const dateRange = ref<[string, string] | null>(getInitialDateRange())
const searchQuery = ref('')
const loading = ref(false)
const collectionPoints = ref<any[]>([])

const dialogVisible = ref(false)
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

const subFunds = ref<any[]>([])

const purchaseForm = reactive({
  householdCode: '',
  purchasingPoint: '',
  subsidize: '',
  weight: '',
  tare: '',
  drc: '',
  unitPrice: '',
  saveToBook: true,
  productCode: '',
  day: formatDate(new Date()),
  isSubsidized: '',
  paidAmount: '',
  savedAmount: '',
  // Finance fields
  subFundId: '',
  date: formatDate(new Date()),
  status: 'approved',
  requestingParty: '',
  executingParty: '',
  receivingParty: '',
  purpose: '',
  note: '',
  reason: '',
  financeTransactionCode: 'MN',
  type: 'chi'
})

const resetForm = () => {
  purchaseForm.householdCode = ''
  purchaseForm.purchasingPoint = ''
  purchaseForm.subsidize = ''
  purchaseForm.weight = ''
  purchaseForm.tare = ''
  purchaseForm.drc = ''
  purchaseForm.unitPrice = ''
  purchaseForm.saveToBook = true
  purchaseForm.productCode = ''
  purchaseForm.day = formatDate(new Date())
  purchaseForm.isSubsidized = ''
  purchaseForm.paidAmount = ''
  purchaseForm.savedAmount = ''
  // Reset finance fields
  purchaseForm.subFundId = ''
  purchaseForm.date = formatDate(new Date())
  purchaseForm.status = 'approved'
  purchaseForm.requestingParty = ''
  purchaseForm.executingParty = ''
  purchaseForm.receivingParty = ''
  purchaseForm.purpose = ''
  purchaseForm.note = ''
  purchaseForm.reason = ''
  purchaseForm.financeTransactionCode = 'MN'
  purchaseForm.type = 'chi'
}

const submitForm = async () => {
  if (!purchaseForm.householdCode) {
    ElMessage.warning('Vui lòng nhập Mã Hộ')
    return
  }
  if (!purchaseForm.purchasingPoint) {
    ElMessage.warning('Vui lòng chọn Điểm thu mua')
    return
  }
  if (!purchaseForm.productCode) {
    ElMessage.warning('Vui lòng nhập Mã hàng')
    return
  }
  if (!purchaseForm.day) {
    ElMessage.warning('Vui lòng chọn Ngày')
    return
  }

  // Validate finance fields if saveToBook is false
  if (!purchaseForm.saveToBook) {
    if (!purchaseForm.subFundId) {
      ElMessage.warning('Vui lòng chọn Quỹ tiền')
      return
    }
    if (!purchaseForm.date) {
      ElMessage.warning('Vui lòng chọn Ngày giao dịch')
      return
    }
    if (!purchaseForm.requestingParty) {
      ElMessage.warning('Vui lòng nhập Bên yêu cầu')
      return
    }
    if (!purchaseForm.executingParty) {
      ElMessage.warning('Vui lòng nhập Bên thực hiện')
      return
    }
    if (!purchaseForm.receivingParty) {
      ElMessage.warning('Vui lòng nhập Bên nhận')
      return
    }
    if (!purchaseForm.purpose) {
      ElMessage.warning('Vui lòng nhập Mục đích giao dịch')
      return
    }
  }

  loading.value = true
  try {
    const matchedPoint = collectionPoints.value.find(p => p.collection_name === purchaseForm.purchasingPoint)
    const matchedPointId = matchedPoint ? matchedPoint.id : null

    const w = parseFloat(parseFloatInput(purchaseForm.weight).toFixed(2))
    const t = parseFloat(parseFloatInput(purchaseForm.tare).toFixed(2))
    const net = parseFloat((w - t).toFixed(2))
    const drc = parseFloat(parseFloatInput(purchaseForm.drc).toFixed(2))
    const dry = parseFloat((net * drc / 100).toFixed(2))
    const unitPrice = parseFloat(parseFloatInput(purchaseForm.unitPrice).toFixed(2))
    const isSubsidized = parseFloat(parseFloatInput(purchaseForm.isSubsidized).toFixed(2))
    const subsidyPrice = parseFloat((unitPrice + isSubsidized).toFixed(2))
    const totalAmount = rawTotalAmount.value
    const paidAmount = parseFloat(parseNumberString(purchaseForm.paidAmount).toFixed(2))

    const payload = {
      hoursehold_id: purchaseForm.householdCode,
      collection_point_id: matchedPointId,
      product_code: purchaseForm.productCode,
      week: getWeekNumber(purchaseForm.day),
      day: purchaseForm.day,
      is_subsidized: isSubsidized,
      weight: w,
      tare_weight: t,
      actual_weight: net,
      degree: drc,
      dry_rubber: dry,
      unit_price: unitPrice,
      subsidy_price: subsidyPrice,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      saved_amount: parseFloat(parseNumberString(purchaseForm.savedAmount).toFixed(2))
    }

    const response = await tienNgaService.addDailyPurchases([payload])

    if (response && response.length > 0) {
      // 2. Ghi nhận Giao dịch tài chính (nếu không lưu sổ)
      if (!purchaseForm.saveToBook && paidAmount > 0) {
        const paymentPayload = [{
          investment_id: purchaseForm.subFundId,
          requester: purchaseForm.requestingParty,
          executor: purchaseForm.executingParty,
          receiver: purchaseForm.receivingParty,
          payment_type: purchaseForm.type,
          purpose: purchaseForm.purpose,
          reason: purchaseForm.reason,
          amount: paidAmount,
          day: purchaseForm.date,
          status: purchaseForm.status === 'approved' ? 'APPROVED' : 'UNAPPROVED',
          notes: purchaseForm.note,
          transaction_code: purchaseForm.financeTransactionCode
        }]
        
        await tienNgaService.addDailyPayments(paymentPayload)
      }

      const newPurch = response[0]
      allData.value.unshift({
        id: newPurch.id || Math.random().toString(36).substring(2, 9),
        code: newPurch.hoursehold_id || '',
        name: newPurch.fullname || 'Chưa rõ',
        purchasingPoint: newPurch.collection_name || purchaseForm.purchasingPoint || 'Không rõ',
        date: newPurch.day || '',
        subsidize: newPurch.is_subsidized || 0,
        weight: newPurch.weight || 0,
        tare: newPurch.tare_weight || 0,
        netWeight: newPurch.actual_weight || 0,
        drc: newPurch.degree || 0,
        dryRubber: newPurch.dry_rubber || 0,
        unitPrice: newPurch.unit_price || 0,
        supportPrice: newPurch.subsidy_price || 0,
        totalAmount: newPurch.total_amount || 0,
        paidAmount: newPurch.paid_amount || 0,
        savedAmount: newPurch.saved_amount || 0,
        productCode: newPurch.product_code || ''
      })

      ElNotification({
        title: 'Thành công',
        message: 'Đã thêm Thu mua mới thành công!',
        type: 'success',
      })

      resetForm()
      dialogVisible.value = false
    }
  } catch (error: any) {
    ElMessage.error(error.message || 'Không thể thêm thông tin thu mua mới')
  } finally {
    loading.value = false
  }
}

const customersList = ref<any[]>([])

const fetchCustomers = async () => {
  try {
    const data = await tienNgaService.getCustomers('cao su')
    customersList.value = data
  } catch (error: any) {
    console.error('Failed to fetch customers:', error)
  }
}

const matchedCustomer = computed(() => {
  const code = purchaseForm.householdCode.trim().toUpperCase()
  if (!code) return null
  return customersList.value.find(c => 
    (c.hoursehold_id && c.hoursehold_id.toUpperCase() === code) || 
    (c.id && c.id.toUpperCase() === code)
  ) || null
})

const computedHouseholdName = computed(() => {
  return matchedCustomer.value ? matchedCustomer.value.fullname : ''
})

watch(
  () => matchedCustomer.value,
  (customer) => {
    if (customer) {
      purchaseForm.isSubsidized = customer.is_subsidized !== null && customer.is_subsidized !== undefined 
        ? String(customer.is_subsidized) 
        : ''
      if (customer.collection_point_id) {
        const matchedPoint = collectionPoints.value.find(p => p.id === customer.collection_point_id)
        if (matchedPoint) {
          purchaseForm.purchasingPoint = matchedPoint.collection_name
        }
      }
    } else {
      purchaseForm.isSubsidized = ''
      purchaseForm.purchasingPoint = ''
    }
  }
)

const computedNetWeight = computed(() => {
  const w = parseFloat(parseFloatInput(purchaseForm.weight).toFixed(2))
  const t = parseFloat(parseFloatInput(purchaseForm.tare).toFixed(2))
  const net = parseFloat((w - t).toFixed(2))
  return net > 0 ? `${formatNumber(net, 2)} kg` : ''
})

const computedDryRubber = computed(() => {
  const w = parseFloat(parseFloatInput(purchaseForm.weight).toFixed(2))
  const t = parseFloat(parseFloatInput(purchaseForm.tare).toFixed(2))
  const drc = parseFloat(parseFloatInput(purchaseForm.drc).toFixed(2))
  const net = parseFloat((w - t).toFixed(2))
  const dry = parseFloat((net * drc / 100).toFixed(2))
  return dry > 0 ? `${formatNumber(dry, 2)} kg` : ''
})

const computedSupportPrice = computed(() => {
  const price = parseFloat(parseFloatInput(purchaseForm.unitPrice).toFixed(2))
  const subsidy = parseFloat(parseFloatInput(purchaseForm.isSubsidized).toFixed(2))
  return parseFloat((price + subsidy).toFixed(2))
})

const parseFloatInput = (val: string | number | null | undefined) => {
  if (val === undefined || val === null || val === '') return 0
  if (typeof val === 'number') return val
  let str = String(val).trim()
  if (str.includes(',') && str.includes('.')) {
    if (str.indexOf('.') < str.indexOf(',')) {
      str = str.replace(/\./g, '')
    }
  }
  str = str.replace(/,/g, '.')
  return parseFloat(str) || 0
}

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

const formatInputCurrency = (value: string | number) => {
  if (value === undefined || value === null || value === '') return ''
  let str = String(value)
  let parts = str.split('.')
  if (parts[0]) {
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }
  return parts.join(',')
}

const parseInputCurrency = (value: string) => {
  if (!value) return ''
  return value.replace(/\./g, '').replace(/,/g, '.')
}

const rawTotalAmount = computed(() => {
  const w = parseFloat(parseFloatInput(purchaseForm.weight).toFixed(2))
  const t = parseFloat(parseFloatInput(purchaseForm.tare).toFixed(2))
  const drc = parseFloat(parseFloatInput(purchaseForm.drc).toFixed(2))
  const net = parseFloat((w - t).toFixed(2))
  const supportPrice = computedSupportPrice.value
  return parseFloat((net * (drc / 100) * supportPrice).toFixed(2))
})

const computedTotalAmount = computed(() => {
  const total = rawTotalAmount.value
  return total > 0 ? `${formatCurrency(total)} VNĐ` : ''
})

watch(
  () => [rawTotalAmount.value, purchaseForm.saveToBook],
  () => {
    const total = rawTotalAmount.value
    const toBook = purchaseForm.saveToBook
    if (toBook) {
      purchaseForm.savedAmount = total > 0 ? String(total) : ''
      purchaseForm.paidAmount = '0'
    } else {
      purchaseForm.paidAmount = total > 0 ? String(total) : ''
      purchaseForm.savedAmount = '0'
    }
  },
  { immediate: true }
)

const handlePaidAmountInput = (val: string) => {
  const paid = parseNumberString(val)
  const total = rawTotalAmount.value
  purchaseForm.savedAmount = String(Math.max(0, total - paid))
}

const handleSavedAmountInput = (val: string) => {
  const saved = parseNumberString(val)
  const total = rawTotalAmount.value
  purchaseForm.paidAmount = String(Math.max(0, total - saved))
}

const handleSizeChange = (val: number) => {
  console.log(`${val} items per page`)
  // Call API to fetch new data here
}

const handleCurrentChange = (val: number) => {
  console.log(`current page: ${val}`)
  // Call API to fetch new data here
}

const editDialogVisible = ref(false)
const editingRow = ref<any>(null)
const detailDialogVisible = ref(false)
const detailData = ref<any>(null)
const editForm = reactive({
  code: '',
  name: '',
  purchasingPoint: '',
  date: '',
  subsidize: '',
  weight: '',
  tare: '',
  drc: '',
  unitPrice: '',
  supportPrice: '',
  paidAmount: '',
  savedAmount: ''
})

const editComputedNetWeight = computed(() => {
  const w = parseFloat(parseFloatInput(editForm.weight).toFixed(2))
  const t = parseFloat(parseFloatInput(editForm.tare).toFixed(2))
  const net = parseFloat((w - t).toFixed(2))
  return net > 0 ? `${formatNumber(net, 2)} kg` : ''
})

const editComputedDryRubber = computed(() => {
  const w = parseFloat(parseFloatInput(editForm.weight).toFixed(2))
  const t = parseFloat(parseFloatInput(editForm.tare).toFixed(2))
  const drc = parseFloat(parseFloatInput(editForm.drc).toFixed(2))
  const net = parseFloat((w - t).toFixed(2))
  const dry = parseFloat((net * drc / 100).toFixed(2))
  return dry > 0 ? `${formatNumber(dry, 2)} kg` : ''
})

const editComputedSupportPrice = computed(() => {
  const price = parseFloat(parseFloatInput(editForm.unitPrice).toFixed(2))
  const subsidize = parseFloat(parseFloatInput(editForm.subsidize).toFixed(2))
  return parseFloat((price + subsidize).toFixed(2))
})

const rawEditTotalAmount = computed(() => {
  const w = parseFloat(parseFloatInput(editForm.weight).toFixed(2))
  const t = parseFloat(parseFloatInput(editForm.tare).toFixed(2))
  const drc = parseFloat(parseFloatInput(editForm.drc).toFixed(2))
  const net = parseFloat((w - t).toFixed(2))
  const supportPrice = editComputedSupportPrice.value
  return parseFloat((net * (drc / 100) * supportPrice).toFixed(2))
})

const editComputedTotalAmount = computed(() => {
  const total = rawEditTotalAmount.value
  return total > 0 ? `${formatCurrency(total)} VNĐ` : ''
})

let isInitializingEditForm = false

watch(
  () => rawEditTotalAmount.value,
  (newTotal) => {
    if (isInitializingEditForm) return
    const paid = parseNumberString(editForm.paidAmount)
    editForm.savedAmount = String(Math.max(0, newTotal - paid))
  }
)

const handleEditPaidAmountInput = (val: string) => {
  const paid = parseNumberString(val)
  const total = rawEditTotalAmount.value
  editForm.savedAmount = String(Math.max(0, total - paid))
}

const handleEditSavedAmountInput = (val: string) => {
  const saved = parseNumberString(val)
  const total = rawEditTotalAmount.value
  editForm.paidAmount = String(Math.max(0, total - saved))
}

const submitEditForm = async () => {
  if (!editForm.purchasingPoint) {
    ElMessage.warning('Vui lòng chọn Điểm thu mua')
    return
  }
  if (!editForm.date) {
    ElMessage.warning('Vui lòng chọn Ngày')
    return
  }

  loading.value = true
  try {
    const matchedPoint = collectionPoints.value.find(p => p.collection_name === editForm.purchasingPoint)
    const matchedPointId = matchedPoint ? matchedPoint.id : null

    const w = parseFloat(parseFloatInput(editForm.weight).toFixed(2))
    const t = parseFloat(parseFloatInput(editForm.tare).toFixed(2))
    const net = parseFloat((w - t).toFixed(2))
    const drc = parseFloat(parseFloatInput(editForm.drc).toFixed(2))
    const dry = parseFloat((net * drc / 100).toFixed(2))
    const unitPrice = parseFloat(parseFloatInput(editForm.unitPrice).toFixed(2))
    const isSubsidized = parseFloat(parseFloatInput(editForm.subsidize).toFixed(2))
    const subsidyPrice = parseFloat((unitPrice + isSubsidized).toFixed(2))
    const totalAmount = rawEditTotalAmount.value
    const paidAmount = parseFloat(parseNumberString(editForm.paidAmount).toFixed(2))
    const savedAmount = parseFloat(parseNumberString(editForm.savedAmount).toFixed(2))

    let productCode = editingRow.value?.productCode
    if (editForm.purchasingPoint && editForm.date) {
      const prefix = matchedPoint?.code_prefix || ''
      const dateStr = editForm.date.replace(/-/g, '')
      productCode = `${prefix}${dateStr}`
    }

    const payload = {
      id: editingRow.value?.id,
      hoursehold_id: editingRow.value?.code || editForm.code,
      collection_point_id: matchedPointId,
      product_code: productCode,
      week: getWeekNumber(editForm.date),
      day: editForm.date,
      is_subsidized: isSubsidized,
      weight: w,
      tare_weight: t,
      actual_weight: net,
      degree: drc,
      dry_rubber: dry,
      unit_price: unitPrice,
      subsidy_price: subsidyPrice,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      saved_amount: savedAmount
    }

    const response = await tienNgaService.updateDailyPurchases([payload])

    if (response && response.length > 0 && editingRow.value) {
      const updatedPurch = response[0]
      const row = editingRow.value
      row.name = updatedPurch.fullname || editForm.name
      row.purchasingPoint = updatedPurch.collection_name || editForm.purchasingPoint
      row.date = updatedPurch.day || editForm.date
      row.subsidize = updatedPurch.is_subsidized || 0
      row.weight = updatedPurch.weight || 0
      row.tare = updatedPurch.tare_weight || 0
      row.netWeight = updatedPurch.actual_weight || 0
      row.drc = updatedPurch.degree || 0
      row.dryRubber = updatedPurch.dry_rubber || 0
      row.unitPrice = updatedPurch.unit_price || 0
      row.supportPrice = updatedPurch.subsidy_price || 0
      row.totalAmount = updatedPurch.total_amount || 0
      row.paidAmount = updatedPurch.paid_amount || 0
      row.savedAmount = updatedPurch.saved_amount || 0
      row.productCode = updatedPurch.product_code || productCode

      // Update in allData array for reactive lists
      const index = allData.value.findIndex(item => item.id === row.id)
      if (index !== -1) {
        allData.value[index] = { ...row }
      }

      ElNotification({
        title: 'Thành công',
        message: 'Đã cập nhật thông tin Thu mua thành công!',
        type: 'success',
      })

      editDialogVisible.value = false
    }
  } catch (error: any) {
    ElMessage.error(error.message || 'Không thể cập nhật thông tin Thu mua')
  } finally {
    loading.value = false
  }
}

const handleCommand = (command: string, row: any) => {
  if (command === 'edit') {
    isInitializingEditForm = true
    editingRow.value = row
    editForm.code = row.code
    editForm.name = row.name
    editForm.purchasingPoint = row.purchasingPoint
    editForm.date = row.date
    editForm.subsidize = String(row.subsidize)
    editForm.weight = String(row.weight)
    editForm.tare = String(row.tare)
    editForm.drc = String(row.drc)
    editForm.unitPrice = String(row.unitPrice)
    editForm.supportPrice = String(row.supportPrice)
    editForm.paidAmount = String(row.paidAmount || 0)
    editForm.savedAmount = String(row.savedAmount || 0)
    setTimeout(() => {
      isInitializingEditForm = false
    }, 0)
    editDialogVisible.value = true
  } else if (command === 'detail') {
    detailData.value = row
    detailDialogVisible.value = true
  } else if (command === 'delete') {
    ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa bản ghi Thu mua của Hộ dân "${row.name}" ngày ${row.date} không?`,
      'Cảnh báo',
      {
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy',
        type: 'warning',
      }
    )
      .then(async () => {
        loading.value = true
        try {
          await tienNgaService.deleteDailyPurchases([row.id])
          const index = allData.value.findIndex(item => item.id === row.id)
          if (index !== -1) {
            allData.value.splice(index, 1)
            ElNotification({
              title: 'Thành công',
              message: 'Đã xóa bản ghi Thu mua thành công!',
              type: 'success',
            })
          }
        } catch (error: any) {
          ElMessage.error(error.message || 'Không thể xóa bản ghi Thu mua')
        } finally {
          loading.value = false
        }
      })
      .catch(() => {})
  } else {
    console.log(`Action: ${command} on Code: ${row.code}`)
  }
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

const generateMockData = () => {
  const data = []
  const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng']
  const middleNames = ['Văn', 'Thị', 'Hữu', 'Minh', 'Đức', 'Ngọc', 'Quang', 'Hải', 'Thanh', 'Tuấn']
  const lastNames = ['An', 'Bình', 'Cường', 'Dũng', 'Em', 'Phong', 'Giang', 'Hải', 'Linh', 'Khánh']
  const points = ['Tổ 1 - Lộc Ninh', 'Tổ 2 - Bù Đốp', 'Tổ 3 - Đồng Phú', 'Tổ 4 - Chơn Thành', 'Tổ 5 - Phước Long']

  for (let i = 1; i <= 25; i++) {
    const fullName = `${firstNames[i % 10]} ${middleNames[(i * 3) % 10]} ${lastNames[(i * 7) % 10]}`
    const weight = Math.floor(Math.random() * 500) + 100 // 100-600
    const tare = Math.floor(Math.random() * 20) + 5 // 5-25
    const netWeight = weight - tare
    const drc = Math.floor(Math.random() * 10) + 25 // 25-35
    const dryRubber = netWeight * drc / 100
    const unitPrice = 30000 // 30,000 VND
    const supportPrice = 1000 // 1,000 VND
    const subsidize = 500 // 500 VND
    
    data.push({
      id: i,
      code: `HD${String(i).padStart(3, '0')}`,
      name: fullName,
      purchasingPoint: points[i % 5],
      date: `2026-05-${String(i % 14 + 1).padStart(2, '0')}`,
      subsidize: subsidize,
      weight: weight,
      tare: tare,
      netWeight: netWeight,
      drc: drc,
      dryRubber: dryRubber,
      unitPrice: unitPrice,
      supportPrice: supportPrice,
      totalAmount: dryRubber * (unitPrice + supportPrice + subsidize)
    })
  }
  return data
}

const allData = ref<any[]>([])

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

const fetchSubFunds = async () => {
  try {
    const data = await tienNgaService.getInvestments({ role: 'member' })
    // Chỉ lấy các Quỹ con hoạt động (status là ACTIVE)
    subFunds.value = data.filter((item: any) => item.status === 'ACTIVE')
  } catch (error: any) {
    console.error('Failed to fetch sub funds:', error)
  }
}

const handlePaymentTypeChange = (val: any) => {
  const type = String(val)
  const name = computedHouseholdName.value || 'Hộ dân'
  if (type === 'chi') {
    purchaseForm.requestingParty = name
    purchaseForm.executingParty = 'Tiến Nga'
    purchaseForm.receivingParty = name
    purchaseForm.purpose = `Chi trả tiền thu mua mủ cao su cho hộ ${name}`
  } else {
    purchaseForm.requestingParty = name
    purchaseForm.executingParty = name
    purchaseForm.receivingParty = 'Tiến Nga'
    purchaseForm.purpose = `Thu tiền thu mua mủ cao su từ hộ ${name}`
  }
}

watch(
  () => [purchaseForm.saveToBook, matchedCustomer.value, purchaseForm.day, purchaseForm.type],
  ([toBook, customer, day, type]) => {
    if (!toBook) {
      const name = customer ? customer.fullname : ''
      if (!purchaseForm.subFundId && subFunds.value.length > 0) {
        purchaseForm.subFundId = subFunds.value[0].id
      }
      purchaseForm.date = day || formatDate(new Date())
      if (type === 'chi') {
        purchaseForm.requestingParty = name
        purchaseForm.executingParty = 'Tiến Nga'
        purchaseForm.receivingParty = name
        purchaseForm.purpose = `Chi trả tiền thu mua mủ cao su cho hộ ${name}`
      } else {
        purchaseForm.requestingParty = name
        purchaseForm.executingParty = name
        purchaseForm.receivingParty = 'Tiến Nga'
        purchaseForm.purpose = `Thu tiền thu mua mủ cao su từ hộ ${name}`
      }
      purchaseForm.reason = `Thanh toán mủ cao su ngày ${day ? new Date(day).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}`
    }
  }
)

onMounted(() => {
  fetchCollectionPoints()
  fetchDailyPurchases()
  fetchCustomers()
  fetchSubFunds()
})

watch([selectedFactory, dateRange], () => {
  fetchDailyPurchases()
})

watch(
  () => [purchaseForm.purchasingPoint, purchaseForm.day],
  ([newPoint, newDay]) => {
    if (newPoint && newDay) {
      const matchedPoint = collectionPoints.value.find(p => p.collection_name === newPoint)
      const prefix = matchedPoint?.code_prefix || ''
      const dateStr = newDay.replace(/-/g, '')
      purchaseForm.productCode = `${prefix}${dateStr}`
    } else {
      purchaseForm.productCode = ''
    }
  },
  { immediate: true }
)

const filteredData = computed(() => {
  return allData.value.filter(item => {
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      const codeMatch = item.code?.toLowerCase().includes(query)
      const nameMatch = item.name?.toLowerCase().includes(query)
      const productCodeMatch = item.productCode?.toLowerCase().includes(query)
      return codeMatch || nameMatch || productCodeMatch
    }
    return true
  })
})

const sortProp = ref('')
const sortOrder = ref('')

const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  sortProp.value = prop
  sortOrder.value = order
  currentPage.value = 1
}

const sortedData = computed(() => {
  const list = [...filteredData.value]
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

const total = computed(() => filteredData.value.length)

const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedData.value.slice(start, end)
})
</script>

<style scoped>
.purchasing-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

/* Cho phân trang tự xuống dòng khi có nhiều trang */
.purchasing-container :deep(.el-pagination) {
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

/* Tùy chỉnh toàn diện bảng cho Dark Mode */
html.dark .purchasing-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827; /* bg-gray-900 */
  --el-table-row-hover-bg-color: #374151; /* bg-gray-700 */
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .purchasing-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .purchasing-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

/* Fix nền cột cố định (fixed columns) trong Dark mode */
html.dark .purchasing-container :deep(.el-table .el-table-fixed-column--left),
html.dark .purchasing-container :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important; /* bg-gray-800 (khớp với container) */
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

<style>
/* Tùy chỉnh select dropdown popper trong Dark Mode (không scoped) */
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

html.dark .custom-dark-select-popper .el-popper__arrow::before {
  background-color: #1f2937 !important;
  border-color: #374151 !important;
}

/* Đổi màu background các ô select nổi bật trong Dark Mode */
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
/* Descriptions styles for Detail Modal */
.custom-descriptions {
  margin-top: 10px;
}
.custom-descriptions .el-descriptions__label {
  font-weight: 600;
  color: #1e3a8a;
  background-color: #f8fafc;
}
html.dark .custom-descriptions .el-descriptions__label {
  background-color: #111827 !important;
  color: #60a5fa !important;
  border-color: #374151 !important;
}
html.dark .custom-descriptions .el-descriptions__content {
  background-color: #1f2937 !important;
  color: #f3f4f6 !important;
  border-color: #374151 !important;
}
html.dark .custom-descriptions .el-descriptions__table {
  border-color: #374151 !important;
}
</style>
