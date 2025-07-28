# Development Guide

## Code Organization

### Project Structure

```
venta-backend/
├── apps/                          # Microservices
│   ├── gateway/                   # HTTP API Gateway
│   ├── user/                      # User management service
│   ├── vendor/                    # Vendor management service
│   ├── location/                  # Location tracking service
│   ├── websocket-gateway/         # WebSocket connections
│   └── algolia-sync/              # Search index synchronization
├── libs/                          # Shared libraries
│   ├── apitypes/                  # API types and schemas
│   ├── nest/                      # NestJS utilities
│   │   ├── modules/               # Shared modules
│   │   │   ├── events/            # Event system (provider-agnostic)
│   │   │   ├── config/            # Configuration module
│   │   │   ├── prisma/            # Database client
│   │   │   ├── redis/             # Cache client
│   │   │   └── clerk/             # Authentication
│   │   ├── guards/                # Authentication guards
│   │   ├── filters/               # Exception filters
│   │   └── pipes/                 # Validation pipes
│   └── proto/                     # gRPC protocol definitions
├── prisma/                        # Database schema
│   └── schema/                    # Split Prisma schemas
├── docs/                          # Documentation
└── docker-compose.yml             # Local infrastructure
```

### Naming Conventions

#### Files and Directories

- **kebab-case**: Directory names (`user-service/`)
- **camelCase**: File names (`userService.ts`)
- **PascalCase**: Class names (`UserService`)
- **UPPER_SNAKE_CASE**: Constants (`MAX_RETRY_COUNT`)

#### Code Style

```typescript
// Services: PascalCase
export class VendorService {}

// Methods: camelCase
async createVendor(data: CreateVendorDto) {}

// Events: kebab-case
await this.eventsService.publishEvent('vendor.created', data);

// Environment variables: UPPER_SNAKE_CASE
DATABASE_URL=postgresql://...
NATS_URL=nats://localhost:4222
```

### Module Organization

#### Service Module Structure

```
apps/user/
├── src/
│   ├── main.ts                    # Service entry point
│   ├── user.module.ts             # Main module
│   ├── controllers/               # gRPC controllers
│   ├── services/                  # Business logic
│   └── dto/                       # Data transfer objects
├── Dockerfile                     # Service container
└── tsconfig.app.json             # TypeScript config
```

#### Shared Library Structure

```
libs/nest/modules/
├── index.ts                       # Main exports
├── config/                        # Configuration module
├── events/                        # Event system (provider-agnostic)
│   ├── events.interface.ts        # Generic interface
│   ├── nats-events.service.ts     # NATS implementation
│   ├── events.module.ts           # Module configuration
│   └── index.ts                   # Exports
├── prisma/                        # Database client
├── redis/                         # Cache client
└── clerk/                         # Authentication
```

## Development Workflow

### 1. Feature Development

#### Create a New Feature

```bash
# 1. Create feature branch
git checkout -b feature/new-vendor-feature

# 2. Make changes
# - Update service logic
# - Add new events if needed
# - Update API types

# 3. Test locally
pnpm run start:all
curl http://localhost:5002/health

# 4. Commit changes
git add .
git commit -m "feat: add new vendor feature"

# 5. Push and create PR
git push origin feature/new-vendor-feature
```

#### Adding New Events

```typescript
// 1. Define event type
export interface VendorPromotedEvent extends VendorEvent {
  type: 'vendor.promoted';
  promotionType: 'featured' | 'sponsored';
}

// 2. Emit event in service (provider-agnostic)
await this.eventsService.publishEvent('vendor.promoted', {
  id: vendor.id,
  promotionType: 'featured',
  // ... other data
});

// 3. Handle event in consumer
case 'vendor.promoted':
  await this.handleVendorPromoted(event.data);
  break;
```

### 2. Testing Strategy

#### Unit Tests

```typescript
// apps/vendor/src/vendor.service.spec.ts
describe('VendorService', () => {
	let service: VendorService;
	let eventsService: IEventsService;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				VendorService,
				{
					provide: 'EventsService',
					useValue: {
						publishEvent: jest.fn(),
						subscribeToEvents: jest.fn(),
						subscribeToEventType: jest.fn(),
						healthCheck: jest.fn(),
					},
				},
			],
		}).compile();

		service = module.get<VendorService>(VendorService);
		eventsService = module.get<IEventsService>('EventsService');
	});

	it('should emit vendor.created event', async () => {
		const vendorData = { name: 'Test Vendor', userId: 'user-1' };
		await service.createVendor(vendorData);

		expect(eventsService.publishEvent).toHaveBeenCalledWith(
			'vendor.created',
			expect.objectContaining({ name: 'Test Vendor' }),
		);
	});
});
```

#### Integration Tests

```typescript
// apps/vendor/test/vendor.integration.spec.ts
describe('Vendor Integration', () => {
	let app: INestApplication;

	beforeEach(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [VendorModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	it('should create vendor and emit event', async () => {
		// Test the full flow
		const result = await app.get(VendorService).createVendor({
			name: 'Test Vendor',
			userId: 'user-1',
		});

		expect(result).toBeDefined();
		// Verify event was emitted (mock NATS)
	});
});
```

#### E2E Tests

```typescript
// apps/gateway/test/vendor.e2e-spec.ts
describe('Vendor E2E', () => {
	let app: INestApplication;

	beforeEach(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	it('/vendor (POST)', () => {
		return request(app.getHttpServer())
			.post('/vendor')
			.set('Authorization', 'Bearer valid-token')
			.send({ name: 'Test Vendor' })
			.expect(201)
			.expect((res) => {
				expect(res.body.id).toBeDefined();
			});
	});
});
```

### 3. Code Quality

#### Linting and Formatting

```bash
# Format code
pnpm run format

# Lint code
pnpm run lint

# Fix linting issues
pnpm run lint --fix
```

#### Pre-commit Hooks

```json
// package.json
{
	"husky": {
		"hooks": {
			"pre-commit": "lint-staged"
		}
	},
	"lint-staged": {
		"*.ts": ["eslint --fix", "prettier --write"]
	}
}
```

## Deployment Pipeline

### 1. Development Environment

#### Local Development

```bash
# Start all services
pnpm run start:all

# Monitor logs
docker-compose logs -f

# Health checks
curl http://localhost:5002/health
```

#### Docker Development

```bash
# Build and run with Docker
docker-compose -f docker-compose.dev.yml up --build

# Hot reload with volumes
docker-compose -f docker-compose.dev.yml up
```

### 2. Staging Environment

#### Environment Configuration

```bash
# Staging environment variables
NODE_ENV=staging
DATABASE_URL=postgresql://staging-db
REDIS_URL=redis://staging-redis
# ... other staging config
```

#### Deployment

```bash
# Build staging images
docker build -f apps/gateway/Dockerfile -t venta-gateway:staging .

# Deploy to staging
docker-compose -f docker-compose.staging.yml up -d
```

### 3. Production Environment

#### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Health checks implemented
- [ ] Monitoring configured
- [ ] SSL certificates installed
- [ ] Backup strategy in place

#### Deployment Commands

```bash
# Build production images
docker build -f apps/gateway/Dockerfile -t venta-gateway:prod .

# Deploy with health checks
docker run -d \
  --name venta-gateway \
  --health-cmd="curl -f http://localhost:5002/health" \
  --health-interval=30s \
  -p 5002:5002 \
  venta-gateway:prod
```

## Monitoring and Observability

### 1. Logging Strategy

#### Structured Logging

```typescript
// Use structured logging
this.logger.log('Vendor created', {
	vendorId: vendor.id,
	userId: userId,
	timestamp: new Date().toISOString(),
	service: 'vendor-service',
});

// Error logging with context
this.logger.error('Failed to create vendor', {
	error: error.message,
	stack: error.stack,
	vendorData: data,
	userId: userId,
});
```

#### Log Levels

- **ERROR**: System errors, failed operations
- **WARN**: Recoverable issues, retries
- **INFO**: Important business events
- **DEBUG**: Detailed debugging information

### 2. Metrics and Monitoring

#### Health Checks

```typescript
@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      uptime: process.uptime(),
    };
  }

  @Get('detailed')
  detailedHealth() {
    return {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      externalServices: await this.checkExternalServices(),
    };
  }
}
```

#### Performance Metrics

```typescript
// Track response times
@Injectable()
export class MetricsService {
	trackRequest(method: string, path: string, duration: number) {
		// Send to monitoring system
		this.logger.log('Request metrics', {
			method,
			path,
			duration,
			timestamp: new Date().toISOString(),
		});
	}
}
```

### 3. Alerting

#### Critical Alerts

- Service health check failures
- High error rates (>5%)
- Database connection issues
- Redis memory usage >80%
- Failed event count >100

#### Business Alerts

- Low user activity
- High API response times
- Failed payment processing
- Search index sync failures

## Best Practices

### 1. Error Handling

#### Service Level

```typescript
try {
  const result = await this.externalService.call();
  return result;
} catch (error) {
  this.logger.error('External service call failed', {
    error: error.message,
    service: 'external-service',
    operation: 'call',
  });

  // Retry with exponential backoff
  return this.retryOperation(() => this.externalService.call());
}
```

#### Event Level

```typescript
// Always handle event processing errors
await this.eventsService.subscribeToEvents(async (event) => {
	try {
		await this.processEvent(event);
	} catch (error) {
		this.logger.error('Event processing failed', {
			eventType: event.type,
			eventId: event.messageId,
			error: error.message,
		});

		// Don't crash the service
		// Failed events will be retried
	}
});
```

### 2. Performance Optimization

#### Database Queries

```typescript
// Use Prisma efficiently
const vendors = await this.prisma.vendor.findMany({
	where: { userId },
	select: {
		id: true,
		name: true,
		// Only select needed fields
	},
	take: 10, // Limit results
});
```

#### Caching Strategy

```typescript
// Cache frequently accessed data
const cacheKey = `user:${userId}`;
let user = await this.redis.get(cacheKey);

if (!user) {
	user = await this.prisma.user.findUnique({ where: { id: userId } });
	await this.redis.set(cacheKey, JSON.stringify(user), 'EX', 3600);
}
```

### 3. Security

#### Input Validation

```typescript
// Use DTOs with validation
export class CreateVendorDto {
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	name: string;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	description?: string;
}
```

#### Authentication

```typescript
// Always validate tokens
@UseGuards(AuthGuard)
@Post('vendor')
async createVendor(@Request() req, @Body() data: CreateVendorDto) {
  const userId = req.userId; // From AuthGuard
  return this.vendorService.createVendor({ ...data, userId });
}
```

## Troubleshooting

### Common Development Issues

#### Service Won't Start

1. Check environment variables
2. Verify database connection
3. Check port availability
4. Review service logs

#### Events Not Processing

1. Check Redis connection
2. Verify event consumer is running
3. Check event type matching
4. Review failed events

#### Performance Issues

1. Monitor memory usage
2. Check database queries
3. Review caching strategy
4. Monitor network latency

### Debug Commands

```bash
# Check service status
ps aux | grep node

# Monitor Redis
redis-cli monitor

# Check database
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"

# View logs
tail -f logs/app.log

# Health check
curl http://localhost:5002/health
```
