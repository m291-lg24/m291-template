<script setup>
import { computed } from 'vue'

const props = defineProps({
  ok: { type: Boolean, default: null },
  label: { type: String, required: true },
})

const classes = computed(() => {
  if (props.ok === null) return 'bg-slate-100 text-slate-600'
  return props.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
})
const symbol = computed(() => (props.ok === null ? '…' : props.ok ? '✓' : '✕'))
</script>

<template>
  <span :class="classes" class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium">
    <span aria-hidden="true">{{ symbol }}</span>
    {{ label }}
  </span>
</template>
