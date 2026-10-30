<!--
  MỤC 723 (30/10/2026) — TRANG "SƠ ĐỒ VẬN HÀNH" (Quản trị).
  s68 30/10: "Trên web làm thêm 1 mục đưa map mô tả cách hệ thống bot và web, sheets, telegram,
  và các app liên quan hoạt động" + "vẽ map liên kết và các lệnh … tài liệu giải thích đưa kèm".
  Hai thẻ: Map liên kết (vẽ từ dữ liệu máy chủ) · Giải thích (bản s68 đã xem). Thẻ đang xem
  lưu ở `?the=` để tải lại vẫn đúng chỗ.
  Quyền: cùng khoá `danh_sach_lenh` vì map đọc lệnh từ API Danh sách lệnh.
-->
<template>
  <div class="hdg-theme sd">
    <PageHeader title="Sơ đồ vận hành" subtitle="Bot Telegram, trang web, database và các dịch vụ đi kèm nối với nhau thế nào. Tất cả chạy trong một chương trình trên máy chủ Windows.">
      <template #actions>
        <SegmentedControl :model-value="the" :options="[{ label: 'Map liên kết', value: 'map' }, { label: 'Giải thích', value: 'giai-thich' }]" @update:model-value="doiThe" />
      </template>
    </PageHeader>
    <MapLienKet v-if="the === 'map'" />
    <GiaiThich v-else />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/be-vietnam-pro/700.css'
import '@fontsource/source-serif-4/600.css'
import '@fontsource/source-serif-4/700.css'
import '@/design/tokens.css'
import PageHeader from '@/design/components/PageHeader.vue'
import SegmentedControl from '@/design/components/SegmentedControl.vue'
import MapLienKet from './MapLienKet.vue'
import GiaiThich from './GiaiThich.vue'

const route = useRoute()
const router = useRouter()
const the = computed(() => (route.query.the === 'giai-thich' ? 'giai-thich' : 'map'))
function doiThe(v: string) {
  router.replace({ path: route.path, query: v === 'map' ? {} : { the: v } })
}
</script>

<style scoped>
.sd { height: 100%; overflow-y: auto; padding: 26px 32px 48px; }
@media (max-width: 767px) { .sd { padding: 18px 14px 32px; } }
</style>
