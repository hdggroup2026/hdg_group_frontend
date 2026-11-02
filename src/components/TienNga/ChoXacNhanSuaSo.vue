<!--
  MỤC 735 (02/11/2026) — DANH SÁCH CHỜ XÁC NHẬN SỬA SỐ THÁNG ĐÃ KHOÁ (s68: "add vào waiting list trên web").

  Chỉ XEM. Đồng ý / không đồng ý bấm ở nhóm Telegram "I. TN - Tổng Quản Lý" (s68: "bất kỳ nick nào trong nhóm
  xác nhận thì sẽ ghi thật vào") — không làm nút trên web: hai chỗ bấm là hai đường ghi phải giữ khớp nhau.
  `gon`: dạng thanh nhỏ đầu trang Thu mua (bấm mở danh sách); không `gon`: hiện thẳng danh sách (trang Khoá sổ).
-->
<template>
  <div v-if="sanSang" class="cxn">
    <template v-if="gon">
      <div v-if="soDangCho > 0" class="cxn-thanh cxn-thanh--cho" @click="moDs = true">
        🔒 <b>{{ soDangCho }}</b> sửa đổi tháng đã khoá đang chờ nhóm <b>I. TN - Tổng Quản Lý</b> xác nhận — chưa ghi vào sổ.
        <span class="cxn-link">Xem</span>
      </div>
      <div v-else-if="ds.length" class="cxn-thanh" @click="moDs = true">
        🔒 Danh sách chờ xác nhận (sửa tháng đã khoá) <span class="cxn-link">Xem</span>
      </div>
      <el-dialog v-model="moDs" title="🔒 Chờ xác nhận — sửa phiếu tháng đã khoá sổ" width="min(720px, 94vw)" append-to-body
                 class="cxn-hop">
        <div class="cxn-ds">
          <div v-for="d in ds" :key="d.id" class="cxn-the">
            <div class="cxn-dau">
              <span :class="['cxn-trang', 'cxn-' + d.trang_thai]">{{ d.trang_thai_chu }}</span>
              <span class="cxn-nho">{{ d.loai_chu }}<template v-if="d.thang"> · tháng {{ d.thang }}</template></span>
              <!-- MỤC 736 — s68: "huỷ được trên web luôn" -->
              <el-button v-if="d.trang_thai === 'PENDING'" size="small" type="danger" plain class="cxn-huy"
                         :loading="dangHuy === d.id" @click="huy(d)">Huỷ yêu cầu</el-button>
            </div>
            <pre class="cxn-mo-ta">{{ d.mo_ta }}</pre>
            <div class="cxn-nho">📝 Lý do: {{ d.ly_do }}</div>
            <div class="cxn-nho">👤 {{ d.nguoi_yeu_cau || '—' }} · {{ ngayGio(d.created_at) }}
              <span v-if="d.nguoi_xu_ly"> · xử lý: {{ d.nguoi_xu_ly }} {{ ngayGio(d.xu_ly_luc) }}</span>
              <span v-if="d.trang_thai === 'PENDING' && !d.da_gui_nhom"> · ⚠️ chưa gửi được lên nhóm, sáng mai máy gửi lại</span>
            </div>
            <div v-if="d.ket_qua" class="cxn-loi">⚠️ {{ d.ket_qua }}</div>
          </div>
          <div v-if="!ds.length" class="cxn-nho">Chưa có yêu cầu nào.</div>
        </div>
      </el-dialog>
    </template>
    <template v-else>
      <div v-if="!ds.length" class="cxn-nho">Chưa có yêu cầu nào.</div>
      <div v-for="d in ds" :key="d.id" class="cxn-the">
        <div class="cxn-dau">
          <span :class="['cxn-trang', 'cxn-' + d.trang_thai]">{{ d.trang_thai_chu }}</span>
          <span class="cxn-nho">{{ d.loai_chu }}<template v-if="d.thang"> · tháng {{ d.thang }}</template></span>
          <el-button v-if="d.trang_thai === 'PENDING'" size="small" type="danger" plain class="cxn-huy"
                     :loading="dangHuy === d.id" @click="huy(d)">Huỷ yêu cầu</el-button>
        </div>
        <pre class="cxn-mo-ta">{{ d.mo_ta }}</pre>
        <div class="cxn-nho">📝 Lý do: {{ d.ly_do }}</div>
        <div class="cxn-nho">👤 {{ d.nguoi_yeu_cau || '—' }} · {{ ngayGio(d.created_at) }}
          <span v-if="d.nguoi_xu_ly"> · xử lý: {{ d.nguoi_xu_ly }} {{ ngayGio(d.xu_ly_luc) }}</span>
        </div>
        <div v-if="d.ket_qua" class="cxn-loi">⚠️ {{ d.ket_qua }}</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { khoaSoService, type DongChoXacNhan } from '@/api/khoaSoService'

const props = defineProps<{ gon?: boolean }>()

const ds = ref<DongChoXacNhan[]>([])
const soDangCho = ref(0)
const sanSang = ref(false)
const moDs = ref(false)

const ngayGio = (s?: string | null) => (s ? new Date(s).toLocaleString('vi-VN') : '')

async function tai() {
  try {
    const kq = await khoaSoService.choXacNhan(props.gon ? 30 : 200)
    sanSang.value = kq.san_sang
    ds.value = kq.ds
    soDangCho.value = kq.so_dang_cho
  } catch {
    // Không đọc được (máy chủ cũ / mất mạng) thì im — khung này chỉ để xem, không được làm hỏng trang Thu mua.
    sanSang.value = false
  }
}

// MỤC 736 (02/11/2026) — huỷ yêu cầu còn chờ; máy chủ sửa tin trên nhóm thành "ĐÃ HUỶ" + báo một dòng.
const dangHuy = ref('')
async function huy(d: DongChoXacNhan) {
  try {
    await ElMessageBox.confirm(
      `Huỷ yêu cầu "${d.loai_chu}"? Sổ giữ nguyên như cũ, bot báo lên nhóm I. TN - Tổng Quản Lý là đã huỷ.`,
      'Huỷ yêu cầu', { confirmButtonText: 'Huỷ yêu cầu', cancelButtonText: 'Thôi', type: 'warning' })
  } catch { return }
  dangHuy.value = d.id
  try {
    const kq = await khoaSoService.huy(d.id)
    ElMessage.success(kq.da_bao_nhom ? 'Đã huỷ — đã báo lên nhóm.' : 'Đã huỷ (chưa báo được lên nhóm).')
  } catch (e: any) {
    ElMessage.error(e?.message || 'Không huỷ được.')
  } finally {
    dangHuy.value = ''
    await tai()
  }
}

defineExpose({ tai })
onMounted(tai)
</script>

<style scoped>
.cxn-thanh { font-size: 13px; padding: 8px 12px; border-radius: 8px; cursor: pointer; margin-bottom: 10px;
  border: 1px dashed var(--el-border-color); color: var(--el-text-color-secondary); }
.cxn-thanh--cho { border: 1px solid var(--el-color-warning); background: var(--el-color-warning-light-9);
  color: var(--el-text-color-primary); }
.cxn-link { margin-left: 8px; color: var(--el-color-primary); text-decoration: underline; }
.cxn-ds { max-height: 65vh; overflow-y: auto; }
.cxn-the { border: 1px solid var(--el-border-color-lighter); border-radius: 10px; padding: 10px 12px; margin-bottom: 10px;
  background: var(--el-bg-color); }
.cxn-dau { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 6px; }
.cxn-trang { font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 999px;
  background: var(--el-fill-color); }
.cxn-PENDING, .cxn-WRITING { background: var(--el-color-warning-light-8); }
.cxn-APPLIED { background: var(--el-color-success-light-8); }
.cxn-REJECTED { background: var(--el-fill-color-dark); }
.cxn-FAILED { background: var(--el-color-danger-light-8); }
.cxn-mo-ta { white-space: pre-wrap; word-break: break-word; font-family: inherit; font-size: 13px; margin: 0 0 6px; }
.cxn-nho { font-size: 12px; color: var(--el-text-color-secondary); }
.cxn-loi { font-size: 12px; color: var(--el-color-danger); margin-top: 4px; }
.cxn-huy { margin-left: auto; }
.cxn-CANCELLED { background: var(--el-fill-color-dark); }
</style>
