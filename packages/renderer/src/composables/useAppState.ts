import { provide, reactive } from "vue";
import type { AnimationState } from "../types/animation";
import { Anm2Renderer } from "../renderer/Anm2Renderer";

export function useAppState() {
  const animationState: AnimationState = reactive({
    renderer: null,
    availableAnimations: [],
    currentAnimation: "",
    selectedLayerId: null,
    selectedSpritesheetId: null,
    currentFrame: 0,
    setAnimation: (name: string) => {
      if (animationState.renderer) {
        animationState.renderer.setAnimation(name);
        animationState.currentAnimation = name;
        animationState.currentFrame = 0;
      }
    },
    setSelectedLayer: (layerId: number | null) => {
      animationState.selectedLayerId = layerId;
    },
    getCurrentFrameData: () => {
      if (!animationState.renderer || animationState.selectedLayerId === null) {
        return null;
      }

      const layerStates = animationState.renderer.getCurrentLayerStates();
      const selectedLayerState = layerStates.find(
        (state: any) => state.layerId === animationState.selectedLayerId,
      );

      return selectedLayerState?.currentFrame || null;
    },
    getSelectedLayerName: () => {
      if (!animationState.renderer || animationState.selectedLayerId === null) {
        return "";
      }

      const layerStates = animationState.renderer.getCurrentLayerStates();
      const selectedLayerState = layerStates.find(
        (state: any) => state.layerId === animationState.selectedLayerId,
      );

      return selectedLayerState?.layerName || "";
    },
  });

  provide("animationState", animationState);

  const setRenderer = (renderer: Anm2Renderer | null) => {
    if (animationState.renderer) {
      animationState.renderer.dispose();
    }
    animationState.renderer = renderer;

    if (renderer) {
      animationState.availableAnimations = renderer.getAnimationNames();
    } else {
      animationState.availableAnimations = [];
    }
  };

  const resetState = () => {
    if (animationState.renderer) {
      animationState.renderer.dispose();
    }

    animationState.renderer = null;
    animationState.availableAnimations = [];
    animationState.currentAnimation = "";
    animationState.selectedLayerId = null;
    animationState.selectedSpritesheetId = null;
    animationState.currentFrame = 0;
  };

  return {
    animationState,
    setRenderer,
    resetState,
  };
}
