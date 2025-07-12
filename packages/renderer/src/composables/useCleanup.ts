import { onUnmounted } from 'vue';

export type CleanupFunction = () => void;

/**
 * Resource cleanup management composable
 * Automatically cleans up resources when component unmounts
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
