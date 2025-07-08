<script setup lang="ts">
import { ref } from 'vue';
import type { IDockviewPanelProps } from 'dockview-vue';
import { useSpritesheetViewer } from '../composables/useSpritesheetViewer';

defineProps<{
  params: IDockviewPanelProps;
}>();

const pixiContainer = ref<HTMLDivElement | null>(null);

const {
  zoomLevel,
  showGrid,
  backgroundColor,
  showCropHighlight,
  mousePosition,
  imageSize,
  selectedSpritesheet,
  setZoom,
  resetView,
  fitToView,
  setPixelPerfect,
  toggleGrid,
  setBackgroundColor,
} = useSpritesheetViewer(pixiContainer);

const zoomIn = () => setZoom(zoomLevel.value * 1.2);
const zoomOut = () => setZoom(zoomLevel.value / 1.2);
</script>

<template>
  <div class="spritesheet-viewer-panel">
    <!-- Header Section -->
    <div class="panel-header">
      <div class="header-left">
        <h3 class="panel-title">Spritesheet Viewer</h3>
        <span v-if="selectedSpritesheet" class="current-spritesheet">
          {{ selectedSpritesheet.path }}
        </span>
      </div>
      
      <div class="header-controls">
        <!-- Zoom Controls -->
        <div class="control-group">
          <button @click="zoomOut" class="control-btn" title="Zoom Out">🔍-</button>
          <span class="zoom-display">{{ Math.round(zoomLevel * 100) }}%</span>
          <button @click="zoomIn" class="control-btn" title="Zoom In">🔍+</button>
        </div>

        <!-- View Controls -->
        <div class="control-group">
          <button @click="resetView" class="control-btn" title="Reset View">🏠</button>
          <button @click="fitToView" class="control-btn" title="Fit to View">📐</button>
          <button @click="setPixelPerfect" class="control-btn" title="Pixel Perfect (1:1)">🎯</button>
        </div>

        <!-- Display Options -->
        <div class="control-group">
          <button 
            @click="toggleGrid" 
            class="control-btn"
            :class="{ active: showGrid }"
            title="Toggle Grid"
          >
            #
          </button>
        </div>

        <!-- Background Controls -->
        <div class="control-group">
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
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="panel-content">
      <div class="viewer-container">
        <!-- Pixi Container - always rendered -->
        <div ref="pixiContainer" class="pixi-container"></div>
        
        <!-- Empty State Overlay -->
        <div v-if="selectedSpritesheet === null" class="empty-state-overlay">
          <p>Select a spritesheet to view</p>
        </div>
        
        <!-- Info Overlay -->
        <div v-else class="info-overlay">
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

/* Header Section */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: var(--bg-white);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-light);
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.current-spritesheet {
  font-size: 11px;
  color: var(--text-color-muted);
  font-weight: 400;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background-color: var(--bg-color);
  border-radius: var(--border-radius-small);
  border: 1px solid var(--border-color);
}

.control-btn {
  padding: 6px 8px;
  border: none;
  background: transparent;
  color: var(--text-color);
  cursor: pointer;
  border-radius: var(--border-radius-xs);
  font-size: 11px;
  font-weight: 500;
  transition: all 0.15s ease;
  min-width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover {
  background-color: var(--bg-hover);
}

.control-btn.active {
  background-color: var(--bg-selected);
  color: var(--primary-color);
}

.zoom-display {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-color);
  min-width: 40px;
  text-align: center;
}

.background-select {
  padding: 4px 6px;
  border: none;
  background: transparent;
  color: var(--text-color);
  font-size: 11px;
  cursor: pointer;
  border-radius: var(--border-radius-xs);
}

.background-select:focus {
  outline: none;
  background-color: var(--bg-hover);
}

/* Content Section */
.panel-content {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 0;
}

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

.empty-state-overlay p {
  font-size: 14px;
  margin: 0;
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

/* Info Overlay */
.info-overlay {
  position: absolute;
  top: 12px;
  right: 12px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: var(--border-radius-small);
  font-size: 11px;
  pointer-events: none;
  backdrop-filter: blur(4px);
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
  .panel-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-controls {
    justify-content: center;
  }
  
  .control-group {
    flex: 1;
    justify-content: center;
  }
  
  .info-overlay {
    position: static;
    margin: 8px;
    pointer-events: auto;
  }
}
</style> 
