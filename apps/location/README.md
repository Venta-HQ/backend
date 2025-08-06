# Location Service

## Purpose

The Location service manages all location-related operations in the Venta backend system. It handles real-time location tracking, geospatial queries, location updates, and location-based services. This service serves as the central authority for location data and geospatial operations, providing gRPC endpoints for other services to consume location information and managing real-time location tracking for mobile applications.

## Overview

This microservice provides:
- Real-time location tracking and updates from mobile devices
- Geospatial queries and proximity searches with optimization
- Location data validation and processing with accuracy checks
- Location-based service recommendations and filtering
- Location history and analytics with data retention policies
- Geofencing and location-based notifications
- Location data caching and performance optimization
- Event publishing for location-related changes

## Key Responsibilities

- **Location Tracking**: Handles real-time location updates from mobile devices with validation
- **Geospatial Queries**: Provides location-based search and filtering with spatial indexing
- **Proximity Services**: Calculates distances and finds nearby entities with optimization
- **Location Validation**: Ensures location data accuracy and integrity with validation rules
- **Geofencing**: Manages location-based boundaries and triggers for notifications
- **Event Publishing**: Publishes location-related events for other services to consume
- **Analytics**: Provides location-based insights and reporting capabilities
- **Caching**: Optimizes location data access with Redis caching

## Architecture

The service follows a domain-driven design approach, focusing specifically on location-related business logic. It exposes gRPC endpoints for other services to consume and publishes events for asynchronous communication with the rest of the system.

### Service Structure

```
Location Service
├── Controllers (gRPC)
│   └── Location Controller - gRPC location operations
├── Services
│   └── Location Service - Location business logic and data management
└── Module Configuration
    └── BootstrapModule - Standardized service bootstrapping
```

## Usage

### Starting the Service

```bash
# Development mode
pnpm run start:dev location

# Production mode
pnpm run start:prod location

# With Docker
docker-compose up location
```

### Environment Configuration

```env
# Service Configuration
LOCATION_SERVICE_ADDRESS=localhost:5001
LOCATION_HEALTH_PORT=5011

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/venta

# Redis
REDIS_PASSWORD=your-redis-password

# NATS
NATS_URL=nats://localhost:4222

# Location Settings
LOCATION_UPDATE_INTERVAL=30000
LOCATION_ACCURACY_THRESHOLD=50
GEOFENCE_RADIUS_DEFAULT=1000
```

### Service Patterns

The service follows these patterns:

- **BootstrapModule**: Uses the standardized BootstrapModule for service configuration
- **gRPC Controllers**: Exposes gRPC endpoints for inter-service communication
- **Event Publishing**: Publishes location-related events to NATS
- **Database Operations**: Uses PrismaService for database access via `prisma.db`
- **Redis Caching**: Caches location data for performance optimization
- **Geospatial Operations**: Handles location-based queries and calculations
- **Real-time Updates**: Manages real-time location tracking and updates

### Integration Points

- **Vendor Service**: Handles vendor location data and proximity searches
- **User Service**: Manages user location tracking and updates
- **WebSocket Gateway**: Provides real-time location updates to clients
- **Event System**: Publishes location-related events for other services
- **Database**: Stores location data, history, and geofences
- **Redis**: Caches real-time location data and session information

## Dependencies

- **BootstrapModule** for standardized service configuration
- **PrismaService** for database operations
- **EventService** for publishing events to NATS
- **RedisModule** for location caching and real-time data
- **Database** for location data persistence 