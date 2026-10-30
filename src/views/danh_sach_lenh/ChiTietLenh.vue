<!--
  MỤC 721 (30/10/2026) — chi tiết một lệnh (cột phải ảnh 02): mô tả, khoá quyền, lưới nhóm
  nhận gợi ý, nơi khai báo, trạng thái rà soát + ghi chú.
  Dùng chung cho cột phải (màn rộng) và ngăn trượt (màn hẹp).
-->
<template>
  <div class="ct">
    <div v-if="!anTieuDe" class="ct-dau">
      <div>
        <div class="hdg-label">Chi tiết lệnh</div>
        <code class="ct-ma">/{{ lenh.lenh }}</code>
      </div>
      <el-button text circle aria-label="Đóng" @click="emit('dong')">✕</el-button>
    </div>
    <StatusPill :tone="lenh.loai === 'Menu' ? 'success' : lenh.loai === 'Reply' ? 'warning' : 'neutral'">{{ lenh.loai }}</StatusPill>
    <span v-if="lenh.loai === 'Reply'" class="ct-nho"> (suy ra từ chữ "reply" trong mô tả)</span>

    <div class="hdg-label ct-sec">Mô tả</div>
    <div>{{ lenh.mo_ta }}</div>

    <div class="hdg-label ct-sec">Khoá quyền</div>
    <div v-if="lenh.khoa">{{ chuKhoa(lenh.khoa) }}</div>
    <template v-else>
      <StatusPill tone="warning">chưa rõ</StatusPill> <span>không có dòng khoá quyền</span>
      <p class="ct-nho">Đọc từ dòng <code>@require_user_type</code> gắn trên hàm lệnh. "Chưa rõ" nghĩa là lệnh có thể tự kiểm quyền bên trong hàm, hoặc ai trong nhóm cũng chạy được. Phải đọc hàm mới biết.</p>
    </template>

    <div class="hdg-label ct-sec">Nhóm nhận gợi ý ({{ coCot.length }}/{{ cot.length }})</div>
    <div class="ct-luoi">
      <span v-for="c in cot" :key="c.khoa" class="ct-o" :class="{ 'is-co': coCot.includes(c) }" :title="c.nhan + ' · ' + c.soNhom + ' nhóm thật'">
        {{ coCot.includes(c) ? '✓ ' : '' }}{{ c.ten }}
      </span>
    </div>
    <div class="ct-nho ct-mt">Gửi tới <b>{{ lenh.so_nhom }}</b> / {{ tongNhom }} nhóm Telegram thật của dự án.</div>
    <details v-if="tenNhom.length" class="ct-nhom">
      <summary>Xem tên {{ tenNhom.length }} nhóm</summary>
      <div v-for="t in tenNhom.slice(0, 200)" :key="t">{{ t }}</div>
      <div v-if="tenNhom.length > 200" class="ct-nho">… và {{ tenNhom.length - 200 }} nhóm nữa</div>
    </details>

    <div class="hdg-label ct-sec">Nơi khai báo</div>
    <div class="ct-khai"><span>gợi ý ▸</span> <code>bot/utils/danh_muc_lenh.py</code></div>
    <div v-for="h in lenh.ham" :key="h.file + h.dong" class="ct-khai">
      <span>xử lý ▸</span> <code>{{ noiKhai(h) }}</code> <span class="ct-nho">{{ h.ham }}()</span>
      <div class="ct-deco"><div v-for="(dc, i) in h.decorators" :key="i">{{ dc }}</div></div>
    </div>
    <div v-if="!lenh.ham.length" class="ct-nho">Không tìm ra hàm xử lý trong bot/handlers. Lệnh được gợi ý nhưng có thể không chạy được.</div>

    <div class="hdg-label ct-sec">Trạng thái rà soát</div>
    <SegmentedControl v-model="trangThai" :options="[{ label: '○ Chưa rà', value: 'chua_ra' }, { label: '✓ Đã rà', value: 'da_ra' }, { label: '⚠ Cần sửa', value: 'can_sua' }]" />
    <el-input v-model="ghiChu" type="textarea" :rows="3" placeholder="Ghi chú khi rà soát…" class="ct-mt" />
    <div class="ct-luu">
      <span v-if="lenh.ra_soat?.nguoi_sua" class="ct-nho">Sửa lần cuối: {{ lenh.ra_soat.nguoi_sua }} · {{ ngay(lenh.ra_soat.thoi_diem) }}</span>
      <el-button type="primary" :loading="dangLuu" :disabled="!doi" @click="luu">Lưu rà soát</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import StatusPill from '@/design/components/StatusPill.vue'
import SegmentedControl from '@/design/components/SegmentedControl.vue'
import { danhSachLenhService, type Lenh, type RaSoat, type TrangThaiRaSoat } from '@/api/danhSachLenhService'
import { chuKhoa, noiKhai } from './chung'

export interface CotMaTran {
  khoa: string
  ten: string
  nhan: string
  duPhong: boolean
  chiSo: number[]
  soNhom: number
  nhom: string[]
}

const props = withDefaults(defineProps<{ lenh: Lenh; cot: CotMaTran[]; tongNhom: number; anTieuDe?: boolean }>(), { anTieuDe: false })
const emit = defineEmits<{ 'da-luu': [lenh: string, rs: RaSoat]; dong: [] }>()

const coCot = computed(() => props.cot.filter((c) => c.chiSo.some((i) => props.lenh.loai_nhom.includes(i))))
const tenNhom = computed(() => [...new Set(coCot.value.flatMap((c) => c.nhom))].sort())

const trangThai = ref<string>('chua_ra')
const ghiChu = ref('')
watch(() => props.lenh, (l) => {
  trangThai.value = l.ra_soat?.trang_thai || 'chua_ra'
  ghiChu.value = l.ra_soat?.ghi_chu || ''
}, { immediate: true })
const doi = computed(() => trangThai.value !== (props.lenh.ra_soat?.trang_thai || 'chua_ra')
  || ghiChu.value !== (props.lenh.ra_soat?.ghi_chu || ''))

const dangLuu = ref(false)
async function luu() {
  dangLuu.value = true
  try {
    const rs = await danhSachLenhService.luuRaSoat(props.lenh.lenh, trangThai.value as TrangThaiRaSoat, ghiChu.value)
    emit('da-luu', props.lenh.lenh, rs)
    ElMessage.success(`Đã lưu rà soát /${props.lenh.lenh}`)
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không lưu được')
  } finally {
    dangLuu.value = false
  }
}

function ngay(s?: string | null) {
  if (!s) return ''
  const d = new Date(s)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}
</script>

<style scoped>
.ct-dau { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.ct-ma { display: block; margin-top: 4px; font-family: var(--hdg-font-mono); font-size: 21px; font-weight: 700; color: var(--hdg-primary); word-break: break-all; }
.ct-sec { margin: 18px 0 6px; }
.ct-nho { font-size: var(--hdg-fs-caption); color: var(--hdg-text-muted); }
.ct-nho code, .ct-khai code { font-family: var(--hdg-font-mono); }
.ct-mt { margin-top: 8px; }
.ct-luoi { display: flex; flex-wrap: wrap; gap: 5px; }
.ct-o { padding: 2px 9px; border: 1px solid var(--hdg-border); border-radius: var(--hdg-radius-pill); font-size: var(--hdg-fs-caption); color: var(--hdg-text-muted); }
.ct-o.is-co { background: var(--hdg-primary-soft); border-color: transparent; color: var(--hdg-primary); font-weight: 700; }
.ct-nhom { margin-top: 6px; font-size: var(--hdg-fs-caption); max-height: 180px; overflow-y: auto; }
.ct-nhom summary { cursor: pointer; color: var(--hdg-primary); }
.ct-khai { font-size: var(--hdg-fs-caption); margin-top: 4px; }
.ct-khai > span:first-child { color: var(--hdg-text-muted); }
.ct-deco { margin: 3px 0 6px 14px; font-family: var(--hdg-font-mono); font-size: 12.5px; color: var(--hdg-text-muted); word-break: break-all; }
.ct-luu { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
</style>
