import { vi } from 'vitest';

/**
 * gRPC Controller testing utilities
 */

/**
 * Creates a mock gRPC client for testing
 */
export function createMockGrpcClient() {
  return {
    invoke: vi.fn(),
  };
}

/**
 * Creates a gRPC controller test setup
 */
export function createGrpcControllerTest<T>(
  ControllerClass: new (client: any) => T
): { mockGrpcClient: any; controller: T } {
  const mockGrpcClient = createMockGrpcClient();
  const controller = new ControllerClass(mockGrpcClient);
  return { mockGrpcClient, controller };
}

/**
 * Creates a gRPC observable that resolves with a value (for toPromise pattern)
 */
export function createGrpcObservableResolved(value: any) {
  return {
    pipe: vi.fn().mockReturnValue({
      toPromise: vi.fn().mockResolvedValue(value),
    }),
  };
}

/**
 * Creates a gRPC observable that rejects with an error (for toPromise pattern)
 */
export function createGrpcObservableRejected(error: any) {
  return {
    pipe: vi.fn().mockReturnValue({
      toPromise: vi.fn().mockRejectedValue(error),
    }),
  };
}

/**
 * Creates a gRPC observable that emits a value (for firstValueFrom pattern)
 */
export function createGrpcObservable(value: any) {
  return {
    pipe: vi.fn().mockReturnValue({
      subscribe: vi.fn().mockImplementation((observer) => {
        observer.next(value);
        observer.complete();
        return { unsubscribe: vi.fn() };
      }),
    }),
  };
}

/**
 * Creates a gRPC observable that emits an error (for firstValueFrom pattern)
 */
export function createGrpcObservableError(error: any) {
  return {
    pipe: vi.fn().mockReturnValue({
      subscribe: vi.fn().mockImplementation((observer) => {
        observer.error(error);
        return { unsubscribe: vi.fn() };
      }),
    }),
  };
}



/**
 * Common gRPC controller test patterns
 */
export const grpcControllerTesting = {
  /**
   * Creates a gRPC controller test setup
   */
  createTest: <T>(
    ControllerClass: new (client: any) => T
  ) => {
    return createGrpcControllerTest(ControllerClass);
  },

  /**
   * Creates a mock for a successful gRPC call
   */
  mockSuccess: (value: any, useObservable = false) => {
    return useObservable ? createGrpcObservable(value) : createGrpcObservableResolved(value);
  },

  /**
   * Creates a mock for a failed gRPC call
   */
  mockError: (error: any, useObservable = false) => {
    return useObservable ? createGrpcObservableError(error) : createGrpcObservableRejected(error);
  },
}; 