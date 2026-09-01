<!--
  MỤC 437 (31/08/2026) — MÀN QUẢN LÝ APP.

  s68: *"thêm mục Quản lý App. Vào mục này sẽ hiện danh sách app đã đăng
  ký. Edit, tạo mới app. Mỗi app hiện thông tin đầy đủ."* và *"1 tài
  khoản app có thể sử dụng nhiều thiết bị. Nên add app vào rồi thì lúc
  gán thiết bị có thể gán thêm nhiều thiết bị tuỳ chỉnh luôn."*

  Mục đích s68 nêu ở câu 3 ngày 31/08: lưu đủ chi tiết để **sau này hỏi
  AI qua Telegram** — "Netflix đăng nhập bằng gì", "mã hai lớp về đâu",
  "ai đang giữ tài khoản". Nên form dài, và dài là cố ý.

  ⚠️ BỐ CỤC HAI BẢN như mọi màn khác: bảng cho màn rộng, thẻ dọc cho màn
  hẹp. Xem `tai_lieu_ai/quy_uoc_bo_cuc_the.md`. Sửa một bản là phải sửa
  bản kia — bài học MỤC 424.

  ⚠️ KHÔNG có cột `fixed` nào (MỤC 391).
-->
<template>
  <div class="p-4 h-full overflow-auto bg-gray-50 dark:bg-gray-900">
    <!-- Thanh công cụ -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <span class="text-lg font-bold text-gray-800 dark:text-gray-100">Quản lý App</span>

      <el-input v-model="tuKhoa" placeholder="Tìm tên app, tài khoản, người giữ..."
                clearable style="width: 260px" />

      <el-select v-model="locTrangThai" placeholder="Trạng thái" clearable
                 style="width: 150px">
        <el-option label="Đang dùng" value="active" />
        <el-option label="Tạm ngưng" value="paused" />
        <el-option label="Đã huỷ" value="cancelled" />
      </el-select>

      <div class="flex-1"></div>

      <el-button :icon="Refresh" circle @click="taiDanhSach" />
      <el-button type="primary" :icon="Plus" @click="moThem">Thêm App</el-button>
    </div>

    <!-- ══════════════════ BẢNG — MÀN RỘNG ══════════════════ -->
    <el-table v-if="hienBang" :data="trangHienTai" v-loading="dangTai"
              border stripe size="small" class="w-full">
      <el-table-column label="STT" width="52" align="center">
        <template #default="{ $index }">{{ (trang - 1) * moiTrang + $index + 1 }}</template>
      </el-table-column>

      <el-table-column prop="id" label="Mã App" width="96" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.id }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="app_name" label="Tên app" min-width="130" show-overflow-tooltip />

      <el-table-column prop="account_email" label="Tài khoản" min-width="150" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="text-xs font-semibold">{{ row.account_email || '—' }}</span>
        </template>
      </el-table-column>

      <!-- ⚠️ Mật khẩu che mặc định. Màn này mở trong văn phòng, có người
           đứng sau lưng. -->
      <el-table-column label="Mật khẩu" width="110">
        <template #default="{ row }">
          <div v-if="row.password" class="flex items-center gap-1 text-xs">
            <span class="font-mono">{{ hienMatKhau[row.id] ? row.password : '••••••••' }}</span>
            <el-button link type="info" size="small" class="!p-0 h-auto"
                       @click="hienMatKhau[row.id] = !hienMatKhau[row.id]">
              <el-icon :size="10"><component :is="hienMatKhau[row.id] ? Hide : View" /></el-icon>
            </el-button>
          </div>
          <span v-else class="text-gray-400">—</span>
        </template>
      </el-table-column>

      <el-table-column prop="platform" label="Nền tảng" width="94" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.platform" size="small" effect="plain">{{ row.platform }}</el-tag>
          <span v-else class="text-gray-400">—</span>
        </template>
      </el-table-column>

      <el-table-column prop="login_method" label="Đăng nhập bằng" width="120" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="text-xs">{{ row.login_method || '—' }}</span>
        </template>
      </el-table-column>

      <el-table-column label="2 lớp" width="80" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.two_factor === 'Có'" size="small" type="success" effect="plain">Có</el-tag>
          <el-tag v-else-if="row.two_factor === 'Không'" size="small" type="info" effect="plain">Không</el-tag>
          <span v-else class="text-gray-400">—</span>
        </template>
      </el-table-column>

      <!-- Số máy đang dùng / giới hạn -->
      <el-table-column label="Máy dùng" width="96" align="center">
        <template #default="{ row }">
          <span class="font-mono text-xs" :class="lopSoMay(row)">{{ chuSoMay(row) }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="holder" label="Người giữ" width="116" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="text-xs">{{ row.holder || '—' }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="monthly_fee" label="Phí/tháng" width="104" align="right">
        <template #default="{ row }">
          <span class="font-mono text-xs">{{ tien(row.monthly_fee) }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="renewal_date" label="Ngày gia hạn" width="86" align="center">
        <template #default="{ row }">
          <div v-if="row.renewal_date" class="font-mono text-xs leading-tight">
            <div class="whitespace-nowrap">{{ ngayThang(row.renewal_date) }}</div>
            <div class="whitespace-nowrap">{{ namCua(row.renewal_date) }}</div>
          </div>
          <span v-else class="text-gray-400">—</span>
        </template>
      </el-table-column>

      <el-table-column prop="status" label="Trạng thái" width="104" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="mauTrangThai(row.status)" effect="dark" class="font-bold">
            {{ chuTrangThai(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="notes" label="Ghi chú" min-width="130" show-overflow-tooltip />

      <el-table-column label="Thao tác" width="60" align="center">
        <template #default="{ row }">
          <el-dropdown trigger="click" @command="(c: string) => chonLenh(c, row)">
            <el-button link><el-icon><MoreFilled /></el-icon></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="sua">Chỉnh sửa</el-dropdown-item>
                <el-dropdown-item command="gan">Gán thiết bị</el-dropdown-item>
                <el-dropdown-item command="xoa" divided class="!text-red-500">Xóa</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <!-- ══════════════════ THẺ — MÀN HẸP ══════════════════ -->
    <div v-if="hienThe" v-loading="dangTai" class="flex flex-col gap-3">
      <div v-for="row in trangHienTai" :key="row.id"
           class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
        <div class="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
          <div class="min-w-0 break-words">
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.id }}</span>
            <span class="ml-2 font-semibold text-gray-800 dark:text-gray-100">{{ row.app_name }}</span>
          </div>
          <el-dropdown trigger="click" @command="(c: string) => chonLenh(c, row)">
            <el-button link><el-icon><MoreFilled /></el-icon></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="sua">Chỉnh sửa</el-dropdown-item>
                <el-dropdown-item command="gan">Gán thiết bị</el-dropdown-item>
                <el-dropdown-item command="xoa" divided class="!text-red-500">Xóa</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <div class="flex flex-col gap-2 text-sm">
          <div class="flex justify-between gap-3">
            <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Tài khoản:</span>
            <span class="text-right break-words min-w-0 text-xs font-semibold">{{ row.account_email || '—' }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Mật khẩu:</span>
            <span class="text-right break-words min-w-0">
              <span v-if="row.password" class="inline-flex items-center gap-1 text-xs">
                <span class="font-mono">{{ hienMatKhau[row.id] ? row.password : '••••••••' }}</span>
                <el-button link type="info" size="small" class="!p-0 h-auto"
                           @click="hienMatKhau[row.id] = !hienMatKhau[row.id]">
                  <el-icon :size="10"><component :is="hienMatKhau[row.id] ? Hide : View" /></el-icon>
                </el-button>
              </span>
              <span v-else class="text-gray-400">—</span>
            </span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Nền tảng:</span>
            <span class="text-right break-words min-w-0 text-xs">{{ row.platform || '—' }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Đăng nhập bằng:</span>
            <span class="text-right break-words min-w-0 text-xs">{{ row.login_method || '—' }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Bảo mật 2 lớp:</span>
            <span class="text-right break-words min-w-0 text-xs">{{ row.two_factor || '—' }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Máy đang dùng:</span>
            <span class="text-right break-words min-w-0 font-mono text-xs" :class="lopSoMay(row)">
              {{ chuSoMay(row) }}
            </span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Người giữ:</span>
            <span class="text-right break-words min-w-0 text-xs">{{ row.holder || '—' }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Phí/tháng:</span>
            <span class="text-right break-words min-w-0 font-mono text-xs">{{ tien(row.monthly_fee) }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-gray-400 dark:text-gray-500 font-medium shrink-0">Trạng thái:</span>
            <span class="text-right break-words min-w-0">
              <el-tag size="small" :type="mauTrangThai(row.status)" effect="dark" class="font-bold">
                {{ chuTrangThai(row.status) }}
              </el-tag>
            </span>
          </div>
        </div>
      </div>

      <div v-if="!dangTai && trangHienTai.length === 0"
           class="text-center text-gray-400 py-8">
        Chưa có app nào. Bấm “Thêm App” để bắt đầu.
      </div>
    </div>

    <div class="mt-4 flex justify-end">
      <el-pagination v-model:current-page="trang" v-model:page-size="moiTrang"
                     :total="daLoc.length" :page-sizes="[10, 20, 50]"
                     layout="total, sizes, prev, pager, next" background />
    </div>

    <!-- ══════════════════ FORM THÊM / SỬA ══════════════════ -->
    <el-dialog v-model="hienForm" :title="dangSua ? 'Chỉnh sửa App' : 'Thêm App mới'"
               width="720px" align-center destroy-on-close>
      <el-form :model="form" label-position="top">
        <el-row :gutter="14">
          <el-col :xs="24" :sm="8">
            <el-form-item label="Mã App">
              <!-- ⚠️ Khoá khi sửa: `installed_apps.app_id` nối bằng CHUỖI
                   này, không phải khoá ngoại. Đổi mã là mọi liên kết
                   thiết bị thành mồ côi — cùng loại lỗi mã HĐ ở MỤC 426. -->
              <el-input v-model="form.id" :disabled="dangSua" placeholder="VD: APP001" />
              <span v-if="dangSua" class="text-xs text-gray-400">
                Không sửa được — đổi mã sẽ mất liên kết thiết bị.
              </span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="Tên app"><el-input v-model="form.app_name" placeholder="VD: Netflix" /></el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="Nền tảng">
              <el-select v-model="form.platform" style="width: 100%" clearable>
                <el-option label="Android" value="Android" />
                <el-option label="iOS" value="iOS" />
                <el-option label="Cả hai" value="Cả hai" />
                <el-option label="Web" value="Web" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12">
            <el-form-item label="Tên gói (package)"><el-input v-model="form.package_name" placeholder="com.netflix.mediaclient" /></el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="Phân loại dịch vụ"><el-input v-model="form.service_category" placeholder="VD: Giải trí, Công việc" /></el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12">
            <el-form-item label="Tài khoản đăng ký"><el-input v-model="form.account_email" /></el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="Mật khẩu"><el-input v-model="form.password" type="password" show-password /></el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12">
            <el-form-item label="Đăng nhập bằng">
              <el-select v-model="form.login_method" style="width: 100%" clearable allow-create filterable>
                <el-option label="Email" value="Email" />
                <el-option label="Số điện thoại" value="Số điện thoại" />
                <el-option label="Google" value="Google" />
                <el-option label="Apple" value="Apple" />
                <el-option label="Facebook" value="Facebook" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="Bảo mật 2 lớp">
              <el-select v-model="form.two_factor" style="width: 100%" clearable>
                <el-option label="Có" value="Có" />
                <el-option label="Không" value="Không" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="24">
            <el-form-item label="Mã 2 lớp về đâu">
              <el-input v-model="form.two_factor_note"
                        placeholder="VD: SMS về số 09xx, hoặc Google Authenticator trên máy DTK03" />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12">
            <el-form-item label="Email khôi phục"><el-input v-model="form.recovery_email" /></el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="SĐT khôi phục"><el-input v-model="form.recovery_phone" /></el-form-item>
          </el-col>

          <el-col :xs="24" :sm="8">
            <el-form-item label="Người giữ tài khoản"><el-input v-model="form.holder" /></el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="Gói dịch vụ"><el-input v-model="form.subscription_plan" placeholder="VD: Premium 4 màn hình" /></el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="Chu kỳ thanh toán">
              <el-select v-model="form.billing_cycle" style="width: 100%" clearable allow-create filterable>
                <el-option label="Hàng tháng" value="Hàng tháng" />
                <el-option label="Hàng quý" value="Hàng quý" />
                <el-option label="Hàng năm" value="Hàng năm" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="8">
            <el-form-item label="Phí/tháng (VNĐ)">
              <el-input-number v-model="form.monthly_fee" :min="0" :step="10000"
                               controls-position="right" style="width: 100%" />
              <!-- ⚠️ Số này CHỈ để xem, s68 chốt 31/08. Nó không cộng vào
                   báo cáo chi phí nào. Cột trong database là Integer chứ
                   không phải NUMERIC — muốn đưa vào sổ thì phải đổi kiểu
                   cột trước. -->
              <span class="text-xs text-gray-400">Chỉ ghi để xem, không vào sổ chi phí.</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="Giới hạn máy dùng chung">
              <el-input-number v-model="form.concurrent_limit" :min="0" :step="1"
                               controls-position="right" style="width: 100%" />
              <span class="text-xs text-gray-400">Của nhà cung cấp. Để 0 nếu không giới hạn.</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="Trạng thái">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="Đang dùng" value="active" />
                <el-option label="Tạm ngưng" value="paused" />
                <el-option label="Đã huỷ" value="cancelled" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="8">
            <el-form-item label="Ngày đăng ký">
              <el-date-picker v-model="form.registered_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="Ngày gia hạn">
              <el-date-picker v-model="form.renewal_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="Tài khoản trả phí">
              <el-select v-model="form.is_premium" style="width: 100%">
                <el-option label="Có trả phí" :value="1" />
                <el-option label="Miễn phí" :value="0" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="24">
            <el-form-item label="Ghi chú">
              <el-input v-model="form.notes" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="hienForm = false">Hủy</el-button>
        <el-button type="primary" :loading="dangLuu" @click="luuForm">Xác nhận</el-button>
      </template>
    </el-dialog>

    <!-- ══════════════════ GÁN THIẾT BỊ ══════════════════ -->
    <el-dialog v-model="hienGan" width="620px" align-center destroy-on-close>
      <template #header>
        <span class="font-bold">GÁN THIẾT BỊ CHO <span class="text-blue-600">{{ appDangGan?.app_name }}</span></span>
      </template>

      <div v-loading="dangTaiMay" class="space-y-3">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Tick những máy đang dùng tài khoản này. Một tài khoản dùng được nhiều máy.
        </p>

        <!-- ⚠️ Cảnh báo, KHÔNG chặn. `concurrent_limit` là giới hạn của
             nhà cung cấp, không phải luật công ty — chặn cứng là kế toán
             không ghi nổi thực tế đang có. -->
        <el-alert v-if="vuotGioiHan" type="warning" show-icon :closable="false"
                  :title="`Đang chọn ${dangChon.length} máy, vượt giới hạn ${appDangGan?.concurrent_limit} của nhà cung cấp.`"
                  description="Vẫn lưu được — đây chỉ là nhắc." />

        <el-input v-model="tuKhoaMay" placeholder="Tìm mã máy hoặc dòng máy..." clearable />

        <div class="max-h-[320px] overflow-auto border rounded-lg border-gray-200 dark:border-gray-700 p-2">
          <el-checkbox-group v-model="dangChon">
            <div v-for="may in mayDaLoc" :key="may.khoa" class="py-1">
              <el-checkbox :value="may.khoa">
                <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ may.device_id }}</span>
                <span class="ml-2 text-sm">{{ may.ten }}</span>
                <el-tag size="small" effect="plain" class="ml-2">{{ nhanLoai(may.device_type) }}</el-tag>
              </el-checkbox>
            </div>
          </el-checkbox-group>
          <div v-if="mayDaLoc.length === 0" class="text-center text-gray-400 py-6 text-sm">
            Không có thiết bị nào khớp.
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="hienGan = false">Hủy</el-button>
        <el-button type="primary" :loading="dangLuuGan" @click="luuGan">
          Lưu {{ dangChon.length }} máy
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MoreFilled, Plus, Refresh, View, Hide } from '@element-plus/icons-vue'
import { otherService } from '@/api/otherService'
import { dungManHep } from '@/composables/manHep'

const { hienBang, hienThe } = dungManHep()

const dsApp = ref<any[]>([])
const soMayTheoApp = reactive<Record<string, number>>({})
const dangTai = ref(false)
const tuKhoa = ref('')
const locTrangThai = ref('')
const trang = ref(1)
const moiTrang = ref(10)
const hienMatKhau = reactive<Record<string, boolean>>({})

const daLoc = computed(() => {
  const k = tuKhoa.value.trim().toLowerCase()
  return dsApp.value.filter((a) => {
    if (locTrangThai.value && a.status !== locTrangThai.value) return false
    if (!k) return true
    return [a.id, a.app_name, a.account_email, a.holder, a.service_category]
      .some((v) => String(v || '').toLowerCase().includes(k))
  })
})

const trangHienTai = computed(() => {
  const dau = (trang.value - 1) * moiTrang.value
  return daLoc.value.slice(dau, dau + moiTrang.value)
})

// ══════════════════════════════════════════════════════════════════════
// TẢI DANH SÁCH
//
// ⚠️ Số máy của từng app lấy bằng MỘT lời gọi lấy hết `installed_apps`
// rồi đếm tại chỗ — KHÔNG gọi một lần cho mỗi app. Ba mươi app là ba
// mươi lời gọi, đúng bẫy `HDG_131`.
// ══════════════════════════════════════════════════════════════════════
const taiDanhSach = async () => {
  dangTai.value = true
  try {
    const [apps, lienKet] = await Promise.all([
      otherService.getApplications(),
      otherService.getInstalledAppsByApp(''),
    ])
    dsApp.value = apps || []
    for (const k of Object.keys(soMayTheoApp)) delete soMayTheoApp[k]
    for (const d of (lienKet || [])) {
      soMayTheoApp[d.app_id] = (soMayTheoApp[d.app_id] || 0) + 1
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không tải được danh sách app.')
  } finally {
    dangTai.value = false
  }
}

onMounted(taiDanhSach)

// ══════════════════════════════════════════════════════════════════════
// FORM THÊM / SỬA
// ══════════════════════════════════════════════════════════════════════
const hienForm = ref(false)
const dangSua = ref(false)
const dangLuu = ref(false)

const formRong = () => ({
  id: '', app_name: '', package_name: '', service_category: '',
  account_email: '', password: '', subscription_plan: '',
  monthly_fee: 0, billing_cycle: '', concurrent_limit: 0,
  is_premium: 0, renewal_date: null as any, status: 'active',
  platform: '', login_method: '', two_factor: '', two_factor_note: '',
  recovery_email: '', recovery_phone: '', holder: '',
  registered_date: null as any, notes: '',
})

const form = reactive<any>(formRong())

const moThem = () => {
  Object.assign(form, formRong())
  dangSua.value = false
  hienForm.value = true
}

const moSua = (row: any) => {
  Object.assign(form, formRong(), row)
  dangSua.value = true
  hienForm.value = true
}

const luuForm = async () => {
  if (!form.id?.trim() || !form.app_name?.trim()) {
    ElMessage.warning('Phải có Mã App và Tên app.')
    return
  }
  dangLuu.value = true
  try {
    if (dangSua.value) {
      await otherService.updateApplications([{ ...form }])
      ElMessage.success('Đã cập nhật app.')
    } else {
      await otherService.addApplications([{ ...form }])
      ElMessage.success('Đã thêm app.')
    }
    hienForm.value = false
    await taiDanhSach()
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không lưu được.')
  } finally {
    dangLuu.value = false
  }
}

const xoaApp = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `Xoá app ${row.app_name} (${row.id})? Mọi liên kết thiết bị của app này cũng bị gỡ.`,
      'Xác nhận xoá', { type: 'warning', confirmButtonText: 'Xoá', cancelButtonText: 'Hủy' })
  } catch { return }
  try {
    await otherService.deleteApplications([row.id])
    ElMessage.success('Đã xoá.')
    await taiDanhSach()
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không xoá được.')
  }
}

// ══════════════════════════════════════════════════════════════════════
// GÁN NHIỀU THIẾT BỊ CHO MỘT APP
//
// s68: *"1 tài khoản app có thể sử dụng nhiều thiết bị."*
//
// 🔴 KHOÁ TICK LÀ `<loại>|<mã máy>`, KHÔNG PHẢI mã máy trần. Thiết bị
// nằm ở sáu bảng riêng, mỗi bảng khoá chính là chuỗi tự đặt — hai loại
// trùng mã thì tick một cái sẽ tick luôn cái kia.
// ══════════════════════════════════════════════════════════════════════
const hienGan = ref(false)
const dangTaiMay = ref(false)
const dangLuuGan = ref(false)
const appDangGan = ref<any>(null)
const dsMay = ref<any[]>([])
const dangChon = ref<string[]>([])
const tuKhoaMay = ref('')

const nhanLoai = (loai: string) => ({
  smartphone: 'Điện thoại', tablet: 'Máy tính bảng', laptop: 'Laptop',
  screen: 'Màn hình', camera: 'Camera', other: 'Khác',
}[loai] || loai)

const mayDaLoc = computed(() => {
  const k = tuKhoaMay.value.trim().toLowerCase()
  if (!k) return dsMay.value
  return dsMay.value.filter((m) =>
    String(m.device_id).toLowerCase().includes(k) ||
    String(m.ten).toLowerCase().includes(k))
})

const vuotGioiHan = computed(() => {
  const gh = Number(appDangGan.value?.concurrent_limit || 0)
  return gh > 0 && dangChon.value.length > gh
})

const moGan = async (row: any) => {
  appDangGan.value = row
  hienGan.value = true
  dangTaiMay.value = true
  tuKhoaMay.value = ''
  try {
    const [dt, mtb, lt, daGan] = await Promise.all([
      otherService.getSmartphones(),
      otherService.getTablets(),
      otherService.getLaptops(),
      otherService.getInstalledAppsByApp(row.id),
    ])
    const gom = (ds: any[], loai: string) => (ds || []).map((m) => ({
      khoa: `${loai}|${m.id}`,
      device_id: m.id,
      device_type: loai,
      ten: m.model_name || m.brand || '',
    }))
    dsMay.value = [...gom(dt, 'smartphone'), ...gom(mtb, 'tablet'), ...gom(lt, 'laptop')]
    // Dòng cũ có thể thiếu `device_type` (dữ liệu trước MỤC 436) — lùi về
    // "smartphone" đúng như `server_default` của migration.
    dangChon.value = (daGan || []).map(
      (d: any) => `${d.device_type || 'smartphone'}|${d.device_id}`)
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không tải được danh sách thiết bị.')
  } finally {
    dangTaiMay.value = false
  }
}

const luuGan = async () => {
  if (!appDangGan.value) return
  dangLuuGan.value = true
  try {
    const thietBi = dangChon.value.map((k) => {
      const [loai, ...phan] = k.split('|')
      return { device_id: phan.join('|'), device_type: loai }
    })
    const kq = await otherService.setDevicesOfApp(appDangGan.value.id, thietBi)
    ElMessage.success(`Đã lưu: thêm ${kq.them} máy, gỡ ${kq.go} máy.`)
    hienGan.value = false
    await taiDanhSach()
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không lưu được.')
  } finally {
    dangLuuGan.value = false
  }
}

const chonLenh = (lenh: string, row: any) => {
  if (lenh === 'sua') moSua(row)
  else if (lenh === 'gan') moGan(row)
  else if (lenh === 'xoa') xoaApp(row)
}

// ══════════════════════════════════════════════════════════════════════
// HIỂN THỊ
// ══════════════════════════════════════════════════════════════════════
const chuSoMay = (row: any) => {
  const dang = soMayTheoApp[row.id] || 0
  const gh = Number(row.concurrent_limit || 0)
  return gh > 0 ? `${dang}/${gh}` : String(dang)
}

const lopSoMay = (row: any) => {
  const gh = Number(row.concurrent_limit || 0)
  if (gh > 0 && (soMayTheoApp[row.id] || 0) > gh) {
    return 'text-amber-600 dark:text-amber-400 font-bold'
  }
  return 'text-gray-700 dark:text-gray-300'
}

const chuTrangThai = (tt: string) => ({
  active: 'Đang dùng', paused: 'Tạm ngưng', cancelled: 'Đã huỷ',
}[tt] || 'Chưa rõ')

const mauTrangThai = (tt: string) => ({
  active: 'success', paused: 'warning', cancelled: 'info',
}[tt] as any || 'info')

const tien = (v: any) => {
  const so = Number(v || 0)
  if (!so) return '—'
  return so.toLocaleString('vi-VN') + ' đ'
}

// Cùng cách tách ngày hai dòng với MỤC 433.
const ngayThang = (d: any) => {
  const p = String(d || '').split('-')
  return p.length >= 3 ? `${p[2]}/${p[1]}` : String(d || '')
}
const namCua = (d: any) => {
  const p = String(d || '').split('-')
  return p.length >= 3 ? p[0] : ''
}
</script>
