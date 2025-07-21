<script setup lang="ts">
import { ref, computed } from 'vue';
import type { IDockviewPanelProps } from 'dockview-vue';
import { usePreviewPanel } from '../composables/usePreviewPanel';
import { useAnimationState } from '../composables/useAnimationState';
import OverlayControls from './OverlayControls.vue';
import ControlGroup from './ControlGroup.vue';
import ControlButton from './ControlButton.vue';
import TransformGizmo from './TransformGizmo.vue';

defineProps<{
  params: IDockviewPanelProps;
}>();

const pixiContainer = ref<HTMLDivElement | null>(null);

const { isPlaying, zoomLevel, showCrosshair, setZoom, resetZoom, togglePlay, getCameraInfo, getContainerSize } =
  usePreviewPanel(pixiContainer);

const { animationState } = useAnimationState();

// Transform gizmo visibility and target info
const showTransformGizmo = ref(true);

// Get current selected layer's transform data
const selectedLayerTransform = computed(() => {
  if (animationState?.selectedLayerId === null || !animationState?.renderer) {
    return null;
  }

  const frame = animationState.renderer.getCurrentFrameForLayer(animationState.selectedLayerId);
  if (!frame) return null;

  if (animationState?.selectedLayerId < 0) {
    // TODO: NULL LAYER 처리 해야 함.
    return null;
  }

  return {
    x: frame.xPosition,
    y: frame.yPosition,
    scaleX: frame.xScale / 100,
    scaleY: frame.yScale / 100,
    rotation: frame.rotation,
    width: frame.width ?? 0,
    height: frame.height ?? 0,
    pivotX: frame.xPivot ?? 0,
    pivotY: frame.yPivot ?? 0,
  };
});

// Get camera and viewport info for gizmo
const cameraInfo = computed(() => {
  if (!pixiContainer.value) {
    return {
      cameraOffsetX: 0,
      cameraOffsetY: 0,
      zoomLevel: 1,
      viewportWidth: 800,
      viewportHeight: 600,
    };
  }

  const cameraData = getCameraInfo?.() || { x: 0, y: 0 };
  const containerSize = getContainerSize?.() || { width: 800, height: 600 };

  return {
    cameraOffsetX: cameraData.x,
    cameraOffsetY: cameraData.y,
    zoomLevel: zoomLevel.value,
    viewportWidth: containerSize.width,
    viewportHeight: containerSize.height,
  };
});

// Handle transform changes from gizmo
const handleTransform = (transformData: {
  x?: number;
  y?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
}) => {
  if (!animationState?.selectedLayerId || !animationState?.renderer) return;

  // Update properties on the selected layer
  if (transformData.x !== undefined) {
    animationState.renderer.updateCurrentFrameProperty(animationState.selectedLayerId, 'xPosition', transformData.x);
  }
  if (transformData.y !== undefined) {
    animationState.renderer.updateCurrentFrameProperty(animationState.selectedLayerId, 'yPosition', transformData.y);
  }
  if (transformData.scaleX !== undefined) {
    animationState.renderer.updateCurrentFrameProperty(animationState.selectedLayerId, 'xScale', transformData.scaleX * 100);
  }
  if (transformData.scaleY !== undefined) {
    animationState.renderer.updateCurrentFrameProperty(animationState.selectedLayerId, 'yScale', transformData.scaleY * 100);
  }
  if (transformData.rotation !== undefined) {
    animationState.renderer.updateCurrentFrameProperty(animationState.selectedLayerId, 'rotation', transformData.rotation);
  }
};
</script>

<template>
  <div class="preview-panel">
    <div ref="pixiContainer" class="pixi-container"></div>

    <!-- Transform Gizmo -->
    <TransformGizmo
      v-if="selectedLayerTransform && showTransformGizmo"
      :target-x="selectedLayerTransform.x"
      :target-y="selectedLayerTransform.y"
      :target-scale-x="selectedLayerTransform.scaleX"
      :target-scale-y="selectedLayerTransform.scaleY"
      :target-rotation="selectedLayerTransform.rotation"
      :target-width="selectedLayerTransform.width"
      :target-height="selectedLayerTransform.height"
      :pivot-x="selectedLayerTransform.pivotX"
      :pivot-y="selectedLayerTransform.pivotY"
      :camera-offset-x="cameraInfo.cameraOffsetX"
      :camera-offset-y="cameraInfo.cameraOffsetY"
      :zoom-level="cameraInfo.zoomLevel"
      :viewport-width="cameraInfo.viewportWidth"
      :viewport-height="cameraInfo.viewportHeight"
      :visible="true"
      @transform="handleTransform"
    />

    <OverlayControls position="bottom-center">
      <ControlGroup>
        <ControlButton @click="setZoom(zoomLevel / 1.2)" title="Zoom Out">-</ControlButton>
        <span class="zoom-level" @click="resetZoom">{{ Math.round(zoomLevel * 100) }}%</span>
        <ControlButton @click="setZoom(zoomLevel * 1.2)" title="Zoom In">+</ControlButton>
        <ControlButton @click="resetZoom" variant="reset" title="Reset Zoom">Reset</ControlButton>
      </ControlGroup>
      <ControlGroup>
        <label class="toggle-control">
          <input type="checkbox" v-model="showCrosshair" />
          Show Crosshair
        </label>
        <label class="toggle-control">
          <input type="checkbox" v-model="showTransformGizmo" />
          Transform Gizmo
        </label>
      </ControlGroup>
    </OverlayControls>
  </div>
</template>

<style scoped>
.preview-panel {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background-color: var(--bg-color);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
}

.pixi-container {
  width: 100%;
  height: 100%;
  cursor: grab;
  background-color: var(--bg-white);
  border: 1px solid var(--border-color);
  box-sizing: border-box;
}

.pixi-container:active {
  cursor: grabbing;
}

.zoom-level {
  font-size: 11px;
  font-weight: 500;
  min-width: 44px;
  text-align: center;
  cursor: pointer;
  color: var(--text-color-muted);
  padding: 4px 6px;
  border-radius: var(--border-radius-small);
  transition: all 0.15s ease;
}

.zoom-level:hover {
  background-color: var(--bg-hover);
  color: var(--text-color);
}

.toggle-control {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  color: var(--text-color-muted);
}

.toggle-control input[type="checkbox"] {
  width: 14px;
  height: 14px;
  border: 1px solid var(--border-color-secondary);
  border-radius: var(--border-radius-xs);
  cursor: pointer;
  accent-color: var(--primary-color);
}

/* Dark mode is handled by CSS variables */
@media (prefers-color-scheme: dark) {
  .toggle-control input[type="checkbox"] {
    accent-color: var(--accent-color);
  }
}
</style>
