<!--
  MỤC 730 (01/11/2026) — TRANG KHOÁ SỔ THÁNG (đề xuất số 5b, chỉ admin).

  Tháng đã khoá ⇒ không thêm / xoá phiếu thu chi Tiến Nga có ngày trong tháng đó (web + lệnh bot nhập
  phiếu). Luật nằm ở máy chủ (app/services/khoa_so.py); trang này chỉ khoá / mở và liệt kê.
  Chỉ khoá được tháng ĐÃ QUA (máy chủ cũng chặn) — khoá tháng đang chạy là chặn kế toán nhập phiếu hằng ngày.
-->
<template>
  <div class="ks h-full overflow-y-auto p-4 sm:p-6">
    <div class="max-w-3xl mx-auto">
      <h1 class="ks-tieu-de">Khoá sổ tháng — Tiến Nga</h1>
      <p class="ks-phu">
        Tháng đã khoá thì <b>không ai thêm hay xoá được phiếu thu chi</b> của tháng đó, kể cả qua bot.
        Muốn sửa số tháng cũ: mở khoá ➜ sửa ➜ khoá lại.
      </p>
      <!-- MỤC 732 (01/11/2026) — s68: "auto khóa số liệu tháng cũ vào ngày 3 hàng tháng". Máy chủ tự khoá
           (bot/utils/scheduler.py, worker 8h); mở khoá sau ngày 3 thì KHÔNG bị tự khoá lại trong tháng đó. -->
      <p class="ks-phu">
        🤖 <b>Tự khoá:</b> 11:00 ngày 3 hằng tháng, máy tự khoá sổ tháng trước và báo vào nhóm Telegram Tiến Nga.
        Mở khoá sau ngày đó thì máy không tự khoá lại — nhớ tự khoá lại khi sửa xong.
      </p>

      <el-alert v-if="loi" :title="loi" type="error" show-icon :closable="false" class="mb-4" />
      <el-alert v-else-if="!sanSang && !dangTai" type="warning" show-icon :closable="false" class="mb-4"
                title="Máy chủ chưa chạy migration khoá sổ (bấm 11 rồi 12 trên máy chủ). Chưa khoá được tháng nào." />

      <div class="ks-the">
        <div class="ks-nhan">Khoá thêm một tháng</div>
        <div class="flex flex-wrap items-center gap-2">
          <el-config-provider :locale="viVN">
            <el-date-picker v-model="thangChon" type="month" value-format="YYYY-MM" format="MM/YYYY"
                            placeholder="Chọn tháng" :disabled-date="khongPhaiThangDaQua" style="width: 140px" />
          </el-config-provider>
          <el-input v-model="ghiChu" placeholder="Ghi chú (tuỳ chọn)" style="max-width: 260px" />
          <el-button type="primary" :disabled="!thangChon || !sanSang" :loading="dangGhi" @click="khoa">
            Khoá sổ tháng này
          </el-button>
        </div>
      </div>

      <div class="ks-nhan mt-6">Các tháng đang khoá ({{ ds.length }})</div>
      <div v-if="dangTai" class="ks-phu">Đang tải…</div>
      <div v-else-if="ds.length === 0" class="ks-phu">Chưa khoá tháng nào — mọi tháng đều sửa được.</div>
      <div v-else class="ks-the p-0">
        <div v-for="t in ds" :key="t.thang" class="ks-dong">
          <div>
            <div class="ks-thang">🔒 {{ chuThang(t.thang) }}</div>
            <div class="ks-chu-nho">
              Khoá bởi {{ t.khoa_boi || '—' }}<span v-if="t.khoa_luc"> · {{ ngayGio(t.khoa_luc) }}</span>
              <span v-if="t.ghi_chu"> · {{ t.ghi_chu }}</span>
            </div>
          </div>
          <el-button size="small" :loading="dangGhi" @click="mo(t.thang)">Mở khoá</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import viVN from 'element-plus/es/locale/lang/vi'
import { khoaSoService, type ThangKhoa } from '@/api/khoaSoService'

const ds = ref<ThangKhoa[]>([])
const sanSang = ref(true)
const dangTai = ref(true)
const dangGhi = ref(false)
const loi = ref('')
const thangChon = ref('')
const ghiChu = ref('')

const homNay = new Date()
// Chỉ cho chọn tháng ĐÃ QUA (trước tháng đang chạy).
const khongPhaiThangDaQua = (d: Date) =>
  d.getFullYear() * 12 + d.getMonth() >= homNay.getFullYear() * 12 + homNay.getMonth()
const chuThang = (t: string) => `${t.slice(5, 7)}/${t.slice(0, 4)}`
const ngayGio = (s: string) => new Date(s).toLocaleString('vi-VN')

async function tai() {
  dangTai.value = true
  loi.value = ''
  try {
    const kq = await khoaSoService.danhSach()
    sanSang.value = kq.san_sang
    ds.value = kq.thang
  } catch (e: any) {
    loi.value = e?.message || 'Không đọc được danh sách tháng đã khoá.'
  } finally {
    dangTai.value = false
  }
}

async function khoa() {
  const t = thangChon.value
  try {
    await ElMessageBox.confirm(
      `Khoá sổ tháng ${chuThang(t)}? Sau khi khoá, không ai thêm hay xoá được phiếu thu chi của tháng này (cả web lẫn bot).`,
      'Khoá sổ', { confirmButtonText: 'Khoá', cancelButtonText: 'Thôi', type: 'warning' })
  } catch { return }
  dangGhi.value = true
  try {
    await khoaSoService.khoa(t, ghiChu.value)
    ElMessage.success(`Đã khoá sổ tháng ${chuThang(t)}`)
    thangChon.value = ''
    ghiChu.value = ''
    await tai()
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không khoá được.')
  } finally {
    dangGhi.value = false
  }
}

async function mo(t: string) {
  try {
    await ElMessageBox.confirm(
      `Mở khoá tháng ${chuThang(t)}? Kế toán sẽ thêm / xoá được phiếu của tháng này. Sửa xong nhớ khoá lại.`,
      'Mở khoá', { confirmButtonText: 'Mở khoá', cancelButtonText: 'Thôi', type: 'warning' })
  } catch { return }
  dangGhi.value = true
  try {
    await khoaSoService.mo(t)
    ElMessage.success(`Đã mở khoá tháng ${chuThang(t)}`)
    await tai()
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không mở khoá được.')
  } finally {
    dangGhi.value = false
  }
}

onMounted(tai)
</script>

<style scoped>
.ks-tieu-de { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
.ks-phu { color: var(--el-text-color-secondary); font-size: 14px; margin: 0 0 16px; }
.ks-the { border: 1px solid var(--el-border-color); border-radius: 12px; padding: 14px 16px; background: var(--el-bg-color); }
.ks-nhan { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--el-text-color-secondary); margin-bottom: 8px; }
.ks-dong { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 16px; border-bottom: 1px solid var(--el-border-color-lighter); }
.ks-dong:last-child { border-bottom: none; }
.ks-thang { font-weight: 700; font-variant-numeric: tabular-nums; }
.ks-chu-nho { font-size: 12px; color: var(--el-text-color-secondary); }
</style>
