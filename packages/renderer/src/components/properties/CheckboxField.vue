<template>
  <div class="checkbox-field">
    <input
      :id="fieldId"
      type="checkbox"
      :checked="checked"
      :disabled="disabled"
      @change="$emit('update:checked', ($event.target as HTMLInputElement).checked)"
    />
    <label :for="fieldId">{{ label }}</label>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  disabled?: boolean;
  id?: string;
}

const props = withDefaults(defineProps<CheckboxFieldProps>(), {
  disabled: false,
});

defineEmits<{
  'update:checked': [checked: boolean];
}>();

const fieldId = computed(() => props.id || `checkbox-${Math.random().toString(36).substr(2, 9)}`);
</script>

<style scoped>
.checkbox-field {
  display: flex;
  align-items: center;
  gap: 6px;
}

.checkbox-field input[type="checkbox"] {
  width: 14px;
  height: 14px;
  border: 1px solid var(--input-border);
  border-radius: var(--border-radius-xs);
  cursor: pointer;
  accent-color: var(--primary-color);
}

.checkbox-field input[type="checkbox"]:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.checkbox-field input[type="checkbox"]:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-light);
}

.checkbox-field label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-color);
  cursor: pointer;
  margin: 0;
  text-transform: none;
  letter-spacing: normal;
}

.checkbox-field input[type="checkbox"]:disabled + label {
  cursor: not-allowed;
  opacity: 0.6;
}
</style> 
