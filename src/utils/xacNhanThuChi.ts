/**
 * MỤC 729 (01/11/2026) — HỎI LẠI TRƯỚC KHI LƯU PHIẾU THU / CHI (đề xuất số 5a).
 *
 * s68 01/11: "làm tiếp 4 và 5 luôn" — số 5 = chặn nhầm thu/chi, s68 cho đụng Tiến Nga.
 * Sự cố gốc MỤC 717 (29/10): kế toán trả nợ đối tác nhưng để công tắc ở "Chi" ⇒ quỹ GIẢM thay vì
 * TĂNG, công nợ đối tác càng xa 0. Không có lỗi nào báo — chỉ phát hiện khi đối chiếu quỹ.
 *
 * Hộp hỏi lại nói bằng LỜI HẬU QUẢ, không nhắc lại tên nút đã chọn:
 *   "Quỹ «X» sẽ GIẢM 5.000.000" dễ thấy sai hơn "Bạn chọn: Chi".
 * Có công nợ thì hiện thêm "Công nợ: A → B". Nếu B XA 0 hơn A (|B| > |A|) — tức khoản "trả nợ" lại làm
 * nợ phình ra — hộp đổi sang màu cảnh báo và nút đổi thành "Vẫn lưu".
 * VÌ SAO luật |B| > |A| mà không xét dấu: dấu công nợ khác nhau giữa đối tác bán / mua và hộ dân
 * (MỤC 717 soi ra nợ bán là số âm). Trả nợ — bên nào trả cũng vậy — luôn làm nợ về GẦN 0.
 * VÌ SAO chỉ cảnh báo, không chặn hẳn: có trường hợp thật làm nợ tăng (ứng thêm, ghi bù) — kế toán
 * vẫn lưu được, chỉ phải bấm thêm một lần có chủ ý.
 */
import { h } from 'vue'
import { ElMessageBox } from 'element-plus'

export interface ThongTinThuChi {
  loai: 'thu' | 'chi'
  soTien: number
  tenQuy?: string
  doiTuong?: string
  congNoCu?: number | null
  congNoMoi?: number | null
}

const so = (x: number) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(x || 0)

/** Nợ sau giao dịch xa 0 hơn trước ⇒ đáng ngờ (xem lời ghi đầu file). */
export function noXaHon(cu: number | null | undefined, moi: number | null | undefined): boolean {
  if (cu === null || cu === undefined || moi === null || moi === undefined) return false
  return Math.abs(moi) > Math.abs(cu)
}

/** Hiện hộp hỏi lại. Trả `true` khi người dùng bấm lưu, `false` khi bấm "Sửa lại" / đóng. */
export async function xacNhanThuChi(t: ThongTinThuChi): Promise<boolean> {
  const laThu = t.loai === 'thu'
  const mau = laThu ? '#15803d' : '#b91c1c'
  const ngo = noXaHon(t.congNoCu, t.congNoMoi)
  const dong: any[] = [
    h('div', { style: 'font-size:16px;font-weight:700;color:' + mau },
      (laThu ? 'Phiếu THU ' : 'Phiếu CHI ') + so(t.soTien) + ' VNĐ'),
    h('div', { style: 'margin-top:6px' }, [
      // Tên quỹ thật thường đã có chữ "Quỹ …" — không ghép thêm cho khỏi thành "Quỹ Quỹ tiền mặt".
      /^quỹ/i.test(t.tenQuy || '') ? '' : 'Quỹ ', h('b', t.tenQuy || '(chưa chọn quỹ)'), ' sẽ ',
      h('b', { style: 'color:' + mau }, laThu ? 'TĂNG' : 'GIẢM'), ' ' + so(t.soTien) + ' VNĐ.',
    ]),
  ]
  if (t.congNoCu !== undefined && t.congNoCu !== null && t.congNoMoi !== undefined && t.congNoMoi !== null) {
    dong.push(h('div', { style: 'margin-top:6px' }, [
      'Công nợ' + (t.doiTuong ? ' của ' : ''), t.doiTuong ? h('b', t.doiTuong) : '', ': ',
      h('span', { style: 'font-variant-numeric:tabular-nums' }, so(t.congNoCu) + ' → '),
      h('b', { style: 'font-variant-numeric:tabular-nums' }, so(t.congNoMoi)),
    ]))
  }
  if (ngo) {
    dong.push(h('div', {
      style: 'margin-top:10px;padding:8px 10px;border-radius:8px;background:#fef3c7;color:#92400e;border:1px solid #fcd34d',
    }, '⚠ Sau phiếu này công nợ XA 0 hơn trước. Trả nợ thường làm công nợ về gần 0 — kiểm lại đã chọn đúng THU / CHI chưa.'))
  }
  try {
    await ElMessageBox.confirm(h('div', dong), ngo ? 'Kiểm lại Thu / Chi' : 'Xác nhận phiếu', {
      confirmButtonText: ngo ? 'Vẫn lưu' : 'Đúng, lưu',
      cancelButtonText: 'Sửa lại',
      type: ngo ? 'warning' : 'info',
      confirmButtonClass: ngo ? 'el-button--danger' : '',
      distinguishCancelAndClose: true,
      // Không cho bấm ra ngoài để đóng: bấm nhầm ra ngoài = coi như "Sửa lại", không lưu.
      closeOnClickModal: false,
    })
    return true
  } catch {
    return false
  }
}
