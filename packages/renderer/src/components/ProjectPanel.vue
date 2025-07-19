<script setup lang="ts">
import type { IDockviewPanelProps } from 'dockview-vue';
import { useProject } from '../composables/useProject';
import { useAnm2Info } from '../composables/useAnm2Info';

defineProps<{
  params: IDockviewPanelProps;
}>();

const { 
  animationState, 
  spritesheets, 
  selectSpritesheet, 
  getSpritesheetUsage, 
  getSpritesheetThumbnail,
  selectAnimation,
  defaultAnimationName,
  getAnimationInfo
} = useProject();

const {
  anm2Info,
  updateCreatedBy,
  updateFps
} = useAnm2Info();
</script>

<template>
  <div class="project-panel">
    <!-- Animation Info Section -->
    <div class="section">
      <h4 class="section-title">Animation Info</h4>
      <div class="section-content info-fields-horizontal">
        <div class="info-field">
          <label class="field-label">Created By</label>
          <input
            type="text"
            class="field-input"
            :value="anm2Info?.createdBy || ''"
            @input="updateCreatedBy(($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="info-field">
          <label class="field-label">FPS</label>
          <input
            type="number"
            class="field-input"
            :value="anm2Info?.fps || 30"
            @input="updateFps(Number(($event.target as HTMLInputElement).value))"
            min="1"
            max="120"
          />
        </div>
      </div>
    </div>
      <!-- Spritesheets Section -->
      <div class="section">
        <h4 class="section-title">Spritesheets</h4>
        <div class="section-content">
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
      </div>

      <!-- Animations Section -->
      <div class="section">
        <h4 class="section-title">Animations</h4>
        <div class="section-content">
          <div
            v-for="animation in animationState?.availableAnimations"
            :key="animation"
            class="animation-item"
            :class="{
              'animation-selected': animation === animationState?.currentAnimation,
              'animation-default': animation === defaultAnimationName,
            }"
            @click="selectAnimation(animation)"
          >
            <div class="animation-info">
              <span class="animation-name">{{ animation }}</span>
              <div class="animation-indicators">
                <span v-if="animation === defaultAnimationName" class="default-indicator">⭐</span>
                <span v-if="getAnimationInfo(animation)?.loop" class="loop-indicator">🔁</span>
              </div>
            </div>
          </div>
        </div>
      </div>
  </div>
</template>

<style scoped>
.project-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bg-color);
  color: var(--text-color);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  box-sizing: border-box;
  border-left: 1px solid var(--border-color);
}

.project-panel {
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  min-height: 0;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-color-muted);
  margin: 0;
  padding: 4px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* Info Fields */
.info-fields-horizontal {
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.info-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.field-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-color-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-input {
  padding: 4px 6px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-xs);
  background-color: var(--bg-white);
  color: var(--text-color);
  font-size: 11px;
  font-family: inherit;
  transition: border-color 0.15s ease;
}

.field-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.field-input[type="number"] {
  -moz-appearance: textfield;
}

.field-input[type="number"]::-webkit-outer-spin-button,
.field-input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}


.animation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: var(--border-radius-small);
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.15s ease;
  border: 1px solid transparent;
  background-color: var(--bg-white);
}

.animation-item:hover {
  background-color: var(--bg-hover);
  border-color: var(--border-color);
}

.animation-item.animation-selected {
  background-color: var(--bg-selected);
  border-color: var(--border-color-focus);
  color: var(--primary-color);
  box-shadow: var(--shadow-light);
}

.animation-item.animation-default .animation-name {
  font-weight: 600;
  color: var(--text-color);
}

.animation-item.animation-selected.animation-default .animation-name {
  color: var(--primary-color);
}

.animation-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.animation-name {
  flex: 1;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.animation-indicators {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  flex-shrink: 0;
}

.default-indicator {
  color: var(--warning-color);
  font-size: 12px;
}

.loop-indicator {
  color: var(--text-color-muted);
  font-size: 12px;
}

.spritesheet-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
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

.project-panel::-webkit-scrollbar {
  width: 6px;
}

.project-panel::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

.project-panel::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: var(--border-radius-xs);
}

.project-panel::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}
</style>