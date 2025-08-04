/**
 * Common test assertions
 */

/**
 * Common test assertions
 */
export const assertions = {
  /**
   * Asserts that a function throws an error with a specific message
   */
  expectError: async (fn: () => Promise<any>, expectedMessage: string) => {
    await expect(fn()).rejects.toThrow(expectedMessage);
  },

  /**
   * Asserts that a function throws an error of a specific type
   */
  expectErrorType: async (fn: () => Promise<any>, ErrorType: any) => {
    await expect(fn()).rejects.toThrow(ErrorType);
  },

  /**
   * Asserts that a mock was called with specific arguments
   */
  expectCalledWith: (mock: any, ...args: any[]) => {
    expect(mock).toHaveBeenCalledWith(...args);
  },

  /**
   * Asserts that a mock was called exactly once
   */
  expectCalledOnce: (mock: any) => {
    expect(mock).toHaveBeenCalledTimes(1);
  },

  /**
   * Asserts that a mock was never called
   */
  expectNeverCalled: (mock: any) => {
    expect(mock).not.toHaveBeenCalled();
  },
}; 