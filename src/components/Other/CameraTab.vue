<template>
  <div class="camera-container h-full flex flex-col">
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
            placeholder="Dòng máy, hãng, IP, Vị trí, Serial..."
            clearable
            class="w-64 custom-dark-input"
            style="width: 256px"
          />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <el-button :icon="Refresh" circle @click="fetchCameras" :loading="loading" />
        <el-button type="primary" @click="openAddDialog">
          <el-icon class="mr-1"><Plus /></el-icon> Thêm Camera
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
      <el-table v-if="hienBang" v-loading="loading" :data="paginatedCameras" style="width: 100%" class="flex-1" height="100%">
        <!-- STT Column -->
        <el-table-column label="STT" width="52" align="center">
          <template #default="{ $index }">
            <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>

        <!-- Mã máy (ID) -->
        <el-table-column prop="id" label="Mã máy (ID)" width="101" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.id }}</span>
          </template>
        </el-table-column>

        <!-- Hãng sản xuất -->
        <el-table-column prop="brand" label="Hãng" width="94" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-bold text-gray-800 dark:text-gray-200">{{ row.brand || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Dòng máy -->
        <el-table-column prop="model_name" label="Dòng máy" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-bold text-gray-850 dark:text-gray-100">{{ row.model_name }}</span>
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

        <!-- Loại Camera -->
        <el-table-column prop="camera_type" label="Loại Camera" width="101" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-xs text-gray-700 dark:text-gray-300 font-semibold">{{ row.camera_type || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Độ phân giải -->
        <el-table-column prop="resolution" label="Độ phân giải" width="97" align="center">
          <template #default="{ row }">
            <span class="text-xs text-gray-700 dark:text-gray-300">{{ row.resolution || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Địa chỉ IP -->
        <el-table-column prop="ip_address" label="Địa chỉ IP" width="108" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono text-xs text-blue-600 dark:text-blue-400 select-all">{{ row.ip_address || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Cổng (Port) -->
        <el-table-column prop="port" label="Cổng (Port)" width="79" align="center" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono text-xs text-gray-700 dark:text-gray-300">{{ row.port || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Vị trí đặt -->
        <el-table-column prop="location" label="Vị trí đặt" width="115" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-xs text-gray-750 dark:text-gray-250 font-semibold">{{ row.location || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Tài khoản đăng nhập -->
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

        <!-- Phương thức lưu trữ -->
        <el-table-column prop="storage_type" label="Lưu trữ" width="101" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-xs text-gray-700 dark:text-gray-300">{{ row.storage_type || '—' }}</span>
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

        <!-- Số Serial -->
        <el-table-column prop="serial_number" label="Số Serial" width="108" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono text-xs text-gray-750 dark:text-gray-250">{{ row.serial_number || '—' }}</span>
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
        <div v-if="paginatedCameras.length > 0" class="grid grid-cols-1 gap-4">
          <div
            v-for="(row, i) in (paginatedCameras as any[])"
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
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Hãng:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-bold text-gray-800 dark:text-gray-200">{{ row.brand || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Dòng máy:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-bold text-gray-850 dark:text-gray-100">{{ row.model_name }}</span>
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
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Loại Camera:</span>
                <span class="text-right break-words min-w-0">
                  <span class="text-xs text-gray-700 dark:text-gray-300 font-semibold">{{ row.camera_type || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Độ phân giải:</span>
                <span class="text-right break-words min-w-0">
                  <span class="text-xs text-gray-700 dark:text-gray-300">{{ row.resolution || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Địa chỉ IP:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-mono text-xs text-blue-600 dark:text-blue-400 select-all">{{ row.ip_address || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Cổng (Port):</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-mono text-xs text-gray-700 dark:text-gray-300">{{ row.port || '—' }}</span>
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
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Lưu trữ:</span>
                <span class="text-right break-words min-w-0">
                  <span class="text-xs text-gray-700 dark:text-gray-300">{{ row.storage_type || '—' }}</span>
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
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Số Serial:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-mono text-xs text-gray-750 dark:text-gray-250">{{ row.serial_number || '—' }}</span>
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
          :total="filteredCameras.length"
        />
      </div>
    </div>

    <!-- Dialog: Add / Edit Camera -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'CHỈNH SỬA THÔNG TIN CAMERA' : 'THÊM CAMERA MỚI'"
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
              Thông tin nhận diện thiết bị
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã thiết bị (ID)" prop="id">
                  <el-input v-model="form.id" :disabled="isEdit" placeholder="VD: CAM0001..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Hãng sản xuất" prop="brand">
                  <el-input v-model="form.brand" placeholder="VD: Hikvision, Dahua, Ezviz..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Dòng máy" prop="model_name">
                  <el-input v-model="form.model_name" placeholder="VD: DS-2CD1043G0-I..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Số Serial (S/N)" prop="serial_number">
                  <el-input v-model="form.serial_number" placeholder="Nhập số Serial..." />
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
                <el-form-item label="Vị trí lắp đặt" prop="location">
                  <el-input v-model="form.location" placeholder="VD: Cổng chính, Sảnh chính, Kho A..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Loại Camera" prop="camera_type">
                  <el-input v-model="form.camera_type" placeholder="VD: IP Camera, Dome, PTZ..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: THÔNG SỐ MẠNG & AN NINH -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Thông số mạng &amp; Tài khoản cấu hình
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Địa chỉ IP" prop="ip_address">
                  <el-input v-model="form.ip_address" placeholder="VD: 192.168.1.100" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Cổng (Port)" prop="port">
                  <el-input v-model="form.port" placeholder="VD: 80, 8000, 554..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Địa chỉ MAC" prop="mac_address">
                  <el-input v-model="form.mac_address" placeholder="VD: AA:BB:CC:DD:EE:FF" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Độ phân giải" prop="resolution">
                  <el-input v-model="form.resolution" placeholder="VD: 2MP, 4MP, 4K..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tài khoản admin" prop="login_account">
                  <el-input v-model="form.login_account" placeholder="admin, root..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Mật khẩu thiết bị" prop="login_password">
                  <el-input v-model="form.login_password" type="password" show-password placeholder="Mật khẩu camera..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 3: LƯU TRỮ & VẬN HÀNH -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-violet-650 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
              Lưu trữ &amp; Trạng thái bảo hành
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Phương thức lưu trữ" prop="storage_type">
                  <el-input v-model="form.storage_type" placeholder="VD: Thẻ nhớ 128GB, đầu ghi NVR, Cloud..." />
                </el-form-item>
              </el-col>
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
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Ngày mua sắm" prop="purchase_date">
                  <el-date-picker :editable="false" v-model="form.purchase_date" type="date" value-format="YYYY-MM-DD" placeholder="Chọn ngày mua..." class="!w-full" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Hạn bảo hành" prop="warranty_expiry">
                  <el-date-picker :editable="false" v-model="form.warranty_expiry" type="date" value-format="YYYY-MM-DD" placeholder="Chọn ngày hết hạn..." class="!w-full" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Ghi chú chi tiết" prop="notes">
                  <el-input v-model="form.notes" type="textarea" :rows="2" placeholder="Ghi chú thêm về camera..." />
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

    <!-- Dialog: Detail Camera -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT THÔNG TIN CAMERA"
      width="750px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedCamera" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto text-left">
        <!-- Visual Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-blue-500 dark:bg-blue-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32"><VideoCamera /></el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Thiết bị giám sát Camera</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {{ selectedCamera.model_name }}
              <span class="text-gray-400 dark:text-gray-500 font-mono font-medium" v-if="selectedCamera.brand">({{ selectedCamera.brand }})</span>
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <span class="text-gray-500 dark:text-gray-400">Phân loại: <strong class="text-gray-750 dark:text-gray-250">{{ selectedCamera.classification || '—' }}</strong></span>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span class="text-gray-500 dark:text-gray-400">Vị trí: <strong>{{ selectedCamera.location || '—' }}</strong></span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã thiết bị (ID)</div>
            <div class="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">{{ selectedCamera.id }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số Serial (S/N)</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono">{{ selectedCamera.serial_number || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Địa chỉ IP &amp; Port</div>
            <div class="text-sm font-bold text-blue-600 select-all">{{ selectedCamera.ip_address || '—' }}<span v-if="selectedCamera.port" class="text-gray-500">:{{ selectedCamera.port }}</span></div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Địa chỉ MAC</div>
            <div class="text-sm font-mono text-gray-750 dark:text-gray-300">{{ selectedCamera.mac_address || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Độ phân giải</div>
            <div class="text-sm text-gray-700 dark:text-gray-300">{{ selectedCamera.resolution || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Loại Camera</div>
            <div class="text-sm text-gray-700 dark:text-gray-300">{{ selectedCamera.camera_type || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Phương thức lưu trữ</div>
            <div class="text-sm text-gray-700 dark:text-gray-300">{{ selectedCamera.storage_type || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Thời hạn bảo hành</div>
            <div class="text-sm font-mono text-gray-750 dark:text-gray-300">{{ formatDate(selectedCamera.warranty_expiry) }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày mua sắm</div>
            <div class="text-sm font-mono text-gray-750 dark:text-gray-300">{{ formatDate(selectedCamera.purchase_date) }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Trạng thái</div>
            <div>
              <el-tag size="small" :type="getStatusTagType(selectedCamera.status)" effect="dark" class="font-bold">
                {{ getStatusLabel(selectedCamera.status) }}
              </el-tag>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-150 dark:border-gray-700 pt-4 space-y-4">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tài khoản quản lý &amp; Cấu hình hệ thống</div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
              <div>
                <div class="text-xxs font-semibold text-gray-400">Tài khoản đăng nhập</div>
                <div class="text-xs font-bold text-gray-800 dark:text-gray-200 mt-0.5 select-all">{{ selectedCamera.login_account || '—' }}</div>
              </div>
              <div>
                <div class="text-xxs font-semibold text-gray-400">Mật khẩu login</div>
                <div class="text-xs font-mono font-bold text-gray-850 dark:text-gray-200 mt-0.5 select-all">{{ selectedCamera.login_password || '—' }}</div>
              </div>
            </div>
          </div>
          <div v-if="selectedCamera.notes">
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ghi chú chi tiết</div>
            <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ selectedCamera.notes }}</p>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="detailDialogVisible = false">Đóng</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Modal: Bàn giao Camera -->
    <DeviceHandoverModal
      v-model="handoverModalVisible"
      :device-info="handoverDeviceInfo"
      @success="handleHandoverSuccess"
    />

    <!-- Modal: Thu hồi Camera -->
    <DeviceReturnModal
      v-model="returnModalVisible"
      :device-info="returnDeviceInfo"
      @success="handleReturnSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { VideoCamera, Refresh, Plus, MoreFilled, View, Hide } from '@element-plus/icons-vue'
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

const cameras = ref<any[]>([])

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

// Fetch cameras list from GET API
const fetchCameras = async () => {
  loading.value = true
  currentPage.value = 1
  try {
    const data = await otherService.getCameras({
      classification: filterClassification.value || undefined
    })
    cameras.value = data
  } catch (error: any) {
    console.error('API get-cameras failed:', error)
    ElMessage.error(error.message || 'Lỗi khi tải danh sách camera từ API')
    cameras.value = []
  } finally {
    loading.value = false
  }
}

const handleClassificationChange = () => {
  fetchCameras()
}

// Search Computed
const filteredCameras = computed(() => {
  return cameras.value.filter(item => {
    const q = searchQuery.value.toLowerCase()
    
    const matchesSearch = !q ||
      item.model_name.toLowerCase().includes(q) ||
      (item.brand && item.brand.toLowerCase().includes(q)) ||
      (item.ip_address && item.ip_address.includes(q)) ||
      (item.location && item.location.toLowerCase().includes(q)) ||
      (item.serial_number && item.serial_number.toLowerCase().includes(q))

    const matchesClassification = !filterClassification.value || 
      item.classification === filterClassification.value

    return matchesSearch && matchesClassification
  })
})

const paginatedCameras = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredCameras.value.slice(start, end)
})

// Dialog States
const dialogVisible = ref(false)
const isEdit = ref(false)
const detailDialogVisible = ref(false)
const selectedCamera = ref<any | null>(null)
const formRef = ref<any>(null)

// Handover Modal State
const handoverModalVisible = ref(false)
const handoverDeviceInfo = ref<any | null>(null)

// Return Modal State
const returnModalVisible = ref(false)
const returnDeviceInfo = ref<any | null>(null)

const form = reactive({
  id: '',
  model_name: '',
  brand: '',
  camera_type: '',
  resolution: '',
  ip_address: '',
  mac_address: '',
  port: '',
  login_account: '',
  login_password: '',
  storage_type: '',
  location: '',
  serial_number: '',
  purchase_date: '',
  warranty_expiry: '',
  status: 'active',
  notes: '',
  classification: 'Công việc'
})

const rules = reactive({
  id: [{ required: true, message: 'Vui lòng nhập mã thiết bị (ID)', trigger: 'blur' }],
  model_name: [{ required: true, message: 'Vui lòng nhập tên dòng máy', trigger: 'blur' }],
  status: [{ required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change' }]
})

// Action Handlers
const handleCommand = (cmd: string, row: any) => {
  if (cmd === 'detail') {
    selectedCamera.value = row
    detailDialogVisible.value = true
  } else if (cmd === 'handover') {
    if (!isReadyForHandover(row.status)) {
      ElMessage.warning('Chỉ thiết bị ở trạng thái "Sẵn sàng bàn giao" mới có thể thực hiện bàn giao!')
      return
    }
    handoverDeviceInfo.value = {
      id: row.id,
      type: 'camera',
      status: row.status,
      model_name: row.model_name,
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
      type: 'camera',
      status: row.status,
      model_name: row.model_name,
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
  fetchCameras()
}

const handleReturnSuccess = () => {
  fetchCameras()
}

const openAddDialog = () => {
  isEdit.value = false
  form.id = ''
  form.brand = ''
  form.model_name = ''
  form.camera_type = ''
  form.resolution = ''
  form.ip_address = ''
  form.mac_address = ''
  form.port = ''
  form.login_account = ''
  form.login_password = ''
  form.storage_type = ''
  form.location = ''
  form.serial_number = ''
  form.purchase_date = ''
  form.warranty_expiry = ''
  form.status = 'active'
  form.notes = ''
  form.classification = 'Công việc'
  dialogVisible.value = true
}

const openEditDialog = (row: any) => {
  isEdit.value = true
  form.id = row.id
  form.brand = row.brand || ''
  form.model_name = row.model_name
  form.camera_type = row.camera_type || ''
  form.resolution = row.resolution || ''
  form.ip_address = row.ip_address || ''
  form.mac_address = row.mac_address || ''
  form.port = row.port || ''
  form.login_account = row.login_account || ''
  form.login_password = row.login_password || ''
  form.storage_type = row.storage_type || ''
  form.location = row.location || ''
  form.serial_number = row.serial_number || ''
  form.purchase_date = row.purchase_date || ''
  form.warranty_expiry = row.warranty_expiry || ''
  form.status = row.status
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
        brand: form.brand || null,
        model_name: form.model_name,
        camera_type: form.camera_type || null,
        resolution: form.resolution || null,
        ip_address: form.ip_address || null,
        mac_address: form.mac_address || null,
        port: form.port || null,
        login_account: form.login_account || null,
        login_password: form.login_password || null,
        storage_type: form.storage_type || null,
        location: form.location || null,
        serial_number: form.serial_number || null,
        purchase_date: form.purchase_date || null,
        warranty_expiry: form.warranty_expiry || null,
        status: form.status,
        notes: form.notes || null,
        classification: form.classification || null
      }

      try {
        if (isEdit.value) {
          const editPayload = { ...payload }
          await otherService.updateCameras([editPayload])

          const idx = cameras.value.findIndex(s => s.id === form.id)
          if (idx !== -1) {
            cameras.value[idx] = { ...cameras.value[idx], ...editPayload }
          }
          ElMessage.success('Cập nhật thông tin camera thành công!')
        } else {
          const res = await otherService.addCameras([payload])
          if (res && res.length > 0) {
            cameras.value.unshift(res[0])
          } else {
            cameras.value.unshift({ ...payload })
          }
          ElMessage.success('Thêm mới camera thành công!')
        }
        dialogVisible.value = false
      } catch (error: any) {
        ElMessage.error(error.message || 'Lỗi khi lưu thông tin camera')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa camera "${row.model_name}" (${row.id}) khỏi cơ sở dữ liệu?`,
      'Xác nhận xóa thiết bị',
      {
        confirmButtonText: 'Xóa bỏ',
        cancelButtonText: 'Hủy',
        type: 'warning'
      }
    )
    loading.value = true
    await otherService.deleteCameras([row.id])

    cameras.value = cameras.value.filter(s => s.id !== row.id)
    ElMessage.success('Xóa camera thành công!')
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || 'Lỗi khi xóa camera')
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

const getStatusLabel = (status: string) => {
  return getDeviceStatusLabel(status)
}

const getStatusTagType = (status: string) => {
  return getDeviceStatusTagType(status)
}

onMounted(() => {
  fetchCameras()
})
</script>

<style scoped>
html.dark .camera-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .camera-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .camera-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

html.dark .camera-container :deep(.el-table .el-table-fixed-column--left),
html.dark .camera-container :deep(.el-table .el-table-fixed-column--right) {
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
