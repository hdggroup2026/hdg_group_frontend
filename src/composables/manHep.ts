/**
 * MỤC 396 (29/08/2026) — NGƯỠNG MÀN HẸP, DÙNG CHUNG CHO MỌI MÀN.
 *
 * 🔴 VÌ SAO TÁCH RA ĐÂY THAY VÌ CHÉP VÀO TỪNG FILE
 *
 * MỤC 365 viết logic này lần đầu ở `Rosca/List.vue`. MỤC 391 chép nó sang
 * ba file nữa. Còn 51 file cần cùng thứ đó — chép tiếp là 55 bản của cùng
 * một đoạn mã, và chúng sẽ lệch nhau.
 *
 * Lệch ở đây không phải chuyện nhỏ: mỗi bản lệch là một màn có ngưỡng
 * khác, nên cùng một chiếc iPad có màn hiện bảng, màn hiện thẻ. Người
 * dùng không hiểu vì sao.
 *
 * ⚠️ ĐÂY LÀ ĐÚNG BÀI HỌC "hai nguồn cho một con số" của backend (MỤC 300,
 * 304), áp sang frontend.
 *
 * 🔴 NGƯỠNG 768 TRÙNG `md:` CỦA TAILWIND — ĐỪNG ĐẶT SỐ KHÁC
 *
 * Cả dự án đang dùng `hidden md:flex` để ẩn/hiện theo bề rộng. Đặt một
 * con số khác ở đây là có hai ngưỡng cho cùng một việc: ô chọn "dạng
 * List/Card" ẩn ở 768px trong khi bảng đổi sang thẻ ở 640px, và có một
 * khoảng bề rộng mà màn hình hỏng.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

export const NGUONG_MAN_HEP = 768

export function dungManHep() {
  const laManHep = ref(false)

  const doBeRong = () => {
    laManHep.value =
      typeof window !== 'undefined' && window.innerWidth < NGUONG_MAN_HEP
  }

  // Không bao giờ hiện cả hai, không bao giờ hiện rỗng: hai giá trị này
  // luôn ngược nhau vì cùng đọc một biến.
  const hienBang = computed(() => !laManHep.value)
  const hienThe = computed(() => laManHep.value)

  // ⚠️ Gỡ người nghe ở `onBeforeUnmount`. Không gỡ thì mỗi lần vào lại
  // màn là chồng thêm một người nghe `resize`, và không có gì báo lỗi —
  // chỉ thấy web chậm dần sau vài chục lần chuyển tab.
  //
  // 🔴 Đây chính là lý do phải có file dùng chung: viết tay 55 lần thì
  // chỉ cần một lần quên `onBeforeUnmount` là có một màn rò, và không ai
  // biết màn nào.
  onMounted(() => {
    doBeRong()
    window.addEventListener('resize', doBeRong)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', doBeRong)
  })

  return { laManHep, hienBang, hienThe, doBeRong }
}
