<!--
  MỤC 738 (04/11/2026) — TAB "NAS": TÌNH TRẠNG NAS DS423 + BOT NAS (CHỈ XEM).

  s68 04/11: "vẫn dùng 2 bot nas cũ và hiển thị quản lý bot cũng như quản lý thiết bị nas tình trạng nas
  chung vào dự án HDG và hiển thị lên web" ➜ chọn "giữ 2 bot".
  Số liệu: backend đọc file số đo mà bot NAS (@NasGgomoosin_Bot) tự ghi trên máy chủ
  (app/services/nas_trang_thai.py). Web không gọi NAS, không có nút thao tác: tắt máy / chặn IP / xoá
  file vẫn làm trên Telegram nhóm "Thiết Bị Synology", có luật 2 người duyệt của bot NAS.
  Tự tải lại mỗi 60 giây — bot NAS đo mỗi 2 phút, nhanh hơn cũng không có số mới.
-->
<template>
  <div class="h-full overflow-auto pr-1">
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <el-tag :type="TONG[tong]?.loai || 'info'" size="large" effect="dark">{{ TONG[tong]?.chu || 'Đang tải…' }}</el-tag>
      <span v-if="d?.co_du_lieu" class="text-sm text-gray-500 dark:text-gray-400">
        Xem lúc {{ gio(d.bay_gio) }}
      </span>
      <el-button size="small" :loading="dangTai" :icon="Refresh" @click="tai">Tải lại</el-button>
    </div>

    <el-alert v-if="loi" type="error" :closable="false" show-icon class="mb-4" :title="loi" />

    <el-alert v-if="d && !d.co_du_lieu" type="warning" :closable="false" show-icon class="mb-4"
              :title="d.ly_do">
      <template #default>
        <div class="text-xs">Đã tìm ở:</div>
        <div v-for="c in (d.cho_da_tim || [d.duong_dan])" :key="c" class="text-xs font-mono break-all">{{ c }}</div>
      </template>
    </el-alert>

    <template v-if="d?.co_du_lieu">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <!-- BOT NAS -->
        <el-card shadow="never">
          <template #header><b>🤖 Bot NAS</b> <span class="text-xs text-gray-500 dark:text-gray-400">@NasGgomoosin_Bot</span></template>
          <div class="flex items-center gap-2 mb-2">
            <el-tag :type="d.bot.song ? 'success' : 'danger'">{{ d.bot.song ? 'Đang chạy' : 'Đã dừng' }}</el-tag>
            <span class="text-sm">Lần ghi cuối: <b>{{ truoc(d.bot.lan_ghi_cuoi) }}</b></span>
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">{{ gio(d.bot.lan_ghi_cuoi) }} ·
            quá {{ d.bot.nguong_phut }} phút không ghi gì mới thì coi là dừng</div>
          <el-alert v-if="!d.bot.song" type="error" :closable="false" class="mt-3"
                    title="Trên máy chủ: mở thư mục NasGgomoosin\Synology ➜ bấm 1_TINH_TRANG_BOT.bat. Báo không chạy thì bấm 2_KHOI_DONG_LAI_BOT.bat." />
          <div v-if="d.tat_bao_den" class="text-sm mt-2">🔕 Đang tắt báo tới {{ gio(d.tat_bao_den) }}</div>
        </el-card>

        <!-- NAS -->
        <el-card shadow="never">
          <template #header><b>🗄 NAS DS423</b></template>
          <div class="flex items-center gap-2 mb-2">
            <!-- Bot NAS dừng thì số đo là của lần cuối bot còn chạy — không được nói "Liên lạc tốt". -->
            <el-tag :type="!d.bot.song ? 'info' : d.nas.mat_lien_lac ? 'danger' : 'success'">
              {{ !d.bot.song ? 'Không rõ — số liệu cũ' : d.nas.mat_lien_lac ? 'Mất liên lạc' : 'Liên lạc tốt' }}</el-tag>
            <span class="text-sm">Đo lần cuối: <b>{{ truoc(d.nas.lan_do_cuoi) }}</b></span>
          </div>
          <div v-if="d.nas.khoi_dong_luc" class="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Bật máy lúc {{ gio(d.nas.khoi_dong_luc) }}</div>
          <div class="grid grid-cols-2 gap-3">
            <div v-for="o in chiSo" :key="o.ten">
              <div class="text-xs text-gray-500 dark:text-gray-400">{{ o.ten }}</div>
              <div class="text-lg font-semibold">{{ o.gia_tri }}</div>
            </div>
          </div>
        </el-card>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <el-card shadow="never">
          <template #header><b>💾 Ổ lưu trữ</b></template>
          <div v-for="v in d.nas.o_luu" :key="v.ten" class="mb-3">
            <div class="flex justify-between text-sm mb-1">
              <span class="font-mono">{{ v.ten }}</span>
              <span>{{ v.phan_tram }}%<span v-if="v.da_dung_gb != null"> · đã dùng {{ gb(v.da_dung_gb) }}</span></span>
            </div>
            <el-progress :percentage="Math.min(100, v.phan_tram)" :status="v.phan_tram >= 90 ? 'exception' : v.phan_tram >= 80 ? 'warning' : ''" :show-text="false" />
          </div>
          <div v-if="!d.nas.o_luu.length" class="text-sm text-gray-500 dark:text-gray-400">Chưa có số đo.</div>
        </el-card>
        <el-card shadow="never">
          <template #header><b>🌡 Nhiệt độ ổ cứng</b></template>
          <div v-for="o in d.nas.o_dia" :key="o.ten" class="flex justify-between text-sm py-1">
            <span>{{ o.ten }}</span><b>{{ o.nhiet_do }} °C</b>
          </div>
          <div v-if="!d.nas.o_dia.length" class="text-sm text-gray-500 dark:text-gray-400">Chưa có số đo.</div>
        </el-card>
      </div>

      <el-card shadow="never" class="mb-4">
        <template #header><b>⚠️ Cảnh báo đang mở</b> ({{ d.canh_bao_dang_mo.length }})</template>
        <div v-if="!d.canh_bao_dang_mo.length" class="text-sm text-gray-500 dark:text-gray-400">Không có.</div>
        <div v-for="c in d.canh_bao_dang_mo" :key="c.khoa" class="mb-3">
          <div class="flex flex-wrap items-center gap-2 mb-1">
            <el-tag :type="MUC[c.muc] || 'info'" size="small">{{ c.muc }}</el-tag>
            <span class="text-xs text-gray-500 dark:text-gray-400">từ {{ gio(c.tu_luc) }}</span>
          </div>
          <div class="text-sm whitespace-pre-wrap break-words">{{ c.noi_dung || c.khoa }}</div>
        </div>
      </el-card>

      <el-card shadow="never" class="mb-4">
        <template #header><b>📜 Cảnh báo gần đây</b></template>
        <el-table :data="d.canh_bao_gan_day" size="small" empty-text="Chưa có">
          <el-table-column label="Lúc" width="150">
            <template #default="{ row }">{{ gio(row.luc) }}</template>
          </el-table-column>
          <el-table-column label="Mức" width="80">
            <template #default="{ row }"><el-tag :type="MUC[row.muc] || 'info'" size="small">{{ row.muc }}</el-tag></template>
          </el-table-column>
          <el-table-column label="Nội dung" min-width="240">
            <template #default="{ row }"><span class="whitespace-pre-wrap break-words">{{ row.noi_dung }}</span></template>
          </el-table-column>
        </el-table>
      </el-card>

      <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">
        Trang này chỉ xem. Tắt máy, chặn IP, xoá file… làm trên Telegram nhóm "Thiết Bị Synology".
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { otherService } from '@/api/otherService'

const d = ref<any>(null)
const loi = ref('')
const dangTai = ref(false)

type LoaiTag = 'primary' | 'success' | 'warning' | 'info' | 'danger'
const TONG: Record<string, { chu: string; loai: LoaiTag }> = {
  on: { chu: '✅ NAS ổn', loai: 'success' },
  canh_bao: { chu: '🟠 NAS có cảnh báo', loai: 'warning' },
  nguy_hiem: { chu: '🔴 NAS có cảnh báo nguy hiểm', loai: 'danger' },
  nas_mat: { chu: '🔴 Mất liên lạc NAS', loai: 'danger' },
  bot_dung: { chu: '🔴 Bot NAS đã dừng — số liệu có thể cũ', loai: 'danger' },
}
const MUC: Record<string, LoaiTag> = { CRIT: 'danger', WARN: 'warning', INFO: 'info' }

const tong = computed(() => d.value?.co_du_lieu ? d.value.tong : (d.value ? 'bot_dung' : ''))

const gio = (s?: number | null) => s ? new Date(s * 1000).toLocaleString('vi-VN') : '—'
const truoc = (s?: number | null) => {
  if (!s || !d.value?.bay_gio) return 'chưa có'
  const p = Math.max(0, Math.round((d.value.bay_gio - s) / 60))
  if (p < 1) return 'vừa xong'
  if (p < 60) return `${p} phút trước`
  if (p < 48 * 60) return `${Math.floor(p / 60)} giờ ${p % 60} phút trước`
  return `${Math.floor(p / 1440)} ngày trước`
}
const gb = (x: number) => x >= 1024 ? `${(x / 1024).toFixed(2)} TB` : `${x} GB`
const so = (o: any, donVi: string) => o ? `${o.gia_tri}${donVi}` : '—'

const chiSo = computed(() => {
  const n = d.value?.nas || {}
  const ds = [
    { ten: 'CPU', gia_tri: so(n.cpu_pct, '%') },
    { ten: 'RAM', gia_tri: so(n.mem_pct, '%') },
    { ten: 'Nhiệt độ máy', gia_tri: so(n.nhiet_do, ' °C') },
    { ten: 'Độ trễ mạng', gia_tri: so(n.do_tre_ms, ' ms') },
  ]
  if (n.ups_pin) ds.push({ ten: 'Pin UPS', gia_tri: so(n.ups_pin, '%') })
  return ds
})

async function tai() {
  dangTai.value = true
  try {
    d.value = await otherService.getNasTrangThai()
    loi.value = ''
  } catch (e: any) {
    loi.value = e?.message || 'Không tải được tình trạng NAS.'
  } finally {
    dangTai.value = false
  }
}

let hen: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  tai()
  hen = setInterval(tai, 60_000)
})
onBeforeUnmount(() => { if (hen) clearInterval(hen) })
</script>
