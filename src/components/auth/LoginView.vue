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
  <main class="min-h-screen w-full flex items-center justify-center md:justify-end md:pr-[6vw] relative overflow-hidden bg-gradient-to-b from-[#87CEEB] to-[#4682B4] bg-cover bg-center"
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
import { computed } from 'vue'
import anhNen from '@/assets/nen_dang_nhap.jpg'   // MỤC 683
import { useRoute, useRouter } from 'vue-router'
import LoginForm from './LoginForm.vue'
import RegisterForm from './RegisterForm.vue'
import ForgotPasswordForm from './ForgotPasswordForm.vue'

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