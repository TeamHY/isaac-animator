<script setup lang="ts">
defineProps<{
  animationName: string;
  currentFrame: number;
  totalFrames: number;
  fps: number;
  isPlaying: boolean;
  isLooping: boolean;
}>();

const emit = defineEmits(['toggle-playback', 'stop-playback']);
</script>

<template>
  <div class="timeline-header">
    <div class="animation-info">
      <span class="animation-name">{{ animationName }}</span>
      <span class="frame-info">{{ currentFrame + 1 }} / {{ totalFrames }}</span>
      <span class="fps-info">{{ fps }} FPS</span>
    </div>

    <div class="playback-controls">
      <div class="loop-control">
        <input
          type="checkbox"
          :checked="isLooping"
          disabled
          id="timeline-loop"
        />
        <label for="timeline-loop">Loop</label>
      </div>
      <button @click="emit('stop-playback')" class="control-btn">⏹</button>
      <button @click="emit('toggle-playback')" class="control-btn">
        {{ isPlaying ? '⏸' : '▶' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: var(--bg-white);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-light);
  flex-shrink: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
}

.animation-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.animation-name {
  font-weight: 600;
  font-size: 13px;
  color: var(--primary-color);
}

.frame-info,
.fps-info {
  color: var(--text-color-secondary);
  font-size: 11px;
  font-weight: 500;
}

.playback-controls {
  display: flex;
  gap: 6px;
  align-items: center;
}

.loop-control {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-right: 4px;
  padding: 4px 8px;
  border-radius: var(--border-radius-small);
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
}

.loop-control input[type="checkbox"] {
  width: 14px;
  height: 14px;
  margin: 0;
  cursor: not-allowed;
  accent-color: var(--primary-color);
}

.loop-control label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-color-muted);
  cursor: not-allowed;
  user-select: none;
}

.control-btn {
  width: 32px;
  height: 32px;
  background-color: var(--button-bg);
  border: 1px solid var(--button-border);
  border-radius: var(--border-radius-small);
  color: var(--button-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
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

/* Dark mode is handled by CSS variables */
</style>
