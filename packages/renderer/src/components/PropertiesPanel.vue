<script setup lang="ts">
import { usePropertiesPanel } from "../composables/usePropertiesPanel";
import TransformSection from "./properties/TransformSection.vue";
import AppearanceSection from "./properties/AppearanceSection.vue";
import AnimationSection from "./properties/AnimationSection.vue";
import ColorSection from "./properties/ColorSection.vue";

const {
  animationState,
  selectedLayerName,
  isSelectedLayerNull,
  cropX,
  cropY,
  width,
  height,
  positionX,
  positionY,
  pivotX,
  pivotY,
  scaleX,
  scaleY,
  rotation,
  visible,
  interpolated,
  duration,
  tintR,
  tintG,
  tintB,
  offsetR,
  offsetG,
  offsetB,
  tintAlpha,
} = usePropertiesPanel();
</script>

<template>
  <div class="properties-panel">
    <!-- Header Section -->
    <div class="panel-header">
      <div class="header-title">
        <div class="layer-info">
          <h3 class="layer-name">{{ selectedLayerName }}</h3>
          <span v-if="isSelectedLayerNull" class="layer-type-badge"
            >Null Layer</span
          >
        </div>
      </div>
    </div>

    <!-- Content Section -->
    <div class="panel-content">
      <!-- Transform Section -->
      <TransformSection
        :position-x="positionX"
        :position-y="positionY"
        :scale-x="scaleX"
        :scale-y="scaleY"
        :rotation="rotation"
      />

      <!-- Appearance Section (for non-null layers) -->
      <AppearanceSection
        v-if="!isSelectedLayerNull"
        :crop-x="cropX"
        :crop-y="cropY"
        :width="width"
        :height="height"
        :pivot-x="pivotX"
        :pivot-y="pivotY"
      />

      <!-- Animation Section -->
      <AnimationSection
        :visible="visible"
        :interpolated="interpolated"
        :duration="duration"
      />

      <!-- Color Section -->
      <ColorSection
        :tint-r="tintR"
        :tint-g="tintG"
        :tint-b="tintB"
        :tint-alpha="tintAlpha"
        :offset-r="offsetR"
        :offset-g="offsetG"
        :offset-b="offsetB"
      />
    </div>
  </div>
</template>

<style scoped>

.properties-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bg-color);
  color: var(--text-color);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
    "Helvetica Neue", Arial, sans-serif;
  box-sizing: border-box;
  border-left: 1px solid var(--border-color);
}

/* Header Section */
.panel-header {
  padding: 12px;
  background-color: var(--bg-white);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-light);
  flex-shrink: 0;
}

.header-title {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.layer-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.layer-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.layer-type-badge {
  background-color: var(--bg-null);
  color: var(--warning-color);
  font-size: 9px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: var(--border-radius-small);
  border: 1px solid var(--warning-color);
}

/* Content Section */
.panel-content {
  flex: 1;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  min-height: 0;
}

/* Dark mode is handled by CSS variables */
</style>
