<!--
  MỤC 722 (30/10/2026) — G4: KHUNG CHUNG MỚI (thanh trên 62px + thanh trái 268px), PROMPT_01 mục 4.5.

  Thay cho Navigation.vue + thanh menu riêng của từng dự án, NHƯNG:
    · chỉ bật khi công tắc `hdg_khung_moi` = '1' (mặc định tắt — chờ s68 duyệt qua ảnh);
    · KHÔNG dùng cho Tiến Nga (s68 29/10: kế toán đã quen) — Dashboard.vue tự quay về khung cũ.
  Menu dựng từ CÙNG bảng quyền với khung cũ (`layQuyen` + `danhSachDuocVao`) — không có
  danh sách dự án thứ hai để lệch.
  Chuông: chưa có nguồn số "nhóm cần xử lý" sạch ⇒ KHÔNG hiện con số (không bịa), bấm vào mở
  trang Nhóm Telegram cho admin.
-->
<template>
  <AppShell
    :nav="nav" :bottom-nav="bottomNav" :active-key="activeKey" :open-key="duAn"
    :breadcrumb="breadcrumb" flush
    @navigate="di" @bell="router.push('/telegram-projects/telegram-groups-list')"
  >
    <template #avatar>
      <el-dropdown trigger="click">
        <button type="button" class="km-avatar" aria-label="Tài khoản">
          <img v-if="anhDaiDien" :src="anhDaiDien" alt="" />
          <span v-else>{{ chuDauTen }}</span>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="router.push('/ho-so')">Hồ sơ người dùng</el-dropdown-item>
            <el-dropdown-item @click="khungMoi = '0'">Về giao diện cũ</el-dropdown-item>
            <el-dropdown-item divided @click="dangXuat">Đăng xuất</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </template>

    <div class="km-noi-dung">
      <!-- Máy tính bảng / điện thoại: mục con của dự án thành hàng chip (thanh trái không bung được) -->
      <nav v-if="width < 1280 && conDuAn.length" class="hdg-theme km-chip">
        <button
          v-for="c in conDuAn" :key="c.duong" type="button"
          class="km-chip__nut" :class="{ 'is-active': route.path.startsWith(c.duong) }"
          @click="router.push(c.duong)"
        >{{ c.label }}</button>
      </nav>
      <div class="km-trang"><slot /></div>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStorage, useWindowSize } from '@vueuse/core'
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/be-vietnam-pro/700.css'
import '@fontsource/source-serif-4/700.css'
import '@/design/tokens.css'
import AppShell, { type KhoiMenu, type MucMenu } from '@/design/components/AppShell.vue'
import { authService } from '@/api/auth'
import { layQuyen, danhSachDuocVao, timTheoTen, xoaBoNhoQuyen, type DuAn } from '@/constants/duAn'
import { KHOA_KHUNG_MOI, MAU_DU_AN, MUC_CON, QUAN_TRI } from '@/constants/menuKhungMoi'

const props = defineProps<{ duAn: string }>()
const route = useRoute()
const router = useRouter()
const { width } = useWindowSize()
const khungMoi = useStorage(KHOA_KHUNG_MOI, '0')

const duocVao = ref<DuAn[]>([])
onMounted(async () => {
  const kq = await layQuyen()
  if (kq.trangThai === 'xong') duocVao.value = danhSachDuocVao(kq.quyen)
})

const nav = computed<KhoiMenu[]>(() => {
  const duAn: MucMenu[] = []
  const quanTri: MucMenu[] = []
  let trangChu: MucMenu | null = null
  for (const d of duocVao.value) {
    if (d.ten === 'Trang Chủ') { trangChu = { key: d.ten, label: 'Trang chủ', to: d.duongMacDinh }; continue }
    if (d.ten in QUAN_TRI) { quanTri.push({ key: d.ten, label: QUAN_TRI[d.ten] || d.ten, to: d.duongMacDinh }); continue }
    duAn.push({
      key: d.ten, label: d.ten, color: MAU_DU_AN[d.ten], to: d.duongMacDinh,
      hasChildren: d.ten === 'Tiến Nga',
      children: (MUC_CON[d.ten] || []).map((c) => ({ key: c.duong, label: c.label, to: c.duong })),
    })
  }
  return [
    ...(trangChu ? [{ items: [trangChu] }] : []),
    ...(duAn.length ? [{ title: 'Dự án của bạn', items: duAn }] : []),
    ...(quanTri.length ? [{ title: 'Quản trị', items: quanTri }] : []),
  ]
})

const conDuAn = computed(() => MUC_CON[props.duAn] || [])
const activeKey = computed(() => conDuAn.value.find((c) => route.path.startsWith(c.duong))?.duong || props.duAn)

const breadcrumb = computed(() => {
  const ten: string = QUAN_TRI[props.duAn] || (props.duAn === 'Trang Chủ' ? 'Trang chủ' : props.duAn)
  const con = conDuAn.value.find((c) => route.path.startsWith(c.duong))
  return [...(props.duAn in QUAN_TRI ? ['Quản trị'] : []), ten, ...(con ? [con.label] : [])]
})

// Điện thoại: 4 mục dưới đáy (ảnh 07_Dien_thoai). "Dự án" mở dự án đầu tiên người này được vào.
const bottomNav = computed<MucMenu[]>(() => {
  const dauTien = nav.value.find((k) => k.title === 'Dự án của bạn')?.items[0]
  return [
    { key: 'Trang Chủ', label: 'Trang chủ', icon: '🏠', to: '/trang-chu' },
    ...(dauTien ? [{ key: dauTien.key, label: 'Dự án', icon: '▦', to: dauTien.to }] : []),
    { key: 'Hồ sơ', label: 'Tài khoản', icon: '👤', to: '/ho-so' },
    { key: '__cu', label: 'Giao diện cũ', icon: '↺' },
  ]
})

function di(it: MucMenu) {
  if (it.key === '__cu') { khungMoi.value = '0'; return }
  const den = it.to || timTheoTen(it.key)?.duongMacDinh
  if (den) router.push(den)
}

// Ảnh đại diện — cùng cách Navigation.vue (MỤC 407): đọc một lần, hỏng thì hiện chữ cái đầu.
const anhDaiDien = ref('')
const chuDauTen = ref('?')
onMounted(async () => {
  try {
    const { hoSoService } = await import('@/api/hoSo')
    const tk: any = (await hoSoService.layHoSoCuaToi())?.tai_khoan || {}
    anhDaiDien.value = tk.anh_dai_dien || ''
    const ten = (tk.ho_ten || tk.username || '').trim()
    chuDauTen.value = ten ? ten.charAt(0).toUpperCase() : '?'
  } catch { /* trang trí — im lặng có chủ ý */ }
})

function dangXuat() {
  // MỤC 255 — xoá bộ nhớ quyền khi đăng xuất (máy dùng chung).
  xoaBoNhoQuyen()
  authService.logout()
  router.push('/login')
}
</script>

<style scoped>
.km-avatar { width: 40px; height: 40px; border-radius: 50%; border: 0; background: var(--hdg-green-800); color: #fff; font: inherit; font-weight: 700; cursor: pointer; overflow: hidden; padding: 0; }
.km-avatar img { width: 100%; height: 100%; object-fit: cover; }
.km-noi-dung { height: 100%; display: flex; flex-direction: column; }
.km-trang { flex: 1; min-height: 0; overflow: hidden; }
.km-chip { display: flex; gap: 6px; overflow-x: auto; padding: 8px 12px; background: var(--hdg-card); border-bottom: 1px solid var(--hdg-border); flex: none; }
.km-chip__nut { flex: none; min-height: 40px; padding: 0 14px; border: 1px solid var(--hdg-border); border-radius: var(--hdg-radius-pill); background: transparent; color: var(--hdg-text); font: inherit; white-space: nowrap; cursor: pointer; }
.km-chip__nut.is-active { background: var(--hdg-primary-soft); border-color: transparent; color: var(--hdg-primary); font-weight: 700; }
</style>
