import { ref, onUnmounted } from 'vue';

export interface DragHandlerOptions {
  onDragStart?: (event: MouseEvent) => void;
  onDragMove?: (event: MouseEvent, deltaX: number, deltaY: number) => void;
  onDragEnd?: (event: MouseEvent) => void;
  cursor?: string;
}

/**
 * Common drag handling logic composable
 * Handles mouse drag events and manages state
 */
export function useDragHandler(options: DragHandlerOptions = {}) {
  const isDragging = ref(false);
  const dragStartPos = ref({ x: 0, y: 0 });
  const lastPos = ref({ x: 0, y: 0 });

  const startDrag = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    isDragging.value = true;
    dragStartPos.value = { x: event.clientX, y: event.clientY };
    lastPos.value = { x: event.clientX, y: event.clientY };
    
    if (options.cursor) {
      document.body.style.cursor = options.cursor;
    }
    
    options.onDragStart?.(event);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging.value) return;
    
    const deltaX = event.clientX - lastPos.value.x;
    const deltaY = event.clientY - lastPos.value.y;
    
    lastPos.value = { x: event.clientX, y: event.clientY };
    
    options.onDragMove?.(event, deltaX, deltaY);
  };

  const handleMouseUp = (event: MouseEvent) => {
    if (!isDragging.value) return;
    
    isDragging.value = false;
    document.body.style.cursor = '';
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    options.onDragEnd?.(event);
  };

  const cleanup = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    isDragging.value = false;
  };

  onUnmounted(cleanup);

  return {
    isDragging,
    dragStartPos,
    lastPos,
    startDrag,
    cleanup,
  };
} 
