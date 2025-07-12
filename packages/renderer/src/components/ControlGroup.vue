<script setup lang="ts">
interface Props {
  gap?: string;
  variant?: 'default' | 'header';
}

const props = withDefaults(defineProps<Props>(), {
  gap: '8px',
  variant: 'default',
});
</script>

<template>
  <div class="control-group" :class="[`variant-${props.variant}`]" :style="{ gap: props.gap }">
    <slot />
  </div>
</template>

<style scoped>
.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.variant-header {
  padding: 4px;
  background-color: var(--bg-color);
  border-radius: var(--border-radius-small);
  border: 1px solid var(--border-color);
}
</style>
