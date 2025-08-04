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

Venta Backend is a distributed system consisting of multiple microservices that work together to provide a comprehensive backend solution. The system follows modern architectural patterns including gRPC for inter-service communication, WebSocket for real-time features, and a unified API gateway.

## 🏛️ System Architecture

### 🚀 Core Services

| Service | Purpose | Protocol | Description |
|---------|---------|----------|-------------|
| **Gateway** | API Gateway & Routing | HTTP/gRPC | Main entry point for all client requests |
| **User** | User Management & Webhooks | gRPC | Handles Clerk and RevenueCat webhooks |
| **Vendor** | Vendor Management | gRPC | Vendor profile and business operations |
| **Location** | Location Tracking | gRPC | Real-time location and geospatial operations |
| **WebSocket Gateway** | Real-time Communication | WebSocket | Live updates and real-time features |
| **Algolia Sync** | Search Index Sync | HTTP | Search index synchronization |

### 📚 Shared Libraries

| Library | Purpose | Description |
|---------|---------|-------------|
| **API Types** | Type Definitions | Centralized schemas and validation |
| **NestJS Shared** | Framework Modules | Reusable NestJS modules and utilities |
| **Protocol Buffers** | gRPC Definitions | Service contracts and generated code |
| **Utilities** | Helper Functions | Common utility functions and helpers |

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
pnpm run start:dev gateway
pnpm run start:dev user
pnpm run start:dev vendor
pnpm run start:dev location
pnpm run start:dev websocket-gateway
pnpm run start:dev algolia-sync
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

### 🔧 Development & Testing
- **[API Documentation Guide](docs/api-documentation-guide.md)** - Standards for documenting APIs
- **[Testing Strategy](docs/testing-strategy.md)** - Comprehensive testing approach and guidelines

### 🚀 Deployment & Operations
- **[Deployment Guide](docs/deployment-guide.md)** - Containerization and deployment procedures
- **[Metrics Instrumentation](docs/metrics-instrumentation-guide.md)** - Monitoring and observability
- **[Request ID Propagation](docs/request-id-propagation.md)** - Distributed tracing

### 📖 Quick Reference
- **Service Ports**: All configurable via environment variables
- **Communication**: gRPC for inter-service, HTTP for external APIs, WebSocket for real-time
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for session management and caching
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
