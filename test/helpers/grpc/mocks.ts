import { vi } from 'vitest';

/**
 * gRPC mock utilities for testing gRPC services and controllers
 */

/**
 * Common gRPC service names used across the application
 */
export const GRPC_SERVICE_NAMES = {
  USER_SERVICE: 'UserService',
  VENDOR_SERVICE: 'VendorService',
  LOCATION_SERVICE: 'LocationService',
} as const;

/**
 * Mock gRPC response types
 */
export interface MockGrpcResponse<T = any> {
  data: T;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Creates a mock gRPC response
 */
export function createMockGrpcResponse<T>(data: T, error?: string): MockGrpcResponse<T> {
  return {
    data,
    ...(error && { error }),
  };
}

/**
 * Mock gRPC call object
 */
export interface MockGrpcCall {
  metadata: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    clone: ReturnType<typeof vi.fn>;
  };
  sendMetadata: ReturnType<typeof vi.fn>;
  getPeer: ReturnType<typeof vi.fn>;
  getDeadline: ReturnType<typeof vi.fn>;
  cancelled: boolean;
}

/**
 * Creates a mock gRPC call
 */
export function createMockGrpcCall(overrides: Partial<MockGrpcCall> = {}): MockGrpcCall {
  return {
    metadata: {
      get: vi.fn(),
      set: vi.fn(),
      clone: vi.fn(),
    },
    sendMetadata: vi.fn(),
    getPeer: vi.fn(),
    getDeadline: vi.fn(),
    cancelled: false,
    ...overrides,
  };
}

/**
 * Mock gRPC server object
 */
export interface MockGrpcServer {
  addService: ReturnType<typeof vi.fn>;
  bindAsync: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  tryShutdown: ReturnType<typeof vi.fn>;
  forceShutdown: ReturnType<typeof vi.fn>;
}

/**
 * Creates a mock gRPC server
 */
export function createMockGrpcServer(): MockGrpcServer {
  return {
    addService: vi.fn(),
    bindAsync: vi.fn(),
    start: vi.fn(),
    tryShutdown: vi.fn(),
    forceShutdown: vi.fn(),
  };
}

/**
 * Sets up common gRPC mocks for the application
 */
export function setupGrpcMocks() {
  // Mock all proto imports to avoid module resolution issues
  vi.mock('@app/proto/user', () => ({
    USER_SERVICE_NAME: GRPC_SERVICE_NAMES.USER_SERVICE,
    ClerkUserData: vi.fn(),
    ClerkWebhookResponse: vi.fn(),
    UserVendorData: vi.fn(),
    UserVendorsResponse: vi.fn(),
    RevenueCatSubscriptionData: vi.fn(),
    SubscriptionCreatedResponse: vi.fn(),
  }));

  vi.mock('@app/proto/vendor', () => ({
    VENDOR_SERVICE_NAME: GRPC_SERVICE_NAMES.VENDOR_SERVICE,
    VendorData: vi.fn(),
    VendorResponse: vi.fn(),
  }));

  vi.mock('@app/proto/location', () => ({
    LOCATION_SERVICE_NAME: GRPC_SERVICE_NAMES.LOCATION_SERVICE,
    LocationData: vi.fn(),
    LocationResponse: vi.fn(),
  }));
}

/**
 * Creates a mock gRPC service implementation
 */
export function createMockGrpcService(methods: Record<string, ReturnType<typeof vi.fn>> = {}) {
  return {
    ...methods,
    // Add common gRPC service methods
    start: vi.fn(),
    stop: vi.fn(),
  };
}

/**
 * Utility to create a mock gRPC stream
 */
export function createMockGrpcStream<T = any>(data: T[] = []) {
  const stream = {
    write: vi.fn(),
    end: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    emit: vi.fn(),
    destroy: vi.fn(),
  };

  // Simulate data being written to stream
  data.forEach(item => stream.write(item));

  return stream;
}

/**
 * Utility to create a mock gRPC observable
 */
export function createMockGrpcObservable<T = any>(data: T) {
  return {
    pipe: vi.fn().mockReturnValue({
      toPromise: vi.fn().mockResolvedValue(data),
    }),
  };
} 