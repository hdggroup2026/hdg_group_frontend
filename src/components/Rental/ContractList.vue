<template>
  <div class="rental-container h-full flex flex-col">
    <!-- Filter Bar -->
    <!-- MỤC 728 — flex-wrap: trên điện thoại ô lọc + ô tìm + nút xuống dòng thay vì tràn ngang. -->
    <div class="flex flex-wrap justify-between items-center gap-2 mb-4 shrink-0">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái:</span>
          <el-select
            v-model="filterStatus"
            placeholder="Tất cả"
            style="width: 150px"
            clearable
            class="custom-dark-select highlight-select"
            popper-class="custom-dark-select-popper"
          >
            <el-option label="Tất cả" value="" />
            <el-option label="Đang thuê" value="active" />
            <el-option label="Hết hạn" value="expired" />
            <el-option label="Đã hủy" value="cancelled" />
            <el-option label="Nợ xấu" value="bad_debt" />
            <el-option label="Bản nháp" value="draft" />
          </el-select>
        </div>
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
          <el-input
            v-model="searchQuery"
            placeholder="Tìm tên khách thuê, mã HĐ..."
            :prefix-icon="Search"
            clearable
            class="w-56 sm:w-64 custom-dark-input"
          />
        </div>
      </div>
      <div class="flex items-center gap-2">
        <el-button :icon="Refresh" circle @click="fetchContracts" :loading="loading" />
        <el-button type="primary" @click="openAddDialog">Tạo hợp đồng mới</el-button>
      </div>
    </div>

    <!-- Table Container -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
      <!-- ══════════════════════════════════════════════════════════════
           MỤC 396 (29/08/2026) — BỎ CỘT GHIM, BẢNG CHỈ HIỆN TỪ 768px

           Cột ghim `fixed` chiếm chỗ CỐ ĐỊNH và không co theo màn hình.
           Trên màn 390px, mấy cột ghim cộng lại đã hết chỗ, nên vùng
           cuộn còn lại bằng 0 và vuốt ngang không có tác dụng — người
           dùng vuốt mà màn hình không nhúc nhích.

           Đã bỏ 4 cột ghim ở bảng này.
           ══════════════════════════════════════════════════════════ -->
      <!-- ══ MỤC 728 (01/11/2026) — G5 LỚP 2 RENTAL: BẢNG 16 CỘT ➜ 9 CỘT + NGĂN CHI TIẾT ══
           s68 01/11: "làm tiếp 4 và 5 luôn" (đề xuất số 4: gọn bảng Rental).
           Giữ trên bảng 9 thứ dùng để QUYẾT ĐỊNH (mã, khách + SĐT, BĐS, giá thuê, nợ, hết hạn, trạng
           thái, thao tác). Các cột chỉ để TRA (mã khách, tên nhóm, liên hệ, loại HĐ, tiền cọc, ngày bắt
           đầu) chuyển vào NGĂN CHI TIẾT — bấm vào dòng là mở.
           VÌ SAO không giữ 16 cột + kéo ngang: trên màn 13–14 inch phải kéo mới thấy cột Nợ / Trạng
           thái — đúng 2 cột hay nhìn nhất. Không bỏ thông tin nào: ngăn chi tiết hiện đủ các trường.
           Sắp xếp theo Mã HĐ / Khách thuê giữ nguyên (sortable="custom"). -->
      <el-table v-if="hienBang" v-loading="loading" :data="paginatedData" style="width: 100%" class="flex-1 bang-hd" height="100%"
                @sort-change="handleSortChange" @row-click="moChiTiet">
        <el-table-column label="STT" width="52" align="center">
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="contract_id" label="Mã HĐ" min-width="150" sortable="custom">
          <template #default="{ row }">
            <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{{ row.contract_id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="customer_name" label="Khách thuê" min-width="170" sortable="custom">
          <template #default="{ row }">
            <div class="font-bold text-gray-800 dark:text-gray-100 leading-tight">{{ row.customer_name }}</div>
            <div v-if="row.number_phone" class="text-xs text-gray-500 dark:text-gray-400">{{ row.number_phone }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="real_estate_id" label="Mã BĐS" min-width="100" />
        <el-table-column label="Giá thuê (Tháng)" min-width="125" align="right">
          <template #default="{ row }">
            <span class="font-semibold" :class="mauSo(row.monthly_rental)">{{ formatCurrency(row.monthly_rental) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Nợ tiền thuê" min-width="115" align="right">
          <template #default="{ row }">
            <span :class="row.rental_debt > 0 ? 'text-red-500 font-semibold' : 'text-gray-600 dark:text-gray-400'">
              {{ formatCurrency(row.rental_debt) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Ngày kết thúc" width="100" align="center">
          <template #default="{ row }">
            <span class="text-xs text-gray-600 dark:text-gray-400">{{ row.end_rental }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" effect="light" size="small" round>
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Actions — @click.stop: bấm "…" không mở ngăn chi tiết của dòng. -->
        <el-table-column label="Thao tác" width="60" align="center">
          <template #default="{ row }">
            <div @click.stop>
              <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
                <el-button link type="info" class="p-1">
                  <el-icon class="text-xl"><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">Chỉnh sửa</el-dropdown-item>
                    <el-dropdown-item command="schedule">Lên lịch hẹn</el-dropdown-item>
                    <el-dropdown-item command="delete" divided class="!text-red-500">Xóa</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
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
        <!-- MỤC 728 — thẻ GỌN: 14 dòng ➜ 3 dòng (mã + trạng thái · khách + SĐT · giá / nợ / hết hạn).
             Bấm thẻ mở ngăn chi tiết đủ các trường. Lời ghi MỤC 397 bên trên ("mỗi ô là nguyên văn
             cột của bảng") vẫn đúng cho các ô CÒN hiện; các trường còn lại nằm ở ngăn chi tiết. -->
        <div v-if="paginatedData.length > 0" class="grid grid-cols-1 gap-3">
          <div
            v-for="(row, i) in (paginatedData as any[])"
            :key="row.id || row.contract_id || i"
            class="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-sm cursor-pointer"
            @click="moChiTiet(row)"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400 min-w-0 break-words">{{ row.contract_id }}</span>
              <div class="shrink-0 flex items-center gap-1" @click.stop>
                <el-tag :type="getStatusTag(row.status)" effect="light" size="small" round>
                  {{ getStatusText(row.status) }}
                </el-tag>
                <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
                  <el-button link type="info" class="p-1">
                    <el-icon class="text-xl"><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">Chỉnh sửa</el-dropdown-item>
                      <el-dropdown-item command="schedule">Lên lịch hẹn</el-dropdown-item>
                      <el-dropdown-item command="delete" divided class="!text-red-500">Xóa</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            <div class="mt-1 text-sm">
              <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.customer_name }}</span>
              <span v-if="row.number_phone" class="text-gray-500 dark:text-gray-400"> · {{ row.number_phone }}</span>
            </div>
            <div class="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div>
                <div class="text-gray-400 dark:text-gray-500">Giá thuê</div>
                <div class="font-semibold tabular-nums" :class="mauSo(row.monthly_rental)">{{ soGon(row.monthly_rental) }}</div>
              </div>
              <div>
                <div class="text-gray-400 dark:text-gray-500">Nợ</div>
                <div class="tabular-nums" :class="row.rental_debt > 0 ? 'text-red-500 font-semibold' : 'text-gray-600 dark:text-gray-400'">{{ soGon(row.rental_debt) }}</div>
              </div>
              <div class="text-right">
                <div class="text-gray-400 dark:text-gray-500">Hết hạn</div>
                <div class="text-gray-700 dark:text-gray-200">{{ row.end_rental || '—' }}</div>
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
      :title="isEdit ? 'CHỈNH SỬA HỢP ĐỒNG CHO THUÊ' : 'TẠO HỢP ĐỒNG MỚI'"
      width="900px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="160px" class="mt-2 compact-form">
          <!-- THÔNG TIN HỢP ĐỒNG -->
          <div class="mb-6">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin hợp đồng
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã Hợp đồng" prop="contract_id">
                  <el-input v-model="form.contract_id" placeholder="VD: HĐ-2026-001..." :disabled="isEdit" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Bất động sản thuê" prop="real_estate_id">
                  <el-select
                    v-model="form.real_estate_id"
                    placeholder="Chọn BĐS thuê..."
                    :filterable="choLocDuoc"
                    clearable
                    style="width: 100%"
                    class="highlight-select"
                  >
                    <el-option
                      v-for="re in allRealEstates"
                      :key="re.id || re.real_estate_id"
                      :label="formatRealEstateLabel(re)"
                      :value="re.real_estate_id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Loại hợp đồng" prop="type_contract">
                  <el-input v-model="form.type_contract" placeholder="VD: Dài hạn, Ngắn hạn..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Trạng thái" prop="status">
                  <el-select v-model="form.status" style="width: 100%" class="highlight-select">
                    <el-option label="Đang thuê" value="active" />
                    <el-option label="Hết hạn" value="expired" />
                    <el-option label="Đã hủy" value="cancelled" />
                    <el-option label="Nợ xấu" value="bad_debt" />
                    <el-option label="Bản nháp" value="draft" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- THÔNG TIN KHÁCH THUÊ -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
                Thông tin khách thuê
              </h4>
              <div v-if="!isEdit" class="flex items-center gap-2">
                <span class="text-xs font-semibold text-gray-600 dark:text-gray-400">Tạo mới khách hàng:</span>
                <el-switch v-model="form.create_new_customer" active-text="Có" inactive-text="Không" />
              </div>
            </div>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã khách hàng" prop="customer_code">
                  <el-select
                    v-model="form.customer_code"
                    placeholder="Chọn hoặc nhập mã KH..."
                    :filterable="choLocDuoc"
                    allow-create
                    default-first-option
                    clearable
                    style="width: 100%"
                    class="highlight-select"
                  >
                    <el-option
                      v-for="cust in allCustomers"
                      :key="cust.id || cust.customer_id"
                      :label="`${cust.customer_id}${cust.customer_name ? ' - ' + cust.customer_name : ''}`"
                      :value="cust.customer_id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tên khách thuê" prop="customer_name">
                  <el-input v-model="form.customer_name" placeholder="Tên cá nhân/tổ chức thuê..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tên nhóm" prop="group_name">
                  <el-input v-model="form.group_name" placeholder="Tên nhóm..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Số điện thoại" prop="number_phone">
                  <el-input v-model="form.number_phone" placeholder="SĐT liên hệ..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Liên hệ" prop="contact_info">
                  <el-input v-model="form.contact_info" placeholder="Telegram @username..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- GIÁ TRỊ & THỜI HẠN -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-rose-500 rounded-full"></span>
              Giá trị & Thời hạn
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Giá thuê / Tháng" prop="monthly_rental">
                  <el-input v-model="form.monthly_rentalText" placeholder="Nhập giá thuê..." @input="handleMonthlyRentalInput">
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tiền đặt cọc" prop="deposit">
                  <el-input v-model="form.depositText" placeholder="Nhập tiền đặt cọc..." @input="handleDepositInput">
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Nợ tiền thuê" prop="rental_debt">
                  <el-input v-model="form.rental_debtText" placeholder="Nhập công nợ nếu có..." @input="handleRentalDebtInput">
                    <template #suffix><span class="text-xs text-gray-400">VNĐ</span></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Ngày bắt đầu" prop="start_rental">
                  <el-date-picker :editable="false"
                    v-model="form.start_rental"
                    type="date"
                    placeholder="Chọn ngày"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ngày kết thúc" prop="end_rental">
                  <el-date-picker :editable="false"
                    v-model="form.end_rental"
                    type="date"
                    placeholder="Chọn ngày"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <!-- ══════════════════════════════════════════════════════════
                 MỤC 612 (12/09/2026) — Ô GHI CHÚ CHO HỢP ĐỒNG THUÊ

                 Kế toán Tiến Nga 12/09: *"chỗ mục hợp đồng thuê. có thể
                 cho thêm mục ghi chú k A."*

                 Cột `notes` đã có sẵn trong `app/models/rental.py` dòng
                 100 và trong schema — chỉ là web chưa bày ra. Không cần
                 đổi cấu trúc database.

                 🔴 NHƯNG CỘT NÀY KHÔNG PHẢI CHỖ TRỐNG. Lời ghi ngay tại
                 dòng 100 của model: *"Ghi Chú (chứa cả cờ
                 [SKIP_RENTAL: MM/YYYY], [BLACKLIST])"*. Bot đọc hai cờ đó
                 để quyết định có nhắc tiền hay không —
                 `scheduler.py` dòng 1689–1691 bỏ qua kỳ nào có
                 `[SKIP_RENTAL: MM/YYYY]`.

                 Cho gõ đè thẳng lên cột đó thì sửa một dòng ghi chú là
                 XOÁ MẤT CỜ, và hợp đồng đã bấm "Lưu sổ" bị nhắc lại từ
                 đầu. Nên ô này chỉ nhận phần CHỮ CỦA NGƯỜI; cờ hệ thống
                 được tách ra lúc mở và ghép lại lúc lưu — xem
                 `tachGhiChu` và `ghepGhiChu` trong phần script.
                 ══════════════════════════════════════════════════════════ -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Ghi chú">
                  <el-input
                    v-model="form.notesNguoiDung"
                    type="textarea"
                    :rows="3"
                    maxlength="500"
                    show-word-limit
                    placeholder="Ghi chú về hợp đồng: thoả thuận riêng, tình trạng bàn giao, hẹn sửa chữa..."
                  />
                </el-form-item>
                <div v-if="form.notesCoHeThong"
                     class="-mt-3 mb-2 text-[11px] text-amber-600 dark:text-amber-400">
                  ⓘ Hợp đồng này có đánh dấu của hệ thống
                  (<code>{{ form.notesCoHeThong }}</code>). Đánh dấu đó được
                  giữ nguyên, không bị ghi chú của bạn xoá mất.
                </div>
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

    <!-- ══ MỤC 728 — NGĂN CHI TIẾT HỢP ĐỒNG (đủ các trường của bảng cũ) ══
         Điện thoại: phủ cả màn (size 100%). Máy tính: 440px bên phải, bảng vẫn thấy phía sau.
         Nút ở chân ngăn gọi ĐÚNG các hàm của menu "…" (handleCommand) — không có đường thứ hai. -->
    <el-drawer v-model="ngan.mo" :size="laManHep ? '100%' : '440px'" direction="rtl"
               :title="ngan.hd ? 'Hợp đồng ' + ngan.hd.contract_id : ''">
      <template v-if="ngan.hd">
        <div class="mb-4 flex flex-wrap items-center gap-2">
          <el-tag :type="getStatusTag(ngan.hd.status)" effect="light" round>{{ getStatusText(ngan.hd.status) }}</el-tag>
          <span v-if="ngan.hd.rental_debt > 0" class="text-sm text-red-500 font-semibold">Đang nợ {{ formatCurrency(ngan.hd.rental_debt) }}</span>
        </div>
        <div v-for="nhom in nhomChiTiet" :key="nhom.ten" class="mb-5">
          <div class="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">{{ nhom.ten }}</div>
          <div class="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
            <div v-for="d in nhom.dong" :key="d[0]" class="flex justify-between gap-3 px-3 py-2 text-sm">
              <span class="text-gray-500 dark:text-gray-400 shrink-0">{{ d[0] }}</span>
              <!-- Chỉ thành link gọi khi có ≥ 6 chữ số — dữ liệu thật có chữ "Cập nhật sau". -->
              <a v-if="d[2] === 'sdt' && /\d{6,}/.test(String(d[1]))" :href="'tel:' + String(d[1]).replace(/[^\d+]/g, '')" class="text-right break-words min-w-0 text-indigo-600 dark:text-indigo-400">{{ d[1] }}</a>
              <span v-else class="text-right break-words min-w-0 text-gray-800 dark:text-gray-100" :class="d[2]">{{ d[1] || '—' }}</span>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex flex-wrap justify-end gap-2">
          <el-button type="danger" plain @click="lamTuNgan('delete')">Xóa</el-button>
          <el-button @click="lamTuNgan('schedule')">Lên lịch hẹn</el-button>
          <el-button type="primary" @click="lamTuNgan('edit')">Chỉnh sửa</el-button>
        </div>
      </template>
    </el-drawer>

    <!-- Schedule Notification Modal -->
    <ScheduledNotificationModal
      v-model="scheduleModalVisible"
      module-key="rental"
      :prefill-data="schedulePrefill"
      @saved="scheduleModalVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { mauSo } from '@/utils/mauSo'
import { Search, MoreFilled, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { rentalService } from '@/api/rentalService'
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

interface Contract {
  id: string
  customer_id: string
  customer_code: string
  customer_name: string
  group_name: string
  contact_info: string
  number_phone: string
  contract_id: string
  real_estate_id: string
  type_contract: string
  start_rental: string
  end_rental: string
  deposit: number
  monthly_rental: number
  rental_debt: number
  status: string
}

const loading = ref(false)
const searchQuery = ref('')
const filterStatus = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Active reactive contracts list state
const contracts = ref<Contract[]>([])

// Filters & Search logic
const filteredContracts = computed(() => {
  return contracts.value.filter(c => {
    const query = searchQuery.value.toLowerCase().trim()
    if (!query) return true

    return (
      c.customer_name.toLowerCase().includes(query) ||
      c.contract_id.toLowerCase().includes(query) ||
      c.real_estate_id.toLowerCase().includes(query) ||
      c.customer_code.toLowerCase().includes(query) ||
      c.group_name.toLowerCase().includes(query)
    )
  })
})

const sortProp = ref('')
const sortOrder = ref('')

const handleSortChange = ({ prop, order }: { prop: string, order: string }) => {
  sortProp.value = prop
  sortOrder.value = order
}

const sortedContracts = computed(() => {
  const result = [...filteredContracts.value]
  if (sortProp.value && sortOrder.value) {
    result.sort((a: any, b: any) => {
      const valA = a[sortProp.value] ?? ''
      const valB = b[sortProp.value] ?? ''
      const compare = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' })
      return sortOrder.value === 'ascending' ? compare : -compare
    })
  }
  return result
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedContracts.value.slice(start, end)
})

// Dialog Add/Edit State
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<any>(null)

const form = reactive({
  id: '',
  customer_id: '',
  customer_code: '',
  customer_name: '',
  group_name: '',
  contact_info: '',
  number_phone: '',
  contract_id: '',
  real_estate_id: '',
  type_contract: '',
  monthly_rental: 0,
  monthly_rentalText: '',
  deposit: 0,
  depositText: '',
  rental_debt: 0,
  rental_debtText: '',
  start_rental: '',
  end_rental: '',
  status: 'active',
  // MỤC 612 — tách làm hai: phần người gõ, và phần cờ hệ thống giữ hộ.
  notesNguoiDung: '',
  notesCoHeThong: '',
  create_new_customer: true
})

const rules = reactive({
  contract_id: [{ required: true, message: 'Vui lòng nhập mã hợp đồng', trigger: 'blur' }],
  customer_name: [{ required: true, message: 'Vui lòng nhập tên khách thuê', trigger: 'blur' }],
  real_estate_id: [{ required: true, message: 'Vui lòng nhập mã BĐS thuê', trigger: 'blur' }],
  monthly_rental: [{ required: true, message: 'Vui lòng nhập giá thuê', trigger: 'blur' }],
  deposit: [{ required: true, message: 'Vui lòng nhập tiền cọc', trigger: 'blur' }],
  start_rental: [{ required: true, message: 'Vui lòng chọn ngày bắt đầu', trigger: 'change' }],
  end_rental: [{ required: true, message: 'Vui lòng chọn ngày kết thúc', trigger: 'change' }],
  status: [{ required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change' }]
})

// ══ MỤC 728 (01/11/2026) — NGĂN CHI TIẾT + SỐ GỌN CHO THẺ ══
const ngan = reactive<{ mo: boolean; hd: Contract | null }>({ mo: false, hd: null })
const moChiTiet = (row: Contract) => { ngan.hd = row; ngan.mo = true }
// Đóng ngăn TRƯỚC rồi mới mở hộp sửa / hỏi xoá — hai lớp phủ chồng nhau trên điện thoại
// làm nút của hộp thoại nằm dưới ngăn, bấm không được.
const lamTuNgan = (cmd: string) => {
  const hd = ngan.hd
  ngan.mo = false
  if (hd) handleCommand(cmd, hd)
}
// Mỗi dòng: [nhãn, giá trị, lớp chữ | 'sdt']. Đủ các trường của bảng cũ (STT không tính).
const nhomChiTiet = computed(() => {
  const h = ngan.hd
  if (!h) return []
  return [
    { ten: 'Hợp đồng', dong: [
      ['Mã hợp đồng', h.contract_id, 'font-mono font-bold'],
      ['Loại hợp đồng', h.type_contract, ''],
      ['Mã BĐS', h.real_estate_id, ''],
      ['Ngày bắt đầu', h.start_rental, ''],
      ['Ngày kết thúc', h.end_rental, ''],
    ] },
    { ten: 'Tiền', dong: [
      ['Giá thuê / tháng', formatCurrency(h.monthly_rental), 'font-semibold'],
      ['Tiền cọc', formatCurrency(h.deposit), ''],
      ['Nợ tiền thuê', formatCurrency(h.rental_debt), h.rental_debt > 0 ? 'text-red-500 font-semibold' : ''],
    ] },
    { ten: 'Khách thuê', dong: [
      ['Tên', h.customer_name, 'font-bold'],
      ['Mã khách', h.customer_code, ''],
      ['Số điện thoại', h.number_phone, 'sdt'],
      ['Liên hệ', h.contact_info, ''],
      ['Tên nhóm', h.group_name, ''],
    ] },
  ]
})
// Thẻ điện thoại chỉ rộng ~110px mỗi ô: bỏ chữ "VNĐ" (nhãn ô đã nói là tiền).
const soGon = (val: number) => new Intl.NumberFormat('vi-VN').format(val || 0)

const handleCommand = (cmd: string, row: Contract) => {
  if (cmd === 'edit') {
    openEditDialog(row)
  } else if (cmd === 'delete') {
    handleDelete(row)
  } else if (cmd === 'schedule') {
    openScheduleDialog(row)
  }
}

// Schedule notification
const scheduleModalVisible = ref(false)
const schedulePrefill = ref<any>(null)

const openScheduleDialog = (row: Contract) => {
  schedulePrefill.value = {
    notify_type: 'rental_payment',
    reference_id: row.contract_id,
    reference_name: row.customer_name,
    message_template: `Nhắc nhở đóng tiền thuê\nHợp đồng: ${row.contract_id}\nKhách hàng: ${row.customer_name}\nBĐS: ${row.real_estate_id}`,
  }
  scheduleModalVisible.value = true
}

const getStatusTag = (status: string) => {
  if (status === 'active') return 'success'
  if (status === 'expired') return 'danger'
  if (status === 'cancelled') return 'info'
  if (status === 'bad_debt') return 'warning'
  return 'info'
}

const getStatusText = (status: string) => {
  if (status === 'active') return 'Đang thuê'
  if (status === 'expired') return 'Hết hạn'
  if (status === 'cancelled') return 'Đã hủy'
  if (status === 'bad_debt') return 'Nợ xấu'
  if (status === 'draft') return 'Bản nháp'
  return status || 'Chưa rõ'
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('vi-VN').format(val) + ' VNĐ'
}

const handleMonthlyRentalInput = (val: string) => {
  const numericVal = val.replace(/[^0-9]/g, '')
  const num = parseInt(numericVal, 10)
  if (!isNaN(num)) {
    form.monthly_rental = num
    form.monthly_rentalText = new Intl.NumberFormat('vi-VN').format(num)
  } else {
    form.monthly_rental = 0
    form.monthly_rentalText = ''
  }
}

const handleDepositInput = (val: string) => {
  const numericVal = val.replace(/[^0-9]/g, '')
  const num = parseInt(numericVal, 10)
  if (!isNaN(num)) {
    form.deposit = num
    form.depositText = new Intl.NumberFormat('vi-VN').format(num)
  } else {
    form.deposit = 0
    form.depositText = ''
  }
}

const handleRentalDebtInput = (val: string) => {
  const numericVal = val.replace(/[^0-9]/g, '')
  const num = parseInt(numericVal, 10)
  if (!isNaN(num)) {
    form.rental_debt = num
    form.rental_debtText = new Intl.NumberFormat('vi-VN').format(num)
  } else {
    form.rental_debt = 0
    form.rental_debtText = ''
  }
}

const allCustomers = ref<any[]>([])
const allRealEstates = ref<any[]>([])

const fetchAllCustomers = async () => {
  try {
    allCustomers.value = await rentalService.getRentalCustomers()
  } catch (error) {
    console.error('Failed to fetch customers list:', error)
  }
}

const fetchAllRealEstates = async () => {
  try {
    allRealEstates.value = await rentalService.getRealEstates()
  } catch (error) {
    console.error('Failed to fetch real estates list:', error)
  }
}

const getRealEstateStatusText = (status: string) => {
  if (!status) return '—'
  const s = status.toLowerCase().trim()
  if (s === 'living' || s === 'đang ở') return 'Đang ở'
  if (s === 'rented' || s === 'occupied' || s === 'cho thuê' || s === 'đang cho thuê') return 'Đang cho thuê'
  if (s === 'self_exploited' || s === 'tự khai thác') return 'Tự khai thác'
  if (s === 'vacant' || s === 'để trống') return 'Để trống'
  if (s === 'installment' || s === 'thanh toán góp') return 'Thanh toán góp'
  if (s === 'legal_issues' || s === 'vướng pháp lý') return 'Vướng pháp lý'
  if (s === 'sold' || s === 'đã bán') return 'Đã bán'
  if (s === 'selling' || s === 'đang bán') return 'Đang bán'
  if (s === 'maintenance' || s === 'bảo trì') return 'Bảo trì'
  return status
}

const formatRealEstateLabel = (re: any) => {
  const statusText = getRealEstateStatusText(re.status)
  const addrText = re.address ? ` - ${re.address}` : ''
  return `${re.real_estate_id}${addrText} (${statusText})`
}

// Watch customer code to auto-populate fields
watch(() => form.customer_code, (newCode) => {
  if (!newCode) return
  const code = newCode.trim().toLowerCase()
  if (!code) return

  const found = allCustomers.value.find(cust =>
    cust.customer_id && cust.customer_id.toLowerCase().trim() === code
  )
  if (found) {
    form.customer_id = found.id // Database UUID
    form.customer_name = found.customer_name || ''
    form.group_name = found.group_name || ''
    form.number_phone = found.number_phone || ''
    form.contact_info = found.contact_info || ''
  }
})

const cleanDate = (d?: string) => {
  if (!d || d.trim() === '') return null
  return d
}

const openAddDialog = () => {
  fetchAllCustomers()
  fetchAllRealEstates()
  isEdit.value = false
  form.id = ''
  form.customer_id = ''
  form.customer_code = ''
  form.customer_name = ''
  form.group_name = ''
  form.contact_info = ''
  form.number_phone = ''
  form.contract_id = ''
  form.real_estate_id = ''
  form.type_contract = ''
  form.monthly_rental = 0
  form.monthly_rentalText = ''
  form.deposit = 0
  form.depositText = ''
  form.rental_debt = 0
  form.rental_debtText = ''
  form.start_rental = new Date().toISOString().substring(0, 10)
  form.end_rental = ''
  form.status = 'active'
  // MỤC 612 — dọn sạch cả hai phần ghi chú. Bỏ sót thì hợp đồng MỚI mang
  // theo ghi chú và cờ của hợp đồng vừa xem trước đó.
  form.notesNguoiDung = ''
  form.notesCoHeThong = ''
  form.create_new_customer = true
  dialogVisible.value = true
}

/**
 * ══ MỤC 612 (12/09/2026) — TÁCH CỜ HỆ THỐNG RA KHỎI GHI CHÚ ══
 *
 * Cột `notes` của hợp đồng thuê chứa LẪN hai thứ:
 *   · chữ của người nhập
 *   · cờ hệ thống: `[SKIP_RENTAL: MM/YYYY]` và `[BLACKLIST]`
 *
 * Bot đọc cờ để quyết định có nhắc tiền hay không (`scheduler.py` dòng
 * 1689–1691). Người sửa ghi chú mà cờ biến mất là hợp đồng đã bấm
 * "Lưu sổ" bị nhắc lại từ đầu — và không có gì báo.
 *
 * 🔴 BẮT MỌI CỜ `[...]` Ở ĐẦU CHUỖI, KHÔNG chỉ hai cái đang biết. Mai kia
 * ai thêm cờ thứ ba mà quên sửa chỗ này thì cờ đó cũng được giữ, thay vì
 * âm thầm bị xoá. Chỉ cần nó theo đúng quy ước: dấu ngoặc vuông, nằm ở
 * đầu, viết HOA.
 *
 * ⚠️ Cố ý KHÔNG bắt `[...]` nằm giữa câu. Người ta viết "khách hẹn trả
 * [tháng 3]" là chuyện bình thường; coi đó là cờ hệ thống rồi giữ lại khi
 * họ xoá mới là làm sai ý họ.
 */
const MAU_CO_HE_THONG = /^(\s*\[[A-Z_]+(?::[^\]]*)?\]\s*)+/

const tachGhiChu = (notes: string | null | undefined) => {
  const chuoi = String(notes || '')
  const khop = chuoi.match(MAU_CO_HE_THONG)
  return {
    co: khop ? khop[0].trim() : '',
    chu: khop ? chuoi.slice(khop[0].length).trim() : chuoi.trim(),
  }
}

const ghepGhiChu = (co: string, chu: string) => {
  const a = String(co || '').trim()
  const b = String(chu || '').trim()
  if (a && b) return `${a} ${b}`
  return a || b
}

const openEditDialog = (row: Contract) => {
  fetchAllCustomers()
  fetchAllRealEstates()
  isEdit.value = true
  form.id = row.id
  form.customer_id = row.customer_id
  form.customer_code = row.customer_code
  form.customer_name = row.customer_name
  form.group_name = row.group_name
  form.contact_info = row.contact_info
  form.number_phone = row.number_phone
  form.contract_id = row.contract_id
  form.real_estate_id = row.real_estate_id
  form.type_contract = row.type_contract
  form.monthly_rental = row.monthly_rental
  form.monthly_rentalText = new Intl.NumberFormat('vi-VN').format(row.monthly_rental)
  form.deposit = row.deposit
  form.depositText = new Intl.NumberFormat('vi-VN').format(row.deposit)
  form.rental_debt = row.rental_debt
  form.rental_debtText = new Intl.NumberFormat('vi-VN').format(row.rental_debt)
  form.start_rental = row.start_rental
  form.end_rental = row.end_rental
  form.status = row.status
  // MỤC 612 — bóc cờ ra, ô nhập chỉ hiện phần chữ của người.
  // 🔴 Thiếu bước này thì kế toán nhìn thấy "[SKIP_RENTAL: 09/2026]" trong
  // ô ghi chú, tưởng rác rồi xoá đi — và hợp đồng bị nhắc lại.
  {
    const tach = tachGhiChu((row as any).notes)
    form.notesNguoiDung = tach.chu
    form.notesCoHeThong = tach.co
  }
  form.create_new_customer = false
  dialogVisible.value = true
}

const updateRealEstateStatus = async (realEstateId: string, targetStatus: string) => {
  if (!realEstateId) return
  const foundRE = allRealEstates.value.find(re => re.real_estate_id === realEstateId)
  if (foundRE) {
    try {
      await rentalService.updateRealEstates([{
        id: foundRE.id,
        real_estate_id: foundRE.real_estate_id,
        address: foundRE.address,
        start_buy: foundRE.start_buy,
        end_buy: foundRE.end_buy,
        total_cost: foundRE.total_cost,
        real_estate_cost: foundRE.real_estate_cost,
        construction_cost: foundRE.construction_cost,
        furniture_cost: foundRE.furniture_cost,
        sale_cost: foundRE.sale_cost,
        contributed_cost: foundRE.contributed_cost,
        monthly_interest_rate: foundRE.monthly_interest_rate,
        mining_profit: foundRE.mining_profit,
        rental_profit: foundRE.rental_profit,
        start_sale: foundRE.start_sale,
        end_sale: foundRE.end_sale,
        profit_after_tax: foundRE.profit_after_tax,
        profit_after_sale: foundRE.profit_after_sale,
        status: targetStatus,
        note: foundRE.note,
        current_estimated: foundRE.current_estimated
      }])
    } catch (err) {
      console.error(`Lỗi khi tự động chuyển trạng thái BĐS sang ${targetStatus}:`, err)
    }
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      try {
        // Tự động tạo khách hàng mới vào DB nếu toggle create_new_customer là true và tạo mới hợp đồng
        if (!isEdit.value && form.create_new_customer && form.customer_code) {
          const code = form.customer_code.trim().toLowerCase()
          const existingCust = allCustomers.value.find(cust =>
            cust.customer_id && cust.customer_id.toLowerCase().trim() === code
          )

          if (existingCust) {
            form.customer_id = existingCust.id
          } else {
            try {
              const addedCustomers = await rentalService.addRentalCustomers([{
                customer_id: form.customer_code,
                customer_name: form.customer_name || 'Khách thuê mới',
                group_name: form.group_name || '',
                number_phone: form.number_phone || '',
                contact_info: form.contact_info || ''
              }])
              if (addedCustomers && addedCustomers.length > 0) {
                form.customer_id = addedCustomers[0].id
                ElMessage.success(`Đã tự động tạo khách hàng mới "${form.customer_name || form.customer_code}" vào DB!`)
                await fetchAllCustomers()
              }
            } catch (custErr: any) {
              console.error('Lỗi khi tự động tạo mới khách hàng:', custErr)
              ElMessage.warning('Không thể tạo mới khách hàng vào DB, tiếp tục lưu hợp đồng...')
            }
          }
        }

        const payload = {
          id: isEdit.value ? form.id : undefined,
          customer_id: form.customer_id || null,
          contract_id: form.contract_id || null,
          real_estate_id: form.real_estate_id || null,
          type_contract: form.type_contract || null,
          start_rental: cleanDate(form.start_rental),
          end_rental: cleanDate(form.end_rental),
          deposit: Number(form.deposit) || 0,
          monthly_rental: Number(form.monthly_rental) || 0,
          rental_debt: Number(form.rental_debt) || 0,
          status: form.status || 'active',
          // MỤC 612 — ghép lại cờ hệ thống + chữ người dùng trước khi gửi.
          // 🔴 Gửi thẳng `notesNguoiDung` là xoá cờ.
          notes: ghepGhiChu(form.notesCoHeThong, form.notesNguoiDung) || null
        }

        if (isEdit.value) {
          await rentalService.updateRentals([payload])

          // Nếu trạng thái HĐ đổi sang "cancelled" (Đã hủy) hoặc "expired" (Hết hạn) -> Chuyển BĐS sang "vacant" (Để trống)
          if (form.status === 'cancelled' || form.status === 'expired') {
            await updateRealEstateStatus(form.real_estate_id, 'vacant')
          } else if (form.status === 'active') {
            await updateRealEstateStatus(form.real_estate_id, 'rented')
          }

          ElMessage.success('Cập nhật thông tin hợp đồng thành công!')
        } else {
          await rentalService.addRentals([payload])

          // Tự động chuyển trạng thái BĐS sang "vacant" (Để trống) nếu HĐ tạo ở trạng thái Hủy/Hết hạn, ngược lại chuyển "rented" (Đang cho thuê)
          if (form.status === 'cancelled' || form.status === 'expired') {
            await updateRealEstateStatus(form.real_estate_id, 'vacant')
          } else {
            await updateRealEstateStatus(form.real_estate_id, 'rented')
          }

          ElMessage.success('Tạo hợp đồng mới thành công!')
        }

        dialogVisible.value = false
        await fetchContracts()
        await fetchAllRealEstates()
      } catch (error: any) {
        ElMessage.error(error.message || (isEdit.value ? 'Lỗi khi cập nhật hợp đồng' : 'Lỗi khi tạo hợp đồng mới'))
      } finally {
        loading.value = false
      }
    }
  })
}

const handleDelete = async (row: Contract) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa hợp đồng "${row.contract_id}"? Hành động này không thể hoàn tác.`,
      'Xác nhận xóa hợp đồng',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy bỏ',
        type: 'warning'
      }
    )
    loading.value = true
    try {
      await rentalService.deleteRentals([row.id])
      if (row.real_estate_id) {
        await updateRealEstateStatus(row.real_estate_id, 'vacant')
      }
      ElMessage.success('Xóa hợp đồng thành công!')
      await fetchContracts()
      await fetchAllRealEstates()
    } catch (error: any) {
      ElMessage.error(error.message || 'Lỗi khi xóa hợp đồng')
    } finally {
      loading.value = false
    }
  } catch (err) {
    // cancelled
  }
}

const mapToContract = (item: any): Contract => {
  return {
    id: item.id,
    customer_id: item.customer_id || '',
    customer_code: item.customer_code || '',
    customer_name: item.customer_name || 'Chưa rõ',
    group_name: item.group_name || '',
    contact_info: item.contact_info || '',
    number_phone: item.number_phone || '',
    contract_id: item.contract_id || '',
    real_estate_id: item.real_estate_id || '',
    type_contract: item.type_contract || '',
    start_rental: item.start_rental || '',
    end_rental: item.end_rental || '',
    deposit: item.deposit || 0,
    monthly_rental: item.monthly_rental || 0,
    rental_debt: item.rental_debt || 0,
    status: item.status || 'draft'
  }
}

const fetchContracts = async () => {
  loading.value = true
  try {
    const data = await rentalService.getRentals(filterStatus.value)
    contracts.value = data.map(mapToContract)
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi tải danh sách hợp đồng')
  } finally {
    loading.value = false
  }
}

watch(filterStatus, () => {
  fetchContracts()
})

onMounted(() => {
  fetchContracts()
  fetchAllCustomers()
  fetchAllRealEstates()
})
</script>

<style scoped>
.rental-container {
  height: 100%;
}

.rental-container :deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}
/* MỤC 728 — dòng bảng bấm được (mở ngăn chi tiết) */
.rental-container :deep(.bang-hd .el-table__row) { cursor: pointer; }

html.dark .rental-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}
html.dark .rental-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}
html.dark .rental-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}
html.dark .rental-container :deep(.el-table .el-table-fixed-column--left),
html.dark .rental-container :deep(.el-table .el-table-fixed-column--right) {
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
