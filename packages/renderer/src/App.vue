<script setup lang="ts">
import { DockviewVue, type DockviewReadyEvent } from "dockview-vue";
import { provide, reactive } from "vue";
import type { AnimationState } from "./types/animation";

// 모든 패널이 공유할 애니메이션 상태
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
      animationState.currentFrame = 0; // 애니메이션 변경 시 프레임 리셋
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

// 하위 컴포넌트에 animationState 제공
provide("animationState", animationState);

const onReady = (event: DockviewReadyEvent) => {
  event.api.addPanel({
    id: "spritesheet-viewer-panel",
    title: "Spritesheet Viewer",
    component: "spritesheet-viewer-panel",
  });

  event.api.addPanel({
    id: "properties-panel",
    title: "Properties",
    component: "properties-panel",
    position: {
      referencePanel: "spritesheet-viewer-panel",
      direction: "right",
    },
    initialWidth: 250,
  });

  event.api.addPanel({
    id: "timeline-panel",
    title: "Timeline",
    component: "timeline-panel",
    position: {
      referencePanel: "spritesheet-viewer-panel",
      direction: "below",
    },
  });

  event.api.addPanel({
    id: "spritesheet-list-panel",
    title: "Spritesheets",
    component: "spritesheet-list-panel",
    position: {
      referencePanel: "spritesheet-viewer-panel",
      direction: "right",
    },
    initialWidth: 250,
  });

  event.api.addPanel({
    id: "animation-list-panel",
    title: "Animations",
    component: "animation-list-panel",
    position: {
      referencePanel: "spritesheet-list-panel",
      direction: "below",
    },
  });

  event.api.addPanel({
    id: "preview-panel",
    title: "Preview",
    component: "preview-panel",
    position: {
      referencePanel: "spritesheet-viewer-panel",
      direction: "left",
    }
  });
};
</script>

<template>
  <dockview-vue
    style="width: 100%; height: 100%"
    class="dockview-theme-abyss"
    @ready="onReady"
  >
  </dockview-vue>
</template>

<style scoped></style>
