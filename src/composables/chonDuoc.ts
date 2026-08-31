/**
 * MỤC 417 (30/08/2026) — DROPLIST KHÔNG ĐÓNG KHI ẨN BÀN PHÍM.
 *
 * s68 báo trên iPad mini 6:
 *     "Khi bấm drop list Khách hàng thì hiện luôn bàn phím. Bấm ẩn bàn
 *      phím thì ẩn luôn drop list. Fix lại tất cả drop list trên frontend
 *      là khi bấm ẩn bàn phím thì vẫn hiện droplist bình thường để có thể
 *      kéo và lựa."
 *
 * ══════════════════════════════════════════════════════════════════════
 * 🔴 NGUYÊN NHÂN: thuộc tính `filterable` CỦA ELEMENT PLUS
 * ══════════════════════════════════════════════════════════════════════
 *
 * `<el-select filterable>` biến ô hiển thị thành một ô NHẬP LIỆU thật để
 * gõ chữ lọc. Trên iPad, chạm vào ô nhập liệu là iOS bật bàn phím — không
 * ai gọi nó, nó tự bật.
 *
 * Bấm nút "Xong" để ẩn bàn phím thì Safari phát sự kiện `blur` lên ô đó.
 * Element Plus đóng droplist khi ô mất tiêu điểm. Nên bàn phím tắt kéo
 * theo droplist tắt — người dùng chưa kịp chọn gì.
 *
 * ⚠️ KHÔNG phải lỗi của dự án. Đây là cách `filterable` vốn hoạt động, và
 * trên máy tính có chuột thì không ai thấy vấn đề: gõ để lọc là tiện.
 *
 * ══════════════════════════════════════════════════════════════════════
 * CÁCH SỬA: TẮT `filterable` CHỈ TRÊN THIẾT BỊ CẢM ỨNG
 * ══════════════════════════════════════════════════════════════════════
 *
 *     <el-select :filterable="choLocDuoc" ...>
 *
 * Không có ô nhập thì iOS không bật bàn phím, và không có `blur` thì
 * droplist ở nguyên đó cho người dùng kéo và chọn — đúng thứ s68 yêu cầu.
 *
 * 🔴 ĐÁNH ĐỔI, NÓI THẲNG: trên iPad sẽ KHÔNG gõ để lọc được nữa, phải
 * kéo tìm. Danh sách dài (khách hàng Credit, nhóm Telegram) sẽ mất công
 * hơn. Đổi lại là chọn được — hiện tại thì không chọn được gì cả.
 *
 * ⚠️ Máy tính GIỮ NGUYÊN `filterable`. Ở đó bàn phím luôn hiện sẵn, không
 * có chuyện ẩn đi, nên không có vấn đề gì để sửa.
 *
 * ══════════════════════════════════════════════════════════════════════
 * VÌ SAO KHÔNG CHỌN CÁCH KHÁC
 * ══════════════════════════════════════════════════════════════════════
 *
 * · Chặn sự kiện `blur` để droplist không đóng — phải can thiệp vào bên
 *   trong Element Plus. Bản Element Plus sau đổi cách làm là hỏng lặng lẽ,
 *   và không có ca kiểm nào bắt được.
 *
 * · Tự viết lại ô chọn — mất hết những thứ Element Plus đã lo: bàn phím
 *   mũi tên, đọc màn hình, chế độ tối, cuộn khi danh sách dài.
 *
 * · Bỏ `filterable` ở MỌI nơi kể cả máy tính — lấy đi một thứ đang chạy
 *   tốt trên máy tính để chữa một vấn đề chỉ có trên máy bảng.
 */
import { computed } from 'vue'

/**
 * Máy này có phải thiết bị cảm ứng không.
 *
 * ⚠️ Tính MỘT LẦN lúc nạp, KHÔNG theo dõi thay đổi. Một chiếc máy không
 * tự mọc ra hay mất đi màn cảm ứng giữa chừng. Theo dõi liên tục chỉ thêm
 * một người nghe sự kiện phải nhớ gỡ.
 *
 * ⚠️ Kiểm CẢM ỨNG, không kiểm BỀ RỘNG. Máy tính có màn 1024px vẫn dùng
 * chuột và vẫn nên gõ lọc được; iPad Pro nằm ngang rộng 1366px nhưng vẫn
 * bật bàn phím. Bề rộng không nói lên điều đang cần biết.
 */
const LA_CAM_UNG =
  typeof window !== 'undefined' &&
  (('ontouchstart' in window) ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0))

export function dungChonDuoc() {
  // `true` trên máy tính, `false` trên máy bảng và điện thoại.
  const choLocDuoc = computed(() => !LA_CAM_UNG)
  return { choLocDuoc, laCamUng: LA_CAM_UNG }
}

export const LA_THIET_BI_CAM_UNG = LA_CAM_UNG
