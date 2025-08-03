# Algolia Sync Service

The Algolia Sync service maintains synchronization between the Venta database and Algolia search index, ensuring search results are always up-to-date with the latest vendor data.

## Overview

The Algolia Sync service is a NestJS application that:
- Listens to vendor events from other services
- Synchronizes vendor data with Algolia search index
- Handles vendor creation, updates, and deletion
- Manages geolocation data for location-based searches
- Provides robust retry mechanisms for failed operations

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vendor        │    │   Location      │    │   User          │
│   Service       │    │   Service       │    │   Service       │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │         NATS              │
                    │    (Event Stream)         │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │    Algolia Sync Service   │
                    │   (Event Consumer)       │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │        Algolia            │
                    │   (Search Index)          │
                    └───────────────────────────┘
```

## Features

### 🔄 Event-Driven Synchronization
- **Event Listening**: Listens to vendor events via NATS
- **Real-time Updates**: Processes events in real-time
- **Event Types**: Handles vendor.created, vendor.updated, vendor.deleted, vendor.location.updated

### 🔍 Search Index Management
- **Index Operations**: Create, update, and delete vendor records in Algolia
- **Geolocation Support**: Handles vendor location data for location-based searches
- **Data Transformation**: Transforms vendor data for optimal search indexing

### 🛡️ Robust Error Handling
- **Retry Mechanisms**: Automatic retry with exponential backoff
- **Error Logging**: Comprehensive error tracking and logging
- **Graceful Degradation**: Continues operation despite temporary failures

### 📊 Monitoring & Observability
- **Event Processing Metrics**: Track event processing success/failure rates
- **Performance Monitoring**: Monitor sync operation performance
- **Health Checks**: Service health monitoring and alerting

## Event Processing

### Supported Events
```typescript
// Vendor Events
'vendor.created'     // Create new vendor in search index
'vendor.updated'     // Update existing vendor in search index
'vendor.deleted'     // Remove vendor from search index

// Location Events
'vendor.location.updated'  // Update vendor location in search index
```

### Event Handling Flow
```
1. Event Received → NATS subscription
2. Event Validation → Validate event data
3. Data Transformation → Transform for Algolia format
4. Algolia Operation → Perform index operation
5. Retry Logic → Handle failures with retry
6. Success Logging → Log successful operations
```

## Setup

### Prerequisites
- Node.js 18+
- NATS for event communication
- Algolia account and API credentials
- Access to vendor data

### Environment Variables
```bash
# Service Configuration
ALGOLIA_SYNC_SERVICE_PORT=5005
NODE_ENV=development

# NATS Configuration
NATS_URL=nats://localhost:4222
NATS_CLUSTER_ID=test-cluster
NATS_CLIENT_ID=algolia-sync

# Algolia Configuration
ALGOLIA_APP_ID=your_algolia_app_id
ALGOLIA_API_KEY=your_algolia_admin_api_key
ALGOLIA_INDEX_NAME=vendors

# Retry Configuration
MAX_RETRIES=3
RETRY_DELAY=1000
BACKOFF_MULTIPLIER=2
```

### Development
```bash
# Install dependencies
pnpm install

# Start development server
nx serve algolia-sync

# Run tests
nx test algolia-sync

# Lint code
nx lint algolia-sync

# Type check
nx typecheck algolia-sync
```

### Production Build
```bash
# Build for production
nx build algolia-sync

# Start production server
nx serve algolia-sync --configuration=production
```

### Docker Deployment
```bash
# Build Docker image
docker build -t venta-algolia-sync .

# Run container
docker run -p 5005:5005 venta-algolia-sync
```

## Development

### Project Structure
```
apps/algolia-sync/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── algolia-sync.module.ts     # Root module
│   ├── algolia-sync.controller.ts # HTTP controller (optional)
│   └── algolia-sync.service.ts    # Event processing logic
├── project.json                   # Nx configuration
├── tsconfig.json                  # TypeScript configuration
├── webpack.config.js              # Build configuration
└── Dockerfile                     # Container configuration
```

### Event Processing Implementation

#### Service Structure
```typescript
@Injectable()
export class AlgoliaSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AlgoliaSyncService.name);
  private readonly retryUtil: RetryUtil;
  private vendorEventStream: any;

  constructor(
    private readonly algoliaService: AlgoliaService,
    @Inject('EventsService') private readonly eventsService: IEventsService,
  ) {
    this.retryUtil = new RetryUtil({
      logger: this.logger,
      maxRetries: 3,
      retryDelay: 1000,
    });
  }

  async onModuleInit() {
    await this.setupEventListeners();
  }

  async onModuleDestroy() {
    if (this.vendorEventStream) {
      await this.eventsService.unsubscribeFromStream(this.vendorEventStream);
    }
  }
}
```

#### Event Handler Methods
```typescript
private async handleVendorCreated(vendor: any) {
  await this.retryUtil.retryOperation(
    () => this.algoliaService.createObject('vendor', {
      ...vendor,
      ...(vendor.lat && vendor.long ? {
        _geoloc: {
          lat: vendor.lat,
          lng: vendor.long,
        },
      } : {}),
    }),
    `Creating vendor in Algolia: ${vendor.id}`,
  );
}

private async handleVendorUpdated(vendor: any) {
  await this.retryUtil.retryOperation(
    () => this.algoliaService.updateObject('vendor', vendor.id, {
      ...vendor,
      ...(vendor.lat && vendor.long ? {
        _geoloc: {
          lat: vendor.lat,
          lng: vendor.long,
        },
      } : {}),
    }),
    `Updating vendor in Algolia: ${vendor.id}`,
  );
}

private async handleVendorDeleted(vendor: any) {
  await this.retryUtil.retryOperation(
    () => this.algoliaService.deleteObject('vendor', vendor.id),
    `Deleting vendor from Algolia: ${vendor.id}`,
  );
}
```

## Testing

### Unit Tests
```bash
nx test algolia-sync
```

### Integration Tests
```bash
# Start test services
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
nx test algolia-sync --testPathPattern=integration
```

### Event Testing
```bash
# Publish test events
nats-pub "vendor.created" '{"id": "test123", "name": "Test Vendor"}'

# Monitor event processing
nats-sub "algolia-sync.*"
```

## Algolia Index Structure

### Vendor Object Structure
```typescript
interface AlgoliaVendor {
  objectID: string;           // Vendor ID
  name: string;               // Vendor name
  description?: string;       // Vendor description
  email?: string;             // Contact email
  phone?: string;             // Contact phone
  website?: string;           // Website URL
  address?: string;           // Full address
  city?: string;              // City
  state?: string;             // State/Province
  country?: string;           // Country
  category?: string;          // Vendor category
  _geoloc?: {                 // Geolocation for search
    lat: number;
    lng: number;
  };
  createdAt: string;          // ISO timestamp
  updatedAt: string;          // ISO timestamp
}
```

### Search Configuration
```typescript
// Algolia index settings
{
  searchableAttributes: [
    'name',
    'description',
    'category',
    'city',
    'state',
    'country'
  ],
  attributesForFaceting: [
    'category',
    'city',
    'state',
    'country'
  ],
  ranking: [
    'typo',
    'geo',
    'words',
    'filters',
    'proximity',
    'attribute',
    'exact',
    'custom'
  ]
}
```

## Retry Strategy

### Retry Configuration
```typescript
interface RetryConfig {
  maxRetries: number;         // Maximum retry attempts
  retryDelay: number;         // Initial delay in milliseconds
  backoffMultiplier: number;  // Exponential backoff multiplier
  logger: Logger;             // Logger instance
}
```

### Retry Logic
```typescript
// Exponential backoff with jitter
const delay = retryDelay * Math.pow(backoffMultiplier, attempt - 1);
const jitter = Math.random() * 0.1 * delay;
const finalDelay = delay + jitter;

await new Promise(resolve => setTimeout(resolve, finalDelay));
```

## Monitoring & Logging

### Logging
- Structured logging with Pino
- Event processing logs
- Error tracking and monitoring
- Performance metrics

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
- **NATS**: Event streaming and messaging
- **Algolia**: Search functionality and indexing
- **RetryUtil**: Retry mechanisms and error handling

### External Services
- **Algolia**: Search functionality and indexing

## Performance Considerations

### Event Processing
- Asynchronous event processing
- Batch processing for high throughput
- Event ordering and deduplication

### Algolia Operations
- Optimized index operations
- Batch operations for efficiency
- Connection pooling and reuse

### Memory Management
- Efficient data transformation
- Memory leak prevention
- Resource cleanup

## Security

### Data Protection
- Secure API key management
- Data encryption in transit
- Input validation and sanitization

### Access Control
- Algolia API key rotation
- Rate limiting
- Request validation

## Troubleshooting

### Common Issues

**Event Processing Issues**:
```bash
# Check NATS connection
nats-sub "vendor.*"

# Check service logs
docker logs venta-algolia-sync
```

**Algolia Connection Issues**:
```bash
# Test Algolia connection
curl -H "X-Algolia-API-Key: $ALGOLIA_API_KEY" \
     "https://$ALGOLIA_APP_ID.algolia.net/1/indexes/vendors"

# Check Algolia index status
curl -H "X-Algolia-API-Key: $ALGOLIA_API_KEY" \
     "https://$ALGOLIA_APP_ID.algolia.net/1/indexes/vendors/settings"
```

**Retry Issues**:
```bash
# Check retry logs
grep "retry" /var/log/algolia-sync.log

# Monitor failed operations
grep "Failed to handle event" /var/log/algolia-sync.log
```

**Performance Issues**:
```bash
# Check event processing rate
nats-top

# Monitor Algolia API usage
curl -H "X-Algolia-API-Key: $ALGOLIA_API_KEY" \
     "https://$ALGOLIA_APP_ID.algolia.net/1/logs"
```

### Debugging

**Enable Debug Logging**:
```bash
# Set debug level
export LOG_LEVEL=debug

# Restart service
nx serve algolia-sync
```

**Test Event Publishing**:
```bash
# Publish test event
nats-pub "vendor.created" '{"id": "test123", "name": "Test Vendor"}'

# Monitor processing
nats-sub "algolia-sync.*"
```

For more detailed troubleshooting, see the main project documentation. 