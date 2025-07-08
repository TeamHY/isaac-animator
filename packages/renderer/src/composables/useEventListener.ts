import { onUnmounted } from 'vue';

export interface EventListenerConfig {
  target: EventTarget;
  event: string;
  handler: EventListener;
  options?: AddEventListenerOptions;
}

/**
 * 이벤트 리스너 관리 유틸리티 컴포저블
 * 이벤트 리스너의 추가/제거를 자동으로 관리
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
