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

### LoggerModule

Provides structured logging with Loki integration and request context tracking.

**Usage:**

```typescript
import { GrpcLoggerModule, HttpLoggerModule } from '@libs/nest/modules';

@Module({
	imports: [
		GrpcLoggerModule.register('service-name'), // For gRPC services
		HttpLoggerModule.register('service-name'), // For HTTP services
	],
})
export class AppModule {}
```

**Required Environment Variables:**

- `LOKI_URL`
- `LOKI_USERNAME` (optional)
- `LOKI_PASSWORD` (optional)

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

Provides caching and session storage using Redis.

**Usage:**

```typescript
import { RedisModule } from '@libs/nest/modules';

@Module({
	imports: [RedisModule],
})
export class AppModule {}
```

**Required Environment Variables:**

- `REDIS_URL`
- `REDIS_PASSWORD`

### UploadModule

Handles file uploads and management using Cloudinary.

**Usage:**

```typescript
import { UploadModule } from '@libs/nest/modules';

@Module({
	imports: [UploadModule.register()],
})
export class AppModule {}
```

**Required Environment Variables:**

- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_CLOUD_NAME`

## Global Modules

Most modules are registered as global modules, meaning they can be imported once and used throughout the application without needing to re-import them in every module.
