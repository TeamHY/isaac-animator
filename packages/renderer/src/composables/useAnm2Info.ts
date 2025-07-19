import { computed } from 'vue';
import { useAnimationState } from './useAnimationState';
import { useAppState } from './useAppState';
import type { Anm2Info } from '../types/anm2';

export function useAnm2Info() {
  const { animationState } = useAnimationState();
  const { saveState } = useAppState();

  const anm2Info = computed<Anm2Info | null>(() => {
    if (!animationState?.renderer) return null;
    return animationState.renderer.getAnm2Data().info;
  });

  const updateCreatedBy = (value: string) => {
    if (!animationState?.renderer) return;
    
    const anm2Data = animationState.renderer.getAnm2Data();
    anm2Data.info.createdBy = value;
    animationState.renderer.setAnm2Data(anm2Data);
    
    saveState('Update created by', 'info-created-by');
  };



  const updateFps = (value: number) => {
    if (!animationState?.renderer) return;
    
    const anm2Data = animationState.renderer.getAnm2Data();
    anm2Data.info.fps = value;
    animationState.renderer.setAnm2Data(anm2Data);
    
    saveState('Update FPS', 'info-fps');
  };

  return {
    anm2Info,
    updateCreatedBy,
    updateFps,
  };
}