import { ref, computed, onMounted, watch, type Ref } from 'vue';
import { useAnimationState } from './useAnimationState';
import { useDragHandler } from './useDragHandler';
import { useCleanup } from './useCleanup';
import type { LayerState } from '../types/animation';

const FRAME_WIDTH = 20;
const LAYER_HEIGHT = 32;

export function useTimeline(
  timelineContainer: Ref<HTMLDivElement | null>,
  layersContainer: Ref<HTMLDivElement | null>
) {
  const { animationState, getLayerById } = useAnimationState();
  const { addCleanup } = useCleanup();

  // Timeline state
  const currentFrame = ref(0);
  const totalFrames = ref(0);
  const fps = ref(30);
  const isPlaying = ref(false);
  const animationName = ref('');
  const layerStates = ref<LayerState[]>([]);

  // UI state
  const timelineWidth = ref(800);
  const playheadPosition = ref(0);

  let refreshInterval: ReturnType<typeof setInterval> | null = null;

  const timelineDragHandler = useDragHandler({
    cursor: 'grabbing',
    onDragStart: (event: MouseEvent) => {
      if (!timelineContainer.value) return;
      
      const rect = timelineContainer.value.getBoundingClientRect();
      const clickX = event.clientX - rect.left + timelineContainer.value.scrollLeft;
      const targetFrame = Math.round((clickX - FRAME_WIDTH / 2) / FRAME_WIDTH);

      if (targetFrame >= 0 && targetFrame < totalFrames.value) {
        animationState?.renderer?.setCurrentFrame(targetFrame);
      }
    },
    onDragMove: (event: MouseEvent) => {
      if (!timelineContainer.value || !animationState?.renderer) return;

      const rect = timelineContainer.value.getBoundingClientRect();
      const currentX = event.clientX - rect.left + timelineContainer.value.scrollLeft;
      const newFrame = Math.round((currentX - FRAME_WIDTH / 2) / FRAME_WIDTH);
      const clampedFrame = Math.max(0, Math.min(newFrame, totalFrames.value - 1));
      animationState.renderer.setCurrentFrame(clampedFrame);
    },
  });

  const playheadDragHandler = useDragHandler({
    cursor: 'grabbing',
    onDragMove: (event: MouseEvent) => {
      if (!timelineContainer.value || !animationState?.renderer) return;
      
      const rect = timelineContainer.value.getBoundingClientRect();
      const currentX = event.clientX - rect.left + timelineContainer.value.scrollLeft;
      const newFrame = Math.round((currentX - FRAME_WIDTH / 2) / FRAME_WIDTH);
      const clampedFrame = Math.max(0, Math.min(newFrame, totalFrames.value - 1));
      animationState.renderer.setCurrentFrame(clampedFrame);
    },
  });

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

      playheadPosition.value = currentFrame.value * FRAME_WIDTH + FRAME_WIDTH / 2;
    } catch (error) {
      console.warn('Failed to update timeline data:', error);
    }
  };

  watch(currentFrame, (newFrame) => {
    if (animationState) {
      animationState.currentFrame = newFrame;
    }
  });

  const timelineFrames = computed(() => {
    const totalWidth = totalFrames.value * FRAME_WIDTH + FRAME_WIDTH;
    return Array.from({ length: totalFrames.value }, (_, i) => ({
      frame: i,
      x: i * FRAME_WIDTH + FRAME_WIDTH / 2,
      isKeyFrame: i % 5 === 0,
      label: i % 5 === 0 ? i.toString() : '',
      totalWidth,
    }));
  });

  const getLayerKeyframes = (layerState: any) => {
    if (!animationState?.renderer) return [];
    const keyframes = animationState.renderer.getLayerKeyframes(layerState.layerId);
    return keyframes.map((kf) => ({
      frame: kf.animationFrame,
      x: kf.animationFrame * FRAME_WIDTH + FRAME_WIDTH / 2,
      delay: kf.delay,
      frameData: kf.frameData,
    }));
  };

  const onTimelineMouseDown = (event: MouseEvent) => {
    if (playheadDragHandler.isDragging.value || !animationState?.renderer || !timelineContainer.value) return;
    timelineDragHandler.startDrag(event);
  };

  const onPlayheadMouseDown = (event: MouseEvent) => {
    if (timelineDragHandler.isDragging.value || !timelineContainer.value) return;
    playheadDragHandler.startDrag(event);
  };

  const togglePlayback = () => {
    if (!animationState?.renderer) return;
    if (isPlaying.value) {
      animationState.renderer.pause();
    } else {
      animationState.renderer.play();
    }
  };

  const stopPlayback = () => {
    animationState?.renderer?.stop();
  };

  const selectLayer = (layerId: number) => {
    if (animationState) {
      animationState.selectedLayerId = layerId;

      if (animationState.renderer && layerId >= 0) {
        const selectedLayer = getLayerById(layerId);
        
        if (selectedLayer && selectedLayer.type === 'layer' && selectedLayer.data.spritesheetId !== undefined) {
          animationState.selectedSpritesheetId = selectedLayer.data.spritesheetId;
        }
      }
    }
  };

  onMounted(() => {
    updateTimelineData();
    refreshInterval = setInterval(updateTimelineData, 1000 / 30);

    addCleanup(() => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
    });

    if (timelineContainer.value) {
      timelineWidth.value = timelineContainer.value.clientWidth;
    }
  });

  return {
    animationState,
    currentFrame,
    totalFrames,
    fps,
    isPlaying,
    animationName,
    layerStates,
    timelineWidth,
    playheadPosition,
    isDraggingPlayhead: playheadDragHandler.isDragging,
    isDraggingTimeline: timelineDragHandler.isDragging,
    timelineFrames,
    getLayerKeyframes,
    onTimelineMouseDown,
    onPlayheadMouseDown,
    togglePlayback,
    stopPlayback,
    selectLayer,
    layerHeight: LAYER_HEIGHT,
    frameWidth: FRAME_WIDTH,
  };
} 
