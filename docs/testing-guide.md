# 🧪 Testing Guide

## Overview

This guide outlines testing patterns and practices for the Venta backend. We use Vitest as our test runner and follow domain-driven testing principles.

## 📋 Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [E2E Testing](#e2e-testing)
5. [Test Helpers](#test-helpers)
6. [Best Practices](#best-practices)

## Testing Strategy

### Test Types

1. **Unit Tests**

   - Test individual components
   - Mock dependencies
   - Fast execution

2. **Integration Tests**

   - Test component interactions
   - Test domain boundaries
   - Use test databases

3. **E2E Tests**
   - Test complete flows
   - Real external services
   - Full system testing

### Test Organization

```
service/
├── src/
│   ├── features/
│   │   └── feature.ts
│   └── service.ts
└── test/
    ├── unit/
    │   └── feature.spec.ts
    ├── integration/
    │   └── feature.integration.spec.ts
    └── e2e/
        └── feature.e2e.spec.ts
```

## Unit Testing

### Service Testing

```typescript
// vendor.service.spec.ts
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

	describe('updateLocation', () => {
		it('should update vendor location', async () => {
			const vendorId = 'vendor-123';
			const location = { lat: 40.7128, lng: -74.006 };

			await service.updateLocation(vendorId, location);

			expect(mockPrisma.db.vendor.update).toHaveBeenCalledWith({
				where: { id: vendorId },
				data: { location },
			});

			expect(mockEventService.emit).toHaveBeenCalledWith(
				'marketplace.vendor.location_updated',
				expect.objectContaining({
					vendorId,
					location,
				}),
			);
		});

		it('should validate location data', async () => {
			const vendorId = 'vendor-123';
			const invalidLocation = { lat: 100, lng: -74.006 };

			await expect(service.updateLocation(vendorId, invalidLocation)).rejects.toThrow(AppError);
		});
	});
});
```

### Controller Testing

```typescript
// vendor.controller.spec.ts
describe('VendorController', () => {
	let controller: VendorController;
	let mockVendorService: jest.Mocked<VendorService>;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			controllers: [VendorController],
			providers: [
				{
					provide: VendorService,
					useValue: createMockVendorService(),
				},
			],
		}).compile();

		controller = module.get<VendorController>(VendorController);
		mockVendorService = module.get(VendorService);
	});

	describe('updateLocation', () => {
		it('should update vendor location', async () => {
			const vendorId = 'vendor-123';
			const location = { lat: 40.7128, lng: -74.006 };

			await controller.updateLocation(vendorId, location);

			expect(mockVendorService.updateLocation).toHaveBeenCalledWith(vendorId, location);
		});
	});
});
```

### Domain Event Testing

```typescript
// vendor.events.spec.ts
describe('Vendor Events', () => {
	let eventService: EventService;
	let mockEventEmitter: jest.Mocked<EventEmitter2>;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				EventService,
				{
					provide: EventEmitter2,
					useValue: createMockEventEmitter(),
				},
			],
		}).compile();

		eventService = module.get<EventService>(EventService);
		mockEventEmitter = module.get(EventEmitter2);
	});

	it('should emit vendor location updated event', async () => {
		const event = {
			vendorId: 'vendor-123',
			location: { lat: 40.7128, lng: -74.006 },
			timestamp: new Date(),
		};

		await eventService.emit('marketplace.vendor.location_updated', event);

		expect(mockEventEmitter.emit).toHaveBeenCalledWith(
			'marketplace.vendor.location_updated',
			expect.objectContaining(event),
		);
	});
});
```

## Integration Testing

### Service Integration

```typescript
// vendor.integration.spec.ts
describe('Vendor Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let eventService: EventService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        VendorModule,
        PrismaModule.forTest(),
        EventModule.forTest(),
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    eventService = module.get(EventService);

    // Clean test database
    await prisma.db.vendor.deleteMany();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Location Updates', () => {
    it('should update vendor location and emit event', async () => {
      // Create test vendor
      const vendor = await prisma.db.vendor.create({
        data: {
          name: 'Test Vendor',
          status: 'active',
        },
      });

      // Update location
      const location = { lat: 40.7128, lng: -74.006 };
      await request(app.getHttpServer())
        .put(\`/vendors/\${vendor.id}/location\`)
        .send(location)
        .expect(200);

      // Verify database update
      const updatedVendor = await prisma.db.vendor.findUnique({
        where: { id: vendor.id },
      });
      expect(updatedVendor.location).toEqual(location);

      // Verify event emission
      expect(eventService.getEmittedEvents()).toContainEqual(
        expect.objectContaining({
          type: 'marketplace.vendor.location_updated',
          data: expect.objectContaining({
            vendorId: vendor.id,
            location,
          }),
        }),
      );
    });
  });
});
```

### Cross-Domain Integration

```typescript
// location-marketplace.integration.spec.ts
describe('Location-Marketplace Integration', () => {
	let app: INestApplication;
	let locationService: LocationService;
	let vendorService: VendorService;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			imports: [LocationModule, MarketplaceModule, PrismaModule.forTest(), EventModule.forTest()],
		}).compile();

		app = module.createNestApplication();
		await app.init();

		locationService = module.get(LocationService);
		vendorService = module.get(VendorService);
	});

	afterEach(async () => {
		await app.close();
	});

	it('should update vendor location across domains', async () => {
		const vendorId = 'vendor-123';
		const location = { lat: 40.7128, lng: -74.006 };

		// Update location in marketplace domain
		await vendorService.updateLocation(vendorId, location);

		// Verify location in location domain
		const vendorLocation = await locationService.getVendorLocation(vendorId);
		expect(vendorLocation).toEqual(location);
	});
});
```

## E2E Testing

### API Testing

```typescript
// vendor.e2e.spec.ts
describe('Vendor E2E', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Location API', () => {
    it('should handle vendor location updates', async () => {
      const vendorId = 'vendor-123';
      const location = { lat: 40.7128, lng: -74.006 };

      // Update location
      await request(app.getHttpServer())
        .put(\`/vendors/\${vendorId}/location\`)
        .send(location)
        .expect(200);

      // Get updated location
      const response = await request(app.getHttpServer())
        .get(\`/vendors/\${vendorId}\`)
        .expect(200);

      expect(response.body.location).toEqual(location);
    });
  });
});
```

### WebSocket Testing

```typescript
// realtime.e2e.spec.ts
describe('Realtime E2E', () => {
  let app: INestApplication;
  let ws: WebSocket;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    ws = new WebSocket(\`ws://localhost:\${port}\`);
  });

  afterEach(async () => {
    ws.close();
    await app.close();
  });

  it('should receive vendor location updates', (done) => {
    const vendorId = 'vendor-123';
    const location = { lat: 40.7128, lng: -74.006 };

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      expect(message).toEqual({
        type: 'vendor_location_updated',
        data: {
          vendorId,
          location,
        },
      });
      done();
    });

    // Trigger location update
    request(app.getHttpServer())
      .put(\`/vendors/\${vendorId}/location\`)
      .send(location)
      .expect(200);
  });
});
```

## Test Helpers

### Mock Factories

```typescript
// test/helpers/mock-factories.ts
export function createMockPrismaService() {
	return {
		db: {
			vendor: {
				findUnique: jest.fn(),
				update: jest.fn(),
				create: jest.fn(),
				delete: jest.fn(),
			},
		},
	};
}

export function createMockEventService() {
	return {
		emit: jest.fn(),
		on: jest.fn(),
		getEmittedEvents: jest.fn(),
	};
}

export function createMockLocationService() {
	return {
		updateLocation: jest.fn(),
		getLocation: jest.fn(),
		findNearby: jest.fn(),
	};
}
```

### Test Data Factories

```typescript
// test/helpers/data-factories.ts
export function createTestVendor(overrides = {}) {
	return {
		id: 'vendor-123',
		name: 'Test Vendor',
		status: 'active',
		location: { lat: 40.7128, lng: -74.006 },
		...overrides,
	};
}

export function createTestLocation(overrides = {}) {
	return {
		lat: 40.7128,
		lng: -74.006,
		accuracy: 10,
		...overrides,
	};
}

export function createTestEvent(type: string, data: any) {
	return {
		id: 'event-123',
		type,
		data,
		timestamp: new Date(),
		correlationId: 'correlation-123',
	};
}
```

### Test Utils

```typescript
// test/helpers/test-utils.ts
export async function waitForEvent(eventService: EventService, eventType: string, timeout = 1000) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new Error('Event timeout'));
		}, timeout);

		eventService.on(eventType, (event) => {
			clearTimeout(timer);
			resolve(event);
		});
	});
}

export async function cleanDatabase(prisma: PrismaService) {
	await Promise.all([prisma.db.vendor.deleteMany(), prisma.db.user.deleteMany(), prisma.db.location.deleteMany()]);
}

export function createTestApp(module: TestingModule) {
	const app = module.createNestApplication();
	app.useGlobalPipes(new ValidationPipe());
	app.useGlobalFilters(new AppExceptionFilter());
	return app;
}
```

## Best Practices

### General Guidelines

1. **Test Organization**

   - Group tests by feature
   - Use descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)

2. **Test Independence**

   - Each test should be independent
   - Clean up test data
   - Don't share state between tests

3. **Test Coverage**

   - Aim for high coverage
   - Focus on business logic
   - Test edge cases

4. **Mock Usage**
   - Mock external dependencies
   - Use realistic mock data
   - Verify mock interactions

### Domain-Specific Testing

1. **Event Testing**

   - Test event emission
   - Verify event data
   - Test event handlers

2. **Validation Testing**

   - Test input validation
   - Test business rules
   - Test error cases

3. **Integration Testing**
   - Test domain boundaries
   - Test data flow
   - Test event propagation

### Performance Testing

1. **Load Testing**

   - Test concurrent users
   - Test response times
   - Test resource usage

2. **Stress Testing**
   - Test system limits
   - Test error handling
   - Test recovery

### Security Testing

1. **Authentication Testing**

   - Test auth flows
   - Test permissions
   - Test token handling

2. **Input Validation**
   - Test input sanitization
   - Test SQL injection
   - Test XSS prevention

## Quality Gates

### Coverage Requirements

| Test Type             | Minimum Coverage | Target Coverage |
| --------------------- | ---------------- | --------------- |
| **Unit Tests**        | 70%              | 80%             |
| **Integration Tests** | 50%              | 70%             |
| **E2E Tests**         | 20%              | 40%             |

### Performance Requirements

| Metric                    | Requirement                |
| ------------------------- | -------------------------- |
| **Test Execution Time**   | < 2 minutes for unit tests |
| **Integration Test Time** | < 5 minutes                |
| **E2E Test Time**         | < 10 minutes               |

### Quality Checks

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

## Continuous Integration

### GitHub Actions Workflow

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

### Test Scripts

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

## Additional Resources

- [Architecture Guide](./architecture-guide.md) - System architecture overview
- [Developer Guide](./developer-guide.md) - Development patterns and practices
- [API Documentation](./api-docs.md) - API endpoints and usage
- [Monitoring Guide](./monitoring-guide.md) - Monitoring and observability
