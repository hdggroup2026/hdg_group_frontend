<template>
  <div class="projects-list-container h-full p-6 overflow-y-auto flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <!-- Sub-header & Action Bar -->
    <div class="flex items-center justify-between mb-6 shrink-0">
      <h3 class="text-lg font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <span class="w-2.5 h-2.5 bg-blue-500 dark:bg-blue-400 rounded-full"></span>
        Danh Sách Dự Án
        <span class="ml-2 text-xs text-gray-400 dark:text-gray-500 font-semibold bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
          {{ projects.length }}
        </span>
      </h3>
      <el-button 
        type="primary" 
        class="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 border-none rounded-xl font-semibold shadow-md transition-all duration-300 hover:shadow-lg text-white"
        @click="handleOpenCreateDialog"
      >
        <el-icon class="mr-2"><Plus /></el-icon>
        Tạo dự án mới
      </el-button>
    </div>

    <!-- Project Cards Grid -->
    <div v-loading="loading" class="flex-1 min-h-0 overflow-y-auto">
      <div v-if="projects.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 p-1">
        <div 
          v-for="(proj, idx) in projects" 
          :key="proj.id" 
          class="group relative rounded-2xl border border-gray-100 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        >
          <!-- Card Header -->
          <div class="flex items-start gap-3">
            <div 
              class="p-2.5 rounded-xl text-white shadow-sm flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" 
              :style="{ backgroundColor: getCardColor(idx) }"
            >
              <el-icon :size="20"><Connection /></el-icon>
            </div>
            <div class="flex-1 min-w-0 text-left">
              <div class="flex items-center justify-between gap-1">
                <h4 class="font-bold text-gray-800 dark:text-gray-100 text-[15px] line-clamp-2 leading-snug flex-1">
                  {{ proj.project_name }}
                </h4>
                
                <!-- Dropdown Action Menu -->
                <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, proj)">
                  <el-button link type="info" class="p-1 !text-gray-400 hover:!text-gray-600 dark:hover:!text-gray-200">
                    <el-icon :size="16"><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">Đổi tên</el-dropdown-item>
                      <el-dropdown-item command="delete" divided class="!text-red-500">Xóa</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
              <div class="text-[11px] text-gray-400 mt-2">
                ID: {{ proj.id.substring(0, 8) }}...
              </div>
            </div>
          </div>

          <!-- Card footer -->
          <div class="mt-4 pt-3 border-t border-gray-50 dark:border-gray-700/40 flex items-center justify-between text-[11px] font-semibold text-blue-600 dark:text-blue-400 opacity-70 group-hover:opacity-100 transition-opacity">
            <span>Dự án Telegram</span>
            <el-icon class="ml-1 transition-transform duration-300 group-hover:translate-x-1"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
        <el-icon class="text-6xl mb-4"><Connection /></el-icon>
        <p class="text-lg">Chưa có dự án nào được tạo</p>
        <el-button type="primary" link class="mt-2" @click="handleOpenCreateDialog">Tạo dự án đầu tiên</el-button>
      </div>
    </div>

    <!-- Create/Edit Project Dialog -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? 'CHỈNH SỬA TÊN DỰ ÁN' : 'TẠO DỰ ÁN MỚI'" 
      width="450px" 
      destroy-on-close 
      align-center
      class="custom-dark-dialog"
    >
      <el-form 
        :model="form" 
        :rules="rules" 
        ref="formRef" 
        label-position="top"
        class="mt-2"
        @submit.prevent="submitForm"
      >
        <el-form-item label="Tên dự án" prop="project_name" required>
          <el-input v-model="form.project_name" placeholder="Ví dụ: Dự án Tây Nguyên" autofocus />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="flex justify-end gap-3 pr-2">
          <el-button @click="dialogVisible = false">Hủy</el-button>
          <el-button 
            type="primary" 
            @click="submitForm" 
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
import { ref, onMounted, reactive } from 'vue'
import { Plus, MoreFilled, Connection, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { tienNgaService } from '@/api/tienNgaService'

interface Project {
  id: string
  project_name: string
}

// State
const projects = ref<Project[]>([])
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingProjectId = ref<string | null>(null)
const formRef = ref()

const form = reactive({
  project_name: ''
})

const rules = {
  project_name: [
    { required: true, message: 'Vui lòng nhập tên dự án', trigger: 'blur' },
    { min: 3, message: 'Tên dự án phải từ 3 ký tự trở lên', trigger: 'blur' }
  ]
}

// Color palette
const cardColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6']
const getCardColor = (index: number) => {
  return cardColors[index % cardColors.length]
}

// Fetch Projects
const fetchProjects = async () => {
  loading.value = true
  try {
    const data = await tienNgaService.getProjects()
    projects.value = data
  } catch (error: any) {
    console.error(error)
    ElMessage.error(error.message || 'Lỗi khi tải danh sách dự án')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProjects()
})

// Handlers
const handleOpenCreateDialog = () => {
  isEdit.value = false
  editingProjectId.value = null
  form.project_name = ''
  dialogVisible.value = true
}

const handleOpenEditDialog = (proj: Project) => {
  isEdit.value = true
  editingProjectId.value = proj.id
  form.project_name = proj.project_name
  dialogVisible.value = true
}

const handleCommand = (cmd: string, proj: Project) => {
  if (cmd === 'edit') {
    handleOpenEditDialog(proj)
  } else if (cmd === 'delete') {
    handleDelete(proj)
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true
      try {
        if (isEdit.value && editingProjectId.value) {
          const payload = [{
            id: editingProjectId.value,
            project_name: form.project_name.trim()
          }]
          await tienNgaService.updateProjects(payload)
          ElMessage.success('Cập nhật tên dự án thành công!')
        } else {
          const payload = [{
            project_name: form.project_name.trim()
          }]
          await tienNgaService.addProjects(payload)
          ElMessage.success('Tạo dự án mới thành công!')
        }
        dialogVisible.value = false
        await fetchProjects()
      } catch (error: any) {
        ElMessage.error(error.message || 'Không thể thực hiện yêu cầu')
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleDelete = (proj: Project) => {
  ElMessageBox.confirm(
    `Bạn có chắc chắn muốn xóa dự án "${proj.project_name}" không?`,
    'Xác nhận xóa dự án',
    {
      confirmButtonText: 'Đòng ý',
      cancelButtonText: 'Hủy bỏ',
      type: 'warning'
    }
  ).then(async () => {
    loading.value = true
    try {
      await tienNgaService.deleteProjects([proj.id])
      ElMessage.success('Đã xóa dự án thành công!')
      await fetchProjects()
    } catch (error: any) {
      ElMessage.error(error.message || 'Không thể xóa dự án.')
    } finally {
      loading.value = false
    }
  }).catch(() => {})
}
</script>

<style scoped>
</style>

