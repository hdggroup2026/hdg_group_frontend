<template>
  <div class="reminder-container h-full flex flex-col">
    <!-- Filter Bar -->
    <div class="flex flex-wrap justify-between items-center gap-4 mb-4 shrink-0">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Document Filter select -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tài liệu:</span>
          <el-select
            v-model="filterDocumentId"
            placeholder="Tất cả"
            clearable
            filterable
            class="w-72 custom-dark-input"
            style="width: 200px"
            @change="handleFilterChange"
          >
            <el-option label="Tất cả" value="" />
            <el-option
              v-for="doc in documentList"
              :key="doc.id"
              :label="`${doc.id} - ${doc.title}`"
              :value="doc.id"
            />
          </el-select>
        </div>

        <!-- Status Filter select -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái:</span>
          <el-select
            v-model="filterStatus"
            placeholder="Tất cả"
            clearable
            class="w-56 custom-dark-input"
            style="width: 130px"
            @change="handleFilterChange"
          >
            <el-option label="Tất cả" value="" />
            <el-option label="Hoạt động" value="ACTIVE" />
            <el-option label="Vô hiệu" value="INACTIVE" />
          </el-select>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <el-button :icon="Refresh" circle @click="fetchReminders" :loading="loading" />
        <el-button type="primary" @click="openAddDialog">
          <el-icon class="mr-1"><Plus /></el-icon> Thêm Lịch nhắc
        </el-button>
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
      <el-table v-if="hienBang" v-loading="loading" :data="paginatedReminders" style="width: 100%" class="flex-1" height="100%">
        <!-- STT Column -->
        <el-table-column label="STT" width="52" align="center">
          <template #default="{ $index }">
            <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>

        <!-- Mã tài liệu -->
        <el-table-column prop="document_id" label="Mã tài liệu" width="86" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono text-xs font-bold text-blue-650 dark:text-blue-400 select-all">{{ row.document_id || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Tên tài liệu -->
        <el-table-column label="Tên tài liệu liên kết" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-semibold text-gray-800 dark:text-gray-200">{{ getDocumentTitle(row.document_id) }}</span>
          </template>
        </el-table-column>

        <!-- Nội dung nhắc nhở -->
        <el-table-column prop="reminder_content" label="Nội dung thông báo" min-width="144" show-overflow-tooltip />

        <!-- Mốc thời gian -->
        <el-table-column label="Mốc thời gian nhắc" width="115" align="center">
          <template #default="{ row }">
            <div v-if="row.reminder_days_before !== null && row.reminder_days_before !== undefined" class="text-xs">
              Nhắc trước <strong class="text-blue-600 dark:text-blue-400">{{ row.reminder_days_before }}</strong> ngày
            </div>
            <div v-else-if="row.reminder_date" class="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
              Ngày {{ formatDate(row.reminder_date) }}
            </div>
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>

        <!-- Giờ nhắc -->
        <el-table-column prop="reminder_time" label="Giờ nhắc" width="72" align="center">
          <template #default="{ row }">
            <span class="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-450">{{ row.reminder_time || '09:00' }}</span>
          </template>
        </el-table-column>

        <!-- Tần suất -->
        <el-table-column prop="recurring_interval" label="Tần suất" width="86" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain" class="font-semibold">
              {{ getIntervalLabel(row.recurring_interval) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Telegram Group -->
        <el-table-column prop="telegram_group_id" label="Nhóm Telegram" width="94" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono text-xs text-gray-650 dark:text-gray-350 select-all">{{ row.telegram_group_id || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Đã thông báo -->
        <el-table-column prop="is_notified" label="Đã gửi?" width="72" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.is_notified ? 'success' : 'info'" effect="plain">
              {{ row.is_notified ? 'Đã gửi' : 'Chờ gửi' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Trạng thái -->
        <el-table-column prop="status" label="Trạng thái" width="86" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 'ACTIVE' ? 'success' : 'danger'" effect="dark" class="font-bold">
              {{ row.status === 'ACTIVE' ? 'Hoạt động' : 'Vô hiệu' }}
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
        <div v-if="paginatedReminders.length > 0" class="grid grid-cols-1 gap-4">
          <div
            v-for="(row, i) in paginatedReminders"
            :key="row.id || row.contract_id || i"
            class="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
              <div class="min-w-0 break-words">
                <span class="font-mono text-xs font-bold text-blue-650 dark:text-blue-400 select-all">{{ row.document_id || '—' }}</span>
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
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tên tài liệu liên kết:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-semibold text-gray-800 dark:text-gray-200">{{ getDocumentTitle(row.document_id) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Nội dung thông báo:</span>
                <span class="text-right break-words min-w-0">
                  {{ row.reminder_content }}
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Mốc thời gian nhắc:</span>
                <span class="text-right break-words min-w-0">
                  <div v-if="row.reminder_days_before !== null && row.reminder_days_before !== undefined" class="text-xs">
                                Nhắc trước <strong class="text-blue-600 dark:text-blue-400">{{ row.reminder_days_before }}</strong> ngày
                              </div>
                              <div v-else-if="row.reminder_date" class="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Ngày {{ formatDate(row.reminder_date) }}
                              </div>
                              <span v-else class="text-gray-400">—</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Giờ nhắc:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-450">{{ row.reminder_time || '09:00' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tần suất:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag size="small" type="info" effect="plain" class="font-semibold">
                                {{ getIntervalLabel(row.recurring_interval) }}
                              </el-tag>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Nhóm Telegram:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-mono text-xs text-gray-650 dark:text-gray-350 select-all">{{ row.telegram_group_id || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Đã gửi?:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag size="small" :type="row.is_notified ? 'success' : 'info'" effect="plain">
                                {{ row.is_notified ? 'Đã gửi' : 'Chờ gửi' }}
                              </el-tag>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Trạng thái:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag size="small" :type="row.status === 'ACTIVE' ? 'success' : 'danger'" effect="dark" class="font-bold">
                                {{ row.status === 'ACTIVE' ? 'Hoạt động' : 'Vô hiệu' }}
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
          :page-sizes="[10, 20, 50]"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredReminders.length"
        />
      </div>
    </div>

    <!-- Dialog: Add / Edit Reminder -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'CHỈNH SỬA LỊCH NHẮC NHỞ TÀI LIỆU' : 'TẠO MỚI LỊCH NHẮC NHỞ TÀI LIỆU'"
      width="850px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="180px" class="mt-2 compact-form">
          <!-- PHẦN 1: TÀI LIỆU & NỘI DUNG -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Đối tượng tài liệu &amp; Nội dung thông báo
            </h4>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Tài liệu liên kết" prop="document_id">
                  <el-select v-model="form.document_id" placeholder="Chọn tài liệu muốn cài đặt lịch..." filterable class="w-full">
                    <el-option
                      v-for="doc in documentList"
                      :key="doc.id"
                      :label="`[${doc.id}] ${doc.title} (${doc.document_code || 'Không số hiệu'})`"
                      :value="doc.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Nội dung nhắc nhở" prop="reminder_content">
                  <el-input v-model="form.reminder_content" type="textarea" :rows="3" placeholder="Nhập nội dung tin nhắn nhắc nhở (VD: Hợp đồng bảo hiểm xe tải sắp hết hạn, đề nghị gia hạn...)" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: LÊN LỊCH THỜI GIAN -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Cấu hình thời gian gửi nhắc nhở
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Cách thức nhắc" prop="schedule_type">
                  <el-select v-model="scheduleType" placeholder="Chọn cách lên lịch..." class="w-full">
                    <el-option label="Trước ngày hết hạn" value="days_before" />
                    <el-option label="Vào ngày cụ thể" value="fixed_date" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item v-if="scheduleType === 'days_before'" label="Số ngày nhắc trước" prop="reminder_days_before">
                  <el-input-number v-model="form.reminder_days_before" :min="1" :max="365" class="!w-full" />
                </el-form-item>
                <el-form-item v-else label="Ngày nhắc" prop="reminder_date">
                  <el-date-picker :editable="false" v-model="form.reminder_date" type="date" value-format="YYYY-MM-DD" placeholder="Chọn ngày gửi tin..." class="!w-full" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Giờ nhắc" prop="reminder_time">
                  <el-input v-model="form.reminder_time" placeholder="VD: 09:00, 15:30..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tần suất gửi" prop="recurring_interval">
                  <el-select v-model="form.recurring_interval" placeholder="Chọn tần suất..." class="w-full">
                    <el-option label="Một lần (ONCE)" value="ONCE" />
                    <el-option label="Hàng ngày (DAILY)" value="DAILY" />
                    <el-option label="Hàng tuần (WEEKLY)" value="WEEKLY" />
                    <el-option label="Hàng tháng (MONTHLY)" value="MONTHLY" />
                    <el-option label="Hàng năm (YEARLY)" value="YEARLY" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 3: ĐỊA CHỈ & TRẠNG THÁI -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-violet-650 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
              Thông tin nhận tin &amp; Trạng thái hoạt động
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Nhóm Telegram ID" prop="telegram_group_id">
                  <el-input v-model="form.telegram_group_id" placeholder="Nhập ID chat của nhóm Telegram..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Trạng thái lịch nhắc" prop="status">
                  <el-select v-model="form.status" placeholder="Chọn trạng thái..." class="w-full">
                    <el-option label="Đang hoạt động (ACTIVE)" value="ACTIVE" />
                    <el-option label="Tạm ngưng (INACTIVE)" value="INACTIVE" />
                  </el-select>
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

    <!-- Dialog: Detail Reminder -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT LỊCH NHẮC NHỞ"
      width="750px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedReminder" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto text-left">
        <!-- Visual Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-blue-500 dark:bg-blue-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32"><Calendar /></el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Lịch trình tự động gửi thông báo</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              Nhắc nhở: {{ getDocumentTitle(selectedReminder.document_id) }}
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <span class="text-gray-500 dark:text-gray-400">Tần suất: <strong class="text-gray-750 dark:text-gray-250">{{ getIntervalLabel(selectedReminder.recurring_interval) }}</strong></span>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span class="text-gray-500 dark:text-gray-400">Giờ nhắc: <strong>{{ selectedReminder.reminder_time }}</strong></span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã nhắc nhở (ID)</div>
            <div class="text-sm font-mono text-gray-600 dark:text-gray-400 select-all">{{ selectedReminder.id }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Liên kết tài liệu (ID)</div>
            <div class="text-sm font-mono text-blue-600 dark:text-blue-400 select-all font-bold">{{ selectedReminder.document_id }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mốc thời gian gửi</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200">
              <span v-if="selectedReminder.reminder_days_before !== null">Nhắc trước {{ selectedReminder.reminder_days_before }} ngày trước hạn</span>
              <span v-else-if="selectedReminder.reminder_date">Ngày cụ thể: {{ formatDate(selectedReminder.reminder_date) }}</span>
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Thời gian gửi trong ngày</div>
            <div class="text-sm text-gray-700 dark:text-gray-300 font-bold font-mono">{{ selectedReminder.reminder_time }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Telegram Group ID nhận tin</div>
            <div class="text-sm font-mono text-gray-750 dark:text-gray-300 select-all">{{ selectedReminder.telegram_group_id || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Trạng thái gửi tin</div>
            <div class="flex items-center gap-1.5">
              <el-tag size="small" :type="selectedReminder.is_notified ? 'success' : 'info'" effect="plain">
                {{ selectedReminder.is_notified ? 'Đã gửi thành công' : 'Đang đợi gửi lịch' }}
              </el-tag>
              <span class="text-xxs text-gray-400 font-mono" v-if="selectedReminder.last_notified_at">
                (Gửi lần cuối: {{ formatDateTime(selectedReminder.last_notified_at) }})
              </span>
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Trạng thái cấu hình</div>
            <div>
              <el-tag size="small" :type="selectedReminder.status === 'ACTIVE' ? 'success' : 'danger'" effect="dark" class="font-bold">
                {{ selectedReminder.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng' }}
              </el-tag>
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Thời điểm tạo lịch nhắc</div>
            <div class="text-sm font-mono text-gray-750 dark:text-gray-300">{{ formatDateTime(selectedReminder.created_at) }}</div>
          </div>
        </div>

        <div class="border-t border-gray-150 dark:border-gray-700 pt-4" v-if="selectedReminder.reminder_content">
          <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Nội dung tin nhắn thông báo</div>
          <div class="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
            {{ selectedReminder.reminder_content }}
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
import { ref, reactive, computed, onMounted } from 'vue'
import { Calendar, Refresh, Plus, MoreFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { documentService } from '@/api/documentService'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'

const { laManHep, hienBang, hienThe } = dungManHep()

const loading = ref(false)

const filterDocumentId = ref('')
const filterStatus = ref('')

const reminders = ref<any[]>([])
const documentList = ref<any[]>([])

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Helper: schedule Type toggle ('days_before' or 'fixed_date')
const scheduleType = ref('days_before')

// Fetch all reminders
const fetchReminders = async () => {
  loading.value = true
  currentPage.value = 1
  try {
    const data = await documentService.getDocumentReminders({
      document_id: filterDocumentId.value || undefined,
      status: filterStatus.value || undefined
    })
    reminders.value = data
  } catch (error: any) {
    console.error('API get-document-reminders failed:', error)
    ElMessage.error(error.message || 'Lỗi khi tải danh sách lịch nhắc nhở')
    reminders.value = []
  } finally {
    loading.value = false
  }
}

// Fetch documents list for selector dropdown
const fetchDocuments = async () => {
  try {
    const data = await documentService.getDocuments()
    documentList.value = data
  } catch (error: any) {
    console.error('API get-documents failed in Reminder:', error)
  }
}

const handleFilterChange = () => {
  fetchReminders()
}

// Computeds
const filteredReminders = computed(() => {
  return reminders.value
})

const paginatedReminders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredReminders.value.slice(start, end)
})

// Dialog States
const dialogVisible = ref(false)
const isEdit = ref(false)
const detailDialogVisible = ref(false)
const selectedReminder = ref<any | null>(null)
const formRef = ref<any>(null)

const form = reactive({
  id: '',
  document_id: '',
  telegram_group_id: '',
  reminder_days_before: 7 as number | null,
  reminder_date: '',
  reminder_time: '09:00',
  recurring_interval: 'ONCE',
  reminder_content: '',
  is_notified: false,
  status: 'ACTIVE'
})

const rules = reactive({
  document_id: [{ required: true, message: 'Vui lòng chọn tài liệu liên kết', trigger: 'change' }],
  reminder_content: [{ required: true, message: 'Vui lòng nhập nội dung thông báo', trigger: 'blur' }],
  status: [{ required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change' }]
})

// Resolve document title from ID
const getDocumentTitle = (id: string) => {
  const doc = documentList.value.find(d => d.id === id)
  return doc ? doc.title : id
}

// Action Handlers
const handleCommand = (cmd: string, row: any) => {
  if (cmd === 'detail') {
    selectedReminder.value = row
    detailDialogVisible.value = true
  } else if (cmd === 'edit') {
    openEditDialog(row)
  } else if (cmd === 'delete') {
    handleDelete(row)
  }
}

const openAddDialog = () => {
  isEdit.value = false
  form.id = ''
  form.document_id = ''
  form.telegram_group_id = ''
  form.reminder_days_before = 7
  form.reminder_date = ''
  form.reminder_time = '09:00'
  form.recurring_interval = 'ONCE'
  form.reminder_content = ''
  form.is_notified = false
  form.status = 'ACTIVE'
  scheduleType.value = 'days_before'
  dialogVisible.value = true
}

const openEditDialog = (row: any) => {
  isEdit.value = true
  form.id = row.id
  form.document_id = row.document_id || ''
  form.telegram_group_id = row.telegram_group_id || ''
  form.reminder_days_before = row.reminder_days_before
  form.reminder_date = row.reminder_date || ''
  form.reminder_time = row.reminder_time || '09:00'
  form.recurring_interval = row.recurring_interval || 'ONCE'
  form.reminder_content = row.reminder_content || ''
  form.is_notified = !!row.is_notified
  form.status = row.status || 'ACTIVE'

  if (row.reminder_days_before !== null && row.reminder_days_before !== undefined) {
    scheduleType.value = 'days_before'
  } else {
    scheduleType.value = 'fixed_date'
  }
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      
      // Map logic for schedule type toggle
      const daysBeforeVal = scheduleType.value === 'days_before' ? form.reminder_days_before : null
      const dateVal = scheduleType.value === 'fixed_date' ? form.reminder_date : null

      const payload = {
        id: form.id || undefined,
        document_id: form.document_id || null,
        telegram_group_id: form.telegram_group_id || null,
        reminder_days_before: daysBeforeVal,
        reminder_date: dateVal,
        reminder_time: form.reminder_time || '09:00',
        recurring_interval: form.recurring_interval,
        reminder_content: form.reminder_content,
        is_notified: form.is_notified,
        status: form.status
      }

      try {
        if (isEdit.value) {
          const editPayload = { ...payload, id: form.id }
          await documentService.updateDocumentReminders([editPayload])

          const idx = reminders.value.findIndex(s => s.id === form.id)
          if (idx !== -1) {
            // Keep timestamps
            reminders.value[idx] = { ...reminders.value[idx], ...editPayload }
          }
          ElMessage.success('Cập nhật lịch nhắc nhở thành công!')
        } else {
          const res = await documentService.addDocumentReminders([payload])
          if (res && res.length > 0) {
            reminders.value.unshift(res[0])
          } else {
            fetchReminders()
          }
          ElMessage.success('Thêm mới lịch nhắc nhở thành công!')
        }
        dialogVisible.value = false
      } catch (error: any) {
        ElMessage.error(error.message || 'Lỗi khi lưu thông tin lịch nhắc')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa lịch nhắc nhở này khỏi cơ sở dữ liệu?`,
      'Xác nhận xóa lịch nhắc nhở',
      {
        confirmButtonText: 'Xóa bỏ',
        cancelButtonText: 'Hủy',
        type: 'warning'
      }
    )
    loading.value = true
    await documentService.deleteDocumentReminders([row.id])

    reminders.value = reminders.value.filter(s => s.id !== row.id)
    ElMessage.success('Xóa lịch nhắc nhở thành công!')
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || 'Lỗi khi xóa lịch nhắc nhở')
    }
  } finally {
    loading.value = false
  }
}

// Helpers
const formatDate = (val: string) => {
  if (!val) return '—'
  const parts = val.split('-')
  if (parts.length === 3) {
    const [y, m, d] = parts
    return `${d}/${m}/${y}`
  }
  return val
}

const formatDateTime = (val: string) => {
  if (!val) return '—'
  try {
    const d = new Date(val)
    const dateStr = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear()
    const timeStr = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0')
    return `${dateStr} ${timeStr}`
  } catch {
    return val
  }
}

const getIntervalLabel = (interval: string) => {
  switch (interval) {
    case 'ONCE': return 'Một lần'
    case 'DAILY': return 'Hàng ngày'
    case 'WEEKLY': return 'Hàng tuần'
    case 'MONTHLY': return 'Hàng tháng'
    case 'YEARLY': return 'Hàng năm'
    default: return interval || 'ONCE'
  }
}

onMounted(() => {
  fetchDocuments()
  fetchReminders()
})
</script>

<style scoped>
html.dark .reminder-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .reminder-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .reminder-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

html.dark .reminder-container :deep(.el-table .el-table-fixed-column--left),
html.dark .reminder-container :deep(.el-table .el-table-fixed-column--right) {
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

.text-xxs {
  font-size: 0.7rem;
}
</style>
