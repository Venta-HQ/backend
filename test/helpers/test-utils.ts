import { vi } from 'vitest';

/**
 * Simplified Test Helpers
 * 
 * Everything you need for testing in one place.
 * No complex abstractions, just simple functions that work.
 */

// ============================================================================
// MOCK FACTORIES (Most Common)
// ============================================================================

/**
 * Creates a mock Prisma service
 */
export function mockPrisma() {
  return {
    db: {
      user: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
        count: vi.fn(),
      },
      vendor: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      integration: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
      userSubscription: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
    pulse: {},
  };
}

/**
 * Creates a mock Events service
 */
export function mockEvents() {
  return {
    publishEvent: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  };
}

/**
 * Creates a mock gRPC client
 */
export function mockGrpcClient() {
  return {
    invoke: vi.fn(),
  };
}

/**
 * Creates a mock authenticated request
 */
export function mockRequest(overrides: any = {}) {
  return {
    userId: 'user_123',
    get: vi.fn(),
    header: vi.fn(),
    accepts: vi.fn(),
    acceptsCharsets: vi.fn(),
    acceptsEncodings: vi.fn(),
    acceptsLanguages: vi.fn(),
    range: vi.fn(),
    param: vi.fn(),
    is: vi.fn(),
    protocol: 'http',
    secure: false,
    ip: '127.0.0.1',
    ips: [],
    subdomains: [],
    path: '/test',
    hostname: 'localhost',
    host: 'localhost:3000',
    fresh: false,
    stale: true,
    xhr: false,
    body: {},
    cookies: {},
    method: 'GET',
    params: {},
    query: {},
    route: {},
    signedCookies: {},
    originalUrl: '/test',
    url: '/test',
    baseUrl: '',
    ...overrides,
  };
}

// ============================================================================
// SAMPLE DATA (Most Common)
// ============================================================================

/**
 * Sample data factories
 */
export const data = {
  user: (overrides = {}) => ({
    id: 'user_123',
    clerkId: 'clerk_user_123',
    email: 'test@example.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  vendor: (overrides = {}) => ({
    id: 'vendor_123',
    name: 'Test Vendor',
    description: 'Test Description',
    email: 'vendor@example.com',
    phone: '123-456-7890',
    website: 'https://example.com',
    imageUrl: 'https://example.com/image.jpg',
    lat: 40.7128,
    long: -74.0060,
    open: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  integration: (overrides = {}) => ({
    id: 'integration_123',
    type: 'Clerk',
    providerId: 'provider_123',
    userId: 'user_123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),
};

// ============================================================================
// ERROR FACTORIES
// ============================================================================

/**
 * Common error factories
 */
export const errors = {
  database: (message = 'Database error') => new Error(message),
  validation: (message = 'Validation error') => new Error(message),
  notFound: (message = 'Not found') => new Error(message),
  unauthorized: (message = 'Unauthorized') => new Error(message),
};

// ============================================================================
// WEBHOOK EVENTS
// ============================================================================

/**
 * Webhook event factories
 */
export const webhooks = {
  clerk: {
    userCreated: (overrides = {}) => ({
      type: 'user.created',
      data: {
        id: 'clerk_user_123',
        email_addresses: [{ email_address: 'test@example.com' }],
        first_name: 'John',
        last_name: 'Doe',
        ...overrides,
      },
      object: 'event',
      created_at: Date.now(),
    }),

    userDeleted: (overrides = {}) => ({
      type: 'user.deleted',
      data: {
        id: 'clerk_user_123',
        ...overrides,
      },
      object: 'event',
      created_at: Date.now(),
    }),

    userUpdated: (overrides = {}) => ({
      type: 'user.updated',
      data: {
        id: 'clerk_user_123',
        email_addresses: [{ email_address: 'test@example.com' }],
        first_name: 'John',
        last_name: 'Doe',
        ...overrides,
      },
      object: 'event',
      created_at: Date.now(),
    }),
  },

  revenueCat: {
    initialPurchase: (overrides = {}) => ({
      event: {
        type: 'INITIAL_PURCHASE',
        id: 'event_123',
        product_id: 'premium_monthly',
        transaction_id: 'txn_456',
        subscriber_attributes: {
          clerkUserId: 'clerk_user_123',
        },
        ...overrides,
      },
    }),

    renewal: (overrides = {}) => ({
      event: {
        type: 'RENEWAL',
        id: 'event_123',
        product_id: 'premium_monthly',
        transaction_id: 'txn_456',
        subscriber_attributes: {
          clerkUserId: 'clerk_user_123',
        },
        ...overrides,
      },
    }),
  },
};

// ============================================================================
// gRPC HELPERS
// ============================================================================

/**
 * gRPC observable helpers
 */
export const grpc = {
  success: (value: any) => ({
    pipe: vi.fn().mockReturnValue({
      toPromise: vi.fn().mockResolvedValue(value),
    }),
  }),

  error: (error: any) => ({
    pipe: vi.fn().mockReturnValue({
      toPromise: vi.fn().mockRejectedValue(error),
    }),
  }),

  observable: (value: any) => ({
    pipe: vi.fn().mockReturnValue({
      subscribe: vi.fn().mockImplementation((observer) => {
        if (value instanceof Error) {
          observer.error(value);
        } else {
          observer.next(value);
          observer.complete();
        }
        return { unsubscribe: vi.fn() };
      }),
    }),
  }),
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Clear all mocks
 */
export function clearMocks() {
  vi.clearAllMocks();
}

// ============================================================================
// COMMON PATTERNS
// ============================================================================

/**
 * Common test setup for services
 */
export function setupServiceTest(ServiceClass: any, dependencies: Record<string, any> = {}) {
  const service = new ServiceClass(...Object.values(dependencies));
  return { service, ...dependencies };
}

/**
 * Common test setup for controllers
 */
export function setupControllerTest(ControllerClass: any, dependencies: Record<string, any> = {}) {
  const controller = new ControllerClass(...Object.values(dependencies));
  return { controller, ...dependencies };
} 