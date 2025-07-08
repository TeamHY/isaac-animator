<script setup lang="ts">
import type { IDockviewPanelProps } from 'dockview-vue';
import { useAnimationList } from '../composables/useAnimationList';

defineProps<{
  params: IDockviewPanelProps;
}>();

const { animationState, selectAnimation, defaultAnimationName } = useAnimationList();
</script>

<template>
  <div class="animation-list-panel">
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
      <span class="animation-name">{{ animation }}</span>
      <span v-if="animation === defaultAnimationName" class="default-indicator">⭐</span>
    </div>
  </div>
</template>

<style scoped>
.animation-list-panel {
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

.animation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 2px;
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

.animation-name {
  flex: 1;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.default-indicator {
  color: var(--warning-color);
  font-size: 12px;
  margin-left: 8px;
  flex-shrink: 0;
}

/* Scrollbar styling */
.animation-list-panel::-webkit-scrollbar {
  width: 6px;
}

.animation-list-panel::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

.animation-list-panel::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: var(--border-radius-xs);
}

.animation-list-panel::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

/* Dark mode is handled by CSS variables */
</style>
