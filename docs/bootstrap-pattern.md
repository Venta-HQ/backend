# 🚀 Bootstrap Pattern

## 📋 Table of Contents

- [Overview](#overview)
- [Service Types](#service-types)
- [Environment Variables](#environment-variables)
- [Benefits](#benefits)
- [Port Ranges](#port-ranges)
- [Migration Notes](#migration-notes)
- [Recommended Usage](#recommended-usage)

## 🎯 Overview

This document describes the **standardized bootstrap pattern** used across all Venta backend services. The bootstrap pattern ensures consistent service initialization while optimizing resource usage based on service type.

## 🔧 Service Types

### 1. **HTTP Services** (Gateway, WebSocket Gateway)

- **✅ Single HTTP server** with health checks included
- **✅ BootstrapModule** provides full infrastructure (logging, error handling, etc.)
- **✅ HealthCheckModule** automatically included for HTTP services

#### **Implementation Example**

```typescript
// main.ts
await BootstrapService.bootstrapHttpService({
	module: AppModule, // HealthCheckModule automatically included
	port: 'GATEWAY_SERVICE_PORT',
});

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
export class AppModule {}
```

### 2. **gRPC Microservices** (Location, User, Vendor)

- **✅ gRPC server** for main functionality
- **✅ Separate HTTP server** for health checks
- **✅ BootstrapModule** in main module for gRPC infrastructure

#### **Implementation Example**

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
		protoPath: 'location.proto',
		urlEnvVar: 'LOCATION_SERVICE_ADDRESS',
	},
});

// location.module.ts
@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: 'Location Microservice',
			protocol: 'grpc',
		}),
	],
})
export class LocationModule {}
```

### 3. **NATS Consumers** (Algolia Sync)

- **✅ NATS microservice** for message consumption
- **✅ Separate HTTP server** for health checks
- **✅ BootstrapModule** for consistency and observability

#### **Implementation Example**

```typescript
// main.ts
await BootstrapService.bootstrapNatsMicroservice({
	health: {
		host: '0.0.0.0',
		module: HealthCheckModule,
		port: 'ALGOLIA_SYNC_HEALTH_PORT',
	},
	main: {
		module: AlgoliaSyncModule, // Includes BootstrapModule
		queue: 'algolia-sync-queue',
		urlEnvVar: 'NATS_URL',
	},
});

// algolia-sync.module.ts
@Module({
	imports: [
		BootstrapModule.forRoot({
			additionalModules: [AlgoliaModule.register(), NatsQueueModule],
			appName: 'Algolia Sync Service',
			protocol: 'nats',
		}),
	],
})
export class AlgoliaSyncModule {}
```

## 🔧 Environment Variables

### **Standardized Naming Convention**

| Service               | Main Port                        | Health Port                | Description               |
| --------------------- | -------------------------------- | -------------------------- | ------------------------- |
| **Gateway**           | `GATEWAY_SERVICE_PORT`           | (included in main)         | API Gateway service       |
| **WebSocket Gateway** | `WEBSOCKET_GATEWAY_SERVICE_PORT` | (included in main)         | WebSocket Gateway service |
| **Location**          | `LOCATION_SERVICE_ADDRESS`       | `LOCATION_HEALTH_PORT`     | Location microservice     |
| **User**              | `USER_SERVICE_ADDRESS`           | `USER_HEALTH_PORT`         | User microservice         |
| **Vendor**            | `VENDOR_SERVICE_ADDRESS`         | `VENDOR_HEALTH_PORT`       | Vendor microservice       |
| **Algolia Sync**      | `NATS_URL`                       | `ALGOLIA_SYNC_HEALTH_PORT` | Algolia sync service      |

## ✅ Benefits

| Benefit                           | Description                                         |
| --------------------------------- | --------------------------------------------------- |
| **🔄 Resource Optimization**      | HTTP services don't run duplicate servers           |
| **🏥 Consistent Health Checks**   | All services have health endpoints                  |
| **⚙️ Appropriate Infrastructure** | Each service type gets the right level of bootstrap |
| **📏 Standardized Pattern**       | Consistent approach across all services             |
| **🔧 Flexible Configuration**     | Environment-based port configuration                |

## 🔌 Port Ranges

### **Service Port Allocation**

| Port Range     | Service Type       | Examples                                            |
| -------------- | ------------------ | --------------------------------------------------- |
| **5000-5009**  | gRPC services      | User (5000), Location (5001), Vendor (5005)         |
| **5002, 5004** | HTTP services      | Gateway (5002), WebSocket Gateway (5004)            |
| **5010-5019**  | Health check ports | For microservices that need separate health servers |
| **4222**       | NATS               | Standard NATS port                                  |

### **Port Assignment Strategy**

```
┌─────────────────────────────────────────────────────────────┐
│                    Port Allocation                          │
├─────────────────────────────────────────────────────────────┤
│ 5000: User Service (gRPC)                                   │
│ 5001: Location Service (gRPC)                               │
│ 5002: API Gateway (HTTP)                                    │
│ 5004: WebSocket Gateway (HTTP)                              │
│ 5005: Vendor Service (gRPC)                                 │
│ 5010: User Health Check (HTTP)                              │
│ 5011: Location Health Check (HTTP)                          │
│ 5015: Vendor Health Check (HTTP)                            │
│ 5016: Algolia Sync Health Check (HTTP)                      │
│ 4222: NATS Server                                           │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Bootstrap Method Naming Convention

| Service Type          | Method Name                 | Health Check Location   | Use Case                   |
| --------------------- | --------------------------- | ----------------------- | -------------------------- |
| **HTTP Service**      | `bootstrapHttpService`      | Included in main server | Gateway, WebSocket Gateway |
| **gRPC Microservice** | `bootstrapGrpcMicroservice` | Separate server         | User, Vendor, Location     |
| **NATS Microservice** | `bootstrapNatsMicroservice` | Separate server         | Algolia Sync               |

## 🔄 Migration Notes

### **Key Changes**

- ✅ **HTTP services** automatically include health checks in main server
- ✅ **gRPC/NATS services** use separate lightweight health servers
- ✅ **Environment variables** follow consistent naming pattern
- ✅ **BootstrapModule** used for all service types (HTTP, gRPC, NATS) for consistency
- ✅ **Health checks** are always included (no "with health" suffix needed)
- ✅ **HealthCheckModule** automatically included for HTTP services in BootstrapModule

### **Before vs After**

#### **Before (Legacy Pattern)**

```typescript
// ❌ Inconsistent patterns
await BootstrapService.bootstrapHttpServiceWithHealth({
	module: AppModule,
	port: 'PORT',
	healthPort: 'HEALTH_PORT', // Separate health port
});
```

#### **After (Standardized Pattern)**

```typescript
// ✅ Consistent patterns
await BootstrapService.bootstrapHttpService({
	module: AppModule, // HealthCheckModule automatically included
	port: 'SERVICE_PORT',
});
```

## 🎯 Recommended Usage

### **For HTTP Services**

```typescript
// HTTP services with health checks automatically included
await BootstrapService.bootstrapHttpService({
	module: AppModule, // HealthCheckModule automatically included
	port: 'SERVICE_PORT',
});
```

### **For gRPC Microservices**

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
		protoPath: 'service.proto',
		urlEnvVar: 'SERVICE_ADDRESS',
	},
});
```

### **For NATS Microservices**

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

## 🚀 Benefits of Coordinated Bootstrap

### **Error Handling**

- ✅ **Proper cleanup** if either service fails to start
- ✅ **Graceful shutdown** of all services
- ✅ **Resource management** with automatic cleanup on failure

### **Kubernetes Ready**

- ✅ **Perfect for K8s** health checks and lifecycle management
- ✅ **Container health monitoring** with proper probes
- ✅ **Service discovery** integration

### **Observability**

- ✅ **Better logging** visibility into service startup/shutdown
- ✅ **Health check monitoring** across all services
- ✅ **Performance tracking** of bootstrap process

## 🔧 Configuration Examples

### **Environment Configuration**

```bash
# .env
# HTTP Services
GATEWAY_SERVICE_PORT=5002
WEBSOCKET_GATEWAY_SERVICE_PORT=5004

# gRPC Services
USER_SERVICE_ADDRESS=localhost:5000
LOCATION_SERVICE_ADDRESS=localhost:5001
VENDOR_SERVICE_ADDRESS=localhost:5005

# Health Check Ports
USER_HEALTH_PORT=5010
LOCATION_HEALTH_PORT=5011
VENDOR_HEALTH_PORT=5015
ALGOLIA_SYNC_HEALTH_PORT=5016

# NATS
NATS_URL=nats://localhost:4222
```

### **Docker Configuration**

```yaml
# docker-compose.yml
services:
  gateway:
    environment:
      - GATEWAY_SERVICE_PORT=5002
    ports:
      - '5002:5002'

  user-service:
    environment:
      - USER_SERVICE_ADDRESS=user-service:5000
      - USER_HEALTH_PORT=5010
    ports:
      - '5000:5000'
      - '5010:5010'
```

## 📊 Service Bootstrap Summary

| Service               | Type | Bootstrap Method            | Health Check | Ports      |
| --------------------- | ---- | --------------------------- | ------------ | ---------- |
| **Gateway**           | HTTP | `bootstrapHttpService`      | Included     | 5002       |
| **WebSocket Gateway** | HTTP | `bootstrapHttpService`      | Included     | 5004       |
| **User**              | gRPC | `bootstrapGrpcMicroservice` | Separate     | 5000, 5010 |
| **Vendor**            | gRPC | `bootstrapGrpcMicroservice` | Separate     | 5005, 5015 |
| **Location**          | gRPC | `bootstrapGrpcMicroservice` | Separate     | 5001, 5011 |
| **Algolia Sync**      | NATS | `bootstrapNatsMicroservice` | Separate     | 4222, 5016 |

---

**This bootstrap pattern provides a consistent, efficient, and maintainable approach to service initialization across the entire Venta backend ecosystem.**
