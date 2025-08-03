# App Improvements Analysis & Implementation Guide

## Overview

This document captures the analysis of all apps in the Venta Backend workspace, identifying areas for improvement to establish solid standards for future development.

## Analysis Summary

### 1. Things That Don't Make Sense

#### Gateway App - Inconsistent Architecture

- **Problem**: Gateway app contains both HTTP controllers AND gRPC client calls, mixing concerns
- **Issue**: Acting as both gateway and service, violating single responsibility principle
- **Status**: Needs refactoring
- **Priority**: High

#### WebSocket Gateway - Missing Logger

- **Problem**: `websocket-gateway` main.ts doesn't use Logger module like other apps
- **Issue**: Inconsistent logging across services
- **Status**: Easy fix
- **Priority**: Medium

#### Location Service - Hardcoded Distance Calculation

- **Problem**: Distance calculation logic embedded in controller
- **Issue**: Should be in utility library for reusability
- **Status**: Needs extraction
- **Priority**: High

### 2. Overly Complex or Should Be Broken Down

#### WebSocket Gateway - Monolithic Gateway

- **Problem**: Single gateway handling all WebSocket connections with complex Redis state management
- **Issues**:
  - 195 lines of complex connection/disconnection logic
  - Mixed concerns (user management, vendor management, location updates)
  - Hard to test and maintain
- **Status**: Needs decomposition
- **Priority**: High

#### Gateway App - Router Complexity

- **Problem**: Router.ts manually manages all route configurations
- **Issue**: Hard to maintain as services grow
- **Status**: Needs improvement
- **Priority**: Medium

#### Location Controller - Business Logic in Controller

- **Problem**: Complex geospatial calculations in controller
- **Issue**: Violates separation of concerns
- **Status**: Needs extraction
- **Priority**: High

### 3. Does Not Use Helpers That It Should

#### Missing RetryUtil Usage

- **Problem**: Only `algolia-sync` uses `RetryUtil`, but other services have similar retry needs
- **Missing in**:
  - `vendor` service (gRPC calls)
  - `location` service (Redis operations)
  - `websocket-gateway` (gRPC calls)
- **Status**: Needs implementation
- **Priority**: High

#### Missing Event Pattern Usage

- **Problem**: Several services don't emit events for important state changes
- **Missing in**:
  - `user` service (user creation/deletion)
  - `location` service (location updates - only emits vendor location)
  - `websocket-gateway` (connection events)
- **Status**: Needs implementation
- **Priority**: High

#### Missing Validation Usage

- **Problem**: Inconsistent validation across services
- **Missing in**:
  - `user` service (no input validation)
  - `websocket-gateway` (partial validation)
- **Status**: Needs implementation
- **Priority**: Medium

### 4. Should Use Event Pattern

#### User Service - Missing Events

- **Problem**: User creation/deletion doesn't emit events
- **Missing Events**:
  - `user.created`
  - `user.deleted`
  - `user.integration.created`
  - `user.integration.deleted`
- **Status**: Needs implementation
- **Priority**: High

#### Location Service - Limited Events

- **Problem**: Only emits vendor location updates
- **Missing Events**:
  - `user.location.updated`
  - `location.search.performed`
- **Status**: Needs implementation
- **Priority**: Medium

#### WebSocket Gateway - Connection Events

- **Problem**: No events for connection state changes
- **Missing Events**:
  - `websocket.user.connected`
  - `websocket.user.disconnected`
  - `websocket.vendor.connected`
  - `websocket.vendor.disconnected`
- **Status**: Needs implementation
- **Priority**: Medium

## Implementation Plan

### Phase 1: High Priority Fixes

#### 1. Extract Distance Calculation Utility

- **File**: `libs/utils/src/lib/geospatial.util.ts`
- **Purpose**: Reusable geospatial calculations
- **Methods**:
  - `calculateDistance(lat1, lon1, lat2, lon2): number`
  - `calculateBoundingBox(sw, ne): BoundingBox`

#### 2. Create Connection Manager Service

- **File**: `apps/websocket-gateway/src/services/connection-manager.service.ts`
- **Purpose**: Domain-specific WebSocket connection management for location-based updates
- **Methods**:
  - `registerUser(userId, socketId): Promise<void>`
  - `registerVendor(vendorId, socketId): Promise<void>`
  - `handleDisconnect(socketId): Promise<void>`

#### 3. Add Missing Events to User Service

- **Files**: `apps/user/src/clerk/clerk.service.ts`
- **Events**:
  - `user.created`
  - `user.deleted`
  - `user.integration.created`
  - `user.integration.deleted`

#### 4. Standardize Logger Usage

- **File**: `apps/websocket-gateway/src/main.ts`
- **Purpose**: Consistent logging across all services

### Phase 2: Medium Priority Improvements

#### 1. Extract Location Business Logic

- **File**: `apps/location/src/location.service.ts`
- **Purpose**: Move geospatial calculations to service layer

#### 2. Add Automatic Retry to gRPC Calls

- **File**: `libs/grpc/src/lib/grpc-instance.service.ts`
- **Purpose**: Automatic retry logic for all gRPC calls
- **Benefits**: Consistent retry behavior, no manual retry code needed in services

#### 3. Improve Validation Coverage

- **Services**: user, websocket-gateway
- **Purpose**: Consistent input validation

### Phase 3: Architecture Improvements

#### 1. Split WebSocket Gateway

- **Purpose**: Separate user and vendor concerns
- **New Files**:
  - `apps/websocket-gateway/src/gateways/user-location.gateway.ts`
  - `apps/websocket-gateway/src/gateways/vendor-location.gateway.ts`
  - `apps/websocket-gateway/src/services/connection-manager.service.ts` (already created)

#### 2. Improve Gateway Architecture

- **Purpose**: Better service discovery and routing
- **Considerations**: Service mesh, dynamic discovery, circuit breakers

#### 3. Add Event Sourcing

- **Purpose**: Track all state changes through events
- **Benefits**: Audit trails, event replay, better debugging

## Standard Template for Future Apps

### Main.ts Template

```typescript
async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const configService = app.get(ConfigService);

	// Standard logger setup
	app.useLogger(app.get(Logger));

	// Standard error handling
	app.useGlobalFilters(new AppExceptionFilter());

	await app.listen(configService.get('SERVICE_PORT'));
}
```

### Service Template

```typescript
@Injectable()
export class StandardService {
	constructor(
		private readonly eventsService: IEventsService,
		private readonly retryUtil: RetryUtil,
	) {}

	async performOperation(data: any) {
		return await this.retryUtil.retryOperation(async () => {
			const result = await this.doSomething(data);
			await this.eventsService.publishEvent('operation.completed', result);
			return result;
		}, 'Performing operation');
	}
}
```

### Module Template

```typescript
@Module({
	imports: [
		ConfigModule,
		LoggerModule.register({ appName: 'Service Name', protocol: 'grpc' }),
		PrismaModule.register(),
		EventsModule,
		ErrorHandlingModule,
	],
	controllers: [ServiceController],
	providers: [ServiceService],
})
export class ServiceModule {}
```

## Progress Tracking

### Completed

- [x] Phase 1.1: Extract Distance Calculation Utility
- [x] Phase 1.2: Create Connection Manager Service (domain-specific, in app)
- [x] Phase 1.3: Add Missing Events to User Service
- [x] Phase 1.4: Standardize Logger Usage

### Completed

- [x] Phase 2.1: Extract Location Business Logic
- [x] Phase 2.2: Add Automatic Retry to gRPC Calls
- [x] Phase 2.3: Improve Validation Coverage (documentation updated)

### Completed

- [x] Phase 3.1: Split WebSocket Gateway
- [x] Phase 3.2: Improve Gateway Architecture
- [x] Phase 3.3: Add Event Sourcing

### Completed

- [x] **RetryUtil Adoption**: Added retry logic to Location Service (Redis operations) and WebSocket Gateway (Redis operations)
- [x] **Event Pattern Coverage**: Completed missing events in Location Service (`user.location.updated`, `location.search.performed`)
- [x] **Validation Standardization**: Added validation to User Service (subscription controller) and Location Service (all endpoints)

### Planned

- [ ] Phase 4: Advanced Features (Future phases)

## Notes

- All improvements should maintain backward compatibility
- Each change should be tested thoroughly
- Documentation should be updated as changes are made
- Consider impact on existing integrations
- Monitor performance after each change
