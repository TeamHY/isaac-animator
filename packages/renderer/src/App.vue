<script setup lang="ts">
import { DockviewVue, type DockviewReadyEvent } from "dockview-vue";
import { provide, reactive, onMounted } from "vue";
import type { AnimationState } from "./types/animation";
import { Anm2Parser } from "./parser/Anm2Parser";
import { Anm2Renderer } from "./renderer/Anm2Renderer";
import { onMenuNewFile, onMenuOpenFile, onMenuOpenFileError, onMenuSaveFile, onMenuSaveAsFile, loadImageAsDataURL } from "@app/preload";

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

const handleFileOpen = async (data: { filePath: string; content: string }) => {
  try {
    const anm2Data = Anm2Parser.parseFromString(data.content);

    if (animationState.renderer) {
      animationState.renderer.dispose();
    }

    const newRenderer = new Anm2Renderer(anm2Data);

    const basePath = data.filePath.substring(
      0,
      data.filePath.lastIndexOf("/") + 1,
    );

    // Load spritesheets as data URLs
    const spritesheetDataURLs = new Map<number, string>();
    for (const spritesheet of anm2Data.content.spritesheets) {
      try {
        const fullPath = basePath + spritesheet.path;
        const dataURL = await loadImageAsDataURL(fullPath);
        spritesheetDataURLs.set(spritesheet.id, dataURL);
      } catch (error) {
        console.warn(`Failed to load spritesheet: ${spritesheet.path}`, error);
      }
    }

    await newRenderer.loadSpritesheetsFromDataURLs(spritesheetDataURLs);

    animationState.renderer = newRenderer;
    animationState.availableAnimations = newRenderer.getAnimationNames();
    animationState.currentAnimation = anm2Data.defaultAnimation;
    animationState.selectedLayerId = null;
    animationState.selectedSpritesheetId = null;
    animationState.currentFrame = 0;

    if (anm2Data.defaultAnimation) {
      animationState.setAnimation(anm2Data.defaultAnimation);
    }
  } catch (error) {
    console.error("Failed to load file:", error);
    alert("Failed to load file: " + error);
  }
};

const handleFileOpenError = (error: any) => {
  console.error("File open error:", error);
  alert("Failed to open file: " + error);
};

const handleNewFile = () => {
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

const handleSaveFile = () => {
  // TODO: Implement file save logic
};

const handleSaveAsFile = (filePath: string) => {
  // TODO: Implement save as file logic
};

onMounted(() => {
  onMenuNewFile(handleNewFile);
  onMenuOpenFile(handleFileOpen);
  onMenuOpenFileError(handleFileOpenError);
  onMenuSaveFile(handleSaveFile);
  onMenuSaveAsFile(handleSaveAsFile);
});

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
    },
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
