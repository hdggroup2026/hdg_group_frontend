<!-- MỤC 718 (29/10/2026) — G1. Chọn một trong vài chế độ (vd. Bảng / Ma trận). Nút cao ≥ 40px, điện thoại ≥ 44px. -->
<template>
  <div class="hdg-seg" role="tablist">
    <button
      v-for="o in options" :key="o.value" type="button" role="tab"
      class="hdg-seg__btn" :class="{ 'is-active': o.value === modelValue }"
      :aria-selected="o.value === modelValue"
      @click="emit('update:modelValue', o.value)"
    >{{ o.label }}</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue: string; options: { label: string; value: string }[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<style scoped>
.hdg-seg { display: inline-flex; flex-wrap: wrap; max-width: 100%; padding: 3px; gap: 2px; background: var(--hdg-row-alt); border: 1px solid var(--hdg-border); border-radius: var(--hdg-radius-control); }
.hdg-seg__btn { min-height: 34px; padding: 0 16px; border: 0; border-radius: 7px; background: transparent; color: var(--hdg-text-muted); font: inherit; font-weight: 600; cursor: pointer; }
.hdg-seg__btn.is-active { background: var(--hdg-card); color: var(--hdg-primary); box-shadow: var(--hdg-shadow-card); }
@media (max-width: 767px) { .hdg-seg__btn { min-height: 40px; padding: 0 12px; } }
</style>
