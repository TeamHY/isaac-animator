import { computed } from 'vue';
import { useAnimationState } from './useAnimationState';

export function useAnimationList() {
  const { animationState } = useAnimationState();

  const selectAnimation = (animationName: string) => {
    animationState?.setAnimation(animationName);
  };

  const defaultAnimationName = computed(() => {
    return animationState?.renderer?.getDefaultAnimationName() || '';
  });

  return {
    animationState,
    selectAnimation,
    defaultAnimationName,
  };
} 
