# Bootstrap Pattern

This document describes the standardized bootstrap pattern used across all Venta backend services.

## Overview

The bootstrap pattern ensures consistent service initialization while optimizing resource usage based on service type.

## Service Types

### 1. HTTP Services (Gateway, WebSocket Gateway)

- **Single HTTP server** with health checks included
- **BootstrapModule** provides full infrastructure (logging, error handling, etc.)
- **HealthCheckModule** automatically included for HTTP services

```typescript
// main.ts
await BootstrapService.bootstrapHttpService({
	module: AppModule, // HealthCheckModule automatically included
	port: 'GATEWAY_SERVICE_PORT',
});
```

// app.module.ts
@Module({
imports: [
BootstrapModule.forRoot({
additionalModules: [...otherModules], // HealthCheckModule auto-included
appName: 'gateway',
protocol: 'http',
}),
],
})

````

### 2. gRPC Microservices (Location, User, Vendor)

- **gRPC server** for main functionality
- **Separate HTTP server** for health checks
- **BootstrapModule** in main module for gRPC infrastructure

```typescript
// main.ts
await BootstrapService.bootstrapGrpcMicroservice({
  health: {
    host: '0.0.0.0',
    module: HealthCheckModule,
    port: 'LOCATION_HEALTH_PORT',
  },
  main: {
    module: LocationModule, // Includes BootstrapModule
    package: LOCATION_PACKAGE_NAME,
    protoPath: '../proto/src/definitions/location.proto',
    urlEnvVar: 'LOCATION_SERVICE_ADDRESS',
  },
});
````

// location.module.ts
@Module({
imports: [
BootstrapModule.forRoot({
appName: 'Location Microservice',
protocol: 'grpc',
}),
],
})

````

### 3. NATS Consumers (Algolia Sync)

- **NATS microservice** for message consumption
- **Separate HTTP server** for health checks
- **No BootstrapModule** needed (pure message consumer)

```typescript
// main.ts
await BootstrapService.bootstrapNatsMicroservice({
  health: {
    host: '0.0.0.0',
    module: HealthCheckModule,
    port: 'ALGOLIA_SYNC_HEALTH_PORT',
  },
  main: {
    module: AlgoliaSyncModule, // No BootstrapModule
    queue: 'algolia-sync-queue',
    urlEnvVar: 'NATS_URL',
  },
});
````

// algolia-sync.module.ts
@Module({
imports: [AlgoliaModule.register()], // Only what's needed
})

````

## Environment Variables

### Standardized Naming Convention

| Service           | Main Port                        | Health Port                |
| ----------------- | -------------------------------- | -------------------------- |
| Gateway           | `GATEWAY_SERVICE_PORT`           | (included in main)         |
| WebSocket Gateway | `WEBSOCKET_GATEWAY_SERVICE_PORT` | (included in main)         |
| Location          | `LOCATION_SERVICE_ADDRESS`       | `LOCATION_HEALTH_PORT`     |
| User              | `USER_SERVICE_ADDRESS`           | `USER_HEALTH_PORT`         |
| Vendor            | `VENDOR_SERVICE_ADDRESS`         | `VENDOR_HEALTH_PORT`       |
| Algolia Sync      | `NATS_URL`                       | `ALGOLIA_SYNC_HEALTH_PORT` |

## Benefits

1. **Resource Optimization**: HTTP services don't run duplicate servers
2. **Consistent Health Checks**: All services have health endpoints
3. **Appropriate Infrastructure**: Each service type gets the right level of bootstrap
4. **Standardized Pattern**: Consistent approach across all services
5. **Flexible Configuration**: Environment-based port configuration

## Port Ranges

- **Main Service Ports**: 5000-5009 (gRPC services), 5002, 5004 (HTTP services)
- **Health Check Ports**: 5010-5019 (for microservices that need separate health servers)
- **NATS**: 4222 (standard NATS port)

## Bootstrap Method Naming Convention

| Service Type | Method Name | Health Check Location |
|--------------|-------------|----------------------|
| HTTP Service | `bootstrapHttpService` | Included in main server |
| gRPC Microservice | `bootstrapGrpcMicroservice` | Separate server |
| NATS Microservice | `bootstrapNatsMicroservice` | Separate server |

## Migration Notes

- HTTP services automatically include health checks in main server
- gRPC/NATS services use separate lightweight health servers
- Environment variables follow consistent naming pattern
- BootstrapModule only used where needed (gRPC/HTTP services, not NATS consumers)
- Health checks are always included (no "with health" suffix needed)
- HealthCheckModule automatically included for HTTP services in BootstrapModule

## Recommended Usage

### For HTTP Services

```typescript
// HTTP services with health checks automatically included
await BootstrapService.bootstrapHttpService({
	module: AppModule, // HealthCheckModule automatically included
	port: 'SERVICE_PORT',
});
````

### For gRPC Microservices

```typescript
// gRPC microservices with separate health server
await BootstrapService.bootstrapGrpcMicroservice({
	health: {
		host: '0.0.0.0',
		module: HealthCheckModule,
		port: 'SERVICE_HEALTH_PORT',
	},
	main: {
		module: ServiceModule,
		package: 'service-package',
		protoPath: '../proto/src/definitions/service.proto',
		urlEnvVar: 'SERVICE_ADDRESS',
	},
});
```

### For NATS Microservices

```typescript
// NATS microservices with separate health server
await BootstrapService.bootstrapNatsMicroservice({
	health: {
		host: '0.0.0.0',
		module: HealthCheckModule,
		port: 'SERVICE_HEALTH_PORT',
	},
	main: {
		module: ServiceModule,
		queue: 'service-queue',
		urlEnvVar: 'NATS_URL',
	},
});
```

## Benefits of Coordinated Bootstrap

1. **Error Handling**: Proper cleanup if either service fails to start
2. **Graceful Shutdown**: Coordinated shutdown of all services
3. **Kubernetes Ready**: Perfect for K8s health checks and lifecycle management
4. **Resource Management**: Automatic cleanup of resources on failure
5. **Logging**: Better visibility into service startup/shutdown
