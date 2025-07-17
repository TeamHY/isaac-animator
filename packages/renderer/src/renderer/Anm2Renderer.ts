import { Container, Sprite, Texture, Assets, Rectangle, TextureSource, Graphics } from 'pixi.js';
import type { Anm2Data, Anm2Animation, Anm2LayerAnimation, Anm2NullAnimation, Anm2Frame } from '../types/anm2';
import type { LayerState } from '../types/animation';

export class Anm2Renderer {
  private anm2Data: Anm2Data;
  private spritesheetTextures: Map<number, Texture> = new Map();
  private spritesheetDataURLs: Map<number, string> = new Map();
  private currentAnimation: string = '';
  private currentFrame: number = 0;
  private isPlaying: boolean = false;
  private animationSpeed: number = 1;
  private frameTimer: number = 0;
  private lastTime: number = 0;

  public container: Container;
  public layerContainers: Map<number, Container> = new Map();
  public layerSprites: Map<number, Sprite> = new Map();
  public nullContainers: Map<number, Container> = new Map();
  public nullGraphics: Map<number, Graphics> = new Map();

  constructor(anm2Data: Anm2Data) {
    this.anm2Data = anm2Data;
    this.container = new Container();
    this.currentAnimation = anm2Data.defaultAnimation;
    this.initializeLayers();
    this.initializeNulls();
  }

  async loadSpritesheets(dataURLs: Map<number, string>): Promise<void> {
    this.spritesheetDataURLs = new Map(dataURLs);

    const loadPromises = this.anm2Data.content.spritesheets.map(async (spritesheet) => {
      try {
        const texture = await Assets.load<Texture<TextureSource<any>>>(dataURLs.get(spritesheet.id) ?? '');
        texture.source.scaleMode = 'nearest';
        this.spritesheetTextures.set(spritesheet.id, texture);
        console.log('Spritesheet loaded:', spritesheet.id, texture.width, 'x', texture.height);
      } catch (error) {
        console.warn(`Failed to load spritesheet: ${spritesheet.path}`, error);
      }
    });

    await Promise.all(loadPromises);
  }

  private initializeLayers(): void {
    for (const layer of this.anm2Data.content.layers) {
      const layerContainer = new Container();
      layerContainer.name = layer.name;
      this.layerContainers.set(layer.id, layerContainer);
      this.container.addChild(layerContainer);

      const sprite = new Sprite();
      sprite.name = `layer_${layer.id}`;
      this.layerSprites.set(layer.id, sprite);
      layerContainer.addChild(sprite);
    }
  }

  private initializeNulls(): void {
    for (const nullItem of this.anm2Data.content.nulls) {
      const nullContainer = new Container();
      nullContainer.name = nullItem.name;
      this.nullContainers.set(nullItem.id, nullContainer);
      this.container.addChild(nullContainer);

      // Create crosshair graphics for null visualization
      const crosshairGraphics = new Graphics();
      crosshairGraphics.name = `null_${nullItem.id}`;
      this.nullGraphics.set(nullItem.id, crosshairGraphics);
      nullContainer.addChild(crosshairGraphics);
    }
  }

  private drawCrosshair(graphics: Graphics, frame: Anm2Frame): void {
    graphics.clear();

    if (!frame.visible) return;

    const crosshairSize = 15;
    const lineWidth = 2;

    // Draw crosshair at frame position
    graphics
      .moveTo(-crosshairSize, 0)
      .lineTo(crosshairSize, 0)
      .moveTo(0, -crosshairSize)
      .lineTo(0, crosshairSize)
      .stroke({ width: lineWidth, color: 0xFF0000 });
  }

  play(animationName?: string): void {
    if (animationName && animationName !== this.currentAnimation) {
      this.setAnimation(animationName);
    }
    this.isPlaying = true;
    this.lastTime = performance.now();
  }

  pause(): void {
    this.isPlaying = false;
  }

  stop(): void {
    this.isPlaying = false;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.updateFrame();
  }

  setAnimation(animationName: string): void {
    const animation = this.anm2Data.animations.find(anim => anim.name === animationName);
    if (!animation) {
      console.warn(`Animation not found: ${animationName}`);
      return;
    }

    this.currentAnimation = animationName;
    this.currentFrame = 0;
    this.frameTimer = 0;

    // Auto-stop single frame non-looping animations
    if (animation.frameNum === 1 && !animation.loop) {
      this.isPlaying = false;
    }

    this.updateFrame();
  }

  setSpeed(speed: number): void {
    this.animationSpeed = speed;
  }

  setCurrentFrame(frame: number): void {
    const animation = this.getCurrentAnimation();
    if (!animation) return;

    this.currentFrame = Math.max(0, Math.min(frame, animation.frameNum - 1));
    this.frameTimer = 0;
    this.updateFrame();
  }

  getCurrentAnimation(): Anm2Animation | undefined {
    return this.anm2Data.animations.find(anim => anim.name === this.currentAnimation);
  }

  getSpritesheetTexture(spritesheetId: number): Texture | undefined {
    return this.spritesheetTextures.get(spritesheetId);
  }

  getSpritesheetDataURL(spritesheetId: number): string | null {
    return this.spritesheetDataURLs.get(spritesheetId) || null;
  }

  update(): void {
    if (!this.isPlaying) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    const animation = this.getCurrentAnimation();
    if (!animation) return;

    // Calculate frame timing based on FPS
    const targetFrameTime = 1 / this.anm2Data.info.fps;
    this.frameTimer += deltaTime * this.animationSpeed;

    if (this.frameTimer >= targetFrameTime) {
      this.nextFrame();
      this.frameTimer = 0;
    }
  }

  private nextFrame(): void {
    const animation = this.getCurrentAnimation();
    if (!animation) return;

    this.currentFrame++;

    if (this.currentFrame >= animation.frameNum) {
      if (animation.loop) {
        this.currentFrame = 0;
      } else {
        // Stop at last frame for non-looping animations
        this.currentFrame = animation.frameNum - 1;
        this.isPlaying = false;
        // Keep frame 0 for single frame animations
        if (animation.frameNum === 1) {
          this.currentFrame = 0;
        }
      }
    }

    this.updateFrame();
  }

  private updateFrame(): void {
    const animation = this.getCurrentAnimation();
    if (!animation) return;

    for (const layerAnim of animation.layerAnimations) {
      this.updateLayerFrame(layerAnim);
    }

    for (const nullAnim of animation.nullAnimations) {
      this.updateNullFrame(nullAnim);
    }
  }

  private updateLayerFrame(layerAnim: Anm2LayerAnimation): void {
    const sprite = this.layerSprites.get(layerAnim.layerId);
    const container = this.layerContainers.get(layerAnim.layerId);

    if (!sprite || !container) return;

    container.visible = layerAnim.visible;

    if (!layerAnim.visible || layerAnim.frames.length === 0) {
      sprite.visible = false;
      return;
    }

    // Find the frame for current animation time
    let targetFrame: Anm2Frame | null = null;

    if (layerAnim.frames.length === 1) {
      targetFrame = layerAnim.frames[0];
    } else {
      // Find frame based on delay accumulation
      let totalDelay = 0;
      for (const frame of layerAnim.frames) {
        totalDelay += frame.delay;
        if (this.currentFrame < totalDelay) {
          targetFrame = frame;
          break;
        }
      }

      if (!targetFrame) {
        targetFrame = layerAnim.frames[layerAnim.frames.length - 1];
      }
    }

    if (!targetFrame) return;

    this.applyFrameToSprite(sprite, targetFrame, layerAnim.layerId);
  }

  private updateNullFrame(nullAnim: Anm2NullAnimation): void {
    const graphics = this.nullGraphics.get(nullAnim.nullId);
    const container = this.nullContainers.get(nullAnim.nullId);

    if (!graphics || !container) return;

    container.visible = nullAnim.visible;

    if (!nullAnim.visible || nullAnim.frames.length === 0) {
      graphics.visible = false;
      return;
    }

    // Find the frame for current animation time
    let targetFrame: Anm2Frame | null = null;

    if (nullAnim.frames.length === 1) {
      targetFrame = nullAnim.frames[0];
    } else {
      // Find frame based on delay accumulation
      let totalDelay = 0;
      for (const frame of nullAnim.frames) {
        totalDelay += frame.delay;
        if (this.currentFrame < totalDelay) {
          targetFrame = frame;
          break;
        }
      }

      if (!targetFrame) {
        targetFrame = nullAnim.frames[nullAnim.frames.length - 1];
      }
    }

    if (!targetFrame) return;

    this.applyFrameToNull(graphics, container, targetFrame);
  }

  private applyFrameToNull(graphics: Graphics, container: Container, frame: Anm2Frame): void {
    container.x = frame.xPosition;
    container.y = frame.yPosition;

    // Convert percentage to scale ratio
    container.scale.set(frame.xScale / 100, frame.yScale / 100);

    // Convert degrees to radians
    container.rotation = (frame.rotation * Math.PI) / 180;

    graphics.visible = frame.visible;
    container.alpha = frame.alphaTint / 255;

    this.drawCrosshair(graphics, frame);

    const tint = (frame.redTint << 16) | (frame.greenTint << 8) | frame.blueTint;
    graphics.tint = tint;
  }

  private applyFrameToSprite(sprite: Sprite, frame: Anm2Frame, layerId: number): void {
    const layer = this.getLayerById(layerId);
    if (!layer) return;

    // Set texture with cropping
    const spritesheetTexture = this.spritesheetTextures.get(layer.spritesheetId);
    if (spritesheetTexture && frame.xCrop !== undefined && frame.yCrop !== undefined &&
        frame.width !== undefined && frame.height !== undefined) {

      const croppedTexture = new Texture({
        source: spritesheetTexture.source,
        frame: new Rectangle(frame.xCrop, frame.yCrop, frame.width, frame.height)
      });

      sprite.texture = croppedTexture;
    }

    sprite.x = frame.xPosition;
    sprite.y = frame.yPosition;

    if (frame.xPivot !== undefined && frame.yPivot !== undefined &&
        frame.width !== undefined && frame.height !== undefined) {
      sprite.anchor.set(frame.xPivot / frame.width, frame.yPivot / frame.height);
    }

    sprite.scale = {
      x: frame.xScale / 100,
      y: frame.yScale / 100
    };

    sprite.rotation = (frame.rotation * Math.PI) / 180;
    sprite.visible = frame.visible;

    const tint = (frame.redTint << 16) | (frame.greenTint << 8) | frame.blueTint;
    sprite.tint = tint;

    sprite.alpha = frame.alphaTint / 255;
  }

  getAnimationNames(): string[] {
    return this.anm2Data.animations.map(anim => anim.name);
  }

  getCurrentFrame(): number {
    return this.currentFrame;
  }

  getTotalFrames(): number {
    const animation = this.getCurrentAnimation();
    return animation ? animation.frameNum : 0;
  }

  getFPS(): number {
    return this.anm2Data.info.fps;
  }

  getCurrentAnimationName(): string {
    return this.currentAnimation;
  }

  getCurrentAnimationLoop(): boolean {
    const animation = this.getCurrentAnimation();
    return animation ? animation.loop : false;
  }

  getLayers() {
    return this.anm2Data.content.layers;
  }

  getSpritesheets() {
    return this.anm2Data.content.spritesheets;
  }

  getAnm2Data() {
    return this.anm2Data;
  }

  private getLayerById(layerId: number) {
    return this.anm2Data.content.layers.find(l => l.id === layerId);
  }

  private getNullById(nullId: number) {
    return this.anm2Data.content.nulls.find(n => n.id === nullId);
  }

  getCurrentLayerStates(): LayerState[] {
    const animation = this.getCurrentAnimation();
    if (!animation) return [];

    const layerStates: LayerState[] = animation.layerAnimations.map((layerAnim): LayerState => {
      const layer = this.getLayerById(layerAnim.layerId);
      const spritesheet = this.anm2Data.content.spritesheets.find(s => s.id === layer?.spritesheetId);

      // Find frame data for current animation time
      let currentFrameData = null;
      if (layerAnim.frames.length === 1) {
        currentFrameData = layerAnim.frames[0];
      } else {
        let totalDelay = 0;
        for (const frame of layerAnim.frames) {
          totalDelay += frame.delay;
          if (this.currentFrame < totalDelay) {
            currentFrameData = frame;
            break;
          }
        }
        if (!currentFrameData && layerAnim.frames.length > 0) {
          currentFrameData = layerAnim.frames[layerAnim.frames.length - 1];
        }
      }

      return {
        layerId: layerAnim.layerId,
        layerName: layer?.name || `Layer ${layerAnim.layerId}`,
        visible: layerAnim.visible,
        spritesheetPath: spritesheet?.path || 'N/A',
        frameCount: layerAnim.frames.length,
        currentFrame: currentFrameData,
        isCurrentlyVisible: layerAnim.visible && (currentFrameData?.visible ?? false),
        isNullLayer: false
      };
    });

    // Add null states (convert ID to negative to distinguish from layers)
    const nullStates: LayerState[] = animation.nullAnimations.map((nullAnim): LayerState => {
      const nullItem = this.getNullById(nullAnim.nullId);

      // Find frame data for current animation time
      let currentFrameData = null;
      if (nullAnim.frames.length === 1) {
        currentFrameData = nullAnim.frames[0];
      } else {
        let totalDelay = 0;
        for (const frame of nullAnim.frames) {
          totalDelay += frame.delay;
          if (this.currentFrame < totalDelay) {
            currentFrameData = frame;
            break;
          }
        }
        if (!currentFrameData && nullAnim.frames.length > 0) {
          currentFrameData = nullAnim.frames[nullAnim.frames.length - 1];
        }
      }

      return {
        layerId: -(nullAnim.nullId + 1), // Convert null ID to negative (0 → -1, 1 → -2, ...)
        layerName: nullItem?.name || `Null ${nullAnim.nullId}`,
        visible: nullAnim.visible,
        spritesheetPath: 'N/A',
        frameCount: nullAnim.frames.length,
        currentFrame: currentFrameData,
        isCurrentlyVisible: nullAnim.visible && (currentFrameData?.visible ?? false),
        isNullLayer: true,
        originalNullId: nullAnim.nullId
      };
    });

    return [...layerStates, ...nullStates];
  }

  getLayerKeyframes(layerId: number) {
    const animation = this.getCurrentAnimation();
    if (!animation) return [];

    // Positive for regular layers, negative for null layers
    if (layerId >= 0) {
      const layerAnim = animation.layerAnimations.find(la => la.layerId === layerId);
      if (layerAnim) {
        const keyframes = [];
        let currentAnimFrame = 0;

        for (const frame of layerAnim.frames) {
          keyframes.push({
            animationFrame: currentAnimFrame,
            frameData: frame,
            delay: frame.delay
          });
          currentAnimFrame += frame.delay;
        }

        return keyframes;
      }
    } else {
      // Convert negative ID back to original null ID
      const originalNullId = -(layerId + 1); // -1 → 0, -2 → 1, ...
      const nullAnim = animation.nullAnimations.find(na => na.nullId === originalNullId);
      if (nullAnim) {
        const keyframes = [];
        let currentAnimFrame = 0;

        for (const frame of nullAnim.frames) {
          keyframes.push({
            animationFrame: currentAnimFrame,
            frameData: frame,
            delay: frame.delay
          });
          currentAnimFrame += frame.delay;
        }

        return keyframes;
      }
    }

    return [];
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getDefaultAnimationName(): string {
    return this.anm2Data.defaultAnimation;
  }

  updateCurrentFrameProperty(layerId: number, property: keyof Anm2Frame, value: any): boolean {
    const animation = this.getCurrentAnimation();
    if (!animation) return false;

    // Handle both regular layers (positive ID) and null layers (negative ID)
    if (layerId >= 0) {
      const layerAnim = animation.layerAnimations.find(la => la.layerId === layerId);
      if (!layerAnim || layerAnim.frames.length === 0) return false;

      // Find current frame based on animation time
      let targetFrameIndex = 0;
      if (layerAnim.frames.length > 1) {
        let totalDelay = 0;
        for (let i = 0; i < layerAnim.frames.length; i++) {
          totalDelay += layerAnim.frames[i].delay;
          if (this.currentFrame < totalDelay) {
            targetFrameIndex = i;
            break;
          }
        }
        if (targetFrameIndex === 0 && this.currentFrame >= totalDelay) {
          targetFrameIndex = layerAnim.frames.length - 1;
        }
      }

      // Update the property
      (layerAnim.frames[targetFrameIndex] as any)[property] = value;
    } else {
      // Handle null layers (convert negative ID back to original null ID)
      const originalNullId = -(layerId + 1);
      const nullAnim = animation.nullAnimations.find(na => na.nullId === originalNullId);
      if (!nullAnim || nullAnim.frames.length === 0) return false;

      // Find current frame based on animation time
      let targetFrameIndex = 0;
      if (nullAnim.frames.length > 1) {
        let totalDelay = 0;
        for (let i = 0; i < nullAnim.frames.length; i++) {
          totalDelay += nullAnim.frames[i].delay;
          if (this.currentFrame < totalDelay) {
            targetFrameIndex = i;
            break;
          }
        }
        if (targetFrameIndex === 0 && this.currentFrame >= totalDelay) {
          targetFrameIndex = nullAnim.frames.length - 1;
        }
      }

      // Update the property
      (nullAnim.frames[targetFrameIndex] as any)[property] = value;
    }

    // Refresh the display
    this.updateFrame();
    return true;
  }

  getCurrentFrameForLayer(layerId: number): Anm2Frame | null {
    const animation = this.getCurrentAnimation();
    if (!animation) return null;

    // Handle both regular layers (positive ID) and null layers (negative ID)
    if (layerId >= 0) {
      const layerAnim = animation.layerAnimations.find(la => la.layerId === layerId);
      if (!layerAnim || layerAnim.frames.length === 0) return null;

      // Find current frame based on animation time
      if (layerAnim.frames.length === 1) {
        return layerAnim.frames[0];
      }

      let totalDelay = 0;
      for (const frame of layerAnim.frames) {
        totalDelay += frame.delay;
        if (this.currentFrame < totalDelay) {
          return frame;
        }
      }
      return layerAnim.frames[layerAnim.frames.length - 1];
    } else {
      // Handle null layers (convert negative ID back to original null ID)
      const originalNullId = -(layerId + 1);
      const nullAnim = animation.nullAnimations.find(na => na.nullId === originalNullId);
      if (!nullAnim || nullAnim.frames.length === 0) return null;

      // Find current frame based on animation time
      if (nullAnim.frames.length === 1) {
        return nullAnim.frames[0];
      }

      let totalDelay = 0;
      for (const frame of nullAnim.frames) {
        totalDelay += frame.delay;
        if (this.currentFrame < totalDelay) {
          return frame;
        }
      }
      return nullAnim.frames[nullAnim.frames.length - 1];
    }
  }

  updateAnm2Data(newData: Anm2Data): void {
    this.anm2Data = newData;

    // Clear existing containers and sprites
    this.container.removeChildren();
    this.layerContainers.clear();
    this.layerSprites.clear();
    this.nullContainers.clear();
    this.nullGraphics.clear();

    // Reinitialize with new data
    this.initializeLayers();
    this.initializeNulls();

    // Refresh the current animation
    if (this.anm2Data.animations.find(anim => anim.name === this.currentAnimation)) {
      this.updateFrame();
    } else {
      // If current animation no longer exists, switch to default
      this.currentAnimation = this.anm2Data.defaultAnimation;
      this.currentFrame = 0;
      this.updateFrame();
    }
  }

  dispose(): void {
    this.container.destroy({ children: true });
    this.spritesheetTextures.clear();
    this.layerContainers.clear();
    this.layerSprites.clear();
    this.nullContainers.clear();
    this.nullGraphics.clear();
  }
}
