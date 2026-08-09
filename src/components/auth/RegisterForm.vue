<template>
    <div class="bg-white/3 backdrop-blur-lg border border-white/40 p-10 rounded-[40px] shadow-2xl w-[400px] text-center">
        <div class="flex justify-center mb-2">
            <div class="bg-[#004274] p-3 rounded-full text-white">
                <el-icon :size="40"><User /></el-icon>
            </div>
        </div>

        <h2 class="text-4xl font-light text-[#004274] mb-8">Đăng ký</h2>

        <el-form @submit.prevent="handleRegister">
            <FormInput v-model="form.username" placeholder="Tên đăng nhập" />
            <FormInput v-model="form.employee_id" placeholder="Mã nhân viên" />
            <FormInput v-model="form.password" type="password" placeholder="Mật khẩu" />
            <FormInput v-model="form.confirmPassword" type="password" placeholder="Xác nhận mật khẩu" />

            <div class="text-center mt-6 mb-8">
                <p class="text-sm text-gray-500">
                    Đã có tài khoản?
                    <span @click="$emit('switch', 'login')" class="text-[#004274] font-bold cursor-pointer hover:underline">
                        Đăng nhập
                    </span>
                </p>
            </div>

            <PrimaryButton native-type="submit" :loading="loading">Đăng ký</PrimaryButton>
        </el-form>
    </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import FormInput from './FormInput.vue'
import PrimaryButton from './PrimaryButton.vue'
import { authService } from '@/api/auth'

const emit = defineEmits(['switch'])
const router = useRouter()

const loading = ref(false)

const form = reactive({
  username: '',
  employee_id: '',
  password: '',
  confirmPassword: ''
})

const handleRegister = async () => {
  // Client-side validations
  if (!form.username || !form.employee_id || !form.password || !form.confirmPassword) {
    ElMessage.warning('Vui lòng nhập đầy đủ thông tin đăng ký')
    return
  }

  if (form.password !== form.confirmPassword) {
    ElMessage.warning('Mật khẩu và xác nhận mật khẩu không khớp')
    return
  }

  loading.value = true
  try {
    await authService.register({
      username: form.username,
      password: form.password,
      employee_id: form.employee_id,
      role: 'employee'
    })

    ElMessage.success('Đăng ký tài khoản thành công!')
    // Redirect to login page
    router.push('/login')
  } catch (error) {
    ElMessage.error(error.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.')
  } finally {
    loading.value = false
  }
}
</script>

