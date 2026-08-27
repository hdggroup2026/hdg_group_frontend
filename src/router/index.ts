import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import LoginView from "@/components/auth/LoginView.vue";
import Dashboard from "@/views/dashboard/Dashboard.vue";
import NotFound from "@/views/error/NotFound.vue";
import NoPermission from "@/views/error/NoPermission.vue";
// MỤC 259 (23/08/2026) — màn đổi thông tin đăng nhập lần đầu
import DoiDangNhapLanDau from "@/components/auth/DoiDangNhapLanDau.vue";

// MỤC 255 (23/08/2026) — bảng dự án dùng chung, xem src/constants/duAn.ts
import { layQuyen, duocVao, danhSachDuocVao, timTheoDuong } from "@/constants/duAn";

const routes: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'login',
        component: LoginView,
        meta: { requiresAuth: false }
    },
    {
        path: '/register',
        name: 'register',
        component: LoginView,
        meta: { requiresAuth: false }
    },
    {
        path: '/forgot',
        name: 'forgot',
        component: LoginView,
        meta: { requiresAuth: false }
    },
    // MỤC 255 — Trang Chủ. Chỗ hạ cánh mặc định sau khi đăng nhập.
    {
        path: '/trang-chu',
        name: 'trang-chu',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    // MỤC 259 — đổi login name + mật khẩu lần đầu.
    // KHÔNG dùng Dashboard: người chưa đổi thì chưa nên thấy menu và dữ
    // liệu. Màn này đứng riêng, chỉ có hai đường ra — đổi xong, hoặc
    // đăng xuất.
    {
        path: '/doi-dang-nhap',
        name: 'doi-dang-nhap',
        component: DoiDangNhapLanDau,
        meta: { requiresAuth: true }
    },
    // MỤC 255 — báo chưa có quyền / không đọc được quyền.
    // KHÔNG dùng Dashboard vì Dashboard có thanh menu, mà người chưa có
    // quyền thì menu rỗng — nhìn như trang hỏng.
    {
        path: '/khong-co-quyen',
        name: 'khong-co-quyen',
        component: NoPermission,
        meta: { requiresAuth: true }
    },
    {
        path: '/tien-nga/:subview',
        name: 'tien-nga',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/ggomoosin/:subview',
        name: 'ggomoosin',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/rental/:subview',
        name: 'rental',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/credit/:subview',
        name: 'credit',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/harvest/:subview',
        name: 'harvest',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/other/:subview',
        name: 'other',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/telegram-projects/:subview',
        name: 'telegram-projects',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/rosca/:subview',
        name: 'rosca',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    // MỤC 263 — màn Nhật ký. Dùng Dashboard vì nó cần thanh menu.
    {
        path: '/nhat-ky',
        name: 'nhat-ky',
        component: Dashboard,
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/authorization',
        name: 'authorization',
        component: Dashboard,
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    // MỤC 339 (27/08/2026) — Hồ sơ người dùng.
    // Dùng Dashboard vì màn này cần thanh menu ở trên: xem xong hồ sơ
    // phải quay lại việc được ngay, không phải bấm nút Back.
    // KHÔNG có requiresAdmin: ai đăng nhập được cũng xem được hồ sơ của
    // chính mình.
    {
        path: '/ho-so',
        name: 'ho-so',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    // MỤC 255 — trang gốc và /overview nay về TRANG CHỦ.
    //
    // Trước đây cả hai chuyển thẳng vào /tien-nga/overall. Người không có
    // quyền Tiến Nga đăng nhập là rơi vào màn hình họ không được xem —
    // trống trơn, không lỗi, và họ tưởng hệ thống hỏng.
    {
        path: '/',
        redirect: '/trang-chu'
    },
    {
        path: '/overview',
        redirect: '/trang-chu'
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: NotFound
    }
]

import { authService } from "@/api/auth";

const router = createRouter({
    history: createWebHistory(), // Using HTML5 History Mode
    routes
})

/**
 * MỤC 255 (23/08/2026) — CHẶN THEO QUYỀN Ở ĐÂY, KHÔNG PHẢI CHỈ ẨN MENU.
 *
 * s68 chốt 23/08: "chặn luôn, chứ không phải ẩn".
 *
 * Ẩn menu chỉ làm sạch mắt — gõ thẳng /credit/... vào thanh địa chỉ là vẫn
 * vào được. Chốt chặn thật nằm ở đây: MỌI lần đổi trang đều đi qua hàm này,
 * kể cả gõ tay địa chỉ, kể cả bấm nút Back của trình duyệt.
 *
 * ⚠️ ĐÂY VẪN CHƯA PHẢI CHẶN TUYỆT ĐỐI. Nó chặn ở trình duyệt. Người biết
 * gọi thẳng đường API vẫn lấy được dữ liệu, vì máy chủ hiện chưa kiểm quyền
 * (xem tai_lieu_ai/55_TRANG_WEB.md — 249/251 đường không kiểm người gọi).
 * Chặn tuyệt đối phải gắn quyền ở máy chủ, đó là việc riêng.
 */
router.beforeEach(async (to, from, next) => {
    const isAuthenticated = authService.isAuthenticated();

    // ── Chưa đăng nhập ──
    if (to.meta.requiresAuth && !isAuthenticated) {
        next({ name: 'login', query: { redirect: to.fullPath } });
        return;
    }

    // ── Đã đăng nhập mà vào trang đăng nhập thì đá về Trang Chủ ──
    if ((to.name === 'login' || to.name === 'register' || to.name === 'forgot')
        && isAuthenticated) {
        next('/trang-chu');
        return;
    }

    // ── Trang không cần đăng nhập thì cho qua ──
    if (!to.meta.requiresAuth) {
        next();
        return;
    }

    // MỤC 259 — CHƯA ĐỔI THÔNG TIN LẦN ĐẦU THÌ CHẶN Ở ĐÂY.
    //
    // Đặt TRƯỚC cả bước đọc quyền: tài khoản mới tạo thường chưa được cấp
    // quyền gì, nên nếu để sau thì họ bị đá sang trang "chưa được cấp
    // quyền" và KHÔNG BAO GIỜ tới được màn đổi — kẹt cứng, phải nhờ quản
    // trị mà quản trị cũng không sửa được từ web.
    if (authService.phaiDoiDangNhap() && to.name !== 'doi-dang-nhap') {
        next({ name: 'doi-dang-nhap' });
        return;
    }
    // Đã đổi rồi mà vẫn mò vào màn đổi thì đá về Trang Chủ.
    if (!authService.phaiDoiDangNhap() && to.name === 'doi-dang-nhap') {
        next('/trang-chu');
        return;
    }
    if (to.name === 'doi-dang-nhap') {
        next();
        return;
    }

    // Trang báo lỗi quyền phải cho vào, không thì lặp vô tận.
    if (to.name === 'khong-co-quyen') {
        next();
        return;
    }

    const kq = await layQuyen();

    // 🔴 ĐỌC LỖI KHÔNG PHẢI LÀ "KHÔNG CÓ QUYỀN".
    // Mạng chập mà đá người ta ra trang "chưa được cấp quyền" thì cả công
    // ty tưởng bị thu hồi quyền. Đưa sang trang lỗi RIÊNG, có nút thử lại.
    if (kq.trangThai === 'loi') {
        next({ name: 'khong-co-quyen', query: { loi: kq.loi } });
        return;
    }

    const quyen = kq.quyen;

    // ── Không có quyền dự án nào (Trang Chủ không tính) ──
    const coDuAn = danhSachDuocVao(quyen).some((d) => d.duong !== '/trang-chu');
    if (!coDuAn) {
        next({ name: 'khong-co-quyen' });
        return;
    }

    // ── Màn Phân quyền: chỉ admin ──
    if (to.meta.requiresAdmin && !quyen.includes('admin')) {
        next('/trang-chu');
        return;
    }

    // ── Chặn đường dẫn không có quyền ──
    const duAn = timTheoDuong(to.path);
    if (duAn && !duocVao(duAn, quyen)) {
        // Đá về Trang Chủ chứ KHÔNG về "dự án đầu tiên": Trang Chủ ai cũng
        // vào được, còn dự án đầu tiên có thể cũng không có quyền nốt.
        next('/trang-chu');
        return;
    }

    next();
});

export default router