# Service Modules

This directory contains reusable NestJS modules that provide common functionality across services.

## Available Modules

### AlgoliaModule

Provides search indexing and management capabilities using Algolia.

**Usage:**

```typescript
import { AlgoliaModule } from '@libs/nest/modules';

@Module({
	imports: [AlgoliaModule.register()],
})
export class AppModule {}
```

**Required Environment Variables:**

- `ALGOLIA_APPLICATION_ID`
- `ALGOLIA_API_KEY`

### ClerkModule

Handles authentication and user management through Clerk.

**Usage:**

```typescript
import { ClerkModule } from '@libs/nest/modules';

@Module({
	imports: [ClerkModule.register()],
})
export class AppModule {}
```

**Required Environment Variables:**

- `CLERK_SECRET_KEY`

### ConfigModule

Provides configuration validation and management using Zod schemas.

**Usage:**

```typescript
import { ConfigModule } from '@libs/nest/modules';

@Module({
	imports: [ConfigModule.register()],
})
export class AppModule {}
```

### EventsModule

Enables event-driven communication using NATS messaging.

**Usage:**

```typescript
import { EventsModule } from '@libs/nest/modules';

@Module({
	imports: [EventsModule],
})
export class AppModule {}
```

**Required Environment Variables:**

- `NATS_URL` (defaults to `nats://localhost:4222`)

### GrpcInstanceModule

Manages gRPC client connections and service instances.

**Usage:**

```typescript
import { GrpcInstanceModule } from '@libs/nest/modules';

@Module({
	imports: [
		GrpcInstanceModule.register({
			protoPackage: 'user',
			protoPath: 'path/to/user.proto',
			provide: 'USER_SERVICE',
			serviceName: 'UserService',
			urlEnvVar: 'USER_SERVICE_URL',
		}),
	],
})
export class AppModule {}
```

## LoggerModule

A unified logging module that provides consistent logging across HTTP and gRPC protocols.

### Features

- **Unified Logger**: Single `Logger` service that works for both HTTP and gRPC
- **Automatic Protocol Detection**: Automatically handles request IDs for both HTTP and gRPC
- **Structured Logging**: Uses Pino for high-performance structured logging
- **Loki Integration**: Automatic log aggregation with Grafana Loki
- **Development Support**: Pretty printing in development environment
- **Request Tracing**: Automatic request ID tracking across async operations

### Usage

```typescript
import { LoggerModule } from '@app/nest/modules';

@Module({
	imports: [
		// For HTTP services
		LoggerModule.register({ appName: 'MyApp', protocol: 'http' }),

		// For gRPC services
		LoggerModule.register({ appName: 'MyApp', protocol: 'grpc' }),

		// Auto-detect (defaults to gRPC)
		LoggerModule.register({ appName: 'MyApp', protocol: 'auto' }),

		// Simple string registration (auto-detect)
		LoggerModule.register('MyApp'),
	],
})
export class AppModule {}
```

### Using the Logger

```typescript
import { Logger } from '@app/nest/modules';

@Injectable()
export class MyService {
	constructor(private readonly logger: Logger) {}

	async doSomething() {
		// Automatically includes request ID for both HTTP and gRPC
		this.logger.log('Operation started', 'MyService');

		// With additional context
		this.logger.error('Something went wrong', 'MyService', {
			userId: '123',
			operation: 'doSomething',
		});
	}
}
```

### Configuration

The module automatically configures:

- **HTTP**: Request ID handling via headers (`x-request-id`)
- **gRPC**: Request ID handling via metadata and interceptors
- **Loki**: Log aggregation with configurable labels
- **Development**: Pretty printing with colorized output

### Environment Variables

- `LOKI_URL`: Loki server URL
- `LOKI_USERNAME`: Loki username
- `LOKI_PASSWORD`: Loki password
- `NODE_ENV`: Environment (production/development)

### PrismaModule

Provides database access and management using Prisma ORM.

**Usage:**

```typescript
import { PrismaModule } from '@libs/nest/modules';

@Module({
	imports: [PrismaModule.register()],
})
export class AppModule {}
```

**Required Environment Variables:**

- `DATABASE_URL`
- `PULSE_API_KEY`

### RedisModule

Provides Redis caching and session storage capabilities.

**Usage:**

```typescript
import { RedisModule } from '@libs/nest/modules';

@Module({
	imports: [RedisModule],
})
export class AppModule {}
```

**Required Environment Variables:**

- `REDIS_URL` (defaults to `redis://localhost:6379`)

### UploadModule

Handles file uploads using Cloudinary.

**Usage:**

```typescript
import { UploadModule } from '@libs/nest/modules';

@Module({
	imports: [UploadModule.register()],
})
export class AppModule {}
```

**Required Environment Variables:**

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Global Modules

Most modules are registered as global modules, meaning they can be imported once and used throughout the application without needing to re-import them in every module.
