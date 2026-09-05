<template>
  <div class="credit-container h-full flex flex-col">
    <!-- Filter Bar -->
    <div class="flex justify-between items-center mb-4 shrink-0">
      <div class="flex items-center gap-4">
        <!-- Classification Filter -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Phân loại:</span>
          <el-select
            v-model="selectedClassification"
            placeholder="Tất cả"
            clearable
            style="width: 140px"
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Tất cả" value="" />
            <el-option
              v-for="item in classifications"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </div>

        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
          <el-input
            v-model="searchQuery"
            placeholder="Tìm mã KH, tên khách hàng, tên nhóm..."
            :prefix-icon="Search"
            clearable
            class="w-64 custom-dark-input"
          />
        </div>
      </div>
      <div class="flex items-center gap-2">
        <el-button :icon="Refresh" circle @click="fetchCustomers" :loading="loading" />
        <el-button type="primary" @click="openAddDialog">Thêm khách hàng</el-button>
      </div>
    </div>

    <!-- Table Container -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
      <!-- ══════════════════════════════════════════════════════════════
           MỤC 398 (29/08/2026) — BỎ CỘT GHIM, BẢNG CHỈ HIỆN TỪ 768px

           Cột ghim `fixed` chiếm chỗ CỐ ĐỊNH và không co theo màn hình.
           Trên màn 390px, mấy cột ghim cộng lại đã hết chỗ, nên vùng
           cuộn còn lại bằng 0 và vuốt ngang không có tác dụng — người
           dùng vuốt mà màn hình không nhúc nhích.

           Đã bỏ 0 cột ghim ở bảng này.
           ══════════════════════════════════════════════════════════ -->
      <el-table v-if="hienBang" v-loading="loading" :data="paginatedData" style="width: 100%" class="flex-1" height="100%" @sort-change="handleSortChange">
        <el-table-column label="STT" width="52" align="center">
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <!-- ══════════════════════════════════════════════════════════
             MỤC 420 (30/08/2026) — BẤM MÃ KH XEM HỢP ĐỒNG CỦA KHÁCH ĐÓ

             s68: *"bấm vào mã Khách hàng thì hiện ra danh sách tất cả mã
             HĐ liên quan đến mã khách hàng."*

             ⚠️ Dùng thẻ `<button>`, KHÔNG dùng `<span @click>`. Thẻ button
             mới có tiêu điểm bàn phím và mới được trình đọc màn hình gọi
             là nút — `span` chỉ là chữ có gắn sự kiện.
             ══════════════════════════════════════════════════════════ -->
        <el-table-column prop="customer_id" label="Mã KH" width="94" sortable="custom">
          <template #default="{ row }">
            <button type="button"
                    class="font-mono font-bold text-blue-600 dark:text-blue-400 underline decoration-dotted underline-offset-2 hover:text-blue-800 dark:hover:text-blue-300"
                    :title="`Xem hợp đồng của ${row.customer_id}`"
                    @click.stop="moHopDongCuaKhach(row)">
              {{ row.customer_id }}
            </button>
          </template>
        </el-table-column>
        <el-table-column prop="customer_name" label="Tên khách hàng" width="144" sortable="custom" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.customer_name }}</span>
          </template>
        </el-table-column>
        <!-- ══════════════════════════════════════════════════════════
             MỤC 420 — TÊN NHÓM KHÔNG CÒN BỊ CẮT

             s68: *"mục tên nhóm xử lý không bị … luôn."* Ảnh chụp cho thấy
             `KCredit - K…` — cụt đúng chỗ cần đọc.

             🔴 `width="115"` là bề rộng CỐ ĐỊNH. Tên thật dạng
             "KCredit - KK03", "PQCredit - AMBH" cần ~150px. Cộng với
             `show-overflow-tooltip` (cắt rồi hiện khi rê chuột) thì trên
             iPad không rê chuột được — nghĩa là không đọc được.

             ➜ Đổi sang `min-width` (co giãn được) + cho XUỐNG DÒNG, bỏ
             `show-overflow-tooltip`. Không cắt thì không cần mẹo hiện lại.
             ══════════════════════════════════════════════════════════ -->
        <el-table-column prop="group_name" label="Tên nhóm" min-width="150">
          <template #default="{ row }">
            <span class="text-gray-600 dark:text-gray-400 font-medium break-words leading-snug">
              {{ row.group_name || '—' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="contact_info" label="Liên hệ (Telegram)" min-width="158" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono text-violet-600 dark:text-violet-400">{{ row.contact_info || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="classification" label="Phân loại" width="94" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.classification" size="small" type="info" effect="plain" class="font-bold">
              {{ row.classification }}
            </el-tag>
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_credit_limit" label="Hạn mức tín dụng" width="115" align="right">
          <template #default="{ row }">
            <span class="font-semibold" :class="mauSo(row.total_credit_limit)">{{ formatCurrency(row.total_credit_limit) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="remaining_credit_limit" label="Hạn mức còn lại" width="115" align="right">
          <template #default="{ row }">
            <span class="font-bold" :class="mauSo(row.remaining_credit_limit)">{{ formatCurrency(row.remaining_credit_limit) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_principal_outstanding" label="Tổng dư nợ gốc" width="115" align="right">
          <template #default="{ row }">
            <span :class="row.total_principal_outstanding > 0 ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-gray-400'">
              {{ formatCurrency(row.total_principal_outstanding) }}
            </span>
          </template>
        </el-table-column>

        <!-- Actions -->
        <el-table-column label="Thao tác" width="60" align="center">
          <template #default="{ row }">
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
          </template>
        </el-table-column>
      </el-table>

<!-- ══════════════════════════════════════════════════════════════
           MỤC 398 (29/08/2026) — THẺ DỌC CHO MÀN HẸP

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
        <div v-if="paginatedData.length > 0" class="grid grid-cols-1 gap-4">
          <div
            v-for="(row, i) in (paginatedData as any[])"
            :key="row.id || row.contract_id || i"
            class="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
              <!-- ══════════════════════════════════════════════════════
                   MỤC 424 (31/08/2026) — THẺ CŨNG BẤM ĐƯỢC NHƯ BẢNG

                   s68: *"Dạng thẻ thì bấm không được? Dạng list thì bấm
                   đã đúng."*

                   🔴 VÌ SAO SÓT: khối thẻ này sinh ra ở MỤC 398 (29/08).
                   Nút bấm mã KH thêm vào cột của BẢNG ở MỤC 420 (30/08) —
                   sau đó một ngày. Không ai sinh lại thẻ, nên thẻ giữ
                   nguyên `<span>` chữ trơn.

                   Chữ vẫn xanh đậm y như bảng, nên nhìn thì tưởng bấm
                   được. Đó là kiểu hỏng tệ nhất: trông như còn dùng được.

                   ⚠️ Đây là NGUYÊN VĂN nội dung cột "Mã KH" của bảng ở
                   dòng 74–79. Sửa một chỗ thì phải sửa cả hai.
                   ══════════════════════════════════════════════════ -->
              <div class="min-w-0 break-words">
                <button type="button"
                        class="font-mono font-bold text-blue-600 dark:text-blue-400 underline decoration-dotted underline-offset-2 hover:text-blue-800 dark:hover:text-blue-300"
                        :title="`Xem hợp đồng của ${row.customer_id}`"
                        @click.stop="moHopDongCuaKhach(row)">
                  {{ row.customer_id }}
                </button>
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
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tên khách hàng:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.customer_name }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tên nhóm:</span>
                <span class="text-right break-words min-w-0">
                  <span class="text-gray-600 dark:text-gray-400 font-medium">{{ row.group_name || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Liên hệ (Telegram):</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-mono text-violet-600 dark:text-violet-400">{{ row.contact_info || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Phân loại:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag v-if="row.classification" size="small" type="info" effect="plain" class="font-bold">
                                {{ row.classification }}
                              </el-tag>
                              <span v-else class="text-gray-400">—</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Hạn mức tín dụng:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-semibold" :class="mauSo(row.total_credit_limit)">{{ formatCurrency(row.total_credit_limit) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Hạn mức còn lại:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-bold" :class="mauSo(row.remaining_credit_limit)">{{ formatCurrency(row.remaining_credit_limit) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tổng dư nợ gốc:</span>
                <span class="text-right break-words min-w-0">
                  <span :class="row.total_principal_outstanding > 0 ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-gray-400'">
                                {{ formatCurrency(row.total_principal_outstanding) }}
                              </span>
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
      <div class="mt-auto shrink-0 p-4 flex justify-end border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredCustomers.length"
        />
      </div>
    </div>

    <!-- Add/Edit Customer Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'CHỈNH SỬA THÔNG TIN KHÁCH HÀNG' : 'THÊM KHÁCH HÀNG MỚI'"
      width="900px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="170px" class="mt-2 compact-form">

          <!-- PHẦN 1: THÔNG TIN CHUNG -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin chung
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã Khách hàng" prop="customer_id">
                  <el-input v-model="form.customer_id" placeholder="VD: KH-CR-001..." :disabled="isEdit" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tên khách hàng" prop="customer_name">
                  <el-input v-model="form.customer_name" placeholder="Nhập tên khách hàng..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tên Nhóm" prop="group_name">
                  <el-input v-model="form.group_name" placeholder="Nhập tên nhóm..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Liên hệ (Telegram)" prop="contact_info">
                  <el-input v-model="form.contact_info" placeholder="VD: @telegram_username..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Phân loại" prop="classification">
                  <el-select
                    v-model="form.classification"
                    placeholder="Chọn hoặc nhập phân loại..."
                    :filterable="choLocDuoc"
                    allow-create
                    default-first-option
                    clearable
                    class="w-full text-left"
                  >
                    <el-option
                      v-for="item in classifications"
                      :key="item"
                      :label="item"
                      :value="item"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: THÔNG TIN TÍN DỤNG -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Hạn mức &amp; Dư nợ tín dụng
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Hạn mức tín dụng (VNĐ)">
                  <el-input v-model="form.total_credit_limit_text" placeholder="Nhập hạn mức tín dụng..." @input="(v) => handlePriceInput(v, 'total_credit_limit')">
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Hạn mức còn lại (VNĐ)">
                  <el-input v-model="form.remaining_credit_limit_text" placeholder="Nhập hạn mức còn lại..." @input="(v) => handlePriceInput(v, 'remaining_credit_limit')">
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tổng dư nợ gốc (VNĐ)">
                  <el-input v-model="form.total_principal_outstanding_text" placeholder="Nhập tổng dư nợ gốc..." @input="(v) => handlePriceInput(v, 'total_principal_outstanding')">
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
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
          <el-button type="primary" @click="submitForm">Xác nhận</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Customer Details Dialog -->
    <el-dialog 
      v-model="detailDialogVisible" 
      title="CHI TIẾT THÔNG TIN KHÁCH HÀNG" 
      width="750px" 
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedCustomer" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto overflow-x-hidden text-left">
        <!-- Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-blue-500 dark:bg-blue-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32">
              <User />
            </el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-left">Khách hàng tín dụng</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5 text-left">
              {{ selectedCustomer.customer_name }}
              <span class="text-gray-400 dark:text-gray-500 font-medium">({{ selectedCustomer.customer_id }})</span>
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span v-if="selectedCustomer.contact_info" class="flex items-center gap-1">
                <el-icon><Message /></el-icon>
                {{ selectedCustomer.contact_info }}
              </span>
              <span v-if="selectedCustomer.contact_info && selectedCustomer.group_name" class="text-gray-300 dark:text-gray-600">|</span>
              <span v-if="selectedCustomer.group_name" class="flex items-center gap-1">
                <el-icon><Location /></el-icon>
                Nhóm: {{ selectedCustomer.group_name }}
              </span>
            </div>
          </div>
        </div>

        <!-- 1. THÔNG TIN KHÁCH HÀNG -->
        <div>
          <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            Thông tin chung
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã Khách hàng</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedCustomer.customer_id }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tên khách hàng</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedCustomer.customer_name }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tên Nhóm</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedCustomer.group_name || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Liên hệ Telegram</div>
              <div class="text-sm font-mono text-violet-650 dark:text-violet-400">{{ selectedCustomer.contact_info || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Phân loại</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-250">
                <el-tag v-if="selectedCustomer.classification" size="small" type="info" effect="plain" class="font-bold">
                  {{ selectedCustomer.classification }}
                </el-tag>
                <span v-else class="text-gray-400">—</span>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 2. HẠN MỨC & DƯ NỢ -->
        <div>
          <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
            Hạn mức & Dư nợ tín dụng
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Hạn mức tín dụng</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ formatCurrency(selectedCustomer.total_credit_limit) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Hạn mức còn lại</div>
              <div class="text-sm font-extrabold text-emerald-650 dark:text-emerald-400">{{ formatCurrency(selectedCustomer.remaining_credit_limit) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tổng dư nợ gốc</div>
              <div class="text-sm font-extrabold" :class="selectedCustomer.total_principal_outstanding > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500'">
                {{ formatCurrency(selectedCustomer.total_principal_outstanding) }}
              </div>
            </div>
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

    <!-- ══════════════════════════════════════════════════════════════
         MỤC 420 (30/08/2026) — DANH SÁCH HỢP ĐỒNG CỦA MỘT KHÁCH HÀNG
         ══════════════════════════════════════════════════════════ -->
    <el-dialog v-model="hienHopDong" width="760px" destroy-on-close align-center
               class="custom-dark-dialog">
      <template #header>
        <span class="font-bold">
          HỢP ĐỒNG CỦA
          <span class="font-mono text-blue-600 dark:text-blue-400">
            {{ khachDangXem?.customer_id }}
          </span>
          <span v-if="khachDangXem?.customer_name" class="font-normal">
            — {{ khachDangXem.customer_name }}
          </span>
        </span>
      </template>

      <div v-loading="dangTaiHopDong" class="min-h-[120px]">
        <!-- 🔴 Không có hợp đồng thì NÓI THẲNG. Hộp trống làm người xem
             tưởng màn hỏng, và họ sẽ bấm lại mãi. -->
        <p v-if="!dangTaiHopDong && hopDongCuaKhach.length === 0"
           class="py-8 text-center text-gray-500 dark:text-gray-400">
          Khách hàng này chưa có hợp đồng nào.
        </p>

        <div v-else class="max-h-[60vh] overflow-y-auto">
          <div v-for="hd in hopDongCuaKhach" :key="hd.id || hd.contract_id"
               class="rounded-xl border border-gray-200 dark:border-gray-700 p-3 mb-2">
            <div class="flex items-start justify-between gap-3 mb-2">
              <span class="font-mono font-bold text-gray-800 dark:text-gray-100 break-all">
                {{ hd.contract_id || '—' }}
              </span>
              <!-- MỤC 425 — trước đây in thẳng `bad_debt`, `paid`. s68 đã
                   chốt 28/08 là trạng thái phải hiện bằng tiếng Việt. -->
              <el-tag v-if="hd.credit_status" size="small" effect="plain" class="shrink-0">
                {{ chuTrangThai(hd.credit_status) }}
              </el-tag>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div class="flex justify-between gap-2">
                <span class="text-gray-400 dark:text-gray-500">Loại vay</span>
                <span class="text-right">{{ hd.loan_type || '—' }}</span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-gray-400 dark:text-gray-500">Lãi / tháng</span>
                <span class="text-right">{{ hd.monthly_interest_rate ?? '—' }}%</span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-gray-400 dark:text-gray-500">Gốc ban đầu</span>
                <span class="text-right tabular-nums">{{ tienGon(hd.initial_principal) }}</span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-gray-400 dark:text-gray-500">Gốc còn lại</span>
                <span class="text-right tabular-nums font-semibold">
                  {{ tienGon(hd.remaining_principal) }}
                </span>
              </div>
              <!-- MỤC 425 (31/08/2026) — THÁNG ĐÓNG LÃI GẦN NHẤT -->
              <div class="flex justify-between gap-2">
                <span class="text-gray-400 dark:text-gray-500">Đóng lãi gần nhất</span>
                <span class="text-right"
                      :class="hd.credit_status === 'paid'
                                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                : ''">
                  {{ thangDongLai(hd) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="text-sm text-gray-500 dark:text-gray-400 mr-auto">
          Tổng: <b>{{ hopDongCuaKhach.length }}</b> hợp đồng
        </span>
        <el-button @click="hienHopDong = false">Đóng</el-button>
      </template>
    </el-dialog>
</template>

<script setup lang="ts">

// ══════════════════════════════════════════════════════════════════
// MỤC 527 (05/09/2026) — MÀN NÀY CHẠY TRONG MỘT LUỒNG
//
// s68 05/09: *"bấm ô 1 vào luồng PQCredit, ô 2 vào luồng KCredit.
// Trong mỗi luồng đều có đầy đủ nội dung từng luồng."*
//
// 🔴 `luong` gửi THẲNG lên máy chủ làm bộ lọc, không lọc sau khi tải.
// Tải hết rồi giấu bớt thì mọi con số tổng vẫn tính trên cả hai luồng.
//
// ⚠️ Rỗng = không lọc. Giữ nguyên hành vi cũ cho chỗ nào dùng lại
// component này ngoài hai luồng.
// ══════════════════════════════════════════════════════════════════
const props = defineProps<{ luong?: string }>()
import { ref, reactive, computed, onMounted } from 'vue'
import { mauSo } from '@/utils/mauSo'
import { Search, MoreFilled, User, Message, Location, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { creditService } from '@/api/creditService'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'
// MỤC 417 — trên máy bảng/điện thoại KHÔNG cho gõ lọc, để iOS
// không bật bàn phím; bấm ẩn bàn phím thì droplist ở nguyên đó.
// Xem `src/composables/chonDuoc.ts`.
import { dungChonDuoc } from '@/composables/chonDuoc'

const { choLocDuoc } = dungChonDuoc()

const { laManHep, hienBang, hienThe } = dungManHep()

// ══════════════════════════════════════════════════════════════════════
// MỤC 425 (31/08/2026) — THÁNG ĐÓNG LÃI GẦN NHẤT
//
// s68: *"Đối với các HĐ còn đang nợ thì thêm thông tin Tháng đóng lãi
// gần nhất. Đối với HĐ đã tất toán thì cột này thể hiện Đã Tất Toán."*
//
// 🔴 Ba trường hợp, và trường hợp thứ ba là chỗ dễ nói sai nhất:
//   ① đã tất toán           -> "Đã tất toán"
//   ② còn nợ, đã từng đóng  -> "MM/YYYY"
//   ③ còn nợ, CHƯA đóng lần nào -> "Chưa đóng lần nào"
//
// ⚠️ Trường hợp ③ KHÔNG được in dấu gạch "—". Dấu gạch nghĩa là "không
// có dữ liệu / chưa biết", còn đây là một sự thật đã biết và là thông
// tin cần chú ý nhất trong ba cái.
//
// Số liệu lấy từ khoá `last_interest_paid_date` do backend thêm ở cùng
// MỤC (`app/crud/credit.py` hàm `get_credits_detailed`). KHÔNG phải
// `last_interest_charged_date` — cột đó là ngày bot TÍNH lãi.
// ══════════════════════════════════════════════════════════════════════
const thangDongLai = (hd: any) => {
  if (hd?.credit_status === 'paid') return 'Đã tất toán'
  const ngay = hd?.last_interest_paid_date
  if (!ngay) return 'Chưa đóng lần nào'
  const phan = String(ngay).split('-')
  if (phan.length < 2) return String(ngay)
  return `${phan[1]}/${phan[0]}`
}

// MỤC 425 — trạng thái bằng tiếng Việt. Giữ cùng bộ chữ với
// `ContractList.vue` hàm `getStatusText` (dòng 1126) để hai màn không
// gọi cùng một trạng thái bằng hai cái tên.
const chuTrangThai = (tt: string) => {
  if (tt === 'active') return 'Đang vay'
  if (tt === 'paid') return 'Đã tất toán'
  if (tt === 'cancelled') return 'Đã hủy'
  if (tt === 'bad_debt') return 'Nợ xấu'
  return 'Chưa rõ'
}

interface Customer {
  id: string
  customer_id: string
  group_name: string
  customer_name: string
  contact_info: string
  total_credit_limit: number
  remaining_credit_limit: number
  total_principal_outstanding: number
  classification?: string
}

const loading = ref(false)
const searchQuery = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

const customers = ref<Customer[]>([])
const classifications = ref<string[]>([])
const selectedClassification = ref('')

const fetchClassifications = async () => {
  try {
    const data = await creditService.getClassifications()
    classifications.value = data
  } catch (error) {
    console.error('Failed to fetch classifications:', error)
  }
}

const filteredCustomers = computed(() => {
  return customers.value.filter(c => {
    const q = searchQuery.value.toLowerCase()
    const matchesSearch = !q ||
      c.customer_name.toLowerCase().includes(q) ||
      c.customer_id.toLowerCase().includes(q) ||
      (c.group_name && c.group_name.toLowerCase().includes(q)) ||
      (c.contact_info && c.contact_info.toLowerCase().includes(q))

    const matchesClassification = !selectedClassification.value ||
      c.classification === selectedClassification.value

    return matchesSearch && matchesClassification
  })
})

const sortProp = ref('')
const sortOrder = ref('')

const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  sortProp.value = prop
  sortOrder.value = order
}

const sortedCustomers = computed(() => {
  const list = [...filteredCustomers.value]
  if (!sortProp.value || !sortOrder.value) return list

  return list.sort((a, b) => {
    const valA = (a as any)[sortProp.value] || ''
    const valB = (b as any)[sortProp.value] || ''

    let res = 0
    if (typeof valA === 'number' && typeof valB === 'number') {
      res = valA - valB
    } else {
      res = String(valA).localeCompare(String(valB), 'vi', { numeric: true })
    }

    return sortOrder.value === 'ascending' ? res : -res
  })
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedCustomers.value.slice(start, end)
})

// Add/Edit Dialog State
const dialogVisible = ref(false)

// ══════════════════════════════════════════════════════════════════════
// MỤC 420 (30/08/2026) — XEM HỢP ĐỒNG CỦA MỘT KHÁCH HÀNG
//
// ⚠️ Gọi máy chủ MỖI LẦN bấm, không nhớ lại kết quả cũ. Hợp đồng đổi
// thường xuyên (thêm mới, tất toán); hiện lại danh sách cũ là nói sai.
//
// 🔴 Lọc bằng `customer_id` — đây là MÃ khách hàng (chuỗi, ví dụ `KK03`),
// KHÔNG phải `row.id` (UUID của bản ghi). Hai thứ này khác nhau và cùng
// tên biến; nhầm là danh sách trống mà không hiểu vì sao.
const hienHopDong = ref(false)
const dangTaiHopDong = ref(false)
const khachDangXem = ref<any>(null)
const hopDongCuaKhach = ref<any[]>([])

const moHopDongCuaKhach = async (row: any) => {
  khachDangXem.value = row
  hopDongCuaKhach.value = []
  hienHopDong.value = true
  dangTaiHopDong.value = true
  try {
    hopDongCuaKhach.value =
      await creditService.getCredits({ customer_id: row.customer_id, classification: props.luong })
  } catch (e: any) {
    // Hỏng thì NÓI RA trong chính hộp thoại, không nuốt — người dùng đang
    // chờ xem một danh sách, hộp trống mà im lặng là hiểu nhầm "không có
    // hợp đồng nào".
    ElMessage.error(e?.message || 'Không đọc được danh sách hợp đồng.')
    hienHopDong.value = false
  } finally {
    dangTaiHopDong.value = false
  }
}

const tienGon = (v: any) => {
  const n = Number(v || 0)
  return isNaN(n) ? '—' : n.toLocaleString('vi-VN') + ' VNĐ'
}
const isEdit = ref(false)
const formRef = ref<any>(null)

// Detail Dialog State
const detailDialogVisible = ref(false)
const selectedCustomer = ref<Customer | null>(null)

const openDetailDialog = (row: Customer) => {
  selectedCustomer.value = row
  detailDialogVisible.value = true
}

const form = reactive({
  id: '',
  customer_id: '',
  group_name: '',
  customer_name: '',
  contact_info: '',
  total_credit_limit: 0,
  total_credit_limit_text: '',
  remaining_credit_limit: 0,
  remaining_credit_limit_text: '',
  total_principal_outstanding: 0,
  total_principal_outstanding_text: '',
  classification: ''
})

const rules = reactive({
  customer_id: [{ required: true, message: 'Vui lòng nhập mã khách hàng', trigger: 'blur' }],
  customer_name: [{ required: true, message: 'Vui lòng nhập tên khách hàng', trigger: 'blur' }]
})

const handlePriceInput = (val: string, field: string) => {
  const numericVal = val.replace(/[^0-9]/g, '')
  const num = parseInt(numericVal, 10)
  const formAny = form as any
  if (!isNaN(num)) {
    formAny[field] = num
    formAny[`${field}_text`] = new Intl.NumberFormat('vi-VN').format(num)
  } else {
    formAny[field] = 0
    formAny[`${field}_text`] = ''
  }
}

const handleCommand = (cmd: string, row: Customer) => {
  if (cmd === 'detail') {
    openDetailDialog(row)
  } else if (cmd === 'edit') {
    openEditDialog(row)
  } else if (cmd === 'delete') {
    handleDelete(row)
  }
}

const openAddDialog = () => {
  isEdit.value = false
  form.id = ''
  form.customer_id = ''
  form.group_name = ''
  form.customer_name = ''
  form.contact_info = ''
  form.classification = ''
  
  const fields = ['total_credit_limit', 'remaining_credit_limit', 'total_principal_outstanding']
  const formAny = form as any
  fields.forEach(f => {
    formAny[f] = 0
    formAny[`${f}_text`] = ''
  })
  
  dialogVisible.value = true
}

const openEditDialog = (row: Customer) => {
  isEdit.value = true
  form.id = row.id
  form.customer_id = row.customer_id
  form.group_name = row.group_name
  form.customer_name = row.customer_name
  form.contact_info = row.contact_info
  form.classification = row.classification || ''
  
  const fields = ['total_credit_limit', 'remaining_credit_limit', 'total_principal_outstanding']
  const formAny = form as any
  fields.forEach(f => {
    const val = (row as any)[f] || 0
    formAny[f] = val
    formAny[`${f}_text`] = val ? new Intl.NumberFormat('vi-VN').format(val) : ''
  })
  
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      const payload = {
        customer_id: form.customer_id,
        group_name: form.group_name,
        customer_name: form.customer_name,
        contact_info: form.contact_info,
        total_credit_limit: Number(form.total_credit_limit) || 0,
        remaining_credit_limit: Number(form.remaining_credit_limit) || 0,
        total_principal_outstanding: Number(form.total_principal_outstanding) || 0,
        classification: form.classification || null
      }

      if (isEdit.value) {
        loading.value = true
        try {
          const editPayload = { ...payload, id: form.id }
          const updatedCustomers = await creditService.updateCreditCustomers([editPayload])
          if (updatedCustomers && updatedCustomers.length > 0) {
            const index = customers.value.findIndex(c => c.id === form.id)
            if (index !== -1) {
              customers.value[index] = updatedCustomers[0]
            }
            ElMessage.success('Cập nhật khách hàng thành công!')
            dialogVisible.value = false
            await fetchClassifications()
          } else {
            ElMessage.error('Không nhận được phản hồi từ server')
          }
        } catch (error: any) {
          ElMessage.error(error.message || 'Lỗi khi cập nhật khách hàng')
        } finally {
          loading.value = false
        }
      } else {
        loading.value = true
        try {
          const addedCustomers = await creditService.addCreditCustomers([payload])
          if (addedCustomers && addedCustomers.length > 0) {
            customers.value.push(addedCustomers[0])
            ElMessage.success('Thêm mới khách hàng thành công!')
            dialogVisible.value = false
            await fetchClassifications()
          } else {
            ElMessage.error('Không nhận được phản hồi từ server')
          }
        } catch (error: any) {
          ElMessage.error(error.message || 'Lỗi khi thêm mới khách hàng')
        } finally {
          loading.value = false
        }
      }
    }
  })
}

const handleDelete = async (row: Customer) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa khách hàng "${row.customer_name}"? Hành động này không thể hoàn tác.`,
      'Xác nhận xóa khách hàng',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy bỏ',
        type: 'warning'
      }
    )
    loading.value = true
    try {
      await creditService.deleteCreditCustomers([row.id])
      customers.value = customers.value.filter(c => c.id !== row.id)
      ElMessage.success('Xóa khách hàng thành công!')
    } catch (error: any) {
      ElMessage.error(error.message || 'Lỗi khi xóa khách hàng')
    } finally {
      loading.value = false
    }
  } catch (err) {
    // cancelled
  }
}

const fetchCustomers = async () => {
  loading.value = true
  try {
    const data = await creditService.getCreditCustomers({ classification: props.luong })
    customers.value = data
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi tải danh sách khách hàng')
  } finally {
    loading.value = false
  }
}

// Helpers
const formatCurrency = (val: number) => {
  if (!val) return '0 VNĐ'
  return new Intl.NumberFormat('vi-VN').format(val) + ' VNĐ'
}

onMounted(() => {
  fetchCustomers()
  fetchClassifications()
})
</script>

<style scoped>
.credit-container {
  height: 100%;
}

.credit-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

html.dark .credit-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}
html.dark .credit-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}
html.dark .credit-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}
html.dark .credit-container :deep(.el-table .el-table-fixed-column--left),
html.dark .credit-container :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important;
}

html.dark .custom-dark-input :deep(.el-input__wrapper) {
  background-color: #111827 !important;
  box-shadow: 0 0 0 1px #4b5563 inset !important;
}
html.dark .custom-dark-input :deep(.el-input__inner) {
  color: #f3f4f6;
}
</style>
