<template>
  <div class="other-device-container h-full flex flex-col">
    <!-- Filter Bar -->
    <div class="flex flex-wrap justify-between items-center gap-4 mb-4 shrink-0">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Classification select -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Phân loại:</span>
          <el-select
            v-model="filterClassification"
            placeholder="Tất cả"
            clearable
            class="w-56 custom-dark-input"
            style="width: 120px"
            @change="handleClassificationChange"
          >
            <el-option label="Tất cả" value="" />
            <el-option label="Công việc" value="Công việc" />
            <el-option label="Cá nhân" value="Cá nhân" />
          </el-select>
        </div>

        <!-- Search query input -->
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
          <el-input
            v-model="searchQuery"
            placeholder="Tên thiết bị, hãng, IP, Serial, Vị trí..."
            clearable
            class="w-64 custom-dark-input"
            style="width: 256px"
          />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <el-button :icon="Refresh" circle @click="fetchOtherDevices" :loading="loading" />
        <el-button type="primary" @click="openAddDialog">
          <el-icon class="mr-1"><Plus /></el-icon> Thêm Thiết bị
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
      <el-table v-if="hienBang" v-loading="loading" :data="paginatedDevices" style="width: 100%" class="flex-1" height="100%">
        <!-- STT Column -->
        <el-table-column label="STT" width="52" align="center">
          <template #default="{ $index }">
            <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>

        <!-- Mã thiết bị (ID) -->
        <el-table-column prop="id" label="Mã TB (ID)" width="101" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.id }}</span>
          </template>
        </el-table-column>

        <!-- Tên thiết bị -->
        <el-table-column prop="device_name" label="Tên thiết bị" min-width="137" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-bold text-gray-850 dark:text-gray-100">{{ row.device_name }}</span>
          </template>
        </el-table-column>

        <!-- Hãng sản xuất -->
        <el-table-column prop="brand" label="Hãng" width="94" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-bold text-gray-800 dark:text-gray-200">{{ row.brand || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Mã Model -->
        <el-table-column prop="model_number" label="Mã Model" width="101" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-xs text-gray-700 dark:text-gray-300 font-semibold">{{ row.model_number || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Danh mục -->
        <el-table-column prop="device_category" label="Danh mục" width="101" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain" class="font-semibold">
              {{ getCategoryLabel(row.device_category) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Phân loại -->
        <el-table-column prop="classification" label="Phân loại" width="94" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.classification" size="small" :type="row.classification === 'Công việc' ? 'primary' : 'success'" effect="plain">
              {{ row.classification }}
            </el-tag>
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>

        <!-- Địa chỉ IP -->
        <el-table-column prop="ip_address" label="Địa chỉ IP" width="108" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono text-xs text-blue-650 dark:text-blue-400 select-all">{{ row.ip_address || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Vị trí đặt -->
        <el-table-column prop="location" label="Vị trí đặt" width="115" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-xs text-gray-750 dark:text-gray-250 font-semibold">{{ row.location || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Tài khoản cấu hình -->
        <el-table-column prop="login_account" label="Tài khoản" width="108" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-xs text-gray-700 dark:text-gray-300">{{ row.login_account || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Mật khẩu đăng nhập -->
        <el-table-column label="Mật khẩu" width="94" show-overflow-tooltip>
          <template #default="{ row }">
            <div v-if="row.login_password" class="flex items-center gap-1 text-gray-400 text-xs">
              <span class="font-mono">{{ isPasswordRevealed(row.id) ? row.login_password : '••••••••' }}</span>
              <el-button link type="info" size="small" class="!p-0 h-auto" @click="togglePasswordReveal(row.id)">
                <el-icon :size="10"><component :is="isPasswordRevealed(row.id) ? Hide : View" /></el-icon>
              </el-button>
            </div>
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>

        <!-- Số Serial -->
        <el-table-column prop="serial_number" label="Số Serial" width="108" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono text-xs text-gray-750 dark:text-gray-250">{{ row.serial_number || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Trạng thái -->
        <el-table-column prop="status" label="Trạng thái" width="108" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getStatusTagType(row.status)" effect="dark" class="font-bold">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Hạn bảo hành -->
        <el-table-column prop="warranty_expiry" label="Hạn bảo hành" width="101" align="center">
          <template #default="{ row }">
            <span class="font-mono text-xs">{{ formatDate(row.warranty_expiry) }}</span>
          </template>
        </el-table-column>

        <!-- Ngày mua -->
        <el-table-column prop="purchase_date" label="Ngày mua" width="86" align="center">
          <template #default="{ row }">
            <span class="font-mono text-xs">{{ formatDate(row.purchase_date) }}</span>
          </template>
        </el-table-column>

        <!-- Phụ kiện -->
        <el-table-column prop="accessories" label="Phụ kiện" width="122" show-overflow-tooltip />

        <!-- Ghi chú -->
        <el-table-column prop="notes" label="Ghi chú" min-width="130" show-overflow-tooltip />

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
                  <el-dropdown-item command="handover">Bàn giao</el-dropdown-item>
                  <el-dropdown-item command="return">Thu hồi</el-dropdown-item>
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
        <div v-if="paginatedDevices.length > 0" class="grid grid-cols-1 gap-4">
          <div
            v-for="(row, i) in (paginatedDevices as any[])"
            :key="row.id || row.contract_id || i"
            class="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
              <div class="min-w-0 break-words">
                <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.id }}</span>
              </div>
              <div class="shrink-0">
                <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
                              <el-button link type="info" class="p-1">
                                <el-icon class="text-xl"><MoreFilled /></el-icon>
                              </el-button>
                              <template #dropdown>
                                <el-dropdown-menu>
                                  <el-dropdown-item command="detail">Chi tiết</el-dropdown-item>
                                  <el-dropdown-item command="handover">Bàn giao</el-dropdown-item>
                                  <el-dropdown-item command="return">Thu hồi</el-dropdown-item>
                                  <el-dropdown-item command="edit">Chỉnh sửa</el-dropdown-item>
                                  <el-dropdown-item command="delete" divided class="!text-red-500">Xóa</el-dropdown-item>
                                </el-dropdown-menu>
                              </template>
                            </el-dropdown>
              </div>
            </div>
            <div class="space-y-2 text-sm text-left">
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tên thiết bị:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-bold text-gray-850 dark:text-gray-100">{{ row.device_name }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Hãng:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-bold text-gray-800 dark:text-gray-200">{{ row.brand || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Mã Model:</span>
                <span class="text-right break-words min-w-0">
                  <span class="text-xs text-gray-700 dark:text-gray-300 font-semibold">{{ row.model_number || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Danh mục:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag size="small" type="info" effect="plain" class="font-semibold">
                                {{ getCategoryLabel(row.device_category) }}
                              </el-tag>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Phân loại:</span>
                <span class="text-right break-words min-w-0">
                  <el-tag v-if="row.classification" size="small" :type="row.classification === 'Công việc' ? 'primary' : 'success'" effect="plain">
                                {{ row.classification }}
                              </el-tag>
                              <span v-else class="text-gray-400">—</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Địa chỉ IP:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-mono text-xs text-blue-650 dark:text-blue-400 select-all">{{ row.ip_address || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Vị trí đặt:</span>
                <span class="text-right break-words min-w-0">
                  <span class="text-xs text-gray-750 dark:text-gray-250 font-semibold">{{ row.location || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tài khoản:</span>
                <span class="text-right break-words min-w-0">
                  <span class="text-xs text-gray-700 dark:text-gray-300">{{ row.login_account || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Mật khẩu:</span>
                <span class="text-right break-words min-w-0">
                  <div v-if="row.login_password" class="flex items-center gap-1 text-gray-400 text-xs">
                                <span class="font-mono">{{ isPasswordRevealed(row.id) ? row.login_password : '••••••••' }}</span>
                                <el-button link type="info" size="small" class="!p-0 h-auto" @click="togglePasswordReveal(row.id)">
                                  <el-icon :size="10"><component :is="isPasswordRevealed(row.id) ? Hide : View" /></el-icon>
                                </el-button>
                              </div>
                              <span v-else class="text-gray-400">—</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Số Serial:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-mono text-xs text-gray-750 dark:text-gray-250">{{ row.serial_number || '—' }}</span>
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
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Hạn bảo hành:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-mono text-xs">{{ formatDate(row.warranty_expiry) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ngày mua:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-mono text-xs">{{ formatDate(row.purchase_date) }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Phụ kiện:</span>
                <span class="text-right break-words min-w-0">
                  {{ row.accessories }}
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Ghi chú:</span>
                <span class="text-right break-words min-w-0">
                  {{ row.notes }}
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
          :total="filteredDevices.length"
        />
      </div>
    </div>

    <!-- Dialog: Add / Edit Other Device -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'CHỈNH SỬA THÔNG TIN THIẾT BỊ KHÁC' : 'THÊM THIẾT BỊ KHÁC MỚI'"
      width="900px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="170px" class="mt-2 compact-form">
          <!-- PHẦN 1: THÔNG TIN CƠ BẢN -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin chung thiết bị
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã thiết bị (ID)" prop="id">
                  <el-input v-model="form.id" :disabled="isEdit" placeholder="VD: OD0001..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tên thiết bị" prop="device_name">
                  <el-input v-model="form.device_name" placeholder="VD: Máy in Canon 2900, UPS APC 1000..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Danh mục thiết bị" prop="device_category">
                  <el-select v-model="form.device_category" placeholder="Chọn danh mục..." class="w-full">
                    <el-option label="Máy in" value="printer" />
                    <el-option label="Bộ định tuyến / Switch" value="router" />
                    <el-option label="Máy chiếu" value="projector" />
                    <el-option label="Bộ lưu điện (UPS)" value="ups" />
                    <el-option label="Máy quét (Scanner)" value="scanner" />
                    <el-option label="Loa / Âm thanh" value="speaker" />
                    <el-option label="Khác" value="other" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Hãng sản xuất" prop="brand">
                  <el-input v-model="form.brand" placeholder="VD: Canon, Cisco, Sony, APC..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã Model" prop="model_number">
                  <el-input v-model="form.model_number" placeholder="VD: LBP2900, C2960-X..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Phân loại" prop="classification">
                  <el-select v-model="form.classification" placeholder="Chọn phân loại..." class="w-full">
                    <el-option label="Công việc" value="Công việc" />
                    <el-option label="Cá nhân" value="Cá nhân" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Vị trí đặt" prop="location">
                  <el-input v-model="form.location" placeholder="VD: Quầy lễ tân, Phòng họp tầng 2..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Số Serial (S/N)" prop="serial_number">
                  <el-input v-model="form.serial_number" placeholder="Nhập số Serial..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: THÔNG SỐ CẤU HÌNH & MẠNG -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Thông số cấu hình &amp; Kết nối mạng
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Địa chỉ IP" prop="ip_address">
                  <el-input v-model="form.ip_address" placeholder="VD: 192.168.1.50" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Địa chỉ MAC" prop="mac_address">
                  <el-input v-model="form.mac_address" placeholder="VD: AA:BB:CC:DD:EE:FF" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tài khoản đăng nhập" prop="login_account">
                  <el-input v-model="form.login_account" placeholder="admin, user..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Mật khẩu thiết bị" prop="login_password">
                  <el-input v-model="form.login_password" type="password" show-password placeholder="Nhập mật khẩu..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Thông số chi tiết" prop="specs">
                  <el-input v-model="form.specs" type="textarea" :rows="2" placeholder="Thông số kỹ thuật chi tiết..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 3: BẢO HÀNH & VẬN HÀNH -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-violet-650 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
              Thời hạn &amp; Trạng thái bảo dưỡng
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Ngày mua sắm" prop="purchase_date">
                  <el-date-picker :editable="false" v-model="form.purchase_date" type="date" value-format="YYYY-MM-DD" placeholder="Chọn ngày mua..." class="!w-full" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Hạn bảo hành" prop="warranty_expiry">
                  <el-date-picker :editable="false" v-model="form.warranty_expiry" type="date" value-format="YYYY-MM-DD" placeholder="Chọn hạn bảo hành..." class="!w-full" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Trạng thái" prop="status">
                  <el-select v-model="form.status" placeholder="Chọn trạng thái..." class="w-full">
                    <el-option
                      v-for="opt in DEVICE_STATUS_OPTIONS"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Phụ kiện đi kèm" prop="accessories">
                  <el-input v-model="form.accessories" placeholder="VD: Dây nguồn, cáp USB, hộp đựng..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Ghi chú chi tiết" prop="notes">
                  <el-input v-model="form.notes" type="textarea" :rows="2" placeholder="Ghi chú thêm về thiết bị..." />
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

    <!-- Dialog: Detail Other Device -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT THÔNG TIN THIẾT BỊ KHÁC"
      width="750px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedDevice" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto text-left">
        <!-- Visual Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-blue-500 dark:bg-blue-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32"><Cpu /></el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Thiết bị Office / IT bổ sung</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {{ selectedDevice.device_name }}
              <span class="text-gray-400 dark:text-gray-500 font-mono font-medium" v-if="selectedDevice.brand">({{ selectedDevice.brand }})</span>
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <span class="text-gray-500 dark:text-gray-400">Danh mục: <strong class="text-gray-750 dark:text-gray-250">{{ getCategoryLabel(selectedDevice.device_category) }}</strong></span>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span class="text-gray-500 dark:text-gray-400">Vị trí đặt: <strong>{{ selectedDevice.location || '—' }}</strong></span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã thiết bị (ID)</div>
            <div class="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">{{ selectedDevice.id }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số Serial (S/N)</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono">{{ selectedDevice.serial_number || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã Model</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedDevice.model_number || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Phân loại</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedDevice.classification || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Địa chỉ IP</div>
            <div class="text-sm font-mono text-blue-600 dark:text-blue-400 select-all">{{ selectedDevice.ip_address || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Địa chỉ MAC</div>
            <div class="text-sm font-mono text-gray-750 dark:text-gray-300">{{ selectedDevice.mac_address || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Thời hạn bảo hành</div>
            <div class="text-sm font-mono text-gray-750 dark:text-gray-300">{{ formatDate(selectedDevice.warranty_expiry) }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày mua sắm</div>
            <div class="text-sm font-mono text-gray-750 dark:text-gray-300">{{ formatDate(selectedDevice.purchase_date) }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Phụ kiện đi kèm</div>
            <div class="text-sm text-gray-700 dark:text-gray-300">{{ selectedDevice.accessories || 'Không có' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Trạng thái</div>
            <div>
              <el-tag size="small" :type="getStatusTagType(selectedDevice.status)" effect="dark" class="font-bold">
                {{ getStatusLabel(selectedDevice.status) }}
              </el-tag>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-150 dark:border-gray-700 pt-4 space-y-4">
          <div v-if="selectedDevice.specs">
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Thông số kỹ thuật chi tiết</div>
            <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ selectedDevice.specs }}</p>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tài khoản &amp; Cấu hình thiết bị</div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
              <div>
                <div class="text-xxs font-semibold text-gray-400">Tên tài khoản login</div>
                <div class="text-xs font-bold text-gray-800 dark:text-gray-200 mt-0.5 select-all">{{ selectedDevice.login_account || '—' }}</div>
              </div>
              <div>
                <div class="text-xxs font-semibold text-gray-400">Mật khẩu login</div>
                <div class="text-xs font-mono font-bold text-gray-850 dark:text-gray-200 mt-0.5 select-all">{{ selectedDevice.login_password || '—' }}</div>
              </div>
            </div>
          </div>
          <div v-if="selectedDevice.notes">
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ghi chú vận hành</div>
            <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ selectedDevice.notes }}</p>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="detailDialogVisible = false">Đóng</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Modal: Bàn giao Thiết bị khác -->
    <DeviceHandoverModal
      v-model="handoverModalVisible"
      :device-info="handoverDeviceInfo"
      @success="handleHandoverSuccess"
    />

    <!-- Modal: Thu hồi Thiết bị khác -->
    <DeviceReturnModal
      v-model="returnModalVisible"
      :device-info="returnDeviceInfo"
      @success="handleReturnSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Cpu, Refresh, Plus, MoreFilled, View, Hide } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { otherService } from '@/api/otherService'
import DeviceHandoverModal from './DeviceHandoverModal.vue'
import DeviceReturnModal from './DeviceReturnModal.vue'
import { DEVICE_STATUS_OPTIONS, getDeviceStatusLabel, getDeviceStatusTagType, isReadyForHandover, isHandedOverOrInUse, DeviceStatus } from '@/constants/deviceStatus'
// MỤC 396 — ngưỡng màn hẹp dùng CHUNG, không chép lại logic
// resize vào từng file. Xem `src/composables/manHep.ts`.
import { dungManHep } from '@/composables/manHep'

const { laManHep, hienBang, hienThe } = dungManHep()

// Search, Classification filters
const searchQuery = ref('')
const filterClassification = ref('')
const loading = ref(false)

const devices = ref<any[]>([])

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Password mask reveal state
const revealedPasswords = ref<Record<string, boolean>>({})

const togglePasswordReveal = (id: string) => {
  revealedPasswords.value[id] = !revealedPasswords.value[id]
}

const isPasswordRevealed = (id: string) => {
  return !!revealedPasswords.value[id]
}

// Fetch other devices list from GET API
const fetchOtherDevices = async () => {
  loading.value = true
  currentPage.value = 1
  try {
    const data = await otherService.getOtherDevices({
      classification: filterClassification.value || undefined
    })
    devices.value = data
  } catch (error: any) {
    console.error('API get-other-devices failed:', error)
    ElMessage.error(error.message || 'Lỗi khi tải danh sách thiết bị khác từ API')
    devices.value = []
  } finally {
    loading.value = false
  }
}

const handleClassificationChange = () => {
  fetchOtherDevices()
}

// Search Computed
const filteredDevices = computed(() => {
  return devices.value.filter(item => {
    const q = searchQuery.value.toLowerCase()
    
    const matchesSearch = !q ||
      item.device_name.toLowerCase().includes(q) ||
      (item.brand && item.brand.toLowerCase().includes(q)) ||
      (item.model_number && item.model_number.toLowerCase().includes(q)) ||
      (item.ip_address && item.ip_address.includes(q)) ||
      (item.location && item.location.toLowerCase().includes(q)) ||
      (item.serial_number && item.serial_number.toLowerCase().includes(q))

    const matchesClassification = !filterClassification.value || 
      item.classification === filterClassification.value

    return matchesSearch && matchesClassification
  })
})

const paginatedDevices = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredDevices.value.slice(start, end)
})

// Dialog States
const dialogVisible = ref(false)
const isEdit = ref(false)
const detailDialogVisible = ref(false)
const selectedDevice = ref<any | null>(null)
const formRef = ref<any>(null)

// Handover Modal State
const handoverModalVisible = ref(false)
const handoverDeviceInfo = ref<any | null>(null)

// Return Modal State
const returnModalVisible = ref(false)
const returnDeviceInfo = ref<any | null>(null)

const form = reactive({
  id: '',
  device_name: '',
  device_category: 'printer',
  brand: '',
  model_number: '',
  serial_number: '',
  specs: '',
  ip_address: '',
  mac_address: '',
  login_account: '',
  login_password: '',
  location: '',
  purchase_date: '',
  warranty_expiry: '',
  status: 'available',
  accessories: '',
  notes: '',
  classification: 'Công việc'
})

const rules = reactive({
  id: [{ required: true, message: 'Vui lòng nhập mã thiết bị (ID)', trigger: 'blur' }],
  device_name: [{ required: true, message: 'Vui lòng nhập tên thiết bị', trigger: 'blur' }],
  device_category: [{ required: true, message: 'Vui lòng chọn danh mục', trigger: 'change' }],
  status: [{ required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change' }]
})

// Action Handlers
const handleCommand = (cmd: string, row: any) => {
  if (cmd === 'detail') {
    selectedDevice.value = row
    detailDialogVisible.value = true
  } else if (cmd === 'handover') {
    if (!isReadyForHandover(row.status)) {
      ElMessage.warning('Chỉ thiết bị ở trạng thái "Sẵn sàng bàn giao" mới có thể thực hiện bàn giao!')
      return
    }
    handoverDeviceInfo.value = {
      id: row.id,
      type: 'other',
      status: row.status,
      model_name: row.device_name,
      brand: row.brand
    }
    handoverModalVisible.value = true
  } else if (cmd === 'return') {
    if (!isHandedOverOrInUse(row.status)) {
      ElMessage.warning('Chỉ thiết bị đang ở trạng thái "Đã bàn giao" hoặc "Đang sử dụng" mới có thể thực hiện thu hồi!')
      return
    }
    returnDeviceInfo.value = {
      id: row.id,
      type: 'other',
      status: row.status,
      model_name: row.device_name,
      brand: row.brand
    }
    returnModalVisible.value = true
  } else if (cmd === 'edit') {
    openEditDialog(row)
  } else if (cmd === 'delete') {
    handleDelete(row)
  }
}

const handleHandoverSuccess = () => {
  fetchOtherDevices()
}

const handleReturnSuccess = () => {
  fetchOtherDevices()
}

const openAddDialog = () => {
  isEdit.value = false
  form.id = ''
  form.device_name = ''
  form.device_category = 'printer'
  form.brand = ''
  form.model_number = ''
  form.serial_number = ''
  form.specs = ''
  form.ip_address = ''
  form.mac_address = ''
  form.login_account = ''
  form.login_password = ''
  form.location = ''
  form.purchase_date = ''
  form.warranty_expiry = ''
  form.status = 'available'
  form.accessories = ''
  form.notes = ''
  form.classification = 'Công việc'
  dialogVisible.value = true
}

const openEditDialog = (row: any) => {
  isEdit.value = true
  form.id = row.id
  form.device_name = row.device_name
  form.device_category = row.device_category
  form.brand = row.brand || ''
  form.model_number = row.model_number || ''
  form.serial_number = row.serial_number || ''
  form.specs = row.specs || ''
  form.ip_address = row.ip_address || ''
  form.mac_address = row.mac_address || ''
  form.login_account = row.login_account || ''
  form.login_password = row.login_password || ''
  form.location = row.location || ''
  form.purchase_date = row.purchase_date || ''
  form.warranty_expiry = row.warranty_expiry || ''
  form.status = row.status
  form.accessories = row.accessories || ''
  form.notes = row.notes || ''
  form.classification = row.classification || 'Công việc'
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      const payload = {
        id: form.id,
        device_name: form.device_name,
        device_category: form.device_category,
        brand: form.brand || null,
        model_number: form.model_number || null,
        serial_number: form.serial_number || null,
        specs: form.specs || null,
        ip_address: form.ip_address || null,
        mac_address: form.mac_address || null,
        login_account: form.login_account || null,
        login_password: form.login_password || null,
        location: form.location || null,
        purchase_date: form.purchase_date || null,
        warranty_expiry: form.warranty_expiry || null,
        status: form.status,
        accessories: form.accessories || null,
        notes: form.notes || null,
        classification: form.classification || null
      }

      try {
        if (isEdit.value) {
          const editPayload = { ...payload }
          await otherService.updateOtherDevices([editPayload])

          const idx = devices.value.findIndex(s => s.id === form.id)
          if (idx !== -1) {
            devices.value[idx] = { ...devices.value[idx], ...editPayload }
          }
          ElMessage.success('Cập nhật thông tin thiết bị thành công!')
        } else {
          const res = await otherService.addOtherDevices([payload])
          if (res && res.length > 0) {
            devices.value.unshift(res[0])
          } else {
            devices.value.unshift({ ...payload })
          }
          ElMessage.success('Thêm mới thiết bị thành công!')
        }
        dialogVisible.value = false
      } catch (error: any) {
        ElMessage.error(error.message || 'Lỗi khi lưu thông tin thiết bị')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa thiết bị "${row.device_name}" (${row.id}) khỏi cơ sở dữ liệu?`,
      'Xác nhận xóa thiết bị',
      {
        confirmButtonText: 'Xóa bỏ',
        cancelButtonText: 'Hủy',
        type: 'warning'
      }
    )
    loading.value = true
    await otherService.deleteOtherDevices([row.id])

    devices.value = devices.value.filter(s => s.id !== row.id)
    ElMessage.success('Xóa thiết bị thành công!')
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || 'Lỗi khi xóa thiết bị')
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

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'printer': return 'Máy in'
    case 'router': return 'Bộ định tuyến/Switch'
    case 'projector': return 'Máy chiếu'
    case 'ups': return 'Bộ lưu điện (UPS)'
    case 'scanner': return 'Máy quét (Scanner)'
    case 'speaker': return 'Loa / Âm thanh'
    case 'other': return 'Khác'
    default: return category || 'Thiết bị khác'
  }
}

const getStatusLabel = (status: string) => {
  return getDeviceStatusLabel(status)
}

const getStatusTagType = (status: string) => {
  return getDeviceStatusTagType(status)
}

onMounted(() => {
  fetchOtherDevices()
})
</script>

<style scoped>
html.dark .other-device-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .other-device-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .other-device-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

html.dark .other-device-container :deep(.el-table .el-table-fixed-column--left),
html.dark .other-device-container :deep(.el-table .el-table-fixed-column--right) {
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
