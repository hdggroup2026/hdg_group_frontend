<template>
  <main class="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-[#87CEEB] to-[#4682B4]">
    <div class="absolute top-20 -left-20 w-80 h-80 bg-white/40 rounded-full blur-[80px]"></div>
    <div class="absolute bottom-10 -right-20 w-96 h-96 bg-white/30 rounded-full blur-[100px]"></div>
    <div class="absolute top-1/2 left-10 w-60 h-60 bg-white/20 rounded-full blur-[60px]"></div>

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