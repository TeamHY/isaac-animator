import { computed } from 'vue';
import { useAnimationState } from './useAnimationState';
import type { Anm2Layer, Anm2Animation } from '../types/anm2';

export function useProject() {
  const { animationState } = useAnimationState();

  const spritesheets = computed(() => {
    return animationState?.renderer?.getSpritesheets() || [];
  });

  const getSpritesheetThumbnail = (spritesheetId: number) => {
    if (!animationState?.renderer) return null;
    return animationState.renderer.getSpritesheet(spritesheetId)?.dataURL;
  };

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

  const selectAnimation = (animationName: string) => {
    animationState?.setAnimation(animationName);
  };

  const defaultAnimationName = computed(() => {
    return animationState?.renderer?.getDefaultAnimationName() || '';
  });

  const getAnimationInfo = (animationName: string): Anm2Animation | undefined => {
    if (!animationState?.renderer) return undefined;
    const animations = animationState.renderer.getAnm2Data().animations;
    return animations.find(anim => anim.name === animationName);
  };

  return {
    animationState,
    spritesheets,
    selectSpritesheet,
    getSpritesheetUsage,
    getSpritesheetThumbnail,
    selectAnimation,
    defaultAnimationName,
    getAnimationInfo,
  };
}