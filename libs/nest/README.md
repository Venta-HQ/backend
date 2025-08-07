# NestJS Library

Comprehensive NestJS utilities and modules for the Venta backend system, providing core infrastructure, domain-driven design patterns, and production-ready features.

## Overview

The `nest` library provides a complete set of NestJS modules, utilities, and patterns that support our DDD (Domain-Driven Design) architecture. It includes everything needed to build scalable, maintainable microservices with proper observability, error handling, and domain alignment.

## Features

- **Domain-Driven Design Support**: Bootstrap patterns with explicit domain configuration
- **Structured Logging**: Automatic context extraction and Loki integration
- **Error Handling**: Unified error system with domain context
- **Event Management**: Type-safe event emission with automatic context
- **Monitoring**: Prometheus metrics and health checks
- **Authentication**: Multi-protocol auth guards and interceptors
- **Database Integration**: Prisma service with connection management
- **External Services**: Clerk, Algolia, and other integrations
- **Real-time Communication**: WebSocket support with rate limiting

## Architecture

### Core Modules

```
libs/nest/
├── modules/
│   ├── core/                    # Core infrastructure
│   │   ├── bootstrap/          # Application bootstrap patterns
│   │   ├── config/             # Configuration management
│   │   └── logger/             # Structured logging with Loki
│   ├── data/                   # Data access layer
│   │   ├── prisma/            # Database integration
│   │   └── redis/             # Redis connection management
│   ├── external/               # External service integrations
│   │   ├── algolia/           # Search indexing
│   │   ├── clerk/             # Authentication provider
│   │   └── upload/            # File upload services
│   ├── messaging/              # Event-driven communication
│   │   ├── events/            # Type-safe event emission
│   │   └── nats-queue/        # NATS message queuing
│   ├── monitoring/             # Observability and monitoring
│   │   ├── health/            # Health check endpoints
│   │   └── prometheus/        # Metrics collection
│   └── networking/             # Network layer utilities
│       ├── grpc-instance/     # gRPC client management
│       └── request-context/   # Request-scoped context
├── guards/                     # Authentication and authorization
├── interceptors/               # Cross-cutting concerns
├── pipes/                      # Data validation and transformation
└── errors/                     # Unified error handling
```

## Usage

### Bootstrap Configuration

```typescript
import { BootstrapService } from '@app/nest/modules/core/bootstrap';

// Bootstrap a microservice with domain configuration
const app = await BootstrapService.bootstrapNatsMicroservice({
  domain: 'marketplace', // Explicit DDD domain
  main: {
    module: VendorManagementModule,
    url: 'nats://localhost:4222',
  },
  health: {
    module: HealthModule,
    port: 3001,
  },
});
```

### Structured Logging

```typescript
import { Logger } from '@app/nest/modules/core/logger';

export class VendorService {
  private readonly logger = new Logger(VendorService.name);

  async onboardVendor(data: VendorOnboardingData): Promise<string> {
    this.logger.log('Starting vendor onboarding', {
      vendorId: data.vendorId,
      ownerId: data.ownerId,
    });

    try {
      // Business logic
      const vendor = await this.createVendor(data);
      
      this.logger.log('Vendor onboarded successfully', {
        vendorId: vendor.id,
        ownerId: vendor.ownerId,
      });

      return vendor.id;
    } catch (error) {
      this.logger.error('Failed to onboard vendor', error.stack, {
        error,
        vendorId: data.vendorId,
        ownerId: data.ownerId,
      });
      throw error;
    }
  }
}
```

### Event Emission

```typescript
import { EventService } from '@app/nest/modules/messaging/events';

export class VendorService {
  constructor(private eventService: EventService) {}

  async onboardVendor(data: VendorOnboardingData): Promise<string> {
    const vendor = await this.createVendor(data);
    
    // Emit domain event with automatic context
    await this.eventService.emit('marketplace.vendor_onboarded', {
      vendorId: vendor.id,
      ownerId: vendor.ownerId,
      location: data.location,
    });

    return vendor.id;
  }
}
```

### Error Handling

```typescript
import { AppError, ErrorType, ErrorCodes } from '@app/nest/errors';

export class VendorService {
  async getVendorById(vendorId: string): Promise<Vendor> {
    const vendor = await this.prisma.db.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new AppError(
        ErrorType.NOT_FOUND,
        ErrorCodes.VENDOR_NOT_FOUND,
        'Vendor not found',
        { vendorId }
      );
    }

    return vendor;
  }
}
```

### Authentication Guards

```typescript
import { AuthGuard } from '@app/nest/guards/auth';

@Controller('vendors')
@UseGuards(AuthGuard)
export class VendorController {
  @Get(':id')
  async getVendor(@Param('id') id: string, @Req() req: AuthedRequest) {
    // req.userId is automatically populated by AuthGuard
    return this.vendorService.getVendorById(id, req.userId);
  }
}
```

### Database Integration

```typescript
import { PrismaService } from '@app/nest/modules/data/prisma';

export class VendorService {
  constructor(private prisma: PrismaService) {}

  async createVendor(data: CreateVendorData): Promise<Vendor> {
    return this.prisma.db.vendor.create({
      data: {
        name: data.name,
        ownerId: data.ownerId,
        location: {
          lat: data.location.lat,
          lng: data.location.lng,
        },
      },
    });
  }
}
```

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/venta"

# Redis
REDIS_URL="redis://localhost:6379"

# NATS
NATS_URL="nats://localhost:4222"

# External Services
CLERK_SECRET_KEY="sk_test_..."
ALGOLIA_APP_ID="your-app-id"
ALGOLIA_API_KEY="your-api-key"

# Monitoring
LOKI_URL="http://localhost:3100"
LOKI_USERNAME="admin"
LOKI_PASSWORD="password"
```

### Module Configuration

```typescript
// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    RedisModule,
    EventModule.register({
      appName: 'vendor-management',
    }),
    PrometheusModule,
    HealthModule,
  ],
})
export class AppModule {}
```

## Domain-Driven Design Support

### Domain Configuration

```typescript
// Explicit domain configuration in bootstrap
const app = await BootstrapService.bootstrapGrpcMicroservice({
  domain: 'marketplace', // DDD domain
  main: {
    module: VendorManagementModule,
    package: 'vendor_management',
    protoPath: 'vendor-management.proto',
    url: 'localhost:5000',
  },
  health: {
    module: HealthModule,
    port: 3001,
  },
});
```

### Domain-Specific Error Handling

```typescript
// Automatic domain context in errors
@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const appError = this.convertToAppError(exception);
    this.addDomainContext(appError); // Automatically adds domain context
    
    return this.formatResponse(appError, host);
  }
}
```

## Monitoring and Observability

### Health Checks

```typescript
// Automatic health check endpoints
@Controller('health')
export class HealthController {
  @Get()
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
```

### Metrics Collection

```typescript
// Automatic Prometheus metrics
@Injectable()
export class VendorMetrics {
  private readonly vendorOnboardingTotal = new Counter({
    name: 'vendor_onboarding_total',
    help: 'Total number of vendor onboardings',
    labelNames: ['status'],
  });

  recordOnboarding(success: boolean) {
    this.vendorOnboardingTotal.inc({ status: success ? 'success' : 'failure' });
  }
}
```

### Structured Logging

```typescript
// Automatic context extraction and Loki integration
this.logger.log('Vendor onboarded', {
  vendorId: vendor.id,
  ownerId: vendor.ownerId,
  location: vendor.location,
});

// Automatically includes:
// - requestId for correlation
// - domain context
// - structured data for Loki querying
```

## Development

### Building

```bash
# Build the library
pnpm build nest

# Type check
pnpm type-check nest
```

### Testing

```bash
# Run tests
pnpm test nest

# Run tests with coverage
pnpm test:cov nest
```

### Local Development

```bash
# Start required services
docker-compose up -d postgres redis nats loki

# Run in development mode
pnpm dev:vendor-management
```

## Best Practices

### Domain Alignment
- Always configure explicit domain in bootstrap
- Use domain-specific error codes and messages
- Organize code by business domains, not technical concerns

### Error Handling
- Use `AppError` for all application errors
- Include relevant context in error messages
- Let the exception filter handle error formatting

### Logging
- Use structured logging with business context
- Include relevant identifiers in log data
- Use appropriate log levels (debug, info, warn, error)

### Event Emission
- Use domain event names (`marketplace.vendor_onboarded`)
- Include business context in event data
- Let the EventService handle metadata and context extraction

### Configuration
- Use environment variables for configuration
- Provide sensible defaults
- Validate configuration at startup

## Related Documentation

- [DDD Migration Guide](../../docs/ddd-migration-guide.md) - Complete DDD implementation overview
- [Event Pattern Enforcement](../../docs/event-pattern-enforcement.md) - Event validation patterns
- [Error Handling Guide](../../docs/error-handling-guide.md) - Unified error handling patterns
- [Logging Standards](../../docs/logging-standards.md) - Structured logging patterns

---

**Status**: ✅ **Production Ready**  
**Last Updated**: December 2024  
**Version**: 1.0.0
