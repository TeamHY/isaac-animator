import { computed } from 'vue';
import { useAnimationState } from './useAnimationState';
import type { Anm2Spritesheet, Anm2Layer } from '../types/anm2';

export function useSpritesheetList() {
  const { animationState } = useAnimationState();

  const spritesheets = computed(() => {
    return animationState?.renderer?.getSpritesheets() || [];
  });

  const selectSpritesheet = (spritesheetId: number) => {
    if (animationState) {
      animationState.selectedSpritesheetId = spritesheetId;
    }
  };

  const getSpritesheetUsage = (spritesheetId: number) => {
    if (!animationState?.renderer) return { layers: [], isUsed: false };
    
    const layers = animationState.renderer.getLayers();
    const usedLayers = layers.filter((layer: Anm2Layer) => layer.spritesheetId === spritesheetId);
    
    return {
      layers: usedLayers,
      isUsed: usedLayers.length > 0
    };
  };

  return {
    animationState,
    spritesheets,
    selectSpritesheet,
    getSpritesheetUsage,
  };
} 
