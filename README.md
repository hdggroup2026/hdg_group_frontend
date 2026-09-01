# HDG Group - Frontend System

Hệ thống giao diện người dùng (Frontend) dành cho các nghiệp vụ quản lý của HDG Group, được xây dựng trên nền tảng **Vue 3 (Composition API)**, **Vite**, **TypeScript**, **Element Plus** và **Tailwind CSS**.

---

## 📖 Hướng dẫn nhanh

Dự án này kết nối với hệ thống Backend FastAPI thông qua proxy cấu hình động. Để thiết lập dự án trên máy cá nhân, cài đặt thư viện và chạy phát triển, vui lòng xem tài liệu hướng dẫn chi tiết tại:

👉 **[Hướng Dẫn Cài Đặt & Chạy Dự Án (docs/setup_and_run_guide.md)](file:///d:/ExtraJob/HDG_Group_Frontend/docs/setup_and_run_guide.md)**

---

## 🛠️ Công nghệ cốt lõi

* **Core**: Vue 3 (Composition API), TypeScript
* **Build Tool**: Vite 8
* **Styling**: Tailwind CSS & Element Plus (giao diện tối giản, tối ưu hóa trải nghiệm người dùng)
* **API Communication**: Native Fetch API kết hợp cấu hình proxy linh hoạt
* **Charts**: ApexCharts (Vue3-Apexcharts) hiển thị biểu đồ phân tích dữ liệu trực quan
* **Deployment**: Cấu hình sẵn cho Cloudflare Pages (wrangler.json)

---

## 📂 Các mô-đun nghiệp vụ chính

* 🌾 **Tiến Nga**: Quản lý thu mua mủ cao su, vật tư nguyên liệu, tài chính doanh nghiệp, kho bãi và nhân sự.
* 💸 **Hụi (Rosca)**: Quản lý chi tiết đóng hụi, thành viên tham gia, thống kê dòng tiền và lịch sử hốt hụi.
* 🚗 **Cho thuê (Rental)**: Quản lý danh mục xe cộ, bất động sản và các hợp đồng cho thuê.
* 💳 **Tín dụng (Credit)**: Quản lý hồ sơ vay vốn, tính toán gốc lãi và quản trị nhắc nợ.
* 📦 **Ggomoosin / Thu hoạch / Khác**: Các phân hệ quản lý sản xuất, tài sản thiết bị bổ trợ.
* 🔐 **Phân quyền (Authorization)**: Kiểm soát và quản lý phân quyền chi tiết cho quản trị viên và nhân viên.
<!-- MUC 449 -->
