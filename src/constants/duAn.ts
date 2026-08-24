/**
 * MỤC 255 (23/08/2026) — BẢNG DỰ ÁN VÀ QUYỀN, MỘT NGUỒN DUY NHẤT.
 *
 * VÌ SAO PHẢI GOM VÀO ĐÂY:
 *
 * Trước MỤC 255, danh sách dự án nằm ở BỐN chỗ khác nhau, mỗi chỗ viết tay:
 *   - Navigation.vue     danh sách hiện trên thanh menu
 *   - router/index.ts    danh sách đường dẫn
 *   - Dashboard.vue      map đường dẫn -> tên dự án
 *   - Dashboard.vue      map tên dự án -> đường dẫn mặc định
 *
 * Thêm một dự án mới mà quên một trong bốn chỗ thì hỏng IM LẶNG: menu có
 * nhưng bấm không đi đâu, hoặc đi được nhưng menu không sáng lên. Không có
 * lỗi nào báo.
 *
 * Nay cả bốn chỗ đọc từ bảng DU_AN dưới đây. Thêm dự án = thêm một dòng.
 */

import { authService } from '@/api/auth'

export interface DuAn {
  /** Tên hiện trên menu */
  ten: string
  /** Khoá quyền trong hệ thống. null = ai đăng nhập cũng vào được. */
  khoaQuyen: string | null
  /** Tiền tố đường dẫn, dùng để nhận ra đang ở dự án nào */
  duong: string
  /** Đường dẫn đầy đủ khi bấm vào menu */
  duongMacDinh: string
  /** true = chỉ người có quyền 'admin' mới thấy */
  chiAdmin?: boolean
}

/**
 * ⚠️ KHOÁ QUYỀN PHẢI KHỚP CHÍNH XÁC với khoá backend dùng.
 * Danh sách khoá lấy từ màn Phân quyền (Authorization/Index.vue):
 *   admin · tien-nga · ggomoosin · rental · credit · harvest
 *   project · vehicle · document · attendance · other · rosca
 *
 * Gõ sai một chữ thì người có quyền vẫn bị chặn, mà không có lỗi nào báo.
 */
export const DU_AN: DuAn[] = [
  {
    ten: 'Trang Chủ',
    // Trang chủ KHÔNG khoá quyền: ai đăng nhập được thì vào được.
    // Nó là chỗ hạ cánh an toàn khi người dùng không có quyền dự án nào.
    khoaQuyen: null,
    duong: '/trang-chu',
    duongMacDinh: '/trang-chu',
  },
  { ten: 'Tiến Nga',  khoaQuyen: 'tien-nga',  duong: '/tien-nga',  duongMacDinh: '/tien-nga/overall' },
  { ten: 'Ggomoosin', khoaQuyen: 'ggomoosin', duong: '/ggomoosin', duongMacDinh: '/ggomoosin/hr' },
  { ten: 'Rental',    khoaQuyen: 'rental',    duong: '/rental',    duongMacDinh: '/rental/real-estate' },
  { ten: 'Credit',    khoaQuyen: 'credit',    duong: '/credit',    duongMacDinh: '/credit/contract-management' },
  { ten: 'Thu hoạch', khoaQuyen: 'harvest',   duong: '/harvest',   duongMacDinh: '/harvest/rubber' },
  { ten: 'Hụi',       khoaQuyen: 'rosca',     duong: '/rosca',     duongMacDinh: '/rosca/players' },
  { ten: 'Other',     khoaQuyen: 'other',     duong: '/other',     duongMacDinh: '/other/devices' },
  {
    // s68 chốt 23/08: Dự án Telegram CHỈ owner/admin thấy.
    // Không có khoá quyền riêng cho nó trong danh sách backend, nên khoá
    // bằng cờ chiAdmin thay vì bịa ra một khoá không tồn tại.
    ten: 'Dự án Telegram',
    khoaQuyen: null,
    chiAdmin: true,
    duong: '/telegram-projects',
    duongMacDinh: '/telegram-projects/telegram-groups-list',
  },
  {
    // MỤC 263 (23/08/2026) — Nhật ký. Chỉ admin, vì bảng này cho biết ai
    // đăng nhập lúc nào từ đâu và ai sửa gì — để kế toán xem được nhau
    // thì thành công cụ soi mói, không phải công cụ quản lý.
    ten: 'Nhật ký',
    khoaQuyen: null,
    chiAdmin: true,
    duong: '/nhat-ky',
    duongMacDinh: '/nhat-ky',
  },
  {
    ten: 'Phân quyền',
    khoaQuyen: null,
    chiAdmin: true,
    duong: '/authorization',
    duongMacDinh: '/authorization',
  },
]

/**
 * Kết quả đọc quyền. BA trạng thái, không phải hai.
 *
 * 🔴 "đọc lỗi" KHÔNG BAO GIỜ được hiểu là "không có quyền nào".
 *
 * Trống  = chắc chắn người này chưa được cấp quyền  -> hiện trang hướng dẫn
 * Lỗi    = KHÔNG BIẾT GÌ CẢ (mạng hỏng, máy chủ chết) -> hiện trang thử lại
 *
 * Gộp hai cái làm một thì mạng chập một cái là cả công ty thấy
 * "Chưa được cấp quyền" và tưởng bị thu hồi quyền.
 */
export type KetQuaQuyen =
  | { trangThai: 'xong'; quyen: string[] }
  | { trangThai: 'loi'; loi: string }

let boNho: string[] | null = null

/** Xoá bộ nhớ tạm. Gọi khi đăng xuất hoặc khi quyền vừa bị đổi. */
export function xoaBoNhoQuyen(): void {
  boNho = null
  localStorage.removeItem('user_permissions')
}

/**
 * Lấy danh sách quyền của người đang đăng nhập.
 *
 * Đọc theo thứ tự: bộ nhớ tạm -> localStorage -> hỏi máy chủ.
 */
export async function layQuyen(): Promise<KetQuaQuyen> {
  if (boNho) return { trangThai: 'xong', quyen: boNho }

  const luu = localStorage.getItem('user_permissions')
  if (luu) {
    try {
      const ds = JSON.parse(luu)
      if (Array.isArray(ds)) {
        boNho = ds
        return { trangThai: 'xong', quyen: ds }
      }
    } catch {
      // localStorage hỏng thì bỏ qua, hỏi lại máy chủ bên dưới.
    }
  }

  const maNhanVien = localStorage.getItem('employee_id')
  if (!maNhanVien) {
    // Không có mã nhân viên thì không hỏi được quyền. Đây là LỖI, không
    // phải "không có quyền" — máy chủ lẽ ra phải trả mã này lúc đăng nhập.
    return {
      trangThai: 'loi',
      loi: 'Không xác định được tài khoản. Thử đăng xuất rồi đăng nhập lại.',
    }
  }

  try {
    const quyen = await authService.getPermissions(maNhanVien)
    const ds = Array.isArray(quyen) ? quyen : []
    boNho = ds
    localStorage.setItem('user_permissions', JSON.stringify(ds))
    return { trangThai: 'xong', quyen: ds }
  } catch (e: any) {
    return {
      trangThai: 'loi',
      loi: e?.message || 'Không đọc được quyền từ máy chủ.',
    }
  }
}

/** Người này có được vào dự án đó không. */
export function duocVao(duAn: DuAn, quyen: string[]): boolean {
  // admin thấy tất cả, kể cả các mục chiAdmin.
  if (quyen.includes('admin')) return true
  if (duAn.chiAdmin) return false
  if (duAn.khoaQuyen === null) return true
  return quyen.includes(duAn.khoaQuyen)
}

/** Các dự án người này được vào, giữ nguyên thứ tự trong bảng. */
export function danhSachDuocVao(quyen: string[]): DuAn[] {
  return DU_AN.filter((d) => duocVao(d, quyen))
}

/** Tìm dự án theo đường dẫn hiện tại. Không khớp thì trả null. */
export function timTheoDuong(duongDan: string): DuAn | null {
  return DU_AN.find((d) => duongDan.startsWith(d.duong)) || null
}

/** Tìm dự án theo tên hiện trên menu. */
export function timTheoTen(ten: string): DuAn | null {
  return DU_AN.find((d) => d.ten === ten) || null
}
