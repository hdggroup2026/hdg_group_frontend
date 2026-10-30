<!--
  MỤC 723 (30/10/2026) — MAP LIÊN KẾT: các khối của hệ thống nối dây với nhau + mỗi dự án nối ra
  lệnh Telegram của nó. s68 30/10: "vẽ map liên kết và các lệnh".

  Lệnh + số nhóm đọc TRỰC TIẾP từ API Danh sách lệnh (MỤC 720) — thêm lệnh mới là map tự có,
  không ai phải vẽ lại. Khối hạ tầng (máy chủ, database, ngrok…) là phần cố định, đối chiếu mã 30/10.
  Bấm một khối: sáng các đường nối với nó, mờ phần còn lại. Bấm một lệnh / dự án: mở trang
  Danh sách lệnh của dự án đó.
-->
<template>
  <div class="map">
    <div class="map-chu-giai">
      <span><i class="dg dg--web" /> Web</span>
      <span><i class="dg dg--tg" /> Telegram</span>
      <span><i class="dg dg--nen" /> Tự chạy / hạ tầng</span>
      <span class="map-goi-y">Bấm vào một khối để xem nó nối với đâu · bấm lệnh để mở Danh sách lệnh</span>
      <button v-if="chon" type="button" class="map-bo" @click="chon = ''">Bỏ chọn</button>
      <!-- MỤC 724 — s68 xem trên điện thoại 30/10: map khổ 1440px phải vuốt nhiều ⇒ nút thu vừa màn. -->
      <button type="button" class="map-bo" @click="vua = !vua">{{ vua ? 'Phóng to' : 'Vừa màn hình' }}</button>
    </div>
    <div v-if="loi" class="map-loi">{{ loi }}</div>
    <div class="map-cuon">
      <svg :viewBox="`0 0 ${W} ${H}`" :width="vua ? '100%' : W" :height="vua ? undefined : H" class="map-svg" role="img" aria-label="Map liên kết hệ thống HDG">
        <defs>
          <marker id="mui" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" class="mui" />
          </marker>
        </defs>

        <!-- vùng -->
        <g v-for="v in VUNG" :key="v.ten">
          <rect :x="v.x" :y="v.y" :width="v.w" :height="v.h" rx="16" class="vung" />
          <text :x="v.x + 16" :y="v.y + 24" class="vung-ten">{{ v.ten }}</text>
        </g>

        <!-- dây -->
        <g v-for="(d, i) in day" :key="'d' + i" :class="['day', `day--${d.loai}`, { 'is-sang': sang(d), 'is-mo': chon && !sang(d) }]">
          <path :d="duong(d)" fill="none" :marker-end="d.hai ? 'url(#mui)' : 'url(#mui)'" :marker-start="d.hai ? 'url(#mui)' : undefined" />
          <text v-if="d.nhan" :x="giua(d).x" :y="giua(d).y - 5" class="day-nhan" text-anchor="middle">{{ d.nhan }}</text>
        </g>

        <!-- khối -->
        <g v-for="n in khoi" :key="n.id" :class="['khoi', `khoi--${n.loai}`, { 'is-chon': chon === n.id, 'is-mo': chon && !lienQuan.has(n.id) }]"
           tabindex="0" role="button" :aria-label="n.ten" @click="bam(n)" @keydown.enter="bam(n)">
          <rect :x="n.x" :y="n.y" :width="n.w" :height="n.h" :rx="n.lenh ? 8 : 11" />
          <text :x="n.x + (n.lenh ? 10 : 12)" :y="n.y + (n.phu ? 20 : n.h / 2 + 5)" :class="n.lenh ? 'khoi-lenh' : 'khoi-ten'">{{ n.ten }}</text>
          <text v-if="n.phu" :x="n.x + 12" :y="n.y + 38" class="khoi-phu">{{ n.phu }}</text>
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { danhSachLenhService, type DuAnLenh, type TongQuan } from '@/api/danhSachLenhService'

interface Khoi { id: string; ten: string; phu?: string; x: number; y: number; w: number; h: number; loai: 'web' | 'tg' | 'nen' | 'lenh'; lenh?: string; duAn?: string }
interface Day { tu: string; den: string; nhan?: string; loai: 'web' | 'tg' | 'nen'; hai?: boolean; vongTrai?: boolean }

const router = useRouter()
const tq = ref<TongQuan | null>(null)
const duAn = ref<Record<string, DuAnLenh>>({})
const loi = ref('')
const chon = ref('')
// Màn hẹp (điện thoại, máy tính bảng) mở sẵn ở chế độ vừa màn; máy tính 1920 vẫn đủ khổ.
const vua = ref(typeof window !== 'undefined' && window.innerWidth < 1280)

onMounted(async () => {
  try {
    tq.value = await danhSachLenhService.tongQuan()
    const ds = await Promise.all(tq.value.du_an.map((d) => danhSachLenhService.duAn(d.du_an)))
    duAn.value = Object.fromEntries(ds.map((d) => [d.du_an, d]))
  } catch (e: any) {
    loi.value = `Không đọc được lệnh từ máy chủ (${e?.message || e}). Map vẫn hiện phần hạ tầng.`
  }
})

// ── Toạ độ cột ──
const C_NGUOI = 44, C_MAY = 300, C_TG = 760, C_LENH = 1110
const W = 1440

// Khối cố định (hạ tầng) — đối chiếu mã 30/10/2026, xem thẻ "Giải thích".
const CO_DINH: Khoi[] = [
  { id: 'nguoi', ten: 'Người dùng web', phu: 'Owner · Admin · kế toán', x: C_NGUOI, y: 70, w: 220, h: 52, loai: 'web' },
  { id: 'cf', ten: 'Cloudflare', phu: 'phát trang web (Vue)', x: C_NGUOI, y: 160, w: 220, h: 52, loai: 'web' },
  { id: 'ngrok', ten: 'ngrok', phu: 'đường hầm vào cổng 8000', x: C_NGUOI, y: 250, w: 220, h: 52, loai: 'web' },
  { id: 'sua', ten: 'Máy sửa (PC)', phu: 'DB bản sao · bot tắt', x: C_NGUOI, y: 380, w: 220, h: 52, loai: 'nen' },
  { id: 'gh', ten: 'GitHub', phu: '2 kho riêng tư', x: C_NGUOI, y: 470, w: 220, h: 52, loai: 'nen' },

  { id: 'api', ten: 'API cho web', phu: 'FastAPI · kiểm quyền', x: C_MAY + 20, y: 70, w: 190, h: 52, loai: 'web' },
  { id: 'bot', ten: 'Bot Telegram', phu: 'Pyrogram · lệnh, nút', x: C_MAY + 230, y: 70, w: 190, h: 52, loai: 'tg' },
  { id: 'job', ten: 'Việc tự chạy', phu: '37 việc theo giờ', x: C_MAY + 230, y: 160, w: 190, h: 52, loai: 'nen' },
  { id: 'db', ten: 'Database PostgreSQL 17', phu: '95 bảng · web + bot dùng chung', x: C_MAY + 20, y: 250, w: 400, h: 52, loai: 'nen' },
  { id: 'saoluu', ten: 'Sao lưu', phu: '2 nơi · giữ 30 bản', x: C_MAY + 20, y: 380, w: 190, h: 52, loai: 'nen' },
  { id: 'ai', ten: 'Vertex AI (Gemini)', phu: 'trợ lý /hoi', x: C_MAY + 230, y: 380, w: 190, h: 52, loai: 'nen' },
  { id: 'chrome', ten: 'Chromium ngầm', phu: 'vẽ ảnh báo cáo', x: C_MAY + 20, y: 470, w: 190, h: 52, loai: 'nen' },
  { id: 'excel', ten: 'File Excel / Word', phu: 'xuất sổ, bảng lương', x: C_MAY + 230, y: 470, w: 190, h: 52, loai: 'nen' },
  { id: 'doctin', ten: 'Tài khoản đọc tin', phu: '2 số · chỉ đọc', x: C_MAY + 120, y: 560, w: 200, h: 52, loai: 'tg' },
]

const DAY_CO_DINH: Day[] = [
  { tu: 'nguoi', den: 'cf', nhan: 'mở web', loai: 'web' },
  { tu: 'cf', den: 'ngrok', nhan: 'gọi dữ liệu', loai: 'web' },
  { tu: 'ngrok', den: 'api', nhan: 'HTTPS', loai: 'web' },
  { tu: 'api', den: 'db', nhan: 'đọc / ghi', loai: 'web', hai: true },
  { tu: 'bot', den: 'db', nhan: 'đọc / ghi', loai: 'tg', hai: true },
  { tu: 'job', den: 'db', nhan: 'đọc', loai: 'nen' },
  { tu: 'job', den: 'bot', nhan: 'gửi tin', loai: 'nen' },
  { tu: 'api', den: 'bot', nhan: 'báo sửa', loai: 'web' },
  { tu: 'db', den: 'saoluu', nhan: 'hẹn giờ', loai: 'nen' },
  { tu: 'bot', den: 'ai', nhan: '/hoi', loai: 'nen' },
  { tu: 'bot', den: 'chrome', nhan: 'ảnh', loai: 'nen' },
  { tu: 'bot', den: 'excel', nhan: 'file', loai: 'nen' },
  { tu: 'api', den: 'doctin', nhan: 'tin chưa đọc', loai: 'tg' },
  { tu: 'sua', den: 'gh', nhan: 'đẩy code', loai: 'nen' },
  // vòng ra mép trái — đi thẳng lên là đè qua khối ngrok và Máy sửa (s68 thấy 30/10)
  { tu: 'gh', den: 'cf', loai: 'nen', vongTrai: true },   // nhãn bỏ: mép trái không đủ chỗ; thẻ Giải thích có ghi
  { tu: 'gh', den: 'api', nhan: 'bấm 10', loai: 'nen' },
]

const TEN_DU_AN: Record<string, string> = { 'Thu Hoạch': 'Thu Hoạch (Vĩnh Hà)' }

/** Khối dự án (nhóm Telegram) + khối lệnh menu của từng dự án — dựng từ API. */
const dong = computed(() => {
  const ra: { khoi: Khoi[]; day: Day[]; cao: number } = { khoi: [], day: [], cao: 0 }
  let y = 70
  for (const d of tq.value?.du_an || []) {
    const ct = duAn.value[d.du_an]
    const menu = (ct?.lenh || []).filter((x) => x.loai === 'Menu')
    const conLai = (ct?.lenh.length || d.so_lenh) - menu.length
    const idDa = 'da:' + d.du_an
    const caoKhoi = Math.max(1, menu.length + (conLai ? 1 : 0)) * 32 - 6
    ra.khoi.push({ id: idDa, ten: TEN_DU_AN[d.du_an] || d.du_an, phu: `${d.so_nhom} nhóm · ${d.so_lenh} lệnh`, x: C_TG, y, w: 250, h: Math.max(52, caoKhoi), loai: 'tg', duAn: d.du_an })
    ra.day.push({ tu: 'bot', den: idDa, loai: 'tg', hai: true })
    let yl = y
    for (const l of menu) {
      const id = `l:${d.du_an}:${l.lenh}`
      ra.khoi.push({ id, ten: '/' + l.lenh, x: C_LENH, y: yl, w: 300, h: 26, loai: 'lenh', lenh: l.lenh, duAn: d.du_an })
      ra.day.push({ tu: idDa, den: id, loai: 'tg' })
      yl += 32
    }
    if (conLai) {
      const id = `l:${d.du_an}:+`
      ra.khoi.push({ id, ten: `+ ${conLai} lệnh khác`, x: C_LENH, y: yl, w: 300, h: 26, loai: 'lenh', duAn: d.du_an })
      ra.day.push({ tu: idDa, den: id, loai: 'tg' })
      yl += 32
    }
    y = Math.max(y + Math.max(52, caoKhoi), yl - 6) + 22
  }
  ra.cao = y
  return ra
})

const khoi = computed(() => [...CO_DINH, ...dong.value.khoi])
const day = computed(() => [...DAY_CO_DINH, ...dong.value.day])
const H = computed(() => Math.max(660, dong.value.cao + 30))

const VUNG = computed(() => [
  { ten: 'NGƯỜI DÙNG · WEB · CODE', x: C_NGUOI - 32, y: 30, w: 264, h: 510 },
  { ten: 'MÁY CHỦ WINDOWS (một chương trình)', x: C_MAY, y: 30, w: 440, h: 600 },
  { ten: 'NHÓM TELEGRAM THEO DỰ ÁN', x: C_TG - 12, y: 30, w: 274, h: H.value - 50 },
  { ten: 'LỆNH MENU CỦA DỰ ÁN', x: C_LENH - 12, y: 30, w: 324, h: H.value - 50 },
])

const theoId = computed(() => Object.fromEntries(khoi.value.map((k) => [k.id, k])))

/** Đường cong nối cạnh phải khối nguồn ➜ cạnh trái khối đích (hoặc trên ➜ dưới khi cùng cột). */
function diem(d: Day) {
  const a = theoId.value[d.tu], b = theoId.value[d.den]
  if (!a || !b) return null
  if (d.vongTrai) return { x1: a.x, y1: a.y + a.h / 2, x2: b.x, y2: b.y + b.h / 2, doc: false, trai: true }
  const cungCot = Math.abs(a.x - b.x) < 60 || (b.x < a.x + a.w && a.x < b.x + b.w)
  if (cungCot) {
    const xuong = b.y > a.y
    return { x1: a.x + a.w / 2, y1: xuong ? a.y + a.h : a.y, x2: b.x + b.w / 2, y2: xuong ? b.y : b.y + b.h, doc: true }
  }
  const sangPhai = b.x > a.x
  return { x1: sangPhai ? a.x + a.w : a.x, y1: a.y + a.h / 2, x2: sangPhai ? b.x : b.x + b.w, y2: b.y + Math.min(b.h / 2, 26), doc: false }
}
function duong(d: Day) {
  const p = diem(d)
  if (!p) return ''
  if ((p as any).trai) return `M${p.x1},${p.y1} C${p.x1 - 26},${p.y1} ${p.x2 - 26},${p.y2} ${p.x2},${p.y2}`
  if (p.doc) {
    const m = (p.y1 + p.y2) / 2
    return `M${p.x1},${p.y1} C${p.x1},${m} ${p.x2},${m} ${p.x2},${p.y2}`
  }
  const m = (p.x1 + p.x2) / 2
  return `M${p.x1},${p.y1} C${m},${p.y1} ${m},${p.y2} ${p.x2},${p.y2}`
}
function giua(d: Day) {
  const p = diem(d)
  if (p && (p as any).trai) return { x: p.x1 - 2, y: (p.y1 + p.y2) / 2 }
  return p ? { x: (p.x1 + p.x2) / 2, y: (p.y1 + p.y2) / 2 } : { x: 0, y: 0 }
}

// ── Chọn khối ──
const lienQuan = computed(() => {
  const s = new Set<string>()
  if (!chon.value) return s
  s.add(chon.value)
  for (const d of day.value) {
    if (d.tu === chon.value) s.add(d.den)
    if (d.den === chon.value) s.add(d.tu)
  }
  return s
})
function sang(d: Day) { return !!chon.value && (d.tu === chon.value || d.den === chon.value) }
function bam(n: Khoi) {
  if (n.loai === 'lenh' && n.duAn) {
    router.push({ path: '/danh-sach-lenh', query: { xem: n.duAn } })
    return
  }
  chon.value = chon.value === n.id ? '' : n.id
}
</script>

<style scoped>
.map-chu-giai { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 18px; margin-bottom: 12px; font-size: var(--hdg-fs-caption); color: var(--hdg-text-muted); }
.map-goi-y { flex: 1 1 260px; }
.map-bo { border: 1px solid var(--hdg-border); background: var(--hdg-card); color: var(--hdg-text); border-radius: var(--hdg-radius-pill); padding: 4px 12px; font: inherit; cursor: pointer; }
.dg { display: inline-block; width: 22px; height: 3px; border-radius: 2px; vertical-align: middle; margin-right: 4px; }
.dg--web { background: var(--hdg-green-700); }
.dg--tg { background: var(--hdg-info); }
.dg--nen { background: var(--hdg-gold); }
.map-loi { margin-bottom: 10px; padding: 8px 12px; border-radius: var(--hdg-radius-control); background: var(--hdg-warning-soft); color: var(--hdg-warning-text); font-size: var(--hdg-fs-caption); }
.map-cuon { overflow: auto; background: var(--hdg-card); border: 1px solid var(--hdg-border); border-radius: var(--hdg-radius-card); max-height: calc(100vh - 230px); }
.map-svg { display: block; font-family: var(--hdg-font-sans); }
.vung { fill: var(--hdg-row-alt); stroke: var(--hdg-border); stroke-dasharray: 4 4; }
.vung-ten { fill: var(--hdg-text-muted); font-size: 12px; font-weight: 700; letter-spacing: .08em; }
.khoi { cursor: pointer; }
.khoi rect { fill: var(--hdg-card); stroke-width: 1.5; transition: opacity .15s; }
.khoi--web rect { stroke: var(--hdg-green-700); }
.khoi--tg rect { stroke: var(--hdg-info); }
.khoi--nen rect { stroke: var(--hdg-gold); }
.khoi--lenh rect { stroke: var(--hdg-border); fill: var(--hdg-primary-soft); }
.khoi:hover rect, .khoi:focus-visible rect { stroke-width: 3; }
.khoi:focus-visible { outline: none; }
.khoi.is-chon rect { stroke-width: 3.5; }
.khoi.is-mo { opacity: .28; }
.khoi-ten { fill: var(--hdg-text); font-size: 15px; font-weight: 700; }
.khoi-phu { fill: var(--hdg-text-muted); font-size: 12.5px; }
.khoi-lenh { fill: var(--hdg-primary); font-size: 13px; font-family: var(--hdg-font-mono); }
.day path { stroke-width: 1.6; opacity: .55; transition: opacity .15s; }
.day--web path { stroke: var(--hdg-green-700); }
.day--tg path { stroke: var(--hdg-info); }
.day--nen path { stroke: var(--hdg-gold); }
.day.is-sang path { stroke-width: 3; opacity: 1; }
.day.is-mo { opacity: .12; }
.day-nhan { fill: var(--hdg-text-muted); font-size: 12px; paint-order: stroke; stroke: var(--hdg-card); stroke-width: 4px; }
.mui { fill: var(--hdg-text-muted); }
@media (prefers-reduced-motion: reduce) { .khoi rect, .day path { transition: none; } }
</style>
