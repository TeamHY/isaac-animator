import { onMounted, ref, watch, type Ref } from 'vue';
import { WebGPURenderer, Ticker, Graphics, Container, Text } from 'pixi.js';
import { useAnimationState } from './useAnimationState';
import { useDragHandler } from './useDragHandler';
import { useEventListener } from './useEventListener';
import { useCleanup } from './useCleanup';

export function usePreviewPanel(pixiContainer: Ref<HTMLDivElement | null>) {
  const { animationState } = useAnimationState();
  const { addEventListener } = useEventListener();
  const { addCleanup } = useCleanup();

  const isPlaying = ref(false);
  const zoomLevel = ref(1);
  const showCrosshair = ref(false);

  let renderer: WebGPURenderer | null = null;
  let anm2Container: Container | null = null;
  let ticker: Ticker | null = null;
  let crosshairGraphics: Graphics | null = null;
  let stage: Container | null = null;
  let cameraOffset = { x: 0, y: 0 };
  let resizeObserver: ResizeObserver | null = null;

  const panDragHandler = useDragHandler({
    onDragMove: (event: MouseEvent, deltaX: number, deltaY: number) => {
      cameraOffset.x += deltaX;
      cameraOffset.y += deltaY;
      updateCamera();
    },
  });

  const updateCamera = () => {
    if (!anm2Container || !renderer) return;

    const centerX = renderer.screen.width / 2;
    const centerY = renderer.screen.height / 2;

    anm2Container.scale.set(zoomLevel.value);
    anm2Container.x = centerX + cameraOffset.x;
    anm2Container.y = centerY + cameraOffset.y;

    if (crosshairGraphics) {
      crosshairGraphics.scale.set(zoomLevel.value);
      crosshairGraphics.x = centerX + cameraOffset.x;
      crosshairGraphics.y = centerY + cameraOffset.y;
    }
  };

  const drawCrosshair = () => {
    if (!crosshairGraphics || !renderer) return;

    const { width, height } = renderer.screen;
    crosshairGraphics.clear();

    if (!showCrosshair.value) return;

    crosshairGraphics.lineStyle(1, 0xcccccc, 0.5).moveTo(-width, 0).lineTo(width, 0);
    crosshairGraphics.lineStyle(1, 0xcccccc, 0.5).moveTo(0, -height).lineTo(0, height);
  };

  const resizeRenderer = () => {
    if (renderer && pixiContainer.value) {
      const { clientWidth, clientHeight } = pixiContainer.value;
      renderer.resize(clientWidth, clientHeight);

      drawCrosshair();
      updateCamera();

      if (stage) {
        renderer.render(stage);
      }
    }
  };

  const setupResizeObserver = () => {
    if (pixiContainer.value) {
      resizeObserver = new ResizeObserver(resizeRenderer);
      resizeObserver.observe(pixiContainer.value);

      addCleanup(() => {
        resizeObserver?.disconnect();
      });
    }
  };

  const setupZoomAndPan = () => {
    if (!pixiContainer.value || !renderer) return;

    const canvas = renderer.canvas;

    const handleWheel = (event: Event) => {
      const wheelEvent = event as WheelEvent;
      wheelEvent.preventDefault();
      const zoomFactor = wheelEvent.deltaY > 0 ? 0.9 : 1.1;
      zoomLevel.value = Math.max(0.1, Math.min(8, zoomLevel.value * zoomFactor));
      updateCamera();
    };

    const handleMouseDown = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      if (mouseEvent.button === 0) {
        panDragHandler.startDrag(mouseEvent);
      }
    };

    addEventListener(canvas, 'wheel', handleWheel, { passive: false });
    addEventListener(canvas, 'mousedown', handleMouseDown);
  };

  onMounted(async () => {
    try {
      renderer = new WebGPURenderer();
      await renderer.init({
        background: 0xffffff,
      });

      stage = new Container();
      pixiContainer.value?.appendChild(renderer.canvas);

      anm2Container = new Container();
      stage.addChild(anm2Container);
      
      resizeRenderer();
      updateCamera();

      ticker = new Ticker();
      ticker.add(() => {
        if (renderer && stage) {
          animationState?.renderer?.update();
          renderer.render(stage);
        }
      });
      ticker.start();

      crosshairGraphics = new Graphics();
      crosshairGraphics.zIndex = -1000;
      stage.addChild(crosshairGraphics);
      drawCrosshair();

      setupZoomAndPan();
      setupResizeObserver();

      addCleanup(() => {
        ticker?.destroy();
        crosshairGraphics?.destroy();
        stage?.destroy();
        renderer?.destroy();
      });
    } catch (error) {
      console.error('Failed to load anm2 file:', error);
    }
  });

  watch(
    () => animationState?.renderer,
    () => {
      if (animationState?.renderer) {
        anm2Container?.addChild(animationState.renderer.container);
        anm2Container?._onUpdate();
        resetZoom();
      }
    },
  );

  watch(showCrosshair, drawCrosshair);

  const setZoom = (newZoom: number) => {
    zoomLevel.value = Math.max(0.1, Math.min(8, newZoom));
    updateCamera();
  };

  const resetZoom = () => {
    zoomLevel.value = 1;
    cameraOffset = { x: 0, y: 0 };
    updateCamera();
  };

  const togglePlay = () => {
    if (!anm2Container) return;
    if (animationState?.renderer?.getIsPlaying()) {
      animationState.renderer?.pause();
    } else {
      animationState?.renderer?.play();
    }
    isPlaying.value = !!animationState?.renderer?.getIsPlaying();
  };

  return {
    pixiContainer,
    isPlaying,
    zoomLevel,
    showCrosshair,
    setZoom,
    resetZoom,
    togglePlay,
  };
}
