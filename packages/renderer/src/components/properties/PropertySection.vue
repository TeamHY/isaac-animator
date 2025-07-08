<template>
  <div class="property-section">
    <h4 class="section-title">{{ title }}</h4>
    <div class="section-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface PropertySectionProps {
  title: string;
}

defineProps<PropertySectionProps>();
</script>

<style scoped>
.property-section {
  background-color: var(--bg-white);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-normal);
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-color-secondary);
  margin: 0;
  padding: 8px 12px;
  background-color: var(--bg-color);
  border-bottom: 1px solid var(--border-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-content {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style> 
