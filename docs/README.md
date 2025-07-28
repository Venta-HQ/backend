# Venta Backend Documentation

Welcome to the Venta Backend documentation. This guide covers the architecture, setup, and development practices for our NestJS microservices backend.

## 📚 Documentation Sections

### [Architecture Overview](./architecture.md)

- System architecture and design patterns
- Service communication patterns
- Event-driven architecture
- Technology stack

### [Getting Started](./getting-started.md)

- Environment setup
- Local development
- Docker deployment
- Service configuration

### [API Documentation](./api.md)

- Gateway API endpoints
- gRPC service definitions
- WebSocket events
- Authentication and authorization

### [Database Schema](./database.md)

- Prisma schema structure
- Model relationships
- Migrations and seeding
- Database best practices

### [Event System](./events.md)

- Event-driven architecture
- NATS implementation with provider-agnostic design
- Event types and schemas
- Error handling and retries

### [Development Guide](./development.md)

- Code organization
- Testing strategies
- Deployment pipeline
- Monitoring and logging

### [Architecture Improvements](./architecture-improvements.md)

- Potential optimizations and enhancements
- Performance improvements
- Security enhancements
- Monitoring and observability

### [Troubleshooting](./troubleshooting.md)

- Common issues and solutions
- Debugging techniques
- Performance optimization
- Health checks

### [Request Tracing](./request-tracing.md)

- Request ID propagation across services
- Distributed tracing and debugging
- Correlation and monitoring
- Best practices for request tracking

## 🚀 Quick Start

1. **Setup Environment**

   ```bash
   cp ENVIRONMENT.md .env
   # Edit .env with your configuration
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   ```

3. **Start Services**

   ```bash
   pnpm run start:all
   ```

4. **Verify Health**
   ```bash
   curl http://localhost:5002/health  # Gateway
   curl http://localhost:5006/health  # Algolia Sync
   curl http://localhost:8222/healthz # NATS Server
   ```

## 📋 Recent Changes

### v3.0.0 - NATS Migration & Provider-Agnostic Design

- ✅ Migrated from Redis pub/sub to NATS for event system
- ✅ Implemented provider-agnostic `IEventsService` interface
- ✅ All services now use generic event service injection
- ✅ Enhanced event persistence and subject-based routing
- ✅ Zero-downtime provider migration capability
- ✅ Improved monitoring and health checks

### v2.0.0 - Event-Driven Refactor

- ✅ Replaced `dbchange` service with event-driven `algolia-sync`
- ✅ Centralized configuration with validation
- ✅ DRY Docker builds with shared base image
- ✅ Enhanced error handling and retries
- ✅ Improved monitoring and health checks

## 🤝 Contributing

See [Development Guide](./development.md) for contribution guidelines and best practices.
