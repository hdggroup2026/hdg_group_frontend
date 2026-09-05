<template>
  <div class="laptop-container h-full flex flex-col">
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
            placeholder="Dòng máy, hãng, CPU, Service Tag..."
            clearable
            class="w-64 custom-dark-input"
            style="width: 256px"
          />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <el-button :icon="Refresh" circle @click="fetchLaptops" :loading="loading" />
        <el-button type="primary" @click="openAddDialog">
          <el-icon class="mr-1"><Plus /></el-icon> Thêm Laptop
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
      <el-table v-if="hienBang" v-loading="loading" :data="paginatedLaptops" style="width: 100%" class="flex-1" height="100%">
        <!-- STT Column -->
        <el-table-column label="STT" width="52" align="center">
          <template #default="{ $index }">
            <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>

        <!-- ══════════════════════════════════════════════════════════
             MỤC 518 (05/09/2026) — BẢNG CHỈ CÒN PHẦN NHẬN DẠNG,
             BẤM MÃ THIẾT BỊ ĐỂ XEM ĐỦ

             s68 (ảnh 05/09, hình 1): *"thông tin 2 ô vuông đấy ẩn đi.
             Khi nào bấm vào mã máy (đổi thành Mã Thiết Bị) thì hiện đầy
             đủ bảng thông tin của thiết bị đấy ra là xong."*

             Đã dời khỏi bảng: số serial · IMEI · HĐH · cấu hình · dung
             lượng · pin · trạng thái · ngày mua · hạn bảo hành · ghi
             chú · cột Thao tác. Tất cả VẪN CÒN NGUYÊN trong hộp
             CHI TIẾT — đã đối chiếu từng trường trước khi cắt, không
             trường nào biến mất khỏi màn hình.

             ⚠️ Cột Thao tác ẩn theo yêu cầu s68 ngày 05/09, nên bốn
             việc Bàn giao · Thu hồi · Chỉnh sửa · Xóa đã chuyển xuống
             chân hộp Chi tiết. Ẩn cột mà không chuyển là khoá luôn
             đường xoá máy.

             ⚠️ Dùng `<button>`, KHÔNG dùng `<span @click>` — quy tắc từ
             MỤC 420, 424, 438.
             ══════════════════════════════════════════════════════════ -->
        <el-table-column prop="id" label="Mã Thiết Bị" width="122" show-overflow-tooltip>
          <template #default="{ row }">
            <button type="button"
                    class="font-mono font-bold text-blue-600 dark:text-blue-400 underline decoration-dotted underline-offset-2 hover:text-blue-800"
                    :title="`Xem đầy đủ thông tin của ${row.id}`"
                    @click.stop="handleCommand('detail', row)">
              {{ row.id }}
            </button>
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









        <!-- Phụ kiện đi kèm -->
        <el-table-column prop="accessories" label="Phụ kiện" min-width="130" show-overflow-tooltip />

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
        <div v-if="paginatedLaptops.length > 0" class="grid grid-cols-1 gap-4">
          <div
            v-for="(row, i) in (paginatedLaptops as any[])"
            :key="row.id || row.contract_id || i"
            class="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-sm"
          >
            <!-- MỤC 518 — thẻ dọc đi theo bảng: mã bấm được, bỏ nút ⋯ -->
            <div class="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
              <div class="min-w-0 break-words">
                <button type="button"
                        class="font-mono font-bold text-blue-600 dark:text-blue-400 underline decoration-dotted underline-offset-2"
                        @click.stop="handleCommand('detail', row)">
                  {{ row.id }}
                </button>
              </div>
              <div class="shrink-0 text-xs text-gray-400">Bấm mã để xem đủ</div>
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
                <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Phụ kiện:</span>
                <span class="text-right break-words min-w-0">
                  {{ row.accessories }}
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
          :total="filteredLaptops.length"
        />
      </div>
    </div>

    <!-- Dialog: Add / Edit Laptop -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'CHỈNH SỬA THÔNG TIN LAPTOP' : 'THÊM LAPTOP MỚI'"
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
                  <el-input v-model="form.id" :disabled="isEdit" placeholder="VD: LT0001..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Hãng sản xuất" prop="brand">
                  <el-input v-model="form.brand" placeholder="VD: Dell, Apple, Lenovo..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Dòng máy" prop="model_name">
                  <el-input v-model="form.model_name" placeholder="VD: Dell XPS 13, MacBook Pro M3..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Service Tag (S/N)" prop="service_tag">
                  <el-input v-model="form.service_tag" placeholder="Nhập Service Tag..." />
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
                <el-form-item label="Địa chỉ MAC" prop="mac_address">
                  <el-input v-model="form.mac_address" placeholder="VD: AA:BB:CC:DD:EE:FF" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: THÔNG SỐ KỸ THUẬT -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Thông số phần cứng
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Bộ xử lý CPU" prop="processor_cpu">
                  <el-input v-model="form.processor_cpu" placeholder="VD: Intel Core i7 13700H, Apple M3..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Dung lượng RAM" prop="ram_size">
                  <el-input v-model="form.ram_size" placeholder="VD: 16 GB, 32 GB..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Cấu hình ổ cứng" prop="storage_specs">
                  <el-input v-model="form.storage_specs" placeholder="VD: SSD 512 GB PCIe, SSD 1 TB..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Card đồ họa (GPU)" prop="gpu_card">
                  <el-input v-model="form.gpu_card" placeholder="VD: NVIDIA RTX 4060, Intel Iris Xe..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 3: THỜI HẠN & TRẠNG THÁI -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-violet-650 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-violet-500 rounded-full"></span>
              Thông tin bổ sung &amp; Bảo hành
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Thời hạn bảo hành" prop="warranty_expiry">
                  <el-date-picker :editable="false" v-model="form.warranty_expiry" type="date" value-format="YYYY-MM-DD" placeholder="Chọn ngày hết hạn..." class="!w-full" />
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
                <el-form-item label="Phụ kiện đi kèm" prop="accessories">
                  <el-input v-model="form.accessories" placeholder="VD: Sạc zin, túi chống sốc, chuột không dây..." />
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

    <!-- Dialog: Detail Laptop -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT THÔNG TIN LAPTOP"
      width="750px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="selectedLaptop" class="px-2 space-y-6 max-h-[60vh] overflow-y-auto text-left">
        <!-- Visual Profile Header -->
        <div class="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="p-3.5 rounded-2xl bg-blue-500 dark:bg-blue-600 text-white shadow-md flex items-center justify-center">
            <el-icon :size="32"><Cpu /></el-icon>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Máy tính xách tay</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {{ selectedLaptop.model_name }}
              <span class="text-gray-400 dark:text-gray-500 font-mono font-medium" v-if="selectedLaptop.brand">({{ selectedLaptop.brand }})</span>
            </h3>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              <span class="text-gray-500 dark:text-gray-400">Phân loại: <strong class="text-gray-750 dark:text-gray-250">{{ selectedLaptop.classification || '—' }}</strong></span>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span class="text-gray-500 dark:text-gray-400">CPU: <strong>{{ selectedLaptop.processor_cpu || '—' }}</strong></span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Mã máy (ID)</div>
            <div class="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">{{ selectedLaptop.id }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Service Tag (S/N)</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono">{{ selectedLaptop.service_tag || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Dung lượng RAM</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedLaptop.ram_size || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Cấu hình ổ cứng</div>
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ selectedLaptop.storage_specs || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Card đồ họa (GPU)</div>
            <div class="text-sm text-gray-700 dark:text-gray-300">{{ selectedLaptop.gpu_card || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Địa chỉ MAC</div>
            <div class="text-sm font-mono text-gray-700 dark:text-gray-300">{{ selectedLaptop.mac_address || '—' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Thời hạn bảo hành</div>
            <div class="text-sm font-mono text-gray-750 dark:text-gray-300">{{ formatDate(selectedLaptop.warranty_expiry) }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Phụ kiện đi kèm</div>
            <div class="text-sm text-gray-700 dark:text-gray-300">{{ selectedLaptop.accessories || 'Không có' }}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Trạng thái</div>
            <div>
              <el-tag size="small" :type="getStatusTagType(selectedLaptop.status)" effect="dark" class="font-bold">
                {{ getStatusLabel(selectedLaptop.status) }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <!-- ══════════════════════════════════════════════════════
               MỤC 518 (05/09/2026) — BỐN VIỆC CHUYỂN TỪ CỘT THAO TÁC
               XUỐNG ĐÂY

               Cột Thao tác (nút ⋯) đã ẩn khỏi bảng theo yêu cầu s68
               ngày 05/09. Nếu chỉ ẩn mà không chuyển thì không còn
               đường nào để Bàn giao · Thu hồi · Chỉnh sửa · Xóa.

               ⚠️ Đóng hộp Chi tiết TRƯỚC khi gọi việc khác. Element
               Plus xếp hai hộp thoại chồng nhau thì hộp dưới khoá cuộn
               của hộp trên, bấm được nút nhưng không kéo xem được.
               ══════════════════════════════════════════════════════ -->
          <el-button @click="viecTuChiTiet('handover')">Bàn giao</el-button>
          <el-button @click="viecTuChiTiet('return')">Thu hồi</el-button>
          <el-button @click="viecTuChiTiet('edit')">Chỉnh sửa</el-button>
          <el-button class="!text-red-500" @click="viecTuChiTiet('delete')">Xóa</el-button>
          <el-button type="primary" @click="detailDialogVisible = false">Đóng</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Modal: Bàn giao Laptop -->
    <DeviceHandoverModal
      v-model="handoverModalVisible"
      :device-info="handoverDeviceInfo"
      @success="handleHandoverSuccess"
    />

    <!-- Modal: Thu hồi Laptop -->
    <DeviceReturnModal
      v-model="returnModalVisible"
      :device-info="returnDeviceInfo"
      @success="handleReturnSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Cpu, Refresh, Plus, MoreFilled } from '@element-plus/icons-vue'
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

const laptops = ref<any[]>([])

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Fetch laptops list from GET API
const fetchLaptops = async () => {
  loading.value = true
  currentPage.value = 1
  try {
    const data = await otherService.getLaptops({
      classification: filterClassification.value || undefined
    })
    laptops.value = data
  } catch (error: any) {
    console.error('API get-laptops failed:', error)
    ElMessage.error(error.message || 'Lỗi khi tải danh sách laptop từ API')
    laptops.value = []
  } finally {
    loading.value = false
  }
}

const handleClassificationChange = () => {
  fetchLaptops()
}

// Search Computed
const filteredLaptops = computed(() => {
  return laptops.value.filter(item => {
    const q = searchQuery.value.toLowerCase()
    
    const matchesSearch = !q ||
      item.model_name.toLowerCase().includes(q) ||
      (item.brand && item.brand.toLowerCase().includes(q)) ||
      (item.processor_cpu && item.processor_cpu.toLowerCase().includes(q)) ||
      (item.service_tag && item.service_tag.toLowerCase().includes(q)) ||
      (item.mac_address && item.mac_address.toLowerCase().includes(q))

    const matchesClassification = !filterClassification.value || 
      item.classification === filterClassification.value

    return matchesSearch && matchesClassification
  })
})

const paginatedLaptops = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredLaptops.value.slice(start, end)
})

// Dialog States
const dialogVisible = ref(false)
const isEdit = ref(false)
const detailDialogVisible = ref(false)
const selectedLaptop = ref<any | null>(null)
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
  processor_cpu: '',
  ram_size: '',
  storage_specs: '',
  gpu_card: '',
  service_tag: '',
  mac_address: '',
  warranty_expiry: '',
  status: 'available',
  accessories: '',
  classification: 'Công việc'
})

const rules = reactive({
  id: [{ required: true, message: 'Vui lòng nhập mã thiết bị (ID)', trigger: 'blur' }],
  model_name: [{ required: true, message: 'Vui lòng nhập tên dòng máy', trigger: 'blur' }],
  status: [{ required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change' }]
})

// Action Handlers
// MỤC 518 (05/09/2026) — chạy một việc từ chân hộp Chi tiết.
// Đóng hộp trước, xem lời ghi ở chân hộp Chi tiết phía trên.
const viecTuChiTiet = (cmd: string) => {
  const may = selectedLaptop.value
  if (!may) return
  detailDialogVisible.value = false
  handleCommand(cmd, may)
}

const handleCommand = (cmd: string, row: any) => {
  if (cmd === 'detail') {
    selectedLaptop.value = row
    detailDialogVisible.value = true
  } else if (cmd === 'handover') {
    if (!isReadyForHandover(row.status)) {
      ElMessage.warning('Chỉ thiết bị ở trạng thái "Sẵn sàng bàn giao" mới có thể thực hiện bàn giao!')
      return
    }
    handoverDeviceInfo.value = {
      id: row.id,
      type: 'laptop',
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
      type: 'laptop',
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
  fetchLaptops()
}

const handleReturnSuccess = () => {
  fetchLaptops()
}

const openAddDialog = () => {
  isEdit.value = false
  form.id = ''
  form.brand = ''
  form.model_name = ''
  form.processor_cpu = ''
  form.ram_size = ''
  form.storage_specs = ''
  form.gpu_card = ''
  form.service_tag = ''
  form.mac_address = ''
  form.status = 'available'
  form.warranty_expiry = ''
  form.accessories = ''
  form.classification = 'Công việc'
  dialogVisible.value = true
}

const openEditDialog = (row: any) => {
  isEdit.value = true
  form.id = row.id
  form.brand = row.brand || ''
  form.model_name = row.model_name
  form.processor_cpu = row.processor_cpu || ''
  form.ram_size = row.ram_size || ''
  form.storage_specs = row.storage_specs || ''
  form.gpu_card = row.gpu_card || ''
  form.service_tag = row.service_tag || ''
  form.mac_address = row.mac_address || ''
  form.status = row.status
  form.warranty_expiry = row.warranty_expiry || ''
  form.accessories = row.accessories || ''
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
        processor_cpu: form.processor_cpu || null,
        ram_size: form.ram_size || null,
        storage_specs: form.storage_specs || null,
        gpu_card: form.gpu_card || null,
        service_tag: form.service_tag || null,
        mac_address: form.mac_address || null,
        status: form.status,
        warranty_expiry: form.warranty_expiry || null,
        accessories: form.accessories || null,
        classification: form.classification || null
      }

      try {
        if (isEdit.value) {
          const editPayload = { ...payload }
          await otherService.updateLaptops([editPayload])

          const idx = laptops.value.findIndex(s => s.id === form.id)
          if (idx !== -1) {
            laptops.value[idx] = { ...laptops.value[idx], ...editPayload }
          }
          ElMessage.success('Cập nhật thông tin laptop thành công!')
        } else {
          const res = await otherService.addLaptops([payload])
          if (res && res.length > 0) {
            laptops.value.unshift(res[0])
          } else {
            laptops.value.unshift({ ...payload })
          }
          ElMessage.success('Thêm mới laptop thành công!')
        }
        dialogVisible.value = false
      } catch (error: any) {
        ElMessage.error(error.message || 'Lỗi khi lưu thông tin laptop')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa laptop "${row.model_name}" (${row.id}) khỏi cơ sở dữ liệu?`,
      'Xác nhận xóa thiết bị',
      {
        confirmButtonText: 'Xóa bỏ',
        cancelButtonText: 'Hủy',
        type: 'warning'
      }
    )
    loading.value = true
    await otherService.deleteLaptops([row.id])

    laptops.value = laptops.value.filter(s => s.id !== row.id)
    ElMessage.success('Xóa laptop thành công!')
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || 'Lỗi khi xóa laptop')
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
  fetchLaptops()
})
</script>

<style scoped>
html.dark .laptop-container :deep(.el-table) {
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #111827;
  --el-table-row-hover-bg-color: #374151;
  --el-table-border-color: #374151;
  --el-table-border: 1px solid #374151;
}

html.dark .laptop-container :deep(.el-table th.el-table__cell) {
  background-color: #111827 !important;
}

html.dark .laptop-container :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #374151;
}

html.dark .laptop-container :deep(.el-table .el-table-fixed-column--left),
html.dark .laptop-container :deep(.el-table .el-table-fixed-column--right) {
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
