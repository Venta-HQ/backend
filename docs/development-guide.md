# 💻 Development Guide

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [DDD Architecture](#ddd-architecture)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Common Tasks](#common-tasks)
- [Debugging](#debugging)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

| Tool               | Version       | Purpose                          |
| ------------------ | ------------- | -------------------------------- |
| **Node.js**        | v18 or higher | JavaScript runtime               |
| **pnpm**           | Latest        | Package manager                  |
| **Docker**         | Latest        | Containerization                 |
| **Docker Compose** | Latest        | Multi-container orchestration    |
| **Git**            | Latest        | Version control                  |
| **PostgreSQL**     | 15+           | Database (for local development) |
| **Redis**          | 7+            | Caching (for local development)  |

### 🛠️ Initial Setup

#### 1. **Clone the repository**

```bash
git clone <repository-url>
cd venta-backend
```

#### 2. **Install dependencies**

```bash
pnpm install
```

#### 3. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your local configuration
```

#### 4. **Generate Prisma client**

```bash
pnpm run prisma:generate
```

#### 5. **Build protocol buffers**

```bash
pnpm run build-proto
```

#### 6. **Start infrastructure services**

```bash
pnpm run docker:up
```

## 📁 Project Structure

### 🏗️ DDD-Aligned Monorepo Organization

```
venta-backend/
├── 📁 apps/                           # Microservices by Domain
│   ├── 🏪 marketplace/                # Marketplace Domain
│   │   ├── user-management/          # User accounts, profiles, preferences
│   │   ├── vendor-management/        # Vendor profiles, business operations
│   │   └── search-discovery/         # Search, recommendations, discovery
│   ├── 📍 location-services/         # Location Services Domain
│   │   ├── geolocation/             # Location tracking & storage
│   │   └── real-time/               # Live location updates (WebSocket)
│   ├── 💬 communication/            # Communication Domain
│   │   └── webhooks/                # External integrations (Clerk, RevenueCat)
│   └── 🔧 infrastructure/           # Infrastructure Domain
│       ├── api-gateway/             # HTTP routing & auth
│       └── file-management/         # File uploads & storage
├── 📚 libs/                          # Shared Libraries
│   ├── 📝 apitypes/                 # DDD-aligned API Types and Schemas
│   ├── 🔄 eventtypes/               # Centralized Event Definitions
│   ├── 🪺 nest/                     # NestJS Shared Modules & Error Handling
│   ├── 📡 proto/                    # Protocol Buffers
│   └── 🛠️ utils/                    # Utility Functions
├── 📖 docs/                         # Documentation
├── 🗄️ prisma/                       # Database Schema
├── 🧪 test/                         # Test Utilities
└── 🐳 docker/                       # Docker Configuration
```

### 🔧 Service Structure

Each service follows a consistent DDD-aligned structure:

```
apps/domain/service-name/
├── src/
│   ├── subdomain-modules/           # Business subdomains
│   │   ├── core/                   # Core domain logic
│   │   ├── authentication/         # Auth-related functionality
│   │   ├── subscriptions/          # Subscription management
│   │   └── vendors/                # Vendor relationships
│   ├── main.ts                     # Service entry point
│   └── service-name.module.ts      # Root module
├── Dockerfile                       # Container configuration
├── README.md                        # Service documentation
└── tsconfig.app.json               # TypeScript configuration
```

## 🏛️ DDD Architecture

### **Domain Organization**

The system is organized into four main business domains:

#### **🏪 Marketplace Domain**
- **User Management**: User accounts, profiles, preferences, authentication
- **Vendor Management**: Vendor profiles, business operations, onboarding
- **Search Discovery**: Search, recommendations, discovery, Algolia integration

#### **📍 Location Services Domain**
- **Geolocation**: Location tracking, storage, geospatial operations
- **Real-time**: Live location updates, WebSocket communication

#### **💬 Communication Domain**
- **Webhooks**: External integrations (Clerk, RevenueCat), event processing

#### **🔧 Infrastructure Domain**
- **API Gateway**: HTTP routing, authentication, load balancing
- **File Management**: File uploads, storage, media processing

### **Shared Libraries**

#### **📝 API Types (`@app/apitypes`)**
- DDD-aligned type definitions and schemas
- Domain-specific validation schemas
- Protocol buffer types for gRPC communication

#### **🔄 Event Types (`@app/eventtypes`)**
- Centralized event definitions and schemas
- Type-safe event emission and consumption
- Domain-specific event mappings

#### **🪺 NestJS Shared (`@app/nest`)**
- Unified error handling with automatic domain context
- Standardized modules (Prisma, Redis, Events, etc.)
- Guards, interceptors, and filters
- Bootstrap patterns for consistent service configuration

### **Error Handling**

The system uses a unified error handling approach:

```typescript
import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';

@Injectable()
export class YourService {
  async getResource(id: string) {
    const resource = await this.prisma.db.resource.findUnique({ where: { id } });

    if (!resource) {
      throw new AppError(
        ErrorType.NOT_FOUND,
        ErrorCodes.RESOURCE_NOT_FOUND,
        'Resource not found',
        { resourceId: id }
      );
    }

    return resource;
  }
}
```

### **Event System**

Events are managed through the centralized `eventtypes` library:

```typescript
import { EventDataMap, AvailableEventSubjects } from '@app/eventtypes';

@Injectable()
export class YourService {
  constructor(private eventService: EventService) {}

  async createResource(data: CreateResourceData) {
    const resource = await this.prisma.db.resource.create({ data });

    // Type-safe event emission
    await this.eventService.emit('resource.created', {
      id: resource.id,
      name: resource.name,
      timestamp: new Date(),
    });

    return resource;
  }
}
```

## 🔄 Development Workflow

### **Feature Development**

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow DDD Principles**
   - Organize code by business domains
   - Use domain-specific error handling
   - Emit type-safe events for cross-service communication

3. **Write Tests**
   ```bash
   pnpm run test:run
   pnpm run test:coverage
   ```

4. **Code Quality**
   ```bash
   pnpm run lint
   pnpm run format
   ```

5. **Documentation**
   - Update relevant README files
   - Document domain-specific changes

### **Service Development**

#### **Adding New Services**

1. **Create Service Structure**
   ```bash
   mkdir -p apps/domain/service-name/src
   ```

2. **Configure Bootstrap**
   ```typescript
   // main.ts
   await BootstrapService.bootstrapGrpcMicroservice({
     app,
     domain: 'domain-name', // Explicit DDD domain
     appName: APP_NAMES.SERVICE_NAME,
   });
   ```

3. **Add to Docker Compose**
   ```yaml
   services:
     service-name:
       build: ./apps/domain/service-name
       environment:
         - DOMAIN=domain-name
   ```

#### **Adding New Domain Logic**

1. **Create Domain Service**
   ```typescript
   @Injectable()
   export class DomainService {
     constructor(
       private prisma: PrismaService,
       private eventService: EventService,
       private logger: Logger,
     ) {}

     async performDomainOperation(data: DomainData) {
       this.logger.log('Performing domain operation', { data });
       
       // Domain logic here
       
       // Emit events for cross-service communication
       await this.eventService.emit('domain.event', eventData);
     }
   }
   ```

2. **Add Error Handling**
   ```typescript
   try {
     // Domain operation
   } catch (error) {
     throw new AppError(
       ErrorType.INTERNAL,
       ErrorCodes.DATABASE_ERROR,
       'Operation failed',
       { operation: 'domain_operation' }
     );
   }
   ```

## 🧪 Testing Guidelines

### **Unit Testing**

```typescript
describe('DomainService', () => {
  let service: DomainService;
  let mockPrisma: jest.Mocked<PrismaService>;
  let mockEventService: jest.Mocked<EventService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DomainService,
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

    service = module.get<DomainService>(DomainService);
    mockPrisma = module.get(PrismaService);
    mockEventService = module.get(EventService);
  });

  it('should perform domain operation successfully', async () => {
    // Test implementation
  });
});
```

### **Integration Testing**

```typescript
describe('DomainController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/domain (POST)', () => {
    return request(app.getHttpServer())
      .post('/domain')
      .send(validData)
      .expect(201);
  });
});
```

## 🔧 Common Tasks

### **Adding New Event Types**

1. **Define Event Schema**
   ```typescript
   // libs/eventtypes/src/domains/domain/domain.events.ts
   export const domainEventSchemas = {
     'domain.event': z.object({
       id: z.string(),
       data: z.object({
         // event data structure
       }),
       timestamp: z.date(),
     }),
   } as const;
   ```

2. **Add to Unified Registry**
   ```typescript
   // libs/eventtypes/src/shared/unified-event-registry.ts
   export const ALL_EVENT_SCHEMAS = {
     ...domainEventSchemas,
     // other schemas
   } as const;
   ```

3. **Use in Services**
   ```typescript
   await this.eventService.emit('domain.event', {
     id: 'event-id',
     data: { /* event data */ },
     timestamp: new Date(),
   });
   ```

### **Adding New Error Codes**

1. **Add to Error Codes**
   ```typescript
   // libs/nest/errors/errorcodes.ts
   export const ErrorCodes = {
     // existing codes...
     DOMAIN_SPECIFIC_ERROR: 'DOMAIN_SPECIFIC_ERROR',
   } as const;
   ```

2. **Use in Services**
   ```typescript
   throw new AppError(
     ErrorType.VALIDATION,
     ErrorCodes.DOMAIN_SPECIFIC_ERROR,
     'Domain-specific error message',
     { context: 'additional_info' }
   );
   ```

## 🐛 Debugging

### **Error Investigation**

1. **Check Domain Context**
   - All errors automatically include domain context
   - Look for `domain` field in error logs

2. **Event Tracing**
   - Use correlation IDs for request tracing
   - Check event emission and consumption logs

3. **Service Communication**
   - Verify gRPC service connections
   - Check NATS event delivery

### **Log Analysis**

```bash
# View service logs
docker-compose logs -f service-name

# Filter by domain
docker-compose logs -f service-name | grep "domain=marketplace"

# Check error patterns
docker-compose logs -f service-name | grep "ERROR"
```

## ⚡ Performance Optimization

### **Domain-Specific Optimization**

- **Marketplace Services**: Optimize for user activity patterns
- **Location Services**: Optimize for real-time location updates
- **Communication Services**: Optimize for webhook processing
- **Infrastructure Services**: Optimize for load balancing and routing

### **Resource Allocation**

- **CPU-Intensive**: Location services (geospatial calculations)
- **Memory-Intensive**: Real-time services (WebSocket connections)
- **I/O-Intensive**: File management and database operations

## 🔧 Troubleshooting

### **Common Issues**

1. **Domain Configuration Missing**
   - Ensure `domain` is set in bootstrap configuration
   - Check environment variables for domain context

2. **Event Type Errors**
   - Verify event schemas are properly defined
   - Check unified event registry imports

3. **Error Context Missing**
   - Ensure `AppExceptionFilter` is properly configured
   - Check `ConfigService` for domain configuration

### **Getting Help**

- Check the [DDD Migration Guide](./ddd-migration-guide.md)
- Review [DDD Migration Status](./ddd-migration-status.md)
- Consult service-specific README files
- Check error logs for domain context information
