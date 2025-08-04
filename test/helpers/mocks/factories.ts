import { vi } from 'vitest';
import type { MockPrismaService, MockEventsService, MockRedisService, MockClerkService } from './interfaces';

/**
 * Mock factory functions
 */

/**
 * Creates a mock PrismaService with all common database operations
 */
export function createMockPrismaService(): MockPrismaService {
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
        deleteMany: vi.fn(),
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
        deleteMany: vi.fn(),
      },
      location: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
    },
    pulse: {},
  };
}

/**
 * Creates a mock EventsService
 */
export function createMockEventsService(): MockEventsService {
  return {
    publishEvent: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  };
}

/**
 * Creates a mock RedisService
 */
export function createMockRedisService(): MockRedisService {
  return {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
  };
}

/**
 * Creates a mock ClerkService
 */
export function createMockClerkService(): MockClerkService {
  return {
    verifyToken: vi.fn(),
    getUser: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  };
} 