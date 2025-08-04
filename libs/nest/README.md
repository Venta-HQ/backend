# NestJS Shared Library

## Purpose

The NestJS Shared Library provides reusable NestJS modules, services, guards, filters, and utilities that are shared across all microservices in the Venta backend system. It encapsulates common functionality to promote code reuse and maintain consistency.

## What It Contains

### Core Modules
- **Configuration Management**: Environment variable handling and validation
- **Database Integration**: Prisma client setup and connection management
- **Caching**: Redis integration for distributed caching
- **Authentication**: Clerk integration for user authentication
- **File Upload**: Cloudinary integration for file storage
- **Search**: Algolia integration for search functionality
- **Event System**: NATS-based event publishing and subscription
- **Health Checks**: Service health monitoring and reporting

### Guards & Filters
- **Authentication Guards**: Request authentication and authorization
- **Exception Filters**: Centralized error handling for HTTP, gRPC, and WebSocket contexts
- **Validation Pipes**: Request data validation using Zod schemas

### Utilities
- **Logging**: Structured logging with request context tracking
- **gRPC Client Management**: Reusable gRPC client instances
- **Error Handling**: Standardized error types and codes

## Usage

This library is imported by all microservices and the gateway to provide consistent functionality across the entire system.

### For Microservices
```typescript
// Import shared modules in your service
import { 
  ConfigModule, 
  PrismaModule, 
  RedisModule, 
  LoggerModule,
  EventsModule 
} from '@app/nest/modules';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    LoggerModule,
    EventsModule
  ],
  controllers: [MyController],
  providers: [MyService]
})
export class MyServiceModule {}
```

### For Controllers
```typescript
// Use guards and filters in controllers
import { 
  AuthGuard, 
  AppExceptionFilter,
  SchemaValidatorPipe 
} from '@app/nest';

@Controller('api')
@UseGuards(AuthGuard)
@UseFilters(AppExceptionFilter)
export class MyController {
  @Post('data')
  @UsePipes(new SchemaValidatorPipe(dataSchema))
  async createData(@Body() data: CreateDataRequest) {
    return this.service.createData(data);
  }
}
```

### For Services
```typescript
// Inject shared services
import { 
  Logger, 
  PrismaService, 
  RedisService,
  EventsService 
} from '@app/nest/modules';

@Injectable()
export class MyService {
  constructor(
    private readonly logger: Logger,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly events: EventsService
  ) {}

  async processData(data: any) {
    this.logger.log('Processing data', 'MyService');
    
    // Store in database
    const result = await this.prisma.data.create({ data });
    
    // Cache result
    await this.redis.set(`data:${result.id}`, JSON.stringify(result));
    
    // Publish event
    await this.events.publish('data.created', { id: result.id });
    
    return result;
  }
}
```

### For Error Handling
```typescript
// Use standardized error handling
import { AppError, ErrorCodes } from '@app/nest/errors';

@Injectable()
export class MyService {
  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    
    if (!user) {
      throw new AppError('User not found', ErrorCodes.NOT_FOUND);
    }
    
    return user;
  }
}
```

## Key Benefits

- **Code Reuse**: Eliminates duplication across services
- **Consistency**: Ensures uniform behavior across the system
- **Maintainability**: Centralized updates for shared functionality
- **Reliability**: Battle-tested components used across all services

## Dependencies

- NestJS framework
- Prisma for database access
- Redis for caching
- Clerk for authentication
- Cloudinary for file storage
- Algolia for search
- NATS for event messaging 