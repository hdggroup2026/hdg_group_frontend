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
    // MỤC 407 — khai kiểu cho cột MỤC 406. Thiếu dòng này thì `vue-tsc`
    // báo `Property 'anh_dai_dien' does not exist` và HỎNG CẢ BẢN DỰNG —
    // đúng loại lỗi đã làm hỏng lần đẩy trước (MỤC 402).
    // `null` = tài khoản chưa đặt ảnh; frontend hiện chữ cái đầu của tên.
    anh_dai_dien: string | null
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
  /**
   * MỤC 406 (29/08/2026) — đặt ảnh đại diện cho CHÍNH mình.
   *
   * 🔴 Không có tham số mã tài khoản — cùng lý do như `layHoSoCuaToi`.
   * Máy chủ lấy người gọi từ token. Nhận mã từ ngoài vào là mở cửa cho
   * người này đổi ảnh người kia.
   *
   * ⚠️ `anh` phải là chuỗi `data:image/png;base64,...` ĐÃ THU NHỎ.
   * Máy chủ chặn cứng ở 200 KB và chỉ nhận PNG / JPG / WEBP — ảnh SVG bị
   * từ chối vì SVG là XML có thể chứa mã chạy được.
   */
  async datAnhDaiDien(anh: string): Promise<any> {
    return await goiHoSo('anh-dai-dien', { anh })
  },

  /** MỤC 406 — gỡ ảnh, quay về chữ cái đầu của tên. */
  async xoaAnhDaiDien(): Promise<any> {
    return await goiHoSo('xoa-anh-dai-dien', {})
  },

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

/**
 * Phần chung của hai lời gọi ghi ở trên. Tách ra để không có hai bản xử
 * lý lỗi cho cùng một việc — hai bản thì sớm muộn một bản quên đọc
 * `detail`, và người dùng nhận "có lỗi xảy ra" thay vì câu máy chủ đã
 * viết sẵn (400 ảnh sai loại / 400 ảnh quá nặng / 500 chưa migration).
 */
async function goiHoSo(duong: string, than: any): Promise<any> {
  const baseUrl = await getApiUrl()
  const response = await fetch(`${baseUrl}/auth/${duong}`, {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify(than),
  })

  if (!response.ok) {
    const chiTiet = await response.json().catch(() => ({}))
    const loi: any = new Error(chiTiet?.detail || 'Không lưu được ảnh.')
    loi.status = response.status
    throw loi
  }

  return await response.json()
}
