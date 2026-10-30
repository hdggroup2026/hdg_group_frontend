<template>
  <!-- ══ MỤC 683 (08/10/2026) — ẢNH NỀN MÀN ĐĂNG NHẬP ══
       s68 gửi ảnh, yêu cầu làm hình nền màn đăng nhập.
       · Ảnh để trong `src/assets/` và `import` vào — Vite đóng gói kèm bản
         build. Để `public/` mà gõ đường dẫn tay thì dễ 404 im lặng (bài học
         MỤC 669: lên bản build mất ảnh mà trang vẫn chạy bình thường).
       · Máy tính (≥768px): khung đăng nhập dời sang PHẢI để không che người
         trong ảnh (hai bé đứng giữa ảnh). Điện thoại: khung ở giữa như cũ —
         màn hẹp không có chỗ để né.
       · Nền dự phòng giữ màu trời xanh cũ: ảnh chưa tải xong vẫn có nền. -->
  <!-- ══ MỤC 724 (30/10/2026) — G4b: MÀN ĐĂNG NHẬP KIỂU MỚI (ảnh `01_Dang_nhap`), SAU CÔNG TẮC ══
       Chỉ hiện khi trình duyệt này đã bật "giao diện mới" (hdg_khung_moi = '1'); còn lại y như cũ.
       Giữ ẢNH NỀN s68 chọn (MỤC 683) ở nửa trái — phủ xanh HDG cho chữ đọc được — thay vì nền xanh
       trơn của ảnh mẫu: ảnh là lựa chọn của s68, ảnh mẫu chỉ là minh hoạ.
       Câu giới thiệu bên trái: ảnh mẫu ghi là "chữ tạm" (PROMPT_01 mục 4.7.5) ⇒ chỉ ghi tên các mảng thật.
       Form (LoginForm…) giữ nguyên logic: kiểm khoá, đếm sai, báo hết 8 tiếng; chỉ đổi kiểu qua
       provide('kieuMoiDangNhap'). -->
  <main v-if="kieuMoi" class="hdg-theme dn">
    <section class="dn-trai" :style="{ backgroundImage: `url(${anhNen})` }">
      <div class="dn-trai__phu" />
      <div class="dn-trai__noi">
        <div class="dn-hieu"><img src="/logo-hdg.png" alt="" /><span>HDG Group</span></div>
        <div>
          <h1 class="dn-tieu-de">Hệ thống quản trị dành cho đội ngũ HDG</h1>
          <p class="dn-mo-ta">Tiến Nga · Rental · Credit · Hụi · Thu hoạch · GGoMooSin · Thiết bị và phương tiện</p>
        </div>
      </div>
    </section>
    <section class="dn-phai">
      <transition name="fade-scale" mode="out-in">
        <LoginForm v-if="authState === 'login'" @switch="toggleAuth" />
        <RegisterForm v-else-if="authState === 'register'" @switch="toggleAuth" />
        <ForgotPasswordForm v-else-if="authState === 'forgot'" @switch="toggleAuth" />
      </transition>
    </section>
  </main>

  <main v-else class="min-h-screen w-full flex items-center justify-center md:justify-end md:pr-[6vw] relative overflow-hidden bg-gradient-to-b from-[#87CEEB] to-[#4682B4] bg-cover bg-center"
        :style="{ backgroundImage: `url(${anhNen})` }">
    <!-- Lớp tối nhẹ phía phải để chữ trong khung đăng nhập dễ đọc trên ảnh nhiều màu -->
    <div class="absolute inset-0 bg-gradient-to-l from-black/35 via-black/5 to-transparent pointer-events-none"></div>

    <section class="z-10">
      <transition name="fade-scale" mode="out-in">
        <LoginForm v-if="authState === 'login'" @switch="toggleAuth" />
        <RegisterForm v-else-if="authState === 'register'" @switch="toggleAuth" />
        <ForgotPasswordForm v-else-if="authState === 'forgot'" @switch="toggleAuth" />
      </transition>
    </section>
  </main>
</template>

<script setup>
import { computed, provide } from 'vue'
import { useStorage } from '@vueuse/core'
import { KHOA_KHUNG_MOI } from '@/constants/menuKhungMoi'
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/source-serif-4/700.css'
import '@/design/tokens.css'
import anhNen from '@/assets/nen_dang_nhap.jpg'   // MỤC 683
import { useRoute, useRouter } from 'vue-router'
import LoginForm from './LoginForm.vue'
import RegisterForm from './RegisterForm.vue'
import ForgotPasswordForm from './ForgotPasswordForm.vue'

// MỤC 724 — công tắc giao diện mới (cùng khoá với khung chung, constants/menuKhungMoi.ts)
const kieuMoi = computed(() => khungMoi.value === '1')
const khungMoi = useStorage(KHOA_KHUNG_MOI, '0')
provide('kieuMoiDangNhap', kieuMoi)

const route = useRoute()
const router = useRouter()

const authState = computed(() => {
  if (route.path === '/register') return 'register'
  if (route.path === '/forgot') return 'forgot'
  return 'login'
})

const toggleAuth = (state) => {
  const query = route.query.redirect ? { redirect: route.query.redirect } : undefined;
  if (state === 'register') {
    router.push({ path: '/register', query })
  } else if (state === 'forgot') {
    router.push({ path: '/forgot', query })
  } else {
    router.push({ path: '/login', query })
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
}

/* Auth Transitions */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-scale-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.fade-scale-leave-to {
  opacity: 0;
  transform: scale(1.05);
}
</style>
<style scoped>
/* MỤC 724 — màn đăng nhập kiểu mới. Máy tính: 2 nửa (ảnh | form). Điện thoại: dải ảnh thấp + form. */
.dn { min-height: 100vh; display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); }
.dn-trai { position: relative; background-size: cover; background-position: center; color: #fff; }
.dn-trai__phu { position: absolute; inset: 0; background: linear-gradient(160deg, rgba(20, 56, 35, .92) 0%, rgba(47, 111, 67, .78) 100%); }
.dn-trai__noi { position: relative; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 56px 64px; gap: 32px; }
.dn-hieu { display: flex; align-items: center; gap: 14px; font-family: var(--hdg-font-serif); font-size: 26px; font-weight: 700; }
.dn-hieu img { width: 58px; height: 58px; border-radius: 50%; background: #fff; padding: 3px; }
.dn-tieu-de { margin: 0 0 14px; max-width: 20ch; font-family: var(--hdg-font-serif); font-size: clamp(30px, 3.4vw, 48px); line-height: 1.15; text-wrap: balance; }
.dn-mo-ta { margin: 0; max-width: 52ch; opacity: .9; font-size: 16px; }
.dn-phai { display: flex; align-items: center; justify-content: center; padding: 32px max(16px, 6vw); background: var(--hdg-bg); }
.dn-phai :deep(.dn-the-moi) { width: 420px; max-width: 100%; text-align: left; }
.dn-phai :deep(.dn-the-moi h2) { font-family: var(--hdg-font-serif); font-weight: 700; font-size: 32px; color: var(--hdg-text); margin-bottom: 20px; }
.dn-phai :deep(.dn-the-moi .bg-white.p-2.rounded-full) { display: none; }   /* logo tròn: đã có ở nửa trái */
.dn-phai :deep(.dn-the-moi > .flex.justify-center) { display: none; }
.dn-phai :deep(.dn-o-moi .el-input__wrapper) { min-height: 46px; }
.dn-phai :deep(.dn-nut-moi) { width: 100%; height: 48px; font-size: 16px; }
.dn-phai :deep(.dn-the-moi .text-\[\#004274\]) { color: var(--hdg-primary); font-weight: 600; }
@media (max-width: 900px) {
  .dn { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto 1fr; }
  .dn-trai__noi { padding: 22px 20px; }
  .dn-tieu-de { font-size: 26px; max-width: none; }
  .dn-mo-ta { display: none; }
}
</style>
