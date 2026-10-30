<!--
  MỤC 721 (30/10/2026) — màn một dự án: BẢNG + chi tiết (ảnh 02/04) và MA TRẬN (ảnh 03).

  Cột ma trận = "loại nhóm" gộp theo CHỨC DANH (backend `cot`, MỤC 721): sau MỤC 506 nhóm role
  main có thêm /kick_user so với role member cùng chức danh. Ô ◐ = chỉ một trong hai vai trò
  được gợi ý lệnh đó — vẫn hiện, không giấu, vì đó đúng là thứ cần rà.
-->
<template>
  <div v-loading="dangTai" class="da">
    <el-alert v-if="loi" type="error" :closable="false" show-icon :title="loi" />
    <template v-if="d">
      <div class="da-dau">
        <div>
          <h1 class="da-ten"><span class="da-ten__vach" :style="{ background: mau }" />{{ tenHien }}</h1>
          <p class="da-phu">{{ d.lenh.length }} lệnh · {{ cot.length }} loại nhóm · {{ dem.Menu }} menu · {{ dem['Thường'] }} thường · {{ dem.Reply }} reply · {{ tongNhom }} nhóm thật</p>
        </div>
        <div class="da-dau__phai">
          <div class="da-tien-do">
            Đã rà <b class="hdg-num">{{ daRa }}/{{ d.lenh.length }}</b>
            <el-progress :percentage="d.lenh.length ? Math.round(daRa / d.lenh.length * 100) : 0" :show-text="false" :stroke-width="6" class="da-tien-do__thanh" />
          </div>
          <SegmentedControl v-model="cheDo" :options="[{ label: 'Bảng', value: 'bang' }, { label: 'Ma trận', value: 'ma-tran' }]" />
        </div>
      </div>

      <FilterBar>
        <el-input v-model="tim" placeholder="Tìm lệnh hoặc mô tả…" clearable />
        <SegmentedControl v-model="locLoai" :options="[{ label: 'Tất cả', value: '' }, { label: 'Menu', value: 'Menu' }, { label: 'Thường', value: 'Thường' }, { label: 'Reply', value: 'Reply' }]" />
        <el-select v-model="locCot" placeholder="Loại nhóm" clearable>
          <el-option v-for="c in cot" :key="c.khoa" :label="c.ten" :value="c.khoa" />
        </el-select>
        <el-select v-model="locKhoa" placeholder="Khoá quyền" clearable>
          <el-option label="Có khoá quyền" value="co" />
          <el-option label="Chưa rõ khoá quyền" value="chua-ro" />
        </el-select>
        <template #actions><span class="da-dem">Hiển thị <b>{{ dongLoc.length }}</b> lệnh</span></template>
      </FilterBar>

      <!-- ── BẢNG ── -->
      <div v-if="cheDo === 'bang'" class="da-bang" :class="{ 'co-ngan': chon && rong }">
        <DataTable :columns="cotBang" :rows="dongLoc" row-key="lenh" card-title="lenh" clickable empty-text="Không có lệnh nào khớp bộ lọc" @row-click="moChiTiet">
          <template #cell-ra_soat="{ row }">
            <span class="da-rs" :class="`da-rs--${row.ra_soat?.trang_thai || 'chua_ra'}`" :title="tenRaSoat(row)">{{ dauRaSoat(row) }}</span>
          </template>
          <template #cell-lenh="{ row }"><code class="da-ma" :class="{ 'is-chon': chon?.lenh === row.lenh }">/{{ row.lenh }}</code></template>
          <template #cell-loai="{ row }"><StatusPill :tone="toneLoai(row.loai)">{{ row.loai }}</StatusPill></template>
          <template #cell-mo_ta="{ row }">
            <div>{{ row.mo_ta }}</div>
            <div class="da-chips">
              <span v-for="c in cotCua(row).slice(0, 3)" :key="c.khoa" class="da-chip">{{ c.ten }}</span>
              <span v-if="cotCua(row).length > 3" class="da-chip">+{{ cotCua(row).length - 3 }}</span>
            </div>
          </template>
          <template #cell-khoa="{ row }">
            <span v-if="row.khoa">{{ chuKhoa(row.khoa) }}</span>
            <span v-else-if="row.loai === 'Menu'" class="da-mo">Menu nút bấm</span>
            <StatusPill v-else tone="warning">chưa rõ</StatusPill>
          </template>
        </DataTable>

        <!-- Ngăn chi tiết: cột phải trên màn ≥1280 (ảnh 02), ngăn trượt trên màn nhỏ hơn -->
        <div v-if="chon && rong" class="hdg-card da-ngan">
          <ChiTietLenh :lenh="chon" :cot="cot" :tong-nhom="tongNhom" @da-luu="daLuu" @dong="chon = null" />
        </div>
      </div>
      <DetailDrawer v-if="!rong" :model-value="!!chon" :title="chon ? '/' + chon.lenh : ''" @update:model-value="(v) => !v && (chon = null)">
        <ChiTietLenh v-if="chon" :lenh="chon" :cot="cot" :tong-nhom="tongNhom" an-tieu-de @da-luu="daLuu" />
      </DetailDrawer>

      <!-- ── MA TRẬN ── -->
      <div v-if="cheDo === 'ma-tran'" class="hdg-card da-mt">
        <div class="da-mt__chu-giai">
          <span><i class="da-o da-o--co" /> Có gợi ý</span>
          <span><i class="da-o da-o--nua" /> Chỉ nhóm main hoặc chỉ member</span>
          <span><i class="da-o da-o--khong" /> Không có</span>
          <span><b class="da-o--canh">!</b> Loại nhóm chưa được gợi ý lệnh nền (/dang_ky_lenh, /get_chat_id)</span>
        </div>
        <div class="da-mt__cuon">
          <table class="da-mt__bang">
            <thead>
              <tr>
                <th class="da-mt__lenh">Lệnh</th>
                <th class="da-mt__mo-ta">Mô tả</th>
                <th v-for="c in cot" :key="c.khoa" class="da-mt__cot" :title="c.nhan + ' — ' + c.soNhom + ' nhóm thật'"><span>{{ c.ten }}</span></th>
              </tr>
              <tr class="da-mt__dem">
                <td colspan="2">Số lệnh của từng loại nhóm</td>
                <td v-for="c in cot" :key="c.khoa" class="hdg-num">{{ soLenhCot(c) }}</td>
              </tr>
            </thead>
            <tbody v-for="nhom in nhomMaTran" :key="nhom.ten">
              <tr class="da-mt__nhom"><td :colspan="2 + cot.length" class="hdg-label">{{ nhom.ten }} · {{ nhom.ds.length }}</td></tr>
              <tr v-for="x in nhom.ds" :key="x.lenh" class="da-mt__dong" @click="cheDo = 'bang'; moChiTiet(x)">
                <td class="da-mt__lenh"><code class="da-ma">/{{ x.lenh }}</code></td>
                <td class="da-mt__mo-ta">{{ x.mo_ta }}</td>
                <td v-for="c in cot" :key="c.khoa" class="da-mt__o" :class="{ 'is-canh': o(x, c) === 'canh' }">
                  <b v-if="o(x, c) === 'canh'" class="da-o--canh">!</b>
                  <i v-else class="da-o" :class="`da-o--${o(x, c)}`" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useWindowSize } from '@vueuse/core'
import FilterBar from '@/design/components/FilterBar.vue'
import DataTable, { type CotBang } from '@/design/components/DataTable.vue'
import DetailDrawer from '@/design/components/DetailDrawer.vue'
import StatusPill from '@/design/components/StatusPill.vue'
import SegmentedControl from '@/design/components/SegmentedControl.vue'
import { danhSachLenhService, type DuAnLenh, type Lenh, type RaSoat } from '@/api/danhSachLenhService'
import ChiTietLenh, { type CotMaTran } from './ChiTietLenh.vue'
import { chuKhoa } from './chung'

const props = defineProps<{ duAn: string; mau: string; tenHien: string }>()
const emit = defineEmits<{ 'da-luu': [] }>()

const d = ref<DuAnLenh | null>(null)
const dangTai = ref(false)
const loi = ref('')
const cheDo = ref('bang')
const tim = ref('')
const locLoai = ref('')
const locCot = ref('')
const locKhoa = ref('')
const chon = ref<Lenh | null>(null)

const { width } = useWindowSize()
const rong = computed(() => width.value >= 1280)

onMounted(async () => {
  dangTai.value = true
  try {
    d.value = await danhSachLenhService.duAn(props.duAn)
  } catch (e: any) {
    loi.value = `Không đọc được dự án ${props.tenHien}: ${e?.message || e}`
  } finally {
    dangTai.value = false
  }
})

/** Cột ma trận: gộp các loại nhóm cùng `cot` (main + member cùng chức danh). */
const cot = computed<CotMaTran[]>(() => {
  const ra: CotMaTran[] = []
  d.value?.loai_nhom.forEach((l, i) => {
    let c = ra.find((x) => x.khoa === l.cot)
    if (!c) {
      c = { khoa: l.cot, ten: l.ten_cot, nhan: l.nhan, duPhong: l.du_phong, chiSo: [], soNhom: 0, nhom: [] }
      ra.push(c)
    }
    c.chiSo.push(i)
    c.soNhom += l.so_nhom
    c.nhom.push(...l.nhom)
  })
  return ra
})
const tongNhom = computed(() => cot.value.reduce((s, c) => s + c.soNhom, 0))

const dem = computed(() => {
  const r: Record<string, number> = { Menu: 0, 'Thường': 0, Reply: 0 }
  d.value?.lenh.forEach((x) => { r[x.loai] = (r[x.loai] || 0) + 1 })
  return r
})
const daRa = computed(() => d.value?.lenh.filter((x) => x.ra_soat?.trang_thai === 'da_ra').length || 0)

function cotCua(x: Lenh) {
  return cot.value.filter((c) => c.chiSo.some((i) => x.loai_nhom.includes(i)))
}

const dongLoc = computed(() => {
  const s = tim.value.trim().toLowerCase().replace(/^\//, '')
  return (d.value?.lenh || []).filter((x) =>
    (!s || x.lenh.toLowerCase().includes(s) || (x.mo_ta || '').toLowerCase().includes(s))
    && (!locLoai.value || x.loai === locLoai.value)
    && (!locCot.value || cotCua(x).some((c) => c.khoa === locCot.value))
    && (!locKhoa.value || (locKhoa.value === 'co' ? x.khoa !== null : x.khoa === null)),
  )
})

const cotBang: CotBang[] = [
  { prop: 'ra_soat', label: '✓', width: 56, align: 'center' },
  { prop: 'lenh', label: 'Lệnh', minWidth: 230 },
  { prop: 'loai', label: 'Loại', width: 110 },
  { prop: 'mo_ta', label: 'Mô tả · nhóm nhận gợi ý', minWidth: 300 },
  { prop: 'khoa', label: 'Khoá quyền', width: 160 },
]

function toneLoai(l: string) {
  return l === 'Menu' ? 'success' : l === 'Reply' ? 'warning' : 'neutral'
}
function dauRaSoat(x: Lenh) {
  const t = x.ra_soat?.trang_thai
  return t === 'da_ra' ? '✓' : t === 'can_sua' ? '⚠' : '○'
}
function tenRaSoat(x: Lenh) {
  const t = x.ra_soat?.trang_thai
  return t === 'da_ra' ? 'Đã rà' : t === 'can_sua' ? 'Cần sửa' : 'Chưa rà'
}

function moChiTiet(x: Lenh) { chon.value = x }
function daLuu(lenh: string, rs: RaSoat) {
  const x = d.value?.lenh.find((y) => y.lenh === lenh)
  if (x) x.ra_soat = rs
  emit('da-luu')
}

// ── Ma trận ──
const nhomMaTran = computed(() => {
  const ds = dongLoc.value
  return [
    { ten: 'Menu nút bấm', ds: ds.filter((x) => x.loai === 'Menu') },
    { ten: 'Lệnh reply', ds: ds.filter((x) => x.loai === 'Reply') },
    { ten: 'Lệnh thường', ds: ds.filter((x) => x.loai === 'Thường') },
  ].filter((n) => n.ds.length)
})
function soLenhCot(c: CotMaTran) {
  return d.value?.lenh.filter((x) => c.chiSo.some((i) => x.loai_nhom.includes(i))).length || 0
}
const LENH_NEN = ['dang_ky_lenh', 'get_chat_id']
function o(x: Lenh, c: CotMaTran): 'co' | 'nua' | 'khong' | 'canh' {
  const k = c.chiSo.filter((i) => x.loai_nhom.includes(i)).length
  if (k === c.chiSo.length) return 'co'
  if (k > 0) return 'nua'
  return LENH_NEN.includes(x.lenh) && !c.duPhong ? 'canh' : 'khong'
}
</script>

<style scoped>
.da-dau { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 18px; }
.da-ten { margin: 0; display: flex; align-items: center; gap: 12px; font-family: var(--hdg-font-serif); font-size: var(--hdg-fs-page-title); font-weight: 700; }
.da-ten__vach { width: 10px; height: 30px; border-radius: 3px; }
.da-phu { margin: 4px 0 0; color: var(--hdg-text-muted); }
.da-dau__phai { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
.da-tien-do { display: flex; align-items: center; gap: 10px; font-size: var(--hdg-fs-caption); color: var(--hdg-text-muted); }
.da-tien-do__thanh { width: 130px; }
.da-dem { color: var(--hdg-text-muted); white-space: nowrap; align-self: center; }
.da-bang { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; align-items: start; }
.da-bang.co-ngan { grid-template-columns: minmax(0, 1fr) 420px; }
.da-ngan { position: sticky; top: 0; padding: 20px 22px; max-height: calc(100vh - 160px); overflow-y: auto; }
.da-ma { font-family: var(--hdg-font-mono); padding: 2px 8px; border-radius: 6px; background: var(--hdg-primary-soft); color: var(--hdg-primary); }
.da-ma.is-chon { outline: 2px solid var(--hdg-green-500); }
.da-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.da-chip { padding: 0 8px; border: 1px solid var(--hdg-border); border-radius: var(--hdg-radius-pill); font-size: var(--hdg-fs-caption); color: var(--hdg-text-muted); }
.da-mo { color: var(--hdg-text-muted); }
.da-rs { font-size: 16px; color: var(--hdg-text-muted); }
.da-rs--da_ra { color: var(--hdg-success-text); font-weight: 700; }
.da-rs--can_sua { color: var(--hdg-warning-text); }

.da-mt { padding: 14px 0 0; overflow: hidden; }
.da-mt__chu-giai { display: flex; flex-wrap: wrap; gap: 18px; padding: 0 18px 12px; color: var(--hdg-text-muted); font-size: var(--hdg-fs-caption); }
.da-mt__cuon { overflow: auto; max-height: calc(100vh - 300px); }
.da-mt__bang { border-collapse: separate; border-spacing: 0; width: 100%; font-size: var(--hdg-fs-table); }
.da-mt__bang th, .da-mt__bang td { border-bottom: 1px solid var(--hdg-border); padding: 7px 10px; background: var(--hdg-card); }
.da-mt__bang thead th { position: sticky; top: 0; z-index: 2; vertical-align: bottom; text-align: left; font-size: var(--hdg-fs-label); text-transform: uppercase; letter-spacing: .06em; color: var(--hdg-text-muted); }
.da-mt__dem td { position: sticky; top: 150px; z-index: 2; background: var(--hdg-row-alt); color: var(--hdg-text-muted); font-size: var(--hdg-fs-caption); }
.da-mt__dem td.hdg-num { text-align: center; color: var(--hdg-primary); font-weight: 700; font-size: var(--hdg-fs-table); }
.da-mt__cot { width: 44px; height: 150px; padding: 6px 0; text-align: center; }
.da-mt__cot span { writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; text-transform: none; letter-spacing: 0; font-size: var(--hdg-fs-caption); color: var(--hdg-text); font-weight: 700; }
.da-mt__lenh { position: sticky; left: 0; z-index: 1; white-space: nowrap; }
thead .da-mt__lenh { z-index: 3; }
.da-mt__mo-ta { min-width: 220px; color: var(--hdg-text); }
.da-mt__nhom td { background: var(--hdg-row-alt); }
.da-mt__dong { cursor: pointer; }
.da-mt__dong:hover td { background: var(--hdg-primary-soft); }
.da-mt__o { text-align: center; }
.da-mt__o.is-canh { background: var(--hdg-warning-soft); }
.da-o { display: inline-block; vertical-align: middle; border-radius: 50%; }
.da-o--co { width: 15px; height: 15px; background: var(--hdg-green-700); }
.da-o--nua { width: 15px; height: 15px; border: 2px solid var(--hdg-green-700); background: linear-gradient(90deg, var(--hdg-green-700) 50%, transparent 50%); }
.da-o--khong { width: 4px; height: 4px; background: var(--hdg-border); }
.da-o--canh { color: var(--hdg-warning-text); font-weight: 800; }
@media (max-width: 767px) { .da-dau__phai { width: 100%; justify-content: space-between; } }
</style>
