# 🧪 Testing Strategy

## 📋 Table of Contents

- [Overview](#overview)
- [Testing Philosophy](#testing-philosophy)
- [Testing Levels](#testing-levels)
- [Testing Tools and Configuration](#testing-tools-and-configuration)
- [Testing Best Practices](#testing-best-practices)
- [Continuous Integration](#continuous-integration)
- [Quality Gates](#quality-gates)

## 🎯 Overview

This document outlines the **comprehensive testing strategy** for the Venta Backend project. A robust testing approach ensures code quality, reliability, and maintainability across all services.

## 🧠 Testing Philosophy

### **Principles**

| Principle | Description | Benefit |
|-----------|-------------|---------|
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

#### **Example: UserService Unit Test**

```typescript
describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createUser', () => {
    it('should handle Clerk user creation successfully', async () => {
      const clerkData = { id: 'clerk_user_123' };
      const expectedResponse = { message: 'User created successfully' };

      const result = await service.handleClerkUserCreated(clerkData);

      expect(result).toEqual(expectedResponse);
    });

    it('should throw error when webhook processing fails', async () => {
      const clerkData = { id: 'clerk_user_123' };

      jest.spyOn(service, 'handleClerkUserCreated').mockRejectedValue(
        new Error('Webhook processing failed')
      );

      await expect(service.handleClerkUserCreated(clerkData)).rejects.toThrow(
        'Webhook processing failed'
      );
    });
  });
});
```

### **2. Integration Tests**

**🎯 Purpose**: Test interactions between components and external dependencies.

**📈 Coverage**: Database operations, external API calls, service interactions.

**🛠️ Tools**: Vitest, TestContainers, Prisma

#### **Example: UserController Integration Test**

```typescript
describe('UserController (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  beforeEach(async () => {
    // Clean database before each test
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /users/webhook/clerk', () => {
    it('should handle Clerk webhook', async () => {
      const clerkData = { id: 'clerk_user_123' };

      const response = await request(app.getHttpServer())
        .post('/users/webhook/clerk')
        .send(clerkData)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'User created successfully',
      });
    });

    it('should return 400 for invalid webhook data', async () => {
      const invalidData = { id: '' };

      await request(app.getHttpServer())
        .post('/users/webhook/clerk')
        .send(invalidData)
        .expect(400);
    });
  });
});
```

### **3. End-to-End Tests**

**🎯 Purpose**: Test complete user workflows and system integration.

**📈 Coverage**: Critical user journeys, cross-service communication.

**🛠️ Tools**: Playwright, Cypress, Supertest

#### **Example: Complete User Registration Flow**

```typescript
describe('User Registration Flow (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should handle webhook flow successfully', async () => {
    // 1. Handle Clerk user creation webhook
    const clerkResponse = await request(app.getHttpServer())
      .post('/users/webhook/clerk')
      .send({
        id: 'clerk_user_123',
      })
      .expect(200);

    expect(clerkResponse.body.message).toBe('User created successfully');

    // 2. Handle RevenueCat subscription webhook
    const subscriptionResponse = await request(app.getHttpServer())
      .post('/users/webhook/revenuecat')
      .send({
        clerkUserId: 'clerk_user_123',
        providerId: 'provider_123',
      })
      .expect(200);

    expect(subscriptionResponse.body.message).toBe('Subscription created successfully');
  });
});
```

### **4. Performance Tests**

**🎯 Purpose**: Ensure system performance under load.

**📈 Coverage**: Response times, throughput, resource usage.

**🛠️ Tools**: Artillery, k6, Apache Bench

#### **Example: Load Test for User Creation**

```javascript
// test/load/user-creation.yml
config:
  target: 'http://localhost:5002'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"

scenarios:
  - name: "Create users"
    weight: 100
    flow:
      - post:
          url: "/users"
          json:
            name: "{{ $randomString() }}"
            email: "{{ $randomEmail() }}"
          capture:
            - json: "$.id"
              as: "userId"
      - get:
          url: "/users/{{ userId }}"
```

## ⚙️ Testing Tools and Configuration

### **1. Test Runner Setup**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

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
  resolve: {
    alias: {
      '@venta': resolve(__dirname, './libs'),
    },
  },
});
```

### **2. Test Utilities**

```typescript
// test/helpers/test-utils.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@venta/nest/modules/prisma';

export class TestUtils {
  static async createTestingModule(providers: any[]): Promise<TestingModule> {
    return Test.createTestingModule({
      providers: [
        ...providers,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            vendor: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();
  }

  static createMockUser(overrides = {}) {
    return {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createMockVendor(overrides = {}) {
    return {
      id: 'vendor-1',
      name: 'Test Vendor',
      email: 'vendor@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }
}
```

### **3. Database Testing**

```typescript
// test/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Setup test database
  await prisma.$connect();
});

beforeEach(async () => {
  // Clean database before each test
  await prisma.user.deleteMany();
  await prisma.vendor.deleteMany();
  // Add other cleanup as needed
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

## 🎯 Testing Best Practices

### **1. Test Organization**

```typescript
// Organize tests by feature/domain
describe('User Management', () => {
  describe('UserService', () => {
    describe('createUser', () => {
      it('should create user with valid data', () => {});
      it('should throw error for duplicate email', () => {});
      it('should validate required fields', () => {});
    });

    describe('updateUser', () => {
      it('should update user successfully', () => {});
      it('should throw error for non-existent user', () => {});
    });
  });

  describe('UserController', () => {
    describe('POST /users', () => {
      it('should create user via API', () => {});
      it('should return 400 for invalid data', () => {});
    });
  });
});
```

### **2. Test Data Management**

```typescript
// Use factories for test data
export class UserFactory {
  static create(overrides = {}) {
    return {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  static createMany(count: number, overrides = {}) {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}
```

### **3. Mocking Strategies**

```typescript
// Mock external dependencies
describe('UserService with external dependencies', () => {
  let service: UserService;
  let emailService: EmailService;
  let notificationService: NotificationService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: EmailService,
          useValue: {
            sendWelcomeEmail: jest.fn(),
            sendVerificationEmail: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            sendPushNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    emailService = module.get<EmailService>(EmailService);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  it('should send welcome email when user is created', async () => {
    const userData = { name: 'John Doe', email: 'john@example.com' };
    const createdUser = { id: '1', ...userData };

    jest.spyOn(emailService, 'sendWelcomeEmail').mockResolvedValue(undefined);

    await service.createUser(userData);

    expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(createdUser);
  });
});
```

### **4. Error Testing**

```typescript
// Test error scenarios
describe('Error handling', () => {
  it('should handle database connection errors', async () => {
    jest.spyOn(prisma.user, 'create').mockRejectedValue(
      new Error('Connection failed')
    );

    await expect(service.createUser(userData)).rejects.toThrow(
      'Database connection failed'
    );
  });

  it('should handle validation errors', async () => {
    const invalidData = { name: '', email: 'invalid-email' };

    await expect(service.createUser(invalidData)).rejects.toThrow(
      'Validation failed'
    );
  });
});
```

## 🔄 Continuous Integration

### **1. Test Pipeline**

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: venta_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run tests
        run: pnpm run test:run
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/venta_test
          REDIS_URL: redis://localhost:6379
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### **2. Test Commands**

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:watch": "vitest --watch",
    "test:e2e": "playwright test",
    "test:load": "artillery run test/load/gateway-load-test.yml"
  }
}
```

## 🎯 Quality Gates

### **1. Coverage Requirements**

| Test Type | Minimum Coverage | Target Coverage |
|-----------|------------------|-----------------|
| **Unit Tests** | 80% | 90% |
| **Integration Tests** | Critical paths covered | All service boundaries |
| **E2E Tests** | Core user journeys covered | All major workflows |

### **2. Performance Benchmarks**

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Response Time** | < 200ms for 95th percentile | API response times |
| **Throughput** | > 1000 requests/second | Requests per second |
| **Error Rate** | < 1% under normal load | Error percentage |

### **3. Code Quality**

| Metric | Requirement | Tool |
|--------|-------------|------|
| **Linting** | All linting rules must pass | ESLint |
| **Type Safety** | No TypeScript errors | TypeScript compiler |
| **Security** | No security vulnerabilities | npm audit |

## 📊 Test Metrics and Reporting

### **Coverage Reports**

```bash
# Generate coverage report
pnpm run test:coverage

# View coverage in browser
open coverage/index.html
```

### **Test Performance**

| Metric | Target | Current |
|--------|--------|---------|
| **Unit Test Execution** | < 30 seconds | ~25 seconds |
| **Integration Test Execution** | < 2 minutes | ~1.5 minutes |
| **E2E Test Execution** | < 5 minutes | ~4 minutes |
| **Full Test Suite** | < 10 minutes | ~8 minutes |

### **Test Reliability**

| Metric | Target | Current |
|--------|--------|---------|
| **Flaky Test Rate** | < 1% | ~0.5% |
| **Test Failure Rate** | < 5% | ~2% |
| **Test Maintenance** | < 2 hours/week | ~1 hour/week |

## 🔧 Test Environment Setup

### **Local Development**

```bash
# Run all tests
pnpm run test:run

# Run tests in watch mode
pnpm run test:watch

# Run specific test file
pnpm run test:run -- user.service.spec.ts

# Run tests with coverage
pnpm run test:coverage
```

### **CI/CD Pipeline**

```yaml
# Test stages in CI
stages:
  - lint
  - unit-tests
  - integration-tests
  - e2e-tests
  - performance-tests
  - security-scan
```

## 🎯 Test Strategy Summary

### **Testing Approach**

| Level | Purpose | Tools | Frequency |
|-------|---------|-------|-----------|
| **Unit Tests** | Test individual components | Vitest, Jest | Every commit |
| **Integration Tests** | Test service interactions | Vitest, TestContainers | Every commit |
| **E2E Tests** | Test complete workflows | Playwright, Cypress | Every PR |
| **Performance Tests** | Test system performance | Artillery, k6 | Weekly |
| **Security Tests** | Test security vulnerabilities | npm audit, OWASP ZAP | Every PR |

### **Quality Assurance**

- ✅ **Automated testing** for all code changes
- ✅ **Comprehensive coverage** across all critical paths
- ✅ **Fast feedback** for developers
- ✅ **Reliable tests** with minimal flakiness
- ✅ **Performance monitoring** for system health

---

**This comprehensive testing strategy ensures high code quality, reliability, and maintainability across the Venta Backend project.** 