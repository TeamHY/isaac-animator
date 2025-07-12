<script setup lang="ts">
interface Props {
  position?: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center' | 'top-left' | 'top-right';
}

const props = withDefaults(defineProps<Props>(), {
  position: 'bottom-center',
});

const getPositionClasses = () => {
  const [vertical, horizontal] = props.position.split('-');
  return {
    [`position-${vertical}`]: true,
    [`position-${horizontal}`]: true,
  };
};
</script>

<template>
  <div class="overlay-controls" :class="getPositionClasses()">
    <slot />
  </div>
</template>

<style scoped>
.overlay-controls {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: var(--bg-control);
  padding: 8px 12px;
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-elevated);
  backdrop-filter: blur(10px);
  z-index: 100;
}

/* Vertical positioning */
.position-bottom {
  bottom: 12px;
}

.position-top {
  top: 12px;
}

/* Horizontal positioning */
.position-center {
  left: 50%;
  transform: translateX(-50%);
}

.position-left {
  left: 12px;
}

.position-right {
  right: 12px;
}
</style>
