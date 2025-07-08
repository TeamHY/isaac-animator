import { computed } from 'vue';
import { useAnimationState } from './useAnimationState';
import type { Anm2Frame } from '../types/anm2';

export function usePropertiesPanel() {
  const { animationState } = useAnimationState();

  const currentFrameData = computed<Anm2Frame | null>(() => {
    if (!animationState) return null;
    return animationState.getCurrentFrameData();
  });

  const isNullLayerSelected = computed(() => {
    if (!animationState) return false;

    const selectedId = animationState.selectedLayerId;
    if (selectedId === null) return false;

    const layerStates = animationState.renderer?.getCurrentLayerStates() || [];
    const selectedLayerState = layerStates.find(l => l.layerId === selectedId);

    return selectedLayerState?.isNullLayer || false;
  });

  const selectedLayerName = computed(() => {
    if (!animationState) return 'N/A';
    return animationState.getSelectedLayerName() || 'Select a layer';
  });

  // 프레임 데이터 computed 속성들을 간결하게 생성하는 헬퍼 함수
  const createFrameDataComputed = <T>(
    getter: (frame: Anm2Frame) => T | undefined,
    defaultValue: T
  ) => computed(() => currentFrameData.value ? getter(currentFrameData.value) ?? defaultValue : defaultValue);

  const createFrameDataStringComputed = (
    getter: (frame: Anm2Frame) => number | undefined
  ) => computed(() => currentFrameData.value ? getter(currentFrameData.value)?.toString() || '' : '');

  // 크롭 정보
  const cropX = createFrameDataStringComputed(frame => frame.xCrop);
  const cropY = createFrameDataStringComputed(frame => frame.yCrop);
  const width = createFrameDataStringComputed(frame => frame.width);
  const height = createFrameDataStringComputed(frame => frame.height);

  // 위치 정보
  const positionX = createFrameDataComputed(frame => frame.xPosition, 0);
  const positionY = createFrameDataComputed(frame => frame.yPosition, 0);

  // 피벗 정보
  const pivotX = createFrameDataStringComputed(frame => frame.xPivot);
  const pivotY = createFrameDataStringComputed(frame => frame.yPivot);

  // 스케일 정보
  const scaleX = createFrameDataComputed(frame => frame.xScale, 100);
  const scaleY = createFrameDataComputed(frame => frame.yScale, 100);

  // 회전 정보
  const rotation = createFrameDataComputed(frame => frame.rotation, 0);

  // 기타 속성들
  const visible = createFrameDataComputed(frame => frame.visible, false);
  const interpolated = createFrameDataComputed(frame => frame.interpolated, false);
  const duration = createFrameDataComputed(frame => frame.delay, 1);

  // 틴트 정보
  const tintR = createFrameDataComputed(frame => frame.redTint, 255);
  const tintG = createFrameDataComputed(frame => frame.greenTint, 255);
  const tintB = createFrameDataComputed(frame => frame.blueTint, 255);
  const tintAlpha = createFrameDataComputed(frame => frame.alphaTint, 255);

  // 오프셋 정보
  const offsetR = createFrameDataComputed(frame => frame.redOffset, 0);
  const offsetG = createFrameDataComputed(frame => frame.greenOffset, 0);
  const offsetB = createFrameDataComputed(frame => frame.blueOffset, 0);

  return {
    animationState,
    selectedLayerName,
    isNullLayerSelected,
    cropX,
    cropY,
    width,
    height,
    positionX,
    positionY,
    pivotX,
    pivotY,
    scaleX,
    scaleY,
    rotation,
    visible,
    interpolated,
    duration,
    tintR,
    tintG,
    tintB,
    offsetR,
    offsetG,
    offsetB,
    tintAlpha,
  };
} 
