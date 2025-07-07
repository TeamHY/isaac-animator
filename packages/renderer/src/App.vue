<script setup lang="ts">
import { DockviewVue, type DockviewReadyEvent } from "dockview-vue";

const onReady = (event: DockviewReadyEvent) => {
  event.api.addPanel({
    id: "preview-panel",
    title: "Preview",
    component: "preview-panel",
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

<style scoped>
</style>
