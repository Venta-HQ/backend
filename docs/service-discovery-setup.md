# Service Discovery Setup Guide

## Overview

The service discovery system provides dynamic service registration, health monitoring, and circuit breaker protection for all microservices in the Venta backend.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Service  │    │  Vendor Service │    │ Location Service│
│   (Port 3001)   │    │   (Port 3002)   │    │   (Port 3003)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Gateway       │
                    │ (Port 3000)     │
                    │                 │
                    │ • Service       │
                    │   Discovery     │
                    │ • Health        │
                    │   Monitoring    │
                    │ • Circuit       │
                    │   Breakers      │
                    └─────────────────┘
```

## Environment Configuration

### 1. Copy Environment Template

```bash
cp env.example .env
```

### 2. Configure Service Addresses

Edit your `.env` file with the appropriate service addresses:

```bash
# Service Discovery Configuration
USER_SERVICE_ADDRESS=http://localhost:3001
VENDOR_SERVICE_ADDRESS=http://localhost:3002
LOCATION_SERVICE_ADDRESS=http://localhost:3003
WEBSOCKET_GATEWAY_SERVICE_ADDRESS=http://localhost:3004
ALGOLIA_SYNC_SERVICE_ADDRESS=http://localhost:3005

# Circuit Breaker Configuration
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_RECOVERY_TIMEOUT=30000
CIRCUIT_BREAKER_HALF_OPEN_MAX_ATTEMPTS=3

# Health Check Configuration
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000
```

### 3. Production Configuration

For production, update the service addresses to point to your actual service URLs:

```bash
USER_SERVICE_ADDRESS=http://user-service:3001
VENDOR_SERVICE_ADDRESS=http://vendor-service:3002
LOCATION_SERVICE_ADDRESS=http://location-service:3003
WEBSOCKET_GATEWAY_SERVICE_ADDRESS=http://websocket-gateway:3004
ALGOLIA_SYNC_SERVICE_ADDRESS=http://algolia-sync:3005
```

## Health Endpoints

All services now provide standardized health endpoints:

### Basic Health Check
```bash
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-02-08T22:30:00.000Z",
  "service": "user-service"
}
```

### Detailed Health Check
```bash
GET /health/detailed
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-02-08T22:30:00.000Z",
  "service": "user-service",
  "uptime": 3600,
  "memory": {
    "rss": 123456789,
    "heapTotal": 987654321,
    "heapUsed": 123456789
  },
  "version": "1.0.0"
}
```

## Gateway Service Discovery Endpoints

The gateway provides additional endpoints for monitoring the entire system:

### Service Health Overview
```bash
GET /health/services
```

**Response:**
```json
{
  "services": {
    "total": 5,
    "healthy": 4,
    "unhealthy": 1
  },
  "serviceDetails": [
    {
      "name": "user-service",
      "url": "http://localhost:3001",
      "health": "healthy",
      "lastChecked": "2024-02-08T22:30:00.000Z",
      "responseTime": 45
    }
  ],
  "circuitBreakers": {
    "user-service": {
      "state": "CLOSED",
      "failureCount": 0,
      "lastFailure": null
    }
  }
}
```

### Circuit Breaker Statistics
```bash
GET /health/circuit-breakers
```

**Response:**
```json
{
  "user-service": {
    "state": "CLOSED",
    "failureCount": 0,
    "lastFailure": null,
    "totalRequests": 150,
    "successfulRequests": 150
  },
  "vendor-service": {
    "state": "OPEN",
    "failureCount": 5,
    "lastFailure": "2024-02-08T22:25:00.000Z",
    "totalRequests": 200,
    "successfulRequests": 195
  }
}
```

### Reset Circuit Breakers (Admin)
```bash
GET /health/reset-circuit-breakers
```

**Response:**
```json
{
  "message": "Circuit breakers reset successfully"
}
```

## Testing the System

### 1. Start All Services

```bash
# Build all services
npm run build

# Start all services in development mode
npm run start:all
```

### 2. Run Service Discovery Test

```bash
# Test all health endpoints and service discovery
npm run test:service-discovery
```

This will test:
- Individual service health endpoints
- Gateway service discovery endpoints
- Circuit breaker functionality

### 3. Manual Testing

Test individual services:

```bash
# Test user service health
curl http://localhost:3001/health

# Test gateway service discovery
curl http://localhost:3000/health/services

# Test circuit breaker stats
curl http://localhost:3000/health/circuit-breakers
```

## Circuit Breaker Configuration

The circuit breaker system provides automatic failure protection:

### Configuration Options

```typescript
interface CircuitBreakerOptions {
  failureThreshold: number;        // Default: 5
  recoveryTimeout: number;         // Default: 30000ms
  timeout: number;                 // Default: 5000ms
  halfOpenMaxAttempts: number;     // Default: 3
  monitoring: boolean;             // Default: true
}
```

### States

1. **CLOSED**: Normal operation, requests pass through
2. **OPEN**: Service is failing, requests are blocked
3. **HALF_OPEN**: Testing if service has recovered

### Usage in Controllers

```typescript
// Before (direct gRPC call)
const result = await this.client.invoke('getUserVendors', { userId: req.userId });

// After (with circuit breaker protection)
const result = await this.serviceDiscovery.executeRequest('user-service', () =>
  this.client.invoke('getUserVendors', { userId: req.userId })
);
```

## Monitoring and Alerting

### Health Check Intervals

- **Default**: 30 seconds
- **Configurable**: Via `HEALTH_CHECK_INTERVAL` environment variable
- **Timeout**: 5 seconds per health check

### Logging

The system provides comprehensive logging:

```typescript
// Service registration
[ServiceDiscoveryService] Registered service: user-service at http://localhost:3001

// Health check results
[ServiceDiscoveryService] Service user-service is healthy (response time: 45ms)
[ServiceDiscoveryService] Service vendor-service is unhealthy (response time: 5000ms)

// Circuit breaker events
[CircuitBreaker] user-service: Circuit breaker opened after 5 failures
[CircuitBreaker] user-service: Circuit breaker moved to half-open state
```

## Troubleshooting

### Common Issues

1. **Service Not Found**
   - Check environment variables are set correctly
   - Verify service is running on the expected port
   - Check service registration logs

2. **Health Check Failures**
   - Verify service health endpoint is accessible
   - Check network connectivity
   - Review service logs for errors

3. **Circuit Breaker Issues**
   - Monitor failure counts
   - Check service response times
   - Review circuit breaker configuration

### Debug Commands

```bash
# Check service registration
curl http://localhost:3000/health/services

# Reset circuit breakers
curl http://localhost:3000/health/reset-circuit-breakers

# Test individual service health
curl http://localhost:3001/health/detailed
```

## Benefits

1. **Resilience**: Circuit breakers prevent cascading failures
2. **Monitoring**: Real-time health monitoring of all services
3. **Maintainability**: Shared health library reduces code duplication
4. **Scalability**: Dynamic service discovery from environment variables
5. **Production Ready**: Enterprise-grade monitoring and resilience patterns

## Next Steps

1. Set up monitoring dashboards
2. Configure alerting for unhealthy services
3. Implement service mesh integration
4. Add metrics collection
5. Set up automated health check reporting 