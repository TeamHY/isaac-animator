import { computed } from 'vue';
import { useAnimationState } from './useAnimationState';
import { useAppState } from './useAppState';
import type { Anm2Frame } from '../types/anm2';

export function usePropertiesPanel() {
  const { animationState } = useAnimationState();
  const { saveState } = useAppState();

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

  const hasSelectedFrame = computed(() => {
    if (!animationState) return false;
    return animationState.selectedLayerId !== null;
  });

  // Helper function to create frame data computed properties concisely
  const createFrameDataComputed = <T>(
    getter: (frame: Anm2Frame) => T | undefined,
    defaultValue: T
  ) => computed(() => currentFrameData.value ? getter(currentFrameData.value) ?? defaultValue : defaultValue);

  const createFrameDataStringComputed = (
    getter: (frame: Anm2Frame) => number | undefined
  ) => computed(() => currentFrameData.value ? getter(currentFrameData.value)?.toString() || '' : '');

  const cropX = createFrameDataStringComputed(frame => frame.xCrop);
  const cropY = createFrameDataStringComputed(frame => frame.yCrop);
  const width = createFrameDataStringComputed(frame => frame.width);
  const height = createFrameDataStringComputed(frame => frame.height);

  const positionX = createFrameDataComputed(frame => frame.xPosition, 0);
  const positionY = createFrameDataComputed(frame => frame.yPosition, 0);

  const pivotX = createFrameDataStringComputed(frame => frame.xPivot);
  const pivotY = createFrameDataStringComputed(frame => frame.yPivot);

  const scaleX = createFrameDataComputed(frame => frame.xScale, 100);
  const scaleY = createFrameDataComputed(frame => frame.yScale, 100);

  const rotation = createFrameDataComputed(frame => frame.rotation, 0);

  const visible = createFrameDataComputed(frame => frame.visible, false);
  const interpolated = createFrameDataComputed(frame => frame.interpolated, false);
  const duration = createFrameDataComputed(frame => frame.delay, 1);

  const tintR = createFrameDataComputed(frame => frame.redTint, 255);
  const tintG = createFrameDataComputed(frame => frame.greenTint, 255);
  const tintB = createFrameDataComputed(frame => frame.blueTint, 255);
  const tintAlpha = createFrameDataComputed(frame => frame.alphaTint, 255);

  const offsetR = createFrameDataComputed(frame => frame.redOffset, 0);
  const offsetG = createFrameDataComputed(frame => frame.greenOffset, 0);
  const offsetB = createFrameDataComputed(frame => frame.blueOffset, 0);

  // 값 업데이트 함수들
  const updateProperty = (property: keyof Anm2Frame, value: any, description?: string) => {
    if (!animationState || animationState.selectedLayerId === null || !animationState.renderer) {
      return;
    }

    const success = animationState.renderer.updateCurrentFrameProperty(
      animationState.selectedLayerId,
      property,
      value
    );

    if (success) {
      saveState(description || `Update ${property}`);
    }
  };

  const updateCropX = (value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    updateProperty('xCrop', numValue, 'Update crop X');
  };

  const updateCropY = (value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    updateProperty('yCrop', numValue, 'Update crop Y');
  };

  const updateWidth = (value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    updateProperty('width', numValue, 'Update width');
  };

  const updateHeight = (value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    updateProperty('height', numValue, 'Update height');
  };

  const updatePositionX = (value: string) => {
    const numValue = parseFloat(value) || 0;
    updateProperty('xPosition', numValue, 'Update position X');
  };

  const updatePositionY = (value: string) => {
    const numValue = parseFloat(value) || 0;
    updateProperty('yPosition', numValue, 'Update position Y');
  };

  const updatePivotX = (value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    updateProperty('xPivot', numValue, 'Update pivot X');
  };

  const updatePivotY = (value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    updateProperty('yPivot', numValue, 'Update pivot Y');
  };

  const updateScaleX = (value: string) => {
    const numValue = parseFloat(value) || 0;
    updateProperty('xScale', numValue, 'Update scale X');
  };

  const updateScaleY = (value: string) => {
    const numValue = parseFloat(value) || 0;
    updateProperty('yScale', numValue, 'Update scale Y');
  };

  const updateRotation = (value: string) => {
    const numValue = parseFloat(value) || 0;
    updateProperty('rotation', numValue, 'Update rotation');
  };

  const updateVisible = (value: boolean) => {
    updateProperty('visible', value, 'Update visibility');
  };

  const updateInterpolated = (value: boolean) => {
    updateProperty('interpolated', value, 'Update interpolated');
  };

  const updateDuration = (value: number) => {
    updateProperty('delay', value, 'Update duration');
  };

  const updateTintR = (value: number) => {
    updateProperty('redTint', value, 'Update red tint');
  };

  const updateTintG = (value: number) => {
    updateProperty('greenTint', value, 'Update green tint');
  };

  const updateTintB = (value: number) => {
    updateProperty('blueTint', value, 'Update blue tint');
  };

  const updateTintAlpha = (value: number) => {
    updateProperty('alphaTint', value, 'Update alpha tint');
  };

  const updateOffsetR = (value: number) => {
    updateProperty('redOffset', value, 'Update red offset');
  };

  const updateOffsetG = (value: number) => {
    updateProperty('greenOffset', value, 'Update green offset');
  };

  const updateOffsetB = (value: number) => {
    updateProperty('blueOffset', value, 'Update blue offset');
  };

  return {
    animationState,
    selectedLayerName,
    isNullLayerSelected,
    hasSelectedFrame,
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
    // 업데이트 함수들
    updateCropX,
    updateCropY,
    updateWidth,
    updateHeight,
    updatePositionX,
    updatePositionY,
    updatePivotX,
    updatePivotY,
    updateScaleX,
    updateScaleY,
    updateRotation,
    updateVisible,
    updateInterpolated,
    updateDuration,
    updateTintR,
    updateTintG,
    updateTintB,
    updateTintAlpha,
    updateOffsetR,
    updateOffsetG,
    updateOffsetB,
  };
}
