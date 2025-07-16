<script setup lang="ts">
import type { LayerState } from '../../types/animation';

defineProps<{
  layerStates: LayerState[];
  layerHeight: number;
  frameWidth: number;
  selectedLayerId: number | null;
}>();

const emit = defineEmits(['select-layer']);
</script>

<template>
  <div class="timeline-layers-container">
    <div class="layers-header">
      <span>Layers</span>
    </div>

    <div class="layers-list">
      <div
        v-for="layer in layerStates"
        :key="layer.layerId"
        class="layer-item"
        :class="{
          'layer-hidden': !layer.visible,
          'layer-selected': selectedLayerId === layer.layerId,
          'layer-null': layer.isNullLayer,
        }"
        @click="emit('select-layer', layer.layerId)"
      >
        <div class="layer-visibility">
          <span class="visibility-icon">{{ layer.visible ? '👁' : '👁‍🗨' }}</span>
        </div>
        <div class="layer-info">
          <div class="layer-name">{{ layer.layerName }}</div>
          <div class="layer-type">
            {{ layer.isNullLayer ? `[Null: ${layer.originalNullId}]` : `[Sprite: ${layer.layerId}]` }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layers-panel {
  width: 200px;
  background-color: var(--bg-color);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
}

.layers-header {
  height: 30px;
  padding-left: 12px;
  display: flex;
  align-items: center;
  background-color: var(--bg-white);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-light);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-color-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.layers-list {
  flex: 1;
  overflow-y: auto;
}

.layer-item {
  display: flex;
  align-items: center;
  height: v-bind(layerHeight + 'px');
  box-sizing: border-box;
  padding: 0 8px;
  border-bottom: 1px solid var(--border-color);
  gap: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  background-color: var(--bg-white);
}

.layer-item:hover {
  background-color: var(--bg-hover);
  border-color: var(--border-color);
}

.layer-item.layer-hidden {
  opacity: 0.5;
}

.layer-item.layer-selected {
  background-color: var(--bg-selected);
  box-shadow: var(--shadow-light);
}

.layer-item.layer-null .layer-name {
  color: var(--warning-color);
  font-style: italic;
}

.layer-item.layer-null .layer-type {
  color: var(--warning-color);
}

.layer-item.layer-null.layer-selected {
  background-color: var(--bg-null);
  box-shadow: var(--shadow-light);
}

.layer-visibility {
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.visibility-icon {
  cursor: pointer;
  font-size: 14px;
}

.layer-info {
  flex: 1;
  min-width: 0;
}

.layer-name {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-color);
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.layer-type {
  font-size: 10px;
  color: var(--text-color-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* Scrollbar styling */
.layers-list::-webkit-scrollbar {
  width: 6px;
}

.layers-list::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

.layers-list::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: var(--border-radius-xs);
}

.layers-list::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

/* Dark mode is handled by CSS variables */
</style>
