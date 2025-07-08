<template>
  <PropertySection title="Appearance">
    <div class="property-group">
      <div class="input-pair">
        <InputField
          label="Crop X"
          :value="cropX"
          type="text"
          readonly
        />
        <InputField
          label="Crop Y"
          :value="cropY"
          type="text"
          readonly
        />
      </div>
    </div>

    <div class="property-group">
      <div class="input-pair">
        <InputField
          label="Width"
          :value="width"
          type="text"
          readonly
        />
        <InputField
          label="Height"
          :value="height"
          type="text"
          readonly
        />
      </div>
    </div>

    <div class="property-group">
      <div class="input-pair">
        <InputField
          label="Pivot X"
          :value="pivotX"
          type="text"
          readonly
        />
        <InputField
          label="Pivot Y"
          :value="pivotY"
          type="text"
          readonly
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
