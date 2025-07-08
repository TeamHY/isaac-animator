<template>
  <PropertySection title="Animation">
    <div class="property-group">
      <div class="checkbox-row">
        <CheckboxField
          label="Visible"
          :checked="visible"
          disabled
          id="visible"
        />
        <CheckboxField
          label="Interpolated"
          :checked="interpolated"
          disabled
          id="interpolated"
        />
      </div>
    </div>

    <div class="property-group">
      <InputField
        label="Duration"
        :value="duration"
        type="number"
        readonly
      />
    </div>
  </PropertySection>
</template>

<script setup lang="ts">
import PropertySection from './PropertySection.vue';
import InputField from './InputField.vue';
import CheckboxField from './CheckboxField.vue';

interface AnimationSectionProps {
  visible: boolean;
  interpolated: boolean;
  duration: number;
}

defineProps<AnimationSectionProps>();
</script>

<style scoped>
.property-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-row {
  display: flex;
  gap: 12px;
}
</style> 
