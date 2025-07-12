import { onUnmounted } from 'vue';

export interface EventListenerConfig {
  target: EventTarget;
  event: string;
  handler: EventListener;
  options?: AddEventListenerOptions;
}

/**
 * Event listener management utility composable
 * Automatically manages adding/removing event listeners
 */
export function useEventListener() {
  const listeners: EventListenerConfig[] = [];

  const addEventListener = (
    target: EventTarget,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ) => {
    const config: EventListenerConfig = { target, event, handler, options };
    listeners.push(config);
    target.addEventListener(event, handler, options);
  };

  const removeEventListener = (
    target: EventTarget,
    event: string,
    handler: EventListener
  ) => {
    const index = listeners.findIndex(
      (config) => config.target === target && config.event === event && config.handler === handler
    );
    
    if (index !== -1) {
      listeners.splice(index, 1);
      target.removeEventListener(event, handler);
    }
  };

  const removeAllEventListeners = () => {
    listeners.forEach((config) => {
      config.target.removeEventListener(config.event, config.handler);
    });
    listeners.length = 0;
  };

  onUnmounted(removeAllEventListeners);

  return {
    addEventListener,
    removeEventListener,
    removeAllEventListeners,
  };
} 
