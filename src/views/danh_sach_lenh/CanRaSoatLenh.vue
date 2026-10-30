<!--
  MỤC 721 (30/10/2026) — màn "Cần rà soát" (ảnh 05): 3 mục.
  Đếm theo LỆNH KHÁC NHAU, không theo lượt (PROMPT_01 bẫy 6); lệnh lặp nhiều dự án gắn nhãn "chung".
-->
<template>
  <div v-loading="!r && !loi">
    <PageHeader title="Cần rà soát" subtitle="Những chỗ trong bộ lệnh nên được người xem lại. Chỉ là danh sách gợi ý, không phải lỗi chắc chắn." />
    <el-alert v-if="loi" type="error" :closable="false" show-icon :title="loi" />
    <template v-if="r">
      <section class="hdg-card rs-khoi">
        <h2 class="rs-tieu-de">Chưa rõ khoá quyền <span class="rs-dem">{{ r.chua_ro_khoa.length }} lệnh · {{ r.so_luot_chua_ro }} lượt</span></h2>
        <p class="rs-phu">Hàm xử lý không có dòng <code>@require_user_type</code>. Lệnh có thể tự kiểm quyền bên trong hàm (vd. <code>/kick_user</code> kiểm Admin/Owner), hoặc ai trong nhóm cũng chạy được.</p>
        <DataTable :columns="cotChuaRo" :rows="r.chua_ro_khoa" row-key="lenh" empty-text="Lệnh nào cũng có dòng khoá quyền">
          <template #cell-lenh="{ row }">
            <code class="rs-ma">/{{ row.lenh }}</code>
            <StatusPill v-if="row.chung" tone="info" class="rs-chung">chung</StatusPill>
          </template>
          <template #cell-du_an="{ row }">
            <button v-for="d in row.du_an" :key="d" type="button" class="rs-link" @click="emit('chon', d)">{{ tenHien(d) }}</button>
          </template>
          <template #cell-ham="{ row }">
            <code v-for="h in row.ham" :key="h.file + h.dong" class="rs-noi">{{ noiKhai(h) }}</code>
            <span v-if="!row.ham.length" class="rs-phu">không tìm ra hàm</span>
          </template>
        </DataTable>
      </section>

      <section class="hdg-card rs-khoi">
        <h2 class="rs-tieu-de">Thiếu lệnh nền <span class="rs-dem">{{ r.thieu_lenh_nen.length }} loại nhóm</span></h2>
        <p class="rs-phu">Loại nhóm không được gợi ý <code>/dang_ky_lenh</code> hoặc <code>/get_chat_id</code>, nên trong nhóm đó bấm "/" không thấy 2 lệnh này.</p>
        <DataTable :columns="cotThieu" :rows="r.thieu_lenh_nen" empty-text="Loại nhóm nào cũng đủ lệnh nền">
          <template #cell-du_an="{ row }"><button type="button" class="rs-link" @click="emit('chon', row.du_an)">{{ tenHien(row.du_an) }}</button></template>
          <template #cell-thieu="{ row }"><code v-for="t in row.thieu" :key="t" class="rs-ma rs-mr">/{{ t }}</code></template>
        </DataTable>
      </section>

      <section class="hdg-card rs-khoi">
        <h2 class="rs-tieu-de">Một lệnh nhiều hàm xử lý <span class="rs-dem">{{ r.nhieu_ham.length }} lệnh</span></h2>
        <p class="rs-phu">Cùng một tên lệnh khai ở 2 chỗ trở lên. Bot chạy hàm nào tuỳ thứ tự nạp và điều kiện từng hàm, dễ gây nhầm.</p>
        <div v-for="x in r.nhieu_ham" :key="x.lenh" class="rs-nhieu">
          <code class="rs-ma">/{{ x.lenh }}</code>
          <div v-for="h in x.ham" :key="h.file + h.dong" class="rs-nhieu__ham">
            <code class="rs-noi">{{ noiKhai(h) }}</code> {{ h.ham }}() ·
            <span class="rs-phu">{{ h.khoa ? 'khoá: ' + chuKhoa(h.khoa) : 'không có dòng khoá quyền' }}</span>
          </div>
        </div>
        <EmptyState v-if="!r.nhieu_ham.length" title="Không có lệnh nào khai ở 2 chỗ" />
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PageHeader from '@/design/components/PageHeader.vue'
import DataTable, { type CotBang } from '@/design/components/DataTable.vue'
import StatusPill from '@/design/components/StatusPill.vue'
import EmptyState from '@/design/components/EmptyState.vue'
import { danhSachLenhService, type CanRaSoat } from '@/api/danhSachLenhService'
import { chuKhoa, noiKhai, tenHien } from './chung'

const emit = defineEmits<{ chon: [x: string] }>()
const r = ref<CanRaSoat | null>(null)
const loi = ref('')

const cotChuaRo: CotBang[] = [
  { prop: 'lenh', label: 'Lệnh', minWidth: 260 },
  { prop: 'du_an', label: 'Dự án', minWidth: 260 },
  { prop: 'ham', label: 'Hàm xử lý (file:dòng)', minWidth: 280 },
]
const cotThieu: CotBang[] = [
  { prop: 'du_an', label: 'Dự án', width: 200 },
  { prop: 'loai_nhom', label: 'Loại nhóm', minWidth: 240 },
  { prop: 'thieu', label: 'Thiếu', minWidth: 260 },
  { prop: 'so_nhom', label: 'Nhóm thật', width: 120, align: 'right' },
]

onMounted(async () => {
  try {
    r.value = await danhSachLenhService.canRaSoat()
  } catch (e: any) {
    loi.value = `Không đọc được: ${e?.message || e}`
  }
})
</script>

<style scoped>
.rs-khoi { padding: 20px 22px; margin-bottom: 20px; }
.rs-tieu-de { margin: 0; font-size: var(--hdg-fs-block-title); font-weight: 700; }
.rs-dem { margin-left: 8px; font-family: var(--hdg-font-sans); font-size: var(--hdg-fs-caption); font-weight: 600; color: var(--hdg-gold-text); background: var(--hdg-gold-soft); padding: 2px 10px; border-radius: var(--hdg-radius-pill); }
.rs-phu { margin: 4px 0 14px; color: var(--hdg-text-muted); font-size: var(--hdg-fs-caption); }
.rs-phu code { font-family: var(--hdg-font-mono); }
.rs-khoi :deep(.hdg-table) { box-shadow: none; }
.rs-ma { font-family: var(--hdg-font-mono); padding: 1px 7px; border-radius: 6px; background: var(--hdg-primary-soft); color: var(--hdg-primary); }
.rs-mr { margin-right: 6px; }
.rs-chung { margin-left: 6px; }
.rs-noi { display: block; font-family: var(--hdg-font-mono); font-size: var(--hdg-fs-caption); color: var(--hdg-text-muted); }
.rs-link { margin: 0 6px 2px 0; padding: 0 8px; border: 1px solid var(--hdg-border); border-radius: var(--hdg-radius-pill); background: transparent; color: var(--hdg-primary); font: inherit; font-size: var(--hdg-fs-caption); cursor: pointer; }
.rs-nhieu { padding: 10px 0; border-top: 1px solid var(--hdg-border); }
.rs-nhieu__ham { margin: 6px 0 0 14px; font-size: var(--hdg-fs-caption); }
.rs-nhieu__ham .rs-noi { display: inline; }
</style>
