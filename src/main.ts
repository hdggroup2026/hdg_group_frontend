import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './assets/main.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(ElementPlus)
app.use(router)
app.mount('#app')

// ══════════════════════════════════════════════════════════════════════
// MỤC 260 (23/08/2026) — TỰ ĐĂNG XUẤT SAU 8 TIẾNG KHÔNG DÙNG
//
// Gắn ở đây chứ không gắn trong một màn hình nào: màn hình bị thay khi
// người dùng đi qua lại, còn cái này phải sống suốt phiên.
//
// ⚠️ Đây là khoá ở TRÌNH DUYỆT, không phải lớp bảo mật thật. Xem chú
// thích dài ở src/constants/tuDangXuat.ts trước khi tin nó.
// ══════════════════════════════════════════════════════════════════════
import { batTheoDoi } from './constants/tuDangXuat'
import { authService } from './api/auth'
import { xoaBoNhoQuyen } from './constants/duAn'

batTheoDoi(() => {
  // Chỉ đá ra nếu đang thật sự đăng nhập. Người đang đứng ở màn đăng
  // nhập mà bị "đăng xuất" thì thấy trang nhấp nháy vô cớ.
  if (!authService.isAuthenticated()) return
  xoaBoNhoQuyen()
  authService.logout()
  // Dùng location thay vì router: đá ra ngoài phải dứt khoát, xoá sạch
  // mọi thứ còn trong bộ nhớ trang.
  window.location.href = '/login?hethan=1'
})