# Bootstrap Module

This module provides a unified bootstrapping system for NestJS applications with support for HTTP, gRPC, and NATS protocols in any combination.

## Overview

The Bootstrap Module provides:

- **Unified BootstrapService**: Single method to bootstrap any protocol combination
- **Protocol-specific logging**: Optimized logger configuration for each service type
- **Multi-stream NATS support**: Listen to multiple NATS streams in one service
- **Automatic health checks**: HTTP health endpoints for all services
- **Standardized configuration**: Consistent setup across all applications

## Architecture

### Service Types

| Service Type         | Primary Protocol | Logger Protocol | Use Case                          |
| -------------------- | ---------------- | --------------- | --------------------------------- |
| **Gateway Services** | HTTP             | `'http'`        | API gateways, web servers         |
| **Domain Services**  | gRPC             | `'grpc'`        | Business logic, data processing   |
| **Event Services**   | NATS             | `'auto'`        | Event processing, background jobs |

### Protocol Combinations

All services support hybrid configurations:

- **gRPC + HTTP**: Domain services with health checks
- **NATS + HTTP**: Event processors with health checks
- **gRPC + NATS + HTTP**: Full domain services with events
- **HTTP only**: Pure API gateways

## Usage

### 1. BootstrapModule Configuration

Configure your service module with the appropriate protocol:

```typescript
// HTTP-only service (Gateway)
@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: 'Gateway Service',
			protocol: 'http',
			additionalModules: [ClerkModule, ThrottlerModule],
		}),
	],
})
export class GatewayModule {}

// gRPC service (Domain)
@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: 'User Service',
			protocol: 'grpc',
			additionalModules: [RedisModule],
		}),
	],
})
export class UserModule {}

// Event service (NATS)
@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: 'Algolia Sync Service',
			// protocol defaults to 'auto' for NATS services
			additionalModules: [AlgoliaModule],
		}),
	],
})
export class AlgoliaSyncModule {}
```

### 2. BootstrapService Configuration

Use the unified `bootstrap()` method in your `main.ts`:

```typescript
import { BootstrapService } from '@app/nest/modules';

async function bootstrap() {
	await BootstrapService.bootstrap({
		appName: 'Service Name',
		module: ServiceModule,

		// HTTP configuration (optional)
		http: {
			port: 'SERVICE_HTTP_PORT',
			enableCors: true,
			corsOptions: {
				origin: ['http://localhost:3000'],
				credentials: true,
			},
		},

		// gRPC configuration (optional)
		grpc: {
			package: 'service-package',
			protoPath: '../proto/src/definitions/service.proto',
			urlEnvVar: 'SERVICE_GRPC_ADDRESS',
			defaultUrl: 'localhost:5000',
		},

		// NATS configuration (optional)
		nats: {
			queue: 'service-queue',
			servers: process.env.NATS_URL || 'nats://localhost:4222',
			// Multiple streams support
			streams: [
				{
					queue: 'vendor-events',
					servers: process.env.NATS_URL || 'nats://localhost:4222',
				},
				{
					queue: 'user-events',
					servers: process.env.NATS_URL || 'nats://localhost:4222',
				},
			],
		},
	});
}

bootstrap();
```

## Service Examples

### Gateway Service (HTTP-only)

```typescript
// gateway/src/main.ts
await BootstrapService.bootstrap({
	appName: 'Gateway Service',
	module: GatewayModule,
	http: {
		port: 'GATEWAY_SERVICE_PORT',
		enableCors: true,
	},
});

// gateway/src/gateway.module.ts
@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: 'Gateway Service',
			protocol: 'http',
			additionalModules: [ClerkModule, ThrottlerModule],
		}),
	],
})
export class GatewayModule {}
```

### Domain Service (gRPC + HTTP)

```typescript
// user/src/main.ts
await BootstrapService.bootstrap({
	appName: 'User Service',
	module: UserModule,
	grpc: {
		package: 'user',
		protoPath: '../proto/src/definitions/user.proto',
		urlEnvVar: 'USER_SERVICE_ADDRESS',
		defaultUrl: 'localhost:5000',
	},
	// HTTP health checks are automatically included
});

// user/src/user.module.ts
@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: 'User Service',
			protocol: 'grpc', // Optimized for gRPC with HTTP health checks
		}),
	],
})
export class UserModule {}
```

### Event Service (NATS + HTTP)

```typescript
// algolia-sync/src/main.ts
await BootstrapService.bootstrap({
	appName: 'Algolia Sync Service',
	module: AlgoliaSyncModule,
	nats: {
		queue: 'algolia-sync',
		servers: process.env.NATS_URL || 'nats://localhost:4222',
	},
	http: {
		port: 'ALGOLIA_SYNC_SERVICE_HTTP_PORT',
	},
});

// algolia-sync/src/algolia-sync.module.ts
@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: 'Algolia Sync Service',
			// protocol defaults to 'auto' for NATS services
			additionalModules: [AlgoliaModule],
		}),
	],
})
export class AlgoliaSyncModule {}
```

### Hybrid Domain Service (gRPC + NATS + HTTP)

```typescript
// Future vendor domain service
await BootstrapService.bootstrap({
	appName: 'Vendor Domain Service',
	module: VendorModule,
	grpc: {
		package: 'vendor',
		protoPath: '../proto/src/definitions/vendor.proto',
		urlEnvVar: 'VENDOR_SERVICE_ADDRESS',
	},
	nats: {
		queue: 'vendor-domain',
		servers: process.env.NATS_URL || 'nats://localhost:4222',
		streams: [
			{
				queue: 'vendor-events',
				servers: process.env.NATS_URL || 'nats://localhost:4222',
			},
			{
				queue: 'user-events',
				servers: process.env.NATS_URL || 'nats://localhost:4222',
			},
		],
	},
	http: {
		port: 'VENDOR_SERVICE_HTTP_PORT',
	},
});
```

## Logger Configuration

The BootstrapModule automatically configures the appropriate logger based on the protocol:

### HTTP Protocol (`'http'`)

- HTTP request ID generation and propagation
- HTTP-specific logging with request context
- Used for: Gateway services, WebSocket gateways

### gRPC Protocol (`'grpc'`)

- gRPC request ID interceptors
- gRPC-specific logging services
- Basic HTTP logging (for health checks)
- Used for: Domain services (User, Location, Vendor)

### Auto Protocol (`'auto'`)

- Both HTTP and gRPC capabilities
- Full request ID propagation across protocols
- Used for: Event services, hybrid services

## Benefits

- **Unified Interface**: Single bootstrap method for all protocol combinations
- **Protocol Optimization**: Each service gets the right logger configuration
- **Multi-stream Support**: Listen to multiple NATS streams in one service
- **Automatic Health Checks**: All services get HTTP health endpoints
- **Type Safety**: Full TypeScript support with proper interfaces
- **Consistency**: Standardized configuration across all services
- **Flexibility**: Easy to add new protocols or change existing ones
- **Performance**: Only loads the logging capabilities each service needs

## Configuration Options

### UnifiedBootstrapOptions

```typescript
interface UnifiedBootstrapOptions {
	appName: string;
	module: any;

	// HTTP configuration
	http?: {
		port?: string; // Environment variable name for port
		host?: string; // Host to bind to (default: '0.0.0.0')
		enableCors?: boolean; // Enable CORS (default: true)
		corsOptions?: {
			// Custom CORS options
			origin?: string | string[];
			credentials?: boolean;
			methods?: string[];
			allowedHeaders?: string[];
		};
	};

	// gRPC configuration
	grpc?: {
		package: string; // gRPC package name
		protoPath: string; // Path to .proto file
		urlEnvVar: string; // Environment variable for gRPC address
		defaultUrl?: string; // Default gRPC URL
	};

	// NATS configuration
	nats?: {
		queue: string; // Primary NATS queue
		servers: string; // NATS server URLs
		streams?: Array<{
			// Additional NATS streams
			queue: string;
			servers: string;
		}>;
	};

	// Additional configuration
	additionalModules?: any[];
	additionalProviders?: any[];
	healthChecks?: () => Promise<Record<string, string>>;
}
```

### BootstrapOptions

```typescript
interface BootstrapOptions {
	appName: string;
	protocol?: 'http' | 'grpc' | 'auto'; // Logger protocol (default: 'auto')
	additionalModules?: any[];
	additionalProviders?: any[];
	healthChecks?: () => Promise<Record<string, string>>;
}
```
