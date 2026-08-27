/**
 * MỤC 355 (27/08/2026) — ĐỊNH DẠNG SỐ: BỎ PHẦN LẺ KHI HIỂN THỊ.
 *
 * s68 chốt 27/08/2026, nhìn màn Tiến Nga trên iPad:
 *   *"số ,95 và ,19 và ,72 không hiển thị nhìn cho gọn. Nghĩa là tất cả
 *   số lẻ không hiển thị. Nhưng trong số liệu thực tế thì vẫn có bình
 *   thường. Chứ không làm tròn."*
 *
 * 🔴 CẮT, KHÔNG LÀM TRÒN — VÀ ĐÂY LÀ ĐIỂM QUAN TRỌNG NHẤT CỦA FILE NÀY
 *
 * `toLocaleString('vi-VN', { maximumFractionDigits: 0 })` trông có vẻ
 * đúng, nhưng nó LÀM TRÒN:
 *
 *     1.623.155,95  ->  1.623.156      ← sai, tự đẻ thêm 1 kg
 *     384.556,19    ->  384.556        ← tình cờ đúng
 *
 * s68 dặn thẳng "không làm tròn". Kho mủ mà tự đẻ thêm 1 kg mỗi lần hiện
 * là số trên màn không khớp số trong sổ, và không có gì báo.
 *
 * ➜ Dùng `Math.trunc` — cắt phăng phần lẻ, cả số dương lẫn số âm.
 *   `Math.floor` KHÔNG dùng được: floor(-3.7) = -4, tức là số âm bị đẩy
 *   xa hơn 0. Kho mủ tồn đang có giá trị âm (lỗi dữ liệu chưa dọn), nên
 *   chuyện này xảy ra thật chứ không phải giả định.
 *
 * ⚠️ ĐÂY CHỈ LÀ LỚP HIỂN THỊ. Dữ liệu gửi lên máy chủ, phép tính, và
 * mọi thứ lưu vào database vẫn giữ nguyên phần lẻ. Không được gọi hàm
 * này rồi lấy kết quả đem đi tính tiếp.
 */
export function dinhDangSo(gia_tri: number | string | null | undefined): string {
  if (gia_tri === null || gia_tri === undefined || gia_tri === '') return '0'
  const so = typeof gia_tri === 'string' ? Number(gia_tri) : gia_tri
  // NaN thì trả '0' chứ không in chữ "NaN" ra màn cho người dùng đọc.
  if (!Number.isFinite(so)) return '0'
  return Math.trunc(so).toLocaleString('vi-VN')
}

export default dinhDangSo
