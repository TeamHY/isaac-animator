import { getDirectoryPath, joinPath, loadImageAsDataURL, normalizePath } from "@app/preload";
import type { Anm2Spritesheet } from "../types/anm2";
import { Assets, TextureSource, type Texture } from "pixi.js";

export interface SpritesheetData {
  path: string;
  dataURL: string;
  texture: Texture;
}

export type SpritesheetDataMap = Map<number, SpritesheetData>;

export async function getSpritesheetData(anm2Path: string, spritesheet: Anm2Spritesheet) {
  try {
    const basePath = getDirectoryPath(anm2Path);
    const fullPath = joinPath(basePath, normalizePath(spritesheet.path));
    const dataURL = await loadImageAsDataURL(fullPath);

    const texture = await Assets.load<Texture<TextureSource<any>>>(dataURL);
    texture.source.scaleMode = 'nearest';

    return {
      path: spritesheet.path,
      dataURL: dataURL,
      texture: texture,
    };
  } catch (error) {
    console.warn(`Failed to load spritesheet: ${spritesheet.path}`, error);
  }
}
