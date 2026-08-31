<template>
  <div class="credit-container h-full flex flex-col">
    <!-- Filter Bar -->
    <div class="flex justify-between items-center mb-4 shrink-0 flex-wrap gap-y-4">
      <div class="flex items-center gap-4 flex-wrap">
        <!-- Loan Type Filter -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Loại vay:</span>
          <el-select
            v-model="filterLoanType"
            placeholder="Tất cả"
            style="width: 130px"
            clearable
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Thế chấp" value="Collateral" />
            <el-option label="Tín chấp" value="Unsecured" />
          </el-select>
        </div>

        <!-- Date range filter (default: 3 years ago to now) -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian:</span>
          <el-date-picker :editable="false"
            v-model="dateRange"
            type="daterange"
            range-separator="đến"
            start-placeholder="Từ ngày"
            end-placeholder="Đến ngày"
            value-format="YYYY-MM-DD"
            style="width: 260px"
            class="custom-dark-date-picker highlight-select"
            popper-class="custom-dark-select-popper"
          />
        </div>

        <!-- Status Filter -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái:</span>
          <el-select
            v-model="filterStatus"
            placeholder="Tất cả"
            style="width: 160px"
            clearable
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Đang vay" value="active" />
            <el-option label="Đã tất toán" value="paid" />
            <el-option label="Đã hủy" value="cancelled" />
            <el-option label="Nợ xấu" value="bad_debt" />
            <!-- MỤC 428 — trạng thái mới, xem `bot/utils/credit_nhap_sai.py` -->
            <el-option label="Nhập sai" value="nhap_sai" />
          </el-select>
        </div>

        <!-- Classification Filter -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Phân loại:</span>
          <el-select
            v-model="filterClassification"
            placeholder="Tất cả"
            style="width: 140px"
            clearable
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

        <!-- Search input -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
          <el-input
            v-model="searchQuery"
            placeholder="Tìm mã HĐ, tên KH..."
            :prefix-icon="Search"
            clearable
            class="w-56 custom-dark-input"
          />
        </div>
      </div>
      <!--
        MỤC 357 (27/08/2026) — HAI NÚT DỜI SANG PHẢI.

        s68 khoanh đỏ ảnh iPad 27/08: hai nút "Tìm kiếm" và "Thêm hợp đồng"
        nằm ở đầu dòng thứ hai, còn cả nửa phải của dòng đó bỏ trống — trong
        khi ngay trên nó ô "Trạng thái" lại chạy ra tận mép phải.

        `ml-auto` đẩy cụm nút về mép phải, thẳng cột với ô "Trạng thái" ở
        dòng trên. Khoảng trống giữa biến mất mà không phải đổi bố cục.

        ⚠️ `ml-auto` chỉ ăn khi thẻ cha là flex — ở đây đúng vậy. Trên màn
        hẹp (điện thoại) thẻ cha xuống dòng, `ml-auto` tự vô hiệu và hai nút
        vẫn nằm bên trái như cũ. Không cần thêm điểm ngắt riêng.
      -->
      <div class="flex items-center gap-2 ml-auto">
        <el-button type="success" :icon="Search" @click="fetchCredits">Tìm kiếm</el-button>
        <el-button type="primary" @click="openAddDialog">Thêm hợp đồng</el-button>
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
        <el-table-column prop="contract_id" label="Mã HĐ" min-width="130" sortable="custom">
          <template #default="{ row }">
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{{ row.contract_id }}</span>
          </template>
        </el-table-column>
        <!-- ══════════════════════════════════════════════════════════
             MỤC 418 (30/08/2026) — HIỆN MÃ KHÁCH HÀNG

             s68 nêu: *"mã HĐ khi tạo chưa liên kết đến mã KH mà liên kết
             đến tên Khách hàng. Quy hoạch lại liên kết đến mã KH."*

             🔴 ĐO LẠI THÌ LIÊN KẾT ĐÃ ĐÚNG SẴN, chỉ là màn không hiện:

               · `app/models/credit.py` dòng 50 — `Credit.customer_id` là
                 khoá ngoại UUID trỏ `credit_customers.id`. Nối bằng BẢN
                 GHI khách hàng, không phải bằng chuỗi tên.
               · Ô chọn khách lúc thêm hợp đồng đã hiện
                 `"mã KH - tên KH"` và lưu `c.id`.
               · `app/schemas/credit.py` dòng 99 đã trả sẵn
                 `customer_code`.

             Chỉ thiếu đúng một việc: BẢNG không in mã ra, nên nhìn vào
             tưởng hợp đồng gắn theo tên.

             ⚠️ KHÔNG đổi mô hình dữ liệu, KHÔNG migration. Đổi cột nối
             của bảng `credits` là việc dính tiền — mà nó vốn đã đúng.
             ══════════════════════════════════════════════════════════ -->
        <el-table-column prop="customer_code" label="Mã KH" width="104" sortable="custom" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400">
              {{ row.customer_code || '—' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="customer_name" label="Tên khách hàng" width="144" sortable="custom" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.customer_name }}</span>
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
        <el-table-column prop="loan_type" label="Loại vay" width="86" align="center">
          <template #default="{ row }">
            <el-tag :type="row.loan_type === 'Collateral' ? 'primary' : 'warning'" size="small">
              {{ row.loan_type === 'Collateral' ? 'Thế chấp' : 'Tín chấp' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="initial_principal" label="Gốc ban đầu" width="108" align="right">
          <template #default="{ row }">
            <span :class="mauSo(row.initial_principal)">{{ formatCurrency(row.initial_principal) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="remaining_principal" label="Gốc còn lại" width="130" align="right">
          <template #default="{ row }">
            <span class="font-bold" :class="mauSo(row.remaining_principal)">{{ formatCurrency(row.remaining_principal) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="monthly_interest_rate" label="Lãi suất / Tháng" width="94" align="right">
          <template #default="{ row }">
            <span>{{ row.monthly_interest_rate ? `${row.monthly_interest_rate}%` : '0%' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="interest_debt" label="Nợ lãi" width="101" align="right">
          <template #default="{ row }">
            <span :class="row.interest_debt > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-gray-400'">
              {{ formatCurrency(row.interest_debt) }}
            </span>
          </template>
        </el-table-column>
        <!-- ══════════════════════════════════════════════════════════
             MỤC 425 (31/08/2026) — THÁNG ĐÓNG LÃI GẦN NHẤT

             s68: *"Đối với các HĐ còn đang nợ thì thêm thông tin Tháng
             đóng lãi gần nhất. Đối với HĐ đã tất toán thì cột này thể
             hiện thông tin Đã Tất Toán luôn."*

             ⚠️ Không có cột `fixed` — xem `tai_lieu_ai/quy_uoc_bo_cuc_the.md`
             phần MỤC 391.
             ══════════════════════════════════════════════════════════ -->
        <el-table-column prop="last_interest_paid_date" label="Đóng lãi gần nhất" width="116" align="center">
          <template #default="{ row }">
            <span :class="row.credit_status === 'paid'
                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                            : (row.last_interest_paid_date ? '' : 'text-amber-600 dark:text-amber-400')">
              {{ thangDongLai(row) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="start_date" label="Ngày bắt đầu" width="94" align="center">
          <template #default="{ row }">
            <span>{{ formatDate(row.start_date) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="due_date" label="Ngày đáo hạn" width="94" align="center">
          <template #default="{ row }">
            <span>{{ formatDate(row.due_date) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="send_message_arise" label="SMS tự động" width="86" align="center">
          <template #default="{ row }">
            <el-tag :type="row.send_message_arise ? 'success' : 'info'" size="small">
              {{ row.send_message_arise ? 'Có' : 'Không' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="credit_status" label="Trạng thái" width="101" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.credit_status)" effect="plain" size="small" class="capitalize">
              {{ getStatusText(row.credit_status) }}
            </el-tag>
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
                  <el-dropdown-item command="schedule">Lên lịch hẹn</el-dropdown-item>
                  <!-- ⚠️ MỤC 428 — MỤC NÀY HIỆN VỚI MỌI NGƯỜI, CÓ CHỦ Ý.
                       Frontend hiện KHÔNG lưu `role` của tài khoản (chỉ lưu
                       `user_permissions`, xem `src/constants/duAn.ts` dòng
                       143), nên không biết ai là owner để ẩn đi.
                       Backend mới là cửa thật: bấm mà không phải owner thì
                       nhận đúng câu "Chỉ tài khoản owner mới đánh dấu được".
                       Ẩn ở đây dù có làm được cũng KHÔNG phải lớp bảo vệ. -->
                  <el-dropdown-item command="nhap_sai" divided class="!text-amber-600">Đánh dấu nhập sai</el-dropdown-item>
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
              <div class="min-w-0 break-words">
                <span class="font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{{ row.contract_id }}</span>
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
                                  <el-dropdown-item command="schedule">Lên lịch hẹn</el-dropdown-item>
                                  <!-- ⚠️ MỤC 428 — MỤC NÀY HIỆN VỚI MỌI NGƯỜI, CÓ CHỦ Ý.
                       Frontend hiện KHÔNG lưu `role` của tài khoản (chỉ lưu
                       `user_permissions`, xem `src/constants/duAn.ts` dòng
                       143), nên không biết ai là owner để ẩn đi.
                       Backend mới là cửa thật: bấm mà không phải owner thì
                       nhận đúng câu "Chỉ tài khoản owner mới đánh dấu được".
                       Ẩn ở đây dù có làm được cũng KHÔNG phải lớp bảo vệ. -->
                  <el-dropdown-item command="nhap_sai" divided class="!text-amber-600">Đánh dấu nhập sai</el-dropdown-item>
                  <el-dropdown-item command="delete" divided class="!text-red-500">Xóa</el-dropdown-item>
                                </el-dropdown-menu>
                              </template>
                            </el-dropdown>
              </div>
            </div>
            <div class="space-y-2 text-sm text-left">
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Mã KH:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {{ row.customer_code || '—' }}
                  </span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tên khách hàng:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.customer_name }}</span>
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
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Loại vay:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag :type="row.loan_type === 'Collateral' ? 'primary' : 'warning'" size="small">
                                {{ row.loan_type === 'Collateral' ? 'Thế chấp' : 'Tín chấp' }}
                              </el-tag>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Gốc ban đầu:</span>
                <span class="text-right break-words min-w-0">
                  <span :class="mauSo(row.initial_principal)">{{ formatCurrency(row.initial_principal) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Gốc còn lại:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-bold" :class="mauSo(row.remaining_principal)">{{ formatCurrency(row.remaining_principal) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Lãi suất / Tháng:</span>
                <span class="text-right break-words min-w-0">
                  <span>{{ row.monthly_interest_rate ? `${row.monthly_interest_rate}%` : '0%' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Nợ lãi:</span>
                <span class="text-right break-words min-w-0">
                  <span :class="row.interest_debt > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-gray-400'">
                                {{ formatCurrency(row.interest_debt) }}
                              </span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ngày bắt đầu:</span>
                <span class="text-right break-words min-w-0">
                  <span>{{ formatDate(row.start_date) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ngày đáo hạn:</span>
                <span class="text-right break-words min-w-0">
                  <span>{{ formatDate(row.due_date) }}</span>
                </span>
              </div>
              <!-- MỤC 425 — NGUYÊN VĂN nội dung cột "Đóng lãi gần nhất"
                   của bảng ở trên. Sửa một chỗ là phải sửa cả hai. -->
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Đóng lãi gần nhất:</span>
                <span class="text-right break-words min-w-0">
                  <span :class="row.credit_status === 'paid'
                                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                  : (row.last_interest_paid_date ? '' : 'text-amber-600 dark:text-amber-400')">
                    {{ thangDongLai(row) }}
                  </span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">SMS tự động:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag :type="row.send_message_arise ? 'success' : 'info'" size="small">
                                {{ row.send_message_arise ? 'Có' : 'Không' }}
                              </el-tag>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Trạng thái:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag :type="getStatusTag(row.credit_status)" effect="plain" size="small" class="capitalize">
                                {{ getStatusText(row.credit_status) }}
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
      <div class="mt-auto shrink-0 p-4 flex justify-end border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredContracts.length"
        />
      </div>
    </div>

    <!-- Add/Edit Contract Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'CHỈNH SỬA HỢP ĐỒNG TÍN DỤNG' : 'THÊM HỢP ĐỒNG TÍN DỤNG MỚI'"
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
                <!-- ══════════════════════════════════════════════════
                     MỤC 419 (30/08/2026) — NÚT + THÊM KHÁCH HÀNG TẠI CHỖ

                     s68: *"thêm dấu + là thêm khách hàng: hiện form nhập
                     vào luôn."*

                     ⚠️ Trước đây phải: thoát form hợp đồng (mất hết những
                     gì đã gõ) → sang tab Khách hàng → thêm → quay lại →
                     gõ lại từ đầu.
                     ══════════════════════════════════════════════════ -->
                <el-form-item label="Khách hàng" prop="customer_id">
                  <div class="flex items-center gap-2 w-full">
                    <!-- 🔴 MỤC 426 — KHOÁ KHI SỬA, theo s68 chốt 31/08/2026:
                         *"số tiền, mã KH, Mã HĐ thì không thay đổi khi edit
                         hợp đồng được."*

                         Trước đây ô này KHÔNG khoá — sửa được thoải mái, và
                         đổi khách hàng của một hợp đồng đang chạy thì hạn mức
                         và tổng dư nợ của CẢ HAI khách đều sai, vì
                         `update-credits` không dời tiền giữa hai khách
                         (`app/api/v1/credit.py` dòng 529–632).

                         Nhập sai thì xoá hợp đồng rồi tạo lại, không sửa đè. -->
                    <el-select v-model="form.customer_id" placeholder="Chọn khách hàng..." class="highlight-select flex-1 min-w-0" :filterable="choLocDuoc" :disabled="isEdit">
                      <el-option
                        v-for="c in customersList"
                        :key="c.id"
                        :label="`${c.customer_id} - ${c.customer_name}`"
                        :value="c.id"
                      />
                    </el-select>
                    <!-- MỤC 426 — ẩn khi đang sửa. Ô chọn khách đã khoá thì
                         nút thêm khách bên cạnh không dẫn tới đâu; để lại là
                         một nút bấm không làm gì. -->
                    <el-button v-if="!isEdit" type="primary" :icon="Plus" class="shrink-0"
                               title="Thêm khách hàng mới"
                               @click="moThemKhachNhanh" />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <!-- 🔴 MỤC 426 — Ô NÀY CỐ Ý CÒN KHOÁ, KHÔNG PHẢI BỎ SÓT.

                     Bảng `credit_interests` nối với hợp đồng bằng CHUỖI
                     `contract_id`, không phải bằng khoá ngoại
                     (`app/models/credit.py` dòng 76). Đổi mã HĐ ở đây là
                     toàn bộ lịch sử đóng lãi của hợp đồng đó thành mồ
                     côi — không xoá, không báo lỗi, chỉ là không ai tìm
                     thấy nữa.

                     Đổi mã HĐ phải đổi kèm ở bảng kia trong cùng một
                     giao dịch. Đã có sẵn công cụ hai bước cho việc đó:
                     `HDG_379_DOI_MA_HOP_DONG.py`.
                     ═════════════════════════════════════════════════ -->
                <el-form-item label="Mã Hợp đồng" prop="contract_id">
                  <el-input v-model="form.contract_id" placeholder="VD: HĐ-TD-001..." :disabled="isEdit" />
                  <span v-if="isEdit" class="text-xs text-gray-400 dark:text-gray-500">
                    Không sửa được ở đây — đổi mã HĐ phải đổi kèm lịch sử đóng lãi.
                  </span>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <!-- ══════════════════════════════════════════════════
                     MỤC 426 (31/08/2026) — SỬA ĐƯỢC LOẠI VAY

                     s68: *"Loại hợp đồng tín chấp và muốn đổi sang thế
                     chấp vào mục chỉnh sửa không có."*

                     Đã bỏ `:disabled="isEdit"`. An toàn về tiền: đã soi
                     toàn bộ backend, `loan_type` chỉ dùng để HIỂN THỊ
                     (`app/services/credit_notify.py` dòng 34), để LỌC
                     (`app/crud/credit.py` dòng 181), và để kiểm hạn mức
                     LÚC TẠO MỚI (`app/api/v1/credit.py` dòng 483–493).
                     Không có công thức tính lãi hay tính nợ nào đọc nó.
                     Nên đổi loại vay của một hợp đồng đã có KHÔNG làm
                     xê dịch đồng nào.
                     ══════════════════════════════════════════════════ -->
                <el-form-item label="Loại vay" prop="loan_type">
                  <el-select v-model="form.loan_type" placeholder="Chọn loại vay" style="width: 100%" class="highlight-select">
                    <el-option label="Thế chấp (Collateral)" value="Collateral" />
                    <el-option label="Tín chấp (Unsecured)" value="Unsecured" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Trạng thái" prop="credit_status">
                  <el-select v-model="form.credit_status" placeholder="Chọn trạng thái" style="width: 100%" class="highlight-select">
                    <el-option label="Đang vay" value="active" />
                    <el-option label="Đã tất toán" value="paid" />
                    <el-option label="Đã hủy" value="cancelled" />
                    <el-option label="Nợ xấu" value="bad_debt" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Ghi chú" prop="notes">
                  <el-input v-model="form.notes" type="textarea" :rows="2" placeholder="Ghi chú điều khoản hợp đồng..." />
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

          <!-- PHẦN 2: THÔNG TIN TÀI CHÍNH -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Thông tin Tài chính
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <!-- 🔴 MỤC 426 — Ô NÀY CÒN KHOÁ, ĐANG CHỜ s68 TRẢ LỜI.

                     Lúc TẠO hợp đồng, `add-credits` trừ số gốc vào "Hạn
                     mức còn lại" và cộng vào "Tổng dư nợ gốc" của khách
                     (`app/api/v1/credit.py` dòng 495–497). Nhưng
                     `update-credits` KHÔNG làm điều ngược lại — nó chỉ
                     chỉnh hạn mức khi đổi TRẠNG THÁI (dòng 570–600).

                     Mở khoá ô này mà không sửa backend thì sửa gốc từ
                     250.000 lên 400.000 sẽ ghi vào hợp đồng, còn hạn mức
                     và dư nợ của khách giữ nguyên số cũ — sai lệch 150.000
                     mà không có gì báo.
                     ═════════════════════════════════════════════════ -->
                <el-form-item label="Gốc ban đầu">
                  <el-input v-model="form.initial_principal_text" placeholder="Nhập số tiền..." @input="(v) => handlePriceInput(v, 'initial_principal')" :disabled="isEdit" />
                  <span v-if="isEdit" class="text-xs text-gray-400 dark:text-gray-500">
                    Chưa mở sửa — đổi gốc phải tính lại hạn mức của khách.
                  </span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Gốc đã trả">
                  <el-input v-model="form.total_principal_paid_text" placeholder="Nhập số tiền..." @input="(v) => handlePriceInput(v, 'total_principal_paid')" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Gốc còn lại">
                  <el-input v-model="form.remaining_principal_text" placeholder="Nhập số tiền..." @input="(v) => handlePriceInput(v, 'remaining_principal')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Lãi suất / Tháng (%)">
                  <el-input-number v-model="form.monthly_interest_rate" :min="0" :max="100" :precision="2" style="width: 100%" controls-position="right" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Nợ lãi hiện tại">
                  <el-input v-model="form.interest_debt_text" placeholder="Nhập số tiền..." @input="(v) => handlePriceInput(v, 'interest_debt')" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 3: THỜI HẠN & TIN NHẮN -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-rose-500 rounded-full"></span>
              Thời hạn & Tin nhắn
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Ngày bắt đầu" prop="start_date">
                  <el-date-picker :editable="false" v-model="form.start_date" type="date" placeholder="Chọn ngày" format="DD/MM/YYYY" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ngày đáo hạn" prop="due_date">
                  <el-date-picker :editable="false" v-model="form.due_date" type="date" placeholder="Chọn ngày" format="DD/MM/YYYY" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Bắt đầu tính lãi" prop="interest_start_date">
                  <el-date-picker :editable="false" v-model="form.interest_start_date" type="date" placeholder="Chọn ngày" format="DD/MM/YYYY" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ngày tính lãi gần nhất">
                  <el-date-picker :editable="false" v-model="form.last_interest_charged_date" type="date" placeholder="Chọn ngày" format="DD/MM/YYYY" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Gửi tin khi phát sinh">
                  <el-switch v-model="form.send_message_arise" active-text="Có" inactive-text="Không" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20" v-if="form.send_message_arise">
              <el-col :span="24">
                <el-form-item label="Nội dung tin nhắn" prop="message_content">
                  <el-input v-model="form.message_content" type="textarea" :rows="3" placeholder="Nhập nội dung tin nhắn tự động khi có biến động..." />
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

    <!-- Contract Details Dialog -->
    <el-dialog 
      v-model="detailDialogVisible" 
      title="CHI TIẾT HỢP ĐỒNG TÍN DỤNG" 
      width="850px" 
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedContract" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto overflow-x-hidden text-left">
        <!-- Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-blue-500 dark:bg-blue-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32">
              <Files />
            </el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-left">Hợp đồng tín dụng</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5 text-left">
              {{ selectedContract.contract_id }}
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span class="flex items-center gap-1 font-bold text-blue-650 dark:text-blue-400">
                {{ selectedContract.customer_name }}
              </span>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span>Loại vay: {{ selectedContract.loan_type === 'Collateral' ? 'Thế chấp' : 'Tín chấp' }}</span>
            </div>
          </div>
        </div>

        <!-- 1. THÔNG TIN CHUNG -->
        <div>
          <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            Thông tin chung & Đối tác
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã Hợp đồng</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedContract.contract_id }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Khách hàng</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedContract.customer_name }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Trạng thái</div>
              <el-tag :type="getStatusTag(selectedContract.credit_status)" effect="light" size="small" class="capitalize">
                {{ getStatusText(selectedContract.credit_status) }}
              </el-tag>
            </div>
            <div class="col-span-2 md:col-span-1">
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Loại vay</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedContract.loan_type === 'Collateral' ? 'Thế chấp (Collateral)' : 'Tín chấp (Unsecured)' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Phân loại</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-250">
                <el-tag v-if="selectedContract.classification" size="small" type="info" effect="plain" class="font-bold">
                  {{ selectedContract.classification }}
                </el-tag>
                <span v-else class="text-gray-400">—</span>
              </div>
            </div>
          </div>
          <div class="mt-4">
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ghi chú điều khoản</div>
            <div class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{{ selectedContract.notes || '—' }}</div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 2. THÔNG TIN TÀI CHÍNH -->
        <div>
          <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
            Thông tin tài chính & Lãi suất
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Gốc ban đầu</div>
              <div class="text-sm font-bold text-gray-700 dark:text-gray-300">{{ formatCurrency(selectedContract.initial_principal) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Lãi suất / Tháng</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedContract.monthly_interest_rate }}%</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tiền lãi / Tháng</div>
              <div class="text-sm font-bold text-gray-700 dark:text-gray-300">{{ formatCurrency(selectedContract.monthly_interest_amount) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 font-bold text-emerald-600 dark:text-emerald-400">Gốc còn lại</div>
              <div class="text-sm font-extrabold text-emerald-650 dark:text-emerald-400">{{ formatCurrency(selectedContract.remaining_principal) }}</div>
            </div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4 pt-4 border-t border-dashed border-gray-100 dark:border-gray-800">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Gốc đã trả</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatCurrency(selectedContract.total_principal_paid) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Nợ lãi hiện tại</div>
              <div class="text-sm font-bold" :class="selectedContract.interest_debt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500'">
                {{ formatCurrency(selectedContract.interest_debt) }}
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 3. THỜI HẠN & TÍNH LÃI -->
        <div>
          <h4 class="text-sm font-bold text-violet-650 dark:text-violet-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
            Thời hạn & Lịch tính lãi
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày bắt đầu</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatDate(selectedContract.start_date) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày tính lãi đầu</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatDate(selectedContract.interest_start_date) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày tính lãi gần nhất</div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatDate(selectedContract.last_interest_charged_date) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 font-bold text-red-500">Ngày đáo hạn</div>
              <div class="text-sm font-bold text-red-500">{{ formatDate(selectedContract.due_date) }}</div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700"></div>

        <!-- 4. GỬI TIN NHẮN PHÁT SINH -->
        <div>
          <h4 class="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-rose-500 rounded-full"></span>
            Gửi tin nhắn phát sinh (SMS / Telegram)
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tự động gửi tin</div>
              <el-tag :type="selectedContract.send_message_arise ? 'success' : 'info'" effect="light">
                {{ selectedContract.send_message_arise ? 'Đang bật' : 'Đang tắt' }}
              </el-tag>
            </div>
          </div>
          <div class="mt-4" v-if="selectedContract.send_message_arise">
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Nội dung tin nhắn mẫu</div>
            <div class="text-sm text-gray-700 dark:text-gray-300 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
              {{ selectedContract.message_content || '—' }}
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

    <!-- Schedule Notification Modal -->
    <ScheduledNotificationModal
      v-model="scheduleModalVisible"
      module-key="credit"
      :prefill-data="schedulePrefill"
      @saved="scheduleModalVisible = false"
    />
  </div>

    <!-- ══════════════════════════════════════════════════════════════
         MỤC 419 (30/08/2026) — HỘP THÊM KHÁCH HÀNG NHANH
         Chỉ 4 ô. Form đầy đủ (hạn mức, dư nợ, tên nhóm) ở màn Khách hàng.
         ══════════════════════════════════════════════════════════ -->
    <el-dialog v-model="hienThemKhach" title="THÊM KHÁCH HÀNG NHANH"
               width="520px" destroy-on-close align-center
               class="custom-dark-dialog">
      <el-form label-width="140px" class="mt-2">
        <el-form-item label="Mã khách hàng" required>
          <el-input v-model="formKhach.customer_id" placeholder="VD: KH-CR-001" />
        </el-form-item>
        <el-form-item label="Tên khách hàng" required>
          <el-input v-model="formKhach.customer_name" placeholder="Nhập tên khách hàng..." />
        </el-form-item>
        <el-form-item label="Liên hệ (Telegram)">
          <el-input v-model="formKhach.contact_info" placeholder="VD: @telegram_username" />
        </el-form-item>
        <el-form-item label="Phân loại">
          <el-select v-model="formKhach.classification" placeholder="Chọn phân loại..."
                     style="width: 100%" clearable :filterable="choLocDuoc">
            <el-option v-for="item in classifications" :key="item"
                       :label="item" :value="item" />
          </el-select>
        </el-form-item>
      </el-form>
      <p class="text-xs text-gray-400 dark:text-gray-500 px-2">
        Hạn mức tín dụng và dư nợ khai ở màn <b>Khách hàng</b>. Ở đây chỉ tạo
        nhanh để chọn được vào hợp đồng đang làm dở.
      </p>
      <template #footer>
        <el-button @click="hienThemKhach = false">Hủy</el-button>
        <el-button type="primary" :loading="dangLuuKhach" @click="luuKhachNhanh">
          Thêm và chọn
        </el-button>
      </template>
    </el-dialog>
    <!-- ══════════════════════════════════════════════════════════════
         MỤC 428 (31/08/2026) — ĐÁNH DẤU HỢP ĐỒNG NHẬP SAI
         ══════════════════════════════════════════════════════════════ -->
    <el-dialog v-model="hienNhapSai" width="460px" align-center destroy-on-close
               class="custom-dark-dialog">
      <template #header>
        <span class="font-bold text-amber-600">⚠️ ĐÁNH DẤU HỢP ĐỒNG NHẬP SAI</span>
      </template>

      <div class="space-y-3 text-sm">
        <p>
          Hợp đồng
          <b class="font-mono">{{ hopDongNhapSai?.contract_id }}</b>
          của <b>{{ hopDongNhapSai?.customer_name }}</b>
          sẽ chuyển sang trạng thái <b>Nhập sai</b>.
        </p>

        <!-- 🔴 Nói TRƯỚC hậu quả, không để người dùng phát hiện sau. -->
        <ul class="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
          <li>Hợp đồng không còn được tính vào dư nợ của khách.</li>
          <li>Hạn mức đã trừ sẽ được hoàn lại cho khách.</li>
          <li>Dòng dữ liệu vẫn giữ nguyên để truy lại — không bị xoá.</li>
        </ul>

        <el-form label-position="top">
          <el-form-item label="Mã xác nhận">
            <el-input v-model="maXacNhan" type="password" show-password
                      placeholder="Nhập mã xác nhận" />
          </el-form-item>
          <el-form-item label="Lý do (không bắt buộc)">
            <el-input v-model="lyDoNhapSai" type="textarea" :rows="2"
                      placeholder="VD: nhập nhầm số tiền gốc" />
          </el-form-item>
        </el-form>

        <p class="text-xs text-gray-400 dark:text-gray-500">
          Chỉ tài khoản owner đánh dấu được. Mã xác nhận do máy chủ giữ.
        </p>
      </div>

      <template #footer>
        <el-button @click="hienNhapSai = false">Hủy</el-button>
        <el-button type="warning" :loading="dangGuiNhapSai"
                   :disabled="!maXacNhan"
                   @click="guiDanhDauNhapSai">Xác nhận</el-button>
      </template>
    </el-dialog>

</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { mauSo } from '@/utils/mauSo'
import { Search, MoreFilled, Files, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { creditService } from '@/api/creditService'
import ScheduledNotificationModal from '@/components/ScheduledNotification/ScheduledNotificationModal.vue'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'
// MỤC 417 — trên máy bảng/điện thoại KHÔNG cho gõ lọc, để iOS
// không bật bàn phím; bấm ẩn bàn phím thì droplist ở nguyên đó.
// Xem `src/composables/chonDuoc.ts`.
import { dungChonDuoc } from '@/composables/chonDuoc'

const { choLocDuoc } = dungChonDuoc()

const { laManHep, hienBang, hienThe } = dungManHep()

const emit = defineEmits(['switch-tab'])

interface Contract {
  id: string
  customer_id: string
  customer_name: string
  customer_code: string
  group_name: string
  contact_info: string
  contract_id: string
  loan_type: 'Collateral' | 'Unsecured'
  initial_principal: number
  start_date: string
  due_date: string
  interest_start_date: string
  monthly_interest_rate: number
  monthly_interest_amount: number
  total_principal_paid: number
  remaining_principal: number
  notes: string
  send_message_arise: boolean
  message_content: string
  credit_status: 'active' | 'paid' | 'cancelled' | 'bad_debt'
  interest_debt: number
  last_interest_charged_date: string
  classification?: string
}

const loading = ref(false)
const searchQuery = ref('')
const filterLoanType = ref('')
const filterStatus = ref('')
const filterClassification = ref('')
const classifications = ref<string[]>([])

const fetchClassifications = async () => {
  try {
    const data = await creditService.getClassifications()
    classifications.value = data
  } catch (error) {
    console.error('Failed to fetch classifications:', error)
  }
}

const formatDateString = (date: Date) => {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const getInitialDateRange = (): [string, string] => {
  const today = new Date()
  const threeYearsAgo = new Date()
  threeYearsAgo.setFullYear(today.getFullYear() - 3)
  return [formatDateString(threeYearsAgo), formatDateString(today)]
}

const dateRange = ref<[string, string] | null>(getInitialDateRange())

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Customers list for the add/edit dropdown (fetched from API)
const customersList = ref<any[]>([])

// ══════════════════════════════════════════════════════════════════════
// MỤC 419 (30/08/2026) — THÊM KHÁCH HÀNG NHANH NGAY TRONG FORM HỢP ĐỒNG
//
// 🔴 ĐÂY LÀ FORM RÚT GỌN, CỐ Ý. Màn Khách hàng có form đầy đủ với hạn mức,
// dư nợ, tên nhóm… Ở đây chỉ 4 ô: mã, tên, liên hệ, phân loại — vừa đủ để
// tạo rồi quay lại việc đang làm dở.
//
// ⚠️ Vì sao KHÔNG tách form đầy đủ ra component dùng chung: form đó ~300
// dòng và dính hạn mức tín dụng — tức dính tiền. Tách nó ra trong lúc đang
// sửa nhiều thứ khác là rủi ro không cần thiết. Đánh đổi: có HAI đoạn
// markup form, nhưng CHỈ MỘT đường ghi (`creditService.addCreditCustomers`).
//
// ⚠️ Ai sửa về sau: hai ô `customer_id` và `customer_name` là BẮT BUỘC —
// giống hệt `rules` của màn Khách hàng. Bỏ ràng buộc ở đây là tạo được
// khách hàng thiếu mã, và màn kia sẽ không sửa nổi.
const hienThemKhach = ref(false)
const dangLuuKhach = ref(false)
const formKhach = reactive({
  customer_id: '',
  customer_name: '',
  contact_info: '',
  classification: '',
})

const moThemKhachNhanh = () => {
  formKhach.customer_id = ''
  formKhach.customer_name = ''
  formKhach.contact_info = ''
  formKhach.classification = ''
  hienThemKhach.value = true
}

const luuKhachNhanh = async () => {
  const ma = (formKhach.customer_id || '').trim()
  const ten = (formKhach.customer_name || '').trim()
  if (!ma || !ten) {
    ElMessage.warning('Phải có Mã khách hàng và Tên khách hàng.')
    return
  }
  // ⚠️ Chặn trùng mã NGAY TRÊN MÀN. Để máy chủ báo thì người dùng mất một
  // lượt gửi và nhận một câu lỗi kỹ thuật.
  if (customersList.value.some((c: any) => (c.customer_id || '') === ma)) {
    ElMessage.warning(`Mã khách hàng ${ma} đã có rồi.`)
    return
  }

  dangLuuKhach.value = true
  try {
    const themVao = await creditService.addCreditCustomers([{
      customer_id: ma,
      customer_name: ten,
      contact_info: (formKhach.contact_info || '').trim() || null,
      classification: formKhach.classification || null,
    }])
    if (!themVao || !themVao.length) {
      ElMessage.error('Máy chủ không trả về khách hàng vừa tạo.')
      return
    }
    const moi = themVao[0]
    customersList.value.push(moi)
    // 🔴 Chọn luôn khách vừa tạo. Không chọn thì người dùng phải tự đi tìm
    // trong danh sách — mà lý do họ bấm nút này là vì chưa có khách đó.
    form.customer_id = moi.id
    hienThemKhach.value = false
    ElMessage.success(`Đã thêm khách hàng ${ma} và chọn sẵn.`)
  } catch (e: any) {
    ElMessage.error(e?.message || 'Lỗi khi thêm khách hàng.')
  } finally {
    dangLuuKhach.value = false
  }
}

const contracts = ref<Contract[]>([])

const filteredContracts = computed(() => {
  return contracts.value.filter(c => {
    const q = searchQuery.value.toLowerCase()
    const matchesSearch = !q ||
      c.contract_id.toLowerCase().includes(q) ||
      c.customer_name.toLowerCase().includes(q)

    const matchesClassification = !filterClassification.value ||
      c.classification === filterClassification.value

    return matchesSearch && matchesClassification
  })
})

const sortProp = ref('')
const sortOrder = ref('')

const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  sortProp.value = prop
  sortOrder.value = order
}

const sortedContracts = computed(() => {
  const list = [...filteredContracts.value]
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
  return sortedContracts.value.slice(start, end)
})

// Dialog States
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<any>(null)

// Details Dialog State
const detailDialogVisible = ref(false)
const selectedContract = ref<Contract | null>(null)

const openDetailDialog = (row: Contract) => {
  selectedContract.value = row
  detailDialogVisible.value = true
}

const form = reactive({
  id: '',
  customer_id: '',
  contract_id: '',
  loan_type: 'Collateral' as 'Collateral' | 'Unsecured',
  initial_principal: 0,
  initial_principal_text: '',
  start_date: '',
  due_date: '',
  interest_start_date: '',
  monthly_interest_rate: 0.0,
  total_principal_paid: 0,
  total_principal_paid_text: '',
  remaining_principal: 0,
  remaining_principal_text: '',
  notes: '',
  send_message_arise: false,
  message_content: '',
  credit_status: 'active' as 'active' | 'paid' | 'cancelled' | 'bad_debt',
  interest_debt: 0,
  interest_debt_text: '',
  last_interest_charged_date: '',
  classification: ''
})

const rules = reactive({
  customer_id: [{ required: true, message: 'Vui lòng chọn khách hàng', trigger: 'change' }],
  contract_id: [{ required: true, message: 'Vui lòng nhập mã hợp đồng', trigger: 'blur' }],
  loan_type: [{ required: true, message: 'Vui lòng chọn loại vay', trigger: 'change' }],
  credit_status: [{ required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change' }]
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

  // Tự động tính toán số tiền gốc
  if (field === 'total_principal_paid') {
    const remaining = form.initial_principal - form.total_principal_paid
    form.remaining_principal = remaining
    form.remaining_principal_text = new Intl.NumberFormat('vi-VN').format(remaining)
  } else if (field === 'remaining_principal') {
    const paid = form.initial_principal - form.remaining_principal
    form.total_principal_paid = paid
    form.total_principal_paid_text = new Intl.NumberFormat('vi-VN').format(paid)
  } else if (field === 'initial_principal') {
    const remaining = form.initial_principal - form.total_principal_paid
    form.remaining_principal = remaining
    form.remaining_principal_text = new Intl.NumberFormat('vi-VN').format(remaining)
  }
}

// ══════════════════════════════════════════════════════════════════════
// MỤC 428 (31/08/2026) — ĐÁNH DẤU HỢP ĐỒNG NHẬP SAI
//
// 🔴 Frontend KHÔNG giữ và KHÔNG so mã xác nhận. Nó chỉ chuyển tiếp mã
// người dùng gõ lên backend và hiện nguyên văn câu trả lời.
//
// ⚠️ Ô nhập để `type="password"`: nút này bấm trong văn phòng, có người
// đứng sau lưng.
// ══════════════════════════════════════════════════════════════════════
const hienNhapSai = ref(false)
const hopDongNhapSai = ref<Contract | null>(null)
const maXacNhan = ref('')
const lyDoNhapSai = ref('')
const dangGuiNhapSai = ref(false)

const moHopThoaiNhapSai = (row: Contract) => {
  hopDongNhapSai.value = row
  // Xoá mã cũ mỗi lần mở. Giữ lại là lần sau bấm nhầm Xác nhận cũng chạy.
  maXacNhan.value = ''
  lyDoNhapSai.value = ''
  hienNhapSai.value = true
}

const guiDanhDauNhapSai = async () => {
  if (!hopDongNhapSai.value || !maXacNhan.value) return
  dangGuiNhapSai.value = true
  try {
    await creditService.danhDauNhapSai(
      hopDongNhapSai.value.id, maXacNhan.value, lyDoNhapSai.value)
    ElMessage.success('Đã đánh dấu hợp đồng nhập sai.')
    hienNhapSai.value = false
    maXacNhan.value = ''
    await fetchCredits()
  } catch (e: any) {
    // Hiện NGUYÊN VĂN lý do backend trả về — nó đã cân nhắc nói gì và
    // giấu gì.
    ElMessage.error(e?.message || 'Không đánh dấu được.')
  } finally {
    dangGuiNhapSai.value = false
  }
}

const handleCommand = (cmd: string, row: Contract) => {
  if (cmd === 'detail') {
    openDetailDialog(row)
  } else if (cmd === 'edit') {
    openEditDialog(row)
  } else if (cmd === 'delete') {
    handleDelete(row)
  } else if (cmd === 'schedule') {
    openScheduleDialog(row)
  } else if (cmd === 'nhap_sai') {
    moHopThoaiNhapSai(row)
  }
}

// Schedule notification
const scheduleModalVisible = ref(false)
const schedulePrefill = ref<any>(null)

const openScheduleDialog = (row: Contract) => {
  schedulePrefill.value = {
    notify_type: 'credit_interest',
    reference_id: row.contract_id,
    reference_name: row.customer_name,
    message_template: `Nhắc nhở đóng lãi\nMã HĐ: ${row.contract_id}\nKhách hàng: ${row.customer_name}\nGốc còn lại: ${new Intl.NumberFormat('vi-VN').format(row.remaining_principal)} VNĐ`,
  }
  scheduleModalVisible.value = true
}

const getStatusTag = (status: string) => {
  if (status === 'active') return 'success'
  if (status === 'paid') return 'info'
  if (status === 'cancelled') return 'warning'
  if (status === 'bad_debt') return 'danger'
  if (status === 'nhap_sai') return 'warning'   // MỤC 428
  return 'info'
}

// ══════════════════════════════════════════════════════════════════════
// MỤC 425 (31/08/2026) — THÁNG ĐÓNG LÃI GẦN NHẤT
//
// Ba trường hợp:
//   ① đã tất toán              -> "Đã tất toán"   (xanh lá)
//   ② còn nợ, đã từng đóng     -> "MM/YYYY"
//   ③ còn nợ, chưa đóng lần nào -> "Chưa đóng lần nào"  (hổ phách)
//
// 🔴 Trường hợp ③ KHÔNG in dấu gạch "—". Dấu gạch nghĩa là "chưa có dữ
// liệu", còn đây là sự thật đã biết, và là dòng đáng chú ý nhất trong
// ba dòng — hợp đồng đang nợ mà chưa đóng lãi lần nào.
//
// Số liệu lấy từ `last_interest_paid_date` (backend cùng MỤC). KHÔNG
// phải `last_interest_charged_date` — cột đó là ngày bot TÍNH lãi phát
// sinh, hợp đồng nợ lãi ba tháng vẫn có giá trị của tháng này.
// ══════════════════════════════════════════════════════════════════════
const thangDongLai = (row: any) => {
  if (row?.credit_status === 'paid') return 'Đã tất toán'
  const ngay = row?.last_interest_paid_date
  if (!ngay) return 'Chưa đóng lần nào'
  const phan = String(ngay).split('-')
  if (phan.length < 2) return String(ngay)
  return `${phan[1]}/${phan[0]}`
}

const getStatusText = (status: string) => {
  if (status === 'active') return 'Đang vay'
  if (status === 'paid') return 'Đã tất toán'
  if (status === 'cancelled') return 'Đã hủy'
  if (status === 'bad_debt') return 'Nợ xấu'
  if (status === 'nhap_sai') return 'Nhập sai'   // MỤC 428
  return 'Chưa rõ'
}

const openAddDialog = () => {
  isEdit.value = false
  form.id = ''
  form.customer_id = ''
  form.contract_id = ''
  form.loan_type = 'Collateral'
  form.start_date = formatDateString(new Date())
  form.due_date = ''
  form.interest_start_date = ''
  form.monthly_interest_rate = 0.0
  form.notes = ''
  form.send_message_arise = false
  form.message_content = ''
  form.credit_status = 'active'
  form.last_interest_charged_date = ''
  form.classification = ''

  const fields = ['initial_principal', 'total_principal_paid', 'remaining_principal', 'interest_debt']
  const formAny = form as any
  fields.forEach(f => {
    formAny[f] = 0
    formAny[`${f}_text`] = ''
  })

  dialogVisible.value = true
}

// Store original contract values before editing to check for modifications
const originalContractValues = ref<{ remaining_principal: number; total_principal_paid: number } | null>(null)

const openEditDialog = (row: Contract) => {
  isEdit.value = true
  originalContractValues.value = {
    remaining_principal: row.remaining_principal || 0,
    total_principal_paid: row.total_principal_paid || 0
  }
  form.id = row.id
  form.customer_id = row.customer_id
  form.contract_id = row.contract_id
  form.loan_type = row.loan_type
  form.start_date = row.start_date
  form.due_date = row.due_date
  form.interest_start_date = row.interest_start_date
  form.monthly_interest_rate = row.monthly_interest_rate
  form.notes = row.notes
  form.send_message_arise = row.send_message_arise
  form.message_content = row.message_content || ''
  form.credit_status = row.credit_status
  form.last_interest_charged_date = row.last_interest_charged_date || ''
  form.classification = row.classification || ''

  const fields = ['initial_principal', 'total_principal_paid', 'remaining_principal', 'interest_debt']
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
      const selectedCust = customersList.value.find(c => c.id === form.customer_id)
      
      // Calculate monthly interest amount: principal * rate / 100
      const calculatedInterest = Math.round(form.remaining_principal * form.monthly_interest_rate / 100)

      const payload: Contract = {
        id: form.id || `cr-con-${Date.now()}`,
        customer_id: form.customer_id,
        customer_name: selectedCust ? selectedCust.customer_name : 'Khách hàng ẩn danh',
        customer_code: selectedCust ? selectedCust.customer_id : '',
        group_name: selectedCust ? selectedCust.group_name : '',
        contact_info: selectedCust ? selectedCust.contact_info : '',
        contract_id: form.contract_id,
        loan_type: form.loan_type,
        initial_principal: form.initial_principal,
        start_date: form.start_date,
        due_date: form.due_date,
        interest_start_date: form.interest_start_date,
        monthly_interest_rate: form.monthly_interest_rate,
        monthly_interest_amount: calculatedInterest,
        total_principal_paid: form.total_principal_paid,
        remaining_principal: form.remaining_principal,
        notes: form.notes,
        send_message_arise: form.send_message_arise,
        message_content: form.message_content,
        credit_status: form.credit_status,
        interest_debt: form.interest_debt,
        last_interest_charged_date: form.last_interest_charged_date,
        classification: form.classification || ''
      }

      if (isEdit.value) {
        // Chuẩn bị payload gửi đi API update
        const apiPayload = {
          id: form.id,
          customer_id: form.customer_id,
          contract_id: form.contract_id,
          loan_type: form.loan_type,
          initial_principal: form.initial_principal || 0,
          start_date: form.start_date || null,
          due_date: form.due_date || null,
          interest_start_date: form.interest_start_date || null,
          monthly_interest_rate: form.monthly_interest_rate || 0,
          monthly_interest_amount: calculatedInterest || 0,
          total_principal_paid: form.total_principal_paid || 0,
          remaining_principal: form.remaining_principal || 0,
          notes: form.notes || '',
          send_message_arise: form.send_message_arise || false,
          message_content: form.message_content || '',
          interest_debt: form.interest_debt || 0,
          last_interest_charged_date: form.last_interest_charged_date || null,
          credit_status: form.credit_status,
          classification: form.classification || null
        }

        loading.value = true
        try {
          const updatedContracts = await creditService.updateCredits([apiPayload])
          if (updatedContracts && updatedContracts.length > 0) {
            ElMessage.success('Cập nhật hợp đồng thành công!')
            dialogVisible.value = false

            // Check if remaining_principal or total_principal_paid changed
            const hasChanged = originalContractValues.value && (
              originalContractValues.value.remaining_principal !== form.remaining_principal ||
              originalContractValues.value.total_principal_paid !== form.total_principal_paid
            )

            await fetchCredits()
            await fetchClassifications()

            if (hasChanged) {
              await ElMessageBox.alert(
                'Hệ thống phát hiện có sự thay đổi về số tiền Gốc còn lại hoặc Gốc đã trả. Bạn nên cập nhật lại Tổng dư nợ gốc bên tab Khách hàng.',
                'Thông báo cập nhật dư nợ',
                {
                  confirmButtonText: 'Đồng ý',
                  type: 'warning'
                }
              )
              emit('switch-tab', 'customers')
            }
          } else {
            ElMessage.error('Không nhận được phản hồi từ server')
          }
        } catch (error: any) {
          ElMessage.error(error.message || 'Lỗi khi cập nhật hợp đồng')
        } finally {
          loading.value = false
        }
      } else {
        // Chuẩn bị payload gửi đi API (bỏ id tự sinh ở client, đổi date rỗng thành null)
        const apiPayload = {
          customer_id: form.customer_id,
          contract_id: form.contract_id,
          loan_type: form.loan_type,
          initial_principal: form.initial_principal || 0,
          start_date: form.start_date || null,
          due_date: form.due_date || null,
          interest_start_date: form.interest_start_date || null,
          monthly_interest_rate: form.monthly_interest_rate || 0,
          monthly_interest_amount: calculatedInterest || 0,
          total_principal_paid: form.total_principal_paid || 0,
          remaining_principal: form.remaining_principal || 0,
          notes: form.notes || '',
          send_message_arise: form.send_message_arise || false,
          message_content: form.message_content || '',
          interest_debt: form.interest_debt || 0,
          last_interest_charged_date: form.last_interest_charged_date || null,
          credit_status: form.credit_status,
          classification: form.classification || null
        }

        loading.value = true
        try {
          const addedContracts = await creditService.addCredits([apiPayload])
          if (addedContracts && addedContracts.length > 0) {
             ElMessage.success('Thêm mới hợp đồng thành công!')
             dialogVisible.value = false
             await fetchCredits()
             await fetchClassifications()
          } else {
            ElMessage.error('Không nhận được phản hồi từ server')
          }
        } catch (error: any) {
          ElMessage.error(error.message || 'Lỗi khi thêm mới hợp đồng')
        } finally {
          loading.value = false
        }
      }
    }
  })
}

const handleDelete = async (row: Contract) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa hợp đồng "${row.contract_id}"?`,
      'Xác nhận xóa hợp đồng',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy bỏ',
        type: 'warning'
      }
    )
    loading.value = true
    try {
      await creditService.deleteCredits([row.id])
      ElMessage.success('Xóa hợp đồng thành công!')
      await fetchCredits()
    } catch (error: any) {
      ElMessage.error(error.message || 'Lỗi khi xóa hợp đồng')
    } finally {
      loading.value = false
    }
  } catch (err) {
    // cancelled
  }
}

const fetchCredits = async () => {
  loading.value = true
  try {
    // Build params from filters
    const params: any = {}
    if (filterStatus.value) params.status = filterStatus.value
    if (filterLoanType.value) params.loan_type = filterLoanType.value
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }

    const data = await creditService.getCredits(params)
    contracts.value = data.map((item: any) => ({
      id: item.id || '',
      customer_id: item.customer_id || '',
      customer_name: item.customer_name || 'Chưa rõ',
      customer_code: item.customer_code || '',
      group_name: item.group_name || '',
      contact_info: item.contact_info || '',
      contract_id: item.contract_id || '',
      loan_type: item.loan_type || 'Collateral',
      initial_principal: item.initial_principal || 0,
      start_date: item.start_date || '',
      due_date: item.due_date || '',
      interest_start_date: item.interest_start_date || '',
      monthly_interest_rate: item.monthly_interest_rate || 0,
      monthly_interest_amount: item.monthly_interest_amount || 0,
      total_principal_paid: item.total_principal_paid || 0,
      remaining_principal: item.remaining_principal || 0,
      notes: item.notes || '',
      send_message_arise: item.send_message_arise || false,
      message_content: item.message_content || '',
      credit_status: item.credit_status || 'active',
      interest_debt: item.interest_debt || 0,
      last_interest_charged_date: item.last_interest_charged_date || '',
      classification: item.classification || ''
    }))
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi tải danh sách hợp đồng tín dụng')
  } finally {
    loading.value = false
  }
}

const fetchCustomersList = async () => {
  try {
    const data = await creditService.getCreditCustomers()
    customersList.value = data
  } catch (error: any) {
    // Silently fail - customer dropdown may not load
    console.error('Failed to load customers list:', error)
  }
}

// Helpers
const formatCurrency = (val: number) => {
  if (!val) return '0 VNĐ'
  return new Intl.NumberFormat('vi-VN').format(val) + ' VNĐ'
}

const formatDate = (d: string) => {
  if (!d) return '—'
  const [y, m, dd] = d.split('-')
  return `${dd}/${m}/${y}`
}

onMounted(() => {
  fetchCredits()
  fetchCustomersList()
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

html.dark .custom-dark-select :deep(.el-input__wrapper),
html.dark .custom-dark-input :deep(.el-input__wrapper) {
  background-color: #111827 !important;
  box-shadow: 0 0 0 1px #4b5563 inset !important;
}
html.dark .custom-dark-select :deep(.el-input__inner),
html.dark .custom-dark-input :deep(.el-input__inner) {
  color: #f3f4f6;
}

/* Custom dark date picker overrides */
html.dark .custom-dark-date-picker :deep(.el-range-input) {
  background-color: transparent;
  color: #f3f4f6;
}
html.dark .custom-dark-date-picker :deep(.el-range-separator) {
  color: #9ca3af;
}
</style>

<style>
/* Unscoped date picker dark mode overrides */
html.dark .highlight-select.el-date-editor .el-input__wrapper {
  background-color: #111827 !important;
  box-shadow: 0 0 0 1px #111827 inset !important;
}
html.dark .highlight-select.el-date-editor .el-range-input {
  color: #f3f4f6 !important;
}
html.dark .highlight-select.el-date-editor .el-range-separator {
  color: #9ca3af !important;
}
</style>
