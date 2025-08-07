# 🚀 Venta Backend

<div align="center">

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

**A modern microservices-based backend system built with NestJS, providing scalable and maintainable architecture for the Venta platform.**

[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

---

## 🏗️ Architecture Overview

Venta Backend is a distributed system built with Domain-Driven Design (DDD) principles, consisting of multiple microservices organized around business domains. The system follows modern architectural patterns including gRPC for inter-service communication, WebSocket for real-time features, and a unified API gateway.

**🚀 Currently migrating to full DDD architecture** - See [DDD Migration Status](./docs/ddd-migration-status.md) for current progress.

## 🏛️ System Architecture

### 🚀 Core Services

| Service               | Purpose                        | Protocol  | Description                                  |
| --------------------- | ------------------------------ | --------- | -------------------------------------------- |
| **API Gateway**       | HTTP Routing & Auth            | HTTP/gRPC | Main entry point for all client requests     |
| **User Management**   | User Registration & Profiles   | gRPC      | User accounts, preferences, and webhooks     |
| **Vendor Management** | Vendor Onboarding & Operations | gRPC      | Vendor profiles and business operations      |
| **Location Services** | Geolocation & Proximity        | gRPC      | Real-time location and geospatial operations |
| **Real-time Gateway** | WebSocket Communication        | WebSocket | Live updates and real-time features          |
| **Search Discovery**  | Search Index & Discovery       | HTTP      | Search, recommendations, and discovery       |

> **📋 Note**: Services are being reorganized into domain-driven structure. See [DDD Migration Guide](./docs/ddd-migration-guide.md) for target architecture.

### 📚 Shared Libraries

| Library              | Purpose           | Description                           |
| -------------------- | ----------------- | ------------------------------------- |
| **API Types**        | Type Definitions  | Centralized schemas and validation    |
| **NestJS Shared**    | Framework Modules | Reusable NestJS modules and utilities |
| **Protocol Buffers** | gRPC Definitions  | Service contracts and generated code  |
| **Utilities**        | Helper Functions  | Common utility functions and helpers  |

## 🚀 Quick Start

### 📋 Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** package manager
- **Docker** and **Docker Compose**
- **PostgreSQL** database
- **Redis** cache

### ⚡ Installation

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

### 🛠️ Development

```bash
# Start all services with Docker Compose
pnpm run docker:up

# Run tests
pnpm run test:run

# Run tests with coverage
pnpm run test:coverage

# Lint code
pnpm run lint

# Format code
pnpm run format
```

### 🔧 Running Individual Services

```bash
# Start specific service
pnpm run start:dev api-gateway
pnpm run start:dev user-management
pnpm run start:dev vendor-management
pnpm run start:dev location-services
pnpm run start:dev real-time-gateway
pnpm run start:dev search-discovery
```

## ⚙️ Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/venta"

# Redis
REDIS_PASSWORD="your-redis-password"

# Services
GATEWAY_SERVICE_PORT=5002
USER_SERVICE_ADDRESS=localhost:5000
USER_HEALTH_PORT=5010
VENDOR_SERVICE_ADDRESS=localhost:5005
VENDOR_HEALTH_PORT=5015
LOCATION_SERVICE_ADDRESS=localhost:5001
LOCATION_HEALTH_PORT=5011
WEBSOCKET_GATEWAY_SERVICE_PORT=5004
ALGOLIA_SYNC_HEALTH_PORT=5016

# External Services
CLERK_SECRET_KEY="your-clerk-secret"
ALGOLIA_APP_ID="your-algolia-app-id"
ALGOLIA_API_KEY="your-algolia-api-key"
CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
CLOUDINARY_API_KEY="your-cloudinary-key"
CLOUDINARY_API_SECRET="your-cloudinary-secret"
```

## 🔄 Development Workflow

1. **Feature Development**: Create feature branches from `main`
2. **Testing**: Write tests for new functionality
3. **Code Quality**: Ensure code passes linting and formatting
4. **Documentation**: Update relevant README files
5. **Review**: Submit pull requests for code review

## 🧪 Testing

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

## 🚀 Deployment

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

## 📚 Documentation

### 🏗️ Architecture & Design

- **[Architecture Overview](docs/architecture-overview.md)** - Complete system architecture and design patterns
- **[Development Guide](docs/development-guide.md)** - Setup, workflows, and best practices
- **[Domain-Driven Design Guide](docs/ddd-migration-guide.md)** - DDD architecture implementation guide
- **[DDD Migration Status](docs/ddd-migration-status.md)** - Current migration progress and status
- **[Full Architecture Vision](docs/full-architecture-vision.md)** - Complete end-state architecture with all features

### 🔧 Development & Testing

- **[Testing Strategy](docs/testing-strategy.md)** - Comprehensive testing approach and guidelines
- **[Naming Conventions](docs/naming-conventions.md)** - Code organization standards

### 🚀 Deployment & Operations

- **[Deployment Guide](docs/deployment-guide.md)** - Containerization and deployment procedures
- **[Metrics Instrumentation](docs/metrics-instrumentation-guide.md)** - Monitoring and observability
- **[Request ID Propagation](docs/request-id-propagation.md)** - Distributed tracing
- **[Infrastructure Cost Analysis](docs/infrastructure-cost-analysis.md)** - Kubernetes deployment costs and scaling

### 📖 Quick Reference

- **Service Ports**: All configurable via environment variables
- **Communication**: gRPC for inter-service, HTTP for external APIs, WebSocket for real-time
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for session management and caching
- **Events**: NATS for event-driven communication between services
- **Search**: Algolia integration for full-text search

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is proprietary and confidential.
