# Getting Started

## Prerequisites

### Required Software

- **Node.js**: v18 or higher
- **pnpm**: Package manager
- **Docker**: For containerized development
- **Docker Compose**: For local infrastructure
- **PostgreSQL**: Database (or use Docker)
- **NATS**: Event messaging (or use Docker)
- **Redis**: Cache (or use Docker)

### Optional Tools

- **NATS CLI**: For debugging NATS
- **PostgreSQL CLI**: For database management
- **ngrok**: For webhook testing

## Environment Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd venta-backend
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Configuration

Copy the environment template and configure your variables:

```bash
# Copy environment template
cp ENVIRONMENT.md .env

# Edit .env with your configuration
nano .env
```

#### Required Environment Variables

**Database**

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/venta_db
PULSE_API_KEY=your_pulse_api_key
```

**Event System (NATS)**

```bash
NATS_URL=nats://localhost:4222
```

**Cache (Redis)**

```bash
REDIS_URL=redis://:password@localhost:6379
REDIS_PASSWORD=your_redis_password
```

**Authentication**

```bash
CLERK_SECRET_KEY=your_clerk_secret_key
```

**External Services**

```bash
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name

ALGOLIA_APPLICATION_ID=your_algolia_app_id
ALGOLIA_API_KEY=your_algolia_api_key
```

**Service URLs (Local Development)**

```bash
USER_SERVICE_URL=localhost:5000
VENDOR_SERVICE_URL=localhost:5005
LOCATION_SERVICE_URL=localhost:5001
GATEWAY_SERVICE_URL=localhost:5002
WEBSOCKET_GATEWAY_SERVICE_URL=localhost:5004
ALGOLIA_SYNC_SERVICE_URL=localhost:5006
```

### 4. Database Setup

#### Using Docker (Recommended)

```bash
# Start local infrastructure
docker-compose up -d postgres redis nats

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma db push
```

#### Manual Setup

```bash
# Create database
createdb venta_db

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma db push
```

## Development Workflow

### Nx Monorepo Structure

This project uses **Nx** for monorepo management with the following structure:

```
venta-backend/
├── apps/                         # Applications (microservices)
│   ├── gateway/                  # HTTP API Gateway
│   ├── user/                     # User management service
│   ├── vendor/                   # Vendor management service
│   ├── location/                 # Location tracking service
│   ├── websocket-gateway/        # WebSocket connections
│   └── algolia-sync/             # Search index synchronization
├── libs/                         # Shared libraries
│   ├── nest/                     # NestJS framework utilities
│   │   ├── modules/              # Shared modules (config, events, etc.)
│   │   ├── guards/               # Authentication guards
│   │   ├── filters/              # Exception filters
│   │   └── pipes/                # Validation pipes
│   ├── proto/                    # gRPC protocol definitions
│   └── apitypes/                 # API types and schemas
├── prisma/                       # Database schema
├── docs/                         # Documentation
└── docker-compose.yml            # Local infrastructure
```

### Available Commands

#### Build Commands

```bash
# Build all projects
pnpm build

# Build specific project
nx build gateway
nx build user
nx build vendor

# Build libraries
nx build nest
nx build proto
nx build apitypes
```

#### Development Commands

```bash
# Start all services in development mode
pnpm start:all

# Start individual services
pnpm start:gateway      # API Gateway
pnpm start:user         # User service
pnpm start:vendor       # Vendor service
pnpm start:location     # Location service
pnpm start:algolia-sync # Algolia sync service
pnpm start:websocket-gateway # WebSocket gateway

# Start with ngrok for webhook testing
pnpm start:ngrok
```

#### Testing Commands

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests for specific project
nx test nest
nx test gateway

# Run tests for libraries only
pnpm test:libs
```

#### Linting and Formatting

```bash
# Lint all projects
pnpm lint

# Format code
pnpm format
```

### Development Tips

#### Using Nx Commands

```bash
# Show all projects
nx show projects

# Show project details
nx show project gateway

# Run commands for specific projects
nx serve gateway --configuration=development
nx build user --configuration=production
nx test nest --watch
```

#### Hot Reload Development

```bash
# Start a service with hot reload
nx serve gateway --configuration=development

# Start multiple services concurrently
pnpm start:all
```

#### Database Development

```bash
# Generate Prisma client after schema changes
pnpm prisma:generate

# Push schema changes to database
pnpm prisma db push

# Open Prisma Studio
npx prisma studio
```

## Next Steps

1. **Start Development**: Run `pnpm start:all` to start all services
2. **Explore APIs**: Check the API documentation in `docs/api.md`
3. **Run Tests**: Execute `pnpm test` to verify everything works
4. **Read Architecture**: Review `docs/architecture.md` for system design
5. **Check Troubleshooting**: See `docs/troubleshooting.md` for common issues

## Troubleshooting

### Common Issues

**Port Conflicts**: If services fail to start, check if ports are already in use:
```bash
lsof -i :5000-5010
```

**Database Connection**: Ensure PostgreSQL is running:
```bash
docker-compose ps postgres
```

**Nx Cache Issues**: Clear Nx cache if builds fail:
```bash
nx reset
```

For more detailed troubleshooting, see `docs/troubleshooting.md`.
