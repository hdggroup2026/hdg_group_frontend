/**
 * ══════════════════════════════════════════════════════════════════════
 * MỤC 700 (10/10/2026) — APP + SIM GẮN VÀO MÁY, DÙNG CHUNG CHO 3 TAB
 *
 * s68 chốt: cột "+ App", "Mật khẩu thiết bị", "SĐT" (MỤC 698, 699 ở tab Điện
 * thoại) làm luôn cho Máy tính bảng và Laptop.
 *
 * 🔴 MỘT CHỖ, BA TAB. MỤC 698/699 viết thẳng trong `PhoneTab.vue`; chép sang
 * hai tab nữa là ba bản phải sửa cùng lúc — bài học MỤC 424 / 391 (sửa một bản,
 * quên bản kia). Nay gom về đây, `PhoneTab.vue` cũng dùng.
 *
 * `loai` = `device_type` trong `installed_apps` / `sim_cards`:
 * 'smartphone' | 'tablet' | 'laptop'. Dòng cũ chưa khai loại (NULL) coi là
 * 'smartphone' — đúng mặc định phía máy chủ (MỤC 436). Lọc theo loại vì mã
 * máy có thể trùng giữa các bảng thiết bị.
 *
 * ⚠️ MỘT lời gọi cho mỗi loại dữ liệu, gom tại chỗ — không gọi theo từng máy
 * (bẫy HDG_131).
 * ══════════════════════════════════════════════════════════════════════
 */
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { otherService } from '@/api/otherService'

export type LoaiMay = 'smartphone' | 'tablet' | 'laptop'

export function dungThietBiPhu(loai: LoaiMay) {
  const dungLoai = (x: any) => (x?.device_type || 'smartphone') === loai

  // ── App theo máy ──
  const dsTatCaApp = ref<any[]>([])
  const appTheoMay = reactive<Record<string, any[]>>({})
  const napApp = async () => {
    try {
      const [apps, lienKet] = await Promise.all([
        otherService.getApplications(),
        otherService.getInstalledAppsByApp(''),
      ])
      dsTatCaApp.value = (apps || []).slice().sort((a: any, b: any) =>
        String(a.app_name || '').localeCompare(String(b.app_name || ''), 'vi'))
      const theoMa: Record<string, any> = {}
      for (const a of dsTatCaApp.value) theoMa[a.id] = a
      for (const k of Object.keys(appTheoMay)) delete appTheoMay[k]
      for (const d of (lienKet || [])) {
        if (!dungLoai(d)) continue
        const a = theoMa[d.app_id]
        if (a) (appTheoMay[d.device_id] ||= []).push(a)
      }
    } catch {
      // Hỏng thì cột vẫn bấm được (hộp gắn tự tải lại) — KHÔNG chặn cả bảng.
    }
  }
  const appCua = (ma: string): any[] => appTheoMay[ma] || []

  // ── SIM theo máy: SIM chính trước, rồi theo mã ──
  const simTheoMay = reactive<Record<string, any[]>>({})
  const ghiSim = (dsSim: any[]) => {
    for (const k of Object.keys(simTheoMay)) delete simTheoMay[k]
    for (const s of (dsSim || [])) {
      if (s.device_id && dungLoai(s)) (simTheoMay[s.device_id] ||= []).push(s)
    }
  }
  const napSim = async () => {
    try { ghiSim(await otherService.getSimCards()) } catch { /* như trên */ }
  }
  const simCua = (ma: string): any[] =>
    [...(simTheoMay[ma] || [])].sort((a, b) =>
      (b.la_sim_chinh ? 1 : 0) - (a.la_sim_chinh ? 1 : 0) || String(a.id).localeCompare(String(b.id)))
  const datSimChinh = async (sim: any) => {
    try {
      await otherService.datSimChinh(sim.id)
      ElMessage.success(`Đã đặt ${sim.phone_number} là SIM chính.`)
      await napSim()
    } catch (e: any) {
      ElMessage.error(e?.message || 'Không đặt được SIM chính.')
    }
  }

  // ── Hộp gắn app cho một máy ──
  const hienGanApp = ref(false)
  const mayGanApp = ref<any>(null)
  const moGanApp = (row: any) => { mayGanApp.value = row; hienGanApp.value = true }

  return { loai, dsTatCaApp, appTheoMay, napApp, appCua,
           simTheoMay, ghiSim, napSim, simCua, datSimChinh,
           hienGanApp, mayGanApp, moGanApp }
}
