/**
 * MỤC 341 (27/08/2026) — GỌI ĐƯỜNG API SỐ LIỆU TRANG CHỦ.
 *
 * Đường duy nhất: GET /api/v1/home/summary
 *
 * 🔴 MỘT ĐƯỜNG, KHÔNG PHẢI MƯỜI
 *
 * Xem lời ghi ở đầu `bot/utils/trang_chu.py`. Tóm lại: 254 đường API
 * hiện có đều là CRUD thuần. Gom số ở frontend là tạo NGUỒN THỨ HAI cho
 * cùng một con số — bot tính một kiểu, web tính một kiểu. Đúng cái bẫy
 * đã gây ra MỤC 300 và MỤC 304.
 *
 * ⚠️ ĐỪNG thêm hàm nào ở đây tự cộng số từ các đường `get-*`. Backend
 * tính sẵn, frontend chỉ hiển thị. Sửa cách tính thì sửa một chỗ.
 */
import { getApiUrl, getApiHeaders } from './apiConfig'

export const trangChuService = {
  /**
   * Toàn bộ số liệu Trang Chủ: ba khối cũ (MỤC 329) và khối
   * `bang_dieu_khien` sáu phần (MỤC 340).
   *
   * ⚠️ `bang_dieu_khien` có thể là `null` nếu backend chưa cài MỤC 340.
   * Nơi gọi phải chịu được điều đó — xem HomeView.vue.
   */
  async laySoLieu(): Promise<any> {
    const baseUrl = await getApiUrl()
    const response = await fetch(`${baseUrl}/home/summary`, {
      method: 'GET',
      headers: getApiHeaders(),
    })

    if (!response.ok) {
      const chiTiet = await response.json().catch(() => ({}))
      const loi: any = new Error(
        chiTiet?.detail || 'Không đọc được số liệu trang chủ.'
      )
      loi.status = response.status
      throw loi
    }

    return await response.json()
  },
  /**
   * MỤC 353 (27/08/2026) — Hỏi trợ lý AI nội bộ.
   *
   * 🔴 CHỈ ADMIN. Máy chủ trả 403 cho tài khoản thường — không phải
   * frontend tự ẩn nút rồi coi là xong. Ẩn bằng giao diện thì ai mở
   * công cụ trình duyệt vẫn gọi được.
   *
   * ⚠️ Có thể mất vài giây: trợ lý gọi ra mạng Google. Nơi gọi phải
   * hiện trạng thái "đang hỏi", nếu không người dùng tưởng nút hỏng
   * rồi bấm liên tục.
   */
  async hoiAI(cauHoi: string): Promise<{ thanh_cong: boolean; tra_loi: string }> {
    const baseUrl = await getApiUrl()
    const response = await fetch(`${baseUrl}/home/hoi-ai`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({ cau_hoi: cauHoi }),
    })

    if (!response.ok) {
      const chiTiet = await response.json().catch(() => ({}))
      const loi: any = new Error(chiTiet?.detail || 'Không hỏi được trợ lý AI.')
      loi.status = response.status
      throw loi
    }

    return await response.json()
  },

  /**
   * MỤC 394 (29/08/2026) — Đánh dấu / bỏ đánh dấu "đã kiểm tra" cho các
   * dòng đăng nhập thất bại của một tên.
   *
   * 🔴 CHỈ ADMIN/OWNER. Máy chủ trả 403 cho tài khoản thường — không
   * phải frontend tự ẩn ô tick rồi coi là xong. Ai mở công cụ trình
   * duyệt vẫn gọi được, nên cửa thật nằm ở máy chủ.
   *
   * ⚠️ Đánh dấu tác động lên MỌI dòng chưa kiểm của tên đó, không phải
   * một dòng. Đó là chủ ý: ô tick nghĩa là "tôi đã xem tới đây". Lần
   * thất bại MỚI sau đó không mang dấu nên tên đó hiện lại ngay.
   *
   * Nhóm không có tên hiện trên màn là `(trống)` — gửi đúng chuỗi đó.
   */
  async danhDauDaKiem(tenGoVao: string): Promise<any> {
    return await goiNhatKy('danh-dau-da-kiem', tenGoVao)
  },

  /**
   * 🔴 PHẢI CÓ ĐƯỜNG QUAY LẠI. Tick nhầm mà không gỡ được thì dòng cảnh
   * báo bảo mật biến mất vĩnh viễn và không ai biết.
   */
  async boDanhDau(tenGoVao: string): Promise<any> {
    return await goiNhatKy('bo-danh-dau', tenGoVao)
  },
}

/**
 * Phần chung của hai lời gọi trên. Tách ra để không có hai bản xử lý lỗi
 * cho cùng một việc — hai bản thì sớm muộn một bản quên đọc `detail`.
 */
async function goiNhatKy(duong: string, tenGoVao: string): Promise<any> {
  const baseUrl = await getApiUrl()
  const response = await fetch(`${baseUrl}/home/nhat-ky/${duong}`, {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify({ ten_go_vao: tenGoVao }),
  })

  if (!response.ok) {
    const chiTiet = await response.json().catch(() => ({}))
    // ⚠️ Giữ nguyên câu máy chủ trả về. Nuốt nó rồi thay bằng "có lỗi
    // xảy ra" là bỏ đúng thông tin cần để biết hỏng ở đâu — máy chủ đã
    // phân biệt sẵn 403 (không đủ quyền), 400 (thiếu tên), 500 (ghi hỏng).
    const loi: any = new Error(
      chiTiet?.detail || 'Không ghi được dấu đã kiểm.'
    )
    loi.status = response.status
    throw loi
  }

  return await response.json()
}
