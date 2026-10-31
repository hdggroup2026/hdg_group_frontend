/**
 * MỤC 731 (01/11/2026) — BỀ RỘNG THANH MENU TRÁI (khung mới), KÉO GIÃN ĐƯỢC.
 *
 * s68 01/11 (kèm ảnh màn 1076px chỉ còn "Tr", "Ti", "Gg"…): "thanh menu trái kéo giãn được, và khi không
 * đủ chiều ngang hiển thị nội dung thì chỉ hiển thị icon (thay cho các ô màu) luôn. và đưa chuột vào icon
 * thì sẽ hiện tên của mục đó".
 *
 * Trước (MỤC 718/722): bề rộng cố định theo màn hình — ≥1280px 268px, 768–1279px cột 64px với 2 chữ cái
 * đầu. Nay:
 *   · người dùng KÉO mép phải thanh trái (hoặc bấm nút thu/mở ở chân thanh) — nhớ theo máy (localStorage);
 *   · hẹp hơn MENU_MIN_CHU ⇒ "thu gọn": chỉ biểu tượng, rê chuột hiện tên (AppShell.vue);
 *   · chưa từng kéo ⇒ mặc định như cũ (268px máy tính, thu gọn máy tính bảng);
 *   · không bao giờ rộng quá 35% màn hình — kéo quá tay trên máy nhỏ vẫn còn chỗ cho nội dung.
 * VÌ SAO dùng chung một biến cấp module (không để trong AppShell): KhungMoi.vue cần biết đang thu gọn
 * để hiện hàng chip mục con thay cho mục con trong thanh trái — hai chỗ đọc cùng một nguồn.
 */
import { computed } from 'vue'
import { useStorage, useWindowSize } from '@vueuse/core'

export const MENU_HEP = 64          // bề rộng khi thu gọn (chỉ biểu tượng)
export const MENU_MIN_CHU = 160     // hẹp hơn mức này thì chữ không đủ chỗ ⇒ thu gọn
export const MENU_MAC_DINH = 268    // = --hdg-sidebar-w (tokens.css)
export const MENU_MAX = 380

// 0 = chưa từng kéo (dùng mặc định theo màn hình). Lưu số px người dùng chọn.
const daLuu = useStorage<number>('hdg_menu_rong', 0)

export function dungRongMenu() {
  const { width } = useWindowSize()
  const rong = computed(() => {
    const tran = Math.max(MENU_HEP, Math.min(MENU_MAX, Math.round(width.value * 0.35)))
    const muon = daLuu.value || (width.value >= 1280 ? MENU_MAC_DINH : MENU_HEP)
    return muon < MENU_MIN_CHU ? MENU_HEP : Math.min(muon, tran)
  })
  const thuGon = computed(() => rong.value < MENU_MIN_CHU)
  const datRong = (px: number) => { daLuu.value = Math.max(MENU_HEP, Math.min(MENU_MAX, Math.round(px))) }
  const doiThuGon = () => datRong(thuGon.value ? MENU_MAC_DINH : MENU_HEP)
  return { rong, thuGon, datRong, doiThuGon }
}
