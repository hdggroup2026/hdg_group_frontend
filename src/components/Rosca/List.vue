<template>
  <div class="rosca-list-container h-full p-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex flex-col overflow-y-auto">
    <!-- Header tabs block -->
    <el-tabs v-model="activeTab" type="border-card" class="harvest-tabs h-full flex flex-col">
      <el-tab-pane name="roscas-grid">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><List /></el-icon>
            <span>Danh sách Dây Hụi</span>
          </span>
        </template>

        <div class="roscas-content h-full flex flex-col">
          <!-- Filter Bar -->
          <div class="flex flex-wrap justify-between items-center gap-4 mb-4 shrink-0">
            <div class="flex flex-wrap items-center gap-4">
              <!-- ══ MỤC 365 (28/08/2026) — ẨN Ô CHỌN TRÊN ĐIỆN THOẠI ══
                   Trên màn hẹp chỉ có thẻ, không có bảng. Để nguyên ô chọn
                   thì người dùng chọn "dạng List" rồi không thấy gì đổi —
                   một nút bấm không làm gì là lỗi im lặng. -->
              <!-- Select Display Mode -->
              <div class="hidden md:flex items-center gap-2">
                <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Hiển thị:</span>
                <el-select
                  v-model="displayMode"
                  style="width: 170px"
                  class="custom-dark-input highlight-select"
                >
                  <el-option label="Hiển thị dạng List" value="list" />
                  <el-option label="Hiển thị dạng Card" value="card" />
                </el-select>
              </div>

              <!-- Trạng thái (Status) -->
              <div class="flex items-center gap-2">
                <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái:</span>
                <el-select 
                  v-model="filters.status" 
                  placeholder="Tất cả" 
                  clearable 
                  class="custom-dark-input"
                  style="width: 140px"
                  @change="handleFilterChange"
                >
                  <el-option label="Tất cả" value="" />
                  <el-option label="Đang hoạt động (Active)" value="Active" />
                  <el-option label="Hụi chết (Dead)" value="Dead" />
                  <!-- MỤC 381 — "Đã đóng"/"Ngưng hoạt động" -> "Đã hoàn
                       thành"; thêm "Tai nạn" cho dây dừng giữa chừng. Giá trị
                       lưu vẫn `Closed`, KHÔNG đổi — đổi giá trị là phải dọn
                       dữ liệu cũ, mà chỉ cần đổi chữ hiện ra. -->
                  <el-option label="Đã hoàn thành (Closed)" value="Closed" />
                  <el-option label="Tai nạn (Accident)" value="Accident" />
                </el-select>
              </div>

              <!-- Tìm kiếm (Search text) -->
              <div class="flex items-center gap-2">
                <span class="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
                <el-input 
                  v-model="filters.search" 
                  placeholder="Nhập mã dây, chủ hụi..." 
                  clearable 
                  class="custom-dark-input"
                  style="width: 240px"
                  @input="handleSearchInput"
                  @clear="handleFilterChange"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </div>
            </div>

            <!-- Actions buttons -->
            <div class="flex items-center gap-2">
              <el-button :icon="Refresh" circle @click="fetchRoscas" :loading="loading" />
              <el-button 
                type="primary" 
                class="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 border-none rounded-xl font-semibold shadow-sm text-white flex items-center"
                @click="handleOpenCreateDialog"
              >
                <el-icon class="mr-1"><Plus /></el-icon>
                Thêm Dây hụi
              </el-button>
            </div>
          </div>

          <!-- Table View (List) -->
          <!-- ══ MỤC 365 — BẢNG CHỈ HIỆN TỪ md (768px) TRỞ LÊN ══
               `hidden md:flex`: điện thoại KHÔNG dựng bảng này ra, nên
               không có gì để kẹt và không có gì phải vuốt ngang.
               Máy tính bảng và máy tính giữ nguyên bảng như cũ —
               s68 chốt: mọi thay đổi frontend áp cho CẢ BA cỡ máy. -->
          <div v-if="hienBang" v-loading="loading" class="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700/80 overflow-hidden flex flex-col flex-1 min-h-0">
            <el-table :data="paginatedRoscas" style="width: 100%" class="flex-1" height="100%" @sort-change="handleSortChange">
              <!-- ══ MỤC 365 (28/08/2026) — BỎ HẾT `fixed` ══
                   🔴 s68 chụp 28/08: trên điện thoại cột Trạng thái bị kẹt,
                   không vuốt ngang xem được. Nguyên nhân: STT và Mã dây
                   `fixed` trái, Trạng thái và Thao tác `fixed="right"`.
                   Màn 390px trừ đệm còn ~350px — bốn cột ghim đã chiếm hết,
                   phần giữa không còn chỗ để cuộn.
                   Bảng chỉ hiện từ `md` (768px) trở lên; điện thoại dùng
                   thẻ dọc, không có bảng nào để mà kẹt. -->
              <el-table-column label="STT" width="52" align="center">
                <template #default="{ $index }">
                  {{ (currentPage - 1) * pageSize + $index + 1 }}
                </template>
              </el-table-column>
              <el-table-column prop="code" label="Mã dây" min-width="105" sortable="custom">
                <template #default="{ row }">
                  <span class="font-mono font-bold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline" @click="openMembersModal(row)">
                    {{ row.code }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="owner_name" label="Chủ hụi" min-width="120" sortable="custom" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="font-bold text-gray-800 dark:text-gray-100">{{ row.owner_name || 'N/A' }}</span>
                </template>
              </el-table-column>
              <!-- ══ MỤC 383 (28/08/2026) — GỘP HAI CỘT LÀM MỘT Ô HAI DÒNG ══
                   s68 chốt: bảng 13 cột, tổng ~1.700 điểm ảnh nên iPad phải
                   vuốt ngang mấy lần. Chọn hướng ② + ③: gộp cột và giảm bề
                   rộng, GIỮ ĐỦ 13 thông tin — không bỏ cột nào.

                   🔴 Dòng trên là SỐ TIỀN GỐC (đậm, xanh), dòng dưới là
                   TIỀN THẢO (nhỏ, xám, có nhãn "thảo"). Nhãn ở dòng dưới là
                   bắt buộc: hai con số tiền chồng nhau mà không ghi cái nào
                   là cái gì thì người đọc phải đoán. -->
              <el-table-column prop="base_amount" label="Tiền gốc / Thảo" min-width="130" align="right" sortable="custom">
                <template #default="{ row }">
                  <div class="font-mono font-bold text-blue-600 dark:text-blue-400 leading-tight">
                    {{ formatCurrency(row.base_amount) }}
                  </div>
                  <div class="font-mono text-xs text-gray-500 dark:text-gray-400 leading-tight">
                    thảo {{ formatCurrency(row.commission_fee) }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="total_parts" label="Chân" min-width="72" align="center" sortable="custom">
                <template #default="{ row }">
                  <span class="font-bold text-gray-800 dark:text-gray-200">{{ row.total_parts || 0 }} chân</span>
                </template>
              </el-table-column>
              <el-table-column prop="period_type" label="Kỳ hạn" min-width="92" align="center">
                <template #default="{ row }">
                  <el-tag size="small" type="info" class="font-semibold">{{ row.period_type || 'Hụi Tháng' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Khui" min-width="98" align="center">
                <template #default="{ row }">
                  <!-- MỤC 383 — bỏ chữ "Ngày", xuống hai dòng. Chữ "Ngày"
                       lặp ở mọi dòng mà không thêm nghĩa gì. -->
                  <div class="text-gray-700 dark:text-gray-200 text-xs font-semibold leading-tight">
                    {{ row.payment_day ? 'N' + row.payment_day : '—' }}
                  </div>
                  <div class="text-gray-500 dark:text-gray-400 text-xs leading-tight">
                    {{ row.bidding_time ? row.bidding_time.substring(0, 5) : '—' }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="Kêu giá" min-width="130" align="center">
                <template #default="{ row }">
                  <!-- MỤC 383 — hai số xuống hai dòng. Để một dòng thì cột
                       phải rộng 180px chỉ vì hai số hiếm khi nhìn tới. -->
                  <div class="font-mono text-xs text-gray-600 dark:text-gray-300 leading-tight">
                    {{ formatCurrency(row.min_bid_amount) }}
                  </div>
                  <div class="font-mono text-xs text-gray-500 dark:text-gray-400 leading-tight">
                    / {{ formatCurrency(row.max_bid_amount) }}
                  </div>
                </template>
              </el-table-column>
              <!-- MỤC 383 — gộp Ngày mở / Ngày đóng.
                   Mũi tên `→` thay cho hai nhãn chữ: ai cũng đọc ra ngay là
                   "từ ngày này tới ngày kia", mà tốn có một ký tự. -->
              <el-table-column prop="start_date" label="Mở → Đóng" min-width="110" align="center" sortable="custom">
                <template #default="{ row }">
                  <div class="text-xs leading-tight">{{ formatDate(row.start_date) }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                    → {{ formatDate(row.end_date) }}
                  </div>
                </template>
              </el-table-column>
              <!-- ══ MỤC 365 — BỐN CỘT SỐ MỚI (MỤC 364 tính ở backend) ══ -->
              <el-table-column label="Kỳ" min-width="88" align="center">
                <template #default="{ row }">
                  <span class="font-mono font-semibold text-gray-700 dark:text-gray-300">
                    {{ row.so_ky_da_khui ?? 0 }}/{{ row.tong_so_ky ?? 0 }}
                  </span>
                  <div v-if="row.ky_gan_nhat" class="text-xs text-gray-400 mt-0.5">
                    kỳ {{ row.ky_gan_nhat }}: {{ row.nguoi_hot_gan_nhat || '—' }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="tong_da_dong" label="Đã đóng" min-width="112" align="right" sortable="custom">
                <template #default="{ row }">
                  <span class="font-mono" :class="mauSo(row.tong_da_dong)">{{ formatCurrency(row.tong_da_dong) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="tong_da_hot" label="Đã hốt" min-width="112" align="right" sortable="custom">
                <template #default="{ row }">
                  <span class="font-mono" :class="mauSo(row.tong_da_hot)">{{ formatCurrency(row.tong_da_hot) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="loi_nhuan" label="Lợi nhuận" min-width="120" align="right" sortable="custom">
                <template #default="{ row }">
                  <span class="font-mono font-bold" :class="lopMauLoiNhuan(row.loi_nhuan)">
                    {{ formatCurrency(row.loi_nhuan) }}
                  </span>
                  <!-- ⚠️ Dây ĐANG CHẠY thì lợi nhuận âm là BÌNH THƯỜNG:
                       tiền đóng đi trước, tiền hốt về sau. Nói ra ngay tại
                       chỗ, đừng để người đọc tưởng lỗ thật. -->
                  <div v-if="chuaHot(row)" class="text-xs text-gray-400 mt-0.5">chưa hốt kỳ nào</div>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="Trạng thái" min-width="112" align="center">
                <template #default="{ row }">
                  <el-tag :type="getStatusTagType(row.status)" size="small" effect="plain" class="font-semibold">
                    {{ getStatusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
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
                        <el-dropdown-item command="delete" divided class="!text-red-500">Xóa</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </template>
              </el-table-column>
            </el-table>

            <!-- Table Pagination -->
            <div class="p-4 flex justify-end border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :background="true"
                layout="total, sizes, prev, pager, next, jumper"
                :total="filteredRoscas.length"
              />
            </div>
          </div>

          <!-- Cards Grid Container -->
          <!-- ══ MỤC 365 — LUÔN HIỆN TRÊN ĐIỆN THOẠI ══
               `v-if` đổi thành: hiện khi người dùng chọn dạng Card, HOẶC
               khi màn hẹp (lúc đó bảng đã bị ẩn). Lớp `md:hidden` chỉ áp
               khi đang ở chế độ List — để máy tính không hiện cả hai. -->
          <div v-if="hienThe" v-loading="loading" class="flex-1 min-h-0 overflow-y-auto p-1 flex flex-col justify-between">
            <div v-if="paginatedRoscas.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              <div 
                v-for="rosca in paginatedRoscas" 
                :key="rosca.id"
                class="group relative rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-500/40 flex flex-col cursor-pointer"
                @click="openMembersModal(rosca)"
              >
                <!-- Card Header -->
                <div class="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-4 shrink-0">
                  <div class="flex items-center gap-2">
                    <div class="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-lg">
                      <el-icon :size="18"><List /></el-icon>
                    </div>
                    <span class="font-bold text-gray-800 dark:text-gray-100 text-base font-mono select-all">{{ rosca.code }}</span>
                  </div>

                  <div class="flex items-center gap-2">
                    <el-tag :type="getStatusTagType(rosca.status)" size="small" effect="plain" class="font-semibold">
                      {{ getStatusLabel(rosca.status) }}
                    </el-tag>
                    <!-- 3-dots action menu -->
                    <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, rosca)" @click.stop>
                      <el-button link type="info" class="p-1 !text-gray-400 hover:!text-gray-600 dark:hover:!text-gray-200">
                        <el-icon :size="18"><MoreFilled /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="detail">Chi tiết</el-dropdown-item>
                          <el-dropdown-item command="edit">Chỉnh sửa</el-dropdown-item>
                          <el-dropdown-item command="schedule">🔔 Lên lịch hẹn</el-dropdown-item>
                          <el-dropdown-item command="delete" divided class="!text-red-500">Xóa</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </div>

                <!-- Card Body -->
                <div class="space-y-3 flex-1 text-sm text-left">
                  <!-- Row 1: Chủ hụi -->
                  <div class="flex justify-between">
                    <span class="text-gray-400 dark:text-gray-500 font-medium">Chủ hụi:</span>
                    <span class="text-gray-800 dark:text-gray-250 font-bold">{{ rosca.owner_name || 'N/A' }}</span>
                  </div>
                  <!-- Row 2: Tiền gốc -->
                  <div class="flex justify-between">
                    <span class="text-gray-400 dark:text-gray-500 font-medium">Số tiền gốc:</span>
                    <span class="text-blue-600 dark:text-blue-400 font-bold font-mono">{{ formatCurrency(rosca.base_amount) }}</span>
                  </div>
                  <!-- Row 3: Số chân & Tiền thảo -->
                  <div class="flex justify-between">
                    <span class="text-gray-400 dark:text-gray-500 font-medium">Số chân / Tiền thảo:</span>
                    <span class="text-gray-700 dark:text-gray-300 font-semibold font-mono">
                      {{ rosca.total_parts || 0 }} chân / {{ formatCurrency(rosca.commission_fee) }}
                    </span>
                  </div>
                  <!-- Row 4: Kêu giá -->
                  <div class="flex justify-between">
                    <span class="text-gray-400 dark:text-gray-500 font-medium">Kêu giá (Min / Max):</span>
                    <span class="text-gray-700 dark:text-gray-300 font-semibold font-mono">
                      {{ formatCurrency(rosca.min_bid_amount) }} / {{ formatCurrency(rosca.max_bid_amount) }}
                    </span>
                  </div>
                  <!-- Row 5: Kỳ khui & thời gian -->
                  <div class="flex justify-between">
                    <span class="text-gray-400 dark:text-gray-500 font-medium">Kỳ hạn (Loại hụi):</span>
                    <el-tag size="small" type="info" class="font-semibold">{{ rosca.period_type || 'Hụi Tháng' }}</el-tag>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400 dark:text-gray-500 font-medium">Thời gian khui:</span>
                    <span class="text-gray-600 dark:text-gray-450 font-semibold">
                      Ngày {{ rosca.payment_day || '—' }} | {{ rosca.bidding_time ? rosca.bidding_time.substring(0, 5) : '—' }}
                    </span>
                  </div>

                  <!-- ══ MỤC 365 (28/08/2026) — KHỐI TIỀN ══
                       Đây là phần s68 cần nhất, và trên điện thoại đây là
                       chỗ DUY NHẤT đọc được (bảng chỉ hiện từ md trở lên).
                       Tách bằng đường kẻ để không lẫn với phần cấu hình. -->
                  <div class="pt-3 mt-1 border-t border-dashed border-gray-200 dark:border-gray-700/60 space-y-2">
                    <div class="flex justify-between">
                      <span class="text-gray-400 dark:text-gray-500 font-medium">Kỳ đã khui:</span>
                      <span class="text-gray-700 dark:text-gray-300 font-semibold font-mono">
                        {{ rosca.so_ky_da_khui ?? 0 }}/{{ rosca.tong_so_ky ?? 0 }}
                        <template v-if="rosca.ky_gan_nhat">
                          · kỳ {{ rosca.ky_gan_nhat }}: {{ rosca.nguoi_hot_gan_nhat || '—' }}
                        </template>
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400 dark:text-gray-500 font-medium">Đã đóng:</span>
                      <span class="font-semibold font-mono" :class="mauSo(rosca.tong_da_dong)">{{ formatCurrency(rosca.tong_da_dong) }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400 dark:text-gray-500 font-medium">Đã hốt:</span>
                      <span class="font-semibold font-mono" :class="mauSo(rosca.tong_da_hot)">{{ formatCurrency(rosca.tong_da_hot) }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400 dark:text-gray-500 font-medium">Lợi nhuận:</span>
                      <span class="font-bold font-mono" :class="lopMauLoiNhuan(rosca.loi_nhuan)">
                        {{ formatCurrency(rosca.loi_nhuan) }}
                      </span>
                    </div>
                    <!-- ⚠️ Dây chưa hốt kỳ nào thì lợi nhuận âm là BÌNH
                         THƯỜNG. Nói ngay tại chỗ, đừng để tưởng lỗ thật. -->
                    <div v-if="chuaHot(rosca)" class="text-xs text-gray-400 dark:text-gray-500 italic">
                      Chưa hốt kỳ nào — âm là bình thường, tiền đóng đi trước.
                    </div>
                  </div>
                </div>

                <!-- Card Footer -->
                <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex justify-between items-center text-xs text-gray-400 shrink-0">
                  <span>Mở: {{ formatDate(rosca.start_date) }}</span>
                  <span>Đóng: {{ formatDate(rosca.end_date) }}</span>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
              <el-icon class="text-6xl mb-4"><List /></el-icon>
              <p class="text-lg font-medium">Chưa có dây hụi nào được cấu hình</p>
              <el-button type="primary" link class="mt-2 font-bold" @click="handleOpenCreateDialog">Cấu hình dây đầu tiên</el-button>
            </div>

            <!-- Card Pagination -->
            <div v-if="filteredRoscas.length > 0" class="mt-4 shrink-0 p-4 flex justify-end border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl shadow">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :background="true"
                layout="total, sizes, prev, pager, next, jumper"
                :total="filteredRoscas.length"
              />
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Tab 2: Danh sách Chân Hụi -->
      <el-tab-pane name="members-grid">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><User /></el-icon>
            <span>Danh sách Chân Hụi</span>
          </span>
        </template>
        <MembersManagement />
      </el-tab-pane>

      <!-- Tab 3: Chi tiết đóng Hụi -->
      <el-tab-pane name="contributions-grid">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Refresh /></el-icon>
            <span>Chi tiết đóng Hụi</span>
          </span>
        </template>
        <ContributionsManagement />
      </el-tab-pane>

      <!-- Tab 4: Truy xuất thông tin -->
      <el-tab-pane name="info-retrieval">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><Search /></el-icon>
            <span>Truy xuất thông tin</span>
          </span>
        </template>
        <InfoRetrieval />
      </el-tab-pane>
    </el-tabs>

    <!-- Dialog: Add / Edit Rosca -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'CHỈNH SỬA CẤU HÌNH DÂY HỤI' : 'THÊM MỚI DÂY HỤI'"
      width="850px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form 
          :model="form" 
          :rules="rules" 
          ref="formRef" 
          label-width="180px"
          class="mt-2 compact-form"
          @submit.prevent="submitForm"
        >
          <!-- PHẦN 1: THÔNG TIN CHUNG -->
          <div class="mb-6">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin chung
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Mã dây hụi" prop="code" required>
                  <el-input 
                    v-model="form.code" 
                    placeholder="Ví dụ: DH01, BAT02..." 
                    :disabled="isEdit"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Chủ hụi (Owner)" prop="user_id" required>
                  <el-select v-model="form.user_id" placeholder="Chọn chủ hụi..." class="w-full highlight-select" style="width: 100%">
                    <el-option 
                      v-for="owner in owners" 
                      :key="owner.id" 
                      :label="owner.full_name + ' (' + owner.id + ')'" 
                      :value="owner.id" 
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Số tiền gốc (Base)" prop="base_amount" required>
                  <el-input 
                    v-model="form.base_amount" 
                    placeholder="Ví dụ: 10.000.000"
                    :formatter="(value) => !value ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                    :parser="(value) => value.replace(/\./g, '')"
                  >
                    <template #suffix>
                      <span class="text-xs text-gray-400">VNĐ</span>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tiền thảo" prop="commission_fee">
                  <el-input 
                    v-model="form.commission_fee" 
                    placeholder="Ví dụ: 500.000"
                    :formatter="(value) => !value ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                    :parser="(value) => value.replace(/\./g, '')"
                  >
                    <template #suffix>
                      <span class="text-xs text-gray-400">VNĐ</span>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Số chân tham gia" prop="total_parts">
                  <el-input-number v-model="form.total_parts" :min="1" :max="100" class="w-full" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: THỜI GIAN & LUẬT CHƠI -->
          <div class="mb-6">
            <h4 class="text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-cyan-500 rounded-full"></span>
              Thời gian &amp; Luật chơi
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Loại dây hụi (Kỳ hạn)" prop="period_type">
                  <el-select v-model="form.period_type" placeholder="Chọn kỳ hạn..." class="w-full highlight-select" style="width: 100%">
                    <el-option label="Hụi ngày" value="Hụi ngày" />
                    <el-option label="Hụi tuần" value="Hụi tuần" />
                    <el-option label="Hụi 2 tuần" value="Hụi 2 tuần" />
                    <el-option label="Hụi Tháng" value="Hụi Tháng" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ngày đóng hàng kỳ" prop="payment_day">
                  <el-input-number v-model="form.payment_day" :min="1" :max="31" class="w-full" style="width: 100%" placeholder="Nhập ngày đóng hụi..." />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Giờ khui hụi" prop="bidding_time">
                  <el-time-picker v-model="biddingTimeVal" format="HH:mm" value-format="HH:mm:00" placeholder="Chọn giờ khui..." class="w-full" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Ngày bắt đầu" prop="start_date">
                  <el-date-picker :editable="false" v-model="form.start_date" type="date" value-format="YYYY-MM-DD" placeholder="Chọn ngày mở..." class="w-full" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Ngày kết thúc" prop="end_date">
                  <el-date-picker :editable="false" v-model="form.end_date" type="date" value-format="YYYY-MM-DD" placeholder="Chọn ngày đóng..." class="w-full" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Kêu giá tối thiểu" prop="min_bid_amount">
                  <el-input 
                    v-model="form.min_bid_amount" 
                    placeholder="Kêu thấp nhất..."
                    :formatter="(value) => !value ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                    :parser="(value) => value.replace(/\./g, '')"
                  >
                    <template #suffix>
                      <span class="text-xs text-gray-400">VNĐ</span>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Kêu giá tối đa" prop="max_bid_amount">
                  <el-input 
                    v-model="form.max_bid_amount" 
                    placeholder="Kêu trần tối đa..."
                    :formatter="(value) => !value ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                    :parser="(value) => value.replace(/\./g, '')"
                  >
                    <template #suffix>
                      <span class="text-xs text-gray-400">VNĐ</span>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 3: TRẠNG THÁI & GHI CHÚ -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-violet-655 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
              Trạng thái &amp; Ghi chú
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Trạng thái" prop="status" required>
                  <el-select v-model="form.status" placeholder="Chọn trạng thái..." class="w-full highlight-select" style="width: 100%">
                    <el-option label="Đang hoạt động (Active)" value="Active" />
                    <el-option label="Hụi chết (Dead)" value="Dead" />
                    <!-- MỤC 381 — "Đã đóng"/"Ngưng hoạt động" -> "Đã hoàn
                       thành"; thêm "Tai nạn" cho dây dừng giữa chừng. Giá trị
                       lưu vẫn `Closed`, KHÔNG đổi — đổi giá trị là phải dọn
                       dữ liệu cũ, mà chỉ cần đổi chữ hiện ra. -->
                  <el-option label="Đã hoàn thành (Closed)" value="Closed" />
                  <el-option label="Tai nạn (Accident)" value="Accident" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Ghi chú" prop="note">
                  <el-input type="textarea" v-model="form.note" :rows="3" placeholder="Nhập ghi chú dây hụi..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-form>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3 pr-2">
          <el-button @click="dialogVisible = false">Hủy</el-button>
          <el-button 
            type="primary" 
            @click="submitForm" 
            :loading="submitting"
            class="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 border-none font-semibold text-white"
          >
            Xác nhận
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Dialog: Detail Rosca -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT DÂY HỤI"
      width="850px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedRosca" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto text-left">
        <!-- Visual Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-150 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-blue-500 dark:bg-blue-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32"><List /></el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Hồ sơ cấu hình dây hụi</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              Dây hụi: {{ selectedRosca.code }}
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <span class="text-gray-500 dark:text-gray-400">Chủ hụi: <strong class="text-gray-750 dark:text-gray-250">{{ selectedRosca.owner_name }}</strong></span>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span class="text-gray-500 dark:text-gray-400">Trạng thái: 
                <el-tag :type="getStatusTagType(selectedRosca.status)" size="small" effect="plain" class="font-semibold ml-1">
                  {{ getStatusLabel(selectedRosca.status) }}
                </el-tag>
              </span>
            </div>
          </div>
        </div>

        <!-- Section 1: Thông tin cơ bản -->
        <div>
          <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            Thông tin cơ bản
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã Dây Hụi</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono">{{ selectedRosca.code }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Họ tên chủ hụi</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedRosca.owner_name || '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số tiền gốc 1 chân</div>
              <div class="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">{{ formatCurrency(selectedRosca.base_amount) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tiền thảo hàng kỳ</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono">{{ formatCurrency(selectedRosca.commission_fee) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Số lượng chân hụi</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedRosca.total_parts || 0 }} chân</div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700/60"></div>

        <!-- Section 2: Luật chơi & Thời gian -->
        <div>
          <h4 class="text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-cyan-500 rounded-full"></span>
            Luật chơi &amp; Kỳ hạn
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Loại kỳ hạn (Loại hụi)</div>
              <el-tag size="small" type="info" class="font-semibold">{{ selectedRosca.period_type || 'Hụi Tháng' }}</el-tag>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày đóng hàng kỳ</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200">Ngày {{ selectedRosca.payment_day || '—' }} hàng tháng</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Giờ khui hụi</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono">{{ selectedRosca.bidding_time ? selectedRosca.bidding_time.substring(0, 5) : '—' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Kêu giá tối thiểu (Min)</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono">{{ formatCurrency(selectedRosca.min_bid_amount) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Kêu giá tối đa (Max)</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono">{{ formatCurrency(selectedRosca.max_bid_amount) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày bắt đầu dây</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono">{{ formatDate(selectedRosca.start_date) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ngày kết thúc dây</div>
              <div class="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono">{{ formatDate(selectedRosca.end_date) }}</div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700/60"></div>

        <!-- Section 3: Ghi chú -->
        <div>
          <h4 class="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
            Ghi chú
          </h4>
          <div class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
            {{ selectedRosca.note || 'Không có ghi chú nào cho dây hụi này.' }}
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="detailDialogVisible = false">Đóng</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Dialog: Read-only Rosca Members List -->
    <el-dialog
      v-model="membersModalVisible"
      :title="'DANH SÁCH CHÂN HỤI - DÂY ' + (selectedRoscaForMembers?.code || '')"
      width="850px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-loading="modalLoading" class="px-2 space-y-4 max-h-[60vh] overflow-y-auto">
        <div v-if="modalMembers.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            v-for="member in modalMembers" 
            :key="member.id"
            class="rounded-xl border border-gray-150 dark:border-gray-750 bg-white dark:bg-gray-800 p-4 flex flex-col text-sm text-left shadow-sm"
          >
            <div class="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700/60 mb-2">
              <span class="font-bold text-gray-800 dark:text-gray-100">{{ member.player_name || 'N/A' }}</span>
              <el-tag :type="getStatusTagTypeForMember(member.status)" size="small" effect="plain" class="font-semibold">
                {{ getStatusLabelForMember(member.status) }}
              </el-tag>
            </div>
            <div class="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
              <div class="flex justify-between">
                <span class="text-gray-400">Mã người chơi:</span>
                <span class="font-mono font-bold">{{ member.user_id }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Số chân sở hữu:</span>
                <span class="font-bold">{{ member.parts_count || 1 }} chân</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Số kỳ đã đóng:</span>
                <span class="font-mono font-bold text-blue-500">{{ (member as any).paid_rounds_count ?? (member as any).rounds_paid ?? (member as any).contributed_rounds ?? 0 }} kỳ</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Tổng đã đóng:</span>
                <span class="font-mono">{{ formatCurrency(member.total_contributed) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Tổng đã nhận:</span>
                <span class="font-mono text-blue-500">{{ formatCurrency(member.total_received) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Tổng lợi nhuận:</span>
                <span class="font-mono font-bold" :class="(member.total_profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'">
                  {{ formatCurrency(member.total_profit) }} ({{ member.profit_rate || 0 }}%)
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Nhóm Telegram:</span>
                <span class="truncate max-w-[150px] font-semibold">{{ member.telegram_group || '—' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Ghi chú:</span>
                <span class="truncate max-w-[150px]">{{ member.note || '—' }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- Empty state -->
        <div v-else class="flex flex-col items-center justify-center py-10 text-gray-450">
          <el-icon class="text-5xl mb-2"><User /></el-icon>
          <p>Chưa có người chơi nào tham gia dây hụi này.</p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end pr-2">
          <el-button type="primary" @click="membersModalVisible = false">Đóng</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Schedule Notification Modal -->
    <ScheduledNotificationModal
      v-model="scheduleModalVisible"
      module-key="rosca"
      :prefill-data="schedulePrefill"
      @saved="scheduleModalVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, reactive, computed } from 'vue'
import { mauSo, mauSoDam } from '@/utils/mauSo'
import { List, Search, Refresh, Plus, MoreFilled, User } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { roscaService, type Rosca, type UserRosca, type RoscaMember } from '@/api/roscaService'
import MembersManagement from './Members.vue'
import ContributionsManagement from './Contributions.vue'
import InfoRetrieval from './InfoRetrieval.vue'
import ScheduledNotificationModal from '@/components/ScheduledNotification/ScheduledNotificationModal.vue'

// State
const activeTab = ref('roscas-grid')
const roscas = ref<Rosca[]>([])
const owners = ref<UserRosca[]>([])
const loading = ref(false)
const submitting = ref(false)

const membersModalVisible = ref(false)
const selectedRoscaForMembers = ref<Rosca | null>(null)
const modalMembers = ref<RoscaMember[]>([])
const modalLoading = ref(false)

const openMembersModal = async (rosca: Rosca) => {
  selectedRoscaForMembers.value = rosca
  membersModalVisible.value = true
  modalLoading.value = true
  modalMembers.value = []
  try {
    if (rosca.id) {
      const data = await roscaService.getRoscaMembers({ rosca_id: rosca.id })
      modalMembers.value = data
    }
  } catch (error) {
    console.error('Failed to load modal members:', error)
    ElMessage.error('Không thể tải danh sách chân hụi')
  } finally {
    modalLoading.value = false
  }
}

const getStatusLabelForMember = (status?: string) => {
  switch (status) {
    case 'Playing':
    case 'Active':
      return 'Đang hoạt động'
    case 'Defaulted':
    case 'Dead':
      return 'Hụi chết'
    // ══ MỤC 381 (28/08/2026) — ĐỔI CHỮ VÀ THÊM MỘT TRẠNG THÁI ══
    //
    // s68 chốt 28/08:
    //   · "Ngưng hoạt động" -> "Đã hoàn thành" — dây đi hết vòng, xong
    //     việc. Chữ cũ nghe như bị dừng, trong khi thực tế là kết thúc
    //     bình thường.
    //   · Thêm "Tai nạn" — dây KHÔNG thể tiếp tục và dừng giữa chừng.
    //
    // 🔴 HAI CHUYỆN KHÁC HẲN NHAU, ĐỪNG GỘP. "Đã hoàn thành" là hết vòng
    // bình thường; "Tai nạn" là đứt gánh, tiền còn treo. Gộp làm một thì
    // nhìn danh sách không biết dây nào cần đi đòi.
    case 'Deactivate':
    case 'Closed':
    case 'Inactive':
      return 'Đã hoàn thành'
    case 'Accident':
      return 'Tai nạn'
    default:
      return status || '—'
  }
}

const getStatusTagTypeForMember = (status?: string) => {
  switch (status) {
    case 'Playing':
    case 'Active':
      return 'success'
    case 'Defaulted':
    case 'Dead':
      return 'danger'
    // MỤC 381 — "Đã hoàn thành" là kết thúc bình thường -> xám.
    case 'Deactivate':
    case 'Closed':
    case 'Inactive':
      return 'info'
    // 🔴 "Tai nạn" phải NỔI BẬT. Đây là dây đứt gánh, tiền còn treo —
    // nhìn lướt danh sách phải thấy ngay.
    case 'Accident':
      return 'danger'
    default:
      return 'info'
  }
}

// Filters State
const filters = reactive({
  status: '',
  search: ''
})

// Dialog States
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

const detailDialogVisible = ref(false)
const selectedRosca = ref<Rosca | null>(null)

// Bidding time state helper for el-time-picker
const biddingTimeVal = ref('')

const form = reactive<Rosca>({
  id: '',
  code: '',
  user_id: '',
  base_amount: 0,
  min_bid_amount: 0,
  max_bid_amount: 0,
  total_parts: 10,
  commission_fee: 0,
  start_date: '',
  end_date: '',
  payment_day: 15,
  bidding_time: '',
  period_type: 'Hụi Tháng',
  status: 'Draft',
  note: ''
})

// Rules
const rules = {
  code: [
    { required: true, message: 'Vui lòng nhập mã dây hụi', trigger: 'blur' },
    { min: 3, message: 'Mã dây hụi tối thiểu 3 ký tự', trigger: 'blur' }
  ],
  user_id: [
    { required: true, message: 'Vui lòng chọn chủ hụi', trigger: 'change' }
  ],
  base_amount: [
    { required: true, message: 'Vui lòng nhập số tiền gốc 1 chân', trigger: 'blur' }
  ],
  status: [
    { required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change' }
  ]
}

// Helpers
const getStatusLabel = (status?: string) => {
  switch (status) {
    case 'Active': return 'Đang hoạt động'
    case 'Closed': return 'Đã đóng'
    case 'Dead': return 'Hụi chết'
    default: return status || '—'
  }
}

const getStatusTagType = (status?: string) => {
  switch (status) {
    case 'Active': return 'success'
    case 'Closed': return 'info'
    case 'Dead': return 'danger'
    default: return 'info'
  }
}

const formatCurrency = (val?: number) => {
  if (val === undefined || val === null) return '—'
  return new Intl.NumberFormat('vi-VN').format(val) + ' VNĐ'
}

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    const d = String(date.getDate()).padStart(2, '0')
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const y = date.getFullYear()
    return `${d}/${m}/${y}`
  } catch (e) {
    return dateStr
  }
}

// Fetch Active Owners
const fetchOwners = async () => {
  try {
    const data = await roscaService.getUserRoscas({ role: 'Owner', status: 'Active' })
    owners.value = data
  } catch (error) {
    console.error('Failed to load owners:', error)
  }
}

// Fetch Rosca List
const fetchRoscas = async () => {
  loading.value = true
  try {
    const data = await roscaService.getRoscas({
      status: filters.status || undefined
    })
    roscas.value = data
  } catch (error: any) {
    console.error(error)
    ElMessage.error(error.message || 'Lỗi khi tải danh sách dây hụi')
  } finally {
    loading.value = false
  }
}

// Handle change in filters
const handleFilterChange = () => {
  fetchRoscas()
}

// Search input handling
let searchTimeout: any = null
const handleSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    // client search computed handles it dynamically
  }, 200)
}

// Client-side filtration and pagination for search input
const displayMode = ref<'list' | 'card'>('list')

// ══════════════════════════════════════════════════════════════════════
// MỤC 365 (28/08/2026) — ĐIỆN THOẠI DÙNG THẺ, MÁY TÍNH DÙNG BẢNG
//
// 🔴 s68 chụp 28/08: trên điện thoại cột "Trạng thái" bị kẹt, không vuốt
// ngang xem được. Nguyên nhân trong `el-table`: STT và Mã dây khai
// `fixed`, Trạng thái và Thao tác khai `fixed="right"`. Màn 390px trừ đệm
// còn ~350px — bốn cột ghim đã chiếm hết, phần giữa không còn chỗ cuộn.
//
// Cách sửa theo đúng `tai_lieu_ai/quy_uoc_bo_cuc_the.md`: màn hẹp KHÔNG
// dựng bảng ra, dùng thẻ dọc. Không có bảng thì không có gì để kẹt.
//
// ⚠️ Ngưỡng 768px trùng với `md:` của Tailwind mà cả dự án đang dùng. Đặt
// một con số khác là có hai ngưỡng cho cùng một việc, và chúng sẽ lệch.
const NGUONG_MAN_HEP = 768

const laManHep = ref(false)

const doBeRong = () => {
  laManHep.value = typeof window !== 'undefined'
    && window.innerWidth < NGUONG_MAN_HEP
}

// Bảng chỉ hiện khi người dùng chọn dạng List VÀ màn đủ rộng.
const hienBang = computed(() => displayMode.value === 'list' && !laManHep.value)

// Thẻ hiện khi chọn dạng Card, HOẶC khi màn hẹp (lúc đó bảng đã bị ẩn).
// Không bao giờ hiện cả hai cùng lúc.
const hienThe = computed(() => displayMode.value === 'card' || laManHep.value)

// ══ MỤC 380 (28/08/2026) — DÙNG QUY TẮC MÀU CHUNG ══
// s68 chốt: toàn bộ số trên web — âm đỏ tươi, dương xanh biển, 0 xám.
// Trước đây màn này tự đặt màu riêng (dương thì XANH LÁ). Mỗi màn một
// kiểu là người đọc phải học lại màu ở từng trang.
//
// ⚠️ Dây ĐANG CHẠY mà chưa hốt kỳ nào thì lợi nhuận âm là BÌNH THƯỜNG —
// tiền đóng đi trước, tiền hốt về sau. Màu đỏ ở đây KHÔNG có nghĩa là
// hỏng, nên mọi chỗ hiện số âm đều kèm dòng chữ giải thích (`chuaHot`).
const lopMauLoiNhuan = (val?: number) => mauSoDam(val)

const chuaHot = (row: Rosca) => (row.so_ky_da_khui ?? 0) === 0

const currentPage = ref(1)
const pageSize = ref(10)
const sortProp = ref('')
const sortOrder = ref('')

const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  sortProp.value = prop
  sortOrder.value = order
}

const filteredRoscas = computed(() => {
  if (!filters.search) return roscas.value

  const searchLower = filters.search.toLowerCase().trim()
  return roscas.value.filter(rosca => {
    const codeMatch = rosca.code.toLowerCase().includes(searchLower)
    const ownerMatch = rosca.owner_name?.toLowerCase().includes(searchLower)
    const noteMatch = rosca.note?.toLowerCase().includes(searchLower)
    return codeMatch || ownerMatch || noteMatch
  })
})

const sortedRoscas = computed(() => {
  const list = [...filteredRoscas.value]
  if (!sortProp.value || !sortOrder.value) return list

  return list.sort((a, b) => {
    const valA = (a as any)[sortProp.value] ?? ''
    const valB = (b as any)[sortProp.value] ?? ''

    let res = 0
    if (typeof valA === 'number' && typeof valB === 'number') {
      res = valA - valB
    } else {
      res = String(valA).localeCompare(String(valB), 'vi', { numeric: true })
    }

    return sortOrder.value === 'ascending' ? res : -res
  })
})

const paginatedRoscas = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedRoscas.value.slice(start, end)
})

// Add new rosca form initialization
const handleOpenCreateDialog = () => {
  isEdit.value = false
  form.id = ''
  form.code = ''
  form.user_id = owners.value[0]?.id || ''
  form.base_amount = 0
  form.min_bid_amount = 0
  form.max_bid_amount = 0
  form.total_parts = 10
  form.commission_fee = 0
  form.start_date = ''
  form.end_date = ''
  form.payment_day = 15
  form.bidding_time = ''
  biddingTimeVal.value = ''
  form.period_type = 'Hụi Tháng'
  form.status = 'Active'
  form.note = ''
  dialogVisible.value = true
}

// Edit rosca dialog open
const handleOpenEditDialog = (row: Rosca) => {
  isEdit.value = true
  form.id = row.id
  form.code = row.code
  form.user_id = row.user_id
  form.base_amount = row.base_amount
  form.min_bid_amount = row.min_bid_amount || 0
  form.max_bid_amount = row.max_bid_amount || 0
  form.total_parts = row.total_parts || 10
  form.commission_fee = row.commission_fee || 0
  form.start_date = row.start_date || ''
  form.end_date = row.end_date || ''
  form.payment_day = row.payment_day || 15
  form.bidding_time = row.bidding_time || ''
  biddingTimeVal.value = row.bidding_time || ''
  form.period_type = row.period_type || 'Hụi Tháng'
  form.status = row.status || 'Draft'
  form.note = row.note || ''
  dialogVisible.value = true
}

// Detail dialog open
const handleOpenDetailDialog = (row: Rosca) => {
  selectedRosca.value = row
  detailDialogVisible.value = true
}

// Action dropdown command router
const handleCommand = (cmd: string, row: Rosca) => {
  if (cmd === 'detail') {
    handleOpenDetailDialog(row)
  } else if (cmd === 'edit') {
    handleOpenEditDialog(row)
  } else if (cmd === 'delete') {
    handleDelete(roscas.value.find(r => r.id === row.id) || row)
  } else if (cmd === 'schedule') {
    openScheduleDialog(row)
  }
}

// Schedule notification
const scheduleModalVisible = ref(false)
const schedulePrefill = ref<any>(null)

const openScheduleDialog = (row: Rosca) => {
  schedulePrefill.value = {
    notify_type: 'rosca_payment',
    reference_id: row.code,
    reference_name: row.owner_name ? `Chủ hụi: ${row.owner_name}` : row.code,
    message_template: `Nhắc nhở đóng hụi\nDây hụi: ${row.code}\nChủ hụi: ${row.owner_name || ''}\nSố tiền gốc: ${new Intl.NumberFormat('vi-VN').format(row.base_amount || 0)} VNĐ`,
  }
  scheduleModalVisible.value = true
}

// Submit Create/Update Form
const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true
      try {
        const payload: Rosca = {
          id: form.id || undefined,
          code: form.code.trim(),
          user_id: form.user_id,
          base_amount: parseFloat(`${form.base_amount || 0}`),
          min_bid_amount: parseFloat(`${form.min_bid_amount || 0}`),
          max_bid_amount: parseFloat(`${form.max_bid_amount || 0}`),
          total_parts: parseInt(`${form.total_parts || 0}`),
          commission_fee: parseFloat(`${form.commission_fee || 0}`),
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          payment_day: form.payment_day ? parseInt(`${form.payment_day}`) : null,
          bidding_time: biddingTimeVal.value || null,
          period_type: form.period_type,
          status: form.status,
          note: form.note?.trim() || null
        }

        if (isEdit.value) {
          await roscaService.updateRoscas([payload])
          ElMessage.success('Cập nhật cấu hình dây hụi thành công!')
        } else {
          await roscaService.addRoscas([payload])
          ElMessage.success('Tạo dây hụi mới thành công!')
        }
        dialogVisible.value = false
        await fetchRoscas()
      } catch (error: any) {
        ElMessage.error(error.message || 'Không thể lưu thông tin dây hụi')
      } finally {
        submitting.value = false
      }
    }
  })
}

// Delete rosca confirmation and API execution
const handleDelete = (row: Rosca) => {
  ElMessageBox.confirm(
    `Bạn có chắc chắn muốn xóa dây hụi "${row.code}" không?`,
    'Xác nhận xóa dây hụi',
    {
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy bỏ',
      type: 'warning'
    }
  ).then(async () => {
    loading.value = true
    try {
      if (row.id) {
        await roscaService.deleteRoscas([row.id])
        ElMessage.success('Xóa dây hụi thành công!')
        await fetchRoscas()
      }
    } catch (error: any) {
      ElMessage.error(error.message || 'Lỗi khi xóa dây hụi')
    } finally {
      loading.value = false
    }
  }).catch(() => {})
}

onMounted(async () => {
  // MỤC 365 — đo bề rộng NGAY khi mở trang, rồi theo dõi lúc xoay máy.
  // Không đo lúc mở thì lần vẽ đầu tiên luôn ra bảng, và trên điện thoại
  // người dùng thấy đúng cái màn hỏng trước khi nó tự sửa.
  doBeRong()
  window.addEventListener('resize', doBeRong)
  await fetchOwners()
  await fetchRoscas()
})

onBeforeUnmount(() => {
  // Gỡ ra khi rời trang. Không gỡ thì mỗi lần vào lại chồng thêm một
  // người nghe, và trang càng dùng càng chậm.
  window.removeEventListener('resize', doBeRong)
})
</script>

<style scoped>
.rosca-list-container {
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

.roscas-content {
  height: 100%;
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

html.dark .rosca-list-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}
html.dark .rosca-list-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}
html.dark .rosca-list-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}
html.dark .rosca-list-container :deep(.el-table .el-table-fixed-column--left),
html.dark .rosca-list-container :deep(.el-table .el-table-fixed-column--right) {
  background-color: #1f2937 !important;
}
</style>
