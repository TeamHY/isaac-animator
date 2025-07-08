import { onUnmounted } from 'vue';

export type CleanupFunction = () => void;

/**
 * 리소스 정리 관리 컴포저블
 * 컴포넌트가 언마운트될 때 자동으로 리소스를 정리
 */
export function useCleanup() {
  const cleanupFunctions: CleanupFunction[] = [];

  const addCleanup = (fn: CleanupFunction) => {
    cleanupFunctions.push(fn);
  };

  const removeCleanup = (fn: CleanupFunction) => {
    const index = cleanupFunctions.indexOf(fn);
    if (index !== -1) {
      cleanupFunctions.splice(index, 1);
    }
  };

  const runCleanup = () => {
    cleanupFunctions.forEach((fn) => {
      try {
        fn();
      } catch (error) {
        console.error('Cleanup function error:', error);
      }
    });
    cleanupFunctions.length = 0;
  };

  onUnmounted(runCleanup);

  return {
    addCleanup,
    removeCleanup,
    runCleanup,
  };
} 
