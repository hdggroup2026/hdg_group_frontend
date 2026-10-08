<!--
  ══════════════════════════════════════════════════════════════════════
  MỤC 677 (08/10/2026) — NHÓM TELEGRAM CỦA MỘT DỰ ÁN + NỘI DUNG TIN

  s68 chốt 08/10:
   · bấm vào ô dự án ➜ hiện danh sách nhóm của dự án, XẾP ABC (backend
     đã xếp — frontend không xếp lại, một chỗ quyết định thứ tự)
   · mỗi nhóm: số tin chưa đọc, RIÊNG từng số điện thoại
   · bấm vào nhóm ➜ xem các tin gần nhất (không có kéo lên xem tiếp)
   · đọc trên web KHÔNG đánh dấu đã đọc trên điện thoại

  MỤC 680 (08/10/2026) — thêm 2 chế độ + ghim:
   · `che-do="tat-ca"` — nút "Tất cả nhóm": mọi nhóm, tin MỚI NHẤT lên trên
   · `che-do="tim"`    — ô tìm tên nhóm (không dấu cũng ra), xếp ABC
   · nút 📌 ghim tối đa 10 nhóm lên đầu — ghim lưu trên MÁY CHỦ nên điện
     thoại và máy tính thấy giống nhau

  "?" = số đó đang lỗi / chưa đăng nhập ➜ KHÔNG biết, khác hẳn 0.
  "—" = số đó không ở trong nhóm.
  ══════════════════════════════════════════════════════════════════════
-->
<template>
  <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
    <div class="flex items-center justify-between gap-3 mb-3">
      <!-- MỤC 688 — chữ nhỏ hơn + không xuống dòng: khung nay chỉ nửa màn hình. -->
      <h3 class="text-base font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 min-w-0 whitespace-nowrap">
        <span class="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
        TIN NHẮN TELEGRAM
        <span class="text-sm font-normal text-blue-600 dark:text-blue-400">({{ tieuDe }})</span>
        <span class="ml-1 text-xs text-gray-400 font-semibold bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
          {{ nhom.length }} nhóm
        </span>
      </h3>
      <el-button size="small" :loading="dangTai" @click="taiNhom(true)">Làm mới</el-button>
    </div>

    <!-- Trạng thái từng số: chưa đăng nhập / lỗi thì nói rõ cách xử lý -->
    <div v-for="tk in taiKhoan.filter(t => t.trang_thai !== 'san_sang')" :key="tk.ten"
         class="mb-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
      <b>{{ tk.ten }} ({{ tk.so }})</b>:
      <span v-if="tk.trang_thai === 'chua_dang_nhap'">chưa đăng nhập — trên máy chủ bấm đúp <b>6_DANG_NHAP_TELEGRAM.bat</b>.</span>
      <span v-else>không đọc được.</span>
      <div v-if="tk.loi" class="mt-0.5 font-mono break-all opacity-80">Nguyên văn: {{ tk.loi }}</div>
    </div>
    <div v-if="loiTai" class="mb-2 text-xs text-red-600 dark:text-red-400 break-all">{{ loiTai }}</div>
    <div v-if="ghimHong" class="mb-2 text-xs text-red-600 dark:text-red-400">
      File ghim trên máy chủ đang hỏng — tạm không ghim/bỏ ghim được (danh sách cũ được giữ nguyên).
    </div>

    <!-- MỤC 688 — màn rộng: danh sách cao gần hết màn (chừa đầu trang + tiêu đề
         khung), cuộn riêng — để thấy nhiều nhóm hơn trên một màn hình. -->
    <div v-loading="dangTai" class="max-h-[70vh] lg:max-h-[calc(100vh-230px)] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/60">
      <div v-for="n in nhom" :key="n.chat_id">
        <!-- Một dòng nhóm -->
        <div class="flex items-start gap-3 py-1.5 px-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40 rounded-lg"
             @click="moNhom(n)">
          <!-- 📌 Ghim — @click.stop để bấm ghim không mở/đóng tin của nhóm -->
          <button type="button" class="shrink-0 mt-0.5 text-base leading-none"
                  :class="n.ghim ? 'opacity-100' : 'opacity-25 hover:opacity-70'"
                  :title="n.ghim ? 'Bỏ ghim' : 'Ghim lên đầu (tối đa 10)'"
                  @click.stop="doiGhim(n)">📌</button>
          <div class="flex-1 min-w-0">
            <!-- MỤC 688 — tên dự án CÙNG DÒNG với tên nhóm (trước: dòng riêng) — mỗi
                 nhóm bớt một dòng, một màn hình thấy nhiều nhóm hơn. -->
            <!-- MỤC 690 (08/10/2026) — s68: "các nhóm role nhóm main thì cho tên của
                 nhóm main là chữ màu xanh biển luôn để phân biệt nhóm thường là chữ đen". -->
            <div class="font-semibold break-words"
                 :class="n.la_main ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-100'">
              {{ n.ten }}
              <span v-if="n.du_an && n.du_an.length && cheDo !== 'du-an'" class="ml-1 text-[11px] font-normal text-blue-500">
                · {{ n.du_an.join(' · ') }}
              </span>
            </div>
            <div v-if="n.tin_cuoi" class="text-xs text-gray-500 dark:text-gray-400 truncate">
              <span class="font-medium">{{ n.tin_cuoi.nguoi_gui }}:</span> {{ n.tin_cuoi.noi_dung || '(trống)' }}
              <span class="ml-1 text-gray-400">· {{ gio(n.tin_cuoi.luc) }}</span>
            </div>
            <!-- Có số đang lỗi/chưa đăng nhập ("?") thì KHÔNG khẳng định "chưa số
                 nào ở trong" — số đó có thể đang ở trong mà mình không biết (7.1). -->
            <div v-else-if="!n.co_so_nao" class="text-xs text-gray-400 italic">
              {{ Object.values(n.chua_doc).some(v => v === null)
                  ? 'Chưa đọc được — có số chưa đăng nhập hoặc đang lỗi'
                  : 'Chưa số nào ở trong nhóm này' }}
            </div>
          </div>
          <div class="shrink-0 flex flex-col items-end gap-1">
            <!-- MỤC 688 — chỉ hiện số CÓ trong nhóm (có khoá trong chua_doc: có số
                 hoặc "?" khi số đó lỗi). Bỏ dòng "Số 1: —" thừa — mỗi nhóm bớt
                 một dòng. Nhóm không số nào có mặt đã có dòng chữ riêng bên trái. -->
            <span v-for="tk in taiKhoan.filter(t => t.ten in n.chua_doc)" :key="tk.ten" class="text-[11px] tabular-nums whitespace-nowrap"
                  :class="mauSoChuaDoc(n.chua_doc[tk.ten])">
              <template v-if="taiKhoan.length > 1">{{ tk.ten }}: </template>{{ chuSoChuaDoc(n.chua_doc, tk.ten) }}
            </span>
          </div>
        </div>

        <!-- Tin của nhóm đang mở -->
        <div v-if="nhomMo === n.chat_id" class="mb-3 ml-2 rounded-xl bg-gray-50 dark:bg-gray-900/60 p-3">
          <div v-if="dangDocTin" class="text-xs text-gray-500">Đang đọc tin…</div>
          <div v-else-if="loiTin" class="text-xs text-red-600 dark:text-red-400 break-all">{{ loiTin }}</div>
          <template v-else>
            <div class="text-[11px] text-gray-400 mb-2">
              {{ tin.length }} tin gần nhất · đọc bằng {{ docBang || '—' }} · KHÔNG đánh dấu đã đọc
            </div>
            <div v-if="!tin.length" class="text-xs text-gray-500">Không có tin nào.</div>
            <div v-for="t in tin" :key="t.id" class="mb-2 text-sm">
              <div class="text-[11px] text-gray-400">
                <span class="font-semibold" :class="t.cua_minh ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'">{{ t.nguoi_gui }}</span>
                · {{ gio(t.luc) }}
              </div>
              <div class="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-100">{{ t.noi_dung || '(trống)' }}</div>
            </div>
          </template>
        </div>
      </div>
      <div v-if="!dangTai && !nhom.length" class="py-6 text-center text-sm text-gray-400">
        {{ cheDo === 'tim' ? 'Không có nhóm nào tên khớp "' + tim + '".' : 'Chưa gắn nhóm Telegram nào.' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { docTinService } from '@/api/docTinService'

// MỤC 680 — cheDo: 'du-an' (một dự án) · 'tat-ca' (nút Tất cả nhóm) · 'tim' (ô tìm)
const props = withDefaults(defineProps<{
  cheDo?: 'du-an' | 'tat-ca' | 'tim'
  projectId?: string
  tenDuAn?: string
  tim?: string
}>(), { cheDo: 'du-an', projectId: '', tenDuAn: '', tim: '' })
const emit = defineEmits<{ (e: 'da-ghim'): void }>()

const tieuDe = computed(() =>
  props.cheDo === 'tat-ca' ? 'Tất cả nhóm'
    : props.cheDo === 'tim' ? `Tìm: "${props.tim}"` : props.tenDuAn)
const ghimHong = ref(false)

const nhom = ref<any[]>([])
const taiKhoan = ref<any[]>([])
const dangTai = ref(false)
const loiTai = ref('')

const nhomMo = ref<string | null>(null)
const tin = ref<any[]>([])
const docBang = ref<string | null>(null)
const dangDocTin = ref(false)
const loiTin = ref('')

const taiNhom = async (lamMoi = false) => {
  dangTai.value = true
  loiTai.value = ''
  try {
    const kq = props.cheDo === 'du-an'
      ? await docTinService.nhomCuaDuAn(props.projectId, lamMoi)
      : await docTinService.tatCa(props.cheDo === 'tim' ? props.tim : '', lamMoi)
    nhom.value = kq.nhom || []
    taiKhoan.value = kq.tai_khoan || []
    ghimHong.value = !!kq.ghim_hong
  } catch (e: any) {
    loiTai.value = e.message
  } finally {
    dangTai.value = false
  }
}

const moNhom = async (n: any) => {
  if (nhomMo.value === n.chat_id) { nhomMo.value = null; return }
  nhomMo.value = n.chat_id
  tin.value = []
  loiTin.value = ''
  if (!n.co_so_nao) { loiTin.value = 'Chưa số điện thoại nào ở trong nhóm này nên không đọc được.'; return }
  dangDocTin.value = true
  try {
    const kq = await docTinService.tinCuaNhom(n.chat_id)
    tin.value = kq.tin || []
    docBang.value = kq.doc_bang
  } catch (e: any) {
    loiTin.value = e.message
  } finally {
    dangDocTin.value = false
  }
}

// "?" khi số đó lỗi (null), "—" khi số đó không ở trong nhóm (không có khoá).
const chuSoChuaDoc = (cd: Record<string, number | null>, ten: string) => {
  if (!(ten in cd)) return '—'
  return cd[ten] === null ? '?' : `${cd[ten]} chưa đọc`
}
const mauSoChuaDoc = (x: number | null | undefined) =>
  x === null ? 'text-amber-600' : x ? 'text-white bg-rose-500 rounded-full px-2 py-0.5 font-bold' : 'text-gray-400'

const gio = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// Ghim/bỏ ghim rồi tải lại để thứ tự đúng như máy chủ xếp (một chỗ quyết định).
const doiGhim = async (n: any) => {
  try {
    await docTinService.ghim(n.chat_id, !n.ghim)
    await taiNhom()
    emit('da-ghim')
  } catch (e: any) {
    ElMessage.warning(e.message)
  }
}

watch(() => [props.cheDo, props.projectId, props.tim],
      () => { nhomMo.value = null; taiNhom() }, { immediate: true })
</script>
