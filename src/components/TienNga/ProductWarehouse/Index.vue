<template>
  <div class="product-wh-container h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <transition name="fade-slide" mode="out-in">
      <ProductWarehouseList 
        v-if="currentView === 'list'" 
        :warehouses="warehouses" 
        @select-warehouse="handleSelectWarehouse" 
        @create-warehouse="handleOpenCreateDialog"
        @edit-warehouse="handleOpenEditDialog"
        @delete-warehouse="handleDeleteWarehouse"
      />
      <ProductWarehouseDetail 
        v-else-if="currentView === 'detail' && selectedWarehouse" 
        :warehouse="selectedWarehouse!" 
        :transactions="getTransactionsForSelected"
        @back="handleBack" 
        @add-transaction="handleAddTransaction"
        @refresh-transactions="handleRefreshTransactions"
      />
    </transition>

    <!-- Create/Edit Warehouse Dialog -->
    <el-dialog 
      v-model="createDialogVisible" 
      :title="isEdit ? 'CHỈNH SỬA THÔNG TIN KHO THÀNH PHẨM' : 'TẠO THÊM KHO THÀNH PHẨM'" 
      width="900px" 
      destroy-on-close 
      align-center
      class="custom-dark-dialog"
    >
      <div class="max-h-[65vh] overflow-y-auto overflow-x-hidden px-2">
        <el-form 
          :model="form" 
          :rules="rules" 
          ref="formRef" 
          label-width="180px"
          class="mt-2 compact-form"
        >
          <!-- PHẦN 1: THÔNG TIN KHO BÃI -->
          <div class="mb-4">
            <h4 class="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông tin kho bãi
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Tên Kho" prop="storage_name">
                  <el-input v-model="form.storage_name" placeholder="Ví dụ: Kho Thành phẩm 2" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Vị Trí Kho" prop="storage_location">
                  <el-input v-model="form.storage_location" placeholder="Ví dụ: Khu B" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- PHẦN 2: DUNG TÍCH & CHỨA HÀNG -->
          <div class="mb-2">
            <h4 class="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-green-500 rounded-full"></span>
              Dung tích &amp; Chứa hàng
            </h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Nguyên Liệu" prop="material_name">
                  <el-select 
                    v-model="form.material_name" 
                    placeholder="Chọn hoặc nhập..." 
                    :filterable="choLocDuoc" 
                    allow-create 
                    default-first-option
                    class="w-full"
                  >
                    <el-option label="Cao su RSS3" value="Cao su RSS3" />
                    <el-option label="Phế phẩm Cao su RSS3" value="Phế phẩm Cao su RSS3" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Sức Chứa (kg)" prop="capacity">
                  <el-input-number 
                    v-model="form.capacity" 
                    :min="0" 
                    :step="1000"
                    class="w-full" 
                    controls-position="right"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Số Lượng Hiện Tại (kg)" prop="quantity">
                  <el-input-number 
                    v-model="form.quantity" 
                    :min="0" 
                    :step="100"
                    class="w-full" 
                    controls-position="right"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-form>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3 mt-4 pr-2">
          <el-button @click="createDialogVisible = false">Hủy</el-button>
          <el-button 
            type="primary" 
            @click="submitCreateWarehouse" 
            :loading="submitting"
            class="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 border-none font-semibold text-white"
          >
            Xác nhận
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ProductWarehouseList from './ProductWarehouseList.vue'
import ProductWarehouseDetail from './ProductWarehouseDetail.vue'
import { tienNgaService } from '@/api/tienNgaService'
// MỤC 417 — trên máy bảng/điện thoại KHÔNG cho gõ lọc, để iOS
// không bật bàn phím; bấm ẩn bàn phím thì droplist ở nguyên đó.
// Xem `src/composables/chonDuoc.ts`.
import { dungChonDuoc } from '@/composables/chonDuoc'

const { choLocDuoc } = dungChonDuoc()

// Types
export interface ProductWarehouse {
  id: string
  name: string
  address: string
  capacity: string
  currentQty: number
  icon: string
  color: string
}

export interface ProductTransaction {
  id: string
  warehouseId: string
  date: string
  customerCode: string
  customerName: string
  transactionType: 'import' | 'export'
  material: 'Cao su RSS3' | 'Phế phẩm Cao su'
  warehouseName: string
  quantity: number
  unitPrice: number
  totalAmount: number
  debt: number
  productCode: string
  note?: string
}

// Color palette for product warehouse cards
const warehouseColors = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6']

// Warehouses - loaded from API
const warehouses = ref<ProductWarehouse[]>([])

// Transactions
const transactions = ref<ProductTransaction[]>([])

// Inject setLoading from parent
const setLoading = inject<(val: boolean) => void>('setLoading', () => {})

// Fetch inventories from API on mount
const fetchInventories = async () => {
  try {
    setLoading(true)
    const data = await tienNgaService.getInventories('Cao su')
    warehouses.value = data.map((item: any, index: number) => ({
      id: String(item.id || `pwh-${index}`),
      name: item.storage_name || `Kho Thành phẩm ${index + 1}`,
      address: item.storage_location || '',
      capacity: item.capacity ? `${new Intl.NumberFormat('vi-VN').format(item.capacity)} kg` : '0 kg',
      currentQty: item.quantity || 0,
      icon: 'Box',
      color: warehouseColors[index % warehouseColors.length] || '#8b5cf6'
    }))
  } catch (error) {
    console.error('Failed to fetch product warehouse inventories:', error)
  } finally {
    setLoading(false)
  }
}

// Fetch product transactions from API
const fetchProductTransactions = async (storageName: string, warehouseId: string) => {
  try {
    const data = await tienNgaService.getProductTransactions({ storage_name: storageName })
    transactions.value = data.map((item: any) => ({
      id: String(item.id),
      warehouseId: warehouseId,
      date: item.transaction_date || '',
      customerCode: item.customer_id || '',
      customerName: item.fullname || item.customer_id || 'Chưa rõ',
      transactionType: item.transaction_type || 'export',
      material: item.material_type || 'Cao su RSS3',
      warehouseName: item.storage_name || '',
      quantity: item.quantity || 0,
      unitPrice: item.unit_price || 0,
      totalAmount: item.total_amount || 0,
      debt: item.debt || 0,
      productCode: item.product_code || '',
      note: item.note || ''
    }))
  } catch (error) {
    console.error('Failed to fetch product transactions:', error)
  }
}

onMounted(() => {
  fetchInventories()
})

// Navigation
const currentView = ref<'list' | 'detail'>('list')
const selectedWarehouseId = ref<string | null>(null)

const selectedWarehouse = computed(() => {
  return warehouses.value.find(w => w.id === selectedWarehouseId.value) || null
})

const getTransactionsForSelected = computed(() => {
  if (!selectedWarehouseId.value) return []
  return transactions.value.filter(t => t.warehouseId === selectedWarehouseId.value)
})

const handleSelectWarehouse = async (id: string) => {
  selectedWarehouseId.value = id
  const wh = warehouses.value.find(w => w.id === id)
  if (wh) {
    try {
      setLoading(true)
      await fetchProductTransactions(wh.name, id)
    } finally {
      setLoading(false)
    }
  }
  currentView.value = 'detail'
}

const handleBack = () => {
  currentView.value = 'list'
  selectedWarehouseId.value = null
  transactions.value = []
}

const handleRefreshTransactions = async () => {
  if (!selectedWarehouseId.value) return
  const wh = warehouses.value.find(w => w.id === selectedWarehouseId.value)
  if (wh) {
    try {
      setLoading(true)
      await Promise.all([
        fetchProductTransactions(wh.name, selectedWarehouseId.value),
        fetchInventories()
      ])
    } catch (error) {
      console.error('Failed to refresh product warehouse data:', error)
    } finally {
      setLoading(false)
    }
  }
}

const handleAddTransaction = (newTx: Omit<ProductTransaction, 'id' | 'warehouseId'>) => {
  if (!selectedWarehouseId.value) return
  const tx: ProductTransaction = {
    ...newTx,
    id: `pt-${Date.now()}`,
    warehouseId: selectedWarehouseId.value
  }
  transactions.value.unshift(tx)
}

// Dialog Create/Edit Product Warehouse State
const createDialogVisible = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const editingWarehouseId = ref<string | null>(null)
const formRef = ref()

const form = ref({
  storage_name: '',
  storage_location: '',
  material_name: '',
  capacity: 0,
  quantity: 0
})

const rules = {
  storage_name: [
    { required: true, message: 'Vui lòng nhập tên kho', trigger: 'blur' }
  ],
  storage_location: [
    { required: true, message: 'Vui lòng nhập vị trí kho', trigger: 'blur' }
  ],
  material_name: [
    { required: true, message: 'Vui lòng chọn hoặc nhập nguyên liệu', trigger: 'change' }
  ],
  capacity: [
    { required: true, message: 'Vui lòng nhập sức chứa', trigger: 'blur' }
  ],
  quantity: [
    { required: true, message: 'Vui lòng nhập số lượng hiện tại', trigger: 'blur' }
  ]
}

const handleOpenCreateDialog = () => {
  isEdit.value = false
  editingWarehouseId.value = null
  form.value = {
    storage_name: '',
    storage_location: '',
    material_name: '',
    capacity: 0,
    quantity: 0
  }
  createDialogVisible.value = true
}

const handleOpenEditDialog = (wh: ProductWarehouse) => {
  isEdit.value = true
  editingWarehouseId.value = wh.id
  const capNum = parseFloat(wh.capacity.replace(/[^0-9]/g, '')) || 0
  form.value = {
    storage_name: wh.name,
    storage_location: wh.address,
    material_name: 'Cao su RSS3', // Default material for product warehouse
    capacity: capNum,
    quantity: wh.currentQty
  }
  createDialogVisible.value = true
}

const submitCreateWarehouse = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true
      try {
        if (isEdit.value && editingWarehouseId.value) {
          const payload = [
            {
              id: editingWarehouseId.value,
              material_name: form.value.material_name,
              quantity: form.value.quantity,
              storage_name: form.value.storage_name,
              storage_location: form.value.storage_location,
              capacity: form.value.capacity
            }
          ]
          await tienNgaService.updateInventories(payload)
          ElMessage.success('Cập nhật thông tin kho thành phẩm thành công!')
        } else {
          const payload = [
            {
              material_name: form.value.material_name,
              quantity: form.value.quantity,
              storage_name: form.value.storage_name,
              storage_location: form.value.storage_location,
              capacity: form.value.capacity
            }
          ]
          await tienNgaService.addInventories(payload)
          ElMessage.success('Tạo thêm kho thành phẩm mới thành công!')
        }
        createDialogVisible.value = false
        await fetchInventories()
      } catch (error: any) {
        ElMessage.error(error.message || (isEdit.value ? 'Cập nhật kho thành phẩm thất bại!' : 'Tạo kho thành phẩm thất bại!'))
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleDeleteWarehouse = (wh: ProductWarehouse) => {
  ElMessageBox.confirm(
    `Bạn có chắc chắn muốn xóa kho thành phẩm "${wh.name}" không?`,
    'Xác nhận xóa',
    {
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy bỏ',
      type: 'warning'
    }
  ).then(async () => {
    setLoading(true)
    try {
      await tienNgaService.deleteInventories([wh.id])
      ElMessage.success('Đã xóa kho thành phẩm thành công!')
      await fetchInventories()
    } catch (error: any) {
      ElMessage.error(error.message || 'Không thể xóa kho thành phẩm.')
    } finally {
      setLoading(false)
    }
  }).catch(() => {})
}
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(15px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-15px);
}
</style>
