<!-- MỤC 721 (30/10/2026) — màn Tổng quan (ảnh `danh_sach_lenh/01_Tong_quan`). -->
<template>
  <div>
    <PageHeader title="Danh Sách Lệnh" subtitle="Bot Telegram gợi ý những lệnh nào cho từng loại nhóm. Chọn một dự án để rà soát.">
      <template #actions>
        <el-autocomplete
          v-model="tim" :fetch-suggestions="goiY" placeholder="Tìm một lệnh, ví dụ: ung_tien, get_chat_id…"
          class="tq-tim" clearable value-key="lenh" @select="(x: any) => emit('chon', x.du_an)"
        >
          <template #default="{ item }">
            <code class="tq-ma">/{{ item.lenh }}</code>
            <span class="tq-goi-y">{{ item.mo_ta }} · {{ tenHien(item.du_an) }}</span>
          </template>
        </el-autocomplete>
      </template>
    </PageHeader>

    <div class="tq-kpi">
      <KpiCard label="Dự án" :value="tq.so_du_an" hint="có bộ lệnh riêng" />
      <KpiCard label="Lệnh khác nhau" :value="tq.so_lenh" hint="toàn hệ thống" />
      <KpiCard label="Loại nhóm" :value="tq.so_cot" hint="được gợi ý lệnh riêng" />
      <KpiCard label="Cần rà soát" :value="tq.so_can_ra_soat" tone="gold" hint="lệnh khác nhau chưa rõ khoá quyền" clickable @click="emit('chon', 'can-ra-soat')" />
    </div>

    <div class="hdg-label tq-sec">Chọn dự án</div>
    <div class="tq-luoi">
      <button v-for="d in tq.du_an" :key="d.du_an" type="button" class="hdg-card tq-the" :style="{ '--mau': mauDuAn(d.du_an) }" @click="emit('chon', d.du_an)">
        <div class="tq-the__ten">{{ tenHien(d.du_an) }}</div>
        <div class="tq-the__so"><b class="hdg-num">{{ d.so_lenh }}</b> lệnh · {{ d.so_cot }} loại nhóm · {{ d.so_nhom }} nhóm thật</div>
        <div class="tq-thanh" aria-hidden="true">
          <span :style="{ flex: d.menu, background: 'var(--hdg-green-700)' }" />
          <span :style="{ flex: d.reply, background: 'var(--hdg-gold)' }" />
          <span :style="{ flex: d.thuong, background: 'var(--hdg-border)' }" />
        </div>
        <div class="tq-the__loai">{{ d.menu }} menu · {{ d.thuong }} thường · {{ d.reply }} reply</div>
        <div class="tq-the__chan">
          <span>⚠ {{ d.chua_ro_khoa }} chưa rõ khoá quyền</span>
          <span class="tq-the__mo">Mở →</span>
        </div>
      </button>

      <div class="hdg-card tq-chung">
        <h2 class="tq-chung__tieu-de">Lệnh dùng chung</h2>
        <p class="tq-chung__phu">Một lệnh xuất hiện ở nhiều dự án</p>
        <div v-for="x in tq.lenh_chung" :key="x.lenh" class="tq-chung__dong">
          <code class="tq-ma">/{{ x.lenh }}</code>
          <span class="tq-chung__so">{{ x.du_an.length }} dự án</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '@/design/components/PageHeader.vue'
import KpiCard from '@/design/components/KpiCard.vue'
import type { TongQuan } from '@/api/danhSachLenhService'
import { mauDuAn, tenHien } from './chung'

const props = defineProps<{ tq: TongQuan }>()
const emit = defineEmits<{ chon: [x: string] }>()

const tim = ref('')
function goiY(q: string, cb: (x: any[]) => void) {
  const s = (q || '').toLowerCase().replace(/^\//, '')
  if (!s) return cb([])
  cb(props.tq.moi_lenh
    .filter(([l, m]) => l.toLowerCase().includes(s) || (m || '').toLowerCase().includes(s))
    .slice(0, 30)
    .map(([lenh, mo_ta, du_an]) => ({ lenh, mo_ta, du_an })))
}
</script>

<style scoped>
.tq-tim { width: 420px; max-width: 100%; }
.tq-ma { font-family: var(--hdg-font-mono); padding: 1px 7px; border-radius: 6px; background: var(--hdg-primary-soft); color: var(--hdg-primary); font-size: var(--hdg-fs-table); }
.tq-goi-y { margin-left: 8px; color: var(--hdg-text-muted); font-size: var(--hdg-fs-caption); }
.tq-kpi { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; }
.tq-sec { margin: 26px 0 12px; }
.tq-luoi { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; }
.tq-the { display: flex; flex-direction: column; text-align: left; padding: 18px 20px 0; border-top: 4px solid var(--mau); font: inherit; color: inherit; cursor: pointer; }
.tq-the:hover { border-color: var(--mau); }
.tq-the__ten { font-family: var(--hdg-font-serif); font-size: var(--hdg-fs-block-title); font-weight: 700; }
.tq-the__so { margin-top: 6px; color: var(--hdg-text-muted); }
.tq-the__so b { font-family: var(--hdg-font-serif); font-size: 30px; color: var(--mau); margin-right: 2px; }
.tq-thanh { display: flex; height: 7px; border-radius: 4px; overflow: hidden; gap: 2px; margin: 10px 0 6px; }
.tq-the__loai { font-size: var(--hdg-fs-caption); color: var(--hdg-text-muted); }
.tq-the__chan { display: flex; justify-content: space-between; margin: 14px -20px 0; padding: 12px 20px; border-top: 1px solid var(--hdg-border); font-size: var(--hdg-fs-caption); color: var(--hdg-text-muted); }
.tq-the__mo { color: var(--mau); font-weight: 700; }
.tq-chung { padding: 18px 20px; }
.tq-chung__tieu-de { margin: 0; font-size: var(--hdg-fs-block-title); font-weight: 700; }
.tq-chung__phu { margin: 2px 0 10px; color: var(--hdg-text-muted); font-size: var(--hdg-fs-caption); }
.tq-chung__dong { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid var(--hdg-border); }
.tq-chung__so { color: var(--hdg-text-muted); font-size: var(--hdg-fs-caption); }
@media (max-width: 1279px) { .tq-kpi, .tq-luoi { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 767px) { .tq-kpi, .tq-luoi { grid-template-columns: minmax(0, 1fr); } .tq-tim { width: 100%; } }
</style>
