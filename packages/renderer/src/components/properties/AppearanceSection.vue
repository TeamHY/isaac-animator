<template>
  <PropertySection title="Appearance">
    <div class="property-group">
      <div class="input-pair">
        <InputField
          label="Crop X"
          :value="cropX"
          type="text"
          @update:value="updateCropX"
        />
        <InputField
          label="Crop Y"
          :value="cropY"
          type="text"
          @update:value="updateCropY"
        />
      </div>
    </div>

    <div class="property-group">
      <div class="input-pair">
        <InputField
          label="Width"
          :value="width"
          type="text"
          @update:value="updateWidth"
        />
        <InputField
          label="Height"
          :value="height"
          type="text"
          @update:value="updateHeight"
        />
      </div>
    </div>

    <div class="property-group">
      <div class="input-pair">
        <InputField
          label="Pivot X"
          :value="pivotX"
          type="text"
          @update:value="updatePivotX"
        />
        <InputField
          label="Pivot Y"
          :value="pivotY"
          type="text"
          @update:value="updatePivotY"
        />
      </div>
    </div>
  </PropertySection>
</template>

<script setup lang="ts">
import PropertySection from './PropertySection.vue';
import InputField from './InputField.vue';

interface AppearanceSectionProps {
  cropX: string;
  cropY: string;
  width: string;
  height: string;
  pivotX: string;
  pivotY: string;
  updateCropX: (value: string) => void;
  updateCropY: (value: string) => void;
  updateWidth: (value: string) => void;
  updateHeight: (value: string) => void;
  updatePivotX: (value: string) => void;
  updatePivotY: (value: string) => void;
}

defineProps<AppearanceSectionProps>();
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
