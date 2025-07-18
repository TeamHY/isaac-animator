import type { Anm2Renderer } from "../renderer/Anm2Renderer";
import type { Anm2Frame } from "./anm2";

export type AnimationState = {
  anm2Path: string;
  renderer: Anm2Renderer | null;
  availableAnimations: string[];
  currentAnimation: string;
  selectedLayerId: number | null;
  selectedSpritesheetId: number | null;
  currentFrame: number;
  setAnimation: (name: string) => void;
  setSelectedLayer: (layerId: number | null) => void;
  getCurrentFrameData: () => Anm2Frame | null;
  getSelectedLayerName: () => string;
};

export interface LayerState {
  layerId: number;
  layerName: string;
  visible: boolean;
  spritesheetPath: string;
  frameCount: number;
  currentFrame: Anm2Frame | null;
  isCurrentlyVisible: boolean;
  isNullLayer: boolean;
  originalNullId?: number;
}
