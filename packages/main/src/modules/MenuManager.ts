import type {AppModule} from '../AppModule.js';
import {ModuleContext} from '../ModuleContext.js';
import {Menu, MenuItem, shell, dialog, BrowserWindow, ipcMain} from 'electron';
import {join} from 'path';
import {readFile} from 'fs/promises';

class MenuManager implements AppModule {

  async enable({app}: ModuleContext): Promise<void> {
    await app.whenReady();
    this.setupApplicationMenu(app);
    this.setupContextMenu(app);
    this.setupMenuStateListener();
  }

  private setupApplicationMenu(app: Electron.App): void {
    const isMac = process.platform === 'darwin';

    const template: Electron.MenuItemConstructorOptions[] = [
      // App menu (macOS only)
      ...(isMac ? [{
        label: app.getName(),
        submenu: [
          { role: 'about' as const },
          { type: 'separator' as const },
          { role: 'services' as const },
          { type: 'separator' as const },
          { role: 'hide' as const },
          { role: 'hideOthers' as const },
          { role: 'unhide' as const },
          { type: 'separator' as const },
          { role: 'quit' as const }
        ]
      }] : []),

      {
        label: 'File',
        submenu: [
          {
            label: 'New',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.handleNewFile()
          },
          {
            label: 'Open...',
            accelerator: 'CmdOrCtrl+O',
            click: () => this.handleOpenFile()
          },
          {
            label: 'Save',
            accelerator: 'CmdOrCtrl+S',
            click: () => this.handleSaveFile()
          },
          {
            label: 'Save As...',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: () => this.handleSaveAsFile()
          },
          { type: 'separator' },
          ...(isMac ? [] : [{ role: 'quit' as const }])
        ]
      },

      {
        label: 'Edit',
        submenu: [
          {
            label: 'Undo',
            accelerator: 'CmdOrCtrl+Z',
            enabled: false,
            click: () => this.handleUndo()
          },
          {
            label: 'Redo',
            accelerator: 'CmdOrCtrl+Shift+Z',
            enabled: false,
            click: () => this.handleRedo()
          },
          { type: 'separator' as const },
          { role: 'cut' as const },
          { role: 'copy' as const },
          { role: 'paste' as const },
          ...(isMac ? [
            { role: 'pasteAndMatchStyle' as const },
            { role: 'delete' as const },
            { role: 'selectAll' as const },
            { type: 'separator' as const },
            {
              label: 'Speech',
              submenu: [
                { role: 'startSpeaking' as const },
                { role: 'stopSpeaking' as const }
              ]
            }
          ] : [
            { role: 'delete' as const },
            { type: 'separator' as const },
            { role: 'selectAll' as const }
          ])
        ]
      },

      {
        label: 'View',
        submenu: [
          { role: 'reload' as const },
          { role: 'forceReload' as const },
          { role: 'toggleDevTools' as const },
          { type: 'separator' as const },
          { role: 'resetZoom' as const },
          { role: 'zoomIn' as const },
          { role: 'zoomOut' as const },
          { type: 'separator' as const },
          { role: 'togglefullscreen' as const }
        ]
      },

      {
        label: 'Window',
        submenu: [
          { role: 'minimize' as const },
          { role: 'close' as const },
          ...(isMac ? [
            { type: 'separator' as const },
            { role: 'front' as const },
            { type: 'separator' as const },
            { role: 'window' as const }
          ] : [])
        ]
      },

      {
        role: 'help',
        submenu: [
          {
            label: 'About Isaac Animator',
            click: () => this.handleAbout()
          },
          {
            label: 'Learn More',
            click: () => shell.openExternal('https://github.com/your-repo/isaac-animator')
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupContextMenu(app: Electron.App): void {
    const contextMenu = Menu.buildFromTemplate([
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { type: 'separator' },
      { role: 'selectAll' }
    ]);

    const applyContextMenu = (webContents: Electron.WebContents) => {
      webContents.on('context-menu', (_: Electron.Event, params: Electron.ContextMenuParams) => {
        contextMenu.popup();
      });
    };

    BrowserWindow.getAllWindows().forEach(window => {
      applyContextMenu(window.webContents);
    });

    app.on('web-contents-created', (_: Electron.Event, webContents: Electron.WebContents) => {
      applyContextMenu(webContents);
    });
  }

  private async handleNewFile(): Promise<void> {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      focusedWindow.webContents.send('menu-new-file');
    }
  }

  private async handleOpenFile(): Promise<void> {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (!focusedWindow) return;

    const result = await dialog.showOpenDialog(focusedWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Animation Files', extensions: ['anm2'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      try {
        const fileContent = await readFile(filePath, { encoding: 'utf8' });
        focusedWindow.webContents.send('menu-open-file', { filePath, content: fileContent });
      } catch (error) {
        console.error('Failed to read file:', error);
        focusedWindow.webContents.send('menu-open-file-error', error);
      }
    }
  }

  private async handleSaveFile(): Promise<void> {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      focusedWindow.webContents.send('menu-save-file');
    }
  }

  private async handleSaveAsFile(): Promise<void> {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (!focusedWindow) return;

    const result = await dialog.showSaveDialog(focusedWindow, {
      filters: [
        { name: 'Animation Files', extensions: ['anm2'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePath) {
      focusedWindow.webContents.send('menu-save-as-file', result.filePath);
    }
  }

  private async handleUndo(): Promise<void> {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      focusedWindow.webContents.send('menu-undo');
    }
  }

  private async handleRedo(): Promise<void> {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      focusedWindow.webContents.send('menu-redo');
    }
  }

  private setupMenuStateListener(): void {
    ipcMain.on('update-menu-state', (_, { canUndo, canRedo }) => {
      this.updateMenuState(canUndo, canRedo);
    });
  }

  private updateMenuState(canUndo: boolean, canRedo: boolean): void {
    const menu = Menu.getApplicationMenu();
    if (!menu) return;

    // Find and update Undo menu item
    const editMenu = menu.items.find(item => item.label === 'Edit');
    if (editMenu && editMenu.submenu) {
      const undoItem = editMenu.submenu.items.find(item => item.label === 'Undo');
      const redoItem = editMenu.submenu.items.find(item => item.label === 'Redo');

      if (undoItem) {
        undoItem.enabled = canUndo;
      }
      if (redoItem) {
        redoItem.enabled = canRedo;
      }
    }
  }

  private handleAbout(): void {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    dialog.showMessageBox(focusedWindow || undefined as any, {
      type: 'info',
      title: 'About Isaac Animator',
      message: 'Isaac Animator',
      detail: 'A powerful animation editor for The Binding of Isaac.',
      buttons: ['OK']
    });
  }
}

export function createMenuManagerModule(): MenuManager {
  return new MenuManager();
}
