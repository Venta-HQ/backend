# 🚀 Venta Backend

## Overview

Venta is a location-based marketplace platform connecting mobile vendors with customers in real-time. Built with Domain-Driven Design principles, the system provides real-time location tracking, vendor discovery, and seamless user experiences.

## 🏗️ Architecture

### Domain Organization

```
apps/
├── marketplace/           # Core business domain
│   ├── user-management/  # User accounts & profiles
│   ├── vendor-management/# Vendor operations
│   └── search-discovery/ # Search & recommendations
├── location-services/    # Location tracking domain
│   ├── geolocation/     # Location tracking
│   └── real-time/       # Live updates
├── communication/        # External integration domain
│   └── webhooks/        # External service webhooks
└── infrastructure/      # Cross-cutting concerns
    ├── api-gateway/     # API routing & auth
    └── file-management/ # File storage
```

### Key Features

- **🗺️ Real-time Location Tracking**: Live vendor location updates
- **🔍 Advanced Search**: Location-based and text search via Algolia
- **👤 User Management**: Authentication via Clerk
- **💳 Subscription Management**: Vendor subscriptions via RevenueCat
- **📱 Real-time Updates**: WebSocket-based live updates
- **📍 Geospatial Features**: Redis-powered location queries

## 🛠️ Technology Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma
- **Real-time**: WebSocket, Redis
- **Search**: Algolia
- **Auth**: Clerk
- **Payments**: RevenueCat
- **Monitoring**: Prometheus, Grafana

## 📚 Documentation

### Architecture & Design

- [Architecture Guide](./docs/architecture-guide.md) - System architecture and patterns
- [Developer Guide](./docs/developer-guide.md) - Development patterns and practices
- [Concepts Guide](./docs/concepts-guide.md) - Key concepts and terminology

### Development

- [API Documentation](./docs/api-docs.md) - API endpoints and usage
- [Testing Guide](./docs/testing-guide.md) - Testing patterns and practices
- [Monitoring Guide](./docs/monitoring-guide.md) - Observability and metrics
- [Deployment Guide](./docs/deployment-guide.md) - Deployment and scaling

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- pnpm

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/venta-backend.git
   cd venta-backend
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start infrastructure services**

   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**

   ```bash
   pnpm prisma migrate deploy
   ```

6. **Start development server**
   ```bash
   pnpm dev
   ```

### Development Commands

```bash
# Start development
pnpm dev

# Build project
pnpm build

# Run tests
pnpm test

# Run linting
pnpm lint

# Run formatting
pnpm format
```

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

## 📊 Monitoring

The system includes comprehensive monitoring:

- **Prometheus**: Metrics collection
- **Grafana**: Visualization and dashboards
- **Structured Logging**: JSON format with correlation
- **Request Tracing**: Cross-service request tracking

Access monitoring:

- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090

## 🔄 CI/CD

Automated pipelines handle:

- Code quality checks
- Test execution
- Build verification
- Deployment automation

## 📦 Deployment

The system is designed for containerized deployment:

```bash
# Build containers
docker-compose build

# Deploy services
docker-compose up -d

# Scale specific service
docker-compose up -d --scale service-name=3
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
