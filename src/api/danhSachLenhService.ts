/**
 * MỤC 721 (30/10/2026) — GỌI API TRANG "DANH SÁCH LỆNH" (backend MỤC 720).
 *
 * Chỉ đọc, trừ `luuRaSoat` (ghi chú rà soát — không điều khiển bot).
 * Kiểu dữ liệu khớp app/services/danh_sach_lenh.py; đổi bên kia thì đổi ở đây.
 */
import { getApiUrl, getApiHeaders } from './apiConfig'

export type TrangThaiRaSoat = 'chua_ra' | 'da_ra' | 'can_sua'

export interface HamXuLy {
  file: string
  dong: number
  ham: string
  decorators: string[]
  /** null = KHÔNG có @require_user_type — hiện "chưa rõ", không bao giờ "Mọi người". */
  khoa: string[] | null
}

export interface RaSoat {
  trang_thai: TrangThaiRaSoat
  ghi_chu?: string | null
  nguoi_sua?: string | null
  thoi_diem?: string | null
}

export interface Lenh {
  lenh: string
  mo_ta: string
  loai: 'Menu' | 'Reply' | 'Thường'
  /** Chỉ số vào `loai_nhom` của dự án. */
  loai_nhom: number[]
  so_nhom: number
  khoa: string[] | null
  ham: HamXuLy[]
  ra_soat?: RaSoat
}

export interface LoaiNhom {
  nhan: string
  du_phong: boolean
  to_hop: [string, string][]
  so_lenh: number
  so_nhom: number
  nhom: string[]
  /** Khoá cột ma trận: nhãn + chức danh (gộp main/member — MỤC 721). */
  cot: string
  ten_cot: string
}

export interface DuAnLenh {
  du_an: string
  loai_nhom: LoaiNhom[]
  lenh: Lenh[]
  tien_do: { da_ra: number; can_sua: number; tong: number }
}

export interface TheDuAn {
  du_an: string
  so_lenh: number
  so_loai_nhom: number
  so_cot: number
  so_nhom: number
  menu: number
  thuong: number
  reply: number
  chua_ro_khoa: number
}

export interface TongQuan {
  so_lenh: number
  so_loai_nhom: number
  so_cot: number
  so_du_an: number
  lenh_chung: { lenh: string; du_an: string[] }[]
  du_an: TheDuAn[]
  tien_do: { da_ra: number; can_sua: number; tong: number }
  so_can_ra_soat: number
  /** [tên lệnh, mô tả, dự án] */
  moi_lenh: [string, string, string][]
}

export interface CanRaSoat {
  chua_ro_khoa: { lenh: string; du_an: string[]; chung: boolean; ham: HamXuLy[] }[]
  so_luot_chua_ro: number
  thieu_lenh_nen: { du_an: string; loai_nhom: string; thieu: string[]; so_nhom: number }[]
  nhieu_ham: { lenh: string; ham: HamXuLy[] }[]
}

async function goi<T>(duong: string, than?: unknown): Promise<T> {
  const baseUrl = await getApiUrl()
  const res = await fetch(`${baseUrl}/danh-sach-lenh/${duong}`, {
    method: than === undefined ? 'GET' : 'POST',
    headers: { ...getApiHeaders(), 'Content-Type': 'application/json' },
    body: than === undefined ? undefined : JSON.stringify(than),
  })
  if (!res.ok) {
    let loi = `Lỗi ${res.status}`
    try { loi = (await res.json()).detail || loi } catch { /* giữ câu mặc định */ }
    throw new Error(loi)
  }
  return (await res.json()) as T
}

export const danhSachLenhService = {
  tongQuan: () => goi<TongQuan>('tong-quan'),
  duAn: (ten: string) => goi<DuAnLenh>(`du-an/${encodeURIComponent(ten)}`),
  canRaSoat: () => goi<CanRaSoat>('can-ra-soat'),
  luuRaSoat: (lenh: string, trang_thai: TrangThaiRaSoat, ghi_chu: string) =>
    goi<RaSoat>('ra-soat', { lenh, trang_thai, ghi_chu }),
}
