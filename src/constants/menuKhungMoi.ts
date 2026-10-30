/**
 * MỤC 722 (30/10/2026) — G4: MỤC CON CỦA TỪNG DỰ ÁN cho thanh trái chung (khung mới).
 *
 * Đường dẫn + nhãn chép ĐÚNG từ `sidebarMenuItems` / `indexMap` của từng
 * `components/<DuAn>/Index.vue` (bản 30/10). Thêm mục con ở một dự án thì thêm cả ở đây —
 * có ca kiểm đối chiếu (tests/test_muc_722_khung_moi.py phía backend đọc cả hai file).
 *
 * Tiến Nga KHÔNG có ở đây: s68 29/10 "khoan đụng Tiến Nga, kế toán đã dùng quen" ⇒ vào Tiến
 * Nga là quay về khung cũ nguyên vẹn (Dashboard.vue).
 */
export interface MucCon {
  label: string
  duong: string
}

export const MUC_CON: Record<string, MucCon[]> = {
  Ggomoosin: [{ label: 'Nhân sự', duong: '/ggomoosin/hr' }],
  Rental: [
    { label: 'Quản lý Bất động sản', duong: '/rental/real-estate' },
    { label: 'Quản lý hợp đồng', duong: '/rental/rental-contract' },
    { label: 'Quản lý Thông báo', duong: '/rental/scheduled-notifications' },
  ],
  Credit: [
    { label: 'Quản lý mã vay', duong: '/credit/contract-management' },
    { label: 'Quản lý Thông báo', duong: '/credit/scheduled-notifications' },
  ],
  'Thu hoạch': [
    { label: 'Thu hoạch Cao su', duong: '/harvest/rubber' },
    { label: 'Thu hoạch Sầu riêng', duong: '/harvest/durian' },
  ],
  'Hụi': [
    { label: 'Người chơi', duong: '/rosca/players' },
    { label: 'Danh sách Hụi', duong: '/rosca/list' },
    { label: 'Quản lý Thông báo', duong: '/rosca/scheduled-notifications' },
  ],
  Other: [
    { label: 'Quản lý Thiết bị', duong: '/other/devices' },
    { label: 'Quản lý Phương tiện', duong: '/other/vehicles' },
    { label: 'Quản lý Hình ảnh, Giấy tờ', duong: '/other/documents' },
    { label: 'Quản lý App', duong: '/other/apps' },
  ],
}

/** Màu chấm cạnh tên dự án — cùng bảng màu trang Danh sách lệnh. */
export const MAU_DU_AN: Record<string, string> = {
  'Tiến Nga': '#2f6f43',
  Ggomoosin: '#1f8a8a',
  Rental: '#2c6fb7',
  Credit: '#7a4fb5',
  'Thu hoạch': '#c9a24a',
  'Hụi': '#b9382b',
  Other: '#68726a',
}

/** Mục thuộc khối QUẢN TRỊ (còn lại là dự án). Tên hiện có thể khác tên trong DU_AN. */
export const QUAN_TRI: Record<string, string> = {
  'Dự án Telegram': 'Nhóm Telegram',
  'Nhật ký': 'Nhật ký hệ thống',
  'Phân quyền': 'Phân quyền',
  'Danh sách lệnh': 'Danh sách lệnh',
  'Sơ đồ vận hành': 'Sơ đồ vận hành',
}

/** Khoá localStorage của công tắc "giao diện mới". Mặc định TẮT cho tới khi s68 duyệt G4. */
export const KHOA_KHUNG_MOI = 'hdg_khung_moi'
