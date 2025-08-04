# Development Guide

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** package manager
- **Docker** and **Docker Compose**
- **Git**
- **PostgreSQL** (for local development)
- **Redis** (for local development)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd venta-backend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Generate Prisma client**
   ```bash
   pnpm run prisma:generate
   ```

5. **Build protocol buffers**
   ```bash
   pnpm run build-proto
   ```

6. **Start infrastructure services**
   ```bash
   pnpm run docker:up
   ```

## Project Structure

### Monorepo Organization

```
venta-backend/
├── apps/                    # Microservices
│   ├── gateway/            # API Gateway
│   ├── user/               # User Service
│   ├── vendor/             # Vendor Service
│   ├── location/           # Location Service
│   ├── websocket-gateway/  # WebSocket Gateway
│   └── algolia-sync/       # Algolia Sync Service
├── libs/                   # Shared Libraries
│   ├── apitypes/           # API Types and Schemas
│   ├── nest/               # NestJS Shared Modules
│   ├── proto/              # Protocol Buffers
│   └── utils/              # Utility Functions
├── docs/                   # Documentation
├── prisma/                 # Database Schema
├── test/                   # Test Utilities
└── docker/                 # Docker Configuration
```

### Service Structure

Each service follows a consistent structure:

```
apps/service-name/
├── src/
│   ├── main.ts             # Application entry point
│   ├── service.module.ts   # Root module
│   ├── controllers/        # HTTP/gRPC controllers
│   ├── services/           # Business logic
│   ├── guards/             # Authentication/authorization
│   ├── pipes/              # Request validation
│   └── dto/                # Data transfer objects
├── Dockerfile              # Container configuration
├── README.md               # Service-specific documentation
└── tsconfig.app.json       # TypeScript configuration
```

## Development Workflow

### 1. Feature Development

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the coding standards
   - Write tests for new functionality
   - Update documentation as needed

3. **Run tests**
   ```bash
   pnpm run test:run
   ```

4. **Check code quality**
   ```bash
   pnpm run lint
   pnpm run format
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

### 2. Running Services

```bash
# Start all services
pnpm run docker:up

# Start individual services (development mode with hot reload)
pnpm run start:dev gateway
pnpm run start:dev user
pnpm run start:dev vendor
pnpm run start:dev location
pnpm run start:dev websocket-gateway
pnpm run start:dev algolia-sync

# Build and run production
pnpm run build
pnpm run start:prod gateway
```

### 3. Database Management

```bash
# Run migrations
pnpm run prisma:migrate:dev

# Reset database
pnpm run prisma:migrate:reset

# View database
pnpm run prisma:studio

# Generate Prisma client
pnpm run prisma:generate
```

## Coding Standards

### TypeScript Guidelines

1. **Use strict TypeScript configuration**
   - Enable all strict flags
   - Use explicit types when beneficial
   - Avoid `any` type

2. **Follow naming conventions**
   ```typescript
   // Interfaces and types
   interface UserProfile { }
   type UserStatus = 'active' | 'inactive';

   // Classes
   class UserService { }

   // Constants
   const API_ENDPOINTS = { };

   // Functions
   function getUserById(id: string): Promise<User> { }
   ```

3. **Use proper imports**
   ```typescript
   // Prefer named imports
   import { Injectable } from '@nestjs/common';
   
   // Use relative imports for local files
   import { UserService } from './user.service';
   
   // Use absolute imports for shared libraries
   import { UserSchema } from '@venta/apitypes';
   ```

### NestJS Best Practices

1. **Module Organization**
   ```typescript
   @Module({
     imports: [
       // External modules first
       ConfigModule,
       // Internal modules
       UserModule,
       // Feature modules
       AuthModule,
     ],
     controllers: [UserController],
     providers: [UserService],
     exports: [UserService],
   })
   export class AppModule {}
   ```

2. **Service Design**
   ```typescript
   @Injectable()
   export class UserService {
     constructor(
       private readonly prisma: PrismaService,
       private readonly logger: LoggerService,
     ) {}

     async handleClerkUserCreated(data: ClerkUserData): Promise<ClerkWebhookResponse> {
       try {
         // Handle Clerk user creation webhook
         return { message: 'User created successfully' };
       } catch (error) {
         this.logger.error('Failed to handle Clerk user creation', error);
         throw new AppError('USER_CREATION_FAILED');
       }
     }
   }
   ```

3. **Controller Design**
   ```typescript
   @Controller('users')
   export class UserController {
     constructor(private readonly userService: UserService) {}

     @Post('webhook/clerk')
     @UseGuards(SignedWebhookGuard)
     async handleClerkWebhook(@Body() data: ClerkWebhookData): Promise<ClerkWebhookResponse> {
       return this.userService.handleClerkUserCreated(data);
     }
   }
   ```

### Error Handling

1. **Use centralized error handling**
   ```typescript
   // Define error types
   export class AppError extends Error {
     constructor(
       public readonly code: string,
       public readonly statusCode: number = 500,
     ) {
       super(code);
     }
   }

   // Use in services
   throw new AppError('WEBHOOK_PROCESSING_FAILED', 500);
   ```

2. **Handle async errors properly**
   ```typescript
   async function handleAsyncOperation() {
     try {
       return await someAsyncOperation();
     } catch (error) {
       this.logger.error('Operation failed', error);
       throw new AppError('OPERATION_FAILED');
     }
   }
   ```

### Testing Guidelines

1. **Unit Tests**
   ```typescript
   describe('UserService', () => {
     let service: UserService;
     let prisma: PrismaService;

     beforeEach(async () => {
       const module = await Test.createTestingModule({
         providers: [
           UserService,
           {
             provide: PrismaService,
             useValue: {
               user: {
                 create: jest.fn(),
                 findUnique: jest.fn(),
               },
             },
           },
         ],
       }).compile();

       service = module.get<UserService>(UserService);
       prisma = module.get<PrismaService>(PrismaService);
     });

     it('should handle Clerk user creation', async () => {
       const clerkData = { id: 'clerk_user_123' };
       const expectedResponse = { message: 'User created successfully' };

       const result = await service.handleClerkUserCreated(clerkData);

       expect(result).toEqual(expectedResponse);
     });
   });
   ```

2. **Integration Tests**
   ```typescript
   describe('UserController (e2e)', () => {
     let app: INestApplication;

     beforeEach(async () => {
       const moduleFixture = await Test.createTestingModule({
         imports: [AppModule],
       }).compile();

       app = moduleFixture.createNestApplication();
       await app.init();
     });

     it('/users/webhook/clerk (POST)', () => {
       return request(app.getHttpServer())
         .post('/users/webhook/clerk')
         .send({ id: 'clerk_user_123' })
         .expect(200);
     });
   });
   ```

## Common Tasks

### Adding a New Service

1. **Create service directory**
   ```bash
   mkdir apps/new-service
   cd apps/new-service
   ```

2. **Initialize NestJS application**
   ```bash
   nest new . --package-manager pnpm
   ```

3. **Update nest-cli.json**
   ```json
   {
     "new-service": {
       "type": "application",
       "root": "apps/new-service",
       "entryFile": "src/main",
       "sourceRoot": ".",
       "compilerOptions": {
         "tsConfigPath": "apps/new-service/tsconfig.app.json"
       }
     }
   }
   ```

4. **Add service to package.json scripts**
   ```json
   {
     "scripts": {
       "start:dev:new-service": "nest start new-service --watch"
     }
   }
   ```

### Adding a New Library

1. **Create library directory**
   ```bash
   mkdir libs/new-library
   cd libs/new-library
   ```

2. **Initialize library**
   ```bash
   nest generate library new-library
   ```

3. **Update nest-cli.json**
   ```json
   {
     "new-library": {
       "type": "library",
       "root": "libs/new-library",
       "entryFile": "index",
       "sourceRoot": "libs/new-library/src",
       "compilerOptions": {
         "tsConfigPath": "libs/new-library/tsconfig.lib.json"
       }
     }
   }
   ```

### Database Schema Changes

1. **Create migration**
   ```bash
   pnpm run prisma:migrate:dev --name add_new_table
   ```

2. **Update Prisma client**
   ```bash
   pnpm run prisma:generate
   ```

3. **Update API types if needed**
   ```bash
   # Update schemas in libs/apitypes
   pnpm run build
   ```

### Protocol Buffer Changes

1. **Update .proto files**
   ```protobuf
   // libs/proto/src/definitions/service.proto
   service NewService {
     rpc NewMethod(NewRequest) returns (NewResponse);
   }
   ```

2. **Regenerate TypeScript code**
   ```bash
   pnpm run build-proto
   ```

3. **Update service implementations**
   ```typescript
   // Implement new gRPC methods
   ```

## Debugging

### Local Development

1. **Enable debug logging**
   ```bash
   DEBUG=* pnpm run start:dev gateway
   ```

2. **Use VS Code debugging**
   ```json
   // .vscode/launch.json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Debug Gateway",
         "type": "node",
         "request": "launch",
         "program": "${workspaceFolder}/apps/gateway/src/main.ts",
         "runtimeArgs": ["-r", "ts-node/register"],
         "env": {
           "NODE_ENV": "development"
         }
       }
     ]
   }
   ```

### Docker Debugging

1. **View logs**
   ```bash
   pnpm run docker:logs
   ```

2. **Access container shell**
   ```bash
   docker exec -it venta-backend-gateway-1 sh
   ```

3. **Inspect container**
   ```bash
   docker inspect venta-backend-gateway-1
   ```

## Performance Optimization

### Code Optimization

1. **Use async/await properly**
   ```typescript
   // Good
   const users = await Promise.all(
     userIds.map(id => userService.findById(id))
   );

   // Avoid
   const users = [];
   for (const id of userIds) {
     users.push(await userService.findById(id));
   }
   ```

2. **Implement caching**
   ```typescript
   @Injectable()
   export class UserService {
     constructor(
       private readonly redis: RedisService,
       private readonly prisma: PrismaService,
     ) {}

     async findById(id: string): Promise<User> {
       const cached = await this.redis.get(`user:${id}`);
       if (cached) {
         return JSON.parse(cached);
       }

       const user = await this.prisma.user.findUnique({ where: { id } });
       await this.redis.setex(`user:${id}`, 3600, JSON.stringify(user));
       return user;
     }
   }
   ```

3. **Use database indexes**
   ```sql
   -- Add indexes for frequently queried columns
   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_users_created_at ON users(created_at);
   ```

## Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using a port
   lsof -i :5000
   
   # Kill process
   kill -9 <PID>
   ```

2. **Database connection issues**
   ```bash
   # Check database status
   docker ps | grep postgres
   
   # Restart database
   docker-compose restart postgres
   ```

3. **Build errors**
   ```bash
   # Clean and rebuild
   pnpm run clean
   pnpm install
   pnpm run build
   ```

4. **Test failures**
   ```bash
   # Run tests with verbose output
   pnpm run test:run -- --verbose
   
   # Run specific test file
   pnpm run test:run -- user.service.spec.ts
   ```

### Getting Help

1. **Check existing documentation**
   - README files in each service
   - API documentation
   - Architecture overview

2. **Review logs**
   - Application logs
   - Docker logs
   - Test output

3. **Search codebase**
   ```bash
   # Search for specific patterns
   grep -r "pattern" apps/ libs/
   
   # Find files by name
   find . -name "*.ts" -type f
   ```

This development guide should help you get started and maintain high code quality throughout the project. 