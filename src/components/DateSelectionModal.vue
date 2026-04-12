<template>
  <BaseCenteredModal :open="open" :title="title" :subtitle="subtitle" @close="emit('close')">
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </BaseCenteredModal>
</template>

<script setup>
import BaseCenteredModal from './BaseCenteredModal.vue'

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
})

const emit = defineEmits(['close'])
</script>
