# Testing All Service Types

This guide covers testing the protocol-agnostic architecture across all supported service types: HTTP, gRPC, and NATS.

## Overview

The new protocol-agnostic architecture ensures that all service types work seamlessly with the BootstrapModule and its components. This guide provides comprehensive testing procedures for each service type.

## Prerequisites

- All services are running with the updated BootstrapModule
- Test environment is properly configured
- Prometheus metrics endpoint is accessible

## 1. HTTP Service Testing

### Test Setup

Create a simple HTTP service test:

```typescript
// apps/gateway/src/test-http.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';

@Controller('test')
export class TestHttpController {
  @Get('ping')
  async ping() {
    return { message: 'pong', timestamp: new Date().toISOString() };
  }

  @Post('echo')
  async echo(@Body() data: any) {
    return { echo: data, timestamp: new Date().toISOString() };
  }
}
```

### Test Commands

```bash
# Start the gateway service
npx nest start gateway

# Test HTTP endpoints
curl http://localhost:3000/test/ping
curl -X POST http://localhost:3000/test/echo -H "Content-Type: application/json" -d '{"test": "data"}'

# Check metrics
curl http://localhost:3000/metrics | grep -E "(request_duration_seconds|requests_total)"
```

### Expected Metrics

You should see metrics like:
```
# HELP request_duration_seconds Duration of requests
# TYPE request_duration_seconds histogram
request_duration_seconds_bucket{method="GET",route="/test/ping",status_code="200",protocol="http",le="0.1"} 1

# HELP requests_total Total number of requests
# TYPE requests_total counter
requests_total{method="GET",route="/test/ping",status_code="200",protocol="http"} 1
```

## 2. gRPC Service Testing

### Test Setup

Use the existing vendor service or create a test gRPC service:

```typescript
// apps/vendor/src/test-grpc.controller.ts
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class TestGrpcController {
  @GrpcMethod('TestService', 'Ping')
  async ping(data: { message: string }) {
    return { 
      response: `pong: ${data.message}`, 
      timestamp: new Date().toISOString() 
    };
  }

  @GrpcMethod('TestService', 'Echo')
  async echo(data: any) {
    return { 
      echo: data, 
      timestamp: new Date().toISOString() 
    };
  }
}
```

### Test Commands

```bash
# Start the vendor service
npx nest start vendor

# Test gRPC endpoints using the test script
node test-grpc.js

# Check metrics
curl http://localhost:5015/metrics | grep -E "(request_duration_seconds|requests_total)"
```

### Expected Metrics

You should see metrics like:
```
# HELP request_duration_seconds Duration of requests
# TYPE request_duration_seconds histogram
request_duration_seconds_bucket{method="getVendorById",route="grpc",status_code="200",protocol="grpc",le="0.1"} 1

# HELP requests_total Total number of requests
# TYPE requests_total counter
requests_total{method="getVendorById",route="grpc",status_code="200",protocol="grpc"} 1
```

## 3. NATS Service Testing

### Test Setup

Create a NATS service test:

```typescript
// apps/user/src/test-nats.controller.ts
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class TestNatsController {
  @MessagePattern('test.ping')
  async ping(@Payload() data: { message: string }) {
    return { 
      response: `pong: ${data.message}`, 
      timestamp: new Date().toISOString() 
    };
  }

  @MessagePattern('test.echo')
  async echo(@Payload() data: any) {
    return { 
      echo: data, 
      timestamp: new Date().toISOString() 
    };
  }
}
```

### Test Commands

```bash
# Start the user service
npx nest start user

# Test NATS endpoints (requires NATS client)
npx ts-node test-nats.js

# Check metrics
curl http://localhost:5016/metrics | grep -E "(request_duration_seconds|requests_total)"
```

### NATS Test Script

```javascript
// test-nats.js
const nats = require('nats');

async function testNats() {
  const nc = await nats.connect({ servers: 'nats://localhost:4222' });
  
  console.log('Testing NATS connection...');
  
  try {
    // Test ping
    const pingResponse = await nc.request('test.ping', nats.JSONCodec().encode({ message: 'hello' }));
    console.log('NATS Ping Response:', nats.JSONCodec().decode(pingResponse.data));
    
    // Test echo
    const echoResponse = await nc.request('test.echo', nats.JSONCodec().encode({ test: 'data' }));
    console.log('NATS Echo Response:', nats.JSONCodec().decode(echoResponse.data));
    
  } catch (error) {
    console.error('NATS Error:', error);
  } finally {
    await nc.close();
  }
}

testNats();
```

## 4. Cross-Service Communication Testing

### Test Service-to-Service Calls

```bash
# Test HTTP -> gRPC communication
curl -X POST http://localhost:3000/api/vendors/lookup \
  -H "Content-Type: application/json" \
  -d '{"vendorId": "test-id"}'

# Test gRPC -> HTTP communication (if implemented)
node test-grpc-to-http.js

# Test NATS -> gRPC communication
npx ts-node test-nats-to-grpc.js
```

## 5. Metrics Validation

### Comprehensive Metrics Check

```bash
# Check all metrics endpoints
echo "=== Gateway Metrics ==="
curl -s http://localhost:3000/metrics | grep -E "(request_duration_seconds|requests_total)" | head -10

echo "=== Vendor gRPC Metrics ==="
curl -s http://localhost:5015/metrics | grep -E "(request_duration_seconds|requests_total)" | head -10

echo "=== User NATS Metrics ==="
curl -s http://localhost:5016/metrics | grep -E "(request_duration_seconds|requests_total)" | head -10
```

### Expected Protocol Distribution

You should see metrics with different protocol labels:
- `protocol="http"` for HTTP services
- `protocol="grpc"` for gRPC services
- `protocol="nats"` for NATS services (when implemented)

## 6. Error Handling Testing

### Test Error Scenarios

```bash
# Test HTTP 404
curl http://localhost:3000/nonexistent

# Test gRPC error
node test-grpc-error.js

# Test NATS timeout
npx ts-node test-nats-timeout.js
```

### Verify Error Metrics

```bash
# Check error metrics
curl -s http://localhost:3000/metrics | grep 'status_code="404"'
curl -s http://localhost:5015/metrics | grep 'status_code="500"'
```

## 7. Performance Testing

### Load Testing

```bash
# HTTP load test
npx autocannon -c 10 -d 30 http://localhost:3000/test/ping

# gRPC load test
node test-grpc-load.js

# NATS load test
npx ts-node test-nats-load.js
```

### Monitor Metrics During Load

```bash
# Watch metrics in real-time
watch -n 1 'curl -s http://localhost:3000/metrics | grep requests_total'
```

## 8. Integration Testing

### Full System Test

```bash
# Start all services
npx nest start gateway &
npx nest start vendor &
npx nest start user &
npx nest start websocket-gateway &

# Run integration tests
npx ts-node test/integration/all-services.test.ts

# Check all metrics endpoints
./scripts/check-all-metrics.sh
```

## 9. Troubleshooting

### Common Issues

1. **Metrics not appearing**
   - Check if PrometheusModule is properly imported
   - Verify metrics endpoint is accessible
   - Check service logs for errors

2. **Protocol detection issues**
   - Ensure context type is properly set
   - Check factory registry configuration
   - Verify interceptor registration

3. **Service communication failures**
   - Check service discovery configuration
   - Verify network connectivity
   - Check service health endpoints

### Debug Commands

```bash
# Check service health
curl http://localhost:3000/health
curl http://localhost:5015/health
curl http://localhost:5016/health

# Check service logs
tail -f logs/gateway.log
tail -f logs/vendor.log
tail -f logs/user.log

# Check metrics endpoint directly
curl -v http://localhost:3000/metrics
```

## 10. Validation Checklist

- [ ] HTTP service responds correctly
- [ ] gRPC service responds correctly
- [ ] NATS service responds correctly
- [ ] Metrics are collected for all protocols
- [ ] Error handling works across all protocols
- [ ] Cross-service communication works
- [ ] Performance is acceptable under load
- [ ] All health checks pass
- [ ] Logs show no errors
- [ ] Metrics show correct protocol labels

## Conclusion

The protocol-agnostic architecture ensures that all service types work seamlessly with the BootstrapModule. This testing guide provides comprehensive coverage to validate the implementation across all supported protocols.

For additional testing scenarios or protocol support, refer to the module documentation and consider extending the factory pattern for new protocols. 