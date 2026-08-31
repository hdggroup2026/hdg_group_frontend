<template>
  <div class="telegram-module-container h-full p-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <el-tabs v-model="activeTab" type="border-card" class="harvest-tabs h-full flex flex-col">
      <el-tab-pane name="info">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><ChatLineRound /></el-icon>
            <span>Thông tin nhóm Telegram</span>
          </span>
        </template>

        <div class="telegram-groups-container h-full flex flex-col">
          <!-- Filter Bar -->
          <div class="flex flex-wrap justify-between items-center gap-4 mb-4 shrink-0">
            <div class="flex flex-wrap items-center gap-4">
              <!-- Dự án -->
              <div class="flex items-center gap-2">
                <span class="whitespace-nowrap text-sm font-medium text-gray-770 dark:text-gray-300">Dự án:</span>
                <el-select 
                  v-model="filters.project_id" 
                  placeholder="Tất cả dự án" 
                  clearable 
                  :filterable="choLocDuoc"
                  class="custom-dark-input"
                  style="width: 180px"
                  @change="handleFilterChange"
                >
                  <el-option 
                    v-for="proj in projects" 
                    :key="proj.id" 
                    :label="proj.project_name" 
                    :value="proj.id" 
                  />
                </el-select>
              </div>

              <!-- Chat ID -->
              <div class="flex items-center gap-2">
                <span class="whitespace-nowrap text-sm font-medium text-gray-770 dark:text-gray-300">Chat ID:</span>
                <el-input 
                  v-model="filters.chat_id" 
                  placeholder="Nhập Chat ID..." 
                  clearable 
                  class="custom-dark-input"
                  style="width: 160px"
                  @input="handleFilterInput"
                  @clear="handleFilterChange"
                />
              </div>

              <!-- Username -->
              <div class="flex items-center gap-2">
                <span class="whitespace-nowrap text-sm font-medium text-gray-770 dark:text-gray-300">Username:</span>
                <el-input 
                  v-model="filters.username" 
                  placeholder="Nhập username..." 
                  clearable 
                  class="custom-dark-input"
                  style="width: 160px"
                  @input="handleFilterInput"
                  @clear="handleFilterChange"
                />
              </div>

              <!-- Vai trò -->
              <div class="flex items-center gap-2">
                <span class="whitespace-nowrap text-sm font-medium text-gray-770 dark:text-gray-300">Vai trò:</span>
                <el-select 
                  v-model="filters.role" 
                  placeholder="Tất cả" 
                  clearable 
                  class="custom-dark-input"
                  style="width: 120px"
                  @change="handleFilterChange"
                >
                  <el-option label="Tất cả" value="" />
                  <el-option label="Main" value="Main" />
                  <el-option label="Member" value="Member" />
                </el-select>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <el-button :icon="Refresh" circle @click="fetchMembers" :loading="loading" />
              <el-button 
                type="danger" 
                class="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 border-none rounded-xl font-semibold shadow-md transition-all duration-300 hover:shadow-lg text-white flex items-center"
                @click="handleDeleteSelectedMembers" 
                :loading="deleting"
                :disabled="selectedMembers.length === 0"
              >
                <el-icon class="mr-1.5"><Delete /></el-icon>
                Xóa thành viên {{ selectedMembers.length > 0 ? `(${selectedMembers.length})` : '' }}
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
            <el-table v-if="hienBang" 
              v-loading="loading"
              :data="paginatedMembers" 
              style="width: 100%" 
              height="100%" 
              class="flex-1"
              @selection-change="handleSelectionChange"
            >
              <!-- Nút tích chọn (Checkbox) -->
              <el-table-column type="selection" width="55" align="center" />

              <!-- STT -->
              <el-table-column label="STT" width="52" align="center">
                <template #default="{ $index }">
                  <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
                </template>
              </el-table-column>

              <!-- Dự án -->
              <el-table-column label="Dự án" min-width="86" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="font-bold text-gray-800 dark:text-gray-200">{{ getProjectName(row.project_id) }}</span>
                </template>
              </el-table-column>

              <!-- Chat ID -->
              <el-table-column label="Chat ID" width="94" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold select-all">{{ row.chat_id }}</span>
                </template>
              </el-table-column>

              <!-- Tên nhóm -->
              <el-table-column prop="group_name" label="Tên nhóm" min-width="180" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="font-bold text-gray-855 dark:text-gray-100">{{ row.group_name || '—' }}</span>
                </template>
              </el-table-column>

              <!-- User ID -->
              <el-table-column label="User ID" width="86" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="font-mono text-xs text-gray-700 dark:text-gray-300 font-bold select-all">{{ row.user_id }}</span>
                </template>
              </el-table-column>

              <!-- Username -->
              <el-table-column label="Username" min-width="122" show-overflow-tooltip>
                <template #default="{ row }">
                  <span v-if="row.user_name" class="text-blue-500 dark:text-blue-400 font-bold">@{{ row.user_name }}</span>
                  <span v-else class="text-gray-400">—</span>
                </template>
              </el-table-column>

              <!-- Họ & tên -->
              <el-table-column prop="full_name" label="Họ & tên" min-width="101" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="text-xs text-gray-700 dark:text-gray-300 font-semibold">{{ row.full_name || '—' }}</span>
                </template>
              </el-table-column>

              <!-- Chức danh tùy chỉnh -->
              <el-table-column prop="custom_title" label="Chức danh" width="94" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="text-xs text-gray-700 dark:text-gray-300 font-semibold">{{ row.custom_title || '—' }}</span>
                </template>
              </el-table-column>

              <!-- Tên Slot -->
              <el-table-column prop="slot_name" label="Tên Slot" width="79" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="text-xs text-gray-750 dark:text-gray-250 font-semibold">{{ row.slot_name || '—' }}</span>
                </template>
              </el-table-column>

              <!-- Là Bot? -->
              <el-table-column label="Bot?" width="70" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.is_bot" size="small" type="danger" effect="plain" class="font-bold">Bot</el-tag>
                  <span v-else class="text-gray-400">—</span>
                </template>
              </el-table-column>

              <!-- Nút cha (Parent ID) -->
              <el-table-column prop="parent_id" label="Nút cha (Parent)" width="90" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="font-mono text-xs text-gray-600 dark:text-gray-400 font-bold select-all">{{ row.parent_id || '—' }}</span>
                </template>
              </el-table-column>

              <!-- Vai trò -->
              <el-table-column label="Vai trò" width="72" align="center">
                <template #default="{ row }">
                  <el-tag 
                    v-if="row.role"
                    :type="row.role === 'Main' ? 'danger' : 'primary'"
                    effect="light"
                    class="font-bold"
                    size="small"
                  >
                    {{ row.role }}
                  </el-tag>
                  <span v-else class="text-gray-400">—</span>
                </template>
              </el-table-column>

              <!-- Trạng thái -->
              <el-table-column label="Trạng thái" width="86" align="center">
                <template #default="{ row }">
                  <el-tag 
                    v-if="row.member_status"
                    :type="getMemberStatusTagType(row.member_status)"
                    effect="plain"
                    size="small"
                    class="font-semibold"
                  >
                    {{ row.member_status }}
                  </el-tag>
                  <span v-else class="text-gray-400">—</span>
                </template>
              </el-table-column>

              <!-- Ngày vào nhóm -->
              <el-table-column label="Ngày vào nhóm" width="108" align="center">
                <template #default="{ row }">
                  <span class="font-mono text-xs text-gray-500 dark:text-gray-400 font-semibold">{{ formatDate(row.first_seen_at) }}</span>
                </template>
              </el-table-column>

              <!-- Hoạt động cuối -->
              <el-table-column label="Hoạt động cuối" width="108" align="center">
                <template #default="{ row }">
                  <span class="font-mono text-xs text-gray-500 dark:text-gray-400 font-semibold">{{ formatDate(row.last_seen_at) }}</span>
                </template>
              </el-table-column>

              <!-- Ghi nhận bởi -->
              <el-table-column prop="last_seen_by" label="Ghi nhận bởi" width="94" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="text-xs text-gray-700 dark:text-gray-300 font-medium">{{ row.last_seen_by || '—' }}</span>
                </template>
              </el-table-column>

              <!-- Thao tác -->
              <el-table-column label="Thao tác" width="60" align="center">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" class="font-bold" @click="handleOpenDetailDialog(row)">
                    Chi tiết
                  </el-button>
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
              <div v-if="paginatedMembers.length > 0" class="grid grid-cols-1 gap-4">
                <div
                  v-for="(row, i) in (paginatedMembers as any[])"
                  :key="row.id || row.contract_id || i"
                  class="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-sm"
                >
                  <div class="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
                    <div class="min-w-0 break-words">
                      <span class="font-bold text-gray-800 dark:text-gray-200">{{ getProjectName(row.project_id) }}</span>
                    </div>
                    <div class="shrink-0">
                      <el-button link type="primary" size="small" class="font-bold" @click="handleOpenDetailDialog(row)">
                                          Chi tiết
                                        </el-button>
                    </div>
                  </div>
                  <div class="space-y-2 text-sm text-left">
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Chat ID:</span>
                      <span class="text-right break-words min-w-0">
                        <span class="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold select-all">{{ row.chat_id }}</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tên nhóm:</span>
                      <span class="text-right break-words min-w-0">
                        <span class="font-bold text-gray-855 dark:text-gray-100">{{ row.group_name || '—' }}</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">User ID:</span>
                      <span class="text-right break-words min-w-0">
                        <span class="font-mono text-xs text-gray-700 dark:text-gray-300 font-bold select-all">{{ row.user_id }}</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Username:</span>
                      <span class="text-right break-words min-w-0">
                        <span v-if="row.user_name" class="text-blue-500 dark:text-blue-400 font-bold">@{{ row.user_name }}</span>
                                          <span v-else class="text-gray-400">—</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Họ & tên:</span>
                      <span class="text-right break-words min-w-0">
                        <span class="text-xs text-gray-700 dark:text-gray-300 font-semibold">{{ row.full_name || '—' }}</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Chức danh:</span>
                      <span class="text-right break-words min-w-0">
                        <span class="text-xs text-gray-700 dark:text-gray-300 font-semibold">{{ row.custom_title || '—' }}</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tên Slot:</span>
                      <span class="text-right break-words min-w-0">
                        <span class="text-xs text-gray-750 dark:text-gray-250 font-semibold">{{ row.slot_name || '—' }}</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Bot?:</span>
                      <span class="text-right break-words min-w-0">
                        <el-tag v-if="row.is_bot" size="small" type="danger" effect="plain" class="font-bold">Bot</el-tag>
                                          <span v-else class="text-gray-400">—</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Nút cha (Parent):</span>
                      <span class="text-right break-words min-w-0">
                        <span class="font-mono text-xs text-gray-600 dark:text-gray-400 font-bold select-all">{{ row.parent_id || '—' }}</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Vai trò:</span>
                      <span class="text-right break-words min-w-0">
                        <el-tag 
                                            v-if="row.role"
                                            :type="row.role === 'Main' ? 'danger' : 'primary'"
                                            effect="light"
                                            class="font-bold"
                                            size="small"
                                          >
                                            {{ row.role }}
                                          </el-tag>
                                          <span v-else class="text-gray-400">—</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Trạng thái:</span>
                      <span class="text-right break-words min-w-0">
                        <el-tag 
                                            v-if="row.member_status"
                                            :type="getMemberStatusTagType(row.member_status)"
                                            effect="plain"
                                            size="small"
                                            class="font-semibold"
                                          >
                                            {{ row.member_status }}
                                          </el-tag>
                                          <span v-else class="text-gray-400">—</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ngày vào nhóm:</span>
                      <span class="text-right break-words min-w-0">
                        <span class="font-mono text-xs text-gray-500 dark:text-gray-400 font-semibold">{{ formatDate(row.first_seen_at) }}</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Hoạt động cuối:</span>
                      <span class="text-right break-words min-w-0">
                        <span class="font-mono text-xs text-gray-500 dark:text-gray-400 font-semibold">{{ formatDate(row.last_seen_at) }}</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ghi nhận bởi:</span>
                      <span class="text-right break-words min-w-0">
                        <span class="text-xs text-gray-700 dark:text-gray-300 font-medium">{{ row.last_seen_by || '—' }}</span>
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
                :total="members.length"
              />
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- Dialog: Detail Telegram Member -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT THÀNH VIÊN NHÓM TELEGRAM"
      width="750px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedMember" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto text-left">
        <!-- Visual Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-blue-500 dark:bg-blue-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32"><ChatLineRound /></el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Thành viên nhóm Telegram</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {{ selectedMember.full_name || 'N/A' }}
              <span class="text-blue-500 dark:text-blue-400 font-mono font-medium" v-if="selectedMember.user_name">(@{{ selectedMember.user_name }})</span>
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <span class="text-gray-500 dark:text-gray-400">Dự án: <strong class="text-gray-750 dark:text-gray-250">{{ getProjectName(selectedMember.project_id) }}</strong></span>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span class="text-gray-500 dark:text-gray-400">Vai trò: <strong>{{ selectedMember.role || 'Member' }}</strong></span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">User ID</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono select-all">{{ selectedMember.user_id }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Chat ID</div>
            <div class="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono select-all">{{ selectedMember.chat_id }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tên nhóm</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedMember.group_name || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Chức danh</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedMember.custom_title || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tên Slot</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedMember.slot_name || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Nút cha (Parent ID)</div>
            <div class="text-sm font-mono text-gray-700 dark:text-gray-300 select-all">{{ selectedMember.parent_id || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày vào nhóm</div>
            <div class="text-sm font-mono text-gray-750 dark:text-gray-300">{{ formatDate(selectedMember.first_seen_at) }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Hoạt động cuối</div>
            <div class="text-sm font-mono text-gray-750 dark:text-gray-300">{{ formatDate(selectedMember.last_seen_at) }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ghi nhận bởi</div>
            <div class="text-sm text-gray-700 dark:text-gray-300">{{ selectedMember.last_seen_by || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Trạng thái</div>
            <div>
              <el-tag size="small" :type="getMemberStatusTagType(selectedMember.member_status)" effect="dark" class="font-bold">
                {{ selectedMember.member_status }}
              </el-tag>
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Phân loại</div>
            <div>
              <el-tag v-if="selectedMember.is_bot" size="small" type="danger" effect="plain" class="font-bold">Bot</el-tag>
              <el-tag v-else size="small" type="success" effect="plain" class="font-bold">User</el-tag>
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
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { ChatLineRound, Refresh, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { tienNgaService } from '@/api/tienNgaService'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'
// MỤC 417 — trên máy bảng/điện thoại KHÔNG cho gõ lọc, để iOS
// không bật bàn phím; bấm ẩn bàn phím thì droplist ở nguyên đó.
// Xem `src/composables/chonDuoc.ts`.
import { dungChonDuoc } from '@/composables/chonDuoc'

const { choLocDuoc } = dungChonDuoc()

const { laManHep, hienBang, hienThe } = dungManHep()

interface Project {
  id: string;
  project_name: string;
}

interface Member {
  id: string;
  project_id: string;
  chat_id: string;
  group_name?: string;
  user_id: string;
  user_name?: string;
  full_name?: string;
  role: string;
  slot_name?: string;
  is_bot?: boolean;
  member_status: string;
  custom_title?: string;
  parent_id?: string;
  first_seen_at?: string;
  last_seen_at?: string;
  last_seen_by?: string;
}

// State
const activeTab = ref('info')
const projects = ref<Project[]>([])
const members = ref<Member[]>([])
const loading = ref(false)
const selectedMembers = ref<Member[]>([])
const deleting = ref(false)

// Pagination State
const currentPage = ref(1)
const pageSize = ref(10)

// Detail Dialog State
const detailDialogVisible = ref(false)
const selectedMember = ref<Member | null>(null)

const filters = reactive({
  project_id: '',
  chat_id: '',
  username: '',
  role: ''
})

// Helper methods
const getProjectName = (projId: string) => {
  const p = projects.value.find(proj => proj.id === projId)
  return p ? p.project_name : 'N/A'
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    const d = String(date.getDate()).padStart(2, '0')
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const y = date.getFullYear()
    const h = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    return `${d}/${m}/${y} ${h}:${min}`
  } catch (e) {
    return dateStr
  }
}

const getMemberStatusTagType = (status: string) => {
  switch (status) {
    case 'creator':
    case 'administrator':
      return 'danger'
    case 'member':
      return 'success'
    case 'left':
    case 'kicked':
      return 'info'
    default:
      return 'warning'
  }
}

// Fetch Projects
const fetchProjects = async () => {
  try {
    const data = await tienNgaService.getProjects()
    projects.value = data
  } catch (error: any) {
    console.error('Lỗi khi tải danh sách dự án:', error)
  }
}

// Fetch Members
const fetchMembers = async () => {
  loading.value = true
  try {
    const data = await tienNgaService.getTelegramProjectMembers({
      project_id: filters.project_id || undefined,
      chat_id: filters.chat_id || undefined,
      username: filters.username || undefined,
      role: filters.role || undefined
    })
    members.value = data
  } catch (error: any) {
    console.error(error)
    ElMessage.error(error.message || 'Lỗi khi tải danh sách thành viên')
  } finally {
    loading.value = false
  }
}

// Computed paginated members
const paginatedMembers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return members.value.slice(start, end)
})

// Debounced input search
let searchTimeout: any = null
const handleFilterInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchMembers()
  }, 500)
}

const handleFilterChange = () => {
  currentPage.value = 1
  fetchMembers()
}

// Selection handler
const handleSelectionChange = (val: Member[]) => {
  selectedMembers.value = val
}

// Action Delete Selected Members
const handleDeleteSelectedMembers = async () => {
  if (selectedMembers.value.length === 0) {
    ElMessage.warning('Vui lòng chọn ít nhất một thành viên để xóa!')
    return
  }

  const count = selectedMembers.value.length
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa ${count} thành viên đã chọn khỏi nhóm Telegram?`,
      'XÁC NHẬN XÓA THÀNH VIÊN',
      {
        confirmButtonText: 'Xóa ngay',
        cancelButtonText: 'Hủy bỏ',
        type: 'warning',
        confirmButtonClass: 'el-button--danger font-bold',
        cancelButtonClass: 'font-semibold',
        center: true,
        customClass: 'custom-dark-dialog'
      }
    )
  } catch {
    return // User canceled
  }

  deleting.value = true
  try {
    const payload = selectedMembers.value.map(m => m.id)
    const res = await tienNgaService.deleteUserTelegram(payload)
    
    let message = 'Thao tác xóa thành viên đã hoàn tất.'
    let totalOk = 0
    let totalFailed = 0
    let reasons: any[] = []

    if (res && typeof res === 'object' && !Array.isArray(res)) {
      message = res.message || res.status_message || res.detail || message
      totalOk = res.total_ok ?? res.total_success ?? res.success_count ?? (Array.isArray(res.ok_list) ? res.ok_list.length : count)
      totalFailed = res.total_failed ?? res.total_fail ?? res.fail_count ?? (Array.isArray(res.failed_list) ? res.failed_list.length : 0)
      reasons = res.reasons || res.details || res.failed_reasons || res.errors || []
    } else if (Array.isArray(res)) {
      totalOk = 0
      totalFailed = 0
      reasons = []
      res.forEach((item: any) => {
        if (item.status === 'ok' || item.success || item.is_deleted || !item.error) {
          totalOk++
        } else {
          totalFailed++
          reasons.push(item.reason || item.message || item.error || `Thành viên ID ${item.id || 'N/A'}`)
        }
      })
      if (totalFailed === 0) {
        message = `Đã xóa thành công ${totalOk} thành viên!`
      } else {
        message = `Xóa hoàn tất: ${totalOk} thành công, ${totalFailed} thất bại.`
      }
    } else {
      totalOk = count
      totalFailed = 0
      message = `Đã xóa thành công ${count} thành viên!`
    }

    let reasonsHtml = ''
    if (reasons && reasons.length > 0) {
      const listItems = reasons.map((r: any) => {
        const text = typeof r === 'string' ? r : (r.reason || r.message || r.error || JSON.stringify(r))
        return `<li style="margin-bottom: 2px;">${text}</li>`
      }).join('')

      reasonsHtml = `
        <div style="margin-top: 8px; padding: 6px 10px; background-color: #fef2f2; border-radius: 6px; border: 1px solid #fee2e2; max-height: 120px; overflow-y: auto;">
          <div style="color: #ef4444; font-weight: 600; font-size: 12px; margin-bottom: 4px;">Chi tiết lý do:</div>
          <ul style="margin: 0; padding-left: 16px; font-size: 11px; color: #4b5563;">
            ${listItems}
          </ul>
        </div>
      `
    }

    const htmlContent = `
      <div style="font-size: 13px; line-height: 1.5;">
        <p style="margin: 0 0 8px 0; font-weight: 600;">${message}</p>
        <div style="display: flex; gap: 12px; align-items: center;">
          <span style="color: #10b981; font-weight: 700;">✔ OK: ${totalOk}</span>
          <span style="color: #d1d5db;">|</span>
          <span style="color: #ef4444; font-weight: 700;">✖ Lỗi: ${totalFailed}</span>
        </div>
        ${reasonsHtml}
      </div>
    `

    ElNotification({
      title: 'KẾT QUẢ XÓA THÀNH VIÊN',
      message: htmlContent,
      dangerouslyUseHTMLString: true,
      type: totalFailed === 0 ? 'success' : 'warning',
      duration: 6000
    })

    selectedMembers.value = []
    await fetchMembers()
  } catch (error: any) {
    console.error('Lỗi khi xóa thành viên:', error)
    ElMessage.error(error.message || 'Lỗi khi thực hiện xóa thành viên!')
  } finally {
    deleting.value = false
  }
}

// Action Open Detail Dialog
const handleOpenDetailDialog = (row: Member) => {
  selectedMember.value = row
  detailDialogVisible.value = true
}

onMounted(async () => {
  await fetchProjects()
  await fetchMembers()
})
</script>

<style scoped>
.telegram-module-container {
  height: 100%;
}
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
  min-height: 0;
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

.telegram-groups-container {
  height: 100%;
}

/* Custom dark mode styles for table to match Device Management */
html.dark .telegram-groups-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .telegram-groups-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .telegram-groups-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

html.dark .telegram-groups-container :deep(.el-table .el-table-fixed-column--left),
html.dark .telegram-groups-container :deep(.el-table .el-table-fixed-column--right) {
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
