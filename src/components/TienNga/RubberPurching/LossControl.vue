<template>
  <div class="loss-control-container h-full flex flex-col">
    <!-- FILTER BAR -->
    <div class="flex flex-wrap justify-between items-center gap-x-4 gap-y-4 mb-4 shrink-0">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-4">
        <!-- Xưởng thu mua Filter -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Xưởng thu mua:</span>
          <el-select 
            v-model="selectedCollectionPoint" 
            placeholder="Chọn xưởng" 
            style="width: 200px"
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Tất cả" value="all" />
            <el-option 
              v-for="point in collectionPoints" 
              :key="point.id" 
              :label="point.collection_name" 
              :value="point.code_prefix" 
            />
          </el-select>
        </div>

        <!-- Time Filter -->
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

        <!-- Processing Type Filter -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Loại chế biến:</span>
          <el-select 
            v-model="selectedProcessingType" 
            placeholder="Chọn loại chế biến" 
            style="width: 180px"
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Tất cả" value="all" />
            <el-option label="Chế biến khô" value="dry_production" />
            <el-option label="Bán mủ nước" value="wet_sale" />
          </el-select>
        </div>

        <!-- Product Code Filter -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
          <el-input
            v-model="searchQuery"
            placeholder="Mã hàng..."
            :prefix-icon="Search"
            clearable
            class="w-60 custom-dark-input"
          />
        </div>
      </div>
      <div class="flex items-center gap-2">
        <el-button :icon="Refresh" circle @click="fetchLossControls" :loading="loading" />
        <el-button type="primary" @click="dialogVisible = true">Thêm Hao hụt</el-button>
      </div>
    </div>

    <!-- DATA TABLE -->
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
        <!-- Columns -->
        <el-table-column type="selection" width="55" />
        <el-table-column label="STT" width="52" align="center">
          <template #default="{ $index }">
            <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="product_code" label="Mã hàng" min-width="101" sortable="custom">
          <template #default="scope">
            <span class="font-bold text-blue-600 dark:text-blue-400">{{ scope.row.product_code }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="day" label="Ngày thu mua" min-width="86" />
        <el-table-column prop="estimated_completion" label="Dự kiến hoàn thành" min-width="115">
          <template #default="scope">
            <span>{{ scope.row.estimated_completion || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_wet_rubber" label="Tổng mủ nước" min-width="94" align="right">
          <template #default="scope">
            <span>{{ formatNumber(scope.row.total_wet_rubber) }} kg</span>
          </template>
        </el-table-column>
        <el-table-column prop="avg_degree" label="Độ TB" min-width="72" align="right">
          <template #default="scope">
            <span>{{ formatNumber(scope.row.avg_degree, 2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_dry_rubber" label="Tổng mủ khô" min-width="94" align="right">
          <template #default="scope">
            <span class="font-medium text-blue-500">{{ formatNumber(scope.row.total_dry_rubber, 2) }} kg</span>
          </template>
        </el-table-column>
        <el-table-column prop="avg_unit_price" label="Đơn giá TB" min-width="94" align="right">
          <template #default="scope">
            <span>{{ formatCurrency(scope.row.avg_unit_price) }} VNĐ</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="Tổng thành tiền" min-width="130" align="right">
          <template #default="scope">
            <span class="font-bold text-green-500">{{ formatCurrency(scope.row.total_amount) }} VNĐ</span>
          </template>
        </el-table-column>
        <el-table-column prop="transaction_count" label="Số giao dịch" min-width="86" align="right" />
        <el-table-column prop="processing_type" label="Loại chế biến" min-width="101" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.processing_type === 'dry_production'" type="primary" effect="light">
              Chế biến khô
            </el-tag>
            <el-tag v-else-if="scope.row.processing_type === 'wet_sale'" type="success" effect="light">
              Bán mủ nước
            </el-tag>
            <el-tag v-else type="info" effect="light">
              {{ scope.row.processing_type || 'Chưa rõ' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Operations Column -->
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
                <span class="font-bold text-blue-600 dark:text-blue-400">{{ row.product_code }}</span>
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
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ngày thu mua:</span>
                <span class="text-right break-words min-w-0">
                  {{ row.day }}
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Dự kiến hoàn thành:</span>
                <span class="text-right break-words min-w-0">
                  <span>{{ row.estimated_completion || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tổng mủ nước:</span>
                <span class="text-right break-words min-w-0">
                  <span>{{ formatNumber(row.total_wet_rubber) }} kg</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Độ TB:</span>
                <span class="text-right break-words min-w-0">
                  <span>{{ formatNumber(row.avg_degree, 2) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tổng mủ khô:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-medium text-blue-500">{{ formatNumber(row.total_dry_rubber, 2) }} kg</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Đơn giá TB:</span>
                <span class="text-right break-words min-w-0">
                  <span>{{ formatCurrency(row.avg_unit_price) }} VNĐ</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tổng thành tiền:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-bold text-green-500">{{ formatCurrency(row.total_amount) }} VNĐ</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Số giao dịch:</span>
                <span class="text-right break-words min-w-0">
                  {{ row.transaction_count }}
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Loại chế biến:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag v-if="row.processing_type === 'dry_production'" type="primary" effect="light">
                                Chế biến khô
                              </el-tag>
                              <el-tag v-else-if="row.processing_type === 'wet_sale'" type="success" effect="light">
                                Bán mủ nước
                              </el-tag>
                              <el-tag v-else type="info" effect="light">
                                {{ row.processing_type || 'Chưa rõ' }}
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

    <!-- DIALOG: THÊM HAO HỤT -->
    <el-dialog
      v-model="dialogVisible"
      title="THÊM KIỂM SOÁT HAO HỤT"
      class="custom-dark-dialog"
      width="750px"
      destroy-on-close
      align-center
      @close="resetForm"
    >
      <div class="max-h-[70vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form :model="lossForm" label-width="180px" class="mt-2 compact-form">
          <div class="mb-5 pb-3 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-base font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin chung
            </h3>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Xưởng thu mua">
                  <el-select 
                    v-model="lossForm.collection_point_prefix" 
                    placeholder="Chọn xưởng" 
                    multiple
                    collapse-tags
                    collapse-tags-tooltip
                    style="width: 100%"
                  >
                    <el-option 
                      v-for="point in collectionPoints" 
                      :key="point.id" 
                      :label="point.collection_name" 
                      :value="point.code_prefix" 
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ngày thu mua" required>
                  <el-date-picker :editable="false"
                    v-model="lossForm.day"
                    type="date"
                    placeholder="Chọn ngày"
                    format="DD/MM/YYYY"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã hàng" required>
                  <el-input v-model="lossForm.product_code" placeholder="Tự động tạo hoặc nhập..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Dự kiến hoàn thành">
                  <el-date-picker :editable="false"
                    v-model="lossForm.estimated_completion"
                    type="date"
                    placeholder="Chọn ngày"
                    format="DD/MM/YYYY"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Loại chế biến" required>
                  <el-select v-model="lossForm.processing_type" placeholder="Chọn loại chế biến" style="width: 100%">
                    <el-option label="Chế biến khô" value="dry_production" />
                    <el-option label="Bán mủ nước" value="wet_sale" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <div class="mb-5 pb-3 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-base font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Khối lượng & Chất lượng
            </h3>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tổng mủ nước (kg)">
                  <el-input v-model="lossForm.total_wet_rubber" placeholder="Nhập tổng mủ nước..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Độ trung bình">
                  <el-input v-model="lossForm.avg_degree" placeholder="Nhập độ trung bình..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tổng mủ khô (kg)">
                  <el-input v-model="lossForm.total_dry_rubber" placeholder="Tự động tính..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Số giao dịch">
                  <el-input v-model="lossForm.transaction_count" placeholder="Nhập số giao dịch..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <div>
            <h3 class="text-base font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
              Đơn giá & Thành tiền
            </h3>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Đơn giá TB">
                  <el-input 
                    v-model="lossForm.avg_unit_price" 
                    placeholder="Nhập đơn giá TB..."
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
                <el-form-item label="Tổng thành tiền">
                  <el-input 
                    v-model="lossForm.total_amount" 
                    placeholder="Tự động tính..."
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
          <el-button @click="dialogVisible = false">Hủy</el-button>
          <el-button type="primary" @click="submitForm">
            Xác nhận
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- DIALOG: CHỈNH SỬA HAO HỤT -->
    <el-dialog
      v-model="editDialogVisible"
      title="CHỈNH SỬA KIỂM SOÁT HAO HỤT"
      class="custom-dark-dialog"
      width="750px"
      destroy-on-close
      align-center
    >
      <div class="max-h-[70vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form :model="editForm" label-width="180px" class="mt-2 compact-form">
          <div class="mb-5 pb-3 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-base font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin chung
            </h3>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Xưởng thu mua">
                  <el-select 
                    v-model="editForm.collection_point_prefix" 
                    placeholder="Chọn xưởng" 
                    multiple
                    collapse-tags
                    collapse-tags-tooltip
                    style="width: 100%"
                  >
                    <el-option 
                      v-for="point in collectionPoints" 
                      :key="point.id" 
                      :label="point.collection_name" 
                      :value="point.code_prefix" 
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ngày thu mua" required>
                  <el-date-picker :editable="false"
                    v-model="editForm.day"
                    type="date"
                    placeholder="Chọn ngày"
                    format="DD/MM/YYYY"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã hàng" required>
                  <el-input v-model="editForm.product_code" placeholder="Nhập mã hàng..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Dự kiến hoàn thành">
                  <el-date-picker :editable="false"
                    v-model="editForm.estimated_completion"
                    type="date"
                    placeholder="Chọn ngày"
                    format="DD/MM/YYYY"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Loại chế biến" required>
                  <el-select v-model="editForm.processing_type" placeholder="Chọn loại chế biến" style="width: 100%">
                    <el-option label="Chế biến khô" value="dry_production" />
                    <el-option label="Bán mủ nước" value="wet_sale" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <div class="mb-5 pb-3 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-base font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Khối lượng & Chất lượng
            </h3>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tổng mủ nước (kg)">
                  <el-input v-model="editForm.total_wet_rubber" placeholder="Nhập tổng mủ nước..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Độ trung bình">
                  <el-input v-model="editForm.avg_degree" placeholder="Nhập độ trung bình..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tổng mủ khô (kg)">
                  <el-input v-model="editForm.total_dry_rubber" placeholder="Tự động tính..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Số giao dịch">
                  <el-input v-model="editForm.transaction_count" placeholder="Nhập số giao dịch..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <div>
            <h3 class="text-base font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
              Đơn giá & Thành tiền
            </h3>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Đơn giá TB">
                  <el-input 
                    v-model="editForm.avg_unit_price" 
                    placeholder="Nhập đơn giá TB..."
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
                <el-form-item label="Tổng thành tiền">
                  <el-input 
                    v-model="editForm.total_amount" 
                    placeholder="Tự động tính..."
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

    <!-- DIALOG: CHI TIẾT HAO HỤT -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT KIỂM SOÁT HAO HỤT"
      class="custom-dark-dialog"
      width="700px"
      destroy-on-close
      align-center
    >
      <div v-if="detailData" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto overflow-x-hidden">
        <!-- Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <el-avatar :size="64" class="bg-blue-100 dark:bg-blue-900">
            <span class="text-xl font-bold text-blue-600 dark:text-blue-400">
              H
            </span>
          </el-avatar>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Kiểm soát hao hụt</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              Mã hàng: {{ detailData.product_code }}
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <span class="text-gray-600 dark:text-gray-400 font-semibold">
                {{ detailData.processing_type === 'dry_production' ? 'Chế biến khô' : detailData.processing_type === 'wet_sale' ? 'Bán mủ nước' : 'Chưa rõ' }}
              </span>
              <span class="text-gray-400 dark:text-gray-500">|</span>
              <span class="text-gray-600 dark:text-gray-400">Ngày: {{ detailData.day }}</span>
            </div>
          </div>
        </div>

        <!-- Details Grid -->
        <div>
          <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            Thông tin chi tiết
          </h4>
          <div class="grid grid-cols-2 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã hàng</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-100">{{ detailData.product_code }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày thu mua</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ detailData.day }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Dự kiến hoàn thành</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ detailData.estimated_completion || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Loại chế biến</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ detailData.processing_type === 'dry_production' ? 'Chế biến khô' : detailData.processing_type === 'wet_sale' ? 'Bán mủ nước' : 'Chưa rõ' }}
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tổng mủ nước</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-100">{{ formatNumber(detailData.total_wet_rubber || 0) }} kg</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Độ trung bình</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-100">{{ formatNumber(detailData.avg_degree || 0, 2) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tổng mủ khô</div>
              <div class="text-sm font-bold text-blue-500 dark:text-blue-400">{{ formatNumber(detailData.total_dry_rubber || 0, 2) }} kg</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số giao dịch</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-100">{{ detailData.transaction_count || 0 }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Đơn giá TB</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-100">{{ formatCurrency(detailData.avg_unit_price || 0) }} VNĐ</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tổng thành tiền</div>
              <div class="text-sm font-bold text-green-500 dark:text-green-400">{{ formatCurrency(detailData.total_amount || 0) }} VNĐ</div>
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
  lastWeek.setDate(today.getDate() - 30) // Default showing last 30 days
  return [formatDate(lastWeek), formatDate(today)]
}

// State
const currentPage = ref(1)
const pageSize = ref(10)
const selectedProcessingType = ref('all')
const dateRange = ref<[string, string] | null>(getInitialDateRange())
const searchQuery = ref('')
const loading = ref(false)
const allData = ref<any[]>([])
const collectionPoints = ref<any[]>([])
const selectedCollectionPoint = ref('all')

const dialogVisible = ref(false)
const editDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const editingRow = ref<any>(null)
const detailData = ref<any>(null)

const isInitializingEditForm = ref(false)
const isAutoFilling = ref(false)

// Forms
const lossForm = reactive({
  collection_point_prefix: [] as string[],
  product_code: '',
  day: formatDate(new Date()),
  estimated_completion: '',
  total_wet_rubber: '',
  avg_degree: '',
  total_dry_rubber: '',
  avg_unit_price: '',
  total_amount: '',
  transaction_count: '',
  processing_type: 'dry_production'
})

const editForm = reactive({
  collection_point_prefix: [] as string[],
  product_code: '',
  day: '',
  estimated_completion: '',
  total_wet_rubber: '',
  avg_degree: '',
  total_dry_rubber: '',
  avg_unit_price: '',
  total_amount: '',
  transaction_count: '',
  processing_type: ''
})

// Auto-calculations for add form
watch(
  () => [lossForm.total_wet_rubber, lossForm.avg_degree],
  () => {
    if (isAutoFilling.value) return
    const wet = parseFloatInput(lossForm.total_wet_rubber)
    const degree = parseFloatInput(lossForm.avg_degree)
    if (wet > 0 && degree > 0) {
      const dry = parseFloat((wet * degree / 100).toFixed(2))
      lossForm.total_dry_rubber = String(dry)
    } else {
      lossForm.total_dry_rubber = ''
    }
  }
)

watch(
  () => [lossForm.total_dry_rubber, lossForm.avg_unit_price],
  () => {
    if (isAutoFilling.value) return
    const dry = parseFloatInput(lossForm.total_dry_rubber)
    const price = parseFloatInput(lossForm.avg_unit_price)
    if (dry > 0 && price > 0) {
      const total = parseFloat((dry * price).toFixed(2))
      lossForm.total_amount = String(total)
    } else {
      lossForm.total_amount = ''
    }
  }
)

// Auto-calculations for edit form
watch(
  () => [editForm.total_wet_rubber, editForm.avg_degree],
  () => {
    if (isInitializingEditForm.value || isAutoFilling.value) return
    const wet = parseFloatInput(editForm.total_wet_rubber)
    const degree = parseFloatInput(editForm.avg_degree)
    if (wet > 0 && degree > 0) {
      const dry = parseFloat((wet * degree / 100).toFixed(2))
      editForm.total_dry_rubber = String(dry)
    } else {
      editForm.total_dry_rubber = ''
    }
  }
)

watch(
  () => [editForm.total_dry_rubber, editForm.avg_unit_price],
  () => {
    if (isInitializingEditForm.value || isAutoFilling.value) return
    const dry = parseFloatInput(editForm.total_dry_rubber)
    const price = parseFloatInput(editForm.avg_unit_price)
    if (dry > 0 && price > 0) {
      const total = parseFloat((dry * price).toFixed(2))
      editForm.total_amount = String(total)
    } else {
      editForm.total_amount = ''
    }
  }
)

// Formatting utilities
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

// Methods
const resetForm = () => {
  lossForm.collection_point_prefix = []
  lossForm.product_code = ''
  lossForm.day = formatDate(new Date())
  lossForm.estimated_completion = ''
  lossForm.total_wet_rubber = ''
  lossForm.avg_degree = ''
  lossForm.total_dry_rubber = ''
  lossForm.avg_unit_price = ''
  lossForm.total_amount = ''
  lossForm.transaction_count = ''
  lossForm.processing_type = 'dry_production'
}

const fetchCollectionPoints = async () => {
  try {
    const data = await tienNgaService.getCollectionPoints('Cao su')
    collectionPoints.value = data
  } catch (error: any) {
    console.error('Failed to fetch collection points:', error)
  }
}

const autoFillFromPurchases = async (productCode: string, formObj: any) => {
  try {
    let params: any = {}
    
    // Parse the date from productCode (e.g. LT20260711 or TN20260711)
    let searchDate = formObj.day
    const dateMatch = productCode.match(/\d{8}$/)
    if (dateMatch) {
      const dateStr = dateMatch[0]
      searchDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
    }
    
    params.start_date = searchDate
    params.end_date = searchDate
    
    // Determine the collection points
    let prefixes: string[] = []
    if (formObj.collection_point_prefix && formObj.collection_point_prefix.length > 0) {
      prefixes = Array.isArray(formObj.collection_point_prefix)
        ? formObj.collection_point_prefix
        : [formObj.collection_point_prefix]
    } else if (dateMatch) {
      // Parse prefix from productCode
      const dateIndex = productCode.indexOf(dateMatch[0])
      if (dateIndex > 0) {
        const parsedPrefix = productCode.substring(0, dateIndex)
        if (parsedPrefix && parsedPrefix !== 'TN') {
          prefixes = [parsedPrefix]
        } else if (parsedPrefix === 'TN') {
          // If prefix is 'TN', query for all collection points
          prefixes = collectionPoints.value.map(p => p.code_prefix).filter(Boolean)
        }
      }
    }
    
    if (prefixes.length > 0) {
      const selectedPointIds = collectionPoints.value
        .filter(p => prefixes.includes(p.code_prefix))
        .map(p => p.id)
      if (selectedPointIds.length > 0) {
        params.collection_point_id = selectedPointIds.join(',')
      }
    }

    const purchases = await tienNgaService.getDailyPurchases(params)
    if (purchases && purchases.length > 0) {
      isAutoFilling.value = true
      
      let totalWet = 0
      let totalDry = 0
      let totalAmount = 0
      
      purchases.forEach((p: any) => {
        totalWet += p.actual_weight || p.weight || 0
        totalDry += p.dry_rubber || 0
        totalAmount += p.total_amount || 0
      })
      
      const count = purchases.length
      const avgDegree = totalWet > 0 ? (totalDry / totalWet) * 100 : 0
      const avgUnitPrice = totalDry > 0 ? totalAmount / totalDry : 0
      
      formObj.total_wet_rubber = totalWet > 0 ? String(parseFloat(totalWet.toFixed(2))) : '0'
      formObj.avg_degree = avgDegree > 0 ? String(parseFloat(avgDegree.toFixed(2))) : '0'
      formObj.avg_unit_price = avgUnitPrice > 0 ? String(parseFloat(avgUnitPrice.toFixed(0))) : '0'
      formObj.transaction_count = String(count)
      formObj.total_dry_rubber = totalDry > 0 ? String(parseFloat(totalDry.toFixed(2))) : '0'
      formObj.total_amount = totalAmount > 0 ? String(parseFloat(totalAmount.toFixed(0))) : '0'
      
      setTimeout(() => {
        isAutoFilling.value = false
      }, 50)
    }
  } catch (error) {
    console.error('Failed to auto fill from purchases:', error)
    isAutoFilling.value = false
  }
}

const fetchLossControls = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    if (selectedProcessingType.value !== 'all') {
      params.processing_type = selectedProcessingType.value
    }
    if (searchQuery.value) {
      params.product_code = searchQuery.value
    }

    const data = await tienNgaService.getLossControls(params)
    allData.value = data
  } catch (error: any) {
    ElMessage.error(error.message || 'Không thể tải danh sách kiểm soát hao hụt')
  } finally {
    loading.value = false
  }
}

const submitForm = async () => {
  if (!lossForm.product_code) {
    ElMessage.warning('Vui lòng nhập Mã hàng')
    return
  }
  if (!lossForm.day) {
    ElMessage.warning('Vui lòng chọn Ngày thu mua')
    return
  }
  if (!lossForm.processing_type) {
    ElMessage.warning('Vui lòng chọn Loại chế biến')
    return
  }

  loading.value = true
  try {
    const payload = {
      product_code: lossForm.product_code,
      day: lossForm.day,
      estimated_completion: lossForm.estimated_completion || null,
      total_wet_rubber: parseFloatInput(lossForm.total_wet_rubber),
      avg_degree: parseFloatInput(lossForm.avg_degree),
      total_dry_rubber: parseFloatInput(lossForm.total_dry_rubber),
      avg_unit_price: parseFloatInput(lossForm.avg_unit_price),
      total_amount: parseFloatInput(lossForm.total_amount),
      transaction_count: lossForm.transaction_count ? parseInt(String(lossForm.transaction_count)) : 0,
      processing_type: lossForm.processing_type
    }

    const response = await tienNgaService.addLossControls([payload])
    if (response && response.length > 0) {
      ElNotification({
        title: 'Thành công',
        message: 'Đã thêm Kiểm soát hao hụt mới thành công!',
        type: 'success',
      })
      resetForm()
      dialogVisible.value = false
      await fetchLossControls()
    }
  } catch (error: any) {
    ElMessage.error(error.message || 'Không thể thêm kiểm soát hao hụt mới')
  } finally {
    loading.value = false
  }
}

const submitEditForm = async () => {
  if (!editForm.product_code) {
    ElMessage.warning('Vui lòng nhập Mã hàng')
    return
  }
  if (!editForm.day) {
    ElMessage.warning('Vui lòng chọn Ngày thu mua')
    return
  }
  if (!editForm.processing_type) {
    ElMessage.warning('Vui lòng chọn Loại chế biến')
    return
  }

  loading.value = true
  try {
    const payload = {
      id: editingRow.value?.id,
      product_code: editForm.product_code,
      day: editForm.day,
      estimated_completion: editForm.estimated_completion || null,
      total_wet_rubber: parseFloatInput(editForm.total_wet_rubber),
      avg_degree: parseFloatInput(editForm.avg_degree),
      total_dry_rubber: parseFloatInput(editForm.total_dry_rubber),
      avg_unit_price: parseFloatInput(editForm.avg_unit_price),
      total_amount: parseFloatInput(editForm.total_amount),
      transaction_count: editForm.transaction_count ? parseInt(String(editForm.transaction_count)) : 0,
      processing_type: editForm.processing_type
    }

    const response = await tienNgaService.updateLossControls([payload])
    if (response && response.length > 0) {
      ElNotification({
        title: 'Thành công',
        message: 'Đã cập nhật Kiểm soát hao hụt thành công!',
        type: 'success',
      })
      editDialogVisible.value = false
      await fetchLossControls()
    }
  } catch (error: any) {
    ElMessage.error(error.message || 'Không thể cập nhật kiểm soát hao hụt')
  } finally {
    loading.value = false
  }
}

const handleCommand = (command: string, row: any) => {
  if (command === 'edit') {
    isInitializingEditForm.value = true
    editingRow.value = row
    editForm.product_code = row.product_code || ''
    editForm.day = row.day || ''
    editForm.estimated_completion = row.estimated_completion || ''
    editForm.total_wet_rubber = row.total_wet_rubber !== null ? String(row.total_wet_rubber) : ''
    editForm.avg_degree = row.avg_degree !== null ? String(row.avg_degree) : ''
    editForm.total_dry_rubber = row.total_dry_rubber !== null ? String(row.total_dry_rubber) : ''
    editForm.avg_unit_price = row.avg_unit_price !== null ? String(row.avg_unit_price) : ''
    editForm.total_amount = row.total_amount !== null ? String(row.total_amount) : ''
    editForm.transaction_count = row.transaction_count !== null ? String(row.transaction_count) : ''
    editForm.processing_type = row.processing_type || 'dry_production'
    
    // Detect collection point prefix
    if (row.product_code?.startsWith('TN')) {
      editForm.collection_point_prefix = collectionPoints.value.map(p => p.code_prefix).filter(Boolean)
    } else {
      const matchedPoint = collectionPoints.value.find(p => p.code_prefix && row.product_code?.startsWith(p.code_prefix))
      editForm.collection_point_prefix = matchedPoint ? [matchedPoint.code_prefix] : []
    }

    setTimeout(() => {
      isInitializingEditForm.value = false
    }, 100)

    editDialogVisible.value = true
  } else if (command === 'detail') {
    detailData.value = row
    detailDialogVisible.value = true
  } else if (command === 'delete') {
    ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa bản ghi hao hụt của mã hàng "${row.product_code}" không?`,
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
          await tienNgaService.deleteLossControls([row.id])
          ElNotification({
            title: 'Thành công',
            message: 'Đã xóa bản ghi Kiểm soát hao hụt thành công!',
            type: 'success',
          })
          await fetchLossControls()
        } catch (error: any) {
          ElMessage.error(error.message || 'Không thể xóa bản ghi Kiểm soát hao hụt')
        } finally {
          loading.value = false
        }
      })
      .catch(() => {})
  }
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// Lifecycle and Watchers
onMounted(() => {
  fetchCollectionPoints()
  fetchLossControls()
})

watch([selectedProcessingType, dateRange], () => {
  fetchLossControls()
})

watch(searchQuery, () => {
  // Add simple delay debounce if needed, or fetch directly
  fetchLossControls()
})

watch(selectedCollectionPoint, () => {
  currentPage.value = 1
})

watch(
  () => [lossForm.collection_point_prefix, lossForm.day],
  ([newPrefix, newDay]) => {
    if (newDay) {
      const dateStr = String(newDay).replace(/-/g, '')
      let prefix = ''
      if (Array.isArray(newPrefix)) {
        if (newPrefix.length === 1) {
          prefix = newPrefix[0] || ''
        } else if (newPrefix.length > 1) {
          prefix = 'TN'
        }
      } else if (newPrefix) {
        prefix = String(newPrefix)
      }
      
      if (prefix) {
        lossForm.product_code = `${prefix}${dateStr}`
      } else {
        lossForm.product_code = ''
      }
    } else {
      lossForm.product_code = ''
    }
  }
)

watch(
  () => [editForm.collection_point_prefix, editForm.day],
  ([newPrefix, newDay]) => {
    if (newDay) {
      const dateStr = String(newDay).replace(/-/g, '')
      let prefix = ''
      if (Array.isArray(newPrefix)) {
        if (newPrefix.length === 1) {
          prefix = newPrefix[0] || ''
        } else if (newPrefix.length > 1) {
          prefix = 'TN'
        }
      } else if (newPrefix) {
        prefix = String(newPrefix)
      }
      
      if (prefix) {
        editForm.product_code = `${prefix}${dateStr}`
      } else {
        editForm.product_code = ''
      }
    } else {
      editForm.product_code = ''
    }
  }
)

watch(
  () => [lossForm.product_code, ...lossForm.collection_point_prefix],
  async () => {
    const code = lossForm.product_code?.trim()
    if (code && code.length >= 6) {
      await autoFillFromPurchases(code, lossForm)
    }
  }
)

watch(
  () => editForm.product_code,
  async (newVal) => {
    if (isInitializingEditForm.value) return
    const code = newVal?.trim()
    if (code && code.length >= 6) {
      await autoFillFromPurchases(code, editForm)
    }
  }
)

const filteredData = computed(() => {
  return allData.value.filter(item => {
    if (selectedCollectionPoint.value !== 'all') {
      const prefix = selectedCollectionPoint.value
      if (prefix && (!item.product_code || !item.product_code.startsWith(prefix))) {
        return false
      }
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
.loss-control-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

/* Pagination wrap */
.loss-control-container :deep(.el-pagination) {
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

/* Dark Mode Table Customizations */
html.dark .loss-control-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827; /* bg-gray-900 */
  --el-table-row-hover-bg-color: #374151; /* bg-gray-700 */
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .loss-control-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .loss-control-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

/* Fixed column bg in dark mode */
html.dark .loss-control-container :deep(.el-table .el-table-fixed-column--left),
html.dark .loss-control-container :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important;
}

/* Dark mode inputs and selects */
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
/* Global dropdown overrides for Dark Mode */
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

/* Highlighted selects in Dark mode */
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
