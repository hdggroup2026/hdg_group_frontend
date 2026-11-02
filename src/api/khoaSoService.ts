/**
 * MỤC 730 (01/11/2026) — GỌI API KHOÁ SỔ THÁNG (backend app/api/v1/khoa_so.py).
 */
import { getApiUrl, getApiHeaders } from './apiConfig'
import { authService } from './auth'

export interface ThangKhoa {
  thang: string          // "YYYY-MM"
  khoa_boi?: string | null
  ghi_chu?: string | null
  khoa_luc?: string | null
}

async function goi(duong: string, init: RequestInit = {}): Promise<any> {
  const base = await getApiUrl()
  const r = await fetch(`${base}/khoa-so${duong}`, {
    ...init,
    headers: { ...getApiHeaders(), 'Content-Type': 'application/json' },
  })
  if (r.status === 401) authService.handle401()
  const body = await r.json().catch(() => ({}))
  if (!r.ok) {
    const loi: any = new Error(body?.detail || `Lỗi ${r.status}`)
    loi.status = r.status
    throw loi
  }
  return body
}

// MỤC 735 (02/11/2026) — một dòng danh sách chờ xác nhận (backend khoa_so.py `/cho-xac-nhan`).
export interface DongChoXacNhan {
  id: string
  loai: string
  loai_chu: string
  thang: string            // "09/2026"
  mo_ta: string            // chữ trơn, nhiều dòng
  ly_do: string
  trang_thai: string       // PENDING | WRITING | APPLIED | REJECTED | FAILED
  trang_thai_chu: string
  nguoi_yeu_cau?: string | null
  nguoi_xu_ly?: string | null
  ket_qua?: string | null
  da_gui_nhom: boolean
  created_at?: string | null
  xu_ly_luc?: string | null
}

export const khoaSoService = {
  danhSach: (): Promise<{ san_sang: boolean; thang: ThangKhoa[] }> => goi('/danh-sach'),
  kiem: (ngay: string): Promise<{ khoa: boolean; thong_bao: string | null }> =>
    goi(`/kiem?ngay=${encodeURIComponent(ngay)}`),
  khoa: (thang: string, ghi_chu = '') =>
    goi('/khoa', { method: 'POST', body: JSON.stringify({ thang, ghi_chu }) }),
  mo: (thang: string) => goi('/mo', { method: 'POST', body: JSON.stringify({ thang }) }),
  // MỤC 735 — danh sách chờ xác nhận sửa phiếu thu mua tháng đã khoá (chỉ xem).
  choXacNhan: (gioiHan = 100): Promise<{ san_sang: boolean; so_dang_cho: number; ds: DongChoXacNhan[] }> =>
    goi(`/cho-xac-nhan?gioi_han=${gioiHan}`),
}
