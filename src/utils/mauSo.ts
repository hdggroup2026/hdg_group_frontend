/**
 * MỤC 380 (28/08/2026) — QUY TẮC MÀU CHO MỌI CON SỐ TRÊN WEB.
 *
 * s68 chốt 28/08/2026:
 *
 *   *"Quy tắc toàn bộ số trên website hiển thị: số nhỏ hơn 0 là màu đỏ
 *   tươi. Lớn hơn 0 màu xanh biển."*
 *
 *   âm  ( < 0 )  ->  đỏ tươi
 *   dương ( > 0 )  ->  xanh biển
 *   bằng 0        ->  xám trung tính
 *
 * 🔴 VÌ SAO SỐ 0 KHÔNG XANH CŨNG KHÔNG ĐỎ
 *
 * s68 chỉ nói về "nhỏ hơn 0" và "lớn hơn 0". Số 0 không thuộc bên nào.
 *
 * Tô 0 màu xanh là nói "tốt" về một ô chưa có gì — mà trong hệ thống này,
 * 0 thường nghĩa là **chưa nhập liệu**, không phải "đã cân bằng". Bảng
 * cân đối Trang Chủ đang có nhiều ô 0 đúng vì lý do đó (kho mủ tồn 0,
 * công nợ Rental 0). Tô xanh hết là nhìn như mọi thứ đều ổn.
 *
 * ⚠️ `null` / `undefined` / không phải số cũng dùng màu xám. Ô KHÔNG CÓ SỐ
 * khác hẳn ô có số 0 — nhưng cả hai đều không đáng tô xanh hay đỏ, và
 * việc phân biệt hai thứ đó là việc của `dinhDangSo` (in dấu gạch), không
 * phải việc của màu.
 *
 * ⚠️ ĐÂY CHỈ LÀ LỚP MÀU. Không đụng tới giá trị, không làm tròn, không
 * đổi cách hiển thị. Muốn đổi cách in số thì sửa `dinhDangSo.ts`.
 */

/** Đỏ tươi — dùng cho số ÂM. */
export const MAU_AM = 'text-red-600 dark:text-red-400'

/** Xanh biển — dùng cho số DƯƠNG. */
export const MAU_DUONG = 'text-blue-600 dark:text-blue-400'

/** Xám trung tính — dùng cho số 0 và ô không có số. */
export const MAU_TRUNG_TINH = 'text-gray-700 dark:text-gray-300'

/**
 * Lớp màu cho một con số, theo quy tắc s68 chốt 28/08/2026.
 *
 * Dùng ở template:  :class="mauSo(row.loi_nhuan)"
 */
export function mauSo(gia_tri: number | string | null | undefined): string {
  if (gia_tri === null || gia_tri === undefined || gia_tri === '') {
    return MAU_TRUNG_TINH
  }
  const so = typeof gia_tri === 'string' ? Number(gia_tri) : gia_tri
  if (!Number.isFinite(so)) return MAU_TRUNG_TINH
  if (so < 0) return MAU_AM
  if (so > 0) return MAU_DUONG
  return MAU_TRUNG_TINH
}

/**
 * Bản ĐẬM, cho những ô cần nổi hơn (dòng tổng, ô lãi/lỗ cuối thẻ).
 *
 * Tách hàm riêng thay vì nối chuỗi tại chỗ: nối tại chỗ thì mỗi màn một
 * kiểu đậm, và đổi quy ước sau này phải đi sửa từng nơi.
 */
export function mauSoDam(gia_tri: number | string | null | undefined): string {
  return mauSo(gia_tri) + ' font-bold'
}

export default mauSo
