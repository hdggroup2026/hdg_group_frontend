<template>
  <div class="cash-advance-container h-full flex flex-col">
    <!-- FILTER BAR -->
    <div class="flex flex-wrap justify-between items-center gap-x-4 gap-y-4 mb-4 shrink-0">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-4">
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

        <!-- Collection Point Filter -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Điểm thu mua:</span>
          <el-select
            v-model="selectedCollectionPoint"
            placeholder="Chọn điểm thu mua"
            style="width: 200px"
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Tất cả" value="all" />
            <el-option
              v-for="point in collectionPoints"
              :key="point.id"
              :label="point.collection_name"
              :value="point.id"
            />
          </el-select>
        </div>

        <!-- Advance Type Filter -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Loại ứng tiền:</span>
          <el-select
            v-model="selectedAdvanceType"
            placeholder="Chọn loại ứng tiền"
            style="width: 200px"
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Tất cả" value="all" />
            <el-option label="Ứng tiền trong tháng" value="IN_MONTH" />
            <el-option label="Ứng tiền cuối mùa" value="SEASON_END" />
          </el-select>
        </div>

        <!-- Entry Type Filter -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Loại giao dịch:</span>
          <el-select
            v-model="selectedEntryType"
            placeholder="Chọn loại giao dịch"
            style="width: 160px"
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Tất cả" value="all" />
            <el-option label="Chi (ứng ra)" value="ADVANCE" />
            <el-option label="Thu (khấu trừ)" value="DEDUCT" />
          </el-select>
        </div>

        <!-- Search -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
          <el-input
            v-model="searchQuery"
            placeholder="Tên hộ, mã hộ, ghi chú..."
            :prefix-icon="Search"
            clearable
            class="w-60 custom-dark-input"
          />
        </div>
      </div>
      <div class="flex items-center gap-2">
        <el-button :icon="Refresh" circle @click="refreshAll" :loading="loading" />
        <el-button type="primary" :icon="Download" @click="exportExcel" :disabled="filteredData.length === 0">
          Xuất Excel
        </el-button>
      </div>
    </div>

    <!-- SUMMARY CARDS -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4 shrink-0">
      <div
        v-for="card in summaryCards"
        :key="card.label"
        class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 cursor-pointer transition hover:shadow-lg"
        :class="card.borderClass"
        v-loading="summaryLoading"
        role="button"
        :title="`Xem lịch sử hình thành con số ${card.label}`"
        @click="moLichSu(card.loai)"
      >
        <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          {{ card.label }}
        </div>
        <div class="mt-1 text-xl font-bold underline decoration-dotted underline-offset-4" :class="card.textClass">
          {{ card.value }}
        </div>
        <!-- ⚠️ MỤC 448 — chữ nhắc nhỏ. Ô bấm được mà không có dấu hiệu gì
             thì không ai nghĩ tới việc bấm; gạch chân chấm ở con số và
             dòng này là hai dấu hiệu, không phải một. -->
        <div class="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
          Bấm để xem lịch sử
        </div>
      </div>
    </div>

    <!-- TRUNCATION WARNING -->
    <el-alert
      v-if="isTruncated"
      type="warning"
      show-icon
      :closable="false"
      class="mb-4 shrink-0"
      :title="`Chỉ hiển thị ${allData.length} / ${serverTotal} bản ghi mới nhất — hãy thu hẹp bộ lọc thời gian.`"
    />

    <!-- DATA TABLE -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
      <!-- ══════════════════════════════════════════════════════════════
           MỤC 396 (29/08/2026) — BỎ CỘT GHIM, BẢNG CHỈ HIỆN TỪ 768px

           Cột ghim `fixed` chiếm chỗ CỐ ĐỊNH và không co theo màn hình.
           Trên màn 390px, mấy cột ghim cộng lại đã hết chỗ, nên vùng
           cuộn còn lại bằng 0 và vuốt ngang không có tác dụng — người
           dùng vuốt mà màn hình không nhúc nhích.

           Đã bỏ 3 cột ghim ở bảng này.
           ══════════════════════════════════════════════════════════ -->
      <el-table v-if="hienBang"
        :data="tableData"
        style="width: 100%"
        class="flex-1"
        height="100%"
        v-loading="loading"
        @sort-change="handleSortChange"
      >
        <el-table-column label="STT" width="52" align="center">
          <template #default="{ $index }">
            <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="Thời gian" min-width="108" sortable="custom">
          <template #default="scope">
            <span class="font-mono text-xs">{{ formatDateTime(scope.row.created_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="hoursehold_id" label="Mã hộ" min-width="86" sortable="custom">
          <template #default="scope">
            <span class="font-bold text-blue-600 dark:text-blue-400">{{ scope.row.hoursehold_id || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="fullname" label="Tên hộ dân" min-width="130">
          <template #default="scope">
            <span>{{ scope.row.fullname || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="collection_name" label="Điểm thu mua" min-width="108">
          <template #default="scope">
            <span>{{ scope.row.collection_name || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="entry_type" label="Loại giao dịch" min-width="94" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.entry_type === 'ADVANCE'" type="danger" effect="light">Chi</el-tag>
            <el-tag v-else-if="scope.row.entry_type === 'DEDUCT'" type="success" effect="light">Thu</el-tag>
            <el-tag v-else type="info" effect="light">{{ scope.row.entry_type || 'Chưa rõ' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="advance_type" label="Loại ứng tiền" min-width="101" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.advance_type === 'IN_MONTH'" type="warning" effect="light">Trong tháng</el-tag>
            <el-tag v-else-if="scope.row.advance_type === 'SEASON_END'" type="primary" effect="light">Cuối mùa</el-tag>
            <el-tag v-else type="info" effect="light">{{ scope.row.advance_type || 'Chưa rõ' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="Số tiền" min-width="108" align="right" sortable="custom">
          <template #default="scope">
            <span
              class="font-bold"
              :class="scope.row.entry_type === 'DEDUCT' ? 'text-green-500' : 'text-red-500'">
              {{ scope.row.entry_type === 'DEDUCT' ? '-' : '+' }}{{ formatCurrency(scope.row.amount || 0) }} VNĐ
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="balance_before" label="Dư trước" min-width="101" align="right">
          <template #default="scope">
            <span :class="mauSo(scope.row.balance_before || 0)">{{ formatCurrency(scope.row.balance_before || 0) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="balance_after" label="Dư sau" min-width="101" align="right">
          <template #default="scope">
            <span class="font-bold" :class="mauSo(scope.row.balance_after || 0)">{{ formatCurrency(scope.row.balance_after || 0) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="debt_applied" label="Trừ công nợ" min-width="86" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.debt_applied" type="danger" effect="light">Có</el-tag>
            <span v-else class="text-gray-400">Không</span>
          </template>
        </el-table-column>
        <el-table-column prop="debt_before" label="Công nợ trước" min-width="108" align="right">
          <template #default="scope">
            <span class="text-gray-500 dark:text-gray-400">{{ formatMoneyOrDash(scope.row.debt_before) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="debt_after" label="Công nợ sau" min-width="108" align="right">
          <template #default="scope">
            <span :class="scope.row.debt_applied ? 'font-bold text-red-500' : 'text-gray-500 dark:text-gray-400'">
              {{ formatMoneyOrDash(scope.row.debt_after) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="is_over_limit" label="Hạn mức" min-width="86" align="center">
          <template #default="scope">
            <el-tooltip
              v-if="scope.row.is_over_limit"
              :content="scope.row.approved_by ? `Duyệt bởi: ${scope.row.approved_by}` : 'Chưa có người duyệt'"
              placement="top"
            >
              <el-tag type="danger" effect="dark">Vượt HM</el-tag>
            </el-tooltip>
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_by" label="Người thực hiện" min-width="108">
          <template #default="scope">
            <span>{{ scope.row.created_by || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="Ghi chú" min-width="144" show-overflow-tooltip>
          <template #default="scope">
            <span class="text-gray-600 dark:text-gray-400">{{ scope.row.note || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Operations Column -->
        <el-table-column label="Thao tác" width="60" align="center">
          <template #default="scope">
            <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, scope.row)">
              <el-button link type="info" class="p-1">
                <el-icon class="text-xl"><MoreFilled /></el-icon>
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
                <span class="font-mono text-xs">{{ formatDateTime(row.created_at) }}</span>
              </div>
              <div class="shrink-0">
                <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, row)">
                              <el-button link type="info" class="p-1">
                                <el-icon class="text-xl"><MoreFilled /></el-icon>
                              </el-button>
                              <template #dropdown>
                                <el-dropdown-menu>
                                  <el-dropdown-item command="detail">Chi tiết</el-dropdown-item>
                                  <el-dropdown-item command="delete" divided class="!text-red-500">Xóa</el-dropdown-item>
                                </el-dropdown-menu>
                              </template>
                            </el-dropdown>
              </div>
            </div>
            <div class="space-y-2 text-sm text-left">
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Mã hộ:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-bold text-blue-600 dark:text-blue-400">{{ row.hoursehold_id || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tên hộ dân:</span>
                <span class="text-right break-words min-w-0">
                  <span>{{ row.fullname || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Điểm thu mua:</span>
                <span class="text-right break-words min-w-0">
                  <span>{{ row.collection_name || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Loại giao dịch:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag v-if="row.entry_type === 'ADVANCE'" type="danger" effect="light">Chi</el-tag>
                              <el-tag v-else-if="row.entry_type === 'DEDUCT'" type="success" effect="light">Thu</el-tag>
                              <el-tag v-else type="info" effect="light">{{ row.entry_type || 'Chưa rõ' }}</el-tag>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Loại ứng tiền:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag v-if="row.advance_type === 'IN_MONTH'" type="warning" effect="light">Trong tháng</el-tag>
                              <el-tag v-else-if="row.advance_type === 'SEASON_END'" type="primary" effect="light">Cuối mùa</el-tag>
                              <el-tag v-else type="info" effect="light">{{ row.advance_type || 'Chưa rõ' }}</el-tag>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Số tiền:</span>
                <span class="text-right break-words min-w-0">
                  <span
                                class="font-bold"
                                :class="row.entry_type === 'DEDUCT' ? 'text-green-500' : 'text-red-500'">
                                {{ row.entry_type === 'DEDUCT' ? '-' : '+' }}{{ formatCurrency(row.amount || 0) }} VNĐ
                              </span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Dư trước:</span>
                <span class="text-right break-words min-w-0">
                  <span :class="mauSo(row.balance_before || 0)">{{ formatCurrency(row.balance_before || 0) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Dư sau:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-bold" :class="mauSo(row.balance_after || 0)">{{ formatCurrency(row.balance_after || 0) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Trừ công nợ:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag v-if="row.debt_applied" type="danger" effect="light">Có</el-tag>
                              <span v-else class="text-gray-400">Không</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Công nợ trước:</span>
                <span class="text-right break-words min-w-0">
                  <span class="text-gray-500 dark:text-gray-400">{{ formatMoneyOrDash(row.debt_before) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Công nợ sau:</span>
                <span class="text-right break-words min-w-0">
                  <span :class="row.debt_applied ? 'font-bold text-red-500' : 'text-gray-500 dark:text-gray-400'">
                                {{ formatMoneyOrDash(row.debt_after) }}
                              </span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Hạn mức:</span>
                <span class="text-right break-words min-w-0">
                  <el-tooltip
                                v-if="row.is_over_limit"
                                :content="row.approved_by ? `Duyệt bởi: ${row.approved_by}` : 'Chưa có người duyệt'"
                                placement="top"
                              >
                                <el-tag type="danger" effect="dark">Vượt HM</el-tag>
                              </el-tooltip>
                              <span v-else class="text-gray-400">—</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Người thực hiện:</span>
                <span class="text-right break-words min-w-0">
                  <span>{{ row.created_by || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ghi chú:</span>
                <span class="text-right break-words min-w-0">
                  <span class="text-gray-600 dark:text-gray-400">{{ row.note || '—' }}</span>
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

    <!-- DIALOG: CHI TIẾT GIAO DỊCH ỨNG TIỀN -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT GIAO DỊCH ỨNG TIỀN"
      class="custom-dark-dialog"
      width="700px"
      destroy-on-close
      align-center
    >
      <div v-if="detailData" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto overflow-x-hidden">
        <!-- Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <el-avatar :size="64" :class="detailData.entry_type === 'DEDUCT' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'">
            <span
              class="text-xl font-bold"
              :class="detailData.entry_type === 'DEDUCT' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
              {{ detailData.entry_type === 'DEDUCT' ? 'T' : 'C' }}
            </span>
          </el-avatar>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              {{ entryTypeLabel(detailData.entry_type) }} — {{ advanceTypeLabel(detailData.advance_type) }}
            </div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {{ detailData.fullname || 'Không rõ hộ dân' }}
              <span class="text-gray-400 dark:text-gray-500 font-medium">({{ detailData.hoursehold_id || '—' }})</span>
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <span class="text-gray-600 dark:text-gray-400">
                Điểm thu mua: <span class="font-semibold">{{ detailData.collection_name || '—' }}</span>
              </span>
              <span class="text-gray-400 dark:text-gray-500">|</span>
              <span class="text-gray-600 dark:text-gray-400">{{ formatDateTime(detailData.created_at) }}</span>
            </div>
          </div>
        </div>

        <!-- Số tiền & số dư -->
        <div>
          <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            Số tiền & số dư
          </h4>
          <div class="grid grid-cols-3 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số tiền</div>
              <div
                class="text-sm font-bold"
                :class="detailData.entry_type === 'DEDUCT' ? 'text-green-500' : 'text-red-500'"
              >
                {{ detailData.entry_type === 'DEDUCT' ? '-' : '+' }}{{ formatCurrency(detailData.amount || 0) }} VNĐ
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Dư trước</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatCurrency(detailData.balance_before || 0) }} VNĐ</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Dư sau</div>
              <div class="text-sm font-bold text-orange-500 dark:text-orange-400">{{ formatCurrency(detailData.balance_after || 0) }} VNĐ</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Trừ công nợ</div>
              <div class="text-sm font-medium">
                <el-tag v-if="detailData.debt_applied" type="danger" effect="light">Có</el-tag>
                <span v-else class="text-gray-700 dark:text-gray-300">Không</span>
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Công nợ trước</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatMoneyOrDash(detailData.debt_before) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Công nợ sau</div>
              <div
                class="text-sm font-bold"
                :class="detailData.debt_applied ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'"
              >
                {{ formatMoneyOrDash(detailData.debt_after) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Thông tin thực hiện -->
        <div>
          <h4 class="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
            Thông tin thực hiện
          </h4>
          <div class="grid grid-cols-2 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Vượt hạn mức</div>
              <div class="text-sm font-medium">
                <el-tag v-if="detailData.is_over_limit" type="danger" effect="dark">Có</el-tag>
                <span v-else class="text-gray-700 dark:text-gray-300">Không</span>
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Người duyệt</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ detailData.approved_by || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Người thực hiện</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ detailData.created_by || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Nhóm thực hiện (chat)</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ detailData.chat_id || '—' }}</div>
            </div>
            <div class="col-span-2">
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ghi chú</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-pre-line">{{ detailData.note || '—' }}</div>
            </div>
            <div class="col-span-2">
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã bản ghi</div>
              <div class="text-xs font-mono text-gray-500 dark:text-gray-400 break-all">{{ detailData.id }}</div>
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
    <!-- ══════════════════════════════════════════════════════════════
         MỤC 448 (01/09/2026) — LỊCH SỬ HÌNH THÀNH CON SỐ

         s68 (ảnh 3, 31/08): *"3 số liệu trên bấm vào phải hiện ra bảng
         lịch sử liên kết hình thành các con số đấy luôn. Kể cả số 74 hộ
         dân."*

         🔴 Bốn con số này do BACKEND tính, nhưng tính từ ĐÚNG bảng
         `cash_advance_logs` với ĐÚNG bộ lọc đang chọn
         (`app/crud/cash_advance_log.py` hàm `get_cash_advance_summary`).
         Nên dựng lại từ `allData` là ra đúng cùng con số — và hộp thoại
         tự đối chiếu để chứng minh, xem dòng cuối.
         ══════════════════════════════════════════════════════════════ -->
    <el-dialog v-model="hienLichSu" width="900px" align-center destroy-on-close>
      <template #header>
        <span class="font-bold">LỊCH SỬ: {{ tieuDeLichSu }}</span>
      </template>

      <div class="space-y-3">
        <!-- 🔴 Cảnh báo TRƯỚC bảng, không phải sau. Danh sách bị cắt mà
             người đọc phát hiện sau khi đã cộng tay là mất công vô ích. -->
        <el-alert v-if="thieuDong" type="warning" show-icon :closable="false"
                  :title="`Chỉ tải được ${allData.length} trong ${serverTotal} giao dịch.`"
                  description="Danh sách dưới đây CHƯA ĐỦ. Thu hẹp khoảng thời gian hoặc chọn một điểm thu mua để xem trọn vẹn." />

        <!-- ══ Ba ô tiền: liệt kê từng giao dịch ══ -->
        <el-table v-if="loaiLichSu !== 'ho'" :data="dongLichSu" size="small"
                  border stripe max-height="440">
          <el-table-column label="STT" width="52" align="center" type="index" />
          <el-table-column prop="created_at" label="Thời gian" width="130">
            <template #default="{ row }">
              <span class="text-xs">{{ formatDateTime(row.created_at) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="hoursehold_id" label="Mã hộ" width="86">
            <template #default="{ row }">
              <span class="font-mono font-bold text-xs">{{ row.hoursehold_id }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="fullname" label="Tên hộ dân" min-width="130" show-overflow-tooltip />
          <el-table-column prop="collection_name" label="Điểm thu mua" min-width="110" show-overflow-tooltip />
          <el-table-column label="Loại" width="94" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.entry_type === 'ADVANCE' ? 'danger' : 'success'" effect="plain">
                {{ row.entry_type === 'ADVANCE' ? 'Ứng' : 'Khấu trừ' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Số tiền" width="120" align="right">
            <template #default="{ row }">
              <span class="font-mono text-xs font-bold"
                    :class="row.entry_type === 'ADVANCE' ? 'text-red-600' : 'text-green-600'">
                {{ row.entry_type === 'ADVANCE' ? '+' : '−' }}{{ formatCurrency(row.amount || 0) }}
              </span>
            </template>
          </el-table-column>
          <!-- Cột cộng dồn: nhìn là thấy con số lớn hình thành thế nào. -->
          <el-table-column label="Cộng dồn" width="124" align="right">
            <template #default="{ $index }">
              <span class="font-mono text-xs">{{ formatCurrency(congDon[$index] || 0) }}</span>
            </template>
          </el-table-column>
        </el-table>

        <!-- ══ Ô số hộ dân: gộp theo hộ ══ -->
        <el-table v-else :data="dongTheoHo" size="small" border stripe max-height="440">
          <el-table-column label="STT" width="52" align="center" type="index" />
          <el-table-column prop="hoursehold_id" label="Mã hộ" width="96">
            <template #default="{ row }">
              <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.hoursehold_id }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="fullname" label="Tên hộ dân" min-width="150" show-overflow-tooltip />
          <el-table-column prop="collection_name" label="Điểm thu mua" min-width="120" show-overflow-tooltip />
          <el-table-column label="Số giao dịch" width="110" align="center">
            <template #default="{ row }">{{ row.so_gd }}</template>
          </el-table-column>
          <el-table-column label="Đã ứng" width="120" align="right">
            <template #default="{ row }">
              <span class="font-mono text-xs text-red-600">{{ formatCurrency(row.ung) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Đã khấu trừ" width="120" align="right">
            <template #default="{ row }">
              <span class="font-mono text-xs text-green-600">{{ formatCurrency(row.khau_tru) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Còn ứng" width="120" align="right">
            <template #default="{ row }">
              <span class="font-mono text-xs font-bold">{{ formatCurrency(row.con) }}</span>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="soDongLichSu === 0" class="text-center text-gray-400 py-8 text-sm">
          Không có giao dịch nào trong khoảng lọc hiện tại.
        </div>

        <!-- ══════════════════════════════════════════════════════════
             🔴 DÒNG ĐỐI CHIẾU — phần quan trọng nhất của hộp thoại này.

             Cộng lại danh sách trên rồi so với con số đang hiện ở ô
             thống kê. Khớp thì nói khớp; lệch thì nói lệch và bao nhiêu.

             Một bảng "lịch sử hình thành con số" mà không tự chứng minh
             nó cộng ra đúng con số đó thì chỉ là một bảng nữa để nghi
             ngờ.
             ══════════════════════════════════════════════════════════ -->
        <div class="text-sm border-t pt-3 border-gray-200 dark:border-gray-700">
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">Cộng từ danh sách trên:</span>
            <span class="font-mono font-bold">{{ chuTongTinh }}</span>
          </div>
          <div class="flex justify-between mt-1">
            <span class="text-gray-500 dark:text-gray-400">Số đang hiện ở ô thống kê:</span>
            <span class="font-mono font-bold">{{ chuTongO }}</span>
          </div>
          <div class="mt-2 font-semibold"
               :class="khopNhau ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
            {{ khopNhau ? '✅ Hai số khớp nhau.'
                        : '⚠️ Hai số LỆCH NHAU — báo lại để kiểm, đừng dùng số này.' }}
          </div>
        </div>
      </div>

      <template #footer>
        <span class="text-sm text-gray-400 mr-3">{{ soDongLichSu }} dòng</span>
        <el-button @click="hienLichSu = false">Đóng</el-button>
      </template>
    </el-dialog>

</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { mauSo } from '@/utils/mauSo'
import { Search, Refresh, Download, MoreFilled } from '@element-plus/icons-vue'
import { ElNotification, ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx-js-style'
import { tienNgaService } from '@/api/tienNgaService'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'

const { laManHep, hienBang, hienThe } = dungManHep()

// Backend chỉ trả tối đa 1000 dòng mỗi lần gọi (tien_nga.py: limit phải nằm trong 1..1000).
const FETCH_LIMIT = 1000

const formatDate = (date: Date) => {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const getInitialDateRange = (): [string, string] => {
  const today = new Date()
  const lastMonth = new Date()
  lastMonth.setDate(today.getDate() - 30) // Mặc định 30 ngày gần nhất
  return [formatDate(lastMonth), formatDate(today)]
}

// State
const currentPage = ref(1)
const pageSize = ref(20)
const dateRange = ref<[string, string] | null>(getInitialDateRange())
const selectedCollectionPoint = ref('all')
const selectedAdvanceType = ref('all')
const selectedEntryType = ref('all')
const searchQuery = ref('')
const debouncedSearch = ref('')
const loading = ref(false)
const summaryLoading = ref(false)
const allData = ref<any[]>([])
const serverTotal = ref(0)
const collectionPoints = ref<any[]>([])
const summary = ref<any>(null)
const detailDialogVisible = ref(false)
const detailData = ref<any>(null)

const isTruncated = computed(() => serverTotal.value > allData.value.length)

// Formatting utilities
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value)
}

// Dòng log tạo trước khi có 3 cột công nợ để NULL — hiện "—" chứ không phải "0",
// vì không biết công nợ tại thời điểm đó khác hẳn với biết rằng nó bằng 0.
const formatMoneyOrDash = (value: number | null | undefined) => {
  return value === null || value === undefined ? '—' : formatCurrency(value)
}

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return String(value)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${mi}`
}

const entryTypeLabel = (value: string | null | undefined) => {
  if (value === 'ADVANCE') return 'Chi'
  if (value === 'DEDUCT') return 'Thu'
  return value || 'Chưa rõ'
}

const advanceTypeLabel = (value: string | null | undefined) => {
  if (value === 'IN_MONTH') return 'Ứng tiền trong tháng'
  if (value === 'SEASON_END') return 'Ứng tiền cuối mùa'
  return value || 'Chưa rõ'
}

// ══════════════════════════════════════════════════════════════════════
// MỤC 448 (01/09/2026) — LỊCH SỬ HÌNH THÀNH BỐN CON SỐ THỐNG KÊ
//
// s68 (ảnh 3): *"3 số liệu trên bấm vào phải hiện ra bảng lịch sử liên kết
// hình thành các con số đấy luôn. Kể cả số 74 hộ dân."*
//
// 🔴 DỰNG LẠI TỪ `allData`, KHÔNG GỌI THÊM API.
//
// Bốn con số do backend tính, nhưng tính từ ĐÚNG bảng `cash_advance_logs`
// với ĐÚNG bộ lọc đang chọn (`app/crud/cash_advance_log.py` hàm
// `get_cash_advance_summary`). `allData` chính là bộ dòng đó. Gọi thêm một
// đường API nữa để lấy lại cùng dữ liệu là hai nguồn cho một con số — và
// hai nguồn thì có ngày lệch nhau.
//
// ⚠️ ĐÁNH ĐỔI PHẢI NÓI RA: `allData` bị chặn ở `FETCH_LIMIT = 1000` dòng.
// Vượt ngưỡng đó thì danh sách KHÔNG đủ, và hộp thoại hiện cảnh báo vàng
// ngay đầu — trước bảng, không phải sau. Người đọc phát hiện thiếu sau khi
// đã cộng tay là mất công vô ích.
// ══════════════════════════════════════════════════════════════════════
// ⚠️ MỤC 449 — KHAI RÕ KIỂU cho `loai`. Không khai thì TypeScript suy ra
// `string`, mà `moLichSu()` chỉ nhận đúng bốn giá trị — `vue-tsc` báo
// TS2345 và Cloudflare không dựng được.
type LoaiLichSu = 'ung' | 'khau_tru' | 'du' | 'ho'

const hienLichSu = ref(false)
const loaiLichSu = ref<LoaiLichSu>('ung')

const moLichSu = (loai: LoaiLichSu) => {
  loaiLichSu.value = loai
  hienLichSu.value = true
}

const thieuDong = computed(() => serverTotal.value > allData.value.length)

// ⚠️ MỤC 449 — `?? ''` ở mọi chỗ tra khoá. Xem lời ghi ở `tongTinh`.
const tieuDeLichSu = computed(() => ({
  ung: 'TỔNG ĐÃ ỨNG',
  khau_tru: 'TỔNG ĐÃ KHẤU TRỪ',
  du: 'DƯ NỢ ỨNG HIỆN TẠI',
  ho: 'SỐ HỘ DÂN',
}[loaiLichSu.value] ?? ''))

// ⚠️ Xếp theo thời gian TĂNG DẦN, ngược với bảng chính. Cột "Cộng dồn" chỉ
// có nghĩa khi đọc từ giao dịch đầu tiên trở đi.
const dongLichSu = computed(() => {
  const ds = [...(allData.value || [])].sort(
    (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  if (loaiLichSu.value === 'ung') return ds.filter((r: any) => r.entry_type === 'ADVANCE')
  if (loaiLichSu.value === 'khau_tru') return ds.filter((r: any) => r.entry_type !== 'ADVANCE')
  return ds   // 'du' — cả hai loại, vì dư nợ là hiệu của chúng
})

// Cột cộng dồn: nhìn là thấy con số lớn hình thành thế nào qua từng dòng.
const congDon = computed(() => {
  let tong = 0
  return dongLichSu.value.map((r: any) => {
    const so = Number(r.amount || 0)
    if (loaiLichSu.value === 'du') {
      tong += (r.entry_type === 'ADVANCE' ? so : -so)
    } else {
      tong += so
    }
    return tong
  })
})

// Ô "Số hộ dân": gộp theo hộ, mỗi hộ một dòng.
//
// ⚠️ Gộp bằng `Map` một lượt, KHÔNG lọc lại mảng cho mỗi hộ — 74 hộ mà lọc
// lại 74 lần trên 1000 dòng là 74.000 lượt so sánh.
const dongTheoHo = computed(() => {
  const gop = new Map<string, any>()
  for (const r of (allData.value || []) as any[]) {
    const ma = r.hoursehold_id || '(chưa rõ)'
    if (!gop.has(ma)) {
      gop.set(ma, {
        hoursehold_id: ma, fullname: r.fullname || 'Chưa rõ',
        collection_name: r.collection_name || 'Không rõ',
        so_gd: 0, ung: 0, khau_tru: 0, con: 0,
      })
    }
    const o = gop.get(ma)
    const so = Number(r.amount || 0)
    o.so_gd += 1
    if (r.entry_type === 'ADVANCE') o.ung += so
    else o.khau_tru += so
    o.con = o.ung - o.khau_tru
  }
  // Ứng nhiều lên trên — cùng quy ước với MỤC 445.
  return [...gop.values()].sort((a, b) => b.con - a.con)
})

const soDongLichSu = computed(() =>
  loaiLichSu.value === 'ho' ? dongTheoHo.value.length : dongLichSu.value.length)

// ── Đối chiếu: cộng từ danh sách vs con số ở ô thống kê ───────────────
// ══════════════════════════════════════════════════════════════════════
// ⚠️ MỤC 449 (01/09/2026) — MỌI CHỖ TRA KHOÁ PHẢI CÓ `?? 0` / `?? ''`
//
// Dự án bật `noUncheckedIndexedAccess`: `mang[i]` và `obj[khoa]` trả về
// `X | undefined`, không phải `X`. Thiếu dấu này thì `vue-tsc --build`
// (chạy trong `pnpm build`, `package.json` dòng 8) báo đỏ và **Cloudflare
// không dựng được** — bản dựng hỏng, không phải một cảnh báo.
//
// 🔴 Lỗi này KHÔNG lộ ra lúc viết, chỉ lộ khi CI chạy. Đây là lý do gói
// L27 dựng hỏng ngay lần đầu.
// ══════════════════════════════════════════════════════════════════════
const tongTinh = computed<number>(() => {
  if (loaiLichSu.value === 'ho') return dongTheoHo.value.length
  const cuoi = congDon.value.length
  return cuoi ? (congDon.value[cuoi - 1] ?? 0) : 0
})

const tongO = computed<number>(() => {
  const s = summary.value || ({} as any)
  return {
    ung: Number(s.total_advanced || 0),
    khau_tru: Number(s.total_deducted || 0),
    du: Number(s.total_outstanding || 0),
    ho: Number(s.total_households || 0),
  }[loaiLichSu.value] ?? 0
})

const chuTongTinh = computed(() => loaiLichSu.value === 'ho'
  ? `${tongTinh.value} hộ`
  : `${formatCurrency(tongTinh.value)} VNĐ`)

const chuTongO = computed(() => loaiLichSu.value === 'ho'
  ? `${tongO.value} hộ`
  : `${formatCurrency(tongO.value)} VNĐ`)

// ⚠️ So với sai số 1 đồng. Backend cộng bằng NUMERIC, JavaScript cộng bằng
// số thực — chênh vài phần nghìn đồng là chuyện của kiểu số, không phải
// lệch sổ. Bắt lệch tuyệt đối là báo động giả mỗi lần mở.
const khopNhau = computed(() => Math.abs(tongTinh.value - tongO.value) < 1)

const summaryCards = computed<Array<{
  label: string; value: string; borderClass: string; textClass: string;
  loai: LoaiLichSu
}>>(() => [
  {
    label: 'Tổng đã ứng',
    loai: 'ung',   // MỤC 448
    value: `${formatCurrency(summary.value?.total_advanced || 0)} VNĐ`,
    borderClass: 'border-red-500',
    textClass: 'text-red-500'
  },
  {
    label: 'Tổng đã khấu trừ',
    loai: 'khau_tru',   // MỤC 448
    value: `${formatCurrency(summary.value?.total_deducted || 0)} VNĐ`,
    borderClass: 'border-green-500',
    textClass: 'text-green-500'
  },
  {
    label: 'Dư nợ ứng hiện tại',
    loai: 'du',   // MỤC 448
    value: `${formatCurrency(summary.value?.total_outstanding || 0)} VNĐ`,
    borderClass: 'border-orange-500',
    textClass: 'text-orange-500'
  },
  {
    label: 'Số hộ dân',
    loai: 'ho',   // MỤC 448
    value: formatCurrency(summary.value?.total_households || 0),
    borderClass: 'border-blue-500',
    textClass: 'text-blue-600 dark:text-blue-400'
  }
])

// Bộ lọc gửi lên server, dùng chung cho logs / count / summary
const buildServerFilters = () => {
  const params: any = {}
  if (dateRange.value && dateRange.value.length === 2) {
    params.start_date = dateRange.value[0]
    params.end_date = dateRange.value[1]
  }
  if (selectedCollectionPoint.value !== 'all') {
    params.collection_point_id = selectedCollectionPoint.value
  }
  return params
}

const buildLogFilters = () => {
  const params = buildServerFilters()
  if (selectedAdvanceType.value !== 'all') {
    params.advance_type = selectedAdvanceType.value
  }
  if (selectedEntryType.value !== 'all') {
    params.entry_type = selectedEntryType.value
  }
  return params
}

// Data fetching
const fetchCollectionPoints = async () => {
  try {
    collectionPoints.value = await tienNgaService.getCollectionPoints('Cao su')
  } catch (error: any) {
    console.error('Failed to fetch collection points:', error)
  }
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const filters = buildLogFilters()
    const [logs, count] = await Promise.all([
      tienNgaService.getCashAdvanceLogs({ ...filters, limit: FETCH_LIMIT, offset: 0 }),
      tienNgaService.countCashAdvanceLogs(filters)
    ])
    allData.value = logs || []
    serverTotal.value = count?.total ?? allData.value.length
  } catch (error: any) {
    allData.value = []
    serverTotal.value = 0
    ElMessage.error(error.message || 'Không thể tải nhật ký ứng tiền')
  } finally {
    loading.value = false
  }
}

const fetchSummary = async () => {
  summaryLoading.value = true
  try {
    summary.value = await tienNgaService.getCashAdvanceSummary(buildServerFilters())
  } catch (error: any) {
    summary.value = null
    console.error('Failed to fetch cash advance summary:', error)
  } finally {
    summaryLoading.value = false
  }
}

const refreshAll = async () => {
  await Promise.all([fetchLogs(), fetchSummary()])
}

// Client-side filtering / sorting / pagination
const filteredData = computed(() => {
  const keyword = debouncedSearch.value.trim().toLowerCase()
  if (!keyword) return allData.value
  return allData.value.filter(item => {
    return [item.fullname, item.hoursehold_id, item.note, item.created_by, item.approved_by]
      .some(field => field && String(field).toLowerCase().includes(keyword))
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
  return sortedData.value.slice(start, start + pageSize.value)
})

// Row actions
const deleteLog = async (row: any) => {
  const amountText = `${formatCurrency(row.amount || 0)} VNĐ`
  const revertText = row.entry_type === 'ADVANCE'
    ? `giảm ${amountText} khỏi dư nợ ứng`
    : `cộng lại ${amountText} vào dư nợ ứng`

  try {
    await ElMessageBox.confirm(
      `Xóa giao dịch ${entryTypeLabel(row.entry_type).toLowerCase()} ${amountText} ` +
      `(${advanceTypeLabel(row.advance_type).toLowerCase()}) của hộ "${row.fullname || row.hoursehold_id}"? ` +
      `Số dư của hộ dân sẽ được hoàn tác: ${revertText}.`,
      'Cảnh báo',
      {
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy',
        type: 'warning',
      }
    )
  } catch {
    return // người dùng bấm Hủy
  }

  loading.value = true
  try {
    const result = await tienNgaService.deleteCashAdvanceLogs([row.id])

    // Backend xử lý từng id độc lập: id không hoàn tác được nằm trong `skipped` kèm lý do.
    if (result.skipped?.length) {
      ElMessage.error(result.skipped[0].reason || 'Không thể xóa giao dịch ứng tiền')
      return
    }

    ElNotification({
      title: 'Thành công',
      message: 'Đã xóa giao dịch ứng tiền và hoàn tác số dư của hộ dân!',
      type: 'success',
    })
    await refreshAll()
  } catch (error: any) {
    ElMessage.error(error.message || 'Không thể xóa giao dịch ứng tiền')
  } finally {
    loading.value = false
  }
}

const handleCommand = (command: string, row: any) => {
  if (command === 'detail') {
    detailData.value = row
    detailDialogVisible.value = true
  } else if (command === 'delete') {
    deleteLog(row)
  }
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// Export Excel — xuất toàn bộ dữ liệu sau khi lọc, không chỉ trang hiện tại
const exportExcel = () => {
  if (filteredData.value.length === 0) {
    ElMessage.warning('Không có dữ liệu để xuất')
    return
  }

  try {
    const headers = [
      'STT', 'Thời gian', 'Mã hộ', 'Tên hộ dân', 'Điểm thu mua', 'Loại giao dịch',
      'Loại ứng tiền', 'Số tiền', 'Dư trước', 'Dư sau', 'Trừ công nợ', 'Công nợ trước',
      'Công nợ sau', 'Vượt hạn mức', 'Người duyệt', 'Người thực hiện', 'Ghi chú'
    ]
    const colWidths = [6, 18, 14, 24, 20, 14, 20, 16, 16, 16, 14, 18, 18, 14, 18, 18, 30]

    const rows = sortedData.value.map((r, i) => [
      i + 1,
      formatDateTime(r.created_at),
      r.hoursehold_id || '',
      r.fullname || '',
      r.collection_name || '',
      entryTypeLabel(r.entry_type),
      advanceTypeLabel(r.advance_type),
      r.amount || 0,
      r.balance_before || 0,
      r.balance_after || 0,
      r.debt_applied ? 'Có' : 'Không',
      // Để trống thay vì 0 khi dòng log có trước lúc bổ sung 3 cột công nợ.
      r.debt_before ?? '',
      r.debt_after ?? '',
      r.is_over_limit ? 'Có' : '',
      r.approved_by || '',
      r.created_by || '',
      r.note || ''
    ])

    // Dòng tổng: chỉ cộng số tiền, số dư là snapshot nên không cộng
    const totalAdvanced = sortedData.value
      .filter(r => r.entry_type === 'ADVANCE')
      .reduce((sum, r) => sum + (r.amount || 0), 0)
    const totalDeducted = sortedData.value
      .filter(r => r.entry_type === 'DEDUCT')
      .reduce((sum, r) => sum + (r.amount || 0), 0)

    const wsData: any[][] = [headers, ...rows]
    const totalRow = new Array(headers.length).fill('')
    totalRow[0] = 'TỔNG CỘNG'
    totalRow[5] = `Chi: ${formatCurrency(totalAdvanced)}`
    totalRow[6] = `Thu: ${formatCurrency(totalDeducted)}`
    totalRow[7] = totalAdvanced - totalDeducted
    wsData.push(totalRow)

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    ws['!cols'] = colWidths.map(w => ({ wch: w }))

    const headerStyle: any = {
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
    const cellBorder: any = {
      top: { style: 'thin', color: { rgb: 'D6DCE4' } },
      bottom: { style: 'thin', color: { rgb: 'D6DCE4' } },
      left: { style: 'thin', color: { rgb: 'D6DCE4' } },
      right: { style: 'thin', color: { rgb: 'D6DCE4' } }
    }
    const altFill: any = { fgColor: { rgb: 'D9E2F3' } }
    const totalStyle: any = {
      font: { bold: true, sz: 11 },
      fill: { fgColor: { rgb: 'FFE699' } },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      },
      alignment: { vertical: 'center' }
    }
    const numFmtVN = '#,##0'
    // Cột chỉ số (0-based) chứa tiền: Số tiền, Dư trước, Dư sau, Công nợ trước, Công nợ sau
    const moneyCols = [7, 8, 9, 11, 12]
    // Cột căn giữa: STT, Loại giao dịch, Loại ứng tiền, Trừ công nợ, Vượt hạn mức
    const centerCols = [0, 5, 6, 10, 13]

    for (let c = 0; c < headers.length; c++) {
      const ref = XLSX.utils.encode_cell({ r: 0, c })
      if (ws[ref]) ws[ref].s = headerStyle
    }

    for (let i = 0; i < rows.length; i++) {
      const rowIdx = i + 1
      const rowFill = i % 2 === 0 ? altFill : null
      for (let c = 0; c < headers.length; c++) {
        const ref = XLSX.utils.encode_cell({ r: rowIdx, c })
        if (!ws[ref]) ws[ref] = { v: '', t: 's' }
        const style: any = { border: cellBorder, alignment: { vertical: 'center' } }
        if (rowFill) style.fill = rowFill
        if (moneyCols.includes(c)) {
          style.alignment = { horizontal: 'right', vertical: 'center' }
          ws[ref].z = numFmtVN
        } else if (centerCols.includes(c)) {
          style.alignment = { horizontal: 'center', vertical: 'center' }
        } else {
          style.alignment = { horizontal: 'left', vertical: 'center' }
        }
        ws[ref].s = style
      }
    }

    const totalRowIdx = rows.length + 1
    for (let c = 0; c < headers.length; c++) {
      const ref = XLSX.utils.encode_cell({ r: totalRowIdx, c })
      if (!ws[ref]) ws[ref] = { v: '', t: 's' }
      const style: any = { ...totalStyle }
      if (moneyCols.includes(c)) {
        style.alignment = { horizontal: 'right', vertical: 'center' }
        ws[ref].z = numFmtVN
      } else {
        style.alignment = { horizontal: 'center', vertical: 'center' }
      }
      ws[ref].s = style
    }

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Nhat ky ung tien')

    const today = new Date()
    const dateStr = `${today.getFullYear()}_${String(today.getMonth() + 1).padStart(2, '0')}_${String(today.getDate()).padStart(2, '0')}`
    const fileName = `nhat_ky_ung_tien_${dateStr}.xlsx`

    XLSX.writeFile(wb, fileName)

    ElNotification({
      title: 'Xuất báo cáo thành công',
      message: `Đã xuất ${rows.length} bản ghi — ${fileName}`,
      type: 'success'
    })
  } catch (error: any) {
    console.error('Export cash advance logs error:', error)
    ElMessage.error(error.message || 'Không thể xuất nhật ký ứng tiền')
  }
}

// Lifecycle and Watchers
onMounted(() => {
  fetchCollectionPoints()
  refreshAll()
})

watch([dateRange, selectedCollectionPoint], () => {
  currentPage.value = 1
  refreshAll()
})

watch([selectedAdvanceType, selectedEntryType], () => {
  currentPage.value = 1
  fetchLogs()
})

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, (val) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedSearch.value = val
    currentPage.value = 1
  }, 300)
})

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
})
</script>

<style scoped>
.cash-advance-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

/* Pagination wrap */
.cash-advance-container :deep(.el-pagination) {
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

/* Dark Mode Table Customizations */
html.dark .cash-advance-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827; /* bg-gray-900 */
  --el-table-row-hover-bg-color: #374151; /* bg-gray-700 */
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .cash-advance-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .cash-advance-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

/* Fixed column bg in dark mode */
html.dark .cash-advance-container :deep(.el-table .el-table-fixed-column--left),
html.dark .cash-advance-container :deep(.el-table .el-table-fixed-column--right) {
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
