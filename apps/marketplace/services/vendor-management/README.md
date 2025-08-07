# Vendor Management Service

Domain-driven vendor management service for the Venta marketplace platform.

## Overview

The Vendor Management Service handles all vendor-related business operations including onboarding, profile management, location updates, and deactivation. It follows DDD (Domain-Driven Design) principles with clear domain boundaries and rich business context.

## Features

- **Vendor Onboarding**: Complete vendor registration with business validation
- **Profile Management**: Vendor profile updates and business information
- **Location Services**: Real-time location tracking and updates
- **Domain Events**: Rich business events with automatic context extraction
- **Type Safety**: Compile-time validation of all operations
- **Structured Logging**: Business context in all logs for observability

## Architecture

### Domain Structure

```
src/
├── core/                    # Core vendor business logic
│   ├── vendor.service.ts   # Main vendor operations
│   └── vendor.module.ts    # Core module configuration
├── location/               # Location-related operations
│   ├── vendor-location-events.controller.ts  # Location event handling
│   └── location.module.ts  # Location module
└── main.ts                 # Application bootstrap
```

### Domain Events

The service emits domain events with rich business context:

```typescript
// Vendor lifecycle events
'marketplace.vendor_onboarded'     // New vendor registration
'marketplace.vendor_profile_updated' // Profile changes
'marketplace.vendor_deactivated'   // Vendor deactivation

// Location events
'location.vendor_location_updated' // Real-time location updates
```

## Usage

### Vendor Onboarding

```typescript
// Domain service with business logic
export class VendorService {
  async onboardVendor(onboardingData: VendorOnboardingData): Promise<string> {
    this.logger.log('Starting vendor onboarding', {
      vendorId: onboardingData.vendorId,
      ownerId: onboardingData.ownerId,
    });

    // Business validation
    await this.validateOnboardingData(onboardingData);

    // Create vendor
    const vendor = await this.prisma.db.vendor.create({
      data: onboardingData,
    });

    // Emit domain event with automatic context
    await this.eventService.emit('marketplace.vendor_onboarded', {
      vendorId: vendor.id,
      ownerId: vendor.ownerId,
      location: onboardingData.location,
    });

    this.logger.log('Vendor onboarded successfully', {
      vendorId: vendor.id,
      ownerId: vendor.ownerId,
    });

    return vendor.id;
  }
}
```

### Profile Updates

```typescript
async updateVendor(vendorId: string, updateData: UpdateVendorData): Promise<Vendor> {
  this.logger.log('Updating vendor profile', { vendorId });

  const vendor = await this.prisma.db.vendor.update({
    where: { id: vendorId },
    data: updateData,
  });

  // Emit domain event
  await this.eventService.emit('marketplace.vendor_profile_updated', {
    vendorId: vendor.id,
    updatedFields: Object.keys(updateData),
  });

  return vendor;
}
```

### Location Updates

```typescript
async updateVendorLocation(vendorId: string, location: LocationData): Promise<void> {
  this.logger.log('Updating vendor location', { vendorId, location });

  // Update location in database
  await this.prisma.db.vendor.update({
    where: { id: vendorId },
    data: { location },
  });

  // Emit location event
  await this.eventService.emit('location.vendor_location_updated', {
    vendorId,
    location,
  });
}
```

## API Endpoints

### gRPC Interface

```protobuf
service VendorService {
  rpc OnboardVendor(OnboardVendorRequest) returns (OnboardVendorResponse);
  rpc UpdateVendor(UpdateVendorRequest) returns (UpdateVendorResponse);
  rpc GetVendor(GetVendorRequest) returns (GetVendorResponse);
  rpc UpdateVendorLocation(UpdateVendorLocationRequest) returns (UpdateVendorLocationResponse);
  rpc DeactivateVendor(DeactivateVendorRequest) returns (DeactivateVendorResponse);
}
```

### Request/Response Examples

```typescript
// Onboard vendor
const response = await vendorService.onboardVendor({
  name: "Joe's Food Truck",
  description: "Delicious street food",
  ownerId: "user-123",
  location: {
    lat: 40.7128,
    lng: -74.0060,
  },
});

// Update vendor location
await vendorService.updateVendorLocation("vendor-456", {
  lat: 40.7589,
  lng: -73.9851,
});
```

## Event Handling

### Location Event Consumer

The service consumes location events to maintain vendor location state:

```typescript
@Injectable()
export class VendorLocationEventsController implements OnModuleInit {
  async onModuleInit() {
    // Subscribe to location events
    this.natsQueueService.subscribeToQueue(
      'location.vendor_location_updated',
      'vendor-location-workers',
      this.handleVendorLocationUpdated.bind(this),
    );
  }

  private async handleVendorLocationUpdated(data: { data: BaseEvent; subject: string }) {
    const { data: event } = data;
    
    this.logger.log('Handling vendor location update', {
      vendorId: event.data.vendorId,
      location: event.data.location,
      eventId: event.meta.eventId,
    });

    // Update vendor location in database
    await this.vendorService.updateVendorLocation(
      event.data.vendorId,
      event.data.location,
    );
  }
}
```

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/venta"

# NATS
NATS_URL="nats://localhost:4222"

# Service Configuration
VENDOR_SERVICE_PORT=5000
VENDOR_SERVICE_HOST=localhost
```

### Bootstrap Configuration

```typescript
// main.ts
async function bootstrap() {
  const app = await BootstrapService.bootstrapGrpcMicroservice({
    domain: 'marketplace', // DDD domain
    main: {
      module: VendorManagementModule,
      package: 'vendor_management',
      protoPath: join(__dirname, 'proto/vendor-management.proto'),
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
| `marketplace.vendor_onboarded` | New vendor registration | `vendorId`, `ownerId` |
| `marketplace.vendor_profile_updated` | Profile changes | `vendorId` |
| `marketplace.vendor_deactivated` | Vendor deactivation | `vendorId`, `reason` |
| `location.vendor_location_updated` | Location updates | `vendorId` |

### Event Structure

```typescript
// Example: marketplace.vendor_onboarded
{
  context: {
    vendorId: "vendor-123",
    ownerId: "user-456"
  },
  meta: {
    eventId: "evt-789",
    source: "vendor-management",
    timestamp: "2024-12-01T10:00:00Z",
    version: "1.0",
    correlationId: "req-abc",
    domain: "marketplace",
    subdomain: "vendor"
  },
  data: {
    vendorId: "vendor-123",
    ownerId: "user-456",
    location: {
      lat: 40.7128,
      lng: -74.0060
    },
    timestamp: "2024-12-01T10:00:00Z"
  }
}
```

## Business Logic

### Vendor Onboarding Validation

```typescript
private async validateOnboardingData(data: VendorOnboardingData): Promise<void> {
  // Check for duplicate vendor names per owner
  const existingVendor = await this.prisma.db.vendor.findFirst({
    where: {
      name: data.name,
      ownerId: data.ownerId,
    },
  });

  if (existingVendor) {
    throw new AppError(
      ErrorType.VALIDATION,
      ErrorCodes.VENDOR_ALREADY_EXISTS,
      'Vendor with this name already exists for this owner',
      { name: data.name, ownerId: data.ownerId }
    );
  }

  // Validate location coordinates
  if (data.location.lat < -90 || data.location.lat > 90) {
    throw new AppError(
      ErrorType.VALIDATION,
      ErrorCodes.LOCATION_INVALID_COORDINATES,
      'Invalid latitude value',
      { latitude: data.location.lat }
    );
  }
}
```

### Business Rules

1. **Unique Names**: Each owner can only have one vendor with a given name
2. **Valid Locations**: All location coordinates must be within valid ranges
3. **Owner Validation**: Vendors must have a valid owner
4. **Status Management**: Vendors can be active or deactivated

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
    "nats": "ok"
  }
}
```

### Metrics

The service automatically collects metrics for:
- Vendor onboarding success/failure rates
- Profile update frequency
- Location update frequency
- Event emission success rates

### Logging

All operations include structured logging with business context:

```typescript
this.logger.log('Vendor onboarded successfully', {
  vendorId: vendor.id,
  ownerId: vendor.ownerId,
  location: vendor.location,
});

this.logger.error('Failed to onboard vendor', error.stack, {
  error,
  vendorId: data.vendorId,
  ownerId: data.ownerId,
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
pnpm dev:vendor-management

# Run tests
pnpm test:vendor-management
```

### Testing

```typescript
// Example test
describe('VendorService', () => {
  it('should onboard vendor successfully', async () => {
    const onboardingData = {
      name: 'Test Vendor',
      ownerId: 'user-123',
      location: { lat: 40.7128, lng: -74.0060 },
    };

    const vendorId = await vendorService.onboardVendor(onboardingData);

    expect(vendorId).toBeDefined();
    expect(mockEventService.emit).toHaveBeenCalledWith(
      'marketplace.vendor_onboarded',
      expect.objectContaining({
        vendorId,
        ownerId: 'user-123',
      })
    );
  });
});
```

## Dependencies

- **Database**: PostgreSQL with Prisma ORM
- **Events**: NATS for event messaging
- **Authentication**: Clerk integration
- **Monitoring**: Prometheus metrics and Loki logging
- **Health Checks**: Built-in health check endpoints

## Related Services

- **User Management**: User authentication and profiles
- **Location Services**: Real-time location tracking
- **Search Discovery**: Algolia integration for vendor search
- **Communication**: Webhook handling for external integrations

---

**Status**: ✅ **Production Ready**  
**Domain**: Marketplace  
**Last Updated**: December 2024  
**Version**: 1.0.0
