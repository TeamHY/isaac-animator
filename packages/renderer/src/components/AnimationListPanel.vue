<script setup lang="ts">
import type { IDockviewPanelProps } from "dockview-vue";
import { inject, computed } from 'vue';
import type { AnimationState } from "../types/animation";

const props = defineProps<{
  params: IDockviewPanelProps;
}>();

const animationState = inject<AnimationState>('animationState');

const selectAnimation = (animationName: string) => {
  if (animationState) {
    animationState.setAnimation(animationName);
  }
};

// 기본 애니메이션 이름 가져오기
const defaultAnimationName = computed(() => {
  return animationState?.renderer?.getDefaultAnimationName() || '';
});
</script>

<template>
  <div class="animation-list-panel">
    <div
      v-for="animation in animationState?.availableAnimations"
      :key="animation"
      class="animation-item"
      :class="{
        'animation-selected': animation === animationState?.currentAnimation,
        'animation-default': animation === defaultAnimationName
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
  background-color: #2a2a2a;
  color: #ffffff;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow-y: auto;
}

.animation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #444;
  cursor: pointer;
  font-size: 11px;
  transition: background-color 0.1s ease;
}

.animation-item:hover {
  background-color: #404040;
}

.animation-item.animation-selected {
  background-color: #5a5a5a;
  border-left: 4px solid #4CAF50;
  color: #ffffff;
}

.animation-item.animation-default .animation-name {
  font-weight: bold;
}

.animation-name {
  flex: 1;
}

.default-indicator {
  color: #FFD700;
  font-size: 12px;
  margin-left: 8px;
}

/* 스크롤바 스타일링 */
.animation-list-panel::-webkit-scrollbar {
  width: 6px;
}

.animation-list-panel::-webkit-scrollbar-track {
  background: #2a2a2a;
}

.animation-list-panel::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 3px;
}

.animation-list-panel::-webkit-scrollbar-thumb:hover {
  background: #666;
}
</style>
