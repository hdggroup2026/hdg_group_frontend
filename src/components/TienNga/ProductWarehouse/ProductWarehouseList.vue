<template>
  <div class="h-full p-6 overflow-y-auto">
    <!-- Header Section -->
    <div class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 dark:from-violet-400 dark:to-fuchsia-400">
          Quản Lý Thành Phẩm
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Theo dõi nhập xuất thành phẩm mủ, phế phẩm tại các kho thành phẩm Tiến Nga
        </p>
      </div>
      <div>
        <el-button 
          type="primary" 
          class="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 border-none rounded-xl font-semibold shadow-md transition-all duration-300 hover:shadow-lg text-white"
          @click="emit('create-warehouse')"
        >
          <el-icon class="mr-2"><Plus /></el-icon>
          Tạo thêm Kho
        </el-button>
      </div>
    </div>

    <!-- Section Divider / Title -->
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <span class="w-2.5 h-2.5 bg-violet-500 dark:bg-violet-400 rounded-full"></span>
        Danh Sách Kho Thành Phẩm
      </h3>
      <span class="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
        {{ warehouses.length }} Kho
      </span>
    </div>

    <!-- Warehouses Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <el-card 
        v-for="wh in warehouses" 
        :key="wh.id" 
        shadow="hover" 
        class="wh-card border border-gray-100 dark:border-gray-700/80 rounded-2xl bg-white dark:bg-gray-800 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        @click="emit('select-warehouse', wh.id)"
      >
        <!-- Card Header -->
        <div class="flex items-start gap-3 mb-3">
          <div class="p-2.5 rounded-xl text-white shadow-sm flex items-center justify-center animate-none" :style="{ backgroundColor: wh.color }">
            <el-icon :size="20"><Box /></el-icon>
          </div>
          <div class="flex-1 min-w-0 text-left">
            <div class="flex items-center justify-between gap-1">
              <h4 class="font-bold text-gray-800 dark:text-gray-100 text-[15px] line-clamp-1 leading-snug flex-1">{{ wh.name }}</h4>
              
              <!-- Dropdown Action Menu -->
              <div @click.stop>
                <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, wh)">
                  <el-button link type="info" class="p-1 !text-gray-400 hover:!text-gray-600 dark:hover:!text-gray-200" @click.stop>
                    <el-icon :size="16"><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">Chỉnh sửa</el-dropdown-item>
                      <el-dropdown-item command="delete" divided class="!text-red-500">Xóa</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mt-1 justify-start">
              <el-icon :size="12"><Location /></el-icon>
              <span class="line-clamp-1">{{ wh.address }}</span>
            </div>
          </div>
        </div>

        <!-- Card Body -->
        <div class="space-y-3 pt-3 border-t border-gray-50 dark:border-gray-700/40">
          <div class="flex justify-between items-center text-xs">
            <span class="text-gray-400 dark:text-gray-500 font-medium">Sức chứa</span>
            <span class="font-bold text-gray-700 dark:text-gray-300">{{ wh.capacity }}</span>
          </div>
          <div class="flex justify-between items-center text-xs">
            <span class="text-gray-400 dark:text-gray-500 font-medium">Tồn kho hiện tại</span>
            <span class="font-bold text-violet-600 dark:text-violet-400">{{ formatNumber(wh.currentQty) }} kg</span>
          </div>
          
          <!-- Capacity Bar -->
          <div class="mt-3">
            <div class="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                class="h-full rounded-full transition-all duration-500" 
                :style="{ width: getCapacityPercent(wh) + '%', backgroundColor: wh.color }"
              ></div>
            </div>
            <div class="text-right text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-medium">
              {{ getCapacityPercentText(wh) }} sức chứa
            </div>
          </div>
        </div>

        <!-- Hover footer -->
        <div class="mt-3 pt-3 flex items-center justify-end text-[11px] font-semibold text-violet-600 dark:text-violet-400 opacity-0 transition-opacity duration-300 wh-card-footer">
          <span>Xem chi tiết</span>
          <el-icon class="ml-1"><ArrowRight /></el-icon>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Box, Location, ArrowRight, Plus, MoreFilled } from '@element-plus/icons-vue'

interface ProductWarehouse {
  id: string
  name: string
  address: string
  capacity: string
  currentQty: number
  icon: string
  color: string
}

const props = defineProps<{
  warehouses: ProductWarehouse[]
}>()

const emit = defineEmits<{
  (e: 'select-warehouse', id: string): void
  (e: 'create-warehouse'): void
  (e: 'edit-warehouse', wh: ProductWarehouse): void
  (e: 'delete-warehouse', wh: ProductWarehouse): void
}>()

const handleCommand = (command: string, wh: ProductWarehouse) => {
  if (command === 'edit') {
    emit('edit-warehouse', wh)
  } else if (command === 'delete') {
    emit('delete-warehouse', wh)
  }
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value)
}

const getCapacityPercent = (wh: ProductWarehouse) => {
  const capNum = parseInt(wh.capacity.replace(/[^0-9]/g, ''))
  if (!capNum) return 0
  return Math.min(100, (wh.currentQty / capNum) * 100)
}

const getCapacityPercentText = (wh: ProductWarehouse) => {
  const capNum = parseInt(wh.capacity.replace(/[^0-9]/g, ''))
  if (!capNum) return '0%'
  const pct = (wh.currentQty / capNum) * 100
  if (pct === 0) return '0%'
  if (pct < 0.1) return '< 0.1%'
  return `${Math.min(100, Math.round(pct * 10) / 10)}%`
}
</script>

<style scoped>
.wh-card:hover .wh-card-footer {
  opacity: 1;
}
:deep(.el-card) {
  border-radius: 1rem;
}
:deep(.el-card__body) {
  padding: 1.5rem;
}
</style>
