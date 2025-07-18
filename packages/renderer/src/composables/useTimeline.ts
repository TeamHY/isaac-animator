import { ref, computed, onMounted, watch, type Ref, reactive } from 'vue';
import { useAnimationState } from './useAnimationState';
import { useDragHandler } from './useDragHandler';
import { useCleanup } from './useCleanup';
import type { LayerState, SelectedKeyframe } from '../types/animation';

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
  const isLooping = ref(false);
  const selectedFrames = computed(() => animationState.selectedFrames);
  const hoveredKeyframes = ref(new Set<string>());
  const selectionRect = reactive({
    visible: false,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    startX: 0,
    startY: 0,
  });

  // UI state
  const timelineWidth = ref(800);
  const playheadPosition = ref(0);

  let refreshInterval: ReturnType<typeof setInterval> | null = null;

  const timelineDragHandler = useDragHandler({
    cursor: 'grabbing',
    onDragStart: (event: MouseEvent) => {
      if (!timelineContainer.value) return;

      const rect = timelineContainer.value.getBoundingClientRect();
      const startX = event.clientX - rect.left + timelineContainer.value.scrollLeft;
      const startY = event.clientY - rect.top + timelineContainer.value.scrollTop;

      if (!event.shiftKey) {
        animationState.setSelectedFrames(new Set());
      }

      Object.assign(selectionRect, {
        visible: true,
        x: startX,
        y: startY,
        width: 0,
        height: 0,
        startX: startX,
        startY: startY,
      });
    },
    onDragMove: (event: MouseEvent) => {
      if (!timelineContainer.value || !animationState?.renderer) return;

      const rect = timelineContainer.value.getBoundingClientRect();
      const currentX = event.clientX - rect.left + timelineContainer.value.scrollLeft;
      const currentY = event.clientY - rect.top + timelineContainer.value.scrollTop;

      selectionRect.x = Math.min(selectionRect.startX, currentX);
      selectionRect.y = Math.min(selectionRect.startY, currentY);
      selectionRect.width = Math.abs(currentX - selectionRect.startX);
      selectionRect.height = Math.abs(currentY - selectionRect.startY);

      // Update hovered keyframes
      const rectX1 = selectionRect.x;
      const rectX2 = selectionRect.x + selectionRect.width;
      const rectY1 = selectionRect.y;
      const rectY2 = selectionRect.y + selectionRect.height;
      const newHovered = new Set<string>();

      layerStates.value.forEach((layer, layerIndex) => {
        const layerTop = layerIndex * LAYER_HEIGHT + 30;
        const layerBottom = layerTop + LAYER_HEIGHT;

        if (layerBottom > rectY1 && layerTop < rectY2) {
          const keyframesWithInfo = getLayerKeyframes(layer);
          keyframesWithInfo.forEach((kf) => {
            if (kf.x >= rectX1 && kf.x <= rectX2) {
              const key = `${layer.layerId}:${kf.frame}`;
              newHovered.add(key);
            }
          });
        }
      });
      hoveredKeyframes.value = newHovered;
    },
    onDragEnd: () => {
      if (!timelineContainer.value || !animationState.renderer) return;

      const rectX1 = selectionRect.x;
      const rectX2 = selectionRect.x + selectionRect.width;
      const rectY1 = selectionRect.y;
      const rectY2 = selectionRect.y + selectionRect.height;

      const newSelectedKeyframes = new Set(animationState.selectedFrames);

      hoveredKeyframes.value.forEach(key => newSelectedKeyframes.add(key));

      animationState.setSelectedFrames(newSelectedKeyframes);

      hoveredKeyframes.value.clear();
      Object.assign(selectionRect, { visible: false, width: 0, height: 0, startX: 0, startY: 0 });
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

    // Keyframe drag state
  const keyframeDragState = ref<{
    isDragging: boolean;
    initialFrame: number;
    currentDelta: number;
    originalKeyframes: Map<string, { layerId: number; frame: number }>;
  }>({
    isDragging: false,
    initialFrame: 0,
    currentDelta: 0,
    originalKeyframes: new Map(),
  });

  const keyframeDragHandler = useDragHandler({
    cursor: 'grabbing',
    onDragStart: (event: MouseEvent) => {
      // Prevent timeline selection while dragging keyframes
      event.stopPropagation();

      // Store original keyframe positions
      keyframeDragState.value.originalKeyframes.clear();
      animationState.selectedFrames.forEach((key: string) => {
        const [layerIdStr, frameStr] = key.split(':');
        const layerId = parseInt(layerIdStr, 10);
        const frame = parseInt(frameStr, 10);
        keyframeDragState.value.originalKeyframes.set(key, { layerId, frame });
      });

      keyframeDragState.value.isDragging = true;
      keyframeDragState.value.currentDelta = 0;
    },
        onDragMove: (event: MouseEvent) => {
      if (!timelineContainer.value || !animationState?.renderer || !keyframeDragState.value.isDragging) return;

      const rect = timelineContainer.value.getBoundingClientRect();
      const currentX = event.clientX - rect.left + timelineContainer.value.scrollLeft;
      const newFrame = Math.round((currentX - FRAME_WIDTH / 2) / FRAME_WIDTH);
      const clampedFrame = Math.max(0, newFrame);

      // Calculate delta from the initial drag position
      const frameDelta = clampedFrame - keyframeDragState.value.initialFrame;

      if (frameDelta !== keyframeDragState.value.currentDelta) {
        keyframeDragState.value.currentDelta = frameDelta;

        // Update selected frames for UI display only
        const newKeys = new Set<string>();
        keyframeDragState.value.originalKeyframes.forEach(({ layerId, frame }, key) => {
          const newFrame = frame + frameDelta;
          if (newFrame >= 0) {
            newKeys.add(`${layerId}:${newFrame}`);
          }
        });
        animationState.setSelectedFrames(newKeys);

        // Force UI update
        updateTimelineData();
      }
    },
    onDragEnd: () => {
      if (keyframeDragState.value.currentDelta !== 0) {
        // Apply the final move to the actual data
        const movedKeyframes = new Map<string, { layerId: number; frame: number }>();
        const newKeys = new Set<string>();

        keyframeDragState.value.originalKeyframes.forEach(({ layerId, frame }, key) => {
          const newFrame = frame + keyframeDragState.value.currentDelta;
          if (newFrame >= 0) {
            movedKeyframes.set(key, { layerId, frame: newFrame });
            newKeys.add(`${layerId}:${newFrame}`);
          }
        });

        if (movedKeyframes.size > 0) {
          animationState.renderer?.moveKeyframes(movedKeyframes);
          animationState.setSelectedFrames(newKeys);
        }
      }

      keyframeDragState.value.isDragging = false;
      keyframeDragState.value.currentDelta = 0;
      keyframeDragState.value.originalKeyframes.clear();
    },
  });

  const moveSelectedKeyframes = (frameDelta: number) => {
    if (!animationState.renderer) return;

    const movedKeyframes = new Map<string, { layerId: number; frame: number }>();
    const newKeys = new Set<string>();

    animationState.selectedFrames.forEach((key: string) => {
      const [layerIdStr, frameStr] = key.split(':');
      const layerId = parseInt(layerIdStr, 10);
      const frame = parseInt(frameStr, 10);
      const newFrame = frame + frameDelta;

      if (newFrame >= 0) {
        movedKeyframes.set(key, { layerId, frame: newFrame });
        newKeys.add(`${layerId}:${newFrame}`);
      }
    });

    if (movedKeyframes.size > 0) {
      animationState.renderer.moveKeyframes(movedKeyframes);
      animationState.setSelectedFrames(newKeys);
    }
  };

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
      isLooping.value = anm2Renderer.getCurrentAnimation()?.loop ?? false;

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

  const getLayerKeyframes = (layerState: LayerState) => {
    if (!animationState?.renderer) return [];
    const keyframes = animationState.renderer.getLayerKeyframes(layerState.layerId);

    const result: { frame: number; x: number; delay: number; frameData: any; isDragging?: boolean }[] = [];
    let currentAnimFrame = 0;

    for (const kf of keyframes) {
      result.push({
        frame: currentAnimFrame,
        x: currentAnimFrame * FRAME_WIDTH + FRAME_WIDTH / 2,
        delay: kf.delay,
        frameData: kf.frameData,
      });
      currentAnimFrame += kf.delay;
    }

    // If dragging keyframes, adjust positions for selected keyframes
    if (keyframeDragState.value.isDragging && keyframeDragState.value.currentDelta !== 0) {
      return result.map(kf => {
        const key = `${layerState.layerId}:${kf.frame}`;
        // Check if this keyframe is in the original selected frames
        const originalKey = keyframeDragState.value.originalKeyframes.has(key);
        if (originalKey) {
          const originalData = keyframeDragState.value.originalKeyframes.get(key)!;
          const newFrame = originalData.frame + keyframeDragState.value.currentDelta;
          return {
            ...kf,
            frame: newFrame,
            x: newFrame * FRAME_WIDTH + FRAME_WIDTH / 2,
            isDragging: true,
          };
        }
        return kf;
      });
    }

    return result;
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

  const selectKeyframe = (layerId: number, frame: number, event: MouseEvent) => {
    const key = `${layerId}:${frame}`;
    const newSelected = new Set(animationState.selectedFrames);

    if (event.shiftKey) {
      if (newSelected.has(key)) {
        newSelected.delete(key);
      } else {
        newSelected.add(key);
      }
    } else {
      newSelected.clear();
      newSelected.add(key);
    }

    animationState.setSelectedFrames(newSelected);
    selectLayer(layerId);
    if (animationState.renderer) {
      animationState.renderer.setCurrentFrame(frame);
    }
  };

  const startKeyframeDrag = (layerId: number, frame: number, event: MouseEvent) => {
    // Select the keyframe if not already selected
    const key = `${layerId}:${frame}`;
    if (!animationState.selectedFrames.has(key)) {
      selectKeyframe(layerId, frame, event);
    }

    // Set initial frame for drag calculation
    keyframeDragState.value.initialFrame = frame;

    // Start dragging
    keyframeDragHandler.startDrag(event);
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
    isDraggingKeyframes: keyframeDragHandler.isDragging,
    timelineFrames,
    getLayerKeyframes,
    onTimelineMouseDown,
    onPlayheadMouseDown,
    togglePlayback,
    stopPlayback,
    selectLayer,
    selectKeyframe,
    startKeyframeDrag,
    layerHeight: LAYER_HEIGHT,
    frameWidth: FRAME_WIDTH,
    isLooping,
    selectedKeyframes: selectedFrames,
    hoveredKeyframes,
    selectionRect,
  };
}
