<template>
  <PropertySection title="Transform">
    <div class="property-group">
      <div class="input-pair">
        <InputField
          label="Position X"
          :value="positionX"
          type="number"
          @update:value="updatePositionX"
        />
        <InputField
          label="Position Y"
          :value="positionY"
          type="number"
          @update:value="updatePositionY"
        />
      </div>
    </div>

    <div class="property-group">
      <div class="input-pair">
        <InputField
          label="Scale X"
          :value="scaleX"
          type="number"
          @update:value="updateScaleX"
        />
        <InputField
          label="Scale Y"
          :value="scaleY"
          type="number"
          @update:value="updateScaleY"
        />
      </div>
    </div>

    <div class="property-group">
      <InputField
        label="Rotation"
        :value="rotation"
        type="number"
        @update:value="updateRotation"
      />
    </div>
  </PropertySection>
</template>

<script setup lang="ts">
import PropertySection from './PropertySection.vue';
import InputField from './InputField.vue';

interface TransformSectionProps {
  positionX: number;
  positionY: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  updatePositionX: (value: string) => void;
  updatePositionY: (value: string) => void;
  updateScaleX: (value: string) => void;
  updateScaleY: (value: string) => void;
  updateRotation: (value: string) => void;
}

defineProps<TransformSectionProps>();
</script>

<style scoped>
.property-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-pair {
  display: flex;
  gap: 8px;
}
</style>
