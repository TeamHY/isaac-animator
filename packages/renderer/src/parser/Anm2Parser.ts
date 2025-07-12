import type {
  Anm2Data,
  Anm2Info,
  Anm2Content,
  Anm2Spritesheet,
  Anm2Layer,
  Anm2Null,
  Anm2Animation,
  Anm2Frame,
  Anm2LayerAnimation,
  Anm2NullAnimation
} from '../types/anm2';

export class Anm2Parser {
  static parseFromString(xmlString: string): Anm2Data {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      throw new Error("XML parsing error occurred");
    }

    const animatedActor = xmlDoc.querySelector("AnimatedActor");
    if (!animatedActor) {
      throw new Error("Invalid anm2 file");
    }

    return {
      info: this.parseInfo(animatedActor),
      content: this.parseContent(animatedActor),
      animations: this.parseAnimations(animatedActor),
      defaultAnimation: this.parseDefaultAnimation(animatedActor)
    };
  }

  static async parseFromFile(file: File): Promise<Anm2Data> {
    const text = await file.text();
    return this.parseFromString(text);
  }

  static async parseFromUrl(url: string): Promise<Anm2Data> {
    const response = await fetch(url);
    const text = await response.text();
    return this.parseFromString(text);
  }

  private static parseInfo(root: Element): Anm2Info {
    const info = root.querySelector("Info");
    if (!info) {
      throw new Error("Info section not found");
    }

    return {
      createdBy: info.getAttribute("CreatedBy") || "",
      createdOn: info.getAttribute("CreatedOn") || "",
      version: info.getAttribute("Version") || "",
      fps: parseInt(info.getAttribute("Fps") || "30", 10)
    };
  }

  private static parseContent(root: Element): Anm2Content {
    const content = root.querySelector("Content");
    if (!content) {
      throw new Error("Content section not found");
    }

    return {
      spritesheets: this.parseSpritesheets(content),
      layers: this.parseLayers(content),
      nulls: this.parseNulls(content)
    };
  }

  private static parseSpritesheets(content: Element): Anm2Spritesheet[] {
    const spritesheets = content.querySelector("Spritesheets");
    if (!spritesheets) return [];

    return Array.from(spritesheets.querySelectorAll("Spritesheet")).map(sheet => ({
      path: sheet.getAttribute("Path") || "",
      id: parseInt(sheet.getAttribute("Id") || "0", 10)
    }));
  }

  private static parseLayers(content: Element): Anm2Layer[] {
    const layers = content.querySelector("Layers");
    if (!layers) return [];

    return Array.from(layers.querySelectorAll("Layer")).map(layer => ({
      name: layer.getAttribute("Name") || "",
      id: parseInt(layer.getAttribute("Id") || "0", 10),
      spritesheetId: parseInt(layer.getAttribute("SpritesheetId") || "0", 10)
    }));
  }

  private static parseNulls(content: Element): Anm2Null[] {
    const nulls = content.querySelector("Nulls");
    if (!nulls) return [];

    return Array.from(nulls.querySelectorAll("Null")).map(nullElement => ({
      name: nullElement.getAttribute("Name") || "",
      id: parseInt(nullElement.getAttribute("Id") || "0", 10)
    }));
  }

  private static parseDefaultAnimation(root: Element): string {
    const animations = root.querySelector("Animations");
    return animations?.getAttribute("DefaultAnimation") || "";
  }

  private static parseAnimations(root: Element): Anm2Animation[] {
    const animations = root.querySelector("Animations");
    if (!animations) return [];

    return Array.from(animations.querySelectorAll("Animation")).map(anim => ({
      name: anim.getAttribute("Name") || "",
      frameNum: parseInt(anim.getAttribute("FrameNum") || "1", 10),
      loop: anim.getAttribute("Loop") === "true",
      rootAnimation: this.parseRootAnimation(anim),
      layerAnimations: this.parseLayerAnimations(anim),
      nullAnimations: this.parseNullAnimations(anim)
    }));
  }

  private static parseRootAnimation(animation: Element): Anm2Frame {
    const rootAnim = animation.querySelector("RootAnimation Frame");
    if (!rootAnim) {
      throw new Error("RootAnimation Frame not found");
    }
    return this.parseFrame(rootAnim);
  }

  private static parseLayerAnimations(animation: Element): Anm2LayerAnimation[] {
    const layerAnimations = animation.querySelector("LayerAnimations");
    if (!layerAnimations) return [];

    return Array.from(layerAnimations.querySelectorAll("LayerAnimation")).map(layerAnim => ({
      layerId: parseInt(layerAnim.getAttribute("LayerId") || "0", 10),
      visible: layerAnim.getAttribute("Visible") === "true",
      frames: Array.from(layerAnim.querySelectorAll("Frame")).map(frame => this.parseFrame(frame))
    }));
  }

  private static parseNullAnimations(animation: Element): Anm2NullAnimation[] {
    const nullAnimations = animation.querySelector("NullAnimations");
    if (!nullAnimations) return [];

    return Array.from(nullAnimations.querySelectorAll("NullAnimation")).map(nullAnim => ({
      nullId: parseInt(nullAnim.getAttribute("NullId") || "0", 10),
      visible: nullAnim.getAttribute("Visible") === "true",
      frames: Array.from(nullAnim.querySelectorAll("Frame")).map(frame => this.parseFrame(frame))
    }));
  }

  private static parseFrame(frameElement: Element): Anm2Frame {
    const getAttr = (name: string, defaultValue: string = "0"): string =>
      frameElement.getAttribute(name) || defaultValue;

    return {
      xPosition: parseFloat(getAttr("XPosition")),
      yPosition: parseFloat(getAttr("YPosition")),
      xPivot: frameElement.hasAttribute("XPivot") ? parseFloat(getAttr("XPivot")) : undefined,
      yPivot: frameElement.hasAttribute("YPivot") ? parseFloat(getAttr("YPivot")) : undefined,
      xCrop: frameElement.hasAttribute("XCrop") ? parseFloat(getAttr("XCrop")) : undefined,
      yCrop: frameElement.hasAttribute("YCrop") ? parseFloat(getAttr("YCrop")) : undefined,
      width: frameElement.hasAttribute("Width") ? parseFloat(getAttr("Width")) : undefined,
      height: frameElement.hasAttribute("Height") ? parseFloat(getAttr("Height")) : undefined,
      xScale: parseFloat(getAttr("XScale", "100")),
      yScale: parseFloat(getAttr("YScale", "100")),
      delay: parseInt(getAttr("Delay", "1"), 10),
      visible: getAttr("Visible", "true") === "true",
      redTint: parseInt(getAttr("RedTint", "255"), 10),
      greenTint: parseInt(getAttr("GreenTint", "255"), 10),
      blueTint: parseInt(getAttr("BlueTint", "255"), 10),
      alphaTint: parseInt(getAttr("AlphaTint", "255"), 10),
      redOffset: parseInt(getAttr("RedOffset", "0"), 10),
      greenOffset: parseInt(getAttr("GreenOffset", "0"), 10),
      blueOffset: parseInt(getAttr("BlueOffset", "0"), 10),
      rotation: parseFloat(getAttr("Rotation", "0")),
      interpolated: getAttr("Interpolated", "false") === "true"
    };
  }
}
