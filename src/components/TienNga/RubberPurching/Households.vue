<template>
  <div class="households-container h-full flex flex-col">
    <div class="flex flex-wrap justify-between items-center gap-x-4 gap-y-4 mb-4 shrink-0">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-4">
        <!-- <h2 class="text-xl font-bold dark:text-white">Quản lý Hộ dân</h2> -->
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
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái:</span>
          <el-select 
            v-model="selectedStatus" 
            placeholder="Trạng thái" 
            style="width: 180px"
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Tất cả" value="all" />
            <el-option label="Hoạt động" value="Hoạt động" />
            <el-option label="Ngừng hoạt động" value="Ngừng hoạt động" />
          </el-select>
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
        <el-button :icon="Refresh" circle @click="fetchCustomers" :loading="loading" />
        <el-button 
          type="warning" 
          :disabled="selectedRows.length !== 1"
          @click="handleAdvanceClick"
        >
          Ứng tiền
        </el-button>
        <el-button 
          type="danger" 
          :disabled="selectedRows.length !== 1"
          @click="handleDeductionClick"
        >
          Khấu trừ ứng tiền
        </el-button>
        <el-button type="primary" @click="dialogVisible = true">Thêm Hộ dân</el-button>
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
      <el-table v-if="hienBang" 
        :data="tableData" 
        style="width: 100%" 
        class="flex-1" 
        height="100%" 
        v-loading="loading"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <!-- Fixed Columns -->
        <el-table-column type="selection" width="55" />
        <el-table-column label="STT" width="52" align="center">
          <template #default="{ $index }">
            <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="Mã Hộ dân" width="86" sortable="custom" />

        <!-- Scrollable Columns -->
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
        
        <el-table-column prop="advanceSeason" label="Ứng cuối mùa" width="108" align="right">
          <template #default="scope">
            <span class="font-medium" :class="mauSo(scope.row.advanceSeason)">{{ formatCurrency(scope.row.advanceSeason) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="advanceMonthly" label="Ứng trong tháng" width="115" align="right">
          <template #default="scope">
            <span class="font-medium" :class="mauSo(scope.row.advanceMonthly)">{{ formatCurrency(scope.row.advanceMonthly) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="advanceAmount" label="Tổng ứng" width="108" align="right">
          <template #default="scope">
            <span class="font-bold" :class="mauSo(scope.row.advanceAmount)">{{ formatCurrency(scope.row.advanceAmount) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="totalDebt" label="Công nợ" width="108" align="right">
          <template #default="scope">
            <span class="font-bold" :class="mauSo(scope.row.totalDebt)">{{ formatCurrency(scope.row.totalDebt) }}</span>
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
                  <el-dropdown-item command="advance">Ứng tiền</el-dropdown-item>
                  <el-dropdown-item command="deduction">Khấu trừ ứng tiền</el-dropdown-item>
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
                                  <el-dropdown-item command="advance">Ứng tiền</el-dropdown-item>
                                  <el-dropdown-item command="deduction">Khấu trừ ứng tiền</el-dropdown-item>
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
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ứng cuối mùa:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-medium" :class="mauSo(row.advanceSeason)">{{ formatCurrency(row.advanceSeason) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ứng trong tháng:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-medium" :class="mauSo(row.advanceMonthly)">{{ formatCurrency(row.advanceMonthly) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tổng ứng:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-bold" :class="mauSo(row.advanceAmount)">{{ formatCurrency(row.advanceAmount) }}</span>
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

    <!-- Modal Thêm Hộ dân -->
    <el-dialog
      v-model="dialogVisible"
      title="THÊM HỘ DÂN"
      class="custom-dark-dialog"
      width="900px"
      destroy-on-close
      align-center
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form :model="householdForm" label-width="180px" class="mt-2 compact-form">
          <!-- PHẦN 1: THÔNG TIN CƠ BẢN -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin chung
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã Hộ dân" required>
                  <el-input v-model="householdForm.code" placeholder="Nhập mã hộ dân..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Họ và tên" required>
                  <el-input v-model="householdForm.name" placeholder="Nhập họ và tên..." />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Điểm thu mua" required>
                  <el-select v-model="householdForm.purchasingPoint" placeholder="Chọn điểm thu mua" class="w-full highlight-select" style="width: 100%">
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
                <el-form-item label="Số điện thoại">
                  <el-input v-model="householdForm.phone" placeholder="Nhập số điện thoại..." />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Trạng thái">
                  <el-select v-model="householdForm.status" placeholder="Chọn trạng thái" class="w-full highlight-select" style="width: 100%">
                    <el-option label="Hoạt động" value="Hoạt động" />
                    <el-option label="Ngừng hoạt động" value="Ngừng hoạt động" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Nguyên liệu">
                  <el-select v-model="householdForm.material" placeholder="Chọn nguyên liệu" class="w-full highlight-select" style="width: 100%">
                    <el-option label="Cao su" value="Cao su" />
                    <el-option label="Củi" value="Củi" />
                    <el-option label="Acid" value="Acid" />
                    <el-option label="Amoniac" value="Amoniac" />
                    <el-option label="Dầu ăn" value="Dầu ăn" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Địa chỉ">
                  <el-input v-model="householdForm.address" placeholder="Nhập địa chỉ..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: THÔNG TIN NGÂN HÀNG -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-cyan-500 rounded-full"></span>
              Thông tin ngân hàng
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="STK Ngân hàng">
                  <el-input v-model="householdForm.bankAccount" placeholder="Nhập số tài khoản..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ngân hàng">
                  <el-input v-model="householdForm.bankName" placeholder="Nhập tên ngân hàng..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 3: LIÊN LẠC & TELEGRAM -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-violet-650 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
              Liên lạc &amp; Telegram
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Username">
                  <el-input v-model="householdForm.username" placeholder="Nhập username Telegram..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tên nhóm Telegram">
                  <el-input v-model="householdForm.telegramGroup" placeholder="Nhập tên nhóm Telegram..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Trợ giá">
                  <el-input v-model="householdForm.is_subsidized" placeholder="Nhập số tiền trợ giá..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 4: CÔNG NỢ -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-rose-500 rounded-full"></span>
              Công nợ
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Số tiền nợ">
                  <el-input 
                    v-model="householdForm.debtAmount" 
                    placeholder="Nhập số tiền nợ"
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
                <el-form-item label="Ứng tiền cuối mùa">
                  <el-input
                    v-model="householdForm.advanceSeason"
                    placeholder="Nhập số tiền ứng cuối mùa"
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
                <el-form-item label="Ứng tiền trong tháng">
                  <el-input
                    v-model="householdForm.advanceMonthly"
                    placeholder="Nhập số tiền ứng trong tháng"
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
                <el-form-item label="Công nợ">
                  <el-input
                    v-model="householdForm.totalDebt"
                    placeholder="Nhập công nợ..."
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

    <!-- Modal Chỉnh sửa Hộ dân -->
    <el-dialog
      v-model="editDialogVisible"
      title="CHỈNH SỬA HỘ DÂN"
      class="custom-dark-dialog"
      width="900px"
      destroy-on-close
      align-center
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form :model="editForm" label-width="180px" class="mt-2 compact-form">
          <!-- PHẦN 1: THÔNG TIN CƠ BẢN -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin chung
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã Hộ dân">
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
                <el-form-item label="Số điện thoại">
                  <el-input v-model="editForm.phone" placeholder="Nhập số điện thoại..." />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Trạng thái">
                  <el-select v-model="editForm.status" placeholder="Chọn trạng thái" class="w-full highlight-select" style="width: 100%">
                    <el-option label="Hoạt động" value="Hoạt động" />
                    <el-option label="Ngừng hoạt động" value="Ngừng hoạt động" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Nguyên liệu">
                  <el-select v-model="editForm.material" placeholder="Chọn nguyên liệu" class="w-full highlight-select" style="width: 100%">
                    <el-option label="Cao su" value="Cao su" />
                    <el-option label="Củi" value="Củi" />
                    <el-option label="Acid" value="Acid" />
                    <el-option label="Amoniac" value="Amoniac" />
                    <el-option label="Dầu ăn" value="Dầu ăn" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Địa chỉ">
                  <el-input v-model="editForm.address" placeholder="Nhập địa chỉ..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: THÔNG TIN NGÂN HÀNG -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-cyan-500 rounded-full"></span>
              Thông tin ngân hàng
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="STK Ngân hàng">
                  <el-input v-model="editForm.bankAccount" placeholder="Nhập số tài khoản..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ngân hàng">
                  <el-input v-model="editForm.bankName" placeholder="Nhập tên ngân hàng..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 3: LIÊN LẠC & TELEGRAM -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-violet-650 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
              Liên lạc &amp; Telegram
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Username">
                  <el-input v-model="editForm.username" placeholder="Nhập username Telegram..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tên nhóm Telegram">
                  <el-input v-model="editForm.telegramGroup" placeholder="Nhập tên nhóm Telegram..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Trợ giá">
                  <el-input v-model="editForm.is_subsidized" placeholder="Nhập số tiền trợ giá..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 4: CÔNG NỢ -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-rose-500 rounded-full"></span>
              Công nợ
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Số tiền nợ">
                  <el-input 
                    v-model="editForm.debtAmount" 
                    placeholder="Nhập số tiền nợ"
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
                <el-form-item label="Ứng tiền cuối mùa">
                  <el-input
                    v-model="editForm.advanceSeason"
                    placeholder="Nhập số tiền ứng cuối mùa"
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
                <el-form-item label="Ứng tiền trong tháng">
                  <el-input
                    v-model="editForm.advanceMonthly"
                    placeholder="Nhập số tiền ứng trong tháng"
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
                <el-form-item label="Công nợ">
                  <el-input
                    v-model="editForm.totalDebt"
                    placeholder="Nhập công nợ..."
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

    <!-- Modal Chi tiết Hộ dân -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT HỘ DÂN"
      class="custom-dark-dialog"
      width="90%"
      style="max-width: 850px"
      destroy-on-close
      align-center
    >
      <div v-if="detailData" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto overflow-x-hidden">
        <!-- Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <el-avatar :size="64" class="bg-emerald-100 dark:bg-emerald-900">
            <span class="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {{ detailData.name ? detailData.name.charAt(0).toUpperCase() : 'H' }}
            </span>
          </el-avatar>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Hộ dân</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {{ detailData.name }}
              <span class="text-gray-400 dark:text-gray-500 font-medium">({{ detailData.code }})</span>
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <el-tag :type="detailData.status === 'Hoạt động' ? 'success' : 'danger'" effect="light" size="small" round>
                {{ detailData.status }}
              </el-tag>
              <span class="text-gray-400 dark:text-gray-500">|</span>
              <span class="text-gray-600 dark:text-gray-400 font-semibold">{{ detailData.purchasingPoint || 'Chưa rõ điểm thu mua' }}</span>
              <span class="text-gray-400 dark:text-gray-500">|</span>
              <el-tag type="info" effect="light" size="small" round>{{ detailData.material || 'Cao su' }}</el-tag>
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
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Nguyên liệu</div>
              <el-tag type="info" effect="light" size="small" round>{{ detailData.material || 'Cao su' }}</el-tag>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số điện thoại</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ detailData.phone || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Trạng thái</div>
              <el-tag :type="detailData.status === 'Hoạt động' ? 'success' : 'danger'" effect="light" size="small" round>
                {{ detailData.status }}
              </el-tag>
            </div>
          </div>
          <div class="mt-4">
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Địa chỉ</div>
            <div class="text-sm text-gray-700 dark:text-gray-300">{{ detailData.address || '—' }}</div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 2. LIÊN LẠC & TELEGRAM -->
        <div>
          <h4 class="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
            Liên lạc & Telegram
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Username</div>
              <div class="text-sm font-medium text-blue-500 dark:text-blue-400">{{ detailData.username || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Nhóm Telegram</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ detailData.telegramGroup || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Trợ giá</div>
              <div class="text-sm font-bold text-green-600 dark:text-green-400">{{ formatCurrency(detailData.is_subsidized || 0) }} VNĐ</div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 3. NGÂN HÀNG -->
        <div>
          <h4 class="text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-cyan-500 rounded-full"></span>
            Thông tin ngân hàng
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngân hàng</div>
              <div class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ detailData.bankName || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số tài khoản</div>
              <div class="text-sm font-bold text-gray-700 dark:text-gray-300">{{ detailData.bankAccount || '—' }}</div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 4. CÔNG NỢ -->
        <div>
          <h4 class="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-rose-500 rounded-full"></span>
            Công nợ
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số tiền nợ</div>
              <div class="text-sm font-bold text-red-500 dark:text-red-400">{{ formatCurrency(detailData.debtAmount || 0) }} VNĐ</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ứng tiền cuối mùa</div>
              <div class="text-sm font-bold text-orange-500 dark:text-orange-400">{{ formatCurrency(detailData.advanceSeason || 0) }} VNĐ</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ứng tiền trong tháng</div>
              <div class="text-sm font-bold text-amber-600 dark:text-amber-400">{{ formatCurrency(detailData.advanceMonthly || 0) }} VNĐ</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tổng ứng</div>
              <div class="text-sm font-bold text-orange-600 dark:text-orange-400">{{ formatCurrency(detailData.advanceAmount || 0) }} VNĐ</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tổng công nợ</div>
              <div class="text-sm font-bold text-gray-900 dark:text-white">{{ formatCurrency(detailData.totalDebt || 0) }} VNĐ</div>
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

    <!-- Modal Ứng tiền Hộ dân -->
    <el-dialog
      v-model="advanceDialogVisible"
      title="ỨNG TIỀN CHO HỘ DÂN & GIAO DỊCH TÀI CHÍNH"
      class="custom-dark-dialog"
      width="850px"
      destroy-on-close
      align-center
    >
      <div v-if="selectedRowForAdvance" class="max-h-[70vh] overflow-y-auto overflow-x-hidden px-4">
        <el-form 
          :model="advanceForm" 
          :rules="advanceRules"
          ref="advanceFormRef"
          label-width="140px" 
          class="mt-2 compact-form"
        >
          <!-- PHẦN 1: THÔNG TIN ỨNG TIỀN -->
          <div class="mb-5 pb-5 border-b border-gray-200 dark:border-gray-700">
            <h4 class="text-sm font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-orange-500 rounded-full"></span>
              1. Thông tin ứng tiền công nợ
            </h4>

            <div class="flex items-center gap-4 pb-3 mb-4 border-b border-gray-100 dark:border-gray-700">
              <el-avatar :size="48" class="bg-orange-100 dark:bg-orange-900">
                <span class="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {{ selectedRowForAdvance.name ? selectedRowForAdvance.name.charAt(0).toUpperCase() : 'H' }}
                </span>
              </el-avatar>
              <div>
                <h4 class="text-base font-bold text-gray-800 dark:text-gray-100">
                  {{ selectedRowForAdvance.name }}
                  <span class="text-gray-400 dark:text-gray-500 font-medium">({{ selectedRowForAdvance.code }})</span>
                </h4>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Điểm thu mua: <span class="font-semibold text-gray-700 dark:text-gray-300">{{ selectedRowForAdvance.purchasingPoint }}</span>
                </div>
              </div>
            </div>

            <!-- Trạng thái công nợ hiện tại -->
            <div class="grid grid-cols-4 gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 mb-4">
              <div class="text-center">
                <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Nợ hiện tại</div>
                <div class="text-xs font-bold text-red-500 mt-0.5">{{ formatCurrency(selectedRowForAdvance.debtAmount) }}</div>
              </div>
              <div class="text-center border-l border-gray-100 dark:border-gray-700">
                <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Ứng cuối mùa</div>
                <div class="text-xs font-bold text-orange-500 mt-0.5">{{ formatCurrency(selectedRowForAdvance.advanceSeason || 0) }}</div>
              </div>
              <div class="text-center border-x border-gray-100 dark:border-gray-700">
                <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Ứng trong tháng</div>
                <div class="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">{{ formatCurrency(selectedRowForAdvance.advanceMonthly || 0) }}</div>
              </div>
              <div class="text-center">
                <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Công nợ</div>
                <div class="text-xs font-bold text-gray-700 dark:text-gray-300 mt-0.5">{{ formatCurrency(selectedRowForAdvance.totalDebt) }}</div>
              </div>
            </div>

            <!-- Loại ứng tiền & số tiền ứng -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Loại ứng tiền" prop="advanceType">
                  <el-radio-group v-model="advanceForm.advanceType">
                    <el-radio value="SEASON_END">Ứng tiền cuối mùa</el-radio>
                    <el-radio value="IN_MONTH">Ứng tiền trong tháng</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Số tiền ứng" prop="amount">
                  <el-input
                    v-model="advanceForm.amount"
                    placeholder="Nhập số tiền ứng..."
                    :formatter="(value) => !value ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                    :parser="(value) => value.replace(/\./g, '')"
                    class="w-full"
                  >
                    <template #suffix>
                      <span class="text-xs text-gray-400">VNĐ</span>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20" class="mb-4">
              <el-col :span="24">
                <!-- Tóm tắt số liệu sau khi ứng -->
                <div class="p-3 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100/50 dark:border-orange-900/30 rounded-lg text-sm space-y-1">
                  <div class="flex justify-between items-center">
                    <span class="text-gray-500 dark:text-gray-400">{{ advanceTypeLabel(advanceForm.advanceType) }} mới:</span>
                    <span class="font-semibold text-orange-600 dark:text-orange-400">{{ formatCurrency(computedNewAdvanceByType) }} VNĐ</span>
                  </div>
                  <div class="flex justify-between items-center pt-1 border-t border-orange-100/50 dark:border-orange-900/30">
                    <span class="text-gray-500 dark:text-gray-400">Tổng đã ứng mới (cả hai loại):</span>
                    <span class="font-semibold text-orange-600 dark:text-orange-400">{{ formatCurrency(computedNewAdvanceTotal) }} VNĐ</span>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: THÊM MỚI GIAO DỊCH TÀI CHÍNH -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-green-500 rounded-full"></span>
              2. Giao dịch tài chính
            </h4>

            <!-- Phân loại giao dịch -->
            <div class="mb-4">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5 pl-3 border-l-2 border-green-400">
                Phân loại giao dịch
              </h4>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Quỹ tiền" prop="subFundId">
                    <el-select v-model="advanceForm.subFundId" placeholder="Chọn Quỹ tiền" class="w-full highlight-select" style="width: 100%">
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
                  <el-form-item label="Thời gian" prop="date">
                    <el-date-picker :editable="false" 
                      v-model="advanceForm.date" 
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
                      v-model="advanceForm.type" 
                      active-value="chi" 
                      inactive-value="thu" 
                      active-text="Chi tiền" 
                      inactive-text="Thu tiền" 
                      @change="handlePaymentTypeChange" 
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Mã giao dịch" prop="transactionCode">
                    <el-select v-model="advanceForm.transactionCode" placeholder="Chọn mã giao dịch" class="w-full highlight-select" style="width: 100%">
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
                      :model-value="advanceForm.amount ? `${advanceForm.amount}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''" 
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
                  <el-form-item label="Bên yêu cầu" prop="requestingParty">
                    <el-input v-model="advanceForm.requestingParty" placeholder="Nhập bên yêu cầu..." />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Bên thực hiện" prop="executingParty">
                    <el-input v-model="advanceForm.executingParty" placeholder="Nhập bên thực hiện..." />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Bên nhận" prop="receivingParty">
                    <el-input v-model="advanceForm.receivingParty" placeholder="Nhập bên nhận..." />
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
                  <el-form-item label="Trạng thái" prop="status">
                    <el-select v-model="advanceForm.status" placeholder="Chọn trạng thái" class="w-full highlight-select" style="width: 100%">
                      <el-option label="Đã chấp thuận" value="approved" />
                      <el-option label="Chưa chấp thuận" value="unapproved" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Mục đích" prop="purpose">
                    <el-input v-model="advanceForm.purpose" placeholder="Nhập mục đích..." />
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
                  <el-form-item label="Ghi chú" prop="note">
                    <el-input v-model="advanceForm.note" placeholder="Nhập ghi chú thêm..." />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="24">
                  <el-form-item label="Lí do" prop="reason">
                    <el-input 
                      v-model="advanceForm.reason" 
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
          <el-button @click="advanceDialogVisible = false">Hủy</el-button>
          <el-button type="primary" @click="submitAdvanceForm" class="bg-orange-500 border-orange-500 hover:bg-orange-600 hover:border-orange-600">
            Xác nhận &amp; Lưu giao dịch
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Modal Khấu trừ ứng tiền Hộ dân -->
    <el-dialog
      v-model="deductionDialogVisible"
      title="KHẤU TRỪ ỨNG TIỀN HỘ DÂN & GIAO DỊCH TÀI CHÍNH"
      class="custom-dark-dialog"
      width="850px"
      destroy-on-close
      align-center
    >
      <div v-if="selectedRowForDeduction" class="max-h-[70vh] overflow-y-auto overflow-x-hidden px-4">
        <el-form 
          :model="deductionForm" 
          :rules="deductionRules"
          ref="deductionFormRef"
          label-width="140px" 
          class="mt-2 compact-form"
        >
          <!-- PHẦN 1: THÔNG TIN KHẤU TRỪ -->
          <div class="mb-5 pb-5 border-b border-gray-200 dark:border-gray-700">
            <h4 class="text-sm font-bold text-red-650 dark:text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-red-500 rounded-full"></span>
              1. Thông tin khấu trừ ứng tiền công nợ
            </h4>

            <div class="flex items-center gap-4 pb-3 mb-4 border-b border-gray-100 dark:border-gray-700">
              <el-avatar :size="48" class="bg-red-100 dark:bg-red-900">
                <span class="text-lg font-bold text-red-650 dark:text-red-400">
                  {{ selectedRowForDeduction.name ? selectedRowForDeduction.name.charAt(0).toUpperCase() : 'H' }}
                </span>
              </el-avatar>
              <div>
                <h4 class="text-base font-bold text-gray-800 dark:text-gray-100">
                  {{ selectedRowForDeduction.name }}
                  <span class="text-gray-400 dark:text-gray-500 font-medium">({{ selectedRowForDeduction.code }})</span>
                </h4>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Điểm thu mua: <span class="font-semibold text-gray-700 dark:text-gray-300">{{ selectedRowForDeduction.purchasingPoint }}</span>
                </div>
              </div>
            </div>

            <!-- Trạng thái công nợ hiện tại -->
            <div class="grid grid-cols-4 gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 mb-4">
              <div class="text-center">
                <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Nợ hiện tại</div>
                <div class="text-xs font-bold text-red-500 mt-0.5">{{ formatCurrency(selectedRowForDeduction.debtAmount) }}</div>
              </div>
              <div class="text-center border-l border-gray-100 dark:border-gray-700">
                <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Ứng cuối mùa</div>
                <div class="text-xs font-bold text-orange-500 mt-0.5">{{ formatCurrency(selectedRowForDeduction.advanceSeason || 0) }}</div>
              </div>
              <div class="text-center border-x border-gray-100 dark:border-gray-700">
                <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Ứng trong tháng</div>
                <div class="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">{{ formatCurrency(selectedRowForDeduction.advanceMonthly || 0) }}</div>
              </div>
              <div class="text-center">
                <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Công nợ</div>
                <div class="text-xs font-bold text-gray-700 dark:text-gray-300 mt-0.5">{{ formatCurrency(selectedRowForDeduction.totalDebt) }}</div>
              </div>
            </div>

            <!-- Loại ứng tiền cần khấu trừ -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Loại ứng tiền" prop="advanceType">
                  <el-radio-group v-model="deductionForm.advanceType">
                    <el-radio value="SEASON_END">Ứng tiền cuối mùa</el-radio>
                    <el-radio value="IN_MONTH">Ứng tiền trong tháng</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- Nhập số tiền khấu trừ -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Số tiền khấu trừ" prop="amount">
                  <el-input 
                    v-model="deductionForm.amount" 
                    placeholder="Nhập số tiền khấu trừ..."
                    :formatter="(value) => !value ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                    :parser="(value) => value.replace(/\./g, '')"
                    class="w-full"
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
                <el-form-item label="Trừ vào công nợ">
                  <div class="flex items-center gap-3">
                    <el-switch v-model="deductionForm.deductDebt" />
                    <span class="text-xs text-gray-400 dark:text-gray-500">
                      Giảm công nợ của hộ dân tương ứng với số tiền khấu trừ
                    </span>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20" class="mb-4">
              <el-col :span="24">
                <!-- Tóm tắt số liệu sau khi khấu trừ -->
                <div class="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/30 rounded-lg text-sm space-y-1">
                  <div class="flex justify-between items-center">
                    <span class="text-gray-500 dark:text-gray-400">{{ advanceTypeLabel(deductionForm.advanceType) }} mới:</span>
                    <span class="font-semibold text-orange-500">{{ formatCurrency(computedNewAdvanceByTypeDeduction) }} VNĐ</span>
                  </div>
                  <div class="flex justify-between items-center pt-1 border-t border-red-100/50 dark:border-red-900/30">
                    <span class="text-gray-500 dark:text-gray-400">Tổng đã ứng mới (cả hai loại):</span>
                    <span class="font-semibold text-orange-500">{{ formatCurrency(computedNewAdvanceTotalDeduction) }} VNĐ</span>
                  </div>
                  <div v-if="deductionForm.deductDebt" class="flex justify-between items-center pt-1 border-t border-red-100/50 dark:border-red-900/30">
                    <span class="text-gray-500 dark:text-gray-400">Công nợ mới:</span>
                    <span class="font-semibold text-red-500">{{ formatCurrency(computedNewDebtTotal) }} VNĐ</span>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: THÊM MỚI GIAO DỊCH TÀI CHÍNH -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-green-500 rounded-full"></span>
              2. Giao dịch tài chính
            </h4>

            <!-- Phân loại giao dịch -->
            <div class="mb-4">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5 pl-3 border-l-2 border-green-400">
                Phân loại giao dịch
              </h4>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Quỹ tiền" prop="subFundId">
                    <el-select v-model="deductionForm.subFundId" placeholder="Chọn Quỹ tiền" class="w-full highlight-select" style="width: 100%">
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
                  <el-form-item label="Thời gian" prop="date">
                    <el-date-picker :editable="false" 
                      v-model="deductionForm.date" 
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
                      v-model="deductionForm.type" 
                      active-value="chi" 
                      inactive-value="thu" 
                      active-text="Chi tiền" 
                      inactive-text="Thu tiền" 
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Mã giao dịch" prop="transactionCode">
                    <el-select v-model="deductionForm.transactionCode" placeholder="Chọn mã giao dịch" class="w-full highlight-select" style="width: 100%">
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
                      :model-value="deductionForm.amount ? `${deductionForm.amount}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''" 
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
                  <el-form-item label="Bên yêu cầu" prop="requestingParty">
                    <el-input v-model="deductionForm.requestingParty" placeholder="Nhập bên yêu cầu..." />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Bên thực hiện" prop="executingParty">
                    <el-input v-model="deductionForm.executingParty" placeholder="Nhập bên thực hiện..." />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Bên nhận" prop="receivingParty">
                    <el-input v-model="deductionForm.receivingParty" placeholder="Nhập bên nhận..." />
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
                  <el-form-item label="Trạng thái" prop="status">
                    <el-select v-model="deductionForm.status" placeholder="Chọn trạng thái" class="w-full highlight-select" style="width: 100%">
                      <el-option label="Đã chấp thuận" value="approved" />
                      <el-option label="Chưa chấp thuận" value="unapproved" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Mục đích" prop="purpose">
                    <el-input v-model="deductionForm.purpose" placeholder="Nhập mục đích..." />
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
                  <el-form-item label="Ghi chú" prop="note">
                    <el-input v-model="deductionForm.note" placeholder="Nhập ghi chú thêm..." />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="24">
                  <el-form-item label="Lí do" prop="reason">
                    <el-input 
                      v-model="deductionForm.reason" 
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
          <el-button @click="deductionDialogVisible = false">Hủy</el-button>
          <el-button type="primary" @click="submitDeductionForm" class="bg-red-500 border-red-500 hover:bg-red-600 hover:border-red-600">
            Xác nhận &amp; Lưu giao dịch
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { mauSo } from '@/utils/mauSo'
import { MoreFilled, Search, Refresh } from '@element-plus/icons-vue'
import { ElNotification, ElMessage, ElMessageBox } from 'element-plus'
import { tienNgaService } from '@/api/tienNgaService'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'

const { laManHep, hienBang, hienThe } = dungManHep()

const selectedFactory = ref('all')
const selectedStatus = ref('all')
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)

const dialogVisible = ref(false)

const selectedRows = ref<any[]>([])
const handleSelectionChange = (val: any[]) => {
  selectedRows.value = val
}

const advanceFormRef = ref<any>(null)
const subFunds = ref<any[]>([])

// Dialog ứng tiền mở được từ nút trên thanh công cụ lẫn dropdown của từng dòng —
// dùng chung một hàm để hai lối vào không lệch nhau về giá trị khởi tạo.
const openAdvanceDialog = (row: any) => {
  selectedRowForAdvance.value = row

  advanceForm.amount = ''
  advanceForm.advanceType = 'SEASON_END'
  advanceForm.subFundId = subFunds.value[0]?.id || ''
  advanceForm.date = new Date().toISOString().substring(0, 10)
  advanceForm.type = 'chi'
  advanceForm.status = 'approved'
  advanceForm.requestingParty = row.name || ''
  advanceForm.executingParty = 'Tiến Nga'
  advanceForm.receivingParty = row.name || ''
  advanceForm.purpose = `Ứng tiền cho hộ dân ${row.name}`
  advanceForm.note = ''
  advanceForm.reason = `Ứng tiền ngày ${new Date().toLocaleDateString('vi-VN')}`
  advanceForm.transactionCode = 'MN'

  advanceDialogVisible.value = true
}

const handleAdvanceClick = () => {
  if (selectedRows.value.length === 1) {
    openAdvanceDialog(selectedRows.value[0])
  }
}

const advanceDialogVisible = ref(false)
const selectedRowForAdvance = ref<any>(null)
const advanceForm = reactive({
  amount: '',
  advanceType: 'SEASON_END',
  subFundId: '',
  date: new Date().toISOString().substring(0, 10),
  type: 'chi',
  status: 'approved',
  requestingParty: '',
  executingParty: '',
  receivingParty: '',
  purpose: '',
  note: '',
  reason: '',
  transactionCode: 'MN'
})

const handlePaymentTypeChange = (val: any) => {
  const type = String(val)
  const name = selectedRowForAdvance.value?.name || 'Hộ dân'
  if (type === 'chi') {
    advanceForm.requestingParty = name
    advanceForm.executingParty = 'Tiến Nga'
    advanceForm.receivingParty = name
    advanceForm.purpose = `Ứng tiền cho hộ dân ${name}`
  } else {
    advanceForm.requestingParty = name
    advanceForm.executingParty = name
    advanceForm.receivingParty = 'Tiến Nga'
    advanceForm.purpose = `Thu hồi tiền ứng từ hộ dân ${name}`
  }
}

watch(
  () => [advanceForm.type, selectedRowForAdvance.value, advanceForm.date],
  ([type, row, date]) => {
    if (row) {
      const name = (row as any).name || ''
      if (type === 'chi') {
        advanceForm.requestingParty = name
        advanceForm.executingParty = 'Tiến Nga'
        advanceForm.receivingParty = name
        advanceForm.purpose = `Ứng tiền cho hộ dân ${name}`
      } else {
        advanceForm.requestingParty = name
        advanceForm.executingParty = name
        advanceForm.receivingParty = 'Tiến Nga'
        advanceForm.purpose = `Thu hồi tiền ứng từ hộ dân ${name}`
      }
      advanceForm.reason = `Ứng tiền ngày ${date ? new Date(date as string).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}`
    }
  }
)

const advanceRules = reactive({
  amount: [{ required: true, message: 'Vui lòng nhập số tiền ứng', trigger: 'blur' }],
  subFundId: [{ required: true, message: 'Vui lòng chọn Quỹ tiền', trigger: 'change' }],
  date: [{ required: true, message: 'Vui lòng chọn ngày giao dịch', trigger: 'change' }],
  requestingParty: [{ required: true, message: 'Vui lòng nhập bên yêu cầu', trigger: 'blur' }],
  executingParty: [{ required: true, message: 'Vui lòng nhập bên thực hiện', trigger: 'blur' }],
  receivingParty: [{ required: true, message: 'Vui lòng nhập bên nhận', trigger: 'blur' }],
  purpose: [{ required: true, message: 'Vui lòng nhập mục đích', trigger: 'blur' }],
})

const advanceTypeLabel = (advanceType: string) => {
  return advanceType === 'IN_MONTH' ? 'Ứng tiền trong tháng' : 'Ứng tiền cuối mùa'
}

/** Số dư hiện tại của đúng loại ứng đang chọn trên một dòng hộ dân. */
const advanceBalanceByType = (row: any, advanceType: string) => {
  if (!row) return 0
  return (advanceType === 'IN_MONTH' ? row.advanceMonthly : row.advanceSeason) || 0
}

const computedNewAdvanceTotal = computed(() => {
  if (!selectedRowForAdvance.value) return 0
  const current = selectedRowForAdvance.value.advanceAmount || 0
  const additional = parseFloat(String(advanceForm.amount).replace(/\./g, '')) || 0
  return current + additional
})

const computedNewAdvanceByType = computed(() => {
  const current = advanceBalanceByType(selectedRowForAdvance.value, advanceForm.advanceType)
  const additional = parseFloat(String(advanceForm.amount).replace(/\./g, '')) || 0
  return current + additional
})


const submitAdvanceForm = async () => {
  if (!advanceFormRef.value) return
  await advanceFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      const row = selectedRowForAdvance.value
      if (!row) return
      
      const additionalAmount = parseFloat(String(advanceForm.amount).replace(/\./g, '')) || 0
      if (additionalAmount <= 0) {
        ElMessage.warning('Vui lòng nhập số tiền ứng hợp lệ')
        return
      }

      loading.value = true
      try {
        // 1. Ghi nhận Ứng tiền cho hộ dân
        const payload = [
          {
            hoursehold_id: row.code,
            amount: additionalAmount,
            advance_type: advanceForm.advanceType
          }
        ]

        const response = await tienNgaService.processAdvanceAmount(payload)

        if (response && response.length > 0) {
          const res = response[0]
          if (res.success) {
            row.advanceSeason = res.new_season_advance || 0
            row.advanceMonthly = res.new_monthly_advance || 0
            row.advanceAmount = res.new_advance || 0

            // 2. Ghi nhận Giao dịch tài chính (Chi tiền từ Quỹ tiền đã chọn)
            const paymentPayload = [{
              investment_id: advanceForm.subFundId,
              requester: advanceForm.requestingParty,
              executor: advanceForm.executingParty,
              receiver: advanceForm.receivingParty,
              payment_type: advanceForm.type,
              purpose: advanceForm.purpose,
              reason: advanceForm.reason,
              amount: additionalAmount,
              day: advanceForm.date,
              status: advanceForm.status === 'approved' ? 'APPROVED' : 'UNAPPROVED',
              notes: advanceForm.note,
              transaction_code: advanceForm.transactionCode
            }]
            
            await tienNgaService.addDailyPayments(paymentPayload)

            // Sync changes back to allData array for reactivity
            const index = allData.value.findIndex(item => item.id === row.id)
            if (index !== -1) {
              allData.value[index] = { ...row }
            }

            ElNotification({
              title: 'Thành công',
              message: `Đã ứng thêm ${formatCurrency(additionalAmount)} VNĐ `
                + `(${advanceTypeLabel(advanceForm.advanceType).toLowerCase()}) `
                + `và tạo giao dịch tài chính cho Hộ dân ${row.name} thành công!`,
              type: 'success',
            })
            
            advanceDialogVisible.value = false
          } else {
            ElMessageBox.alert(
              `<div class="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">${res.message}</div>
               <div class="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/80 p-3 rounded-lg border border-gray-200 dark:border-gray-700 whitespace-pre-wrap leading-relaxed">${res.reason || ''}</div>`,
              'Không thể thực hiện ứng tiền',
              {
                dangerouslyUseHTMLString: true,
                confirmButtonText: 'Đóng',
                type: 'warning'
              }
            )
          }
        }
      } catch (error: any) {
        ElMessage.error(error.message || 'Không thể thực hiện ứng tiền')
      } finally {
        loading.value = false
      }
    }
  })
}

const deductionFormRef = ref<any>(null)
const deductionDialogVisible = ref(false)
const selectedRowForDeduction = ref<any>(null)
const deductionForm = reactive({
  amount: '',
  advanceType: 'SEASON_END',
  deductDebt: true,
  subFundId: '',
  date: new Date().toISOString().substring(0, 10),
  type: 'thu',
  status: 'approved',
  requestingParty: '',
  executingParty: '',
  receivingParty: '',
  purpose: '',
  note: '',
  reason: '',
  transactionCode: 'MN'
})

const deductionRules = reactive({
  amount: [{ required: true, message: 'Vui lòng nhập số tiền khấu trừ', trigger: 'blur' }],
  subFundId: [{ required: true, message: 'Vui lòng chọn Quỹ tiền', trigger: 'change' }],
  date: [{ required: true, message: 'Vui lòng chọn ngày giao dịch', trigger: 'change' }],
  requestingParty: [{ required: true, message: 'Vui lòng nhập bên yêu cầu', trigger: 'blur' }],
  executingParty: [{ required: true, message: 'Vui lòng nhập bên thực hiện', trigger: 'blur' }],
  receivingParty: [{ required: true, message: 'Vui lòng nhập bên nhận', trigger: 'blur' }],
  purpose: [{ required: true, message: 'Vui lòng nhập mục đích', trigger: 'blur' }],
})

const openDeductionDialog = (row: any) => {
  selectedRowForDeduction.value = row

  deductionForm.amount = ''
  deductionForm.advanceType = 'SEASON_END'
  deductionForm.deductDebt = true
  deductionForm.subFundId = subFunds.value[0]?.id || ''
  deductionForm.date = new Date().toISOString().substring(0, 10)
  deductionForm.type = 'thu'
  deductionForm.status = 'approved'
  deductionForm.requestingParty = row.name || ''
  deductionForm.executingParty = row.name || ''
  deductionForm.receivingParty = 'Tiến Nga'
  deductionForm.purpose = `Khấu trừ ứng tiền cho hộ dân ${row.name}`
  deductionForm.note = ''
  deductionForm.reason = `Khấu trừ ứng tiền ngày ${new Date().toLocaleDateString('vi-VN')}`
  deductionForm.transactionCode = 'MN'

  deductionDialogVisible.value = true
}

const handleDeductionClick = () => {
  if (selectedRows.value.length === 1) {
    openDeductionDialog(selectedRows.value[0])
  }
}

watch(
  () => [deductionForm.type, selectedRowForDeduction.value, deductionForm.date],
  ([type, row, date]) => {
    if (row) {
      const name = (row as any).name || ''
      if (type === 'chi') {
        deductionForm.requestingParty = name
        deductionForm.executingParty = 'Tiến Nga'
        deductionForm.receivingParty = name
        deductionForm.purpose = `Ứng tiền cho hộ dân ${name}`
      } else {
        deductionForm.requestingParty = name
        deductionForm.executingParty = name
        deductionForm.receivingParty = 'Tiến Nga'
        deductionForm.purpose = `Khấu trừ ứng tiền cho hộ dân ${name}`
      }
      deductionForm.reason = `Khấu trừ ứng tiền ngày ${date ? new Date(date as string).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}`
    }
  }
)

const computedNewDebtTotal = computed(() => {
  if (!selectedRowForDeduction.value) return 0
  const current = selectedRowForDeduction.value.totalDebt || 0
  const deduction = parseFloat(String(deductionForm.amount).replace(/\./g, '')) || 0
  return Math.max(0, current - deduction)
})

const computedNewAdvanceTotalDeduction = computed(() => {
  if (!selectedRowForDeduction.value) return 0
  const current = selectedRowForDeduction.value.advanceAmount || 0
  const deduction = parseFloat(String(deductionForm.amount).replace(/\./g, '')) || 0
  return Math.max(0, current - deduction)
})

const computedNewAdvanceByTypeDeduction = computed(() => {
  const current = advanceBalanceByType(selectedRowForDeduction.value, deductionForm.advanceType)
  const deduction = parseFloat(String(deductionForm.amount).replace(/\./g, '')) || 0
  return Math.max(0, current - deduction)
})

const submitDeductionForm = async () => {
  if (!deductionFormRef.value) return
  await deductionFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      const row = selectedRowForDeduction.value
      if (!row) return
      
      const deductionAmount = parseFloat(String(deductionForm.amount).replace(/\./g, '')) || 0
      if (deductionAmount <= 0) {
        ElMessage.warning('Vui lòng nhập số tiền khấu trừ hợp lệ')
        return
      }
      
      // Backend chỉ cho khấu trừ trong phạm vi số dư của đúng loại ứng đang chọn.
      const currentTypeBalance = advanceBalanceByType(row, deductionForm.advanceType)
      if (deductionAmount > currentTypeBalance) {
        ElMessage.warning(
          `${advanceTypeLabel(deductionForm.advanceType)} chỉ còn ${formatCurrency(currentTypeBalance)} VNĐ, không đủ để khấu trừ`
        )
        return
      }

      // Chỉ chặn theo công nợ khi thao tác này thực sự trừ vào công nợ. Khi tắt
      // toggle, giới hạn duy nhất là số dư tiền ứng ở trên.
      if (deductionForm.deductDebt && deductionAmount > (row.totalDebt || 0)) {
        ElMessage.warning('Số tiền khấu trừ vượt quá công nợ hiện tại')
        return
      }

      loading.value = true
      try {
        // 1. Ghi nhận Khấu trừ ứng tiền cho hộ dân
        const payload = [
          {
            hoursehold_id: row.code,
            amount: deductionAmount,
            advance_type: deductionForm.advanceType,
            deduct_debt: deductionForm.deductDebt
          }
        ]

        const response = await tienNgaService.processDeductionAdvanceAmount(payload)

        if (response && response.length > 0) {
          const res = response[0]
          if (res.success) {
            row.totalDebt = res.new_debt || 0
            row.advanceSeason = res.new_season_advance || 0
            row.advanceMonthly = res.new_monthly_advance || 0
            row.advanceAmount = res.new_advance || 0

            // 2. Ghi nhận Giao dịch tài chính
            const paymentPayload = [{
              investment_id: deductionForm.subFundId,
              requester: deductionForm.requestingParty,
              executor: deductionForm.executingParty,
              receiver: deductionForm.receivingParty,
              payment_type: deductionForm.type,
              purpose: deductionForm.purpose,
              reason: deductionForm.reason,
              amount: deductionAmount,
              day: deductionForm.date,
              status: deductionForm.status === 'approved' ? 'APPROVED' : 'UNAPPROVED',
              notes: deductionForm.note,
              transaction_code: deductionForm.transactionCode
            }]
            
            await tienNgaService.addDailyPayments(paymentPayload)

            // Sync changes back to allData array for reactivity
            const index = allData.value.findIndex(item => item.id === row.id)
            if (index !== -1) {
              allData.value[index] = { ...row }
            }

            ElNotification({
              title: 'Thành công',
              message: `Đã khấu trừ ${formatCurrency(deductionAmount)} VNĐ `
                + `(${advanceTypeLabel(deductionForm.advanceType).toLowerCase()})`
                + (deductionForm.deductDebt ? ' và trừ vào công nợ' : ' (không trừ công nợ)')
                + `, đồng thời tạo giao dịch tài chính cho Hộ dân ${row.name} thành công!`,
              type: 'success',
            })
            
            deductionDialogVisible.value = false
          } else {
            ElMessageBox.alert(
              `<div class="text-sm font-semibold text-red-650 dark:text-red-400 mb-2">${res.message}</div>`,
              'Không thể thực hiện khấu trừ',
              {
                dangerouslyUseHTMLString: true,
                confirmButtonText: 'Đóng',
                type: 'warning'
              }
            )
          }
        }
      } catch (error: any) {
        ElMessage.error(error.message || 'Không thể thực hiện khấu trừ')
      } finally {
        loading.value = false
      }
    }
  })
}

const householdForm = reactive({
  code: '',
  name: '',
  purchasingPoint: '',
  phone: '',
  address: '',
  bankAccount: '',
  bankName: '',
  status: 'Hoạt động',
  username: '',
  telegramGroup: '',
  debtAmount: '0',
  advanceSeason: '0',
  advanceMonthly: '0',
  material: 'Cao su',
  totalDebt: '0',
  is_subsidized: '0'
})

const generateUUID = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const resetForm = () => {
  householdForm.code = ''
  householdForm.name = ''
  householdForm.purchasingPoint = ''
  householdForm.phone = ''
  householdForm.address = ''
  householdForm.bankAccount = ''
  householdForm.bankName = ''
  householdForm.status = 'Hoạt động'
  householdForm.username = ''
  householdForm.telegramGroup = ''
  householdForm.debtAmount = '0'
  householdForm.advanceSeason = '0'
  householdForm.advanceMonthly = '0'
  householdForm.material = 'Cao su'
  householdForm.totalDebt = '0'
  householdForm.is_subsidized = '0'
}

const submitForm = async () => {
  if (!householdForm.code) {
    ElMessage.warning('Vui lòng nhập Mã Hộ dân')
    return
  }
  if (!householdForm.name) {
    ElMessage.warning('Vui lòng nhập Họ và tên Hộ dân')
    return
  }
  if (!householdForm.purchasingPoint) {
    ElMessage.warning('Vui lòng chọn Điểm thu mua')
    return
  }

  loading.value = true
  try {
    const matchedPoint = collectionPoints.value.find(p => p.collection_name === householdForm.purchasingPoint)
    
    const customerId = generateUUID()
    const customerPayload = {
      id: customerId,
      fullname: householdForm.name,
      hoursehold_id: householdForm.code || `HD${String(allData.value.length + 1).padStart(3, '0')}`,
      collection_point_id: matchedPoint ? matchedPoint.id : null,
      number_phone: householdForm.phone || null,
      address: householdForm.address || null,
      ingredient: householdForm.material || 'Cao su',
      amount_of_debt: parseFloat(parseFloat(householdForm.debtAmount || '0').toFixed(2)),
      cash_advance: parseFloat(parseFloat(householdForm.advanceSeason || '0').toFixed(2)),
      cash_advance_monthly: parseFloat(parseFloat(householdForm.advanceMonthly || '0').toFixed(2)),
      total_debt: parseFloat(parseFloat(householdForm.totalDebt || '0').toFixed(2)),
      status: householdForm.status === 'Hoạt động' ? 'ACTIVE' : 'INACTIVE',
      username: householdForm.username || null,
      telegram_group: householdForm.telegramGroup || null,
      number_bank: householdForm.bankAccount || null,
      bank_name: householdForm.bankName || null,
      is_subsidized: parseFloat(parseFloat(householdForm.is_subsidized || '0').toFixed(2))
    }

    const response = await tienNgaService.addCustomers([customerPayload])
    
    if (response && response.length > 0) {
      const newCust = response[0]
      allData.value.unshift({
        id: newCust.id,
        code: newCust.hoursehold_id || newCust.id,
        name: newCust.fullname || 'Chưa rõ',
        purchasingPoint: newCust.collection_name || householdForm.purchasingPoint || 'Không rõ',
        phone: newCust.number_phone || 'Chưa có',
        address: newCust.address || 'Chưa có',
        bankAccount: newCust.number_bank || 'Chưa có',
        bankName: newCust.bank_name || 'Chưa có',
        status: newCust.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động',
        username: newCust.username ? (newCust.username.startsWith('@') ? newCust.username : `@${newCust.username}`) : 'Chưa có',
        telegramGroup: newCust.telegram_group || 'Chưa có',
        debtAmount: newCust.amount_of_debt || 0,
        advanceSeason: newCust.cash_advance || 0,
        advanceMonthly: newCust.cash_advance_monthly || 0,
        advanceAmount: (newCust.cash_advance || 0) + (newCust.cash_advance_monthly || 0),
        totalDebt: newCust.total_debt || 0,
        material: newCust.ingredient || 'Cao su',
        is_subsidized: newCust.is_subsidized || 0
      })

      ElNotification({
        title: 'Thành công',
        message: 'Đã thêm Hộ dân mới thành công!',
        type: 'success',
      })
      
      resetForm()
      dialogVisible.value = false
    }
  } catch (error: any) {
    ElMessage.error(error.message || 'Không thể thêm Hộ dân mới')
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

const editDialogVisible = ref(false)
const editingRow = ref<any>(null)
const detailDialogVisible = ref(false)
const detailData = ref<any>(null)
const editForm = reactive({
  code: '',
  name: '',
  purchasingPoint: '',
  phone: '',
  address: '',
  bankAccount: '',
  bankName: '',
  status: '',
  username: '',
  telegramGroup: '',
  debtAmount: '',
  advanceSeason: '',
  advanceMonthly: '',
  material: '',
  totalDebt: '',
  is_subsidized: ''
})

const submitEditForm = async () => {
  if (!editForm.name) {
    ElMessage.warning('Vui lòng nhập Họ và tên Hộ dân')
    return
  }
  if (!editForm.purchasingPoint) {
    ElMessage.warning('Vui lòng chọn Điểm thu mua')
    return
  }

  loading.value = true
  try {
    const matchedPoint = collectionPoints.value.find(p => p.collection_name === editForm.purchasingPoint)
    
    const customerPayload = {
      id: editingRow.value?.id,
      fullname: editForm.name,
      hoursehold_id: editForm.code,
      collection_point_id: matchedPoint ? matchedPoint.id : null,
      number_phone: editForm.phone || null,
      address: editForm.address || null,
      ingredient: editForm.material || 'Cao su',
      amount_of_debt: parseFloat(parseFloat(editForm.debtAmount || '0').toFixed(2)),
      cash_advance: parseFloat(parseFloat(editForm.advanceSeason || '0').toFixed(2)),
      cash_advance_monthly: parseFloat(parseFloat(editForm.advanceMonthly || '0').toFixed(2)),
      total_debt: parseFloat(parseFloat(editForm.totalDebt || '0').toFixed(2)),
      status: editForm.status === 'Hoạt động' ? 'ACTIVE' : 'INACTIVE',
      username: editForm.username || null,
      telegram_group: editForm.telegramGroup || null,
      number_bank: editForm.bankAccount || null,
      bank_name: editForm.bankName || null,
      is_subsidized: parseFloat(parseFloat(editForm.is_subsidized || '0').toFixed(2))
    }

    const response = await tienNgaService.updateCustomers([customerPayload])
    
    if (response && response.length > 0 && editingRow.value) {
      const updatedCust = response[0]
      const row = editingRow.value
      row.name = updatedCust.fullname || editForm.name
      row.purchasingPoint = updatedCust.collection_name || editForm.purchasingPoint
      row.phone = updatedCust.number_phone || 'Chưa có'
      row.address = updatedCust.address || 'Chưa có'
      row.bankAccount = updatedCust.number_bank || 'Chưa có'
      row.bankName = updatedCust.bank_name || 'Chưa có'
      row.status = updatedCust.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động'
      row.username = updatedCust.username ? (updatedCust.username.startsWith('@') ? updatedCust.username : `@${updatedCust.username}`) : 'Chưa có'
      row.telegramGroup = updatedCust.telegram_group || 'Chưa có'
      row.debtAmount = updatedCust.amount_of_debt || 0
      row.advanceSeason = updatedCust.cash_advance || 0
      row.advanceMonthly = updatedCust.cash_advance_monthly || 0
      row.advanceAmount = (updatedCust.cash_advance || 0) + (updatedCust.cash_advance_monthly || 0)
      row.totalDebt = updatedCust.total_debt || 0
      row.material = updatedCust.ingredient || 'Cao su'
      row.is_subsidized = updatedCust.is_subsidized || 0

      // Sync changes back to allData array for reactivity
      const index = allData.value.findIndex(item => item.id === row.id)
      if (index !== -1) {
        allData.value[index] = { ...row }
      }

      ElNotification({
        title: 'Thành công',
        message: 'Đã cập nhật thông tin Hộ dân thành công!',
        type: 'success',
      })
      
      editDialogVisible.value = false
    }
  } catch (error: any) {
    ElMessage.error(error.message || 'Không thể cập nhật thông tin Hộ dân')
  } finally {
    loading.value = false
  }
}

const handleCommand = (command: string, row: any) => {
  if (command === 'edit') {
    editingRow.value = row
    editForm.code = row.code
    editForm.name = row.name
    editForm.purchasingPoint = row.purchasingPoint
    editForm.phone = row.phone
    editForm.address = row.address
    editForm.bankAccount = row.bankAccount
    editForm.bankName = row.bankName
    editForm.status = row.status
    editForm.username = row.username
    editForm.telegramGroup = row.telegramGroup
    editForm.debtAmount = String(row.debtAmount)
    editForm.advanceSeason = String(row.advanceSeason ?? 0)
    editForm.advanceMonthly = String(row.advanceMonthly ?? 0)
    editForm.material = row.material || ''
    editForm.totalDebt = String(row.totalDebt || '')
    editForm.is_subsidized = String(row.is_subsidized || 0)
    editDialogVisible.value = true
  } else if (command === 'delete') {
    ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa Hộ dân "${row.name}" không?`,
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
          await tienNgaService.deleteCustomers([row.id])
          const index = allData.value.findIndex(item => item.id === row.id)
          if (index !== -1) {
            allData.value.splice(index, 1)
            ElNotification({
              title: 'Thành công',
              message: 'Đã xóa Hộ dân thành công!',
              type: 'success',
            })
          }
        } catch (error: any) {
          ElMessage.error(error.message || 'Không thể xóa Hộ dân')
        } finally {
          loading.value = false
        }
      })
      .catch(() => {})
  } else if (command === 'detail') {
    detailData.value = row
    detailDialogVisible.value = true
  } else if (command === 'advance') {
    openAdvanceDialog(row)
  } else if (command === 'deduction') {
    openDeductionDialog(row)
  } else {
    console.log(`Action: ${command} on Code: ${row.code}`)
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value)
}

const allData = ref<any[]>([])

const fetchCustomers = async () => {
  loading.value = true
  try {
    const customers = await tienNgaService.getCustomers('cao su')
    allData.value = customers.map(item => ({
      id: item.id,
      code: item.hoursehold_id || item.id,
      name: item.fullname || 'Chưa rõ',
      purchasingPoint: item.collection_name || 'Không rõ',
      phone: item.number_phone || 'Chưa có',
      address: item.address || 'Chưa có',
      bankAccount: item.number_bank || 'Chưa có',
      bankName: item.bank_name || 'Chưa có',
      status: item.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động',
      username: item.username ? (item.username.startsWith('@') ? item.username : `@${item.username}`) : 'Chưa có',
      telegramGroup: item.telegram_group || 'Chưa có',
      debtAmount: item.amount_of_debt || 0,
      advanceSeason: item.cash_advance || 0,
      advanceMonthly: item.cash_advance_monthly || 0,
      advanceAmount: (item.cash_advance || 0) + (item.cash_advance_monthly || 0),
      totalDebt: item.total_debt || 0,
      material: item.ingredient || 'Cao su',
      is_subsidized: item.is_subsidized || 0
    }))
  } catch (error: any) {
    ElMessage.error(error.message || 'Không thể tải danh sách Hộ dân')
  } finally {
    loading.value = false
  }
}

const collectionPoints = ref<any[]>([])

const fetchCollectionPoints = async () => {
  try {
    const data = await tienNgaService.getCollectionPoints('Cao su')
    collectionPoints.value = data
  } catch (error: any) {
    console.error('Failed to fetch collection points:', error)
  }
}

const fetchSubFunds = async () => {
  try {
    const data = await tienNgaService.getInvestments({ role: 'member' })
    subFunds.value = data.filter((item: any) => item.status === 'ACTIVE')
  } catch (error: any) {
    console.error('Failed to fetch sub funds:', error)
  }
}

onMounted(() => {
  fetchCustomers()
  fetchCollectionPoints()
  fetchSubFunds()
})

const filteredData = computed(() => {
  return allData.value.filter(item => {
    // Filter by factory
    if (selectedFactory.value !== 'all' && item.purchasingPoint !== selectedFactory.value) {
      return false
    }
    // Filter by status
    if (selectedStatus.value !== 'all' && item.status !== selectedStatus.value) {
      return false
    }
    // Filter by search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      const codeMatch = item.code?.toLowerCase().includes(query)
      const nameMatch = item.name?.toLowerCase().includes(query)
      const phoneMatch = item.phone?.toLowerCase().includes(query)
      const addressMatch = item.address?.toLowerCase().includes(query)
      return codeMatch || nameMatch || phoneMatch || addressMatch
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
.households-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

/* Cho phân trang tự xuống dòng khi có nhiều trang */
.households-container :deep(.el-pagination) {
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

/* Tùy chỉnh toàn diện bảng cho Dark Mode */
html.dark .households-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827; /* bg-gray-900 */
  --el-table-row-hover-bg-color: #374151; /* bg-gray-700 */
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .households-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .households-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

/* Fix nền cột cố định (fixed columns) trong Dark mode */
html.dark .households-container :deep(.el-table .el-table-fixed-column--left),
html.dark .households-container :deep(.el-table .el-table-fixed-column--right) {
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

/* Tùy chỉnh dialog (không scoped) */
.custom-dark-dialog .el-form-item__label {
  white-space: nowrap;
  color: #2563eb; /* text-blue-600 */
  font-weight: 500;
}

.custom-dark-dialog .el-dialog__title {
  color: #2563eb; /* text-blue-600 */
  font-weight: bold;
}

.custom-dark-dialog .el-dialog__header {
  text-align: center;
}

/* Tùy chỉnh dialog trong Dark Mode (không scoped) */
html.dark .custom-dark-dialog {
  background-color: #1f2937;
}

html.dark .custom-dark-dialog .el-dialog__title {
  color: #3b82f6; /* text-blue-500 */
}

html.dark .custom-dark-dialog .el-form-item__label {
  color: #60a5fa; /* text-blue-400 */
}

html.dark .custom-dark-dialog .el-input__wrapper,
html.dark .custom-dark-dialog .el-select__wrapper {
  background-color: #374151;
  box-shadow: 0 0 0 1px #4b5563 inset;
}

html.dark .custom-dark-dialog .el-input__inner {
  color: #f3f4f6;
}

html.dark .custom-dark-dialog .el-input-number__increase,
html.dark .custom-dark-dialog .el-input-number__decrease {
  background-color: #4b5563;
  color: #f3f4f6;
  border-color: #6b7280;
}

/* Tùy chỉnh Notification trong Dark Mode (không scoped) */
html.dark .el-notification {
  background-color: #1f2937;
  border-color: #374151;
}

html.dark .el-notification .el-notification__title {
  color: #f3f4f6;
}

html.dark .el-notification .el-notification__content {
  color: #d1d5db;
}

html.dark .el-notification .el-notification__closeBtn {
  color: #9ca3af;
}

html.dark .el-notification .el-notification__closeBtn:hover {
  color: #f3f4f6;
}

/* Đổi màu background các ô select nổi bật (Điểm thu mua, Trạng thái) trong Dark Mode */
html.dark .highlight-select .el-input__wrapper,
html.dark .highlight-select .el-select__wrapper,
html.dark .custom-dark-dialog .highlight-select .el-input__wrapper,
html.dark .custom-dark-dialog .highlight-select .el-select__wrapper {
  background-color: #111827 !important;
  border-color: #111827 !important;
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
