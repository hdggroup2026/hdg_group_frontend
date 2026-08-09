<template>
    <div class="bg-white/3 backdrop-blur-lg border border-white/40 p-10 rounded-[40px] shadow-2xl w-[400px] text-center">
        <div class="flex justify-center mb-2">
            <div class="bg-[#004274] p-3 rounded-full text-white">
                <el-icon :size="40"><Lock /></el-icon>
            </div>
        </div>

        <h2 class="text-4xl font-light text-[#004274] mb-8">Quên mật khẩu?</h2>
        <p class="text-sm text-gray-500 mb-8">Vui lòng nhập địa chỉ email của bạn để nhận liên kết khôi phục mật khẩu.</p>

        <el-form @submit.prevent="handleReset">
            <FormInput v-model="form.email" placeholder="Email" />

            <div class="text-center mt-6 mb-8">
                <span @click="$emit('switch', 'login')" class="text-[#004274] font-bold cursor-pointer hover:underline text-sm">
                    Quay lại đăng nhập
                </span>
            </div>

            <PrimaryButton @click="handleReset">Gửi liên kết khôi phục</PrimaryButton>
        </el-form>
    </div>
</template>

<script setup>
import { reactive } from 'vue'
import { Lock } from '@element-plus/icons-vue'
import FormInput from './FormInput.vue'
import PrimaryButton from './PrimaryButton.vue'

const emit = defineEmits(['switch'])

const form = reactive({
  email: ''
})

const handleReset = () => {
  console.log('Reset link for:', form.email)
}
</script>
