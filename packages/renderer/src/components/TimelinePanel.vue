<script setup lang="ts">
import { ref, watch } from "vue";
import type { IDockviewPanelProps } from "dockview-vue";
import { useTimeline } from "../composables/useTimeline";
import TimelineHeader from "./timeline/TimelineHeader.vue";
import TimelineLayers from "./timeline/TimelineLayers.vue";
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from "reka-ui";

defineProps<{
  params: IDockviewPanelProps;
}>();

const timelineContainer = ref<HTMLDivElement | null>(null);
const layersContainer = ref<HTMLDivElement | null>(null);

const {
  animationState,
  currentFrame,
  totalFrames,
  fps,
  isPlaying,
  animationName,
  layerStates,
  playheadPosition,
  isDraggingPlayhead,
  timelineFrames,
  getLayerKeyframes,
  onTimelineMouseDown,
  onPlayheadMouseDown,
  togglePlayback,
  stopPlayback,
  selectLayer,
  layerHeight,
  frameWidth,
  isLooping,
} = useTimeline(timelineContainer, layersContainer);

watch(playheadPosition, (newPos) => {
  if (!timelineContainer.value) return;

  const containerWidth = timelineContainer.value.clientWidth;
  const scrollLeft = timelineContainer.value.scrollLeft;
  const visibleStart = scrollLeft;
  const visibleEnd = scrollLeft + containerWidth;

  // Auto-scroll to keep playhead visible
  if (newPos < visibleStart) {
    timelineContainer.value.scrollLeft = Math.max(0, newPos - 100);
  } else if (newPos > visibleEnd - 100) {
    timelineContainer.value.scrollLeft = newPos - containerWidth + 200;
  }
});
</script>

<template>
  <div class="timeline-panel">
    <TimelineHeader
      :animation-name="animationName"
      :current-frame="currentFrame"
      :total-frames="totalFrames"
      :fps="fps"
      :is-playing="isPlaying"
      :is-looping="isLooping"
      @toggle-playback="togglePlayback"
      @stop-playback="stopPlayback"
    />

    <SplitterGroup class="timeline-main" direction="horizontal">
      <SplitterPanel :min-size="20" :default-size="30">
        <TimelineLayers
          ref="layersContainer"
          :layer-states="layerStates"
          :selected-layer-id="animationState?.selectedLayerId ?? null"
          :layer-height="layerHeight"
          :frame-width="frameWidth"
          @select-layer="selectLayer"
        />
      </SplitterPanel>

      <SplitterResizeHandle />

      <SplitterPanel :min-size="20" :default-size="80">
        <div class="timeline-container" ref="timelineContainer">
          <div
            class="timeline-content"
            :style="{ width: `${totalFrames * frameWidth + frameWidth}px` }"
          >
            <!-- Ruler -->
            <div class="timeline-ruler">
              <div
                v-for="frame in timelineFrames"
                :key="frame.frame"
                class="frame-marker"
                :class="{ 'key-frame': frame.isKeyFrame }"
                :style="{ left: `${frame.x}px` }"
              >
                <span v-if="frame.label" class="frame-label">{{
                  frame.label
                }}</span>
              </div>
            </div>

            <!-- Layer Tracks -->
            <div class="timeline-tracks">
              <div
                v-for="(layer, index) in layerStates"
                :key="layer.layerId"
                class="track"
                :style="{ top: `${index * layerHeight - 1}px` }"
              >
                <!-- Keyframes -->
                <div
                  v-for="keyframe in getLayerKeyframes(layer)"
                  :key="`${layer.layerId}-${keyframe.frame}`"
                  class="keyframe"
                  :style="{ left: `${keyframe.x}px` }"
                >
                  <div class="keyframe-dot"></div>
                </div>
              </div>
            </div>

            <!-- Playhead -->
            <div
              class="playhead"
              :style="{
                left: `${playheadPosition}px`,
                height: `${layerStates.length * layerHeight + 30}px`,
              }"
            >
              <div
                class="playhead-handle"
                :class="{ dragging: isDraggingPlayhead }"
                @mousedown="onPlayheadMouseDown"
              ></div>
              <div class="playhead-line"></div>
            </div>
          </div>

          <!-- Click Event Catcher -->
          <div
            class="timeline-click-area"
            :style="{
              height: `${layerStates.length * layerHeight + 30}px`,
              width: `${totalFrames * frameWidth + frameWidth}px`,
            }"
            @mousedown="onTimelineMouseDown"
          ></div>
        </div>
      </SplitterPanel>
    </SplitterGroup>
  </div>
</template>

<style scoped>
.timeline-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bg-color);
  color: var(--text-color);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
    "Helvetica Neue", Arial, sans-serif;
}

.timeline-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.timeline-container {
  height: 100%;
  flex: 1;
  position: relative;
  background-color: var(--bg-white);
  overflow-x: auto;
  overflow-y: hidden;
}

.timeline-content {
  position: relative;
  width: max-content;
  min-width: 100%;
}

.timeline-ruler {
  position: sticky;
  top: 0;
  left: 0;
  height: 30px;
  background-color: var(--bg-color);
  border-bottom: 1px solid var(--border-color);
  width: max-content;
  min-width: 100%;
  z-index: 10;
}

.frame-marker {
  position: absolute;
  top: 0;
  width: 1px;
  height: 30px;
  background-color: var(--marker-color);
  transform: translateX(-0.5px);
}

.frame-marker.key-frame {
  background-color: var(--marker-key);
  width: 2px;
  transform: translateX(-1px);
}

.frame-label {
  position: absolute;
  top: 2px;
  left: 2px;
  font-size: 9px;
  font-weight: 500;
  color: var(--text-color-muted);
  pointer-events: none;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.timeline-tracks {
  position: relative;
  top: 0;
  left: 0;
  width: max-content;
  min-width: 100%;
}

.track {
  position: absolute;
  width: 100%;
  height: 32px;
  border-bottom: 1px solid var(--border-color-light);
}

.keyframe {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
}

.keyframe-dot {
  width: 8px;
  height: 8px;
  background-color: var(--keyframe-color);
  border-radius: 50%;
  border: 1px solid var(--keyframe-border);
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: var(--shadow-normal);
}

.keyframe-dot:hover {
  background-color: var(--keyframe-hover);
  transform: scale(1.1);
  box-shadow: var(--shadow-medium);
}

.playhead {
  position: absolute;
  top: 0;
  width: 2px;
  background-color: var(--playhead-color);
  z-index: 100;
  pointer-events: none;
  transform: translateX(-1px);
}

.playhead-handle {
  position: absolute;
  top: -6px;
  left: -8px;
  width: 18px;
  height: 14px;
  background-color: var(--playhead-color);
  border-radius: var(--border-radius-xs);
  cursor: grab;
  pointer-events: all;
  transition: all 0.15s ease;
  box-shadow: var(--shadow-medium);
}

.playhead-handle:hover {
  background-color: var(--playhead-color-hover);
  box-shadow: var(--shadow-elevated);
}

.playhead-handle.dragging {
  cursor: grabbing;
  background-color: var(--playhead-color-active);
  transform: scale(1.05);
  box-shadow: var(--shadow-heavy);
}

.playhead-line {
  width: 2px;
  height: 100%;
  background-color: var(--playhead-color);
}

.timeline-click-area {
  position: absolute;
  top: 0;
  left: 0;
  cursor: pointer;
  z-index: 50;
}

/* Scrollbar styling */
.timeline-container::-webkit-scrollbar {
  height: 8px;
}

.timeline-container::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
  border-radius: var(--border-radius-small);
}

.timeline-container::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: var(--border-radius-small);
  border: 1px solid var(--scrollbar-track);
}

.timeline-container::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

/* Dark mode is handled by CSS variables */
</style>
