import { IntegrationType, SubscriptionStatus } from '@prisma/client';

/**
 * Sample data factories for consistent test data
 */
export const sampleData = {
  user: (overrides: Partial<any> = {}) => ({
    id: 'user_123',
    clerkId: 'clerk_user_123',
    lat: 40.7128,
    long: -74.0060,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }),

  vendor: (overrides: Partial<any> = {}) => ({
    id: 'vendor_123',
    name: 'Test Vendor',
    description: 'A test vendor',
    ownerId: 'user_123',
    lat: 40.7128,
    long: -74.0060,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }),

  integration: (overrides: Partial<any> = {}) => ({
    id: 'integration_123',
    type: IntegrationType.Clerk,
    userId: 'user_123',
    config: { providerId: 'provider_123', data: { someData: 'value' } },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }),

  userSubscription: (overrides: Partial<any> = {}) => ({
    id: 'subscription_123',
    userId: 'user_123',
    status: SubscriptionStatus.Active,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }),

  location: (overrides: Partial<any> = {}) => ({
    id: 'location_123',
    userId: 'user_123',
    lat: 40.7128,
    long: -74.0060,
    accuracy: 10,
    timestamp: new Date('2024-01-01T00:00:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }),
}; 