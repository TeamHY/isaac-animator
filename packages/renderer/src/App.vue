<script setup lang="ts">
import { onMounted, watch } from "vue";
import { DockviewVue } from "dockview-vue";
import { useAppState, useFileHandler, useDockviewSetup } from "./composables";
import { onMenuUndo, onMenuRedo, updateMenuState } from "@app/preload";

const { animationState, setRenderer, resetState, undo, redo, canUndoState, canRedoState } = useAppState();

useFileHandler(setRenderer, resetState, animationState.setAnimation);

const { onReady } = useDockviewSetup();

// Undo/Redo 메뉴 이벤트 리스너 설정
onMounted(() => {
  onMenuUndo(() => {
    undo();
  });

  onMenuRedo(() => {
    redo();
  });
});

// 메뉴 상태 업데이트
watch([canUndoState, canRedoState], ([canUndo, canRedo]) => {
  updateMenuState(canUndo, canRedo);
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
