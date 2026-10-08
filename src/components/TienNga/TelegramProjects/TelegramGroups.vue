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

              <!-- Owner — MỤC 682: lọc theo nick OWNER của nhóm (trước: username bất kỳ) -->
              <div class="flex items-center gap-2">
                <span class="whitespace-nowrap text-sm font-medium text-gray-770 dark:text-gray-300">Owner:</span>
                <el-input 
                  v-model="filters.username" 
                  placeholder="Nhập nick owner..." 
                  clearable 
                  class="custom-dark-input"
                  style="width: 160px"
                  @input="handleFilterInput"
                  @clear="handleFilterChange"
                />
              </div>

              <!-- Vai trò -->
              <div class="flex items-center gap-2">
                <span class="whitespace-nowrap text-sm font-medium text-gray-770 dark:text-gray-300">Group Role:</span>
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
              <!-- MỤC 682 — nút "Xóa thành viên" CHUYỂN vào hộp Chi tiết của
                   từng nhóm (bảng nay mỗi dòng là một NHÓM, không chọn người
                   ở đây được nữa). Nút vẫn ĐÁ NGƯỜI RA KHỎI NHÓM TELEGRAM THẬT. -->
            </div>
          </div>

          <!-- Table Container -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col flex-1 min-h-0">
            <!-- ══════════════════════════════════════════════════════════════
                 MỤC 682 (08/10/2026) — MỖI DÒNG MỘT NHÓM, CỘT OWNER

                 s68: "tôi chỉ quản lý nick nào là owner của nhóm thôi. để sai
                 nick owner thì chuyển owner để nick owner là tập trung" — chọn
                 "Mỗi dòng 1 nhóm". Bỏ: User ID, Username, Họ & tên, Vị trí,
                 Bot?, Nút cha, Trạng thái. Danh sách người của nhóm (kèm nút
                 xoá) xem trong "Chi tiết".

                 Dữ liệu: `get-telegram-group-owners` (máy chủ gom sẵn, KHÔNG cắt
                 1000 dòng như đường cũ — xem tienNgaService.getTelegramGroupOwners).

                 MỤC 398 — không cột ghim (`fixed`), giữ nguyên.
                 ══════════════════════════════════════════════════════════ -->
            <el-table v-if="hienBang" 
              v-loading="loading"
              :data="paginatedNhom" 
              style="width: 100%" 
              height="100%" 
              class="flex-1 bang-hai-dong"
            >
              <el-table-column label="STT" width="52" align="center">
                <template #default="{ $index }">
                  <span class="font-mono text-xs text-gray-500">{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
                </template>
              </el-table-column>

              <el-table-column label="Dự án" min-width="86">
                <template #default="{ row }">
                  <span class="font-bold text-gray-800 dark:text-gray-200">{{ getProjectName(row.project_id) }}</span>
                </template>
              </el-table-column>

              <el-table-column label="Chat ID" width="110">
                <template #default="{ row }">
                  <span class="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold select-all">{{ row.chat_id }}</span>
                </template>
              </el-table-column>

              <el-table-column label="Tên nhóm" min-width="180">
                <template #default="{ row }">
                  <span class="font-bold text-gray-855 dark:text-gray-100">{{ row.group_name || '—' }}</span>
                </template>
              </el-table-column>

              <!-- MỤC 682 — nick đang là OWNER của nhóm. Không có ➜ ghi rõ, KHÔNG
                   đoán lấy quản trị viên đầu tiên. -->
              <el-table-column label="Owner" min-width="150">
                <template #default="{ row }">
                  <span v-if="row.owner_username" class="font-bold text-amber-600">👑 @{{ row.owner_username }}</span>
                  <span v-else-if="row.owner_user_id" class="font-mono text-xs text-amber-600" :title="row.owner_full_name">👑 ID {{ row.owner_user_id }}</span>
                  <span v-else class="text-red-500 text-xs font-semibold">Chưa thấy owner</span>
                </template>
              </el-table-column>

              <el-table-column label="Loại nhóm" width="110">
                <template #default="{ row }">
                  <span class="text-xs text-gray-700 dark:text-gray-300 font-semibold">{{ row.custom_title || '—' }}</span>
                </template>
              </el-table-column>

              <el-table-column label="Group Role" width="96" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.role" :type="(row.role || '').toLowerCase() === 'main' ? 'danger' : 'primary'"
                          effect="light" class="font-bold" size="small">{{ row.role }}</el-tag>
                  <span v-else class="text-gray-400">—</span>
                </template>
              </el-table-column>

              <el-table-column label="Quản trị / Thành viên" width="120" align="center">
                <template #default="{ row }">
                  <span class="font-mono text-xs">{{ row.so_quan_tri }} / {{ row.so_thanh_vien }}</span>
                </template>
              </el-table-column>

              <el-table-column label="Ngày vào nhóm" width="108" align="center">
                <template #default="{ row }">
                  <span class="font-mono text-xs text-gray-500 dark:text-gray-400 font-semibold">{{ formatDate(row.first_seen_at) }}</span>
                </template>
              </el-table-column>

              <el-table-column label="Hoạt động cuối" width="108" align="center">
                <template #default="{ row }">
                  <span class="font-mono text-xs text-gray-500 dark:text-gray-400 font-semibold">{{ formatDate(row.last_seen_at) }}</span>
                </template>
              </el-table-column>

              <el-table-column label="Ghi nhận bởi" width="94">
                <template #default="{ row }">
                  <span class="text-xs text-gray-700 dark:text-gray-300 font-medium">{{ row.last_seen_by || '—' }}</span>
                </template>
              </el-table-column>

              <el-table-column label="Thao tác" width="76" align="center">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" class="font-bold" @click="handleOpenDetailDialog(row)">
                    Chi tiết
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- MỤC 398 — thẻ dọc cho màn hẹp. MỤC 682: cùng các trường với bảng. -->
            <div v-if="hienThe" v-loading="loading" class="flex-1 min-h-0 overflow-y-auto p-3">
              <div v-if="paginatedNhom.length > 0" class="grid grid-cols-1 gap-4">
                <div v-for="row in (paginatedNhom as any[])" :key="row.chat_id"
                     class="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-sm">
                  <div class="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
                    <div class="min-w-0 break-words">
                      <div class="font-bold text-gray-800 dark:text-gray-100">{{ row.group_name || '—' }}</div>
                      <div class="text-xs text-gray-500">{{ getProjectName(row.project_id) }}</div>
                    </div>
                    <el-button link type="primary" size="small" class="font-bold shrink-0" @click="handleOpenDetailDialog(row)">Chi tiết</el-button>
                  </div>
                  <div class="space-y-2 text-sm text-left">
                    <div class="flex justify-between gap-3"><span class="text-gray-400 font-medium shrink-0">Owner:</span>
                      <span class="text-right break-words min-w-0">
                        <span v-if="row.owner_username" class="font-bold text-amber-600">👑 @{{ row.owner_username }}</span>
                        <span v-else-if="row.owner_user_id" class="font-mono text-xs text-amber-600">👑 ID {{ row.owner_user_id }}</span>
                        <span v-else class="text-red-500 text-xs font-semibold">Chưa thấy owner</span>
                      </span></div>
                    <div class="flex justify-between gap-3"><span class="text-gray-400 font-medium shrink-0">Chat ID:</span>
                      <span class="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold select-all break-all">{{ row.chat_id }}</span></div>
                    <div class="flex justify-between gap-3"><span class="text-gray-400 font-medium shrink-0">Loại nhóm:</span>
                      <span class="text-xs font-semibold">{{ row.custom_title || '—' }}</span></div>
                    <div class="flex justify-between gap-3"><span class="text-gray-400 font-medium shrink-0">Group Role:</span>
                      <span class="text-xs font-semibold">{{ row.role || '—' }}</span></div>
                    <div class="flex justify-between gap-3"><span class="text-gray-400 font-medium shrink-0">Quản trị / Thành viên:</span>
                      <span class="font-mono text-xs">{{ row.so_quan_tri }} / {{ row.so_thanh_vien }}</span></div>
                    <div class="flex justify-between gap-3"><span class="text-gray-400 font-medium shrink-0">Hoạt động cuối:</span>
                      <span class="font-mono text-xs">{{ formatDate(row.last_seen_at) }}</span></div>
                  </div>
                </div>
              </div>
              <div v-else class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                <p class="text-base font-medium">Không có nhóm nào khớp bộ lọc</p>
              </div>
            </div>

            <!-- Pagination -->
            <div class="mt-auto shrink-0 p-4 flex justify-end border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :background="true"
                layout="total, sizes, prev, pager, next, jumper"
                :total="nhom.length"
              />
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- ══ MỤC 682 — HỘP CHI TIẾT NHÓM: danh sách người + nút XOÁ (chuyển từ thanh lọc vào đây) ══ -->
    <el-dialog
      v-model="detailDialogVisible"
      title="CHI TIẾT NHÓM TELEGRAM"
      width="820px"
      destroy-on-close
      align-center
      class="custom-dark-dialog"
    >
      <div v-if="nhomChon" class="px-2 space-y-4 max-h-[65vh] overflow-y-auto text-left">
        <div class="pb-3 border-b border-gray-100 dark:border-gray-700">
          <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">{{ nhomChon.group_name || '—' }}</h3>
          <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
            <span>Dự án: <strong>{{ getProjectName(nhomChon.project_id) }}</strong></span>
            <span>Chat ID: <strong class="font-mono text-blue-600 select-all">{{ nhomChon.chat_id }}</strong></span>
            <span>Group Role: <strong>{{ nhomChon.role || '—' }}</strong></span>
            <span>Loại nhóm: <strong>{{ nhomChon.custom_title || '—' }}</strong></span>
            <span>Owner: <strong class="text-amber-600">{{ nhomChon.owner_username ? '@' + nhomChon.owner_username : (nhomChon.owner_user_id || 'chưa thấy') }}</strong></span>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-gray-600 dark:text-gray-300">
            {{ thanhVienNhom.length }} người trong nhóm (lần /syncchat gần nhất)
          </span>
          <el-button
            type="danger"
            size="small"
            @click="handleDeleteSelectedMembers"
            :loading="deleting"
            :disabled="selectedMembers.length === 0"
          >
            <el-icon class="mr-1"><Delete /></el-icon>
            Xóa khỏi nhóm Telegram {{ selectedMembers.length > 0 ? `(${selectedMembers.length})` : '' }}
          </el-button>
        </div>

        <!-- Owner KHÔNG tick được: Telegram không cho đá chủ nhóm, tick rồi
             chỉ nhận về lỗi. -->
        <el-table :data="thanhVienNhom" v-loading="dangTaiTV" size="small" max-height="360"
                  @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="44" :selectable="(r: any) => (r.member_status || '').toUpperCase() !== 'OWNER'" />
          <el-table-column label="Username" min-width="150">
            <template #default="{ row }">
              <span v-if="row.user_name" class="font-bold" :class="(row.member_status || '').toUpperCase() === 'OWNER' ? 'text-amber-600' : 'text-blue-500'">@{{ row.user_name }}</span>
              <span v-else class="text-gray-400">—</span>
            </template>
          </el-table-column>
          <el-table-column label="Họ & tên" prop="full_name" min-width="130" />
          <el-table-column label="Vị trí" width="120">
            <template #default="{ row }">{{ tenViTri(row.slot_name) }}</template>
          </el-table-column>
          <el-table-column label="User ID" prop="user_id" width="120">
            <template #default="{ row }"><span class="font-mono text-xs select-all">{{ row.user_id }}</span></template>
          </el-table-column>
        </el-table>
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
import { refTabBenVung } from '@/composables/tabBenVung'  // MỤC 423
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
const activeTab = refTabBenVung('tienga/telegram-groups', 'info')  // MỤC 423
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
// MỤC 682 — bảng mỗi dòng một NHÓM; hộp Chi tiết giữ danh sách người của nhóm
const nhom = ref<any[]>([])
const nhomChon = ref<any | null>(null)
const thanhVienNhom = ref<Member[]>([])
const dangTaiTV = ref(false)

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

// MỤC 681 — owner ➜ 👑 Chủ nhóm · admin_01 ➜ Quản trị 01 · member_05 ➜ Thành viên 05.
// Giá trị lạ (không theo mẫu) in nguyên văn — đoán sai còn tệ hơn in thô.
const tenViTri = (slot?: string | null) => {
  if (!slot) return '—'
  if (slot === 'owner') return '👑 Chủ nhóm'
  const m = /^(admin|member)_(\d+)$/.exec(slot)
  if (!m) return slot
  return (m[1] === 'admin' ? 'Quản trị ' : 'Thành viên ') + m[2]
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
    // MỤC 682 — mỗi nhóm một dòng (máy chủ gom, không cắt 1000 dòng).
    // Ô lọc "Owner" dùng lại `filters.username` cho gọn — nay lọc theo nick OWNER.
    nhom.value = await tienNgaService.getTelegramGroupOwners({
      project_id: filters.project_id || undefined,
      chat_id: filters.chat_id || undefined,
      owner: filters.username || undefined,
      role: filters.role || undefined
    })
  } catch (error: any) {
    console.error(error)
    ElMessage.error(error.message || 'Lỗi khi tải danh sách thành viên')
  } finally {
    loading.value = false
  }
}

// Computed paginated members
const paginatedNhom = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return nhom.value.slice(start, start + pageSize.value)
})

// Danh sách người của MỘT nhóm — lọc theo chat_id nên một nhóm không bao giờ
// chạm ngưỡng 1000 dòng của đường cũ.
const taiThanhVienNhom = async () => {
  if (!nhomChon.value) return
  dangTaiTV.value = true
  try {
    thanhVienNhom.value = await tienNgaService.getTelegramProjectMembers({ chat_id: nhomChon.value.chat_id })
  } catch (error: any) {
    ElMessage.error(error.message || 'Lỗi khi tải người trong nhóm')
    thanhVienNhom.value = []
  } finally {
    dangTaiTV.value = false
  }
}

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
    await taiThanhVienNhom()   // MỤC 682 — làm mới danh sách trong hộp Chi tiết
  } catch (error: any) {
    console.error('Lỗi khi xóa thành viên:', error)
    ElMessage.error(error.message || 'Lỗi khi thực hiện xóa thành viên!')
  } finally {
    deleting.value = false
  }
}

// Action Open Detail Dialog
const handleOpenDetailDialog = (row: any) => {
  // MỤC 682 — row nay là một NHÓM
  nhomChon.value = row
  selectedMembers.value = []
  thanhVienNhom.value = []
  detailDialogVisible.value = true
  taiThanhVienNhom()
}

onMounted(async () => {
  await fetchProjects()
  await fetchMembers()
})
</script>

<style scoped>
/* MỤC 680 (08/10/2026) — ô bảng xuống tối đa 2 dòng thay vì 1 dòng "…".
   Mã số dài không có khoảng trắng (Chat ID, User ID) thì gãy giữa chữ số —
   Element Plus vốn đặt `word-break: break-all` cho ô, giữ nguyên. */
.bang-hai-dong :deep(.el-table__body .cell),
.bang-hai-dong :deep(.el-table__header .cell) {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: normal;
  /* MỤC 681 — ngày "29/08/2026 14:05" gãy giữa năm ("29/08/2" / "026") vì
     `break-all`. Nay gãy ở KHOẢNG TRẮNG trước; mã số dài không có khoảng
     trắng (Chat ID) vẫn gãy được nhờ `anywhere`. */
  word-break: normal;
  overflow-wrap: anywhere;
}
/* MỤC 681 — s68: "tất cả header đều cho double line để không bị mất nội dung" */
/* ⚠️ `!important` có chủ ý: Element Plus đặt `white-space: nowrap` +
   `display: flow-root` cho ô tiêu đề bằng bộ chọn mạnh hơn — đo trên Mac
   08/10: không có !important thì tiêu đề VẪN một dòng, cắt "Vị trí trong n". */
.bang-hai-dong :deep(.el-table__header .cell) {
  display: -webkit-box !important;
  white-space: normal !important;
  text-overflow: clip;
  line-height: 1.25;
}

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
