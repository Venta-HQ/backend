# 🔄 gRPC in Domain-Driven Design

## Overview

This guide explains how gRPC fits into our DDD architecture. gRPC is a transport layer. Business communication happens through domain contracts; gRPC carries those contract calls across process boundaries.

## 📋 Table of Contents

1. [Role of gRPC](#role-of-grpc)
2. [Domain Contracts](#domain-contracts)
3. [Context Mapping](#context-mapping)
4. [Implementation Patterns](#implementation-patterns)
5. [Best Practices](#best-practices)

## Role of gRPC

### Architecture Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Domain A    │     │  Domain B    │     │  Domain C    │
│  (Service)   │◀───▶│  (Service)   │◀───▶│  (Service)   │
└──────────────┘     └──────────────┘     └──────────────┘
       ▲                    ▲                    ▲
       │                    │                    │
       └────────────┬──────┴──────────┬────────┘
                    │   Domain        │
                    │  Contracts      │
                    └─────────────────┘
```

### Communication Flow

1. **Domain Boundaries**:

   - Domain contracts define capabilities and enforce isolation
   - gRPC services implement transport for those contracts (where cross-process is needed)

2. **Type Safety**:

   - Protocol buffers ensure type safety across domains
   - Contracts are strongly typed and versioned
   - Automatic client/server code generation

3. **Performance**:
   - Efficient binary communication
   - Streaming capabilities for real-time updates
   - Connection pooling and multiplexing

## Domain Contracts

### Contract Definition

```protobuf
// proto/domains/marketplace/vendor.proto
syntax = "proto3";

package marketplace.vendor;

import "common/types.proto";

service VendorService {
  // Command: Update vendor location
  rpc UpdateLocation(UpdateLocationRequest) returns (UpdateLocationResponse);

  // Query: Get vendor location
  rpc GetLocation(GetLocationRequest) returns (GetLocationResponse);

  // Stream: Watch vendor location updates
  rpc WatchLocation(WatchLocationRequest) returns (stream LocationUpdate);
}

message UpdateLocationRequest {
  string vendor_id = 1;
  Location location = 2;
  RequestContext context = 3;  // Cross-cutting context
}

message UpdateLocationResponse {
  bool success = 1;
  string error = 2;
}

message Location {
  double latitude = 1;
  double longitude = 2;
  double accuracy = 3;
  google.protobuf.Timestamp timestamp = 4;
}

message RequestContext {
  string request_id = 1;
  string correlation_id = 2;
  string user_id = 3;
  string domain = 4;
}
```

### Contract Implementation

```typescript
// apps/marketplace/services/vendor-management/src/grpc/vendor.service.ts
@Injectable()
export class VendorGrpcService implements VendorService {
	constructor(
		private readonly vendorService: VendorService,
		private readonly contextMapper: MarketplaceToLocationContextMapper,
		private readonly contextService: RequestContextService,
	) {}

	async updateLocation(request: UpdateLocationRequest): Promise<UpdateLocationResponse> {
		const context = this.contextService.getContext();

		try {
			// Map domain types
			const location = this.contextMapper.toLocationServicesLocation(request.location);

			// Execute domain logic
			await this.vendorService.updateLocation(request.vendorId, location);

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}

	async getLocation(request: GetLocationRequest): Promise<GetLocationResponse> {
		const location = await this.vendorService.getLocation(request.vendorId);
		return {
			location: this.contextMapper.toGrpcLocation(location),
		};
	}

	watchLocation(request: WatchLocationRequest): Observable<LocationUpdate> {
		return this.vendorService.watchLocation(request.vendorId).pipe(
			map((location) => ({
				vendorId: request.vendorId,
				location: this.contextMapper.toGrpcLocation(location),
			})),
		);
	}
}
```

## Context Mapping

### Proto to Domain Mapping

```typescript
// apps/marketplace/contracts/context-mappers/marketplace-to-location-context-mapper.ts
@Injectable()
export class MarketplaceToLocationContextMapper {
	toLocationServicesLocation(grpcLocation: GrpcLocation): DomainLocation {
		return {
			lat: grpcLocation.latitude,
			lng: grpcLocation.longitude,
			accuracy: grpcLocation.accuracy,
			timestamp: grpcLocation.timestamp.toDate(),
		};
	}

	toGrpcLocation(domainLocation: DomainLocation): GrpcLocation {
		return {
			latitude: domainLocation.lat,
			longitude: domainLocation.lng,
			accuracy: domainLocation.accuracy,
			timestamp: Timestamp.fromDate(domainLocation.timestamp),
		};
	}
}
```

### Cross-Domain Context

```typescript
// libs/nest/modules/networking/grpc-context/grpc-context.interceptor.ts
@Injectable()
export class GrpcContextInterceptor implements NestInterceptor {
	constructor(private readonly contextService: RequestContextService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const rpc = context.switchToRpc();
		const metadata = rpc.getContext();

		// Extract context from gRPC metadata
		const requestContext = {
			requestId: metadata.get('x-request-id')[0] || uuid(),
			correlationId: metadata.get('x-correlation-id')[0] || requestId,
			userId: metadata.get('x-user-id')[0],
			domain: process.env.DOMAIN_NAME,
			timestamp: new Date().toISOString(),
			source: 'grpc',
		};

		// Store context for the request lifecycle
		return from(this.contextService.run(requestContext, () => next.handle().toPromise()));
	}
}
```

## Implementation Patterns

### Service Registration

```typescript
// apps/marketplace/services/vendor-management/src/main.ts
async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(VendorManagementModule, {
		transport: Transport.GRPC,
		options: {
			package: 'marketplace.vendor',
			protoPath: join(__dirname, 'proto/vendor.proto'),
			loader: {
				keepCase: true,
				enums: String,
				oneofs: true,
				arrays: true,
			},
			interceptors: [new GrpcContextInterceptor(), new GrpcValidationInterceptor(), new GrpcLoggingInterceptor()],
		},
	});

	await app.listen();
}
```

### Client Configuration

```typescript
// apps/location-services/geolocation/src/vendor/vendor-client.config.ts
@Injectable()
export class VendorClientConfig {
	createGrpcOptions(): ClientOptions {
		return {
			transport: Transport.GRPC,
			options: {
				package: 'marketplace.vendor',
				protoPath: join(__dirname, 'proto/vendor.proto'),
				loader: {
					keepCase: true,
					enums: String,
					oneofs: true,
					arrays: true,
				},
			},
		};
	}
}

// Client usage
@Injectable()
export class LocationService {
	constructor(
		@Inject('VENDOR_PACKAGE') private readonly vendorClient: ClientGrpc,
		private readonly contextService: RequestContextService,
	) {}

	async updateVendorLocation(vendorId: string, location: Location) {
		const context = this.contextService.getContext();
		const client = this.vendorClient.getService<VendorService>('VendorService');

		// Add context to metadata
		const metadata = new Metadata();
		metadata.set('x-request-id', context.requestId);
		metadata.set('x-correlation-id', context.correlationId);

		return client.updateLocation(
			{
				vendorId,
				location: this.contextMapper.toGrpcLocation(location),
				context: {
					requestId: context.requestId,
					correlationId: context.correlationId,
					userId: context.userId,
					domain: context.domain,
				},
			},
			metadata,
		);
	}
}
```

## Best Practices

### 1. Domain Boundaries

- Keep proto definitions domain-specific
- Use separate proto packages per domain
- Define clear service interfaces
- Avoid sharing domain logic

```typescript
// Good: Clear domain boundary
package marketplace.vendor;

service VendorService {
	rpc UpdateLocation(UpdateLocationRequest) returns (UpdateLocationResponse);
}

// Bad: Mixed domain concerns
package shared;

service VendorService {
	rpc UpdateLocation(UpdateLocationRequest) returns (UpdateLocationResponse);
	rpc UpdateRedisCache(UpdateCacheRequest) returns (UpdateCacheResponse); // Wrong domain
}
```

### 2. Context Mapping

- Map between proto and domain types
- Keep mapping logic in context mappers
- Validate data during mapping
- Handle conversion errors

```typescript
// Good: Clear context mapping
@Injectable()
export class ContextMapper {
	toDomainLocation(grpcLocation: GrpcLocation): DomainLocation {
		if (!this.isValidGrpcLocation(grpcLocation)) {
			throw new AppError(ErrorType.VALIDATION, 'Invalid location data');
		}
		return {
			lat: grpcLocation.latitude,
			lng: grpcLocation.longitude,
		};
	}
}

// Bad: Mixed concerns
class VendorService {
	updateLocation(location: any) {
		// Direct use of gRPC types in domain
		this.repository.save(location);
	}
}
```

### 3. Error Handling

- Use proper error codes
- Include error context
- Map domain errors to gRPC status
- Maintain error boundaries

```typescript
// Good: Proper error handling
@Injectable()
export class GrpcExceptionFilter implements RpcExceptionFilter {
	catch(error: AppError) {
		if (error.type === ErrorType.NOT_FOUND) {
			return new RpcException({
				code: status.NOT_FOUND,
				message: error.message,
				details: error.context,
			});
		}
		// Map other error types...
	}
}

// Bad: Generic errors
catch(error) {
	throw new Error('Internal error');
}
```

### 4. Request Context

- Propagate context in metadata
- Use interceptors for context handling
- Include correlation IDs
- Maintain request lifecycle

```typescript
// Good: Context propagation
@Injectable()
class GrpcClient {
	call(request: any) {
		const context = this.contextService.getContext();
		const metadata = new Metadata();
		metadata.set('x-request-id', context.requestId);
		return this.client.call(request, metadata);
	}
}

// Bad: No context
class GrpcClient {
	call(request: any) {
		return this.client.call(request);
	}
}
```

## 📚 Related docs

- [Architecture Guide](./architecture-guide.md)
- [Domain Contracts & Context Mapping](./domain-contracts-guide.md)
- [Contracts Folder Conventions](./contracts-folder-conventions.md)
- [Request Context Guide](./request-context-guide.md)
- [Developer Guide](./developer-guide.md)
- [Testing Guide](./testing-guide.md)
