# Auth Standardization Plan

## Overview

Currently, authentication and authorization are handled in various ways across the domains. We need to standardize this using `@venta/nest/auth` to ensure consistent security patterns and reduce code duplication.

## Current State (Updated 2024-03-21)

### Existing Components in `libs/nest/guards`

1. HTTP Authentication (`AuthGuard`)

   - ✅ Clerk integration
   - ✅ Token validation
   - ✅ User lookup with Redis caching
   - ✅ Error handling with `AppError`
   - ✅ Updated to use new auth types
   - ✅ Uses centralized `AuthService`

2. WebSocket Authentication (`WsAuthGuard`)

   - ✅ Token extraction from multiple sources
   - ✅ User context attachment
   - ✅ Connection state management
   - ✅ Updated to use new auth types
   - ✅ Uses centralized `AuthService`

3. Webhook Authentication (`SignedWebhookGuard`)
   - ✅ Svix signature verification
   - ✅ Used for Clerk and RevenueCat webhooks
   - ✅ Standardized error handling

### New Components

1. Core Authentication Types (`libs/nest/guards/types`)

   - ✅ `AuthUser` interface
   - ✅ `AuthMetadata` interface
   - ✅ `AuthProtocol` enum
   - ✅ Protocol-specific interfaces (`AuthenticatedRequest`, `AuthenticatedSocket`, `AuthenticatedMetadata`)

2. Core Authentication Service (`libs/nest/guards/core`)

   - ✅ `AuthService` for shared logic
   - ✅ Token validation
   - ✅ User lookup and caching
   - ✅ Auth context creation
   - ✅ Protocol-specific token extraction

3. gRPC Authentication (`libs/nest/guards/grpc`)
   - ✅ `GrpcAuthGuard` for gRPC services
   - ✅ `GrpcAuthInterceptor` for metadata handling
   - ✅ Standardized error handling
   - ✅ Auth context propagation

### Domain Integration Status

1. Marketplace Domain

   - ✅ Added `GrpcAuthGuard` to vendor-management
   - ✅ Added `GrpcAuthGuard` to user-management
   - 🔄 Fixing type errors in vendor-management
   - 🔄 Fixing type errors in user-management

2. Location Services Domain

   - ⏳ Update real-time app
   - ⏳ Update geolocation app

3. Communication Domain

   - ⏳ Update webhooks app

4. Infrastructure Domain
   - ⏳ Update file-management app

### Pending Tasks

1. Fix remaining type errors in marketplace domain
2. Integrate auth in location-services domain
3. Integrate auth in communication domain
4. Integrate auth in infrastructure domain

## Goals

1. Extend existing `libs/nest/guards` with missing functionality
2. Standardize auth patterns across protocols (HTTP, WebSocket, gRPC)
3. Implement consistent role-based access control
4. Improve type safety for auth-related code
5. Reduce duplication of auth logic
6. Maintain backward compatibility during migration

## Implementation Phases

### Phase 1: Auth Library Setup

1. Create standardized auth types in `libs/nest/guards/types`:

   - `AuthUser` interface (extending existing user types)
   - `AuthMetadata` interface (for protocol-specific auth data)
   - `AuthRole` enum (standardizing roles across domains)
   - `AuthPermission` type (for fine-grained access control)

2. Implement core auth components in `libs/nest/guards/core`:

   - `AuthService` for shared auth logic (token validation, user lookup)
   - `RoleGuard` for RBAC (extending existing guards)
   - `PermissionGuard` for fine-grained control
   - `AuthDecorators` for role/permission checks

3. Create gRPC auth guard in `libs/nest/guards/grpc`:
   - `GrpcAuthGuard` for gRPC services
   - `GrpcAuthInterceptor` for metadata handling
   - `GrpcAuthStrategy` for service-to-service auth

### Phase 2: Auth Integration

#### HTTP Auth (Clerk)

1. Enhance existing `AuthGuard`:

   - Add role-based validation
   - Add permission checks
   - Improve error handling
   - Add request correlation

2. Update HTTP controllers:
   - Use `RoleGuard` for role-based endpoints
   - Use `PermissionGuard` for specific actions
   - Add proper error handling
   - Add request correlation IDs

#### WebSocket Auth

1. Enhance existing `WsAuthGuard`:

   - Add role-based validation
   - Add permission checks
   - Improve error handling
   - Add socket correlation

2. Update WebSocket gateways:
   - Use `RoleGuard` for role-based events
   - Use `PermissionGuard` for specific actions
   - Add proper error handling
   - Add socket correlation IDs

#### gRPC Auth

1. Create `GrpcAuthStrategy`:

   - Handle metadata-based auth
   - Propagate auth context
   - Support service-to-service auth

2. Update gRPC services:
   - Replace custom interceptors
   - Use `GrpcAuthGuard`
   - Implement proper error handling

### Phase 3: Role-Based Access Control

1. Define standard roles:

   ```typescript
   export enum AuthRole {
   	ADMIN = 'admin',
   	VENDOR = 'vendor',
   	USER = 'user',
   	SERVICE = 'service',
   }
   ```

2. Define permissions:

   ```typescript
   export type AuthPermission =
   	| 'read:users'
   	| 'write:users'
   	| 'read:vendors'
   	| 'write:vendors'
   	| 'manage:files'
   	| 'manage:subscriptions';
   ```

3. Implement role mapping:
   - Map Clerk roles to internal roles
   - Handle role inheritance
   - Support custom role definitions

### Phase 4: Domain Updates

#### Marketplace Domain

1. Update vendor management:

   - Use `RoleGuard` for vendor operations
   - Implement vendor-specific permissions
   - Update ACLs to use auth context

2. Update user management:
   - Use standardized auth for user operations
   - Implement user role management
   - Update user-related ACLs

#### Location Services Domain

1. Update real-time app:

   - Replace custom WebSocket auth
   - Implement location-based permissions
   - Update connection managers

2. Update geolocation app:
   - Use `GrpcAuthGuard` for services
   - Implement location access control
   - Update ACLs

#### Communication Domain

1. Update webhooks app:
   - Use `SignedWebhookGuard` consistently
   - Implement webhook auth validation
   - Update webhook handlers

#### Infrastructure Domain

1. Update file management:
   - Use `RoleGuard` for file operations
   - Implement file access permissions
   - Update file upload validation

## Implementation Order

1. Auth Library Setup

   - Core types and interfaces
   - Base guards and services
   - Protocol-specific implementations

2. HTTP Auth Integration

   - Clerk integration
   - Controller updates
   - Role/permission implementation

3. WebSocket Auth Integration

   - Real-time app updates
   - Connection management
   - Socket authentication

4. gRPC Auth Integration

   - Service-to-service auth
   - Metadata handling
   - Error standardization

5. Domain Updates
   - Marketplace domain
   - Location Services domain
   - Communication domain
   - Infrastructure domain

## Success Criteria

1. All authentication flows use `@venta/nest/auth`
2. Consistent error handling for auth failures
3. Type-safe role and permission checks
4. Clear auth patterns for each protocol
5. Reduced code duplication
6. Improved security through standardization

## Migration Strategy

1. Create new auth components alongside existing ones
2. Gradually migrate each domain to new auth system
3. Test thoroughly in each phase
4. Remove old auth code once migration is complete
5. Update documentation with new patterns
