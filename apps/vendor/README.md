# Vendor Service

The Vendor service manages vendor data, business operations, and vendor-related functionality for the Venta backend.

## Overview

The Vendor service is a NestJS gRPC microservice that:
- Manages vendor profiles and business information
- Handles vendor CRUD operations
- Processes vendor location updates
- Publishes vendor events to other services
- Provides vendor data to the gateway and other services

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Gateway       │    │   Location      │    │   Algolia       │
│   Service       │    │   Service       │    │   Sync          │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      Vendor Service       │
                    │      (gRPC Server)       │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      Database            │
                    │   (PostgreSQL + Redis)   │
                    └───────────────────────────┘
```

## Features

### 🏢 Vendor Management
- **Vendor CRUD Operations**: Create, read, update, delete vendor profiles
- **Business Information**: Handle vendor business details, contact info, and services
- **Vendor Categories**: Manage vendor categorization and searchability

### 📍 Location Integration
- **Location Updates**: Process vendor location changes
- **Geolocation Data**: Handle latitude/longitude coordinates
- **Location Events**: Publish location update events

### 🔄 Event Publishing
- **Event-Driven Architecture**: Publish vendor events to other services
- **NATS Integration**: Use NATS for event communication
- **Event Types**: Vendor created, updated, deleted, location updated

### 🔍 Search Integration
- **Algolia Sync**: Keep vendor data synchronized with search index
- **Search Events**: Trigger search index updates on vendor changes
- **Geolocation Search**: Support location-based vendor searches

## gRPC API

### Service Definition
```protobuf
service VendorService {
  // Vendor CRUD
  rpc GetVendorById(VendorLookupData) returns (VendorResponse);
  rpc CreateVendor(VendorCreateData) returns (VendorResponse);
  rpc UpdateVendor(VendorUpdateData) returns (VendorResponse);
  rpc DeleteVendor(VendorLookupData) returns (VendorDeleteResponse);
}
```

### Endpoints

#### Vendor CRUD Operations
```
GetVendorById(VendorLookupData) → VendorResponse
- Retrieves vendor by ID
- Returns complete vendor profile with location data

CreateVendor(VendorCreateData) → VendorResponse
- Creates new vendor profile
- Validates vendor data
- Publishes vendor.created event

UpdateVendor(VendorUpdateData) → VendorResponse
- Updates existing vendor profile
- Handles partial updates
- Publishes vendor.updated event

DeleteVendor(VendorLookupData) → VendorDeleteResponse
- Removes vendor profile
- Cleans up associated data
- Publishes vendor.deleted event
```

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis for caching
- NATS for event communication
- Algolia for search functionality

### Environment Variables
```bash
# Service Configuration
VENDOR_SERVICE_PORT=5002
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/venta

# Redis
REDIS_URL=redis://localhost:6379

# NATS
NATS_URL=nats://localhost:4222

# Algolia
ALGOLIA_APP_ID=your_algolia_app_id
ALGOLIA_API_KEY=your_algolia_api_key
ALGOLIA_INDEX_NAME=vendors
```

### Development
```bash
# Install dependencies
pnpm install

# Start development server
nx serve vendor

# Run tests
nx test vendor

# Lint code
nx lint vendor

# Type check
nx typecheck vendor
```

### Production Build
```bash
# Build for production
nx build vendor

# Start production server
nx serve vendor --configuration=production
```

### Docker Deployment
```bash
# Build Docker image
docker build -t venta-vendor .

# Run container
docker run -p 5002:5002 venta-vendor
```

## Development

### Project Structure
```
apps/vendor/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── vendor.module.ts           # Root module
│   ├── vendor.controller.ts       # gRPC controller
│   └── vendor.service.ts          # Business logic
├── project.json                   # Nx configuration
├── tsconfig.json                  # TypeScript configuration
├── webpack.config.js              # Build configuration
└── Dockerfile                     # Container configuration
```

### Adding New gRPC Endpoints

1. **Update Proto Definition**:
```protobuf
// In libs/proto/src/definitions/vendor.proto
service VendorService {
  // ... existing endpoints
  rpc NewEndpoint(NewRequest) returns (NewResponse);
}
```

2. **Create Controller Method**:
```typescript
@Controller()
export class VendorController {
  @Post('newEndpoint')
  async newEndpoint(@Body() data: NewRequest): Promise<NewResponse> {
    return await this.vendorService.newEndpoint(data);
  }
}
```

3. **Implement Service Logic**:
```typescript
@Injectable()
export class VendorService {
  async newEndpoint(data: NewRequest): Promise<NewResponse> {
    // Business logic implementation
    return { success: true };
  }
}
```

## Testing

### Unit Tests
```bash
nx test vendor
```

### Integration Tests
```bash
# Start test services
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
nx test vendor --testPathPattern=integration
```

### gRPC Testing
```bash
# Using grpcurl
grpcurl -plaintext -d '{"id": "vendor123"}' localhost:5002 VendorService/GetVendorById

# Using BloomRPC or similar gRPC client
# Import the proto files and test endpoints
```

## Event Publishing

### Event Types
The service publishes the following events via NATS:

```typescript
// Vendor Events
'vendor.created'     // When a new vendor is created
'vendor.updated'     // When vendor data is updated
'vendor.deleted'     // When a vendor is deleted

// Location Events
'vendor.location.updated'  // When vendor location is updated
```

### Event Structure
```typescript
interface VendorEvent {
  type: string;
  data: {
    vendorId: string;
    name?: string;
    location?: {
      lat: number;
      long: number;
    };
    // ... other vendor data
  };
  timestamp: string;
  messageId: string;
}
```

## Database Schema

### Vendor Table
```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),
  address TEXT,
  lat DECIMAL(10, 8),
  long DECIMAL(11, 8),
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Vendor Categories Table
```sql
CREATE TABLE vendor_categories (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Search Integration

### Algolia Index Structure
```typescript
interface AlgoliaVendor {
  objectID: string;           // Vendor ID
  name: string;               // Vendor name
  description?: string;       // Vendor description
  category?: string;          // Vendor category
  _geoloc?: {                 // Geolocation for search
    lat: number;
    lng: number;
  };
  address?: string;           // Vendor address
  phone?: string;             // Contact phone
  website?: string;           // Website URL
}
```

### Search Operations
- **Index Creation**: Automatically index new vendors
- **Index Updates**: Update search index on vendor changes
- **Index Deletion**: Remove vendors from search index on deletion
- **Geolocation Search**: Support location-based vendor searches

## Monitoring & Logging

### Logging
- Structured logging with Pino
- Request/response logging for gRPC calls
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

### External Services
- **Algolia**: Search functionality and indexing

## Performance Considerations

### Caching Strategy
- Vendor data cached in Redis
- Cache invalidation on vendor updates
- TTL-based cache expiration

### Database Optimization
- Indexed queries on frequently accessed fields
- Connection pooling
- Query optimization

### Search Optimization
- Batch indexing operations
- Incremental index updates
- Search result caching

## Security

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- Sensitive data encryption

### Access Control
- gRPC authentication
- Rate limiting
- Request validation

## Troubleshooting

### Common Issues

**gRPC Connection Issues**:
```bash
# Check service status
nx serve vendor

# Check port availability
lsof -i :5002
```

**Database Connection Issues**:
```bash
# Check database status
docker ps | grep postgres

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

**Search Index Issues**:
```bash
# Check Algolia connection
curl -H "X-Algolia-API-Key: $ALGOLIA_API_KEY" \
     "https://$ALGOLIA_APP_ID.algolia.net/1/indexes/vendors"

# Rebuild search index
# This would typically be done through a management script
```

**Event Publishing Issues**:
```bash
# Check NATS connection
nats-sub "vendor.*"

# Check NATS server status
docker ps | grep nats
```

For more detailed troubleshooting, see the main project documentation. 