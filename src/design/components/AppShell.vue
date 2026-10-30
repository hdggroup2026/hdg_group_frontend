<!--
  MỤC 718 (29/10/2026) — G1. KHUNG CHUNG: thanh trên 62px + thanh trái 268px (PROMPT_01 mục 4.5).

  ⚠️ G1 chỉ DỰNG khung để duyệt hình — CHƯA thay Navigation.vue / Dashboard.vue. Việc nối khung
  này vào web thật (thay các thanh menu riêng của từng dự án) là gói G4.
  Khung chỉ trình bày: nhận `nav` (đã lọc theo quyền từ bên ngoài) và phát `navigate`.
  Máy tính bảng (768–1279): thanh trái thu thành cột biểu tượng chữ cái đầu.
  Điện thoại (<768): thanh trái ẩn, thay bằng thanh dưới đáy `bottomNav` (tối đa 4 mục).
-->
<template>
  <!-- MỤC 722 — `.hdg-theme` chỉ bọc thanh trên/trái/dưới; vùng nội dung chỉ nhận khi `flush` tắt.
       VÌ SAO: trang dự án cũ nằm trong khung (flush) chưa được chuyển giao diện (gói G5) — để biến
       Element Plus đổi màu nút của chúng giữa chừng là nửa cũ nửa mới. -->
  <div class="hdg-shell" :class="[`hdg-shell--${mode}`, { 'hdg-shell--flush': flush }]">
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

    <aside v-if="mode !== 'mobile'" class="hdg-theme hdg-shell__side">
      <template v-for="(sec, si) in nav" :key="si">
        <div v-if="sec.title && mode === 'desktop'" class="hdg-label hdg-shell__sec">{{ sec.title }}</div>
        <template v-for="it in sec.items" :key="it.key">
          <button
            type="button"
            class="hdg-shell__item" :class="{ 'is-active': it.key === activeKey || (it.key === openKey && !it.children?.length) }"
            :title="it.label" @click="emit('navigate', it)"
          >
            <span v-if="it.color" class="hdg-shell__dot" :style="{ background: it.color }" />
            <span v-if="mode === 'desktop'" class="hdg-shell__label">{{ it.label }}</span>
            <span v-else class="hdg-shell__short">{{ it.label.slice(0, 2) }}</span>
            <span v-if="mode === 'desktop' && (it.hasChildren || it.children?.length)" class="hdg-shell__caret">{{ it.key === openKey ? '▾' : '▸' }}</span>
          </button>
          <!-- MỤC 722 — mục con của dự án đang mở (chỉ máy tính; máy tính bảng dùng hàng chip trên nội dung) -->
          <template v-if="mode === 'desktop' && it.key === openKey">
            <button
              v-for="c in it.children || []" :key="c.key" type="button"
              class="hdg-shell__item hdg-shell__item--con" :class="{ 'is-active': c.key === activeKey }"
              @click="emit('navigate', c)"
            >{{ c.label }}</button>
          </template>
        </template>
      </template>
    </aside>

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
import { computed } from 'vue'
import { useDark, useWindowSize } from '@vueuse/core'

export interface MucMenu {
  key: string
  label: string
  color?: string
  icon?: string
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
</script>

<style scoped>
.hdg-shell { background: var(--hdg-bg); min-height: 100vh; display: grid; grid-template-rows: var(--hdg-topbar-h) 1fr; grid-template-columns: var(--hdg-sidebar-w) minmax(0, 1fr); }
.hdg-shell--tablet { grid-template-columns: 64px minmax(0, 1fr); }
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
.hdg-shell__label { flex: 1; }
.hdg-shell__caret { color: var(--hdg-text-muted); font-size: 12px; }
.hdg-shell__short { font-weight: 700; }
.hdg-shell--tablet .hdg-shell__side { padding: 12px 8px; }
.hdg-shell--tablet .hdg-shell__item { justify-content: center; padding: 0; }
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
