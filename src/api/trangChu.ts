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
}
