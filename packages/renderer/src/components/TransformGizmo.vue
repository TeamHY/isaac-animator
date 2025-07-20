<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

interface GizmoProps {
  // Target object position in world space (anm2Container coordinates)
  targetX: number;
  targetY: number;
  targetScaleX: number;
  targetScaleY: number;
  targetRotation: number; // in degrees
  
  // Target object size (frame dimensions)
  targetWidth: number;
  targetHeight: number;
  pivotX: number; // pivot point in pixels
  pivotY: number; // pivot point in pixels
  
  // Camera/viewport info for world-to-screen conversion
  cameraOffsetX: number;
  cameraOffsetY: number;
  zoomLevel: number;
  viewportWidth: number;
  viewportHeight: number;
  
  // Visibility
  visible: boolean;
}

interface GizmoEmits {
  (e: 'transform', data: {
    x?: number;
    y?: number;
    scaleX?: number;
    scaleY?: number;
    rotation?: number;
  }): void;
}

const props = defineProps<GizmoProps>();
const emit = defineEmits<GizmoEmits>();

const gizmoContainer = ref<HTMLDivElement | null>(null);
const isDragging = ref(false);
const dragType = ref<'move' | 'scale' | 'rotate' | null>(null);
const dragStartPos = ref({ x: 0, y: 0 });
const dragStartValues = ref({
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
});

// Convert world coordinates to screen coordinates
const worldToScreen = (worldX: number, worldY: number) => {
  const centerX = props.viewportWidth / 2;
  const centerY = props.viewportHeight / 2;
  
  const screenX = centerX + props.cameraOffsetX + (worldX * props.zoomLevel);
  const screenY = centerY + props.cameraOffsetY + (worldY * props.zoomLevel);
  
  return { x: screenX, y: screenY };
};

// Convert screen coordinates to world coordinates
const screenToWorld = (screenX: number, screenY: number) => {
  const centerX = props.viewportWidth / 2;
  const centerY = props.viewportHeight / 2;
  
  const worldX = (screenX - centerX - props.cameraOffsetX) / props.zoomLevel;
  const worldY = (screenY - centerY - props.cameraOffsetY) / props.zoomLevel;
  
  return { x: worldX, y: worldY };
};

// Calculate actual sprite bounds in world space
const spriteBounds = computed(() => {
  const scaledWidth = Math.abs(props.targetWidth * props.targetScaleX);
  const scaledHeight = Math.abs(props.targetHeight * props.targetScaleY);
  
  // In anm2, pivot is relative to the sprite size (0-width, 0-height)
  // The sprite position (targetX, targetY) represents the pivot point position
  const pivotRatioX = props.targetWidth > 0 ? props.pivotX / props.targetWidth : 0.5;
  const pivotRatioY = props.targetHeight > 0 ? props.pivotY / props.targetHeight : 0.5;
  
  // Calculate sprite center based on pivot position
  const offsetFromPivotToCenterX = (0.5 - pivotRatioX) * scaledWidth;
  const offsetFromPivotToCenterY = (0.5 - pivotRatioY) * scaledHeight;
  
  return {
    width: scaledWidth,
    height: scaledHeight,
    // Sprite center position in world coordinates
    centerX: props.targetX + offsetFromPivotToCenterX,
    centerY: props.targetY + offsetFromPivotToCenterY,
    pivotX: props.targetX, // This is where the actual pivot point is
    pivotY: props.targetY,
  };
});

// Calculate gizmo position on screen (at sprite center)
const gizmoPosition = computed(() => {
  return worldToScreen(spriteBounds.value.centerX, spriteBounds.value.centerY);
});

// Gizmo size based on actual sprite size but with reasonable limits
const gizmoSize = computed(() => {
  const bounds = spriteBounds.value;
  const screenWidth = Math.abs(bounds.width * props.zoomLevel);
  const screenHeight = Math.abs(bounds.height * props.zoomLevel);
  
  // Use the larger dimension but clamp to reasonable range
  const maxDimension = Math.max(screenWidth, screenHeight);
  const minSize = 60;
  const maxSize = 200;
  
  // If sprite is very small, use minimum size
  if (maxDimension < minSize) {
    return minSize;
  }
  
  // If sprite is huge, cap the gizmo size but still make it proportional
  if (maxDimension > maxSize) {
    return maxSize;
  }
  
  return maxDimension;
});

// Handle size based on gizmo size
const handleSize = computed(() => {
  const baseHandleSize = Math.max(8, Math.min(14, gizmoSize.value * 0.08));
  return baseHandleSize;
});

// Calculate sprite corners in screen space for better handle placement
const spriteCorners = computed(() => {
  const bounds = spriteBounds.value;
  const halfWidth = bounds.width / 2;
  const halfHeight = bounds.height / 2;
  
  const corners = [
    { x: bounds.centerX - halfWidth, y: bounds.centerY - halfHeight }, // top-left
    { x: bounds.centerX + halfWidth, y: bounds.centerY - halfHeight }, // top-right
    { x: bounds.centerX - halfWidth, y: bounds.centerY + halfHeight }, // bottom-left
    { x: bounds.centerX + halfWidth, y: bounds.centerY + halfHeight }, // bottom-right
  ];
  
  // Apply rotation around sprite center
  const radians = (props.targetRotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  
  return corners.map(corner => {
    const relX = corner.x - bounds.centerX;
    const relY = corner.y - bounds.centerY;
    
    const rotatedX = relX * cos - relY * sin;
    const rotatedY = relX * sin + relY * cos;
    
    const worldPos = {
      x: bounds.centerX + rotatedX,
      y: bounds.centerY + rotatedY
    };
    
    return worldToScreen(worldPos.x, worldPos.y);
  });
});

const startDrag = (event: MouseEvent, type: 'move' | 'scale' | 'rotate') => {
  event.preventDefault();
  event.stopPropagation();
  
  isDragging.value = true;
  dragType.value = type;
  
  dragStartPos.value = { 
    x: event.clientX, 
    y: event.clientY 
  };
  
  dragStartValues.value = {
    x: props.targetX,
    y: props.targetY,
    scaleX: props.targetScaleX,
    scaleY: props.targetScaleY,
    rotation: props.targetRotation,
  };
  
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
};

const onDragMove = (event: MouseEvent) => {
  if (!isDragging.value || !dragType.value) return;
  
  const deltaScreenX = event.clientX - dragStartPos.value.x;
  const deltaScreenY = event.clientY - dragStartPos.value.y;
  
  if (dragType.value === 'move') {
    // Convert screen delta to world delta
    const deltaWorldX = deltaScreenX / props.zoomLevel;
    const deltaWorldY = deltaScreenY / props.zoomLevel;
    
    emit('transform', {
      x: dragStartValues.value.x + deltaWorldX,
      y: dragStartValues.value.y + deltaWorldY,
    });
  } else if (dragType.value === 'scale') {
    // Scale based on distance from center
    const distance = Math.sqrt(deltaScreenX * deltaScreenX + deltaScreenY * deltaScreenY);
    const scaleFactor = 1 + (distance / 100) * Math.sign(deltaScreenX + deltaScreenY);
    
    const newScaleX = Math.max(0.1, dragStartValues.value.scaleX * scaleFactor);
    const newScaleY = Math.max(0.1, dragStartValues.value.scaleY * scaleFactor);
    
    emit('transform', {
      scaleX: newScaleX,
      scaleY: newScaleY,
    });
  } else if (dragType.value === 'rotate') {
    // Calculate rotation based on angle from center
    const centerScreen = worldToScreen(dragStartValues.value.x, dragStartValues.value.y);
    const angle = Math.atan2(
      event.clientY - centerScreen.y,
      event.clientX - centerScreen.x
    );
    
    const startAngle = Math.atan2(
      dragStartPos.value.y - centerScreen.y,
      dragStartPos.value.x - centerScreen.x
    );
    
    const deltaAngle = (angle - startAngle) * (180 / Math.PI);
    const newRotation = dragStartValues.value.rotation + deltaAngle;
    
    emit('transform', {
      rotation: newRotation,
    });
  }
};

const onDragEnd = () => {
  isDragging.value = false;
  dragType.value = null;
  
  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);
};

// Cleanup event listeners
onUnmounted(() => {
  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);
});

// Watch for changes and update gizmo position
watch([() => props.targetX, () => props.targetY, () => props.zoomLevel, () => props.cameraOffsetX, () => props.cameraOffsetY], () => {
  // Position update is handled by computed property
});
</script>

<template>
  <div
    v-if="visible"
    ref="gizmoContainer"
    class="transform-gizmo"
    :style="{
      left: `${gizmoPosition.x}px`,
      top: `${gizmoPosition.y}px`,
      transform: `translate(-50%, -50%) rotate(${targetRotation}deg)`,
      width: `${gizmoSize}px`,
      height: `${gizmoSize}px`,
    }"
  >
    <!-- Center point -->
    <div
      class="gizmo-center"
      :style="{
        width: `${handleSize * 0.6}px`,
        height: `${handleSize * 0.6}px`,
      }"
      @mousedown="startDrag($event, 'move')"
    />
    
    <!-- Move handles (arrows) -->
    <div
      class="gizmo-arrow gizmo-arrow-x"
      :style="{
        width: `${gizmoSize * 0.4}px`,
        height: `${handleSize * 0.4}px`,
        right: `-${gizmoSize * 0.2}px`,
        top: `50%`,
        transform: 'translateY(-50%)',
      }"
      @mousedown="startDrag($event, 'move')"
    >
      <div 
        class="gizmo-arrow-head"
        :style="{
          borderLeftWidth: `${handleSize * 0.6}px`,
          borderTopWidth: `${handleSize * 0.4}px`,
          borderBottomWidth: `${handleSize * 0.4}px`,
        }"
      />
    </div>
    
    <div
      class="gizmo-arrow gizmo-arrow-y"
      :style="{
        width: `${handleSize * 0.4}px`,
        height: `${gizmoSize * 0.4}px`,
        left: `50%`,
        bottom: `-${gizmoSize * 0.2}px`,
        transform: 'translateX(-50%)',
      }"
      @mousedown="startDrag($event, 'move')"
    >
      <div 
        class="gizmo-arrow-head"
        :style="{
          borderTopWidth: `${handleSize * 0.6}px`,
          borderLeftWidth: `${handleSize * 0.4}px`,
          borderRightWidth: `${handleSize * 0.4}px`,
        }"
      />
    </div>
    
    <!-- Scale handles (at actual sprite corners) -->
    <div
      v-for="(corner, index) in spriteCorners"
      :key="`scale-${index}`"
      class="gizmo-scale"
      :class="`gizmo-scale-corner-${index}`"
      :style="{
        width: `${handleSize}px`,
        height: `${handleSize}px`,
        left: `${corner.x - gizmoPosition.x}px`,
        top: `${corner.y - gizmoPosition.y}px`,
        transform: 'translate(-50%, -50%)',
      }"
      @mousedown="startDrag($event, 'scale')"
    />
    
    <!-- Rotation handle -->
    <div
      class="gizmo-rotate"
      :style="{
        width: `${handleSize}px`,
        height: `${handleSize}px`,
        top: `-${gizmoSize * 0.6}px`,
        left: `50%`,
        transform: 'translateX(-50%)',
      }"
      @mousedown="startDrag($event, 'rotate')"
    />
    
    <!-- Rotation connection line -->
    <div
      class="gizmo-rotate-line"
      :style="{
        width: '2px',
        height: `${gizmoSize * 0.3}px`,
        top: `-${gizmoSize * 0.3}px`,
        left: `50%`,
        transform: 'translateX(-50%)',
      }"
    />
  </div>
</template>

<style scoped>
.transform-gizmo {
  position: absolute;
  pointer-events: none;
  z-index: 1000;
}

.gizmo-center {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background-color: #ffffff;
  border: 2px solid #007acc;
  border-radius: 50%;
  cursor: move;
  pointer-events: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.gizmo-center:hover {
  background-color: #007acc;
  border-color: #005a99;
}

.gizmo-arrow {
  position: absolute;
  pointer-events: auto;
  cursor: move;
}

.gizmo-arrow-x {
  background-color: #ff4444;
  border-radius: 2px;
}

.gizmo-arrow-y {
  background-color: #44ff44;
  border-radius: 2px;
}

.gizmo-arrow:hover {
  opacity: 0.8;
}

.gizmo-arrow-head {
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
}

.gizmo-arrow-x .gizmo-arrow-head {
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  border-color: transparent transparent transparent #ff4444;
}

.gizmo-arrow-y .gizmo-arrow-head {
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  border-color: #44ff44 transparent transparent transparent;
}

.gizmo-scale {
  position: absolute;
  background-color: #ffffff;
  border: 2px solid #007acc;
  pointer-events: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.gizmo-scale-corner-0 {
  cursor: nw-resize; /* top-left */
}

.gizmo-scale-corner-1 {
  cursor: ne-resize; /* top-right */
}

.gizmo-scale-corner-2 {
  cursor: sw-resize; /* bottom-left */
}

.gizmo-scale-corner-3 {
  cursor: se-resize; /* bottom-right */
}

.gizmo-scale:hover {
  background-color: #007acc;
  border-color: #005a99;
}

.gizmo-rotate {
  position: absolute;
  background-color: #ffffff;
  border: 2px solid #ff8800;
  border-radius: 50%;
  cursor: grab;
  pointer-events: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.gizmo-rotate:hover {
  background-color: #ff8800;
  border-color: #cc6600;
}

.gizmo-rotate:active {
  cursor: grabbing;
}

.gizmo-rotate-line {
  position: absolute;
  background-color: #ff8800;
  pointer-events: none;
}

/* Prevent text selection during drag */
.transform-gizmo * {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
</style>