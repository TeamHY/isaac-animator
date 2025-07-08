<template>
  <div class="color-control">
    <label>{{ label }}</label>
    <div class="control-pair">
      <input
        type="range"
        :min="min"
        :max="max"
        :value="value"
        :disabled="disabled"
        :class="sliderClass"
        :style="{ background: backgroundGradient }"
        @input="$emit('update:value', parseInt(($event.target as HTMLInputElement).value))"
      />
      <input
        type="number"
        :value="value"
        :readonly="readonly"
        :min="min"
        :max="max"
        class="color-input-small"
        @input="$emit('update:value', parseInt(($event.target as HTMLInputElement).value))"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface ColorSliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  readonly?: boolean;
  type?: 'red' | 'green' | 'blue' | 'alpha';
}

const props = withDefaults(defineProps<ColorSliderProps>(), {
  min: 0,
  max: 255,
  disabled: false,
  readonly: false,
  type: 'red',
});

defineEmits<{
  'update:value': [value: number];
}>();

const sliderClass = computed(() => {
  return `color-slider ${props.type}-slider`;
});

const backgroundGradient = computed(() => {
  switch (props.type) {
    case 'red':
      return 'var(--red-gradient)';
    case 'green':
      return 'var(--green-gradient)';
    case 'blue':
      return 'var(--blue-gradient)';
    case 'alpha':
      return 'var(--alpha-gradient)';
    default:
      return 'var(--red-gradient)';
  }
});
</script>

<style scoped>
.color-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-control label {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-color-secondary);
  min-width: 12px;
  text-align: center;
}

.control-pair {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.color-slider {
  flex: 1;
  width: 100%;
  height: 6px;
  background: var(--border-color);
  border-radius: var(--border-radius-xs);
  outline: none;
  border: 1px solid var(--input-border);
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  overflow: visible;
}

.color-slider:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-light);
}

.color-slider::-webkit-slider-track {
  height: 4px;
  border-radius: 2px;
  background: inherit;
}

.color-slider::-moz-range-track {
  height: 4px;
  border-radius: 2px;
  background: inherit;
  border: none;
}

.color-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: #ffffff;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #333;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  z-index: 10;
  position: relative;
}

.color-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #ffffff;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #333;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.color-slider:disabled {
  opacity: 0.85;
  cursor: not-allowed;
}

.color-slider:disabled::-webkit-slider-thumb {
  background: #ffffff;
  border-color: #555;
  cursor: not-allowed;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.color-slider:disabled::-moz-range-thumb {
  background: #ffffff;
  border-color: #555;
  cursor: not-allowed;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.color-input-small {
  width: 40px;
  padding: 4px 6px;
  font-size: 10px;
  border: 1px solid var(--input-border);
  border-radius: var(--border-radius-xs);
  background-color: var(--bg-white);
  color: var(--text-color);
  text-align: center;
  transition: all 0.15s ease;
}

.color-input-small:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-light);
}

.color-input-small[readonly] {
  background-color: var(--input-bg);
  color: var(--text-color-secondary);
  cursor: not-allowed;
  border-color: var(--border-color);
}

/* 특정 슬라이더 스타일 */
.red-slider,
.green-slider,
.blue-slider {
  border-radius: var(--border-radius-xs);
}

.red-slider::-webkit-slider-track,
.green-slider::-webkit-slider-track,
.blue-slider::-webkit-slider-track {
  height: 4px;
  border-radius: 2px;
  background: inherit;
  border: none;
}

.red-slider::-moz-range-track,
.green-slider::-moz-range-track,
.blue-slider::-moz-range-track {
  height: 4px;
  border-radius: 2px;
  background: inherit;
  border: none;
}

.alpha-slider {
  border-radius: var(--border-radius-xs);
  background-size: auto, 4px 4px, 4px 4px, 4px 4px, 4px 4px;
  background-position: 0 0, 0 0, 0 2px, 2px -2px, -2px 0px;
}

.alpha-slider::-webkit-slider-track,
.alpha-slider::-moz-range-track {
  height: 4px;
  border-radius: 2px;
  background: inherit;
  border: none;
}

/* 다크 모드 전용 스타일 */
@media (prefers-color-scheme: dark) {
  .color-slider::-webkit-slider-thumb {
    background: #ffffff;
    border-color: #999;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  }

  .color-slider::-moz-range-thumb {
    background: #ffffff;
    border-color: #999;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  }
}
</style> 
