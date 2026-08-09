<template>
  <div class="members-content h-full flex flex-col text-left">
    <!-- Filters & Actions -->
    <div class="flex flex-wrap justify-between items-center gap-4 mb-4 shrink-0">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Bộ lọc Mã Dây Hụi (Input) -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-770 dark:text-gray-300 font-semibold">Mã dây hụi:</span>
          <el-input 
            v-model="filters.rosca_code_search" 
            placeholder="Nhập mã dây hụi..." 
            clearable 
            class="custom-dark-input"
            style="width: 180px"
            @keyup.enter="handleFilterChange"
            @clear="handleFilterChange"
          />
        </div>

        <!-- Trạng thái (Status filter) -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-770 dark:text-gray-300 font-semibold">Trạng thái:</span>
          <el-select 
            v-model="filters.status" 
            placeholder="Tất cả" 
            clearable 
            class="custom-dark-input"
            style="width: 140px"
            @change="handleFilterChange"
          >
            <el-option label="Tất cả" value="" />
            <el-option label="Đã đóng" value="Paid" />
            <el-option label="Chưa đóng" value="Unpaid" />
          </el-select>
        </div>

        <!-- Tìm kiếm chung (Player Name / Note) -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-770 dark:text-gray-300 font-semibold">Tìm kiếm:</span>
          <el-input 
            v-model="filters.search" 
            placeholder="Tìm theo tên người chơi, ghi chú..." 
            clearable 
            class="custom-dark-input"
            style="width: 230px"
            @input="handleSearchInput"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <el-button type="primary" :icon="Search" @click="handleFilterChange" class="shadow-sm">Tìm kiếm</el-button>
      </div>

      <!-- Actions buttons -->
      <div class="flex items-center gap-2">
        <el-button :icon="Refresh" circle @click="fetchContributions" :loading="loading" />
        <el-button 
          type="success" 
          class="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-none rounded-xl font-semibold shadow-sm text-white flex items-center"
          @click="handleOpenCreateDialog"
        >
          <el-icon class="mr-1"><Plus /></el-icon>
          Đóng Hụi
        </el-button>
        <el-button 
          type="primary" 
          class="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 border-none rounded-xl font-semibold shadow-sm text-white flex items-center"
          @click="handleOpenWithdrawDialog"
        >
          <el-icon class="mr-1"><Wallet /></el-icon>
          Rút Hụi
        </el-button>
      </div>
    </div>

    <!-- Table Container matching Players.vue style -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
      <el-table 
        v-loading="loading"
        :data="paginatedContributions" 
        style="width: 100%" 
        height="100%"
        class="flex-1"
      >
        <!-- STT Column -->
        <el-table-column label="STT" width="60" align="center" fixed>
          <template #default="{ $index }">
            <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>

        <!-- Mã Giao dịch ID -->
        <el-table-column label="Mã giao dịch" width="300" show-overflow-tooltip fixed>
          <template #default="{ row }">
            <span class="font-mono text-xs text-gray-550 select-all">{{ row.id }}</span>
          </template>
        </el-table-column>

        <!-- Mã Dây Hụi -->
        <el-table-column label="Mã Dây Hụi" width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-bold text-blue-600 dark:text-blue-400 font-mono select-all">{{ row.rosca_code }}</span>
          </template>
        </el-table-column>

        <!-- Kỳ hụi -->
        <el-table-column label="Kỳ hụi" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain" class="font-bold font-mono">
              Kỳ {{ row.round_number }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Người chơi (Chân) -->
        <el-table-column prop="player_name" label="Người chơi" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-bold text-gray-800 dark:text-gray-100 select-all">{{ row.player_name || 'N/A' }}</span>
          </template>
        </el-table-column>

        <!-- Số tiền đóng -->
        <el-table-column label="Số tiền đóng" width="160" align="right">
          <template #default="{ row }">
            <span class="font-bold font-mono text-gray-850 dark:text-gray-200 select-all">{{ formatCurrency(row.amount) }}</span>
          </template>
        </el-table-column>

        <!-- Ngày đóng thực tế -->
        <el-table-column label="Ngày đóng thực tế" width="180">
          <template #default="{ row }">
            <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {{ formatDate(row.actual_payment_date) }}
            </span>
          </template>
        </el-table-column>

        <!-- Trạng thái -->
        <el-table-column label="Trạng thái" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="default" class="font-semibold">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Ghi chú -->
        <el-table-column prop="note" label="Ghi chú" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-gray-500 text-xs">{{ row.note || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Thao tác (3-dots dropdown) -->
        <el-table-column label="Thao tác" width="90" align="center" fixed="right">
          <template #default="{ row }">
            <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
              <el-button link type="info" class="p-1 !text-gray-400 hover:!text-gray-600 dark:hover:!text-gray-200">
                <el-icon :size="18"><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="detail">Chi tiết</el-dropdown-item>
                  <el-dropdown-item command="delete" divided class="!text-red-500">Xóa</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- Table Footer matching Players.vue pagination style -->
      <div class="p-3 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800/40 flex justify-between items-center shrink-0">
        <span class="text-xs text-gray-500 dark:text-gray-400">Hiển thị {{ paginatedContributions.length }}/{{ filteredContributions.length }} dòng</span>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :background="true"
          layout="sizes, prev, pager, next"
          :total="filteredContributions.length"
          size="small"
          class="custom-pagination"
        />
      </div>
    </div>

    <!-- Dialog: Add / Edit Contribution -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'CẬP NHẬT GIAO DỊCH ĐÓNG HỤI' : 'THÊM MỚI GIAO DỊCH ĐÓNG HỤI'"
      width="850px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form 
          :model="form" 
          :rules="rules" 
          ref="formRef" 
          label-width="170px"
          class="mt-2 compact-form"
          @submit.prevent="submitForm"
        >
          <!-- PHẦN 1: THÔNG TIN ĐÓNG HỤI -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              1. Thông tin đóng hụi
            </h4>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Dây hụi" prop="rosca_id" required>
                  <el-select 
                    v-model="form.rosca_id" 
                    placeholder="Chọn dây hụi..." 
                    class="w-full highlight-select" 
                    style="width: 100%"
                    @change="handleRoscaChange"
                    :disabled="isEdit"
                  >
                    <el-option 
                      v-for="r in roscasList" 
                      :key="r.id" 
                      :label="r.code + ' (' + (r.owner_name || 'N/A') + ')'" 
                      :value="r.id || ''" 
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Chân hụi đóng" prop="member_id" required>
                  <el-select 
                    v-model="form.member_id" 
                    placeholder="Chọn chân chơi..." 
                    class="w-full highlight-select" 
                    style="width: 100%"
                    :disabled="isEdit"
                    no-data-text="Vui lòng chọn dây hụi trước"
                  >
                    <el-option 
                      v-for="m in roscaMembers" 
                      :key="m.id" 
                      :label="m.player_name + ' (Chân: ' + (m.parts_count || 1) + ')'" 
                      :value="m.id || ''" 
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- Summary Card of Selected Rosca -->
            <div v-if="selectedContributionRosca" class="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/40 text-xs mb-4 space-y-2">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <span class="text-gray-400 dark:text-gray-500 font-medium">Mã Dây: </span>
                  <strong class="text-gray-800 dark:text-gray-200 font-mono">{{ selectedContributionRosca.code }}</strong>
                </div>
                <div>
                  <span class="text-gray-400 dark:text-gray-500 font-medium">Chủ hụi: </span>
                  <strong class="text-gray-800 dark:text-gray-200">{{ selectedContributionRosca.owner_name || 'N/A' }}</strong>
                </div>
                <div>
                  <span class="text-gray-400 dark:text-gray-500 font-medium">Tiền gốc 1 chân: </span>
                  <strong class="text-blue-600 dark:text-blue-400 font-mono">{{ formatCurrency(selectedContributionRosca.base_amount) }}</strong>
                </div>
                <div>
                  <span class="text-gray-400 dark:text-gray-500 font-medium">Trạng thái dây: </span>
                  <el-tag :type="getStatusTagType(selectedContributionRosca.status)" size="small">{{ getStatusLabel(selectedContributionRosca.status) }}</el-tag>
                </div>
              </div>
            </div>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Kỳ đóng hụi" prop="round_number">
                  <el-input-number v-model="form.round_number" :min="1" :max="200" class="w-full" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Số tiền đóng" prop="amount" required>
                  <el-input 
                    v-model="form.amount" 
                    placeholder="Nhập số tiền đóng..."
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
                <el-form-item label="Ngày đóng thực tế" prop="actual_payment_date">
                  <el-date-picker 
                    v-model="form.actual_payment_date" 
                    type="datetime" 
                    placeholder="Chọn ngày giờ đóng..." 
                    class="w-full" 
                    style="width: 100%"
                    value-format="YYYY-MM-DDTHH:mm:ss"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Trạng thái" prop="status" required>
                  <el-select v-model="form.status" placeholder="Chọn trạng thái..." class="w-full highlight-select" style="width: 100%">
                    <el-option label="Đã đóng (Paid)" value="Paid" />
                    <el-option label="Chưa đóng (Unpaid)" value="Unpaid" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Ghi chú" prop="note">
                  <el-input type="textarea" v-model="form.note" :rows="2" placeholder="Nhập ghi chú hoặc biên lai giao dịch..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-form>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3 pr-2">
          <el-button @click="dialogVisible = false">Hủy</el-button>
          <el-button 
            type="primary" 
            @click="submitForm" 
            :loading="submitting"
            class="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 border-none font-semibold text-white"
          >
            Xác nhận
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Dialog: Withdraw Rosca (Rút Hụi) -->
    <el-dialog
      v-model="withdrawDialogVisible"
      title="GHI NHẬN RÚT HỤI / HỐT HỤI"
      width="850px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form 
          :model="withdrawForm" 
          :rules="withdrawRules" 
          ref="withdrawFormRef" 
          label-width="170px"
          class="mt-2 compact-form"
          @submit.prevent="submitWithdrawForm"
        >
          <!-- PHẦN 1: THÔNG TIN GHI NHẬN RÚT HỤI / HỐT HỤI -->
          <div class="mb-5 pb-5 border-b border-gray-200 dark:border-gray-700">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              1. Thông tin hốt hụi
            </h4>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Dây hụi" prop="rosca_id" required>
                  <el-select 
                    v-model="withdrawForm.rosca_id" 
                    placeholder="Chọn dây hụi..." 
                    class="w-full highlight-select" 
                    style="width: 100%"
                    @change="handleWithdrawRoscaChange"
                  >
                    <el-option 
                      v-for="r in roscasList" 
                      :key="r.id" 
                      :label="r.code + ' (' + (r.owner_name || 'N/A') + ')'" 
                      :value="r.id || ''" 
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Chân hụi hốt" prop="member_id" required>
                  <el-select 
                    v-model="withdrawForm.member_id" 
                    placeholder="Chọn chân chơi..." 
                    class="w-full highlight-select" 
                    style="width: 100%"
                    no-data-text="Vui lòng chọn dây hụi trước"
                  >
                    <el-option 
                      v-for="m in withdrawRoscaMembers" 
                      :key="m.id" 
                      :label="m.player_name + ' (Chân: ' + (m.parts_count || 1) + ')'" 
                      :value="m.id || ''" 
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Kỳ hốt hụi" prop="round_number" required>
                  <el-input-number v-model="withdrawForm.round_number" :min="1" :max="200" class="w-full" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Số tiền hốt hụi" prop="amount" required>
                  <el-input 
                    v-model="withdrawForm.amount" 
                    placeholder="Nhập số tiền hốt..."
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
                <el-form-item label="Ngày hốt thực tế" prop="actual_payment_date">
                  <el-date-picker 
                    v-model="withdrawForm.actual_payment_date" 
                    type="datetime" 
                    placeholder="Chọn ngày giờ hốt..." 
                    class="w-full" 
                    style="width: 100%"
                    value-format="YYYY-MM-DDTHH:mm:ss"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Trạng thái" prop="status" required>
                  <el-select v-model="withdrawForm.status" placeholder="Chọn trạng thái..." class="w-full highlight-select" style="width: 100%">
                    <el-option label="Đã đóng (Paid)" value="Paid" />
                    <el-option label="Chưa đóng (Unpaid)" value="Unpaid" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Ghi chú" prop="note">
                  <el-input type="textarea" v-model="withdrawForm.note" :rows="2" placeholder="Nhập ghi chú rút hụi..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: CẬP NHẬT TRẠNG THÁI DÂY HỤI -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <span class="w-1.5 h-4 bg-amber-500 rounded-full"></span>
                2. Cập nhật trạng thái Dây hụi
              </h4>
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-gray-600 dark:text-gray-400">Thay đổi trạng thái Dây hụi:</span>
                <el-switch v-model="withdrawForm.change_rosca_status" active-text="Có" inactive-text="Không" />
              </div>
            </div>

            <div v-if="withdrawForm.change_rosca_status">
              <!-- Summary Card of Selected Rosca -->
              <div v-if="selectedWithdrawRosca" class="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 text-xs mb-4 space-y-2">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <span class="text-gray-400 dark:text-gray-500 font-medium">Mã Dây: </span>
                    <strong class="text-gray-800 dark:text-gray-200 font-mono">{{ selectedWithdrawRosca.code }}</strong>
                  </div>
                  <div>
                    <span class="text-gray-400 dark:text-gray-500 font-medium">Chủ hụi: </span>
                    <strong class="text-gray-800 dark:text-gray-200">{{ selectedWithdrawRosca.owner_name || 'N/A' }}</strong>
                  </div>
                  <div>
                    <span class="text-gray-400 dark:text-gray-500 font-medium">Tiền gốc 1 chân: </span>
                    <strong class="text-blue-600 dark:text-blue-400 font-mono">{{ formatCurrency(selectedWithdrawRosca.base_amount) }}</strong>
                  </div>
                  <div>
                    <span class="text-gray-400 dark:text-gray-500 font-medium">Trạng thái hiện tại: </span>
                    <el-tag :type="getStatusTagType(selectedWithdrawRosca.status)" size="small">{{ getStatusLabel(selectedWithdrawRosca.status) }}</el-tag>
                  </div>
                </div>
              </div>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Trạng thái Dây hụi mới">
                    <el-select v-model="withdrawForm.rosca_status" placeholder="Chọn trạng thái mới..." class="w-full highlight-select" style="width: 100%">
                      <el-option label="Đang hoạt động (Active)" value="Active" />
                      <el-option label="Hụi chết (Dead)" value="Dead" />
                      <el-option label="Đã đóng (Closed)" value="Closed" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </div>
        </el-form>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3 pr-2">
          <el-button @click="withdrawDialogVisible = false">Hủy</el-button>
          <el-button 
            type="primary" 
            @click="submitWithdrawForm" 
            :loading="withdrawSubmitting"
            class="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 border-none font-semibold text-white"
          >
            Xác nhận
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Dialog: Detail Contribution -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT GIAO DỊCH ĐÓNG HỤI"
      width="750px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedContrib" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto text-left">
        <!-- Visual Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-150 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-green-500 dark:bg-green-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32"><Refresh /></el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Giao dịch đóng hụi</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {{ selectedContrib.player_name }}
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <span class="text-gray-500 dark:text-gray-400">Dây hụi: <strong class="text-gray-750 dark:text-gray-250 font-mono">{{ selectedContrib.rosca_code }}</strong></span>
              <span class="text-gray-300 dark:text-gray-650">|</span>
              <span class="text-gray-500 dark:text-gray-400">Kỳ đóng: <strong class="text-gray-750 dark:text-gray-250">Kỳ {{ selectedContrib.round_number }}</strong></span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã Giao Dịch</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono select-all">{{ selectedContrib.id }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Trạng thái thanh toán</div>
            <div>
              <el-tag :type="getStatusTagType(selectedContrib.status)" size="default" class="font-semibold">
                {{ getStatusLabel(selectedContrib.status) }}
              </el-tag>
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số tiền thanh toán</div>
            <div class="text-sm font-bold text-green-600 dark:text-green-400 font-mono text-base">{{ formatCurrency(selectedContrib.amount) }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày đóng thực tế</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono">{{ formatDate(selectedContrib.actual_payment_date) }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã Chân Hụi (Member ID)</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono select-all">{{ selectedContrib.member_id }}</div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700/60"></div>

        <div>
          <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Ghi chú giao dịch</div>
          <div class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
            {{ selectedContrib.note || 'Không có ghi chú nào cho giao dịch này.' }}
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="detailDialogVisible = false">Đóng</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { Search, Refresh, Plus, MoreFilled, Wallet } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { roscaService, type RoscaContribution, type Rosca, type RoscaMember } from '@/api/roscaService'

// State
const contributions = ref<RoscaContribution[]>([])
const roscasList = ref<Rosca[]>([])
const roscaMembers = ref<RoscaMember[]>([]) // current loading list for form
const loading = ref(false)
const submitting = ref(false)

// Pagination state
const currentPage = ref(1)
const pageSize = ref(10)

// Filters
const filters = reactive({
  rosca_code_search: '',
  status: '',
  search: ''
})

// Dialog controls
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

const withdrawDialogVisible = ref(false)
const withdrawSubmitting = ref(false)
const withdrawFormRef = ref()
const withdrawRoscaMembers = ref<RoscaMember[]>([])

const detailDialogVisible = ref(false)
const selectedContrib = ref<RoscaContribution | null>(null)

const selectedContributionRosca = computed(() => {
  if (!form.rosca_id) return null
  return roscasList.value.find(r => r.id === form.rosca_id) || null
})

// Form state
const form = reactive<RoscaContribution>({
  id: '',
  rosca_id: '',
  member_id: '',
  round_number: undefined,
  amount: undefined,
  actual_payment_date: null,
  status: '',
  note: ''
})

const withdrawForm = reactive({
  rosca_id: '',
  member_id: '',
  round_number: undefined as number | undefined,
  amount: undefined as number | undefined,
  actual_payment_date: null as string | null,
  status: 'Paid',
  note: '',
  change_rosca_status: true,
  rosca_status: 'Active'
})

const selectedWithdrawRosca = computed(() => {
  if (!withdrawForm.rosca_id) return null
  return roscasList.value.find(r => r.id === withdrawForm.rosca_id) || null
})

// Rules
const withdrawRules = {
  rosca_id: [
    { required: true, message: 'Vui lòng chọn dây hụi', trigger: 'change' }
  ],
  member_id: [
    { required: true, message: 'Vui lòng chọn chân hụi hốt hụi', trigger: 'change' }
  ],
  round_number: [
    { required: true, message: 'Vui lòng nhập kỳ hốt hụi', trigger: 'blur' }
  ],
  amount: [
    { required: true, message: 'Vui lòng nhập số tiền hốt hụi', trigger: 'blur' }
  ],
  status: [
    { required: true, message: 'Vui lòng chọn trạng thái hốt hụi', trigger: 'change' }
  ]
}

// Rules
const rules = {
  rosca_id: [
    { required: true, message: 'Vui lòng chọn dây hụi', trigger: 'change' }
  ],
  member_id: [
    { required: true, message: 'Vui lòng chọn chân hụi đóng tiền', trigger: 'change' }
  ],
  amount: [
    { required: true, message: 'Vui lòng nhập số tiền đóng', trigger: 'blur' }
  ],
  status: [
    { required: true, message: 'Vui lòng chọn trạng thái đóng hụi', trigger: 'change' }
  ]
}

// Helpers
const getStatusLabel = (status?: string) => {
  switch (status) {
    case 'Paid': return 'Đã đóng'
    case 'Unpaid': return 'Chưa đóng'
    case 'Active': return 'Đang hoạt động'
    case 'Closed': return 'Đã đóng'
    case 'Dead': return 'Hụi chết'
    default: return status || '—'
  }
}

const getStatusTagType = (status?: string) => {
  switch (status) {
    case 'Paid': return 'success'
    case 'Unpaid': return 'warning'
    case 'Active': return 'success'
    case 'Closed': return 'info'
    case 'Dead': return 'danger'
    default: return 'info'
  }
}

const formatCurrency = (val?: number) => {
  if (val === undefined || val === null) return '—'
  return new Intl.NumberFormat('vi-VN').format(val) + ' VNĐ'
}

const formatDate = (val?: string | null) => {
  if (!val) return '—'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return val
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return val
  }
}

// Load configurations list
const fetchRoscas = async () => {
  try {
    const data = await roscaService.getRoscas()
    roscasList.value = data
  } catch (error) {
    console.error('Failed to load roscasList:', error)
  }
}

// Fetch contributions transactions
const fetchContributions = async () => {
  loading.value = true
  try {
    let roscaIdParam: string | undefined = undefined
    if (filters.rosca_code_search) {
      // Find matching rosca id by code
      const codeUpper = filters.rosca_code_search.toUpperCase().trim()
      const match = roscasList.value.find(r => r.code.toUpperCase() === codeUpper)
      if (match) {
        roscaIdParam = match.id
      } else {
        // If not found in loaded configs, return empty array early
        contributions.value = []
        loading.value = false
        return
      }
    }

    const data = await roscaService.getRoscaContributions({
      rosca_id: roscaIdParam,
      status: filters.status || undefined
    })
    contributions.value = data
    currentPage.value = 1 // Reset pagination back to page 1 after fetching new data
  } catch (error: any) {
    console.error(error)
    ElMessage.error(error.message || 'Lỗi khi tải danh sách giao dịch đóng hụi')
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  fetchContributions()
}

// Search input handling
let searchTimeout: any = null
const handleSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1 // Reset pagination back to page 1 when client search filter updates
  }, 200)
}

// Client filtering for Player Name & Note search
const filteredContributions = computed(() => {
  if (!filters.search) return contributions.value
  const searchLower = filters.search.toLowerCase().trim()
  return contributions.value.filter(item => {
    const nameMatch = item.player_name?.toLowerCase().includes(searchLower)
    const noteMatch = item.note?.toLowerCase().includes(searchLower)
    const codeMatch = item.rosca_code?.toLowerCase().includes(searchLower)
    return nameMatch || noteMatch || codeMatch
  })
})

// Paginated Contributions
const paginatedContributions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredContributions.value.slice(start, end)
})

// Add new contribution trigger
const handleOpenCreateDialog = () => {
  fetchRoscas()
  isEdit.value = false
  form.id = ''
  form.rosca_id = ''
  form.member_id = ''
  form.round_number = undefined
  form.amount = undefined
  form.actual_payment_date = new Date().toISOString().slice(0, 19)
  form.status = 'Paid'
  form.note = ''

  dialogVisible.value = true
  roscaMembers.value = []
}

// Load members for chosen rosca ID dynamically inside form select
const handleRoscaChange = async (roscaId: string) => {
  form.member_id = ''
  roscaMembers.value = []
  if (!roscaId) return

  try {
    const data = await roscaService.getRoscaMembers({ rosca_id: roscaId })
    roscaMembers.value = data
  } catch (error) {
    console.error('Failed to load rosca members for dropdown:', error)
  }
}

// Edit contribution trigger
const handleOpenEditDialog = async (row: RoscaContribution) => {
  isEdit.value = true
  form.id = row.id
  form.rosca_id = row.rosca_id
  form.member_id = row.member_id
  form.round_number = row.round_number || 1
  form.amount = row.amount || 0
  
  if (row.actual_payment_date) {
    // Keep raw string format YYYY-MM-DDTHH:mm:ss
    form.actual_payment_date = row.actual_payment_date.substring(0, 19)
  } else {
    form.actual_payment_date = null
  }
  
  form.status = row.status || 'Unpaid'
  form.note = row.note || ''

  dialogVisible.value = true
  
  // Load members dropdown and then map select value
  if (row.rosca_id) {
    try {
      const data = await roscaService.getRoscaMembers({ rosca_id: row.rosca_id })
      roscaMembers.value = data
    } catch (e) {
      console.error(e)
    }
  }
}

// Open detail panel
const handleOpenDetailDialog = (row: RoscaContribution) => {
  selectedContrib.value = row
  detailDialogVisible.value = true
}

// Actions dispatcher
const handleCommand = (cmd: string, row: RoscaContribution) => {
  if (cmd === 'detail') {
    handleOpenDetailDialog(row)
  } else if (cmd === 'edit') {
    handleOpenEditDialog(row)
  } else if (cmd === 'delete') {
    handleDelete(row)
  }
}

// Submit forms
const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true
      try {
        const payload: RoscaContribution = {
          id: form.id || undefined,
          rosca_id: form.rosca_id,
          member_id: form.member_id,
          round_number: parseInt(`${form.round_number || 1}`),
          amount: parseFloat(`${form.amount || 0}`),
          actual_payment_date: form.actual_payment_date || null,
          status: form.status,
          note: form.note?.trim() || null
        }

        if (isEdit.value) {
          await roscaService.updateRoscaContributions([payload])
          ElMessage.success('Cập nhật giao dịch đóng hụi thành công!')
        } else {
          await roscaService.addRoscaContributions([payload])
          ElMessage.success('Tạo giao dịch đóng hụi thành công!')
        }
        dialogVisible.value = false
        await fetchContributions()
      } catch (error: any) {
        ElMessage.error(error.message || 'Không thể lưu giao dịch đóng hụi')
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleOpenWithdrawDialog = () => {
  fetchRoscas()
  withdrawForm.rosca_id = ''
  withdrawForm.member_id = ''
  withdrawForm.round_number = undefined
  withdrawForm.amount = undefined
  withdrawForm.actual_payment_date = new Date().toISOString().slice(0, 19)
  withdrawForm.status = 'Paid'
  withdrawForm.note = ''
  withdrawForm.change_rosca_status = true
  withdrawForm.rosca_status = 'Active'
  
  withdrawRoscaMembers.value = []
  withdrawDialogVisible.value = true
}

const handleWithdrawRoscaChange = async (roscaId: string) => {
  withdrawForm.member_id = ''
  withdrawRoscaMembers.value = []
  if (!roscaId) return

  const rosca = roscasList.value.find(r => r.id === roscaId)
  if (rosca) {
    withdrawForm.rosca_status = rosca.status || 'Active'
  }

  try {
    const data = await roscaService.getRoscaMembers({ rosca_id: roscaId })
    withdrawRoscaMembers.value = data
  } catch (error) {
    console.error('Failed to load rosca members for withdraw dropdown:', error)
  }
}

const submitWithdrawForm = async () => {
  if (!withdrawFormRef.value) return
  await withdrawFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      withdrawSubmitting.value = true
      try {
        const payload: RoscaContribution = {
          rosca_id: withdrawForm.rosca_id,
          member_id: withdrawForm.member_id,
          round_number: parseInt(`${withdrawForm.round_number || 1}`),
          amount: parseFloat(`${withdrawForm.amount || 0}`),
          actual_payment_date: withdrawForm.actual_payment_date || null,
          status: withdrawForm.status,
          note: withdrawForm.note?.trim() || null
        }

        await roscaService.withdrawRoscas([payload])

        // Nếu toggle change_rosca_status là true, cập nhật trạng thái dây hụi vào DB
        if (withdrawForm.change_rosca_status && withdrawForm.rosca_id && selectedWithdrawRosca.value) {
          try {
            await roscaService.updateRoscas([{
              id: selectedWithdrawRosca.value.id,
              code: selectedWithdrawRosca.value.code,
              user_id: selectedWithdrawRosca.value.user_id,
              base_amount: selectedWithdrawRosca.value.base_amount,
              status: withdrawForm.rosca_status
            }])
            await fetchRoscas()
          } catch (roscaErr: any) {
            console.error('Lỗi khi cập nhật trạng thái dây hụi:', roscaErr)
            ElMessage.warning('Cập nhật trạng thái dây hụi thất bại, đã ghi nhận hốt hụi.')
          }
        }

        ElMessage.success('Ghi nhận rút hụi / hốt hụi thành công!')
        withdrawDialogVisible.value = false
        await fetchContributions()
      } catch (error: any) {
        ElMessage.error(error.message || 'Không thể ghi nhận rút hụi')
      } finally {
        withdrawSubmitting.value = false
      }
    }
  })
}

// Delete transaction
const handleDelete = (row: RoscaContribution) => {
  ElMessageBox.confirm(
    `Bạn có chắc chắn muốn xóa giao dịch đóng hụi của "${row.player_name}" (Kỳ ${row.round_number}) khỏi dây hụi "${row.rosca_code}" không?`,
    'Xác nhận xóa giao dịch',
    {
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy bỏ',
      type: 'warning'
    }
  ).then(async () => {
    loading.value = true
    try {
      if (row.id) {
        await roscaService.deleteRoscaContributions([row.id])
        ElMessage.success('Xóa giao dịch thành công!')
        await fetchContributions()
      }
    } catch (error: any) {
      ElMessage.error(error.message || 'Lỗi khi xóa giao dịch')
    } finally {
      loading.value = false
    }
  }).catch(() => {})
}

onMounted(async () => {
  await fetchRoscas()
  await fetchContributions()
})
</script>

<style scoped>
/* Custom dark mode styles for table to match application theme */
html.dark .members-content :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .members-content :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .members-content :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

html.dark .members-content :deep(.el-table .el-table-fixed-column--left),
html.dark .members-content :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important;
}

html.dark .custom-dark-input {
  --el-input-text-color: #f3f4f6 !important;
  --el-text-color-regular: #f3f4f6 !important;
  --el-text-color-placeholder: #9ca3af !important;
}

html.dark .custom-dark-input :deep(.el-input__wrapper),
html.dark .custom-dark-input :deep(.el-select__wrapper) {
  background-color: #1f2937 !important;
  box-shadow: 0 0 0 1px #374151 inset !important;
}

html.dark .custom-dark-input :deep(.el-input__inner),
html.dark .custom-dark-input :deep(.el-select__placeholder) {
  color: #f3f4f6 !important;
  -webkit-text-fill-color: #f3f4f6 !important;
  opacity: 1 !important;
}
</style>
