import { inject } from 'vue';
import type { AnimationState } from '../types/animation';
import type { Anm2Layer, Anm2Null } from '../types/anm2';

export type LayerInfo = {
  type: 'layer';
  data: Anm2Layer;
} | {
  type: 'null';
  data: Anm2Null;
  originalNullId: number;
};

export function useAnimationState() {
  const animationState = inject<AnimationState>('animationState');

  if (!animationState) {
    console.warn('AnimationState not found in provide/inject context');
  }

  const getSelectedLayer = (): LayerInfo | null => {
    if (!animationState?.renderer || animationState.selectedLayerId === null) {
      return null;
    }

    return getLayerById(animationState.selectedLayerId);
  };

  const getLayerById = (layerId: number): LayerInfo | null => {
    if (!animationState?.renderer) {
      return null;
    }

    const anm2Data = animationState.renderer.getAnm2Data();
    
    if (layerId >= 0) {
      const layer = anm2Data.content.layers.find(l => l.id === layerId);
      return layer ? { type: 'layer', data: layer } : null;
    } else {
      const originalNullId = -(layerId + 1);
      const nullData = anm2Data.content.nulls.find(n => n.id === originalNullId);
      return nullData ? { type: 'null', data: nullData, originalNullId } : null;
    }
  };

  return {
    animationState,
    getSelectedLayer,
    getLayerById,
  };
} 
