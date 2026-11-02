/**
 * MỤC 735 (02/11/2026) — SỬA PHIẾU THU MUA THÁNG ĐÃ KHOÁ SỔ ➜ DANH SÁCH CHỜ XÁC NHẬN.
 *
 * s68 02/11: "cho kế toán sửa và add vào waiting list trên web. Và gửi nút xác nhận về nhóm hình 1
 * [I. TN - Tổng Quản Lý] bất kỳ nick nào trong nhóm xác nhận thì sẽ ghi thật vào."
 *
 * Luật nằm ở MÁY CHỦ (app/services/cho_xac_nhan.py). Web chỉ:
 *   · gọi như cũ; máy chủ trả 428 (tháng đã khoá, cần lý do) ➜ hỏi lý do ➜ gọi lại kèm lý do;
 *   · máy chủ trả 202 `{cho_xac_nhan: true}` ➜ báo "chưa ghi, đang chờ nhóm xác nhận".
 * VÌ SAO web không tự kiểm tháng khoá trước: hai nơi giữ một luật là hai nguồn lệch nhau (MỤC 300/304).
 */
import { ElMessageBox, ElNotification } from 'element-plus'

export const MA_CAN_LY_DO = 428
export const LY_DO_TOI_THIEU = 5

/** MỤC 736 — hộp hỏi lý do (dùng chung cho thu mua và thu chi). Bấm "Thôi" ➜ null. */
export async function hoiLyDoKhoaSo(thongBao: string): Promise<string | null> {
  try {
    const kq: any = await ElMessageBox.prompt(
      `${thongBao}\n\nGhi lý do sửa:`,
      '🔒 Tháng đã khoá sổ',
      {
        confirmButtonText: 'Gửi xin xác nhận',
        cancelButtonText: 'Thôi',
        inputType: 'textarea',
        inputPlaceholder: 'VD: cân lại sai 1 kg, khách báo nhầm độ, nhập trùng phiếu chi…',
        inputValidator: (v: string) =>
          (v || '').trim().length >= LY_DO_TOI_THIEU || `Lý do ít nhất ${LY_DO_TOI_THIEU} ký tự`,
        type: 'warning',
      },
    )
    return String(kq?.value || '').trim()
  } catch {
    return null
  }
}

/** Gọi `goi()`; tháng đã khoá (428) thì hỏi lý do rồi gọi lại. Người dùng bấm "Thôi" ➜ null. */
export async function goiCoLyDoKhoaSo<T>(goi: (lyDo?: string) => Promise<T>): Promise<T | null> {
  try {
    return await goi()
  } catch (e: any) {
    if (e?.status !== MA_CAN_LY_DO) throw e
    const lyDo = await hoiLyDoKhoaSo(e.message)
    if (!lyDo) return null
    return await goi(lyDo)
  }
}

export function laChoXacNhan(kq: any): boolean {
  return !!kq && !Array.isArray(kq) && kq.cho_xac_nhan === true
}

export function baoChoXacNhan(kq: any, them = '') {
  ElNotification({
    title: '🔒 Chưa ghi — đang chờ xác nhận',
    message: `${kq?.thong_bao || 'Đã đưa vào danh sách chờ.'}${them ? ' ' + them : ''}`
      + ' Xem ở khung "Chờ xác nhận" đầu trang Thu mua (huỷ được ở đó).',
    type: 'warning',
    duration: 12000,
  })
}
