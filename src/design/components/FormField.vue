<!--
  MỤC 718 (29/10/2026) — G1. Một ô trong biểu mẫu: nhãn + ô nhập (slot) + lỗi / gợi ý.
  Dùng KÈM el-form-item khi cần kiểm hợp lệ của Element Plus; đây chỉ là phần trình bày.
-->
<template>
  <div class="hdg-field" :class="{ 'is-error': !!error, 'is-wide': wide }">
    <label class="hdg-field__label">{{ label }}<span v-if="required" class="hdg-field__req">*</span></label>
    <slot />
    <div v-if="error" class="hdg-field__error">{{ error }}</div>
    <div v-else-if="hint" class="hdg-field__hint">{{ hint }}</div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ label: string; required?: boolean; error?: string; hint?: string; wide?: boolean }>(),
  { required: false, error: '', hint: '', wide: false })
</script>

<style scoped>
.hdg-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.hdg-field.is-wide { grid-column: 1 / -1; }
.hdg-field__label { font-size: var(--hdg-fs-caption); font-weight: 600; color: var(--hdg-text); }
.hdg-field__req { color: var(--hdg-danger-text); margin-left: 3px; }
.hdg-field__error { font-size: var(--hdg-fs-caption); color: var(--hdg-danger-text); }
.hdg-field__hint { font-size: var(--hdg-fs-caption); color: var(--hdg-text-muted); }
.hdg-field.is-error :deep(.el-input__wrapper) { box-shadow: 0 0 0 1px var(--hdg-danger) inset; }
</style>
