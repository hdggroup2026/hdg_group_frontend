<template>
  <div class="warehouse-container h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <transition name="fade-slide" mode="out-in">
      <WarehouseList 
        v-if="currentView === 'list'" 
        :warehouses="warehouses" 
        @select-warehouse="handleSelectWarehouse" 
        @create-warehouse="handleOpenCreateDialog"
        @edit-warehouse="handleOpenEditDialog"
        @delete-warehouse="handleDeleteWarehouse"
      />
      <WarehouseDetail 
        v-else-if="currentView === 'detail' && selectedWarehouse" 
        :warehouse="selectedWarehouse!" 
        :purchases="getPurchasesForSelected"
        :exports="getExportsForSelected"
        @back="handleBack" 
        @add-purchase="handleAddPurchase"
        @add-export="handleAddExport"
        @refresh-purchases="handleRefreshPurchases"
      />
    </transition>

    <!-- Create/Edit Warehouse Dialog -->
    <el-dialog 
      v-model="createDialogVisible" 
      :title="isEdit ? 'CHỈNH SỬA THÔNG TIN KHO' : 'TẠO THÊM KHO'" 
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
                  <el-input v-model="form.storage_name" placeholder="Ví dụ: Kho Acid 2" />
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
                    filterable 
                    allow-create 
                    default-first-option
                    class="w-full"
                  >
                    <el-option label="Acid" value="Acid" />
                    <el-option label="Amoniac" value="Amoniac" />
                    <el-option label="Củi" value="Củi" />
                    <el-option label="Dầu ăn" value="Dầu ăn" />
                    <el-option label="Túi PE" value="Túi PE" />
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
import WarehouseList from './WarehouseList.vue'
import WarehouseDetail from './WarehouseDetail.vue'
import { tienNgaService } from '@/api/tienNgaService'

// Types
export interface Warehouse {
  id: string
  name: string
  material: string
  address: string
  capacity: string
  currentQty: number
  icon: string
  color: string
}

export interface PurchaseTransaction {
  id: string
  warehouseId: string
  date: string
  customerCode?: string
  customerName: string
  material: string
  warehouseName: string
  trips: number
  weight: number
  unitPrice: number
  totalAmount: number
  advanceAmount: number
  debt: number
  notes?: string
}

export interface ExportTransaction {
  id: string
  warehouseId: string
  date: string
  executor: string
  material: string
  warehouseName: string
  exportWeight: number
  remainingWeight: number
  notes?: string
}


// Color palette for warehouse cards
const warehouseColors = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']

// Warehouses - loaded from API
const warehouses = ref<Warehouse[]>([])

// Purchases - loaded from API when selecting a warehouse
const purchases = ref<PurchaseTransaction[]>([])

// Exports - loaded from API when selecting a warehouse
const exports = ref<ExportTransaction[]>([])

// Inject setLoading from parent
const setLoading = inject<(val: boolean) => void>('setLoading', () => {})

// Fetch inventories from API on mount
const fetchInventories = async () => {
  try {
    setLoading(true)
    const data = await tienNgaService.getInventories('!=Cao su')
    warehouses.value = data.map((item: any, index: number) => ({
      id: String(item.id || `wh-${index}`),
      name: item.storage_name || `Kho ${index + 1}`,
      material: item.material_name || '',
      address: item.storage_location || '',
      capacity: item.capacity ? `${new Intl.NumberFormat('vi-VN').format(item.capacity)} kg` : '0 kg',
      currentQty: item.quantity || 0,
      icon: 'Box',
      color: warehouseColors[index % warehouseColors.length] || '#ef4444'
    }))
  } catch (error) {
    console.error('Failed to fetch warehouse inventories:', error)
  } finally {
    setLoading(false)
  }
}

// Fetch material purchases from API by storage_name
const fetchMaterialPurchases = async (storageName: string, warehouseId: string) => {
  try {
    const data = await tienNgaService.getMaterialPurchases({ storage_name: storageName })
    purchases.value = data.map((item: any) => ({
      id: String(item.id),
      warehouseId: warehouseId,
      date: item.transaction_date || '',
      customerCode: item.customer_id || '',
      customerName: item.fullname || '',
      material: item.material_type || '',
      warehouseName: item.storage_name || '',
      trips: item.trip_count || 0,
      weight: item.weight || 0,
      unitPrice: item.unit_price || 0,
      totalAmount: item.total_amount || 0,
      advanceAmount: item.advance_payment || 0,
      debt: item.debt || 0,
      notes: item.notes || ''
    }))
  } catch (error) {
    console.error('Failed to fetch material purchases:', error)
  }
}

// Fetch inventory exports from API by storage_name
const fetchInventoryExports = async (storageName: string, warehouseId: string) => {
  try {
    const data = await tienNgaService.getInventoryExports({ storage_name: storageName })
    exports.value = data.map((item: any) => ({
      id: String(item.id),
      warehouseId: warehouseId,
      date: item.export_date || '',
      executor: item.performer_name || '',
      material: item.material_type || '',
      warehouseName: item.storage_name || '',
      exportWeight: item.export_weight || 0,
      remainingWeight: item.remaining_weight || 0,
      notes: item.notes || ''
    }))
  } catch (error) {
    console.error('Failed to fetch inventory exports:', error)
  }
}

onMounted(() => {
  fetchInventories()
})

// Navigation State
const currentView = ref<'list' | 'detail'>('list')
const selectedWarehouseId = ref<string | null>(null)

const selectedWarehouse = computed(() => {
  return warehouses.value.find(w => w.id === selectedWarehouseId.value) || null
})

const getPurchasesForSelected = computed(() => {
  if (!selectedWarehouseId.value) return []
  return purchases.value.filter(p => p.warehouseId === selectedWarehouseId.value)
})

const getExportsForSelected = computed(() => {
  if (!selectedWarehouseId.value) return []
  return exports.value.filter(e => e.warehouseId === selectedWarehouseId.value)
})

// Handlers
const handleSelectWarehouse = async (id: string) => {
  selectedWarehouseId.value = id
  const wh = warehouses.value.find(w => w.id === id)
  if (wh) {
    setLoading(true)
    try {
      await Promise.all([
        fetchMaterialPurchases(wh.name, id),
        fetchInventoryExports(wh.name, id)
      ])
    } finally {
      setLoading(false)
    }
  }
  currentView.value = 'detail'
}

const handleBack = () => {
  currentView.value = 'list'
  selectedWarehouseId.value = null
  purchases.value = []
  exports.value = []
}

const handleRefreshPurchases = async () => {
  if (!selectedWarehouseId.value) return
  const wh = warehouses.value.find(w => w.id === selectedWarehouseId.value)
  if (wh) {
    await Promise.all([
      fetchMaterialPurchases(wh.name, selectedWarehouseId.value),
      fetchInventoryExports(wh.name, selectedWarehouseId.value),
      fetchInventories()
    ])
  }
}

const handleAddPurchase = (newTx: Omit<PurchaseTransaction, 'id' | 'warehouseId'>) => {
  if (!selectedWarehouseId.value) return
  const tx: PurchaseTransaction = {
    ...newTx,
    id: `p-${Date.now()}`,
    warehouseId: selectedWarehouseId.value
  }
  purchases.value.unshift(tx)
}

const handleAddExport = (newTx: Omit<ExportTransaction, 'id' | 'warehouseId'>) => {
  if (!selectedWarehouseId.value) return
  const tx: ExportTransaction = {
    ...newTx,
    id: `e-${Date.now()}`,
    warehouseId: selectedWarehouseId.value
  }
  exports.value.unshift(tx)
}

// Dialog Create/Edit Warehouse State
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

const handleOpenEditDialog = (wh: Warehouse) => {
  isEdit.value = true
  editingWarehouseId.value = wh.id
  const capNum = parseFloat(wh.capacity.replace(/[^0-9]/g, '')) || 0
  form.value = {
    storage_name: wh.name,
    storage_location: wh.address,
    material_name: wh.material,
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
          ElMessage.success('Cập nhật thông tin kho thành công!')
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
          ElMessage.success('Tạo thêm kho mới thành công!')
        }
        createDialogVisible.value = false
        await fetchInventories()
      } catch (error: any) {
        ElMessage.error(error.message || (isEdit.value ? 'Cập nhật kho thất bại!' : 'Tạo kho thất bại!'))
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleDeleteWarehouse = (wh: Warehouse) => {
  ElMessageBox.confirm(
    `Bạn có chắc chắn muốn xóa kho "${wh.name}" không?`,
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
      ElMessage.success('Đã xóa kho thành công!')
      await fetchInventories()
    } catch (error: any) {
      ElMessage.error(error.message || 'Không thể xóa kho.')
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
