import { inject } from 'vue';
import type { AnimationState } from '../types/animation';
import type { Anm2Layer, Anm2Null } from '../types/anm2';

/**
 * 레이어 또는 null 정보를 포함하는 통합 타입
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
 * 공통 애니메이션 상태 관리 컴포저블
 * 모든 컴포저블에서 공통으로 사용하는 animationState inject 로직을 통합
 */
export function useAnimationState() {
  const animationState = inject<AnimationState>('animationState');

  if (!animationState) {
    console.warn('AnimationState not found in provide/inject context');
  }

  /**
   * 현재 선택된 레이어의 정보를 가져옵니다.
   * selectedLayerId가 null이면 null을 반환합니다.
   * 양수/0이면 layers에서, 음수면 nulls에서 찾습니다.
   */
  const getSelectedLayer = (): LayerInfo | null => {
    if (!animationState?.renderer || animationState.selectedLayerId === null) {
      return null;
    }

    return getLayerById(animationState.selectedLayerId);
  };

  /**
   * 특정 ID로 레이어 또는 null 정보를 가져옵니다.
   * 양수/0이면 layers에서, 음수면 nulls에서 찾습니다.
   */
  const getLayerById = (layerId: number): LayerInfo | null => {
    if (!animationState?.renderer) {
      return null;
    }

    const anm2Data = animationState.renderer.getAnm2Data();
    
    if (layerId >= 0) {
      // 일반 레이어 찾기
      const layer = anm2Data.content.layers.find(l => l.id === layerId);
      return layer ? { type: 'layer', data: layer } : null;
    } else {
      // null 레이어 찾기 (음수 ID를 원본 null ID로 변환: -1 → 0, -2 → 1, ...)
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
