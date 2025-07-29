# Service Modules

This directory contains reusable NestJS modules that provide common functionality across services.

## Available Modules

- **[LoggerModule](./logger/README.md)** - Unified logging with Loki integration
- **[PrismaModule](./prisma/README.md)** - Database client with Prisma Pulse
- **[EventsModule](./events/README.md)** - Event-driven communication with NATS
- **[ConfigModule](./config/README.md)** - Configuration validation and management
- **[ClerkModule](./clerk/README.md)** - Authentication and user management
- **[AlgoliaModule](./algolia/README.md)** - Search indexing and management
- **[UploadModule](./upload/README.md)** - File upload handling
- **[RedisModule](./redis/README.md)** - Caching and session storage
- **[GrpcInstanceModule](./grpc-instance/README.md)** - gRPC client management

## Quick Start

```typescript
import { ConfigModule, EventsModule, LoggerModule, PrismaModule } from '@app/nest/modules';

@Module({
	imports: [ConfigModule, LoggerModule.register({ appName: 'My Service' }), PrismaModule.register(), EventsModule],
})
export class AppModule {}
```

## Import Pattern

```typescript
// Import specific modules
// Import services from modules
import { IEventsService, Logger, LoggerModule, PrismaService } from '@app/nest/modules';
```
