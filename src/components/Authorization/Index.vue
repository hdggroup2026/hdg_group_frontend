<template>
  <!-- Desktop (≥ 1024px) -->
  <el-splitter v-if="isDesktop" class="h-full">
    <el-splitter-panel size="15%">
      <!-- Sidebar -->
      <div class="h-full bg-white dark:bg-gray-800 border-r border-gray-150 dark:border-gray-700 flex flex-col justify-between py-4">
        <el-menu
          default-active="1"
          class="border-none bg-transparent"
          :collapse="false"
        >
          <el-menu-item index="1">
            <el-icon><Lock /></el-icon>
            <template #title>
              <span class="font-bold text-sm">Phân Quyền</span>
            </template>
          </el-menu-item>
        </el-menu>
      </div>
    </el-splitter-panel>
    <el-splitter-panel :min="200" v-loading="loading">
      <div class="h-full p-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex flex-col">
        <el-tabs v-model="activeTab" type="border-card" class="authorization-tabs h-full flex flex-col">
          <!-- Tab 1: Credentials List -->
          <el-tab-pane name="credentials" label="Danh sách Thông tin Đăng ký">
            <div class="auth-content flex flex-col h-full">
              <!-- Actions & Filter -->
              <div class="flex flex-wrap justify-between items-center gap-4 mb-4 shrink-0">
                <div class="flex items-center gap-2">
                  <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
                  <el-input
                    v-model="searchQuery"
                    placeholder="Nhập tên đăng nhập, mã nhân viên..."
                    :prefix-icon="Search"
                    clearable
                    class="w-64 custom-dark-input"
                  />
                </div>
                <el-button type="primary" @click="openAddDialog">
                  <el-icon class="mr-1"><Plus /></el-icon> Thêm Thông tin
                </el-button>
              </div>

              <!-- Table -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0 border border-gray-100 dark:border-gray-700">
                <!-- ══════════════════════════════════════════════════════════════
                     MỤC 398 (29/08/2026) — BỎ CỘT GHIM, BẢNG CHỈ HIỆN TỪ 768px

                     Cột ghim `fixed` chiếm chỗ CỐ ĐỊNH và không co theo màn hình.
                     Trên màn 390px, mấy cột ghim cộng lại đã hết chỗ, nên vùng
                     cuộn còn lại bằng 0 và vuốt ngang không có tác dụng — người
                     dùng vuốt mà màn hình không nhúc nhích.

                     Đã bỏ 0 cột ghim ở bảng này.
                     ══════════════════════════════════════════════════════════ -->
                <el-table v-if="hienBang" :data="paginatedCredentials" style="width: 100%" class="flex-1" height="100%">
                  <!-- STT -->
                  <el-table-column label="STT" width="60" align="center">
                    <template #default="{ $index }">
                      <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="username" label="Tên Đăng Nhập" min-width="150">
                    <template #default="{ row }">
                      <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.username }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="employee_id" label="Mã Nhân Viên" width="160">
                    <template #default="{ row }">
                      <span class="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold">{{ row.employee_id }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="role" label="Vai Trò" width="130" align="center">
                    <template #default="{ row }">
                      <el-tag :type="row.role === 'admin' ? 'danger' : 'info'" size="small">
                        {{ row.role === 'admin' ? 'Quản trị viên' : 'Nhân viên' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="is_active" label="Trạng Thái" width="130" align="center">
                    <template #default="{ row }">
                      <el-tag :type="row.is_active ? 'success' : 'danger'" effect="light" size="small" round>
                        {{ row.is_active ? 'Hoạt động' : 'Khóa' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="Quyền Đang Có" min-width="250">
                    <template #default="{ row }">
                      <div class="flex flex-wrap gap-1">
                        <el-tag 
                          v-for="perm in row.permissions" 
                          :key="perm" 
                          size="small" 
                          type="success"
                          effect="plain"
                          class="font-mono text-xxs font-bold"
                        >
                          {{ perm }}
                        </el-tag>
                        <span v-if="!row.permissions || row.permissions.length === 0" class="text-xs text-gray-400">—</span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="Thao tác" width="90" align="center">
                    <template #default="{ row }">
                      <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
                        <el-button link type="info" class="p-1 !text-gray-400 hover:!text-gray-600 dark:hover:!text-gray-200">
                          <el-icon :size="16"><MoreFilled /></el-icon>
                        </el-button>
                        <template #dropdown>
                          <el-dropdown-menu>
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
                <div v-if="hienThe" class="flex-1 min-h-0 overflow-y-auto p-3">
                  <div v-if="paginatedCredentials.length > 0" class="grid grid-cols-1 gap-4">
                    <div
                      v-for="(row, i) in paginatedCredentials"
                      :key="row.id || row.contract_id || i"
                      class="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-sm"
                    >
                      <div class="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
                        <div class="min-w-0 break-words">
                          <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.username }}</span>
                        </div>
                        <div class="shrink-0">
                          <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
                                                  <el-button link type="info" class="p-1 !text-gray-400 hover:!text-gray-600 dark:hover:!text-gray-200">
                                                    <el-icon :size="16"><MoreFilled /></el-icon>
                                                  </el-button>
                                                  <template #dropdown>
                                                    <el-dropdown-menu>
                                                      <el-dropdown-item command="edit">Chỉnh sửa</el-dropdown-item>
                                                      <el-dropdown-item command="delete" divided class="!text-red-500">Xóa</el-dropdown-item>
                                                    </el-dropdown-menu>
                                                  </template>
                                                </el-dropdown>
                        </div>
                      </div>
                      <div class="space-y-2 text-sm text-left">
                        <div class="flex justify-between gap-3">
                          <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Mã Nhân Viên:</span>
                          <span class="text-right break-words min-w-0">
                            <span class="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold">{{ row.employee_id }}</span>
                          </span>
                        </div>
                        <div class="flex justify-between gap-3">
                          <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Vai Trò:</span>
                          <span class="text-right break-words min-w-0">
                            <el-tag :type="row.role === 'admin' ? 'danger' : 'info'" size="small">
                                                    {{ row.role === 'admin' ? 'Quản trị viên' : 'Nhân viên' }}
                                                  </el-tag>
                          </span>
                        </div>
                        <div class="flex justify-between gap-3">
                          <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Trạng Thái:</span>
                          <span class="text-right break-words min-w-0">
                            <el-tag :type="row.is_active ? 'success' : 'danger'" effect="light" size="small" round>
                                                    {{ row.is_active ? 'Hoạt động' : 'Khóa' }}
                                                  </el-tag>
                          </span>
                        </div>
                        <div class="flex justify-between gap-3">
                          <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Quyền Đang Có:</span>
                          <span class="text-right break-words min-w-0">
                            <div class="flex flex-wrap gap-1">
                                                    <el-tag 
                                                      v-for="perm in row.permissions" 
                                                      :key="perm" 
                                                      size="small" 
                                                      type="success"
                                                      effect="plain"
                                                      class="font-mono text-xxs font-bold"
                                                    >
                                                      {{ perm }}
                                                    </el-tag>
                                                    <span v-if="!row.permissions || row.permissions.length === 0" class="text-xs text-gray-400">—</span>
                                                  </div>
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
                    :total="filteredCredentials.length"
                  />
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- Tab 2: Permissions Assign -->
          <el-tab-pane name="permissions" label="Phân quyền">
            <div class="auth-content flex flex-col h-full">
              <div class="flex justify-between items-center gap-4 mb-4 shrink-0">
                <div class="flex items-center gap-2">
                  <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Lọc theo Tên/Mã:</span>
                  <el-input
                    v-model="permSearchQuery"
                    placeholder="Tìm tài khoản để phân quyền..."
                    :prefix-icon="Search"
                    clearable
                    class="w-64 custom-dark-input"
                  />
                </div>
                <div class="text-xs text-gray-500">
                  <el-icon class="align-middle mr-1"><InfoFilled /></el-icon>
                  Thay đổi quyền sẽ có hiệu lực trực tiếp ngay sau khi thay đổi nút Toggle.
                </div>
              </div>

              <!-- Scrollable Table Grid with 11 Switches -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0 border border-gray-100 dark:border-gray-700">
                <!-- ══════════════════════════════════════════════════════════════
                     MỤC 398 (29/08/2026) — BỎ CỘT GHIM, BẢNG CHỈ HIỆN TỪ 768px

                     Cột ghim `fixed` chiếm chỗ CỐ ĐỊNH và không co theo màn hình.
                     Trên màn 390px, mấy cột ghim cộng lại đã hết chỗ, nên vùng
                     cuộn còn lại bằng 0 và vuốt ngang không có tác dụng — người
                     dùng vuốt mà màn hình không nhúc nhích.

                     Đã bỏ 0 cột ghim ở bảng này.
                     ══════════════════════════════════════════════════════════ -->
                <el-table v-if="hienBang" :data="paginatedPermCredentials" style="width: 100%" class="flex-1" height="100%">
                  <!-- STT -->
                  <el-table-column label="STT" width="60" align="center">
                    <template #default="{ $index }">
                      <span class="font-mono text-xs text-gray-500">{{ (permCurrentPage - 1) * permPageSize + $index + 1 }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="username" label="Tài khoản" width="150">
                    <template #default="{ row }">
                      <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.username }}</span>
                      <span class="block text-xxs font-mono text-gray-400">ID: {{ row.employee_id }}</span>
                    </template>
                  </el-table-column>

                  <!-- 11 Permissions Switch Columns -->
                  <el-table-column 
                    v-for="perm in availablePermissions" 
                    :key="perm.key" 
                    :label="perm.label" 
                    width="120" 
                    align="center"
                  >
                    <template #default="{ row }">
                      <el-switch
                        :model-value="hasPermission(row, perm.key)"
                        @change="(val) => handleTogglePermission(row, perm.key, val)"
                        active-color="#13ce66"
                        inactive-color="#ff4949"
                        :loading="permissionLoadingMap[row.employee_id + '_' + perm.key]"
                      />
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
                <div v-if="hienThe" class="flex-1 min-h-0 overflow-y-auto p-3">
                  <div v-if="paginatedPermCredentials.length > 0" class="grid grid-cols-1 gap-4">
                    <div
                      v-for="(row, i) in paginatedPermCredentials"
                      :key="row.id || row.contract_id || i"
                      class="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-sm"
                    >
                      <div class="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
                        <div class="min-w-0 break-words">
                          <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.username }}</span>
                                                <span class="block text-xxs font-mono text-gray-400">ID: {{ row.employee_id }}</span>
                        </div>
                      </div>
                      <div class="space-y-2 text-sm text-left">
                        <div class="flex justify-between gap-3">
                          <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">:</span>
                          <span class="text-right break-words min-w-0">
                            <el-switch
                                                    :model-value="hasPermission(row, perm.key)"
                                                    @change="(val) => handleTogglePermission(row, perm.key, val)"
                                                    active-color="#13ce66"
                                                    inactive-color="#ff4949"
                                                    :loading="permissionLoadingMap[row.employee_id + '_' + perm.key]"
                                                  />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-else class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                    <p class="text-base font-medium">Không có dòng nào khớp bộ lọc</p>
                  </div>
                </div>

                <!-- Pagination for Perm -->
                <div class="mt-auto shrink-0 p-4 flex justify-end border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <el-pagination
                    v-model:current-page="permCurrentPage"
                    v-model:page-size="permPageSize"
                    :page-sizes="[10, 20, 50]"
                    :background="true"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="filteredPermCredentials.length"
                  />
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-splitter-panel>
  </el-splitter>

  <!-- Mobile / Tablet layout (< 1024px) -->
  <div v-else class="h-full flex flex-col" v-loading="loading">
    <div class="shrink-0 px-4 py-2.5 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
      <el-icon><Lock /></el-icon>
      <span class="font-bold text-sm text-gray-800 dark:text-gray-100">Phân Quyền</span>
    </div>
    <div class="flex-1 p-4 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      <el-tabs v-model="activeTab" type="border-card" class="authorization-tabs h-full">
        <!-- Content identical to Desktop tabs (simplified layout for responsive) -->
        <el-tab-pane name="credentials" label="Danh sách Đăng ký">
          <!-- simplified list -->
          <div class="flex flex-col gap-4">
            <div class="flex justify-between items-center gap-2">
              <el-input v-model="searchQuery" placeholder="Tìm kiếm..." class="w-full custom-dark-input" />
              <el-button type="primary" circle :icon="Plus" @click="openAddDialog" />
            </div>
            <div 
              v-for="row in paginatedCredentials" 
              :key="row.id" 
              class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-750 flex justify-between items-center"
            >
              <div>
                <div class="font-bold text-sm text-gray-800 dark:text-gray-100">{{ row.username }}</div>
                <div class="text-xs font-mono text-gray-500 mt-0.5">ID: {{ row.employee_id }}</div>
                <div class="flex gap-2 mt-2">
                  <el-tag size="small" :type="row.role === 'admin' ? 'danger' : 'info'">{{ row.role }}</el-tag>
                  <el-tag size="small" :type="row.is_active ? 'success' : 'danger'">{{ row.is_active ? 'Active' : 'Locked' }}</el-tag>
                </div>
              </div>
              <div class="flex gap-2">
                <el-button circle :icon="Edit" size="small" @click="openEditDialog(row)" />
                <el-button circle type="danger" :icon="Delete" size="small" @click="handleDelete(row)" />
              </div>
            </div>
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              layout="prev, pager, next"
              :total="filteredCredentials.length"
              class="justify-center mt-2"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane name="permissions" label="Phân quyền">
          <div class="flex flex-col gap-4">
            <el-input v-model="permSearchQuery" placeholder="Tìm tài khoản..." class="w-full custom-dark-input" />
            
            <div 
              v-for="row in paginatedPermCredentials" 
              :key="row.id" 
              class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-750"
            >
              <div class="font-bold text-gray-800 dark:text-gray-100 mb-2">{{ row.username }} ({{ row.employee_id }})</div>
              
              <div class="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <div 
                  v-for="perm in availablePermissions" 
                  :key="perm.key" 
                  class="flex items-center justify-between py-1"
                >
                  <span class="text-xs text-gray-600 dark:text-gray-400">{{ perm.label }}</span>
                  <el-switch
                    :model-value="hasPermission(row, perm.key)"
                    @change="(val) => handleTogglePermission(row, perm.key, val)"
                    size="small"
                    active-color="#13ce66"
                    inactive-color="#ff4949"
                    :loading="permissionLoadingMap[row.employee_id + '_' + perm.key]"
                  />
                </div>
              </div>
            </div>
            
            <el-pagination
              v-model:current-page="permCurrentPage"
              v-model:page-size="permPageSize"
              layout="prev, pager, next"
              :total="filteredPermCredentials.length"
              class="justify-center mt-2"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>

  <!-- Modal Thêm thông tin -->
  <el-dialog
    v-model="addDialogVisible"
    title="THÊM THÔNG TIN ĐĂNG KÝ"
    class="custom-dark-dialog"
    width="500px"
    destroy-on-close
    align-center
  >
    <el-form :model="addForm" :rules="rules" ref="addFormRef" label-width="120px" class="compact-form mt-2">
      <el-form-item label="Tên Đăng Nhập" prop="username">
        <el-input v-model="addForm.username" placeholder="Nhập tên tài khoản..." />
      </el-form-item>
      <el-form-item label="Mật khẩu" prop="password">
        <el-input v-model="addForm.password" type="password" placeholder="Nhập mật khẩu..." show-password />
      </el-form-item>
      <el-form-item label="Mã Nhân Viên" prop="employee_id">
        <el-input v-model="addForm.employee_id" placeholder="Nhập mã nhân viên (khớp với mã nhân sự)..." />
      </el-form-item>
      <el-form-item label="Vai Trò" prop="role">
        <el-select v-model="addForm.role" class="w-full">
          <el-option label="Nhân viên (employee)" value="employee" />
          <el-option label="Quản trị viên (admin)" value="admin" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="addDialogVisible = false">Hủy</el-button>
        <el-button type="primary" @click="submitAdd" :loading="submitLoading">Xác nhận</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- Modal Sửa thông tin -->
  <el-dialog
    v-model="editDialogVisible"
    title="CẬP NHẬT THÔNG TIN ĐĂNG KÝ"
    class="custom-dark-dialog"
    width="500px"
    destroy-on-close
    align-center
  >
    <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="120px" class="compact-form mt-2">
      <el-form-item label="Tên Đăng Nhập" prop="username">
        <el-input v-model="editForm.username" placeholder="Nhập tên đăng nhập..." />
      </el-form-item>
      <el-form-item label="Mật khẩu mới" prop="password">
        <el-input v-model="editForm.password" type="password" placeholder="Để trống nếu giữ nguyên..." show-password />
      </el-form-item>
      <el-form-item label="Mã Nhân Viên">
        <el-input v-model="editForm.employee_id" disabled />
      </el-form-item>
      <el-form-item label="Vai Trò" prop="role">
        <el-select v-model="editForm.role" class="w-full">
          <el-option label="Nhân viên (employee)" value="employee" />
          <el-option label="Quản trị viên (admin)" value="admin" />
        </el-select>
      </el-form-item>
      <el-form-item label="Trạng Thái" prop="is_active">
        <el-switch v-model="editForm.is_active" active-text="Hoạt động" inactive-text="Khóa" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="editDialogVisible = false">Hủy</el-button>
        <el-button type="primary" @click="submitEdit" :loading="submitLoading">Cập nhật</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { Lock, Search, Plus, Edit, Delete, InfoFilled, MoreFilled } from '@element-plus/icons-vue'
import { useWindowSize } from '@vueuse/core'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { authService } from '@/api/auth'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'

const { laManHep, hienBang, hienThe } = dungManHep()

const loading = ref(false)
const submitLoading = ref(false)
const activeTab = ref('credentials')

// Viewport sizes
const { width: windowWidth } = useWindowSize()
const isDesktop = computed(() => windowWidth.value >= 1024)

// Lists state
const credentialsList = ref<any[]>([])
const searchQuery = ref('')
const permSearchQuery = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

const permCurrentPage = ref(1)
const permPageSize = ref(10)

// Permissions map
const availablePermissions = [
  { key: 'admin', label: 'Admin' },
  { key: 'tien-nga', label: 'Tiến Nga' },
  { key: 'ggomoosin', label: 'Ggomoosin' },
  { key: 'rental', label: 'Rental' },
  { key: 'credit', label: 'Credit' },
  { key: 'harvest', label: 'Thu hoạch' },
  { key: 'project', label: 'Project' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'document', label: 'Document' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'other', label: 'Other' },
  { key: 'rosca', label: 'Hụi' }
]

// Direct Inline Toggles Async Map Loading
const permissionLoadingMap = reactive<Record<string, boolean>>({})

// Form state
const addDialogVisible = ref(false)
const editDialogVisible = ref(false)
const addFormRef = ref<any>(null)
const editFormRef = ref<any>(null)

const addForm = reactive({
  username: '',
  password: '',
  employee_id: '',
  role: 'employee'
})

const editForm = reactive({
  username: '',
  password: '',
  employee_id: '',
  role: 'employee',
  is_active: true
})

const rules = reactive({
  username: [{ required: true, message: 'Vui lòng nhập tên đăng nhập', trigger: 'blur' }],
  password: [{ required: true, message: 'Vui lòng nhập mật khẩu', trigger: 'blur' }],
  employee_id: [{ required: true, message: 'Vui lòng nhập mã nhân viên', trigger: 'blur' }],
  role: [{ required: true, message: 'Vui lòng chọn vai trò', trigger: 'change' }]
})

const editRules = reactive({
  username: [{ required: true, message: 'Vui lòng nhập tên đăng nhập', trigger: 'blur' }],
  role: [{ required: true, message: 'Vui lòng chọn vai trò', trigger: 'change' }]
})

// Load credentials
const fetchCredentials = async () => {
  loading.value = true
  try {
    const data = await authService.getAllCredentials()
    credentialsList.value = data
  } catch (error: any) {
    ElMessage.error(error.message || 'Không thể tải danh sách tài khoản đăng ký')
  } finally {
    loading.value = false
  }
}

// Client-side Filters
const filteredCredentials = computed(() => {
  return credentialsList.value.filter(c => {
    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return true
    return c.username?.toLowerCase().includes(q) || c.employee_id?.toLowerCase().includes(q)
  })
})

const paginatedCredentials = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredCredentials.value.slice(start, end)
})

const filteredPermCredentials = computed(() => {
  return credentialsList.value.filter(c => {
    const q = permSearchQuery.value.toLowerCase().trim()
    if (!q) return true
    return c.username?.toLowerCase().includes(q) || c.employee_id?.toLowerCase().includes(q)
  })
})

const paginatedPermCredentials = computed(() => {
  const start = (permCurrentPage.value - 1) * permPageSize.value
  const end = start + permPageSize.value
  return filteredPermCredentials.value.slice(start, end)
})

// Permissions Checks
const hasPermission = (row: any, key: string): boolean => {
  return Array.isArray(row.permissions) && row.permissions.includes(key)
}

// Inline Toggle Permissions
const handleTogglePermission = async (row: any, key: string, val: boolean | string | number) => {
  const isEnabled = !!val
  const loadKey = `${row.employee_id}_${key}`
  permissionLoadingMap[loadKey] = true
  
  // Calculate new permissions list
  let currentPermissions = Array.isArray(row.permissions) ? [...row.permissions] : []
  if (isEnabled) {
    if (!currentPermissions.includes(key)) currentPermissions.push(key)
  } else {
    currentPermissions = currentPermissions.filter(p => p !== key)
  }

  try {
    const responsePermissions = await authService.updatePermissions(row.employee_id, currentPermissions)
    row.permissions = responsePermissions
    ElNotification({
      title: 'Thành công',
      message: `Đã ${isEnabled ? 'cấp' : 'hủy'} quyền "${key}" cho tài khoản "${row.username}".`,
      type: 'success',
      duration: 2500
    })
  } catch (error: any) {
    ElMessage.error(error.message || 'Cập nhật phân quyền thất bại')
  } finally {
    permissionLoadingMap[loadKey] = false
  }
}

// Dialog Add/Edit Helpers
const openAddDialog = () => {
  addForm.username = ''
  addForm.password = ''
  addForm.employee_id = ''
  addForm.role = 'employee'
  addDialogVisible.value = true
}

const openEditDialog = (row: any) => {
  editForm.username = row.username || ''
  editForm.password = ''
  editForm.employee_id = row.employee_id
  editForm.role = row.role || 'employee'
  editForm.is_active = row.is_active !== false
  editDialogVisible.value = true
}

const handleCommand = (cmd: string, row: any) => {
  if (cmd === 'edit') {
    openEditDialog(row)
  } else if (cmd === 'delete') {
    handleDelete(row)
  }
}

const submitAdd = async () => {
  if (!addFormRef.value) return
  await addFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitLoading.value = true
      try {
        await authService.register({
          username: addForm.username,
          password: addForm.password,
          employee_id: addForm.employee_id,
          role: addForm.role
        })
        ElNotification({
          title: 'Thành công',
          message: 'Tạo tài khoản đăng ký thành công!',
          type: 'success'
        })
        addDialogVisible.value = false
        fetchCredentials()
      } catch (error: any) {
        ElMessage.error(error.message || 'Đăng ký tài khoản thất bại')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const submitEdit = async () => {
  if (!editFormRef.value) return
  await editFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitLoading.value = true
      try {
        const payload: any = {
          username: editForm.username,
          role: editForm.role,
          is_active: editForm.is_active
        }
        if (editForm.password) {
          payload.password = editForm.password
        }
        await authService.updateCredential(editForm.employee_id, payload)
        ElNotification({
          title: 'Thành công',
          message: 'Cập nhật tài khoản thành công!',
          type: 'success'
        })
        editDialogVisible.value = false
        fetchCredentials()
      } catch (error: any) {
        ElMessage.error(error.message || 'Cập nhật tài khoản thất bại')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa tài khoản đăng ký "${row.username}" không? Nhân viên này sẽ không thể đăng nhập được nữa.`,
      'Xác nhận xóa tài khoản',
      {
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy',
        type: 'warning'
      }
    )
    loading.value = true
    await authService.deleteCredential(row.employee_id)
    ElNotification({
      title: 'Thành công',
      message: 'Xóa tài khoản đăng ký thành công!',
      type: 'success'
    })
    fetchCredentials()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || 'Xóa tài khoản thất bại')
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCredentials()
})
</script>

<style scoped>
.authorization-tabs {
  border-radius: 8px;
  overflow: hidden;
}

.authorization-tabs :deep(.el-tabs__content) {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.authorization-tabs :deep(.el-tab-pane) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

html.dark .authorization-tabs {
  background-color: #1f2937;
  border-color: #374151;
}

html.dark .authorization-tabs :deep(.el-tabs__header) {
  background-color: #111827;
  border-bottom-color: #374151;
}

html.dark .authorization-tabs :deep(.el-tabs__item) {
  color: #9ca3af;
  border-color: transparent;
  transition: all 0.3s;
}

html.dark .authorization-tabs :deep(.el-tabs__item:hover) {
  color: #d1d5db;
}

html.dark .authorization-tabs :deep(.el-tabs__item.is-active) {
  background-color: #1f2937;
  border-right-color: #374151;
  border-left-color: #374151;
  border-bottom-color: #1f2937;
  color: #60a5fa;
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

.auth-content {
  height: 100%;
}

/* Custom dark mode styles for table to match application theme */
html.dark .auth-content :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .auth-content :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .auth-content :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

html.dark .auth-content :deep(.el-table .el-table-fixed-column--left),
html.dark .auth-content :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important;
}

/* Custom dark mode styles for input/select in authorization component */
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
  font-size: 0.65rem;
}
</style>
