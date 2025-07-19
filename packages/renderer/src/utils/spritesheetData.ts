import { getDirectoryPath, joinPath, loadImageAsDataURL, normalizePath } from "@app/preload";
import type { Anm2Spritesheet } from "../types/anm2";
import { Assets, TextureSource, type Texture, Texture as PIXITexture, Rectangle } from "pixi.js";

export interface SpritesheetData {
  path: string;
  dataURL: string;
  texture: Texture;
}

export type SpritesheetDataMap = Map<number, SpritesheetData>;

export function createMissingTexture(width: number = 256, height: number = 256): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const tileSize = 8;
    for (let y = 0; y < height; y += tileSize) {
      for (let x = 0; x < width; x += tileSize) {
        const isEven = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0;
        ctx.fillStyle = isEven ? '#ff69b4' : '#ff1493';
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }
  }

  const texture = PIXITexture.from(canvas);
  texture.source.scaleMode = 'nearest';
  return texture;
}

export async function getSpritesheetData(anm2Path: string, spritesheet: Anm2Spritesheet): Promise<SpritesheetData | null> {
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

    const missingTexture = createMissingTexture();
    return {
      path: spritesheet.path,
      dataURL: '',
      texture: missingTexture,
    };
  }
}
