<script setup lang="ts">
interface Props {
  title?: string;
  active?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'reset' | 'header';
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  active: false,
  size: 'medium',
  variant: 'default',
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const handleClick = (event: MouseEvent) => {
  emit('click', event);
};
</script>

<template>
  <button
    @click="handleClick"
    class="control-btn"
    :class="[`size-${props.size}`, `variant-${props.variant}`, { active: props.active }]"
    :title="props.title"
  >
    <slot />
  </button>
</template>

<style scoped>
.control-btn {
  background-color: var(--button-bg);
  border: 1px solid var(--button-border);
  border-radius: var(--border-radius-small);
  color: var(--button-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  transition: all 0.15s ease;
  box-shadow: var(--shadow-normal);
}

.control-btn:hover {
  background-color: var(--button-hover-bg);
  border-color: var(--button-hover-border);
  box-shadow: var(--shadow-medium);
}

.control-btn:active {
  transform: translateY(1px);
  box-shadow: var(--shadow-normal);
}

.control-btn.active {
  background-color: var(--bg-selected);
  color: var(--primary-color);
}

/* Size variants */
.size-small {
  width: 24px;
  height: 24px;
  font-size: 12px;
}

.size-medium {
  width: 28px;
  height: 28px;
  font-size: 14px;
}

.size-large {
  width: 32px;
  height: 32px;
  font-size: 16px;
}

/* Variant styles */
.variant-reset {
  width: auto !important;
  padding: 0 10px;
  min-width: 28px;
  font-size: 11px;
  font-weight: 500;
}

.variant-header {
  padding: 6px 8px;
  border: none;
  background: transparent;
  color: var(--text-color);
  border-radius: var(--border-radius-xs);
  font-size: 11px;
  font-weight: 500;
  min-width: 28px;
  box-shadow: none;
}

.variant-header:hover {
  background-color: var(--bg-hover);
  border: none;
  box-shadow: none;
}

.variant-header.active {
  background-color: var(--bg-selected);
  color: var(--primary-color);
}
</style>
