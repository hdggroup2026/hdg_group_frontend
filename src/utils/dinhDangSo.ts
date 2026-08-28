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


/**
 * MỤC 372 (28/08/2026) — SỐ ĐO GIỮ PHẦN LẺ, CHỈ TIỀN MỚI BỎ.
 *
 * 🔴 MỤC 355 ÁP QUÁ RỘNG, VÀ ĐÃ CHẶN VIỆC CỦA KẾ TOÁN
 *
 * MỤC 355 bỏ phần lẻ cho MỌI con số hiện ra. s68 làm rõ 28/08/2026:
 *
 *   *"Tôi báo không hiển thị web bỏ số thập phân ở KẾT QUẢ TÍNH TOÁN RA
 *   SỐ TIỀN CUỐI CÙNG thôi. Còn tất cả thông số và nhập liệu thì vẫn
 *   hiện."*
 *
 * ⚠️ ĐÃ GÂY CHẶN VIỆC THẬT. Kế toán nhắn nhóm "Test - Nhóm TN-I" lúc
 * 13:46 ngày 28/08: *"hiện đang lỗi phép tính ạ, ví dụ hộ Thành
 * 87.6 − 1 = 86.6 mà hiện đang ra số chẵn ạ"*, và *"em thử nhập mấy hộ
 * đều bị vậy"*. Cả buổi chiều đó kế toán phải bấm máy tính tay để kiểm
 * lại từng phiếu.
 *
 * Phép tính KHÔNG sai — màn hình chỉ cắt phần lẻ đi. Nhưng người nhập
 * liệu không có cách nào biết điều đó, và với họ thì màn hình LÀ sự
 * thật.
 *
 * ➜ `dinhDangSo`   — cho TIỀN. Cắt sạch phần lẻ. Giữ nguyên MỤC 355.
 * ➜ `dinhDangSoLe` — cho SỐ ĐO (kg, số độ, tỷ lệ). Giữ phần lẻ.
 *
 * ⚠️ VẪN CẮT, KHÔNG LÀM TRÒN — đúng chốt của s68 ở MỤC 355. Kho mủ mà
 * tự đẻ thêm 1 kg mỗi lần hiện là số trên màn không khớp số trong sổ.
 *
 * ⚠️ Bỏ đuôi `,00`: `60` hiện là "60", không phải "60,00". Người đọc
 * cần thấy phần lẻ KHI CÓ, chứ không cần một đuôi vô nghĩa trên mọi số.
 */
export function dinhDangSoLe(
  gia_tri: number | string | null | undefined,
  so_le: number = 2
): string {
  if (gia_tri === null || gia_tri === undefined || gia_tri === '') return '0'
  const so = typeof gia_tri === 'string' ? Number(gia_tri) : gia_tri
  // NaN thì trả '0' chứ không in chữ "NaN" ra màn cho người dùng đọc.
  if (!Number.isFinite(so)) return '0'

  const n = Math.max(0, Math.trunc(so_le))
  if (n === 0) return dinhDangSo(so)

  // Cắt tới `n` chữ số lẻ, KHÔNG làm tròn. `Math.trunc` sau khi nhân —
  // `toFixed` sẽ làm tròn, nên không dùng được ở đây.
  const heSo = Math.pow(10, n)
  const catLe = Math.trunc(so * heSo) / heSo

  return catLe.toLocaleString('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: n,
  })
}

export default dinhDangSo
