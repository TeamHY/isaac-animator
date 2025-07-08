<template>
  <PropertySection title="Transform">
    <div class="property-group">
      <div class="input-pair">
        <InputField
          label="Position X"
          :value="positionX"
          type="number"
          readonly
        />
        <InputField
          label="Position Y"
          :value="positionY"
          type="number"
          readonly
        />
      </div>
    </div>

    <div class="property-group">
      <div class="input-pair">
        <InputField
          label="Scale X"
          :value="scaleX"
          type="number"
          readonly
        />
        <InputField
          label="Scale Y"
          :value="scaleY"
          type="number"
          readonly
        />
      </div>
    </div>

    <div class="property-group">
      <InputField
        label="Rotation"
        :value="rotation"
        type="number"
        readonly
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
