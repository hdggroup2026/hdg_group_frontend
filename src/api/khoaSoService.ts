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

export const khoaSoService = {
  danhSach: (): Promise<{ san_sang: boolean; thang: ThangKhoa[] }> => goi('/danh-sach'),
  kiem: (ngay: string): Promise<{ khoa: boolean; thong_bao: string | null }> =>
    goi(`/kiem?ngay=${encodeURIComponent(ngay)}`),
  khoa: (thang: string, ghi_chu = '') =>
    goi('/khoa', { method: 'POST', body: JSON.stringify({ thang, ghi_chu }) }),
  mo: (thang: string) => goi('/mo', { method: 'POST', body: JSON.stringify({ thang }) }),
}
