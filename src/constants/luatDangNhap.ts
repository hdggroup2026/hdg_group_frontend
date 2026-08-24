/**
 * MỤC 259 (23/08/2026) — LUẬT ĐẶT LOGIN NAME VÀ MẬT KHẨU (bản web).
 *
 * 🔴 FILE NÀY LÀ BẢN CHÉP. BẢN GỐC Ở MÁY CHỦ:
 *        app/core/luat_dang_nhap.py
 *
 * ⚠️ SỬA LUẬT THÌ PHẢI SỬA CẢ HAI CHỖ, CÙNG MỘT LÚC.
 *
 * Vì sao lại chấp nhận chép ra hai bản — trái với nguyên tắc "một nguồn
 * duy nhất" mà cả hệ thống đang theo:
 *
 *   Web và máy chủ là HAI CHƯƠNG TRÌNH KHÁC NGÔN NGỮ, chạy ở hai nơi.
 *   Web không gọi được hàm Python, nên không có cách nào dùng chung thật.
 *
 *   Mà luật vẫn phải có ở CẢ HAI:
 *     - Ở web  : báo lỗi ngay lúc người dùng đang gõ, không phải gửi lên
 *                mới biết sai
 *     - Ở máy chủ: vì web kiểm được thì cũng bỏ qua được. Máy chủ là chốt
 *                chặn thật, web chỉ là tiện nghi.
 *
 * Bỏ bản web thì người dùng gõ xong, bấm gửi, chờ, rồi mới biết mật khẩu
 * thiếu một chữ số — làm ba bốn lần là bực.
 * Bỏ bản máy chủ thì luật coi như không có.
 *
 * Nên chép, và ghi to ở đây để người sửa sau không quên chỗ kia.
 */

export const DAI_TOI_THIEU_LOGIN = 8
export const DAI_TOI_THIEU_MAT_KHAU = 10

/** Ký tự đặc biệt = không phải chữ, không phải số, không phải khoảng trắng. */
const KY_TU_DAC_BIET = /[^A-Za-z0-9\s]/

/**
 * Đưa login name về dạng chuẩn: bỏ khoảng trắng hai đầu, hạ chữ thường.
 *
 * s68 chốt "không phân biệt chữ hoa chữ thường" — nên `NguyenVan` và
 * `nguyenvan` LÀ MỘT. Phải hạ về thường trước khi so, không thì hai người
 * lấy được hai tên chỉ khác chữ hoa.
 */
export function chuanHoaLogin(ten: string): string {
  return (ten || '').trim().toLowerCase()
}

/** Trả câu báo lỗi tiếng Việt, hoặc null nếu hợp lệ. */
export function kiemLoginName(ten: string): string | null {
  const goc = (ten || '').trim()

  if (!goc) return 'Chưa nhập tên đăng nhập.'

  // Kiểm dấu tiếng Việt TRƯỚC khi kiểm "chỉ chữ cái".
  // Người Việt gõ "nguyenvăn" thì lỗi thật là có dấu — nhưng nếu chỉ báo
  // "chỉ được dùng chữ cái" thì nhìn vào không thấy sai chỗ nào.
  if (/[\u0300-\u036f]/.test(goc.normalize('NFD'))) {
    return 'Tên đăng nhập không được có dấu tiếng Việt.'
  }

  if (goc.length < DAI_TOI_THIEU_LOGIN) {
    return `Tên đăng nhập phải có ít nhất ${DAI_TOI_THIEU_LOGIN} ký tự (đang có ${goc.length}).`
  }

  if (!/^[A-Za-z]+$/.test(goc)) {
    return 'Tên đăng nhập chỉ được dùng chữ cái, không số, không dấu cách, không ký tự đặc biệt.'
  }

  return null
}

/** Trả câu báo lỗi tiếng Việt, hoặc null nếu hợp lệ. */
export function kiemMatKhau(mk: string, loginName = ''): string | null {
  mk = mk || ''

  if (!mk) return 'Chưa nhập mật khẩu.'

  if (mk.length < DAI_TOI_THIEU_MAT_KHAU) {
    return `Mật khẩu phải có ít nhất ${DAI_TOI_THIEU_MAT_KHAU} ký tự (đang có ${mk.length}).`
  }

  // ⚠️ Giới hạn 72 KHÔNG PHẢI do s68 đặt — đó là giới hạn cứng của bcrypt,
  // thuật toán máy chủ dùng để băm mật khẩu. Dài hơn thì bcrypt CẮT ÂM
  // THẦM phần dư, và người dùng đăng nhập được bằng một mật khẩu ngắn hơn
  // cái họ đặt. Chặn có lời còn hơn cắt lặng lẽ.
  if (mk.length > 72) return 'Mật khẩu không được dài quá 72 ký tự.'

  const thieu: string[] = []
  if (!/[A-Z]/.test(mk)) thieu.push('chữ HOA')
  if (!/[0-9]/.test(mk)) thieu.push('số')
  if (!KY_TU_DAC_BIET.test(mk)) thieu.push('ký tự đặc biệt (ví dụ @ # ! $)')

  if (thieu.length) return 'Mật khẩu còn thiếu: ' + thieu.join(', ') + '.'

  if (mk.includes(' ')) return 'Mật khẩu không được có dấu cách.'

  if (loginName && mk.toLowerCase().includes(loginName.toLowerCase())) {
    return 'Mật khẩu không được chứa tên đăng nhập.'
  }

  return null
}

/** Độ mạnh mật khẩu, để vẽ thanh màu. 0 = chưa gõ, 4 = đủ tốt. */
export function doManh(mk: string): number {
  if (!mk) return 0
  let d = 0
  if (mk.length >= DAI_TOI_THIEU_MAT_KHAU) d++
  if (/[A-Z]/.test(mk)) d++
  if (/[0-9]/.test(mk)) d++
  if (KY_TU_DAC_BIET.test(mk)) d++
  return d
}
