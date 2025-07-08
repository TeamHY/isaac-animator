<script setup lang="ts">
import { ref } from 'vue';
import type { IDockviewPanelProps } from 'dockview-vue';
import { usePreviewPanel } from '../composables/usePreviewPanel';

defineProps<{
  params: IDockviewPanelProps;
}>();

const pixiContainer = ref<HTMLDivElement | null>(null);

const { isPlaying, zoomLevel, showCrosshair, setZoom, resetZoom, togglePlay } =
  usePreviewPanel(pixiContainer);
</script>

<template>
  <div class="preview-panel">
    <div ref="pixiContainer" class="pixi-container"></div>
    <div class="controls">
      <div class="zoom-controls">
        <button @click="setZoom(zoomLevel / 1.2)" class="control-btn">-</button>
        <span class="zoom-level" @click="resetZoom">{{ Math.round(zoomLevel * 100) }}%</span>
        <button @click="setZoom(zoomLevel * 1.2)" class="control-btn">+</button>
        <button @click="resetZoom" class="control-btn reset-btn">Reset</button>
      </div>
      <div class="toggle-controls">
        <label>
          <input type="checkbox" v-model="showCrosshair" />
          Show Crosshair
        </label>
      </div>
    </div>
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

.controls {
  position: absolute;
  bottom: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: var(--bg-control);
  padding: 8px 12px;
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-elevated);
  backdrop-filter: blur(10px);
}

.control-btn {
  width: 28px;
  height: 28px;
  background-color: var(--button-bg);
  border: 1px solid var(--button-border);
  border-radius: var(--border-radius-small);
  color: var(--button-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s ease;
  box-shadow: var(--shadow-normal);
}

.control-btn:hover {
  background-color: var(--button-hover-bg);
  border-color: var(--button-hover-border);
  box-shadow: var(--shadow-medium);
}

.control-btn:active {
  transform: translateY(1px);
  box-shadow: var(--shadow-normal);
}

.reset-btn {
  width: auto !important;
  padding: 0 10px;
  min-width: 28px;
  font-size: 11px;
  font-weight: 500;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
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

.toggle-controls label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  color: var(--text-color-muted);
}

.toggle-controls input[type="checkbox"] {
  width: 14px;
  height: 14px;
  border: 1px solid var(--border-color-secondary);
  border-radius: var(--border-radius-xs);
  cursor: pointer;
  accent-color: var(--primary-color);
}

/* Dark mode is handled by CSS variables */
@media (prefers-color-scheme: dark) {
  .toggle-controls input[type="checkbox"] {
    accent-color: var(--accent-color);
  }
}
</style>
