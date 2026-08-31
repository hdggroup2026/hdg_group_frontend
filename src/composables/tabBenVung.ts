/**
 * MỤC 423 (31/08/2026) — GIỮ TAB ĐANG XEM KHI XOAY MÁY.
 *
 * 🔴 CHUYỆN ĐÃ XẢY RA
 *
 * s68 đang ở tab "Hợp đồng" của màn Quản lý mã vay, xoay điện thoại từ
 * ngang về đứng, màn nhảy về tab "Khách hàng". Hai ảnh chụp 31/08/2026
 * (10:43 nằm ngang · 10:47 dựng đứng) cho thấy đúng việc đó.
 *
 * 🔴 NGUYÊN NHÂN GỐC — KHÔNG PHẢI LỖI CỦA `el-tabs`
 *
 * `Credit/Index.vue` dựng nội dung ở BA CHỖ KHÁC NHAU trong template:
 *
 *   dòng  3   <el-splitter v-if="isDesktop">      -> ≥ 1024px
 *   dòng  96  <template v-if="isMobile">          -> < 768px
 *   dòng 117  <template v-if="isTablet">          -> 768–1023px
 *
 * Cả ba đều chứa `<component :is="activeView" />`. Xoay máy làm bề rộng
 * đổi, Vue GỠ BỎ nhánh cũ và DỰNG MỚI nhánh kia — nên `ContractTabWrapper`
 * là một thực thể hoàn toàn mới, và dòng
 *
 *     const activeTab = ref('customers')
 *
 * chạy lại từ đầu. Tab về mặc định. Không có gì hỏng, không có gì báo lỗi
 * — đúng thiết kế của Vue, chỉ là thiết kế đó không hợp ở đây.
 *
 * iPhone: đứng 390px (nhánh mobile) ↔ ngang 844px (nhánh tablet).
 * iPad mini: đứng 744px (mobile) ↔ ngang 1133px (desktop).
 * Cả hai máy đều đổi nhánh khi xoay, nên cả hai đều mất tab.
 *
 * ⚠️ VÌ SAO KHÔNG SỬA THẲNG `Index.vue`
 *
 * Cách sạch nhất là gộp ba chỗ dựng nội dung thành MỘT, để Vue không có
 * lý do gỡ bỏ gì cả — làm thế thì giữ được TẤT CẢ (tab, bộ lọc, ô tìm
 * kiếm, trang đang xem), không riêng tab. Nhưng nhánh máy tính dùng
 * `el-splitter`, mà nội dung bắt buộc phải nằm trong `el-splitter-panel`;
 * gộp lại là phải bỏ thanh kéo giãn của máy tính. Đó là đổi cách dùng,
 * không phải sửa lỗi — nên để s68 quyết, ghi thành việc riêng.
 *
 * 🔴 GIỚI HẠN CỦA FILE NÀY, NÓI THẲNG
 *
 * Nó giữ ĐÚNG những giá trị được khai qua nó. Bộ lọc, ô tìm kiếm và số
 * trang vẫn nằm trong `ref` thường ở từng màn, nên xoay máy vẫn mất. Muốn
 * giữ nốt thì hoặc khai chúng qua đây, hoặc làm việc gộp `Index.vue` ở
 * trên.
 *
 * ⚠️ Kho nằm ở tầng module, KHÔNG phải localStorage. Tải lại trang là
 * sạch — đúng ý: mở web buổi sáng thì về tab đầu, còn xoay máy giữa
 * chừng thì giữ nguyên chỗ đang xem.
 */
import { ref, watch, type Ref } from 'vue'

/** Kho dùng chung cho cả trang. Khoá là chuỗi do nơi gọi tự đặt. */
const kho = new Map<string, unknown>()

/**
 * Như `ref()`, nhưng nhớ giá trị theo `khoa` khi component bị dựng lại.
 *
 * ⚠️ `khoa` phải DUY NHẤT trong toàn bộ web. Hai màn trùng khoá là bấm
 * tab ở màn này thì màn kia đổi theo — loại lỗi rất khó lần ra. Quy ước
 * đang dùng: `<tên mảng>/<tên màn>`, ví dụ `credit/contract`.
 */
export function refTabBenVung<T>(khoa: string, macDinh: T): Ref<T> {
  const banDau = (kho.has(khoa) ? kho.get(khoa) : macDinh) as T
  const o = ref(banDau) as Ref<T>

  watch(o, (giaTriMoi) => {
    kho.set(khoa, giaTriMoi)
  })

  return o
}

/**
 * Xoá hết giá trị đã nhớ. Chỉ dùng khi đăng xuất — người khác đăng nhập
 * vào không nên thấy tab của người trước.
 */
export function xoaHetTabBenVung() {
  kho.clear()
}
