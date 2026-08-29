<template>
  <div class="harvest-module-container h-full p-4 bg-gray-50 dark:bg-gray-900">
    <el-tabs v-model="activeTab" type="border-card" class="harvest-tabs h-full flex flex-col">
      
      <!-- Tab 1: Tài liệu -->
      <el-tab-pane name="document">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Document /></el-icon>
            <span>Tài liệu</span>
          </span>
        </template>
        
        <div class="document-tab-container h-full flex flex-col">
          <!-- Filter Bar -->
          <div class="flex flex-wrap justify-between items-center gap-4 mb-4 shrink-0">
            <div class="flex flex-wrap items-center gap-4">
              <!-- Status select -->
              <div class="flex items-center gap-2">
                <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái:</span>
                <el-select
                  v-model="filterStatus"
                  placeholder="Tất cả"
                  clearable
                  class="w-56 custom-dark-input"
                  style="width: 150px"
                  @change="handleStatusChange"
                >
                  <el-option label="Tất cả" value="" />
                  <el-option label="Đang hoạt động" value="ACTIVE" />
                  <el-option label="Đã hết hạn" value="EXPIRED" />
                  <el-option label="Vô hiệu" value="INACTIVE" />
                </el-select>
              </div>

              <!-- Category select -->
              <div class="flex items-center gap-2">
                <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Danh mục:</span>
                <el-select
                  v-model="filterCategory"
                  placeholder="Tất cả"
                  clearable
                  class="w-56 custom-dark-input"
                  style="width: 120px"
                  @change="handleCategoryChange"
                >
                  <el-option label="Tất cả" value="" />
                  <el-option label="Cá nhân" value="Cá nhân" />
                  <el-option label="Công việc" value="Công việc" />
                </el-select>
              </div>

              <!-- Search query input -->
              <div class="flex items-center gap-2">
                <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
                <el-input
                  v-model="searchQuery"
                  placeholder="Tiêu đề, số hiệu, người sở hữu..."
                  clearable
                  class="w-64 custom-dark-input"
                  style="width: 250px"
                />
              </div>
            </div>

            <div class="flex items-center gap-2">
              <el-button :icon="Refresh" circle @click="fetchDocuments" :loading="loading" />
              <el-button type="primary" @click="openAddDialog">
                <el-icon class="mr-1"><Plus /></el-icon> Thêm Tài liệu
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
            <el-table v-if="hienBang" v-loading="loading" :data="paginatedDocuments" style="width: 100%" class="flex-1" height="100%">
              <!-- STT Column -->
              <el-table-column label="STT" width="52" align="center">
                <template #default="{ $index }">
                  <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
                </template>
              </el-table-column>

              <!-- Mã tài liệu (ID) -->
              <el-table-column prop="id" label="Mã TL (ID)" width="94" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold select-all">{{ row.id }}</span>
                </template>
              </el-table-column>

              <!-- Số hiệu tài liệu -->
              <el-table-column prop="document_code" label="Số hiệu" width="94" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="font-bold text-gray-800 dark:text-gray-200 font-mono">{{ row.document_code || '—' }}</span>
                </template>
              </el-table-column>

              <!-- Tiêu đề / Tên -->
              <el-table-column prop="title" label="Tên tài liệu / Tiêu đề" min-width="130" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="font-bold text-gray-850 dark:text-gray-100">{{ row.title }}</span>
                </template>
              </el-table-column>

              <!-- Danh mục -->
              <el-table-column prop="category" label="Danh mục" width="94" align="center" show-overflow-tooltip>
                <template #default="{ row }">
                  <el-tag size="small" type="info" effect="plain" class="font-semibold">
                    {{ row.category || '—' }}
                  </el-tag>
                </template>
              </el-table-column>

              <!-- Chủ sở hữu -->
              <el-table-column prop="owner_name" label="Người sở hữu" width="101" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="text-xs text-gray-800 dark:text-gray-200 font-bold">{{ row.owner_name || '—' }}</span>
                </template>
              </el-table-column>

              <!-- Ngày cấp -->
              <el-table-column prop="issue_date" label="Ngày cấp" width="86" align="center">
                <template #default="{ row }">
                  <span class="font-mono text-xs">{{ formatDate(row.issue_date) }}</span>
                </template>
              </el-table-column>

              <!-- Ngày hết hạn -->
              <el-table-column prop="expiry_date" label="Hạn bảo hành / Hết hạn" width="94" align="center">
                <template #default="{ row }">
                  <span class="font-mono text-xs" :class="isExpired(row.expiry_date) ? 'text-red-500 font-bold' : ''">
                    {{ formatDate(row.expiry_date) }}
                  </span>
                </template>
              </el-table-column>

              <!-- Trạng thái -->
              <el-table-column prop="status" label="Trạng thái" width="94" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="getStatusTagType(row.status)" effect="dark" class="font-bold">
                    {{ getStatusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>

              <!-- Mô tả -->
              <el-table-column prop="description" label="Mô tả chi tiết" min-width="130" show-overflow-tooltip />

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
              <div v-if="paginatedDocuments.length > 0" class="grid grid-cols-1 gap-4">
                <div
                  v-for="(row, i) in (paginatedDocuments as any[])"
                  :key="row.id || row.contract_id || i"
                  class="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-sm"
                >
                  <div class="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
                    <div class="min-w-0 break-words">
                      <span class="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold select-all">{{ row.id }}</span>
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
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Số hiệu:</span>
                      <span class="text-right break-words min-w-0">
                        <span class="font-bold text-gray-800 dark:text-gray-200 font-mono">{{ row.document_code || '—' }}</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tên tài liệu / Tiêu đề:</span>
                      <span class="text-right break-words min-w-0">
                        <span class="font-bold text-gray-850 dark:text-gray-100">{{ row.title }}</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Danh mục:</span>
                      <span class="text-right break-words min-w-0">
                        <el-tag size="small" type="info" effect="plain" class="font-semibold">
                                            {{ row.category || '—' }}
                                          </el-tag>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Người sở hữu:</span>
                      <span class="text-right break-words min-w-0">
                        <span class="text-xs text-gray-800 dark:text-gray-200 font-bold">{{ row.owner_name || '—' }}</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ngày cấp:</span>
                      <span class="text-right break-words min-w-0">
                        <span class="font-mono text-xs">{{ formatDate(row.issue_date) }}</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Hạn bảo hành / Hết hạn:</span>
                      <span class="text-right break-words min-w-0">
                        <span class="font-mono text-xs" :class="isExpired(row.expiry_date) ? 'text-red-500 font-bold' : ''">
                                            {{ formatDate(row.expiry_date) }}
                                          </span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Trạng thái:</span>
                      <span class="text-right break-words min-w-0">
                        <el-tag size="small" :type="getStatusTagType(row.status)" effect="dark" class="font-bold">
                                            {{ getStatusLabel(row.status) }}
                                          </el-tag>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Mô tả chi tiết:</span>
                      <span class="text-right break-words min-w-0">
                        {{ row.description }}
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
                :total="filteredDocuments.length"
              />
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Tab 2: Lên lịch -->
      <el-tab-pane name="reminder">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Calendar /></el-icon>
            <span>Lên lịch</span>
          </span>
        </template>
        <ReminderTab />
      </el-tab-pane>

    </el-tabs>

    <!-- Dialog: Add / Edit Document -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'CHỈNH SỬA THÔNG TIN TÀI LIỆU' : 'THÊM TÀI LIỆU MỚI'"
      width="900px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="170px" class="mt-2 compact-form">
          <!-- PHẦN 1: THÔNG TIN PHÁP LÝ -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin nhận diện tài liệu
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã tài liệu (ID)" prop="id">
                  <el-input v-model="form.id" :disabled="isEdit" placeholder="Hệ thống tự động phát sinh nếu để trống..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Số hiệu tài liệu" prop="document_code">
                  <el-input v-model="form.document_code" placeholder="VD: ĐK-123456, BH-9999..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tên tài liệu / Tiêu đề" prop="title">
                  <el-input v-model="form.title" placeholder="VD: Giấy chứng nhận đăng kiểm xe..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Danh mục tài liệu" prop="category">
                  <el-select v-model="form.category" placeholder="Chọn danh mục..." class="w-full">
                    <el-option label="Cá nhân" value="Cá nhân" />
                    <el-option label="Công việc" value="Công việc" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Chủ sở hữu" prop="owner_name">
                  <el-input v-model="form.owner_name" placeholder="VD: Công ty HDG, Nguyễn Văn A..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Trạng thái tài liệu" prop="status">
                  <el-select v-model="form.status" placeholder="Chọn trạng thái..." class="w-full">
                    <el-option label="Hoạt động (ACTIVE)" value="ACTIVE" />
                    <el-option label="Hết hạn (EXPIRED)" value="EXPIRED" />
                    <el-option label="Vô hiệu (INACTIVE)" value="INACTIVE" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: THỜI HẠN & MÔ TẢ -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Hiệu lực &amp; Chi tiết
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Ngày cấp" prop="issue_date">
                  <el-date-picker :editable="false" v-model="form.issue_date" type="date" value-format="YYYY-MM-DD" placeholder="Chọn ngày cấp..." class="!w-full" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ngày hết hạn" prop="expiry_date">
                  <el-date-picker :editable="false" v-model="form.expiry_date" type="date" value-format="YYYY-MM-DD" placeholder="Chọn ngày hết hạn..." class="!w-full" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Mô tả chi tiết" prop="description">
                  <el-input v-model="form.description" type="textarea" :rows="3" placeholder="Thông tin mô tả thêm về tài liệu này..." />
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

    <!-- Dialog: Detail Document -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT THÔNG TIN TÀI LIỆU"
      width="750px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedDocument" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto text-left">
        <!-- Visual Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-blue-500 dark:bg-blue-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32"><Document /></el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Hồ sơ, Giấy tờ pháp lý</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {{ selectedDocument.title }}
              <span class="text-gray-450 dark:text-gray-500 font-mono font-medium" v-if="selectedDocument.document_code">({{ selectedDocument.document_code }})</span>
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <span class="text-gray-500 dark:text-gray-400">Danh mục: <strong class="text-gray-750 dark:text-gray-250">{{ selectedDocument.category || '—' }}</strong></span>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span class="text-gray-500 dark:text-gray-400">Sở hữu: <strong>{{ selectedDocument.owner_name || '—' }}</strong></span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã tài liệu (ID)</div>
            <div class="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono select-all">{{ selectedDocument.id }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số hiệu hồ sơ</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono">{{ selectedDocument.document_code || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày cấp</div>
            <div class="text-sm font-mono text-gray-750 dark:text-gray-300">{{ formatDate(selectedDocument.issue_date) }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Hạn bảo hành / Ngày hết hạn</div>
            <div class="text-sm font-mono text-gray-750 dark:text-gray-300" :class="isExpired(selectedDocument.expiry_date) ? 'text-red-500 font-bold' : ''">
              {{ formatDate(selectedDocument.expiry_date) }}
              <span v-if="isExpired(selectedDocument.expiry_date)" class="ml-1 text-xs text-red-500">(Đã hết hiệu lực)</span>
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Trạng thái</div>
            <div>
              <el-tag size="small" :type="getStatusTagType(selectedDocument.status)" effect="dark" class="font-bold">
                {{ getStatusLabel(selectedDocument.status) }}
              </el-tag>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-150 dark:border-gray-700 pt-4" v-if="selectedDocument.description">
          <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mô tả thông tin chi tiết</div>
          <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ selectedDocument.description }}</p>
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
import { Document, Refresh, Plus, MoreFilled, Calendar } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { documentService } from '@/api/documentService'
import ReminderTab from './ReminderTab.vue'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'

const { laManHep, hienBang, hienThe } = dungManHep()

const activeTab = ref('document')

// Search, Status filters
const searchQuery = ref('')
const filterCategory = ref('')
const filterStatus = ref('')
const loading = ref(false)

const documents = ref<any[]>([])

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Fetch documents list from GET API
const fetchDocuments = async () => {
  loading.value = true
  currentPage.value = 1
  try {
    const data = await documentService.getDocuments({
      category: filterCategory.value || undefined,
      status: filterStatus.value || undefined
    })
    documents.value = data
  } catch (error: any) {
    console.error('API get-documents failed:', error)
    ElMessage.error(error.message || 'Lỗi khi tải danh sách hồ sơ giấy tờ từ API')
    documents.value = []
  } finally {
    loading.value = false
  }
}

const handleStatusChange = () => {
  fetchDocuments()
}

const handleCategoryChange = () => {
  fetchDocuments()
}

// Filter Computeds
const filteredDocuments = computed(() => {
  return documents.value.filter(item => {
    const q = searchQuery.value.toLowerCase()
    const matchesSearch = !q ||
      item.title.toLowerCase().includes(q) ||
      (item.document_code && item.document_code.toLowerCase().includes(q)) ||
      (item.owner_name && item.owner_name.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q))
    return matchesSearch
  })
})

const paginatedDocuments = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredDocuments.value.slice(start, end)
})

// Dialog States
const dialogVisible = ref(false)
const isEdit = ref(false)
const detailDialogVisible = ref(false)
const selectedDocument = ref<any | null>(null)
const formRef = ref<any>(null)

const form = reactive({
  id: '',
  title: '',
  document_code: '',
  category: 'Cá nhân',
  owner_name: '',
  description: '',
  issue_date: '',
  expiry_date: '',
  status: 'ACTIVE'
})

const rules = reactive({
  title: [{ required: true, message: 'Vui lòng nhập tên tài liệu', trigger: 'blur' }],
  category: [{ required: true, message: 'Vui lòng chọn danh mục', trigger: 'change' }],
  status: [{ required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change' }]
})

// Action Handlers
const handleCommand = (cmd: string, row: any) => {
  if (cmd === 'detail') {
    selectedDocument.value = row
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
  form.title = ''
  form.document_code = ''
  form.category = 'Cá nhân'
  form.owner_name = ''
  form.description = ''
  form.issue_date = ''
  form.expiry_date = ''
  form.status = 'ACTIVE'
  dialogVisible.value = true
}

const openEditDialog = (row: any) => {
  isEdit.value = true
  form.id = row.id
  form.title = row.title
  form.document_code = row.document_code || ''
  form.category = row.category || 'Cá nhân'
  form.owner_name = row.owner_name || ''
  form.description = row.description || ''
  form.issue_date = row.issue_date || ''
  form.expiry_date = row.expiry_date || ''
  form.status = row.status || 'ACTIVE'
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      const payload = {
        id: form.id || null,
        title: form.title,
        document_code: form.document_code || null,
        category: form.category || null,
        owner_name: form.owner_name || null,
        description: form.description || null,
        issue_date: form.issue_date || null,
        expiry_date: form.expiry_date || null,
        status: form.status
      }

      try {
        if (isEdit.value) {
          const editPayload = { ...payload, id: form.id }
          await documentService.updateDocuments([editPayload])

          const idx = documents.value.findIndex(s => s.id === form.id)
          if (idx !== -1) {
            documents.value[idx] = { ...documents.value[idx], ...editPayload }
          }
          ElMessage.success('Cập nhật tài liệu thành công!')
        } else {
          const res = await documentService.addDocuments([payload])
          if (res && res.length > 0) {
            documents.value.unshift(res[0])
          } else {
            fetchDocuments()
          }
          ElMessage.success('Thêm mới tài liệu thành công!')
        }
        dialogVisible.value = false
      } catch (error: any) {
        ElMessage.error(error.message || 'Lỗi khi lưu thông tin tài liệu')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa tài liệu "${row.title}" (${row.id}) khỏi cơ sở dữ liệu?`,
      'Xác nhận xóa tài liệu',
      {
        confirmButtonText: 'Xóa bỏ',
        cancelButtonText: 'Hủy',
        type: 'warning'
      }
    )
    loading.value = true
    await documentService.deleteDocuments([row.id])

    documents.value = documents.value.filter(s => s.id !== row.id)
    ElMessage.success('Xóa tài liệu thành công!')
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || 'Lỗi khi xóa tài liệu')
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

const isExpired = (expiryDateStr: string) => {
  if (!expiryDateStr) return false
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const exp = new Date(expiryDateStr)
    return exp < today
  } catch {
    return false
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'Đang hoạt động'
    case 'EXPIRED': return 'Đã hết hạn'
    case 'INACTIVE': return 'Vô hiệu'
    default: return status || '—'
  }
}

const getStatusTagType = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'success'
    case 'EXPIRED': return 'warning'
    case 'INACTIVE': return 'danger'
    default: return 'info'
  }
}

onMounted(() => {
  fetchDocuments()
})
</script>

<style scoped>
.harvest-tabs {
  border-radius: 8px;
  overflow: hidden;
}
.harvest-tabs :deep(.el-tabs__content) {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.harvest-tabs :deep(.el-tab-pane) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
.harvest-tabs .custom-tabs-label .el-icon {
  vertical-align: middle;
}
.harvest-tabs .custom-tabs-label span {
  vertical-align: middle;
  margin-left: 4px;
}

html.dark .harvest-tabs {
  background-color: #1f2937;
  border-color: #374151;
}
html.dark .harvest-tabs :deep(.el-tabs__header) {
  background-color: #111827;
  border-bottom-color: #374151;
}
html.dark .harvest-tabs :deep(.el-tabs__item) {
  color: #9ca3af;
  border-color: transparent;
  transition: all 0.3s;
}
html.dark .harvest-tabs :deep(.el-tabs__item:hover) {
  color: #d1d5db;
}
html.dark .harvest-tabs :deep(.el-tabs__item.is-active) {
  background-color: #1f2937;
  border-right-color: #374151;
  border-left-color: #374151;
  border-bottom-color: #1f2937;
  color: #60a5fa;
}

html.dark .document-tab-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .document-tab-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .document-tab-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

html.dark .document-tab-container :deep(.el-table .el-table-fixed-column--left),
html.dark .document-tab-container :deep(.el-table .el-table-fixed-column--right) {
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
