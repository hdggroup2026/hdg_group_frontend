<!--
  MỤC 718 (29/10/2026) — G1. Bảng dùng chung (bọc el-table).

  Quy tắc ④: TỐI ĐA 8 CỘT hiện. Truyền nhiều hơn thì chỉ 8 cột đầu hiện, phần còn lại
  để dành cho ngăn chi tiết (DetailDrawer) — và có cảnh báo ở console khi chạy thử để
  người làm trang thấy ngay, không âm thầm cắt.
  Điện thoại (<768px): bảng nhiều cột thành DANH SÁCH THẺ (mỗi dòng một thẻ, cột đầu làm tiêu đề).
  Ô tuỳ biến: slot `cell-<prop>` nhận { row }.
-->
<template>
  <div class="hdg-table hdg-card">
    <template v-if="!isMobile">
      <el-table
        :data="rows" :row-key="rowKey" stripe v-loading="loading"
        :row-class-name="clickable ? 'hdg-table__row--click' : ''"
        @row-click="(r: any) => clickable && emit('row-click', r)"
      >
        <el-table-column
          v-for="c in visible" :key="c.prop" :prop="c.prop" :label="c.label"
          :width="c.width" :min-width="c.minWidth" :align="c.money || c.align === 'right' ? 'right' : (c.align || 'left')"
        >
          <template #default="{ row }">
            <slot :name="`cell-${c.prop}`" :row="row">
              <MoneyText v-if="c.money" :value="row[c.prop]" :unit="''" />
              <template v-else>{{ row[c.prop] ?? '—' }}</template>
            </slot>
          </template>
        </el-table-column>
        <template #empty><EmptyState :title="emptyText" /></template>
      </el-table>
    </template>
    <template v-else>
      <EmptyState v-if="!rows.length" :title="emptyText" />
      <button
        v-for="(r, i) in rows" :key="rowKey ? r[rowKey] : i" type="button"
        class="hdg-table__card" @click="clickable && emit('row-click', r)"
      >
        <div class="hdg-table__card-title">
          <slot :name="`cell-${visible[0]?.prop}`" :row="r">{{ visible[0] ? r[visible[0].prop] : '' }}</slot>
        </div>
        <div v-for="c in visible.slice(1)" :key="c.prop" class="hdg-table__card-line">
          <span class="hdg-table__card-label">{{ c.label }}</span>
          <span class="hdg-table__card-val">
            <slot :name="`cell-${c.prop}`" :row="r">
              <MoneyText v-if="c.money" :value="r[c.prop]" :unit="''" />
              <template v-else>{{ r[c.prop] ?? '—' }}</template>
            </slot>
          </span>
        </div>
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWindowSize } from '@vueuse/core'
import MoneyText from './MoneyText.vue'
import EmptyState from './EmptyState.vue'

export interface CotBang {
  prop: string
  label: string
  width?: number | string
  minWidth?: number | string
  align?: 'left' | 'center' | 'right'
  money?: boolean
}

const TOI_DA_COT = 8

const props = withDefaults(defineProps<{
  columns: CotBang[]
  rows: any[]
  rowKey?: string
  loading?: boolean
  clickable?: boolean
  emptyText?: string
}>(), { rowKey: undefined, loading: false, clickable: false, emptyText: 'Chưa có dữ liệu' })
const emit = defineEmits<{ 'row-click': [row: any] }>()

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)

const visible = computed(() => {
  if (props.columns.length > TOI_DA_COT && import.meta.env.DEV) {
    console.warn(`[DataTable] ${props.columns.length} cột > ${TOI_DA_COT}: cột thừa phải vào ngăn chi tiết.`)
  }
  return props.columns.slice(0, TOI_DA_COT)
})
</script>

<style scoped>
.hdg-table { overflow: hidden; }
.hdg-table :deep(.el-table) { --el-table-header-bg-color: var(--hdg-row-alt); --el-table-row-hover-bg-color: var(--hdg-primary-soft); }
.hdg-table :deep(.el-table th.el-table__cell) { font-size: var(--hdg-fs-label); letter-spacing: .06em; text-transform: uppercase; color: var(--hdg-text-muted); font-weight: 700; }
.hdg-table :deep(.el-table .el-table__cell) { height: var(--hdg-row-h); }
.hdg-table :deep(.hdg-table__row--click) { cursor: pointer; }
.hdg-table__card { display: block; width: 100%; text-align: left; padding: 14px 16px; border: 0; border-bottom: 1px solid var(--hdg-border); background: transparent; color: inherit; font: inherit; min-height: 44px; }
.hdg-table__card:last-child { border-bottom: 0; }
.hdg-table__card-title { font-weight: 700; margin-bottom: 6px; }
.hdg-table__card-line { display: flex; justify-content: space-between; gap: 12px; font-size: var(--hdg-fs-table); padding: 2px 0; }
.hdg-table__card-label { color: var(--hdg-text-muted); }
.hdg-table__card-val { text-align: right; }
</style>
