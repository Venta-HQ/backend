# 🧪 Testing Strategy

## 📋 Table of Contents

- [Overview](#overview)
- [Testing Philosophy](#testing-philosophy)
- [Testing Levels](#testing-levels)
- [DDD Testing Patterns](#ddd-testing-patterns)
- [Testing Tools and Configuration](#testing-tools-and-configuration)
- [Testing Best Practices](#testing-best-practices)
- [Continuous Integration](#continuous-integration)
- [Quality Gates](#quality-gates)

## 🎯 Overview

This document outlines the **comprehensive testing strategy** for the Venta Backend project. A robust testing approach ensures code quality, reliability, and maintainability across all DDD-aligned services.

## 🧠 Testing Philosophy

### **Principles**

| Principle | Description | Benefit |
|-----------|-------------|---------|
| **Domain-Driven Testing** | Tests align with business domains and use cases | Ensures business value and domain logic correctness |
| **Test-Driven Development (TDD)** | Write tests before implementation when possible | Ensures code is designed for testability |
| **Comprehensive Coverage** | Aim for high test coverage across all critical paths | Reduces bugs and improves reliability |
| **Fast Feedback** | Tests should run quickly to provide immediate feedback | Enables rapid development cycles |
| **Maintainable Tests** | Tests should be easy to understand and maintain | Reduces technical debt |
| **Realistic Testing** | Tests should reflect real-world usage scenarios | Ensures tests are meaningful |

### **Testing Pyramid**

```
        /\
       /  \     E2E Tests (Few)
      /____\    
     /      \   Integration Tests (Some)
    /________\  
   /          \ Unit Tests (Many)
  /____________\
```

## 📊 Testing Levels

### **1. Unit Tests**

**🎯 Purpose**: Test individual functions, methods, and classes in isolation.

**📈 Coverage**: 80%+ code coverage for business logic.

**🛠️ Tools**: Vitest, Jest

#### **Example: Domain Service Unit Test**

```typescript
describe('UserService', () => {
  let service: UserService;
  let mockPrisma: jest.Mocked<PrismaService>;
  let mockEventService: jest.Mocked<EventService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: createMockPrismaService(),
        },
        {
          provide: EventService,
          useValue: createMockEventService(),
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    mockPrisma = module.get(PrismaService);
    mockEventService = module.get(EventService);
  });

  describe('registerUser', () => {
    it('should register user successfully', async () => {
      const registrationData = {
        clerkId: 'clerk_123',
        source: 'web' as const,
      };

      const mockUser = {
        id: 'user_123',
        clerkId: 'clerk_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.db.user.create.mockResolvedValue(mockUser);

      const result = await service.registerUser(registrationData);

      expect(result).toEqual(mockUser);
      expect(mockPrisma.db.user.create).toHaveBeenCalledWith({
        data: { clerkId: 'clerk_123' },
      });
    });

    it('should throw AppError on database failure', async () => {
      const registrationData = {
        clerkId: 'clerk_123',
        source: 'web' as const,
      };

      mockPrisma.db.user.create.mockRejectedValue(new Error('Database error'));

      await expect(service.registerUser(registrationData)).rejects.toThrow(AppError);
    });
  });
});
```

### **2. Integration Tests**

**🎯 Purpose**: Test interactions between components and external dependencies.

**📈 Coverage**: Critical integration paths and domain boundaries.

**🛠️ Tools**: Vitest, TestContainers

#### **Example: Domain Integration Test**

```typescript
describe('UserManagement Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [UserManagementModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterEach(async () => {
    await prisma.db.user.deleteMany();
    await app.close();
  });

  it('should create user and emit event', async () => {
    const userData = {
      clerkId: 'clerk_123',
      source: 'web' as const,
    };

    const response = await request(app.getHttpServer())
      .post('/users/register')
      .send(userData)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.clerkId).toBe('clerk_123');

    // Verify user was created in database
    const user = await prisma.db.user.findUnique({
      where: { id: response.body.id },
    });
    expect(user).toBeTruthy();
  });
});
```

### **3. End-to-End Tests**

**🎯 Purpose**: Test complete user workflows across multiple services.

**📈 Coverage**: Critical user journeys and cross-domain interactions.

**🛠️ Tools**: Playwright, Cypress

#### **Example: Cross-Domain E2E Test**

```typescript
describe('Vendor Onboarding Flow', () => {
  it('should complete vendor onboarding workflow', async () => {
    // 1. User registration
    const user = await registerUser({
      clerkId: 'clerk_123',
      source: 'web',
    });

    // 2. Vendor onboarding
    const vendor = await onboardVendor({
      name: 'Test Vendor',
      ownerId: user.id,
      location: { lat: 40.7128, long: -74.0060 },
    });

    // 3. Verify location tracking
    const location = await getVendorLocation(vendor.id);
    expect(location).toEqual({ lat: 40.7128, long: -74.0060 });

    // 4. Verify search indexing
    const searchResults = await searchVendors({ lat: 40.7128, long: -74.0060, radius: 1000 });
    expect(searchResults).toContainEqual(expect.objectContaining({ id: vendor.id }));
  });
});
```

## 🏛️ DDD Testing Patterns

### **Domain Service Testing**

```typescript
describe('VendorService', () => {
  let service: VendorService;
  let mockPrisma: jest.Mocked<PrismaService>;
  let mockEventService: jest.Mocked<EventService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        VendorService,
        {
          provide: PrismaService,
          useValue: createMockPrismaService(),
        },
        {
          provide: EventService,
          useValue: createMockEventService(),
        },
      ],
    }).compile();

    service = module.get<VendorService>(VendorService);
    mockPrisma = module.get(PrismaService);
    mockEventService = module.get(EventService);
  });

  describe('onboardVendor', () => {
    it('should onboard vendor and emit event', async () => {
      const onboardingData = {
        name: 'Test Vendor',
        ownerId: 'user_123',
      };

      const mockVendor = {
        id: 'vendor_123',
        name: 'Test Vendor',
        ownerId: 'user_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.db.vendor.create.mockResolvedValue(mockVendor);

      const result = await service.onboardVendor(onboardingData);

      expect(result).toBe('vendor_123');
      expect(mockPrisma.db.vendor.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Vendor',
          ownerId: 'user_123',
        },
      });
      expect(mockEventService.emit).toHaveBeenCalledWith('vendor.created', {
        id: 'vendor_123',
        name: 'Test Vendor',
        ownerId: 'user_123',
        timestamp: expect.any(Date),
      });
    });

    it('should throw AppError on database failure', async () => {
      const onboardingData = {
        name: 'Test Vendor',
        ownerId: 'user_123',
      };

      mockPrisma.db.vendor.create.mockRejectedValue(new Error('Database error'));

      await expect(service.onboardVendor(onboardingData)).rejects.toThrow(AppError);
    });
  });
});
```

### **Event Testing**

```typescript
describe('Event Handling', () => {
  let controller: VendorEventsController;
  let mockSearchService: jest.Mocked<SearchService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        VendorEventsController,
        {
          provide: SearchService,
          useValue: createMockSearchService(),
        },
      ],
    }).compile();

    controller = module.get<VendorEventsController>(VendorEventsController);
    mockSearchService = module.get(SearchService);
  });

  it('should handle vendor.created event', async () => {
    const eventData = {
      id: 'vendor_123',
      name: 'Test Vendor',
      ownerId: 'user_123',
      timestamp: new Date(),
    };

    await controller.handleVendorCreated(eventData);

    expect(mockSearchService.indexVendor).toHaveBeenCalledWith('vendor_123');
  });
});
```

### **Error Handling Testing**

```typescript
describe('Error Handling', () => {
  let service: LocationService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [LocationService],
    }).compile();

    service = module.get<LocationService>(LocationService);
  });

  it('should throw validation error for invalid coordinates', async () => {
    const invalidData = {
      entityId: 'vendor_123',
      lat: 91, // Invalid latitude
      long: 0,
    };

    await expect(service.updateVendorLocation(invalidData)).rejects.toThrow(AppError);
    await expect(service.updateVendorLocation(invalidData)).rejects.toMatchObject({
      type: ErrorType.VALIDATION,
      code: ErrorCodes.LOCATION_INVALID_LATITUDE,
    });
  });

  it('should throw not found error for non-existent vendor', async () => {
    const data = {
      entityId: 'non-existent',
      lat: 40.7128,
      long: -74.0060,
    };

    await expect(service.updateVendorLocation(data)).rejects.toThrow(AppError);
    await expect(service.updateVendorLocation(data)).rejects.toMatchObject({
      type: ErrorType.NOT_FOUND,
      code: ErrorCodes.VENDOR_NOT_FOUND,
    });
  });
});
```

## 🛠️ Testing Tools and Configuration

### **Vitest Configuration**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.spec.ts',
        '**/*.test.ts',
      ],
    },
  },
});
```

### **Test Setup**

```typescript
// test/setup.ts
import { Test } from '@nestjs/testing';
import { PrismaService } from '@app/nest/modules/data/prisma';
import { EventService } from '@app/nest/modules/messaging/events';

export function createMockPrismaService() {
  return {
    db: {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      vendor: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    },
  };
}

export function createMockEventService() {
  return {
    emit: jest.fn(),
    subscribe: jest.fn(),
  };
}
```

### **Test Utilities**

```typescript
// test/helpers/test-utils.ts
import { AppError, ErrorType, ErrorCodes } from '@app/nest/errors';

export function expectAppError(error: unknown, type: ErrorType, code: string) {
  expect(error).toBeInstanceOf(AppError);
  expect((error as AppError).type).toBe(type);
  expect((error as AppError).code).toBe(code);
}

export function createTestUser(overrides = {}) {
  return {
    id: 'user_123',
    clerkId: 'clerk_123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestVendor(overrides = {}) {
  return {
    id: 'vendor_123',
    name: 'Test Vendor',
    ownerId: 'user_123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
```

## ✅ Testing Best Practices

### **1. Test Structure**

```typescript
describe('DomainService', () => {
  // Arrange
  let service: DomainService;
  let dependencies: MockDependencies;

  beforeEach(async () => {
    // Setup
  });

  afterEach(async () => {
    // Cleanup
  });

  describe('methodName', () => {
    it('should do something when condition', async () => {
      // Arrange
      const input = createTestInput();
      const expectedOutput = createExpectedOutput();

      // Act
      const result = await service.methodName(input);

      // Assert
      expect(result).toEqual(expectedOutput);
    });

    it('should throw error when invalid input', async () => {
      // Arrange
      const invalidInput = createInvalidInput();

      // Act & Assert
      await expect(service.methodName(invalidInput)).rejects.toThrow(AppError);
    });
  });
});
```

### **2. Mock Management**

```typescript
// Use consistent mock patterns
const mockPrisma = {
  db: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
};

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Verify mock calls
expect(mockPrisma.db.user.create).toHaveBeenCalledWith({
  data: expect.objectContaining({
    clerkId: 'clerk_123',
  }),
});
```

### **3. Error Testing**

```typescript
// Test specific error types and codes
it('should throw validation error for invalid email', async () => {
  const invalidData = { email: 'invalid-email' };

  await expect(service.createUser(invalidData)).rejects.toMatchObject({
    type: ErrorType.VALIDATION,
    code: ErrorCodes.VALIDATION_ERROR,
    message: expect.stringContaining('email'),
  });
});

// Test error context
it('should include context in error', async () => {
  const data = { clerkId: 'clerk_123' };

  try {
    await service.createUser(data);
  } catch (error) {
    expect(error.context).toMatchObject({
      clerkId: 'clerk_123',
      operation: 'create_user',
    });
  }
});
```

### **4. Integration Testing**

```typescript
// Test domain boundaries
describe('User-Vendor Integration', () => {
  it('should create user and vendor relationship', async () => {
    const user = await userService.createUser(userData);
    const vendor = await vendorService.createVendor({
      ...vendorData,
      ownerId: user.id,
    });

    expect(vendor.ownerId).toBe(user.id);
  });
});

// Test event-driven communication
describe('Event-Driven Integration', () => {
  it('should emit event when user is created', async () => {
    const user = await userService.createUser(userData);

    expect(mockEventService.emit).toHaveBeenCalledWith('user.created', {
      id: user.id,
      clerkId: user.clerkId,
      timestamp: expect.any(Date),
    });
  });
});
```

## 🔄 Continuous Integration

### **GitHub Actions Workflow**

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x]

    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'pnpm'

    - name: Install dependencies
      run: pnpm install

    - name: Run linting
      run: pnpm run lint

    - name: Run unit tests
      run: pnpm run test:unit

    - name: Run integration tests
      run: pnpm run test:integration

    - name: Generate coverage report
      run: pnpm run test:coverage

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

### **Test Scripts**

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest --config vitest.unit.config.ts",
    "test:integration": "vitest --config vitest.integration.config.ts",
    "test:e2e": "vitest --config vitest.e2e.config.ts",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch",
    "test:run": "vitest run"
  }
}
```

## 🎯 Quality Gates

### **Coverage Requirements**

| Test Type | Minimum Coverage | Target Coverage |
|-----------|------------------|-----------------|
| **Unit Tests** | 70% | 80% |
| **Integration Tests** | 50% | 70% |
| **E2E Tests** | 20% | 40% |

### **Performance Requirements**

| Metric | Requirement |
|--------|-------------|
| **Test Execution Time** | < 2 minutes for unit tests |
| **Integration Test Time** | < 5 minutes |
| **E2E Test Time** | < 10 minutes |

### **Quality Checks**

```yaml
# .github/workflows/quality.yml
name: Quality Check

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'pnpm'

    - name: Install dependencies
      run: pnpm install

    - name: Run linting
      run: pnpm run lint

    - name: Run type checking
      run: pnpm run type-check

    - name: Run tests
      run: pnpm run test:run

    - name: Check coverage
      run: pnpm run test:coverage

    - name: Verify coverage threshold
      run: |
        if [ $(grep -o '[0-9.]*%' coverage/coverage-summary.json | head -1 | sed 's/%//') -lt 80 ]; then
          echo "Coverage below 80%"
          exit 1
        fi
```

---

**This testing strategy ensures comprehensive coverage of the DDD-aligned Venta backend with proper error handling, event testing, and domain-specific test patterns.** 