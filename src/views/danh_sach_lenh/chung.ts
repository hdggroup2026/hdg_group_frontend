/**
 * MỤC 721 (30/10/2026) — phần dùng chung của trang Danh sách lệnh.
 *
 * Màu dự án lấy theo ảnh thiết kế `danh_sach_lenh/01` (chấm màu cạnh tên dự án).
 * Tên dự án trong database là "Thu Hoạch"; trên màn hiện "Thu Hoạch (Vĩnh Hà)" như ảnh mẫu.
 */
import type { HamXuLy } from '@/api/danhSachLenhService'

const MAU: Record<string, string> = {
  'Tiến Nga': '#2f6f43',
  'Thu Hoạch': '#c9a24a',
  Rental: '#2c6fb7',
  Credit: '#7a4fb5',
  'Hụi': '#b9382b',
  GgoMooSin: '#1f8a8a',
  Other: '#68726a',
}

export function mauDuAn(ten: string): string {
  return MAU[ten] || '#68726a'
}

export function tenHien(ten: string): string {
  return ten === 'Thu Hoạch' ? 'Thu Hoạch (Vĩnh Hà)' : ten
}

/** Khoá quyền để hiện. null = CHƯA RÕ — tuyệt đối không ghi "Mọi người" (PROMPT_01 bẫy 9). */
export function chuKhoa(khoa: string[] | null, laMenu = false): string {
  if (khoa === null) return laMenu ? 'Menu nút bấm' : ''
  return khoa.map((k) => k.charAt(0) + k.slice(1).toLowerCase()).join(', ')
}

/** "bot/handlers/commands.py:427" — chỗ khai hàm xử lý. */
export function noiKhai(h: HamXuLy): string {
  return `${h.file.replace(/^bot\/handlers\//, '')}:${h.dong}`
}
