# Venta Backend Documentation

Welcome to the Venta Backend documentation! This comprehensive guide covers everything you need to know about our microservices architecture, development practices, and deployment strategies.

## 📚 Documentation Index

### 🏗️ Architecture & Design

- **[DDD Migration Guide](./ddd-migration-guide.md)** - Complete Domain-Driven Design migration strategy and implementation
- **[DDD Migration Status](./ddd-migration-status.md)** - Current progress and next steps for DDD implementation
- **[Domain Contracts Guide](./domain-contracts-guide.md)** - Comprehensive guide on domain contracts and context mappings
- **[Development Guide](./development-guide.md)** - Setup, development workflow, and coding standards
- **[Deployment Guide](./deployment-guide.md)** - Production deployment and infrastructure management
- **[DDD Best Practices](./ddd-best-practices.md)** - Domain-Driven Design patterns and guidelines

### 🔄 Event-Driven Architecture

- **[Event Pattern Enforcement](./event-pattern-enforcement.md)** - Type-safe event naming and domain boundary enforcement
- **[Testing Strategy](./testing-strategy.md)** - Comprehensive testing approach and guidelines
- **[Unified Error Handling](./unified-error-handling.md)** - Consistent error handling across the system

## 🎯 Quick Start

### For Developers

1. **Setup**: Follow the [Development Guide](./development-guide.md) to get your local environment running
2. **Architecture**: Understand the DDD approach in the [DDD Migration Guide](./ddd-migration-guide.md)
3. **Domain Communication**: Learn about domain contracts in the [Domain Contracts Guide](./domain-contracts-guide.md)
4. **Testing**: Review the [Testing Strategy](./testing-strategy.md) for best practices

### For DevOps

1. **Deployment**: Use the [Deployment Guide](./deployment-guide.md) for production deployments
2. **Architecture**: Review the [DDD Migration Status](./ddd-migration-status.md) for current implementation state
3. **Error Handling**: Understand the [Unified Error Handling](./unified-error-handling.md) approach

### For Domain Teams

1. **Domain Contracts**: Review the [Domain Contracts Guide](./domain-contracts-guide.md) for implementation patterns
2. **Event Patterns**: Understand the [Event Pattern Enforcement](./event-pattern-enforcement.md) for consistent event naming
3. **Best Practices**: Follow the [DDD Best Practices](./ddd-best-practices.md) for domain modeling

## 🔧 System Overview

The Venta Backend is a microservices-based system built with:

- **NestJS** - Framework for building scalable server-side applications
- **gRPC** - High-performance inter-service communication
- **NATS** - Event-driven messaging and streaming
- **PostgreSQL** - Primary database with Prisma ORM
- **Redis** - Caching and session management
- **Docker** - Containerization and deployment
- **Kubernetes** - Orchestration and scaling

## 📊 Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   Mobile Apps   │    │   Web Apps      │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      API Gateway          │
                    │   (apps/gateway)          │
                    └─────────────┬─────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────▼────────┐    ┌───────────▼──────────┐    ┌────────▼────────┐
│  User Service  │    │  Vendor Service      │    │ Location Service│
│ (apps/user)    │    │ (apps/vendor)        │    │(apps/location)  │
└────────────────┘    └──────────────────────┘    └─────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                WebSocket Gateway                            │
│           (apps/websocket-gateway)                         │
│                    Real-time connections                    │
└─────────────────────────────────────────────────────────────┘

                    ┌─────────────▼─────────────┐
                    │    Algolia Sync           │
                    │  (apps/algolia-sync)      │
                    └───────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm package manager
- Docker and Docker Compose
- PostgreSQL and Redis

### Quick Setup

```bash
# Clone and setup
git clone <repository-url>
cd venta-backend
pnpm install

# Environment setup
cp .env.example .env
# Edit .env with your configuration

# Start services
pnpm run docker:up
pnpm run start:dev gateway
```

## 📈 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## 📞 Support

- **Documentation Issues**: Create an issue in this repository
- **Code Issues**: Use the main repository issue tracker
- **Architecture Questions**: Review the [Architecture Overview](./architecture-overview.md)

---

**Last Updated**: January 2025  
**Version**: 1.0.0
