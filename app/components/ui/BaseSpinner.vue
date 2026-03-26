<script setup>
import uiData from '~/data/ui.json'

defineProps({
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  label: {
    type: String,
    default: ''
  }
})

const defaultLabel = uiData.common.loading
</script>

<template>
  <div class="base-spinner" :class="`base-spinner--${size}`" role="status" aria-live="polite">
    <span class="base-spinner__circle" aria-hidden="true" />
    <span v-if="label" class="base-spinner__label">{{ label }}</span>
    <span class="sr-only">{{ label || defaultLabel }}</span>
  </div>
</template>
