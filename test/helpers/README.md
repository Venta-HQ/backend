# Test Helpers

This directory contains reusable test utilities and helpers organized by functionality.

## 📁 Structure

```
test/helpers/
├── index.ts              # Main export file
├── mocks/                # Mock factories and interfaces
│   ├── index.ts
│   ├── interfaces.ts     # Mock service interfaces
│   └── factories.ts      # Mock factory functions
├── setup/                # Test setup utilities
│   ├── index.ts
│   ├── context.ts        # Context mocks (HTTP, gRPC, WebSocket)
│   ├── environment.ts    # Environment setup
│   ├── assertions.ts     # Common assertions
│   ├── generators.ts     # Data generators
│   └── nest-testing.ts   # NestJS testing utilities
├── grpc/                 # gRPC-specific utilities
│   ├── index.ts
│   ├── mocks.ts          # gRPC mock utilities
│   └── data-types.ts     # gRPC data types
├── data/                 # Test data utilities
│   ├── index.ts
│   ├── sample-data.ts    # Sample data factories
│   └── errors.ts         # Error factories
└── utilities.ts          # Common utilities
```

## 🚀 Quick Start

### Unit Testing (Recommended for most cases)

```typescript
import { 
  createMockPrismaService, 
  createMockEventsService, 
  sampleData,
  setupGrpcMocks 
} from '../../test/helpers';

// Set up gRPC mocks
setupGrpcMocks();

describe('MyService', () => {
  let service: MyService;
  let mockPrisma: any;
  let mockEvents: any;

  beforeEach(() => {
    mockPrisma = createMockPrismaService();
    mockEvents = createMockEventsService();
    service = new MyService(mockPrisma, mockEvents);
  });

  it('should create a user', async () => {
    const userData = sampleData.user({ clerkId: 'test_user' });
    mockPrisma.db.user.create.mockResolvedValue(userData);

    const result = await service.createUser('test_user');
    expect(result).toEqual(userData);
  });
});
```

### Integration Testing (For complex DI scenarios)

```typescript
import { 
  nestTesting,
  createMockPrismaService,
  sampleData 
} from '../../test/helpers';

describe('MyService Integration', () => {
  let module: TestingModule;
  let service: MyService;

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();
    
    const { module: testModule, service: testService } = await nestTesting.createServiceTest(
      MyService,
      {
        PrismaService: mockPrisma,
        EventsService: createMockEventsService(),
      }
    );
    
    module = testModule;
    service = testService;
  });

  afterEach(async () => {
    await module.close();
  });

  it('should work with full DI container', async () => {
    // Test with actual dependency injection
  });
});
```

## 🎯 When to Use Each Approach

### Use Direct Instantiation (Unit Tests) ✅
- **Services** - Testing business logic
- **Controllers** - Testing request/response handling
- **Simple Components** - Few dependencies
- **Fast Feedback** - During development
- **Isolation** - Testing one component at a time

### Use NestJS Testing (Integration Tests) 🔄
- **Guards** - Need ExecutionContext
- **Interceptors** - Need request/response objects
- **Complex DI** - Custom providers, factories
- **Module Integration** - Testing how modules work together
- **End-to-End** - Testing complete workflows

## 📦 Available Helpers

### Mocks (`mocks/`)
- `createMockPrismaService()` - Mock PrismaService
- `createMockEventsService()` - Mock EventsService
- `createMockRedisService()` - Mock RedisService
- `createMockClerkService()` - Mock ClerkService

### Setup (`setup/`)
- `createMockExecutionContext()` - Mock ExecutionContext
- `createMockRequest()` / `createMockResponse()` - HTTP mocks
- `createMockWebSocketClient()` - WebSocket mocks
- `testEnv.setup()` / `testEnv.cleanup()` - Environment setup
- `assertions.*` - Common assertions
- `generators.*` - Data generators
- `nestTesting.*` - NestJS testing utilities

### gRPC (`grpc/`)
- `setupGrpcMocks()` - Set up gRPC mocks
- `createMockGrpcCall()` - Mock gRPC call
- `grpcDataTypes.*` - gRPC data types
- `createGrpcControllerTest()` - Create gRPC controller test setup
- `createGrpcObservable()` / `createGrpcObservableError()` - Mock gRPC observables
- `setupProtoMocks()` - Set up proto import mocks
- `grpcControllerTesting.*` - Common gRPC controller test patterns

### Data (`data/`)
- `sampleData.*` - Sample data factories
- `errors.*` - Error factories
- `webhookEvents.*` - Webhook event factories
- `createClerkWebhookEvent()` - Create Clerk webhook events
- `createRevenueCatWebhookEvent()` - Create RevenueCat webhook events

### Utilities (`utilities.ts`)
- `clearAllMocks()` - Clear all mocks
- `resetAllMocks()` - Reset all mocks
- `timing.*` - Timing utilities

## 🎯 Best Practices

1. **Use factory functions** instead of manual mock creation
2. **Use sample data** with overrides for consistent test data
3. **Clear mocks** between tests with `clearAllMocks()`
4. **Use descriptive test names** that explain the behavior
5. **Import from the main index** for convenience
6. **Choose the right approach** - Unit tests for isolation, Integration tests for DI

## 📝 Examples

### Testing a Service (Unit Test)
```typescript
import { 
  createMockPrismaService, 
  createMockEventsService, 
  sampleData,
  errors 
} from '../../test/helpers';

describe('UserService', () => {
  let service: UserService;
  let mockPrisma: any;
  let mockEvents: any;

  beforeEach(() => {
    mockPrisma = createMockPrismaService();
    mockEvents = createMockEventsService();
    service = new UserService(mockPrisma, mockEvents);
  });

  it('should create user and emit event', async () => {
    const userData = sampleData.user({ clerkId: 'test_user' });
    mockPrisma.db.user.create.mockResolvedValue(userData);

    const result = await service.createUser('test_user');
    expect(result).toEqual(userData);
  });
});
```

### Testing a Guard (Integration Test)
```typescript
import { 
  nestTesting,
  createMockClerkService,
  createMockPrismaService,
  createMockExecutionContext 
} from '../../test/helpers';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let module: TestingModule;

  beforeEach(async () => {
    const { module: testModule, guard: testGuard } = await nestTesting.createGuardTest(
      AuthGuard,
      {
        ClerkService: createMockClerkService(),
        PrismaService: createMockPrismaService(),
      }
    );
    
    module = testModule;
    guard = testGuard;
  });

  afterEach(async () => {
    await module.close();
  });

  it('should allow access with valid token', async () => {
    const context = createMockExecutionContext({
      switchToHttp: () => ({ 
        getRequest: () => ({ headers: { authorization: 'Bearer valid_token' } })
      })
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });
});
```

### Testing a gRPC Controller (Unit Test)
```typescript
import { 
  grpcControllerTesting,
  createGrpcObservable,
  setupProtoMocks 
} from '../../test/helpers';

// Set up proto mocks
setupProtoMocks('@app/proto/user', ['UserVendorData', 'UserVendorsResponse']);

describe('UserController', () => {
  let controller: UserController;
  let mockGrpcClient: any;

  beforeEach(() => {
    const test = grpcControllerTesting.createTest(UserController, '@app/proto/user');
    controller = test.controller;
    mockGrpcClient = test.mockGrpcClient;
  });

  it('should return user vendors successfully', async () => {
    const mockResponse = { vendors: [] };
    mockGrpcClient.invoke.mockReturnValue(createGrpcObservable(mockResponse));

    const result = await controller.getUserVendors(mockRequest);
    expect(result).toEqual(mockResponse);
  });
});
```

### Testing a Webhook Controller (Unit Test)
```typescript
import { 
  webhookEvents,
  grpcControllerTesting 
} from '../../test/helpers';

describe('ClerkWebhooksController', () => {
  let controller: ClerkWebhooksController;
  let mockGrpcClient: any;

  beforeEach(() => {
    const test = grpcControllerTesting.createTest(ClerkWebhooksController);
    controller = test.controller;
    mockGrpcClient = test.mockGrpcClient;
  });

  it('should handle user.created event', async () => {
    const mockEvent = webhookEvents.clerk.userCreated({ id: 'test_user' });
    mockGrpcClient.invoke.mockResolvedValue({ success: true });

    const result = await controller.handleClerkEvent(mockEvent);
    expect(result).toEqual({ success: true });
  });
});
```