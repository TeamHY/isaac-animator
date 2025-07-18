import { reactive, computed, provide } from "vue";
import type { AnimationState } from "../types/animation";
import type { Anm2Data } from "../types/anm2";
import { Anm2Renderer } from "../renderer/Anm2Renderer";
import {
  getSpritesheetData,
  type SpritesheetDataMap,
} from "../utils/spritesheetData";

interface HistoryState {
  anm2Data: Anm2Data;
  selectedLayerId: number | null;
  currentFrame: number;
  timestamp: number;
  description?: string;
}

interface History {
  undoStack: HistoryState[];
  redoStack: HistoryState[];
  maxHistorySize: number;
}

// Anm2Data 깊은 복사 함수
function deepCloneAnm2Data(data: Anm2Data): Anm2Data {
  return JSON.parse(JSON.stringify(data));
}

const history: History = reactive({
  undoStack: [],
  redoStack: [],
  maxHistorySize: 50,
});

const animationState: AnimationState = reactive({
  anm2Path: "",
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
      (state: any) => state.layerId === animationState.selectedLayerId
    );

    return selectedLayerState?.currentFrame || null;
  },
  getSelectedLayerName: () => {
    if (!animationState.renderer || animationState.selectedLayerId === null) {
      return "";
    }

    const layerStates = animationState.renderer.getCurrentLayerStates();
    const selectedLayerState = layerStates.find(
      (state: any) => state.layerId === animationState.selectedLayerId
    );

    return selectedLayerState?.layerName || "";
  },
});

export function useAppState() {
  const saveState = (description?: string) => {
    if (!animationState.renderer) {
      return;
    }

    const currentData = animationState.renderer.getAnm2Data();
    const historyState: HistoryState = {
      anm2Data: deepCloneAnm2Data(currentData),
      selectedLayerId: animationState.selectedLayerId,
      currentFrame: animationState.currentFrame,
      timestamp: Date.now(),
      description: description || "State change",
    };

    history.undoStack.push(historyState);

    if (history.undoStack.length > history.maxHistorySize) {
      history.undoStack.shift();
    }

    history.redoStack.length = 0;
  };

  const undo = async (): Promise<boolean> => {
    if (history.undoStack.length <= 1 || !animationState.renderer) {
      return false;
    }

    const currentState = history.undoStack.pop();
    if (currentState) {
      history.redoStack.push(currentState);
    }

    const previousState = history.undoStack[history.undoStack.length - 1];
    await restoreState(previousState);
    return true;
  };

  const redo = async (): Promise<boolean> => {
    if (history.redoStack.length === 0 || !animationState.renderer) {
      return false;
    }

    const nextState = history.redoStack.pop();
    if (nextState) {
      history.undoStack.push(nextState);
      await restoreState(nextState);
      return true;
    }

    return false;
  };

  const restoreState = async (historyState: HistoryState) => {
    if (!animationState.renderer) {
      return;
    }

    const { anm2Data, selectedLayerId, currentFrame } = historyState;

    const spritesheets: SpritesheetDataMap = new Map();

    const loadPromises = anm2Data.content.spritesheets.map(
      async (spritesheet) => {
        if (!animationState.renderer) {
          return;
        }

        let spritesheetData = animationState.renderer.getSpritesheetWithPath(
          spritesheet.path
        );

        if (!spritesheetData) {
          spritesheetData = await getSpritesheetData(
            animationState.anm2Path,
            spritesheet
          );
        }

        if (!spritesheetData) {
          return;
        }

        spritesheets.set(spritesheet.id, spritesheetData);
      }
    );
    await Promise.all(loadPromises);

    animationState.renderer.dispose();

    animationState.renderer = new Anm2Renderer(deepCloneAnm2Data(anm2Data), spritesheets);
    animationState.availableAnimations =
      animationState.renderer.getAnimationNames();

    if (
      !animationState.availableAnimations.includes(
        animationState.currentAnimation
      )
    ) {
      animationState.currentAnimation = anm2Data.defaultAnimation;
    }

    animationState.renderer.setAnimation(animationState.currentAnimation);
    animationState.selectedLayerId = selectedLayerId;
    animationState.currentFrame = currentFrame;
    animationState.renderer.setCurrentFrame(currentFrame);
  };

  const canUndo = computed(() => {
    return history.undoStack.length > 1;
  });

  const canRedo = computed(() => {
    return history.redoStack.length > 0;
  });

  const clearHistory = () => {
    history.undoStack.length = 0;
    history.redoStack.length = 0;
  };

  const getHistoryInfo = () => {
    return {
      undoCount: history.undoStack.length,
      redoCount: history.redoStack.length,
      maxHistorySize: history.maxHistorySize,
    };
  };

  const setRenderer = (renderer: Anm2Renderer | null, anm2Path: string) => {
    if (animationState.renderer) {
      animationState.renderer.dispose();
    }
    animationState.renderer = renderer;
    animationState.anm2Path = anm2Path;

    clearHistory();

    if (renderer) {
      animationState.availableAnimations = renderer.getAnimationNames();
      saveState("Initial state");
    } else {
      animationState.availableAnimations = [];
    }
  };

  const resetState = () => {
    if (animationState.renderer) {
      animationState.renderer.dispose();
    }

    animationState.anm2Path = "";
    animationState.renderer = null;
    animationState.availableAnimations = [];
    animationState.currentAnimation = "";
    animationState.selectedLayerId = null;
    animationState.selectedSpritesheetId = null;
    animationState.currentFrame = 0;

    clearHistory();
  };

  return {
    animationState,
    setRenderer,
    resetState,
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    getHistoryInfo,
  };
}
