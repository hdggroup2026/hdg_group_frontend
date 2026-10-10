<!--
  MỤC 698 / 700 — HỘP GẮN APP CHO MỘT MÁY (dùng chung Điện thoại / Máy tính
  bảng / Laptop). Tick = gắn, bỏ tick = gỡ (máy chủ ĐẶT LẠI theo danh sách gửi).
  Mở ra là tải lại danh sách: app có thể vừa đổi ở màn Quản lý App.
-->
<template>
  <el-dialog :model-value="modelValue" :width="hep ? '95%' : '560px'" align-center destroy-on-close
             @update:model-value="(v: boolean) => emit('update:modelValue', v)" @open="mo">
    <template #header>
      <span class="font-bold">GẮN APP CHO <span class="text-blue-600">{{ may?.id }}</span></span>
      <span class="ml-2 text-sm text-gray-500">{{ may?.model_name }}</span>
    </template>
    <el-input v-model="tuKhoa" placeholder="Tìm tên app, tài khoản…" clearable class="mb-3" />
    <div v-loading="dangTai" class="max-h-[55vh] overflow-y-auto">
      <el-checkbox-group v-model="dangChon" class="w-full">
        <div v-for="a in daLoc" :key="a.id"
             class="flex items-center gap-2 py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
          <el-checkbox :value="a.id" class="!mr-0">
            <span class="font-medium uppercase">{{ a.app_name }}</span>
            <span class="ml-2 font-mono text-[11px] text-gray-400">{{ a.id }}</span>
          </el-checkbox>
          <span class="ml-auto text-xs text-gray-500 break-all text-right min-w-0">{{ a.account_email || '' }}</span>
        </div>
      </el-checkbox-group>
      <div v-if="!daLoc.length" class="text-center text-gray-400 py-6 text-sm">Không có app nào khớp.</div>
    </div>
    <template #footer>
      <span class="text-sm text-gray-400 mr-3">Đã chọn: <b>{{ dangChon.length }}</b> app</span>
      <el-button @click="emit('update:modelValue', false)">Hủy</el-button>
      <el-button type="primary" :loading="dangLuu" @click="luu">Lưu</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { otherService } from '@/api/otherService'

const props = defineProps<{
  modelValue: boolean
  may: any
  loai: string
  dsApp: any[]
  appCuaMay: any[]
  napLai: () => Promise<void>
  hep?: boolean
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const tuKhoa = ref('')
const dangChon = ref<string[]>([])
const dangTai = ref(false)
const dangLuu = ref(false)

const daLoc = computed(() => {
  const k = tuKhoa.value.trim().toLowerCase()
  if (!k) return props.dsApp
  return props.dsApp.filter((a: any) =>
    [a.app_name, a.id, a.account_email].some((v) => String(v || '').toLowerCase().includes(k)))
})

const mo = async () => {
  tuKhoa.value = ''
  dangTai.value = true
  await props.napLai()
  dangChon.value = props.appCuaMay.map((a: any) => a.id)
  dangTai.value = false
}

const luu = async () => {
  if (!props.may) return
  dangLuu.value = true
  try {
    const kq = await otherService.setAppsOfDevice(props.may.id, dangChon.value, props.loai)
    ElMessage.success(`Đã lưu: thêm ${kq?.them ?? 0}, gỡ ${kq?.go ?? 0} app.`)
    emit('update:modelValue', false)
    await props.napLai()
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không lưu được.')
  } finally {
    dangLuu.value = false
  }
}
</script>
