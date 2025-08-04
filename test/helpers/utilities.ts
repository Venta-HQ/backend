import { vi } from 'vitest';

/**
 * Common test utilities
 */

/**
 * Utility to clear all mocks
 */
export function clearAllMocks() {
  vi.clearAllMocks();
}

/**
 * Utility to reset all mocks
 */
export function resetAllMocks() {
  vi.resetAllMocks();
}

/**
 * Test timing utilities
 */
export const timing = {
  /**
   * Waits for a specified number of milliseconds
   */
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Waits for the next tick of the event loop
   */
  nextTick: () => new Promise(resolve => process.nextTick(resolve)),

  /**
   * Waits for the next microtask
   */
  nextMicrotask: () => new Promise(resolve => queueMicrotask(resolve)),
}; 