# Documentation

This directory contains comprehensive documentation for the Venta Backend project.

## Documentation Structure

### Getting Started

- **[Getting Started Guide](getting-started.md)** - Complete setup and first steps
- **[Nx Monorepo Guide](nx-guide.md)** - Understanding and using the Nx workspace

### Development

- **[Development Guide](development.md)** - Development workflow and best practices
- **[API Documentation](api.md)** - API endpoints and usage
- **[Architecture Overview](architecture.md)** - System design and architecture
- **[Event System](events.md)** - Event-driven communication patterns
- **[Event Sourcing](event-sourcing.md)** - Event sourcing implementation

### Database & Infrastructure

- **[Database Guide](database.md)** - Database schema and management
- **[Service Discovery Setup](service-discovery-setup.md)** - Service discovery and health monitoring

### Troubleshooting & Maintenance

- **[Troubleshooting Guide](troubleshooting.md)** - Common issues and solutions
- **[App Improvements](app-improvements.md)** - Current improvements and standards

## Quick Reference

### Essential Commands

```bash
# Development
pnpm start:all                    # Start all services
pnpm start:{service-name}         # Start specific service

# Building
pnpm build                        # Build all projects
nx build {project-name}           # Build specific project

# Testing
pnpm test                         # Run all tests
nx test {project-name}            # Test specific project

# Linting
pnpm lint                         # Lint all projects
nx lint {project-name}            # Lint specific project
```

### Project Structure

```
{workspace-root}/
├── apps/                         # Applications (microservices)
│   ├── {app-name}/              # Individual application
│   │   ├── src/                 # Source code
│   │   ├── project.json         # Nx project configuration
│   │   └── tsconfig.app.json    # TypeScript config
├── libs/                         # Shared libraries
│   ├── {lib-name}/              # Individual library
│   │   ├── src/                 # Source code
│   │   ├── project.json         # Nx project configuration
│   │   └── tsconfig.lib.json    # TypeScript config
├── prisma/                       # Database schema
├── docs/                         # Documentation
└── docker-compose.yml            # Local infrastructure
```

### Key Concepts

- **Nx Monorepo**: Efficient build system with caching and dependency management
- **Microservices**: Independent services communicating via gRPC and events
- **Event-Driven**: Asynchronous communication using NATS with event sourcing
- **Type Safety**: Full TypeScript coverage with shared type definitions
- **Service Discovery**: Dynamic service discovery with health monitoring and circuit breakers
- **Resilience**: Built-in retry logic and circuit breaker protection
- **Geospatial Utilities**: Reusable location-based calculations

## Getting Help

1. **Start Here**: Read the [Getting Started Guide](getting-started.md)
2. **Understand Nx**: Review the [Nx Monorepo Guide](nx-guide.md)
3. **Development**: Follow the [Development Guide](development.md)
4. **Troubleshooting**: Check the [Troubleshooting Guide](troubleshooting.md)

## Contributing

When updating documentation:

1. Use generic placeholders (e.g., `{project-name}`) instead of hard-coded paths
2. Keep examples consistent with the current Nx setup
3. Update related documentation when making changes
4. Test all commands and examples before committing
