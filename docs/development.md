# Development Guide

## Code Organization

### Nx Monorepo Structure

This project uses **Nx** for monorepo management with the following structure:

```
venta-backend/
├── apps/                         # Applications (microservices)
│   ├── gateway/                  # HTTP API Gateway
│   │   ├── src/
│   │   │   ├── main.ts           # Service entry point
│   │   │   ├── app.module.ts     # Main module
│   │   │   ├── upload/           # Upload functionality
│   │   │   ├── user/             # User endpoints
│   │   │   ├── vendor/           # Vendor endpoints
│   │   │   └── webhook/          # Webhook handlers
│   │   ├── project.json          # Nx project configuration
│   │   ├── webpack.config.js     # Webpack configuration
│   │   └── tsconfig.app.json     # TypeScript config
│   ├── user/                     # User management service
│   ├── vendor/                   # Vendor management service
│   ├── location/                 # Location tracking service
│   ├── websocket-gateway/        # WebSocket connections
│   └── algolia-sync/             # Search index synchronization
├── libs/                         # Shared libraries
│   ├── nest/                     # NestJS framework utilities
│   │   ├── modules/              # Shared modules
│   │   │   ├── config/           # Configuration module
│   │   │   ├── events/           # Event system (provider-agnostic)
│   │   │   ├── prisma/           # Database client
│   │   │   ├── redis/            # Cache client
│   │   │   ├── clerk/            # Authentication
│   │   │   ├── algolia/          # Search integration
│   │   │   ├── upload/           # File upload
│   │   │   ├── logger/           # Logging utilities
│   │   │   └── grpc-instance/    # gRPC client management
│   │   ├── guards/               # Authentication guards
│   │   ├── filters/              # Exception filters
│   │   ├── pipes/                # Validation pipes
│   │   └── errors/               # Error handling
│   ├── proto/                    # gRPC protocol definitions
│   └── apitypes/                 # API types and schemas
├── prisma/                       # Database schema
├── docs/                         # Documentation
└── docker-compose.yml            # Local infrastructure
```

### Naming Conventions

#### Files and Directories

- **kebab-case**: Directory names (`user-service/`)
- **camelCase**: File names (`userService`)
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

#### Application Structure (apps/)

Each application follows this structure:

```
apps/gateway/
├── src/
│   ├── main.ts                   # Service entry point
│   ├── app.module.ts             # Main module
│   ├── controllers/              # HTTP controllers
│   ├── services/                 # Business logic
│   └── dto/                      # Data transfer objects
├── project.json                  # Nx project configuration
├── webpack.config.js             # Build configuration
├── tsconfig.app.json             # TypeScript config
└── Dockerfile                    # Service container
```

#### Library Structure (libs/)

```
libs/nest/modules/
├── index.ts                      # Main exports
├── config/                       # Configuration module
├── events/                       # Event system (provider-agnostic)
│   ├── events.interface.ts       # Generic interface
│   ├── nats-events.service.ts    # NATS implementation
│   ├── events.module.ts          # Module configuration
│   └── index.ts                  # Exports
├── prisma/                       # Database client
├── redis/                        # Cache client
└── clerk/                        # Authentication
```

## Development Workflow

### 1. Feature Development

#### Create a New Feature

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes to relevant apps/libs
# 3. Test your changes
nx test affected

# 4. Build affected projects
nx build affected

# 5. Commit and push
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
```

#### Adding New Dependencies

```bash
# Add to specific project
pnpm add package-name --filter gateway

# Add to all projects
pnpm add package-name

# Add dev dependency to specific project
pnpm add -D package-name --filter nest
```

### 2. Testing Strategy

#### Unit Tests

```bash
# Run all tests
pnpm test

# Run tests for specific project
nx test gateway

# Run tests in watch mode
nx test nest --watch

# Run tests with coverage
nx test gateway --coverage
```

#### Integration Tests

```bash
# Test specific functionality
nx test nest --testNamePattern="integration"

# Test with specific environment
NODE_ENV=test nx test gateway
```

### 3. Building and Deployment

#### Development Builds

```bash
# Build specific project
nx build gateway --configuration=development

# Build all projects
pnpm build

# Build affected projects only
nx build affected
```

#### Production Builds

```bash
# Build for production
nx build gateway --configuration=production

# Build all for production
nx run-many --target=build --all --configuration=production
```

### 4. Code Quality

#### Linting

```bash
# Lint all projects
pnpm lint

# Lint specific project
nx lint gateway

# Fix linting issues
nx lint gateway --fix
```

#### Formatting

```bash
# Format all code
pnpm format

# Format specific files
prettier --write "apps/gateway/src/**/*.ts"
```

## Nx Best Practices

### 1. Project Configuration

Each project has a `project.json` file that defines:

```json
{
  "name": "gateway",
  "sourceRoot": "apps/gateway/src",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "@nx/webpack:webpack",
      "options": {
        "target": "node",
        "compiler": "tsc",
        "outputPath": "dist/apps/gateway",
        "main": "apps/gateway/src/main.ts",
        "tsConfig": "apps/gateway/tsconfig.app.json"
      }
    },
    "serve": {
      "executor": "@nx/js:node",
      "options": {
        "buildTarget": "gateway:build"
      }
    },
    "test": {
      "executor": "@nx/vite:test",
      "options": {
        "passWithNoTests": true
      }
    }
  }
}
```

### 2. Path Aliases

Use path aliases for clean imports:

```typescript
// In tsconfig.app.json
{
  "compilerOptions": {
    "paths": {
      "@app/nest/modules": ["../../libs/nest/modules"],
      "@app/nest/guards": ["../../libs/nest/guards"],
      "@app/proto/*": ["../../libs/proto/src/*"],
      "@app/apitypes": ["../../libs/apitypes/src"]
    }
  }
}

// In code
import { ConfigModule } from '@app/nest/modules';
import { AuthGuard } from '@app/nest/guards';
```

### 3. Shared Libraries

#### Creating New Libraries

```bash
# Create new library
nx generate @nx/js:library my-library --directory=libs

# Create new module
nx generate @nx/js:library my-module --directory=libs/nest/modules
```

#### Using Shared Libraries

```typescript
// Export from library
// libs/nest/modules/config/index.ts
export * from './config.module';
export * from './config.service';

// Import in application
// apps/gateway/src/app.module.ts
import { ConfigModule } from '@app/nest/modules';
```

### 4. Environment Configuration

#### Development Environment

```bash
# .env.development
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/venta_dev
REDIS_URL=redis://localhost:6379
```

#### Test Environment

```bash
# .env.test
NODE_ENV=test
DATABASE_URL=postgresql://localhost:5432/venta_test
REDIS_URL=redis://localhost:6379
```

## Debugging and Monitoring

### 1. Logging

```typescript
// Use structured logging
import { Logger } from '@nestjs/common';

@Injectable()
export class VendorService {
  private readonly logger = new Logger(VendorService.name);

  async createVendor(data: CreateVendorDto) {
    this.logger.log(`Creating vendor: ${data.name}`);
    // ... implementation
  }
}
```

### 2. Health Checks

```typescript
// Add health checks to services
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prisma.$queryRaw`SELECT 1`,
      () => this.redis.ping(),
    ]);
  }
}
```

### 3. Performance Monitoring

```bash
# Monitor build performance
nx graph

# Check affected projects
nx affected:graph

# Analyze dependencies
nx dep-graph
```

## Common Patterns

### Standard Service Template

```typescript
@Injectable()
export class StandardService {
  private readonly logger = new Logger(StandardService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('EventsService') private readonly eventsService: IEventsService,
  ) {}

  async performOperation(data: any) {
    this.logger.log(`Performing operation with data: ${JSON.stringify(data)}`);
    
    const result = await this.prisma.db.someTable.create({ data });
    
    // Emit event for state change
    await this.eventsService.publishEvent('operation.completed', {
      id: result.id,
      timestamp: new Date().toISOString(),
    });
    
    return result;
  }
}
```

### Standard Module Template

```typescript
@Module({
  imports: [
    ConfigModule,
    LoggerModule.register({ appName: 'Service Name', protocol: 'grpc' }),
    PrismaModule.register(),
    EventsModule,
    ErrorHandlingModule,
  ],
  controllers: [ServiceController],
  providers: [ServiceService],
})
export class ServiceModule {}
```

### Standard Main.ts Template

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Standard logger setup
  app.useLogger(app.get(Logger));
  
  // Standard error handling
  app.useGlobalFilters(new AppExceptionFilter());
  
  await app.listen(configService.get('SERVICE_PORT'));
}
```

### 1. Service Communication

```typescript
// gRPC communication with automatic retry
import { GrpcInstance } from '@app/nest/modules/grpc-instance/grpc-instance.service';

@Injectable()
export class VendorService {
  constructor(
    private readonly userClient: GrpcInstance<UserServiceClient>
  ) {}

  async createVendor(data: CreateVendorDto) {
    // Call user service via gRPC (automatic retry included)
    const user = await this.userClient.getUser(data.userId);
    // ... implementation
  }
}
```

### 2. Event Publishing

```typescript
// Publish events for state changes
import { IEventsService } from '@app/nest/modules/events';

@Injectable()
export class VendorService {
  constructor(
    @Inject('EventsService') private readonly eventsService: IEventsService
  ) {}

  async createVendor(data: CreateVendorDto) {
    const vendor = await this.prisma.vendor.create({ data });
    
    // Publish event for state change
    await this.eventsService.publishEvent('vendor.created', {
      id: vendor.id,
      name: vendor.name,
      timestamp: new Date().toISOString()
    });

    return vendor;
  }
}
```

### 3. Error Handling

```typescript
// Use custom error filters and structured errors
import { AppError, ErrorCodes } from '@app/errors';

@Injectable()
export class VendorService {
  async getVendor(id: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id } });
    
    if (!vendor) {
      throw AppError.notFound(ErrorCodes.VENDOR_NOT_FOUND, { vendorId: id });
    }
    
    return vendor;
  }
}
```

### 4. Geospatial Operations

```typescript
// Use geospatial utilities for location-based operations
import { GeospatialUtil } from '@app/utils';

@Injectable()
export class LocationService {
  async searchVendorsInArea(swLocation: Location, neLocation: Location) {
    const boundingBox = GeospatialUtil.calculateBoundingBoxDimensions(
      swLocation,
      neLocation
    );
    
    // Use bounding box for geospatial search
    return await this.redis.geosearch(
      'vendor_locations',
      'BYBOX',
      boundingBox.width,
      boundingBox.height,
      'm',
      'FROMLONLAT',
      boundingBox.centerLon,
      boundingBox.centerLat,
      'WITHCOORD'
    );
  }
}
```

## Next Steps

1. **Explore the Codebase**: Familiarize yourself with the project structure
2. **Run Tests**: Ensure all tests pass with `pnpm test`
3. **Start Development**: Use `pnpm start:all` to run all services
4. **Read API Docs**: Check `docs/api.md` for endpoint documentation
5. **Review Architecture**: See `docs/architecture.md` for system design
