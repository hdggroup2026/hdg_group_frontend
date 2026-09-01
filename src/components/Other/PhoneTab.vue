<template>
  <div class="phone-container h-full flex flex-col">
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
            placeholder="Dòng máy, hãng, IMEI, Serial..."
            clearable
            class="w-64 custom-dark-input"
            style="width: 256px"
          />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <el-button :icon="Refresh" circle @click="fetchSmartphones" :loading="loading" />
        <el-button type="primary" @click="openAddDialog">
          <el-icon class="mr-1"><Plus /></el-icon> Thêm Điện thoại
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
      <el-table v-if="hienBang" v-loading="loading" :data="paginatedSmartphones" style="width: 100%" class="flex-1" height="100%">
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
            <span class="font-bold text-gray-800 dark:text-gray-200">{{ row.brand }}</span>
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
            <el-tag size="small" :type="row.classification === 'Công việc' ? 'primary' : 'success'" effect="plain">
              {{ row.classification }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- ══════════════════════════════════════════════════════════
             MỤC 432 (31/08/2026) — TÀI KHOẢN + MẬT KHẨU LÊN TRƯỚC SỐ SERIAL

             s68 (ảnh 31/08): *"Đưa ô số 2 ra trước ô màu đỏ."*

             Tài khoản là thứ tra hằng ngày; Số Serial / IMEI chỉ dùng khi
             bảo hành hay báo mất. Bảng rộng hơn màn hình nên cột nào cũng
             phải cuộn ngang mới thấy — đẩy thứ hay dùng lên trước là bớt
             cuộn.

             ⚠️ Camera và Thiết bị khác VỐN ĐÃ đúng thứ tự này
             (`CameraTab.vue` dòng 131, `OtherDeviceTab.vue` dòng 126).
             Chỉ Điện thoại và Máy tính bảng lệch. Nay bốn tab giống nhau.

             ⚠️ Khối thẻ dọc bên dưới cũng đã dời theo — hai bản phải cùng
             thứ tự, đúng bài học MỤC 424.
             ══════════════════════════════════════════════════════════ -->
        <!-- Tài khoản liên kết -->
        <el-table-column prop="account" label="Tài khoản" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-semibold text-gray-700 dark:text-gray-300 text-xs">{{ row.account || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Mật khẩu tài khoản -->
        <el-table-column label="Mật khẩu" width="94" show-overflow-tooltip>
          <template #default="{ row }">
            <div v-if="row.account_password" class="flex items-center gap-1 text-gray-400 text-xs">
              <span class="font-mono">{{ isPasswordRevealed(row.id) ? row.account_password : '••••••••' }}</span>
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
            <span class="font-mono text-xs text-gray-700 dark:text-gray-300 font-bold">{{ row.serial_number || '—' }}</span>
          </template>
        </el-table-column>

        <!-- IMEI 1 -->
        <el-table-column prop="imei_1" label="IMEI 1" width="115" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono text-xs text-gray-650 dark:text-gray-350">{{ row.imei_1 || '—' }}</span>
          </template>
        </el-table-column>

        <!-- IMEI 2 -->
        <el-table-column prop="imei_2" label="IMEI 2" width="115" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono text-xs text-gray-650 dark:text-gray-350">{{ row.imei_2 || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Phiên bản HĐH -->
        <!-- ══════════════════════════════════════════════════════════
             MỤC 438 (31/08/2026) — BẤM VÀO HĐH ĐỂ XEM APP CỦA MÁY

             s68: *"bấm vào chữ android, ios thì hiện ra bảng mới, hiển
             thị các app đang liên kết đến thiết bị đó."*

             ⚠️ Dùng `<button>`, KHÔNG dùng `<span @click>` — span không
             nhận tiêu điểm bàn phím và trình đọc màn hình không gọi nó
             là nút (quy tắc từ MỤC 420, 424).

             ⚠️ Máy CHƯA khai HĐH thì hiện dấu gạch và KHÔNG bấm được.
             Cho bấm vào ô trống là mở hộp thoại rỗng, người dùng tưởng
             hỏng.
             ══════════════════════════════════════════════════════════ -->
        <el-table-column prop="os_version" label="HĐH" width="86" show-overflow-tooltip>
          <template #default="{ row }">
            <button v-if="row.os_version" type="button"
                    class="text-xs text-blue-600 dark:text-blue-400 underline decoration-dotted underline-offset-2 hover:text-blue-800"
                    :title="`Xem app đang dùng trên ${row.id}`"
                    @click.stop="moAppCuaMay(row)">
              {{ row.os_version }}
            </button>
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>

        <!-- ══════════════════════════════════════════════════════════
             MỤC 443 (01/09/2026) — CỘT PHỤ KIỆN

             s68 31/08: *"1 thiết bị có thể đi với phụ kiện nữa."*

             Hiện SỐ MÓN đang gắn máy, bấm vào ra bảng chi tiết — gồm CẢ
             phụ kiện thường LẪN SIM, theo đúng câu s68 nói ngày 01/09:
             *"Sim vừa là phụ kiện."*

             ⚠️ Số đếm lấy từ MỘT lời gọi lúc tải bảng, không gọi một lần
             cho mỗi dòng — mười dòng là mười lời gọi, bẫy `HDG_131`.

             ⚠️ Máy KHÔNG có món nào thì hiện số 0 màu xám và vẫn bấm
             được. Khác với ô HĐH rỗng ở MỤC 438: ở đó rỗng nghĩa là chưa
             khai dữ liệu, còn ở đây 0 là một sự thật đã biết, và người
             dùng vẫn cần mở ra để gắn thêm.
             ══════════════════════════════════════════════════════════ -->
        <el-table-column label="Phụ kiện" width="80" align="center">
          <template #default="{ row }">
            <button type="button"
                    class="text-xs underline decoration-dotted underline-offset-2"
                    :class="(soPhuKien[row.id] || 0) > 0
                              ? 'text-blue-600 dark:text-blue-400 font-bold'
                              : 'text-gray-400'"
                    :title="`Xem phụ kiện và SIM của ${row.id}`"
                    @click.stop="moPhuKienCuaMay(row)">
              {{ soPhuKien[row.id] || 0 }}
            </button>
          </template>
        </el-table-column>

        <!-- Dung lượng bộ nhớ -->
        <el-table-column prop="storage_capacity" label="Dung lượng" width="94" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-xs text-gray-700 dark:text-gray-300">{{ row.storage_capacity || '—' }}</span>
          </template>
        </el-table-column>

        <!-- Pin -->
        <el-table-column prop="battery_health" label="Pin" width="70" align="center">
          <template #default="{ row }">
            <span v-if="row.battery_health" class="font-bold font-mono text-xs" :class="getBatteryClass(row.battery_health)">
              {{ row.battery_health }}%
            </span>
            <span v-else class="text-gray-400">—</span>
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

        <!-- Ngày mua -->
        <!-- ══════════════════════════════════════════════════════════
             MỤC 433 (31/08/2026) — NGÀY MUA XUỐNG HÀNG CHO CÂN ĐỐI

             s68 (ảnh 31/08): *"Ngày mua thì cho 2025 xuống hàng luôn cho
             cân đối."*

             🔴 Trước đây cột rộng 86px, `30/05/2025` là 10 ký tự chữ đều
             nên không vừa — trình duyệt tự ngắt GIỮA CON SỐ thành
             `30/05/2` rồi `025`. Nhìn như dữ liệu hỏng.

             Nay tự tách chủ động: ngày/tháng một dòng, NĂM một dòng.
             Chỗ ngắt do mình chọn, không để trình duyệt chọn.

             ⚠️ `whitespace-nowrap` ở cả hai dòng con là bắt buộc — thiếu
             nó thì trình duyệt vẫn có quyền ngắt tiếp giữa số.
             ══════════════════════════════════════════════════════════ -->
        <el-table-column prop="purchase_date" label="Ngày mua" width="86" align="center">
          <template #default="{ row }">
            <div v-if="row.purchase_date" class="font-mono text-xs leading-tight">
              <div class="whitespace-nowrap">{{ ngayThang(row.purchase_date) }}</div>
              <div class="whitespace-nowrap">{{ namMua(row.purchase_date) }}</div>
            </div>
            <span v-else class="text-gray-400">—</span>
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
        <div v-if="paginatedSmartphones.length > 0" class="grid grid-cols-1 gap-4">
          <div
            v-for="(row, i) in (paginatedSmartphones as any[])"
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
                  <span class="font-bold text-gray-800 dark:text-gray-200">{{ row.brand }}</span>
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
                  <el-tag size="small" :type="row.classification === 'Công việc' ? 'primary' : 'success'" effect="plain">
                                {{ row.classification }}
                              </el-tag>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tài khoản:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-semibold text-gray-700 dark:text-gray-300 text-xs">{{ row.account || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Mật khẩu:</span>
                <span class="text-right break-words min-w-0">
                  <div v-if="row.account_password" class="flex items-center gap-1 text-gray-400 text-xs">
                                <span class="font-mono">{{ isPasswordRevealed(row.id) ? row.account_password : '••••••••' }}</span>
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
                  <span class="font-mono text-xs text-gray-700 dark:text-gray-300 font-bold">{{ row.serial_number || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">IMEI 1:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-mono text-xs text-gray-650 dark:text-gray-350">{{ row.imei_1 || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">IMEI 2:</span>
                <span class="text-right break-words min-w-0">
                  <span class="font-mono text-xs text-gray-650 dark:text-gray-350">{{ row.imei_2 || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">HĐH:</span>
                <span class="text-right break-words min-w-0">
                  <!-- MỤC 438 — NGUYÊN VĂN nội dung cột HĐH của bảng. -->
                  <button v-if="row.os_version" type="button"
                          class="text-xs text-blue-600 dark:text-blue-400 underline decoration-dotted underline-offset-2"
                          @click.stop="moAppCuaMay(row)">
                    {{ row.os_version }}
                  </button>
                  <span v-else class="text-gray-400">—</span>
                </span>
              </div>
              <!-- MỤC 443 — NGUYÊN VĂN nội dung cột Phụ kiện của bảng. -->
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Phụ kiện:</span>
                <span class="text-right break-words min-w-0">
                  <button type="button"
                          class="text-xs underline decoration-dotted underline-offset-2"
                          :class="(soPhuKien[row.id] || 0) > 0
                                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                                    : 'text-gray-400'"
                          @click.stop="moPhuKienCuaMay(row)">
                    {{ soPhuKien[row.id] || 0 }} món
                  </button>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Dung lượng:</span>
                <span class="text-right break-words min-w-0">
                  <span class="text-xs text-gray-700 dark:text-gray-300">{{ row.storage_capacity || '—' }}</span>
                </span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Pin:</span>
                <span class="text-right break-words min-w-0">
                  <span v-if="row.battery_health" class="font-bold font-mono text-xs" :class="getBatteryClass(row.battery_health)">
                                {{ row.battery_health }}%
                              </span>
                              <span v-else class="text-gray-400">—</span>
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
          :total="filteredSmartphones.length"
        />
      </div>
    </div>

    <!-- Dialog: Add / Edit Smartphone -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'CHỈNH SỬA THÔNG TIN ĐIỆN THOẠI' : 'THÊM ĐIỆN THOẠI MỚI'"
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
              Thông tin nhận diện máy
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã thiết bị (ID)" prop="id">
                  <el-input v-model="form.id" :disabled="isEdit" placeholder="VD: DTIP07..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Hãng sản xuất" prop="brand">
                  <el-input v-model="form.brand" placeholder="VD: Apple, Samsung, Xiaomi..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Dòng máy" prop="model_name">
                  <el-input v-model="form.model_name" placeholder="VD: iPhone 15 Pro Max..." />
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
                <el-form-item label="IMEI 1" prop="imei_1">
                  <el-input v-model="form.imei_1" placeholder="Nhập số IMEI 1..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="IMEI 2" prop="imei_2">
                  <el-input v-model="form.imei_2" placeholder="Nhập số IMEI 2..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: THÔNG SỐ & TÌNH TRẠNG -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Thông số kỹ thuật &amp; Trạng thái
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <!-- ══════════════════════════════════════════════════
                     MỤC 435 (31/08/2026) — CHỌN HỆ ĐIỀU HÀNH, KHÔNG GÕ TAY

                     s68: *"phần thêm thiết bị có cho chọn các loại hệ điều
                     hành: android, ios."* — chốt cách A ngày 31/08: giữ
                     MỘT cột `os_version` trong database, chỉ đổi cách nhập.

                     🔴 VÌ SAO KHÔNG THÊM CỘT `os_type` RIÊNG. Thêm cột là
                     có HAI nguồn cho cùng một sự thật: `os_type = android`
                     mà `os_version = "iOS 17"` thì tin cái nào? Đúng bài
                     học "hai nguồn cho một con số" của MỤC 300, 304, 427.

                     Ô chọn + ô số ghép lại thành đúng chuỗi cũ
                     (`Android 14`, `iOS 17.5`) rồi ghi vào `os_version`.
                     Dữ liệu cũ đọc lên vẫn tách ngược ra được, không phải
                     nhập lại gì.

                     ⚠️ CÓ mục "Khác" trong ô chọn. Bỏ nó là mọi thiết bị
                     chạy HarmonyOS, KaiOS hay firmware riêng thành không
                     khai được — và người dùng sẽ khai bậy vào ô số.
                     ══════════════════════════════════════════════════ -->
                <el-form-item label="Hệ điều hành" prop="os_version">
                  <div class="flex gap-2 w-full">
                    <el-select v-model="form.he_dieu_hanh" placeholder="Chọn"
                               class="shrink-0" style="width: 116px"
                               @change="ghepOsVersion">
                      <el-option label="Android" value="Android" />
                      <el-option label="iOS" value="iOS" />
                      <el-option label="Khác" value="" />
                    </el-select>
                    <el-input v-model="form.phien_ban_os" class="flex-1 min-w-0"
                              placeholder="Phiên bản, VD: 14 hoặc 17.5"
                              @input="ghepOsVersion" />
                  </div>
                  <span class="text-xs text-gray-400 dark:text-gray-500">
                    Sẽ lưu là: <b>{{ form.os_version || '—' }}</b>
                  </span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Dung lượng bộ nhớ" prop="storage_capacity">
                  <el-input v-model="form.storage_capacity" placeholder="VD: 128 GB, 256 GB..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tình trạng pin (%)" prop="battery_health">
                  <el-input-number v-model="form.battery_health" :min="1" :max="100" class="!w-full" controls-position="right" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Trạng thái máy" prop="status">
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
                <el-form-item label="Phụ kiện đi kèm" prop="accessories">
                  <el-input v-model="form.accessories" placeholder="VD: Cáp sạc, Tai nghe, Củ sạc..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 3: TÀI KHOẢN & BẢO MẬT -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-violet-650 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
              Tài khoản &amp; Ghi chú bảo mật
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tài khoản liên kết" prop="account">
                  <el-input v-model="form.account" placeholder="iCloud / Google Account..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Mật khẩu tài khoản" prop="account_password">
                  <el-input v-model="form.account_password" type="password" show-password placeholder="Nhập mật khẩu..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Ghi chú chi tiết" prop="notes">
                  <el-input v-model="form.notes" type="textarea" :rows="2" placeholder="Ghi chú thêm về máy..." />
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

    <!-- Dialog: Detail Smartphone -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT THÔNG TIN ĐIỆN THOẠI"
      width="750px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedPhone" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto text-left">
        <!-- Visual Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-blue-500 dark:bg-blue-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32"><Iphone /></el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Điện thoại di động</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {{ selectedPhone.model_name }}
              <span class="text-gray-400 dark:text-gray-500 font-mono font-medium">({{ selectedPhone.brand }})</span>
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <span class="text-gray-500 dark:text-gray-400">Phân loại: <strong class="text-gray-750 dark:text-gray-250">{{ selectedPhone.classification }}</strong></span>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span class="text-gray-500 dark:text-gray-400">HĐH: <strong>{{ selectedPhone.os_version || '—' }}</strong></span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã máy (ID)</div>
            <div class="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">{{ selectedPhone.id }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số Serial (S/N)</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono">{{ selectedPhone.serial_number || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Dung lượng ổ cứng</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedPhone.storage_capacity || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">IMEI 1</div>
            <div class="text-sm font-mono text-gray-700 dark:text-gray-300">{{ selectedPhone.imei_1 || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">IMEI 2</div>
            <div class="text-sm font-mono text-gray-700 dark:text-gray-300">{{ selectedPhone.imei_2 || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tình trạng pin hiệu dụng</div>
            <div class="text-sm font-bold flex items-center gap-1" :class="getBatteryClass(selectedPhone.battery_health)">
              {{ selectedPhone.battery_health ? selectedPhone.battery_health + '%' : '—' }}
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày mua sắm</div>
            <div class="text-sm font-mono text-gray-750 dark:text-gray-300">{{ formatDate(selectedPhone.purchase_date) }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Phụ kiện đi kèm</div>
            <div class="text-sm text-gray-700 dark:text-gray-300">{{ selectedPhone.accessories || 'Không có' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Trạng thái</div>
            <div>
              <el-tag size="small" :type="getStatusTagType(selectedPhone.status)" effect="dark" class="font-bold">
                {{ getStatusLabel(selectedPhone.status) }}
              </el-tag>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-150 dark:border-gray-700 pt-4 space-y-4">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tài khoản &amp; Giao thức đăng nhập</div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
              <div>
                <div class="text-xxs font-semibold text-gray-400">Tên đăng nhập (Email)</div>
                <div class="text-xs font-bold text-gray-800 dark:text-gray-200 mt-0.5 select-all">{{ selectedPhone.account || '—' }}</div>
              </div>
              <div>
                <div class="text-xxs font-semibold text-gray-400">Mật khẩu đăng nhập</div>
                <div class="text-xs font-mono font-bold text-gray-850 dark:text-gray-200 mt-0.5 select-all">{{ selectedPhone.account_password || '—' }}</div>
              </div>
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ghi chú chi tiết</div>
            <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ selectedPhone.notes || 'Không có ghi chú nào thêm.' }}</p>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="detailDialogVisible = false">Đóng</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Modal: Bàn giao Điện thoại -->
    <DeviceHandoverModal
      v-model="handoverModalVisible"
      :device-info="handoverDeviceInfo"
      @success="handleHandoverSuccess"
    />

    <!-- Modal: Thu hồi Điện thoại -->
    <DeviceReturnModal
      v-model="returnModalVisible"
      :device-info="returnDeviceInfo"
      @success="handleReturnSuccess"
    />
  </div>
    <!-- ══════════════════════════════════════════════════════════════
         MỤC 443 (01/09/2026) — PHỤ KIỆN VÀ SIM CỦA MỘT MÁY
         ══════════════════════════════════════════════════════════════ -->
    <el-dialog v-model="hienPhuKien" width="660px" align-center destroy-on-close>
      <template #header>
        <span class="font-bold">
          PHỤ KIỆN CỦA MÁY <span class="text-blue-600 font-mono">{{ mayXemPK?.id }}</span>
        </span>
      </template>

      <div v-loading="dangTaiPK">
        <el-table v-if="phuKienCuaMay.length" :data="phuKienCuaMay" size="small" border>
          <el-table-column prop="id" label="Mã" width="90">
            <template #default="{ row }">
              <span class="font-mono font-bold text-xs">{{ row.id }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Nguồn" width="94" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.nguon === 'sim' ? 'warning' : 'info'" effect="plain">
                {{ row.nguon === 'sim' ? 'SIM' : 'Phụ kiện' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="loai" label="Loại" width="120" show-overflow-tooltip />
          <el-table-column prop="ten" label="Tên / gói" min-width="130" show-overflow-tooltip />
          <el-table-column prop="so_hieu" label="Seri / Số ĐT" width="130" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="font-mono text-xs">{{ row.so_hieu || '—' }}</span>
            </template>
          </el-table-column>
          <!-- ⚠️ Nhãn cột đổi theo `nguon`: phụ kiện là hạn BẢO HÀNH,
               SIM là hạn THUÊ BAO. Gọi chung một tên là nói sai. -->
          <el-table-column label="Hạn" width="150" align="center">
            <template #default="{ row }">
              <div v-if="row.han_dung" class="text-xs" :class="lopHanPK(row.han_dung)">
                {{ ngayDayDuPK(row.han_dung) }}
                <div class="text-[10px] font-normal text-gray-400">
                  {{ row.nguon === 'sim' ? 'hạn thuê bao' : 'hết bảo hành' }}
                </div>
              </div>
              <span v-else class="text-gray-400">—</span>
            </template>
          </el-table-column>
        </el-table>

        <div v-else-if="!dangTaiPK" class="text-center text-gray-400 py-8 text-sm">
          Máy này chưa gắn phụ kiện hay SIM nào.<br />
          Vào <b>Quản lý Thiết bị ▸ Phụ kiện</b> (hoặc tab <b>SIM</b>), chọn một
          món rồi bấm <b>Gắn vào máy</b>.
        </div>
      </div>

      <template #footer>
        <span class="text-sm text-gray-400 mr-3">Tổng: <b>{{ phuKienCuaMay.length }}</b> món</span>
        <el-button @click="hienPhuKien = false">Đóng</el-button>
      </template>
    </el-dialog>

    <!-- ══════════════════════════════════════════════════════════════
         MỤC 438 (31/08/2026) — APP ĐANG DÙNG TRÊN MỘT THIẾT BỊ
         ══════════════════════════════════════════════════════════════ -->
    <el-dialog v-model="hienAppCuaMay" width="620px" align-center destroy-on-close>
      <template #header>
        <span class="font-bold">
          APP TRÊN MÁY <span class="text-blue-600 font-mono">{{ mayDangXem?.id }}</span>
          <span class="text-gray-400 font-normal ml-2">{{ mayDangXem?.os_version }}</span>
        </span>
      </template>

      <div v-loading="dangTaiApp">
        <el-table v-if="appCuaMay.length" :data="appCuaMay" size="small" border>
          <el-table-column prop="app_name" label="Tên app" min-width="130" show-overflow-tooltip />
          <el-table-column prop="account_email" label="Tài khoản" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="text-xs">{{ row.account_email || '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="login_method" label="Đăng nhập bằng" width="120" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="text-xs">{{ row.login_method || '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="2 lớp" width="70" align="center">
            <template #default="{ row }">
              <span class="text-xs">{{ row.two_factor || '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="holder" label="Người giữ" width="110" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="text-xs">{{ row.holder || '—' }}</span>
            </template>
          </el-table-column>
        </el-table>

        <!-- ⚠️ Rỗng thì nói PHẢI LÀM GÌ, không chỉ nói là rỗng. -->
        <div v-else-if="!dangTaiApp" class="text-center text-gray-400 py-8 text-sm">
          Máy này chưa gắn app nào.<br />
          Vào <b>Other ▸ Quản lý App</b>, chọn một app rồi bấm <b>Gán thiết bị</b>.
        </div>
      </div>

      <template #footer>
        <span class="text-sm text-gray-400 mr-3">Tổng: <b>{{ appCuaMay.length }}</b> app</span>
        <el-button @click="hienAppCuaMay = false">Đóng</el-button>
      </template>
    </el-dialog>

</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Iphone, Refresh, Plus, MoreFilled, View, Hide } from '@element-plus/icons-vue'
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

const smartphones = ref<any[]>([])

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

// Fetch smartphones list from GET API directly
const fetchSmartphones = async () => {
  loading.value = true
  currentPage.value = 1
  try {
    const data = await otherService.getSmartphones({
      classification: filterClassification.value || undefined
    })
    smartphones.value = data
  } catch (error: any) {
    console.error('API get-smartphones failed:', error)
    ElMessage.error(error.message || 'Lỗi khi kết nối tới API để tải danh sách điện thoại')
    smartphones.value = []
  } finally {
    loading.value = false
  }
}

const handleClassificationChange = () => {
  fetchSmartphones()
}

// Search Computed
const filteredSmartphones = computed(() => {
  return smartphones.value.filter(s => {
    const q = searchQuery.value.toLowerCase()
    
    // Client-side search filters
    const matchesSearch = !q ||
      s.model_name.toLowerCase().includes(q) ||
      (s.brand && s.brand.toLowerCase().includes(q)) ||
      (s.imei_1 && s.imei_1.includes(q)) ||
      (s.serial_number && s.serial_number.toLowerCase().includes(q)) ||
      (s.account && s.account.toLowerCase().includes(q))

    // Client-side classification backup
    const matchesClassification = !filterClassification.value || 
      s.classification === filterClassification.value

    return matchesSearch && matchesClassification
  })
})

const paginatedSmartphones = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredSmartphones.value.slice(start, end)
})

// Dialog States
const dialogVisible = ref(false)
const isEdit = ref(false)
const detailDialogVisible = ref(false)
const selectedPhone = ref<any | null>(null)
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
  imei_1: '',
  imei_2: '',
  serial_number: '',
  os_version: '',
  he_dieu_hanh: '',   // MỤC 435 — chỉ dùng ở giao diện, KHÔNG gửi lên máy chủ
  phien_ban_os: '',   // MỤC 435 — nt
  storage_capacity: '',
  battery_health: 100,
  purchase_date: '',
  status: 'available',
  notes: '',
  accessories: '',
  account: '',
  account_password: '',
  classification: 'Công việc'
})

const rules = reactive({
  id: [{ required: true, message: 'Vui lòng nhập mã thiết bị (ID)', trigger: 'blur' }],
  model_name: [{ required: true, message: 'Vui lòng nhập tên dòng máy', trigger: 'blur' }],
  brand: [{ required: true, message: 'Vui lòng nhập hãng sản xuất', trigger: 'blur' }],
  classification: [{ required: true, message: 'Vui lòng chọn phân loại', trigger: 'change' }],
  status: [{ required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change' }]
})

// Action Handlers
const handleCommand = (cmd: string, row: any) => {
  if (cmd === 'detail') {
    selectedPhone.value = row
    detailDialogVisible.value = true
  } else if (cmd === 'handover') {
    if (!isReadyForHandover(row.status)) {
      ElMessage.warning('Chỉ thiết bị ở trạng thái "Sẵn sàng bàn giao" mới có thể thực hiện bàn giao!')
      return
    }
    handoverDeviceInfo.value = {
      id: row.id,
      type: 'phone',
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
      type: 'phone',
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
  fetchSmartphones()
}

const handleReturnSuccess = () => {
  fetchSmartphones()
}

const openAddDialog = () => {
  isEdit.value = false
  form.id = ''
  form.brand = ''
  form.model_name = ''
  form.serial_number = ''
  form.classification = 'Công việc'
  form.imei_1 = ''
  form.imei_2 = ''
  form.os_version = ''
  form.he_dieu_hanh = ''   // MỤC 435
  form.phien_ban_os = ''   // MỤC 435
  form.storage_capacity = ''
  form.battery_health = 100
  form.status = 'available'
  form.purchase_date = new Date('2026-06-28T00:00:00').toISOString().substring(0, 10)
  form.accessories = ''
  form.account = ''
  form.account_password = ''
  form.notes = ''
  dialogVisible.value = true
}

const openEditDialog = (row: any) => {
  isEdit.value = true
  form.id = row.id
  form.brand = row.brand
  form.model_name = row.model_name
  form.serial_number = row.serial_number
  form.classification = row.classification
  form.imei_1 = row.imei_1
  form.imei_2 = row.imei_2
  tachOsVersion(row.os_version)   // MỤC 435 — thay cho gán thẳng
  form.storage_capacity = row.storage_capacity
  form.battery_health = row.battery_health || 100
  form.status = row.status
  form.purchase_date = row.purchase_date
  form.accessories = row.accessories
  form.account = row.account
  form.account_password = row.account_password
  form.notes = row.notes || ''
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      const payload = {
        id: form.id,
        brand: form.brand,
        model_name: form.model_name,
        serial_number: form.serial_number,
        classification: form.classification,
        imei_1: form.imei_1,
        imei_2: form.imei_2,
        os_version: form.os_version,
        storage_capacity: form.storage_capacity,
        battery_health: Number(form.battery_health) || 100,
        status: form.status,
        purchase_date: form.purchase_date,
        accessories: form.accessories,
        account: form.account,
        account_password: form.account_password,
        notes: form.notes || null
      }

      try {
        if (isEdit.value) {
          const editPayload = { ...payload }
          // Trigger API call directly
          await otherService.updateSmartphones([editPayload])

          // Local state update
          const idx = smartphones.value.findIndex(s => s.id === form.id)
          if (idx !== -1) {
            const existing = smartphones.value[idx]
            if (existing) {
              smartphones.value[idx] = { ...existing, ...editPayload }
            }
          }
          ElMessage.success('Cập nhật thông tin điện thoại thành công!')
        } else {
          // Trigger API call directly
          const res = await otherService.addSmartphones([payload])
          if (res && res.length > 0) {
            smartphones.value.unshift(res[0])
          } else {
            smartphones.value.unshift({ ...payload })
          }
          ElMessage.success('Thêm mới điện thoại thành công!')
        }
        dialogVisible.value = false
      } catch (error: any) {
        ElMessage.error(error.message || 'Lỗi khi lưu thông tin điện thoại')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa điện thoại "${row.model_name}" (${row.brand}) khỏi cơ sở dữ liệu?`,
      'Xác nhận xóa thiết bị',
      {
        confirmButtonText: 'Xóa bỏ',
        cancelButtonText: 'Hủy',
        type: 'warning'
      }
    )
    loading.value = true
    // Trigger API call directly
    await otherService.deleteSmartphones([row.id])

    smartphones.value = smartphones.value.filter(s => s.id !== row.id)
    ElMessage.success('Xóa điện thoại thành công!')
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || 'Lỗi khi xóa điện thoại')
    }
  } finally {
    loading.value = false
  }
}

// Helpers
// ══════════════════════════════════════════════════════════════════════
// MỤC 443 (01/09/2026) — PHỤ KIỆN VÀ SIM CỦA MỘT MÁY
//
// ⚠️ `soPhuKien` nạp MỘT lần cho cả bảng bằng hai lời gọi (phụ kiện, SIM)
// rồi đếm tại chỗ. Gọi một lần cho mỗi dòng là mười dòng mười lời gọi —
// bẫy `HDG_131`.
//
// ⚠️ Đếm ở đây và chi tiết ở hộp thoại là HAI nguồn cho cùng một con số,
// nên hộp thoại luôn gọi lại `get-phu-kien-cua-may` — số đếm chỉ để nhìn
// nhanh, con số trong hộp thoại mới là số thật.
// ══════════════════════════════════════════════════════════════════════
const soPhuKien = reactive<Record<string, number>>({})
const hienPhuKien = ref(false)
const dangTaiPK = ref(false)
const mayXemPK = ref<any>(null)
const phuKienCuaMay = ref<any[]>([])

const napSoPhuKien = async () => {
  try {
    const [pk, sim] = await Promise.all([
      otherService.getAccessories(),
      otherService.getSimCards(),
    ])
    for (const k of Object.keys(soPhuKien)) delete soPhuKien[k]
    for (const m of [...(pk || []), ...(sim || [])]) {
      if (m.device_id) soPhuKien[m.device_id] = (soPhuKien[m.device_id] || 0) + 1
    }
  } catch {
    // Đếm hỏng thì cột hiện 0 — KHÔNG chặn cả bảng thiết bị vì một con
    // số phụ. Bấm vào vẫn gọi lại và vẫn ra danh sách đúng.
  }
}

const moPhuKienCuaMay = async (row: any) => {
  mayXemPK.value = row
  phuKienCuaMay.value = []
  hienPhuKien.value = true
  dangTaiPK.value = true
  try {
    phuKienCuaMay.value = await otherService.getPhuKienCuaMay(row.id) || []
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không tải được danh sách phụ kiện.')
  } finally {
    dangTaiPK.value = false
  }
}

const lopHanPK = (d: any) => {
  if (!d) return ''
  const con = (new Date(d).getTime() - Date.now()) / 86400000
  if (con < 0) return 'text-red-600 dark:text-red-400 font-bold'
  if (con < 30) return 'text-amber-600 dark:text-amber-400 font-bold'
  return 'text-gray-700 dark:text-gray-300'
}

const ngayDayDuPK = (d: any) => {
  const p = String(d || '').split('-')
  return p.length >= 3 ? `${p[2]}/${p[1]}/${p[0]}` : String(d || '')
}

// ══════════════════════════════════════════════════════════════════════
// MỤC 438 (31/08/2026) — XEM APP ĐANG DÙNG TRÊN MỘT THIẾT BỊ
//
// ⚠️ Gọi `get-apps-of-device` — MỘT truy vấn nối bảng ở máy chủ, trả về
// hồ sơ app đầy đủ. KHÔNG lấy danh sách mã app rồi vòng lặp hỏi từng
// cái: đó là bẫy `HDG_131`.
//
// ⚠️ Mỗi lần mở đều gọi lại, không nhớ kết quả cũ. Danh sách app của một
// máy đổi ở màn Quản lý App, mà hai màn không nói chuyện với nhau — nhớ
// lại là hiện số liệu cũ mà không có gì báo.
// ══════════════════════════════════════════════════════════════════════
const hienAppCuaMay = ref(false)
const dangTaiApp = ref(false)
const mayDangXem = ref<any>(null)
const appCuaMay = ref<any[]>([])

const moAppCuaMay = async (row: any) => {
  mayDangXem.value = row
  appCuaMay.value = []
  hienAppCuaMay.value = true
  dangTaiApp.value = true
  try {
    appCuaMay.value = await otherService.getAppsOfDevice(row.id) || []
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không tải được danh sách app.')
  } finally {
    dangTaiApp.value = false
  }
}

// ══════════════════════════════════════════════════════════════════════
// MỤC 435 (31/08/2026) — GHÉP VÀ TÁCH CHUỖI HỆ ĐIỀU HÀNH
//
// Database vẫn chỉ có MỘT cột `os_version` chứa `Android 14`. Hai ô trên
// giao diện chỉ là cách nhập cho đỡ gõ sai — `he_dieu_hanh` và
// `phien_ban_os` KHÔNG được gửi lên máy chủ.
//
// ⚠️ `.trim()` ở `ghepOsVersion` là bắt buộc: chọn "Khác" mà chưa gõ số
// thì không được lưu một dấu cách, vì bảng sẽ hiện một ô trống trông như
// có dữ liệu.
// ══════════════════════════════════════════════════════════════════════
const ghepOsVersion = () => {
  form.os_version = `${form.he_dieu_hanh || ''} ${form.phien_ban_os || ''}`.trim()
}

const tachOsVersion = (chuoi: string) => {
  // ⚠️ So chữ thường để "IOS 17", "ios 17" và "iOS 17" đều nhận ra. Dữ
  // liệu cũ do nhiều người gõ tay nên viết hoa lộn xộn là chuyện thường.
  const goc = String(chuoi || '').trim()
  const thuong = goc.toLowerCase()
  for (const ten of ['android', 'ios']) {
    if (thuong.startsWith(ten)) {
      form.he_dieu_hanh = ten === 'ios' ? 'iOS' : 'Android'
      form.phien_ban_os = goc.slice(ten.length).trim()
      form.os_version = goc
      return
    }
  }
  // Không khớp tên nào -> để ô chọn ở "Khác" và giữ NGUYÊN VĂN chuỗi cũ
  // trong ô số. Không được vứt đi: đó là dữ liệu thật ai đó đã nhập.
  form.he_dieu_hanh = ''
  form.phien_ban_os = goc
  form.os_version = goc
}

// ══════════════════════════════════════════════════════════════════════
// MỤC 433 (31/08/2026) — TÁCH NGÀY MUA THÀNH HAI DÒNG
//
// ⚠️ Cắt bằng dấu "/" của chuỗi `formatDate` trả về, KHÔNG tự dựng lại
// từ đối tượng Date. Dựng lại là có hai chỗ quyết định định dạng ngày,
// và hai chỗ đó sẽ lệch nhau ở lần sửa sau.
// ══════════════════════════════════════════════════════════════════════
const ngayThang = (d: any) => {
  const chu = formatDate(d)
  const phan = String(chu).split('/')
  return phan.length >= 3 ? `${phan[0]}/${phan[1]}` : chu
}

const namMua = (d: any) => {
  const phan = String(formatDate(d)).split('/')
  return phan.length >= 3 ? phan[2] : ''
}

const formatDate = (val: string) => {
  if (!val) return '—'
  const parts = val.split('-')
  if (parts.length === 3) {
    const [y, m, d] = parts
    return `${d}/${m}/${y}`
  }
  return val
}

const getBatteryClass = (health: number) => {
  if (health >= 85) return 'text-emerald-600 dark:text-emerald-400 font-bold'
  if (health >= 80) return 'text-blue-500 font-bold'
  if (health >= 70) return 'text-amber-500 font-bold'
  return 'text-rose-500 font-extrabold'
}

const getStatusLabel = (status: string) => {
  return getDeviceStatusLabel(status)
}

const getStatusTagType = (status: string) => {
  return getDeviceStatusTagType(status)
}

onMounted(() => {
  fetchSmartphones()
  napSoPhuKien()   // MỤC 443
})
</script>

<style scoped>
/* Custom dark mode styles for table to match Harvest exactly */
html.dark .phone-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .phone-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .phone-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

html.dark .phone-container :deep(.el-table .el-table-fixed-column--left),
html.dark .phone-container :deep(.el-table .el-table-fixed-column--right) {
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
