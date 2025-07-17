import { provide, reactive, computed, watch } from "vue";
import type { AnimationState } from "../types/animation";
import type { Anm2Data } from "../types/anm2";
import { Anm2Renderer } from "../renderer/Anm2Renderer";

// 히스토리 관련 타입 정의
interface HistoryState {
  anm2Data: Anm2Data;
  timestamp: number;
  description?: string;
}

interface HistoryManager {
  undoStack: HistoryState[];
  redoStack: HistoryState[];
  maxHistorySize: number;
  isRecording: boolean;
}

// Anm2Data 깊은 복사 함수
function deepCloneAnm2Data(data: Anm2Data): Anm2Data {
  return JSON.parse(JSON.stringify(data));
}

export function useAppState() {
  // 히스토리 관리자 초기화
  const historyManager: HistoryManager = reactive({
    undoStack: [],
    redoStack: [],
    maxHistorySize: 50,
    isRecording: true,
  });

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

  provide("animationState", animationState);

  const saveState = (description?: string) => {
    if (!historyManager.isRecording || !animationState.renderer) {
      return;
    }

    const currentData = animationState.renderer.getAnm2Data();
    const historyState: HistoryState = {
      anm2Data: deepCloneAnm2Data(currentData),
      timestamp: Date.now(),
      description: description || "State change",
    };

    historyManager.undoStack.push(historyState);

    if (historyManager.undoStack.length > historyManager.maxHistorySize) {
      historyManager.undoStack.shift();
    }

    historyManager.redoStack.length = 0;
  };

  const undo = (): boolean => {
    if (historyManager.undoStack.length === 0 || !animationState.renderer) {
      return false;
    }

    // 현재 상태를 redo 스택에 저장
    const currentData = animationState.renderer.getAnm2Data();
    const currentState: HistoryState = {
      anm2Data: deepCloneAnm2Data(currentData),
      timestamp: Date.now(),
      description: "Current state",
    };
    historyManager.redoStack.push(currentState);

    // undo 스택에서 이전 상태 복원
    const previousState = historyManager.undoStack.pop();
    if (previousState) {
      // 히스토리 기록 중지하고 상태 복원
      // historyManager.isRecording = false;
      restoreState(previousState.anm2Data);
      // historyManager.isRecording = true;
      return true;
    }

    return false;
  };

  const redo = (): boolean => {
    if (historyManager.redoStack.length === 0 || !animationState.renderer) {
      return false;
    }

    // 현재 상태를 undo 스택에 저장
    const currentData = animationState.renderer.getAnm2Data();
    const currentState: HistoryState = {
      anm2Data: deepCloneAnm2Data(currentData),
      timestamp: Date.now(),
      description: "Current state",
    };
    historyManager.undoStack.push(currentState);

    // redo 스택에서 다음 상태 복원
    const nextState = historyManager.redoStack.pop();
    if (nextState) {
      // 히스토리 기록 중지하고 상태 복원
      // historyManager.isRecording = false;
      restoreState(nextState.anm2Data);
      // historyManager.isRecording = true;
      return true;
    }

    return false;
  };

  const restoreState = (anm2Data: Anm2Data) => {
    if (!animationState.renderer) {
      return;
    }

    // TODO: DATAURL 재사용
    const spritesheetDataURLs = new Map<number, string>();

    // 이전 렌더러 정리
    animationState.renderer.dispose();

    // 새 렌더러 설정
    animationState.renderer = new Anm2Renderer(anm2Data);
    animationState.availableAnimations = animationState.renderer.getAnimationNames();

    // 현재 애니메이션이 여전히 존재하는지 확인
    if (
      !animationState.availableAnimations.includes(
        animationState.currentAnimation
      )
    ) {
      animationState.currentAnimation = anm2Data.defaultAnimation;
    }

    animationState.renderer.setAnimation(animationState.currentAnimation);

    // 스프라이트시트 로드
    animationState.renderer.loadSpritesheets(spritesheetDataURLs);
  };

  const canUndo = (): boolean => {
    return historyManager.undoStack.length > 0;
  };

  const canRedo = (): boolean => {
    return historyManager.redoStack.length > 0;
  };

  const clearHistory = () => {
    historyManager.undoStack.length = 0;
    historyManager.redoStack.length = 0;
  };

  const setHistoryRecording = (enabled: boolean) => {
    historyManager.isRecording = enabled;
  };

  const getHistoryInfo = () => {
    return {
      undoCount: historyManager.undoStack.length,
      redoCount: historyManager.redoStack.length,
      isRecording: historyManager.isRecording,
      maxHistorySize: historyManager.maxHistorySize,
    };
  };

  // Reactive canUndo/canRedo 상태
  const canUndoState = computed(() => canUndo());
  const canRedoState = computed(() => canRedo());

  const setRenderer = (renderer: Anm2Renderer | null) => {
    if (animationState.renderer) {
      animationState.renderer.dispose();
    }
    animationState.renderer = renderer;

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
    canUndoState,
    canRedoState,
    clearHistory,
    setHistoryRecording,
    getHistoryInfo,
  };
}
