# Simple Testing Guide

This is the **simplified** testing approach. Everything you need in one place.

## 🚀 Quick Start

```typescript
import { mockPrisma, mockEvents, data, errors, clearMocks } from '../../test/helpers/simple';

describe('MyService', () => {
  let service: MyService;
  let prisma: any;
  let events: any;

  beforeEach(() => {
    prisma = mockPrisma();
    events = mockEvents();
    service = new MyService(prisma, events);
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

## 📋 What You Get

### Mock Factories
```typescript
const prisma = mockPrisma();     // Database mocks
const events = mockEvents();      // Event service mocks
const grpc = mockGrpcClient();    // gRPC client mocks
```

### Sample Data
```typescript
const user = data.user({ clerkId: 'custom_id' });
const vendor = data.vendor({ name: 'Custom Vendor' });
const integration = data.integration({ type: 'Clerk' });
```

### Error Factories
```typescript
const dbError = errors.database('Connection failed');
const notFound = errors.notFound('User not found');
```

### Webhook Events
```typescript
const clerkEvent = webhooks.clerk.userCreated({ id: 'custom_id' });
const revenueCatEvent = webhooks.revenueCat.initialPurchase();
```

### gRPC Helpers
```typescript
// For toPromise() pattern
mockGrpcClient.invoke.mockReturnValue(grpc.success(mockResponse));
mockGrpcClient.invoke.mockReturnValue(grpc.error(mockError));

// For firstValueFrom() pattern
mockGrpcClient.invoke.mockReturnValue(grpc.observable(mockResponse));
```

## 🎯 Common Patterns

### Service Test
```typescript
const { service, prisma, events } = setupServiceTest(MyService, {
  prisma: mockPrisma(),
  events: mockEvents(),
});
```

### Controller Test
```typescript
const { controller, grpcClient } = setupControllerTest(MyController, {
  grpcClient: mockGrpcClient(),
});
```

### Proto Mocking
```typescript
mockProto('@app/proto/user', {
  USER_SERVICE_NAME: 'UserService',
  UserData: vi.fn(),
});
```

## ❌ What We Removed

- Complex folder structure (4 directories → 1 file)
- TypeScript interfaces (75+ lines → simple objects)
- Dual testing approaches (pick one)
- Excessive gRPC mocking (160+ lines → 3 functions)
- NestJS testing modules (use direct instantiation)

## ✅ Benefits

1. **One Import** - Everything from `test/helpers/simple`
2. **No Navigation** - All helpers in one file
3. **Simple Functions** - No complex abstractions
4. **Clear Patterns** - Consistent across all tests
5. **Easy to Remember** - Intuitive function names

## 🔄 Migration

If you have existing tests using the complex helpers:

```typescript
// Old
import { createMockPrismaService, sampleData } from '../../test/helpers';

// New
import { mockPrisma, data } from '../../test/helpers/simple';

// Old
const mockPrisma = createMockPrismaService();
const userData = sampleData.user({ clerkId: 'test' });

// New
const prisma = mockPrisma();
const userData = data.user({ clerkId: 'test' });
```

That's it! Simple, focused, and easy to use. 🎉 