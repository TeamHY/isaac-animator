import { readFile } from 'node:fs/promises';
import { dirname, join, normalize } from 'node:path';
import {sha256sum} from './nodeCrypto.js';
import {versions} from './versions.js';
import {ipcRenderer} from 'electron';

function send(channel: string, message: string) {
  return ipcRenderer.invoke(channel, message);
}

export {sha256sum, versions, send};

export function getDirectoryPath(filePath: string): string {
  return dirname(filePath);
}

export function joinPath(...paths: string[]): string {
  return join(...paths);
}

export function normalizePath(path: string): string {
  if (process.platform === 'darwin') {
    return path.replace(/\\/g, '/');
  }

  return path;
}

export async function loadImageAsDataURL(imagePath: string): Promise<string> {
  try {
    const buffer = await readFile(imagePath);
    const base64 = buffer.toString('base64');
    const extension = imagePath.split('.').pop()?.toLowerCase();
    let mimeType = 'image/png';

    if (extension === 'jpg' || extension === 'jpeg') {
      mimeType = 'image/jpeg';
    } else if (extension === 'gif') {
      mimeType = 'image/gif';
    } else if (extension === 'webp') {
      mimeType = 'image/webp';
    }

    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Failed to load image:', imagePath, error);
    throw error;
  }
}

export function onMenuNewFile(callback: () => void) {
  const listener = () => callback();
  ipcRenderer.on('menu-new-file', listener);
  return () => ipcRenderer.removeListener('menu-new-file', listener);
}

export function onMenuOpenFile(callback: (data: {filePath: string, content: string}) => void) {
  const listener = (_: any, data: {filePath: string, content: string}) => callback(data);
  ipcRenderer.on('menu-open-file', listener);
  return () => ipcRenderer.removeListener('menu-open-file', listener);
}

export function onMenuOpenFileError(callback: (error: any) => void) {
  const listener = (_: any, error: any) => callback(error);
  ipcRenderer.on('menu-open-file-error', listener);
  return () => ipcRenderer.removeListener('menu-open-file-error', listener);
}

export function onMenuSaveFile(callback: () => void) {
  const listener = () => callback();
  ipcRenderer.on('menu-save-file', listener);
  return () => ipcRenderer.removeListener('menu-save-file', listener);
}

export function onMenuSaveAsFile(callback: (filePath: string) => void) {
  const listener = (_: any, filePath: string) => callback(filePath);
  ipcRenderer.on('menu-save-as-file', listener);
  return () => ipcRenderer.removeListener('menu-save-as-file', listener);
}

export function onMenuUndo(callback: () => void) {
  const listener = () => callback();
  ipcRenderer.on('menu-undo', listener);
  return () => ipcRenderer.removeListener('menu-undo', listener);
}

export function onMenuRedo(callback: () => void) {
  const listener = () => callback();
  ipcRenderer.on('menu-redo', listener);
  return () => ipcRenderer.removeListener('menu-redo', listener);
}

export function updateMenuState(canUndo: boolean, canRedo: boolean) {
  ipcRenderer.send('update-menu-state', { canUndo, canRedo });
}
