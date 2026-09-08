/**
 * ══ MỤC 593 (08/09/2026) — MỘT CHỖ KHAI KIỂU DUY NHẤT CHO MẢNG RENTAL ══
 *
 * BỐI CẢNH: Cloudflare dựng đỏ hai lần liên tiếp (15:40 và 16:13 ngày
 * 08/09/2026) với cùng ba dòng lỗi:
 *
 *   src/components/Rental/RealEstateTabWrapper.vue(16,12): error TS2322
 *   src/components/Rental/RealEstateTabWrapper.vue(17,12): error TS2322
 *   src/components/Rental/RealEstateTabWrapper.vue(18,12): error TS2322
 *     Type 'Property' is missing the following properties from type
 *     'Property': chat_id, group_name, zalo_nhom, khach_trong_nhom
 *
 * NGUYÊN NHÂN GỐC: cùng một khái niệm "bất động sản" được khai TAY ở BA
 * file khác nhau, mỗi file một bản chép:
 *
 *   RealEstateTabWrapper.vue   dòng 458   23 trường (MỤC 588 đã thêm 4)
 *   RealEstateCards.vue        dòng 401   19 trường (KHÔNG được thêm)
 *   RealEstateTableQuery.vue   dòng 351   19 trường (KHÔNG được thêm)
 *
 * MỤC 588 thêm bốn trường vào bản của Wrapper mà quên hai bản kia. Con
 * (Cards) phát sự kiện mang kiểu 19 trường, cha (Wrapper) nhận bằng hàm
 * cần kiểu 23 trường — TypeScript từ chối. Ba dòng 16/17/18 trong template
 * Wrapper chính là @edit, @delete, @detail.
 *
 * 🔴 VÌ SAO GOM VỀ MỘT FILE, KHÔNG CHÉP BỐN DÒNG SANG HAI FILE KIA:
 * Chép bốn dòng chữa được lần này nhưng để nguyên cái bẫy. Lần sau thêm
 * cột thứ năm là vỡ lại đúng chỗ này — MỤC 588 đã vỡ lần một. Gom về một
 * chỗ khai thì thêm cột chỉ sửa một file, không thể quên file nào.
 *
 * 🔴 KIỂU GIỮ NGUYÊN Y HỆT bản đang có ở Wrapper dòng 458–485, KHÔNG đổi
 * `string` thành `string | null` dù dữ liệu từ API có thể trả null. Lý do:
 * mục này đang chữa bản dựng ĐỎ, mọi thay đổi tính chất kiểu đều có thể
 * sinh lỗi mới ở 3 file kia mà không có vue-tsc để kiểm tại chỗ. Việc siết
 * kiểu cho đúng null là một MỤC riêng, làm khi web đã xanh trở lại.
 */

/** Một bất động sản — bảng `real_estates` bên backend. */
export interface Property {
  id: string
  real_estate_id: string
  address: string
  start_buy: string
  end_buy: string
  total_cost: number
  real_estate_cost: number
  construction_cost: number
  furniture_cost: number
  sale_cost: number
  contributed_cost: number
  monthly_interest_rate: number
  mining_profit: number
  rental_profit: number
  start_sale: string
  end_sale: string
  profit_after_tax: number
  profit_after_sale: number
  status: string
  note: string
  current_estimated: number
  // ══ Bốn trường của MỤC 587 / 588 ══
  // Nhóm Telegram gắn theo BẤT ĐỘNG SẢN, không theo khách.
  chat_id: string
  group_name: string
  zalo_nhom: string
  khach_trong_nhom: boolean
}
