# NestJS Shared Library

## Purpose

The NestJS Shared Library provides reusable NestJS modules, services, guards, filters, and utilities that are shared across all microservices in the Venta backend system. It encapsulates common functionality to promote code reuse, maintain consistency, and provide standardized patterns for building microservices.

## Overview

This library provides:

- Standardized modules for common functionality (database, caching, authentication, etc.)
- Reusable guards and filters for security and validation
- Utility services for logging, error handling, and monitoring
- Consistent patterns for microservice development
- Type-safe interfaces and configurations
- Integration with external services and APIs

## Usage

### Module Imports

Import the modules you need in your service:

```typescript
import {
	AlgoliaModule,
	BootstrapModule,
	ClerkModule,
	EventsModule,
	LoggerModule,
	PrismaModule,
	RedisModule,
} from '@app/nest/modules';

@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: 'Your Service',
			protocol: 'grpc',
			additionalModules: [
				PrismaModule,
				RedisModule,
				EventsModule.register({ appName: 'Your Service' }),
				ClerkModule.register(),
				AlgoliaModule.register(),
			],
		}),
	],
})
export class YourModule {}
```

### Service Injection

Inject the services you need in your service classes:

```typescript
import {
	AlgoliaService,
	ClerkService,
	EventService,
	LoggerService,
	PrismaService,
	RedisService,
} from '@app/nest/modules';

@Injectable()
export class YourService {
	constructor(
		private logger: LoggerService,
		private prisma: PrismaService,
		private redis: RedisService,
		private eventService: EventService,
		private clerkService: ClerkService,
		private algoliaService: AlgoliaService,
	) {}

	async processData(data: any) {
		this.logger.log('Processing data', { dataId: data.id });

		// Database operations
		const result = await this.prisma.db.yourModel.create({ data });

		// Caching
		await this.redis.set(`data:${result.id}`, JSON.stringify(result));

		// Event publishing
		await this.eventService.emit('data.created', { id: result.id });

		return result;
	}
}
```

### Guards, Interceptors, and Filters

Use guards, interceptors, and filters for security, monitoring, and validation:

````typescript
import {
  AuthGuard,
  WsAuthGuard,
  WsRateLimitGuard,
  MetricsInterceptor,
  GrpcRequestIdInterceptor,
  NatsRequestIdInterceptor,
  AppExceptionFilter,
  SchemaValidatorPipe
} from '@app/nest';

@Controller('api')
@UseGuards(AuthGuard)
@UseFilters(AppExceptionFilter)
export class YourController {
  @Post('data')
  @UsePipes(new SchemaValidatorPipe(dataSchema))
  async createData(@Body() data: CreateDataRequest) {
    return this.service.createData(data);
  }
}

// WebSocket guards
@WebSocketGateway()
@UseGuards(WsAuthGuard, WsRateLimitGuard)
export class YourGateway {
  // WebSocket methods
}

// Interceptors for monitoring and request correlation
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: GrpcRequestIdInterceptor,
    },
  ],
})
export class YourModule {}

### Error Handling

Use standardized error handling patterns:

```typescript
import { AppError, ErrorCodes } from '@app/nest/errors';

@Injectable()
export class YourService {
  async getResource(id: string) {
    const resource = await this.prisma.db.resource.findUnique({ where: { id } });

    if (!resource) {
      throw AppError.notFound(ErrorCodes.RESOURCE_NOT_FOUND, { resourceId: id });
    }

    return resource;
  }

  async validateData(data: any) {
    if (!data.requiredField) {
      throw AppError.badRequest(ErrorCodes.VALIDATION_ERROR, { field: 'requiredField' });
    }
  }
}
````

### Configuration

Configure modules with environment variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/venta

# Redis
REDIS_PASSWORD=your-redis-password

# Authentication
CLERK_SECRET_KEY=your-clerk-secret

# Search
ALGOLIA_APP_ID=your-algolia-app-id
ALGOLIA_API_KEY=your-algolia-api-key

# Events
NATS_URL=nats://localhost:4222
```

## Key Benefits

- **Code Reuse**: Eliminates duplication across services
- **Consistency**: Ensures uniform behavior across the system
- **Maintainability**: Centralized updates for shared functionality
- **Type Safety**: TypeScript interfaces for all components
- **Reliability**: Battle-tested components used across all services
- **Standardization**: Consistent patterns for microservice development

## Dependencies

- **NestJS** for framework and module system
- **Prisma** for database access and ORM
- **Redis** for caching and session management
- **Clerk** for authentication and user management
- **Algolia** for search functionality
- **NATS** for event messaging and communication
- **Cloudinary** for file storage and media processing
