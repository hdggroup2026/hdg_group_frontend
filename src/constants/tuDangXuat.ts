/**
 * MỤC 260 (23/08/2026) — TỰ ĐĂNG XUẤT KHI ĐỂ KHÔNG DÙNG.
 *
 * Máy văn phòng hay để mở qua đêm, có khi để mở cả cuối tuần. Ai đi ngang
 * qua cũng thấy sổ sách và bấm được.
 *
 * 🔴 ĐỌC KỸ CHỖ NÀY TRƯỚC KHI TIN NÓ LÀ MỘT LỚP BẢO MẬT:
 *
 * Đây là khoá ở TRÌNH DUYỆT, không phải ở máy chủ. Nó xoá thẻ phiên khỏi
 * máy và đá về màn đăng nhập — đủ để người đi ngang không xem được sổ.
 *
 * NHƯNG người biết mở công cụ nhà phát triển và chép thẻ phiên ra thì vẫn
 * dùng được thẻ đó, vì máy chủ hiện KHÔNG kiểm hạn thẻ ở 249/251 đường.
 *
 * Nói cách khác: cái này chống ĐI NGANG QUA, không chống CỐ Ý.
 * Chống cố ý phải gắn kiểm quyền ở máy chủ — việc riêng, chưa làm.
 *
 * Đừng để ai đọc đoạn này rồi tưởng web đã có khoá phiên thật.
 */

// s68 chốt 8 tiếng. Đủ dài để không cắt ngang một ngày làm việc bình
// thường (kế toán mở lúc 8h, nghỉ trưa, làm tới 17h — không lần nào để
// không quá 8 tiếng), và đủ ngắn để máy để qua đêm thì sáng ra đã thoát.
const SO_GIO_TOI_DA = 8

const KHOA = 'lan_dung_cuoi'

/** Việc nào tính là "đang dùng". Không bắt sự kiện nào cũng nghe —
 *  mousemove bắn hàng trăm lần một giây, ghi localStorage liên tục là
 *  máy yếu bị giật. */
const VIEC_DANG_DUNG = ['click', 'keydown', 'scroll', 'touchstart']

let dongHo: number | null = null
let ganNhat = 0

function ghiNhan() {
  const nay = Date.now()
  // Chỉ ghi xuống localStorage mỗi 30 giây một lần, dù người dùng bấm
  // liên tục. Ghi mỗi lần bấm là hàng nghìn lượt ghi đĩa mỗi giờ.
  if (nay - ganNhat < 30_000) return
  ganNhat = nay
  try {
    localStorage.setItem(KHOA, String(nay))
  } catch {
    // localStorage đầy hoặc bị chặn thì bỏ qua — không đáng làm hỏng
    // trang vì một cái đồng hồ.
  }
}

function quaHan(): boolean {
  try {
    const luu = localStorage.getItem(KHOA)
    if (!luu) return false
    const truoc = Number(luu)
    if (!truoc || Number.isNaN(truoc)) return false
    return Date.now() - truoc > SO_GIO_TOI_DA * 60 * 60 * 1000
  } catch {
    // ⚠️ Đọc lỗi KHÔNG được hiểu là "quá hạn" (bài học 7.1).
    // Đá người đang làm việc ra ngoài vì localStorage chập là tệ hơn
    // nhiều so với để một phiên cũ sống thêm chút.
    return false
  }
}

/**
 * Bật theo dõi. Gọi MỘT LẦN lúc web khởi động.
 * `khiHetHan` là việc phải làm khi quá hạn — thường là đăng xuất.
 */
export function batTheoDoi(khiHetHan: () => void): void {
  // Kiểm ngay lúc mở: máy để qua đêm rồi sáng mở lại trình duyệt thì
  // phải thoát ngay, không đợi hết một vòng đếm.
  if (quaHan()) {
    khiHetHan()
    return
  }
  ghiNhan()

  VIEC_DANG_DUNG.forEach((v) =>
    window.addEventListener(v, ghiNhan, { passive: true }))

  // Quay lại tab sau khi để máy ngủ: kiểm ngay, đừng đợi vòng đếm.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && quaHan()) khiHetHan()
  })

  // Đếm mỗi phút. Không cần dày hơn — sai số một phút trên tám tiếng
  // không có ý nghĩa gì.
  dongHo = window.setInterval(() => {
    if (quaHan()) khiHetHan()
  }, 60_000)
}

/** Dừng theo dõi và xoá dấu. Gọi khi đăng xuất. */
export function ngungTheoDoi(): void {
  if (dongHo !== null) {
    clearInterval(dongHo)
    dongHo = null
  }
  VIEC_DANG_DUNG.forEach((v) => window.removeEventListener(v, ghiNhan))
  try {
    localStorage.removeItem(KHOA)
  } catch {
    // không xoá được thì thôi
  }
}
