import { vi } from 'vitest';
import { ExecutionContext } from '@nestjs/common';

/**
 * Context mock utilities for testing guards and interceptors
 */

/**
 * Creates a mock ExecutionContext for testing guards and interceptors
 */
export function createMockExecutionContext(overrides: Partial<ExecutionContext> = {}): ExecutionContext {
  const mockGetRequest = vi.fn().mockReturnValue({
    headers: {},
    body: {},
    params: {},
    query: {},
    ...overrides,
  });

  const mockGetResponse = vi.fn().mockReturnValue({
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    ...overrides,
  });

  return {
    switchToHttp: vi.fn().mockReturnValue({
      getRequest: mockGetRequest,
      getResponse: mockGetResponse,
    }),
    switchToRpc: vi.fn().mockReturnValue({
      getData: vi.fn(),
      getContext: vi.fn(),
    }),
    switchToWs: vi.fn().mockReturnValue({
      getData: vi.fn(),
      getClient: vi.fn(),
      getPattern: vi.fn(),
    }),
    getClass: vi.fn(),
    getHandler: vi.fn(),
    getType: vi.fn(),
    getArgs: vi.fn(),
    ...overrides,
  } as any;
}

/**
 * Creates a mock HTTP request object
 */
export function createMockRequest(overrides: Partial<any> = {}) {
  return {
    headers: {},
    body: {},
    params: {},
    query: {},
    url: '/test',
    method: 'GET',
    ...overrides,
  };
}

/**
 * Creates a mock HTTP response object
 */
export function createMockResponse(overrides: Partial<any> = {}) {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    getHeader: vi.fn(),
    ...overrides,
  };
}

/**
 * Creates a mock WebSocket client
 */
export function createMockWebSocketClient(overrides: Partial<any> = {}) {
  return {
    id: 'socket_123',
    handshake: {
      auth: {},
      headers: {},
    },
    emit: vi.fn(),
    join: vi.fn(),
    leave: vi.fn(),
    disconnect: vi.fn(),
    ...overrides,
  };
}

/**
 * Creates a mock gRPC call context
 */
export function createMockGrpcCall(overrides: Partial<any> = {}) {
  return {
    metadata: {
      get: vi.fn(),
      set: vi.fn(),
    },
    sendMetadata: vi.fn(),
    getPeer: vi.fn(),
    getDeadline: vi.fn(),
    ...overrides,
  };
} 