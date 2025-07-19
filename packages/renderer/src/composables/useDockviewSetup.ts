import type { DockviewReadyEvent } from "dockview-vue";

/**
 * Dockview layout setup composable
 */
export function useDockviewSetup() {
  const onReady = (event: DockviewReadyEvent) => {
    event.api.addPanel({
      id: "spritesheet-viewer-panel",
      title: "Spritesheet Viewer",
      component: "spritesheet-viewer-panel",
    });

    event.api.addPanel({
      id: "properties-panel",
      title: "Properties",
      component: "properties-panel",
      position: {
        referencePanel: "spritesheet-viewer-panel",
        direction: "right",
      },
      initialWidth: 250,
    });

    event.api.addPanel({
      id: "timeline-panel",
      title: "Timeline",
      component: "timeline-panel",
      position: {
        referencePanel: "spritesheet-viewer-panel",
        direction: "below",
      },
    });

    event.api.addPanel({
      id: "project-panel",
      title: "Project",
      component: "project-panel",
      position: {
        referencePanel: "spritesheet-viewer-panel",
        direction: "right",
      },
      initialWidth: 250,
    });

    event.api.addPanel({
      id: "preview-panel",
      title: "Preview",
      component: "preview-panel",
      position: {
        referencePanel: "spritesheet-viewer-panel",
        direction: "left",
      },
    });
  };

  return {
    onReady,
  };
}
