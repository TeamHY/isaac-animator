import { Container, Sprite, Texture, Assets, Rectangle, TextureSource, Graphics } from 'pixi.js';
import type { Anm2Data, Anm2Animation, Anm2LayerAnimation, Anm2NullAnimation, Anm2Frame } from '../types/anm2';

export class Anm2Renderer {
  private anm2Data: Anm2Data;
  private spritesheetTextures: Map<number, Texture> = new Map();
  private currentAnimation: string = '';
  private currentFrame: number = 0;
  private isPlaying: boolean = false;
  private animationSpeed: number = 1;
  private frameTimer: number = 0;
  private lastTime: number = 0;

  public container: Container;
  public layerContainers: Map<number, Container> = new Map();
  public layerSprites: Map<number, Sprite> = new Map();
  // null 렌더링을 위한 추가 프로퍼티
  public nullContainers: Map<number, Container> = new Map();
  public nullGraphics: Map<number, Graphics> = new Map();

  constructor(anm2Data: Anm2Data) {
    this.anm2Data = anm2Data;
    this.container = new Container();
    this.currentAnimation = anm2Data.defaultAnimation;
    this.initializeLayers();
    this.initializeNulls();
  }

  /**
   * 스프라이트시트 텍스처들을 로드합니다.
   */
  async loadSpritesheets(basePath: string = ''): Promise<void> {
    const loadPromises = this.anm2Data.content.spritesheets.map(async (spritesheet) => {
      try {
        const path = basePath + spritesheet.path;
        const texture = await Assets.load<Texture<TextureSource<any>>>(path);
        texture.source.scaleMode = 'nearest';
        this.spritesheetTextures.set(spritesheet.id, texture);
      } catch (error) {
        console.warn(`스프라이트시트 로드 실패: ${spritesheet.path}`, error);
      }
    });

    await Promise.all(loadPromises);
  }

  /**
   * 레이어 컨테이너들을 초기화합니다.
   */
  private initializeLayers(): void {
    for (const layer of this.anm2Data.content.layers) {
      const layerContainer = new Container();
      layerContainer.name = layer.name;
      this.layerContainers.set(layer.id, layerContainer);
      this.container.addChild(layerContainer);

      // 스프라이트 생성
      const sprite = new Sprite();
      sprite.name = `layer_${layer.id}`;
      this.layerSprites.set(layer.id, sprite);
      layerContainer.addChild(sprite);
    }
  }

  /**
   * null 컨테이너들을 초기화합니다.
   */
  private initializeNulls(): void {
    for (const nullItem of this.anm2Data.content.nulls) {
      const nullContainer = new Container();
      nullContainer.name = nullItem.name;
      this.nullContainers.set(nullItem.id, nullContainer);
      this.container.addChild(nullContainer);

      // 십자 그래픽 생성
      const crosshairGraphics = new Graphics();
      crosshairGraphics.name = `null_${nullItem.id}`;
      this.nullGraphics.set(nullItem.id, crosshairGraphics);
      nullContainer.addChild(crosshairGraphics);
    }
  }

  /**
   * 십자 그래픽을 그립니다.
   */
  private drawCrosshair(graphics: Graphics, frame: Anm2Frame): void {
    graphics.clear();

    if (!frame.visible) return;

    const crosshairSize = 15;
    const lineWidth = 2;

    // 십자 그리기 (위치는 frame의 위치를 기준으로)
    graphics
      .moveTo(-crosshairSize, 0)
      .lineTo(crosshairSize, 0)
      .moveTo(0, -crosshairSize)
      .lineTo(0, crosshairSize)
      .stroke({ width: lineWidth, color: 0xFF0000 }); // 빨간색 십자
  }

  /**
   * 애니메이션을 재생합니다.
   */
  play(animationName?: string): void {
    if (animationName && animationName !== this.currentAnimation) {
      this.setAnimation(animationName);
    }
    this.isPlaying = true;
    this.lastTime = performance.now();
  }

  /**
   * 애니메이션을 일시정지합니다.
   */
  pause(): void {
    this.isPlaying = false;
  }

  /**
   * 애니메이션을 정지하고 첫 프레임으로 돌아갑니다.
   */
  stop(): void {
    this.isPlaying = false;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.updateFrame();
  }

  /**
   * 특정 애니메이션으로 설정합니다.
   */
  setAnimation(animationName: string): void {
    const animation = this.anm2Data.animations.find(anim => anim.name === animationName);
    if (!animation) {
      console.warn(`애니메이션을 찾을 수 없습니다: ${animationName}`);
      return;
    }

    this.currentAnimation = animationName;
    this.currentFrame = 0;
    this.frameTimer = 0;

    // 1프레임 애니메이션이고 루프하지 않는 경우 자동으로 정지
    if (animation.frameNum === 1 && !animation.loop) {
      this.isPlaying = false;
    }

    this.updateFrame();
  }

  /**
   * 애니메이션 속도를 설정합니다.
   */
  setSpeed(speed: number): void {
    this.animationSpeed = speed;
  }

  /**
   * 특정 프레임으로 이동합니다.
   */
  setCurrentFrame(frame: number): void {
    const animation = this.getCurrentAnimation();
    if (!animation) return;

    this.currentFrame = Math.max(0, Math.min(frame, animation.frameNum - 1));
    this.frameTimer = 0;
    this.updateFrame();
  }

  /**
   * 현재 애니메이션을 가져옵니다.
   */
  getCurrentAnimation(): Anm2Animation | undefined {
    return this.anm2Data.animations.find(anim => anim.name === this.currentAnimation);
  }

  /**
   * 렌더링 업데이트를 처리합니다.
   */
  update(): void {
    if (!this.isPlaying) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // 초 단위로 변환
    this.lastTime = currentTime;

    const animation = this.getCurrentAnimation();
    if (!animation) return;

    // FPS에 따른 프레임 타이밍 계산
    const targetFrameTime = 1 / this.anm2Data.info.fps;
    this.frameTimer += deltaTime * this.animationSpeed;

    if (this.frameTimer >= targetFrameTime) {
      this.nextFrame();
      this.frameTimer = 0;
    }
  }

    /**
   * 다음 프레임으로 이동합니다.
   */
  private nextFrame(): void {
    const animation = this.getCurrentAnimation();
    if (!animation) return;

    this.currentFrame++;

    if (this.currentFrame >= animation.frameNum) {
      if (animation.loop) {
        this.currentFrame = 0;
      } else {
        // 루프하지 않는 애니메이션은 마지막 프레임에서 정지
        this.currentFrame = animation.frameNum - 1;
        this.isPlaying = false;
        // 1프레임 애니메이션의 경우 currentFrame을 0으로 유지
        if (animation.frameNum === 1) {
          this.currentFrame = 0;
        }
      }
    }

    this.updateFrame();
  }

  /**
   * 현재 프레임에 맞춰 렌더링을 업데이트합니다.
   */
  private updateFrame(): void {
    const animation = this.getCurrentAnimation();
    if (!animation) return;

    // 각 레이어 애니메이션 업데이트
    for (const layerAnim of animation.layerAnimations) {
      this.updateLayerFrame(layerAnim);
    }

    // 각 null 애니메이션 업데이트
    for (const nullAnim of animation.nullAnimations) {
      this.updateNullFrame(nullAnim);
    }
  }

    /**
   * 특정 레이어의 프레임을 업데이트합니다.
   */
  private updateLayerFrame(layerAnim: Anm2LayerAnimation): void {
    const sprite = this.layerSprites.get(layerAnim.layerId);
    const container = this.layerContainers.get(layerAnim.layerId);

    if (!sprite || !container) return;

    // 레이어 가시성 설정
    container.visible = layerAnim.visible;

    // 프레임이 없는 경우 스프라이트 숨기기
    if (!layerAnim.visible || layerAnim.frames.length === 0) {
      sprite.visible = false;
      return;
    }

    // 현재 프레임에 해당하는 Frame 찾기
    let targetFrame: Anm2Frame | null = null;

    if (layerAnim.frames.length === 1) {
      // 1개 프레임만 있는 경우 항상 그 프레임 사용
      targetFrame = layerAnim.frames[0];
    } else {
      // 여러 프레임이 있는 경우 delay 기반으로 찾기
      let totalDelay = 0;
      for (const frame of layerAnim.frames) {
        totalDelay += frame.delay;
        if (this.currentFrame < totalDelay) {
          targetFrame = frame;
          break;
        }
      }

      // 마지막 프레임 사용
      if (!targetFrame) {
        targetFrame = layerAnim.frames[layerAnim.frames.length - 1];
      }
    }

    if (!targetFrame) return;

    this.applyFrameToSprite(sprite, targetFrame, layerAnim.layerId);
  }

  /**
   * 특정 null의 프레임을 업데이트합니다.
   */
  private updateNullFrame(nullAnim: Anm2NullAnimation): void {
    const graphics = this.nullGraphics.get(nullAnim.nullId);
    const container = this.nullContainers.get(nullAnim.nullId);

    if (!graphics || !container) return;

    // null 가시성 설정
    container.visible = nullAnim.visible;

    // 프레임이 없는 경우 숨기기
    if (!nullAnim.visible || nullAnim.frames.length === 0) {
      graphics.visible = false;
      return;
    }

    // 현재 프레임에 해당하는 Frame 찾기
    let targetFrame: Anm2Frame | null = null;

    if (nullAnim.frames.length === 1) {
      // 1개 프레임만 있는 경우 항상 그 프레임 사용
      targetFrame = nullAnim.frames[0];
    } else {
      // 여러 프레임이 있는 경우 delay 기반으로 찾기
      let totalDelay = 0;
      for (const frame of nullAnim.frames) {
        totalDelay += frame.delay;
        if (this.currentFrame < totalDelay) {
          targetFrame = frame;
          break;
        }
      }

      // 마지막 프레임 사용
      if (!targetFrame) {
        targetFrame = nullAnim.frames[nullAnim.frames.length - 1];
      }
    }

    if (!targetFrame) return;

    this.applyFrameToNull(graphics, container, targetFrame);
  }

  /**
   * 프레임 정보를 null에 적용합니다.
   */
  private applyFrameToNull(graphics: Graphics, container: Container, frame: Anm2Frame): void {
    // 컨테이너 위치 설정
    container.x = frame.xPosition;
    container.y = frame.yPosition;

    // 컨테이너 스케일 설정 (퍼센트를 비율로 변환)
    container.scale.set(frame.xScale / 100, frame.yScale / 100);

    // 컨테이너 회전 설정 (도를 라디안으로 변환)
    container.rotation = (frame.rotation * Math.PI) / 180;

    // 가시성 설정
    graphics.visible = frame.visible;

    // 알파 설정
    container.alpha = frame.alphaTint / 255;

    // 십자 그리기
    this.drawCrosshair(graphics, frame);

    // 컬러 틴트 설정
    const tint = (frame.redTint << 16) | (frame.greenTint << 8) | frame.blueTint;
    graphics.tint = tint;
  }

  /**
   * 프레임 정보를 스프라이트에 적용합니다.
   */
  private applyFrameToSprite(sprite: Sprite, frame: Anm2Frame, layerId: number): void {
    // 레이어 정보 가져오기
    const layer = this.anm2Data.content.layers.find(l => l.id === layerId);
    if (!layer) return;

    // 텍스처 설정
    const spritesheetTexture = this.spritesheetTextures.get(layer.spritesheetId);
    if (spritesheetTexture && frame.xCrop !== undefined && frame.yCrop !== undefined &&
        frame.width !== undefined && frame.height !== undefined) {

      // 크롭된 텍스처 생성
      const croppedTexture = new Texture({
        source: spritesheetTexture.source,
        frame: new Rectangle(frame.xCrop, frame.yCrop, frame.width, frame.height)
      });

      sprite.texture = croppedTexture;
    }

    // 위치 설정
    sprite.x = frame.xPosition;
    sprite.y = frame.yPosition;

    // 피벗 설정 (Isaac의 피벗은 픽셀 단위)
    if (frame.xPivot !== undefined && frame.yPivot !== undefined &&
        frame.width !== undefined && frame.height !== undefined) {
      sprite.anchor.set(frame.xPivot / frame.width, frame.yPivot / frame.height);
    }

    // 스케일 설정 (퍼센트를 비율로 변환)
    sprite.scale.set(frame.xScale / 100, frame.yScale / 100);

    // 회전 설정 (도를 라디안으로 변환)
    sprite.rotation = (frame.rotation * Math.PI) / 180;

    // 가시성 설정
    sprite.visible = frame.visible;

    // 컬러 틴트 설정
    const tint = (frame.redTint << 16) | (frame.greenTint << 8) | frame.blueTint;
    sprite.tint = tint;

    // 알파 설정
    sprite.alpha = frame.alphaTint / 255;
  }

  /**
   * 사용 가능한 애니메이션 목록을 가져옵니다.
   */
  getAnimationNames(): string[] {
    return this.anm2Data.animations.map(anim => anim.name);
  }

  /**
   * 현재 프레임 번호를 가져옵니다.
   */
  getCurrentFrame(): number {
    return this.currentFrame;
  }

  /**
   * 현재 애니메이션의 총 프레임 수를 가져옵니다.
   */
  getTotalFrames(): number {
    const animation = this.getCurrentAnimation();
    return animation ? animation.frameNum : 0;
  }

  /**
   * 현재 애니메이션의 FPS를 가져옵니다.
   */
  getFPS(): number {
    return this.anm2Data.info.fps;
  }

  /**
   * 애니메이션 이름을 가져옵니다.
   */
  getCurrentAnimationName(): string {
    return this.currentAnimation;
  }

  /**
   * 현재 애니메이션의 루프 여부를 가져옵니다.
   */
  getCurrentAnimationLoop(): boolean {
    const animation = this.getCurrentAnimation();
    return animation ? animation.loop : false;
  }

  /**
   * 모든 레이어 정보를 가져옵니다.
   */
  getLayers() {
    return this.anm2Data.content.layers;
  }

    /**
   * 현재 애니메이션의 레이어 상태 정보를 가져옵니다 (null 포함).
   */
  getCurrentLayerStates() {
    const animation = this.getCurrentAnimation();
    if (!animation) return [];

    const layerStates = animation.layerAnimations.map(layerAnim => {
      const layer = this.anm2Data.content.layers.find(l => l.id === layerAnim.layerId);
      const spritesheet = this.anm2Data.content.spritesheets.find(s => s.id === layer?.spritesheetId);

      // 현재 프레임에 해당하는 Frame 찾기
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
        isNull: false
      };
    });

    // null 상태들 추가 (ID를 음수로 변환하여 레이어와 구분)
    const nullStates = animation.nullAnimations.map(nullAnim => {
      const nullItem = this.anm2Data.content.nulls.find(n => n.id === nullAnim.nullId);

      // 현재 프레임에 해당하는 Frame 찾기
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
        layerId: -(nullAnim.nullId + 1), // null ID를 음수로 변환 (0 → -1, 1 → -2, ...)
        layerName: nullItem?.name || `Null ${nullAnim.nullId}`,
        visible: nullAnim.visible,
        spritesheetPath: 'N/A',
        frameCount: nullAnim.frames.length,
        currentFrame: currentFrameData,
        isCurrentlyVisible: nullAnim.visible && (currentFrameData?.visible ?? false),
        isNull: true,
        originalNullId: nullAnim.nullId // 원본 null ID 보존
      };
    });

    // 레이어 다음에 null들을 추가하여 반환
    return [...layerStates, ...nullStates];
  }

  /**
   * 특정 레이어의 키프레임 정보를 가져옵니다 (null 포함).
   */
  getLayerKeyframes(layerId: number) {
    const animation = this.getCurrentAnimation();
    if (!animation) return [];

    // 양수면 일반 레이어, 음수면 null 레이어
    if (layerId >= 0) {
      // 일반 레이어에서 찾기
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
      // null 애니메이션에서 찾기 (음수 ID를 원본 null ID로 변환)
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

  /**
   * 현재 재생 상태를 반환합니다.
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * 기본 애니메이션 이름을 반환합니다.
   */
  getDefaultAnimationName(): string {
    return this.anm2Data.defaultAnimation;
  }

  /**
   * 리소스를 정리합니다.
   */
  dispose(): void {
    this.container.destroy({ children: true });
    this.spritesheetTextures.clear();
    this.layerContainers.clear();
    this.layerSprites.clear();
    this.nullContainers.clear();
    this.nullGraphics.clear();
  }
}
