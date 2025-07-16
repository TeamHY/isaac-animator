<script setup lang="ts">
import type { IDockviewPanelProps } from 'dockview-vue';
import { useSpritesheetList } from '../composables/useSpritesheetList';

defineProps<{
  params: IDockviewPanelProps;
}>();

const { animationState, spritesheets, selectSpritesheet, getSpritesheetUsage, getSpritesheetThumbnail } = useSpritesheetList();
</script>

<template>
  <div class="spritesheet-list-panel">
    <div
      v-for="spritesheet in spritesheets"
      :key="spritesheet.id"
      class="spritesheet-item"
      :class="{
        'spritesheet-selected': spritesheet.id === animationState?.selectedSpritesheetId,
        'spritesheet-unused': !getSpritesheetUsage(spritesheet.id).isUsed,
      }"
      @click="selectSpritesheet(spritesheet.id)"
    >
      <img
        v-if="getSpritesheetThumbnail(spritesheet.id)"
        :src="getSpritesheetThumbnail(spritesheet.id) || ''"
        class="spritesheet-thumbnail"
        alt=""
      />
      <div v-else class="spritesheet-thumbnail placeholder"></div>
      <div class="spritesheet-main">
        <span class="spritesheet-name">{{ spritesheet.path }}</span>
        <span class="spritesheet-id">ID: {{ spritesheet.id }}</span>
      </div>
      <div class="spritesheet-info">
        <span class="usage-count">
          {{ getSpritesheetUsage(spritesheet.id).layers.length }} layers
        </span>
        <span v-if="!getSpritesheetUsage(spritesheet.id).isUsed" class="unused-indicator">❌</span>
      </div>
    </div>

    <div v-if="spritesheets.length === 0" class="empty-state">
      <p>No spritesheets available</p>
    </div>
  </div>
</template>

<style scoped>
.spritesheet-list-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bg-color);
  color: var(--text-color);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  box-sizing: border-box;
  padding: 6px;
  overflow-y: auto;
  min-height: 0;
}

.spritesheet-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  margin-bottom: 3px;
  border-radius: var(--border-radius-small);
  cursor: pointer;
  font-size: 11px;
  transition: all 0.15s ease;
  border: 1px solid transparent;
  background-color: var(--bg-white);
}

.spritesheet-item:hover {
  background-color: var(--bg-hover);
  border-color: var(--border-color);
}

.spritesheet-item.spritesheet-selected {
  background-color: var(--bg-selected);
  border-color: var(--border-color-focus);
  box-shadow: var(--shadow-light);
}

.spritesheet-item.spritesheet-unused {
  opacity: 0.6;
}

.spritesheet-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.spritesheet-name {
  font-weight: 500;
  color: var(--text-color);
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  margin-bottom: 2px;
}

.spritesheet-item.spritesheet-selected .spritesheet-name {
  color: var(--primary-color);
}

.spritesheet-id {
  font-size: 10px;
  color: var(--text-color-muted);
  font-weight: 400;
}

.spritesheet-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  margin-left: 8px;
}

.usage-count {
  font-size: 10px;
  color: var(--text-color-muted);
  font-weight: 400;
  margin-bottom: 2px;
}

.unused-indicator {
  font-size: 10px;
  opacity: 0.7;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: var(--text-color-muted);
}

.empty-state p {
  font-size: 12px;
  margin: 0;
}

/* Scrollbar styling */
.spritesheet-list-panel::-webkit-scrollbar {
  width: 6px;
}

.spritesheet-list-panel::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

.spritesheet-list-panel::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: var(--border-radius-xs);
}

.spritesheet-list-panel::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

.spritesheet-thumbnail {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  margin-right: 8px;
  border-radius: var(--border-radius-xs);
  background-color: var(--bg-color-darker);
  object-fit: contain;
  border: 1px solid var(--border-color);
}

.spritesheet-thumbnail.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color-muted);
  font-size: 18px;
}
</style>
