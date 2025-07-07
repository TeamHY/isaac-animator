<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue';
import type { Anm2Renderer } from '../renderer/Anm2Renderer';
import type { IDockviewPanelProps } from "dockview-vue";
import type { AnimationState } from '../types/animation';

const props = defineProps<{
  params: IDockviewPanelProps;
}>();

// App.vue에서 제공하는 공유 애니메이션 상태
const animationState = inject<AnimationState>('animationState');

const timelineContainer = ref<HTMLDivElement | null>(null);
const layersContainer = ref<HTMLDivElement | null>(null);
const refreshInterval = ref<number | null>(null);

// 타임라인 상태
const currentFrame = ref<number>(0);
const totalFrames = ref<number>(0);
const fps = ref<number>(30);
const isPlaying = ref<boolean>(false);
const animationName = ref<string>('');
const layerStates = ref<any[]>([]);

// 타임라인 UI 상태
const timelineWidth = ref<number>(800);
const frameWidth = 20; // 각 프레임의 너비 (픽셀)
const layerHeight = 32; // 각 레이어의 높이 (픽셀)
const playheadPosition = ref<number>(0);

// 스크롤 상태
const scrollX = ref<number>(0);
const maxScrollX = ref<number>(0);

// 플레이헤드 드래그 상태
const isDraggingPlayhead = ref<boolean>(false);
const isDraggingTimeline = ref<boolean>(false);
const dragStartX = ref<number>(0);
const dragStartFrame = ref<number>(0);

const updateTimelineData = () => {
  if (!animationState?.renderer) return;
  const anm2Renderer = animationState.renderer;

  try {
    currentFrame.value = anm2Renderer.getCurrentFrame();
    totalFrames.value = anm2Renderer.getTotalFrames();
    fps.value = anm2Renderer.getFPS();
    isPlaying.value = anm2Renderer.getIsPlaying();
    animationName.value = anm2Renderer.getCurrentAnimationName();
    layerStates.value = anm2Renderer.getCurrentLayerStates();

    // 플레이헤드 위치 계산 - 프레임 중앙에 위치
    playheadPosition.value = currentFrame.value * frameWidth + frameWidth / 2;

    // 최대 스크롤 위치 계산
    maxScrollX.value = Math.max(0, (totalFrames.value * frameWidth) - timelineWidth.value + 200);
  } catch (error) {
    console.warn('타임라인 데이터 업데이트 실패:', error);
  }
};

// 현재 프레임 변경 감지하여 전역 상태 업데이트
watch(currentFrame, (newFrame) => {
  if (animationState) {
    animationState.currentFrame = newFrame;
  }
});

// 타임라인 그리드 렌더링용 프레임 배열
const timelineFrames = computed(() => {
  const frames = [];
  for (let i = 0; i < totalFrames.value; i++) {
    frames.push({
      frame: i,
      x: i * frameWidth + frameWidth / 2, // 프레임 중앙에 위치
      isKeyFrame: i % 5 === 0, // 5프레임마다 키프레임 마커 표시
      label: i % 5 === 0 ? i.toString() : ''
    });
  }
  return frames;
});

// 레이어별 키프레임 정보
const getLayerKeyframes = (layerState: any) => {
  if (!animationState?.renderer) return [];
  const anm2Renderer = animationState.renderer;

  const keyframes = anm2Renderer.getLayerKeyframes(layerState.layerId);

  return keyframes.map(kf => ({
    frame: kf.animationFrame,
    x: kf.animationFrame * frameWidth + frameWidth / 2, // 프레임 중앙에 위치
    delay: kf.delay,
    frameData: kf.frameData
  }));
};

// 타임라인 마우스 다운 핸들러 - 클릭 및 드래그 시작
const onTimelineMouseDown = (event: MouseEvent) => {
  // 플레이헤드 핸들 드래그 중이면 무시
  if (isDraggingPlayhead.value) return;

  if (!animationState?.renderer || !timelineContainer.value) return;
  const anm2Renderer = animationState.renderer;

  event.preventDefault();
  event.stopPropagation();

  const rect = timelineContainer.value.getBoundingClientRect();
  const clickX = event.clientX - rect.left + scrollX.value;
  // 프레임 중앙 기준으로 계산하여 정확한 프레임 선택
  const targetFrame = Math.round((clickX - frameWidth / 2) / frameWidth);

  if (targetFrame >= 0 && targetFrame < totalFrames.value) {
    anm2Renderer.setCurrentFrame(targetFrame);
  }

  // 드래그 시작 준비
  isDraggingTimeline.value = true;
  dragStartX.value = event.clientX;
  dragStartFrame.value = targetFrame;

  // 커서 변경
  document.body.style.cursor = 'grabbing';

  // 전역 이벤트 리스너 추가
  document.addEventListener('mousemove', onTimelineMouseMove);
  document.addEventListener('mouseup', onTimelineMouseUp);
};

// 타임라인 드래그 중
const onTimelineMouseMove = (event: MouseEvent) => {
  if (!isDraggingTimeline.value || !timelineContainer.value || !animationState?.renderer) return;
  const anm2Renderer = animationState.renderer;

  const rect = timelineContainer.value.getBoundingClientRect();
  const currentX = event.clientX - rect.left + scrollX.value;
  // 프레임 중앙 기준으로 계산하여 정확한 프레임 계산
  const newFrame = Math.round((currentX - frameWidth / 2) / frameWidth);

  // 프레임 범위 제한
  const clampedFrame = Math.max(0, Math.min(newFrame, totalFrames.value - 1));

  // 즉시 프레임 업데이트 (애니메이션 일시정지하고 특정 프레임 표시)
  anm2Renderer.setCurrentFrame(clampedFrame);
};

// 타임라인 드래그 종료
const onTimelineMouseUp = () => {
  isDraggingTimeline.value = false;

  // 커서 복원
  document.body.style.cursor = '';

  // 전역 이벤트 리스너 제거
  document.removeEventListener('mousemove', onTimelineMouseMove);
  document.removeEventListener('mouseup', onTimelineMouseUp);
};

// 플레이헤드 드래그 시작
const onPlayheadMouseDown = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();

  if (!timelineContainer.value || isDraggingTimeline.value) return;

  isDraggingPlayhead.value = true;
  dragStartX.value = event.clientX;
  dragStartFrame.value = currentFrame.value;

  // 커서 변경
  document.body.style.cursor = 'grabbing';

  // 전역 이벤트 리스너 추가
  document.addEventListener('mousemove', onPlayheadMouseMove);
  document.addEventListener('mouseup', onPlayheadMouseUp);
};

// 플레이헤드 드래그 중
const onPlayheadMouseMove = (event: MouseEvent) => {
  if (!isDraggingPlayhead.value || !timelineContainer.value || !animationState?.renderer) return;
  const anm2Renderer = animationState.renderer;

  const rect = timelineContainer.value.getBoundingClientRect();
  const currentX = event.clientX - rect.left + scrollX.value;
  // 프레임 중앙 기준으로 계산하여 정확한 프레임 계산
  const newFrame = Math.round((currentX - frameWidth / 2) / frameWidth);

  // 프레임 범위 제한
  const clampedFrame = Math.max(0, Math.min(newFrame, totalFrames.value - 1));

  // 즉시 프레임 업데이트 (애니메이션 일시정지하고 특정 프레임 표시)
  anm2Renderer.setCurrentFrame(clampedFrame);
};

// 플레이헤드 드래그 종료
const onPlayheadMouseUp = () => {
  isDraggingPlayhead.value = false;

  // 커서 복원
  document.body.style.cursor = '';

  // 전역 이벤트 리스너 제거
  document.removeEventListener('mousemove', onPlayheadMouseMove);
  document.removeEventListener('mouseup', onPlayheadMouseUp);
};

// 수평 스크롤 핸들러
const onScroll = (event: WheelEvent) => {
  event.preventDefault();
  const delta = event.deltaX || event.deltaY;
  scrollX.value = Math.max(0, Math.min(maxScrollX.value, scrollX.value + delta));
};

// 재생 컨트롤
const togglePlayback = () => {
  if (!animationState?.renderer) return;
  const anm2Renderer = animationState.renderer;

  if (isPlaying.value) {
    anm2Renderer.pause();
  } else {
    anm2Renderer.play();
  }
};

const stopPlayback = () => {
  if (!animationState?.renderer) return;
  const anm2Renderer = animationState.renderer;
  anm2Renderer.stop();
};

// 레이어 선택 기능
const selectLayer = (layerId: number) => {
  if (animationState) {
    animationState.setSelectedLayer(layerId);
  }
};

// 컴포넌트 마운트
onMounted(() => {
  updateTimelineData();
  refreshInterval.value = setInterval(updateTimelineData, 1000 / 30);

  // 타임라인 컨테이너 크기 설정
  if (timelineContainer.value) {
    timelineWidth.value = timelineContainer.value.clientWidth;
  }
});

// 컴포넌트 언마운트
onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }

  // 혹시 남아있을 수 있는 드래그 이벤트 리스너 정리
  document.removeEventListener('mousemove', onPlayheadMouseMove);
  document.removeEventListener('mouseup', onPlayheadMouseUp);
  document.removeEventListener('mousemove', onTimelineMouseMove);
  document.removeEventListener('mouseup', onTimelineMouseUp);
  document.body.style.cursor = '';
});

// 플레이헤드가 화면을 벗어나면 자동 스크롤
watch(playheadPosition, (newPos) => {
  const visibleStart = scrollX.value;
  const visibleEnd = scrollX.value + timelineWidth.value - 200;

  if (newPos < visibleStart) {
    scrollX.value = Math.max(0, newPos - 100);
  } else if (newPos > visibleEnd) {
    scrollX.value = Math.min(maxScrollX.value, newPos - timelineWidth.value + 200);
  }
});
</script>

<template>
  <div class="timeline-panel">
    <!-- 타임라인 헤더 -->
    <div class="timeline-header">
      <div class="animation-info">
        <span class="animation-name">{{ animationName }}</span>
        <span class="frame-info">{{ currentFrame + 1 }} / {{ totalFrames }}</span>
        <span class="fps-info">{{ fps }} FPS</span>
      </div>

      <div class="playback-controls">
        <button @click="stopPlayback" class="control-btn">⏹</button>
        <button @click="togglePlayback" class="control-btn">
          {{ isPlaying ? '⏸' : '▶' }}
        </button>
      </div>
    </div>

    <!-- 메인 타임라인 영역 -->
    <div class="timeline-main">
      <!-- 레이어 리스트 -->
      <div class="layers-panel">
        <div class="layers-header">
          <span>레이어</span>
        </div>

        <div class="layers-list" ref="layersContainer">
          <div
            v-for="layer in layerStates"
            :key="layer.layerId"
            class="layer-item"
            :class="{
              'layer-hidden': !layer.visible,
              'layer-selected': animationState?.selectedLayerId === layer.layerId,
              'layer-null': layer.isNull
            }"
            @click="selectLayer(layer.layerId)"
          >
            <div class="layer-visibility">
              <span class="visibility-icon">{{ layer.visible ? '👁' : '👁‍🗨' }}</span>
            </div>
            <div class="layer-info">
              <div class="layer-name">{{ layer.layerName }}</div>
              <div class="layer-type">{{ layer.isNull ? '[Null: ' + layer.layerId + ']' : '[Sprite: ' + layer.layerId + ']' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 타임라인 그리드 -->
      <div class="timeline-container" ref="timelineContainer">
        <!-- 프레임 눈금자 -->
        <div class="timeline-ruler" :style="{ transform: `translateX(-${scrollX}px)` }">
          <div
            v-for="frame in timelineFrames"
            :key="frame.frame"
            class="frame-marker"
            :class="{ 'key-frame': frame.isKeyFrame }"
            :style="{ left: frame.x + 'px' }"
          >
            <span v-if="frame.label" class="frame-label">{{ frame.label }}</span>
          </div>
        </div>

        <!-- 레이어 트랙들 -->
        <div class="timeline-tracks" :style="{ transform: `translateX(-${scrollX}px)` }">
          <div
            v-for="(layer, index) in layerStates"
            :key="layer.layerId"
            class="track"
            :style="{ top: index * layerHeight + 'px' }"
          >
            <!-- 레이어의 키프레임들 -->
            <div
              v-for="keyframe in getLayerKeyframes(layer)"
              :key="`${layer.layerId}-${keyframe.frame}`"
              class="keyframe"
              :style="{ left: keyframe.x + 'px' }"
            >
              <div class="keyframe-dot"></div>
            </div>
          </div>
        </div>

                <!-- 플레이헤드 -->
        <div
          class="playhead"
          :style="{
            left: (playheadPosition - scrollX) + 'px',
            height: (layerStates.length * layerHeight + 30) + 'px'
          }"
        >
          <div
            class="playhead-handle"
            :class="{ 'dragging': isDraggingPlayhead }"
            @mousedown="onPlayheadMouseDown"
          ></div>
          <div class="playhead-line"></div>
        </div>

        <!-- 클릭 이벤트 캐처 -->
        <div
          class="timeline-click-area"
          @mousedown="onTimelineMouseDown"
          @wheel="onScroll"
          :style="{ height: (layerStates.length * layerHeight + 30) + 'px' }"
        ></div>
      </div>
    </div>

    <!-- 스크롤바 -->
    <div class="timeline-scrollbar">
      <div
        class="scrollbar-thumb"
        :style="{
          left: (scrollX / maxScrollX * 100) + '%',
          width: (timelineWidth / (totalFrames * frameWidth) * 100) + '%'
        }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.timeline-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #2a2a2a;
  color: #ffffff;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #3a3a3a;
  border-bottom: 1px solid #555;
  font-size: 12px;
}

.animation-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.animation-name {
  font-weight: bold;
  color: #4CAF50;
}

.frame-info, .fps-info {
  color: #cccccc;
}

.playback-controls {
  display: flex;
  gap: 4px;
}

.control-btn {
  width: 28px;
  height: 28px;
  background-color: #4a4a4a;
  border: 1px solid #666;
  border-radius: 4px;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.control-btn:hover {
  background-color: #5a5a5a;
}

.timeline-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.layers-panel {
  width: 200px;
  background-color: #353535;
  border-right: 1px solid #555;
  display: flex;
  flex-direction: column;
}

.layers-header {
  padding: 8px 12px;
  background-color: #404040;
  border-bottom: 1px solid #555;
  font-size: 12px;
  font-weight: bold;
}

.layers-list {
  flex: 1;
  overflow-y: auto;
}

.layer-item {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 8px;
  border-bottom: 1px solid #444;
  gap: 8px;
  cursor: pointer;
}

.layer-item:hover {
  background-color: #404040;
}

.layer-item.layer-hidden {
  opacity: 0.5;
}

.layer-item.layer-selected {
  background-color: #5a5a5a;
  border-left: 4px solid #4CAF50;
}

.layer-item.layer-null .layer-name {
  color: #FFB74D;
  font-style: italic;
}

.layer-item.layer-null .layer-type {
  color: #FF9800;
}

.layer-item.layer-null.layer-selected {
  background-color: #4a4a4a;
  border-left: 4px solid #FF9800;
}

.layer-visibility {
  width: 20px;
  text-align: center;
}

.visibility-icon {
  cursor: pointer;
  font-size: 14px;
}

.layer-info {
  flex: 1;
}

.layer-name {
  font-size: 11px;
  font-weight: 500;
}

.layer-type {
  font-size: 10px;
  color: #888;
}

.timeline-container {
  flex: 1;
  position: relative;
  background-color: #2d2d2d;
  overflow: hidden;
}

.timeline-ruler {
  position: absolute;
  top: 0;
  left: 0;
  height: 30px;
  background-color: #404040;
  border-bottom: 1px solid #555;
  width: 10000px; /* 충분히 큰 값 */
}

.frame-marker {
  position: absolute;
  top: 0;
  width: 1px;
  height: 30px;
  background-color: #666;
  transform: translateX(-0.5px); /* 마커 라인을 중앙에 정렬 */
}

.frame-marker.key-frame {
  background-color: #888;
  width: 2px;
  transform: translateX(-1px); /* 두꺼운 마커도 중앙에 정렬 */
}

.frame-label {
  position: absolute;
  top: 2px;
  left: 2px; /* 마커 중앙에서 살짝 오른쪽으로 조정 */
  font-size: 10px;
  color: #cccccc;
  pointer-events: none; /* 라벨 클릭 방지 */
}

.timeline-tracks {
  position: absolute;
  top: 30px;
  left: 0;
  width: 10000px; /* 충분히 큰 값 */
}

.track {
  position: absolute;
  width: 100%;
  height: 32px;
  border-bottom: 1px solid #3a3a3a;
}

.keyframe {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%); /* 가로세로 모두 중앙 정렬 */
}

.keyframe-dot {
  width: 8px;
  height: 8px;
  background-color: #FFA726;
  border-radius: 50%;
  border: 1px solid #FF8F00;
  cursor: pointer;
}

.keyframe-dot:hover {
  background-color: #FFB74D;
}

.playhead {
  position: absolute;
  top: 0;
  width: 2px;
  background-color: #f44336;
  z-index: 100;
  pointer-events: none;
  transform: translateX(-1px); /* 플레이헤드 라인을 중앙에 정렬 */
}

.playhead-handle {
  position: absolute;
  top: -5px;
  left: -8px;
  width: 18px;
  height: 12px;
  background-color: #f44336;
  border-radius: 2px;
  cursor: grab;
  pointer-events: all;
  transition: background-color 0.1s ease;
}

.playhead-handle:hover {
  background-color: #f55a4e;
}

.playhead-handle.dragging {
  cursor: grabbing;
  background-color: #ff6659;
  transform: scale(1.1);
}

.playhead-line {
  width: 2px;
  height: 100%;
  background-color: #f44336;
}

.timeline-click-area {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  cursor: pointer;
  z-index: 50;
}

.timeline-scrollbar {
  height: 12px;
  background-color: #3a3a3a;
  border-top: 1px solid #555;
  position: relative;
}

.scrollbar-thumb {
  position: absolute;
  top: 2px;
  height: 8px;
  background-color: #666;
  border-radius: 4px;
  cursor: pointer;
}

.scrollbar-thumb:hover {
  background-color: #777;
}

/* 스크롤바 스타일링 */
.layers-list::-webkit-scrollbar {
  width: 6px;
}

.layers-list::-webkit-scrollbar-track {
  background: #2a2a2a;
}

.layers-list::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 3px;
}

.layers-list::-webkit-scrollbar-thumb:hover {
  background: #666;
}
</style>
