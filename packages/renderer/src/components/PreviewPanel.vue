<script setup lang="ts">
import type { IDockviewPanelProps } from "dockview-vue";
import { onMounted, ref } from "vue";
import { autoDetectRenderer, Container, Text, WebGPURenderer } from "pixi.js";

const props = defineProps<{
  params: IDockviewPanelProps;
}>();

const pixiContainer = ref<HTMLDivElement | null>(null);

onMounted(async () => {
  if (pixiContainer.value) {
    const renderer = new WebGPURenderer();
    await renderer.init();

    pixiContainer.value.appendChild(renderer.canvas);

    const stage = new Container();

    const helloWorld = new Text({
      text: "Hello World",
      style: {
        fontFamily: "Arial",
        fontSize: 36,
        fill: 0xffffff,
        align: "center",
      },
    });

    helloWorld.x = renderer.screen.width / 2;
    helloWorld.y = renderer.screen.height / 2;
    helloWorld.anchor.set(0.5);

    stage.addChild(helloWorld);

    renderer.render(stage);
  }
});
</script>

<template>
  <div ref="pixiContainer"></div>
</template>
