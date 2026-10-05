/**
 * MỤC 654 (06/10/2026) — THÁNG MẶC ĐỊNH CỦA CÁC MÀN NHÂN SỰ.
 *
 * 🔴 LỖI ĐƯỢC SỬA: ba màn Chấm công · Danh sách Lương · Xuất lương đều ghim
 * cứng `month: '2026-06'` trong mã. Mở màn ra là lọc tháng 06/2026 — một
 * tháng không còn dữ liệu — nên bấm Tìm kiếm ra bảng rỗng.
 *
 * s68 06/10 gặp đúng cảnh đó: chọn nhân viên, bấm Tìm kiếm, "không có dữ
 * liệu". Nhìn y như hỏng phân quyền, mà thật ra chỉ là đang xem nhầm tháng.
 * Ảnh còn thấy nhãn "Kỳ lương: Tháng 06/2026" — chính là giá trị ghim cứng.
 *
 * ⚠️ Giá trị ghim cứng kiểu này KHÔNG BAO GIỜ tự báo lỗi. Nó đúng đúng một
 * tháng rồi sai im lặng mãi mãi, và mỗi tháng trôi qua thì càng khó đoán ra.
 *
 * ⚠️ VÌ SAO MỘT TỆP DÙNG CHUNG: ba màn cùng cần một quy ước. Chép công thức
 * vào ba chỗ là ba chỗ phải sửa khi s68 muốn đổi mặc định, và ba chỗ có thể
 * quên — đúng cái bẫy mà `manHep.ts` (MỤC 396) và `mauSo.ts` đã gom lại.
 */

/** Dạng `YYYY-MM` mà `el-date-picker type="month"` nhận. */
export function thangNay(hienTai?: Date): string {
  const d = hienTai ?? new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Tháng trước. Dùng cho màn lương: bảng lương luôn là của tháng đã khép.
 *
 * ⚠️ Lùi tháng bằng `new Date(năm, tháng - 1, 1)` — ngày đặt là 1. Nếu để
 * nguyên ngày hiện tại thì 31/03 lùi một tháng ra 03/03 (tháng 2 không có
 * ngày 31), và nhãn kỳ lương sai một tháng vào đúng những ngày cuối tháng.
 */
export function thangTruoc(hienTai?: Date): string {
  const d = hienTai ?? new Date()
  const t = new Date(d.getFullYear(), d.getMonth() - 1, 1)
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`
}

/** `"2026-09"` → `"Tháng 09/2026"`. Dùng cho nhãn kỳ lương. */
export function nhanKyLuong(thang: string | null | undefined): string {
  if (!thang) return ''
  const [nam, th] = String(thang).split('-')
  if (!nam || !th) return ''
  return `Tháng ${th}/${nam}`
}
