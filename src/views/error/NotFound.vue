<template>
    <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div class="relative mb-8 group">
            <!-- Animated 404 Background -->
            <div class="text-[180px] font-black text-gray-200/50 leading-none select-none group-hover:text-blue-100 transition-colors duration-500">
                404
            </div>
            <!-- Illustration/Icon Overlay -->
            <div class="absolute inset-0 flex items-center justify-center translate-y-4">
                <div class="w-32 h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center border border-gray-100 group-hover:-rotate-6 transition-transform duration-500">
                <el-icon class="text-[64px] text-blue-500"><CircleCloseFilled /></el-icon>
                </div>
            </div>
        </div>

        <h1 class="text-3xl font-bold text-gray-800 mb-4 tracking-tight">
            Không tìm thấy trang
        </h1>
        <p class="text-gray-500 mb-10 max-w-md mx-auto leading-relaxed">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>

        <router-link to="/overview">
            <el-button type="primary" size="large" class="premium-button shadow-lg shadow-blue-200">
                <el-icon class="mr-2"><HomeFilled /></el-icon>
                Quay lại trang chủ
            </el-button>
        </router-link>

        <!-- Subtle Footer Decoration -->
        <div class="mt-20 flex items-center space-x-2 opacity-30">
            <img src="/logo-hdg.png" class="w-5 h-5 grayscale" />
            <span class="text-sm font-bold italic tracking-tight text-gray-700">
                Tele<span class="text-gray-900 not-italic">Me</span>
            </span>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { CircleCloseFilled, HomeFilled } from '@element-plus/icons-vue'
</script>

<style scoped>
.premium-button {
  @apply !rounded-2xl !px-10 !py-6 !text-base !font-bold hover:scale-105 active:scale-95 transition-all duration-300;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

.absolute.inset-0 {
  animation: float 4s ease-in-out infinite;
}
</style>
