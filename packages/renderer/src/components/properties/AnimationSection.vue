<template>
  <PropertySection title="Animation">
    <div class="property-group">
      <div class="checkbox-row">
        <CheckboxField
          label="Visible"
          :checked="visible"
          @update:checked="$emit('update:visible', $event)"
          id="visible"
        />
        <CheckboxField
          label="Interpolated"
          :checked="interpolated"
          @update:checked="$emit('update:interpolated', $event)"
          id="interpolated"
        />
      </div>
    </div>

    <div class="property-group">
      <InputField
        label="Duration"
        :value="duration"
        type="number"
        @update:value="$emit('update:duration', parseInt($event))"
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

defineEmits<{
  'update:visible': [value: boolean];
  'update:interpolated': [value: boolean];
  'update:duration': [value: number];
}>();
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
