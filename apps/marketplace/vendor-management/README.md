# Vendor Service

## Purpose

The Vendor service manages all vendor-related operations in the Venta backend system. It handles vendor creation, updates, profile management, and vendor data operations. This service serves as the central authority for vendor information and business logic, providing gRPC endpoints for other services to consume vendor data and managing vendor-related business rules and relationships.

## Overview

This microservice provides:

- Vendor account creation and management with validation
- Vendor profile and business information management
- Vendor data validation, sanitization, and compliance
- Vendor search and discovery functionality with filtering
- Vendor relationship management with users and other entities
- Vendor business logic and rules enforcement
- Event publishing for vendor-related changes
- Vendor analytics and reporting capabilities

## Key Responsibilities

- **Vendor Management**: Handles vendor registration, updates, and deletion with validation
- **Profile Management**: Manages vendor profiles, business details, and settings
- **Data Validation**: Ensures vendor data integrity and compliance with business rules
- **Search Operations**: Provides vendor search and filtering capabilities with optimization
- **Business Logic**: Enforces vendor-related business rules and policies
- **Event Publishing**: Publishes vendor-related events for other services to consume
- **Relationship Management**: Manages connections between vendors and users
- **Analytics**: Provides vendor performance metrics and insights

## Architecture

The service follows a domain-driven design approach, focusing specifically on vendor-related business logic. It exposes gRPC endpoints for other services to consume and publishes events for asynchronous communication with the rest of the system.

### Service Structure

```
Vendor Service
├── Controllers (gRPC)
│   └── Vendor Controller - gRPC vendor operations
├── Services
│   └── Vendor Service - Vendor business logic and data management
└── Module Configuration
    └── BootstrapModule - Standardized service bootstrapping
```

## Usage

### Starting the Service

```bash
# Development mode
pnpm run start:dev vendor

# Production mode
pnpm run start:prod vendor

# With Docker
docker-compose up vendor
```

### Environment Configuration

```env
# Service Configuration
VENDOR_SERVICE_ADDRESS=localhost:5005
VENDOR_HEALTH_PORT=5015

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/venta

# Redis
REDIS_PASSWORD=your-redis-password

# NATS
NATS_URL=nats://localhost:4222

# Search (optional)
ALGOLIA_APP_ID=your-algolia-app-id
ALGOLIA_API_KEY=your-algolia-api-key
```

### Service Patterns

The service follows these patterns:

- **BootstrapModule**: Uses the standardized BootstrapModule for service configuration
- **gRPC Controllers**: Exposes gRPC endpoints for inter-service communication
- **Event Publishing**: Publishes vendor-related events to NATS
- **Database Operations**: Uses PrismaService for database access via `prisma.db`
- **Error Handling**: Uses standardized AppError patterns for consistent error responses
- **Business Rules**: Enforces vendor-specific business logic and validation

### Integration Points

- **User Service**: Manages user-vendor relationships and permissions
- **Location Service**: Handles vendor location data and geospatial operations
- **Event System**: Publishes vendor-related events for other services
- **Database**: Stores vendor data, profiles, and relationships
- **Search**: Integrates with Algolia for vendor search capabilities

## Dependencies

- **BootstrapModule** for standardized service configuration
- **PrismaService** for database operations
- **EventService** for publishing events to NATS
- **Algolia** (optional) for advanced search capabilities
- **Database** for vendor data persistence
