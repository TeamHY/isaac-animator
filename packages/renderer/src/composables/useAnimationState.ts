import type { Anm2Layer, Anm2Null } from '../types/anm2';
import { useAppState } from './useAppState';

/**
 * Unified type that contains layer or null information
 */
export type LayerInfo = {
  type: 'layer';
  data: Anm2Layer;
} | {
  type: 'null';
  data: Anm2Null;
  originalNullId: number;
};

/**
 * Common animation state management composable
 * Unifies animationState inject logic used across all composables
 */
export function useAnimationState() {
  const {animationState} = useAppState()

  /**
   * Gets information for the currently selected layer
   * Returns null if selectedLayerId is null
   * Searches in layers for positive/0, nulls for negative values
   */
  const getSelectedLayer = (): LayerInfo | null => {
    if (!animationState?.renderer || animationState.selectedLayerId === null) {
      return null;
    }

    return getLayerById(animationState.selectedLayerId);
  };

  /**
   * Gets layer or null information by specific ID
   * Searches in layers for positive/0, nulls for negative values
   */
  const getLayerById = (layerId: number): LayerInfo | null => {
    if (!animationState?.renderer) {
      return null;
    }

    const anm2Data = animationState.renderer.getAnm2Data();

    if (layerId >= 0) {
      const layer = anm2Data.content.layers.find(l => l.id === layerId);
      return layer ? { type: 'layer', data: layer } : null;
    } else {
      // Convert negative ID to original null ID: -1 → 0, -2 → 1, ...
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
