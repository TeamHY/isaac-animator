<script setup lang="ts">
import { ref } from 'vue';
import type { IDockviewPanelProps } from 'dockview-vue';
import { useSpritesheetViewer } from '../composables/useSpritesheetViewer';
import OverlayControls from './OverlayControls.vue';
import ControlGroup from './ControlGroup.vue';
import ControlButton from './ControlButton.vue';

defineProps<{
  params: IDockviewPanelProps;
}>();

const pixiContainer = ref<HTMLDivElement | null>(null);

const {
  zoomLevel,
  showGrid,
  backgroundColor,
  mousePosition,
  imageSize,
  selectedSpritesheet,
  setZoom,
  resetView,
  toggleGrid,
  setBackgroundColor,
} = useSpritesheetViewer(pixiContainer);

const zoomIn = () => setZoom(zoomLevel.value * 1.2);
const zoomOut = () => setZoom(zoomLevel.value / 1.2);
</script>

<template>
  <div class="spritesheet-viewer-panel">
    <!-- Main Content -->
    <div class="panel-content">
      <div class="viewer-container">
        <!-- Pixi Container - always rendered -->
        <div ref="pixiContainer" class="pixi-container"></div>

        <!-- Title Overlay -->
        <OverlayControls position="top-left" v-if="selectedSpritesheet">
          <div class="title-info">
            <h3 class="panel-title">{{ selectedSpritesheet.path }}</h3>
          </div>
        </OverlayControls>

        <!-- Display & Background Controls -->
        <OverlayControls position="top-right" v-if="selectedSpritesheet">
          <ControlGroup>
            <ControlButton
              @click="toggleGrid"
              :active="showGrid"
              title="Toggle Grid"
            >
              #
            </ControlButton>
            <select
              :value="backgroundColor"
              @change="setBackgroundColor(($event.target as HTMLSelectElement).value)"
              class="background-select"
              title="Background"
            >
              <option value="checkerboard">Checkerboard</option>
              <option value="white">White</option>
              <option value="black">Black</option>
            </select>
          </ControlGroup>
        </OverlayControls>

        <!-- Zoom Controls -->
        <OverlayControls position="bottom-center" v-if="selectedSpritesheet">
          <ControlGroup>
            <ControlButton @click="zoomOut" title="Zoom Out">-</ControlButton>
            <span class="zoom-level" @click="resetView">{{ Math.round(zoomLevel * 100) }}%</span>
            <ControlButton @click="zoomIn" title="Zoom In">+</ControlButton>
            <ControlButton @click="resetView" variant="reset" title="Reset Zoom">Reset</ControlButton>
          </ControlGroup>
        </OverlayControls>

        <!-- Empty State Overlay -->
        <div v-if="selectedSpritesheet === null" class="empty-state-overlay">
          <div class="empty-state-content">
            <h3>Spritesheet Viewer</h3>
            <p>Select a spritesheet to view</p>
          </div>
        </div>

        <!-- Info Overlay -->
        <div v-if="selectedSpritesheet" class="info-overlay">
          <div class="info-section">
            <div class="info-item">
              <span class="info-label">Image Size:</span>
              <span class="info-value">{{ imageSize.width }}×{{ imageSize.height }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Mouse Position:</span>
              <span class="info-value">{{ mousePosition.x }}, {{ mousePosition.y }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Zoom:</span>
              <span class="info-value">{{ Math.round(zoomLevel * 100) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.spritesheet-viewer-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bg-color);
  color: var(--text-color);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  box-sizing: border-box;
}

/* Content Section */
.panel-content {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 0;
}

.viewer-container {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: var(--bg-color);
}

.pixi-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: transparent;
  cursor: grab;
}

.pixi-container:active {
  cursor: grabbing;
}

/* Title Overlay */
.title-info {
  pointer-events: none;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

/* Zoom Level Display */
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

/* Background Select */
.background-select {
  padding: 4px 6px;
  border: 1px solid var(--button-border);
  background-color: var(--button-bg);
  color: var(--text-color);
  font-size: 11px;
  cursor: pointer;
  border-radius: var(--border-radius-small);
  transition: all 0.15s ease;
}

.background-select:hover {
  background-color: var(--button-hover-bg);
  border-color: var(--button-hover-border);
}

.background-select:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--primary-color);
}

/* Empty State */
.empty-state-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--bg-color);
  color: var(--text-color-muted);
  pointer-events: none;
  z-index: 10;
}

.empty-state-content {
  text-align: center;
}

.empty-state-content h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--text-color);
}

.empty-state-content p {
  font-size: 14px;
  margin: 0;
  color: var(--text-color-muted);
}

/* Info Overlay */
.info-overlay {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: var(--border-radius-small);
  font-size: 11px;
  pointer-events: none;
  backdrop-filter: blur(4px);
  z-index: 50;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.info-label {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 400;
}

.info-value {
  color: white;
  font-weight: 500;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}

/* Responsive */
@media (max-width: 768px) {
  .info-overlay {
    position: static;
    margin: 8px;
    pointer-events: auto;
  }

  .title-info .panel-title {
    max-width: 200px;
  }
}
</style>
