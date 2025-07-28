# NestJS Framework Libraries

This library contains reusable NestJS components, modules, and utilities that can be shared across different services in the Venta backend.

## Structure

### `modules/` - Service Modules

Reusable NestJS modules that provide common functionality:

- **algolia** - Search indexing and management
- **clerk** - Authentication and user management
- **config** - Configuration validation and management
- **events** - Event-driven communication (NATS)
- **grpc-instance** - gRPC client management
- **logger** - Structured logging with Loki integration
- **prisma** - Database access and management
- **redis** - Caching and session storage
- **upload** - File upload handling (Cloudinary)

### `guards/` - Authentication Guards

Request-level authentication and authorization:

- **auth** - General authentication guards
- **signed-webhook** - Webhook signature verification

### `filters/` - Exception Filters

Global exception handling and error formatting.

### `errors/` - Error Management

Standardized error types, codes, and error handling utilities.

### `pipes/` - Validation Pipes

Request validation and transformation:

- **schema-validator** - Schema-based validation for HTTP, gRPC, and WebSocket requests

## Usage

Import the specific modules you need in your service:

```typescript
import { ExceptionFilter } from '@libs/nest/filters';
import { AuthGuard } from '@libs/nest/guards';
import { ClerkModule, LoggerModule, PrismaModule } from '@libs/nest/modules';
```

## Configuration

Most modules require environment variables to be configured. Refer to the individual module documentation for specific requirements.
