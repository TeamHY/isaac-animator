<script setup lang="ts">
import { usePropertiesPanel } from "../composables/usePropertiesPanel";
import TransformSection from "./properties/TransformSection.vue";
import AppearanceSection from "./properties/AppearanceSection.vue";
import AnimationSection from "./properties/AnimationSection.vue";
import ColorSection from "./properties/ColorSection.vue";

const {
  selectedLayerName,
  isNullLayerSelected,
  hasSelectedFrame,
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
  // 업데이트 함수들
  updateCropX,
  updateCropY,
  updateWidth,
  updateHeight,
  updatePositionX,
  updatePositionY,
  updatePivotX,
  updatePivotY,
  updateScaleX,
  updateScaleY,
  updateRotation,
  updateVisible,
  updateInterpolated,
  updateDuration,
  updateTintR,
  updateTintG,
  updateTintB,
  updateTintAlpha,
  updateOffsetR,
  updateOffsetG,
  updateOffsetB,
} = usePropertiesPanel();
</script>

<template>
  <div class="properties-panel">
    <!-- Header Section -->
    <div class="panel-header">
      <div class="header-title">
        <div class="layer-info">
          <h3 class="layer-name">{{ selectedLayerName }}</h3>
          <span v-if="isNullLayerSelected" class="layer-type-badge"
            >Null Layer</span
          >
        </div>
      </div>
    </div>

    <!-- Content Section -->
    <div class="panel-content">
      <!-- No Frame Selected State -->
      <div v-if="!hasSelectedFrame" class="empty-state">
        <div class="empty-content">
          <h3>No Frame Selected</h3>
          <p>Select a frame to edit its properties</p>
        </div>
      </div>

      <!-- Properties Content (when frame is selected) -->
      <template v-else>
        <!-- Transform Section -->
        <TransformSection
          :position-x="positionX"
          :position-y="positionY"
          :scale-x="scaleX"
          :scale-y="scaleY"
          :rotation="rotation"
          :update-position-x="updatePositionX"
          :update-position-y="updatePositionY"
          :update-scale-x="updateScaleX"
          :update-scale-y="updateScaleY"
          :update-rotation="updateRotation"
        />

        <!-- Appearance Section (for non-null layers) -->
        <AppearanceSection
          v-if="!isNullLayerSelected"
          :crop-x="cropX"
          :crop-y="cropY"
          :width="width"
          :height="height"
          :pivot-x="pivotX"
          :pivot-y="pivotY"
          :update-crop-x="updateCropX"
          :update-crop-y="updateCropY"
          :update-width="updateWidth"
          :update-height="updateHeight"
          :update-pivot-x="updatePivotX"
          :update-pivot-y="updatePivotY"
        />

        <!-- Animation Section -->
        <AnimationSection
          :visible="visible"
          :interpolated="interpolated"
          :duration="duration"
          @update:visible="updateVisible"
          @update:interpolated="updateInterpolated"
          @update:duration="updateDuration"
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
      </template>
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

/* Empty State */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: var(--bg-color);
  color: var(--text-color-muted);
}

.empty-content {
  text-align: center;
}

.empty-content h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--text-color);
}

.empty-content p {
  font-size: 14px;
  margin: 0;
  color: var(--text-color-muted);
}

/* Dark mode is handled by CSS variables */
</style>
