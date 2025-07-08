<template>
  <div class="color-label-with-preview">
    <span class="color-label">{{ label }}</span>
    <div
      class="color-preview-large"
      :style="{ backgroundColor: color }"
    ></div>
  </div>
</template>

<script setup lang="ts">
interface ColorPreviewProps {
  label: string;
  color: string;
}

defineProps<ColorPreviewProps>();
</script>

<style scoped>
.color-label-with-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.color-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.color-preview-large {
  width: 48px;
  height: 24px;
  border-radius: var(--border-radius);
  border: 1px solid var(--input-border);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  background-image: var(--checkerboard-pattern);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
}
</style> 
