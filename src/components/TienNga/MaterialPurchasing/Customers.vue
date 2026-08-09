<template>
  <div class="customers-container h-full flex flex-col">
    <div class="flex flex-wrap justify-between items-center gap-x-4 gap-y-4 mb-4 shrink-0">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-4">
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Nguyên liệu:</span>
          <el-select 
            v-model="selectedMaterial" 
            placeholder="Chọn nguyên liệu" 
            style="width: 180px"
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Tất cả" value="all" />
            <el-option label="Acid" value="Acid" />
            <el-option label="Amoniac" value="Amoniac" />
            <el-option label="Dầu ăn" value="Dầu ăn" />
            <el-option label="Củi" value="Củi" />
            <el-option label="Cao su" value="Cao su" />
            <el-option label="Túi PE" value="Túi PE" />
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
          type="success" 
          :disabled="selectedRows.length !== 1" 
          @click="handlePayDebtClick"
        >
          Chi trả công nợ
        </el-button>
        <el-button type="primary" @click="dialogVisible = true">Thêm Khách hàng</el-button>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
      <el-table :data="tableData" style="width: 100%" class="flex-1" height="100%" v-loading="loading" @selection-change="handleSelectionChange" @sort-change="handleSortChange">
        <!-- Fixed Columns -->
        <el-table-column type="selection" width="55" fixed />
        <el-table-column label="STT" width="60" align="center" fixed>
          <template #default="{ $index }">
            <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="Mã KH" width="120" sortable="custom" fixed />

        <el-table-column prop="name" label="Họ và tên" min-width="300" show-overflow-tooltip>
          <template #default="scope">
            <span class="whitespace-nowrap font-semibold text-gray-800 dark:text-gray-200">{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="purchasingPoint" label="Điểm thu mua" width="150" />
        <el-table-column prop="material" label="Nguyên liệu" width="140">
          <template #default="scope">
            <el-tag :type="getMaterialTagType(scope.row.material)" effect="light" round>
              {{ scope.row.material }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="Số điện thoại" width="130" />
        <el-table-column prop="address" label="Địa chỉ" min-width="250" />
        <el-table-column prop="bankAccount" label="STK Ngân hàng" width="150" />
        <el-table-column prop="bankName" label="Ngân hàng" min-width="220" show-overflow-tooltip />
        
        <el-table-column prop="status" label="Trạng thái" width="140" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'Hoạt động' ? 'success' : 'danger'" effect="light" round>
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="is_subsidized" label="Trợ giá" width="120" align="right">
          <template #default="scope">
            <span class="font-medium text-green-600">{{ formatCurrency(scope.row.is_subsidized || 0) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="username" label="Username" width="150">
          <template #default="scope">
            <span class="text-blue-500">{{ scope.row.username }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="telegramGroup" label="Tên nhóm Telegram" width="230" />

        <el-table-column prop="debtAmount" label="Số tiền nợ" width="150" align="right">
          <template #default="scope">
            <span class="font-medium text-red-500">{{ formatCurrency(scope.row.debtAmount) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="advanceAmount" label="Ứng tiền" width="150" align="right">
          <template #default="scope">
            <span class="font-medium text-orange-500">{{ formatCurrency(scope.row.advanceAmount) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="totalDebt" label="Công nợ" width="150" align="right">
          <template #default="scope">
            <span class="font-bold">{{ formatCurrency(scope.row.totalDebt) }}</span>
          </template>
        </el-table-column>

        <!-- Fixed Right Operations -->
        <el-table-column fixed="right" label="Thao tác" width="90" align="center">
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

    <!-- Modal Thêm Khách hàng -->
    <el-dialog
      v-model="dialogVisible"
      title="THÊM KHÁCH HÀNG"
      class="custom-dark-dialog"
      width="900px"
      destroy-on-close
      align-center
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form :model="customerForm" label-width="180px" class="mt-2 compact-form">
          <!-- PHẦN 1: THÔNG TIN CHUNG -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin chung
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã Khách hàng" required>
                  <el-input v-model="customerForm.code" placeholder="Nhập mã khách hàng..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Họ và tên" required>
                  <el-input v-model="customerForm.name" placeholder="Nhập họ và tên..." />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Điểm thu mua" required>
                  <el-select v-model="customerForm.purchasingPoint" placeholder="Chọn điểm thu mua" class="w-full highlight-select" style="width: 100%">
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
                  <el-input v-model="customerForm.phone" placeholder="Nhập số điện thoại..." />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Trạng thái">
                  <el-select v-model="customerForm.status" placeholder="Chọn trạng thái" class="w-full highlight-select" style="width: 100%">
                    <el-option label="Hoạt động" value="Hoạt động" />
                    <el-option label="Ngừng hoạt động" value="Ngừng hoạt động" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Nguyên liệu">
                  <el-select v-model="customerForm.material" placeholder="Chọn nguyên liệu" class="w-full highlight-select" style="width: 100%">
                    <el-option label="Acid" value="Acid" />
                    <el-option label="Amoniac" value="Amoniac" />
                    <el-option label="Dầu ăn" value="Dầu ăn" />
                    <el-option label="Củi" value="Củi" />
                    <el-option label="Cao su" value="Cao su" />
                    <el-option label="Túi PE" value="Túi PE" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Địa chỉ">
                  <el-input v-model="customerForm.address" placeholder="Nhập địa chỉ..." />
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
                  <el-input v-model="customerForm.bankAccount" placeholder="Nhập số tài khoản..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ngân hàng">
                  <el-input v-model="customerForm.bankName" placeholder="Nhập tên ngân hàng..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 3: LIÊN LẠC & TELEGRAM -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-violet-655 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
              Liên lạc &amp; Telegram
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Username">
                  <el-input v-model="customerForm.username" placeholder="Nhập username Telegram..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tên nhóm Telegram">
                  <el-input v-model="customerForm.telegramGroup" placeholder="Nhập tên nhóm Telegram..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Trợ giá">
                  <el-input 
                    v-model="customerForm.is_subsidized" 
                    placeholder="Nhập số tiền trợ giá..."
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
                    v-model="customerForm.debtAmount" 
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
                <el-form-item label="Ứng tiền">
                  <el-input 
                    v-model="customerForm.advanceAmount" 
                    placeholder="Nhập số tiền ứng"
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
                <el-form-item label="Công nợ">
                  <el-input 
                    v-model="customerForm.totalDebt" 
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

    <!-- Modal Chỉnh sửa Khách hàng -->
    <el-dialog
      v-model="editDialogVisible"
      title="CHỈNH SỬA KHÁCH HÀNG"
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
                <el-form-item label="Mã KH">
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
                    <el-option label="Acid" value="Acid" />
                    <el-option label="Amoniac" value="Amoniac" />
                    <el-option label="Dầu ăn" value="Dầu ăn" />
                    <el-option label="Củi" value="Củi" />
                    <el-option label="Cao su" value="Cao su" />
                    <el-option label="Túi PE" value="Túi PE" />
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
            <h4 class="text-sm font-bold text-violet-655 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
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
                  <el-input 
                    v-model="editForm.is_subsidized" 
                    placeholder="Nhập số tiền trợ giá..."
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
                <el-form-item label="Ứng tiền">
                  <el-input 
                    v-model="editForm.advanceAmount" 
                    placeholder="Nhập số tiền ứng"
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

    <!-- Modal Chi tiết Khách hàng -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT KHÁCH HÀNG"
      class="custom-dark-dialog"
      width="90%"
      style="max-width: 850px"
      destroy-on-close
      align-center
    >
      <div v-if="detailData" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto overflow-x-hidden">
        <!-- Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <el-avatar :size="64" class="bg-amber-100 dark:bg-amber-900">
            <span class="text-xl font-bold text-amber-600 dark:text-amber-400">
              {{ detailData.name ? detailData.name.charAt(0).toUpperCase() : 'K' }}
            </span>
          </el-avatar>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Khách hàng</div>
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
              <el-tag :type="getMaterialTagType(detailData.material)" effect="light" size="small" round>{{ detailData.material || 'Không rõ' }}</el-tag>
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
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã KH</div>
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
              <el-tag :type="getMaterialTagType(detailData.material)" effect="light" size="small" round>{{ detailData.material || 'Không rõ' }}</el-tag>
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
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ứng tiền</div>
              <div class="text-sm font-bold text-orange-500 dark:text-orange-400">{{ formatCurrency(detailData.advanceAmount || 0) }} VNĐ</div>
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

    <!-- Modal Chi trả công nợ -->
    <el-dialog
      v-model="payDebtDialogVisible"
      title="CHI TRẢ CÔNG NỢ & GIAO DỊCH TÀI CHÍNH"
      class="custom-dark-dialog"
      width="850px"
      destroy-on-close
      align-center
    >
      <div v-if="selectedRowForPayDebt" class="max-h-[70vh] overflow-y-auto overflow-x-hidden px-4">
        <el-form 
          :model="payDebtForm" 
          :rules="payDebtRules"
          ref="payDebtFormRef"
          label-width="140px" 
          class="mt-2 compact-form"
        >
          <!-- PHẦN 1: THÔNG TIN CHI TRẢ -->
          <div class="mb-5 pb-5 border-b border-gray-200 dark:border-gray-700">
            <h4 class="text-sm font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-orange-500 rounded-full"></span>
              1. Thông tin khách hàng và số tiền trả
            </h4>

            <div class="flex items-center gap-4 pb-3 mb-4 border-b border-gray-100 dark:border-gray-700">
              <el-avatar :size="48" class="bg-orange-100 dark:bg-orange-900">
                <span class="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {{ selectedRowForPayDebt.name ? selectedRowForPayDebt.name.charAt(0).toUpperCase() : 'K' }}
                </span>
              </el-avatar>
              <div>
                <h4 class="text-base font-bold text-gray-800 dark:text-gray-100">
                  {{ selectedRowForPayDebt.name }}
                  <span class="text-gray-400 dark:text-gray-500 font-medium">({{ selectedRowForPayDebt.code }})</span>
                </h4>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Điểm thu mua: <span class="font-semibold text-gray-700 dark:text-gray-300">{{ selectedRowForPayDebt.purchasingPoint }}</span>
                </div>
              </div>
            </div>

            <!-- Trạng thái công nợ hiện tại -->
            <div class="grid grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 mb-4">
              <div class="text-center">
                <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Nợ hiện tại</div>
                <div class="text-xs font-bold text-red-500 mt-0.5">{{ formatCurrency(selectedRowForPayDebt.debtAmount) }}</div>
              </div>
              <div class="text-center border-x border-gray-100 dark:border-gray-700">
                <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Đã ứng</div>
                <div class="text-xs font-bold text-orange-500 mt-0.5">{{ formatCurrency(selectedRowForPayDebt.advanceAmount) }}</div>
              </div>
              <div class="text-center">
                <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Công nợ</div>
                <div class="text-xs font-bold text-gray-700 dark:text-gray-300 mt-0.5">{{ formatCurrency(selectedRowForPayDebt.totalDebt) }}</div>
              </div>
            </div>

            <!-- Nhập số tiền trả -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Số tiền trả" prop="amount">
                  <el-input 
                    v-model="payDebtForm.amount" 
                    placeholder="Nhập số tiền chi trả công nợ..."
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
                <!-- Tóm tắt số liệu sau khi trả -->
                <div class="p-3 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100/50 dark:border-orange-900/30 rounded-lg text-sm flex justify-between items-center h-[40px]">
                  <span class="text-gray-500 dark:text-gray-400">Công nợ mới dự kiến:</span>
                  <span class="font-semibold text-orange-600 dark:text-orange-400">{{ formatCurrency(computedNewTotalDebt) }} VNĐ</span>
                </div>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: GIAO DỊCH TÀI CHÍNH -->
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
                    <el-select v-model="payDebtForm.subFundId" placeholder="Chọn Quỹ tiền" class="w-full highlight-select" style="width: 100%">
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
                    <el-date-picker 
                      v-model="payDebtForm.date" 
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
                      v-model="payDebtForm.type" 
                      active-value="chi" 
                      inactive-value="thu" 
                      active-text="Chi tiền" 
                      inactive-text="Thu tiền" 
                      @change="handlePayDebtPaymentTypeChange" 
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Mã giao dịch" prop="transactionCode">
                    <el-select v-model="payDebtForm.transactionCode" placeholder="Chọn mã giao dịch" class="w-full highlight-select" style="width: 100%">
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
                      :model-value="payDebtForm.amount ? `${payDebtForm.amount}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''" 
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
                    <el-input v-model="payDebtForm.requestingParty" placeholder="Nhập bên yêu cầu..." />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Bên thực hiện" prop="executingParty">
                    <el-input v-model="payDebtForm.executingParty" placeholder="Nhập bên thực hiện..." />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Bên nhận" prop="receivingParty">
                    <el-input v-model="payDebtForm.receivingParty" placeholder="Nhập bên nhận..." />
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
                    <el-select v-model="payDebtForm.status" placeholder="Chọn trạng thái" class="w-full highlight-select" style="width: 100%">
                      <el-option label="Đã chấp thuận" value="approved" />
                      <el-option label="Chưa chấp thuận" value="unapproved" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Mục đích" prop="purpose">
                    <el-input v-model="payDebtForm.purpose" placeholder="Nhập mục đích..." />
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
                    <el-input v-model="payDebtForm.note" placeholder="Nhập ghi chú thêm..." />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="24">
                  <el-form-item label="Lí do" prop="reason">
                    <el-input 
                      v-model="payDebtForm.reason" 
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
          <el-button @click="payDebtDialogVisible = false">Hủy</el-button>
          <el-button type="primary" @click="submitPayDebtForm" class="bg-orange-500 border-orange-500 hover:bg-orange-600 hover:border-orange-600">
            Xác nhận &amp; Ghi nhận giao dịch
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { MoreFilled, Search, Refresh } from '@element-plus/icons-vue'
import { ElNotification, ElMessage, ElMessageBox } from 'element-plus'
import { tienNgaService } from '@/api/tienNgaService'

const selectedRows = ref<any[]>([])
const handleSelectionChange = (val: any[]) => {
  selectedRows.value = val
}

const payDebtDialogVisible = ref(false)
const selectedRowForPayDebt = ref<any>(null)
const payDebtFormRef = ref<any>(null)
const subFunds = ref<any[]>([])

const payDebtForm = reactive({
  amount: '',
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
  transactionCode: 'NL'
})

const handlePayDebtClick = () => {
  if (selectedRows.value.length === 1) {
    const row = selectedRows.value[0]
    selectedRowForPayDebt.value = row
    
    payDebtForm.amount = ''
    payDebtForm.subFundId = subFunds.value[0]?.id || ''
    payDebtForm.date = new Date().toISOString().substring(0, 10)
    payDebtForm.type = 'chi'
    payDebtForm.status = 'approved'
    payDebtForm.requestingParty = row.name || ''
    payDebtForm.executingParty = 'Tiến Nga'
    payDebtForm.receivingParty = row.name || ''
    payDebtForm.purpose = `Chi trả công nợ cho khách hàng ${row.name}`
    payDebtForm.note = ''
    payDebtForm.reason = `Chi trả công nợ ngày ${new Date().toLocaleDateString('vi-VN')}`
    payDebtForm.transactionCode = 'NL'
    
    payDebtDialogVisible.value = true
  }
}

const handlePayDebtPaymentTypeChange = (val: any) => {
  const type = String(val)
  const name = selectedRowForPayDebt.value?.name || 'Khách hàng'
  if (type === 'chi') {
    payDebtForm.requestingParty = name
    payDebtForm.executingParty = 'Tiến Nga'
    payDebtForm.receivingParty = name
    payDebtForm.purpose = `Chi trả công nợ cho khách hàng ${name}`
  } else {
    payDebtForm.requestingParty = name
    payDebtForm.executingParty = name
    payDebtForm.receivingParty = 'Tiến Nga'
    payDebtForm.purpose = `Thu hồi công nợ từ khách hàng ${name}`
  }
}

watch(
  () => [payDebtForm.type, selectedRowForPayDebt.value, payDebtForm.date],
  ([type, row, date]) => {
    if (row) {
      const name = (row as any).name || ''
      if (type === 'chi') {
        payDebtForm.requestingParty = name
        payDebtForm.executingParty = 'Tiến Nga'
        payDebtForm.receivingParty = name
        payDebtForm.purpose = `Chi trả công nợ cho khách hàng ${name}`
      } else {
        payDebtForm.requestingParty = name
        payDebtForm.executingParty = name
        payDebtForm.receivingParty = 'Tiến Nga'
        payDebtForm.purpose = `Thu hồi công nợ từ khách hàng ${name}`
      }
      payDebtForm.reason = `${type === 'chi' ? 'Chi trả' : 'Thu hồi'} công nợ ngày ${date ? new Date(date as string).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}`
    }
  }
)

const computedNewTotalDebt = computed(() => {
  if (!selectedRowForPayDebt.value) return 0
  const current = selectedRowForPayDebt.value.totalDebt || 0
  const amountVal = parseFloat(String(payDebtForm.amount).replace(/\./g, '')) || 0
  if (payDebtForm.type === 'chi') {
    return current - amountVal
  } else {
    return current + amountVal
  }
})

const payDebtRules = reactive({
  amount: [{ required: true, message: 'Vui lòng nhập số tiền chi trả', trigger: 'blur' }],
  subFundId: [{ required: true, message: 'Vui lòng chọn Quỹ tiền', trigger: 'change' }],
  date: [{ required: true, message: 'Vui lòng chọn ngày giao dịch', trigger: 'change' }],
  requestingParty: [{ required: true, message: 'Vui lòng nhập bên yêu cầu', trigger: 'blur' }],
  executingParty: [{ required: true, message: 'Vui lòng nhập bên thực hiện', trigger: 'blur' }],
  receivingParty: [{ required: true, message: 'Vui lòng nhập bên nhận', trigger: 'blur' }],
  purpose: [{ required: true, message: 'Vui lòng nhập mục đích', trigger: 'blur' }],
})

const fetchSubFunds = async () => {
  try {
    const data = await tienNgaService.getInvestments({ role: 'member' })
    subFunds.value = data.filter((item: any) => item.status === 'ACTIVE')
  } catch (error: any) {
    console.error('Failed to fetch sub funds:', error)
  }
}

const submitPayDebtForm = async () => {
  if (!payDebtFormRef.value) return
  await payDebtFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      const row = selectedRowForPayDebt.value
      if (!row) return
      
      const paymentAmount = parseFloat(String(payDebtForm.amount).replace(/\./g, '')) || 0
      if (paymentAmount <= 0) {
        ElMessage.warning('Vui lòng nhập số tiền hợp lệ')
        return
      }

      loading.value = true
      try {
        // 1. Process the Debt update
        const payload = {
          hoursehold_id: row.code,
          amount: paymentAmount,
          type_transaction: payDebtForm.type,
          start_date: null,
          end_date: null
        }

        const response = await tienNgaService.processDebt(payload)
        
        if (response && response.success) {
          row.totalDebt = response.new_debt || 0
          
          // 2. Record the Financial transaction
          const paymentPayload = [{
            investment_id: payDebtForm.subFundId,
            requester: payDebtForm.requestingParty,
            executor: payDebtForm.executingParty,
            receiver: payDebtForm.receivingParty,
            payment_type: payDebtForm.type,
            purpose: payDebtForm.purpose,
            reason: payDebtForm.reason,
            amount: paymentAmount,
            day: payDebtForm.date,
            status: payDebtForm.status === 'approved' ? 'APPROVED' : 'UNAPPROVED',
            notes: payDebtForm.note,
            transaction_code: payDebtForm.transactionCode
          }]
          
          await tienNgaService.addDailyPayments(paymentPayload)

          // Sync changes back to allData array for reactivity
          const index = allData.value.findIndex(item => item.id === row.id)
          if (index !== -1) {
            allData.value[index] = { ...row }
          }

          ElNotification({
            title: 'Thành công',
            message: `Đã xử lý ${payDebtForm.type === 'chi' ? 'chi trả' : 'thu hồi'} công nợ số tiền ${formatCurrency(paymentAmount)} VNĐ và tạo giao dịch tài chính cho Khách hàng ${row.name} thành công!`,
            type: 'success',
          })
          
          payDebtDialogVisible.value = false
        } else {
          ElMessage.error(response?.message || 'Không thể xử lý công nợ')
        }
      } catch (error: any) {
        ElMessage.error(error.message || 'Không thể xử lý công nợ')
      } finally {
        loading.value = false
      }
    }
  })
}

const selectedMaterial = ref('all')
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const handleSizeChange = (val: number) => {
  console.log(`${val} items per page`)
}

const handleCurrentChange = (val: number) => {
  console.log(`current page: ${val}`)
}

const loading = ref(false)
const editDialogVisible = ref(false)
const editingRow = ref<any>(null)
const detailDialogVisible = ref(false)
const detailData = ref<any>(null)

const dialogVisible = ref(false)
const customerForm = reactive({
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
  advanceAmount: '0',
  material: 'Acid',
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
  customerForm.code = ''
  customerForm.name = ''
  customerForm.purchasingPoint = ''
  customerForm.phone = ''
  customerForm.address = ''
  customerForm.bankAccount = ''
  customerForm.bankName = ''
  customerForm.status = 'Hoạt động'
  customerForm.username = ''
  customerForm.telegramGroup = ''
  customerForm.debtAmount = '0'
  customerForm.advanceAmount = '0'
  customerForm.material = 'Acid'
  customerForm.totalDebt = '0'
  customerForm.is_subsidized = '0'
}

const submitForm = async () => {
  if (!customerForm.code) {
    ElMessage.warning('Vui lòng nhập Mã Khách hàng')
    return
  }
  if (!customerForm.name) {
    ElMessage.warning('Vui lòng nhập Họ và tên Khách hàng')
    return
  }
  if (!customerForm.purchasingPoint) {
    ElMessage.warning('Vui lòng chọn Điểm thu mua')
    return
  }

  loading.value = true
  try {
    const matchedPoint = collectionPoints.value.find(p => p.collection_name === customerForm.purchasingPoint)
    
    const customerId = generateUUID()
    const customerPayload = {
      id: customerId,
      fullname: customerForm.name,
      hoursehold_id: customerForm.code,
      collection_point_id: matchedPoint ? matchedPoint.id : null,
      number_phone: customerForm.phone || null,
      address: customerForm.address || null,
      ingredient: customerForm.material || 'Acid',
      amount_of_debt: parseFloat(parseFloat(customerForm.debtAmount || '0').toFixed(2)),
      cash_advance: parseFloat(parseFloat(customerForm.advanceAmount || '0').toFixed(2)),
      total_debt: customerForm.totalDebt ? parseFloat(parseFloat(customerForm.totalDebt).toFixed(2)) : 0,
      status: customerForm.status === 'Hoạt động' ? 'ACTIVE' : 'INACTIVE',
      username: customerForm.username || null,
      telegram_group: customerForm.telegramGroup || null,
      number_bank: customerForm.bankAccount || null,
      bank_name: customerForm.bankName || null,
      is_subsidized: parseFloat(parseFloat(customerForm.is_subsidized || '0').toFixed(2))
    }

    const response = await tienNgaService.addCustomers([customerPayload])
    
    if (response && response.length > 0) {
      const newCust = response[0]
      allData.value.unshift({
        id: newCust.id,
        code: newCust.hoursehold_id || newCust.id,
        name: newCust.fullname || 'Chưa rõ',
        purchasingPoint: newCust.collection_name || customerForm.purchasingPoint || 'Không rõ',
        phone: newCust.number_phone || 'Chưa có',
        address: newCust.address || 'Chưa có',
        bankAccount: newCust.number_bank || 'Chưa có',
        bankName: newCust.bank_name || 'Chưa có',
        status: newCust.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động',
        username: newCust.username ? (newCust.username.startsWith('@') ? newCust.username : `@${newCust.username}`) : 'Chưa có',
        telegramGroup: newCust.telegram_group || 'Chưa có',
        debtAmount: newCust.amount_of_debt || 0,
        advanceAmount: newCust.cash_advance || 0,
        totalDebt: newCust.total_debt || 0,
        material: newCust.ingredient || 'Không rõ',
        is_subsidized: newCust.is_subsidized || 0
      })

      ElNotification({
        title: 'Thành công',
        message: 'Đã thêm Khách hàng mới thành công!',
        type: 'success',
      })
      
      resetForm()
      dialogVisible.value = false
    }
  } catch (error: any) {
    ElMessage.error(error.message || 'Không thể thêm Khách hàng mới')
  } finally {
    loading.value = false
  }
}

const collectionPoints = ref<any[]>([])

const fetchCollectionPoints = async () => {
  try {
    const data = await tienNgaService.getCollectionPoints('')
    collectionPoints.value = data
  } catch (error: any) {
    console.error('Failed to fetch collection points:', error)
  }
}

const fetchCustomers = async () => {
  loading.value = true
  try {
    const data = await tienNgaService.getCustomers('!=Cao Su')
    console.log('API getCustomers (!=Cao Su) response:', data)
    allData.value = data.map(item => ({
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
      advanceAmount: item.cash_advance || 0,
      totalDebt: item.total_debt || 0,
      material: item.ingredient || 'Không rõ',
      is_subsidized: item.is_subsidized || 0
    }))
  } catch (error: any) {
    ElMessage.error(error.message || 'Không thể tải danh sách Khách hàng')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCustomers()
  fetchCollectionPoints()
  fetchSubFunds()
})
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
  advanceAmount: '',
  material: '',
  totalDebt: '',
  is_subsidized: ''
})

const handleCommand = (command: string, row: any) => {
  if (command === 'edit') {
    editingRow.value = row
    editForm.code = row.code
    editForm.name = row.name
    editForm.purchasingPoint = row.purchasingPoint
    editForm.phone = row.phone
    editForm.address = row.address
    editForm.material = row.material
    editForm.status = row.status
    editForm.debtAmount = String(row.debtAmount)
    editForm.advanceAmount = String(row.advanceAmount)
    editForm.totalDebt = String(row.totalDebt || '')
    editForm.username = row.username
    editForm.telegramGroup = row.telegramGroup
    editForm.bankAccount = row.bankAccount
    editForm.bankName = row.bankName
    editForm.is_subsidized = String(row.is_subsidized || 0)
    editDialogVisible.value = true
  } else if (command === 'detail') {
    detailData.value = row
    detailDialogVisible.value = true
  } else if (command === 'delete') {
    ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa Khách hàng "${row.name}" không?`,
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
              message: 'Đã xóa Khách hàng thành công!',
              type: 'success',
            })
          }
        } catch (error: any) {
          ElMessage.error(error.message || 'Không thể xóa Khách hàng')
        } finally {
          loading.value = false
        }
      })
      .catch(() => {})
  } else {
    console.log(`Action: ${command} on Code: ${row.code}`)
  }
}

const submitEditForm = async () => {
  if (!editForm.name) {
    ElMessage.warning('Vui lòng nhập Họ và tên Khách hàng')
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
      ingredient: editForm.material || 'Acid',
      amount_of_debt: parseFloat(parseFloat(editForm.debtAmount || '0').toFixed(2)),
      cash_advance: parseFloat(parseFloat(editForm.advanceAmount || '0').toFixed(2)),
      total_debt: editForm.totalDebt ? parseFloat(parseFloat(editForm.totalDebt).toFixed(2)) : 0,
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
      row.advanceAmount = updatedCust.cash_advance || 0
      row.totalDebt = updatedCust.total_debt || 0
      row.material = updatedCust.ingredient || 'Không rõ'
      row.is_subsidized = updatedCust.is_subsidized || 0

      // Sync changes back to allData array for reactivity
      const index = allData.value.findIndex(item => item.id === row.id)
      if (index !== -1) {
        allData.value[index] = { ...row }
      }

      ElNotification({
        title: 'Thành công',
        message: 'Đã cập nhật thông tin Khách hàng thành công!',
        type: 'success',
      })
      
      editDialogVisible.value = false
    }
  } catch (error: any) {
    ElMessage.error(error.message || 'Không thể cập nhật thông tin Khách hàng')
  } finally {
    loading.value = false
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value)
}

const getMaterialTagType = (material: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined => {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined> = {
    'Acid': undefined,
    'Amoniac': 'success',
    'Dầu ăn': 'warning',
    'Củi': 'info',
    'Cao su': 'danger',
    'Túi PE': 'primary',
  }
  return map[material] ?? undefined
}

const generateMockData = () => {
  const data = []
  const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng']
  const middleNames = ['Văn', 'Thị', 'Hữu', 'Minh', 'Đức', 'Ngọc', 'Quang', 'Hải', 'Thanh', 'Tuấn']
  const lastNames = ['An', 'Bình', 'Cường', 'Dũng', 'Em', 'Phong', 'Giang', 'Hải', 'Linh', 'Khánh']
  const materials = ['Acid', 'Amoniac', 'Dầu ăn', 'Củi']
  const banks = ['Techcombank', 'Vietcombank', 'VietinBank', 'MB Bank', 'ACB', 'BIDV', 'Agribank']

  for (let i = 1; i <= 25; i++) {
    const debtAmount = Math.floor(Math.random() * 50) * 1000000
    const advanceAmount = Math.floor(Math.random() * 20) * 1000000
    const fullName = `${firstNames[i % 10]} ${middleNames[(i * 3) % 10]} ${lastNames[(i * 7) % 10]}`
    
    data.push({
      id: i,
      code: `KH${String(i).padStart(3, '0')}`,
      name: fullName,
      material: materials[i % 4],
      phone: `09${Math.floor(Math.random() * 90000000 + 10000000)}`,
      address: `${i % 5 + 1} Đường ${i % 20 + 1}, Phường ${i % 12 + 1}, TP. Phan Thiết`,
      bankAccount: `1903${Math.floor(Math.random() * 900000000 + 100000000)}`,
      bankName: banks[i % 7],
      status: i % 7 === 0 ? 'Ngừng hoạt động' : 'Hoạt động',
      username: `@${fullName.split(' ').pop()?.toLowerCase()}${i}`,
      telegramGroup: `Nhóm NL ${materials[i % 4]}`,
      debtAmount: debtAmount,
      advanceAmount: advanceAmount,
      totalDebt: debtAmount - advanceAmount
    })
  }
  return data
}

const allData = ref<any[]>([])

const filteredData = computed(() => {
  return allData.value.filter(item => {
    // Filter by material
    if (selectedMaterial.value !== 'all' && item.material !== selectedMaterial.value) {
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
.customers-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

/* Cho phân trang tự xuống dòng khi có nhiều trang */
.customers-container :deep(.el-pagination) {
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

/* Dark Mode table */
html.dark .customers-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .customers-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .customers-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

html.dark .customers-container :deep(.el-table .el-table-fixed-column--left),
html.dark .customers-container :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important;
}

/* Dark Mode select & input */
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
/* Select dropdown popper dark mode */
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

/* Highlight selects dark mode */
html.dark .highlight-select .el-input__wrapper,
html.dark .highlight-select .el-select__wrapper {
  background-color: #111827 !important;
  border-color: #111827 !important;
}

/* Dialog dark mode */
.custom-dark-dialog .el-form-item__label {
  white-space: nowrap;
  color: #2563eb;
  font-weight: 500;
}

.custom-dark-dialog .el-dialog__title {
  color: #2563eb;
  font-weight: bold;
}

.custom-dark-dialog .el-dialog__header {
  text-align: center;
}

html.dark .custom-dark-dialog {
  background-color: #1f2937;
}

html.dark .custom-dark-dialog .el-dialog__title {
  color: #3b82f6;
}

html.dark .custom-dark-dialog .el-form-item__label {
  color: #60a5fa;
}

html.dark .custom-dark-dialog .el-input__wrapper,
html.dark .custom-dark-dialog .el-select__wrapper {
  background-color: #374151;
  box-shadow: 0 0 0 1px #4b5563 inset;
}

html.dark .custom-dark-dialog .el-input__inner {
  color: #f3f4f6;
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
