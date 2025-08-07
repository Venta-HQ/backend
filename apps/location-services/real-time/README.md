# WebSocket Gateway Service

## Purpose

The WebSocket Gateway service provides real-time communication capabilities for the Venta backend system. It handles WebSocket connections, manages real-time data streaming, and enables bidirectional communication between clients and the backend services. This service serves as the central hub for all real-time features including live location tracking, instant notifications, and real-time updates across the platform.

## Overview

This service provides:
- Real-time WebSocket connections for clients with authentication
- Live location updates and tracking with geospatial data
- Real-time notifications and alerts with delivery confirmation
- Bidirectional communication channels for interactive features
- Connection management and scaling with load balancing
- Real-time data synchronization across multiple clients
- Event broadcasting and subscription management
- Connection health monitoring and metrics collection

## Key Responsibilities

- **Connection Management**: Handles WebSocket connection establishment, maintenance, and cleanup
- **Real-time Updates**: Streams live data updates to connected clients with low latency
- **Location Streaming**: Provides real-time location updates for tracking and proximity features
- **Event Broadcasting**: Broadcasts events to multiple connected clients with filtering
- **Connection Scaling**: Manages multiple concurrent WebSocket connections with load distribution
- **Authentication**: Validates WebSocket connections and user sessions with security
- **Error Handling**: Manages connection errors, reconnection logic, and recovery mechanisms
- **Performance Monitoring**: Tracks connection metrics, latency, and throughput

## Architecture

The service follows an event-driven architecture pattern, where it listens for events from other services and broadcasts them to connected WebSocket clients. It maintains connection state and handles the real-time communication layer of the system.

### Service Structure

```
WebSocket Gateway Service
├── Gateways
│   ├── User Location Gateway - User location tracking
│   └── Vendor Location Gateway - Vendor location updates
├── Services
│   ├── User Connection Manager - User connection lifecycle
│   ├── Vendor Connection Manager - Vendor connection lifecycle
│   └── Metrics Provider - Connection metrics and monitoring
└── Module Configuration
    └── BootstrapModule - Standardized service bootstrapping
```

## Usage

### Starting the Service

```bash
# Development mode
pnpm run start:dev websocket-gateway

# Production mode
pnpm run start:prod websocket-gateway

# With Docker
docker-compose up websocket-gateway
```

### Environment Configuration

```env
# Service Configuration
WEBSOCKET_GATEWAY_SERVICE_PORT=5004
WEBSOCKET_GATEWAY_CORS_ORIGIN=http://localhost:3000

# Connection Settings
WEBSOCKET_MAX_CONNECTIONS=10000
WEBSOCKET_HEARTBEAT_INTERVAL=30000
WEBSOCKET_CONNECTION_TIMEOUT=60000

# Rate Limiting
WEBSOCKET_RATE_LIMIT_MESSAGES=100
WEBSOCKET_RATE_LIMIT_WINDOW=60000

# Redis
REDIS_PASSWORD=your-redis-password

# NATS
NATS_URL=nats://localhost:4222

# External Services
LOCATION_SERVICE_ADDRESS=localhost:5001
CLERK_SECRET_KEY=your-clerk-secret
```

### Service Patterns

The service follows these patterns:

- **BootstrapModule**: Uses the standardized BootstrapModule for service configuration
- **WebSocket Gateways**: Handles WebSocket connections and message routing
- **Connection Management**: Manages user and vendor connection lifecycles
- **Event Broadcasting**: Broadcasts events from other services to connected clients
- **Authentication**: Validates WebSocket connections using Clerk integration
- **Rate Limiting**: Implements connection and message rate limiting
- **Metrics Collection**: Tracks connection metrics and performance data

### Integration Points

- **Location Service**: Receives real-time location updates for broadcasting
- **User Service**: Manages user authentication and session validation
- **Vendor Service**: Handles vendor updates and status changes
- **Event System**: Receives real-time events from other services
- **Redis**: Manages connection state and session data
- **NATS**: Subscribes to events from other services

## Dependencies

- **BootstrapModule** for standardized service configuration
- **ClerkModule** for WebSocket authentication
- **RedisModule** for connection state management
- **GrpcInstanceModule** for Location service communication
- **NATS** for event subscription and message queuing 