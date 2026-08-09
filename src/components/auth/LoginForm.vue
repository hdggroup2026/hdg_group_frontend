<template>
    <div class="bg-white/3 backdrop-blur-lg border border-white/40 p-10 rounded-[40px] shadow-2xl w-[400px] text-center">
        <div class="flex justify-center mb-2">
            <div class="bg-[#004274] p-3 rounded-full text-white">
                <el-icon :size="40"><User /></el-icon>
            </div>
        </div>

        <h2 class="text-4xl font-light text-[#004274] mb-8">Đăng nhập</h2>

        <el-form @submit.prevent="handleLogin">
            <FormInput v-model="form.username" placeholder="Tên đăng nhập" />
            
            <FormInput v-model="form.password" type="password" placeholder="Mật khẩu" />

            <div class="flex flex-col space-y-4 text-center mt-2 mb-8">
                <span @click="$emit('switch', 'forgot')" class="text-[#004274] text-sm opacity-80 hover:opacity-100 cursor-pointer hover:underline transition-all">
                    Quên mật khẩu?
                </span>
                
                <!-- <p class="text-sm text-gray-500">
                    Chưa có tài khoản?
                    <span @click="$emit('switch', 'register')" class="text-[#004274] font-bold cursor-pointer hover:underline">
                        Đăng ký
                    </span>
                </p> -->
            </div>

            <PrimaryButton native-type="submit" :loading="loading">Đăng nhập</PrimaryButton>
        </el-form>
    </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import FormInput from './FormInput.vue'
import PrimaryButton from './PrimaryButton.vue'
import { authService } from '@/api/auth'

const emit = defineEmits(['switch'])
const router = useRouter()
const route = useRoute()
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const handleLogin = async () => {
  if (!form.username || !form.password) {
    ElMessage.warning('Vui lòng nhập tên đăng nhập và mật khẩu')
    return
  }

  loading.value = true
  try {
    await authService.login(form.username, form.password)
    ElMessage.success('Đăng nhập thành công!')
    const redirectPath = route.query.redirect || '/overview'
    router.push(redirectPath)
  } catch (error) {
    ElMessage.error(error.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.')
  } finally {
    loading.value = false
  }
}
</script>