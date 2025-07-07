<script setup lang="ts">
import type { IDockviewPanelProps } from "dockview-vue";
import { onMounted, onUnmounted, ref, inject, watch } from "vue";
import { WebGPURenderer, Ticker, Graphics, Container } from "pixi.js";
import { Anm2Parser } from "../parser/Anm2Parser";
import { Anm2Renderer } from "../renderer/Anm2Renderer";
import type { AnimationState } from "../types/animation";

const props = defineProps<{
  params: IDockviewPanelProps;
}>();

// App.vue에서 제공하는 공유 애니메이션 상태
const animationState = inject<AnimationState>('animationState');


const pixiContainer = ref<HTMLDivElement | null>(null);
const isPlaying = ref<boolean>(false);
const zoomLevel = ref<number>(1);
const showCrosshair = ref<boolean>(false);

let renderer: WebGPURenderer | null = null;
let anm2Renderer: Anm2Renderer | null = null;
let ticker: Ticker | null = null;
let crosshairGraphics: Graphics | null = null;
let stage: Container | null = null;

// 팬(드래그) 상태
let isDragging = false;
let lastMousePos = { x: 0, y: 0 };
let cameraOffset = { x: 0, y: 0 };
let resizeObserver: ResizeObserver | null = null;

onMounted(async () => {
  if (pixiContainer.value) {
    try {
      // PIXI.js 렌더러 초기화
      renderer = new WebGPURenderer();
      await renderer.init();

      // UI 컨테이너 생성
      stage = new Container();

      // 배경색을 하얀색으로 설정
      renderer.background.color = 0xFFFFFF;

      // 초기 크기 설정
      resizeRenderer();

      pixiContainer.value.appendChild(renderer.canvas);

      // anm2 파일 로드 및 파싱
      const anm2Data = await Anm2Parser.parseFromUrl("/010.000_frowning gaper.anm2");

      // anm2 렌더러 생성
      anm2Renderer = new Anm2Renderer(anm2Data);
      stage.addChild(anm2Renderer.container);

      // 스프라이트시트 로드
      await anm2Renderer.loadSpritesheets("/");

      // 공유 상태 업데이트
      if (animationState) {
        animationState.renderer = anm2Renderer;
        animationState.availableAnimations = anm2Renderer.getAnimationNames();
        animationState.currentAnimation = anm2Data.defaultAnimation;

        // 초기 애니메이션 설정
        animationState.setAnimation(animationState.currentAnimation);
      }

      // 초기 카메라 설정
      updateCamera();

      // 렌더링 루프 시작
      ticker = new Ticker();
      ticker.add(() => {
        if (anm2Renderer && renderer && stage) {
          anm2Renderer.update();
          // anm2 애니메이션과 UI 요소들을 함께 렌더링
          renderer.render(anm2Renderer.container);
          renderer.render(stage);
        }
      });
      ticker.start();

      // 기본 상태는 일시정지 (첫 프레임 표시)
      anm2Renderer.stop();
      isPlaying.value = false;

      // 십자 그리기
      crosshairGraphics = createCrosshair();
      stage.addChild(crosshairGraphics);

      // 줌 및 팬 이벤트 설정
      setupZoomAndPan();

      // 리사이즈 감지 설정
      setupResizeObserver();

    } catch (error) {
      console.error("anm2 파일 로드 실패:", error);
    }
  }
});

watch(
  () => animationState?.currentAnimation,
  () => {
    if (anm2Renderer) {
      isPlaying.value = anm2Renderer.getIsPlaying();
    }
  }
);

onUnmounted(() => {
  // ResizeObserver 정리
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

  // 이벤트 리스너 정리
  if (renderer?.canvas && (renderer.canvas as any)._cleanup) {
    (renderer.canvas as any)._cleanup();
  }

  // 리소스 정리
  if (ticker) {
    ticker.destroy();
  }
  if (anm2Renderer) {
    anm2Renderer.dispose();
  }
  if (renderer) {
    renderer.destroy();
  }
  if (crosshairGraphics) {
    crosshairGraphics.destroy();
    crosshairGraphics = null;
  }
  if (stage) {
    stage.destroy();
    stage = null;
  }
});

const updateCamera = () => {
  if (anm2Renderer && renderer) {
    const centerX = renderer.screen.width / 2;
    const centerY = renderer.screen.height / 2;

    anm2Renderer.container.scale.set(zoomLevel.value);
    anm2Renderer.container.x = centerX + cameraOffset.x;
    anm2Renderer.container.y = centerY + cameraOffset.y;

    if (crosshairGraphics) {
      crosshairGraphics.scale.set(zoomLevel.value);
      crosshairGraphics.x = centerX + cameraOffset.x;
      crosshairGraphics.y = centerY + cameraOffset.y;
    }
  }
};

// 줌 레벨 설정
const setZoom = (newZoom: number) => {
  zoomLevel.value = Math.max(0.1, Math.min(8, newZoom));
  updateCamera();
};

// 줌 리셋
const resetZoom = () => {
  zoomLevel.value = 1;
  cameraOffset.x = 0;
  cameraOffset.y = 0;
  updateCamera();
};

// 줌 및 팬 이벤트 설정
const setupZoomAndPan = () => {
  if (!pixiContainer.value || !renderer) return;

  const canvas = renderer.canvas;

  // 마우스 휠 줌
  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    setZoom(zoomLevel.value * zoomFactor);
  };

  // 마우스 드래그 팬
  const handleMouseDown = (event: MouseEvent) => {
    if (event.button === 0) { // 왼쪽 마우스 버튼
      isDragging = true;
      lastMousePos.x = event.clientX;
      lastMousePos.y = event.clientY;
    }
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (isDragging) {
      const deltaX = event.clientX - lastMousePos.x;
      const deltaY = event.clientY - lastMousePos.y;

      cameraOffset.x += deltaX;
      cameraOffset.y += deltaY;

      lastMousePos.x = event.clientX;
      lastMousePos.y = event.clientY;

      updateCamera();
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      isDragging = false;
    }
  };

  // 이벤트 리스너 등록
  canvas.addEventListener('wheel', handleWheel, { passive: false });
  canvas.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  // 정리 함수 저장
  const cleanup = () => {
    canvas.removeEventListener('wheel', handleWheel);
    canvas.removeEventListener('mousedown', handleMouseDown);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // onUnmounted에서 정리할 수 있도록 저장
  (canvas as any)._cleanup = cleanup;
};

// 십자 그리기
const createCrosshair = () => {
  crosshairGraphics = new Graphics();
  crosshairGraphics.zIndex = -1000; // 가장 밑에 표시

  drawCrosshair();

  return crosshairGraphics;
};

const drawCrosshair = () => {
  if (!crosshairGraphics || !renderer) return;

  crosshairGraphics.clear();

  if (!showCrosshair.value) return;

  // 월드 좌표계의 (0, 0) 위치에 십자 그리기
  const centerX = 0;
  const centerY = 0;
  const crosshairSize = 20;
  const lineWidth = 1;

  // 십자 그리기
  crosshairGraphics
    .moveTo(centerX - crosshairSize, centerY)
    .lineTo(centerX + crosshairSize, centerY)
    .moveTo(centerX, centerY - crosshairSize)
    .lineTo(centerX, centerY + crosshairSize)
    .stroke({ width: lineWidth, color: 0xFF0000 }); // 빨간색 십자
};

// 십자 표시 토글
const toggleCrosshair = () => {
  showCrosshair.value = !showCrosshair.value;
  drawCrosshair();
};

// 렌더러 크기 조절
const resizeRenderer = () => {
  if (!renderer || !pixiContainer.value) return;

  const containerRect = pixiContainer.value.getBoundingClientRect();
  const width = containerRect.width;
  const height = containerRect.height;

  if (width > 0 && height > 0) {
    renderer.resize(width, height);
    updateCamera();
    drawCrosshair(); // 리사이즈시 십자도 다시 그리기
  }
};

// ResizeObserver 설정
const setupResizeObserver = () => {
  if (!pixiContainer.value) return;

  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === pixiContainer.value) {
        resizeRenderer();
      }
    }
  });

  resizeObserver.observe(pixiContainer.value);
};
</script>

<template>
  <div class="preview-panel">
    <div class="controls">
      <div class="zoom-controls">
        <button @click="setZoom(zoomLevel * 0.5)">-</button>
        <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
        <button @click="setZoom(zoomLevel * 2)">+</button>
        <button @click="resetZoom" class="reset-btn">리셋</button>
      </div>

      <div class="crosshair-controls">
        <button @click="toggleCrosshair">십자 표시 {{ showCrosshair ? 'ON' : 'OFF' }}</button>
      </div>
    </div>

    <div ref="pixiContainer" class="pixi-container"></div>
  </div>
</template>

<style scoped>
.preview-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #2a2a2a;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.controls {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 8px 12px;
  background-color: #3a3a3a;
  border-bottom: 1px solid #555;
  font-size: 12px;
}

.playback-controls button {
  width: 28px;
  height: 28px;
  background-color: #4a4a4a;
  border: 1px solid #666;
  border-radius: 4px;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: background-color 0.1s ease;
}

.playback-controls button:hover:not(:disabled) {
  background-color: #5a5a5a;
}

.playback-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-controls button {
  width: 28px;
  height: 28px;
  background-color: #4a4a4a;
  border: 1px solid #666;
  border-radius: 4px;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: background-color 0.1s ease;
}

.zoom-controls button:hover {
  background-color: #5a5a5a;
}

.zoom-controls .reset-btn {
  width: auto;
  padding: 0 8px;
  min-width: 28px;
}

.zoom-level {
  color: #cccccc;
  font-size: 12px;
  min-width: 40px;
  text-align: center;
}

.crosshair-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.crosshair-controls button {
  height: 28px;
  padding: 0 12px;
  background-color: #4a4a4a;
  border: 1px solid #666;
  border-radius: 4px;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: background-color 0.1s ease;
}

.crosshair-controls button:hover {
  background-color: #5a5a5a;
}

.pixi-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.pixi-container canvas {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
