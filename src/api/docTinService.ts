/**
 * MỤC 677 (08/10/2026) — ĐỌC TIN TELEGRAM (chỉ tài khoản superowner).
 *
 * Đường: /api/v1/doc-tin/...  — xem `app/api/v1/doc_tin.py` ở backend.
 *
 * 🔴 Frontend KHÔNG tự quyết ai được xem. Máy chủ trả 403 cho người không
 * phải superowner; nơi gọi thấy 403 thì ẩn hẳn phần đọc tin. Ẩn bằng giao
 * diện chỉ là cho gọn mắt — cửa thật nằm ở máy chủ.
 */
import { getApiUrl, getApiHeaders } from './apiConfig'
import { authService } from './auth'

async function goi(duong: string, method = 'GET'): Promise<any> {
  const baseUrl = await getApiUrl()
  const res = await fetch(`${baseUrl}/doc-tin${duong}`, { method, headers: getApiHeaders() })
  if (res.status === 401) authService.handle401()
  if (!res.ok) {
    const ct = await res.json().catch(() => ({}))
    const loi: any = new Error(ct?.detail || `Lỗi ${res.status} khi đọc tin Telegram`)
    loi.status = res.status
    throw loi
  }
  return await res.json()
}

export const docTinService = {
  /** 403 ➜ không phải superowner. */
  trangThai: () => goi('/trang-thai'),
  tongTheoDuAn: (lamMoi = false) => goi(`/du-an${lamMoi ? '?lam_moi=true' : ''}`),
  nhomCuaDuAn: (projectId: string, lamMoi = false) =>
    goi(`/du-an/${encodeURIComponent(projectId)}/nhom${lamMoi ? '?lam_moi=true' : ''}`),
  tinCuaNhom: (chatId: string) => goi(`/nhom/${encodeURIComponent(chatId)}/tin`),
  // MỤC 680 — "Tất cả nhóm" (tim rỗng, tin mới lên trên) và ô tìm tên nhóm (ABC)
  tatCa: (tim = '', lamMoi = false) => {
    const q = new URLSearchParams()
    if (tim) q.append('tim', tim)
    if (lamMoi) q.append('lam_moi', 'true')
    const qs = q.toString()
    return goi(`/tat-ca${qs ? '?' + qs : ''}`)
  },
  ghim: (chatId: string, ghim: boolean) =>
    goi(`/ghim?chat_id=${encodeURIComponent(chatId)}&ghim=${ghim}`, 'POST'),
}
