# Location Services - Geolocation

Real-time location tracking and geospatial services for the Venta platform.

## Overview

The Location Services provide comprehensive location tracking, geospatial queries, and real-time location updates for both vendors and users. The service follows DDD (Domain-Driven Design) principles with clear domain boundaries and rich business context.

## Features

- **Real-time Location Tracking**: Continuous location updates for vendors and users
- **Geospatial Queries**: Find nearby vendors with efficient Redis-based queries
- **Location Broadcasting**: Real-time location updates via WebSocket
- **Domain Events**: Rich business events with automatic context extraction
- **Type Safety**: Compile-time validation of all operations
- **Structured Logging**: Business context in all logs for observability

## Architecture

### Service Structure

```
src/
├── location-tracking.service.ts    # Core location tracking logic
├── location.service.ts             # Location data management
├── location.controller.ts          # gRPC controller
├── location.module.ts              # Module configuration
└── main.ts                         # Application bootstrap
```

### Domain Events

The service emits domain events with rich business context:

```typescript
// Location update events
'location.vendor_location_updated'  // Vendor location changes
'location.user_location_updated'    // User location changes
```

## Usage

### Location Tracking

```typescript
// Core location tracking service
export class LocationTrackingService {
  async updateVendorLocation(vendorId: string, location: LocationData): Promise<void> {
    this.logger.log('Updating vendor location', {
      vendorId,
      location,
    });

    try {
      // Store location in Redis for real-time queries
      await this.redis.geoadd(
        'vendor_locations',
        location.lng,
        location.lat,
        vendorId,
      );

      // Emit domain event with automatic context
      await this.eventService.emit('location.vendor_location_updated', {
        vendorId,
        location,
      });

      this.logger.log('Vendor location updated successfully', {
        vendorId,
        location,
      });
    } catch (error) {
      this.logger.error('Failed to update vendor location', error.stack, {
        error,
        vendorId,
        location,
      });
      throw error;
    }
  }

  async updateUserLocation(userId: string, location: LocationData): Promise<void> {
    this.logger.log('Updating user location', {
      userId,
      location,
    });

    try {
      // Store location in Redis
      await this.redis.geoadd(
        'user_locations',
        location.lng,
        location.lat,
        userId,
      );

      // Emit domain event
      await this.eventService.emit('location.user_location_updated', {
        userId,
        location,
      });

      this.logger.log('User location updated successfully', {
        userId,
        location,
      });
    } catch (error) {
      this.logger.error('Failed to update user location', error.stack, {
        error,
        userId,
        location,
      });
      throw error;
    }
  }
}
```

### Geospatial Queries

```typescript
async findNearbyVendors(userLocation: LocationData, radius: number = 5000): Promise<VendorLocation[]> {
  this.logger.log('Finding nearby vendors', {
    userLocation,
    radius,
  });

  try {
    // Use Redis GEORADIUS for efficient geospatial queries
    const nearbyVendors = await this.redis.georadius(
      'vendor_locations',
      userLocation.lng,
      userLocation.lat,
      radius,
      'm',
      'WITHCOORD',
      'WITHDIST',
    );

    const formattedResults = nearbyVendors.map((vendor: any) => ({
      vendorId: vendor[0],
      distance: parseFloat(vendor[1]),
      location: {
        lng: parseFloat(vendor[2][0]),
        lat: parseFloat(vendor[2][1]),
      },
    }));

    this.logger.log('Found nearby vendors', {
      count: formattedResults.length,
      radius,
    });

    return formattedResults;
  } catch (error) {
    this.logger.error('Failed to find nearby vendors', error.stack, {
      error,
      userLocation,
      radius,
    });
    throw error;
  }
}
```

## API Endpoints

### gRPC Interface

```protobuf
service LocationService {
  rpc UpdateVendorLocation(UpdateVendorLocationRequest) returns (UpdateVendorLocationResponse);
  rpc UpdateUserLocation(UpdateUserLocationRequest) returns (UpdateUserLocationResponse);
  rpc FindNearbyVendors(FindNearbyVendorsRequest) returns (FindNearbyVendorsResponse);
  rpc GetVendorLocation(GetVendorLocationRequest) returns (GetVendorLocationResponse);
  rpc GetUserLocation(GetUserLocationRequest) returns (GetUserLocationResponse);
}
```

### Request/Response Examples

```typescript
// Update vendor location
await locationService.updateVendorLocation("vendor-123", {
  lat: 40.7128,
  lng: -74.0060,
});

// Find nearby vendors
const nearbyVendors = await locationService.findNearbyVendors(
  { lat: 40.7589, lng: -73.9851 },
  5000 // 5km radius
);

// Response format
[
  {
    vendorId: "vendor-123",
    distance: 1250.5, // meters
    location: {
      lat: 40.7128,
      lng: -74.0060,
    },
  },
  // ... more vendors
]
```

## Event Handling

### Location Event Emission

The service automatically emits location events when locations are updated:

```typescript
// Vendor location update event
{
  context: {
    vendorId: "vendor-123"
  },
  meta: {
    eventId: "evt-789",
    source: "location-services",
    timestamp: "2024-12-01T10:00:00Z",
    version: "1.0",
    correlationId: "req-abc",
    domain: "location",
    subdomain: "vendor"
  },
  data: {
    vendorId: "vendor-123",
    location: {
      lat: 40.7128,
      lng: -74.0060
    },
    timestamp: "2024-12-01T10:00:00Z"
  }
}
```

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/venta"

# Redis
REDIS_URL="redis://localhost:6379"

# NATS
NATS_URL="nats://localhost:4222"

# Service Configuration
LOCATION_SERVICE_PORT=5000
LOCATION_SERVICE_HOST=localhost
```

### Bootstrap Configuration

```typescript
// main.ts
async function bootstrap() {
  const app = await BootstrapService.bootstrapGrpcMicroservice({
    domain: 'location-services', // DDD domain
    main: {
      module: LocationModule,
      package: 'location_services',
      protoPath: join(__dirname, 'proto/location-services.proto'),
      url: 'localhost:5000',
    },
    health: {
      module: HealthModule,
      port: 3001,
    },
  });

  await app.listen();
}
```

## Domain Events

### Emitted Events

| Event | Description | Context |
|-------|-------------|---------|
| `location.vendor_location_updated` | Vendor location changes | `vendorId` |
| `location.user_location_updated` | User location changes | `userId` |

### Event Structure

```typescript
// Example: location.vendor_location_updated
{
  context: {
    vendorId: "vendor-123"
  },
  meta: {
    eventId: "evt-789",
    source: "location-services",
    timestamp: "2024-12-01T10:00:00Z",
    version: "1.0",
    correlationId: "req-abc",
    domain: "location",
    subdomain: "vendor"
  },
  data: {
    vendorId: "vendor-123",
    location: {
      lat: 40.7128,
      lng: -74.0060
    },
    timestamp: "2024-12-01T10:00:00Z"
  }
}
```

## Business Logic

### Location Validation

```typescript
private validateLocationData(location: LocationData): void {
  // Validate latitude
  if (location.lat < -90 || location.lat > 90) {
    throw new AppError(
      ErrorType.VALIDATION,
      ErrorCodes.LOCATION_INVALID_COORDINATES,
      'Invalid latitude value',
      { latitude: location.lat }
    );
  }

  // Validate longitude
  if (location.lng < -180 || location.lng > 180) {
    throw new AppError(
      ErrorType.VALIDATION,
      ErrorCodes.LOCATION_INVALID_COORDINATES,
      'Invalid longitude value',
      { longitude: location.lng }
    );
  }
}
```

### Business Rules

1. **Valid Coordinates**: All location coordinates must be within valid ranges
2. **Real-time Updates**: Location updates are processed immediately
3. **Geospatial Queries**: Efficient Redis-based proximity searches
4. **Event Emission**: All location changes emit domain events

## Performance

### Redis Geospatial Operations

The service uses Redis geospatial commands for efficient location operations:

```typescript
// Add location to geospatial index
await redis.geoadd('vendor_locations', lng, lat, vendorId);

// Find nearby vendors with distance
const nearby = await redis.georadius(
  'vendor_locations',
  userLng,
  userLat,
  radius,
  'm',
  'WITHCOORD',
  'WITHDIST'
);

// Remove location from index
await redis.zrem('vendor_locations', vendorId);
```

### Optimization Features

- **Geospatial Indexing**: Redis GEO commands for efficient queries
- **Distance Calculations**: Automatic distance calculation in queries
- **Batch Operations**: Efficient batch location updates
- **Memory Management**: Automatic cleanup of old locations

## Monitoring

### Health Checks

```bash
# Health check endpoint
curl http://localhost:3001/health

# Response
{
  "status": "ok",
  "timestamp": "2024-12-01T10:00:00Z",
  "uptime": 3600,
  "checks": {
    "database": "ok",
    "redis": "ok",
    "nats": "ok"
  }
}
```

### Metrics

The service automatically collects metrics for:
- Location update frequency
- Geospatial query performance
- Event emission success rates
- Redis operation latency

### Logging

All operations include structured logging with business context:

```typescript
this.logger.log('Vendor location updated successfully', {
  vendorId,
  location,
  timestamp: new Date().toISOString(),
});

this.logger.error('Failed to update vendor location', error.stack, {
  error,
  vendorId,
  location,
});
```

## Development

### Local Development

```bash
# Install dependencies
pnpm install

# Start required services
docker-compose up -d postgres redis nats

# Run in development mode
pnpm dev:location-services

# Run tests
pnpm test:location-services
```

### Testing

```typescript
// Example test
describe('LocationTrackingService', () => {
  it('should update vendor location successfully', async () => {
    const location = { lat: 40.7128, lng: -74.0060 };
    
    await locationTrackingService.updateVendorLocation('vendor-123', location);

    expect(mockRedis.geoadd).toHaveBeenCalledWith(
      'vendor_locations',
      location.lng,
      location.lat,
      'vendor-123'
    );

    expect(mockEventService.emit).toHaveBeenCalledWith(
      'location.vendor_location_updated',
      expect.objectContaining({
        vendorId: 'vendor-123',
        location,
      })
    );
  });
});
```

## Dependencies

- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for geospatial operations
- **Events**: NATS for event messaging
- **Monitoring**: Prometheus metrics and Loki logging
- **Health Checks**: Built-in health check endpoints

## Related Services

- **Vendor Management**: Vendor profile and business data
- **User Management**: User authentication and profiles
- **Real-time Services**: WebSocket connections for live updates
- **Search Discovery**: Algolia integration for vendor search

---

**Status**: ✅ **Production Ready**  
**Domain**: Location Services  
**Last Updated**: December 2024  
**Version**: 1.0.0 