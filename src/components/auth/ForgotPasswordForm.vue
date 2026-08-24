<!--
  MỤC 266 (23/08/2026) — MÀN "QUÊN MẬT KHẨU" NAY NỐI THẬT VỚI MÁY CHỦ.

  🔴 TRƯỚC ĐÓ MÀN NÀY LÀ MÀN GIẢ.

  Bản cũ hỏi "địa chỉ email", và hàm xử lý chỉ có đúng một dòng:

      console.log('Reset link for:', form.email)

  Tức là bấm nút thì KHÔNG GỬI ĐI ĐÂU CẢ. Không gọi máy chủ, không báo
  ai, không có gì xảy ra. Người dùng bấm xong ngồi chờ email không bao
  giờ tới.

  Và nó hỏi EMAIL trong khi hệ thống đăng nhập bằng TÊN ĐĂNG NHẬP — hệ
  thống không hề lưu email của ai.

  NAY: gọi thật /auth/forgot-password. Máy chủ gửi tin về nhóm Operation
  Center kèm nút "Cấp lại mật khẩu" (MỤC 261).

  ⚠️ MÁY CHỦ CỐ Ý TRẢ CÙNG MỘT CÂU dù tài khoản có thật hay không — để
  không ai dùng màn này làm công cụ dò tên đăng nhập. Nên màn này KHÔNG
  được hiện "không tìm thấy tài khoản" trong bất kỳ trường hợp nào.
-->
<template>
    <div class="bg-white/3 backdrop-blur-lg border border-white/40 p-10 rounded-[40px] shadow-2xl w-[400px] text-center">
        <div class="flex justify-center mb-2">
            <div class="bg-[#004274] p-3 rounded-full text-white">
                <el-icon :size="40"><Lock /></el-icon>
            </div>
        </div>

        <h2 class="text-4xl font-light text-[#004274] mb-6">Quên mật khẩu?</h2>

        <template v-if="daGui">
            <div class="text-left bg-green-50 border border-green-200 rounded-2xl px-4 py-4 mb-6">
                <div class="text-sm font-semibold text-green-800 mb-2">
                    ✓ Đã gửi yêu cầu
                </div>
                <div class="text-xs text-green-700 leading-relaxed">
                    Yêu cầu đã được gửi tới quản trị viên.
                    <br /><br />
                    Vui lòng <b>liên hệ quản trị</b> để nhận mật khẩu tạm.
                    Đăng nhập bằng mật khẩu đó, hệ thống sẽ yêu cầu bạn đặt
                    mật khẩu mới ngay.
                </div>
            </div>
            <span @click="$emit('switch', 'login')"
                  class="text-[#004274] font-bold cursor-pointer hover:underline text-sm">
                Quay lại đăng nhập
            </span>
        </template>

        <template v-else>
            <p class="text-sm text-gray-500 mb-8 leading-relaxed">
                Nhập <b>tên đăng nhập</b> của bạn. Yêu cầu sẽ được gửi tới
                quản trị viên để cấp lại mật khẩu.
            </p>

            <el-form @submit.prevent="guiYeuCau">
                <FormInput v-model="form.tenDangNhap" placeholder="Tên đăng nhập" />

                <div v-if="loi"
                     class="text-left bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mt-3 mb-1">
                    <div class="text-xs text-red-600 leading-relaxed">{{ loi }}</div>
                </div>

                <div class="text-center mt-6 mb-8">
                    <span @click="$emit('switch', 'login')"
                          class="text-[#004274] font-bold cursor-pointer hover:underline text-sm">
                        Quay lại đăng nhập
                    </span>
                </div>

                <PrimaryButton @click="guiYeuCau">
                    {{ dangGui ? 'Đang gửi…' : 'Gửi yêu cầu' }}
                </PrimaryButton>
            </el-form>
        </template>
    </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { Lock } from '@element-plus/icons-vue'
import FormInput from './FormInput.vue'
import PrimaryButton from './PrimaryButton.vue'
import { getApiUrl } from '@/api/apiConfig'

const emit = defineEmits(['switch'])

const form = reactive({ tenDangNhap: '' })
const dangGui = ref(false)
const daGui = ref(false)
const loi = ref('')

const guiYeuCau = async () => {
  loi.value = ''
  if (!form.tenDangNhap.trim()) {
    loi.value = 'Vui lòng nhập tên đăng nhập.'
    return
  }
  if (dangGui.value) return

  dangGui.value = true
  try {
    const baseUrl = await getApiUrl()
    const r = await fetch(`${baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      // Máy chủ vẫn nhận trường new_password theo dạng cũ, nhưng từ MỤC
      // 261 nó KHÔNG dùng tới — không đổi mật khẩu nữa. Gửi chuỗi rỗng
      // cho đúng dạng dữ liệu máy chủ mong đợi.
      body: JSON.stringify({
        username: form.tenDangNhap.trim(),
        new_password: '',
      }),
    })

    if (!r.ok) {
      // 🔴 Đọc lỗi KHÁC "không có tài khoản này".
      // Máy chủ cố ý trả cùng một câu dù tài khoản có thật hay không, nên
      // mọi mã lỗi ở đây đều là trục trặc kết nối — nói đúng như vậy thay
      // vì để người dùng tưởng mình gõ sai tên.
      loi.value = 'Không gửi được yêu cầu (mã ' + r.status + '). '
        + 'Đây là lỗi kết nối, không phải do tên đăng nhập sai. '
        + 'Vui lòng thử lại hoặc liên hệ quản trị.'
      return
    }

    daGui.value = true
  } catch (e) {
    loi.value = 'Không gửi được yêu cầu: ' + (e && e.message ? e.message : 'lỗi kết nối')
      + '. Vui lòng liên hệ quản trị.'
  } finally {
    dangGui.value = false
  }
}
</script>
