<template>
  <div class="h-full p-6 overflow-y-auto">
    <!-- Header Section -->
    <div class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-400 dark:to-purple-400">
          Quản Lý Tài Chính
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Theo dõi nguồn vốn, doanh thu, chi phí và trạng thái các quỹ tài chính (Quỹ cha)
        </p>
      </div>
      <div>
        <el-button type="primary" @click="emit('add-fund')">Thêm Quỹ</el-button>
      </div>
    </div>

    <!-- Section Divider / Title -->
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <span class="w-2.5 h-2.5 bg-blue-600 dark:bg-blue-400 rounded-full"></span>
        Danh Sách Quỹ Tài Chính (Quỹ Cha)
      </h3>
      <span class="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
        {{ funds.length }} Quỹ
      </span>
    </div>

    <!-- Funds Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <el-card 
        v-for="fund in funds" 
        :key="fund.id" 
        shadow="hover" 
        class="fund-card border border-gray-100 dark:border-gray-700/80 rounded-2xl bg-white dark:bg-gray-800 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        @click="emit('select-fund', fund.id)"
      >
        <!-- Card Header -->
        <div class="flex items-start gap-3 mb-3">
          <div class="p-2.5 rounded-xl text-white shadow-sm flex items-center justify-center animate-none" :style="{ backgroundColor: fund.color }">
            <el-icon :size="20">
              <component :is="getIcon(fund.icon)" />
            </el-icon>
          </div>
          <div class="flex-1 min-w-0 text-left">
            <div class="flex items-center justify-between gap-1">
              <h4 class="font-bold text-gray-800 dark:text-gray-100 text-[15px] line-clamp-1 leading-snug flex-1">{{ fund.name }}</h4>
              
              <!-- Dropdown Action Menu -->
              <div @click.stop>
                <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, fund)">
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
              <el-icon :size="12"><Calendar /></el-icon>
              <span>{{ fund.startDate }}</span>
            </div>
          </div>
        </div>

        <div class="mb-5 flex justify-start text-left">
          <el-tag :type="getStatusType(fund.status)" size="small" class="capitalize" effect="plain">
            {{ getStatusText(fund.status) }}
          </el-tag>
        </div>

        <!-- Card Body / Details -->
        <div class="space-y-3 pt-3 border-t border-gray-50 dark:border-gray-700/40">
          <div class="flex justify-between items-center text-xs">
            <span class="text-gray-400 dark:text-gray-500 font-medium">Vốn ban đầu</span>
            <span class="font-bold" :class="mauSo(fund.initialCapital)">{{ formatCurrency(fund.initialCapital) }}</span>
          </div>
          <div class="flex justify-between items-center text-xs">
            <span class="text-gray-400 dark:text-gray-500 font-medium">Tổng thu (+)</span>
            <span class="font-bold text-emerald-600 dark:text-emerald-400">+{{ formatCurrency(fund.totalRevenue) }}</span>
          </div>
          <div class="flex justify-between items-center text-xs">
            <span class="text-gray-400 dark:text-gray-500 font-medium">Tổng chi (-)</span>
            <span class="font-bold text-rose-500 dark:text-rose-400">-{{ formatCurrency(fund.totalExpense) }}</span>
          </div>
          
          <!-- Remaining Balance Box -->
          <div class="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 flex justify-between items-center border border-gray-100/50 dark:border-gray-800">
            <div class="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Số dư còn lại</div>
            <div class="text-[15px] font-extrabold" :class="(fund.initialCapital + (fund.totalRevenue - fund.totalExpense)) >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'">
              {{ formatCurrency(fund.initialCapital + (fund.totalRevenue - fund.totalExpense)) }}
            </div>
          </div>
        </div>

        <!-- Hover Action Overlay Bar -->
        <div class="mt-4 pt-3 flex items-center justify-end text-[11px] font-semibold text-blue-600 dark:text-blue-400 opacity-0 transition-opacity duration-300 fund-card-footer">
          <span>Xem chi tiết</span>
          <el-icon class="ml-1"><ArrowRight /></el-icon>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { mauSo } from '@/utils/mauSo'
import { 
  Wallet, 
  CreditCard, 
  Briefcase, 
  Lock, 
  Calendar, 
  ArrowRight,
  MoreFilled
} from '@element-plus/icons-vue'

// Định nghĩa types
interface Fund {
  id: string
  name: string
  initialCapital: number
  startDate: string
  endDate: string
  totalRevenue: number
  totalExpense: number
  profit: number
  status: 'active' | 'suspended' | 'settled'
  icon: string
  color: string
  bgColor: string
  notes?: string // Make sure notes exists in type
}

const props = defineProps<{
  funds: Fund[]
}>()

const emit = defineEmits<{
  (e: 'select-fund', id: string): void
  (e: 'add-fund'): void
  (e: 'edit-fund', fund: Fund): void
  (e: 'delete-fund', fund: Fund): void
}>()

const handleCommand = (command: string, fund: Fund) => {
  if (command === 'edit') {
    emit('edit-fund', fund)
  } else if (command === 'delete') {
    emit('delete-fund', fund)
  }
}

// Lấy icon tương ứng
const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'Wallet': return Wallet
    case 'CreditCard': return CreditCard
    case 'Briefcase': return Briefcase
    case 'Lock': return Lock
    default: return Wallet
  }
}

// Lọc trạng thái hiển thị
const getStatusType = (status: string) => {
  return status === 'active' ? 'success' : 'danger'
}

const getStatusText = (status: string) => {
  return status === 'active' ? 'Đang hoạt động' : 'Ngưng hoạt động'
}

// Cấu hình định dạng tiền tệ
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value) + ' VNĐ'
}
</script>

<style scoped>
.fund-card:hover .fund-card-footer {
  opacity: 1;
}

/* Custom design for element-plus cards */
:deep(.el-card) {
  border-radius: 1rem;
}
:deep(.el-card__body) {
  padding: 1.5rem;
}
</style>
