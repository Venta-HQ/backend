# Post-DDD Migration Project

This document outlines the plan for improving our codebase after the initial DDD migration. The focus is on leveraging our existing libraries, standardizing patterns, and improving maintainability.

## Project Goals

1. Reduce code duplication by using existing libraries
2. Improve security by using battle-tested implementations
3. Make the codebase more consistent and maintainable
4. Strengthen type safety and domain boundaries

## Implementation Plan

### Phase 1: Library Integration

#### 1. Replace Custom Webhook Handling

- Remove `WebhookSignatureACL`
- Update Clerk and RevenueCat controllers to use `@venta/nest/webhooks`
- Use built-in webhook decorators, validation, and error handling
- Use built-in signature verification

#### 2. Replace Custom Event Handling

- Remove custom NATS code from all services
- Use `@venta/nest/events` for all event handling
- Standardize event types and validation
- Use built-in event decorators and logging

#### 3. Standardize Error Handling

- Remove custom error handling from ACLs
- Use `@venta/nest/errors` consistently
- Use standard error types and codes
- Use built-in error logging

#### 4. Standardize Validation

- Move common schemas to `@venta/nest/validation`
- Use built-in validation decorators and pipes
- Share validation schemas across domains
- Remove duplicate validation logic

#### 5. Standardize Auth

- Extend existing `@venta/nest/guards` library:
  - HTTP auth with `AuthGuard` (Clerk integration)
  - WebSocket auth with `WsAuthGuard`
  - Webhook auth with `SignedWebhookGuard`
- Add missing components:
  - gRPC auth strategy
  - Role-based access control
  - Permission system
  - Standardized auth types
  - Auth service for shared logic

#### 6. Standardize Logging

- Replace raw Logger usage with `@venta/nest/logging`
- Add request correlation
- Add structured logging
- Add context metadata

### Phase 2: Domain Organization

#### 1. Move Misplaced Components

- Move app-level ACLs to contracts:
  - `AlgoliaACL` → `marketplace/contracts/anti-corruption-layers`
  - `NatsACL` → `marketplace/contracts/anti-corruption-layers`
  - `WebSocketACL` → `location-services/contracts/anti-corruption-layers`
- Move app-level context mappers to contracts:
  - `SearchToMarketplaceContextMapper` → `marketplace/contracts/context-mappers`
  - `RealtimeToMarketplaceContextMapper` → `location-services/contracts/context-mappers`

#### 2. Standardize Naming

- Rename ACLs consistently:
  - `ClerkAntiCorruptionLayer` → `ClerkACL`
  - `RevenueCatAntiCorruptionLayer` → `RevenueCatACL`
- Rename context mappers consistently
- Update all imports and usages

#### 3. Clean Up Unused Code

- Remove unused context mappers:
  - `MarketplaceToCommunicationContextMapper`
  - `MarketplaceToInfrastructureContextMapper`
- Remove unused ACLs
- Remove duplicate validation schemas

### Phase 3: Type Safety

#### 1. Audit Context Mapper Usage

- Ensure all cross-domain communication uses mappers
- Add missing mapper injections
- Fix type inconsistencies
- Add type predicates where needed

#### 2. Audit ACL Usage

- Ensure all external service interactions use ACLs
- Add missing ACL injections
- Fix validation inconsistencies
- Add proper error handling

#### 3. Standardize Domain Types

- Move all domain types to contracts
- Use consistent namespace structure
- Share common types through libs
- Add proper JSDoc documentation

## Implementation Order

### Priority 1: Library Integration

- Highest impact on code quality
- Reduces duplication significantly
- Improves security and maintainability
- Start with webhooks as they're most critical

### Priority 2: Domain Organization

- Makes codebase more navigable
- Improves maintainability
- Can be done gradually

### Priority 3: Type Safety

- Can be done in parallel with other work
- Improves reliability
- Catches issues early

## Example: Webhook Service Improvement

### Current Implementation

```typescript
@Post()
async handleClerkEvent(
  @Body() rawEvent: unknown,
  @Headers('svix-signature') signature?: string,
): Promise<{ message: string }> {
  if (!signature) {
    throw AppError.validation('COMMUNICATION_INVALID_WEBHOOK_SIGNATURE', 'Missing webhook signature');
  }

  const rawBody = JSON.stringify(rawEvent);
  const isValid = this.webhookACL.verifySignature(rawBody, signature, this.config);
  // ... more custom validation and handling
}
```

### Using Our Library

```typescript
@Post()
@WebhookHandler({
  provider: 'clerk',
  secret: process.env.CLERK_WEBHOOK_SECRET,
})
async handleClerkEvent(
  @WebhookBody() event: ClerkWebhookEvent,
  @WebhookMetadata() metadata: WebhookMetadata,
): Promise<void> {
  // Event is already validated and typed
  // Signature is already verified
  // Error handling is built-in
  await this.handleClerkWebhook(event, metadata);
}
```

## Current Status (Updated 2024-03-21)

### Completed Tasks

1. **Webhook Handling**

   - ✅ Removed custom webhook handling code
   - ✅ Integrated `SignedWebhookGuard` from `@venta/nest/guards`
   - ✅ Updated Clerk and RevenueCat controllers

2. **Event Handling**

   - ✅ Removed custom NATS code
   - ✅ Integrated `EventService` from `@venta/nest/modules`
   - ✅ Standardized event types and validation

3. **Error Handling**

   - ✅ Consolidated error codes into single source (`errorcodes.ts`)
   - ✅ Updated all services to use `AppError` consistently
   - ✅ Added operation context to error metadata
   - ✅ Fixed error code usage in ACLs and controllers

4. **Validation**

   - ✅ Created `@venta/nest/validation` module
   - ✅ Updated `SchemaValidatorPipe` for consistent error handling
   - ✅ Standardized Zod schema usage in ACLs
   - ✅ Added validation documentation

5. **Authentication**

   - ✅ Created standardized auth types (`AuthUser`, `AuthMetadata`)
   - ✅ Created `AuthService` for shared logic
   - ✅ Created `GrpcAuthGuard` and `GrpcAuthInterceptor`
   - ✅ Updated `AuthGuard` and `WsAuthGuard` to use new types
   - ✅ Added auth to marketplace domain gRPC services
   - ✅ Fixed type errors in user and vendor management
   - ⏳ Pending: Location services domain auth
   - ⏳ Pending: Communication domain auth
   - ⏳ Pending: Infrastructure domain auth

6. **ACL Architecture Refactoring (Completed)**
   - ✅ **Converted from NestJS Pipes to Pure Functions**: Replaced `@Injectable()` pipes with static class methods for better type safety and performance
   - ✅ **Consolidated Folder Structure**: Merged `inbound/` and `outbound/` folders into unified bidirectional ACL classes
   - ✅ **Bidirectional Support**: Each ACL class now provides both `toDomain()` and `toGrpc()` methods
   - ✅ **Explicit Controller Transformations**: Replaced `@UsePipes()` decorators with explicit `ACL.toDomain()` calls
   - ✅ **Perfect Type Safety**: Controllers now implement gRPC interfaces correctly without type conflicts
   - ✅ **Updated Documentation**: Comprehensive documentation updates reflecting new patterns and best practices

### Next Steps

1. **Authentication**

   - Fix remaining type errors in marketplace domain
   - Integrate auth in location-services domain
   - Integrate auth in communication domain
   - Integrate auth in infrastructure domain

2. **Logging**

   - Replace raw Logger with `@venta/nest/logging`
   - Add request correlation
   - Add structured logging
   - Add context metadata

3. **Domain Organization**

   - Move misplaced components to contracts
   - Standardize naming conventions
   - Clean up unused code

4. **Type Safety**
   - Audit context mapper usage
   - Audit ACL usage
   - Standardize domain types

### Current Focus

**✅ Completed**: Marketplace domain ACL refactoring:

1. ✅ Converted ACL pipes to pure static functions for better type safety
2. ✅ Consolidated inbound/outbound folders into unified bidirectional ACL classes
3. ✅ Updated controllers to use explicit `ACL.toDomain()` calls instead of `@UsePipes`
4. ✅ Fixed type mismatches and aligned Prisma types with domain models
5. ✅ Updated documentation to reflect new ACL patterns

**Next**: Apply the same ACL refactoring pattern to other domains (location-services, communication, infrastructure)

## Benefits

1. **Reduced Code Duplication**: Using our libraries eliminates the need to rewrite common functionality
2. **Improved Security**: Battle-tested implementations for critical features like webhook signature verification
3. **Better Maintainability**: Standardized patterns and centralized logic make the code easier to maintain
4. **Type Safety**: Stronger type checking and better domain boundaries
5. **Consistency**: Standard approaches to common problems across the codebase
