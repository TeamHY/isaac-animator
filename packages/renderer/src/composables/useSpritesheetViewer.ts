import { ref, computed, onMounted, watch, type Ref } from 'vue';
import { WebGPURenderer, Ticker, Graphics, Container, Sprite, Texture, Assets, Rectangle } from 'pixi.js';
import { useAnimationState } from './useAnimationState';
import { useDragHandler } from './useDragHandler';
import { useEventListener } from './useEventListener';
import { useCleanup } from './useCleanup';

export function useSpritesheetViewer(pixiContainer: Ref<HTMLDivElement | null>) {
  const { animationState, getSelectedLayer } = useAnimationState();
  const { addEventListener } = useEventListener();
  const { addCleanup } = useCleanup();

  // Viewer state
  const zoomLevel = ref(1);
  const showGrid = ref(false);
  const backgroundColor = ref('checkerboard');
  const showCropHighlight = ref(true);
  const mousePosition = ref({ x: 0, y: 0 });
  const imageSize = ref({ width: 0, height: 0 });

  // PixiJS refs
  let renderer: WebGPURenderer | null = null;
  let ticker: Ticker | null = null;
  let stage: Container | null = null;
  let spriteContainer: Container | null = null;
  let gridGraphics: Graphics | null = null;
  let cropHighlightGraphics: Graphics | null = null;
  let textureBorderGraphics: Graphics | null = null;
  let checkerboardGraphics: Graphics | null = null;
  let mainSprite: Sprite | null = null;
  let currentTexture: Texture | null = null;
  let cameraOffset = { x: 0, y: 0 };

  // Pan drag handler
  const panDragHandler = useDragHandler({
    onDragMove: (event: MouseEvent, deltaX: number, deltaY: number) => {
      cameraOffset.x += deltaX;
      cameraOffset.y += deltaY;
      updateCamera();
    },
  });

  const selectedSpritesheet = computed(() => {
    if (animationState?.selectedSpritesheetId === null || !animationState?.renderer) return null;
    const spritesheets = animationState.renderer.getSpritesheets();
    return spritesheets.find(s => s.id === animationState.selectedSpritesheetId) || null;
  });

  const currentLayerCropInfo = computed(() => {
    console.log('Computing currentLayerCropInfo:', {
      selectedLayerId: animationState?.selectedLayerId,
      hasRenderer: !!animationState?.renderer,
      selectedSpritesheet: selectedSpritesheet.value?.path,
      selectedSpritesheetId: selectedSpritesheet.value?.id
    });

    if (animationState?.selectedLayerId === null || 
        !animationState?.renderer || 
        !selectedSpritesheet.value) {
      console.log('Early exit from currentLayerCropInfo');
      return null;
    }
    
    // Get the selected layer info from layer states
    const layerStates = animationState.renderer.getCurrentLayerStates();
    console.log('Layer states:', layerStates.map(l => ({ 
      id: l.layerId, 
      name: l.layerName, 
      hasFrame: !!l.currentFrame 
    })));

    const selectedLayer = layerStates.find(layer => layer.layerId === animationState.selectedLayerId);
    
    if (!selectedLayer) {
      console.log('Selected layer not found in layer states');
      return null;
    }

    if (!selectedLayer.currentFrame) {
      console.log('Selected layer has no current frame:', selectedLayer);
      return null;
    }
    
    // Check if the selected layer uses the currently displayed spritesheet
    // For regular layers (positive IDs), check spritesheet mapping
    if (animationState.selectedLayerId !== null && animationState.selectedLayerId >= 0) {
      const layerInfo = getSelectedLayer();
      
      console.log('Layer info:', {
        layerInfo,
        layerSpritesheetId: layerInfo?.type === 'layer' ? layerInfo.data.spritesheetId : undefined,
        selectedSpritesheetId: selectedSpritesheet.value.id
      });
      
      if (!layerInfo || layerInfo.type !== 'layer' || layerInfo.data.spritesheetId !== selectedSpritesheet.value.id) {
        console.log('Layer does not use this spritesheet');
        return null; // Layer doesn't use this spritesheet
      }
    } else {
      // For null layers (negative IDs), they don't have crop info
      console.log('Null layer selected, no crop info');
      return null;
    }
    
    const frameData = selectedLayer.currentFrame;
    console.log('Frame data:', frameData);
    
    // Validate crop data exists
    if (frameData.xCrop === undefined || frameData.yCrop === undefined || 
        frameData.width === undefined || frameData.height === undefined) {
      console.log('Frame data missing crop information');
      return null;
    }
    
    const cropInfo = {
      x: frameData.xCrop,
      y: frameData.yCrop,
      width: frameData.width,
      height: frameData.height,
    };

    console.log('Returning crop info:', cropInfo);
    return cropInfo;
  });

  const updateCamera = () => {
    if (!spriteContainer || !renderer) return;

    const centerX = renderer.screen.width / 2;
    const centerY = renderer.screen.height / 2;

    spriteContainer.scale.set(zoomLevel.value);
    spriteContainer.x = centerX + cameraOffset.x;
    spriteContainer.y = centerY + cameraOffset.y;

    updateGrid();
    updateTextureBorder();
    updateCropHighlight();
  };

  const setZoom = (newZoom: number) => {
    zoomLevel.value = Math.max(0.1, Math.min(10, newZoom));
    updateCamera();
  };

  const resetView = () => {
    zoomLevel.value = 1;
    cameraOffset = { x: 0, y: 0 };
    updateCamera();
  };

  const fitToView = () => {
    if (!renderer || !currentTexture) return;
    
    const canvasWidth = renderer.screen.width;
    const canvasHeight = renderer.screen.height;
    const imageWidth = currentTexture.width;
    const imageHeight = currentTexture.height;
    
    const scaleX = canvasWidth / imageWidth;
    const scaleY = canvasHeight / imageHeight;
    const scale = Math.min(scaleX, scaleY) * 0.9;
    
    setZoom(scale);
    cameraOffset = { x: 0, y: 0 };
  };

  const setPixelPerfect = () => {
    setZoom(1);
    cameraOffset = { x: 0, y: 0 };
  };

  const toggleGrid = () => {
    showGrid.value = !showGrid.value;
    updateGrid();
  };

  const setBackgroundColor = (color: string) => {
    backgroundColor.value = color;
    updateBackground();
  };

  const createCheckerboard = () => {
    if (!checkerboardGraphics || !renderer) return;

    checkerboardGraphics.clear();
    
    const tileSize = 16;
    const width = renderer.screen.width + 200;  // Extra margin for panning
    const height = renderer.screen.height + 200;
    
    for (let x = -100; x < width; x += tileSize) {
      for (let y = -100; y < height; y += tileSize) {
        const isEven = ((x / tileSize) + (y / tileSize)) % 2 === 0;
        const color = isEven ? 0xcccccc : 0xffffff;
        
        checkerboardGraphics.fill(color);
        checkerboardGraphics.rect(x, y, tileSize, tileSize);
        checkerboardGraphics.fill();
      }
    }
  };

  const updateBackground = () => {
    if (!renderer || !stage) return;

    // Clear and rebuild stage
    stage.removeChild(...stage.children);

    if (backgroundColor.value === 'checkerboard') {
      renderer.background.color = 0xffffff;
      createCheckerboard();
      if (checkerboardGraphics) stage.addChild(checkerboardGraphics);
    } else if (backgroundColor.value === 'white') {
      renderer.background.color = 0xffffff;
    } else if (backgroundColor.value === 'black') {
      renderer.background.color = 0x000000;
    }

    // Re-add all graphics in correct order
    if (spriteContainer) stage.addChild(spriteContainer);
    if (textureBorderGraphics) stage.addChild(textureBorderGraphics);
    if (gridGraphics) stage.addChild(gridGraphics);
    if (cropHighlightGraphics) stage.addChild(cropHighlightGraphics);
  };

  const updateTextureBorder = () => {
    if (!textureBorderGraphics || !currentTexture) {
      if (textureBorderGraphics) textureBorderGraphics.clear();
      return;
    }

    const scale = zoomLevel.value;
    const borderWidth = Math.max(1, 2 / scale);

    textureBorderGraphics.clear();
    textureBorderGraphics.stroke({ width: borderWidth, color: 0x666666, alpha: 0.8 });
    
    // Draw border around texture
    const x = -currentTexture.width / 2;
    const y = -currentTexture.height / 2;
    const w = currentTexture.width;
    const h = currentTexture.height;
    
    textureBorderGraphics.rect(x, y, w, h);
    textureBorderGraphics.stroke();

    // Position the border graphics to follow the sprite container
    if (spriteContainer) {
      textureBorderGraphics.x = spriteContainer.x;
      textureBorderGraphics.y = spriteContainer.y;
      textureBorderGraphics.scale.set(zoomLevel.value);
    }
  };

  const updateGrid = () => {
    if (!gridGraphics || !currentTexture) return;

    gridGraphics.clear();
    
    if (!showGrid.value) return;

    const gridSize = 32;
    const scale = zoomLevel.value;
    
    gridGraphics.stroke({ width: 1 / scale, color: 0xff0000, alpha: 0.3 });

    // Vertical lines
    for (let x = 0; x <= currentTexture.width; x += gridSize) {
      gridGraphics.moveTo(x, 0);
      gridGraphics.lineTo(x, currentTexture.height);
    }

    // Horizontal lines
    for (let y = 0; y <= currentTexture.height; y += gridSize) {
      gridGraphics.moveTo(0, y);
      gridGraphics.lineTo(currentTexture.width, y);
    }

    gridGraphics.stroke();
  };

  const updateCropHighlight = () => {
    if (!cropHighlightGraphics) return;

    cropHighlightGraphics.clear();

    // Early exit conditions
    if (!showCropHighlight.value) {
      console.log('Crop highlight disabled');
      return;
    }

    if (!currentTexture) {
      console.log('No current texture loaded');
      return;
    }

    if (!currentLayerCropInfo.value) {
      console.log('No crop info available:', {
        selectedLayerId: animationState?.selectedLayerId,
        selectedSpritesheetId: animationState?.selectedSpritesheetId,
        selectedSpritesheet: selectedSpritesheet.value?.path,
        hasRenderer: !!animationState?.renderer
      });
      return;
    }

    const crop = currentLayerCropInfo.value;
    
    // Validate crop dimensions
    if (crop.width <= 0 || crop.height <= 0) {
      console.warn('Invalid crop dimensions:', crop);
      return;
    }

    // Validate crop is within texture bounds
    if (crop.x < 0 || crop.y < 0 || 
        crop.x + crop.width > currentTexture.width || 
        crop.y + crop.height > currentTexture.height) {
      console.warn('Crop extends outside texture bounds:', {
        crop,
        textureSize: { width: currentTexture.width, height: currentTexture.height }
      });
    }

    console.log('Drawing crop highlight:', crop);

    const scale = zoomLevel.value;
    const borderWidth = Math.max(1, 3 / scale);

    // Calculate crop position relative to centered texture
    const textureX = -currentTexture.width / 2;
    const textureY = -currentTexture.height / 2;
    const cropX = textureX + crop.x;
    const cropY = textureY + crop.y;

    cropHighlightGraphics.stroke({ width: borderWidth, color: 0xff0000, alpha: 0.9 });
    cropHighlightGraphics.rect(cropX, cropY, crop.width, crop.height);
    cropHighlightGraphics.stroke();

    // Position the crop highlight to follow the sprite container
    if (spriteContainer) {
      cropHighlightGraphics.x = spriteContainer.x;
      cropHighlightGraphics.y = spriteContainer.y;
      cropHighlightGraphics.scale.set(zoomLevel.value);
    }
  };

  const loadSpritesheetImage = async (path: string) => {
    if (!path || !mainSprite) return;

    console.log('Loading spritesheet image:', path);

    try {
      const texture = await Assets.load<Texture>(path);
      texture.source.scaleMode = 'nearest';
      
      console.log('Image loaded successfully:', path, texture.width, 'x', texture.height);
      
      currentTexture = texture;
      mainSprite.texture = texture;
      imageSize.value = { width: texture.width, height: texture.height };
      
      // Center the image
      mainSprite.anchor.set(0.5);
      
      updateCamera();
      updateGrid();
      updateTextureBorder();
      updateCropHighlight();
    } catch (error) {
      console.error('Error loading spritesheet:', error);
    }
  };

  const onMouseMove = (event: Event) => {
    const mouseEvent = event as MouseEvent;
    if (!renderer || !currentTexture || !pixiContainer.value) return;

    const rect = pixiContainer.value.getBoundingClientRect();
    const canvasX = mouseEvent.clientX - rect.left;
    const canvasY = mouseEvent.clientY - rect.top;

    // Convert to world coordinates
    const centerX = renderer.screen.width / 2;
    const centerY = renderer.screen.height / 2;
    const scale = zoomLevel.value;

    const worldX = (canvasX - centerX - cameraOffset.x) / scale + currentTexture.width / 2;
    const worldY = (canvasY - centerY - cameraOffset.y) / scale + currentTexture.height / 2;

    mousePosition.value = { 
      x: Math.floor(Math.max(0, Math.min(worldX, currentTexture.width - 1))), 
      y: Math.floor(Math.max(0, Math.min(worldY, currentTexture.height - 1)))
    };
  };

  const onWheel = (event: Event) => {
    const wheelEvent = event as WheelEvent;
    wheelEvent.preventDefault();
    const delta = wheelEvent.deltaY > 0 ? 0.9 : 1.1;
    setZoom(zoomLevel.value * delta);
  };

  const onMouseDown = (event: Event) => {
    const mouseEvent = event as MouseEvent;
    if (mouseEvent.button === 0) {
      panDragHandler.startDrag(mouseEvent);
    }
  };

  const resizeRenderer = () => {
    if (!renderer || !pixiContainer.value) return;
    
    const rect = pixiContainer.value.getBoundingClientRect();
    renderer.resize(rect.width, rect.height);
    
    if (backgroundColor.value === 'checkerboard') {
      createCheckerboard();
    }
    
    updateCamera();
  };

  onMounted(async () => {
    console.log('onMounted');
    console.log(pixiContainer.value);
    if (!pixiContainer.value) return;

    try {
      renderer = new WebGPURenderer();
      await renderer.init({
        background: 0xf0f0f0,
      });

      stage = new Container();
      spriteContainer = new Container();
      gridGraphics = new Graphics();
      cropHighlightGraphics = new Graphics();
      textureBorderGraphics = new Graphics();
      checkerboardGraphics = new Graphics();
      mainSprite = new Sprite();

      spriteContainer.addChild(mainSprite);
      stage.addChild(spriteContainer);
      stage.addChild(gridGraphics);
      stage.addChild(cropHighlightGraphics);

      pixiContainer.value.appendChild(renderer.canvas);
      
      resizeRenderer();

      ticker = new Ticker();
      ticker.add(() => {
        if (renderer && stage) {
          renderer.render(stage);
        }
      });
      ticker.start();

      // Event listeners
      addEventListener(renderer.canvas, 'mousemove', onMouseMove);
      addEventListener(renderer.canvas, 'wheel', onWheel);
      addEventListener(renderer.canvas, 'mousedown', onMouseDown);
      addEventListener(window, 'resize', resizeRenderer);

      updateBackground();

      // Cleanup
      addCleanup(() => {
        ticker?.destroy();
        textureBorderGraphics?.destroy();
        checkerboardGraphics?.destroy();
        stage?.destroy({ children: true });
        renderer?.destroy();
      });

    } catch (error) {
      console.error('Failed to initialize PixiJS:', error);
    }
  });

  // Watch for spritesheet changes
  watch(selectedSpritesheet, (newSpritesheet) => {
    if (newSpritesheet) {
      loadSpritesheetImage(`/${newSpritesheet.path}`);
    }
  }, { immediate: true });

  // Watch for layer selection changes
  watch(() => animationState?.selectedLayerId, () => {
    updateCropHighlight();
  });

  // Watch for frame changes (current frame in animation)
  watch(() => animationState?.currentFrame, () => {
    updateCropHighlight();
  });

  // Watch for animation changes (affects frame data)
  watch(() => animationState?.currentAnimation, () => {
    updateCropHighlight();
  });

  // Watch for renderer changes (new data loaded)
  watch(() => animationState?.renderer, () => {
    updateCropHighlight();
  });

  // Watch for computed crop info changes
  watch(currentLayerCropInfo, () => {
    updateCropHighlight();
  });

  watch(showGrid, updateGrid);
  watch(backgroundColor, updateBackground);
  watch(showCropHighlight, updateCropHighlight);

  return {
    // State
    zoomLevel: computed(() => zoomLevel.value),
    showGrid: computed(() => showGrid.value),
    backgroundColor: computed(() => backgroundColor.value),
    showCropHighlight: computed(() => showCropHighlight.value),
    mousePosition: computed(() => mousePosition.value),
    imageSize: computed(() => imageSize.value),
    selectedSpritesheet,
    
    // Actions
    setZoom,
    resetView,
    fitToView,
    setPixelPerfect,
    toggleGrid,
    setBackgroundColor,
    
    // Internal
    panDragHandler,
  };
} 
