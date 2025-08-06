# Venta Backend Documentation

Welcome to the Venta Backend documentation! This comprehensive guide covers everything you need to know about our microservices architecture, development practices, and deployment strategies.

## 📚 Documentation Index

### 🏗️ Architecture & Design
- **[Architecture Overview](./architecture-overview.md)** - High-level system architecture and design patterns
- **[Development Guide](./development-guide.md)** - Setup, development workflow, and coding standards
- **[Deployment Guide](./deployment-guide.md)** - Production deployment and infrastructure management
- **[API Documentation Guide](./api-documentation-guide.md)** - API documentation standards and best practices
- **[Testing Strategy](./testing-strategy.md)** - Comprehensive testing approach and guidelines
- **[Metrics Instrumentation Guide](./metrics-instrumentation-guide.md)** - Observability and monitoring setup
- **[Request ID Propagation](./request-id-propagation.md)** - Distributed tracing and request correlation

### 🔄 Event-Driven Architecture
- **[Comprehensive NATS Guide](./nats-comprehensive-guide.md)** - Complete guide to NATS subjects, streams, and queue groups for autoscaling microservices
- **[Event System](./event-system.md)** - Type-safe event system with automatic intellisense

### 🚀 Application Patterns
- **[Bootstrap Pattern](./bootstrap-pattern.md)** - Standardized application bootstrapping patterns

## 🎯 Quick Start

### For Developers
1. **Setup**: Follow the [Development Guide](./development-guide.md) to get your local environment running
2. **Architecture**: Understand the system design in the [Architecture Overview](./architecture-overview.md)
3. **Testing**: Review the [Testing Strategy](./testing-strategy.md) for best practices

### For DevOps
1. **Deployment**: Use the [Deployment Guide](./deployment-guide.md) for production deployments
2. **Monitoring**: Set up observability with the [Metrics Instrumentation Guide](./metrics-instrumentation-guide.md)
3. **Tracing**: Configure distributed tracing with [Request ID Propagation](./request-id-propagation.md)

### For API Consumers
1. **Documentation**: Review the [API Documentation Guide](./api-documentation-guide.md) for integration details
2. **Events**: Understand the [Event System](./event-system.md) for real-time updates
3. **NATS**: Learn about message patterns in the [NATS Guide](./nats-comprehensive-guide.md)

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
