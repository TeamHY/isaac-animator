import { onMounted, ref, watch, type Ref } from 'vue';
import { WebGPURenderer, Ticker, Graphics, Container } from 'pixi.js';
import { Anm2Parser } from '../parser/Anm2Parser';
import { Anm2Renderer } from '../renderer/Anm2Renderer';
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
  let anm2Renderer: Anm2Renderer | null = null;
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
    if (!anm2Renderer || !renderer) return;

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
  };

  const drawCrosshair = () => {
    if (!crosshairGraphics || !renderer) return;

    const { width, height } = renderer.screen;
    crosshairGraphics.clear();

    if (!showCrosshair.value) return;

    crosshairGraphics
      .moveTo(-width, 0)
      .lineTo(width, 0)
      .moveTo(0, -height)
      .lineTo(0, height)
      .stroke({ width: 1, color: 0xcccccc, alpha: 0.5 });
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
    if (!pixiContainer.value) return;

    try {
      renderer = new WebGPURenderer();
      await renderer.init({
        background: 0xffffff,
      });

      stage = new Container();
      pixiContainer.value.appendChild(renderer.canvas);

      resizeRenderer();

      updateCamera();

      ticker = new Ticker();
      ticker.add(() => {
        if (anm2Renderer && renderer && stage) {
          anm2Renderer.update();
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
        anm2Renderer?.dispose();
        crosshairGraphics?.destroy();
        stage?.destroy();
        renderer?.destroy();
      });
    } catch (error) {
      console.error('Failed to initialize preview panel:', error);
    }
  });

  watch(
    () => animationState?.currentAnimation,
    () => {
      if (anm2Renderer) {
        isPlaying.value = anm2Renderer.getIsPlaying();
      }
    },
  );

  watch(
    () => animationState?.renderer,
    (newRenderer: Anm2Renderer | null | undefined) => {
      if (!stage) return;
      
      if (anm2Renderer && anm2Renderer !== newRenderer) {
        try {
          stage.removeChild(anm2Renderer.container);
        } catch (error) {
          console.warn('Failed to remove old renderer container:', error);
        }
      }
      
      anm2Renderer = newRenderer || null;
      
      if (anm2Renderer) {
        try {
          stage.addChild(anm2Renderer.container);
          anm2Renderer.stop();
          isPlaying.value = false;
          updateCamera();
        } catch (error) {
          console.error('Failed to add new renderer container:', error);
        }
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
    if (!anm2Renderer) return;
    if (anm2Renderer.getIsPlaying()) {
      anm2Renderer.pause();
    } else {
      anm2Renderer.play();
    }
    isPlaying.value = anm2Renderer.getIsPlaying();
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
