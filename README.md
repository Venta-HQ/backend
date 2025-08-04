# Venta Backend

A microservices-based backend system built with NestJS, providing a scalable and maintainable architecture for the Venta platform.

## Overview

Venta Backend is a distributed system consisting of multiple microservices that work together to provide a comprehensive backend solution. The system follows modern architectural patterns including event-driven communication, gRPC for inter-service communication, and a unified API gateway.

## Architecture

### Services

- **Gateway**: Main API entry point with authentication and request routing
- **User Service**: User management, authentication, and profile handling
- **Vendor Service**: Vendor management and business logic
- **Location Service**: Real-time location tracking and geospatial operations
- **WebSocket Gateway**: Real-time communication and live updates
- **Algolia Sync**: Search index synchronization and optimization

### Libraries

- **API Types**: Centralized type definitions and validation schemas
- **NestJS Shared**: Reusable NestJS modules, guards, and utilities
- **Protocol Buffers**: gRPC service definitions and generated code
- **Utilities**: Common utility functions and helper methods

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- pnpm package manager
- Docker and Docker Compose
- PostgreSQL database
- Redis cache
- NATS message broker

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm run prisma:generate

# Build protocol buffers
pnpm run build-proto

# Build the project
pnpm run build
```

### Development

```bash
# Start all services with Docker Compose
docker-compose up -d

# Run tests
pnpm run test:run

# Run tests with coverage
pnpm run test:coverage

# Lint code
pnpm run lint

# Format code
pnpm run format
```

### Running Individual Services

```bash
# Start specific service
pnpm run start:dev gateway
pnpm run start:dev user
pnpm run start:dev vendor
pnpm run start:dev location
pnpm run start:dev websocket-gateway
pnpm run start:dev algolia-sync
```

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/venta"

# Redis
REDIS_PASSWORD="your-redis-password"

# Services
GATEWAY_SERVICE_PORT=5002
USER_SERVICE_ADDRESS=localhost:5000
VENDOR_SERVICE_ADDRESS=localhost:5005
LOCATION_SERVICE_ADDRESS=localhost:5001
WEBSOCKET_GATEWAY_SERVICE_PORT=5004
ALGOLIA_SYNC_SERVICE_PORT=5006

# External Services
CLERK_SECRET_KEY="your-clerk-secret"
ALGOLIA_APP_ID="your-algolia-app-id"
ALGOLIA_API_KEY="your-algolia-api-key"
CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
CLOUDINARY_API_KEY="your-cloudinary-key"
CLOUDINARY_API_SECRET="your-cloudinary-secret"
```

## Development Workflow

1. **Feature Development**: Create feature branches from `main`
2. **Testing**: Write tests for new functionality
3. **Code Quality**: Ensure code passes linting and formatting
4. **Documentation**: Update relevant README files
5. **Review**: Submit pull requests for code review

## Testing

The project uses Vitest for testing with comprehensive coverage:

```bash
# Run all tests
pnpm run test:run

# Run tests in watch mode
pnpm run test

# Run tests with UI
pnpm run test:ui

# Generate coverage report
pnpm run test:coverage
```

## Deployment

The system is containerized using Docker and can be deployed using Docker Compose or Kubernetes.

### Docker Deployment

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is proprietary and confidential.
