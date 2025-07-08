<template>
  <PropertySection title="Color">
    <div class="color-section">
      <div class="color-group">
        <div class="color-group-header">
          <ColorPreview
            label="Tint RGBA"
            :color="tintColorPreview"
          />
        </div>
        <div class="color-controls">
          <ColorSlider
            label="R"
            :value="tintR"
            :min="0"
            :max="255"
            type="red"
            disabled
            readonly
          />
          <ColorSlider
            label="G"
            :value="tintG"
            :min="0"
            :max="255"
            type="green"
            disabled
            readonly
          />
          <ColorSlider
            label="B"
            :value="tintB"
            :min="0"
            :max="255"
            type="blue"
            disabled
            readonly
          />
          <ColorSlider
            label="A"
            :value="tintAlpha"
            :min="0"
            :max="255"
            type="alpha"
            disabled
            readonly
          />
        </div>
      </div>

      <div class="color-group">
        <div class="color-group-header">
          <ColorPreview
            label="Offset RGB"
            :color="offsetColorPreview"
          />
        </div>
        <div class="color-controls">
          <ColorSlider
            label="R"
            :value="offsetR"
            :min="0"
            :max="255"
            type="red"
            disabled
            readonly
          />
          <ColorSlider
            label="G"
            :value="offsetG"
            :min="0"
            :max="255"
            type="green"
            disabled
            readonly
          />
          <ColorSlider
            label="B"
            :value="offsetB"
            :min="0"
            :max="255"
            type="blue"
            disabled
            readonly
          />
        </div>
      </div>
    </div>
  </PropertySection>
</template>

<script setup lang="ts">
import { computed } from "vue";
import PropertySection from './PropertySection.vue';
import ColorSlider from './ColorSlider.vue';
import ColorPreview from './ColorPreview.vue';

interface ColorSectionProps {
  tintR: number;
  tintG: number;
  tintB: number;
  tintAlpha: number;
  offsetR: number;
  offsetG: number;
  offsetB: number;
}

const props = defineProps<ColorSectionProps>();

// 색상 미리 보기를 위한 computed 속성들
const tintColorPreview = computed(() => {
  return `rgba(${props.tintR}, ${props.tintG}, ${props.tintB}, ${
    props.tintAlpha / 255
  })`;
});

const offsetColorPreview = computed(() => {
  // Offset은 보통 -255에서 255 사이의 값이므로 절댓값으로 색상 표현
  const r = Math.abs(props.offsetR);
  const g = Math.abs(props.offsetG);
  const b = Math.abs(props.offsetB);
  return `rgb(${r}, ${g}, ${b})`;
});
</script>

<style scoped>
.color-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.color-group {
  background-color: var(--bg-color);
  border-radius: var(--border-radius);
  padding: 10px;
  border: 1px solid var(--border-color);
}

.color-group-header {
  margin-bottom: 10px;
}

.color-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style> 
