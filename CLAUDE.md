# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Isaac Animator is an Electron-based application for editing Anm2 animation files (used in The Binding of Isaac). It uses a multi-package architecture with Vue 3, TypeScript, and PIXI.js for rendering animations.

## Architecture

- **Monorepo Structure**: Uses npm workspaces with packages in `/packages/`
- **Main Process** (`packages/main/`): Electron main process with modular architecture using `ModuleRunner` and `AppModule` pattern
- **Renderer Process** (`packages/renderer/`): Vue 3 SPA with dockview-vue for panel management
- **Preload** (`packages/preload/`): Secure bridge between main and renderer processes

### Key Components

- **Anm2 Data Model**: Comprehensive TypeScript interfaces for animations, spritesheets, layers, nulls, and frames
- **State Management**: Composables-based architecture with undo/redo history system
- **Panel System**: Uses dockview-vue for flexible panel layout (Preview, Timeline, Properties, Spritesheet Viewer)
- **PIXI.js Renderer**: Custom Anm2Renderer for animation playback and visualization

## Development Commands

```bash
# Start development server
npm start

# Build all packages
npm run build

# Type checking across all workspaces
npm run typecheck

# Run end-to-end tests
npm test

# Create production build
npm run compile
```

### Package-Specific Commands

```bash
# Renderer development (from packages/renderer/)
npm run dev          # Vite dev server
npm run build        # Build with Vue TSC + Vite

# Main process build (from packages/main/)
npm run build        # Vite build
npm run typecheck    # TypeScript check only
```

## File Organization

- **Composables** (`packages/renderer/src/composables/`): Vue composition functions for state management, file handling, and UI interactions
- **Components** (`packages/renderer/src/components/`): Vue components organized by functionality (properties/, timeline/)
- **Parser** (`packages/renderer/src/parser/`): Anm2 file format parsing logic
- **Renderer** (`packages/renderer/src/renderer/`): PIXI.js-based animation rendering
- **Types** (`packages/renderer/src/types/`): TypeScript interfaces for Anm2 data structures

## Key Dependencies

- **dockview-vue**: Panel management system
- **pixi.js**: 2D rendering engine for animations
- **reka-ui**: UI component library
- **electron-updater**: Auto-update functionality

## Testing

E2E tests are located in `/tests/e2e.spec.ts` using Playwright. Tests verify the Electron application startup and basic functionality.