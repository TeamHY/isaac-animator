import { computed } from 'vue';
import { useAnimationState } from './useAnimationState';
import type { Anm2Animation } from '../types/anm2';

export function useAnimationList() {
  const { animationState } = useAnimationState();

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
    selectAnimation,
    defaultAnimationName,
    getAnimationInfo,
  };
}
