<script setup lang="ts">
import { DockviewVue } from "dockview-vue";
import { useAppState, useFileHandler, useDockviewSetup } from "./composables";

const { animationState, setRenderer, resetState } = useAppState();

useFileHandler(setRenderer, resetState, animationState.setAnimation);

const { onReady } = useDockviewSetup();
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
