# WebSocket Gateway Service

The WebSocket Gateway service provides real-time communication capabilities for the Venta backend, enabling live updates and bidirectional communication with client applications.

## Overview

The WebSocket Gateway service is a NestJS application that:
- Provides WebSocket connections for real-time communication
- Handles location updates and real-time vendor data
- Manages WebSocket connections and authentication
- Integrates with other services via gRPC
- Supports real-time notifications and updates

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │   Mobile App    │    │   Desktop App   │
│   (Browser)     │    │   (WebSocket)   │    │   (WebSocket)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │   WebSocket Gateway       │
                    │   (WebSocket Server)      │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      gRPC Clients        │
                    │   (Location, Vendor)      │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      Database            │
                    │   (PostgreSQL + Redis)   │
                    └───────────────────────────┘
```

## Features

### 🔌 WebSocket Management
- **Connection Handling**: Manage WebSocket connections and lifecycle
- **Authentication**: Authenticate WebSocket connections
- **Connection Pooling**: Efficient connection management
- **Heartbeat Monitoring**: Monitor connection health

### 📍 Real-time Location Updates
- **Location Broadcasting**: Broadcast location updates to connected clients
- **Geolocation Services**: Real-time geolocation functionality
- **Location Tracking**: Track vendor location changes

### 🔄 Real-time Data Sync
- **Vendor Updates**: Real-time vendor data updates
- **Event Broadcasting**: Broadcast events to connected clients
- **Data Synchronization**: Keep clients in sync with backend data

### 🛡️ Security & Authentication
- **Connection Authentication**: Authenticate WebSocket connections
- **Rate Limiting**: Prevent abuse and ensure fair usage
- **Input Validation**: Validate incoming WebSocket messages

## WebSocket API

### Connection Endpoints
```
ws://localhost:5006/ws/location    # Location updates WebSocket
ws://localhost:5006/ws/vendor      # Vendor updates WebSocket
```

### Message Types

#### Location Updates
```typescript
// Client → Server: Subscribe to location updates
{
  type: 'subscribe_location',
  data: {
    vendorId: string;
    userId: string;
  }
}

// Server → Client: Location update
{
  type: 'location_updated',
  data: {
    vendorId: string;
    location: {
      lat: number;
      long: number;
    };
    timestamp: string;
  }
}
```

#### Vendor Updates
```typescript
// Client → Server: Subscribe to vendor updates
{
  type: 'subscribe_vendor',
  data: {
    vendorId: string;
    userId: string;
  }
}

// Server → Client: Vendor update
{
  type: 'vendor_updated',
  data: {
    vendorId: string;
    vendor: {
      name: string;
      description?: string;
      // ... other vendor fields
    };
    timestamp: string;
  }
}
```

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis for caching
- gRPC services (Location, Vendor)

### Environment Variables
```bash
# Service Configuration
WEBSOCKET_GATEWAY_PORT=5006
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/venta

# Redis
REDIS_URL=redis://localhost:6379

# gRPC Services
LOCATION_SERVICE_URL=localhost:5004
VENDOR_SERVICE_URL=localhost:5002

# WebSocket Configuration
WS_HEARTBEAT_INTERVAL=30000  # 30 seconds
WS_MAX_CONNECTIONS=1000
WS_RATE_LIMIT=100  # messages per minute
```

### Development
```bash
# Install dependencies
pnpm install

# Start development server
nx serve websocket-gateway

# Run tests
nx test websocket-gateway

# Lint code
nx lint websocket-gateway

# Type check
nx typecheck websocket-gateway
```

### Production Build
```bash
# Build for production
nx build websocket-gateway

# Start production server
nx serve websocket-gateway --configuration=production
```

### Docker Deployment
```bash
# Build Docker image
docker build -t venta-websocket-gateway .

# Run container
docker run -p 5006:5006 venta-websocket-gateway
```

## Development

### Project Structure
```
apps/websocket-gateway/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── websocket-gateway.module.ts # Root module
│   ├── gateways/                  # WebSocket gateways
│   │   └── location.gateway.ts    # Location WebSocket gateway
│   └── services/                  # Business logic services
├── project.json                   # Nx configuration
├── tsconfig.json                  # TypeScript configuration
├── webpack.config.js              # Build configuration
└── Dockerfile                     # Container configuration
```

### WebSocket Gateway Implementation

#### Location Gateway
```typescript
@WebSocketGateway({
  namespace: 'location',
  cors: {
    origin: '*',
  },
})
export class LocationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly locationService: LocationService,
    private readonly logger: Logger,
  ) {}

  @SubscribeMessage('subscribe_location')
  async handleSubscribeLocation(
    @MessageBody() data: { vendorId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Handle location subscription
    client.join(`location:${data.vendorId}`);
    return { success: true };
  }

  @SubscribeMessage('unsubscribe_location')
  async handleUnsubscribeLocation(
    @MessageBody() data: { vendorId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Handle location unsubscription
    client.leave(`location:${data.vendorId}`);
    return { success: true };
  }

  // Broadcast location updates to subscribed clients
  async broadcastLocationUpdate(vendorId: string, location: any) {
    this.server.to(`location:${vendorId}`).emit('location_updated', {
      vendorId,
      location,
      timestamp: new Date().toISOString(),
    });
  }
}
```

#### Connection Management
```typescript
@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private readonly connections = new Map<string, Socket>();

  handleConnection(client: Socket) {
    const clientId = client.id;
    this.connections.set(clientId, client);
    
    this.logger.log(`Client connected: ${clientId}`);
    
    // Set up heartbeat
    const heartbeat = setInterval(() => {
      client.emit('ping');
    }, 30000);

    client.on('disconnect', () => {
      this.connections.delete(clientId);
      clearInterval(heartbeat);
      this.logger.log(`Client disconnected: ${clientId}`);
    });
  }

  getConnectedClients(): number {
    return this.connections.size;
  }
}
```

## Testing

### Unit Tests
```bash
nx test websocket-gateway
```

### Integration Tests
```bash
# Start test services
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
nx test websocket-gateway --testPathPattern=integration
```

### WebSocket Testing
```bash
# Using wscat for WebSocket testing
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:5006/ws/location

# Send test message
{"type": "subscribe_location", "data": {"vendorId": "test123", "userId": "user123"}}
```

## Client Integration

### JavaScript/TypeScript Client
```typescript
class VentaWebSocketClient {
  private socket: WebSocket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(private url: string) {
    this.connect();
  }

  private connect() {
    this.socket = new WebSocket(this.url);
    
    this.socket.onopen = () => {
      console.log('Connected to WebSocket');
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
      this.handleReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
    }
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'location_updated':
        this.onLocationUpdate(data.data);
        break;
      case 'vendor_updated':
        this.onVendorUpdate(data.data);
        break;
      case 'ping':
        this.socket.send(JSON.stringify({ type: 'pong' }));
        break;
    }
  }

  subscribeToLocation(vendorId: string, userId: string) {
    this.socket.send(JSON.stringify({
      type: 'subscribe_location',
      data: { vendorId, userId }
    }));
  }

  onLocationUpdate(data: any) {
    console.log('Location updated:', data);
    // Handle location update
  }

  onVendorUpdate(data: any) {
    console.log('Vendor updated:', data);
    // Handle vendor update
  }
}

// Usage
const client = new VentaWebSocketClient('ws://localhost:5006/ws/location');
client.subscribeToLocation('vendor123', 'user123');
```

## Monitoring & Logging

### Logging
- Structured logging with Pino
- Connection lifecycle logging
- Message processing logs
- Error tracking and monitoring

### Health Checks
```
GET /health          # Service health status
GET /metrics         # Prometheus metrics
GET /ws/status       # WebSocket connection status
```

### Error Handling
- Centralized error handling
- Structured error responses
- Error logging and alerting

## Dependencies

### Core Libraries
- **NestJS**: Framework for building scalable server-side applications
- **Socket.io**: WebSocket library for real-time communication
- **gRPC**: High-performance RPC framework for service communication
- **Redis**: Caching and session storage

## Performance Considerations

### Connection Management
- Efficient connection pooling
- Connection lifecycle management
- Memory leak prevention

### Message Processing
- Asynchronous message processing
- Message queuing for high throughput
- Rate limiting and throttling

### Scalability
- Horizontal scaling support
- Load balancing considerations
- Connection distribution

## Security

### Data Protection
- WebSocket message validation
- Input sanitization
- Secure connection handling

### Access Control
- WebSocket authentication
- Rate limiting
- Connection validation

## Troubleshooting

### Common Issues

**Connection Issues**:
```bash
# Check WebSocket server status
nx serve websocket-gateway

# Check port availability
lsof -i :5006

# Test WebSocket connection
wscat -c ws://localhost:5006/ws/location
```

**gRPC Connection Issues**:
```bash
# Check gRPC services
nx serve location
nx serve vendor

# Test gRPC connections
grpcurl -plaintext localhost:5004 LocationService/UpdateVendorLocation
```

**Performance Issues**:
```bash
# Check connection count
curl http://localhost:5006/ws/status

# Monitor memory usage
docker stats venta-websocket-gateway
```

**Client Connection Issues**:
```javascript
// Debug WebSocket connection
const socket = new WebSocket('ws://localhost:5006/ws/location');

socket.onopen = () => console.log('Connected');
socket.onerror = (error) => console.error('Error:', error);
socket.onclose = (event) => console.log('Closed:', event.code, event.reason);
```

### Debugging

**Enable Debug Logging**:
```bash
# Set debug level
export LOG_LEVEL=debug

# Restart service
nx serve websocket-gateway
```

**Monitor WebSocket Traffic**:
```bash
# Monitor WebSocket messages
# Use browser developer tools or WebSocket testing tools
```

For more detailed troubleshooting, see the main project documentation. 