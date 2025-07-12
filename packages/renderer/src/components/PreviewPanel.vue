<script setup lang="ts">
import { ref } from 'vue';
import type { IDockviewPanelProps } from 'dockview-vue';
import { usePreviewPanel } from '../composables/usePreviewPanel';
import OverlayControls from './OverlayControls.vue';
import ControlGroup from './ControlGroup.vue';
import ControlButton from './ControlButton.vue';

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
