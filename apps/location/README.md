# Location Service

The Location service manages vendor location data, geolocation services, and location-based functionality for the Venta backend.

## Overview

The Location service is a NestJS gRPC microservice that:
- Manages vendor location data and coordinates
- Handles location updates and geolocation services
- Provides location-based vendor queries
- Publishes location events to other services
- Integrates with Redis for location caching

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Gateway       │    │   Vendor        │    │   Algolia       │
│   Service       │    │   Service       │    │   Sync          │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      Location Service     │
                    │      (gRPC Server)       │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      Database            │
                    │   (PostgreSQL + Redis)   │
                    └───────────────────────────┘
```

## Features

### 📍 Location Management
- **Vendor Location Updates**: Handle vendor location changes and coordinates
- **Geolocation Data**: Manage latitude/longitude coordinates
- **Location Validation**: Validate location data and coordinates
- **Location History**: Track location changes over time

### 🔄 Event Publishing
- **Event-Driven Architecture**: Publish location events to other services
- **NATS Integration**: Use NATS for event communication
- **Event Types**: Location updated, vendor location changed

### 💾 Caching
- **Redis Integration**: Cache location data for fast access
- **Location Caching**: Cache vendor locations with TTL
- **Cache Invalidation**: Invalidate cache on location updates

### 🔍 Location Queries
- **Vendor Locations**: Retrieve vendor location data
- **Location-based Queries**: Support location-based vendor searches
- **Geolocation Services**: Provide geolocation functionality

## gRPC API

### Service Definition
```protobuf
service LocationService {
  // Location Management
  rpc UpdateVendorLocation(LocationUpdate) returns (LocationResponse);
  rpc VendorLocations(VendorLocationRequest) returns (VendorLocationsResponse);
}
```

### Endpoints

#### Location Management
```
UpdateVendorLocation(LocationUpdate) → LocationResponse
- Updates vendor location coordinates
- Validates location data
- Updates Redis cache
- Publishes vendor.location.updated event

VendorLocations(VendorLocationRequest) → VendorLocationsResponse
- Retrieves location data for vendors
- Returns cached location data when available
- Falls back to database queries
```

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis for caching
- NATS for event communication

### Environment Variables
```bash
# Service Configuration
LOCATION_SERVICE_PORT=5004
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/venta

# Redis
REDIS_URL=redis://localhost:6379

# NATS
NATS_URL=nats://localhost:4222

# Location Configuration
LOCATION_CACHE_TTL=3600  # 1 hour in seconds
MAX_LOCATION_UPDATE_RATE=100  # Updates per minute
```

### Development
```bash
# Install dependencies
pnpm install

# Start development server
nx serve location

# Run tests
nx test location

# Lint code
nx lint location

# Type check
nx typecheck location
```

### Production Build
```bash
# Build for production
nx build location

# Start production server
nx serve location --configuration=production
```

### Docker Deployment
```bash
# Build Docker image
docker build -t venta-location .

# Run container
docker run -p 5004:5004 venta-location
```

## Development

### Project Structure
```
apps/location/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── location.module.ts         # Root module
│   ├── location.controller.ts     # gRPC controller
│   └── location.service.ts        # Business logic
├── project.json                   # Nx configuration
├── tsconfig.json                  # TypeScript configuration
├── webpack.config.js              # Build configuration
└── Dockerfile                     # Container configuration
```

### Adding New gRPC Endpoints

1. **Update Proto Definition**:
```protobuf
// In libs/proto/src/definitions/location.proto
service LocationService {
  // ... existing endpoints
  rpc NewEndpoint(NewRequest) returns (NewResponse);
}
```

2. **Create Controller Method**:
```typescript
@Controller()
export class LocationController {
  @Post('newEndpoint')
  async newEndpoint(@Body() data: NewRequest): Promise<NewResponse> {
    return await this.locationService.newEndpoint(data);
  }
}
```

3. **Implement Service Logic**:
```typescript
@Injectable()
export class LocationService {
  async newEndpoint(data: NewRequest): Promise<NewResponse> {
    // Business logic implementation
    return { success: true };
  }
}
```

## Testing

### Unit Tests
```bash
nx test location
```

### Integration Tests
```bash
# Start test services
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
nx test location --testPathPattern=integration
```

### gRPC Testing
```bash
# Using grpcurl
grpcurl -plaintext -d '{"entityId": "vendor123", "location": {"lat": 40.7128, "long": -74.0060}}' localhost:5004 LocationService/UpdateVendorLocation

# Using BloomRPC or similar gRPC client
# Import the proto files and test endpoints
```

## Event Publishing

### Event Types
The service publishes the following events via NATS:

```typescript
// Location Events
'vendor.location.updated'  // When vendor location is updated
```

### Event Structure
```typescript
interface LocationEvent {
  type: string;
  data: {
    vendorId: string;
    location: {
      lat: number;
      long: number;
    };
    previousLocation?: {
      lat: number;
      long: number;
    };
  };
  timestamp: string;
  messageId: string;
}
```

## Database Schema

### Vendor Location Table
```sql
CREATE TABLE vendor_locations (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  lat DECIMAL(10, 8) NOT NULL,
  long DECIMAL(11, 8) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  country VARCHAR(50),
  postal_code VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Location History Table
```sql
CREATE TABLE location_history (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  lat DECIMAL(10, 8) NOT NULL,
  long DECIMAL(11, 8) NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW(),
  change_reason VARCHAR(100)
);
```

## Caching Strategy

### Redis Cache Structure
```typescript
interface LocationCache {
  // Key: vendor:location:{vendorId}
  // Value: JSON string of location data
  vendorId: string;
  location: {
    lat: number;
    long: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  updatedAt: string;
  ttl: number;
}
```

### Cache Operations
- **Cache Set**: Store location data with TTL
- **Cache Get**: Retrieve cached location data
- **Cache Invalidate**: Remove cache on location updates
- **Cache Refresh**: Refresh cache on database updates

## Monitoring & Logging

### Logging
- Structured logging with Pino
- Request/response logging for gRPC calls
- Location update tracking
- Error tracking and monitoring

### Health Checks
```
GET /health          # Service health status
GET /metrics         # Prometheus metrics
```

### Error Handling
- Centralized error handling
- Structured error responses
- Error logging and alerting

## Dependencies

### Core Libraries
- **NestJS**: Framework for building scalable server-side applications
- **gRPC**: High-performance RPC framework
- **Prisma**: Database ORM and query builder
- **Redis**: Caching and session storage
- **NATS**: Event streaming and messaging

## Performance Considerations

### Caching Strategy
- Location data cached in Redis with TTL
- Cache invalidation on location updates
- Efficient cache key structure

### Database Optimization
- Indexed queries on vendor_id and coordinates
- Connection pooling
- Query optimization for location queries

### Event Processing
- Asynchronous event publishing
- Event batching for high throughput
- Dead letter queue for failed events

## Security

### Data Protection
- Input validation for coordinates
- Location data sanitization
- SQL injection prevention

### Access Control
- gRPC authentication
- Rate limiting for location updates
- Request validation

## Location Validation

### Coordinate Validation
```typescript
interface LocationValidation {
  lat: number;    // -90 to 90
  long: number;   // -180 to 180
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}
```

### Validation Rules
- Latitude must be between -90 and 90 degrees
- Longitude must be between -180 and 180 degrees
- Address components are optional but validated when provided
- Postal code format validation based on country

## Troubleshooting

### Common Issues

**gRPC Connection Issues**:
```bash
# Check service status
nx serve location

# Check port availability
lsof -i :5004
```

**Database Connection Issues**:
```bash
# Check database status
docker ps | grep postgres

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

**Redis Connection Issues**:
```bash
# Check Redis status
docker ps | grep redis

# Test Redis connection
redis-cli ping
```

**Location Update Issues**:
```bash
# Check location cache
redis-cli get "vendor:location:vendor123"

# Check location history
psql $DATABASE_URL -c "SELECT * FROM location_history WHERE vendor_id = 'vendor123' ORDER BY changed_at DESC LIMIT 5;"
```

**Event Publishing Issues**:
```bash
# Check NATS connection
nats-sub "vendor.location.*"

# Check NATS server status
docker ps | grep nats
```

For more detailed troubleshooting, see the main project documentation. 