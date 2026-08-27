/**
 * MỤC 339 (27/08/2026) — GỌI ĐƯỜNG API HỒ SƠ NGƯỜI DÙNG.
 *
 * 🔴 VÌ SAO LÀ FILE RIÊNG, KHÔNG THÊM VÀO `auth.ts`
 *
 * Về mặt phân loại thì hàm này thuộc về `auth.ts`. Nhưng ngày 27/08/2026,
 * file `auth.ts` đang nằm trong một pull request CHƯA GỘP (MỤC 337, nhánh
 * `muc-337`, sửa cách gửi token khi tạo tài khoản).
 *
 * Sửa tiếp `auth.ts` ở đây rồi giao cho s68 kéo đè lên GitHub sẽ ĐÈ MẤT
 * bản MỤC 337 — vì bản trên nhánh chính vẫn là bản cũ. Mất im lặng: kéo
 * đè xong không có lỗi nào báo, chỉ là lỗi 401 lúc tạo tài khoản quay
 * trở lại và không ai hiểu vì sao.
 *
 * Tách file là cách duy nhất chắc chắn không giẫm lên nhau.
 *
 * ⚠️ Sau khi MỤC 337 đã gộp xong, VẪN ĐỂ NGUYÊN file này. Gộp lại vào
 * `auth.ts` chỉ để cho gọn là một lần sửa không mang lại gì, mà lại có
 * cơ hội làm hỏng.
 */
import { getApiUrl, getApiHeaders } from './apiConfig'

/** Một dòng "lần đăng nhập trước". null = chưa có lần nào trước đó. */
export interface LanDangNhapTruoc {
  luc: string | null
  ip: string | null
  trinh_duyet: string | null
}

export interface HoSoCuaToi {
  tai_khoan: {
    username: string | null
    ma_nhan_vien: string | null
    ho_ten: string | null
    vai_tro: string | null
    la_admin: boolean
  }
  quyen: string[]
  trang_thai: {
    dang_bat: boolean
    bi_khoa: boolean
    khoa_luc: string | null
    phai_doi_dang_nhap: boolean
    so_lan_sai_lien_tiep: number
    so_lan_sai_toi_da: number
  }
  moc_thoi_gian: {
    ngay_tao: string | null
    sua_lan_cuoi: string | null
    dang_nhap_lan_truoc: LanDangNhapTruoc | null
    so_lan_go_sai_tu_lan_dang_nhap_truoc: number
  }
}

export const hoSoService = {
  /**
   * Đọc hồ sơ của CHÍNH người đang đăng nhập.
   *
   * Không có tham số nào — cố ý. Máy chủ tự biết người gọi là ai qua
   * token. Thêm tham số `employee_id` vào đây là mở đường cho việc xem
   * hồ sơ người khác.
   */
  async layHoSoCuaToi(): Promise<HoSoCuaToi> {
    const baseUrl = await getApiUrl()
    const response = await fetch(`${baseUrl}/auth/ho-so-cua-toi`, {
      method: 'GET',
      headers: getApiHeaders(),
    })

    if (!response.ok) {
      // Giữ lại mã HTTP như MỤC 278 đã chốt: màn hình cần phân biệt
      // "hết phiên đăng nhập" (401) với "máy chủ hỏng" (5xx), chứ không
      // đoán bằng cách dò chữ trong câu báo lỗi.
      const chiTiet = await response.json().catch(() => ({}))
      const loi: any = new Error(
        chiTiet?.detail || 'Không đọc được hồ sơ tài khoản.'
      )
      loi.status = response.status
      throw loi
    }

    return await response.json()
  },
}
