/**
 * Common gRPC data types used in the application
 */
export const grpcDataTypes = {
  // User service data types
  ClerkUserData: (overrides: Partial<any> = {}) => ({
    id: 'clerk_user_123',
    ...overrides,
  }),

  ClerkWebhookResponse: (overrides: Partial<any> = {}) => ({
    message: 'Success',
    ...overrides,
  }),

  UserVendorData: (overrides: Partial<any> = {}) => ({
    userId: 'user_123',
    ...overrides,
  }),

  UserVendorsResponse: (overrides: Partial<any> = {}) => ({
    vendors: [
      { id: 'vendor_1', name: 'Vendor 1' },
      { id: 'vendor_2', name: 'Vendor 2' },
    ],
    ...overrides,
  }),

  RevenueCatSubscriptionData: (overrides: Partial<any> = {}) => ({
    clerkUserId: 'clerk_user_123',
    providerId: 'revenue_cat_123',
    data: { subscriptionId: 'sub_123', plan: 'premium' },
    ...overrides,
  }),

  SubscriptionCreatedResponse: (overrides: Partial<any> = {}) => ({
    message: 'Success',
    ...overrides,
  }),

  // Vendor service data types
  VendorData: (overrides: Partial<any> = {}) => ({
    id: 'vendor_123',
    name: 'Test Vendor',
    description: 'A test vendor',
    ownerId: 'user_123',
    lat: 40.7128,
    long: -74.0060,
    ...overrides,
  }),

  VendorResponse: (overrides: Partial<any> = {}) => ({
    vendor: grpcDataTypes.VendorData(),
    ...overrides,
  }),

  // Location service data types
  LocationData: (overrides: Partial<any> = {}) => ({
    userId: 'user_123',
    lat: 40.7128,
    long: -74.0060,
    accuracy: 10,
    timestamp: new Date().toISOString(),
    ...overrides,
  }),

  LocationResponse: (overrides: Partial<any> = {}) => ({
    location: grpcDataTypes.LocationData(),
    ...overrides,
  }),
}; 