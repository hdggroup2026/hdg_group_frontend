<!--
  MỤC 721 (30/10/2026) — TRANG "DANH SÁCH LỆNH" (PROMPT_01 phần A, gói G3).

  Rà soát bộ lệnh bot: dự án nào có lệnh nào, nhóm nào được gợi ý, ai được chạy.
  Dữ liệu: API MỤC 720 (/api/v1/danh-sach-lenh). Chỉ xem — trừ trạng thái rà soát.
  Dựng bằng hệ thống thiết kế G1 (src/design) — trang đầu tiên mặc giao diện mới.

  Khung: thanh trái riêng (Tổng quan · Dự án · Rà soát) như ảnh `danh_sach_lenh/01–05`.
  Thanh trên vẫn là Navigation.vue cũ — khung chung mới (AppShell) là gói G4.
  Chọn màn lưu vào `?xem=` trên địa chỉ: tải lại trang vẫn đứng đúng chỗ.
-->
<template>
  <div class="hdg-theme dsl">
    <!-- Thanh trái (máy tính) / hàng chip (điện thoại) -->
    <aside class="dsl-side">
      <div class="hdg-label dsl-side__sec">Danh sách lệnh</div>
      <button type="button" class="dsl-side__item" :class="{ 'is-active': xem === 'tong-quan' }" @click="chon('tong-quan')">
        <span class="dsl-side__ten">Tổng quan</span>
      </button>
      <div class="hdg-label dsl-side__sec">Dự án</div>
      <button
        v-for="d in tq?.du_an || []" :key="d.du_an" type="button"
        class="dsl-side__item" :class="{ 'is-active': xem === d.du_an }" @click="chon(d.du_an)"
      >
        <span class="dsl-side__dot" :style="{ background: mauDuAn(d.du_an) }" />
        <span class="dsl-side__ten">{{ tenHien(d.du_an) }}</span>
        <span class="dsl-side__so hdg-num">{{ d.so_lenh }}</span>
      </button>
      <div class="hdg-label dsl-side__sec">Rà soát</div>
      <button type="button" class="dsl-side__item" :class="{ 'is-active': xem === 'can-ra-soat' }" @click="chon('can-ra-soat')">
        <span class="dsl-side__ten">Cần rà soát</span>
        <span v-if="tq" class="dsl-side__so dsl-side__so--vang hdg-num">{{ tq.so_can_ra_soat }}</span>
      </button>
      <div v-if="tq" class="dsl-side__tien-do">
        Đã rà <b class="hdg-num">{{ tq.tien_do.da_ra }}/{{ tq.tien_do.tong }}</b>
        <el-progress :percentage="phanTram(tq.tien_do)" :show-text="false" :stroke-width="6" />
      </div>
      <p class="dsl-side__nguon">Nguồn: mã nguồn bot đang chạy (quét lúc khởi động) + số nhóm thật trong database.</p>
    </aside>

    <section class="dsl-main">
      <el-alert v-if="loi" type="error" :closable="false" show-icon :title="loi" class="dsl-loi">
        <el-button size="small" @click="tai">Thử lại</el-button>
      </el-alert>
      <div v-else-if="!tq" v-loading="true" class="dsl-cho" />
      <TongQuanLenh v-else-if="xem === 'tong-quan'" :tq="tq" @chon="chon" />
      <CanRaSoatLenh v-else-if="xem === 'can-ra-soat'" @chon="chon" />
      <DuAnLenh v-else :key="xem" :du-an="xem" :mau="mauDuAn(xem)" :ten-hien="tenHien(xem)" @da-luu="taiTongQuan" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/be-vietnam-pro/700.css'
import '@fontsource/source-serif-4/600.css'
import '@fontsource/source-serif-4/700.css'
import '@/design/tokens.css'
import { danhSachLenhService, type TongQuan } from '@/api/danhSachLenhService'
import TongQuanLenh from './TongQuanLenh.vue'
import DuAnLenh from './DuAnLenh.vue'
import CanRaSoatLenh from './CanRaSoatLenh.vue'
import { mauDuAn, tenHien } from './chung'

const route = useRoute()
const router = useRouter()
const tq = ref<TongQuan | null>(null)
const loi = ref('')

const xem = computed(() => String(route.query.xem || 'tong-quan'))
function chon(x: string) {
  router.push({ path: route.path, query: x === 'tong-quan' ? {} : { xem: x } })
}

function phanTram(t: { da_ra: number; tong: number }) {
  return t.tong ? Math.round((t.da_ra / t.tong) * 100) : 0
}

async function taiTongQuan() {
  tq.value = await danhSachLenhService.tongQuan()
}
async function tai() {
  loi.value = ''
  try {
    await taiTongQuan()
  } catch (e: any) {
    // Thường gặp nhất: máy chủ chưa chạy migration m720 hoặc chưa cập nhật code.
    loi.value = `Không đọc được danh sách lệnh: ${e?.message || e}`
  }
}
onMounted(tai)
</script>

<style scoped>
.dsl { display: grid; grid-template-columns: 268px minmax(0, 1fr); height: 100%; overflow: hidden; }
.dsl-side { background: var(--hdg-card); border-right: 1px solid var(--hdg-border); padding: 14px 12px; overflow-y: auto; display: flex; flex-direction: column; }
.dsl-side__sec { padding: 16px 10px 6px; }
.dsl-side__sec:first-child { padding-top: 4px; }
.dsl-side__item { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 40px; padding: 0 10px; border: 0; border-radius: var(--hdg-radius-control); background: transparent; color: var(--hdg-text); font: inherit; text-align: left; cursor: pointer; }
.dsl-side__item:hover { background: var(--hdg-row-alt); }
.dsl-side__item.is-active { background: var(--hdg-primary-soft); color: var(--hdg-primary); font-weight: 700; }
.dsl-side__dot { width: 9px; height: 9px; border-radius: 2px; flex: none; }
.dsl-side__ten { flex: 1; }
.dsl-side__so { min-width: 30px; padding: 1px 8px; border-radius: var(--hdg-radius-pill); border: 1px solid var(--hdg-border); font-size: var(--hdg-fs-caption); text-align: center; color: var(--hdg-text-muted); }
.dsl-side__so--vang { background: var(--hdg-gold-soft); color: var(--hdg-gold-text); border-color: transparent; }
.dsl-side__tien-do { padding: 10px; font-size: var(--hdg-fs-caption); color: var(--hdg-text-muted); }
.dsl-side__tien-do :deep(.el-progress) { margin-top: 6px; }
.dsl-side__nguon { margin-top: auto; padding: 14px 6px 0; border-top: 1px solid var(--hdg-border); font-size: var(--hdg-fs-caption); color: var(--hdg-text-muted); }
.dsl-main { overflow-y: auto; padding: 26px 32px 40px; min-width: 0; }
.dsl-cho { height: 300px; }
.dsl-loi { margin-bottom: 16px; }

/* Máy tính bảng / điện thoại: thanh trái thành hàng chip cuộn ngang ở trên */
@media (max-width: 1023px) {
  .dsl { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); }
  .dsl-side { flex-direction: row; align-items: center; gap: 6px; overflow-x: auto; overflow-y: hidden; padding: 8px 12px; border-right: 0; border-bottom: 1px solid var(--hdg-border); }
  .dsl-side__sec, .dsl-side__nguon, .dsl-side__tien-do { display: none; }
  .dsl-side__item { width: auto; flex: none; border: 1px solid var(--hdg-border); min-height: 40px; white-space: nowrap; }
  .dsl-main { padding: 18px 14px 32px; }
}
</style>
