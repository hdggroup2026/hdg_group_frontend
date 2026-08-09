<template>
  <div class="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <!-- Thanh điều hướng (sticky, luôn ở trên) -->
    <Navigation v-model:project="currentProject" />
    
    <!-- Đường phân cách nhẹ -->
    <div class="h-px bg-gray-200 dark:bg-gray-800 w-full"></div>

    <!-- Nội dung chính -->
    <main class="flex-1 overflow-hidden">
       <div class="h-full shadow-[0_0_10px_var(--el-border-color-light)]">

         <!-- === Tiến Nga: có sidebar riêng (responsive bên trong) === -->
         <TienNgaDashboard v-if="currentProject === 'Tiến Nga'" />

         <!-- === Ggomoosin: có sidebar riêng (responsive bên trong) === -->
         <GgomoosinDashboard v-else-if="currentProject === 'Ggomoosin'" />

         <!-- === Rental: có sidebar riêng (responsive bên trong) === -->
         <RentalDashboard v-else-if="currentProject === 'Rental'" />

         <!-- === Credit: có sidebar riêng (responsive bên trong) === -->
         <CreditDashboard v-else-if="currentProject === 'Credit'" />

         <!-- === Thu hoạch: có sidebar riêng (responsive bên trong) === -->
         <HarvestDashboard v-else-if="currentProject === 'Thu hoạch'" />

         <!-- === Other: có sidebar riêng (responsive bên trong) === -->
         <OtherDashboard v-else-if="currentProject === 'Other'" />

         <!-- === Dự án Telegram === -->
         <TelegramProjects v-else-if="currentProject === 'Dự án Telegram'" />

         <!-- === Hụi === -->
         <RoscaDashboard v-else-if="currentProject === 'Hụi'" />

         <!-- === Phân quyền === -->
         <AuthorizationDashboard v-else-if="currentProject === 'Phân quyền'" />

         <!-- === Các project khác === -->
         <template v-else>
           <!-- Desktop (≥ 1024px): giữ el-splitter -->
           <el-splitter v-if="isDesktop">
             <el-splitter-panel size="15%">
                <div class="flex items-center justify-center h-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-lg border-r border-gray-100 dark:border-gray-700">
                  <span>{{ currentProject }}</span>
                </div>
             </el-splitter-panel>
             <el-splitter-panel :min="200">
                <div class="h-full bg-gray-50 dark:bg-gray-900 p-6 overflow-y-auto overflow-x-auto">
                  <!-- Chứa các view của project khác sau này -->
                </div>
             </el-splitter-panel>
           </el-splitter>

           <!-- Tablet & Mobile (< 1024px): không cần sidebar, chỉ hiện project name header -->
           <div v-else class="h-full flex flex-col">
             <div
               class="shrink-0 px-4 py-2.5 border-b flex items-center text-sm font-semibold"
               :class="isDark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700'"
             >
               <span>{{ currentProject }}</span>
             </div>
             <div class="flex-1 bg-gray-50 dark:bg-gray-900 p-6 overflow-y-auto overflow-x-auto">
               <!-- Chứa các view của project khác sau này -->
             </div>
           </div>
         </template>

       </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWindowSize, useDark } from '@vueuse/core'
import Navigation from '@/layouts/Navigation.vue'
import TienNgaDashboard from '@/components/TienNga/Index.vue'
import GgomoosinDashboard from '@/components/Ggomoosin/Index.vue'
import RentalDashboard from '@/components/Rental/Index.vue'
import CreditDashboard from '@/components/Credit/Index.vue'
import HarvestDashboard from '@/components/Harvest/Index.vue'
import OtherDashboard from '@/components/Other/Index.vue'
import TelegramProjects from '@/components/TienNga/TelegramProjects/Index.vue'
import RoscaDashboard from '@/components/Rosca/Index.vue'
import AuthorizationDashboard from '@/components/Authorization/Index.vue'

const route = useRoute()
const router = useRouter()
const currentProject = ref('Tiến Nga')

watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/tien-nga')) {
      currentProject.value = 'Tiến Nga'
    } else if (path.startsWith('/ggomoosin')) {
      currentProject.value = 'Ggomoosin'
    } else if (path.startsWith('/rental')) {
      currentProject.value = 'Rental'
    } else if (path.startsWith('/credit')) {
      currentProject.value = 'Credit'
    } else if (path.startsWith('/harvest')) {
      currentProject.value = 'Thu hoạch'
    } else if (path.startsWith('/telegram-projects')) {
      currentProject.value = 'Dự án Telegram'
    } else if (path.startsWith('/rosca')) {
      currentProject.value = 'Hụi'
    } else if (path.startsWith('/other')) {
      currentProject.value = 'Other'
    } else if (path.startsWith('/authorization')) {
      currentProject.value = 'Phân quyền'
    }
  },
  { immediate: true }
)

watch(currentProject, (newVal) => {
  if (newVal === 'Tiến Nga' && !route.path.startsWith('/tien-nga')) {
    router.push('/tien-nga/overall')
  } else if (newVal === 'Ggomoosin' && !route.path.startsWith('/ggomoosin')) {
    router.push('/ggomoosin/hr')
  } else if (newVal === 'Rental' && !route.path.startsWith('/rental')) {
    router.push('/rental/real-estate')
  } else if (newVal === 'Credit' && !route.path.startsWith('/credit')) {
    router.push('/credit/contract-management')
  } else if (newVal === 'Thu hoạch' && !route.path.startsWith('/harvest')) {
    router.push('/harvest/rubber')
  } else if (newVal === 'Dự án Telegram' && !route.path.startsWith('/telegram-projects')) {
    router.push('/telegram-projects/telegram-groups-list')
  } else if (newVal === 'Hụi' && !route.path.startsWith('/rosca')) {
    router.push('/rosca/players')
  } else if (newVal === 'Other' && !route.path.startsWith('/other')) {
    router.push('/other/devices')
  } else if (newVal === 'Phân quyền' && !route.path.startsWith('/authorization')) {
    router.push('/authorization')
  }
})

const { width: windowWidth } = useWindowSize()

const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: '',
})

const isDesktop = computed(() => windowWidth.value >= 1024)
</script>
