<!--
  MỤC 718 (29/10/2026) — G1. TRANG NỘI BỘ /dev/design-system: bày toàn bộ token + thành phần
  dùng chung để s68 duyệt bộ màu/chữ (đối chiếu ảnh `00_He_thong_thiet_ke`).

  🔴 Chỉ có khi chạy thử (`import.meta.env.DEV`) — router không đăng ký trang này ở bản
  build lên Cloudflare (xem router/index.ts). Số liệu trên trang là MINH HOẠ.
-->
<template>
  <AppShell
    :nav="nav" :bottom-nav="bottomNav" active-key="ds" :alerts="5"
    :breadcrumb="['Thiết kế', 'Hệ thống thiết kế']" @navigate="dangChon = $event.label"
  >
    <template #search>
      <el-input v-model="timNhanh" class="ds-search" placeholder="Tìm nhanh hộ dân, hợp đồng, lệnh…" />
    </template>
    <template #avatar><span class="ds-avatar">V</span></template>

    <PageHeader title="Hệ thống thiết kế HDG" subtitle="Một bộ quy tắc dùng cho mọi trang. Số liệu trên trang này là minh hoạ.">
      <template #actions>
        <SegmentedControl v-model="phong" :options="[{ label: 'Phông mới', value: 'moi' }, { label: 'Times New Roman (đang dùng)', value: 'cu' }]" />
      </template>
    </PageHeader>
    <p v-if="dangChon" class="ds-note">Vừa bấm menu: <b>{{ dangChon }}</b> (G1 chỉ là khung, chưa chuyển trang).</p>

    <div class="ds-grid" :class="{ 'ds-times': phong === 'cu' }">
      <!-- MÀU -->
      <section class="hdg-card ds-block">
        <div class="hdg-label">Xanh thương hiệu (lấy từ logo)</div>
        <div class="ds-swatches">
          <div v-for="s in xanh" :key="s.ten" class="ds-sw"><div class="ds-sw__c" :style="{ background: s.mau }" /><b>{{ s.ten }}</b><code>{{ s.mau }}</code></div>
        </div>
        <div class="hdg-label ds-mt">Vàng nhấn · nền ấm</div>
        <div class="ds-swatches">
          <div v-for="s in vang" :key="s.ten" class="ds-sw"><div class="ds-sw__c" :style="{ background: s.mau }" /><b>{{ s.ten }}</b><code>{{ s.mau }}</code></div>
        </div>
        <div class="hdg-label ds-mt">Trạng thái (chỉ 4 màu)</div>
        <div class="ds-swatches">
          <div v-for="s in trangThai" :key="s.ten" class="ds-sw"><div class="ds-sw__c" :style="{ background: s.mau }" /><b>{{ s.ten }}</b><code>{{ s.mau }}</code></div>
        </div>
        <p class="ds-small ds-mt">Chữ trạng thái dùng bản đậm hơn (đạt chuẩn dễ đọc AA): xanh #23704a · vàng #8a5c08 · đỏ #9e2f24 · lam #245d99.</p>
      </section>

      <!-- CHỮ -->
      <section class="hdg-card ds-block ds-type">
        <div class="hdg-label">Chữ — {{ phong === 'moi' ? 'Be Vietnam Pro + Source Serif 4' : 'Times New Roman (MỤC 349, đang dùng)' }}</div>
        <h1 class="ds-h1">Thông tin tổng thể</h1>
        <div class="ds-small">Tiêu đề trang · 31 đậm</div>
        <h2 class="ds-h2">Cân đối toàn công ty</h2>
        <div class="ds-small">Tiêu đề khối · 19</div>
        <p class="ds-body">Đặng Thị Kim Hằng — thu mua mủ nước 1.084,00 kg. Ứng tiền cuối mùa, khấu trừ, hụi, đối tác.</p>
        <div class="ds-small">Nội dung · 15 (tối thiểu 13)</div>
        <div class="ds-money"><MoneyText :value="21759894" /></div>
        <div class="ds-small">Số tiền · chấm nghìn, căn phải, đơn vị nhỏ hơn</div>
        <code class="ds-code">/dang_ky_lenh</code>
        <div class="ds-small">Mã, tên lệnh · mono</div>
        <div class="hdg-label ds-mt">Quy tắc</div>
        <div class="ds-rules">
          <div>① Một nút chính (xanh đặc) cho mỗi vùng</div>
          <div>② Trạng thái luôn là chấm + chữ, 4 màu</div>
          <div>③ Ngày dd/mm/yyyy · tiền 1.250.000 đ</div>
          <div>④ Bảng tối đa 8 cột, phần còn lại vào ngăn chi tiết</div>
          <div>⑤ Không chữ nhỏ hơn 13px, không !important</div>
        </div>
      </section>

      <!-- NÚT · Ô NHẬP · TRẠNG THÁI · THẺ · THÔNG BÁO -->
      <section class="hdg-card ds-block">
        <div class="hdg-label">Nút</div>
        <div class="ds-row">
          <el-button type="primary">+ Tạo hợp đồng mới</el-button>
          <el-button>⬇ Xuất Excel</el-button>
          <el-button link type="primary">Chỉnh sửa</el-button>
          <el-button type="danger" plain @click="hoiXoa = true">Xoá</el-button>
        </div>
        <div class="hdg-label ds-mt">Ô nhập</div>
        <div class="ds-row">
          <el-input v-model="o1" placeholder="Tìm tên khách thuê, mã HĐ…" style="flex: 1 1 200px" />
          <el-select v-model="o2" style="width: 150px"><el-option label="Tất cả" value="all" /><el-option label="Đang thuê" value="a" /></el-select>
        </div>
        <div class="ds-row ds-mt8">
          <FormField label="Họ tên" required style="flex: 1 1 160px"><el-input v-model="o3" /></FormField>
          <FormField label="Số tiền" error="Số tiền không hợp lệ" style="flex: 1 1 160px"><el-input v-model="o4" /></FormField>
        </div>
        <div class="hdg-label">Trạng thái</div>
        <div class="ds-row">
          <StatusPill tone="success">Đang thuê</StatusPill>
          <StatusPill tone="warning">Hết hạn</StatusPill>
          <StatusPill>Bản nháp</StatusPill>
          <StatusPill tone="danger">Nợ xấu</StatusPill>
          <StatusPill tone="info">Thu (khấu trừ)</StatusPill>
          <StatusPill tone="danger">Chi (ứng ra)</StatusPill>
        </div>
        <div class="hdg-label ds-mt">Thẻ số liệu</div>
        <div class="ds-kpis">
          <KpiCard label="Tổng đã ứng" :value="2000000" money hint="Bấm để xem lịch sử ›" clickable />
          <KpiCard label="Cần rà soát" :value="29" tone="gold" hint="lệnh chưa rõ khoá quyền" />
          <KpiCard label="Vốn ban đầu" hint="Không bịa số khi chưa có nguồn" />
        </div>
        <div class="hdg-label ds-mt">Thông báo</div>
        <el-alert type="info" :closable="false" show-icon title="Bạn đã được đăng xuất vì máy để không quá 8 tiếng. Vui lòng đăng nhập lại." />
        <el-alert class="ds-mt8" type="error" :closable="false" title="Số tiền ứng vượt quá hạn mức cho phép (249.238 đ)." />
      </section>
    </div>

    <!-- BẢNG + BỘ LỌC + NGĂN CHI TIẾT -->
    <h2 class="ds-section">Bảng, bộ lọc, ngăn chi tiết</h2>
    <FilterBar>
      <el-date-picker v-model="tuNgay" type="date" placeholder="Từ ngày" format="DD/MM/YYYY" value-format="YYYY-MM-DD" />
      <el-select v-model="loai" placeholder="Loại giao dịch"><el-option label="Tất cả" value="" /><el-option label="Thu" value="thu" /><el-option label="Chi" value="chi" /></el-select>
      <el-input v-model="tim" placeholder="Tìm kiếm…" />
      <template #actions><el-button type="primary">Lọc</el-button></template>
    </FilterBar>
    <DataTable :columns="cot" :rows="dongLoc" row-key="ma" clickable @row-click="moChiTiet">
      <template #cell-trang_thai="{ row }"><StatusPill :tone="row.tone">{{ row.trang_thai }}</StatusPill></template>
      <template #cell-chenh_lech="{ row }"><MoneyText :value="row.chenh_lech" signed :unit="''" /></template>
    </DataTable>

    <h2 class="ds-section">Biểu mẫu</h2>
    <div class="hdg-card ds-block">
      <FormSection title="Thông tin hộ dân">
        <FormField label="Mã hộ" required><el-input model-value="TN0123" /></FormField>
        <FormField label="Họ tên" required><el-input model-value="Đặng Thị Kim Hằng" /></FormField>
        <FormField label="Ghi chú" wide hint="Không bắt buộc"><el-input type="textarea" :rows="2" /></FormField>
      </FormSection>
      <FormSection title="Số dư hiện tại" readonly>
        <FormField label="Ứng cuối mùa"><MoneyText :value="12500000" /></FormField>
        <FormField label="Ứng trong tháng"><MoneyText :value="0" /></FormField>
      </FormSection>
      <EmptyState title="Chưa có lần ứng nào" description="Khi có phiếu ứng, danh sách hiện ở đây." icon="◌" />
    </div>

    <DetailDrawer v-model="moNgan" :title="dongChon?.ten || ''" :subtitle="dongChon ? `Mã ${dongChon.ma}` : ''">
      <template v-if="dongChon">
        <div class="ds-dl"><span>Trạng thái</span><StatusPill :tone="dongChon.tone">{{ dongChon.trang_thai }}</StatusPill></div>
        <div class="ds-dl"><span>Tài sản</span><MoneyText :value="dongChon.tai_san" /></div>
        <div class="ds-dl"><span>Công nợ</span><MoneyText :value="dongChon.cong_no" /></div>
        <div class="ds-dl"><span>Chênh lệch</span><MoneyText :value="dongChon.chenh_lech" signed /></div>
        <div class="ds-dl"><span>Cột phụ (ẩn khỏi bảng)</span><span>{{ dongChon.ghi_chu }}</span></div>
      </template>
      <template #footer><el-button @click="moNgan = false">Đóng</el-button><el-button type="primary">Chỉnh sửa</el-button></template>
    </DetailDrawer>

    <ConfirmDialog v-model="hoiXoa" title="Xoá hợp đồng HD-0042?" message="Xoá rồi không lấy lại được. Công nợ của khách thuê giữ nguyên." confirm-text="Xoá hợp đồng" danger @confirm="hoiXoa = false" />
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/be-vietnam-pro/700.css'
import '@fontsource/source-serif-4/600.css'
import '@fontsource/source-serif-4/700.css'
import '@/design/tokens.css'
import AppShell, { type KhoiMenu, type MucMenu } from '@/design/components/AppShell.vue'
import PageHeader from '@/design/components/PageHeader.vue'
import KpiCard from '@/design/components/KpiCard.vue'
import StatusPill from '@/design/components/StatusPill.vue'
import MoneyText from '@/design/components/MoneyText.vue'
import DataTable, { type CotBang } from '@/design/components/DataTable.vue'
import FilterBar from '@/design/components/FilterBar.vue'
import DetailDrawer from '@/design/components/DetailDrawer.vue'
import FormSection from '@/design/components/FormSection.vue'
import FormField from '@/design/components/FormField.vue'
import EmptyState from '@/design/components/EmptyState.vue'
import ConfirmDialog from '@/design/components/ConfirmDialog.vue'
import SegmentedControl from '@/design/components/SegmentedControl.vue'

const nav: KhoiMenu[] = [
  { items: [{ key: 'home', label: 'Trang chủ' }] },
  { title: 'Dự án của bạn', items: [
    { key: 'tn', label: 'Tiến Nga', color: '#2f6f43', hasChildren: true },
    { key: 'ggo', label: 'GGoMooSin', color: '#1f8a8a', hasChildren: true },
    { key: 'rental', label: 'Rental', color: '#2c6fb7', hasChildren: true },
    { key: 'credit', label: 'Credit', color: '#7a4fb5', hasChildren: true },
    { key: 'harvest', label: 'Thu hoạch', color: '#c9a24a', hasChildren: true },
    { key: 'hui', label: 'Hụi', color: '#b9382b', hasChildren: true },
    { key: 'other', label: 'Khác', color: '#68726a', hasChildren: true },
  ] },
  { title: 'Quản trị', items: [
    { key: 'tg', label: 'Nhóm Telegram' }, { key: 'log', label: 'Nhật ký hệ thống' },
    { key: 'auth', label: 'Phân quyền' }, { key: 'ds', label: 'Danh sách lệnh' },
  ] },
]
const bottomNav: MucMenu[] = [
  { key: 'home', label: 'Trang chủ', icon: '🏠' }, { key: 'tn', label: 'Dự án', icon: '▦' },
  { key: 'tg', label: 'Cảnh báo', icon: '🔔' }, { key: 'ds', label: 'Quản trị', icon: '⚙' },
]

const xanh = [
  { ten: '900', mau: '#143823' }, { ten: '800', mau: '#1f5130' }, { ten: '700 ★', mau: '#2f6f43' },
  { ten: '500', mau: '#4f9a69' }, { ten: '200', mau: '#cfe3d6' }, { ten: '100', mau: '#e7f1ea' },
]
const vang = [
  { ten: 'Vàng', mau: '#c9a24a' }, { ten: 'Vàng nhạt', mau: '#f7f0dc' }, { ten: 'Nền trang', mau: '#f4f3ee' },
  { ten: 'Thẻ', mau: '#ffffff' }, { ten: 'Viền', mau: '#e4e1d6' },
]
const trangThai = [
  { ten: 'Thành công', mau: '#2f8f5b' }, { ten: 'Cảnh báo', mau: '#b57a10' },
  { ten: 'Lỗi / âm', mau: '#b9382b' }, { ten: 'Thông tin', mau: '#2c6fb7' },
]

const phong = ref<'moi' | 'cu'>('moi')
const dangChon = ref('')
const timNhanh = ref('')
const o1 = ref(''); const o2 = ref('all'); const o3 = ref('Nguyễn Văn A'); const o4 = ref('12a')
const tuNgay = ref(''); const loai = ref(''); const tim = ref('')
const hoiXoa = ref(false)

const cot: CotBang[] = [
  { prop: 'ma', label: 'Mã', width: 110 },
  { prop: 'ten', label: 'Dự án', minWidth: 160 },
  { prop: 'trang_thai', label: 'Trạng thái', width: 150 },
  { prop: 'tai_san', label: 'Tài sản', money: true, minWidth: 140 },
  { prop: 'cong_no', label: 'Công nợ', money: true, minWidth: 140 },
  { prop: 'chenh_lech', label: 'Chênh lệch', align: 'right', minWidth: 140 },
]
type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'
const dong: { ma: string; ten: string; trang_thai: string; tone: Tone; tai_san: number; cong_no: number; chenh_lech: number; ghi_chu: string }[] = [
  { ma: 'TN', ten: 'Tiến Nga', trang_thai: 'Đang chạy', tone: 'success', tai_san: 1842500000, cong_no: 1126300000, chenh_lech: 716200000, ghi_chu: 'Minh hoạ' },
  { ma: 'RT', ten: 'Rental', trang_thai: 'Hết hạn 2 HĐ', tone: 'warning', tai_san: 3210000000, cong_no: 845000000, chenh_lech: 2365000000, ghi_chu: 'Minh hoạ' },
  { ma: 'CR', ten: 'Credit', trang_thai: 'Nợ xấu', tone: 'danger', tai_san: 960000000, cong_no: 1120400000, chenh_lech: -160400000, ghi_chu: 'Minh hoạ' },
]
const dongLoc = computed(() => dong.filter(d => !tim.value || d.ten.toLowerCase().includes(tim.value.toLowerCase())))
const moNgan = ref(false)
const dongChon = ref<(typeof dong)[number] | null>(null)
function moChiTiet(r: (typeof dong)[number]) { dongChon.value = r; moNgan.value = true }
</script>

<style scoped>
.ds-search { width: 340px; }
.ds-avatar { display: inline-grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: var(--hdg-green-800); color: #fff; font-weight: 700; }
.ds-note { color: var(--hdg-text-muted); margin: -8px 0 16px; }
.ds-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; align-items: start; }
.ds-block { padding: 22px 24px; }
.ds-swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 10px; margin-top: 10px; }
.ds-sw { display: flex; flex-direction: column; font-size: var(--hdg-fs-caption); }
.ds-sw__c { height: 52px; border-radius: 8px; border: 1px solid var(--hdg-border); margin-bottom: 6px; }
.ds-sw code { color: var(--hdg-text-muted); font-family: var(--hdg-font-mono); }
.ds-mt { margin-top: 20px; }
.ds-mt8 { margin-top: 8px; }
.ds-small { font-size: var(--hdg-fs-caption); color: var(--hdg-text-muted); }
.ds-h1 { margin: 10px 0 0; font-size: var(--hdg-fs-page-title); font-weight: 700; }
.ds-h2 { margin: 14px 0 0; font-size: var(--hdg-fs-block-title); font-weight: 700; }
.ds-body { margin: 14px 0 0; }
.ds-money { margin-top: 14px; font-family: var(--hdg-font-serif); font-size: 32px; font-weight: 700; color: var(--hdg-primary); }
.ds-money :deep(.hdg-num) { font-family: var(--hdg-font-serif); }
.ds-code { display: inline-block; margin-top: 14px; padding: 2px 8px; border-radius: 6px; background: var(--hdg-primary-soft); color: var(--hdg-primary); font-family: var(--hdg-font-mono); }
.ds-rules { margin-top: 8px; line-height: 1.9; }
.ds-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; align-items: flex-start; }
.ds-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-top: 10px; }
.ds-section { font-size: var(--hdg-fs-block-title); margin: 32px 0 14px; }
.ds-dl { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--hdg-border); }
.ds-dl > span:first-child { color: var(--hdg-text-muted); }
/* So sánh với phông s68 chốt 27/08 (MỤC 349) — chỉ đổi khối chữ mẫu */
.ds-times .ds-type, .ds-times .ds-type h1, .ds-times .ds-type h2, .ds-times .ds-money :deep(.hdg-num) { font-family: "Times New Roman", Times, serif; }
@media (max-width: 1279px) { .ds-grid { grid-template-columns: 1fr 1fr; } .ds-grid > :last-child { grid-column: 1 / -1; } }
@media (max-width: 767px) { .ds-grid { grid-template-columns: 1fr; } .ds-search { display: none; } .ds-block { padding: 18px 16px; } }
</style>
