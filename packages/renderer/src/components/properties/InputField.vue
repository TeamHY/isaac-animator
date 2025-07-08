<template>
  <div class="input-field">
    <label>{{ label }}</label>
    <input 
      :type="type" 
      :value="value" 
      :readonly="readonly"
      :min="min"
      :max="max"
      @input="$emit('update:value', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
interface InputFieldProps {
  label: string;
  value: string | number;
  type?: 'text' | 'number';
  readonly?: boolean;
  min?: number;
  max?: number;
}

withDefaults(defineProps<InputFieldProps>(), {
  type: 'text',
  readonly: false,
});

defineEmits<{
  'update:value': [value: string];
}>();
</script>

<style scoped>
.input-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.input-field label {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.input-field input {
  background-color: var(--bg-white);
  color: var(--text-color);
  border: 1px solid var(--input-border);
  border-radius: var(--border-radius-small);
  padding: 6px 8px;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.15s ease;
  box-sizing: border-box;
}

.input-field input[readonly] {
  background-color: var(--input-bg);
  color: var(--text-color-secondary);
  cursor: not-allowed;
  border-color: var(--border-color);
}

.input-field input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-light);
}
</style> 
