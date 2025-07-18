<script setup lang="ts">
import { onMounted, watch } from "vue";
import { DockviewVue } from "dockview-vue";
import { useAppState, useFileHandler, useDockviewSetup } from "./composables";
import { onMenuUndo, onMenuRedo, updateMenuState } from "@app/preload";

const { animationState, setRenderer, resetState, undo, redo, canUndo, canRedo } = useAppState();

useFileHandler(setRenderer, resetState, animationState.setAnimation);

const { onReady } = useDockviewSetup();

onMounted(() => {
  onMenuUndo(async () => {
    await undo();
  });

  onMenuRedo(async () => {
    await redo();
  });
});

watch([canUndo, canRedo], ([canUndo, canRedo]) => {
  updateMenuState(canUndo, canRedo);
  console.log(canUndo, canRedo);
}, { immediate: true });
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
