<!--
  MỤC 718 (29/10/2026) — G1. KHUNG CHUNG: thanh trên 62px + thanh trái 268px (PROMPT_01 mục 4.5).

  ⚠️ G1 chỉ DỰNG khung để duyệt hình — CHƯA thay Navigation.vue / Dashboard.vue. Việc nối khung
  này vào web thật (thay các thanh menu riêng của từng dự án) là gói G4.
  Khung chỉ trình bày: nhận `nav` (đã lọc theo quyền từ bên ngoài) và phát `navigate`.
  Máy tính bảng (768–1279): thanh trái thu thành cột biểu tượng chữ cái đầu.
  MỤC 731 (01/11/2026): bề rộng thanh trái nay do người dùng KÉO (design/rongMenu.ts); hẹp ⇒ chỉ biểu tượng.
  Điện thoại (<768): thanh trái ẩn, thay bằng thanh dưới đáy `bottomNav` (tối đa 4 mục).
-->
<template>
  <!-- MỤC 722 — `.hdg-theme` chỉ bọc thanh trên/trái/dưới; vùng nội dung chỉ nhận khi `flush` tắt.
       VÌ SAO: trang dự án cũ nằm trong khung (flush) chưa được chuyển giao diện (gói G5) — để biến
       Element Plus đổi màu nút của chúng giữa chừng là nửa cũ nửa mới.
       MỤC 724 (G5 lớp 1): KhungMoi.vue nay gắn `.hdg-theme.hdg-phu` lên <body> — trang cũ trong khung
       mới nhận giao diện mới qua design/lop-phu-cu.css; AppShell đứng riêng (trang /dev) vẫn như trên. -->
  <div class="hdg-shell" :class="[`hdg-shell--${mode}`, { 'hdg-shell--flush': flush }]" :style="mode !== 'mobile' ? { gridTemplateColumns: rong + 'px minmax(0, 1fr)' } : undefined">
    <header class="hdg-theme hdg-shell__top">
      <div class="hdg-shell__brand">
        <img src="/logo-hdg.png" alt="" class="hdg-shell__logo" />
        <span v-if="mode !== 'mobile'" class="hdg-shell__name">HDG Group</span>
      </div>
      <nav v-if="mode !== 'mobile'" class="hdg-shell__crumb" aria-label="breadcrumb">
        <template v-for="(b, i) in breadcrumb" :key="i">
          <span v-if="i" class="hdg-shell__crumb-sep">›</span>
          <span :class="{ 'is-last': i === breadcrumb.length - 1 }">{{ b }}</span>
        </template>
      </nav>
      <div class="hdg-shell__tools">
        <slot name="search" />
        <button type="button" class="hdg-shell__icon" title="Nhóm Telegram cần xử lý" @click="emit('bell')">
          🔔<span v-if="alerts" class="hdg-shell__badge">{{ alerts }}</span>
        </button>
        <button type="button" class="hdg-shell__icon" :title="isDark ? 'Giao diện sáng' : 'Giao diện tối'" @click="isDark = !isDark">
          {{ isDark ? '☀️' : '🌙' }}
        </button>
        <slot name="avatar" />
      </div>
    </header>

    <!-- MỤC 731 (01/11/2026) — thanh trái KÉO GIÃN được (src/design/rongMenu.ts). Hẹp hơn 160px ⇒ "thu gọn":
         chỉ còn BIỂU TƯỢNG (thay ô màu + 2 chữ cái đầu cũ), rê chuột hiện tên (el-tooltip, không chờ 1 giây như
         `title` của trình duyệt). Biểu tượng tô màu dự án — giữ nhận diện màu của ô màu cũ. -->
    <aside v-if="mode !== 'mobile'" class="hdg-theme hdg-shell__side" :class="{ 'is-thu-gon': thuGon }">
      <template v-for="(sec, si) in nav" :key="si">
        <div v-if="sec.title && !thuGon" class="hdg-label hdg-shell__sec">{{ sec.title }}</div>
        <div v-else-if="si && thuGon" class="hdg-shell__vach" />
        <template v-for="it in sec.items" :key="it.key">
          <el-tooltip :content="it.label" placement="right" :disabled="!thuGon" :show-after="80" :hide-after="0">
            <button
              type="button"
              class="hdg-shell__item" :class="{ 'is-active': it.key === activeKey || (it.key === openKey && !it.children?.length) }"
              :aria-label="it.label" @click="emit('navigate', it)"
            >
              <el-icon v-if="it.bieuTuong" class="hdg-shell__bt" :style="it.color ? { color: it.color } : undefined">
                <component :is="it.bieuTuong" />
              </el-icon>
              <span v-else class="hdg-shell__bt hdg-shell__bt--chu" :style="it.color ? { background: it.color } : undefined">{{ it.label.slice(0, 1) }}</span>
              <span v-if="!thuGon" class="hdg-shell__label">{{ it.label }}</span>
              <span v-if="!thuGon && (it.hasChildren || it.children?.length)" class="hdg-shell__caret">{{ it.key === openKey ? '▾' : '▸' }}</span>
            </button>
          </el-tooltip>
          <!-- MỤC 722 — mục con của dự án đang mở (khi thanh đủ rộng; thu gọn thì KhungMoi hiện hàng chip trên nội dung) -->
          <template v-if="!thuGon && it.key === openKey">
            <button
              v-for="c in it.children || []" :key="c.key" type="button"
              class="hdg-shell__item hdg-shell__item--con" :class="{ 'is-active': c.key === activeKey }"
              @click="emit('navigate', c)"
            >{{ c.label }}</button>
          </template>
        </template>
      </template>
      <el-tooltip :content="thuGon ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu'" placement="right" :show-after="80" :hide-after="0">
        <button type="button" class="hdg-shell__item hdg-shell__thu" :aria-label="thuGon ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu'" @click="doiThuGon">
          <el-icon class="hdg-shell__bt"><component :is="thuGon ? Expand : Fold" /></el-icon>
          <span v-if="!thuGon" class="hdg-shell__label">Thu gọn</span>
        </button>
      </el-tooltip>
    </aside>
    <!-- Tay kéo: mép phải thanh trái. Kéo để đổi bề rộng; bấm đúp = thu gọn / mở rộng. -->
    <div
      v-if="mode !== 'mobile'" class="hdg-shell__keo" :class="{ 'is-keo': dangKeo }"
      :style="{ left: rong - 3 + 'px' }" title="Kéo để đổi bề rộng · bấm đúp để thu gọn / mở rộng"
      @pointerdown="batDauKeo" @dblclick="doiThuGon"
    />

    <main class="hdg-shell__main" :class="{ 'hdg-theme': !flush }"><slot /></main>

    <nav v-if="mode === 'mobile'" class="hdg-theme hdg-shell__bottom">
      <button
        v-for="it in bottomNav.slice(0, 4)" :key="it.key" type="button"
        class="hdg-shell__bottom-item" :class="{ 'is-active': it.key === activeKey }"
        @click="emit('navigate', it)"
      >
        <span class="hdg-shell__bottom-icon">{{ it.icon || '•' }}</span>
        <span>{{ it.label }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import { useDark, useWindowSize } from '@vueuse/core'
import { Expand, Fold } from '@element-plus/icons-vue'
import { dungRongMenu } from '@/design/rongMenu'

export interface MucMenu {
  key: string
  label: string
  color?: string
  icon?: string
  /** MỤC 731 — biểu tượng ở thanh trái (Element Plus icon). Không có thì hiện chữ cái đầu trong ô màu. */
  bieuTuong?: Component
  hasChildren?: boolean
  /** MỤC 722 — đường dẫn khi bấm, và các mục con (bung ra khi dự án đang mở). */
  to?: string
  children?: MucMenu[]
}
export interface KhoiMenu { title?: string; items: MucMenu[] }

withDefaults(defineProps<{
  nav: KhoiMenu[]
  bottomNav?: MucMenu[]
  activeKey?: string
  /** Mục cha đang bung mục con (dự án đang mở). */
  openKey?: string
  breadcrumb?: string[]
  alerts?: number
  flush?: boolean
}>(), { bottomNav: () => [], activeKey: '', openKey: '', breadcrumb: () => [], alerts: 0 })
const emit = defineEmits<{ navigate: [item: MucMenu]; bell: [] }>()

// Cùng cấu hình useDark với các Index.vue đang chạy (lớp `dark` trên <html>) —
// bật/tắt ở đây thì trang cũ cũng đổi theo, không sinh ra hai công tắc lệch nhau.
const isDark = useDark({ selector: 'html', attribute: 'class', valueDark: 'dark', valueLight: '' })

const { width } = useWindowSize()
const mode = computed(() => (width.value < 768 ? 'mobile' : width.value < 1280 ? 'tablet' : 'desktop'))

// MỤC 731 — bề rộng thanh trái do người dùng kéo (rongMenu.ts). `mode` vẫn quyết điện thoại hay không.
const { rong, thuGon, datRong, doiThuGon } = dungRongMenu()
const dangKeo = ref(false)
function batDauKeo(e: PointerEvent) {
  if (e.button !== 0) return
  e.preventDefault()
  dangKeo.value = true
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'col-resize'
  const keo = (ev: PointerEvent) => datRong(ev.clientX)
  const tha = () => {
    dangKeo.value = false
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
    window.removeEventListener('pointermove', keo)
    window.removeEventListener('pointerup', tha)
  }
  window.addEventListener('pointermove', keo)
  window.addEventListener('pointerup', tha)
}
</script>

<style scoped>
.hdg-shell { background: var(--hdg-bg); min-height: 100vh; display: grid; grid-template-rows: var(--hdg-topbar-h) 1fr; grid-template-columns: var(--hdg-sidebar-w) minmax(0, 1fr); }
/* MỤC 731 — bề rộng cột trái nay đặt bằng style (rongMenu.ts); lớp tablet chỉ còn ý nghĩa lề. */
.hdg-shell--mobile { grid-template-columns: minmax(0, 1fr); grid-template-rows: 56px 1fr 64px; }
.hdg-shell__top { grid-column: 1 / -1; display: flex; align-items: center; gap: 20px; padding: 0 20px; background: var(--hdg-card); border-bottom: 1px solid var(--hdg-border); position: sticky; top: 0; z-index: 20; }
.hdg-shell__brand { display: flex; align-items: center; gap: 10px; }
.hdg-shell__logo { width: 38px; height: 38px; border-radius: 50%; object-fit: contain; }
.hdg-shell__name { font-family: var(--hdg-font-serif); font-size: 22px; font-weight: 700; color: var(--hdg-green-900); }
html.dark .hdg-shell__name { color: var(--hdg-primary); }
.hdg-shell__crumb { display: flex; gap: 6px; color: var(--hdg-text-muted); font-size: var(--hdg-fs-body); }
.hdg-shell__crumb .is-last { color: var(--hdg-text); font-weight: 700; }
.hdg-shell--mobile .hdg-shell__top { gap: 10px; padding: 0 14px; }
.hdg-shell__tools { margin-left: auto; display: flex; align-items: center; gap: 10px; }
.hdg-shell__icon { position: relative; width: 40px; height: 40px; border: 1px solid var(--hdg-border); border-radius: var(--hdg-radius-control); background: var(--hdg-card); cursor: pointer; font-size: 17px; }
.hdg-shell__badge { position: absolute; top: -6px; right: -6px; min-width: 18px; height: 18px; padding: 0 4px; border-radius: 9px; background: var(--hdg-danger); color: #fff; font-size: 11px; font-weight: 700; line-height: 18px; }
.hdg-shell__side { background: var(--hdg-card); border-right: 1px solid var(--hdg-border); padding: 14px 12px; overflow-y: auto; position: sticky; top: var(--hdg-topbar-h); height: calc(100vh - var(--hdg-topbar-h)); }
.hdg-shell__sec { padding: 16px 10px 6px; }
.hdg-shell__item { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 40px; padding: 0 10px; border: 0; border-radius: var(--hdg-radius-control); background: transparent; color: var(--hdg-text); font: inherit; text-align: left; cursor: pointer; }
.hdg-shell__item:hover { background: var(--hdg-row-alt); }
.hdg-shell__item.is-active { background: var(--hdg-primary-soft); color: var(--hdg-primary); font-weight: 700; }
.hdg-shell__item--con { min-height: 36px; padding-left: 38px; font-size: var(--hdg-fs-table); color: var(--hdg-text-muted); }
.hdg-shell__item--con.is-active { color: var(--hdg-primary); }
.hdg-shell__dot { width: 9px; height: 9px; border-radius: 2px; flex: none; }
/* MỤC 731 — biểu tượng thay ô màu; thu gọn thì canh giữa, chỉ còn biểu tượng. */
.hdg-shell__bt { flex: none; width: 20px; height: 20px; font-size: 18px; display: inline-flex; align-items: center; justify-content: center; color: var(--hdg-text-muted); }
.hdg-shell__bt--chu { border-radius: 6px; background: var(--hdg-text-muted); color: #fff; font-size: 12px; font-weight: 700; }
.hdg-shell__item.is-active .hdg-shell__bt:not(.hdg-shell__bt--chu) { filter: saturate(1.3); }
.hdg-shell__side.is-thu-gon { padding: 12px 8px; overflow-x: hidden; }
.hdg-shell__side.is-thu-gon .hdg-shell__item { justify-content: center; padding: 0; }
.hdg-shell__vach { height: 1px; margin: 10px 6px; background: var(--hdg-border); }
.hdg-shell__thu { margin-top: 14px; border-top: 1px solid var(--hdg-border); border-radius: 0; color: var(--hdg-text-muted); }
.hdg-shell__label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hdg-shell__keo { position: fixed; top: var(--hdg-topbar-h); bottom: 0; width: 6px; z-index: 25; cursor: col-resize; touch-action: none; }
.hdg-shell__keo:hover, .hdg-shell__keo.is-keo { background: var(--hdg-primary); opacity: .45; }
.hdg-shell__label { flex: 1; }
.hdg-shell__caret { color: var(--hdg-text-muted); font-size: 12px; }
.hdg-shell__short { font-weight: 700; }
.hdg-shell__main { padding: 26px 32px 40px; min-width: 0; }
/* MỤC 722 — `flush`: trang tự lo lề + cuộn (trang dự án cũ dùng h-full, el-splitter...). */
.hdg-shell.hdg-shell--flush .hdg-shell__main { padding: 0; height: calc(100vh - var(--hdg-topbar-h)); overflow: hidden; }
.hdg-shell--flush.hdg-shell--mobile .hdg-shell__main { height: calc(100vh - 56px - 64px); }
.hdg-shell--mobile .hdg-shell__main { padding: 16px 14px 24px; }
.hdg-shell__bottom { position: sticky; bottom: 0; display: grid; grid-template-columns: repeat(4, 1fr); background: var(--hdg-card); border-top: 1px solid var(--hdg-border); z-index: 20; }
.hdg-shell__bottom-item { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; min-height: 56px; border: 0; background: transparent; color: var(--hdg-text-muted); font: inherit; font-size: var(--hdg-fs-caption); cursor: pointer; }
.hdg-shell__bottom-item.is-active { color: var(--hdg-primary); font-weight: 700; }
.hdg-shell__bottom-icon { font-size: 19px; line-height: 1; }
</style>
