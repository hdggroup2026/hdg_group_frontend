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

            <!-- MỤC 260 — báo lý do bị đá ra. -->
            <div v-if="doHetHan && !loiKhoa"
                 class="text-left bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 mb-2">
                <div class="text-xs text-blue-700 leading-relaxed">
                    ⏱ Bạn đã được đăng xuất vì máy để không quá 8 tiếng.
                    Vui lòng đăng nhập lại.
                </div>
            </div>

            <!-- MỤC 259 — hộp báo tài khoản bị khoá. KHÔNG tự tắt. -->
            <div v-if="loiKhoa"
                 class="text-left bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-2">
                <div class="text-sm font-semibold text-red-700 mb-1">
                    🔒 Tài khoản đã bị khoá
                </div>
                <div class="text-xs text-red-600 leading-relaxed">
                    {{ loiKhoa }}
                </div>
            </div>

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

// MỤC 259 — câu báo tài khoản bị khoá. Để riêng chứ không dùng ElMessage
// vì thông báo nổi tự tắt sau vài giây, mà câu này người dùng cần đọc kỹ.
const loiKhoa = ref('')

// MỤC 260 — bị đá ra vì để không quá 8 tiếng thì NÓI RÕ LÝ DO.
// Không nói thì người dùng tưởng hệ thống lỗi, hoặc tưởng bị ai đó
// đăng xuất hộ.
const doHetHan = ref(route.query.hethan === '1')

const handleLogin = async () => {
  loiKhoa.value = ''
  if (!form.username || !form.password) {
    ElMessage.warning('Vui lòng nhập tên đăng nhập và mật khẩu')
    return
  }

  loading.value = true
  try {
    await authService.login(form.username, form.password)
    ElMessage.success('Đăng nhập thành công!')

    // MỤC 259 (23/08/2026) — tài khoản chưa đổi thông tin lần đầu thì đi
    // thẳng màn đổi, KHÔNG về trang đã yêu cầu trước đó.
    if (authService.phaiDoiDangNhap()) {
      router.push('/doi-dang-nhap')
      return
    }

    const redirectPath = route.query.redirect || '/overview'
    router.push(redirectPath)
  } catch (error) {
    // MỤC 259 — TÁCH RIÊNG TRƯỜNG HỢP BỊ KHOÁ.
    //
    // Máy chủ trả câu tiếng Việt đầy đủ cho trường hợp khoá (sai 5 lần).
    // Nhét nó vào một ô báo lỗi nhỏ xíu tự tắt sau 3 giây thì người dùng
    // đọc không kịp, gõ lại lần nữa, và tưởng mình gõ sai mật khẩu.
    //
    // Nên hiện thành một hộp ĐỎ, KHÔNG TỰ TẮT, ngay trên nút đăng nhập.
    const cau = error?.message || ''
    if (cau.includes('khoá') || cau.includes('khóa') || cau.includes('5 lần')) {
      loiKhoa.value = cau
    } else {
      ElMessage.error(cau || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.')
    }
  } finally {
    loading.value = false
  }
}
</script>