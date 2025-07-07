import type { Anm2Renderer } from "../renderer/Anm2Renderer";
import type { Anm2Frame } from "./anm2";

export type AnimationState = {
  renderer: Anm2Renderer | null;
  availableAnimations: string[];
  currentAnimation: string;
  selectedLayerId: number | null;
  currentFrame: number;
  setAnimation: (name: string) => void;
  setSelectedLayer: (layerId: number | null) => void;
  getCurrentFrameData: () => Anm2Frame | null;
  getSelectedLayerName: () => string;
};
