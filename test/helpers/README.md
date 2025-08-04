# Test Utilities

This directory contains a unified test helper system that provides everything you need for testing in one place.

## 📁 Structure

```
test/helpers/
├── test-utils.ts         # Everything you need in one file
└── README.md             # This comprehensive guide
```

## 🚀 Quick Start

```typescript
import { 
  mockPrisma, 
  mockEvents, 
  mockGrpcClient,
  data,
  errors,
  webhooks,
  grpc,
  clearMocks 
} from '../../test/helpers/test-utils';

describe('MyService', () => {
  let service: MyService;
  let prisma: any;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new MyService(prisma);
  });

  afterEach(() => {
    clearMocks();
  });

  it('should create a user', async () => {
    const userData = data.user({ clerkId: 'test_user' });
    prisma.db.user.create.mockResolvedValue(userData);

    const result = await service.createUser('test_user');
    expect(result).toEqual(userData);
  });
});
```

## 📦 Available Helpers

### Mock Factories
- `mockPrisma()` - Mock Prisma service with all database methods
- `mockEvents()` - Mock Events service
- `mockGrpcClient()` - Mock gRPC client
- `mockRequest(overrides?)` - Mock HTTP request

### Sample Data
- `data.user(overrides?)` - User data factory
- `data.vendor(overrides?)` - Vendor data factory
- `data.integration(overrides?)` - Integration data factory

### Error Factories
- `errors.database(message?)` - Database error
- `errors.validation(message?)` - Validation error
- `errors.notFound(message?)` - Not found error
- `errors.unauthorized(message?)` - Unauthorized error

### Webhook Events
- `webhooks.clerk.userCreated(overrides?)` - Clerk user created event
- `webhooks.clerk.userDeleted(overrides?)` - Clerk user deleted event
- `webhooks.clerk.userUpdated(overrides?)` - Clerk user updated event
- `webhooks.revenueCat.initialPurchase(overrides?)` - RevenueCat initial purchase
- `webhooks.revenueCat.renewal(overrides?)` - RevenueCat renewal

### gRPC Helpers
- `grpc.success(value)` - Successful gRPC response
- `grpc.error(error)` - Error gRPC response
- `grpc.observable(value)` - gRPC observable (handles errors automatically)

### Utilities
- `clearMocks()` - Clear all mocks between tests

## 📝 Examples

### Testing a Service
```typescript
import { mockPrisma, data, errors, clearMocks } from '../../test/helpers/test-utils';

describe('UserService', () => {
  let service: UserService;
  let prisma: any;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new UserService(prisma);
  });

  afterEach(() => {
    clearMocks();
  });

  it('should create user successfully', async () => {
    const userData = data.user({ clerkId: 'test_user' });
    prisma.db.user.create.mockResolvedValue(userData);

    const result = await service.createUser('test_user');
    expect(result).toEqual(userData);
  });

  it('should handle database errors', async () => {
    const dbError = errors.database('Connection failed');
    prisma.db.user.create.mockRejectedValue(dbError);

    await expect(service.createUser('test_user')).rejects.toThrow('Connection failed');
  });
});
```

### Testing a gRPC Controller
```typescript
import { mockGrpcClient, grpc, mockRequest, clearMocks } from '../../test/helpers/test-utils';

describe('UserController', () => {
  let controller: UserController;
  let grpcClient: any;

  beforeEach(() => {
    grpcClient = mockGrpcClient();
    controller = new UserController(grpcClient);
  });

  afterEach(() => {
    clearMocks();
  });

  it('should return user vendors successfully', async () => {
    const mockResponse = { vendors: [] };
    grpcClient.invoke.mockReturnValue(grpc.success(mockResponse));

    const request = mockRequest({ userId: 'user_123' });
    const result = await controller.getUserVendors(request);
    expect(result).toEqual(mockResponse);
  });

  it('should handle gRPC errors', async () => {
    const mockError = new Error('gRPC error');
    grpcClient.invoke.mockReturnValue(grpc.error(mockError));

    const request = mockRequest({ userId: 'user_123' });
    await expect(controller.getUserVendors(request)).rejects.toThrow('gRPC error');
  });
});
```

### Testing a Webhook Controller
```typescript
import { mockGrpcClient, webhooks, clearMocks } from '../../test/helpers/test-utils';

describe('ClerkWebhooksController', () => {
  let controller: ClerkWebhooksController;
  let grpcClient: any;

  beforeEach(() => {
    grpcClient = mockGrpcClient();
    controller = new ClerkWebhooksController(grpcClient);
  });

  afterEach(() => {
    clearMocks();
  });

  it('should handle user.created event', async () => {
    const mockEvent = webhooks.clerk.userCreated({ id: 'test_user' });
    grpcClient.invoke.mockResolvedValue({ success: true });

    const result = await controller.handleClerkEvent(mockEvent);
    expect(result).toEqual({ success: true });
  });
});
```

## 🎯 Best Practices

1. **Import from test-utils.ts** - Everything you need is in one place
2. **Use factory functions** - `data.user()` instead of manual object creation
3. **Clear mocks** - Use `clearMocks()` in `afterEach`
4. **Use overrides** - `data.user({ clerkId: 'custom' })` for specific test data
5. **Keep tests simple** - Focus on behavior, not setup

## 🔄 Migration from Old System

If you have existing tests using the old complex helpers:

```typescript
// Old
import { createMockPrismaService, sampleData } from '../../test/helpers';

// New
import { mockPrisma, data } from '../../test/helpers/test-utils';

// Old
const mockPrisma = createMockPrismaService();
const userData = sampleData.user({ clerkId: 'test' });

// New
const prisma = mockPrisma();
const userData = data.user({ clerkId: 'test' });
```

## 📊 Why This Approach?

### Before (Complex System)
- **15+ files** across multiple directories
- **800+ lines** of complex abstractions
- **8+ import statements** per test file
- **30+ minutes** to learn the system
- **High maintenance** overhead

### After (Test Utils)
- **1 file** with everything you need
- **200 lines** of simple, focused code
- **1 import statement** per test file
- **5 minutes** to learn the system
- **Low maintenance** overhead

### Benefits
- ✅ **90% less complexity**
- ✅ **Faster development**
- ✅ **Easier maintenance**
- ✅ **Better developer experience**
- ✅ **Same functionality**

## 🎯 What We Removed

- Complex folder structure (4 directories → 1 file)
- TypeScript interfaces (75+ lines → simple objects)
- Dual testing approaches (pick one)
- Excessive gRPC mocking (160+ lines → 3 functions)
- NestJS testing modules (use direct instantiation)

The old system was over-engineered for our needs. This simplified approach gives us everything we need without the overhead. 🎉