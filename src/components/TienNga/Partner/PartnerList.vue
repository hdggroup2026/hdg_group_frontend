<template>
  <div class="partner-container h-full flex flex-col">
    <div class="flex flex-wrap justify-between items-center gap-x-4 gap-y-4 mb-4 shrink-0">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-4">
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
        <el-button :icon="Refresh" circle @click="fetchPartners" :loading="loading" />
        <el-button 
          type="success" 
          :disabled="selectedRows.length !== 1" 
          @click="handlePayDebtClick"
        >
          Chi trả công nợ
        </el-button>
        <el-button type="primary" @click="dialogVisible = true">Thêm Đối tác</el-button>
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
        <el-table-column prop="code" label="Mã Đối tác" width="130" sortable="custom" fixed />

        <el-table-column prop="name" label="Tên Đối tác" min-width="380" show-overflow-tooltip>
          <template #default="scope">
            <span class="whitespace-nowrap font-semibold text-gray-800 dark:text-gray-200">{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="debt" label="Công nợ" width="160" align="right">
          <template #default="scope">
            <span 
              class="font-bold" 
              :class="scope.row.debt >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'"
            >
              {{ formatCurrency(scope.row.debt) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="Username" width="150">
          <template #default="scope">
            <span class="text-blue-500">{{ scope.row.username }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="telegramGroup" label="Nhóm Telegram" min-width="230" />
        <el-table-column prop="bankName" label="Ngân hàng" min-width="220" show-overflow-tooltip />
        <el-table-column prop="bankAccount" label="Số tài khoản" width="160" />
        <el-table-column prop="status" label="Trạng thái" width="140" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'Hoạt động' ? 'success' : 'danger'" effect="light" round>
              {{ scope.row.status }}
            </el-tag>
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

    <!-- Modal Thêm Đối tác -->
    <el-dialog
      v-model="dialogVisible"
      title="THÊM ĐỐI TÁC"
      class="custom-dark-dialog"
      width="900px"
      destroy-on-close
      align-center
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form :model="partnerForm" label-width="180px" class="mt-2 compact-form">
          <!-- PHẦN 1: THÔNG TIN CHUNG -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin chung
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã Đối tác">
                  <el-input v-model="partnerForm.code" placeholder="Nhập mã đối tác..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tên Đối tác">
                  <el-input v-model="partnerForm.name" placeholder="Nhập tên đối tác..." />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Trạng thái">
                  <el-select v-model="partnerForm.status" placeholder="Chọn trạng thái" class="w-full highlight-select" style="width: 100%">
                    <el-option label="Hoạt động" value="Hoạt động" />
                    <el-option label="Ngừng hoạt động" value="Ngừng hoạt động" />
                  </el-select>
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
                <el-form-item label="Số tài khoản">
                  <el-input v-model="partnerForm.bankAccount" placeholder="Nhập số tài khoản..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ngân hàng">
                  <el-input v-model="partnerForm.bankName" placeholder="Nhập tên ngân hàng..." />
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
                  <el-input v-model="partnerForm.username" placeholder="Nhập username Telegram..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Nhóm Telegram">
                  <el-input v-model="partnerForm.telegramGroup" placeholder="Nhập tên nhóm Telegram..." />
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
                <el-form-item label="Công nợ">
                  <el-input 
                    v-model="partnerForm.debt" 
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

    <!-- Modal Chỉnh sửa Đối tác -->
    <el-dialog
      v-model="editDialogVisible"
      title="CHỈNH SỬA ĐỐI TÁC"
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
                <el-form-item label="Mã Đối tác">
                  <el-input v-model="editForm.code" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tên Đối tác">
                  <el-input v-model="editForm.name" placeholder="Nhập tên đối tác..." />
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
                <el-form-item label="Số tài khoản">
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
                <el-form-item label="Nhóm Telegram">
                  <el-input v-model="editForm.telegramGroup" placeholder="Nhập tên nhóm Telegram..." />
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
                <el-form-item label="Công nợ">
                  <el-input 
                    v-model="editForm.debt" 
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

    <!-- Modal Chi tiết Đối tác -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT ĐỐI TÁC"
      class="custom-dark-dialog"
      width="90%"
      style="max-width: 850px"
      destroy-on-close
      align-center
    >
      <div v-if="detailData" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto overflow-x-hidden">
        <!-- Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <el-avatar :size="64" class="bg-indigo-100 dark:bg-indigo-900">
            <span class="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              {{ detailData.name ? detailData.name.charAt(0).toUpperCase() : 'Đ' }}
            </span>
          </el-avatar>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Đối tác</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {{ detailData.name }}
              <span class="text-gray-400 dark:text-gray-500 font-medium">({{ detailData.code }})</span>
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <el-tag :type="detailData.status === 'Hoạt động' ? 'success' : 'danger'" effect="light" size="small" round>
                {{ detailData.status }}
              </el-tag>
              <span class="text-gray-400 dark:text-gray-500">|</span>
              <span 
                class="font-bold"
                :class="detailData.debt >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'"
              >
                Công nợ: {{ formatCurrency(detailData.debt) }} VNĐ
              </span>
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
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã Đối tác</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-100">{{ detailData.code }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tên Đối tác</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-100">{{ detailData.name }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Trạng thái</div>
              <el-tag :type="detailData.status === 'Hoạt động' ? 'success' : 'danger'" effect="light" size="small" round>
                {{ detailData.status }}
              </el-tag>
            </div>
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
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 3. NGÂN HÀNG & CÔNG NỢ -->
        <div>
          <h4 class="text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-cyan-500 rounded-full"></span>
            Ngân hàng & Công nợ
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
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Công nợ</div>
              <div 
                class="text-sm font-bold"
                :class="detailData.debt >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'"
              >
                {{ formatCurrency(detailData.debt) }} VNĐ
              </div>
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
              1. Thông tin đối tác và số tiền trả
            </h4>

            <div class="flex items-center gap-4 pb-3 mb-4 border-b border-gray-100 dark:border-gray-700">
              <el-avatar :size="48" class="bg-orange-100 dark:bg-orange-900">
                <span class="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {{ selectedRowForPayDebt.name ? selectedRowForPayDebt.name.charAt(0).toUpperCase() : 'Đ' }}
                </span>
              </el-avatar>
              <div>
                <h4 class="text-base font-bold text-gray-800 dark:text-gray-100">
                  {{ selectedRowForPayDebt.name }}
                  <span class="text-gray-400 dark:text-gray-500 font-medium">({{ selectedRowForPayDebt.code }})</span>
                </h4>
              </div>
            </div>

            <!-- Trạng thái công nợ hiện tại -->
            <div class="grid grid-cols-1 gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 mb-4 max-w-sm mx-auto">
              <div class="text-center">
                <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Công nợ hiện tại</div>
                <div class="text-xs font-bold text-red-500 mt-0.5">{{ formatCurrency(selectedRowForPayDebt.debt) }} VNĐ</div>
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

const selectedStatus = ref('all')
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

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

const dialogVisible = ref(false)
const partnerForm = reactive({
  code: '',
  name: '',
  debt: '',
  username: '',
  telegramGroup: '',
  bankName: '',
  bankAccount: '',
  status: 'Hoạt động'
})

const loading = ref(false)

const fetchPartners = async () => {
  loading.value = true
  try {
    const data = await tienNgaService.getPartners()
    allData.value = data.map(item => ({
      id: item.id || Math.random().toString(36).substring(2, 9),
      code: item.partner_id || '',
      name: item.partner_name || 'Chưa rõ',
      debt: item.total_debt || 0,
      username: item.username || 'Chưa có',
      telegramGroup: item.telegram_group || 'Chưa có',
      bankName: item.bank_name || 'Chưa có',
      bankAccount: item.bank_account || 'Chưa có',
      status: item.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động'
    }))
  } catch (error: any) {
    ElMessage.error(error.message || 'Không thể tải danh sách đối tác')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPartners()
  fetchSubFunds()
})

const resetForm = () => {
  partnerForm.code = ''
  partnerForm.name = ''
  partnerForm.debt = ''
  partnerForm.username = ''
  partnerForm.telegramGroup = ''
  partnerForm.bankName = ''
  partnerForm.bankAccount = ''
  partnerForm.status = 'Hoạt động'
}

const submitForm = async () => {
  if (!partnerForm.code) {
    ElMessage.warning('Vui lòng nhập Mã Đối tác')
    return
  }
  if (!partnerForm.name) {
    ElMessage.warning('Vui lòng nhập Tên Đối tác')
    return
  }

  loading.value = true
  try {
    const partnerPayload = {
      partner_id: partnerForm.code,
      partner_name: partnerForm.name,
      total_debt: parseFloat(partnerForm.debt) || 0,
      username: partnerForm.username || null,
      telegram_group: partnerForm.telegramGroup || null,
      bank_name: partnerForm.bankName || null,
      bank_account: partnerForm.bankAccount || null,
      status: partnerForm.status === 'Hoạt động' ? 'ACTIVE' : 'INACTIVE'
    }

    const response = await tienNgaService.addPartners([partnerPayload])
    
    if (response && response.length > 0) {
      const newPartner = response[0]
      allData.value.unshift({
        id: newPartner.id,
        code: newPartner.partner_id || partnerForm.code,
        name: newPartner.partner_name || partnerForm.name,
        debt: newPartner.total_debt || 0,
        username: newPartner.username ? (newPartner.username.startsWith('@') ? newPartner.username : `@${newPartner.username}`) : 'Chưa có',
        telegramGroup: newPartner.telegram_group || 'Chưa có',
        bankName: newPartner.bank_name || 'Chưa có',
        bankAccount: newPartner.bank_account || 'Chưa có',
        status: newPartner.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động'
      })

      ElNotification({
        title: 'Thành công',
        message: 'Đã thêm Đối tác mới thành công!',
        type: 'success',
      })
      
      resetForm()
      dialogVisible.value = false
    }
  } catch (error: any) {
    ElMessage.error(error.message || 'Không thể thêm Đối tác mới')
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
  debt: '',
  username: '',
  telegramGroup: '',
  bankName: '',
  bankAccount: '',
  status: ''
})

const handleCommand = (command: string, row: any) => {
  if (command === 'edit') {
    editingRow.value = row
    editForm.code = row.code
    editForm.name = row.name
    editForm.debt = String(row.debt)
    editForm.username = row.username
    editForm.telegramGroup = row.telegramGroup
    editForm.bankName = row.bankName
    editForm.bankAccount = row.bankAccount
    editForm.status = row.status
    editDialogVisible.value = true
  } else if (command === 'detail') {
    detailData.value = row
    detailDialogVisible.value = true
  } else if (command === 'delete') {
    ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa Đối tác "${row.name}" không?`,
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
          await tienNgaService.deletePartners([row.id])
          const index = allData.value.findIndex(item => item.id === row.id)
          if (index !== -1) {
            allData.value.splice(index, 1)
            ElNotification({
              title: 'Thành công',
              message: 'Đã xóa Đối tác thành công!',
              type: 'success',
            })
          }
        } catch (error: any) {
          ElMessage.error(error.message || 'Không thể xóa Đối tác')
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
    ElMessage.warning('Vui lòng nhập Tên Đối tác')
    return
  }

  loading.value = true
  try {
    const partnerPayload = {
      id: editingRow.value?.id,
      partner_id: editForm.code,
      partner_name: editForm.name,
      total_debt: parseFloat(editForm.debt) || 0,
      username: editForm.username || null,
      telegram_group: editForm.telegramGroup || null,
      bank_name: editForm.bankName || null,
      bank_account: editForm.bankAccount || null,
      status: editForm.status === 'Hoạt động' ? 'ACTIVE' : 'INACTIVE'
    }

    const response = await tienNgaService.updatePartners([partnerPayload])
    
    if (response && response.length > 0 && editingRow.value) {
      const updatedPartner = response[0]
      const row = editingRow.value
      row.name = updatedPartner.partner_name || editForm.name
      row.debt = updatedPartner.total_debt || 0
      row.username = updatedPartner.username ? (updatedPartner.username.startsWith('@') ? updatedPartner.username : `@${updatedPartner.username}`) : 'Chưa có'
      row.telegramGroup = updatedPartner.telegram_group || 'Chưa có'
      row.bankName = updatedPartner.bank_name || 'Chưa có'
      row.bankAccount = updatedPartner.bank_account || 'Chưa có'
      row.status = updatedPartner.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động'

      // Sync changes back to allData array for reactivity
      const index = allData.value.findIndex(item => item.id === row.id)
      if (index !== -1) {
        allData.value[index] = { ...row }
      }

      ElNotification({
        title: 'Thành công',
        message: 'Đã cập nhật thông tin Đối tác thành công!',
        type: 'success',
      })
      
      editDialogVisible.value = false
    }
  } catch (error: any) {
    ElMessage.error(error.message || 'Không thể cập nhật thông tin Đối tác')
  } finally {
    loading.value = false
  }
}

const parseFloatInput = (val: string | number | null | undefined) => {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'number') return val
  const clean = String(val).replace(/\./g, '').replace(/,/g, '.')
  return parseFloat(clean) || 0
}

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
    payDebtForm.purpose = `Chi trả công nợ cho đối tác ${row.name}`
    payDebtForm.note = ''
    payDebtForm.reason = `Chi trả công nợ ngày ${new Date().toLocaleDateString('vi-VN')}`
    payDebtForm.transactionCode = 'NL'
    
    payDebtDialogVisible.value = true
  }
}

const handlePayDebtPaymentTypeChange = (val: any) => {
  const type = String(val)
  const name = selectedRowForPayDebt.value?.name || 'Đối tác'
  if (type === 'chi') {
    payDebtForm.requestingParty = name
    payDebtForm.executingParty = 'Tiến Nga'
    payDebtForm.receivingParty = name
    payDebtForm.purpose = `Chi trả công nợ cho đối tác ${name}`
  } else {
    payDebtForm.requestingParty = name
    payDebtForm.executingParty = name
    payDebtForm.receivingParty = 'Tiến Nga'
    payDebtForm.purpose = `Thu hồi công nợ từ đối tác ${name}`
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
        payDebtForm.purpose = `Chi trả công nợ cho đối tác ${name}`
      } else {
        payDebtForm.requestingParty = name
        payDebtForm.executingParty = name
        payDebtForm.receivingParty = 'Tiến Nga'
        payDebtForm.purpose = `Thu hồi công nợ từ đối tác ${name}`
      }
      payDebtForm.reason = `${type === 'chi' ? 'Chi trả' : 'Thu hồi'} công nợ ngày ${date ? new Date(date as string).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}`
    }
  }
)

const computedNewTotalDebt = computed(() => {
  if (!selectedRowForPayDebt.value) return 0
  const current = selectedRowForPayDebt.value.debt || 0
  const amountVal = parseFloatInput(payDebtForm.amount)
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
      
      const paymentAmount = parseFloatInput(payDebtForm.amount)
      if (paymentAmount <= 0) {
        ElMessage.warning('Vui lòng nhập số tiền hợp lệ')
        return
      }

      loading.value = true
      try {
        const payload = {
          partner_id: row.code,
          amount: paymentAmount,
          type_transaction: payDebtForm.type,
          start_date: null,
          end_date: null
        }

        const response = await tienNgaService.processDebt(payload)
        
        if (response && response.success) {
          row.debt = response.new_debt || 0
          
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

          const index = allData.value.findIndex(item => item.id === row.id)
          if (index !== -1) {
            allData.value[index] = { ...row }
          }

          ElNotification({
            title: 'Thành công',
            message: `Đã xử lý ${payDebtForm.type === 'chi' ? 'chi trả' : 'thu hồi'} công nợ số tiền ${formatCurrency(paymentAmount)} VNĐ và tạo giao dịch tài chính cho Đối tác ${row.name} thành công!`,
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value)
}

const generateMockData = () => {
  const data = []
  const companyNames = [
    'Công ty TNHH Hòa Phát', 'Công ty CP Đại Việt', 'DNTN Minh Tâm', 'Công ty TNHH Thành Đạt',
    'Công ty CP Phú Thịnh', 'DNTN Quang Huy', 'Công ty TNHH An Khang', 'Công ty CP Việt Tiến',
    'DNTN Thanh Bình', 'Công ty TNHH Hoàng Long', 'Công ty CP Nam Á', 'DNTN Phước Lộc',
    'Công ty TNHH Tân Phát', 'Công ty CP Bình Minh', 'DNTN Hải Đăng'
  ]
  const banks = ['Techcombank', 'Vietcombank', 'VietinBank', 'MB Bank', 'ACB', 'BIDV', 'Agribank']

  for (let i = 1; i <= 15; i++) {
    const debt = Math.floor(Math.random() * 100) * 1000000

    data.push({
      id: i,
      code: `DT${String(i).padStart(3, '0')}`,
      name: companyNames[(i - 1) % companyNames.length],
      debt,
      username: `@doitac${i}`,
      telegramGroup: `Nhóm ĐT ${companyNames[(i - 1) % companyNames.length]?.split(' ').pop() ?? ''}`,
      bankName: banks[i % 7],
      bankAccount: `1903${Math.floor(Math.random() * 900000000 + 100000000)}`,
      status: i % 6 === 0 ? 'Ngừng hoạt động' : 'Hoạt động'
    })
  }
  return data
}

const allData = ref<any[]>([])

const filteredData = computed(() => {
  return allData.value.filter(item => {
    // Filter by status
    if (selectedStatus.value !== 'all' && item.status !== selectedStatus.value) {
      return false
    }
    // Filter by search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      const codeMatch = item.code?.toLowerCase().includes(query)
      const nameMatch = item.name?.toLowerCase().includes(query)
      const bankMatch = item.bankName?.toLowerCase().includes(query)
      const accountMatch = item.bankAccount?.toLowerCase().includes(query)
      return codeMatch || nameMatch || bankMatch || accountMatch
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
.partner-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

/* Cho phân trang tự xuống dòng khi có nhiều trang */
.partner-container :deep(.el-pagination) {
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

html.dark .partner-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .partner-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .partner-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

html.dark .partner-container :deep(.el-table .el-table-fixed-column--left),
html.dark .partner-container :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important;
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
</style>

<style>
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

html.dark .highlight-select .el-input__wrapper,
html.dark .highlight-select .el-select__wrapper {
  background-color: #111827 !important;
  border-color: #111827 !important;
}

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
